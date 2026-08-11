<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoleResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\RoleFilterService;
use App\Support\Listing\ListQueryNormalizer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class IndexController extends Controller
{
    public function __construct(
        private readonly RoleFilterService $roleFilterService
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()->with(['role', 'permissions']);

        // Busca por nome, email ou celular
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filtro por role
        if ($request->filled('role_id')) {
            $roleId = is_numeric($request->role_id) ? (int) $request->role_id : null;

            if ($roleId) {
                $query->where('role_id', $roleId);
            }
        }

        // Filtro por status ativo
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // Filtro por permissões individuais
        if ($request->filled('has_individual_permissions')) {
            $hasPermissions = filter_var($request->has_individual_permissions, FILTER_VALIDATE_BOOLEAN);

            if ($hasPermissions) {
                $query->has('permissions');
            }
        }

        // Ordenação — campo E direção vêm da URL, então os dois são normalizados
        // antes de tocar o builder (direção fora de asc/desc faz orderBy lançar).
        $allowedSortFields = ['name', 'email', 'created_at', 'updated_at'];

        $sortBy    = ListQueryNormalizer::sortField($request->get('sort_by'), $allowedSortFields, 'created_at');
        $sortOrder = ListQueryNormalizer::direction($request->get('sort_order'));

        $query->orderBy($sortBy, $sortOrder);

        // Paginação — com piso e teto, senão ?per_page=999999 puxa a tabela inteira
        $perPage = ListQueryNormalizer::perPage($request->get('per_page'));
        $users   = $query->paginate($perPage)->withQueryString();

        // Para o filtro, usa roles visíveis baseado no usuário atual da sessão
        // Isso fornece UX realista durante impersonação
        $visibleRoles = $this->roleFilterService->getVisibleRolesForCurrentSession($request->user());

        // Para atribuição de roles, usa roles atribuíveis (com prioridade menor)
        // Isso garante que apenas roles que podem ser atribuídas apareçam no componente AssignRoleUser
        $assignableRoles = $this->roleFilterService->getAssignableRolesForCurrentSession($request->user());

        // Inclui os cargos atuais dos usuários na lista se não estiverem presentes
        // Isso garante que o cargo atual apareça selecionado no modal de atribuição
        $userRoleIds = collect($users->items())->pluck('role_id')->filter()->unique();

        foreach ($userRoleIds as $roleId) {
            if (!$assignableRoles->contains('id', $roleId)) {
                $role = \App\Models\Role::find($roleId);

                if ($role) {
                    $assignableRoles->push($role);
                }
            }
        }

        // Usa roles visíveis para o filtro (pode incluir o próprio role do usuário)
        $roles = RoleResource::toArrayCollection($visibleRoles, $request);

        // Roles atribuíveis para o componente de atribuição de cargo
        $assignableRolesArray = RoleResource::toArrayCollection($assignableRoles, $request);

        // Build filters array only with non-empty values
        $filters = [
            'sort_by'    => $sortBy,
            'sort_order' => $sortOrder,
        ];

        if ($request->filled('search')) {
            $filters['search'] = $request->search;
        }

        if ($request->filled('role_id') && is_numeric($request->role_id)) {
            $filters['role_id'] = (int) $request->role_id;
        }

        if ($request->filled('is_active')) {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($isActive !== null) {
                $filters['is_active'] = $isActive;
            }
        }

        if ($request->filled('has_individual_permissions')) {
            $hasPermissions = filter_var($request->has_individual_permissions, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($hasPermissions !== null) {
                $filters['has_individual_permissions'] = $hasPermissions;
            }
        }

        return Inertia::render('users/index', [
            'users'           => UserResource::collection($users->items())->toArray($request),
            'roles'           => $roles,
            'assignableRoles' => $assignableRolesArray,
            'filters'         => $filters,
            'pagination'      => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
            ],
        ]);
    }
}
