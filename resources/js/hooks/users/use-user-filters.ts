import type { UserFilterKey, UserFilterParams } from '@/types/users';
import { mergeQueryParams } from '@/utils/data-table/query-params';
import { SEARCH_DEBOUNCE_DELAY } from '@/utils/users/constants';
import { router } from '@inertiajs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export type UseUserFiltersOptions = {
    initialFilters?: UserFilterParams;
    routeName: string;
    debounceMs?: number;
};

export type UseUserFiltersReturn = {
    localSearch: string;
    isSearching: boolean;
    setLocalSearch: (value: string) => void;
    handleFilterChange: (key: UserFilterKey, value: string | number | boolean | undefined) => void;
    clearFilters: () => void;
    clearSingleFilter: (key: UserFilterKey) => void;
    searchContainerRef: React.RefObject<HTMLDivElement | null>;
    focusSearchInput: (e?: React.MouseEvent) => void;
    handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

/**
 * Hook para gerenciar filtros e busca de usuários
 * Centraliza lógica de debounce, construção de query params e sincronização com backend
 */
export function useUserFilters({ initialFilters = {}, routeName, debounceMs = SEARCH_DEBOUNCE_DELAY }: UseUserFiltersOptions): UseUserFiltersReturn {
    const [localSearch, setLocalSearch] = useState(initialFilters.search || '');
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialMount = useRef(true);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);

    // Sincroniza localSearch com filters.search quando muda do backend (mas não no mount inicial)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Só sincroniza se o filtro mudou externamente (do backend) e não estamos buscando
        if (initialFilters.search !== localSearch && !isSearching) {
            setLocalSearch(initialFilters.search || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialFilters.search]);

    // Debounced search effect - só dispara quando usuário digita
    useEffect(() => {
        if (isInitialMount.current) {
            return;
        }

        // O texto voltou ao que já está aplicado — nada a buscar. O cleanup do
        // ciclo anterior já cancelou o timeout, então o `onFinish` que
        // desligaria isSearching nunca vai acontecer: sem este reset, o estado
        // fica preso em true (e a barra passa a exibir um spinner que não para).
        if (localSearch === (initialFilters.search || '')) {
            setIsSearching(false);

            return;
        }

        // Limpa timeout existente
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(() => {
            // Constrói params mantendo outros filtros
            const existingFilters: UserFilterParams = {
                role_id: initialFilters.role_id,
                is_active: initialFilters.is_active,
                has_individual_permissions: initialFilters.has_individual_permissions,
                sort_by: initialFilters.sort_by,
                sort_order: initialFilters.sort_order,
            };

            const params = mergeQueryParams(existingFilters, localSearch.trim() ? { search: localSearch.trim() } : {});

            router.get(route(routeName), params, {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            });
        }, debounceMs);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localSearch, debounceMs, routeName]);

    const handleFilterChange = useCallback(
        (key: UserFilterKey, value: string | number | boolean | undefined) => {
            // Constrói params mantendo filtros existentes, exceto o que está sendo alterado
            const existingFilters: UserFilterParams = {
                search: initialFilters.search,
                role_id: initialFilters.role_id,
                is_active: initialFilters.is_active,
                has_individual_permissions: initialFilters.has_individual_permissions,
                sort_by: initialFilters.sort_by,
                sort_order: initialFilters.sort_order,
            };

            const params = mergeQueryParams(existingFilters, { [key]: value }, [key]);

            router.get(route(routeName), params, {
                preserveState: true,
                preserveScroll: true,
            });
        },
        [initialFilters, routeName],
    );

    const clearFilters = useCallback(() => {
        router.get(
            route(routeName),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
        setLocalSearch('');
    }, [routeName]);

    const clearSingleFilter = useCallback(
        (key: UserFilterKey) => {
            handleFilterChange(key, undefined);
        },
        [handleFilterChange],
    );

    const focusSearchInput = useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        const inputElement = searchContainerRef.current?.querySelector('input');
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const handleSearchKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape' && localSearch) {
                e.preventDefault();
                setLocalSearch('');
                handleFilterChange('search', '');
            }
        },
        [localSearch, handleFilterChange],
    );

    return {
        localSearch,
        isSearching,
        setLocalSearch,
        handleFilterChange,
        clearFilters,
        clearSingleFilter,
        searchContainerRef,
        focusSearchInput,
        handleSearchKeyDown,
    };
}
