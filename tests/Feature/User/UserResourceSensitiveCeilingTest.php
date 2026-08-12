<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\User;
use App\Services\ImpersonationService;

/*
|--------------------------------------------------------------------------
| Teto de PII do UserResource
|--------------------------------------------------------------------------
|
| O teto de autoridade do RBAC começava em `update()`: `viewAny()`/`view()`
| eram `manage_users` puro. Só que o `UserResource` devolvia `cpf_cnpj`,
| `phone`, `mobile` e `user_notes` sem condicional nenhuma, e `manage_users`
| vai para `manager` (70) na matriz do seeder.
|
| Resultado medido antes desta fatia: um gerente abria `/users` e lia o CPF, os
| telefones e as notas internas do administrador (90) em claro. Mutação estava
| travada; leitura tinha ficado de fora.
|
| A régua vive na policy (`viewSensitive`), não no resource — um só lugar
| responde "quem manda em quem", e ele já resolve o ator REAL por trás de uma
| impersonation.
|
*/

/** Devolve a linha de `$alvo` dentro da prop `users` da listagem. */
function linhaDaListagem(User $alvo): array
{
    $resposta = test()->get(route('users.index'));

    $resposta->assertOk();

    $linhas = collect($resposta->viewData('page')['props']['users'])
        ->firstWhere('id', $alvo->id);

    expect($linhas)->not->toBeNull("O alvo #{$alvo->id} não apareceu na listagem");

    return $linhas;
}

it('hides the sensitive fields of someone the viewer does not outrank', function(): void {
    $admin = userWithRole(Roles::ADMIN);
    actingAsUserWithRole(Roles::MANAGER);

    $linha = linhaDaListagem($admin);

    expect($linha['cpf_cnpj'])->not->toBe($admin->cpf_cnpj)
        ->and($linha['cpf_cnpj'])->toStartWith('***.***.***-')
        ->and($linha['phone'])->toBeNull()
        ->and($linha['mobile'])->toBeNull()
        ->and($linha['user_notes'])->toBeNull();
});

it('keeps the masked cpf recognizable by its last two digits', function(): void {
    // Mascarar em vez de omitir é decisão de UX: o operador precisa reconhecer
    // a linha. Se virar `null`, esta asserção cai e a decisão volta à mesa.
    $admin = userWithRole(Roles::ADMIN);
    actingAsUserWithRole(Roles::MANAGER);

    expect(linhaDaListagem($admin)['cpf_cnpj'])->toBe('***.***.***-' . substr((string) $admin->cpf_cnpj, -2));
});

it('shows the sensitive fields of someone the viewer outranks', function(): void {
    $manager = userWithRole(Roles::MANAGER);
    actingAsUserWithRole(Roles::ADMIN);

    $linha = linhaDaListagem($manager);

    expect($linha['cpf_cnpj'])->toBe($manager->cpf_cnpj)
        ->and($linha['phone'])->toBe($manager->phone)
        ->and($linha['mobile'])->toBe($manager->mobile)
        ->and($linha['user_notes'])->toBe($manager->user_notes);
});

it('always shows the viewer their own sensitive fields', function(): void {
    $eu = actingAsUserWithRole(Roles::MANAGER);

    $linha = linhaDaListagem($eu);

    expect($linha['cpf_cnpj'])->toBe($eu->cpf_cnpj)
        ->and($linha['phone'])->toBe($eu->phone)
        ->and($linha['user_notes'])->toBe($eu->user_notes);
});

it('lets a super user see everyone', function(): void {
    $admin = userWithRole(Roles::ADMIN);
    actingAsUserWithRole(Roles::SUPER_USER);

    expect(linhaDaListagem($admin)['cpf_cnpj'])->toBe($admin->cpf_cnpj);
});

it('measures the ceiling on the real human, not on the impersonated persona', function(): void {
    /*
     * O ponto mais fácil de errar: quem manda é o humano por trás da sessão.
     * Um admin vestindo um gerente continua enxergando como admin — senão
     * impersonar viraria uma forma de PERDER acesso, e o inverso (persona
     * acima do humano) viraria escada.
     */
    $admin   = actingAsUserWithRole(Roles::ADMIN);
    $persona = userWithRole(Roles::MANAGER);
    $alvo    = userWithRole(Roles::MANAGER);

    // O alvo é PAR da persona (70 × 70): sozinha, ela não passaria do teto.
    // Quem passa é o admin (90) por trás dela.
    app(ImpersonationService::class)->start($admin, $persona);
    test()->actingAs($persona);

    expect(linhaDaListagem($alvo)['cpf_cnpj'])
        ->toBe($alvo->cpf_cnpj, 'O admin por trás da persona deveria continuar vendo');
});

it('does not let a persona see what the human behind it cannot', function(): void {
    // O outro lado do mesmo eixo, e o que importa para segurança: vestir uma
    // persona ALTA não pode virar escada para quem está embaixo.
    $manager = actingAsUserWithRole(Roles::MANAGER);
    $persona = userWithRole(Roles::ADMIN);
    $alvo    = userWithRole(Roles::ADMIN);

    app(ImpersonationService::class)->start($manager, $persona);
    test()->actingAs($persona);

    expect(linhaDaListagem($alvo)['cpf_cnpj'])
        ->toStartWith('***.***.***-', 'O gerente por trás da persona não alcança um admin');
});

it('does not let "myself" be read on the persona instead of the human', function(): void {
    /*
     * Nascido da passada de mutação: trocar `effectiveActor($user)->id` por
     * `$user->id` na regra de "a si mesmo" passava verde com os testes acima,
     * e é escalada — um gerente vestindo um administrador leria o CPF DESSE
     * administrador, porque a persona é o próprio alvo.
     */
    $manager = actingAsUserWithRole(Roles::MANAGER);
    $persona = userWithRole(Roles::ADMIN);

    app(ImpersonationService::class)->start($manager, $persona);
    test()->actingAs($persona);

    expect(linhaDaListagem($persona)['cpf_cnpj'])
        ->toStartWith('***.***.***-', 'A persona não é "si mesmo" para quem a veste');
});

it('denies the sensitive view to whoever lacks manage_users', function(): void {
    // Redundante com o 403 da rota hoje, e de propósito: se um dia o resource
    // for servido por uma tela sem `can:manage_users`, a policy segura.
    $alvo   = userWithRole(Roles::MANAGER);
    $viewer = actingAsUserWithRole(Roles::VIEWER);

    expect($viewer->can('viewSensitive', $alvo))->toBeFalse();
});

it('requires manage_users even when the actor outranks the target', function(): void {
    /*
     * Também nascido da mutação: apagar a checagem de `manage_users` passava
     * verde, porque o único caso negativo que havia (viewer 10 × manager 70)
     * já era barrado pela prioridade. O caso que separa as duas condições é um
     * ator SEM a permissão e ACIMA do alvo — `viewer` (10) sobre `visitor` (5).
     */
    $alvo   = userWithRole(Roles::VISITOR);
    $viewer = actingAsUserWithRole(Roles::VIEWER);

    expect($viewer->can('viewSensitive', $alvo))->toBeFalse();
});
