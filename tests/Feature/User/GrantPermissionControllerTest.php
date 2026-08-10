<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;

it('grants a direct permission to a user', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->post(route('users.permissions.grant', $target), [
        'permission' => Permissions::ASSIGN_ROLES->value,
    ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(
        $target->fresh()->permissions()->where('name', Permissions::ASSIGN_ROLES->value)->exists()
    )->toBeTrue();
});

it('stores the can_impersonate_any meta when granting impersonation', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->post(route('users.permissions.grant', $target), [
        'permission'          => Permissions::IMPERSONATE_USERS->value,
        'can_impersonate_any' => true,
    ])->assertRedirect();

    expect($target->fresh()->getPermissionMeta(Permissions::IMPERSONATE_USERS))
        ->toBe(['can_impersonate_any' => true]);
});

it('forbids an admin (non super user) from granting direct permissions', function(): void {
    // ADMIN tem manage_permissions, mas o GrantPermissionRequest exige SUPER_USER.
    actingAsUserWithRole(Roles::ADMIN);
    $target = guestUser();

    $this->post(route('users.permissions.grant', $target), [
        'permission' => Permissions::ASSIGN_ROLES->value,
    ])->assertForbidden();

    expect(
        $target->fresh()->permissions()->where('name', Permissions::ASSIGN_ROLES->value)->exists()
    )->toBeFalse();
});

it('validates that the permission exists', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->post(route('users.permissions.grant', $target), [
        'permission' => 'made_up_permission',
    ])->assertSessionHasErrors(['permission']);

    $this->post(route('users.permissions.grant', $target), [])
        ->assertSessionHasErrors(['permission']);
});
