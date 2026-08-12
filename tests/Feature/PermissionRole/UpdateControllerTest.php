<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Role;
use App\Services\ImpersonationService;

it('updates the permission set of a role and redirects back with a success flash', function(): void {
    actingAsSuperUser();

    $this->from(route('role-permissions'))
        ->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
            'permissions' => [Permissions::MANAGE_USERS->value],
        ])
        ->assertRedirect(route('role-permissions'))
        ->assertInertiaFlash('success');

    $viewer = Role::query()->where('name', Roles::VIEWER->value)->firstOrFail();

    expect($viewer->permissions()->pluck('name')->all())
        ->toBe([Permissions::MANAGE_USERS->value]);
});

it('forbids a manager without manage_roles', function(): void {
    actingAsUserWithRole(Roles::MANAGER);

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
        'permissions' => [Permissions::MANAGE_USERS->value],
    ])->assertForbidden();

    $viewer = Role::query()->where('name', Roles::VIEWER->value)->firstOrFail();

    expect($viewer->permissions()->count())->toBe(0);
});

it('requires the permissions field to be present and an array', function(): void {
    actingAsSuperUser();

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [])
        ->assertSessionHasErrors(['permissions']);

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
        'permissions' => 'manage_users',
    ])->assertSessionHasErrors(['permissions']);
});

it('rejects permission names that do not exist', function(): void {
    actingAsSuperUser();

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
        'permissions' => ['made_up_permission'],
    ])->assertSessionHasErrors(['permissions.0']);
});

/*
 * `can:manage_roles` responde "pode mexer em cargo?", nunca "pode mexer NESTE
 * cargo, com ESTAS permissões?". Como é esta mesma tela que distribui
 * `manage_roles`, proteger só pela matriz seria proteger com a chave dentro da
 * fechadura.
 */

it('forbids an admin from editing their own role', function(): void {
    // O seeder tira impersonate_users do ADMIN de propósito. Com manage_roles na
    // mão, ele abria esta tela e marcava a caixa no próprio cargo.
    actingAsUserWithRole(Roles::ADMIN);

    $this->put(route('roles-permissions.update', ['role' => Roles::ADMIN->value]), [
        'permissions' => [
            Permissions::MANAGE_USERS->value,
            Permissions::IMPERSONATE_USERS->value,
        ],
    ])->assertForbidden();

    $admin = Role::query()->where('name', Roles::ADMIN->value)->firstOrFail();

    expect($admin->permissions()->pluck('name')->all())
        ->not->toContain(Permissions::IMPERSONATE_USERS->value);
});

it('forbids an admin from editing the super user role', function(): void {
    actingAsUserWithRole(Roles::ADMIN);

    $this->put(route('roles-permissions.update', ['role' => Roles::SUPER_USER->value]), [
        'permissions' => [],
    ])->assertForbidden();

    $superUser = Role::query()->where('name', Roles::SUPER_USER->value)->firstOrFail();

    expect($superUser->permissions()->count())->toBe(count(Permissions::cases()));
});

it('forbids granting a permission the actor does not have', function(): void {
    actingAsUserWithRole(Roles::ADMIN);

    $this->put(route('roles-permissions.update', ['role' => Roles::MANAGER->value]), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertForbidden();

    $manager = Role::query()->where('name', Roles::MANAGER->value)->firstOrFail();

    expect($manager->permissions()->pluck('name')->all())
        ->not->toContain(Permissions::IMPERSONATE_USERS->value);
});

it('allows an admin to edit a lower role with permissions they hold', function(): void {
    actingAsUserWithRole(Roles::ADMIN);

    $this->put(route('roles-permissions.update', ['role' => Roles::MANAGER->value]), [
        'permissions' => [Permissions::MANAGE_USERS->value],
    ])->assertRedirect()->assertInertiaFlash('success');

    $manager = Role::query()->where('name', Roles::MANAGER->value)->firstOrFail();

    expect($manager->permissions()->pluck('name')->all())
        ->toBe([Permissions::MANAGE_USERS->value]);
});

it('forbids a super user from removing manage_roles from their own role', function(): void {
    // Sem esta trava, um "desmarcar tudo" no próprio cargo trancaria a operação
    // fora do editor, com saída só por shell no servidor.
    actingAsSuperUser();

    $this->put(route('roles-permissions.update', ['role' => Roles::SUPER_USER->value]), [
        'permissions' => [Permissions::MANAGE_USERS->value],
    ])->assertForbidden();

    $superUser = Role::query()->where('name', Roles::SUPER_USER->value)->firstOrFail();

    expect($superUser->permissions()->pluck('name')->all())
        ->toContain(Permissions::MANAGE_ROLES->value);
});

it('allows a super user to trim their own role while keeping manage_roles', function(): void {
    actingAsSuperUser();

    $this->put(route('roles-permissions.update', ['role' => Roles::SUPER_USER->value]), [
        'permissions' => [
            Permissions::MANAGE_ROLES->value,
            Permissions::MANAGE_USERS->value,
        ],
    ])->assertRedirect()->assertInertiaFlash('success');

    $superUser = Role::query()->where('name', Roles::SUPER_USER->value)->firstOrFail();

    expect($superUser->permissions()->pluck('name')->sort()->values()->all())
        ->toBe([Permissions::MANAGE_ROLES->value, Permissions::MANAGE_USERS->value]);
});

it('reads the ceiling from the impersonator, not from the persona', function(): void {
    // O gerente veste o administrador: a permissão de abrir a tela vem da
    // persona, mas o que ele pode conceder continua sendo o que ELE tem.
    $manager = actingAsUserWithRole(Roles::MANAGER);
    $persona = userWithRole(Roles::ADMIN);

    app(ImpersonationService::class)->start($manager, $persona);

    $this->put(route('roles-permissions.update', ['role' => Roles::VIEWER->value]), [
        'permissions' => [Permissions::MANAGE_ROLES->value],
    ])->assertForbidden();

    $viewer = Role::query()->where('name', Roles::VIEWER->value)->firstOrFail();

    expect($viewer->permissions()->count())->toBe(0);
});
