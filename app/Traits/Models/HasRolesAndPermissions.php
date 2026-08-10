<?php

declare(strict_types = 1);

namespace App\Traits\Models;

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Permission;
use App\Models\PermissionUser;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

trait HasRolesAndPermissions
{
    public function hasRole(Roles|string $role): bool
    {
        if ($role instanceof Roles) {
            $role = $role->value;
        }

        return $this->role?->name === $role;
    }

    public function hasPermissionTo(Permissions|string $permission): bool
    {
        if ($permission instanceof Permissions) {
            $permission = $permission->value;
        }

        $permissions = Cache::rememberForever(
            $this->getPermissionCacheKey(),
            fn() => $this->getAllPermissions()->pluck('name')->toArray()
        );

        return in_array($permission, $permissions, true);
    }

    private function getPermissionCacheKey(): string
    {
        return "user:$this->id:permissions";
    }

    /**
     * @return Collection<int, Permission>
     */
    public function getAllPermissions(): Collection
    {
        $rolePermissions = $this->role->permissions ?? collect();

        return $rolePermissions
            ->merge($this->permissions)
            ->unique('id');
    }

    public function assignRole(Roles|string $role): void
    {
        $role = Role::where('name', $role)->firstOrFail();
        $this->update(['role_id' => $role->id]);

        $this->refreshPermissionsCache();
    }

    private function refreshPermissionsCache(): void
    {
        // As relations podem estar memoizadas de antes da mutação (assignRole/
        // givePermissionTo); recomputar sem descartá-las gravaria no cache
        // forever as permissões do papel antigo.
        $this->unsetRelation('role');
        $this->unsetRelation('permissions');

        Cache::forget($this->getPermissionCacheKey());
        Cache::rememberForever(
            $this->getPermissionCacheKey(),
            fn() => $this->getAllPermissions()->pluck('name')->toArray()
        );
    }

    public function revokeRole(): void
    {
        $visitorRole = Role::where('name', Roles::VISITOR->value)->firstOrFail();
        $this->update(['role_id' => $visitorRole->id]);

        $this->refreshPermissionsCache();
    }

    /**
     * @param array<string, mixed> $meta
     */
    public function givePermissionTo(Permissions|string $permission, array $meta = []): void
    {
        $permissionValue = $permission instanceof Permissions ? $permission->value : $permission;
        $permissionModel = Permission::firstOrCreate(['name' => $permissionValue]);

        $existing = $this->permissions()
            ->where('permission_id', $permissionModel->id)
            ->exists();

        if ($existing) {
            $this->permissions()->updateExistingPivot($permissionModel->id, [
                'meta'       => $meta === [] ? null : json_encode($meta),
                'updated_at' => now(),
            ]);
        } else {
            $this->permissions()->attach($permissionModel->id, [
                'meta'       => $meta === [] ? null : json_encode($meta),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->refreshPermissionsCache();
    }

    /**
     * @return BelongsToMany<Permission, $this, PermissionUser>
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class)
            ->using(PermissionUser::class)
            ->withPivot('meta', 'created_at', 'updated_at')
            ->withTimestamps();
    }

    public function revokePermissionTo(string $permission): void
    {
        $permission = Permission::where('name', $permission)->first();

        if ($permission) {
            $this->permissions()->detach($permission->id);
            $this->refreshPermissionsCache();
        }
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getPermissionMeta(Permissions|string $permission): ?array
    {
        $permissionValue = $permission instanceof Permissions ? $permission->value : $permission;

        $permissionModel = $this->permissions()
            ->where('name', $permissionValue)
            ->first();

        if (!$permissionModel || !$permissionModel->pivot->meta) {
            return null;
        }

        return json_decode($permissionModel->pivot->meta, true);
    }

    public function canImpersonateAny(): bool
    {
        // SUPER_USER can always impersonate anyone
        if ($this->hasRole(Roles::SUPER_USER)) {
            return true;
        }

        $meta = $this->getPermissionMeta(Permissions::IMPERSONATE_USERS);

        return $meta['can_impersonate_any'] ?? false;
    }

    public function canImpersonate(User $targetUser): bool
    {
        if ($this->id === $targetUser->id) {
            return false;
        }

        if (!$targetUser->is_active) {
            return false;
        }

        if (!$this->hasPermissionTo(Permissions::IMPERSONATE_USERS)) {
            return false;
        }

        if ($this->canImpersonateAny()) {
            return true;
        }

        $myPriority     = $this->role?->getPriority()       ?? 0;
        $targetPriority = $targetUser->role?->getPriority() ?? 0;

        return $targetPriority < $myPriority;
    }

    public function getCustomPermissionsCount(): int
    {
        return $this->permissions()->count();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function getCustomPermissionsList(): array
    {
        return $this->permissions()
            ->get()
            ->map(function($permission) {
                return [
                    'name'  => $permission->name,
                    'label' => $permission->label,
                    'meta'  => $permission->pivot->meta ? json_decode($permission->pivot->meta, true) : null,
                ];
            })
            ->toArray();
    }
}
