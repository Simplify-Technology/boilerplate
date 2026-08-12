<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;

it('revokes a direct permission from a user', function(): void {
    actingAsSuperUser();
    $target = guestUser();
    $target->givePermissionTo(Permissions::ASSIGN_ROLES->value);

    $this->delete(route('users.permissions.revoke', [
        'user'       => $target,
        'permission' => Permissions::ASSIGN_ROLES->value,
    ]))
        ->assertRedirect()
        ->assertInertiaFlash('success');

    expect(
        $target->fresh()->permissions()->where('name', Permissions::ASSIGN_ROLES->value)->exists()
    )->toBeFalse();
});

it('forbids a manager without manage_permissions', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = guestUser();
    $target->givePermissionTo(Permissions::ASSIGN_ROLES->value);

    $this->delete(route('users.permissions.revoke', [
        'user'       => $target,
        'permission' => Permissions::ASSIGN_ROLES->value,
    ]))->assertForbidden();

    expect(
        $target->fresh()->permissions()->where('name', Permissions::ASSIGN_ROLES->value)->exists()
    )->toBeTrue();
});

it('returns 404 for an unknown permission name', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->delete(route('users.permissions.revoke', [
        'user'       => $target,
        'permission' => 'made_up_permission',
    ]))->assertNotFound();
});
