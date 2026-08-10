<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the permissions page with the full permission catalog', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->get(route('users.permissions.show', $target))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/permissions')
            ->where('user.id', $target->id)
            ->has('all_permissions', count(Permissions::cases())));
});

it('forbids a manager without manage_permissions', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = guestUser();

    $this->get(route('users.permissions.show', $target))->assertForbidden();
});

it('forbids a viewer without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->get(route('users.permissions.show', $target))->assertForbidden();
});
