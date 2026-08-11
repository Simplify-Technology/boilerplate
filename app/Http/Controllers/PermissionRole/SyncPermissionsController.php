<?php

declare(strict_types = 1);

namespace App\Http\Controllers\PermissionRole;

use App\Http\Controllers\Controller;
use App\Http\Requests\PermissionRole\SyncPermissionsRequest;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;

final class SyncPermissionsController extends Controller
{
    public function __invoke(SyncPermissionsRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('mutatePermissions', $user);

        $permissionIds = Permission::getIdsFromNames($request->validated('permissions') ?? []);

        // Sync permissions (preserva metadados existentes via syncWithPivotValues se necessário)
        $user->permissions()->sync($permissionIds);

        Cache::forget("user:$user->id:permissions");

        return redirect()
            ->back()
            ->with('success', 'Permissões individuais atualizadas com sucesso!');
    }
}
