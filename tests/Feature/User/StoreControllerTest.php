<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/** Payload mínimo válido para criação de usuário (CPF de teste válido). */
function validUserPayload(array $overrides = []): array
{
    return array_merge([
        'name'                  => 'Novo Usuário',
        'email'                 => 'novo.usuario@example.com',
        'cpf_cnpj'              => '529.982.247-25',
        'password'              => 'password',
        'password_confirmation' => 'password',
        'is_active'             => true,
    ], $overrides);
}

it('creates a user, hashes the password and redirects with a success flash', function(): void {
    actingAsSuperUser();

    $managerRoleId = Role::query()->where('name', Roles::MANAGER->value)->firstOrFail()->id;

    $this->post(route('users.store'), validUserPayload(['role_id' => $managerRoleId]))
        ->assertRedirect(route('users.index'))
        ->assertSessionHas('success');

    $created = User::query()->where('email', 'novo.usuario@example.com')->firstOrFail();

    expect($created->role_id)->toBe($managerRoleId)
        ->and(Hash::check('password', $created->password))->toBeTrue();
});

it('falls back to the visitor role when no role is given', function(): void {
    actingAsSuperUser();

    $this->post(route('users.store'), validUserPayload())
        ->assertRedirect(route('users.index'));

    $visitorRoleId = Role::query()->where('name', Roles::VISITOR->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', [
        'email'   => 'novo.usuario@example.com',
        'role_id' => $visitorRoleId,
    ]);
});

it('forbids a user without manage_users from creating users', function(): void {
    actingAsUserWithRole(Roles::VIEWER);

    $this->post(route('users.store'), validUserPayload())
        ->assertForbidden();

    $this->assertDatabaseMissing('users', ['email' => 'novo.usuario@example.com']);
});

it('validates the required fields', function(): void {
    actingAsSuperUser();

    $this->post(route('users.store'), [])
        ->assertSessionHasErrors(['name', 'email', 'password']);
});

it('rejects a duplicated email', function(): void {
    actingAsSuperUser();
    $existing = guestUser();

    $this->post(route('users.store'), validUserPayload(['email' => $existing->email]))
        ->assertSessionHasErrors(['email']);
});

it('rejects an invalid cpf/cnpj', function(): void {
    actingAsSuperUser();

    $this->post(route('users.store'), validUserPayload(['cpf_cnpj' => '111.111.111-11']))
        ->assertSessionHasErrors(['cpf_cnpj']);

    $this->assertDatabaseMissing('users', ['email' => 'novo.usuario@example.com']);
});

it('rejects a role the acting user cannot assign', function(): void {
    actingAsUserWithRole(Roles::ADMIN);

    $superRoleId = Role::query()->where('name', Roles::SUPER_USER->value)->firstOrFail()->id;

    $this->post(route('users.store'), validUserPayload(['role_id' => $superRoleId]))
        ->assertSessionHasErrors(['role_id']);

    $this->assertDatabaseMissing('users', ['email' => 'novo.usuario@example.com']);
});
