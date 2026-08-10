<?php

namespace App\Http\Controllers\PermissionRole;

use App\Enum\Roles as RolesEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\PermissionRole\UpdateRolePermissionsRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;

class UpdateController extends Controller
{
    public function __invoke(UpdateRolePermissionsRequest $request, string $roleName): RedirectResponse
    {
        $allowedRoleNames = array_map(
            static fn(RolesEnum $role) => $role->value,
            RolesEnum::cases()
        );

        abort_unless(in_array($roleName, $allowedRoleNames, true), 404);

        $role = Role::where('name', $roleName)->firstOrFail();

        $permissionNames = $request->validated('permissions', []);

        $role->permissions()->sync(Permission::getIdsFromNames($permissionNames));

        Cache::forget("role:$role->id:permissions");
        Cache::rememberForever("role:$role->id:permissions", fn() => $role->permissions()->pluck('name')->toArray());

        $invalidatedUserCount = 0;

        User::query()
            ->where('role_id', $role->id)
            ->select('id')
            ->orderBy('id')
            ->chunkById(500, function($users) use (&$invalidatedUserCount): void {
                foreach ($users as $user) {
                    Cache::forget("user:$user->id:permissions");
                    Cache::forget("user:$user->id:roles");
                    $invalidatedUserCount++;
                }
            });

        return redirect()->back()->with('success', "Permissões de {$role->label} atualizadas com sucesso!");
    }
}
