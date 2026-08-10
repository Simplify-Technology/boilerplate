<?php

declare(strict_types = 1);

namespace App\Enum;

enum Permissions: string
{
    // Gestão de Usuários/Papéis/Permissões
    case MANAGE_USERS       = 'manage_users';
    case MANAGE_ROLES       = 'manage_roles';
    case MANAGE_PERMISSIONS = 'manage_permissions';
    case ASSIGN_ROLES       = 'assign_roles';
    case IMPERSONATE_USERS  = 'impersonate_users';

    public function label(): string
    {
        return match ($this) {
            self::MANAGE_USERS       => 'Gerenciar Usuários',
            self::MANAGE_ROLES       => 'Gerenciar Papéis',
            self::MANAGE_PERMISSIONS => 'Gerenciar Permissões',
            self::ASSIGN_ROLES       => 'Atribuir Papéis',
            self::IMPERSONATE_USERS  => 'Personificar Usuários',
        };
    }
}
