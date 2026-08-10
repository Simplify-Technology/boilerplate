import useUserSearch from '@/hooks/use-user-search';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routerGetMock = vi.fn();

vi.mock('@inertiajs/react', () => ({
    router: {
        get: (...args: unknown[]) => routerGetMock(...args),
    },
}));

const users = [
    { name: 'Alice', email: 'alice@example.com', role: { id: 1 }, is_active: true },
    { name: 'Bob', email: 'bob@example.com', role: { id: 2 }, is_active: false },
];

describe('useUserSearch', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        routerGetMock.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not navigate on mount', () => {
        renderHook(() => useUserSearch({ users, routeName: 'users.index' }));

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(routerGetMock).not.toHaveBeenCalled();
    });

    it('navigates once after the debounce settles', () => {
        const { result } = renderHook(() => useUserSearch({ users, routeName: 'users.index', debounceMs: 300 }));

        act(() => {
            result.current.setSearch('ali');
        });

        expect(routerGetMock).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(routerGetMock).toHaveBeenCalledTimes(1);
        expect(routerGetMock).toHaveBeenCalledWith(
            '/users.index',
            expect.objectContaining({ search: 'ali', page: 1 }),
            expect.objectContaining({ preserveState: true, preserveScroll: true }),
        );
    });

    it('filters users client-side by search term', () => {
        const { result } = renderHook(() => useUserSearch({ users, routeName: 'users.index' }));

        act(() => {
            result.current.setSearch('alice');
        });

        expect(result.current.filteredUsers).toEqual([users[0]]);
    });

    it('filters users client-side by active state', () => {
        const { result } = renderHook(() => useUserSearch({ users, routeName: 'users.index', initialFilters: { is_active: 'false' } }));

        expect(result.current.filteredUsers).toEqual([users[1]]);
    });

    it('clearFilters resets params and navigates with an empty query', () => {
        const { result } = renderHook(() => useUserSearch({ users, routeName: 'users.index' }));

        act(() => {
            result.current.clearFilters();
        });

        expect(routerGetMock).toHaveBeenCalledWith('/users.index', {}, expect.objectContaining({ preserveState: true }));
        expect(result.current.searchParams.search).toBe('');
        expect(result.current.searchParams.page).toBe(1);
    });
});
