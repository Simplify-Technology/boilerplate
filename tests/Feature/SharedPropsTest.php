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
