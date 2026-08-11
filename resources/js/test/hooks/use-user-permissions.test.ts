import { useUserPermissions } from '@/hooks/users/use-user-permissions';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
}));

import { usePage } from '@inertiajs/react';

function mockAuth(permissions: string[], roles: string[] = []) {
    (usePage as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        props: {
            auth: { user: { id: 1 }, permissions, roles },
        },
    });
}

function permissionsOf(permissions: string[], roles: string[] = []) {
    mockAuth(permissions, roles);

    return renderHook(() => useUserPermissions()).result.current;
}

describe('useUserPermissions', () => {
    describe('canManagePermissions', () => {
        // O item "Permissões" da linha cai no ShowUserPermissionsController, que
        // autoriza por `manage_permissions`. Ler `manage_users` aqui mostrava o
        // item para o MANAGER (semeado com a primeira e sem a segunda) e
        // garantia 403 em todos os cliques.
        it('reads manage_permissions, the permission the backend actually checks', () => {
            expect(permissionsOf(['manage_permissions']).canManagePermissions()).toBe(true);
        });

        it('stays closed for manage_users alone — the seeded MANAGER case', () => {
            expect(permissionsOf(['manage_users', 'assign_roles']).canManagePermissions()).toBe(false);
        });

        it('stays closed with no permissions at all', () => {
            expect(permissionsOf([]).canManagePermissions()).toBe(false);
        });
    });

    describe('canEdit', () => {
        it('keeps gating on manage_users', () => {
            expect(permissionsOf(['manage_users']).canEdit()).toBe(true);
        });

        it('is not opened by manage_permissions', () => {
            expect(permissionsOf(['manage_permissions']).canEdit()).toBe(false);
        });
    });
});
