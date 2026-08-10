import type { QueryParams } from '@/types/data-table';
import { INVALID_FILTER_VALUES } from './constants';

/**
 * Utilitários genéricos para construção e manipulação de query params
 * Reutilizáveis em todos os módulos que precisam de filtros/paginação
 */

/**
 * Valida se um valor é válido para ser incluído nos query params
 */
export function isValidFilterValue(value: unknown): boolean {
    if (INVALID_FILTER_VALUES.includes(value as never)) {
        return false;
    }
    return value !== null && value !== undefined;
}

/**
 * Sanitiza query params removendo valores inválidos
 */
export function sanitizeQueryParams(params: QueryParams): QueryParams {
    const sanitized: QueryParams = {};

    for (const [key, value] of Object.entries(params)) {
        if (isValidFilterValue(value)) {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Constrói query params a partir de um objeto de filtros
 * Remove valores inválidos e undefined
 */
export function buildQueryParams(filters: QueryParams): QueryParams {
    return sanitizeQueryParams(filters);
}

/**
 * Mescla query params existentes com atualizações
 * Remove a chave que está sendo atualizada dos params existentes
 * e adiciona o novo valor se for válido
 */
export function mergeQueryParams(existing: QueryParams, updates: Partial<QueryParams>, keysToRemove?: string[]): QueryParams {
    const merged: QueryParams = { ...existing };

    // Remove chaves que estão sendo atualizadas ou explicitamente removidas
    const keysToExclude = new Set([...Object.keys(updates), ...(keysToRemove || [])]);

    keysToExclude.forEach((key) => {
        delete merged[key];
    });

    // Adiciona novos valores válidos
    Object.entries(updates).forEach(([key, value]) => {
        if (isValidFilterValue(value)) {
            merged[key] = value;
        }
    });

    return sanitizeQueryParams(merged);
}

/**
 * Limpa query params, retornando apenas os valores válidos
 * Útil para resetar filtros mantendo apenas paginação ou ordenação
 */
export function clearQueryParams(params: QueryParams, keepKeys: string[] = []): QueryParams {
    const cleared: QueryParams = {};

    keepKeys.forEach((key) => {
        if (isValidFilterValue(params[key])) {
            cleared[key] = params[key];
        }
    });

    return cleared;
}

/**
 * Constrói query params para paginação
 */
export function buildPaginationParams(page: number, existingParams?: QueryParams): QueryParams {
    const params: QueryParams = {
        ...(existingParams || {}),
        page,
    };

    return sanitizeQueryParams(params);
}

/**
 * Constrói query params para ordenação
 */
export function buildSortParams(sortBy: string, sortOrder: 'asc' | 'desc', existingParams?: QueryParams): QueryParams {
    const params: QueryParams = {
        ...(existingParams || {}),
        sort_by: sortBy,
        sort_order: sortOrder,
    };

    return sanitizeQueryParams(params);
}
