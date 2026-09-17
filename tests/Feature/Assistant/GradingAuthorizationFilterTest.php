<?php

use App\Models\AssistantModuleParticipant;
use App\Models\Grade;
use App\Models\GradeHistory;
use App\Models\Module;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\User;
use App\Models\WeeklySchedule;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

function createGradingContext(): array
{
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => '2026-08-01 00:00:00',
        'ends_at' => '2026-12-31 23:59:59',
        'is_active' => true,
    ]);

    $assistantA = User::factory()->assistant()->create(['name' => 'Asisten A']);
    $assistantB = User::factory()->assistant()->create(['name' => 'Asisten B']);

    $participantA = User::factory()->participant()->create(['name' => 'Praktikan A']);
    $participantB = User::factory()->participant()->create(['name' => 'Praktikan B']);

    $weeklySchedule = WeeklySchedule::create([
        'semester_id' => $semester->id,
        'day' => 'Senin',
        'shift' => 'Shift 1 (06:30 - 09:30)',
    ]);

    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-GRD',
        'title' => 'Modul Penilaian',
        'description' => 'Deskripsi penilaian',
        'order_number' => 1,
        'status' => 'published',
        'published_at' => now(),
    ]);

    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $weeklySchedule->id,
        'module_id' => $module->id,
        'started_by' => $assistantA->id,
        'status' => 'ongoing',
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
    ]);

    $session = PracticumSession::create([
        'practicum_schedule_id' => $schedule->id,
        'session_type' => 'independent_task',
        'order_number' => 3,
        'state' => 'active',
        'opened_at' => now(),
        'planned_duration_minutes' => 60,
    ]);

    $submissionA = Submission::create([
        'participant_id' => $participantA->id,
        'practicum_session_id' => $session->id,
        'status' => 'submitted',
        'submitted_at' => now(),
        'submitted_by' => $participantA->id,
        'attempt_number' => 1,
    ]);

    $submissionB = Submission::create([
        'participant_id' => $participantB->id,
        'practicum_session_id' => $session->id,
        'status' => 'submitted',
        'submitted_at' => now(),
        'submitted_by' => $participantB->id,
        'attempt_number' => 1,
    ]);

    // Assistant A guides Participant A for this module
    AssistantModuleParticipant::create([
        'assistant_id' => $assistantA->id,
        'module_id' => $module->id,
        'participant_id' => $participantA->id,
    ]);

    // Assistant B guides Participant B for this module
    AssistantModuleParticipant::create([
        'assistant_id' => $assistantB->id,
        'module_id' => $module->id,
        'participant_id' => $participantB->id,
    ]);

    return compact(
        'semester',
        'assistantA',
        'assistantB',
        'participantA',
        'participantB',
        'module',
        'schedule',
        'session',
        'submissionA',
        'submissionB'
    );
}

it('filters grading list to only participants guided by the authenticated assistant', function () {
    $context = createGradingContext();

    $response = $this->actingAs($context['assistantA'])->get(
        route('assistant.grading.index', ['module_id' => $context['module']->id])
    );

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Assistant/Grading/Index')
        ->has('submissions', 1)
        ->where('submissions.0.user.id', $context['participantA']->id)
        ->has('submissions.0.formatted_execution_date')
        ->where('submissions.0.formatted_execution_date', Carbon::parse($context['schedule']->starts_at)->translatedFormat('d M Y'))
    );
});

it('forbids an assistant from grading a participant they do not guide for the module', function () {
    $context = createGradingContext();

    // Assistant A attempts to grade Participant B's submission (guided by Assistant B)
    $response = $this->actingAs($context['assistantA'])->post(
        route('assistant.grading.store', $context['submissionB']->id),
        [
            'tp' => 80,
            'ta' => 85,
            'd1' => 90,
            'd2' => 80,
            'd3' => 85,
            'd4' => 80,
            'i1' => 85,
            'i2' => 90,
            'feedback' => 'Penilaian tidak sah',
        ]
    );

    $response->assertForbidden();
    $this->assertDatabaseMissing('grades', [
        'submission_id' => $context['submissionB']->id,
        'participant_id' => $context['participantB']->id,
    ]);
});

it('allows authorized assistant to grade participant and persists component scores', function () {
    $context = createGradingContext();

    $scores = [
        'tp' => 80,
        'ta' => 90,
        'd1' => 85,
        'd2' => 85,
        'd3' => 90,
        'd4' => 80,
        'i1' => 95,
        'i2' => 75,
    ];

    $response = $this->actingAs($context['assistantA'])->post(
        route('assistant.grading.store', $context['submissionA']->id),
        [
            ...$scores,
            'feedback' => 'Kerja yang sangat rapi dan komprehensif.',
        ]
    );

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $grade = Grade::query()
        ->where('participant_id', $context['participantA']->id)
        ->where('module_id', $context['module']->id)
        ->first();

    expect($grade)->not->toBeNull();
    expect($grade->graded_by)->toBe($context['assistantA']->id);
    expect($grade->feedback)->toBe('Kerja yang sangat rapi dan komprehensif.');
    expect($grade->component_scores)->toBeArray();
    expect($grade->component_scores['tp'])->toEqual(80);
    expect($grade->component_scores['i2'])->toEqual(75);

    // Verify expected calculated score (average of non-zero scores)
    // 80+90+85+85+90+80+95+75 = 680 / 8 = 85.0
    expect((float) $grade->score)->toEqual(85.0);

    // Verify GradeHistory was created
    $history = GradeHistory::where('grade_id', $grade->id)->first();
    expect($history)->not->toBeNull();
    expect($history->changed_by)->toBe($context['assistantA']->id);
    expect((float) $history->new_score)->toEqual(85.0);
});
