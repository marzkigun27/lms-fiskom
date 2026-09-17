<?php

namespace App\Services\GlobalControl;

use App\Models\Answer;
use App\Models\AuditLog;
use App\Models\Module;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Semester;
use App\Models\Submission;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class PreliminaryTaskService
{
    /**
     * Validate that the given start and end range does not overlap with any other module's period.
     * Rule: Maximum 1 active/scheduled prelab at any given time.
     *
     * @throws ValidationException
     */
    public function validateScheduleNoOverlap(
        int $moduleId,
        Carbon $opensAt,
        Carbon $deadlineAt,
        ?int $ignorePeriodId = null
    ): void {
        if ($deadlineAt->lte($opensAt)) {
            throw ValidationException::withMessages([
                'schedule' => 'Waktu berakhir harus lebih besar dari waktu mulai.',
            ]);
        }

        $query = PreliminaryTaskPeriod::query()
            ->where('state', '!=', 'closed')
            ->where(function ($q) use ($opensAt, $deadlineAt) {
                $q->where('opens_at', '<', $deadlineAt)
                    ->where('deadline_at', '>', $opensAt);
            });

        if ($ignorePeriodId) {
            $query->where('id', '!=', $ignorePeriodId);
        } else {
            $query->where('module_id', '!=', $moduleId);
        }

        $conflict = $query->with('module')->first();

        if ($conflict) {
            $conflictTitle = $conflict->module?->title ?? "Modul {$conflict->module_id}";
            $startFormatted = $conflict->opens_at->translatedFormat('l, d F Y H:i');
            $endFormatted = $conflict->deadline_at->translatedFormat('l, d F Y H:i');

            throw ValidationException::withMessages([
                'schedule' => "Jadwal bentrok dengan {$conflictTitle} ({$startFormatted} → {$endFormatted}). Maksimal hanya terdapat 1 modul Tugas Pendahuluan yang aktif dalam satu waktu.",
            ]);
        }
    }

    /**
     * Calculate default even-week schedule based on semester academic week configuration.
     * Schedule: Wednesday 18:00 -> Saturday 18:00 on even weeks (Week 2, 4, 6, 8...).
     *
     * @return array{academic_week: int, opens_at: Carbon, deadline_at: Carbon, semester_name: string}
     */
    public function getDefaultEvenWeekTemplate(int $moduleOrderNumber = 1): array
    {
        $semester = Semester::where('is_active', true)->first() ?? Semester::latest()->first();

        $semesterStart = $semester && $semester->starts_at
            ? Carbon::parse($semester->starts_at)
            : Carbon::now()->startOfMonth();

        // Monday of the semester's starting week
        $academicStartMonday = $semesterStart->copy()->startOfWeek(Carbon::MONDAY);

        // Even academic week for the module: order 1 -> Week 2, order 2 -> Week 4, etc.
        $targetWeekNumber = max(2, $moduleOrderNumber * 2);

        // Monday of target academic week
        $targetWeekMonday = $academicStartMonday->copy()->addWeeks($targetWeekNumber - 1);

        // Wednesday 18:00
        $opensAt = $targetWeekMonday->copy()->addDays(2)->setTime(18, 0, 0);

        // Saturday 18:00
        $deadlineAt = $opensAt->copy()->addDays(3)->setTime(18, 0, 0);

        return [
            'academic_week' => $targetWeekNumber,
            'opens_at' => $opensAt,
            'deadline_at' => $deadlineAt,
            'semester_name' => $semester?->name ?? 'Semester Aktif',
        ];
    }

    /**
     * Save or update a preliminary task schedule for a module.
     */
    public function saveSchedule(
        int $moduleId,
        Carbon $opensAt,
        Carbon $deadlineAt,
        int $userId,
        ?string $state = null
    ): PreliminaryTaskPeriod {
        $existing = PreliminaryTaskPeriod::where('module_id', $moduleId)->first();

        $this->validateScheduleNoOverlap($moduleId, $opensAt, $deadlineAt, $existing?->id);

        $now = Carbon::now();
        $calculatedState = $state ?? ($now->gt($deadlineAt) ? 'closed' : ($now->gte($opensAt) ? 'active' : 'scheduled'));

        $oldValues = $existing ? [
            'opens_at' => $existing->opens_at->toDateTimeString(),
            'deadline_at' => $existing->deadline_at->toDateTimeString(),
            'state' => $existing->state,
        ] : null;

        $period = PreliminaryTaskPeriod::updateOrCreate(
            ['module_id' => $moduleId],
            [
                'opens_at' => $opensAt,
                'deadline_at' => $deadlineAt,
                'state' => $calculatedState,
                'created_by' => $existing?->created_by ?? $userId,
                'updated_by' => $userId,
            ]
        );

        $newValues = [
            'opens_at' => $period->opens_at->toDateTimeString(),
            'deadline_at' => $period->deadline_at->toDateTimeString(),
            'state' => $period->state,
        ];

        AuditLog::record(
            $existing ? 'prelab.schedule_updated' : 'prelab.schedule_created',
            $period,
            $oldValues,
            $newValues,
            $userId
        );

        return $period;
    }

    /**
     * Toggle period status (active/scheduled vs closed).
     */
    public function togglePeriod(PreliminaryTaskPeriod $period, int $userId): PreliminaryTaskPeriod
    {
        $oldState = $period->state;
        $newState = $oldState === 'closed' ? 'scheduled' : 'closed';

        if ($newState !== 'closed') {
            $this->validateScheduleNoOverlap(
                $period->module_id,
                $period->opens_at,
                $period->deadline_at,
                $period->id
            );
        }

        $period->update([
            'state' => $newState,
            'updated_by' => $userId,
        ]);

        AuditLog::record(
            'prelab.state_toggled',
            $period,
            ['state' => $oldState],
            ['state' => $newState],
            $userId
        );

        return $period;
    }

    /**
     * Get all modules formatted for the control panel or participant page.
     */
    public function getModulesWithPrelabData(?int $participantId = null): array
    {
        $modules = Module::orderBy('order_number')->get();
        $now = Carbon::now();

        return $modules->map(function (Module $module) use ($now, $participantId) {
            $period = PreliminaryTaskPeriod::where('module_id', $module->id)->first();

            $status = 'not_started';
            $statusLabel = 'Belum Mulai';
            $remainingTime = null;
            $remainingSeconds = 0;

            if ($period) {
                if ($period->state === 'closed' || $now->gt($period->deadline_at)) {
                    $status = 'expired';
                    $statusLabel = 'Sudah Lewat';
                } elseif ($now->lt($period->opens_at)) {
                    $status = 'not_started';
                    $statusLabel = 'Belum Mulai';
                } else {
                    $status = 'ongoing';
                    $statusLabel = 'Sedang Berjalan';
                    $diff = $now->diff($period->deadline_at);
                    $remainingSeconds = (int) max(0, round($now->diffInSeconds($period->deadline_at, false)));

                    $parts = [];
                    if ($diff->d > 0) {
                        $parts[] = "{$diff->d} hari";
                    }
                    if ($diff->h > 0) {
                        $parts[] = "{$diff->h} jam";
                    }
                    if ($diff->i > 0 && $diff->d === 0) {
                        $parts[] = "{$diff->i} menit";
                    }
                    $remainingTime = ! empty($parts) ? implode(' ', $parts) : 'Kurang dari 1 menit';
                }
            }

            // Participant submission state if requested
            $participantWorkState = 'unstarted';
            $participantWorkLabel = 'Belum Dikerjakan';

            if ($participantId && $period) {
                $submission = Submission::where('participant_id', $participantId)
                    ->where('preliminary_task_period_id', $period->id)
                    ->first();

                if ($submission && in_array($submission->status, ['submitted', 'graded'])) {
                    $participantWorkState = 'submitted';
                    $participantWorkLabel = 'Sudah Dikumpulkan';
                } else {
                    $hasSavedAnswers = Answer::where('participant_id', $participantId)
                        ->where('preliminary_task_period_id', $period->id)
                        ->whereIn('status', ['saved', 'in_progress'])
                        ->exists();

                    if ($hasSavedAnswers) {
                        $participantWorkState = 'draft';
                        $participantWorkLabel = 'Draft Tersimpan';
                    }
                }
            }

            return [
                'id' => $module->id,
                'order_number' => $module->order_number,
                'code' => $module->code,
                'title' => $module->title,
                'description' => $module->description,
                'period' => $period ? [
                    'id' => $period->id,
                    'opens_at' => $period->opens_at->toIso8601String(),
                    'deadline_at' => $period->deadline_at->toIso8601String(),
                    'opens_at_formatted' => $period->opens_at->translatedFormat('d M Y H:i'),
                    'deadline_at_formatted' => $period->deadline_at->translatedFormat('d M Y H:i'),
                    'state' => $period->state,
                ] : null,
                'status' => $status,
                'status_label' => $statusLabel,
                'remaining_time' => $remainingTime,
                'remaining_seconds' => $remainingSeconds,
                'participant_work_state' => $participantWorkState,
                'participant_work_label' => $participantWorkLabel,
            ];
        })->toArray();
    }
}
