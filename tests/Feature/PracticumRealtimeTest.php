<?php

use App\Events\SessionStateUpdated;
use App\Models\Module;
use App\Models\PracticumSchedule;
use App\Models\Semester;
use App\Models\User;
use App\Models\WeeklySchedule;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;

function createRealtimePracticumContext(bool $assignAssistant = true): array
{
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => '2026-08-01 00:00:00',
        'ends_at' => '2026-12-31 23:59:59',
        'is_active' => true,
    ]);
    $assistant = User::factory()->assistant()->create();
    $participant = User::factory()->participant()->create();
    $weeklySchedule = WeeklySchedule::create([
        'semester_id' => $semester->id,
        'day' => 'Senin',
        'shift' => 'Shift 1 (06:30 - 09:30)',
    ]);

    if ($assignAssistant) {
        $weeklySchedule->assistants()->attach($assistant);
    }

    $group = $weeklySchedule->groups()->create(['number' => 1]);
    $group->members()->attach($participant);

    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-01',
        'title' => 'Pengantar Sinyal',
        'description' => 'Modul realtime test.',
        'order_number' => 1,
        'status' => 'published',
        'published_at' => now(),
    ]);

    return compact('assistant', 'participant', 'weeklySchedule', 'module');
}

it('starts the assigned practicum and broadcasts its active session', function () {
    $context = createRealtimePracticumContext();
    Event::fake([SessionStateUpdated::class]);
    $this->travelTo('2026-09-14 08:00:00');

    $this->actingAs($context['assistant'])->post(route('assistant.praktikum.start_session'), [
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
    ])->assertRedirect();

    $schedule = PracticumSchedule::query()->sole();
    $initialSession = $schedule->practicumSessions()->where('session_type', 'initial_task')->sole();

    expect($schedule->status)->toBe('ongoing')
        ->and($schedule->started_by)->toBe($context['assistant']->id)
        ->and($schedule->actual_started_at?->toDateTimeString())->toBe('2026-09-14 08:00:00')
        ->and($initialSession->state)->toBe('active')
        ->and($initialSession->opened_by)->toBe($context['assistant']->id)
        ->and($schedule->practicumSessions()->where('state', 'waiting')->count())->toBe(3);

    $this->assertDatabaseHas('session_state_histories', [
        'practicum_session_id' => $initialSession->id,
        'from_state' => 'scheduled',
        'to_state' => 'active',
        'changed_by' => $context['assistant']->id,
    ]);
    Event::assertDispatched(SessionStateUpdated::class, fn (SessionStateUpdated $event): bool => $event->action === 'started'
        && $event->session->is($initialSession)
        && $event->previousSessionId === null
    );
});

it('moves forward to the next phase and broadcasts the replacement session', function () {
    $context = createRealtimePracticumContext();
    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
        'started_by' => $context['assistant']->id,
        'actual_started_at' => now(),
    ]);
    $initialSession = $schedule->practicumSessions()->create([
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'active',
        'opened_at' => now(),
        'opened_by' => $context['assistant']->id,
    ]);
    $journalSession = $schedule->practicumSessions()->create([
        'session_type' => 'journal',
        'order_number' => 2,
        'state' => 'waiting',
    ]);
    $schedule->practicumSessions()->create([
        'session_type' => 'independent_task',
        'order_number' => 3,
        'state' => 'waiting',
    ]);
    Event::fake([SessionStateUpdated::class]);

    $this->actingAs($context['assistant'])->patch(route('assistant.praktikum.update_phase', $initialSession), [
        'phase' => 'journal',
    ])->assertRedirect();

    expect($initialSession->refresh()->state)->toBe('closed')
        ->and($journalSession->refresh()->state)->toBe('active')
        ->and($journalSession->opened_by)->toBe($context['assistant']->id);

    $this->assertDatabaseHas('session_state_histories', [
        'practicum_session_id' => $initialSession->id,
        'from_state' => 'active',
        'to_state' => 'closed',
    ]);
    $this->assertDatabaseHas('session_state_histories', [
        'practicum_session_id' => $journalSession->id,
        'from_state' => 'waiting',
        'to_state' => 'active',
    ]);
    Event::assertDispatched(SessionStateUpdated::class, fn (SessionStateUpdated $event): bool => $event->action === 'phase_changed'
        && $event->session->is($journalSession)
        && $event->previousSessionId === $initialSession->id
    );
});

