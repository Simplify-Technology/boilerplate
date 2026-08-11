<?php

declare(strict_types = 1);

use App\Enum\Roles;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the create form with the assignable roles', function(): void {
    actingAsSuperUser();

    // SUPER_USER pode atribuir todos os cargos selecionáveis do enum — todos
    // menos VISITOR, que só se alcança por "Remover cargo".
    $this->get(route('users.create'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/create')
            ->has('roles', count(selectableRoles())));
});

it('only offers roles below the priority of the acting user', function(): void {
    actingAsUserWithRole(Roles::MANAGER);

    // MANAGER (70) enxerga VIEWER (10); VISITOR (5) está abaixo dele, mas não é
    // selecionável.
    $this->get(route('users.create'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/create')
            ->has('roles', 1)
            ->where('roles.0.name', Roles::VIEWER->value));
});

it('never offers visitor in the role selector', function(): void {
    // Rebaixar alguém tem ação com nome e log próprios; oferecer "Visitante" no
    // mesmo seletor seriam dois caminhos para a mesma coisa, um deles sem rastro.
    actingAsSuperUser();

    $this->get(route('users.create'))
        ->assertOk()
        ->assertInertia(function(Assert $page): void {
            $names = array_column($page->toArray()['props']['roles'], 'name');

            expect($names)->not->toContain(Roles::VISITOR->value);
        });
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);

    $this->get(route('users.create'))->assertForbidden();
});
