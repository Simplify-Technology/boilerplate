<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the users index for a user with manage_users', function(): void {
    actingAsSuperUser();
    guestUser();

    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/index')
            ->has('users')
            ->has('roles')
            ->has('assignableRoles')
            ->has('filters')
            ->has('pagination.total'));
});

it('filters users by search term', function(): void {
    actingAsSuperUser();
    User::factory()->create(['name' => 'Fulano Procurado', 'is_active' => true]);
    User::factory()->create(['name' => 'Outro Usuário', 'is_active' => true]);

    $this->get(route('users.index', ['search' => 'Fulano Procurado']))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->component('users/index')
            ->has('users', 1)
            ->where('users.0.name', 'Fulano Procurado')
            ->where('filters.search', 'Fulano Procurado'));
});

it('forbids a user without manage_users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);

    $this->get(route('users.index'))->assertForbidden();
});

it('redirects guests to the login page', function(): void {
    $this->get(route('users.index'))->assertRedirect(route('login'));
});

/*
|--------------------------------------------------------------------------
| Ordenação e paginação vindas da URL
|--------------------------------------------------------------------------
|
| Antes desta fatia a direção ia crua para orderBy() e `per_page` não tinha
| teto: /users?sort_order=<lixo> devolvia 500 (Query\Builder lança para
| direção fora de asc/desc) e ?per_page=999999 paginava a tabela inteira.
| O eco em `filters` publica o valor NORMALIZADO — senão o lixo volta para a
| URL pelo withQueryString() e o 500 se torna compartilhável por link.
|
*/

it('sorts by an allowed field in the requested direction', function(): void {
    actingAsSuperUser()->update(['name' => 'Mmm Meio']);
    User::factory()->create(['name' => 'Aaa Primeira']);
    User::factory()->create(['name' => 'Zzz Ultima']);

    $this->get(route('users.index', ['sort_by' => 'name', 'sort_order' => 'asc']))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->where('users.0.name', 'Aaa Primeira')
            ->where('filters.sort_by', 'name')
            ->where('filters.sort_order', 'asc'));

    $this->get(route('users.index', ['sort_by' => 'name', 'sort_order' => 'desc']))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->where('users.0.name', 'Zzz Ultima'));
});

it('normalizes the case of a valid sort direction', function(): void {
    actingAsSuperUser();

    $this->get(route('users.index', ['sort_by' => 'name', 'sort_order' => 'ASC']))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->where('filters.sort_order', 'asc'));
});

it('falls back to a safe sort direction instead of failing', function(mixed $sortOrder): void {
    actingAsSuperUser();

    $this->get(route('users.index', ['sort_by' => 'name', 'sort_order' => $sortOrder]))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->where('filters.sort_order', 'desc'));
})->with([
    'lixo'          => ['ordem-aleatoria'],
    'fragmento sql' => ['asc, (select 1)'],
    'array'         => [['asc']],
    'vazio'         => [''],
]);

it('falls back to the default sort field when sort_by is not allowed', function(): void {
    actingAsSuperUser();

    $this->get(route('users.index', ['sort_by' => 'password', 'sort_order' => 'asc']))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->where('filters.sort_by', 'created_at')
            ->where('filters.sort_order', 'asc'));
});

it('caps and floors per_page', function(mixed $perPage, int $expected): void {
    actingAsSuperUser();

    $this->get(route('users.index', ['per_page' => $perPage]))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->where('pagination.per_page', $expected));
})->with([
    'acima do teto'   => [999_999, 50],
    'abaixo do piso'  => [0, 5],
    'não numérico'    => ['muitos', 15],
    'array'           => [[50], 15],
    'dentro da faixa' => [25, 25],
]);