it('rejects skipping a practicum phase', function () {
    $context = createRealtimePracticumContext();
    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
    ]);
    $initialSession = $schedule->practicumSessions()->create([
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'active',
    ]);
    $schedule->practicumSessions()->create([
        'session_type' => 'journal',
        'order_number' => 2,
        'state' => 'waiting',
    ]);
    $schedule->practicumSessions()->create([
        'session_type' => 'independent_task',
        'order_number' => 3,
        'state' => 'waiting',
    ]);
    Event::fake([SessionStateUpdated::class]);

    $this->actingAs($context['assistant'])->patch(route('assistant.praktikum.update_phase', $initialSession), [
        'phase' => 'independent_task',
    ])->assertSessionHasErrors('phase');

    expect($initialSession->refresh()->state)->toBe('active');
    Event::assertNotDispatched(SessionStateUpdated::class);
});

it('ends the practicum and broadcasts a completed state', function () {
    $context = createRealtimePracticumContext();
    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
    ]);
    $session = $schedule->practicumSessions()->create([
        'session_type' => 'journal',
        'order_number' => 2,
        'state' => 'active',
        'opened_at' => now(),
        'opened_by' => $context['assistant']->id,
    ]);
    Event::fake([SessionStateUpdated::class]);
    $this->travelTo('2026-09-14 10:30:00');

    $this->actingAs($context['assistant'])->post(route('assistant.praktikum.end_session', $session))
        ->assertRedirect();

    expect($session->refresh()->state)->toBe('completed')
        ->and($session->closed_by)->toBe($context['assistant']->id)
        ->and($schedule->refresh()->status)->toBe('completed')
        ->and($schedule->completed_by)->toBe($context['assistant']->id)
        ->and($schedule->actual_completed_at?->toDateTimeString())->toBe('2026-09-14 10:30:00');
    Event::assertDispatched(SessionStateUpdated::class, fn (SessionStateUpdated $event): bool => $event->action === 'ended' && $event->session->is($session)
    );
});

it('forbids an unassigned assistant from controlling the practicum', function () {
    $context = createRealtimePracticumContext(assignAssistant: false);
    Event::fake([SessionStateUpdated::class]);

    $this->actingAs($context['assistant'])->post(route('assistant.praktikum.start_session'), [
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
    ])->assertForbidden();

    expect(PracticumSchedule::query()->count())->toBe(0);
    Event::assertNotDispatched(SessionStateUpdated::class);
});

it('provides participant control channels while no session is active', function () {
    $context = createRealtimePracticumContext();

    $this->actingAs($context['participant'])->get(route('participant.workspace'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Participant/Workspace/Index')
            ->where('activeSessions', [])
            ->where('controlChannels', [$context['weeklySchedule']->id])
            ->has('modules', 1)
            ->where('modules.0.id', $context['module']->id)
        );
});

it('provides ordered modules and marks completed module after practicum ends', function () {
    $context = createRealtimePracticumContext();

    $secondModule = Module::create([
        'semester_id' => $context['module']->semester_id,
        'code' => 'MOD-02',
        'title' => 'Konvolusi Sinyal',
        'description' => 'Modul kedua.',
        'order_number' => 2,
        'status' => 'published',
        'published_at' => now(),
    ]);

    // Initial state: both modules not completed
    $this->actingAs($context['participant'])->get(route('participant.workspace'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Participant/Workspace/Index')
            ->has('modules', 2)
            ->where('modules.0.id', $context['module']->id)
            ->where('modules.0.order_number', 1)
            ->where('modules.0.is_completed', false)
            ->where('modules.1.id', $secondModule->id)
            ->where('modules.1.order_number', 2)
            ->where('modules.1.is_completed', false)
        );

    // Complete the first module schedule
    PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'completed',
        'completed_by' => $context['assistant']->id,
        'actual_completed_at' => now(),
    ]);

    // Participant workspace now marks the first module as completed
    $this->actingAs($context['participant'])->get(route('participant.workspace'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Participant/Workspace/Index')
            ->has('modules', 2)
            ->where('modules.0.id', $context['module']->id)
            ->where('modules.0.is_completed', true)
            ->where('modules.1.id', $secondModule->id)
            ->where('modules.1.is_completed', false)
        );
});

it('sets active_session_id on participant module when session is active', function () {
    $context = createRealtimePracticumContext();
    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
    ]);
    $session = $schedule->practicumSessions()->create([
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'active',
        'opened_at' => now(),
        'opened_by' => $context['assistant']->id,
    ]);

    $this->actingAs($context['participant'])->get(route('participant.workspace'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Participant/Workspace/Index')
            ->where('modules.0.id', $context['module']->id)
            ->where('modules.0.active_session_id', $session->id)
            ->where('modules.0.is_completed', false)
        );
});

