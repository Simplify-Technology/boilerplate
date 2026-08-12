<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\User;
use App\Services\PermissionManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

final class RevokePermissionController extends Controller
{
    public function __construct(
        private readonly PermissionManagementService $permissionManagementService
    ) {
    }

    public function __invoke(User $user, string $permission): RedirectResponse
    {
        // Sem conjunto: revogar não concede nada, e medir o teto contra o que o
        // alvo já tem impediria o ator de LIMPAR justamente o que ele não pode
        // dar — o contrário do que se quer.
        Gate::authorize('mutatePermissions', $user);

        $permissionModel = Permission::where('name', $permission)->firstOrFail();

        $this->permissionManagementService->revokePermissionFromUser(
            user: $user,
            permissionName: $permissionModel->name
        );

        Inertia::flash('success', 'Permissão revogada com sucesso.');

        return back();
    }
}
