<?php

use App\Models\ParticipantEnrollment;
use App\Models\PracticumClass;
use App\Models\Semester;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;

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

    $this->schedule = WeeklySchedule::create([
        'semester_id' => $this->semester->id,
        'day' => 'Senin',
        'shift' => 'Shift 1 (06:30 - 09:30)',
    ]);

    $this->group = WeeklyScheduleGroup::create([
        'weekly_schedule_id' => $this->schedule->id,
        'number' => 1,
        'code' => 'K-01',
    ]);
});

it('downloads template csv for bulk upload', function () {
    $response = $this->get('/asisten/peserta/template');
    $response->assertOk();
    $response->assertHeader('Content-Disposition', 'attachment; filename="template_bulk_praktikan.csv"');
    expect($response->getContent())->toContain('nama,nim,kelas,shift,kelompok');
});

it('bulk uploads participants via csv file with empty email, nim as password, and plots into class, shift, and group', function () {
    $csvContent = "nama,nim,kelas,shift,kelompok\n"
        ."Ahmad Dahlan,1301210001,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-01\n"
        ."Budi Santoso,1301210002,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-01\n";

    $file = UploadedFile::fake()->createWithContent('peserta.csv', $csvContent);

    $response = $this->post('/asisten/peserta/bulk', [
        'file' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $u1 = User::where('identity_number', '1301210001')->first();
    expect($u1)->not->toBeNull()
        ->and($u1->name)->toBe('Ahmad Dahlan')
        ->and($u1->email)->toBeNull()
        ->and($u1->user_type)->toBe('participant')
        ->and(Hash::check('1301210001', $u1->password))->toBeTrue();

    $u2 = User::where('identity_number', '1301210002')->first();
    expect($u2)->not->toBeNull()
        ->and($u2->name)->toBe('Budi Santoso')
        ->and($u2->email)->toBeNull()
        ->and(Hash::check('1301210002', $u2->password))->toBeTrue();

    // Verify weekly schedule group membership
    expect($this->group->fresh()->members->pluck('id'))->toContain($u1->id, $u2->id);

    // Verify participant enrollment in class
    $enrollment1 = ParticipantEnrollment::where('participant_id', $u1->id)->first();
    expect($enrollment1)->not->toBeNull()
        ->and($enrollment1->class_id)->toBe($this->class->id);

    // Test that the newly created participant can authenticate with NIM and password = NIM
    $this->post('/logout');
    $loginResponse = $this->post('/login', [
        'identity_number' => '1301210001',
        'password' => '1301210001',
        'login_type' => 'praktikan',
    ]);
    $loginResponse->assertRedirect();
    $this->assertAuthenticatedAs($u1);
});

it('bulk uploads participants via raw text and creates groups when needed', function () {
    $rawText = "Citra Lestari,1301210003,PHY-101,Senin - Shift 1,K-NEW-02\n";

    $response = $this->post('/asisten/peserta/bulk', [
        'raw_data' => $rawText,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $u3 = User::where('identity_number', '1301210003')->first();
    expect($u3)->not->toBeNull()
        ->and($u3->name)->toBe('Citra Lestari')
        ->and($u3->email)->toBeNull();

    $newGroup = WeeklyScheduleGroup::where('weekly_schedule_id', $this->schedule->id)
        ->where('code', 'K-NEW-02')
        ->first();

    expect($newGroup)->not->toBeNull()
        ->and($newGroup->members->pluck('id'))->toContain($u3->id);
});

it('allows class column to be empty or omitted in bulk upload', function () {
    // 1. Baris dengan kolom kelas dikosongkan (nama,nim,,shift,kelompok)
    // 2. Baris tanpa kolom kelas sama sekali di header
    $csvData = "nama,nim,kelas,shift,kelompok\n"
        ."Doni Pratama,1301210004,,Senin - Shift 1,K-01\n";

    $response = $this->post('/asisten/peserta/bulk', [
        'raw_data' => $csvData,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $doni = User::where('identity_number', '1301210004')->first();
    expect($doni)->not->toBeNull()
        ->and($doni->name)->toBe('Doni Pratama');

    // Pastikan terdaftar di shift & kelompok
    expect($this->group->fresh()->members->pluck('id'))->toContain($doni->id);

    // Pastikan tidak dipaksa masuk ke kelas manapun jika kolom kelas dikosongkan
    $doniEnrollment = ParticipantEnrollment::where('participant_id', $doni->id)->first();
    expect($doniEnrollment)->toBeNull();

    // Sekarang coba dengan CSV yang sama sekali tidak memiliki kolom kelas di headernya
    $csvWithoutClassCol = "nama,nim,shift,kelompok\n"
        ."Eka Putri,1301210005,Senin - Shift 1,K-01\n";

    $res2 = $this->post('/asisten/peserta/bulk', [
        'raw_data' => $csvWithoutClassCol,
    ]);
    $res2->assertRedirect();

    $eka = User::where('identity_number', '1301210005')->first();
    expect($eka)->not->toBeNull()
        ->and($this->group->fresh()->members->pluck('id'))->toContain($eka->id);
});

it('allows assistant to delete a participant successfully', function () {
    $participant = User::factory()->create([
        'user_type' => 'participant',
        'status' => 'active',
        'identity_number' => '1301219999',
    ]);

    $this->group->members()->syncWithoutDetaching([$participant->id]);

    expect(User::where('id', $participant->id)->exists())->toBeTrue();

    $response = $this->delete("/asisten/peserta/{$participant->id}");
    $response->assertRedirect();
    $response->assertSessionHas('success', 'Pengguna berhasil dihapus.');

    expect(User::where('id', $participant->id)->exists())->toBeFalse();
    expect($this->group->fresh()->members->pluck('id'))->not->toContain($participant->id);
});

it('allows assistant to update a participant successfully', function () {
    $participant = User::factory()->create([
        'user_type' => 'participant',
        'status' => 'active',
        'name' => 'Original Name',
        'identity_number' => '1301218888',
    ]);

    $response = $this->put("/asisten/peserta/{$participant->id}", [
        'name' => 'Updated Name',
        'identity_number' => '1301218888',
        'user_type' => 'participant',
        'status' => 'active',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect($participant->fresh()->name)->toBe('Updated Name');
});

it('handles UTF-8 BOM, scientific notation NIM, and auto-creates missing classes and shifts', function () {
    // Simulasi file CSV yang diekspor dari Microsoft Excel: ada UTF-8 BOM dan notasi ilmiah
    $bom = "\xEF\xBB\xBF";
    $csvContent = $bom."nama,nim,kelas,shift,kelompok\n"
        ."Muhammad Rafi,1.01042E+11,NEW-CLASS-99,Rabu - Shift 3,K-NEW\n";

    $file = UploadedFile::fake()->createWithContent('peserta_excel.csv', $csvContent);

    $response = $this->post('/asisten/peserta/bulk', [
        'file' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // NIM ilmiah 1.01042E+11 otomatis dikonversi menjadi integer string
    $rafi = User::where('identity_number', '101042000000')->first();
    expect($rafi)->not->toBeNull()
        ->and($rafi->name)->toBe('Muhammad Rafi');

    // Kelas NEW-CLASS-99 otomatis dibuat
    $newClass = PracticumClass::where('code', 'NEW-CLASS-99')->first();
    expect($newClass)->not->toBeNull();

    // Shift Rabu - Shift 3 otomatis dibuat
    $newSchedule = WeeklySchedule::where('day', 'Rabu')->where('shift', 'Shift 3')->first();
    expect($newSchedule)->not->toBeNull();

    // Rafi terdaftar di shift & kelas
    expect($newSchedule->groups()->where('code', 'K-NEW')->first()->members->pluck('id'))
        ->toContain($rafi->id);
});

it('creates all 25 distinct group codes without truncating or collapsing them', function () {
    $rows = ['nama,nim,kelas,shift,kelompok'];
    for ($i = 1; $i <= 25; $i++) {
        $pad = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
        $nim = "13012100{$pad}";
        $grp = "K-{$pad}";
        $rows[] = "Praktikan {$i},{$nim},PHY-101,Senin - Shift 1 (06:30 - 09:30),{$grp}";
    }
    $csvContent = implode("\n", $rows)."\n";

    $file = UploadedFile::fake()->createWithContent('peserta_25_kelompok.csv', $csvContent);

    $response = $this->post('/asisten/peserta/bulk', [
        'file' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Pastikan schedule memiliki TEPAT 25 kelompok (bukan 22 atau 10!)
    $allGroups = $this->schedule->fresh()->groups;
    expect($allGroups->count())->toBe(25);

    // Pastikan semua kode K-01 sampai K-25 ada di database
    $codes = $allGroups->pluck('code')->sort()->values()->all();
    $expectedCodes = [];
    for ($i = 1; $i <= 25; $i++) {
        $expectedCodes[] = 'K-'.str_pad((string) $i, 2, '0', STR_PAD_LEFT);
    }
    sort($expectedCodes);
    expect($codes)->toEqual($expectedCodes);

    // Pastikan setiap praktikan berada di kelompoknya masing-masing tanpa loncat
    for ($i = 1; $i <= 25; $i++) {
        $pad = str_pad((string) $i, 2, '0', STR_PAD_LEFT);
        $nim = "13012100{$pad}";
        $grpCode = "K-{$pad}";
        $user = User::where('identity_number', $nim)->first();
        expect($user)->not->toBeNull();

        $group = $allGroups->firstWhere('code', $grpCode);
        expect($group)->not->toBeNull();
        expect($group->members->pluck('id'))->toContain($user->id);
        // Pastikan hanya 1 anggota di kelompok ini
        expect($group->members->count())->toBe(1);
    }
});

it('prevents shift substring collision between Shift 1 and Shift 10', function () {
    $csvContent = "nama,nim,kelas,shift,kelompok\n"
        ."Praktikan S1,1301211001,PHY-101,Senin - Shift 1,K-01\n"
        ."Praktikan S10,1301211010,PHY-101,Senin - Shift 10,K-01\n";

    $file = UploadedFile::fake()->createWithContent('shifts.csv', $csvContent);

    $response = $this->post('/asisten/peserta/bulk', [
        'file' => $file,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $u1 = User::where('identity_number', '1301211001')->first();
    $u10 = User::where('identity_number', '1301211010')->first();

    $schedule1 = WeeklySchedule::where('day', 'Senin')->where('shift', 'like', '%Shift 1%')->where('shift', 'not like', '%Shift 10%')->first();
    $schedule10 = WeeklySchedule::where('day', 'Senin')->where('shift', 'like', '%Shift 10%')->first();

    expect($schedule1)->not->toBeNull();
    expect($schedule10)->not->toBeNull();
    expect($schedule1->id)->not->toBe($schedule10->id);

    // Praktikan S1 harus di schedule1, BUKAN di schedule10
    $groupS1 = $schedule1->groups()->where('code', 'K-01')->first();
    expect($groupS1->members->pluck('id'))->toContain($u1->id);
    expect($groupS1->members->pluck('id'))->not->toContain($u10->id);

    // Praktikan S10 harus di schedule10, BUKAN di schedule1
    $groupS10 = $schedule10->groups()->where('code', 'K-01')->first();
    expect($groupS10->members->pluck('id'))->toContain($u10->id);
    expect($groupS10->members->pluck('id'))->not->toContain($u1->id);
});

it('cleans up previous weekly schedule group membership when participant moves to a new group', function () {
    // 1. Awalnya di K-01
    $csv1 = "nama,nim,kelas,shift,kelompok\n"
        ."Pindah Orang,1301219900,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-01\n";

    $this->post('/asisten/peserta/bulk', ['raw_data' => $csv1]);

    $pindah = User::where('identity_number', '1301219900')->first();
    $group1 = $this->schedule->groups()->where('code', 'K-01')->first();
    expect($group1->members->pluck('id'))->toContain($pindah->id);

    // 2. Kemudian diupload ulang pindah ke K-15
    $csv2 = "nama,nim,kelas,shift,kelompok\n"
        ."Pindah Orang,1301219900,PHY-101,Senin - Shift 1 (06:30 - 09:30),K-15\n";

    $this->post('/asisten/peserta/bulk', ['raw_data' => $csv2]);

    $group15 = $this->schedule->groups()->where('code', 'K-15')->first();
    expect($group15)->not->toBeNull();
    expect($group15->members->pluck('id'))->toContain($pindah->id);

    // Harus sudah lepas dari K-01 (tidak loncat/ganda)
    expect($group1->fresh()->members->pluck('id'))->not->toContain($pindah->id);
});
