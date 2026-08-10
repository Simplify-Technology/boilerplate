/**
 * Constantes relacionadas ao módulo de Usuários
 * Elimina valores mágicos espalhados pelo código
 */

// ============================================================================
// Role Constants
// ============================================================================

export const SUPER_USER_ROLE = 'super_user';
export const ADMIN_ROLE = 'admin';

// ============================================================================
// Timing Constants
// ============================================================================

export const SEARCH_DEBOUNCE_DELAY = 300; // ms
export const DEFAULT_PER_PAGE = 15;

// ============================================================================
// Filter Constants
// ============================================================================

export const DEFAULT_SORT_BY = 'created_at';
export const DEFAULT_SORT_ORDER = 'desc' as const;

export const ALLOWED_SORT_FIELDS = ['name', 'email', 'created_at', 'updated_at'] as const;

// ============================================================================
// Permission Constants
// ============================================================================

export const PERMISSION_MANAGE_USERS = 'manage_users';
export const PERMISSION_ASSIGN_ROLES = 'assign_roles';
export const PERMISSION_IMPERSONATE_USERS = 'impersonate_users';

// ============================================================================
// UI Constants
// ============================================================================

export const USER_AVATAR_SIZE = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
} as const;

export const TABLE_ROW_HOVER_CLASSES =
    'group transition-all duration-200 ease-in-out will-change-transform hover:bg-muted/40 dark:hover:bg-muted/20 hover:shadow-sm';
