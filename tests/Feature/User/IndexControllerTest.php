<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the users index for a user with manage_users', function(): void {
    actingAsSuperUser();
    guestUser();

    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/index')
            ->has('users')
            ->has('roles')
            ->has('assignableRoles')
            ->has('filters')
            ->has('pagination.total'));
});

it('filters users by search term', function(): void {
    actingAsSuperUser();
    User::factory()->create(['name' => 'Fulano Procurado', 'is_active' => true]);
    User::factory()->create(['name' => 'Outro Usuário', 'is_active' => true]);

    $this->get(route('users.index', ['search' => 'Fulano Procurado']))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/index')
            ->has('users', 1)
            ->where('users.0.name', 'Fulano Procurado')
            ->where('filters.search', 'Fulano Procurado'));
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);

    $this->get(route('users.index'))->assertForbidden();
});

it('redirects guests to the login page', function(): void {
    $this->get(route('users.index'))->assertRedirect(route('login'));
});
