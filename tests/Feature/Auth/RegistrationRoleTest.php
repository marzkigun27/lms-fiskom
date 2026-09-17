<?php

use App\Models\User;

it('provides explicit synchronized role factory states', function () {
    $participant = User::factory()->participant()->create();
    $assistant = User::factory()->assistant()->create();
    $assistantLead = User::factory()->assistant()->create();

    expect($participant->hasRole('participant'))->toBeTrue()
        ->and($assistant->hasRole('assistant'))->toBeTrue()
        ->and($assistantLead->user_type)->toBe('assistant')
        ->and($assistantLead->hasRole('assistant'))->toBeTrue();
});
