<?php

use App\Models\Module;
use App\Models\Question;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows an assistant to batch edit questions atomically', function () {
    $assistant = User::factory()->assistant()->create();
    $semester = Semester::create([
        'name' => 'Semester Test',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => now(),
        'ends_at' => now()->addMonths(6),
        'is_active' => true,
    ]);
    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-BATCH',
        'title' => 'Batch Module',
        'description' => 'Test module',
        'order_number' => 1,
        'status' => 'draft',
    ]);
    $first = Question::create([
        'module_id' => $module->id,
        'session_type' => 'preliminary',
        'description' => 'Old first',
        'answer_type' => 'text',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'draft',
        'created_by' => $assistant->id,
        'updated_by' => $assistant->id,
    ]);
    $second = Question::create([
        'module_id' => $module->id,
        'session_type' => 'preliminary',
        'description' => 'Old second',
        'answer_type' => 'text',
        'order_number' => 2,
        'is_required' => true,
        'status' => 'draft',
        'created_by' => $assistant->id,
        'updated_by' => $assistant->id,
    ]);

    $response = $this->actingAs($assistant)->patch(route('assistant.questions.batch'), [
        'module_id' => $module->id,
        'questions' => [
            ['id' => $first->id, 'description' => 'New first', 'answer_type' => 'text', 'programming_language' => null, 'session_type' => 'preliminary', 'order_number' => 2, 'is_required' => true, 'status' => 'published'],
            ['id' => $second->id, 'description' => 'New second', 'answer_type' => 'text', 'programming_language' => null, 'session_type' => 'preliminary', 'order_number' => 1, 'is_required' => true, 'status' => 'published'],
        ],
    ]);

    $response->assertRedirect(route('assistant.soal.index'));
    expect($first->fresh()->description)->toBe('New first')
        ->and($first->fresh()->order_number)->toBe(2)
        ->and($second->fresh()->description)->toBe('New second')
        ->and($second->fresh()->order_number)->toBe(1);
});

it('allows an assistant to create new questions in batch edit mode', function () {
    $assistant = User::factory()->assistant()->create();
    $semester = Semester::create([
        'name' => 'Semester Test 2',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'starts_at' => now(),
        'ends_at' => now()->addMonths(6),
        'is_active' => true,
    ]);
    $module = Module::create([
        'semester_id' => $semester->id,
        'code' => 'MOD-BATCH-NEW',
        'title' => 'Empty Batch Module',
        'description' => 'Test empty module',
        'order_number' => 2,
        'status' => 'draft',
    ]);

    $response = $this->actingAs($assistant)->patch(route('assistant.questions.batch'), [
        'module_id' => $module->id,
        'questions' => [
            ['id' => null, 'description' => 'First new question', 'answer_type' => 'text', 'programming_language' => null, 'session_type' => 'initial_task', 'order_number' => 1, 'is_required' => true, 'status' => 'published'],
            ['id' => null, 'description' => 'Second new question', 'answer_type' => 'code', 'programming_language' => 'python', 'session_type' => 'initial_task', 'order_number' => 2, 'is_required' => false, 'status' => 'draft'],
        ],
    ]);

    $response->assertRedirect(route('assistant.soal.index'));
    expect(Question::where('module_id', $module->id)->count())->toBe(2);

    $createdFirst = Question::where('module_id', $module->id)->where('order_number', 1)->first();
    expect($createdFirst->description)->toBe('First new question')
        ->and($createdFirst->session_type)->toBe('initial_task')
        ->and($createdFirst->created_by)->toBe($assistant->id);
});
