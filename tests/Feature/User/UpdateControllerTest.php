<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Role;

it('updates a user and redirects to their page with a success flash', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->put(route('users.update', $target), [
        'name'  => 'Nome Atualizado',
        'email' => 'atualizado@example.com',
    ])
        ->assertRedirect(route('users.show', $target))
        ->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'id'    => $target->id,
        'name'  => 'Nome Atualizado',
        'email' => 'atualizado@example.com',
    ]);
});

it('allows a super user to move a user to another role', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $managerRoleId = Role::query()->where('name', Roles::MANAGER->value)->firstOrFail()->id;

    $this->put(route('users.update', $target), [
        'name'    => $target->name,
        'email'   => $target->email,
        'role_id' => $managerRoleId,
    ])->assertRedirect(route('users.show', $target));

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $managerRoleId]);
});

it('forbids a user without manage_users from updating anyone', function(): void {
    actingAsUserWithRole(Roles::VIEWER);
    $target = guestUser();

    $this->put(route('users.update', $target), [
        'name'  => 'Hacked',
        'email' => 'hacked@example.com',
    ])->assertForbidden();

    $this->assertDatabaseMissing('users', ['id' => $target->id, 'name' => 'Hacked']);
});

it('validates required fields, unique email and cpf/cnpj on update', function(): void {
    actingAsSuperUser();
    $other  = guestUser();
    $target = guestUser();

    $this->from(route('users.edit', $target))
        ->put(route('users.update', $target), [
            'name'     => '',
            'email'    => $other->email,
            'cpf_cnpj' => '111.111.111-11',
        ])
        ->assertRedirect(route('users.edit', $target))
        ->assertSessionHasErrors(['name', 'email', 'cpf_cnpj']);
});

it('keeps the own email valid when unchanged', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->put(route('users.update', $target), [
        'name'  => $target->name,
        'email' => $target->email,
    ])->assertSessionHasNoErrors();
});

it('rejects changing your own role', function(): void {
    $superUser = actingAsSuperUser();

    $adminRoleId = Role::query()->where('name', Roles::ADMIN->value)->firstOrFail()->id;

    $this->put(route('users.update', $superUser), [
        'name'    => $superUser->name,
        'email'   => $superUser->email,
        'role_id' => $adminRoleId,
    ])->assertSessionHasErrors(['role_id']);

    $this->assertDatabaseMissing('users', ['id' => $superUser->id, 'role_id' => $adminRoleId]);
});

it('treats an empty role select as "leave the role alone"', function(): void {
    // `role_id=''` vira null no ConvertEmptyStringsToNull e passa na regra
    // `nullable`, mas o bloco que valida troca de cargo é guardado por isset() —
    // false para null. O null ia para o update e apagava o cargo, enquanto o
    // flush de `user:{id}:permissions`, que mora dentro daquele bloco, era
    // pulado: banco sem cargo, cache rememberForever com as permissões dele.
    actingAsSuperUser();
    $target        = userWithRole(Roles::MANAGER);
    $managerRoleId = $target->role_id;

    // Aquece o cache, como qualquer navegação real do usuário faria.
    expect($target->hasPermissionTo(Permissions::MANAGE_USERS))->toBeTrue();

    $this->put(route('users.update', $target), [
        'name'    => 'Nome Novo',
        'email'   => $target->email,
        'role_id' => '',
    ])->assertRedirect(route('users.show', $target));

    $fresh = $target->fresh();

    expect($fresh?->name)->toBe('Nome Novo')
        ->and($fresh?->role_id)->toBe($managerRoleId)
        // Banco e cache continuam contando a mesma história.
        ->and($fresh?->hasPermissionTo(Permissions::MANAGE_USERS))->toBeTrue();
});

it('forbids a manager from assigning a role above their own', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = guestUser();

    $adminRoleId = Role::query()->where('name', Roles::ADMIN->value)->firstOrFail()->id;

    $this->put(route('users.update', $target), [
        'name'    => $target->name,
        'email'   => $target->email,
        'role_id' => $adminRoleId,
    ])->assertSessionHasErrors(['role_id']);

    $this->assertDatabaseMissing('users', ['id' => $target->id, 'role_id' => $adminRoleId]);
});
