<?php

use App\Models\Semester;
use App\Models\User;
use App\Models\WeeklySchedule;
use App\Models\WeeklyScheduleGroup;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;

function weeklySemester(bool $active = true): Semester
{
    return Semester::create(['name' => 'Semester '.uniqid(), 'academic_year' => '2026/2027', 'term' => 'odd', 'starts_at' => '2026-09-01', 'ends_at' => '2027-02-01', 'is_active' => $active]);
}

function weeklyPayload(Semester $semester): array
{
    return ['semester_id' => $semester->id, 'day' => 'Senin', 'shift' => 'Shift 1 (06:30 - 09:30)', 'assistant_ids' => [User::factory()->create(['user_type' => 'assistant', 'status' => 'active'])->id], 'groups' => [['number' => 1, 'participant_ids' => User::factory()->count(3)->create(['user_type' => 'participant', 'status' => 'active'])->modelKeys()]]];
}

beforeEach(function () {
    $this->actingAs(User::factory()->create(['user_type' => 'assistant', 'status' => 'active']));
});

it('creates a weekly slot with normalized assistants and numbered groups', function () {
    $payload = weeklyPayload(weeklySemester());
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $schedule = WeeklySchedule::sole();
    expect($schedule->semester_id)->toBe($payload['semester_id'])
        ->and($schedule->assistants->modelKeys())->toBe($payload['assistant_ids'])
        ->and($schedule->groups->sole()->number)->toBe(1)
        ->and($schedule->groups->sole()->members->modelKeys())->toBe($payload['groups'][0]['participant_ids']);
    $this->assertDatabaseCount('participant_enrollments', 0);
});

it('validates the complete weekly payload before persisting any rows', function ($change, $key) {
    $payload = weeklyPayload(weeklySemester());
    $payload = $change($payload);
    $this->postJson('/asisten/jadwal', $payload)->assertUnprocessable()->assertJsonValidationErrors($key);
    $this->assertDatabaseCount('weekly_schedules', 0);
})->with([
    'invalid semester' => [fn ($p) => array_replace($p, ['semester_id' => 99999]), 'semester_id'],
    'invalid day' => [fn ($p) => array_replace($p, ['day' => 'Tomorrow']), 'day'],
    'invalid shift' => [fn ($p) => array_replace($p, ['shift' => '1']), 'shift'],
    'no assistants' => [fn ($p) => array_replace($p, ['assistant_ids' => []]), 'assistant_ids'],
    'six assistants' => [fn ($p) => array_replace($p, ['assistant_ids' => User::factory()->count(6)->create(['user_type' => 'assistant', 'status' => 'active'])->modelKeys()]), 'assistant_ids'],
    'duplicate assistants' => [fn ($p) => array_replace($p, ['assistant_ids' => [$p['assistant_ids'][0], (string) $p['assistant_ids'][0]]]), 'assistant_ids.0'],
    'participant as assistant' => [fn ($p) => array_replace($p, ['assistant_ids' => [$p['groups'][0]['participant_ids'][0]]]), 'assistant_ids.0'],
    'inactive assistant' => [function ($p) {
        User::find($p['assistant_ids'][0])->update(['status' => 'inactive']);

        return $p;
    }, 'assistant_ids.0'],
    'deleted assistant' => [function ($p) {
        User::find($p['assistant_ids'][0])->delete();

        return $p;
    }, 'assistant_ids.0'],
    'no groups' => [fn ($p) => array_replace($p, ['groups' => []]), 'groups'],
    'six groups' => [fn ($p) => array_replace($p, ['groups' => array_fill(0, 6, $p['groups'][0])]), 'groups'],
    'invalid number' => [fn ($p) => array_replace($p, ['groups' => [['number' => 6, 'participant_ids' => $p['groups'][0]['participant_ids']]]]), 'groups.0.number'],
    'duplicate numbers' => [fn ($p) => array_replace($p, ['groups' => [$p['groups'][0], $p['groups'][0]]]), 'groups.0.number'],
    'too few members' => [fn ($p) => array_replace($p, ['groups' => [['number' => 1, 'participant_ids' => array_slice($p['groups'][0]['participant_ids'], 0, 2)]]]), 'groups.0.participant_ids'],
    'too many members' => [fn ($p) => array_replace($p, ['groups' => [['number' => 1, 'participant_ids' => User::factory()->count(5)->create(['user_type' => 'participant', 'status' => 'active'])->modelKeys()]]]), 'groups.0.participant_ids'],
    'duplicate members across groups' => [fn ($p) => array_replace($p, ['groups' => [$p['groups'][0], ['number' => 2, 'participant_ids' => array_map('strval', $p['groups'][0]['participant_ids'])]]]), 'groups.0.participant_ids.0'],
    'assistant as participant' => [function ($p) {
        $p['groups'][0]['participant_ids'][0] = $p['assistant_ids'][0];

        return $p;
    }, 'groups.0.participant_ids.0'],
    'inactive participant' => [function ($p) {
        User::find($p['groups'][0]['participant_ids'][0])->update(['status' => 'inactive']);

        return $p;
    }, 'groups.0.participant_ids.0'],
    'deleted participant' => [function ($p) {
        User::find($p['groups'][0]['participant_ids'][0])->delete();

        return $p;
    }, 'groups.0.participant_ids.0'],
]);

