import { UserTableRow } from '@/components/users/user-table-row';
import type { User } from '@/types';
import { Table, Theme } from '@radix-ui/themes';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}));

function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: 1,
        name: 'Ana Souza',
        email: 'ana@example.com',
        is_active: true,
        email_verified_at: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        role: { id: 3, name: 'manager', label: 'Gerente' },
        ...overrides,
    } as User;
}

function renderRow(user: User) {
    return render(
        <Theme>
            <Table.Root>
                <Table.Body>
                    <UserTableRow
                        user={user}
                        index={0}
                        onView={vi.fn()}
                        canDelete={() => false}
                        canEdit={false}
                        canImpersonate={() => false}
                        canManagePermissions={false}
                        canAssignRoles={false}
                        getUserInitials={(name: string) => name.charAt(0)}
                    />
                </Table.Body>
            </Table.Root>
        </Theme>,
    );
}

describe('UserTableRow', () => {
    // `count && count > 0 && (…)` avalia para `0` quando a contagem é zero — e o
    // React renderiza o zero. Era o caso comum: quase todo usuário tem zero
    // permissões individuais.
    it('renders no stray zero when the user has no individual permissions', () => {
        renderRow(makeUser({ custom_permissions_count: 0 }));

        expect(screen.getByText('Gerente')).toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('renders nothing extra when the count is absent', () => {
        renderRow(makeUser());

        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('still shows the badge when there are individual permissions', () => {
        renderRow(makeUser({ custom_permissions_count: 2 }));

        expect(screen.getByText('2')).toBeInTheDocument();
    });
});
