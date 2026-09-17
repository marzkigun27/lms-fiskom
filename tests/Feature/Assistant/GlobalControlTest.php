<?php

use App\Models\Module;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Semester;
use App\Models\User;
use App\Models\Vote;
use App\Models\VoteCategory;
use App\Models\VotePeriod;
use Carbon\Carbon;

beforeEach(function () {
    $this->semester = Semester::firstOrCreate(
        ['is_active' => true],
        [
            'name' => 'Semester Ganjil 2026/2027',
            'academic_year' => '2026/2027',
            'term' => 'odd',
            'starts_at' => Carbon::parse('2026-09-01 00:00:00'),
            'ends_at' => Carbon::parse('2027-03-01 00:00:00'),
            'is_active' => true,
        ]
    );

    $this->module1 = Module::firstOrCreate(
        ['order_number' => 1],
        [
            'semester_id' => $this->semester->id,
            'code' => 'MOD1',
            'title' => 'Modul 1 Fisika Dasar',
            'order_number' => 1,
            'status' => 'published',
        ]
    );

    $this->module2 = Module::firstOrCreate(
        ['order_number' => 2],
        [
            'semester_id' => $this->semester->id,
            'code' => 'MOD2',
            'title' => 'Modul 2 Dinamika Gerak',
            'order_number' => 2,
            'status' => 'published',
        ]
    );

    $this->assistant = User::factory()->assistant()->create();
    $this->participant = User::factory()->participant()->create();
});

test('assistant can view global control panel page', function () {
    $response = $this->actingAs($this->assistant)->get(route('assistant.global_control.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Assistant/GlobalControl/Index')
        ->has('prelab.modules')
        ->has('registration')
        ->has('voting')
        ->has('audit_logs')
    );
});

test('participant is forbidden from accessing global control panel', function () {
    $response = $this->actingAs($this->participant)->get(route('assistant.global_control.index'));

    $response->assertForbidden();
});

test('it prevents overlapping preliminary task schedules with conflict information', function () {
    // Schedule Module 1: 16 Sep 18:00 -> 19 Sep 18:00
    PreliminaryTaskPeriod::create([
        'module_id' => $this->module1->id,
        'opens_at' => Carbon::parse('2026-09-16 18:00:00'),
        'deadline_at' => Carbon::parse('2026-09-19 18:00:00'),
        'state' => 'scheduled',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    // Attempt to schedule Module 2 overlapping: 18 Sep 12:00 -> 21 Sep 12:00
    $response = $this->actingAs($this->assistant)
        ->from(route('assistant.global_control.index'))
        ->post(route('assistant.global_control.prelab.update'), [
            'module_id' => $this->module2->id,
            'opens_at' => '2026-09-18T12:00',
            'deadline_at' => '2026-09-21T12:00',
        ]);

    $response->assertRedirect(route('assistant.global_control.index'));
    $response->assertSessionHasErrors(['schedule']);

    $errorMessage = session('errors')->first('schedule');
    expect($errorMessage)
        ->toContain($this->module1->title)
        ->toContain('Maksimal hanya terdapat 1 modul Tugas Pendahuluan yang aktif');
});

test('it allows non-overlapping preliminary task schedules', function () {
    // Schedule Module 1: 16 Sep 18:00 -> 19 Sep 18:00
    PreliminaryTaskPeriod::create([
        'module_id' => $this->module1->id,
        'opens_at' => Carbon::parse('2026-09-16 18:00:00'),
        'deadline_at' => Carbon::parse('2026-09-19 18:00:00'),
        'state' => 'scheduled',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    // Schedule Module 2 strictly after Module 1: 23 Sep 18:00 -> 26 Sep 18:00
    $response = $this->actingAs($this->assistant)
        ->post(route('assistant.global_control.prelab.update'), [
            'module_id' => $this->module2->id,
            'opens_at' => '2026-09-23T18:00',
            'deadline_at' => '2026-09-26T18:00',
        ]);

    $response->assertSessionHasNoErrors();
    $this->assertDatabaseHas('preliminary_task_periods', [
        'module_id' => $this->module2->id,
    ]);

    // Check that audit log was recorded
    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->assistant->id,
        'action' => 'prelab.schedule_created',
    ]);
});

test('assistant can toggle registration settings and audit log is recorded', function () {
    $response = $this->actingAs($this->assistant)->post(route('assistant.global_control.registration.update'), [
        'is_enabled' => false,
        'start_at' => null,
        'end_at' => null,
    ]);

    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('system_settings', [
        'key' => 'registration_is_enabled',
        'value' => '0',
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->assistant->id,
        'action' => 'registration.settings_updated',
    ]);
});

test('voting category is safely deactivated instead of deleted when votes exist', function () {
    $period = VotePeriod::create([
        'semester_id' => $this->semester->id,
        'title' => 'Pemilihan Asisten',
        'opens_at' => Carbon::now()->subDay(),
        'closes_at' => Carbon::now()->addDays(5),
        'status' => 'active',
        'created_by' => $this->assistant->id,
    ]);

    $category = VoteCategory::create([
        'vote_period_id' => $period->id,
        'name' => 'Asisten Terfavorit',
        'order_number' => 1,
        'is_active' => true,
    ]);

    // Cast a vote on this category
    Vote::create([
        'vote_period_id' => $period->id,
        'vote_category_id' => $category->id,
        'voter_id' => $this->participant->id,
        'assistant_id' => $this->assistant->id,
    ]);

    // Request to delete the category
    $response = $this->actingAs($this->assistant)
        ->delete(route('assistant.global_control.voting.categories.destroy', $category));

    $response->assertSessionHasNoErrors();

    // Category must NOT be deleted from database, only set to is_active = false
    $this->assertDatabaseHas('vote_categories', [
        'id' => $category->id,
        'is_active' => false,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'actor_id' => $this->assistant->id,
        'action' => 'voting.category_deactivated',
    ]);
});
