<?php

declare(strict_types = 1);

use App\Enum\Roles;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the user profile page', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->get(route('users.show', $target))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/show')
            ->where('user.id', $target->id)
            ->where('user.email', $target->email)
            ->has('roles'));
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->get(route('users.show', $target))->assertForbidden();
});

it('returns 404 for a missing user', function(): void {
    actingAsSuperUser();

    $this->get(route('users.show', 999999))->assertNotFound();
});
