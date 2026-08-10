<?php

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/*
 * Contract: `roles-permissions.update` expects `permissions` as an array of permission **names**.
 * These tests cover real-world updates (clear + swap to another non-empty set) and ensure only
 * users of the affected role have their per-user permission cache invalidated.
 */

test('updating role permissions invalidates affected users caches but not unaffected users', function() {
    Cache::flush();

    $manageUsers = Permission::create([
        'name'  => 'manage_users',
        'label' => 'Manage Users',
    ]);

    $manageRoles = Permission::create([
        'name'  => 'manage_roles',
        'label' => 'Manage Roles',
    ]);

    $role = Role::create([
        'name'     => 'manager',
        'label'    => 'Manager',
        'priority' => 10,
    ]);

    $role->permissions()->attach($manageUsers->id);

    $adminRole = Role::create([
        'name'     => 'admin_for_test',
        'label'    => 'Admin (Test)',
        'priority' => 99,
    ]);

    $adminRole->permissions()->attach($manageRoles->id);

    $user = User::factory()->create([
        'role_id'   => $role->id,
        'is_active' => true,
    ]);

    $admin = User::factory()->create([
        'role_id'   => $adminRole->id,
        'is_active' => true,
    ]);

    expect($user->hasPermissionTo('manage_users'))->toBeTrue();
    expect(Cache::has("user:{$user->id}:permissions"))->toBeTrue();

    expect($admin->hasPermissionTo('manage_roles'))->toBeTrue();
    expect(Cache::has("user:{$admin->id}:permissions"))->toBeTrue();

    $this->actingAs($admin)
        ->put(route('roles-permissions.update', [
            'role' => $role->name,
        ]), [
            'permissions' => [],
        ])
        ->assertRedirect();

    expect(Cache::has("user:{$user->id}:permissions"))->toBeFalse();
    expect(Cache::has("user:{$admin->id}:permissions"))->toBeTrue();

    $userAfterFirstUpdateCacheReprime = User::query()->findOrFail($user->id);

    expect($userAfterFirstUpdateCacheReprime->hasPermissionTo('manage_users'))->toBeFalse();
    expect(Cache::has("user:{$userAfterFirstUpdateCacheReprime->id}:permissions"))->toBeTrue();

    $this->actingAs($admin)
        ->put(route('roles-permissions.update', [
            'role' => $role->name,
        ]), [
            'permissions' => [$manageRoles->name],
        ])
        ->assertRedirect();

    expect(Cache::has("user:{$userAfterFirstUpdateCacheReprime->id}:permissions"))->toBeFalse();
    expect(Cache::has("user:{$admin->id}:permissions"))->toBeTrue();

    $userAfterSecondUpdate = User::query()->findOrFail($user->id);
    expect($userAfterSecondUpdate->hasPermissionTo('manage_users'))->toBeFalse();
    expect($userAfterSecondUpdate->hasPermissionTo('manage_roles'))->toBeTrue();
    expect(Cache::has("user:{$userAfterSecondUpdate->id}:permissions"))->toBeTrue();
});

test('invalid permissions payload does not change role permissions or invalidate caches', function() {
    Cache::flush();

    $manageUsers = Permission::create([
        'name'  => 'manage_users',
        'label' => 'Manage Users',
    ]);

    $manageRoles = Permission::create([
        'name'  => 'manage_roles',
        'label' => 'Manage Roles',
    ]);

    $role = Role::create([
        'name'     => 'manager',
        'label'    => 'Manager',
        'priority' => 10,
    ]);

    $role->permissions()->attach($manageUsers->id);

    $adminRole = Role::create([
        'name'     => 'admin_for_test',
        'label'    => 'Admin (Test)',
        'priority' => 99,
    ]);

    $adminRole->permissions()->attach($manageRoles->id);

    $user = User::factory()->create([
        'role_id'   => $role->id,
        'is_active' => true,
    ]);

    $admin = User::factory()->create([
        'role_id'   => $adminRole->id,
        'is_active' => true,
    ]);

    expect($user->hasPermissionTo('manage_users'))->toBeTrue();
    expect(Cache::has("user:{$user->id}:permissions"))->toBeTrue();

    expect($admin->hasPermissionTo('manage_roles'))->toBeTrue();
    expect(Cache::has("user:{$admin->id}:permissions"))->toBeTrue();

    $this->actingAs($admin)
        ->put(route('roles-permissions.update', [
            'role' => $role->name,
        ]), [
            'permissions' => [$manageRoles->id],
        ])
        ->assertRedirect()
        ->assertSessionHasErrors(['permissions.0']);

    expect(Cache::has("user:{$user->id}:permissions"))->toBeTrue();
    expect(Cache::has("user:{$admin->id}:permissions"))->toBeTrue();

    $role->refresh();
    expect($role->permissions()->pluck('name')->toArray())->toBe(['manage_users']);

    $this->actingAs($admin)
        ->put(route('roles-permissions.update', [
            'role' => $role->name,
        ]), [
            'permissions' => ['non_existent_permission'],
        ])
        ->assertRedirect()
        ->assertSessionHasErrors(['permissions.0']);

    expect(Cache::has("user:{$user->id}:permissions"))->toBeTrue();
    expect(Cache::has("user:{$admin->id}:permissions"))->toBeTrue();

    $role->refresh();
    expect($role->permissions()->pluck('name')->toArray())->toBe(['manage_users']);
});

test('cannot update permissions for a legacy role not present in Roles enum allowlist', function() {
    Cache::flush();

    $manageRoles = Permission::create([
        'name'  => 'manage_roles',
        'label' => 'Manage Roles',
    ]);

    $legacyRole = Role::create([
        'name'     => 'legacy_role_not_allowed',
        'label'    => 'Legacy (Not Allowed)',
        'priority' => 1,
    ]);

    $adminRole = Role::create([
        'name'     => 'admin_for_test',
        'label'    => 'Admin (Test)',
        'priority' => 99,
    ]);

    $adminRole->permissions()->attach($manageRoles->id);

    $admin = User::factory()->create([
        'role_id'   => $adminRole->id,
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->put(route('roles-permissions.update', [
            'role' => $legacyRole->name,
        ]), [
            'permissions' => [],
        ])
        ->assertNotFound();
});
