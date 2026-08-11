<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;

/*
 * Guardas de copy. Não testam comportamento — testam que o painel volta a falar
 * em quatro termos diferentes, ou a devolver inglês, sem ninguém perceber.
 */

// region Terminologia

test('permission labels use "Cargos", the single term for role', function(): void {
    expect(Permissions::MANAGE_ROLES->label())->toBe('Gerenciar Cargos')
        ->and(Permissions::ASSIGN_ROLES->label())->toBe('Atribuir Cargos');
});

test('no visible label falls back to the abandoned terms', function(): void {
    // "Papéis" e "Funções" conviviam com "Cargo" e com "Roles" em inglês cru.
    $labels = [
        ...array_map(fn(Permissions $p): string => $p->label(), Permissions::cases()),
        ...array_map(fn(Roles $r): string => $r->label(), Roles::cases()),
    ];

    foreach ($labels as $label) {
        expect($label)
            ->not->toContain('Papéis')
            ->not->toContain('Papel')
            ->not->toContain('Funções')
            ->not->toContain('Função');
    }
});

test('seeding carries the enum label into the database', function(): void {
    // As telas de RBAC passaram a ler label e descrição do enum, via
    // `PermissionCatalogService` — lá a palavra nova vale na hora. Mas a coluna
    // `permissions.label` continua sendo a fonte de outros pontos (as
    // permissões avulsas do usuário, por `getCustomPermissionsList()`), e quem
    // a atualiza é o seeder. Sem `php artisan permissions:sync`, esses pontos
    // seguem mostrando a palavra antiga.
    $this->seed(Database\Seeders\PermissionRoleSeeder::class);

    $label = App\Models\Permission::query()
        ->where('name', Permissions::MANAGE_ROLES->value)
        ->value('label');

    expect($label)->toBe(Permissions::MANAGE_ROLES->label());
});

// endregion
// region Nada de inglês vazando

test('the password reset status reaches the user in pt-BR', function(): void {
    // Vinha de `__('A reset link will be sent if the account exists.')`, chave
    // inexistente em lang/pt_BR.json — o `__()` devolvia a própria string.
    $this->post(route('password.email'), ['email' => 'ninguem@example.com'])
        ->assertSessionHas('status');

    $status = session('status');

    expect($status)
        ->toBeString()
        ->not->toContain('reset link')
        ->toContain('link de redefinição');
});

test('the uncompromised password message agrees in gender', function(): void {
    // Rendia "O senha informado… Escolha outro senha".
    $message = __('validation.password.uncompromised', ['attribute' => 'senha']);

    expect($message)
        ->toBeString()
        ->not->toContain('O senha')
        ->not->toContain('outro senha')
        ->toContain('senha');
});

// endregion
// region Impersonação em português

test('starting impersonation says it in Portuguese', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->post(route('users.impersonate', $target))
        ->assertRedirect(route('dashboard'));

    expect(session('success'))
        ->not->toContain('impersonando')
        ->toContain('usando o painel como');
});

test('refusing a second impersonation says it in Portuguese', function(): void {
    // A persona precisa ter `impersonate_users`, senão o 403 vem do middleware
    // `can:` da rota e a mensagem do controller nunca é alcançada.
    actingAsSuperUser();
    $first  = userWithRole(Roles::SUPER_USER);
    $second = guestUser();

    $this->post(route('users.impersonate', $first))->assertRedirect(route('dashboard'));

    $response = $this->post(route('users.impersonate', $second));

    $response->assertForbidden();

    expect($response->exception?->getMessage())
        ->not->toContain('impersonando')
        ->toContain('usando o painel como outra pessoa');
});

test('stopping an impersonation that never started says it in Portuguese', function(): void {
    actingAsSuperUser();

    $response = $this->delete(route('users.impersonate.stop'));

    $response->assertForbidden();

    expect($response->exception?->getMessage())
        ->not->toContain('personificando')
        ->toContain('usando o painel como outra pessoa');
});

// endregion
