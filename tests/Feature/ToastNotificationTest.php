<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('inertia flash toast is included in shared props', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('profile.edit'))
        ->assertOk();
});

test('session flash message maps to toast in shared props', function () {
    $user = User::factory()->create();

    session()->flash('success', 'Operation succeeded');

    $response = $this->actingAs($user)
        ->get(route('teams.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('flash.toast.type', 'success')
            ->where('flash.toast.message', 'Operation succeeded')
        );
});
