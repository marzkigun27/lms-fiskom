<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Module;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Question;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Services\GlobalControl\PreliminaryTaskService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PreLabController extends Controller
{
    public function __construct(
        private PreliminaryTaskService $preliminaryTaskService
    ) {}

    /**
     * Display list of all practicum modules with preliminary task status.
     */
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;
        $modules = $this->preliminaryTaskService->getModulesWithPrelabData($userId);

        return Inertia::render('Participant/PreLab/Index', [
            'modules' => $modules,
        ]);
    }

    /**
     * Display questions and answers for a specific module.
     * Enforces strict backend authorization:
     * - 'not_started': Questions cannot be accessed!
     * - 'ongoing': Questions accessible, draft/submit allowed.
     * - 'expired': Questions viewable in read-only mode if submitted, no edits allowed.
     */
    public function show(Request $request, Module $module): Response|RedirectResponse
    {
        $userId = $request->user()->id;
        $period = PreliminaryTaskPeriod::where('module_id', $module->id)->first();

        if (! $period) {
            return redirect()->route('participant.prelab')
                ->with('error', 'Jadwal Tugas Pendahuluan belum dikonfigurasi untuk modul ini.');
        }

        $computedStatus = $period->computed_status;

        // Security check: If not started, questions MUST NOT be exposed
        if ($computedStatus === 'not_started') {
            return redirect()->route('participant.prelab')
                ->with('error', 'Tugas Pendahuluan untuk modul ini belum dibuka. Waktu mulai: '.$period->opens_at->translatedFormat('d M Y H:i'));
        }

        $submission = Submission::where('participant_id', $userId)
            ->where('preliminary_task_period_id', $period->id)
            ->first();

        $isSubmitted = $submission && in_array($submission->status, ['submitted', 'graded']);
        $isReadOnly = $computedStatus === 'expired' || $isSubmitted;

        $questions = Question::where('module_id', $module->id)
            ->where('session_type', 'preliminary')
            ->orderBy('order_number')
            ->get()
            ->map(fn (Question $q) => [
                'id' => $q->id,
                'title' => $q->title,
                'description' => $q->description,
                'instructions' => $q->instructions,
                'answer_type' => $q->answer_type,
                'programming_language' => $q->programming_language,
                'order_number' => $q->order_number,
                'is_required' => (bool) $q->is_required,
            ]);

        $savedAnswers = Answer::where('participant_id', $userId)
            ->where('preliminary_task_period_id', $period->id)
            ->pluck('content', 'question_id')
            ->toArray();

        $lastSavedAt = Answer::where('participant_id', $userId)
            ->where('preliminary_task_period_id', $period->id)
            ->max('last_saved_at');

        $now = Carbon::now();
        $remainingSeconds = (int) max(0, round($now->diffInSeconds($period->deadline_at, false)));

        return Inertia::render('Participant/PreLab/Show', [
            'module' => [
                'id' => $module->id,
                'order_number' => $module->order_number,
                'code' => $module->code,
                'title' => $module->title,
                'description' => $module->description,
            ],
            'period' => [
                'id' => $period->id,
                'opens_at' => $period->opens_at->toIso8601String(),
                'deadline_at' => $period->deadline_at->toIso8601String(),
                'opens_at_formatted' => $period->opens_at->translatedFormat('d M Y H:i'),
                'deadline_at_formatted' => $period->deadline_at->translatedFormat('d M Y H:i'),
                'computed_status' => $computedStatus,
                'status_label' => $period->status_label,
            ],
            'questions' => $questions,
            'saved_answers' => $savedAnswers,
            'is_submitted' => $isSubmitted,
            'is_readonly' => $isReadOnly,
            'submitted_at' => $submission?->submitted_at?->translatedFormat('d M Y H:i'),
            'last_saved_at' => $lastSavedAt ? Carbon::parse($lastSavedAt)->translatedFormat('d M Y H:i:s') : null,
            'remaining_seconds' => $remainingSeconds,
        ]);
    }

    /**
     * Save draft answers during active period.
     */
    public function saveDraft(Request $request, Module $module): RedirectResponse
    {
        $userId = $request->user()->id;
        $period = PreliminaryTaskPeriod::where('module_id', $module->id)->firstOrFail();

        if (! $period->isOngoing()) {
            return redirect()->back()->with('error', 'Tidak dapat menyimpan draft karena periode pengerjaan sedang tidak aktif.');
        }

        // Check if already finalized
        $isSubmitted = Submission::where('participant_id', $userId)
            ->where('preliminary_task_period_id', $period->id)
            ->whereIn('status', ['submitted', 'graded'])
            ->exists();

        if ($isSubmitted) {
            return redirect()->back()->with('error', 'Jawaban telah dikumpulkan sebelumnya dan tidak dapat diubah lagi.');
        }

        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable', 'string'],
        ]);

        $now = Carbon::now();

        DB::transaction(function () use ($validated, $userId, $period, $now) {
            foreach ($validated['answers'] as $questionId => $content) {
                Answer::updateOrCreate(
                    [
                        'question_id' => $questionId,
                        'participant_id' => $userId,
                        'preliminary_task_period_id' => $period->id,
                    ],
                    [
                        'content' => $content ?? '',
                        'status' => 'saved',
                        'last_saved_at' => $now,
                    ]
                );
            }
        });

        return redirect()->back()->with('success', 'Draft jawaban berhasil disimpan.');
    }

    /**
     * Finalize and submit answers.
     */
    public function submit(Request $request, Module $module): RedirectResponse
    {
        $userId = $request->user()->id;
        $period = PreliminaryTaskPeriod::where('module_id', $module->id)->firstOrFail();

        if (! $period->isOngoing()) {
            return redirect()->back()->with('error', 'Batas waktu pengerjaan telah berakhir. Jawaban tidak dapat dikirim.');
        }

        $existingSubmission = Submission::where('participant_id', $userId)
            ->where('preliminary_task_period_id', $period->id)
            ->whereIn('status', ['submitted', 'graded'])
            ->first();

        if ($existingSubmission) {
            return redirect()->back()->with('error', 'Anda telah mengumpulkan jawaban untuk modul ini.');
        }

        $validated = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable', 'string'],
        ]);

        $now = Carbon::now();

        DB::transaction(function () use ($validated, $userId, $period, $now, $module) {
            // Save final answers
            $savedAnswerModels = [];
            foreach ($validated['answers'] as $questionId => $content) {
                $savedAnswerModels[$questionId] = Answer::updateOrCreate(
                    [
                        'question_id' => $questionId,
                        'participant_id' => $userId,
                        'preliminary_task_period_id' => $period->id,
                    ],
                    [
                        'content' => $content ?? '',
                        'status' => 'submitted',
                        'last_saved_at' => $now,
                        'submitted_at' => $now,
                    ]
                );
            }

            // Create submission record
            $submission = Submission::create([
                'participant_id' => $userId,
                'preliminary_task_period_id' => $period->id,
                'status' => 'submitted',
                'submitted_at' => $now,
                'submitted_by' => $userId,
                'attempt_number' => 1,
            ]);

            // Create snapshot records in submission_answers
            $questions = Question::where('module_id', $module->id)
                ->where('session_type', 'preliminary')
                ->get();

            foreach ($questions as $question) {
                $answerModel = $savedAnswerModels[$question->id] ?? null;

                SubmissionAnswer::create([
                    'submission_id' => $submission->id,
                    'question_id' => $question->id,
                    'answer_id' => $answerModel?->id,
                    'answer_content_snapshot' => $answerModel?->content ?? '',
                    'question_snapshot' => [
                        'title' => $question->title,
                        'description' => $question->description,
                        'answer_type' => $question->answer_type,
                    ],
                    'submitted_at' => $now,
                ]);
            }
        });

        return redirect()->route('participant.prelab')
            ->with('success', "Tugas Pendahuluan {$module->title} berhasil dikumpulkan.");
    }
}
