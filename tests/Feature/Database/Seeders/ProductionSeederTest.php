<?php

use App\Models\Module;
use App\Models\Question;
use App\Models\Semester;
use App\Models\User;
use Database\Seeders\ProductionSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->author = User::factory()->assistant()->create([
        'email' => 'bot@fiskomlab.test',
        'identity_number' => 'BOT',
        'name' => 'BOT',
    ]);
});

it('creates the production semester module and complete module zero questions', function () {
    $this->seed(ProductionSeeder::class);

    expect(Role::query()->orderBy('name')->pluck('name')->all())
        ->toBe(['assistant', 'participant'])
        ->and(User::query()->count())->toBe(1);

    $semester = Semester::query()->sole();
    expect($semester->only(['name', 'academic_year', 'term', 'is_active']))->toBe([
        'name' => 'Semester Ganjil 2026/2027',
        'academic_year' => '2026/2027',
        'term' => 'odd',
        'is_active' => true,
    ]);

    $module = Module::query()->sole();
    expect($module->semester_id)->toBe($semester->id)
        ->and($module->code)->toBe('M0')
        ->and($module->title)->toBe('Modul 0: Simulasi / Running Modul')
        ->and($module->order_number)->toBe(1)
        ->and($module->status)->toBe('published');

    expect(Question::query()
        ->selectRaw('session_type, count(*) as aggregate')
        ->groupBy('session_type')
        ->pluck('aggregate', 'session_type')
        ->map(fn ($count) => (int) $count)
        ->all())->toBe([
            'independent_task' => 3,
            'initial_task' => 3,
            'journal' => 3,
            'preliminary' => 3,
        ]);

    expect(Question::query()->count())->toBe(12)
        ->and(Question::query()->where('created_by', $this->author->id)->count())->toBe(12)
        ->and(Question::query()->where('status', 'published')->count())->toBe(12)
        ->and(Question::query()->where('is_required', true)->count())->toBe(12);
});

it('can be run repeatedly without duplicating production data', function () {
    $this->seed(ProductionSeeder::class);
    $this->seed(ProductionSeeder::class);

    $this->assertDatabaseCount('roles', 2);
    $this->assertDatabaseCount('users', 1);
    $this->assertDatabaseCount('semesters', 1);
    $this->assertDatabaseCount('modules', 1);
    $this->assertDatabaseCount('questions', 12);
});

it('provides the semester required by the global control panel', function () {
    $this->seed(ProductionSeeder::class);

    $this->actingAs($this->author)
        ->get(route('assistant.global_control.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Assistant/GlobalControl/Index')
            ->has('voting.period')
            ->has('voting.categories', 4)
        );
});
