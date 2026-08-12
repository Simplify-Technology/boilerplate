<?php

declare(strict_types = 1);

use App\Models\User;

it('keeps an active user session untouched', function() {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)->get('/dashboard')->assertOk();
    $this->assertAuthenticated();
});

it('logs out a user that gets deactivated mid-session', function() {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)->get('/dashboard')->assertOk();

    $user->forceFill(['is_active' => false])->save();

    $this->get('/dashboard')
        ->assertRedirect(route('login'))
        ->assertInertiaFlash('error');

    $this->assertGuest();
});

it('blocks a deactivated user from logging in at all', function() {
    $user = User::factory()->create(['is_active' => false]);

    $response = $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});
