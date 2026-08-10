<?php

declare(strict_types = 1);

use App\Enum\Roles;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the edit form with the target user data', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->get(route('users.edit', $target))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/edit')
            ->where('user.id', $target->id)
            ->has('roles'));
});

it('includes the current role of the edited user even when not assignable', function(): void {
    // MANAGER (70) não pode atribuir ADMIN (90), mas o cargo atual do usuário
    // editado precisa aparecer selecionado no formulário.
    actingAsUserWithRole(Roles::MANAGER);
    $target = userWithRole(Roles::ADMIN);

    $this->get(route('users.edit', $target))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/edit')
            ->has('roles', 3));
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->get(route('users.edit', $target))->assertForbidden();
});
