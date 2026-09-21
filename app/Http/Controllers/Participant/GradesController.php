<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\AssistantModuleParticipant;
use App\Models\Feedback;
use App\Models\Grade;
use App\Models\Module;
use App\Models\PracticumSchedule;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Question;
use App\Models\Submission;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GradesController extends Controller
{
    private const SESSION_MAPPING = [
        'preliminary' => 'Tugas Pendahuluan (TP)',
        'initial_task' => 'Tugas Awal (TA)',
        'journal' => 'Jurnal (D1 - D4)',
        'independent_task' => 'Tugas Akhir (I1 - I2)',
    ];

    public function index(Request $request): Response
    {
        $participant = $request->user();
        $participantId = $participant->id;

        // 1. Fetch published modules (or all if none published)
        $modules = Module::query()
            ->whereIn('status', ['published', 'draft'])
            ->orderBy('order_number')
            ->get();

        $moduleIds = $modules->pluck('id');

        // 2. Fetch participant's grades strictly for this participant
        $grades = Grade::query()
            ->with('gradedBy')
            ->where('participant_id', $participantId)
            ->get()
            ->keyBy('module_id');

        // 3. Fetch explicit assistant assignments for this participant
        $guidanceAssignments = AssistantModuleParticipant::query()
            ->with('assistant')
            ->where('participant_id', $participantId)
            ->get()
            ->keyBy('module_id');

        // 4. Fetch target assistants from feedback submitted by participant
        $feedbacks = Feedback::query()
            ->with('targetAssistant')
            ->where('sender_id', $participantId)
            ->get()
            ->keyBy('module_id');

        // 5. Fetch weekly schedules and classes for this participant
        $weeklyScheduleIds = DB::table('weekly_schedule_group_member')
            ->join('weekly_schedule_groups', 'weekly_schedule_group_member.weekly_schedule_group_id', '=', 'weekly_schedule_groups.id')
            ->where('weekly_schedule_group_member.participant_id', $participantId)
            ->pluck('weekly_schedule_groups.weekly_schedule_id');

        $classIds = DB::table('participant_enrollments')
            ->where('participant_id', $participantId)
            ->where('status', 'active')
            ->pluck('class_id');

        $defaultScheduleAssistant = null;
        if ($weeklyScheduleIds->isNotEmpty()) {
            $defaultScheduleAssistant = DB::table('weekly_schedule_assistant')
                ->join('users', 'weekly_schedule_assistant.assistant_id', '=', 'users.id')
                ->whereIn('weekly_schedule_assistant.weekly_schedule_id', $weeklyScheduleIds)
                ->select('users.name')
                ->first();
        }

        // 6. Pre-load participant's answers and submissions
        $allAnswers = Answer::query()
            ->where('participant_id', $participantId)
            ->get()
            ->keyBy('question_id');

        $allSubmissions = Submission::query()
            ->where('participant_id', $participantId)
            ->with(['practicumSession.practicumSchedule', 'submissionAnswers', 'preliminaryTaskPeriod'])
            ->get();

        $submissionsByModule = $allSubmissions->groupBy(fn (Submission $s): ?int => $s->practicumSession?->practicumSchedule?->module_id ?? $s->preliminaryTaskPeriod?->module_id
        );

        $allQuestions = Question::query()
            ->whereIn('module_id', $moduleIds)
            ->orderBy('order_number')
            ->get()
            ->groupBy('module_id');

        // Pre-load schedules with sessions for participant
        $schedulesQuery = PracticumSchedule::query()
            ->with('sessions')
            ->whereIn('module_id', $moduleIds);

        if ($weeklyScheduleIds->isNotEmpty() || $classIds->isNotEmpty()) {
            $schedulesQuery->where(function ($query) use ($weeklyScheduleIds, $classIds) {
                if ($weeklyScheduleIds->isNotEmpty()) {
                    $query->whereIn('weekly_schedule_id', $weeklyScheduleIds);
                }
                if ($classIds->isNotEmpty()) {
                    $query->orWhereIn('class_id', $classIds);
                }
            });
        }
        $schedulesByModule = $schedulesQuery->get()->groupBy('module_id');

        // Pre-load preliminary task periods
        $preliminaryPeriods = PreliminaryTaskPeriod::query()
            ->whereIn('module_id', $moduleIds)
            ->get()
            ->groupBy('module_id');

        $moduleList = [];

        foreach ($modules as $module) {
            $grade = $grades->get($module->id);
            $guidance = $guidanceAssignments->get($module->id);
            $feedback = $feedbacks->get($module->id);
            $moduleSubmissions = $submissionsByModule->get($module->id, collect());
            $moduleQuestions = $allQuestions->get($module->id, collect());
            $moduleSchedules = $schedulesByModule->get($module->id, collect());
            $modulePreliminaryPeriods = $preliminaryPeriods->get($module->id, collect());

            // Build component parameter scores (TP, TA, D1-D4, I1-I2)
            $componentScores = $grade?->component_scores ?? [];
            $paramScores = [
                'TP' => (int) round((float) ($componentScores['tp'] ?? 0)),
                'TA' => (int) round((float) ($componentScores['ta'] ?? 0)),
                'D1' => (int) round((float) ($componentScores['d1'] ?? 0)),
                'D2' => (int) round((float) ($componentScores['d2'] ?? 0)),
                'D3' => (int) round((float) ($componentScores['d3'] ?? 0)),
                'D4' => (int) round((float) ($componentScores['d4'] ?? 0)),
                'I1' => (int) round((float) ($componentScores['i1'] ?? 0)),
                'I2' => (int) round((float) ($componentScores['i2'] ?? 0)),
            ];

            $averageScore = $grade ? (float) $grade->score : 0;

            // Determine Assistant Pembimbing: Grader -> Assigned Guide -> Feedback Target -> Weekly Schedule -> Default
            $assistantName = $grade?->gradedBy?->name
                ?? $guidance?->assistant?->name
                ?? $feedback?->targetAssistant?->name
                ?? $defaultScheduleAssistant?->name
                ?? 'Belum Ditugaskan';

            // Determine completion date
            $completedDate = $grade?->published_at
                ?? $grade?->graded_at
                ?? $moduleSubmissions->max('submitted_at');

            $completedAt = $completedDate
                ? Carbon::parse($completedDate)->translatedFormat('d M Y')
                : 'Belum Selesai';

            // Check if entire module is completed
            $isModuleCompleted = ($grade !== null && ($grade->score !== null || $grade->status === 'published'))
                || $moduleSchedules->contains(fn ($s) => $s->status === 'completed');

            // Build session question and answers history strictly for completed sessions
            $sessions = [];
            foreach (self::SESSION_MAPPING as $type => $sessionLabel) {
                $questionsForType = $moduleQuestions->where('session_type', $type);
                if ($questionsForType->isEmpty()) {
                    continue;
                }

                // Check if this specific session has been completed by participant
                $isSessionCompleted = false;

                if ($isModuleCompleted) {
                    $isSessionCompleted = true;
                } elseif ($type === 'preliminary') {
                    $hasSubmittedPrelab = $moduleSubmissions->contains(function ($sub) {
                        return $sub->preliminary_task_period_id !== null && in_array($sub->status, ['submitted', 'graded']);
                    });

                    $isPeriodClosed = $modulePreliminaryPeriods->contains(function ($period) {
                        return $period->state === 'closed' || Carbon::now()->isAfter($period->deadline_at);
                    });

                    $hasSubmittedAnswer = $questionsForType->some(fn ($q) => $allAnswers->get($q->id)?->status === 'submitted');

                    $isSessionCompleted = $hasSubmittedPrelab || $isPeriodClosed || $hasSubmittedAnswer;
                } else {
                    $hasSubmittedSession = $moduleSubmissions->contains(function ($sub) use ($type) {
                        return $sub->practicumSession?->session_type === $type && in_array($sub->status, ['submitted', 'graded']);
                    });

                    $isPracticumSessionEnded = $moduleSchedules->contains(function ($sched) use ($type) {
                        return $sched->sessions->contains(function ($sess) use ($type) {
                            return $sess->session_type === $type && (in_array($sess->state, ['completed', 'closed']) || $sess->completed_at !== null);
                        });
                    });

                    $hasSubmittedAnswer = $questionsForType->some(fn ($q) => $allAnswers->get($q->id)?->status === 'submitted');

                    $isSessionCompleted = $hasSubmittedSession || $isPracticumSessionEnded || $hasSubmittedAnswer;
                }

                // If this session is not completed yet, DO NOT display questions beforehand!
                if (! $isSessionCompleted) {
                    continue;
                }

                $sessionQuestions = [];
                foreach ($questionsForType as $q) {
                    $ans = $allAnswers->get($q->id);
                    $ansText = $ans?->content;

                    if (! $ansText) {
                        // Check in submission answers
                        foreach ($moduleSubmissions as $sub) {
                            $subAns = $sub->submissionAnswers->firstWhere('question_id', $q->id);
                            if ($subAns?->answer_content_snapshot) {
                                $ansText = $subAns->answer_content_snapshot;
                                break;
                            }
                        }
                    }

                    // If answer is uploaded file JSON without url, inject active url
                    if ($ansText) {
                        $decoded = json_decode($ansText, true);
                        if (is_array($decoded) && ! empty($decoded['path']) && empty($decoded['url'])) {
                            if ($ans) {
                                $decoded['url'] = route('participant.answers.file', ['answer' => $ans->id]);
                                $ansText = json_encode($decoded);
                            }
                        }
                    }

                    $sessionQuestions[] = [
                        'id' => $q->id,
                        'question' => "Soal {$q->order_number}: {$q->description}",
                        'answer' => $ansText ?: '(Belum ada jawaban)',
                    ];
                }

                $sessions[] = [
                    'name' => $sessionLabel,
                    'questions' => $sessionQuestions,
                ];
            }

            $moduleList[] = [
                'id' => $module->id,
                'code' => $module->code,
                'order_number' => $module->order_number,
                'title' => "Modul {$module->order_number}: {$module->title}",
                'average_score' => $averageScore,
                'paramScores' => $paramScores,
                'assistant_name' => $assistantName,
                'assistant_feedback' => $grade?->feedback ?: null,
                'completed_at' => $completedAt,
                'is_completed' => $isModuleCompleted,
                'sessions' => $sessions,
            ];
        }

        $gradedModules = collect($moduleList)->filter(fn (array $m): bool => $m['average_score'] > 0);
        $totalAverage = $gradedModules->isNotEmpty() ? (int) round($gradedModules->avg('average_score')) : 0;

        $letterGrade = match (true) {
            $totalAverage >= 85 => 'A',
            $totalAverage >= 80 => 'A-',
            $totalAverage >= 75 => 'B+',
            $totalAverage >= 70 => 'B',
            $totalAverage >= 65 => 'C+',
            $totalAverage >= 60 => 'C',
            $totalAverage >= 50 => 'D',
            default => 'E',
        };

        return Inertia::render('Participant/Grades', [
            'modules' => $moduleList,
            'totalAverage' => $totalAverage,
            'letterGrade' => $letterGrade,
        ]);
    }
}
