<?php

use App\Models\PracticumClass;
use App\Models\Semester;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use App\Services\GlobalControl\RegistrationControlService;

beforeEach(function () {
    $this->assistant = User::factory()->create([
        'user_type' => 'assistant',
        'status' => 'active',
    ]);
    $this->actingAs($this->assistant);

    $this->semester = Semester::create([
        'name' => 'Semester '.uniqid(),
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => '2026-09-01',
        'ends_at' => '2027-02-01',
        'is_active' => true,
    ]);

    $this->class = PracticumClass::create([
        'semester_id' => $this->semester->id,
        'code' => 'PHY-101',
        'name' => 'Fisika Dasar 1',
        'status' => 'active',
    ]);
});

it('persists group code when storing weekly schedule', function () {
    $participants = User::factory()->count(3)->create(['user_type' => 'participant', 'status' => 'active']);

    $payload = [
        'semester_id' => $this->semester->id,
        'day' => 'Senin',
        'shift' => 'Shift 1 (06:30 - 09:30)',
        'assistant_ids' => [$this->assistant->id],
        'groups' => [
            [
                'number' => 1,
                'code' => 'K-01',
                'participant_ids' => $participants->pluck('id')->all(),
            ],
        ],
    ];

    $response = $this->post('/asisten/jadwal', $payload);
    $response->assertRedirect();

    $schedule = WeeklySchedule::where('semester_id', $this->semester->id)->first();
    expect($schedule)->not->toBeNull();

    $group = $schedule->groups()->first();
    expect($group)->not->toBeNull()
        ->and($group->number)->toBe(1)
        ->and($group->code)->toBe('K-01');
});

it('updates group codes without touching participants via patch endpoint', function () {
    $schedule = WeeklySchedule::create([
        'semester_id' => $this->semester->id,
        'day' => 'Selasa',
        'shift' => 'Shift 2 (09:30 - 12:30)',
    ]);

    $group1 = WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $schedule->id,
        'number' => 1,
        'code' => null,
    ]);

    $group2 = WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $schedule->id,
        'number' => 2,
        'code' => 'OLD-02',
    ]);

    $response = $this->patch("/asisten/jadwal/{$schedule->id}/groups", [
        'groups' => [
            ['number' => 1, 'code' => 'A1'],
            ['number' => 2, 'code' => 'A2'],
        ],
    ]);

    $response->assertSessionHas('success');
    expect($group1->fresh()->code)->toBe('A1')
        ->and($group2->fresh()->code)->toBe('A2');
});

it('provides group codes in registration options', function () {
    $schedule = WeeklySchedule::create([
        'semester_id' => $this->semester->id,
        'day' => 'Rabu',
        'shift' => 'Shift 3 (12:30 - 15:30)',
    ]);

    WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $schedule->id,
        'number' => 1,
        'code' => 'K-FIS-1',
    ]);

    $service = app(RegistrationControlService::class);
    $options = $service->getRegistrationOptions();

    expect($options['shifts'])->not->toBeEmpty();
    $foundShift = collect($options['shifts'])->firstWhere('id', $schedule->id);
    expect($foundShift)->not->toBeNull();

    $foundGroup = collect($foundShift['groups'])->firstWhere('number', 1);
    expect($foundGroup)->not->toBeNull()
        ->and($foundGroup['code'])->toBe('K-FIS-1')
        ->and($foundGroup['name'])->toContain('K-FIS-1');
});

it('allows participant registration with group selection and sets group code correctly', function () {
    SystemSetting::set('registration_participant_is_enabled', '1', 'boolean');

    $schedule = WeeklySchedule::create([
        'semester_id' => $this->semester->id,
        'day' => 'Kamis',
        'shift' => 'Shift 4 (15:30 - 18:30)',
    ]);

    $wsGroup = WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $schedule->id,
        'number' => 2,
        'code' => 'KM-02',
    ]);

    $this->post('/logout');

    $response = $this->post('/register', [
        'name' => 'Peserta Tes Kode',
        'email' => 'peserta.kode@example.com',
        'identity_number' => 'NIM-CODE-001',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
        'class_id' => $this->class->id,
        'weekly_schedule_id' => $schedule->id,
        'group_number' => 2,
    ]);

    $response->assertRedirect();

    $user = User::where('identity_number', 'nim-code-001')->first();
    expect($user)->not->toBeNull();

    expect($wsGroup->fresh()->members->pluck('id'))->toContain($user->id);
});

it('allows participant registration and group code updates for groups up to 25', function () {
    SystemSetting::set('registration_participant_is_enabled', '1', 'boolean');

    $schedule = WeeklySchedule::create([
        'semester_id' => $this->semester->id,
        'day' => 'Jumat',
        'shift' => 'Shift 1 (06:30 - 09:30)',
    ]);

    $wsGroup25 = WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $schedule->id,
        'number' => 25,
        'code' => 'K-25',
    ]);

    // Test patch update for group 25
    $this->actingAs($this->assistant);
    $patchRes = $this->patch("/asisten/jadwal/{$schedule->id}/groups", [
        'groups' => [
            ['number' => 25, 'code' => 'K-NEW-25'],
        ],
    ]);
    $patchRes->assertSessionHas('success');
    expect($wsGroup25->fresh()->code)->toBe('K-NEW-25');

    // Test registration into group 25
    $this->post('/logout');

    $response = $this->post('/register', [
        'name' => 'Peserta Kelompok 25',
        'email' => 'peserta25@example.com',
        'identity_number' => 'NIM-250001',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
        'class_id' => $this->class->id,
        'weekly_schedule_id' => $schedule->id,
        'group_number' => 25,
    ]);

    $response->assertRedirect();
    $user = User::where('identity_number', 'nim-250001')->first();
    expect($user)->not->toBeNull();
    expect($wsGroup25->fresh()->members->pluck('id'))->toContain($user->id);
});
