import { Permission, Role, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;

    const user = auth?.user;

    if (!user) return { hasPermission: () => false, hasRole: () => false };

    // `auth.permissions` e `auth.roles` são a fonte única — o `share()` do
    // HandleInertiaRequests sempre publica as duas. O fallback que existia aqui
    // lia `user.permissions` e `user.role`, campos que o `auth.user` nunca
    // carregou (as relations não são eager-loaded no share), então só devolvia
    // lista vazia: era um segundo canal com outro shape, e sem dados.

    // Aceita array de nomes (string) ou objetos Permission/Role
    const authPermissions = auth?.permissions || [];
    const permissionsNames: string[] = authPermissions.map((p: string | Permission) => (typeof p === 'string' ? p : p.name));

    const authRoles = auth?.roles || [];
    const rolesNames: string[] = authRoles.map((r: string | Role) => (typeof r === 'string' ? r : r.name));

    const userRolesSet = new Set(rolesNames);
    const userPermissionsSet = new Set(permissionsNames);

    const hasRole = (role: string) => userRolesSet.has(role);
    const hasPermission = (permission: string) => userPermissionsSet.has(permission);

    return { hasRole, hasPermission };
}
