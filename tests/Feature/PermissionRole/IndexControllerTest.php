<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the roles and permissions matrix for a super user', function(): void {
    actingAsSuperUser();

    $this->get(route('role-permissions'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('permission-role/roles')
            ->has('roles', count(Roles::cases()))
            ->has('assignableRoles')
            ->has('permissions', count(Permissions::cases())));
});

it('renders for an admin with manage_roles', function(): void {
    actingAsUserWithRole(Roles::ADMIN);

    $this->get(route('role-permissions'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->component('permission-role/roles'));
});

it('forbids a manager without manage_roles', function(): void {
    actingAsUserWithRole(Roles::MANAGER);

    $this->get(route('role-permissions'))->assertForbidden();
});

it('redirects guests to the login page', function(): void {
    $this->get(route('role-permissions'))->assertRedirect(route('login'));
});
