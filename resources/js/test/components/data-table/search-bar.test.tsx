import { SearchBar } from '@/components/data-table/search-bar';
import { render, screen } from '@testing-library/react';
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
