import { startImpersonation } from '@/lib/impersonation';
import type { User, UserActionHandlers } from '@/types/users';
import { router } from '@inertiajs/react';
import { useCallback } from 'react';

export type UseUserActionsOptions = {
    onDeleteSuccess?: () => void;
    onDeleteError?: () => void;
    onToggleSuccess?: () => void;
    onRevokeRoleSuccess?: () => void;
    onRevokeRoleError?: () => void;
};

/**
 * Hook para centralizar handlers de ações de usuários
 * Gerencia chamadas ao backend e callbacks de sucesso/erro
 */
export function useUserActions(options: UseUserActionsOptions = {}): UserActionHandlers {
    const { onDeleteSuccess, onDeleteError, onToggleSuccess, onRevokeRoleSuccess, onRevokeRoleError } = options;

    const handleDelete = useCallback(
        (user: User) => {
            router.delete(route('users.destroy', user.id), {
                preserveScroll: true,
                onSuccess: () => {
                    onDeleteSuccess?.();
                },
                onError: () => {
                    onDeleteError?.();
                },
            });
        },
        [onDeleteSuccess, onDeleteError],
    );

    const handleToggleActive = useCallback(
        (user: User) => {
            router.patch(
                route('users.toggle-active', user.id),
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        onToggleSuccess?.();
                    },
                },
            );
        },
        [onToggleSuccess],
    );

    const handleImpersonate = useCallback((user: User) => {
        startImpersonation(user.id);
    }, []);

    const handleAssignRole = useCallback(() => {
        // Esta ação abre um modal, então não precisa de handler aqui
        // O handler real está no componente que gerencia o modal
    }, []);

    const handleRevokeRole = useCallback(
        (user: User) => {
            router.delete(route('user.revoke-role', user.id), {
                preserveScroll: true,
                onSuccess: () => {
                    onRevokeRoleSuccess?.();
                },
                onError: () => {
                    onRevokeRoleError?.();
                },
            });
        },
        [onRevokeRoleSuccess, onRevokeRoleError],
    );

    const handleAddPermission = useCallback(() => {
        // Esta ação abre um modal, então não precisa de handler aqui
    }, []);

    const handleEdit = useCallback((user: User) => {
        router.visit(route('users.edit', user.id));
    }, []);

    const handleView = useCallback((user: User) => {
        router.visit(route('users.show', user.id));
    }, []);

    return {
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
        onImpersonate: handleImpersonate,
        onAssignRole: handleAssignRole,
        onRevokeRole: handleRevokeRole,
        onAddPermission: handleAddPermission,
        onEdit: handleEdit,
        onView: handleView,
    };
}
