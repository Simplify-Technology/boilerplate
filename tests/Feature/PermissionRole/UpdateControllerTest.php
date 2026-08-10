<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Role;

it('updates the permission set of a role and redirects back with a success flash', function(): void {
    actingAsSuperUser();

    $this->from(route('role-permissions'))
        ->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
            'permissions' => [Permissions::MANAGE_USERS->value],
        ])
        ->assertRedirect(route('role-permissions'))
        ->assertSessionHas('success');

    $viewer = Role::query()->where('name', Roles::VIEWER->value)->firstOrFail();

    expect($viewer->permissions()->pluck('name')->all())
        ->toBe([Permissions::MANAGE_USERS->value]);
});

it('forbids a manager without manage_roles', function(): void {
    actingAsUserWithRole(Roles::MANAGER);

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
        'permissions' => [Permissions::MANAGE_USERS->value],
    ])->assertForbidden();

    $viewer = Role::query()->where('name', Roles::VIEWER->value)->firstOrFail();

    expect($viewer->permissions()->count())->toBe(0);
});

it('requires the permissions field to be present and an array', function(): void {
    actingAsSuperUser();

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [])
        ->assertSessionHasErrors(['permissions']);

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
        'permissions' => 'manage_users',
    ])->assertSessionHasErrors(['permissions']);
});

it('rejects permission names that do not exist', function(): void {
    actingAsSuperUser();

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
        'permissions' => ['made_up_permission'],
    ])->assertSessionHasErrors(['permissions.0']);
});
