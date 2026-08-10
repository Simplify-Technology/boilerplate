<?php

declare(strict_types = 1);

namespace App\Services;

use App\Enum\Roles as RolesEnum;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

final class RoleFilterService
{
    public function __construct(
        private readonly ImpersonationService $impersonationService
    ) {
    }

    /**
     * @return array<int, string>
     */
    private function allowedRoleNames(): array
    {
        return array_map(
            static fn(RolesEnum $role) => $role->value,
            RolesEnum::cases()
        );
    }

    /**
     * Get roles that the current user can assign to others.
     * Only includes roles with lower priority than the user's role.
     * SUPER_USER role is only included if the current user is SUPER_USER.
     *
     * If impersonating, uses the original (impersonator) user's permissions instead of the impersonated user.
     * Use this method for SECURITY VALIDATIONS (e.g., in controllers before actually assigning roles).
     *
     * @param User $user The user who wants to assign roles (may be impersonated)
     * @return Collection<int, Role> Filtered roles
     */
    public function getAssignableRoles(User $user): Collection
    {
        // Se estiver impersonando, usa o usuário original (impersonador) em vez do impersonado
        $effectiveUser = $this->impersonationService->getOriginalUser() ?? $user;

        // Garante que o role está carregado para o usuário efetivo
        if (!$effectiveUser->relationLoaded('role')) {
            $effectiveUser->load('role');
        }

        // Se o usuário efetivo não tem permissão, retorna vazio
        if (!$effectiveUser->hasPermissionTo('assign_roles')) {
            return new Collection();
        }

        $userPriority = $effectiveUser->role?->getPriority() ?? 0;
        $isSuperUser  = $effectiveUser->hasRole(RolesEnum::SUPER_USER);

        return Role::query()
            ->whereIn('name', $this->allowedRoleNames())
            ->get()
            ->filter(function(Role $role) use ($userPriority, $isSuperUser) {
                $rolePriority = $role->getPriority();

                // SUPER_USER só pode ser atribuído por SUPER_USER
                if ($role->isSuperUser() && !$isSuperUser) {
                    return false;
                }

                // SUPER_USER pode atribuir qualquer role, incluindo SUPER_USER
                if ($isSuperUser) {
                    return true;
                }

                // Outros usuários só podem atribuir roles com prioridade menor
                return $rolePriority < $userPriority;
            });
    }

    /**
     * Get roles that the current session user can assign to others.
     * Uses the CURRENT user (impersonated if impersonating, otherwise the logged-in user).
     * This provides a realistic UX during impersonation - the user sees what the impersonated user would see.
     *
     * Use this method for DISPLAYING roles in forms and UI components.
     * For security validations, use getAssignableRoles() instead.
     *
     * @param User $user The current session user (may be impersonated)
     * @return Collection<int, Role> Filtered roles
     */
    public function getAssignableRolesForCurrentSession(User $user): Collection
    {
        // Usa o usuário atual (impersonado se estiver impersonando, caso contrário o usuário normal)
        // Isso fornece uma experiência realista durante impersonação
        $effectiveUser = $user;

        // Garante que o role está carregado
        if (!$effectiveUser->relationLoaded('role')) {
            $effectiveUser->load('role');
        }

        // Se o usuário atual não tem permissão, retorna vazio
        if (!$effectiveUser->hasPermissionTo('assign_roles')) {
            return new Collection();
        }

        $userPriority = $effectiveUser->role?->getPriority() ?? 0;
        $isSuperUser  = $effectiveUser->hasRole(RolesEnum::SUPER_USER);

        return Role::query()
            ->whereIn('name', $this->allowedRoleNames())
            ->get()
            ->filter(function(Role $role) use ($userPriority, $isSuperUser) {
                $rolePriority = $role->getPriority();

                // SUPER_USER só pode ser atribuído por SUPER_USER
                if ($role->isSuperUser() && !$isSuperUser) {
                    return false;
                }

                // SUPER_USER pode atribuir qualquer role, incluindo SUPER_USER
                if ($isSuperUser) {
                    return true;
                }

                // Outros usuários só podem atribuir roles com prioridade menor
                return $rolePriority < $userPriority;
            });
    }

    /**
     * Get roles that the current user can see/filter.
     * Only includes roles with priority less than or equal to the user's role priority.
     * This is used for filtering users in lists, where users should only see roles at their level or below.
     *
     * SUPER_USER can see all roles.
     * Other users can only see roles with priority <= their own priority.
     *
     * If impersonating, uses the original (impersonator) user's permissions instead of the impersonated user.
     *
     * @param User $user The user who wants to see/filter roles (may be impersonated)
     * @return Collection<int, Role> Filtered roles
     */
    public function getVisibleRoles(User $user): Collection
    {
        // Se estiver impersonando, usa o usuário original (impersonador) em vez do impersonado
        $effectiveUser = $this->impersonationService->getOriginalUser() ?? $user;

        // Garante que o role está carregado para o usuário efetivo
        if (!$effectiveUser->relationLoaded('role')) {
            $effectiveUser->load('role');
        }

        $userPriority = $effectiveUser->role?->getPriority() ?? 0;
        $isSuperUser  = $effectiveUser->hasRole(RolesEnum::SUPER_USER);

        // SUPER_USER pode ver todas as roles
        if ($isSuperUser) {
            return Role::query()
                ->whereIn('name', $this->allowedRoleNames())
                ->get();
        }

        // Outros usuários só podem ver roles com prioridade menor ou igual à sua
        return Role::query()
            ->whereIn('name', $this->allowedRoleNames())
            ->get()
            ->filter(function(Role $role) use ($userPriority) {
                $rolePriority = $role->getPriority();

                return $rolePriority <= $userPriority;
            });
    }

    /**
     * Get roles that the current session user can see/filter.
     * Uses the CURRENT user (impersonated if impersonating, otherwise the logged-in user).
     * This provides a realistic UX during impersonation - the user sees what the impersonated user would see.
     *
     * @param User $user The current session user (may be impersonated)
     * @return Collection<int, Role> Filtered roles
     */
    public function getVisibleRolesForCurrentSession(User $user): Collection
    {
        // Usa o usuário atual (impersonado se estiver impersonando, caso contrário o usuário normal)
        $effectiveUser = $user;

        // Garante que o role está carregado
        if (!$effectiveUser->relationLoaded('role')) {
            $effectiveUser->load('role');
        }

        $userPriority = $effectiveUser->role?->getPriority() ?? 0;
        $isSuperUser  = $effectiveUser->hasRole(RolesEnum::SUPER_USER);

        // SUPER_USER pode ver todas as roles
        if ($isSuperUser) {
            return Role::query()
                ->whereIn('name', $this->allowedRoleNames())
                ->get();
        }

        // Outros usuários só podem ver roles com prioridade menor ou igual à sua
        return Role::query()
            ->whereIn('name', $this->allowedRoleNames())
            ->get()
            ->filter(function(Role $role) use ($userPriority) {
                $rolePriority = $role->getPriority();

                return $rolePriority <= $userPriority;
            });
    }
}
