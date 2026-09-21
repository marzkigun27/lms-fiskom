<?php

use App\Models\Answer;
use App\Models\Module;
use App\Models\PreliminaryTaskPeriod;
use App\Models\Question;
use App\Models\Semester;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

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
        ['code' => 'MOD_FILE_TEST'],
        [
            'semester_id' => $this->semester->id,
            'code' => 'MOD_FILE_TEST',
            'title' => 'Modul Hitungan File',
            'order_number' => 10,
            'status' => 'published',
        ]
    );

    $this->assistant = User::factory()->assistant()->create();
    $this->participant = User::factory()->participant()->create();
    $this->otherParticipant = User::factory()->participant()->create();

    $this->fileQuestion = Question::create([
        'module_id' => $this->module->id,
        'session_type' => 'preliminary',
        'title' => 'Soal Hitungan 1',
        'description' => 'Unggah pembuktian penurunan rumus.',
        'answer_type' => 'file',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'published',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);
});

test('participant can upload answer file for active preliminary task period', function () {
    Storage::fake('public');
    Config::set('filesystems.answers_disk', 'public');

    $period = PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subHour(),
        'deadline_at' => Carbon::now()->addHours(2),
        'state' => 'active',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $file = UploadedFile::fake()->createWithContent(
        'bukti_hitungan.png',
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
    );

    $response = $this->actingAs($this->participant)
        ->postJson(route('participant.answers.upload'), [
            'file' => $file,
            'question_id' => $this->fileQuestion->id,
            'preliminary_task_period_id' => $period->id,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ])
        ->assertJsonStructure([
            'success',
            'answer_id',
            'data' => [
                'disk',
                'path',
                'original_name',
                'mime_type',
                'size_bytes',
                'url',
            ],
        ]);

    $answer = Answer::where('participant_id', $this->participant->id)
        ->where('question_id', $this->fileQuestion->id)
        ->first();

    expect($answer)->not->toBeNull();
    $decoded = json_decode($answer->content, true);
    expect($decoded['original_name'])->toBe('bukti_hitungan.png');
    expect($decoded['disk'])->toBe('public');

    Storage::disk('public')->assertExists($decoded['path']);
});

test('upload rejects unsupported file types or files exceeding size limit', function () {
    Storage::fake('public');

    $period = PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subHour(),
        'deadline_at' => Carbon::now()->addHours(2),
        'state' => 'active',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    // Reject non-image files such as PDF and executable
    $pdfFile = UploadedFile::fake()->create('dokumen.pdf', 100, 'application/pdf');
    $this->actingAs($this->participant)
        ->postJson(route('participant.answers.upload'), [
            'file' => $pdfFile,
            'question_id' => $this->fileQuestion->id,
            'preliminary_task_period_id' => $period->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);

    $invalidFile = UploadedFile::fake()->create('malicious.exe', 100, 'application/x-msdownload');
    $this->actingAs($this->participant)
        ->postJson(route('participant.answers.upload'), [
            'file' => $invalidFile,
            'question_id' => $this->fileQuestion->id,
            'preliminary_task_period_id' => $period->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);

    // Reject file > 10MB (e.g. 11MB = 11264 KB)
    $tooLargeFile = UploadedFile::fake()->create('huge.png', 12000, 'image/png');
    $this->actingAs($this->participant)
        ->postJson(route('participant.answers.upload'), [
            'file' => $tooLargeFile,
            'question_id' => $this->fileQuestion->id,
            'preliminary_task_period_id' => $period->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['file']);
});

test('participant can stream their uploaded answer file and unauthorized participant cannot', function () {
    Storage::fake('public');
    Config::set('filesystems.answers_disk', 'public');

    $filePath = 'answers/'.$this->participant->id.'/test_file.pdf';
    Storage::disk('public')->put($filePath, '%PDF-1.4 dummy content');

    $answer = Answer::create([
        'question_id' => $this->fileQuestion->id,
        'participant_id' => $this->participant->id,
        'content' => json_encode([
            'disk' => 'public',
            'path' => $filePath,
            'original_name' => 'jawaban_test.pdf',
            'mime_type' => 'application/pdf',
            'size_bytes' => 20,
        ]),
        'status' => 'saved',
    ]);

    // Owner can view
    $response = $this->actingAs($this->participant)
        ->get(route('participant.answers.file', ['answer' => $answer->id]));
    $response->assertOk();

    // Other participant receives 403 Forbidden
    $unauthResponse = $this->actingAs($this->otherParticipant)
        ->get(route('participant.answers.file', ['answer' => $answer->id]));
    $unauthResponse->assertForbidden();

    // Assistant can view
    $assistantResponse = $this->actingAs($this->assistant)
        ->get(route('participant.answers.file', ['answer' => $answer->id]));
    $assistantResponse->assertOk();
});

test('assistant can stream submission answer snapshot file', function () {
    Storage::fake('public');
    Config::set('filesystems.answers_disk', 'public');

    $filePath = 'answers/'.$this->participant->id.'/snapshot.png';
    Storage::disk('public')->put($filePath, 'fake image data');

    $submission = Submission::create([
        'participant_id' => $this->participant->id,
        'status' => 'submitted',
        'submitted_at' => now(),
        'submitted_by' => $this->participant->id,
    ]);

    $submissionAnswer = SubmissionAnswer::create([
        'submission_id' => $submission->id,
        'question_id' => $this->fileQuestion->id,
        'answer_content_snapshot' => json_encode([
            'disk' => 'public',
            'path' => $filePath,
            'original_name' => 'grafik.png',
            'mime_type' => 'image/png',
            'size_bytes' => 15,
        ]),
        'question_snapshot' => [
            'description' => 'Grafik hitungan',
            'answer_type' => 'file',
        ],
        'submitted_at' => now(),
    ]);

    $response = $this->actingAs($this->assistant)
        ->get(route('assistant.grading.submission_file', ['submissionAnswer' => $submissionAnswer->id]));

    $response->assertOk();
});

test('participant can upload and stream answer file using r2 disk', function () {
    Storage::fake('r2');
    Config::set('filesystems.answers_disk', 'r2');

    $period = PreliminaryTaskPeriod::create([
        'module_id' => $this->module->id,
        'opens_at' => Carbon::now()->subHour(),
        'deadline_at' => Carbon::now()->addHours(2),
        'state' => 'active',
        'created_by' => $this->assistant->id,
        'updated_by' => $this->assistant->id,
    ]);

    $file = UploadedFile::fake()->createWithContent(
        'laporan_r2.jpg',
        base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=')
    );

    $response = $this->actingAs($this->participant)
        ->postJson(route('participant.answers.upload'), [
            'file' => $file,
            'question_id' => $this->fileQuestion->id,
            'preliminary_task_period_id' => $period->id,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $answer = Answer::where('participant_id', $this->participant->id)
        ->where('question_id', $this->fileQuestion->id)
        ->first();

    expect($answer)->not->toBeNull();
    $decoded = json_decode($answer->content, true);
    expect($decoded['disk'])->toBe('r2');
    expect($decoded['original_name'])->toBe('laporan_r2.jpg');

    Storage::disk('r2')->assertExists($decoded['path']);

    $streamResponse = $this->actingAs($this->participant)
        ->get(route('participant.answers.file', ['answer' => $answer->id]));

    $streamResponse->assertOk();
});
