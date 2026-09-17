<?php

namespace App\Http\Controllers\Assistant;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Feedback;
use App\Models\Grade;
use App\Models\GradeHistory;
use App\Models\Module;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\Submission;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GradingController extends Controller
{
    private const SESSION_TYPE_MAP = [
        'preliminary' => 'TP',
        'initial_task' => 'TA',
        'journal' => 'Jurnal',
        'independent_task' => 'Mandiri',
    ];

    public function index(Request $request): Response
    {
        $assistant = $request->user();
        $modules = Module::query()
            ->whereIn('status', ['published', 'draft'])
            ->orderBy('order_number')
            ->get();

        $moduleIdParam = $request->query('module_id');
        $selectedModuleId = null;

        if ($moduleIdParam !== null && $moduleIdParam !== 'all' && is_numeric($moduleIdParam)) {
            $selectedModuleId = (int) $moduleIdParam;
        } elseif ($moduleIdParam === null && $modules->isNotEmpty()) {
            // Default to first module if available
            $selectedModuleId = $modules->first()->id;
        }

        // 1. Get ONLY guided participant IDs for this assistant on the selected module
        $guidedParticipantIds = $assistant->getGuidedParticipantIdsForModule($selectedModuleId);

        // 2. Query guided participants
        $guidedParticipants = User::query()
            ->whereIn('id', $guidedParticipantIds)
            ->with(['enrollments.class', 'enrollments.group'])
            ->get()
            ->keyBy('id');

        // 3. Query all submissions for guided participants on this module (or all modules)
        $submissionsQuery = Submission::query()
            ->whereIn('participant_id', $guidedParticipantIds);

        if ($selectedModuleId) {
            $submissionsQuery->where(function ($query) use ($selectedModuleId) {
                $query->whereHas('practicumSession.practicumSchedule', fn ($q) => $q->where('module_id', $selectedModuleId))
                    ->orWhereHas('submissionAnswers.question', fn ($q) => $q->where('module_id', $selectedModuleId));
            });
        }

        $submissions = $submissionsQuery
            ->with([
                'participant.enrollments.class',
                'participant.enrollments.group',
                'practicumSession.practicumSchedule.module',
                'submissionAnswers.question.module',
                'grade',
            ])
            ->latest('submitted_at')
            ->get();

        // 4. Group submissions by participant so each student has one consolidated row per module
        $submissionsByParticipant = $submissions->groupBy('participant_id');

        // 5. Pre-load all answers for guided participants on the active module
        $answersQuery = Answer::query()
            ->whereIn('participant_id', $guidedParticipantIds)
            ->with(['question.module']);

        if ($selectedModuleId) {
            $answersQuery->whereHas('question', fn ($q) => $q->where('module_id', $selectedModuleId));
        }

        $allAnswers = $answersQuery->latest()->get()->groupBy('participant_id');

        // 6. Pre-load feedback from participants to this assistant for this module
        $feedbacks = Feedback::query()
            ->whereIn('sender_id', $guidedParticipantIds)
            ->where('target_assistant_id', $assistant->id)
            ->when($selectedModuleId, fn ($q) => $q->where('module_id', $selectedModuleId))
            ->get()
            ->keyBy('sender_id');

        // 7. Pre-load group memberships to link participants to their weekly schedules
        $groupMemberships = DB::table('weekly_schedule_group_member')
            ->join('weekly_schedule_groups', 'weekly_schedule_group_member.weekly_schedule_group_id', '=', 'weekly_schedule_groups.id')
            ->whereIn('weekly_schedule_group_member.participant_id', $guidedParticipantIds)
            ->select('weekly_schedule_group_member.participant_id as user_id', 'weekly_schedule_groups.weekly_schedule_id')
            ->get()
            ->keyBy('user_id');

        // 8. Pre-load practicum schedules for the target module (or all modules)
        $schedulesQuery = PracticumSchedule::query();
        if ($selectedModuleId) {
            $schedulesQuery->where('module_id', $selectedModuleId);
        }
        $schedules = $schedulesQuery->get();
        $schedulesByWeekly = $schedules->keyBy(fn (PracticumSchedule $s): string => "{$s->module_id}_{$s->weekly_schedule_id}");
        $schedulesByModule = $schedules->groupBy('module_id');

        $activeModule = $selectedModuleId ? $modules->firstWhere('id', $selectedModuleId) : null;

        $results = [];

        foreach ($guidedParticipants as $participantId => $participant) {
            $participantSubmissions = $submissionsByParticipant->get($participantId, collect());
            $participantAnswers = $allAnswers->get($participantId, collect());
            $participantFeedback = $feedbacks->get($participantId);

            $targetModuleId = $selectedModuleId ?? ($participantSubmissions->first()?->practicumSession?->practicumSchedule?->module_id ?? $modules->first()?->id);
            $userWeeklyScheduleId = $groupMemberships->get($participantId)?->weekly_schedule_id;

            $schedule = $participantSubmissions->first()?->practicumSession?->practicumSchedule
                ?? ($userWeeklyScheduleId ? $schedulesByWeekly->get("{$targetModuleId}_{$userWeeklyScheduleId}") : null)
                ?? $schedulesByModule->get($targetModuleId)?->first();

            $executionDate = $schedule?->actual_started_at ?? $schedule?->starts_at;
            $formattedExecutionDate = $executionDate ? Carbon::parse($executionDate)->translatedFormat('d M Y') : '-';

            // Group answers into TP, TA, Jurnal, Mandiri
            $sessionAnswers = [
                'TP' => [],
                'TA' => [],
                'Jurnal' => [],
                'Mandiri' => [],
            ];

            foreach ($participantAnswers as $ans) {
                $q = $ans->question;
                if (! $q) {
                    continue;
                }
                $key = self::SESSION_TYPE_MAP[$q->session_type] ?? 'TP';
                $sessionAnswers[$key][] = [
                    'question_title' => $q->description ? mb_substr($q->description, 0, 60).'...' : 'Pertanyaan #'.$q->order_number,
                    'answer_text' => $ans->content ?? '',
                ];
            }

            // Also check submission answers if any
            foreach ($participantSubmissions as $sub) {
                foreach ($sub->submissionAnswers as $subAns) {
                    $q = $subAns->question;
                    if (! $q) {
                        continue;
                    }
                    $key = self::SESSION_TYPE_MAP[$q->session_type] ?? 'TP';
                    // Avoid duplicate question titles
                    $exists = collect($sessionAnswers[$key])->contains('question_title', mb_substr($q->description, 0, 60).'...');
                    if (! $exists && $subAns->answer_content_snapshot) {
                        $sessionAnswers[$key][] = [
                            'question_title' => mb_substr($q->description, 0, 60).'...',
                            'answer_text' => $subAns->answer_content_snapshot,
                        ];
                    }
                }
            }

            // Find primary submission or create a virtual one for missing
            $primarySubmission = $participantSubmissions->first();
            $grade = $participantSubmissions->pluck('grade')->filter()->first();

            $enrollment = $participant->enrollments->first();
            $shift = $enrollment?->class?->name ?? 'Kelas Default';
            $kelompok = $enrollment?->group?->name ?? 'Kelompok A';

            // Build component scores
            $componentScores = $grade?->component_scores ?? [];

            $formattedGrade = null;
            if ($grade) {
                $formattedGrade = [
                    'id' => $grade->id,
                    'score' => (float) $grade->score,
                    'tp' => (float) ($componentScores['tp'] ?? 0),
                    'ta' => (float) ($componentScores['ta'] ?? 0),
                    'd1' => (float) ($componentScores['d1'] ?? 0),
                    'd2' => (float) ($componentScores['d2'] ?? 0),
                    'd3' => (float) ($componentScores['d3'] ?? 0),
                    'd4' => (float) ($componentScores['d4'] ?? 0),
                    'i1' => (float) ($componentScores['i1'] ?? 0),
                    'i2' => (float) ($componentScores['i2'] ?? 0),
                    'feedback' => $grade->feedback,
                    'participant_feedback' => $participantFeedback ? ($participantFeedback->rating ? "★ {$participantFeedback->rating}/5 - " : '').$participantFeedback->content : null,
                ];
            } elseif ($participantFeedback) {
                $formattedGrade = [
                    'id' => 0,
                    'score' => 0,
                    'tp' => 0,
                    'ta' => 0,
                    'd1' => 0,
                    'd2' => 0,
                    'd3' => 0,
                    'd4' => 0,
                    'i1' => 0,
                    'i2' => 0,
                    'feedback' => '',
                    'participant_feedback' => ($participantFeedback->rating ? "★ {$participantFeedback->rating}/5 - " : '').$participantFeedback->content,
                ];
            }

            $firstAnswerText = $participantAnswers->first()?->content ?? $primarySubmission?->submissionAnswers->first()?->answer_content_snapshot ?? '';

            // Resolve target submission ID for grading
            $submissionId = $primarySubmission?->id;
            if (! $submissionId) {
                // If participant has no submission yet, find or create one so the assistant can grade them
                $fallbackSession = PracticumSession::query()
                    ->whereHas('practicumSchedule', fn ($q) => $q->when($selectedModuleId, fn ($sq) => $sq->where('module_id', $selectedModuleId)))
                    ->first();

                if ($fallbackSession) {
                    $newSub = Submission::create([
                        'participant_id' => $participantId,
                        'practicum_session_id' => $fallbackSession->id,
                        'status' => 'submitted',
                        'submitted_at' => now(),
                        'submitted_by' => $participantId,
                        'attempt_number' => 1,
                    ]);
                    $submissionId = $newSub->id;
                } else {
                    $submissionId = $participantId * 1000 + ($selectedModuleId ?? 1);
                }
            }

            $results[] = [
                'id' => $submissionId,
                'user' => [
                    'id' => $participant->id,
                    'name' => $participant->name,
                    'identity_number' => $participant->identity_number ?? 'NIM-'.$participant->id,
                    'shift' => $shift,
                    'kelompok' => $kelompok,
                ],
                'question' => [
                    'id' => 1,
                    'title' => $activeModule?->title ?? 'Kinematics Foundations',
                    'content' => $activeModule?->description ?? 'Praktikum Komputasi',
                    'points' => 100,
                    'module' => [
                        'id' => $activeModule?->id ?? ($selectedModuleId ?? 1),
                        'name' => $activeModule?->title ?? 'Modul Praktikum',
                    ],
                ],
                'answer_text' => $firstAnswerText,
                'answers' => $sessionAnswers,
                'is_correct' => false,
                'execution_date' => $executionDate?->toIso8601String(),
                'formatted_execution_date' => $formattedExecutionDate,
                'created_at' => $primarySubmission?->created_at?->toIso8601String() ?? now()->toIso8601String(),
                'grade' => $formattedGrade,
            ];
        }

        $formattedModules = $modules->map(fn (Module $m): array => [
            'id' => $m->id,
            'code' => $m->code,
            'title' => $m->title,
            'name' => $m->title,
        ])->values()->all();

        return Inertia::render('Assistant/Grading/Index', [
            'submissions' => $results,
            'modules' => $formattedModules,
            'selectedModuleId' => $selectedModuleId ?? 'all',
        ]);
    }

    public function store(Request $request, Submission $submission): RedirectResponse
    {
        $assistant = $request->user();
        $submission->load(['participant', 'practicumSession.practicumSchedule.module', 'submissionAnswers.question.module']);

        $moduleId = $submission->practicumSession?->practicumSchedule?->module_id
            ?? $submission->submissionAnswers->first()?->question?->module_id
            ?? Module::value('id');

        // Enforce Authorization: Assistant cannot grade participants outside their guidance on this module
        if (! $assistant->canGradeParticipant($submission->participant_id, (int) $moduleId)) {
            abort(403, 'Anda tidak memiliki wewenang untuk menilai praktikan ini pada modul tersebut.');
        }

        $validated = $request->validate([
            'score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tp' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'ta' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'd1' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'd2' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'd3' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'd4' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'i1' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'i2' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string', 'max:5000'],
            'status' => ['nullable', 'in:draft,published'],
        ]);

        $components = [
            'tp' => (float) ($validated['tp'] ?? 0),
            'ta' => (float) ($validated['ta'] ?? 0),
            'd1' => (float) ($validated['d1'] ?? 0),
            'd2' => (float) ($validated['d2'] ?? 0),
            'd3' => (float) ($validated['d3'] ?? 0),
            'd4' => (float) ($validated['d4'] ?? 0),
            'i1' => (float) ($validated['i1'] ?? 0),
            'i2' => (float) ($validated['i2'] ?? 0),
        ];

        // Compute overall score if not explicitly passed
        if (isset($validated['score']) && is_numeric($validated['score']) && (float) $validated['score'] > 0) {
            $totalScore = (float) $validated['score'];
        } else {
            $nonZero = collect($components)->filter(fn ($v) => $v > 0);
            $totalScore = $nonZero->isNotEmpty() ? round($nonZero->avg(), 2) : 0;
        }

        $existingGrade = Grade::where('submission_id', $submission->id)->first();
        $oldScore = $existingGrade?->score;
        $oldStatus = $existingGrade?->status;

        $grade = Grade::updateOrCreate(
            ['submission_id' => $submission->id],
            [
                'participant_id' => $submission->participant_id,
                'module_id' => $moduleId,
                'session_type' => $submission->practicumSession?->session_type ?? 'independent_task',
                'score' => $totalScore,
                'max_score' => 100,
                'component_scores' => $components,
                'feedback' => $validated['feedback'] ?? null,
                'status' => $validated['status'] ?? 'published',
                'graded_by' => $assistant->id,
                'graded_at' => now(),
                'published_at' => now(),
            ]
        );

        GradeHistory::create([
            'grade_id' => $grade->id,
            'old_score' => $oldScore,
            'new_score' => $totalScore,
            'old_status' => $oldStatus,
            'new_status' => $grade->status,
            'change_snapshot' => $components,
            'changed_by' => $assistant->id,
            'reason' => $existingGrade ? 'Perbaruan nilai asisten' : 'Penilaian awal asisten',
            'changed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Nilai praktikan berhasil disimpan.');
    }
}
