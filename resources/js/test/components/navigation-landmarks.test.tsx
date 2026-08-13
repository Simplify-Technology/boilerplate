import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * Três buracos de navegação assistiva moravam aqui, e os três eram invisíveis
 * para quem enxerga a tela:
 *
 * 1. A sidebar não era um landmark. Os itens principais moravam num `<div>`
 *    (`SidebarContent`), então o único `<nav>` do repositório inteiro era o do
 *    breadcrumb — não havia como pular PARA a navegação.
 * 2. `isItemActive()` decidia só a cor. Sem `aria-current`, o item da página
 *    atual era indistinguível de qualquer outro para leitor de tela.
 * 3. Não havia skip-link. Por teclado, o caminho até o conteúdo passava por
 *    logo + itens de menu + trigger + breadcrumb, em TODA página autenticada.
 *
 * O teste renderiza a árvore real (layout → shell → sidebar → conteúdo) porque
 * o alvo do skip-link é o `<main>` do `SidebarInset`, três componentes abaixo
 * de onde o `id` é passado. Asserção sobre componente isolado não provaria que
 * o `href` e o `id` se encontram.
 */

const currentUrl = { value: '/users' };

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({
        url: currentUrl.value,
        props: {
            auth: {
                user: { id: 1, name: 'Ana Souza', email: 'ana@example.com', avatar: undefined },
                permissions: ['manage_users', 'manage_roles'],
                roles: ['admin'],
            },
        },
    }),
    Link: ({ children, href, ...props }: { children: ReactNode; href?: string } & Record<string, unknown>) => (
        <a href={href ?? '#'} {...props}>
            {children}
        </a>
    ),
    router: { visit: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn(), flushAll: vi.fn() },
}));

import { AppSidebar } from '@/components/app-sidebar';
import { NavMain } from '@/components/nav-main';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import type { NavItem } from '@/types';
import { render, screen } from '@testing-library/react';
import { LayoutGrid, Users } from 'lucide-react';

const items: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutGrid },
    { title: 'Usuários', url: '/users', icon: Users },
];

// Os primitivos de `ui/sidebar` leem o contexto do provider; só o teste do
// layout o traz de graça (via `AppShell`).
function renderInSidebar(ui: ReactNode) {
    return render(<SidebarProvider>{ui}</SidebarProvider>);
}

beforeEach(() => {
    currentUrl.value = '/users';
});

describe('NavMain — item ativo anunciado', () => {
    it('marks the active item with aria-current="page"', () => {
        renderInSidebar(<NavMain items={items} />);

        expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('aria-current', 'page');
    });

    it('leaves the attribute OFF the inactive items instead of writing "false"', () => {
        renderInSidebar(<NavMain items={items} />);

        expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
    });

    it('keeps the parent item current while inside a sub-route', () => {
        currentUrl.value = '/users/1/edit';

        renderInSidebar(<NavMain items={items} />);

        expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('aria-current', 'page');
    });

    it('does not mark a prefix collision as current', () => {
        currentUrl.value = '/userscope';

        renderInSidebar(<NavMain items={items} />);

        expect(screen.getByRole('link', { name: 'Usuários' })).not.toHaveAttribute('aria-current');
    });

    it('ignores query string and hash when deciding what is current', () => {
        currentUrl.value = '/users?page=2#topo';

        renderInSidebar(<NavMain items={items} />);

        expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('aria-current', 'page');
    });
});

describe('AppSidebar — landmark de navegação', () => {
    it('exposes the main menu as a named navigation landmark', () => {
        renderInSidebar(<AppSidebar />);

        const nav = screen.getByRole('navigation', { name: 'Navegação principal' });

        expect(nav).toBeInTheDocument();
        expect(nav).toContainElement(screen.getByRole('link', { name: 'Usuários' }));
    });
});

describe('AppSidebarLayout — skip-link', () => {
    it('offers the skip-link as the first focusable element of the page', () => {
        const { container } = render(<AppSidebarLayout>conteúdo</AppSidebarLayout>);

        const focusables = container.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');

        expect(focusables[0]).toHaveTextContent('Pular para o conteúdo');
    });

    it('points the skip-link at the <main> that actually renders the page', () => {
        const { container } = render(<AppSidebarLayout>conteúdo</AppSidebarLayout>);

        const skipLink = screen.getByRole('link', { name: 'Pular para o conteúdo' });
        const targetId = skipLink.getAttribute('href')?.replace('#', '') ?? '';

        expect(targetId).not.toBe('');

        const target = container.querySelector(`#${targetId}`);

        expect(target).not.toBeNull();
        expect(target?.tagName).toBe('MAIN');
    });

    it('makes the target programmatically focusable without putting it in the tab order', () => {
        const { container } = render(<AppSidebarLayout>conteúdo</AppSidebarLayout>);

        const main = container.querySelector('main');

        expect(main).toHaveAttribute('tabindex', '-1');
    });

    it('renders exactly one <main> so the skip-link target is unambiguous', () => {
        const { container } = render(<AppSidebarLayout>conteúdo</AppSidebarLayout>);

        expect(container.querySelectorAll('main')).toHaveLength(1);
    });
});
