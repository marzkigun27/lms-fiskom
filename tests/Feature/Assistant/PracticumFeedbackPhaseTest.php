<?php

use App\Models\Module;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\Semester;
use App\Models\User;
use App\Models\WeeklySchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createFeedbackTestContext(): array
{
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => '2026-08-01 00:00:00',
        'ends_at' => '2026-12-31 23:59:59',
        'is_active' => true,
    ]);

    $assistant = User::factory()->assistant()->create(['name' => 'Kak Asisten']);
    $participant = User::factory()->participant()->create(['name' => 'Praktikan Uji']);

    $weeklySchedule = WeeklySchedule::create([
        'semester_id' => $semester->id,
        'day' => 'Senin',
        'shift' => 'Shift 1 (06:30 - 09:30)',
    ]);

    $weeklySchedule->assistants()->attach($assistant);

    $group = $weeklySchedule->groups()->create(['number' => 1]);
    $group->members()->attach($participant);

    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-01',
        'title' => 'Simulasi Gelombang',
        'description' => 'Modul uji gelombang',
        'order_number' => 1,
        'status' => 'published',
        'published_at' => now(),
    ]);

    return compact('semester', 'assistant', 'participant', 'weeklySchedule', 'module');
}

it('allows assistant to advance practicum session to feedback phase', function () {
    $context = createFeedbackTestContext();

    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'started_by' => $context['assistant']->id,
        'status' => 'ongoing',
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
    ]);

    $currentSession = PracticumSession::create([
        'practicum_schedule_id' => $schedule->id,
        'session_type' => 'independent_task',
        'order_number' => 3,
        'state' => 'active',
        'opened_at' => now(),
        'planned_duration_minutes' => 60,
    ]);

    $feedbackSession = PracticumSession::create([
        'practicum_schedule_id' => $schedule->id,
        'session_type' => 'feedback',
        'order_number' => 4,
        'state' => 'waiting',
        'planned_duration_minutes' => 15,
    ]);

    $response = $this->actingAs($context['assistant'])->patch(
        route('assistant.praktikum.update_phase', $currentSession->id),
        ['phase' => 'feedback']
    );

    $response->assertRedirect();
    $currentSession->refresh();
    $feedbackSession->refresh();

    expect($currentSession->state)->toBe('closed');
    expect($feedbackSession->state)->toBe('active');
    expect($feedbackSession->session_type)->toBe('feedback');
});

it('allows participant to submit feedback with 1-5 rating and records guidance relation', function () {
    $context = createFeedbackTestContext();

    $response = $this->actingAs($context['participant'])->post(
        route('participant.feedback.store'),
        [
            'feedback_type' => 'personal',
            'module_id' => $context['module']->id,
            'target_assistant_id' => $context['assistant']->id,
            'rating' => 5,
            'content' => 'Penjelasan kakak sangat jelas dan responsif saat sesi lab berlangsung.',
            'is_anonymous_to_target' => false,
        ]
    );

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('feedback', [
        'sender_id' => $context['participant']->id,
        'module_id' => $context['module']->id,
        'target_assistant_id' => $context['assistant']->id,
        'rating' => 5,
        'content' => 'Penjelasan kakak sangat jelas dan responsif saat sesi lab berlangsung.',
    ]);

    $this->assertDatabaseHas('assistant_module_participants', [
        'assistant_id' => $context['assistant']->id,
        'module_id' => $context['module']->id,
        'participant_id' => $context['participant']->id,
    ]);
});

it('validates that rating must be between 1 and 5 for personal feedback', function () {
    $context = createFeedbackTestContext();

    $response = $this->actingAs($context['participant'])->post(
        route('participant.feedback.store'),
        [
            'feedback_type' => 'personal',
            'module_id' => $context['module']->id,
            'target_assistant_id' => $context['assistant']->id,
            'rating' => 6, // invalid > 5
            'content' => 'Review dengan rating tidak valid.',
        ]
    );

    $response->assertSessionHasErrors(['rating']);

    $responseZero = $this->actingAs($context['participant'])->post(
        route('participant.feedback.store'),
        [
            'feedback_type' => 'personal',
            'module_id' => $context['module']->id,
            'target_assistant_id' => $context['assistant']->id,
            'rating' => 0, // invalid < 1
            'content' => 'Review dengan rating nol.',
        ]
    );

    $responseZero->assertSessionHasErrors(['rating']);
});
