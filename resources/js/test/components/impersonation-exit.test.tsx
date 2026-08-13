import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * A saída da personificação é o caminho de maior consequência do RBAC: enquanto
 * ela não é acionada, tudo que a pessoa faz é atribuído à persona. E ela tinha
 * três fragilidades ao mesmo tempo.
 *
 * 1. UM único layout monta o `<ImpersonateBanner>`, que é a única saída em
 *    código de app. Havia um segundo layout (morto) sem o banner; trocar o
 *    template em `app-layout.tsx` teria removido a saída sem nenhum teste
 *    reclamar. A fatia D2 trava COMO se troca de identidade, não que um layout
 *    monte a saída — este teste fecha essa diferença.
 * 2. A saída era `<a href="#">` com `preventDefault`. É ação, não navegação:
 *    não entra na lista de botões do leitor de tela e responde a Enter, não a
 *    Espaço.
 * 3. O item "Personificar" do menu chamava `e.preventDefault()`, o que suprime
 *    o `handleSelect` do Radix (ele compõe com `checkForDefaultPrevented`) e
 *    deixava o dropdown ABERTO por cima da navegação que acabara de começar.
 */

const impersonating = {
    active: true,
    originalUserName: 'Ana Souza',
    impersonatedUserName: 'Bruno Lima',
};

const calls: string[] = [];

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({
        url: '/dashboard',
        props: {
            auth: {
                user: { id: 1, name: 'Ana Souza', email: 'ana@example.com', avatar: undefined },
                permissions: ['manage_users'],
                roles: ['admin'],
                impersonating,
            },
        },
    }),
    Link: ({ children, href, ...props }: { children: ReactNode; href?: string } & Record<string, unknown>) => (
        <a href={href ?? '#'} {...props}>
            {children}
        </a>
    ),
    router: {
        visit: vi.fn(),
        post: () => calls.push('post'),
        delete: () => calls.push('delete'),
        patch: vi.fn(),
        flushAll: () => calls.push('flushAll'),
    },
}));

import { ImpersonateBanner } from '@/components/impersonate-banner';
import { UserActionsMenu } from '@/components/users/user-actions-menu';
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

beforeEach(() => {
    calls.length = 0;
    impersonating.active = true;
});

describe('o layout de app monta a saída da personificação', () => {
    it('renders the exit control while impersonating', () => {
        render(<AppLayout>conteúdo</AppLayout>);

        expect(screen.getByRole('button', { name: /clique aqui para sair/i })).toBeInTheDocument();
    });

    it('keeps the banner out of the way when nobody is impersonating', () => {
        impersonating.active = false;

        render(<AppLayout>conteúdo</AppLayout>);

        expect(screen.queryByRole('button', { name: /clique aqui para sair/i })).not.toBeInTheDocument();
    });
});

describe('ImpersonateBanner', () => {
    it('offers the exit as a button, because leaving a persona is an action and not a destination', () => {
        render(<ImpersonateBanner active originalUserName="Ana Souza" impersonatedUserName="Bruno Lima" />);

        expect(screen.getByRole('button', { name: /clique aqui para sair/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /clique aqui para sair/i })).not.toBeInTheDocument();
    });

    it('does not paint the banner with a teal that fails AA against white text', () => {
        /*
         * Medido nos valores oklch do Tailwind 4.3, contra branco:
         * teal-400 1.86:1 · teal-500 2.42:1 · teal-600 3.66:1 — os três
         * reprovam os 4.5:1 de texto normal. teal-700 dá 5.39:1.
         * O teste barra o piso, não fixa o tom: escurecer mais continua válido.
         */
        const { container } = render(<ImpersonateBanner active originalUserName="Ana Souza" impersonatedUserName="Bruno Lima" />);

        const banner = container.firstElementChild as HTMLElement;

        expect(banner.className).toContain('text-white');
        expect(banner.className).not.toMatch(/\bbg-teal-(50|100|200|300|400|500|600)\b/);
    });
});

function makeUser(): User {
    return { id: 9, name: 'Bruno Lima', email: 'bruno@example.com', is_active: true } as User;
}

describe('UserActionsMenu — item de personificar', () => {
    it('closes the dropdown after starting impersonation', async () => {
        const onImpersonate = vi.fn();

        render(
            <UserActionsMenu
                user={makeUser()}
                onImpersonate={onImpersonate}
                onView={vi.fn()}
                canImpersonate={() => true}
                canDelete={() => false}
                canEdit={false}
                canManagePermissions={false}
                canAssignRoles={false}
            />,
        );

        await userEvent.click(screen.getByRole('button', { name: /mais opções para/i }));
        await userEvent.click(await screen.findByRole('menuitem', { name: 'Personificar' }));

        expect(onImpersonate).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('menuitem', { name: 'Personificar' })).not.toBeInTheDocument();
    });
});
