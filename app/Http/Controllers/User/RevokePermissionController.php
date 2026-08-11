<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\User;
use App\Services\PermissionManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

final class RevokePermissionController extends Controller
{
    public function __construct(
        private readonly PermissionManagementService $permissionManagementService
    ) {
    }

    public function __invoke(User $user, string $permission): RedirectResponse
    {
        Gate::authorize('mutatePermissions', $user);

        $permissionModel = Permission::where('name', $permission)->firstOrFail();

        $this->permissionManagementService->revokePermissionFromUser(
            user: $user,
            permissionName: $permissionModel->name
        );

        return back()->with('success', 'Permissão revogada com sucesso.');
    }
}
