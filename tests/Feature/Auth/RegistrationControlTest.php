<?php

use App\Models\SystemSetting;
use Carbon\Carbon;

test('participant registration succeeds when registration is enabled', function () {
    SystemSetting::set('registration_is_enabled', '1', 'boolean');
    SystemSetting::set('registration_start_at', null, 'datetime');
    SystemSetting::set('registration_end_at', null, 'datetime');

    $response = $this->post('/register', [
        'name' => 'Praktikan Baru',
        'email' => 'newparticipant@example.com',
        'identity_number' => 'NIM-TEST-999',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
    ]);

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', [
        'email' => 'newparticipant@example.com',
        'identity_number' => 'nim-test-999',
        'user_type' => 'participant',
    ]);
});

test('participant registration is blocked when registration is disabled by assistant', function () {
    SystemSetting::set('registration_is_enabled', '0', 'boolean');

    $response = $this->post('/register', [
        'name' => 'Praktikan Ditolak',
        'email' => 'blocked@example.com',
        'identity_number' => 'NIM-BLOCKED-001',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
    ]);

    $response->assertSessionHasErrors(['email']);
    expect(session('errors')->first('email'))->toContain('Registrasi akun saat ini telah ditutup');

    $this->assertDatabaseMissing('users', [
        'email' => 'blocked@example.com',
    ]);
});

test('participant registration is blocked when outside scheduled registration window', function () {
    SystemSetting::set('registration_is_enabled', '1', 'boolean');
    // Scheduled for next week
    SystemSetting::set('registration_start_at', Carbon::now()->addDays(7)->toDateTimeString(), 'datetime');
    SystemSetting::set('registration_end_at', Carbon::now()->addDays(14)->toDateTimeString(), 'datetime');

    $response = $this->post('/register', [
        'name' => 'Praktikan Di Luar Jadwal',
        'email' => 'outoftime@example.com',
        'identity_number' => 'NIM-OUT-002',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'register_type' => 'participant',
    ]);

    $response->assertSessionHasErrors(['email']);
    expect(session('errors')->first('email'))->toContain('Registrasi akun saat ini telah ditutup');
});
