<?php

namespace App\Http\Controllers\Assistant;

use App\Events\SessionStateUpdated;
use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\ParticipantEnrollment;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PracticumController extends Controller
{
    private const PHASES = [
        'initial_task' => 1,
        'journal' => 2,
        'independent_task' => 3,
        'feedback' => 4,
    ];

    public function index(Request $request): Response
    {
        $weeklyScheduleQuery = WeeklySchedule::query();
        if ($request->user()->user_type === 'admin') {
            $weeklyScheduleIds = $weeklyScheduleQuery->pluck('id');
        } else {
            $assignedIds = (clone $weeklyScheduleQuery)
                ->whereHas('assistants', fn ($query) => $query->whereKey($request->user()->id))
                ->pluck('id');
            $weeklyScheduleIds = $assignedIds->isNotEmpty() ? $assignedIds : $weeklyScheduleQuery->pluck('id');
        }

        $schedules = PracticumSchedule::query()
            ->with(['module', 'practicumSessions', 'class.enrollments.participant', 'weeklySchedule.groups.members'])
            ->whereIn('weekly_schedule_id', $weeklyScheduleIds)
            ->latest()
            ->get();

        $activeSessions = PracticumSession::query()
            ->with(['practicumSchedule.class.enrollments.participant', 'practicumSchedule.weeklySchedule.groups.members'])
            ->whereHas('practicumSchedule', fn ($query) => $query->whereIn('weekly_schedule_id', $weeklyScheduleIds))
            ->active()
            ->get();

        $weeklySchedules = WeeklySchedule::query()
            ->with('groups.members')
            ->whereIn('id', $weeklyScheduleIds)
            ->get();

        $participants = [];

        foreach ($activeSessions as $session) {
            $schedule = $session->practicumSchedule;

            if ($schedule?->class) {
                foreach ($schedule->class->enrollments as $enrollment) {
                    assert($enrollment instanceof ParticipantEnrollment);

                    if ($enrollment->participant) {
                        assert($enrollment->participant instanceof User);
                        if ($enrollment->participant->isAssistant() || $enrollment->participant->user_type === 'admin') {
                            continue;
                        }
                        $participants[] = $this->participantPayload($enrollment->participant, $session);
                    }
                }
            }

            if ($schedule?->weeklySchedule) {
                foreach ($schedule->weeklySchedule->groups as $group) {
                    assert($group instanceof WeeklyScheduleGroup);

                    foreach ($group->members as $member) {
                        assert($member instanceof User);
                        if ($member->isAssistant() || $member->user_type === 'admin') {
                            continue;
                        }
                        $participants[] = $this->participantPayload($member, $session);
                    }
                }
            }
        }

        return Inertia::render('Assistant/Practicum/Index', [
            'modules' => Module::query()->whereIn('status', ['published', 'draft'])->orderBy('order_number')->get(),
            'schedules' => $schedules,
            'weeklySchedules' => $weeklySchedules,
            'activeSessions' => $activeSessions,
            'participants' => collect($participants)->unique('id')->sortBy('name')->values()->all(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'module_id' => ['required', 'exists:modules,id'],
            'class_id' => ['required', 'exists:classes,id'],
            'room' => ['nullable', 'string', 'max:100'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
        ]);
        $this->ensureAssistant($request);
        PracticumSchedule::create($validated);

        return back()->with('success', 'Practicum schedule created successfully.');
    }

    public function update(Request $request, PracticumSchedule $praktikum): RedirectResponse
    {
        $this->ensureAssistant($request);
        $this->ensureCanControlSchedule($request->user(), $praktikum);
        $validated = $request->validate([
            'status' => ['sometimes', 'in:scheduled,ongoing,completed,cancelled'],
            'room' => ['nullable', 'string', 'max:100'],
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after:starts_at'],
        ]);
        $praktikum->update($validated);

        return back()->with('success', 'Practicum schedule updated successfully.');
    }

    public function destroy(Request $request, PracticumSchedule $praktikum): RedirectResponse
    {
        $this->ensureAssistant($request);
        $this->ensureCanControlSchedule($request->user(), $praktikum);
        $praktikum->delete();

        return back()->with('success', 'Practicum schedule deleted successfully.');
    }

    public function startSession(Request $request): RedirectResponse
    {
        $this->ensureAssistant($request);
        $validated = $request->validate([
            'weekly_schedule_id' => ['required', 'exists:weekly_schedules,id'],
            'module_id' => ['required', 'exists:modules,id'],
        ]);
        $weeklySchedule = WeeklySchedule::query()->findOrFail((int) $validated['weekly_schedule_id']);
        abort_unless($this->canControlWeeklySchedule($request->user(), $weeklySchedule), 403);

        $session = DB::transaction(function () use ($request, $validated): PracticumSession {
            $schedule = PracticumSchedule::query()->firstOrCreate(
                [
                    'weekly_schedule_id' => $validated['weekly_schedule_id'],
                    'module_id' => $validated['module_id'],
                ],
                [
                    'starts_at' => now(),
                    'ends_at' => now()->addHours(3),
                ],
            );

            if (in_array($schedule->status, ['completed', 'cancelled'], true)) {
                throw ValidationException::withMessages([
                    'module_id' => 'Praktikum untuk jadwal dan modul ini sudah selesai atau dibatalkan.',
                ]);
            }

            if ($schedule->practicumSessions()->where('state', 'active')->exists()) {
                throw ValidationException::withMessages([
                    'weekly_schedule_id' => 'Jadwal ini sudah memiliki sesi aktif.',
                ]);
            }

            $schedule->update([
                'status' => 'ongoing',
                'started_by' => $schedule->started_by ?? $request->user()->id,
                'actual_started_at' => $schedule->actual_started_at ?? now(),
            ]);

            foreach (self::PHASES as $phase => $orderNumber) {
                $schedule->practicumSessions()->firstOrCreate(
                    ['session_type' => $phase],
                    ['order_number' => $orderNumber, 'state' => $phase === 'initial_task' ? 'scheduled' : 'waiting'],
                );
            }

            $initialSession = $schedule->practicumSessions()->where('session_type', 'initial_task')->sole();
            $this->transition($initialSession, 'active', $request->user(), [
                'opened_at' => now(),
                'opened_by' => $request->user()->id,
            ]);

            $initialSession->load('practicumSchedule');

            return $initialSession;
        });

        SessionStateUpdated::dispatch($session, 'started');

        return back()->with('success', 'Session started successfully.');
    }

    public function updateSessionPhase(Request $request, PracticumSession $session): RedirectResponse
    {
        $this->ensureAssistant($request);
        $this->ensureCanControlSchedule($request->user(), $session->practicumSchedule);
        $validated = $request->validate([
            'phase' => ['required', 'string', 'in:initial_task,journal,independent_task,feedback'],
        ]);

        $targetOrder = self::PHASES[$validated['phase']];

        if (! $session->isActive()) {
            throw ValidationException::withMessages([
                'phase' => 'Hanya sesi aktif yang fasenya dapat dipindahkan.',
            ]);
        }

        if ($targetOrder === $session->order_number) {
            throw ValidationException::withMessages([
                'phase' => 'Sesi sudah berada pada tahap tersebut.',
            ]);
        }

        if ($targetOrder > $session->order_number + 1) {
            throw ValidationException::withMessages([
                'phase' => 'Sesi hanya dapat dipindahkan satu tahap ke depan.',
            ]);
        }

        $targetSession = DB::transaction(function () use ($request, $session, $validated, $targetOrder): PracticumSession {
            $schedule = $session->practicumSchedule;

            $targetSession = $schedule->practicumSessions()
                ->where('session_type', $validated['phase'])
                ->lockForUpdate()
                ->sole();

            if ($targetOrder > $session->order_number) {
                // Moving forward (NEXT)
                if ($targetSession->state !== 'waiting') {
                    throw ValidationException::withMessages([
                        'phase' => 'Tahap tujuan tidak berada dalam state waiting.',
                    ]);
                }

                $this->transition($session, 'closed', $request->user(), [
                    'closed_at' => now(),
                    'closed_by' => $request->user()->id,
                ]);
                $this->transition($targetSession, 'active', $request->user(), [
                    'opened_at' => now(),
                    'opened_by' => $request->user()->id,
                ]);
            } else {
                // Moving backward (PREV / ROLLBACK)
                // Set current session and all subsequent intermediate sessions back to waiting
                $sessionsToReset = $schedule->practicumSessions()
                    ->where('order_number', '>=', $targetOrder)
                    ->where('id', '!=', $targetSession->id)
                    ->lockForUpdate()
                    ->get();

                foreach ($sessionsToReset as $s) {
                    if ($s->state !== 'waiting') {
                        $this->transition($s, 'waiting', $request->user(), [
                            'closed_at' => null,
                            'closed_by' => null,
                            'opened_at' => null,
                            'opened_by' => null,
                        ]);
                    }
                }

                // Re-open target session as active
                $this->transition($targetSession, 'active', $request->user(), [
                    'opened_at' => now(),
                    'opened_by' => $request->user()->id,
                    'closed_at' => null,
                    'closed_by' => null,
                ]);
            }

            $targetSession->load('practicumSchedule');

            return $targetSession;
        });

        SessionStateUpdated::dispatch($targetSession, 'phase_changed', $session->id);

        return back()->with('success', 'Session phase updated.');
    }

    public function endSession(Request $request, PracticumSession $session): RedirectResponse
    {
        $this->ensureAssistant($request);
        $this->ensureCanControlSchedule($request->user(), $session->practicumSchedule);

        if (! $session->isActive()) {
            throw ValidationException::withMessages([
                'session' => 'Hanya sesi aktif yang dapat diakhiri.',
            ]);
        }

        $completedSession = DB::transaction(function () use ($request, $session): PracticumSession {
            $this->transition($session, 'closed', $request->user(), [
                'closed_at' => now(),
                'closed_by' => $request->user()->id,
            ]);
            $this->transition($session, 'completed', $request->user(), [
                'completed_at' => now(),
                'completed_by' => $request->user()->id,
            ]);

            $session->practicumSchedule->practicumSessions()
                ->whereIn('state', ['scheduled', 'waiting'])
                ->get()
                ->each(fn (PracticumSession $pendingSession) => $this->transition($pendingSession, 'closed', $request->user(), [
                    'closed_at' => now(),
                    'closed_by' => $request->user()->id,
                ]));

            $session->practicumSchedule->update([
                'status' => 'completed',
                'completed_by' => $request->user()->id,
                'actual_completed_at' => now(),
            ]);

            $session->load('practicumSchedule');

            return $session;
        });

        SessionStateUpdated::dispatch($completedSession, 'ended');

        return back()->with('success', 'Session ended successfully.');
    }

    /** @return array{id: int, name: string, avatar: string, status: string, session_id: int} */
    private function participantPayload(User $participant, PracticumSession $session): array
    {
        return [
            'id' => $participant->id,
            'name' => $participant->name,
            'avatar' => mb_strtoupper(mb_substr($participant->name, 0, 1)),
            'status' => 'offline',
            'session_id' => $session->id,
        ];
    }

    /** @param array<string, mixed> $attributes */
    private function transition(PracticumSession $session, string $toState, User $actor, array $attributes = []): void
    {
        $fromState = $session->state;
        $session->update([...$attributes, 'state' => $toState]);

        DB::table('session_state_histories')->insert([
            'practicum_session_id' => $session->id,
            'from_state' => $fromState,
            'to_state' => $toState,
            'changed_by' => $actor->id,
            'changed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function ensureAssistant(Request $request): void
    {
        abort_unless($request->user()->isAssistant(), 403);
    }

    private function ensureCanControlSchedule(User $user, PracticumSchedule $schedule): void
    {
        abort_unless(
            $schedule->weeklySchedule !== null && $this->canControlWeeklySchedule($user, $schedule->weeklySchedule),
            403,
        );
    }

    private function canControlWeeklySchedule(User $user, WeeklySchedule $weeklySchedule): bool
    {
        return $weeklySchedule->assistants()->whereKey($user->id)->exists();
    }
}
