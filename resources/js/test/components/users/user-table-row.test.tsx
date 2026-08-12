import { UserTableRow } from '@/components/users/user-table-row';
import type { User } from '@/types';
import { Table, Theme } from '@radix-ui/themes';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// O mock repassa as props: `<Button asChild>` entrega className, aria-label e
// ref ao filho pelo Slot do Radix, e um mock que os descartasse esconderia
// exatamente o que o teste do aninhamento precisa ver.
vi.mock('@inertiajs/react', () => ({
    Link: ({ children, href, ...props }: { children: ReactNode; href?: string } & Record<string, unknown>) => (
        <a href={href ?? '#'} {...props}>
            {children}
        </a>
    ),
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

    /*
     * O caso difícil do aninhamento: aqui o link mora dentro de
     * `Tooltip > TooltipTrigger asChild`. Antes, o `<Link>` embrulhava o
     * `<Button>` e saía `<a><button/></a>` — dois nós focáveis para uma ação
     * só, anunciados como link E como botão, e o `TooltipTrigger` clonando o
     * `<a>` em vez do botão que carrega o rótulo.
     */
    it('renders the details action as a single interactive node', () => {
        const { container } = renderRow(makeUser());

        const link = screen.getByRole('link', { name: 'Ver detalhes de Ana Souza' });

        expect(link.tagName).toBe('A');
        expect(link.querySelector('button, a, input, select, textarea')).toBeNull();
        expect(container.querySelectorAll('a a, a button, button a, button button')).toHaveLength(0);
    });

    it('keeps the button styling on the link that replaced it', () => {
        // Prova que o Slot repassou a className: sem isso a conversão para
        // `asChild` teria trocado o botão estilizado por um <a> pelado.
        const link = renderRow(makeUser()).container.querySelector('a[aria-label^="Ver detalhes"]');

        expect(link).not.toBeNull();
        expect(link?.className).toContain('h-8');
    });
});
