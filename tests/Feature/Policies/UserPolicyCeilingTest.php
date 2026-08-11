<?php

declare(strict_types = 1);

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Role;

/*
 * Teto de autoridade do RBAC: `manage_users` sozinho não basta — o alvo precisa
 * ter prioridade ESTRITAMENTE menor que a do ator real. Sem isso o gerente (70)
 * excluía o administrador (90), e dois administradores eram pares agindo um
 * sobre o outro (troca de e-mail e senha = tomada de conta).
 */

// region Alvo de prioridade IGUAL

it('forbids an admin from updating another admin', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::ADMIN);

    $this->put(route('users.update', $target), [
        'name'  => 'Sequestrado',
        'email' => 'sequestrado@example.com',
    ])->assertForbidden();

    $this->assertDatabaseMissing('users', ['id' => $target->id, 'name' => 'Sequestrado']);
});

it('forbids an admin from deleting another admin', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::ADMIN);

    $this->delete(route('users.destroy', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id]);
});

it('forbids an admin from deactivating another admin', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::ADMIN);

    $this->patch(route('users.toggle-active', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id, 'is_active' => true]);
});

// endregion
// region Alvo de prioridade MAIOR

it('forbids a manager from updating an admin', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = userWithRole(Roles::ADMIN);

    $this->put(route('users.update', $target), [
        'name'  => 'Sequestrado',
        'email' => 'sequestrado@example.com',
    ])->assertForbidden();

    $this->assertDatabaseMissing('users', ['id' => $target->id, 'name' => 'Sequestrado']);
});

it('forbids a manager from deleting an admin', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = userWithRole(Roles::ADMIN);

    $this->delete(route('users.destroy', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id]);
});

it('forbids a manager from deactivating an admin', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = userWithRole(Roles::ADMIN);

    $this->patch(route('users.toggle-active', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id, 'is_active' => true]);
});

// endregion
// region O teto não trava o caminho legítimo

it('allows an admin to delete a manager', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);

    $this->delete(route('users.destroy', $target))
        ->assertRedirect(route('users.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});

it('allows a super user to delete another super user', function(): void {
    actingAsSuperUser();
    $target = userWithRole(Roles::SUPER_USER);

    $this->delete(route('users.destroy', $target))
        ->assertRedirect(route('users.index'))
        ->assertSessionHas('success');

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});

it('keeps reading the permission matrix open, including for users above the actor', function(): void {
    // Só a MUTAÇÃO ganha teto: quem administra usuários precisa enxergar o que
    // cada conta pode fazer, inclusive contas acima da sua.
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::SUPER_USER);

    $this->get(route('users.permissions.show', $target))->assertOk();
});

// endregion
// region Mutação de permissões individuais

it('forbids an admin from granting themselves the permission the seeder denies', function(): void {
    // O PermissionRoleSeeder tira impersonate_users do ADMIN de propósito. Sem
    // o alvo na policy, o ADMIN se auto-concedia a permissão pelo sync.
    $admin = actingAsUserWithRole(Roles::ADMIN);

    $this->post(route('user.sync-permissions', $admin), [
        'permissions' => [Permissions::IMPERSONATE_USERS->value],
    ])->assertForbidden();

    expect($admin->fresh()?->hasPermissionTo(Permissions::IMPERSONATE_USERS))->toBeFalse();
});

it('forbids an admin from mutating the permissions of a super user', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::SUPER_USER);
    $target->givePermissionTo(Permissions::IMPERSONATE_USERS);

    $this->post(route('user.sync-permissions', $target), ['permissions' => []])
        ->assertForbidden();

    $this->delete(route('users.permissions.revoke', [
        'user'       => $target,
        'permission' => Permissions::IMPERSONATE_USERS->value,
    ]))->assertForbidden();

    expect($target->fresh()?->permissions()->count())->toBe(1);
});

it('allows an admin to mutate the permissions of a manager', function(): void {
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('user.sync-permissions', $target), [
        'permissions' => [Permissions::MANAGE_PERMISSIONS->value],
    ])->assertRedirect()->assertSessionHas('success');

    expect($target->fresh()?->permissions()->pluck('name')->all())
        ->toBe([Permissions::MANAGE_PERMISSIONS->value]);
});

// endregion
// region Cargo do alvo (assign / revoke)

it('forbids a manager from demoting an admin through assign-role', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target      = userWithRole(Roles::ADMIN);
    $adminRoleId = $target->role_id;

    // `viewer` está entre os cargos que o gerente pode atribuir — o que a
    // validação antiga olhava. O que faltava era olhar o cargo ATUAL do alvo.
    $this->post(route('user.assign-role', $target), ['role' => Roles::VIEWER->value])
        ->assertSessionHasErrors(['error']);

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $adminRoleId]);
});

it('forbids a manager from demoting an admin through revoke-role', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target      = userWithRole(Roles::ADMIN);
    $adminRoleId = $target->role_id;

    $this->delete(route('user.revoke-role', $target))
        ->assertSessionHasErrors(['error']);

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $adminRoleId]);
});

it('allows a manager to demote a viewer', function(): void {
    actingAsUserWithRole(Roles::MANAGER);
    $target = userWithRole(Roles::VIEWER);

    $this->delete(route('user.revoke-role', $target))
        ->assertRedirect()
        ->assertSessionHas('success');

    $visitorRoleId = Role::query()->where('name', Roles::VISITOR->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $visitorRoleId]);
});

// endregion
// region Impersonação não é escada

it('does not lend the persona authority to the impersonator', function(): void {
    // O gerente veste o administrador — mas o teto continua sendo o do humano
    // por trás da sessão, senão impersonar seria o caminho para subir.
    $manager = actingAsUserWithRole(Roles::MANAGER);
    $manager->givePermissionTo(Permissions::IMPERSONATE_USERS, ['can_impersonate_any' => true]);

    $persona = userWithRole(Roles::ADMIN);
    $target  = userWithRole(Roles::MANAGER);

    $this->post(route('users.impersonate', $persona))->assertRedirect(route('dashboard'));

    $this->delete(route('users.destroy', $target))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $target->id]);
});

it('lets a real admin do what the impersonating manager could not', function(): void {
    // Contraprova do teste acima: o mesmo alvo, o mesmo cargo de ator — só que
    // sem impersonação no meio.
    actingAsUserWithRole(Roles::ADMIN);
    $target = userWithRole(Roles::MANAGER);

    $this->delete(route('users.destroy', $target))
        ->assertRedirect(route('users.index'));

    $this->assertDatabaseMissing('users', ['id' => $target->id]);
});

it('forbids the impersonator from deleting their own account through the persona', function(): void {
    $manager = actingAsUserWithRole(Roles::MANAGER);
    $manager->givePermissionTo(Permissions::IMPERSONATE_USERS, ['can_impersonate_any' => true]);

    $persona = userWithRole(Roles::ADMIN);

    $this->post(route('users.impersonate', $persona))->assertRedirect(route('dashboard'));

    $this->delete(route('users.destroy', $manager))->assertForbidden();

    $this->assertDatabaseHas('users', ['id' => $manager->id]);
});

// endregion
