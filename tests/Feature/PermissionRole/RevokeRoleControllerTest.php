<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\Role;

it('revokes the role of a user, demoting them to visitor', function(): void {
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    $this->delete(route('user.revoke-role', $target))
        ->assertRedirect()
        ->assertSessionHas('success');

    $visitorRoleId = Role::query()->where('name', Roles::VISITOR->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $visitorRoleId]);
});

it('forbids a viewer without assign_roles', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = userWithRole(Roles::MANAGER);

    $this->delete(route('user.revoke-role', $target))->assertForbidden();

    $managerRoleId = Role::query()->where('name', Roles::MANAGER->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $managerRoleId]);
});

it('rejects revoking your own role', function(): void {
    $superUser = actingAsSuperUser();

    $this->delete(route('user.revoke-role', $superUser))
        ->assertSessionHasErrors(['error']);

    $superRoleId = Role::query()->where('name', Roles::SUPER_USER->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $superUser->id, 'role_id' => $superRoleId]);
});
