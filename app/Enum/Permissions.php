<?php

declare(strict_types = 1);

namespace App\Enum;

enum Permissions: string
{
    // Gestão de Usuários/Cargos/Permissões
    case MANAGE_USERS       = 'manage_users';
    case MANAGE_ROLES       = 'manage_roles';
    case MANAGE_PERMISSIONS = 'manage_permissions';
    case ASSIGN_ROLES       = 'assign_roles';
    case IMPERSONATE_USERS  = 'impersonate_users';

    public function label(): string
    {
        return match ($this) {
            self::MANAGE_USERS       => 'Gerenciar Usuários',
            self::MANAGE_ROLES       => 'Gerenciar Cargos',
            self::MANAGE_PERMISSIONS => 'Gerenciar Permissões',
            self::ASSIGN_ROLES       => 'Atribuir Cargos',
            self::IMPERSONATE_USERS  => 'Personificar Usuários',
        };
    }

    /**
     * O que a pessoa passa a conseguir fazer — em consequência, não em nome de
     * tela. Quem monta um cargo no painel decide por esta frase, então ela vale
     * mais que o label: "Gerenciar Permissões" e "Atribuir Cargos" são parecidos
     * o bastante para serem trocados um pelo outro.
     */
    public function description(): string
    {
        return match ($this) {
            self::MANAGE_USERS       => 'Criar, editar, desativar e excluir quem entra no painel.',
            self::MANAGE_ROLES       => 'Montar os cargos: escolher o que cada um pode fazer.',
            self::MANAGE_PERMISSIONS => 'Dar ou tirar um acesso avulso de uma pessoa, fora do cargo dela.',
            self::ASSIGN_ROLES       => 'Trocar o cargo de outra pessoa.',
            self::IMPERSONATE_USERS  => 'Entrar no painel como outra pessoa para reproduzir um problema.',
        };
    }
}
