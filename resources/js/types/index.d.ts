import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';
import type { Config } from 'ziggy-js';

/**
 * Usuário autenticado como ele chega em toda página, e nada além disso.
 * Espelha `HandleInertiaRequests::SHARED_USER_FIELDS` — os dois mudam juntos.
 *
 * Cargo e permissões NÃO vêm por aqui: são `auth.roles` e `auth.permissions`.
 * Para o usuário completo (cpf_cnpj, phone, mobile, user_notes) use o `User`
 * que as páginas do módulo recebem via `UserResource`.
 */
export interface AuthUser {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    /** Nunca vem do servidor — só existe para o `<AvatarImage>`. */
    avatar?: string;
}

export interface Auth {
    user: AuthUser;
    roles: string[] | Role[]; // Array de nomes (string) ou objetos Role
    permissions: string[] | Permission[]; // Array de nomes (string) ou objetos Permission
    impersonating?: {
        active?: boolean;
        originalUserName?: string | null;
        impersonatedUserName?: string | null;
    };
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    permission?: string;
    role?: string;
}

/**
 * Mensagens de uma ação, consumidas por `useFlashMessages`. Espelha o bloco
 * `flash` de `HandleInertiaRequests::share()` — as quatro chaves vêm sempre,
 * com `null` quando não há mensagem.
 */
export interface FlashMessages {
    success: string | null;
    error: string | null;
    warning: string | null;
    info: string | null;
}

/**
 * Props globais que toda página recebe. Espelha `HandleInertiaRequests::share()`
 * — os dois mudam juntos, e `tests/Feature/SharedPropsTest.php` trava o shape
 * dos dois lados.
 *
 * `errors` não vem do `share()`: o middleware do Inertia injeta em toda
 * resposta. Está aqui porque o tipo descreve o que a página RECEBE.
 */
export interface SharedData {
    errors: Record<string, string>;
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: FlashMessages;
    ziggy: Config & { location: string };

    // Exigido pelo constraint `PageProps` do @inertiajs/react: sem o index
    // signature, `usePage<SharedData>()` não compila. Ou seja, o tipo é
    // necessariamente mais largo que o payload e NÃO consegue barrar prop
    // global nova sozinho — quem barra é o contrato de runtime em
    // tests/Feature/SharedPropsTest.php. Não remova achando que é desleixo.
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    cpf_cnpj?: string | null;
    mobile?: string | null;
    phone?: string | null;
    is_active: boolean;
    user_notes?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    role?: Role | null;
    permissions?: Permission[];
    custom_permissions_count?: number;
    custom_permissions_list?: Array<{
        name: string;
        label: string;
        meta?: {
            can_impersonate_any?: boolean;
        };
    }>;
    created_at: string;
    updated_at: string;

    [key: string]: unknown; // This allows for additional properties...
}

export interface Permission {
    name: string;
    label: string;
}

export interface Role {
    id?: number;
    name: string;
    label?: string;
    permissions?: Permission[];
    users?: User[];
}

export interface PermissionGuardProps {
    permission?: string;
    role?: string;
    children: ReactNode;

    [key: string]: unknown;
}
