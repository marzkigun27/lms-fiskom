<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assistant\WeeklyScheduleRequest;
use App\Models\Semester;
use App\Models\User;
use App\Models\WeeklySchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Response;

class WeeklyScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate(['semester_id' => ['nullable', 'integer', 'exists:semesters,id']]);
        $semesters = Semester::orderByDesc('is_active')->orderByDesc('starts_at')->orderByDesc('id')->get(['id', 'name', 'is_active']);
        $semesterId = isset($validated['semester_id']) ? (int) $validated['semester_id'] : $semesters->first()?->id;
        $assistant = fn ($user) => ['id' => $user->id, 'name' => $user->name];
        $participant = fn ($user) => ['id' => $user->id, 'name' => $user->name, 'nim' => $user->identity_number];
        $schedules = WeeklySchedule::where('semester_id', $semesterId)->with(['assistants:id,name', 'groups.members:id,name,identity_number'])->get()
            ->sortBy(fn ($schedule) => array_search($schedule->day, WeeklyScheduleRequest::DAYS) * 4 + array_search($schedule->shift, WeeklyScheduleRequest::SHIFTS))
            ->values()->map(fn ($schedule) => [
                'id' => $schedule->id, 'semester_id' => $schedule->semester_id, 'day' => $schedule->day, 'shift' => $schedule->shift,
                'assistants' => $schedule->assistants->map($assistant),
                'groups' => $schedule->groups->map(fn ($group) => ['id' => $group->id, 'number' => $group->number, 'members' => $group->members->map($participant)]),
            ]);

        return inertia('Assistant/Schedule/Index', [
            'schedules' => $schedules,
            'assistants' => User::where('user_type', 'assistant')->where('status', 'active')->orderBy('name')->get(['id', 'name'])->map($assistant),
            'participants' => User::where('user_type', 'participant')->where('status', 'active')->orderBy('name')->get(['id', 'name', 'identity_number'])->map($participant),
            'semesters' => $semesters,
            'selectedSemesterId' => $semesterId,
            'days' => WeeklyScheduleRequest::DAYS,
            'shifts' => WeeklyScheduleRequest::SHIFTS,
        ]);
    }

    public function store(WeeklyScheduleRequest $request): RedirectResponse
    {
        $this->save($request->validated());

        return to_route('assistant.schedule.index', ['semester_id' => $request->integer('semester_id')])
            ->with('success', 'Jadwal mingguan berhasil ditambahkan.');
    }

    public function update(WeeklyScheduleRequest $request, WeeklySchedule $schedule): RedirectResponse
    {
        $this->save($request->validated(), $schedule);

        return to_route('assistant.schedule.index', ['semester_id' => $request->integer('semester_id')])
            ->with('success', 'Jadwal mingguan berhasil diperbarui.');
    }

    public function destroy(WeeklySchedule $schedule): RedirectResponse
    {
        DB::transaction(function () use ($schedule) {
            Semester::whereKey($schedule->semester_id)->lockForUpdate()->firstOrFail();
            WeeklySchedule::whereKey($schedule->id)->lockForUpdate()->firstOrFail()->delete();
        }, 3);

        return to_route('assistant.schedule.index', ['semester_id' => $schedule->semester_id])
            ->with('success', 'Jadwal mingguan berhasil dihapus.');
    }

    private function save(array $data, ?WeeklySchedule $schedule = null): void
    {
        DB::transaction(function () use ($data, $schedule) {
            // Every weekly writer locks the semester before checking conflicts.
            // Lock both semesters in ID order when moving a schedule.
            Semester::whereIn('id', array_filter([$data['semester_id'], $schedule?->semester_id]))->orderBy('id')->lockForUpdate()->get();
            if ($schedule) {
                $schedule = WeeklySchedule::whereKey($schedule->id)->lockForUpdate()->firstOrFail();
            }
            $others = WeeklySchedule::where('semester_id', $data['semester_id'])->when($schedule, fn ($query) => $query->where('id', '!=', $schedule->id));
            if ((clone $others)->where('day', $data['day'])->where('shift', $data['shift'])->exists()) {
                throw ValidationException::withMessages(['shift' => 'Slot sudah digunakan pada semester ini.']);
            }
            $participantIds = collect($data['groups'])->pluck('participant_ids')->flatten()->all();
            if ((clone $others)->whereHas('groups.members', fn ($query) => $query->whereIn('users.id', $participantIds))->exists()) {
                throw ValidationException::withMessages(['groups' => 'Praktikan sudah memiliki jadwal pada semester ini.']);
            }
            $schedule ??= new WeeklySchedule;
            $schedule->fill(collect($data)->only(['semester_id', 'day', 'shift'])->all())->save();
            $schedule->assistants()->sync($data['assistant_ids']);
            $schedule->groups()->delete();
            foreach ($data['groups'] as $group) {
                $schedule->groups()->create(['number' => $group['number']])->members()->sync($group['participant_ids']);
            }
        }, 3);
    }
}
