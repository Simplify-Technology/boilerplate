import { LucideIcon } from 'lucide-react';

/**
 * Tipos genéricos para componentes de tabela de dados
 * Reutilizáveis em outros módulos (CRM, Financeiro, etc.)
 */

// ============================================================================
// Search Bar Types
// ============================================================================

export type SearchBarProps = {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    debounceMs?: number;
    isSearching?: boolean;
    /** Total de resultados da busca corrente. Alimenta a região viva; sem ele, só o "Buscando…" é anunciado. */
    resultCount?: number;
    ariaLabel?: string;
    className?: string;
};

// ============================================================================
// Table Header Types
// ============================================================================

export type TableColumn = {
    key: string;
    label: string;
    icon?: LucideIcon;
    align?: 'left' | 'center' | 'right';
    className?: string;
    sortable?: boolean;
};

export type TableHeaderProps = {
    columns: TableColumn[];
    onSort?: (column: string, order: 'asc' | 'desc') => void;
    currentSort?: {
        column: string;
        order: 'asc' | 'desc';
    };
    className?: string;
};

// ============================================================================
// Pagination Types
// ============================================================================

export type PaginationProps = {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    itemLabel?: string; // Ex: "usuários", "clientes", "transações"
    className?: string;
};

// ============================================================================
// Filter Toggle Types
// ============================================================================

export type FilterToggleProps = {
    isOpen: boolean;
    onToggle: () => void;
    label?: string;
    className?: string;
    activeFiltersCount?: number;
};

// ============================================================================
// Query Params Types
// ============================================================================

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type QueryParamsBuilder = {
    build: (filters: QueryParams) => QueryParams;
    sanitize: (params: QueryParams) => QueryParams;
    merge: (existing: QueryParams, updates: Partial<QueryParams>) => QueryParams;
};
