import { usePermissions } from '@/hooks/use-permissions';

/**
 * Hook para verificar permissões relacionadas ao módulo de Permissões
 */
export function usePermissionPermissions() {
    const { hasPermission } = usePermissions();

    const canManageRoles = () => hasPermission('manage_roles');
    const canAssignRoles = () => hasPermission('assign_roles');

    return {
        canManageRoles,
        canAssignRoles,
    };
}
