<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\Role;

it('assigns a role to a user and redirects back with a success flash', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->post(route('user.assign-role', $target), [
        'role' => Roles::MANAGER->value,
    ])
        ->assertRedirect()
        ->assertInertiaFlash('success');

    $managerRoleId = Role::query()->where('name', Roles::MANAGER->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $managerRoleId]);
});

it('forbids a viewer without assign_roles', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->post(route('user.assign-role', $target), [
        'role' => Roles::MANAGER->value,
    ])->assertForbidden();
});

it('rejects assigning a role with priority above the acting user', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = guestUser();

    $visitorRoleId = $target->role_id;

    $this->post(route('user.assign-role', $target), [
        'role' => Roles::ADMIN->value,
    ])->assertSessionHasErrors(['error']);

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $visitorRoleId]);
});

it('rejects changing your own role', function(): void {
    $superUser = actingAsSuperUser();

    $this->post(route('user.assign-role', $superUser), [
        'role' => Roles::ADMIN->value,
    ])->assertSessionHasErrors(['error']);
});

it('validates that the role is in the enum allowlist', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->post(route('user.assign-role', $target), ['role' => 'made_up_role'])
        ->assertSessionHasErrors(['role']);

    $this->post(route('user.assign-role', $target), [])
        ->assertSessionHasErrors(['role']);
});
