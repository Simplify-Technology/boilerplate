<?php

namespace App\Http\Controllers\PermissionRole;

use App\Enum\Roles as RolesEnum;
use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Http\Resources\UserResource;
use App\Services\PermissionCatalogService;
use App\Services\RoleFilterService;
use Illuminate\Http\Request;
use Inertia\Response;

class IndexController extends Controller
{
    public function __construct(
        private readonly RoleFilterService $roleFilterService,
        private readonly PermissionCatalogService $permissionCatalog
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $this->authorize('manage_roles');

        // Filtra roles visíveis baseado no usuário atual da sessão
        // Usa getVisibleRolesForCurrentSession() para fornecer UX realista durante impersonação
        $visibleRoles = $this->roleFilterService->getVisibleRolesForCurrentSession($request->user());

        // Para atribuição de roles, usa roles atribuíveis (com prioridade menor)
        $assignableRoles = $this->roleFilterService->getAssignableRolesForCurrentSession($request->user());

        $roles = $visibleRoles
            ->load(['permissions', 'users'])
            ->mapWithKeys(function($role) {
                return [
                    $role->name => [
                        'id'    => $role->id,
                        'label' => $role->label ?? $role->name,
                        // A descrição é do enum, não do banco: `roles` não tem
                        // coluna para ela, e o enum é a fonte de verdade do RBAC.
                        'description' => RolesEnum::tryFrom($role->name)?->description() ?? '',
                        'permissions' => $role->permissions->pluck('label', 'name'),
                        'users'       => UserResource::collection($role->users->keyBy->id),
                    ],
                ];
            });

        // Prepara roles atribuíveis para o componente AssignRoleUser usando RoleResource
        $assignableRolesArray = RoleResource::toArrayCollection($assignableRoles, $request);

        return inertia('permission-role/roles', [
            'roles'           => $roles,
            'assignableRoles' => $assignableRolesArray,
            'permissions'     => $this->permissionCatalog->forDisplay(),
        ]);
    }
}
