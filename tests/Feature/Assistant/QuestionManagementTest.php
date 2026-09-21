<?php

use App\Models\Module;
use App\Models\Question;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('releases order_number when a question is deleted and allows creating a new question with the same order number', function () {
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
        'code' => 'MOD-TEST',
        'title' => 'Test Module',
        'description' => 'Test module description',
        'order_number' => 1,
        'status' => 'draft',
    ]);

    $question = Question::create([
        'module_id' => $module->id,
        'session_type' => 'preliminary',
        'description' => 'Original question 1',
        'answer_type' => 'text',
        'order_number' => 1,
        'is_required' => true,
        'status' => 'draft',
        'created_by' => $assistant->id,
        'updated_by' => $assistant->id,
    ]);

    // Delete the question via the assistant destroy endpoint
    $response = $this->actingAs($assistant)->delete(route('assistant.soal.destroy', $question));
    $response->assertRedirect(route('assistant.soal.index'));

    // Verify question is soft-deleted and order_number was moved to negative
    $deletedQuestion = Question::withTrashed()->find($question->id);
    expect($deletedQuestion->trashed())->toBeTrue()
        ->and($deletedQuestion->order_number)->toBeLessThan(0);

    // Now create a new question with the same order_number = 1 in the same module & session_type
    $createResponse = $this->actingAs($assistant)->post(route('assistant.soal.store'), [
        'module_id' => $module->id,
        'session_type' => 'preliminary',
        'description' => 'Replacement question 1',
        'answer_type' => 'text',
        'programming_language' => null,
        'order_number' => 1,
        'is_required' => true,
        'status' => 'draft',
    ]);

    $createResponse->assertSessionHasNoErrors();
    $createResponse->assertRedirect(route('assistant.soal.index'));

    $newQuestion = Question::where('module_id', $module->id)
        ->where('session_type', 'preliminary')
        ->where('order_number', 1)
        ->first();

    expect($newQuestion)->not->toBeNull()
        ->and($newQuestion->description)->toBe('Replacement question 1');
});

it('releases order_number and code when a module is deleted and allows creating a new module with the same order number and code', function () {
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
        'code' => 'MOD-UNIQUE',
        'title' => 'First Module',
        'description' => 'Desc',
        'order_number' => 1,
        'status' => 'draft',
    ]);

    // Delete the module
    $response = $this->actingAs($assistant)->delete(route('assistant.soal.modules.destroy', $module));
    $response->assertRedirect(route('assistant.soal.index'));

    $deletedModule = Module::withTrashed()->find($module->id);
    expect($deletedModule->trashed())->toBeTrue()
        ->and($deletedModule->order_number)->toBeLessThan(0);

    // Create a new module with the same code and order_number in the same semester
    $createResponse = $this->actingAs($assistant)->post(route('assistant.soal.modules.store'), [
        'semester_id' => $semester->id,
        'code' => 'MOD-UNIQUE',
        'title' => 'New Module 1',
        'description' => 'New Desc',
        'order_number' => 1,
        'status' => 'draft',
    ]);

    $createResponse->assertSessionHasNoErrors();
    $createResponse->assertRedirect(route('assistant.soal.index'));

    $newModule = Module::where('semester_id', $semester->id)
        ->where('order_number', 1)
        ->first();

    expect($newModule)->not->toBeNull()
        ->and($newModule->code)->toBe('MOD-UNIQUE');
});
