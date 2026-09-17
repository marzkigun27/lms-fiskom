<?php

use App\Models\Group;
use App\Models\Module;
use App\Models\PracticumClass;
use App\Models\PracticumSession;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createSubmissionForGroup(Group $group, User $participant): Submission
{
    $module = Module::create([
        'name' => fake()->unique()->sentence(2),
        'week_number' => fake()->numberBetween(1, 10),
        'description' => 'Test module',
        'is_active' => true,
    ]);
    $question = Question::create([
        'module_id' => $module->id,
        'title' => 'Test question',
        'content' => 'Answer this question.',
        'type' => 'essay',
        'phase' => 'tugas_awal',
        'points' => 10,
    ]);
    $session = PracticumSession::create([
        'module_id' => $module->id,
        'group_id' => $group->id,
        'is_active' => true,
        'current_phase' => 'tugas_awal',
    ]);

    return Submission::create([
        'user_id' => $participant->id,
        'question_id' => $question->id,
        'practicum_session_id' => $session->id,
        'answer_text' => 'answer',
    ]);
}

it('limits assistant grading to submissions in assigned groups', function () {
    $class = PracticumClass::create(['name' => 'Physics 101']);
    $assistant = User::factory()->create(['role' => 'assistant']);
    $otherAssistant = User::factory()->create(['role' => 'assistant']);
    $ownGroup = Group::create(['name' => 'A', 'practicum_class_id' => $class->id, 'assistant_id' => $assistant->id]);
    $otherGroup = Group::create(['name' => 'B', 'practicum_class_id' => $class->id, 'assistant_id' => $otherAssistant->id]);
    $ownParticipant = User::factory()->create(['role' => 'participant', 'group_id' => $ownGroup->id]);
    $otherParticipant = User::factory()->create(['role' => 'participant', 'group_id' => $otherGroup->id]);
    $ownSubmission = createSubmissionForGroup($ownGroup, $ownParticipant);
    $otherSubmission = createSubmissionForGroup($otherGroup, $otherParticipant);

    $this->actingAs($assistant)
        ->get(route('assistant.grading.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('submissions', 1)
            ->where('submissions.0.id', $ownSubmission->id)
            ->missing('submissions.1'),
        );

    $this->actingAs($assistant)
        ->post(route('assistant.grading.store', $otherSubmission), ['score' => 80])
        ->assertForbidden();
});
