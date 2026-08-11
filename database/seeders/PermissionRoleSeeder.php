<?php

declare(strict_types = 1);

namespace Database\Seeders;

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class PermissionRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [];

        // Cria/atualiza roles
        foreach (Roles::cases() as $role) {
            $roles[$role->value] = Role::updateOrCreate(
                ['name' => $role->value],
                ['label' => $role->label(), 'priority' => $role->priority()]
            );
        }

        $permissions = [];

        // Cria/atualiza permissions
        foreach (Permissions::cases() as $permission) {
            $permissions[$permission->value] = Permission::updateOrCreate(
                ['name' => $permission->value],
                ['label' => $permission->label()]
            );
        }

        $allPermissions = array_keys($permissions);

        $rolePermissions = [
            // SUPER_USER - Todas as permissões
            Roles::SUPER_USER->value => $allPermissions,

            // ADMIN - Todas exceto IMPERSONATE_USERS
            Roles::ADMIN->value => array_filter($allPermissions, fn($perm) => $perm !== Permissions::IMPERSONATE_USERS->value),

            // MANAGER - Gestão de usuários da equipe, sem tocar em papéis/permissões
            Roles::MANAGER->value => [
                Permissions::MANAGE_USERS->value,
                Permissions::ASSIGN_ROLES->value,
            ],

            // VIEWER - Somente leitura (sem permissões de gestão)
            Roles::VIEWER->value => [],

            // VISITOR - Nenhuma permissão (fallback de revokeRole)
            Roles::VISITOR->value => [],
        ];

        // Vincula permissões às roles
        foreach ($rolePermissions as $role => $perms) {
            $roles[$role]
                ->permissions()
                ->sync(array_map(fn($perm) => $permissions[$perm]->id, $perms));
        }

        // Este seeder é o caminho documentado para reeditar a matriz, e
        // `hasPermissionTo()` lê `user:{id}:permissions` com rememberForever.
        // Rodado avulso (`db:seed --class=`), sem isto um usuário de um cargo
        // alterado manteria indefinidamente a permissão que acabou de perder.
        // Num banco recém-criado é no-op.
        User::query()->pluck('id')->each(
            fn(int $id): bool => Cache::forget(User::permissionCacheKey($id))
        );
    }
}
