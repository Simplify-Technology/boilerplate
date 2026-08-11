import { Role, User } from './index';

export type { User };

/**
 * Tipos relacionados ao módulo de Usuários
 * Todos os tipos devem estar aqui, nunca inline nos componentes
 */

// ============================================================================
// Filter Types
// ============================================================================

export type UserFilterParams = {
    search?: string;
    role_id?: number | string;
    is_active?: boolean | string;
    has_individual_permissions?: boolean | string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
};

export type UserFilterKey = keyof UserFilterParams;

// ============================================================================
// Action Types
// ============================================================================

export type UserActionType = 'delete' | 'toggle_active' | 'impersonate' | 'assign_role' | 'revoke_role' | 'add_permission' | 'edit' | 'view';

export type UserActionHandlers = {
    onDelete: (user: User) => void;
    onToggleActive: (user: User) => void;
    onImpersonate: (user: User) => void;
    onAssignRole: (user: User) => void;
    onRevokeRole: (user: User) => void;
    onAddPermission: (user: User) => void;
    onEdit: (user: User) => void;
    onView: (user: User) => void;
};

// ============================================================================
// Modal Types
// ============================================================================

export type UserModalType = 'delete' | 'add_permission' | 'assign_role' | 'revoke_role' | 'info';

export type UserModalState = {
    type: UserModalType | null;
    isOpen: boolean;
    user: User | null;
    isProcessing: boolean;
};

export type UserModalActions = {
    openModal: (type: UserModalType, user?: User) => void;
    closeModal: () => void;
    setProcessing: (processing: boolean) => void;
};

// ============================================================================
// Component Props Types
// ============================================================================

export type UserTableRowProps = {
    user: User;
    index: number;
    onView: (user: User) => void;
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
    onToggleActive?: (user: User) => void;
    onImpersonate?: (user: User) => void;
    onAssignRole?: (user: User) => void;
    onRevokeRole?: (user: User) => void;
    onAddPermission?: (user: User) => void;
    canDelete: (user: User) => boolean;
    canEdit: boolean;
    canImpersonate: (user: User) => boolean;
    canManagePermissions: boolean;
    canAssignRoles: boolean;
    getUserInitials: (name: string) => string;
};

export type UserActionsMenuProps = {
    user: User;
    onView: (user: User) => void;
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
    onToggleActive?: (user: User) => void;
    onImpersonate?: (user: User) => void;
    onAssignRole?: (user: User) => void;
    onRevokeRole?: (user: User) => void;
    onAddPermission?: (user: User) => void;
    canDelete: (user: User) => boolean;
    canEdit: boolean;
    canImpersonate: (user: User) => boolean;
    canManagePermissions: boolean;
    canAssignRoles: boolean;
    isDeleting?: boolean;
};

export type UserInfoDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export type UsersPageProps = {
    users: User[];
    roles: Role[];
    assignableRoles?: Role[];
    filters?: UserFilterParams;
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

// ============================================================================
// Callback Types
// ============================================================================

export type OnUserAction = (user: User, action: UserActionType) => void;
export type OnFilterChange = (key: UserFilterKey, value: string | number | boolean | undefined) => void;
export type OnPageChange = (page: number) => void;

// ============================================================================
// Permission Check Types
// ============================================================================

// ============================================================================
// Configuration Types
// ============================================================================

export type UserTableConfig = {
    showMobile?: boolean;
    showActions?: boolean;
    enableSorting?: boolean;
};

// ============================================================================
// Form Types
// ============================================================================

export type UserFormData = {
    name: string;
    email: string;
    cpf_cnpj?: string;
    phone?: string;
    mobile?: string;
    password?: string;
    password_confirmation?: string;
    role_id?: number | null;
    is_active?: boolean;
    user_notes?: string;
};

export type UserFormProps = {
    user?: User | null;
    roles: Role[];
    onSubmit?: (data: UserFormData) => void;
    isProcessing?: boolean;
    errors?: Record<string, string>;
    routeName: string;
    routeParams?: Record<string, string | number>;
};
