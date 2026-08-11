import { usePermissions } from '@/hooks/use-permissions';
import { describe, expect, it, vi } from 'vitest';

// Mock do Inertia.js
vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
}));

import { usePage } from '@inertiajs/react';

describe('usePermissions Hook', () => {
    it('returns false functions when user is not authenticated', () => {
        (usePage as any).mockReturnValue({
            props: {
                auth: null,
            },
        });

        const { hasPermission, hasRole } = usePermissions();

        expect(hasPermission('test-permission')).toBe(false);
        expect(hasRole('admin')).toBe(false);
    });

    it('returns false functions when user is undefined', () => {
        (usePage as any).mockReturnValue({
            props: {
                auth: {
                    user: null,
                },
            },
        });

        const { hasPermission, hasRole } = usePermissions();

        expect(hasPermission('test-permission')).toBe(false);
        expect(hasRole('admin')).toBe(false);
    });

    // O `share()` publica listas de NOMES em `auth.permissions` e `auth.roles` —
    // é este o contrato. Cargo e permissões nunca vieram dentro de `auth.user`.
    it('correctly checks user permissions from the shared name lists', () => {
        (usePage as any).mockReturnValue({
            props: {
                auth: {
                    user: { id: 1, name: 'Ana', email: 'ana@example.com', email_verified_at: null },
                    permissions: ['create-users', 'edit-users'],
                    roles: ['admin', 'editor'],
                },
            },
        });

        const { hasPermission, hasRole } = usePermissions();

        expect(hasPermission('create-users')).toBe(true);
        expect(hasPermission('edit-users')).toBe(true);
        expect(hasPermission('delete-users')).toBe(false);

        expect(hasRole('admin')).toBe(true);
        expect(hasRole('editor')).toBe(true);
        expect(hasRole('viewer')).toBe(false);
    });

    it('also accepts the object form of permissions and roles', () => {
        (usePage as any).mockReturnValue({
            props: {
                auth: {
                    user: { id: 1, name: 'Ana', email: 'ana@example.com', email_verified_at: null },
                    permissions: [
                        { name: 'create-users', label: 'Create Users' },
                        { name: 'edit-users', label: 'Edit Users' },
                    ],
                    roles: [
                        { name: 'admin', label: 'Administrator' },
                        { name: 'editor', label: 'Editor' },
                    ],
                },
            },
        });

        const { hasPermission, hasRole } = usePermissions();

        expect(hasPermission('create-users')).toBe(true);
        expect(hasPermission('delete-users')).toBe(false);
        expect(hasRole('admin')).toBe(true);
        expect(hasRole('viewer')).toBe(false);
    });

    it('handles empty permissions and roles arrays', () => {
        (usePage as any).mockReturnValue({
            props: {
                auth: {
                    user: {
                        permissions: [],
                    },
                    roles: [],
                },
            },
        });

        const { hasPermission, hasRole } = usePermissions();

        expect(hasPermission('any-permission')).toBe(false);
        expect(hasRole('any-role')).toBe(false);
    });
});
