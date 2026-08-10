<?php

declare(strict_types = 1);

use App\Enum\Roles;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the create form with the assignable roles', function(): void {
    actingAsSuperUser();

    // SUPER_USER pode atribuir todos os cargos do enum.
    $this->get(route('users.create'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/create')
            ->has('roles', count(Roles::cases())));
});

it('only offers roles below the priority of the acting user', function(): void {
    actingAsUserWithRole(Roles::MANAGER);

    // MANAGER (70) só enxerga VIEWER (10) e VISITOR (5).
    $this->get(route('users.create'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/create')
            ->has('roles', 2));
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);

    $this->get(route('users.create'))->assertForbidden();
});
