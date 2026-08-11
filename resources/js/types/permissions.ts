import { Role, User } from './index';

/**
 * Tipos relacionados ao módulo de Permissões
 */

/**
 * Uma permissão como as telas de RBAC a recebem: espelha
 * `PermissionCatalogService::forDisplay()`. Label e descrição vêm do enum
 * `App\Enum\Permissions`, não das colunas do banco — os dois mudam juntos.
 */
export type PermissionOption = {
    name: string;
    label: string;
    description: string;
};

export type RoleData = {
    id: number;
    label: string;
    /** Vem de `App\Enum\Roles::description()`; `roles` não tem coluna para ela. */
    description: string;
    permissions: Record<string, string>; // permission name -> permission label
    users: User[] | Record<number, User>; // Array ou objeto keyed por id
};

export type RolesData = Record<string, RoleData>; // role name -> role data

export type PermissionCardProps = {
    permission: PermissionOption;
    isChecked: boolean;
    onToggle: (permissionName: string, checked: boolean) => void;
};

export type RoleUsersTableProps = {
    users: User[];
    roleLabel: string;
    assignableRoles?: Role[];
    onRevokeRole: (user: User) => void;
    canAssignRoles: boolean;
};

export type RoleInfoDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export type PermissionsPageProps = {
    roles: RolesData;
    assignableRoles?: Role[];
    permissions: PermissionOption[];
};

export type PermissionActionHandlers = {
    onSavePermissions: (roleName: string, permissionNames: string[]) => Promise<void>;
    onAssignRole: (userId: number) => Promise<void>;
    onRevokeRole: (userId: number) => Promise<void>;
};
