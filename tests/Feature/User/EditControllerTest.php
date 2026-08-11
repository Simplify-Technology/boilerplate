<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\Role;
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
    // Um cargo legado fora do allowlist do enum não é atribuível por ninguém,
    // nem pelo SUPER_USER — mas o cargo atual do usuário editado precisa
    // aparecer selecionado no formulário.
    actingAsSuperUser();

    $legacyRole = Role::create([
        'name'     => 'legacy_role_not_allowed',
        'label'    => 'Legado (fora do allowlist)',
        'priority' => 1,
    ]);

    $target = guestUser();
    $target->update(['role_id' => $legacyRole->id]);

    $this->get(route('users.edit', $target))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/edit')
            // Os 5 cargos do enum, atribuíveis pelo SUPER_USER, mais o legado.
            ->has('roles', 6)
            ->where('roles.5.name', $legacyRole->name));
});

it('forbids a manager from opening the edit form of an admin', function(): void {
    // MANAGER (70) tem manage_users, mas não supera ADMIN (90).
    actingAsUserWithRole(Roles::MANAGER);
    $target = userWithRole(Roles::ADMIN);

    $this->get(route('users.edit', $target))->assertForbidden();
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->get(route('users.edit', $target))->assertForbidden();
});
