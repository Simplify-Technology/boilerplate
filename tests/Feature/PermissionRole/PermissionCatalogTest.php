<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Permission;
use App\Services\PermissionCatalogService;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

/*
 * O catálogo que as duas telas de RBAC consomem. Label e descrição vêm do enum;
 * o banco decide o que pode ser marcado. As duas pontas importam, e cada uma
 * quebra de um jeito diferente.
 */

it('describes every permission and every role', function(): void {
    // Uma descrição vazia é pior que nenhuma coluna: a tela renderiza um espaço
    // em branco onde a pessoa esperava a explicação para decidir.
    foreach (Permissions::cases() as $permission) {
        expect($permission->description())->not->toBe('');
    }

    foreach (Roles::cases() as $role) {
        expect($role->description())->not->toBe('');
    }
});

it('lists permissions in the order the enum declares them', function(): void {
    // `Permission::all()` devolvia na ordem do banco, que é a de inserção do
    // seeder por acidente — nada garantia que continuasse assim.
    $this->seed(Database\Seeders\PermissionRoleSeeder::class);

    $names = array_column(app(PermissionCatalogService::class)->forDisplay(), 'name');

    expect($names)->toBe(array_map(
        fn(Permissions $case): string => $case->value,
        Permissions::cases()
    ));
});

it('takes label and description from the enum, not from the database columns', function(): void {
    // Sem isso, trocar uma palavra no enum só apareceria na tela depois de
    // `php artisan permissions:sync`.
    $this->seed(Database\Seeders\PermissionRoleSeeder::class);

    Permission::query()
        ->where('name', Permissions::MANAGE_USERS->value)
        ->update(['label' => 'Rótulo velho do banco']);

    $entry = collect(app(PermissionCatalogService::class)->forDisplay())
        ->firstWhere('name', Permissions::MANAGE_USERS->value);

    expect($entry['label'])->toBe(Permissions::MANAGE_USERS->label())
        ->and($entry['label'])->not->toBe('Rótulo velho do banco')
        ->and($entry['description'])->toBe(Permissions::MANAGE_USERS->description());
});

it('omits an enum case that is not seeded yet', function(): void {
    // O save valida com `exists:permissions,name`: oferecer uma caixa que o
    // banco ainda não conhece seria oferecer uma caixa que o save recusa.
    $this->seed(Database\Seeders\PermissionRoleSeeder::class);

    $impersonate = Permission::query()->where('name', Permissions::IMPERSONATE_USERS->value)->firstOrFail();

    // `permission_role` tem FK para as duas pontas — mesma ordem do
    // SyncPermissionsCommand ao remover uma permissão órfã.
    DB::table('permission_role')->where('permission_id', $impersonate->id)->delete();
    $impersonate->delete();

    $names = array_column(app(PermissionCatalogService::class)->forDisplay(), 'name');

    expect($names)->not->toContain(Permissions::IMPERSONATE_USERS->value)
        ->and($names)->toContain(Permissions::MANAGE_USERS->value);
});

it('ships the catalog and the role descriptions to the roles screen', function(): void {
    actingAsSuperUser();

    $this->get(route('role-permissions'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('permission-role/roles')
            ->has('permissions', count(Permissions::cases()))
            ->where('permissions.0.name', Permissions::MANAGE_USERS->value)
            ->where('permissions.0.description', Permissions::MANAGE_USERS->description())
            ->where('roles.' . Roles::MANAGER->value . '.description', Roles::MANAGER->description()));
});

it('ships the same catalog to the individual permissions screen', function(): void {
    // `PermissionCard` é o mesmo componente nas duas telas: se um dos payloads
    // ficasse para trás, uma delas renderizaria card sem descrição.
    actingAsSuperUser();
    $target = guestUser();

    $this->get(route('users.permissions.show', $target))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/permissions')
            ->has('all_permissions', count(Permissions::cases()))
            ->where('all_permissions.0.description', Permissions::MANAGE_USERS->description()));
});
