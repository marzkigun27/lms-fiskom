<?php

use App\Models\Group;
use App\Models\Module;
use App\Models\PracticumClass;
use App\Models\PracticumSession;
use App\Models\Question;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createSessionForGroup(Group $group): PracticumSession
{
    $module = Module::create([
        'name' => fake()->unique()->sentence(2),
        'week_number' => fake()->numberBetween(1, 10),
        'description' => 'Test module',
        'is_active' => true,
    ]);

    Question::create([
        'module_id' => $module->id,
        'title' => 'Test question',
        'content' => 'Answer this question.',
        'type' => 'essay',
        'phase' => 'tugas_awal',
        'points' => 10,
    ]);

    return PracticumSession::create([
        'module_id' => $module->id,
        'group_id' => $group->id,
        'is_active' => true,
        'current_phase' => 'tugas_awal',
    ]);
}

it('does not expose another group session to a participant', function () {
    $class = PracticumClass::create(['name' => 'Physics 101']);
    $participant = User::factory()->create(['role' => 'participant']);
    $participantGroup = Group::create(['name' => 'A', 'practicum_class_id' => $class->id]);
    $otherGroup = Group::create(['name' => 'B', 'practicum_class_id' => $class->id]);
    $participant->update(['practicum_class_id' => $class->id, 'group_id' => $participantGroup->id]);
    $session = createSessionForGroup($otherGroup);

    $this->actingAs($participant)
        ->get(route('participant.workspace.show', $session))
        ->assertForbidden();

    $this->actingAs($participant)
        ->get(route('participant.workspace'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Participant/Workspace/Index')
            ->where('activeSessions', []),
        );
});

it('does not expose another assistants group session', function () {
    $class = PracticumClass::create(['name' => 'Physics 101']);
    $assistant = User::factory()->create(['role' => 'assistant']);
    $otherAssistant = User::factory()->create(['role' => 'assistant']);
    $assistantGroup = Group::create([
        'name' => 'A',
        'practicum_class_id' => $class->id,
        'assistant_id' => $assistant->id,
    ]);
    $otherGroup = Group::create([
        'name' => 'B',
        'practicum_class_id' => $class->id,
        'assistant_id' => $otherAssistant->id,
    ]);
    $ownSession = createSessionForGroup($assistantGroup);
    $otherSession = createSessionForGroup($otherGroup);

    $this->actingAs($assistant)
        ->get(route('assistant.praktikum.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Assistant/Practicum/Index')
            ->has('sessions', 1)
            ->where('sessions.0.id', $ownSession->id)
            ->missing('sessions.1')
            ->where('sessions.0.id', fn ($id): bool => $id !== $otherSession->id),
        );
});
