<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature roda contra o app com banco limpo por teste. Unit e Arch usam o
| TestCase base do PHPUnit — testes de Unit que precisem do app bootado
| (ex.: CpfHasherTest usa config()) declaram `uses(Tests\TestCase::class)`
| no próprio arquivo.
|
*/

pest()->extend(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| Helpers de persona. Todos criam usuários reais via factory com um cargo do
| PermissionRoleSeeder — as permissões vêm do pivot permission_role, exatamente
| como em produção. O seeder roda sob demanda (idempotente por causa do
| RefreshDatabase), então os testes não precisam de beforeEach próprio.
|
*/

/**
 * Cria um usuário ativo e verificado com o cargo informado, sem autenticar.
 */
function userWithRole(Roles $role): User
{
    if (!Role::query()->where('name', $role->value)->exists()) {
        test()->seed(PermissionRoleSeeder::class);
    }

    return User::factory()->create([
        'is_active' => true,
        'role_id'   => Role::query()->where('name', $role->value)->firstOrFail()->id,
    ]);
}

/**
 * Autentica um usuário com o cargo informado e o retorna.
 */
function actingAsUserWithRole(Roles $role): User
{
    $user = userWithRole($role);

    test()->actingAs($user);

    return $user;
}

/**
 * Autentica um SUPER_USER (todas as permissões do seeder) e o retorna.
 */
function actingAsSuperUser(): User
{
    return actingAsUserWithRole(Roles::SUPER_USER);
}

/**
 * Cria um usuário sem nenhuma permissão (cargo VISITOR), SEM autenticar.
 * Útil como alvo de gestão em testes de CRUD.
 */
function guestUser(): User
{
    return userWithRole(Roles::VISITOR);
}
