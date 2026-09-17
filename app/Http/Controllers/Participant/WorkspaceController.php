<?php

namespace App\Http\Controllers\Participant;

use App\Events\ParticipantProgressUpdated;
use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Feedback;
use App\Models\Module;
use App\Models\ParticipantEnrollment;
use App\Models\PracticumClass;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\Question;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Models\User;
use App\Models\WeeklySchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    public function index(Request $request): Response
    {
        $participantId = $request->user()->id;
        $weeklyScheduleIds = WeeklySchedule::query()
            ->whereHas('groups.members', fn ($query) => $query->whereKey($participantId))
            ->pluck('id');
        $controlChannels = $weeklyScheduleIds->values();

        $classIds = PracticumClass::query()
            ->whereHas('enrollments', fn ($query) => $query->where('participant_id', $participantId)->where('status', 'active'))
            ->pluck('id');

        $semesterId = ParticipantEnrollment::query()
            ->where('participant_id', $participantId)
            ->where('status', 'active')
            ->value('semester_id')
            ?? WeeklySchedule::query()->whereIn('id', $weeklyScheduleIds)->value('semester_id')
            ?? Semester::query()->where('is_active', true)->value('id');

        $activeSessions = PracticumSession::query()
            ->with(['practicumSchedule.module'])
            ->whereHas('practicumSchedule', function ($query) use ($participantId) {
                $query->whereHas('weeklySchedule.groups.members', function ($memberQuery) use ($participantId) {
                    $memberQuery->where('users.id', $participantId);
                })->orWhereHas('class.enrollments', function ($enrollmentQuery) use ($participantId) {
                    $enrollmentQuery->where('participant_id', $participantId)->where('status', 'active');
                });
            })
            ->active()
            ->latest()
            ->get();

        $activeSessionByModule = [];
        foreach ($activeSessions as $session) {
            $moduleId = $session->practicumSchedule?->module_id;
            if ($moduleId && ! isset($activeSessionByModule[$moduleId])) {
                $activeSessionByModule[$moduleId] = $session->id;
            }
        }

        $completedScheduleQuery = PracticumSchedule::query()
            ->where('status', 'completed');

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

        $modulesQuery = Module::query()
            ->whereIn('status', ['published', 'draft'])
            ->orderBy('order_number');

        if ($semesterId) {
            $semesterModules = (clone $modulesQuery)->where('semester_id', $semesterId)->get();
            $modules = $semesterModules->isNotEmpty() ? $semesterModules : $modulesQuery->get();
        } else {
            $modules = $modulesQuery->get();
        }

        $formattedModules = $modules->map(fn (Module $module): array => [
            'id' => $module->id,
            'code' => $module->code,
            'title' => $module->title,
            'description' => $module->description,
            'order_number' => $module->order_number,
            'is_completed' => in_array($module->id, $completedModuleIds, true),
            'active_session_id' => $activeSessionByModule[$module->id] ?? null,
        ])->values()->all();

        return Inertia::render('Participant/Workspace/Index', [
            'activeSessions' => $activeSessions,
            'controlChannels' => $controlChannels,
            'modules' => $formattedModules,
        ]);
    }

    public function show(Request $request, PracticumSession $session): Response
    {
        abort_unless($session->isActive() && $this->canAccess($request, $session), 403);

        $session->load(['practicumSchedule.module.questions']);
        $answers = Answer::query()
            ->where('participant_id', $request->user()->id)
            ->where('practicum_session_id', $session->id)
            ->get()
            ->keyBy('question_id');

        $schedule = $session->practicumSchedule;
        $scheduleAssistants = collect();
        if ($schedule?->weeklySchedule) {
            $scheduleAssistants = $schedule->weeklySchedule->assistants()->get(['users.id', 'users.name']);
        }
        if ($scheduleAssistants->isEmpty() && $schedule?->class_id) {
            $scheduleAssistants = User::whereHas('assistantAssignments', fn ($q) => $q->where('class_id', $schedule->class_id)->where('status', 'active'))->get(['id', 'name']);
        }
        if ($scheduleAssistants->isEmpty()) {
            $scheduleAssistants = User::where('user_type', 'assistant')->where('status', 'active')->get(['id', 'name']);
        }

        $existingFeedback = Feedback::query()
            ->where('sender_id', $request->user()->id)
            ->where('module_id', $session->practicumSchedule->module_id)
            ->with('targetAssistant:id,name')
            ->first();

        return Inertia::render('Participant/Workspace/Show', [
            'session' => $session,
            'existingAnswers' => $answers,
            'assistants' => $scheduleAssistants->values(),
            'existingFeedback' => $existingFeedback,
        ]);
    }

    public function submit(Request $request, PracticumSession $session, Question $question): RedirectResponse
    {
        if (! $session->isActive() || ! $this->canAccess($request, $session) || ! $this->questionBelongsToSession($session, $question)) {
            abort(403);
        }

        $validated = $request->validate([
            'answer_content' => ['nullable', 'string', 'required_without:answer_text'],
            'answer_text' => ['nullable', 'string', 'required_without:answer_content'],
        ]);
        $content = $validated['answer_content'] ?? $validated['answer_text'];

        DB::transaction(function () use ($request, $session, $question, $content): void {
            $answer = Answer::updateOrCreate(
                [
                    'question_id' => $question->id,
                    'participant_id' => $request->user()->id,
                    'practicum_session_id' => $session->id,
                ],
                ['content' => $content, 'status' => 'submitted', 'last_saved_at' => now(), 'submitted_at' => now()],
            );
            $submission = Submission::create([
                'participant_id' => $request->user()->id,
                'practicum_session_id' => $session->id,
                'status' => 'submitted',
                'submitted_at' => now(),
                'submitted_by' => $request->user()->id,
                'attempt_number' => 1,
            ]);
            SubmissionAnswer::create([
                'submission_id' => $submission->id,
                'question_id' => $question->id,
                'answer_id' => $answer->id,
                'answer_content_snapshot' => $content,
                'question_snapshot' => $question->only(['description', 'answer_type', 'programming_language']),
                'submitted_at' => now(),
            ]);
        });

        $totalQuestions = Question::query()
            ->where('module_id', $session->practicumSchedule->module_id)
            ->where('session_type', $question->session_type)
            ->count();

        $completedQuestions = Answer::query()
            ->where('participant_id', $request->user()->id)
            ->where('practicum_session_id', $session->id)
            ->whereHas('question', function ($query) use ($question) {
                $query->where('session_type', $question->session_type);
            })
            ->count();

        ParticipantProgressUpdated::dispatch(
            $session->id,
            $request->user()->id,
            'active',
            ['completed' => $completedQuestions, 'total' => $totalQuestions, 'phase' => $question->session_type],
        );

        return back()->with('success', 'Answer submitted successfully.');
    }

    private function canAccess(Request $request, PracticumSession $session): bool
    {
        $participantId = $request->user()->id;

        return $session->practicumSchedule()
            ->where(function ($query) use ($participantId) {
                $query->whereHas('weeklySchedule.groups.members', function ($memberQuery) use ($participantId) {
                    $memberQuery->where('users.id', $participantId);
                })->orWhereHas('class.enrollments', function ($enrollmentQuery) use ($participantId) {
                    $enrollmentQuery->where('participant_id', $participantId)->where('status', 'active');
                });
            })
            ->exists();
    }

    private function questionBelongsToSession(PracticumSession $session, Question $question): bool
    {
        return $question->module_id === $session->practicumSchedule->module_id
            && $question->session_type === $session->session_type;
    }
}
