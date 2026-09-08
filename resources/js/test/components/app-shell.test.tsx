import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/*
 * O shell do app tem UM caminho, o da sidebar. `AppShell` e `AppContent`
 * carregavam um ramo `header` sem chamador — e ele era o DEFAULT: `<AppShell>`
 * sem prop montava a árvore sem `SidebarProvider` (todo primitivo de
 * `ui/sidebar` estoura), e `<AppContent>` sem prop renderizava um `<main>` que
 * não era o alvo do skip-link. O que estes testes travam é que o caminho
 * único funciona SEM prop, e que as props do call-site continuam chegando ao
 * `<main>` do `SidebarInset` — é por elas que `#conteudo` encontra o alvo.
 */
describe('AppShell + AppContent — o shell só tem o caminho da sidebar', () => {
    it('monta o provider da sidebar sem prop nenhuma: um primitivo de ui/sidebar dentro dele não estoura', () => {
        render(
            <AppShell>
                <SidebarTrigger />
            </AppShell>,
        );

        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('AppContent é o <main> do SidebarInset, e as props do call-site chegam nele', () => {
        render(
            <AppShell>
                <AppContent id="conteudo" tabIndex={-1}>
                    Conteúdo
                </AppContent>
            </AppShell>,
        );

        const main = screen.getByRole('main');

        expect(main).toHaveAttribute('data-slot', 'sidebar-inset');
        expect(main).toHaveAttribute('id', 'conteudo');
        expect(main).toHaveAttribute('tabindex', '-1');
        expect(document.querySelectorAll('main')).toHaveLength(1);
    });

    /*
     * harvest: ctvitrine ui/sidebar.tsx@53d7d9a. Flex item tem
     * `min-width: auto`; sem `min-w-0`, conteúdo de min-content largo empurra
     * o <main> para fora do viewport em vez de rolar dentro do container.
     * Defesa genérica — as tabelas do @radix-ui/themes já rolam sozinhas.
     */
    it('deixa o <main> encolher dentro do flex de linha (min-w-0), sem perder a className do call-site', () => {
        render(
            <AppShell>
                <AppContent className="px-4" />
            </AppShell>,
        );

        const main = screen.getByRole('main');

        expect(main).toHaveClass('min-w-0');
        expect(main).toHaveClass('px-4');
    });
});
