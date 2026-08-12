<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\Role;

/*
 * `Roles::isSelectable()` tira o VISITOR do seletor de atribuir cargo — e só
 * dele. É a armadilha desta mudança: o filtro é de EXIBIÇÃO. Aplicado no
 * caminho de validação, negaria toda remoção de cargo, porque o
 * `RevokeRoleController` confere se o ator poderia atribuir `visitor` antes de
 * rebaixar.
 */

it('hides visitor from the selector but keeps every other role', function(): void {
    expect(Roles::VISITOR->isSelectable())->toBeFalse();

    foreach (Roles::cases() as $role) {
        if ($role !== Roles::VISITOR) {
            expect($role->isSelectable())->toBeTrue();
        }
    }
});

it('still lets a role be revoked, which is the trap', function(): void {
    // Se o `isSelectable()` tivesse entrado no `getAssignableRoles()`, este
    // teste falharia com "Você não tem permissão para remover este cargo!".
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    $this->delete(route('user.revoke-role', $target))
        ->assertRedirect()
        ->assertInertiaFlash('success');

    $visitorRoleId = Role::query()->where('name', Roles::VISITOR->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $visitorRoleId]);
});

it('lets a manager revoke too, the case that would break first', function(): void {
    // O gerente (70) só pode atribuir cargos abaixo dele, e o `visitor` (5) é o
    // único caminho de rebaixamento que lhe resta.
    actingAsUserWithRole(Roles::MANAGER);
    $target = userWithRole(Roles::VIEWER);

    $this->delete(route('user.revoke-role', $target))
        ->assertRedirect()
        ->assertInertiaFlash('success');

    $visitorRoleId = Role::query()->where('name', Roles::VISITOR->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $visitorRoleId]);
});

it('keeps accepting visitor when it is posted straight to assign-role', function(): void {
    // O seletor esconde, a validação não proíbe: esconder é decisão de UI, e o
    // `RoleFilterService::getAssignableRoles()` (segurança) segue enxergando.
    actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('user.assign-role', $target), ['role' => Roles::VISITOR->value])
        ->assertRedirect()
        ->assertInertiaFlash('success');

    $visitorRoleId = Role::query()->where('name', Roles::VISITOR->value)->firstOrFail()->id;

    $this->assertDatabaseHas('users', ['id' => $target->id, 'role_id' => $visitorRoleId]);
});