it('rejects an occupied slot or a participant already scheduled in that semester', function () {
    $semester = weeklySemester();
    $payload = weeklyPayload($semester);
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $other = weeklyPayload($semester);
    $this->postJson('/asisten/jadwal', $other)->assertUnprocessable()->assertJsonValidationErrors('shift');
    $payload['day'] = 'Selasa';
    $this->postJson('/asisten/jadwal', $payload)->assertUnprocessable()->assertJsonValidationErrors('groups');
    $this->assertDatabaseCount('weekly_schedules', 1);
    $payload['semester_id'] = weeklySemester(false)->id;
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $this->assertDatabaseCount('weekly_schedules', 2);
});

it('replaces a weekly schedule atomically and keeps old assignments on invalid updates', function () {
    $semester = weeklySemester();
    $payload = weeklyPayload($semester);
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $schedule = WeeklySchedule::sole();
    $replacement = weeklyPayload($semester);
    $replacement['day'] = 'Minggu';
    $this->put('/asisten/jadwal/'.$schedule->id, $replacement)->assertRedirect();
    expect($schedule->fresh()->day)->toBe('Minggu')
        ->and($schedule->fresh()->groups->sole()->members->modelKeys())->toBe($replacement['groups'][0]['participant_ids'])
        ->and($schedule->fresh()->assistants->modelKeys())->toBe($replacement['assistant_ids']);
    $this->assertDatabaseCount('weekly_schedule_groups', 1);
    $this->assertDatabaseCount('weekly_schedule_group_member', 3);
    $this->put('/asisten/jadwal/'.$schedule->id, $replacement)->assertRedirect();
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $this->putJson('/asisten/jadwal/'.$schedule->id, $payload)->assertUnprocessable();
    $payload['day'] = 'Sabtu';
    $this->putJson('/asisten/jadwal/'.$schedule->id, $payload)->assertUnprocessable()->assertJsonValidationErrors('groups');
    $replacement['groups'][0]['participant_ids'] = [];
    $this->putJson('/asisten/jadwal/'.$schedule->id, $replacement)->assertUnprocessable();
    expect($schedule->fresh()->day)->toBe('Minggu');
    $this->assertDatabaseCount('weekly_schedule_group_member', 6);
});

it('deletes only the selected weekly schedule and its pivots', function () {
    $payload = weeklyPayload(weeklySemester());
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $schedule = WeeklySchedule::sole();
    $this->delete('/asisten/jadwal/'.$schedule->id)->assertRedirect();
    foreach (['weekly_schedules', 'weekly_schedule_groups', 'weekly_schedule_assistant', 'weekly_schedule_group_member'] as $table) {
        $this->assertDatabaseCount($table, 0);
    }
    expect(User::count())->toBe(5)->and(Semester::count())->toBe(1);
    $this->delete('/asisten/jadwal/'.$schedule->id)->assertNotFound();
});

it('restricts weekly management to active nondeleted assistants', function ($role, $status, $deleted) {
    $payload = weeklyPayload(weeklySemester());
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $schedule = WeeklySchedule::sole();
    $user = User::factory()->create(['user_type' => $role, 'status' => $status]);
    if ($deleted) {
        $user->delete();
    }
    $this->actingAs($user);
    $this->get('/asisten/jadwal')->assertForbidden();
    $this->postJson('/asisten/jadwal', $payload)->assertForbidden();
    $this->putJson('/asisten/jadwal/'.$schedule->id, $payload)->assertForbidden();
    $this->deleteJson('/asisten/jadwal/'.$schedule->id)->assertForbidden();
    $this->assertDatabaseCount('weekly_schedules', 1);
})->with([
    ['assistant', 'inactive', false],
    ['assistant', 'active', true],
    ['participant', 'active', false],
]);

