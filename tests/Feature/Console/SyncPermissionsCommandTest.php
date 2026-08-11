<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Illuminate\Support\Facades\Cache;

it('creates every enum role and permission missing from the database', function(): void {
    expect(Role::query()->count())->toBe(0)
        ->and(Permission::query()->count())->toBe(0);

    $this->artisan('permissions:sync')->assertSuccessful();

    foreach (Roles::cases() as $role) {
        expect(Role::query()->where('name', $role->value)->exists())->toBeTrue();
    }

    foreach (Permissions::cases() as $permission) {
        expect(Permission::query()->where('name', $permission->value)->exists())->toBeTrue();
    }

    // A matriz foi aplicada: SUPER_USER enxerga todas as permissions do enum.
    $superUser = Role::query()->where('name', Roles::SUPER_USER->value)->firstOrFail();

    expect($superUser->permissions()->pluck('name')->sort()->values()->all())
        ->toBe(collect(Permissions::cases())->map->value->sort()->values()->all());
});

it('is idempotent on a database already in sync', function(): void {
    $this->seed(PermissionRoleSeeder::class);

    $this->artisan('permissions:sync')
        ->expectsOutputToContain('Nenhum cargo ou permissão órfã a remover.')
        ->assertSuccessful();

    expect(Role::query()->count())->toBe(count(Roles::cases()))
        ->and(Permission::query()->count())->toBe(count(Permissions::cases()));
});

it('reports and removes orphan roles and permissions, reassigning their users', function(): void {
    $this->seed(PermissionRoleSeeder::class);

    $legacyRole = Role::create(['name' => 'legacy_role', 'label' => 'Legacy', 'priority' => 42]);
    $legacyPerm = Permission::create(['name' => 'legacy_permission', 'label' => 'Legacy Permission']);
    $legacyRole->permissions()->attach($legacyPerm->id);

    $orphanUser = User::factory()->create(['role_id' => $legacyRole->id, 'is_active' => true]);

    $this->artisan('permissions:sync')
        ->expectsOutputToContain('legacy_role')
        ->expectsOutputToContain('legacy_permission')
        ->expectsOutputToContain($orphanUser->email)
        ->assertSuccessful();

    expect(Role::query()->where('name', 'legacy_role')->exists())->toBeFalse()
        ->and(Permission::query()->where('name', 'legacy_permission')->exists())->toBeFalse();

    // O usuário órfão foi remanejado para o fallback (visitor), não deletado.
    $orphanUser->refresh();

    expect($orphanUser->role?->name)->toBe(Roles::VISITOR->value);
});

it('does not write anything with --dry-run', function(): void {
    $legacyRole = Role::create(['name' => 'legacy_role', 'label' => 'Legacy', 'priority' => 42]);
    $legacyPerm = Permission::create(['name' => 'legacy_permission', 'label' => 'Legacy Permission']);

    $this->artisan('permissions:sync', ['--dry-run' => true])
        ->expectsOutputToContain('legacy_role')
        ->expectsOutputToContain('Nada foi gravado (--dry-run)')
        ->assertSuccessful();

    // As órfãs seguem lá e nada do enum foi criado.
    expect(Role::query()->where('name', 'legacy_role')->exists())->toBeTrue()
        ->and(Permission::query()->where('name', 'legacy_permission')->exists())->toBeTrue()
        ->and(Role::query()->where('name', Roles::SUPER_USER->value)->exists())->toBeFalse();
});

it('invalidates the HasRolesAndPermissions per-user cache', function(): void {
    Cache::flush();
    $this->seed(PermissionRoleSeeder::class);

    $managerRole = Role::query()->where('name', Roles::MANAGER->value)->firstOrFail();
    $user        = User::factory()->create(['role_id' => $managerRole->id, 'is_active' => true]);

    // Prime o cache pelo mesmo caminho do trait.
    expect($user->hasPermissionTo(Permissions::MANAGE_USERS))->toBeTrue()
        ->and(Cache::has("user:$user->id:permissions"))->toBeTrue();

    $this->artisan('permissions:sync')->assertSuccessful();

    expect(Cache::has("user:$user->id:permissions"))->toBeFalse();
});
