import { SearchBar } from '@/components/data-table/search-bar';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

function renderBar(props: Partial<ComponentProps<typeof SearchBar>> = {}) {
    return render(<SearchBar value="" onChange={vi.fn()} onClear={vi.fn()} {...props} />);
}

/*
 * O spinner vivia atrás de `isSearching && !value`, ou seja, só com o campo
 * vazio — nunca enquanto se digita, que é quando ele serviria. Estes testes
 * travam as duas metades: ele aparece durante a busca com texto, e não disputa
 * o canto direito com o botão de limpar.
 */
describe('SearchBar', () => {
    it('shows the spinner while searching with typed text', () => {
        renderBar({ value: 'ana', isSearching: true });

        expect(screen.getByTestId('search-spinner')).toBeInTheDocument();
    });

    it('shows the spinner while searching with an empty field', () => {
        renderBar({ value: '', isSearching: true });

        expect(screen.getByTestId('search-spinner')).toBeInTheDocument();
    });

    it('hides the spinner when no search is in flight', () => {
        renderBar({ value: 'ana', isSearching: false });

        expect(screen.queryByTestId('search-spinner')).not.toBeInTheDocument();
    });

    it('keeps the clear button available while searching', () => {
        renderBar({ value: 'ana', isSearching: true });

        expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeInTheDocument();
    });

    it('does not offer a clear button when there is nothing to clear', () => {
        renderBar({ value: '', isSearching: true });

        expect(screen.queryByRole('button', { name: 'Limpar busca' })).not.toBeInTheDocument();
    });
});

/*
 * O slot da lupa se anunciava como `role="button"` sem `tabIndex` e sem
 * handler de teclado: dizia ao leitor de tela que era um botão e não podia ser
 * acionado por teclado (4.1.2). A correção NÃO é virar `<button>` — o único
 * efeito dele é focar o campo que está a três pixels de distância e já é o
 * próximo na ordem de tabulação. Um botão ali seria uma parada de tab que não
 * leva a lugar nenhum. O papel falso sai, a afordância de clique fica.
 */
describe('SearchBar — nada se anuncia como o que não é', () => {
    it('exposes no interactive role that the keyboard cannot reach', () => {
        const { container } = renderBar({ value: 'ana', isSearching: true });

        const fakeWidgets = Array.from(container.querySelectorAll<HTMLElement>('[role="button"], [role="link"], [role="checkbox"]')).filter(
            (el) => !el.hasAttribute('tabindex') && !['BUTTON', 'A', 'INPUT'].includes(el.tagName),
        );

        expect(fakeWidgets).toEqual([]);
    });

    it('hides the decorative icon slot from assistive tech', () => {
        const { container } = renderBar({ value: '', isSearching: false });

        expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
    });

    it('keeps the click-to-focus affordance for the mouse', async () => {
        const { container } = renderBar({ value: '' });

        await userEvent.click(container.querySelector('[aria-hidden="true"]') as HTMLElement);

        expect(screen.getByRole('textbox', { name: 'Pesquisar' })).toHaveFocus();
    });
});

/*
 * A região viva morava na PÁGINA (`pages/users/index.tsx`), dizia
 * "Buscando usuários..." e voltava para string vazia ao terminar — quem
 * depende de leitor de tela ouvia o começo e nunca o desfecho. Ela desce para
 * cá porque quem já é dono de `isSearching` é este componente; deixá-la na
 * página garante que a próxima listagem repita o copy-paste (no ctfinance o
 * mesmo bloco está em 11 telas).
 *
 * A região é renderizada SEMPRE, mesmo vazia: `aria-live` num nó recém-montado
 * não anuncia — é a mudança de conteúdo de uma região preexistente que dispara.
 */
describe('SearchBar — a busca anuncia o desfecho, não só o começo', () => {
    function liveRegion(container: HTMLElement) {
        return container.querySelector('[aria-live="polite"]');
    }

    it('keeps the live region mounted even with nothing to say', () => {
        const { container } = renderBar({ value: '' });

        expect(liveRegion(container)).not.toBeNull();
        expect(liveRegion(container)).toHaveTextContent('');
    });

    it('announces that a search is running', () => {
        const { container } = renderBar({ value: 'ana', isSearching: true });

        expect(liveRegion(container)).toHaveTextContent('Buscando…');
    });

    it('announces how many results the search found', () => {
        const { container } = renderBar({ value: 'ana', isSearching: false, resultCount: 12 });

        expect(liveRegion(container)).toHaveTextContent('12 resultados encontrados');
    });

    it('says one result in the singular', () => {
        const { container } = renderBar({ value: 'ana', isSearching: false, resultCount: 1 });

        expect(liveRegion(container)).toHaveTextContent('1 resultado encontrado');
    });

    it('announces the empty outcome instead of falling silent', () => {
        const { container } = renderBar({ value: 'zzz', isSearching: false, resultCount: 0 });

        expect(liveRegion(container)).toHaveTextContent('Nenhum resultado encontrado');
    });

    it('stays quiet when nothing was searched for', () => {
        const { container } = renderBar({ value: '', isSearching: false, resultCount: 40 });

        expect(liveRegion(container)).toHaveTextContent('');
    });
});
