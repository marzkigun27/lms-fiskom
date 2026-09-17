<?php

use App\Models\Module;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Question;
use App\Models\Semester;
use App\Models\User;
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

    $this->module = Module::firstOrCreate(
        ['code' => 'MOD_PRELAB_TEST'],
        [
            'semester_id' => $this->semester->id,
            'code' => 'MOD_PRELAB_TEST',
            'title' => 'Modul Uji Tugas Pendahuluan',
            'order_number' => 1,
            'status' => 'published',
        ]
    );

    $this->assistant = User::factory()->assistant()->create();
    $this->participant = User::factory()->participant()->create();

    $this->question = Question::create([
        'module_id' => $this->module->id,
        'session_type' => 'preliminary',
        'title' => 'Soal 1',
        'description' => 'Jelaskan hukum Newton pertama.',
        'answer_type' => 'text',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'published',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);
});

test('participant prelab index displays all modules with computed status', function () {
    PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subHour(),
        'deadline_at' => Carbon::now()->addHours(2),
        'state' => 'active',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $response = $this->actingAs($this->participant)->get(route('participant.prelab'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Participant/PreLab/Index')
        ->has('modules')
        ->where('modules.0.status', 'ongoing')
        ->where('modules.0.status_label', 'Sedang Berjalan')
    );
});

test('participant cannot view questions when module status is not_started', function () {
    // Schedule in future
    PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->addDays(2),
        'deadline_at' => Carbon::now()->addDays(4),
        'state' => 'scheduled',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $response = $this->actingAs($this->participant)
        ->get(route('participant.prelab.show', $this->module));

    $response->assertRedirect(route('participant.prelab'));
    $response->assertSessionHas('error');
});

test('participant can view questions when module is ongoing', function () {
    PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subHour(),
        'deadline_at' => Carbon::now()->addHours(3),
        'state' => 'active',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $response = $this->actingAs($this->participant)
        ->get(route('participant.prelab.show', $this->module));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Participant/PreLab/Show')
        ->has('questions', 1)
        ->where('questions.0.description', 'Jelaskan hukum Newton pertama.')
        ->where('is_readonly', false)
    );
});

test('participant can save draft during active period', function () {
    $period = PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subHour(),
        'deadline_at' => Carbon::now()->addHours(3),
        'state' => 'active',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $response = $this->actingAs($this->participant)
        ->post(route('participant.prelab.save_draft', $this->module), [
            'answers' => [
                $this->question->id => 'Jawaban draft hukum inersia.',
            ],
        ]);

    $response->assertSessionHasNoErrors();

    $this->assertDatabaseHas('answers', [
        'participant_id' => $this->participant->id,
        'question_id' => $this->question->id,
        'preliminary_task_period_id' => $period->id,
        'content' => 'Jawaban draft hukum inersia.',
        'status' => 'saved',
    ]);
});

test('participant can submit final answers during active period', function () {
    $period = PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subHour(),
        'deadline_at' => Carbon::now()->addHours(3),
        'state' => 'active',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $response = $this->actingAs($this->participant)
        ->post(route('participant.prelab.submit', $this->module), [
            'answers' => [
                $this->question->id => 'Jawaban final hukum Newton pertama.',
            ],
        ]);

    $response->assertRedirect(route('participant.prelab'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('submissions', [
        'participant_id' => $this->participant->id,
        'preliminary_task_period_id' => $period->id,
        'status' => 'submitted',
    ]);

    $this->assertDatabaseHas('answers', [
        'participant_id' => $this->participant->id,
        'question_id' => $this->question->id,
        'content' => 'Jawaban final hukum Newton pertama.',
        'status' => 'submitted',
    ]);
});

test('participant cannot submit or save draft after deadline has expired', function () {
    // Schedule expired yesterday
    PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subDays(3),
        'deadline_at' => Carbon::now()->subDay(),
        'state' => 'closed',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $response = $this->actingAs($this->participant)
        ->post(route('participant.prelab.submit', $this->module), [
            'answers' => [
                $this->question->id => 'Jawaban setelah deadline.',
            ],
        ]);

    $response->assertSessionHas('error');
    $this->assertDatabaseMissing('submissions', [
        'participant_id' => $this->participant->id,
    ]);
});