it('provides scheduled participants for active sessions on assistant practicum page', function () {
    $context = createRealtimePracticumContext();
    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
        'started_by' => $context['assistant']->id,
        'actual_started_at' => now(),
    ]);
    $session = $schedule->practicumSessions()->create([
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'active',
        'opened_at' => now(),
        'opened_by' => $context['assistant']->id,
    ]);

    $this->actingAs($context['assistant'])->get(route('assistant.praktikum.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Assistant/Practicum/Index')
            ->has('activeSessions', 1)
            ->has('participants', 1)
            ->where('participants.0.id', $context['participant']->id)
            ->where('participants.0.name', $context['participant']->name)
            ->where('participants.0.status', 'offline')
        );
});

it('rolls back to previous phase and broadcasts phase_changed', function () {
    $context = createRealtimePracticumContext();
    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
        'started_by' => $context['assistant']->id,
    ]);
    $initialSession = $schedule->practicumSessions()->create([
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'closed',
        'opened_at' => now()->subHour(),
        'closed_at' => now()->subMinutes(30),
    ]);
    $journalSession = $schedule->practicumSessions()->create([
        'session_type' => 'journal',
        'order_number' => 2,
        'state' => 'active',
        'opened_at' => now()->subMinutes(30),
        'opened_by' => $context['assistant']->id,
    ]);
    $independentSession = $schedule->practicumSessions()->create([
        'session_type' => 'independent_task',
        'order_number' => 3,
        'state' => 'waiting',
    ]);

    Event::fake([SessionStateUpdated::class]);

    // Rollback / PREV from journal to initial_task
    $this->actingAs($context['assistant'])->patch(route('assistant.praktikum.update_phase', $journalSession), [
        'phase' => 'initial_task',
    ])->assertRedirect();

    expect($initialSession->refresh()->state)->toBe('active')
        ->and($initialSession->closed_at)->toBeNull()
        ->and($journalSession->refresh()->state)->toBe('waiting');

    Event::assertDispatched(SessionStateUpdated::class, fn (SessionStateUpdated $event): bool => $event->action === 'phase_changed'
        && $event->session->is($initialSession)
        && $event->previousSessionId === $journalSession->id
    );
});

it('excludes assistants from scheduled participants on assistant page', function () {
    $context = createRealtimePracticumContext();
    // Add another assistant into the weekly schedule group members
    $secondAssistant = User::factory()->assistant()->create(['name' => 'Assistant Jaga']);
    $context['weeklySchedule']->groups->first()->members()->attach($secondAssistant);

    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
        'started_by' => $context['assistant']->id,
    ]);
    $schedule->practicumSessions()->create([
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'active',
        'opened_at' => now(),
        'opened_by' => $context['assistant']->id,
    ]);

    $this->actingAs($context['assistant'])->get(route('assistant.praktikum.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Assistant/Practicum/Index')
            ->has('participants', 1)
            ->where('participants.0.id', $context['participant']->id)
        );
});

it('authorizes assistant and enrolled participant to join the presence channel', function () {
    config([
        'broadcasting.default' => 'reverb',
        'broadcasting.connections.reverb' => [
            'driver' => 'reverb',
            'key' => 'test-key',
            'secret' => 'test-secret',
            'app_id' => 'test-id',
            'options' => ['host' => '127.0.0.1', 'port' => 8080, 'scheme' => 'http'],
        ],
    ]);
    require base_path('routes/channels.php');

    $context = createRealtimePracticumContext();
    $schedule = PracticumSchedule::create([
        'weekly_schedule_id' => $context['weeklySchedule']->id,
        'module_id' => $context['module']->id,
        'starts_at' => now(),
        'ends_at' => now()->addHours(3),
        'status' => 'ongoing',
        'started_by' => $context['assistant']->id,
    ]);
    $session = $schedule->practicumSessions()->create([
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'active',
        'opened_at' => now(),
        'opened_by' => $context['assistant']->id,
    ]);

    // Assistant auth
    $this->actingAs($context['assistant'])
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'presence-practicum.'.$session->id,
            'socket_id' => '1234.5678',
        ])
        ->assertOk()
        ->assertJsonStructure(['auth', 'channel_data']);

    // Participant auth
    $this->actingAs($context['participant'])
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'presence-practicum.'.$session->id,
            'socket_id' => '1234.5678',
        ])
        ->assertOk()
        ->assertJsonStructure(['auth', 'channel_data']);

    // Unrelated user
    $outsider = User::factory()->participant()->create();
    $this->actingAs($outsider)
        ->postJson('/broadcasting/auth', [
            'channel_name' => 'presence-practicum.'.$session->id,
            'socket_id' => '1234.5678',
        ])
        ->assertForbidden();
});
