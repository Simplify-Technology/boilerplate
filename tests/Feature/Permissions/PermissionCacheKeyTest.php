<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Illuminate\Support\Facades\Cache;

/*
 * A chave `user:{id}:permissions` estava escrita à mão em sete pontos, com o
 * dono dela `private` no trait. O que garante que todos apontam para o mesmo
 * lugar é isto: se alguém voltar a escrever a string literal e o formato mudar,
 * a invalidação vira no-op silencioso — e permissão removida sobrevive ao
 * `rememberForever`.
 */

it('exposes one key builder that every invalidation point can reach', function(): void {
    $user = userWithRole(Roles::MANAGER);

    expect(User::permissionCacheKey($user->id))->toBe("user:{$user->id}:permissions");
});

it('drops the cached permissions when the role changes through the panel', function(): void {
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    // Aquece o cache como uma navegação real faria.
    expect($target->hasPermissionTo(Permissions::MANAGE_USERS))->toBeTrue()
        ->and(Cache::has(User::permissionCacheKey($target->id)))->toBeTrue();

    $this->post(route('user.assign-role', $target), ['role' => Roles::VIEWER->value])
        ->assertSessionHas('success');

    expect(Cache::has(User::permissionCacheKey($target->id)))->toBeFalse()
        ->and($target->fresh()?->hasPermissionTo(Permissions::MANAGE_USERS))->toBeFalse();
});

it('drops the cached permissions when the role matrix changes', function(): void {
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    expect($target->hasPermissionTo(Permissions::MANAGE_USERS))->toBeTrue();

    $this->put(route('roles-permissions.update', ['role' => Roles::MANAGER->value]), [
        'permissions' => [Permissions::ASSIGN_ROLES->value],
    ])->assertSessionHas('success');

    expect(Cache::has(User::permissionCacheKey($target->id)))->toBeFalse()
        ->and($target->fresh()?->hasPermissionTo(Permissions::MANAGE_USERS))->toBeFalse();
});

it('drops the cached permissions when the seeder is run on its own', function(): void {
    // `db:seed --class=PermissionRoleSeeder` é o caminho documentado para
    // reeditar a matriz. Sem invalidar, mudava o pivô e deixava o
    // `rememberForever` intacto: a permissão removida sobrevivia.
    $target = userWithRole(Roles::MANAGER);

    expect($target->hasPermissionTo(Permissions::MANAGE_USERS))->toBeTrue()
        ->and(Cache::has(User::permissionCacheKey($target->id)))->toBeTrue();

    $this->seed(PermissionRoleSeeder::class);

    expect(Cache::has(User::permissionCacheKey($target->id)))->toBeFalse();
});
