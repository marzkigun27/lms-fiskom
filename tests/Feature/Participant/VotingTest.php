<?php

use App\Models\Semester;
use App\Models\User;
use App\Models\VoteCategory;
use App\Models\VotePeriod;
use Carbon\Carbon;

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

    $this->assistant = User::factory()->assistant()->create(['name' => 'Kak Budi Santoso']);
    $this->participant = User::factory()->participant()->create();

    $this->period = VotePeriod::create([
        'semester_id' => $this->semester->id,
        'title' => 'Pemilihan Asisten Terbaik',
        'opens_at' => Carbon::now()->subDay(),
        'closes_at' => Carbon::now()->addDays(5),
        'status' => 'active',
        'created_by' => $this->assistant->id,
    ]);

    $this->category = VoteCategory::create([
        'vote_period_id' => $this->period->id,
        'name' => 'Asisten Terbaik',
        'order_number' => 1,
        'is_active' => true,
    ]);
});

test('participant can view voting page with dynamic categories', function () {
    $response = $this->actingAs($this->participant)->get(route('participant.voting'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Participant/Voting')
        ->has('categories', 1)
        ->where('categories.0.name', 'Asisten Terbaik')
        ->where('period.is_ongoing', true)
    );
});

test('participant can submit votes during active period', function () {
    $response = $this->actingAs($this->participant)->post(route('participant.voting.submit'), [
        'votes' => [
            $this->category->id => $this->assistant->id,
        ],
    ]);

    $response->assertSessionHasNoErrors();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('votes', [
        'vote_period_id' => $this->period->id,
        'vote_category_id' => $this->category->id,
        'voter_id' => $this->participant->id,
        'assistant_id' => $this->assistant->id,
    ]);
});

test('participant cannot submit votes when voting period is closed', function () {
    $this->period->update([
        'status' => 'closed',
    ]);

    $response = $this->actingAs($this->participant)->post(route('participant.voting.submit'), [
        'votes' => [
            $this->category->id => $this->assistant->id,
        ],
    ]);

    $response->assertSessionHasErrors(['voting']);
    $this->assertDatabaseMissing('votes', [
        'voter_id' => $this->participant->id,
    ]);
});
