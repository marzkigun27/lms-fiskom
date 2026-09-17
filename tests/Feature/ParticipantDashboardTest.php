<?php

use App\Models\Grade;
use App\Models\Group;
use App\Models\Module;
use App\Models\ParticipantEnrollment;
use App\Models\PracticumClass;
use App\Models\PracticumSchedule;
use App\Models\PracticumSession;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('guest cannot access participant dashboard and is redirected to login', function () {
    $response = $this->get(route('participant.dashboard'));

    $response->assertRedirect(route('login.praktikan'));
});

test('assistant cannot access participant dashboard', function () {
    $assistant = User::factory()->assistant()->create();

    $response = $this->actingAs($assistant)->get(route('participant.dashboard'));

    $response->assertForbidden();
});

test('participant can view dashboard with empty states when no data exists', function () {
    $participant = User::factory()->participant()->create(['name' => 'Budi Santoso']);

    $response = $this->actingAs($participant)->get(route('participant.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Dashboard')
        ->has('profile')
        ->where('profile.name', 'Budi Santoso')
        ->where('currentSession', null)
        ->has('performance')
        ->where('performance.total_modules', 0)
        ->where('performance.completed_modules', 0)
        ->has('modules', 0)
        ->has('upcomingSchedules', 0)
        ->has('upcomingPrelabs', 0)
        ->has('announcements', 0)
    );
});

test('participant dashboard renders modules, schedules, grades, and active session', function () {
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => now()->subMonth(),
        'ends_at' => now()->addMonths(4),
        'is_active' => true,
    ]);

    $class = PracticumClass::create([
        'semester_id' => $semester->id,
        'code' => 'IF-44-01',
        'name' => 'Kelas A',
        'status' => 'active',
    ]);

    $group = Group::create([
        'class_id' => $class->id,
        'code' => 'K1',
        'name' => 'Kelompok 1',
        'status' => 'active',
    ]);

    $participant = User::factory()->participant()->create([
        'name' => 'Siti Nurhaliza',
        'identity_number' => '1301210001',
    ]);

    ParticipantEnrollment::create([
        'semester_id' => $semester->id,
        'participant_id' => $participant->id,
        'class_id' => $class->id,
        'group_id' => $group->id,
        'enrolled_at' => now(),
        'status' => 'active',
    ]);

    $module1 = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-01',
        'title' => 'Pengenalan Praktikum',
        'description' => 'Dasar modul 1',
        'order_number' => 1,
        'status' => 'published',
    ]);

    $module2 = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-02',
        'title' => 'Algoritma Komputasi',
        'description' => 'Dasar modul 2',
        'order_number' => 2,
        'status' => 'published',
    ]);

    $schedule1 = PracticumSchedule::create([
        'module_id' => $module1->id,
        'class_id' => $class->id,
        'room' => 'Lab Komputasi A',
        'starts_at' => now()->subDays(2),
        'ends_at' => now()->subDays(2)->addHours(3),
        'status' => 'completed',
    ]);

    $session1 = PracticumSession::create([
        'practicum_schedule_id' => $schedule1->id,
        'session_type' => 'journal',
        'order_number' => 1,
        'state' => 'completed',
    ]);

    $submission1 = Submission::create([
        'participant_id' => $participant->id,
        'practicum_session_id' => $session1->id,
        'status' => 'graded',
        'submitted_by' => $participant->id,
        'submitted_at' => now()->subDays(2),
    ]);

    // Grade for module 1
    Grade::create([
        'submission_id' => $submission1->id,
        'participant_id' => $participant->id,
        'module_id' => $module1->id,
        'session_type' => 'journal',
        'score' => 88.5,
        'max_score' => 100,
        'graded_by' => $participant->id,
        'status' => 'published',
    ]);

    // Upcoming schedule for class
    $schedule = PracticumSchedule::create([
        'module_id' => $module2->id,
        'class_id' => $class->id,
        'room' => 'Lab Komputasi A',
        'starts_at' => now()->addDays(2)->setHour(9)->setMinute(0),
        'ends_at' => now()->addDays(2)->setHour(12)->setMinute(0),
        'status' => 'scheduled',
    ]);

    // Upcoming prelab period
    PreliminaryTaskPeriod::create([
        'module_id' => $module2->id,
        'class_id' => $class->id,
        'opens_at' => now()->subDay(),
        'deadline_at' => now()->addDays(1),
        'state' => 'active',
        'created_by' => $participant->id,
        'updated_by' => $participant->id,
    ]);

    $response = $this->actingAs($participant)->get(route('participant.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Dashboard')
        ->where('profile.name', 'Siti Nurhaliza')
        ->where('profile.class_name', 'Kelas A')
        ->where('profile.group_name', 'Kelompok 1')
        ->where('performance.total_modules', 2)
        ->where('performance.completed_modules', 1)
        ->where('performance.completion_percentage', 50)
        ->where('performance.average_score', 88.5)
        ->has('modules', 2)
        ->where('modules.0.code', 'MOD-01')
        ->where('modules.0.status', 'completed')
        ->where('modules.0.grade_letter', 'A')
        ->has('upcomingSchedules', 1)
        ->where('upcomingSchedules.0.module_title', 'Algoritma Komputasi')
        ->has('upcomingPrelabs', 1)
        ->where('upcomingPrelabs.0.module_code', 'MOD-02')
        ->where('upcomingPrelabs.0.is_submitted', false)
    );
});

test('participant dashboard detects live active practicum session', function () {
    $semester = Semester::create([
        'name' => 'Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => now()->subMonth(),
        'ends_at' => now()->addMonths(4),
        'is_active' => true,
    ]);

    $participant = User::factory()->participant()->create();

    $weeklySchedule = WeeklySchedule::create([
        'semester_id' => $semester->id,
        'day' => 'Senin',
        'shift' => 'Shift 1 (06:30 - 09:30)',
    ]);

    $wsGroup = WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $weeklySchedule->id,
        'number' => 1,
    ]);

    $wsGroup->members()->attach($participant->id);

    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-01',
        'title' => 'Live Lab Modul',
        'order_number' => 1,
        'status' => 'published',
    ]);

    $schedule = PracticumSchedule::create([
        'module_id' => $module->id,
        'weekly_schedule_id' => $weeklySchedule->id,
        'room' => 'Lab Robotika',
        'starts_at' => now()->subHour(),
        'ends_at' => now()->addHours(2),
        'status' => 'ongoing',
    ]);

    $activeSession = PracticumSession::create([
        'practicum_schedule_id' => $schedule->id,
        'session_type' => 'journal',
        'order_number' => 1,
        'state' => 'active',
        'opened_at' => now()->subMinutes(15),
    ]);

    $response = $this->actingAs($participant)->get(route('participant.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Participant/Dashboard')
        ->where('currentSession.id', $activeSession->id)
        ->where('currentSession.module_code', 'MOD-01')
        ->where('currentSession.session_type', 'journal')
        ->where('currentSession.room', 'Lab Robotika')
    );
});
