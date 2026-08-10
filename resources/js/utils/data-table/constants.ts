/**
 * Constantes do kit genérico de tabela de dados.
 * Este módulo não pode depender de nenhum domínio (users, crm, ...).
 */

/**
 * Valores que representam "sem filtro" e nunca devem ir para a query string.
 * `'all'` é o valor sentinela dos selects de filtro.
 */
export const INVALID_FILTER_VALUES = ['all', '', null, undefined] as const;
