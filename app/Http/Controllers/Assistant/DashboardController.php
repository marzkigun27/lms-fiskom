<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\PracticumSession;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\WeeklySchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the assistant dashboard.
     */
    public function index(Request $request): Response
    {
        $assistant = $request->user();

        // 1. Active Semester
        $activeSemester = Semester::query()->where('is_active', true)->first();
        $semesterId = $activeSemester?->id;

        // 2. Guided Participants
        $guidedParticipantIds = $assistant->getGuidedParticipantIdsForModule();
        $totalGuidedParticipants = count($guidedParticipantIds);

        // 3. Weekly Schedules assigned to this assistant
        $weeklyScheduleQuery = WeeklySchedule::query()
            ->with(['groups.members'])
            ->whereHas('assistants', fn ($q) => $q->whereKey($assistant->id));

        if ($semesterId) {
            $weeklyScheduleQuery->where('semester_id', $semesterId);
        }

        $weeklySchedules = $weeklyScheduleQuery->get();
        $weeklyScheduleIds = $weeklySchedules->pluck('id');

        // 4. Active Practicum Session
        $activeSessionQuery = PracticumSession::query()
            ->with(['practicumSchedule.module', 'practicumSchedule.weeklySchedule'])
            ->where('state', 'active');

        if ($weeklyScheduleIds->isNotEmpty()) {
            $activeSessionQuery->whereHas('practicumSchedule', function ($query) use ($weeklyScheduleIds, $assistant) {
                $query->whereIn('weekly_schedule_id', $weeklyScheduleIds)
                    ->orWhere('started_by', $assistant->id);
            });
        } else {
            $activeSessionQuery->whereHas('practicumSchedule', function ($query) use ($assistant) {
                $query->where('started_by', $assistant->id);
            });
        }

        $activeSessionModel = $activeSessionQuery->latest()->first();
        $activeSession = null;
        if ($activeSessionModel) {
            $activeSession = [
                'id' => $activeSessionModel->id,
                'session_type' => $activeSessionModel->session_type,
                'module_id' => $activeSessionModel->practicumSchedule?->module_id,
                'module_code' => $activeSessionModel->practicumSchedule?->module?->code ?? '-',
                'module_title' => $activeSessionModel->practicumSchedule?->module?->title ?? 'Sesi Praktikum',
                'room' => $activeSessionModel->practicumSchedule?->room ?? 'Lab Komputasi',
                'day' => $activeSessionModel->practicumSchedule?->weeklySchedule?->day,
                'shift' => $activeSessionModel->practicumSchedule?->weeklySchedule?->shift,
                'opened_at' => $activeSessionModel->opened_at?->toIso8601String(),
            ];
        }

        // 5. Pending Submissions to Grade
        $pendingSubmissionsQuery = Submission::query()
            ->with([
                'participant:id,name,identity_number',
                'practicumSession.practicumSchedule.module',
                'preliminaryTaskPeriod.module',
            ])
            ->where('status', 'submitted');

        if (! empty($guidedParticipantIds)) {
            $pendingSubmissionsQuery->whereIn('participant_id', $guidedParticipantIds);
        }

        $pendingGradingCount = (clone $pendingSubmissionsQuery)->count();

        $pendingGrading = $pendingSubmissionsQuery
            ->latest('submitted_at')
            ->take(6)
            ->get()
            ->map(function (Submission $submission): array {
                $module = $submission->practicumSession?->practicumSchedule?->module
                    ?? $submission->preliminaryTaskPeriod?->module;

                $sessionType = $submission->preliminaryTaskPeriod ? 'Tugas Pendahuluan (TP)' : match ($submission->practicumSession?->session_type) {
                    'initial_task' => 'Tugas Awal (TA)',
                    'journal' => 'Jurnal',
                    'independent_task' => 'Tugas Mandiri',
                    'feedback' => 'Feedback',
                    default => 'Praktikum',
                };

                $submittedAt = $submission->submitted_at ? Carbon::parse($submission->submitted_at) : $submission->created_at;

                return [
                    'id' => $submission->id,
                    'participant_id' => $submission->participant_id,
                    'participant_name' => $submission->participant?->name ?? 'Praktikan',
                    'participant_nim' => $submission->participant?->identity_number ?? '-',
                    'module_id' => $module?->id,
                    'module_code' => $module?->code ?? 'MOD',
                    'module_title' => $module?->title ?? 'Praktikum',
                    'session_type' => $sessionType,
                    'submitted_at' => $submittedAt->diffForHumans(),
                    'type' => $submission->preliminaryTaskPeriod ? 'warning' : 'info',
                ];
            })->values()->all();

        // 6. Formatted Schedules
        $currentDayIndonesian = strtolower(Carbon::now()->locale('id')->isoFormat('dddd'));

        $schedules = $weeklySchedules->map(function (WeeklySchedule $ws) use ($currentDayIndonesian): array {
            $isToday = strtolower($ws->day) === $currentDayIndonesian;
            $totalParticipants = $ws->groups->sum(fn ($g) => $g->members->count());

            // Extract time and period if present in shift, e.g. "Shift 1 (06:30 - 09:30)"
            $shiftLabel = $ws->shift;
            $timeRange = 'Jadwal Reguler';
            if (preg_match('/\((.*?)\)/', $ws->shift, $matches)) {
                $timeRange = $matches[1];
            }

            return [
                'id' => $ws->id,
                'day' => $ws->day,
                'shift' => $shiftLabel,
                'time_range' => $timeRange,
                'groups_count' => $ws->groups->count(),
                'total_participants' => $totalParticipants,
                'is_today' => $isToday,
                'location' => 'Lab Komputer',
            ];
        })->values()->all();

        // 7. Announcements
        $announcements = Announcement::query()
            ->active()
            ->forRole('assistant')
            ->latest('published_at')
            ->latest('created_at')
            ->take(3)
            ->get()
            ->map(fn (Announcement $a): array => [
                'id' => $a->id,
                'title' => $a->title,
                'content' => $a->content,
                'priority' => $a->priority,
                'created_at' => $a->published_at?->diffForHumans() ?? $a->created_at->diffForHumans(),
            ])->values()->all();

        return Inertia::render('Assistant/Dashboard', [
            'assistant' => [
                'name' => $assistant->name,
                'identity_number' => $assistant->identity_number,
                'email' => $assistant->email,
            ],
            'semester' => [
                'name' => $activeSemester?->name ?? 'Semester Aktif',
                'academic_year' => $activeSemester?->academic_year ?? '-',
            ],
            'stats' => [
                'guided_participants' => $totalGuidedParticipants,
                'pending_grading' => $pendingGradingCount,
                'total_schedules' => count($schedules),
                'has_active_session' => $activeSession !== null,
            ],
            'activeSession' => $activeSession,
            'pendingGrading' => $pendingGrading,
            'schedules' => $schedules,
            'announcements' => $announcements,
        ]);
    }
}