it('lists only the selected semester with safe user projections and all day options', function () {
    $active = weeklySemester();
    $history = weeklySemester(false);
    $payload = weeklyPayload($active);
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $historic = weeklyPayload($history);
    $this->post('/asisten/jadwal', $historic)->assertRedirect();
    User::factory()->create(['user_type' => 'participant', 'status' => 'inactive']);
    User::factory()->create(['user_type' => 'assistant', 'status' => 'active'])->delete();
    $this->get('/asisten/jadwal')->assertInertia(fn (Assert $page) => $page
        ->component('Assistant/Schedule/Index')
        ->where('selectedSemesterId', $active->id)
        ->has('schedules', 1)
        ->where('schedules.0.semester_id', $active->id)
        ->where('schedules.0.day', 'Senin')
        ->where('schedules.0.shift', $payload['shift'])
        ->has('schedules.0.assistants.0', fn (Assert $user) => $user->has('id')->has('name')->missing('email'))
        ->has('schedules.0.groups.0', fn (Assert $group) => $group->has('id')->where('number', 1)->has('members', 3)
            ->has('members.0', fn (Assert $user) => $user->has('id')->has('name')->has('nim')->missing('email')))
        ->has('assistants', 3)->has('participants', 6)->has('semesters', 2)
        ->where('days', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'])
        ->has('shifts', 4));
    $this->get('/asisten/jadwal?semester_id='.$history->id)->assertInertia(fn (Assert $page) => $page
        ->where('selectedSemesterId', $history->id)->has('schedules', 1)->where('schedules.0.semester_id', $history->id));
    $this->getJson('/asisten/jadwal?semester_id=999999')->assertUnprocessable();
});

it('rolls back a failed replacement after its old groups were removed', function () {
    $payload = weeklyPayload(weeklySemester());
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $schedule = WeeklySchedule::sole();
    $oldGroupId = $schedule->groups->sole()->id;
    $replacement = weeklyPayload($schedule->semester);
    $replacement['day'] = 'Sabtu';
    WeeklyScheduleGroup::creating(function () {
        throw ValidationException::withMessages(['groups' => 'Simulated failure during write']);
    });
    try {
        $this->putJson('/asisten/jadwal/'.$schedule->id, $replacement)->assertUnprocessable();
        expect($schedule->fresh()->day)->toBe('Senin')
            ->and($schedule->fresh()->assistants->modelKeys())->toBe($payload['assistant_ids'])
            ->and($schedule->fresh()->groups->sole()->id)->toBe($oldGroupId)
            ->and($schedule->fresh()->groups->sole()->members->modelKeys())->toBe($payload['groups'][0]['participant_ids'])
            ->and($schedule->fresh()->groups->sole()->schedule->id)->toBe($schedule->id);
    } finally {
        WeeklyScheduleGroup::flushEventListeners();
    }
});

it('accepts every canonical day and the maximum assistant group member counts', function ($day) {
    $payload = weeklyPayload(weeklySemester());
    $payload['day'] = $day;
    $payload['assistant_ids'] = User::factory()->count(5)->create(['user_type' => 'assistant', 'status' => 'active'])->modelKeys();
    $payload['groups'] = collect(range(1, 5))->map(fn ($number) => ['number' => $number, 'participant_ids' => User::factory()->count(4)->create(['user_type' => 'participant', 'status' => 'active'])->modelKeys()])->all();
    $this->post('/asisten/jadwal', $payload)->assertRedirect();
    $this->assertDatabaseCount('weekly_schedule_groups', 5);
    $this->assertDatabaseCount('weekly_schedule_group_member', 20);
    $this->assertDatabaseCount('weekly_schedule_assistant', 5);
})->with(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);

it('shows an empty state when no semester exists', function () {
    $this->get('/asisten/jadwal')->assertInertia(fn (Assert $page) => $page
        ->where('selectedSemesterId', null)->has('semesters', 0)->has('schedules', 0));
});

it('rejects anonymous management requests', function () {
    auth()->logout();
    $this->get('/asisten/jadwal')->assertRedirect();
    $this->postJson('/asisten/jadwal', [])->assertUnauthorized();
    $this->putJson('/asisten/jadwal/1', [])->assertUnauthorized();
    $this->deleteJson('/asisten/jadwal/1')->assertUnauthorized();
});

it('enforces the semester day shift uniqueness at database level', function () {
    $semester = weeklySemester();
    WeeklySchedule::create(['semester_id' => $semester->id, 'day' => 'Senin', 'shift' => 'Shift 1 (06:30 - 09:30)']);
    expect(fn () => WeeklySchedule::create(['semester_id' => $semester->id, 'day' => 'Senin', 'shift' => 'Shift 1 (06:30 - 09:30)']))->toThrow(UniqueConstraintViolationException::class);
});
