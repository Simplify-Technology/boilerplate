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
use Inertia\Inertia;

final class SyncPermissionsController extends Controller
{
    public function __invoke(SyncPermissionsRequest $request, User $user): RedirectResponse
    {
        Gate::authorize('mutatePermissions', $user);

        $permissionIds = Permission::getIdsFromNames($request->validated('permissions') ?? []);

        // Sync permissions (preserva metadados existentes via syncWithPivotValues se necessário)
        $user->permissions()->sync($permissionIds);

        Cache::forget(User::permissionCacheKey($user->id));

        Inertia::flash('success', 'Permissões individuais atualizadas com sucesso!');

        return redirect()
            ->back();
    }
}
