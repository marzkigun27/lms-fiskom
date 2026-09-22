<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Grade;
use App\Models\Module;
use App\Models\ParticipantEnrollment;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\WeeklySchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the participant dashboard.
     */
    public function index(Request $request): Response
    {
        $participant = $request->user();
        $participantId = $participant->id;

        // 1. Enrollment & Class/Group details
        $enrollment = ParticipantEnrollment::query()
            ->with(['class', 'group', 'semester'])
            ->where('participant_id', $participantId)
            ->where('status', 'active')
            ->latest('id')
            ->first();

        $weeklyGroup = DB::table('weekly_schedule_group_member')
            ->join('weekly_schedule_groups', 'weekly_schedule_group_member.weekly_schedule_group_id', '=', 'weekly_schedule_groups.id')
            ->join('weekly_schedules', 'weekly_schedule_groups.weekly_schedule_id', '=', 'weekly_schedules.id')
            ->where('weekly_schedule_group_member.participant_id', $participantId)
            ->select(
                'weekly_schedules.id as weekly_schedule_id',
                'weekly_schedules.day',
                'weekly_schedules.shift',
                'weekly_schedule_groups.number as group_number',
                'weekly_schedule_groups.code as group_code'
            )
            ->first();

        $activeSemester = Semester::query()->where('is_active', true)->first();
        $semesterId = $enrollment?->semester_id ?? $activeSemester?->id;

        $weeklyScheduleIds = WeeklySchedule::query()
            ->whereHas('groups.members', fn ($query) => $query->whereKey($participantId))
            ->pluck('id');

        $classIds = $enrollment?->class_id ? collect([$enrollment->class_id]) : collect();

        // 2. Active Practicum Session
        $activeSessionQuery = PracticumSession::query()
            ->with(['practicumSchedule.module'])
            ->where('state', 'active');

        if ($weeklyScheduleIds->isNotEmpty() || $classIds->isNotEmpty()) {
            $activeSessionQuery->whereHas('practicumSchedule', function ($query) use ($weeklyScheduleIds, $classIds) {
                $query->where(function ($sub) use ($weeklyScheduleIds, $classIds) {
                    if ($weeklyScheduleIds->isNotEmpty()) {
                        $sub->whereIn('weekly_schedule_id', $weeklyScheduleIds);
                    }
                    if ($classIds->isNotEmpty()) {
                        $sub->orWhereIn('class_id', $classIds);
                    }
                });
            });
        }

        $activeSessionModel = $activeSessionQuery->latest()->first();
        $currentSession = null;
        if ($activeSessionModel) {
            $currentSession = [
                'id' => $activeSessionModel->id,
                'session_type' => $activeSessionModel->session_type,
                'module_id' => $activeSessionModel->practicumSchedule?->module_id,
                'module_code' => $activeSessionModel->practicumSchedule?->module?->code,
                'module_title' => $activeSessionModel->practicumSchedule?->module?->title,
                'room' => $activeSessionModel->practicumSchedule?->room ?? 'Lab',
                'opened_at' => $activeSessionModel->opened_at?->toIso8601String(),
            ];
        }

        // 3. Modules & Performance
        $modulesQuery = Module::query()
            ->whereIn('status', ['published', 'draft'])
            ->orderBy('order_number');

        if ($semesterId) {
            $semesterModules = (clone $modulesQuery)->where('semester_id', $semesterId)->get();
            $modules = $semesterModules->isNotEmpty() ? $semesterModules : $modulesQuery->get();
        } else {
            $modules = $modulesQuery->get();
        }

        // Completed schedule modules
        $completedScheduleQuery = PracticumSchedule::query()->where('status', 'completed');
        if ($weeklyScheduleIds->isNotEmpty() || $classIds->isNotEmpty()) {
            $completedScheduleQuery->where(function ($query) use ($weeklyScheduleIds, $classIds) {
                if ($weeklyScheduleIds->isNotEmpty()) {
                    $query->whereIn('weekly_schedule_id', $weeklyScheduleIds);
                }
                if ($classIds->isNotEmpty()) {
                    $query->orWhereIn('class_id', $classIds);
                }
            });
        }
        $completedModuleIds = $completedScheduleQuery->pluck('module_id')->unique()->all();

        // Published grades for this participant
        $grades = Grade::query()
            ->where('participant_id', $participantId)
            ->where('status', 'published')
            ->get()
            ->groupBy('module_id');

        $formattedModules = $modules->map(function (Module $module) use ($completedModuleIds, $grades, $currentSession): array {
            $isCompleted = in_array($module->id, $completedModuleIds, true);
            $moduleGrades = $grades->get($module->id);
            $hasGrades = $moduleGrades && $moduleGrades->isNotEmpty();
            $avgScore = $hasGrades ? round($moduleGrades->avg('score'), 1) : null;

            $status = 'locked';
            if ($isCompleted || $hasGrades) {
                $status = 'completed';
            } elseif ($currentSession && $currentSession['module_id'] === $module->id) {
                $status = 'in_progress';
            } elseif ($module->order_number === 1 || empty($completedModuleIds)) {
                $status = 'in_progress';
            }

            return [
                'id' => $module->id,
                'code' => $module->code,
                'title' => $module->title,
                'description' => $module->description,
                'order_number' => $module->order_number,
                'status' => $status,
                'score' => $avgScore,
                'grade_letter' => $this->calculateGradeLetter($avgScore),
                'active_session_id' => ($currentSession && $currentSession['module_id'] === $module->id) ? $currentSession['id'] : null,
            ];
        })->values()->all();

        $totalModules = count($formattedModules);
        $completedModulesCount = count(array_filter($formattedModules, fn ($m) => $m['status'] === 'completed'));
        $completionPercentage = $totalModules > 0 ? (int) round(($completedModulesCount / $totalModules) * 100) : 0;

        $allPublishedGrades = Grade::query()
            ->where('participant_id', $participantId)
            ->where('status', 'published')
            ->pluck('score');
        $overallAverageScore = $allPublishedGrades->isNotEmpty() ? round($allPublishedGrades->avg(), 1) : null;

        // 4. Upcoming Practicum Schedules
        $upcomingSchedulesQuery = PracticumSchedule::query()
            ->with(['module'])
            ->where('status', '!=', 'completed');

        if ($weeklyScheduleIds->isNotEmpty() || $classIds->isNotEmpty()) {
            $upcomingSchedulesQuery->where(function ($query) use ($weeklyScheduleIds, $classIds) {
                if ($weeklyScheduleIds->isNotEmpty()) {
                    $query->whereIn('weekly_schedule_id', $weeklyScheduleIds);
                }
                if ($classIds->isNotEmpty()) {
                    $query->orWhereIn('class_id', $classIds);
                }
            });
        }

        $upcomingSchedules = $upcomingSchedulesQuery
            ->orderBy('starts_at')
            ->take(4)
            ->get()
            ->map(function (PracticumSchedule $schedule): array {
                $startsAt = $schedule->starts_at ? Carbon::parse($schedule->starts_at) : null;
                $endsAt = $schedule->ends_at ? Carbon::parse($schedule->ends_at) : null;

                return [
                    'id' => $schedule->id,
                    'module_title' => $schedule->module?->title ?? 'Sesi Praktikum',
                    'module_code' => $schedule->module?->code ?? '-',
                    'room' => $schedule->room ?? 'Lab Utama',
                    'date_month' => $startsAt ? $startsAt->format('M') : 'N/A',
                    'date_day' => $startsAt ? $startsAt->format('d') : '--',
                    'time_range' => ($startsAt && $endsAt) ? ($startsAt->format('H:i').' - '.$endsAt->format('H:i')) : 'TBD',
                    'status' => $schedule->status,
                ];
            })->values()->all();

        // 5. Upcoming Tugas Pendahuluan (TP) Deadlines
        $prelabPeriodsQuery = PreliminaryTaskPeriod::query()
            ->with('module')
            ->where('state', 'active');

        if ($classIds->isNotEmpty()) {
            $prelabPeriodsQuery->where(function ($q) use ($classIds) {
                $q->whereNull('class_id')->orWhereIn('class_id', $classIds);
            });
        }

        $submittedPeriodIds = Submission::query()
            ->where('participant_id', $participantId)
            ->whereNotNull('preliminary_task_period_id')
            ->pluck('preliminary_task_period_id')
            ->all();

        $upcomingPrelabs = $prelabPeriodsQuery
            ->orderBy('deadline_at')
            ->take(3)
            ->get()
            ->map(function (PreliminaryTaskPeriod $period) use ($submittedPeriodIds): array {
                $deadline = $period->deadline_at ? Carbon::parse($period->deadline_at) : null;
                $isSubmitted = in_array($period->id, $submittedPeriodIds, true);

                return [
                    'id' => $period->id,
                    'module_id' => $period->module_id,
                    'module_code' => $period->module?->code ?? '-',
                    'module_title' => $period->module?->title ?? 'Tugas Pendahuluan',
                    'deadline_at' => $deadline?->toIso8601String(),
                    'deadline_formatted' => $deadline ? $deadline->translatedFormat('d M Y, H:i') : '-',
                    'is_submitted' => $isSubmitted,
                    'is_past_due' => $deadline ? $deadline->isPast() : false,
                ];
            })->values()->all();

        // 6. Announcements
        $announcements = Announcement::query()
            ->active()
            ->forRole('participant')
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

        return Inertia::render('Participant/Dashboard', [
            'profile' => [
                'name' => $participant->name,
                'identity_number' => $participant->identity_number,
                'class_name' => $enrollment?->class?->name ?? 'Kelas Belum Ditentukan',
                'group_name' => $enrollment?->group?->name ?? ($weeklyGroup ? ($weeklyGroup->group_code ? "Kelompok {$weeklyGroup->group_number} ({$weeklyGroup->group_code})" : 'Kelompok '.$weeklyGroup->group_number) : 'Reguler'),
                'shift' => $weeklyGroup ? ($weeklyGroup->day.', '.$weeklyGroup->shift) : null,
                'semester_name' => $enrollment?->semester?->name ?? $activeSemester?->name ?? 'Semester Aktif',
            ],
            'currentSession' => $currentSession,
            'performance' => [
                'total_modules' => $totalModules,
                'completed_modules' => $completedModulesCount,
                'completion_percentage' => $completionPercentage,
                'average_score' => $overallAverageScore,
            ],
            'modules' => $formattedModules,
            'upcomingSchedules' => $upcomingSchedules,
            'upcomingPrelabs' => $upcomingPrelabs,
            'announcements' => $announcements,
        ]);
    }

    private function calculateGradeLetter(?float $score): ?string
    {
        if ($score === null) {
            return null;
        }

        return match (true) {
            $score >= 85 => 'A',
            $score >= 80 => 'A-',
            $score >= 75 => 'B+',
            $score >= 70 => 'B',
            $score >= 65 => 'B-',
            $score >= 60 => 'C+',
            $score >= 55 => 'C',
            $score >= 45 => 'D',
            default => 'E',
        };
    }
}
