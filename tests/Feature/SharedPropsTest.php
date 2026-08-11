<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use Inertia\Testing\AssertableInertia as Assert;

/*
 * `HandleInertiaRequests::share()` é a fonte única das props globais, e o que
 * sai daqui viaja em TODA navegação do painel. O espelho deste shape são os
 * tipos em resources/js/types — os dois mudam juntos.
 */

it('trava o conjunto inteiro de props globais que toda página recebe', function(): void {
    // `interacted()` é o que transforma isto num contrato: ao fechar o escopo,
    // chave que ninguém tocou falha com "Unexpected properties were found in
    // scope". Assim, chave nova no share() sem espelho em resources/js/types
    // quebra aqui.
    //
    // O `->interacted()` do fim NÃO é redundante: o AssertableInertia aplica a
    // checagem automaticamente só nos escopos aninhados (os `has()` com
    // callback). No escopo raiz ela não roda sozinha — sem esta linha, uma prop
    // global nova passa despercebida, que é exatamente o buraco que este teste
    // existe para fechar.
    //
    // `errors` não sai do share(): o middleware do Inertia injeta em toda
    // resposta. Está no contrato porque ele descreve o que a PÁGINA recebe.
    actingAsSuperUser();

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->has('errors')
            ->has('name')
            ->has('quote', fn(Assert $quote) => $quote
                ->has('message')
                ->has('author'))
            ->has('auth', fn(Assert $auth) => $auth
                ->has('user')
                ->has('permissions')
                ->has('roles')
                ->has('impersonating', fn(Assert $impersonating) => $impersonating
                    ->has('active')
                    ->has('originalUserName')
                    ->has('impersonatedUserName')))
            ->has('flash', fn(Assert $flash) => $flash
                ->has('success')
                ->has('error')
                ->has('warning')
                ->has('info'))
            ->has('ziggy')
            ->interacted());
});

it('shares only the fields the front actually reads from the authenticated user', function(): void {
    // O $hidden do model esconde só password e remember_token: compartilhar o
    // model inteiro mandava cpf_cnpj, phone, mobile e user_notes em toda página.
    $user = actingAsSuperUser();

    $user->update([
        'cpf_cnpj'   => '11144477735',
        'phone'      => '(11) 3333-4444',
        'mobile'     => '(11) 98888-7777',
        'user_notes' => 'Anotação interna sobre esta pessoa.',
    ]);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->has('auth.user', 4)
            ->where('auth.user.id', $user->id)
            ->where('auth.user.name', $user->name)
            ->where('auth.user.email', $user->email)
            ->has('auth.user.email_verified_at')
            ->missing('auth.user.cpf_cnpj')
            ->missing('auth.user.phone')
            ->missing('auth.user.mobile')
            ->missing('auth.user.user_notes')
            ->missing('auth.user.role_id')
            ->missing('auth.user.password'));
});

it('keeps publishing roles and permissions on their own keys', function(): void {
    // Cargo e permissões não vêm dentro de auth.user — o front lê auth.roles e
    // auth.permissions. Estreitar o usuário não pode ter levado isso junto.
    actingAsUserWithRole(Roles::MANAGER);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->where('auth.roles', [Roles::MANAGER->value])
            ->where('auth.permissions', [
                Permissions::MANAGE_USERS->value,
                Permissions::ASSIGN_ROLES->value,
            ]));
});
