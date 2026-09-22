<?php

use App\Models\PracticumClass;
use App\Models\Semester;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use Carbon\Carbon;

beforeEach(function () {
    $this->semester = Semester::firstOrCreate(
        ['academic_year' => '2026/2027', 'name' => 'Semester Ganjil 2026/2027'],
        ['term' => 'odd', 'is_active' => true, 'starts_at' => '2026-09-01', 'ends_at' => '2027-01-31']
    );

    $this->class = PracticumClass::firstOrCreate(
        ['code' => 'TEST-01'],
        ['semester_id' => $this->semester->id, 'name' => 'Fisika Komputasi A', 'status' => 'active']
    );

    $this->schedule = WeeklySchedule::firstOrCreate(
        ['semester_id' => $this->semester->id, 'day' => 'Senin', 'shift' => 'Shift 1 (06:30 - 09:30)']
    );

    $this->group = WeeklyScheduleGroup::firstOrCreate(
        ['weekly_schedule_id' => $this->schedule->id, 'number' => 1],
        ['name' => 'Kelompok 1']
    );
});

test('participant registration succeeds and automatically plots into class, shift, and group', function () {
    SystemSetting::set('registration_participant_is_enabled', '1', 'boolean');
    SystemSetting::set('registration_participant_start_at', null, 'datetime');
    SystemSetting::set('registration_participant_end_at', null, 'datetime');

    $response = $this->post('/register', [
        'name' => 'Praktikan Baru',
        'email' => 'newparticipant@example.com',
        'identity_number' => 'NIM-TEST-999',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
        'class_id' => $this->class->id,
        'weekly_schedule_id' => $this->schedule->id,
        'group_number' => 1,
    ]);

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'newparticipant@example.com',
        'identity_number' => 'nim-test-999',
        'user_type' => 'participant',
    ]);

    $user = User::where('email', 'newparticipant@example.com')->first();
    expect($user)->not->toBeNull();

    // Check enrollment in class
    $this->assertDatabaseHas('participant_enrollments', [
        'participant_id' => $user->id,
        'class_id' => $this->class->id,
        'status' => 'active',
    ]);

    // Check plotting in weekly schedule group
    $this->assertDatabaseHas('weekly_schedule_group_member', [
        'weekly_schedule_group_id' => $this->group->id,
        'participant_id' => $user->id,
    ]);
});

test('participant registration is blocked when registration is disabled by assistant', function () {
    SystemSetting::set('registration_participant_is_enabled', '0', 'boolean');

    $response = $this->post('/register', [
        'name' => 'Praktikan Ditolak',
        'email' => 'blocked@example.com',
        'identity_number' => 'NIM-BLOCKED-001',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
        'class_id' => $this->class->id,
        'weekly_schedule_id' => $this->schedule->id,
        'group_number' => 1,
    ]);

    $response->assertSessionHasErrors(['email']);
    expect(session('errors')->first('email'))->toContain('Registrasi akun saat ini telah ditutup');

    $this->assertDatabaseMissing('users', [
        'email' => 'blocked@example.com',
    ]);
});

test('participant registration is blocked when outside scheduled registration window', function () {
    SystemSetting::set('registration_participant_is_enabled', '1', 'boolean');
    // Scheduled for next week
    SystemSetting::set('registration_participant_start_at', Carbon::now()->addDays(7)->toDateTimeString(), 'datetime');
    SystemSetting::set('registration_participant_end_at', Carbon::now()->addDays(14)->toDateTimeString(), 'datetime');

    $response = $this->post('/register', [
        'name' => 'Praktikan Di Luar Jadwal',
        'email' => 'outoftime@example.com',
        'identity_number' => 'NIM-OUT-002',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
        'class_id' => $this->class->id,
        'weekly_schedule_id' => $this->schedule->id,
        'group_number' => 1,
    ]);

    $response->assertSessionHasErrors(['email']);
    expect(session('errors')->first('email'))->toContain('Registrasi akun saat ini telah ditutup');
});

test('assistant registration works independently from participant registration state', function () {
    // Participant registration closed, assistant registration open
    SystemSetting::set('registration_participant_is_enabled', '0', 'boolean');
    SystemSetting::set('registration_assistant_is_enabled', '1', 'boolean');

    $response = $this->post('/register', [
        'name' => 'Asisten Baru',
        'email' => 'newassistant@example.com',
        'identity_number' => 'AST-NEW-01',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'assistant',
    ]);

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'newassistant@example.com',
        'identity_number' => 'ast-new-01',
        'user_type' => 'assistant',
    ]);
});
