<?php

declare(strict_types = 1);

namespace App\Services;

use App\Enum\Permissions;
use App\Models\Permission;

/**
 * O catálogo de permissões como as telas de RBAC precisam dele: na ordem em que
 * o enum declara, com o label e a descrição vindos do enum, e **só** o que
 * existe no banco.
 *
 * As duas pontas importam. O enum é a fonte de verdade do texto — mudar uma
 * palavra passa a valer na hora, sem esperar `permissions:sync`. Mas o banco é
 * quem decide o que pode ser marcado: `UpdateRolePermissionsRequest` valida com
 * `exists:permissions,name`, então oferecer um caso do enum ainda não semeado
 * seria oferecer uma caixa que o save recusa.
 */
final class PermissionCatalogService
{
    /**
     * @return list<array{name: string, label: string, description: string}>
     */
    public function forDisplay(): array
    {
        $stored = Permission::query()->pluck('name')->flip();

        return collect(Permissions::cases())
            ->filter(fn(Permissions $case): bool => $stored->has($case->value))
            ->map(fn(Permissions $case): array => [
                'name'        => $case->value,
                'label'       => $case->label(),
                'description' => $case->description(),
            ])
            ->values()
            ->all();
    }
}
