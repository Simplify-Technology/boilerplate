<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

beforeEach(function(): void {
    Cache::flush();
    $this->seed(PermissionRoleSeeder::class);
});

test('assignRole refreshes the cache even when the role relation was already loaded', function(): void {
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole(Roles::ADMIN->value);

    // Memoiza a relation role E o cache de permissões com o papel de admin.
    expect($user->hasRole(Roles::ADMIN))->toBeTrue();
    expect($user->hasPermissionTo('manage_users'))->toBeTrue();

    // Rebaixa com a relation antiga ainda carregada na instância.
    $user->assignRole(Roles::VISITOR->value);

    expect($user->hasPermissionTo('manage_users'))->toBeFalse();
    expect($user->fresh()->hasPermissionTo('manage_users'))->toBeFalse();
});

test('revokeRole refreshes the cache even when the role relation was already loaded', function(): void {
    $user = User::factory()->create(['is_active' => true]);
    $user->assignRole(Roles::ADMIN->value);

    expect($user->hasPermissionTo('manage_users'))->toBeTrue();

    $user->revokeRole();

    expect($user->hasPermissionTo('manage_users'))->toBeFalse();
});
