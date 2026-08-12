<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Permission;
use App\Models\Role;
use App\Services\ImpersonationService;
use Database\Seeders\PermissionRoleSeeder;
use Illuminate\Support\Facades\Gate;

/*
|--------------------------------------------------------------------------
| Teto de concessão: "você não dá o que você não tem"
|--------------------------------------------------------------------------
|
| O boilerplate tem três caminhos que concedem permissão e só um deles
| perguntava se o ator tem aquilo para dar:
|
| - `PUT /permissions/roles/{role}` (permissões de um CARGO) — tinha o teto;
| - `POST users/{user}/permissions/grant` (avulsa) — teto vazio na prática,
|   porque o FormRequest exige `super_user`;
| - `POST /users/{user}/sync-permissions` (individuais) — não tinha teto
|   nenhum: autorizava por `mutatePermissions` e sincronizava sem olhar o
|   conteúdo.
|
| O `PermissionRoleSeeder` tira `impersonate_users` do `admin` de propósito.
| Pelo sync, o `admin` gravava essa permissão num `manager` — e pela tela de
| Cargos a mesma tentativa era 403.
|
| Não é escalada de privilégio: `sync()` grava IDs sem pivot, então o `meta`
| fica nulo, `canImpersonateAny()` é falso, e o gerente assim promovido só
| alcança prioridade < 70 — que o admin já alcançava trocando a senha de quem
| está abaixo de 90. O que se conserta aqui é a matriz do seeder ser
| contornável por procuração, e o sistema responder duas coisas diferentes
| para a mesma pergunta.
|
*/

// region O teto sozinho, sem as outras duas condições

it('forbids granting through the sync path a permission the actor does not have', function(): void {
    /*
     * O caso que discrimina ESTA condição: o admin tem `manage_permissions` e
     * supera o gerente (90 > 70), então permissão e prioridade passam. O único
     * motivo de negar é o conteúdo do payload.
     */
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertForbidden();

    expect($target->fresh()?->permissions()->count())->toBe(0);
});

it('allows granting through the sync path what the actor does hold', function(): void {
    // O outro lado: sem isto, o teto poderia ser um bloqueio geral e os dois
    // testes acima/abaixo continuariam verdes.
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::MANAGE_USERS->value],
    ])->assertRedirect()->assertInertiaFlash('success');

    expect($target->fresh()?->permissions()->pluck('name')->all())
        ->toBe([Permissions::MANAGE_USERS->value]);
});

it('counts the direct permissions of the actor as part of their own surface', function(): void {
    /*
     * A superfície do ator é cargo + avulsas, não só o cargo. Um gerente que
     * recebeu `impersonate_users` na mão pode repassá-la; medir só pelo cargo
     * o barraria.
     */
    $actor = actingAsUserWithRole(Roles::MANAGER);
    $actor->givePermissionTo(Permissions::MANAGE_PERMISSIONS);
    $actor->givePermissionTo(Permissions::IMPERSONATE_USERS);

    $target = userWithRole(Roles::VIEWER);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertRedirect()->assertInertiaFlash('success');

    expect($target->fresh()?->permissions()->pluck('name')->all())
        ->toBe([Permissions::IMPERSONATE_USERS->value]);
});

it('lets a super user compose anything', function(): void {
    // Mesma exceção do `UpdateController`: o suporte monta qualquer conjunto.
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertRedirect()->assertInertiaFlash('success');

    expect($target->fresh()?->permissions()->pluck('name')->all())
        ->toBe([Permissions::IMPERSONATE_USERS->value]);
});

it('lets a super user compose beyond their own trimmed role', function(): void {
    /*
     * O caso que discrimina o bypass do `super_user` — sem ele o teste acima
     * continua verde, porque na matriz do seeder o suporte já tem tudo e o teto
     * nunca morde nele.
     *
     * A situação é alcançável pelo painel: `UpdateControllerTest` prova que o
     * super_user pode APARAR o próprio cargo, guardando só `manage_roles`.
     * Depois disso ele precisa seguir montando qualquer conjunto — é o cargo de
     * suporte, e o contrário o trancaria fora do que ele acabou de largar.
     */
    test()->seed(PermissionRoleSeeder::class);

    Role::query()->where('name', Roles::SUPER_USER->value)->firstOrFail()
        ->permissions()->sync(Permission::getIdsFromNames([
            Permissions::MANAGE_USERS->value,
            Permissions::MANAGE_PERMISSIONS->value,
        ]));

    // O ator nasce DEPOIS da poda: nada de cargo memoizado nem cache quente.
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertRedirect()->assertInertiaFlash('success');

    expect($target->fresh()?->permissions()->pluck('name')->all())
        ->toBe([Permissions::IMPERSONATE_USERS->value]);
});

// endregion
// region O eixo da impersonação — quem manda é o humano, não a persona

