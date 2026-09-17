<?php

use App\Models\User;

it('redirects guests away from protected role areas', function () {
    $this->get(route('assistant.dashboard'))->assertRedirect(route('login.praktikan'));
    $this->get(route('assistant.soal.index'))->assertRedirect(route('login.praktikan'));
    $this->get(route('participant.dashboard'))->assertRedirect(route('login.praktikan'));
});

it('allows a participant only into participant routes', function () {
    $user = User::factory()->participant()->create();

    $this->actingAs($user)->get(route('participant.dashboard'))->assertOk();
    $this->actingAs($user)->get(route('assistant.dashboard'))->assertForbidden();
    $this->actingAs($user)->get(route('assistant.soal.index'))->assertForbidden();
});

it('gives assistants access to assistant and management routes', function () {
    $user = User::factory()->assistant()->create();

    $this->actingAs($user)->get(route('assistant.dashboard'))->assertOk();
    $this->actingAs($user)->get(route('participant.dashboard'))->assertForbidden();
    $this->actingAs($user)->get(route('assistant.soal.index'))->assertOk();
    $this->actingAs($user)->get(route('assistant.soal.index'))->assertOk();
});

it('registers an assistant when the assistant registration flow is selected', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'New Assistant',
        'email' => 'assistant-new@example.com',
        'identity_number' => 'AST-NEW-001',
        'register_type' => 'asisten',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertRedirect('/asisten');
    $user = User::where('email', 'assistant-new@example.com')->firstOrFail();

    expect($user->user_type)->toBe('assistant')
        ->and($user->hasRole('assistant'))->toBeTrue();
});
