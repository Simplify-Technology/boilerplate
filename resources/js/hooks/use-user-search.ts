import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type UserSearchParams = {
    search?: string;
    role_id?: string | number;
    is_active?: boolean | string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
};

export type UseUserSearchOptions = {
    users: Array<{ name?: string; email?: string; role?: { id?: number } | null; is_active?: boolean }>;
    initialFilters?: UserSearchParams;
    routeName: string;
    debounceMs?: number;
};

export default function useUserSearch({ users, initialFilters = {}, routeName, debounceMs = 300 }: UseUserSearchOptions) {
    const [searchParams, setSearchParams] = useState<UserSearchParams>({
        search: initialFilters.search || '',
        role_id: initialFilters.role_id,
        is_active: initialFilters.is_active,
        sort_by: initialFilters.sort_by || 'created_at',
        sort_order: initialFilters.sort_order || 'desc',
        page: initialFilters.page || 1,
    });

    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearch = useDebouncedValue(searchParams.search, debounceMs);

    // Navega quando a busca "assenta" (debounce), nunca a cada tecla.
    useEffect(() => {
        if (debouncedSearch === (initialFilters.search || '')) {
            return;
        }

        setIsSearching(true);

        router.get(
            route(routeName),
            {
                ...searchParams,
                search: debouncedSearch || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsSearching(false),
            },
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, routeName]);

    const handleFilterChange = useCallback(
        (key: string, value: string | number | boolean | undefined) => {
            const newParams = {
                ...searchParams,
                [key]: value === 'all' || value === '' || value === null ? undefined : value,
                page: 1, // Reset to first page on filter change
            };
            setSearchParams(newParams);

            router.get(
                route(routeName),
                {
                    ...newParams,
                    search: newParams.search || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        },
        [searchParams, routeName],
    );

    const clearFilters = useCallback(() => {
        const clearedParams = {
            search: '',
            role_id: undefined,
            is_active: undefined,
            sort_by: 'created_at',
            sort_order: 'desc',
            page: 1,
        };
        setSearchParams(clearedParams);

        router.get(
            route(routeName),
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }, [routeName]);

    const clearSingleFilter = useCallback(
        (key: string) => {
            handleFilterChange(key, undefined);
        },
        [handleFilterChange],
    );

    // Filter users client-side for instant feedback (if needed)
    const filteredUsers = useMemo(() => {
        if (!searchParams.search && !searchParams.role_id && searchParams.is_active === undefined) {
            return users;
        }

        return users.filter((user) => {
            if (searchParams.search) {
                const search = searchParams.search.toLowerCase();
                const matchesSearch = user.name?.toLowerCase().includes(search) || user.email?.toLowerCase().includes(search);
                if (!matchesSearch) return false;
            }

            if (searchParams.role_id && user.role?.id !== Number(searchParams.role_id)) {
                return false;
            }

            if (searchParams.is_active !== undefined) {
                const isActiveFilter = searchParams.is_active === true || searchParams.is_active === 'true';
                if (user.is_active !== isActiveFilter) return false;
            }

            return true;
        });
    }, [users, searchParams.search, searchParams.role_id, searchParams.is_active]);

    const setSearch = useCallback((value: string) => {
        setSearchParams((current) => ({ ...current, search: value, page: 1 }));
    }, []);

    return {
        searchParams,
        isSearching,
        filteredUsers,
        setSearch,
        handleFilterChange,
        clearFilters,
        clearSingleFilter,
    };
}