it('reads the ceiling from the impersonator, not from the persona', function(): void {
    /*
     * O caso de escalada: a persona (super_user) tem tudo, o humano por trás
     * (admin) não tem `impersonate_users`. Medir na persona transformaria
     * vestir alguém num caminho para conceder o que a matriz nega.
     */
    $admin   = actingAsUserWithRole(Roles::ADMIN);
    $persona = userWithRole(Roles::SUPER_USER);
    $target  = userWithRole(Roles::MANAGER);

    app(ImpersonationService::class)->start($admin, $persona);
    test()->actingAs($persona);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertForbidden();

    expect($target->fresh()?->permissions()->count())->toBe(0);
});

it('lets the human behind the persona grant what the persona could not', function(): void {
    // O inverso do mesmo eixo: impersonar não pode virar forma de PERDER
    // acesso. O super_user vestindo um admin continua concedendo como
    // super_user.
    $superUser = actingAsSuperUser();
    $persona   = userWithRole(Roles::ADMIN);
    $target    = userWithRole(Roles::MANAGER);

    app(ImpersonationService::class)->start($superUser, $persona);
    test()->actingAs($persona);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertRedirect()->assertInertiaFlash('success');

    expect($target->fresh()?->permissions()->pluck('name')->all())
        ->toBe([Permissions::IMPERSONATE_USERS->value]);
});

// endregion
// region O que NÃO é concessão

it('does not treat a revoke as a grant', function(): void {
    /*
     * Tirar acesso nunca escala. Se o teto olhasse o alvo em vez do payload, o
     * admin ficaria impedido de LIMPAR uma permissão que ele mesmo não tem —
     * exatamente o contrário do que se quer.
     */
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);
    $target->givePermissionTo(Permissions::IMPERSONATE_USERS);

    $this->delete(route('users.permissions.revoke', [
        'user'       => $target,
        'permission' => Permissions::IMPERSONATE_USERS->value,
    ]))->assertRedirect();

    expect($target->fresh()?->permissions()->count())->toBe(0);
});

it('does not treat clearing every permission as a grant', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);
    $target->givePermissionTo(Permissions::IMPERSONATE_USERS);

    $this->post(route('user.sync-permissions', $target), ['permissions' => []])
        ->assertRedirect()->assertInertiaFlash('success');

    expect($target->fresh()?->permissions()->count())->toBe(0);
});

it('blocks an edit that carries along a permission the actor cannot grant', function(): void {
    /*
     * Decisão registrada, não acidente: o teto olha o PAYLOAD INTEIRO, igual ao
     * do `UpdateController`. Consequência aceita — enquanto o gerente segurar
     * uma permissão que o admin não tem, o admin não edita as permissões dele
     * pelo formulário (que reenvia a lista completa); só limpar, ou pedir a um
     * super_user. Uma regra por delta deixaria o mesmo formulário reafirmar o
     * que o ator não pode dar, e o sistema voltaria a ter duas respostas.
     */
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);
    $target->givePermissionTo(Permissions::IMPERSONATE_USERS);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [
            Permissions::MANAGE_USERS->value,
            Permissions::IMPERSONATE_USERS->value,
        ],
    ])->assertForbidden();

    expect($target->fresh()?->permissions()->pluck('name')->all())
        ->toBe([Permissions::IMPERSONATE_USERS->value]);
});

// endregion
// region A recusa precisa dizer o que travou

it('names the offending permission in the denial', function(): void {
    /*
     * Sem o nome, a tela devolve 403 e a pessoa não tem como saber QUAL caixa
     * derrubou o save — o catálogo oferece todas as permissões, aqui e na tela
     * de Cargos.
     */
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);

    $response = Gate::inspect('mutatePermissions', [
        $target,
        [Permissions::MANAGE_USERS->value, Permissions::IMPERSONATE_USERS->value],
    ]);

    expect($response->allowed())->toBeFalse()
        ->and(str_contains($response->message() ?? '', Permissions::IMPERSONATE_USERS->label()))
        ->toBe(true, 'A recusa deveria nomear a permissão que o ator não tem')
        ->and(str_contains($response->message() ?? '', Permissions::MANAGE_USERS->label()))
        ->toBe(false, 'A recusa não deveria nomear o que o ator tem');
});

// endregion
// region O caminho avulso continua funcionando

it('still lets a super user grant an individual permission', function(): void {
    // Guarda de regressão do argumento novo em `users.permissions.grant`: o
    // FormRequest de lá exige super_user, então o teto é vazio na prática — o
    // que não pode é o caminho quebrar.
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('users.permissions.grant', $target), [
        'permission' => Permissions::IMPERSONATE_USERS->value,
    ])->assertRedirect();

    expect($target->fresh()?->hasPermissionTo(Permissions::IMPERSONATE_USERS))->toBeTrue();
});

// endregion
