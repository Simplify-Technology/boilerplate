<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\PermissionCatalogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

final class ShowUserPermissionsController extends Controller
{
    public function __construct(
        private readonly PermissionCatalogService $permissionCatalog
    ) {
    }

    public function __invoke(Request $request, User $user): Response
    {
        Gate::authorize('managePermissions', $user);

        $user->load(['role.permissions', 'permissions']);

        return Inertia::render('users/permissions', [
            'user' => new UserResource($user),
            // Mesmo catálogo da tela de cargos: o `PermissionCard` é o mesmo
            // componente, e a decisão de dar um acesso avulso é a mesma decisão.
            'all_permissions' => $this->permissionCatalog->forDisplay(),
        ]);
    }
}
