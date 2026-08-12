import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    router: { get: vi.fn() },
}));

import { useUserFilters } from '@/hooks/users/use-user-filters';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
});

/*
 * O efeito de debounce liga `isSearching` antes de agendar o timeout, e o
 * cleanup cancela esse timeout a cada tecla. Quando o texto volta ao valor que
 * já está no filtro, o efeito sai pela guarda inicial — e o `onFinish` que
 * desligaria o estado nunca acontece, porque request nenhum foi disparado.
 *
 * O estado fica preso em `true` com o campo vazio, que é justamente a condição
 * em que a barra de busca decide mostrar o spinner. O único spinner que o
 * usuário chegava a ver era um que não parava mais.
 */
describe('useUserFilters', () => {
    it('turns the searching state on while the typed text has not settled', () => {
        const { result } = renderHook(() => useUserFilters({ initialFilters: { search: '' }, routeName: 'users.index' }));

        act(() => {
            result.current.setLocalSearch('ana');
        });

        expect(result.current.isSearching).toBe(true);
    });

    it('turns the searching state off when the text returns to the applied filter', () => {
        const { result } = renderHook(() => useUserFilters({ initialFilters: { search: '' }, routeName: 'users.index' }));

        act(() => {
            result.current.setLocalSearch('ana');
        });

        expect(result.current.isSearching).toBe(true);

        // Apaga antes de o debounce vencer: o timeout é cancelado e nenhum
        // request chega a sair, então não há onFinish para desligar o estado.
        act(() => {
            result.current.setLocalSearch('');
        });

        expect(result.current.isSearching).toBe(false);
    });

    it('keeps the searching state off on the initial mount', () => {
        const { result } = renderHook(() => useUserFilters({ initialFilters: { search: 'ana' }, routeName: 'users.index' }));

        expect(result.current.isSearching).toBe(false);
    });
});
