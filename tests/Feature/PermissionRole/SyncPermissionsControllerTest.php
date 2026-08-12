<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;

it('replaces the direct permissions of a user', function(): void {
    actingAsSuperUser();
    $target = guestUser();
    $target->givePermissionTo(Permissions::MANAGE_USERS->value);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::ASSIGN_ROLES->value],
    ])
        ->assertRedirect()
        ->assertInertiaFlash('success');

    expect($target->fresh()->permissions()->pluck('name')->all())
        ->toBe([Permissions::ASSIGN_ROLES->value]);
});

it('clears every direct permission when the list is empty', function(): void {
    actingAsSuperUser();
    $target = guestUser();
    $target->givePermissionTo(Permissions::MANAGE_USERS->value);

    $this->post(route('user.sync-permissions', $target), ['permissions' => []])
        ->assertRedirect();

    expect($target->fresh()->permissions()->count())->toBe(0);
});

it('forbids a manager without manage_permissions', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = guestUser();

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::ASSIGN_ROLES->value],
    ])->assertForbidden();

    expect($target->fresh()->permissions()->count())->toBe(0);
});

it('rejects permission names that do not exist', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => ['made_up_permission'],
    ])->assertSessionHasErrors(['permissions.0']);

    expect($target->fresh()->permissions()->count())->toBe(0);
});
