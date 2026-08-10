<?php

declare(strict_types = 1);

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage_users');
    }

    public function view(User $user, User $model): bool
    {
        return $user->hasPermissionTo('manage_users');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage_users');
    }

    public function update(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('manage_users')) {
            return false;
        }

        $isSuperUser = $user->hasRole('super_user');

        // Impede que o usuário altere seu próprio status ativo/inativo
        // Isso deve ser feito através do perfil ou por outro administrador
        // EXCETO: SUPER_USER pode alterar status de qualquer usuário (exceto o seu próprio)
        if ($user->id === $model->id && request()->has('is_active')) {
            return false;
        }

        // SUPER_USER pode editar qualquer usuário, incluindo outros SUPER_USER
        if ($isSuperUser) {
            return true;
        }

        // Outros usuários não podem editar super_user
        return !$model->hasRole('super_user');
    }

    public function delete(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('manage_users')) {
            return false;
        }

        // Impede auto-exclusão
        if ($user->id === $model->id) {
            return false;
        }

        // SUPER_USER pode deletar qualquer usuário, incluindo outros SUPER_USER
        if ($user->hasRole('super_user')) {
            return true;
        }

        // Outros usuários não podem deletar super_user
        return !$model->hasRole('super_user');
    }

    public function toggleActive(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('manage_users')) {
            return false;
        }

        // Impede que o usuário desative a si mesmo
        if ($user->id === $model->id) {
            return false;
        }

        // SUPER_USER pode desativar qualquer usuário, incluindo outros SUPER_USER
        if ($user->hasRole('super_user')) {
            return true;
        }

        // Outros usuários não podem desativar super_user
        return !$model->hasRole('super_user');
    }

    public function impersonate(User $user, User $model): bool
    {
        return $user->canImpersonate($model);
    }

    public function managePermissions(User $user): bool
    {
        return $user->hasPermissionTo('manage_permissions');
    }
}
