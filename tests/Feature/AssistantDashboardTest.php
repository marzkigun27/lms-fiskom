<?php

use App\Models\AssistantAssignment;
use App\Models\Module;
use App\Models\ParticipantEnrollment;
use App\Models\PracticumClass;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guest cannot access assistant dashboard and is redirected to login', function () {
    $response = $this->get(route('assistant.dashboard'));

    $response->assertRedirect(route('login.praktikan'));
});

test('participant cannot access assistant dashboard', function () {
    $participant = User::factory()->participant()->create();

    $response = $this->actingAs($participant)->get(route('assistant.dashboard'));

    $response->assertForbidden();
});

test('assistant can view dashboard with empty states when no assignments exist', function () {
    $assistant = User::factory()->assistant()->create(['name' => 'Kak Asisten']);

    $response = $this->actingAs($assistant)->get(route('assistant.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Assistant/Dashboard')
        ->has('assistant')
        ->where('assistant.name', 'Kak Asisten')
        ->where('stats.guided_participants', 0)
        ->where('stats.pending_grading', 0)
        ->where('stats.total_schedules', 0)
        ->where('activeSession', null)
        ->has('pendingGrading', 0)
        ->has('schedules', 0)
    );
});

test('assistant dashboard displays guided participants, teaching schedules, and pending grading', function () {
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => now()->subMonth(),
        'ends_at' => now()->addMonths(4),
        'is_active' => true,
    ]);

    $assistant = User::factory()->assistant()->create(['name' => 'Kak Dodi']);
    $participant1 = User::factory()->participant()->create(['name' => 'Andi Pratama', 'identity_number' => '1301210010']);
    $participant2 = User::factory()->participant()->create(['name' => 'Bella Sari', 'identity_number' => '1301210011']);

    $class = PracticumClass::create([
        'semester_id' => $semester->id,
        'code' => 'IF-44-02',
        'name' => 'Kelas B',
        'status' => 'active',
    ]);

    // Enroll participants
    ParticipantEnrollment::create([
        'semester_id' => $semester->id,
        'participant_id' => $participant1->id,
        'class_id' => $class->id,
        'enrolled_at' => now(),
        'status' => 'active',
    ]);
    ParticipantEnrollment::create([
        'semester_id' => $semester->id,
        'participant_id' => $participant2->id,
        'class_id' => $class->id,
        'enrolled_at' => now(),
        'status' => 'active',
    ]);

    // Assign assistant to this class
    AssistantAssignment::create([
        'semester_id' => $semester->id,
        'assistant_id' => $assistant->id,
        'class_id' => $class->id,
        'assignment_type' => 'mentor',
        'status' => 'active',
    ]);

    // Weekly schedule assigned to this assistant
    $weeklySchedule = WeeklySchedule::create([
        'semester_id' => $semester->id,
        'day' => 'Selasa',
        'shift' => 'Shift 2 (09:30 - 12:30)',
    ]);
    $weeklySchedule->assistants()->attach($assistant->id);

    $wsGroup = WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $weeklySchedule->id,
        'number' => 1,
    ]);
    $wsGroup->members()->attach([$participant1->id, $participant2->id]);

    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-03',
        'title' => 'Struktur Data Lanjut',
        'order_number' => 3,
        'status' => 'published',
    ]);

    $schedule = PracticumSchedule::create([
        'module_id' => $module->id,
        'weekly_schedule_id' => $weeklySchedule->id,
        'room' => 'Lab Komputasi 1',
        'starts_at' => now()->addDay(),
        'ends_at' => now()->addDay()->addHours(3),
        'status' => 'scheduled',
    ]);

    $practicumSession = PracticumSession::create([
        'practicum_schedule_id' => $schedule->id,
        'session_type' => 'journal',
        'order_number' => 1,
        'state' => 'closed',
    ]);

    // Submissions waiting for grading (one from participant1, one from participant2)
    Submission::create([
        'participant_id' => $participant1->id,
        'practicum_session_id' => $practicumSession->id,
        'status' => 'submitted',
        'submitted_by' => $participant1->id,
        'submitted_at' => now()->subHour(),
    ]);

    Submission::create([
        'participant_id' => $participant2->id,
        'practicum_session_id' => $practicumSession->id,
        'status' => 'submitted',
        'submitted_by' => $participant2->id,
        'submitted_at' => now()->subMinutes(30),
    ]);

    $response = $this->actingAs($assistant)->get(route('assistant.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Assistant/Dashboard')
        ->where('assistant.name', 'Kak Dodi')
        ->where('stats.guided_participants', 2)
        ->where('stats.pending_grading', 2)
        ->where('stats.total_schedules', 1)
        ->has('pendingGrading', 2)
        ->where('pendingGrading.0.participant_name', 'Bella Sari')
        ->where('pendingGrading.1.participant_name', 'Andi Pratama')
        ->has('schedules', 1)
        ->where('schedules.0.day', 'Selasa')
        ->where('schedules.0.shift', 'Shift 2 (09:30 - 12:30)')
    );
});

test('assistant dashboard highlights live active session', function () {
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => now()->subMonth(),
        'ends_at' => now()->addMonths(4),
        'is_active' => true,
    ]);

    $assistant = User::factory()->assistant()->create();

    $weeklySchedule = WeeklySchedule::create([
        'semester_id' => $semester->id,
        'day' => 'Kamis',
        'shift' => 'Shift 3 (12:30 - 15:30)',
    ]);
    $weeklySchedule->assistants()->attach($assistant->id);

    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-04',
        'title' => 'Jaringan Komputer',
        'order_number' => 4,
        'status' => 'published',
    ]);

    $schedule = PracticumSchedule::create([
        'module_id' => $module->id,
        'weekly_schedule_id' => $weeklySchedule->id,
        'room' => 'Lab Cisco',
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHours(2),
        'status' => 'ongoing',
        'started_by' => $assistant->id,
    ]);

    $activeSession = PracticumSession::create([
        'practicum_schedule_id' => $schedule->id,
        'session_type' => 'initial_task',
        'order_number' => 1,
        'state' => 'active',
        'opened_at' => now()->subMinutes(10),
        'opened_by' => $assistant->id,
    ]);

    $response = $this->actingAs($assistant)->get(route('assistant.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Assistant/Dashboard')
        ->where('stats.has_active_session', true)
        ->where('activeSession.id', $activeSession->id)
        ->where('activeSession.module_code', 'MOD-04')
        ->where('activeSession.room', 'Lab Cisco')
    );
});
