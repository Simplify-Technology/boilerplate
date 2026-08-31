import { toastPromiseOptions } from '@/lib/toast-config';
import type { PermissionActionHandlers } from '@/types/permissions';
import { router, useForm } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

export type UsePermissionActionsOptions = {
    onSaveSuccess?: () => void;
    onSaveError?: () => void;
    onAssignRoleSuccess?: () => void;
    onAssignRoleError?: () => void;
    onRevokeRoleSuccess?: () => void;
    onRevokeRoleError?: () => void;
};

export type UsePermissionActionsReturn = PermissionActionHandlers & {
    isSaving: boolean;
    isAssigningRole: boolean;
    isRevokingRole: boolean;
};

/**
 * Hook para gerenciar ações do módulo de Permissões
 */
export function usePermissionActions(options: UsePermissionActionsOptions = {}): UsePermissionActionsReturn {
    const { put, processing: isSaving } = useForm({});
    const [isAssigningRole, setIsAssigningRole] = useState(false);
    const [isRevokingRole, setIsRevokingRole] = useState(false);

    const onSavePermissions = useCallback(
        async (roleName: string, permissionNames: string[]) => {
            await toast.promise(
                new Promise((resolve, reject) => {
                    put(
                        route('roles-permissions.update', {
                            role: roleName,
                            permissions: permissionNames,
                        }),
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                resolve('Permissões atualizadas com sucesso!');
                                options.onSaveSuccess?.();
                            },
                            onError: () => {
                                reject('Erro ao atualizar permissões!');
                                options.onSaveError?.();
                            },
                        },
                    );
                }),
                {
                    loading: 'Salvando permissões...',
                    success: 'Permissões salvas com sucesso!',
                    error: 'Erro ao salvar permissões. Por favor, tente novamente.',
                },
                toastPromiseOptions,
            );
        },
        [put, options],
    );

    const onAssignRole = useCallback(
        async (userId: number) => {
            setIsAssigningRole(true);
            await toast.promise(
                new Promise((resolve, reject) => {
                    router.post(
                        route('user.assign-role', userId),
                        {},
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                resolve('Cargo atribuído com sucesso!');
                                setIsAssigningRole(false);
                                options.onAssignRoleSuccess?.();
                            },
                            onError: () => {
                                reject('Erro ao atribuir cargo!');
                                setIsAssigningRole(false);
                                options.onAssignRoleError?.();
                            },
                        },
                    );
                }),
                {
                    loading: 'Atribuindo cargo...',
                    success: 'Cargo atribuído com sucesso!',
                    error: 'Erro ao atribuir cargo. Por favor, tente novamente.',
                },
                toastPromiseOptions,
            );
        },
        [options],
    );

    const onRevokeRole = useCallback(
        async (userId: number) => {
            setIsRevokingRole(true);
            await toast.promise(
                new Promise((resolve, reject) => {
                    router.delete(route('user.revoke-role', userId), {
                        preserveScroll: true,
                        onSuccess: () => {
                            resolve('Cargo removido com sucesso!');
                            setIsRevokingRole(false);
                            options.onRevokeRoleSuccess?.();
                        },
                        onError: () => {
                            reject('Erro ao remover cargo!');
                            setIsRevokingRole(false);
                            options.onRevokeRoleError?.();
                        },
                    });
                }),
                {
                    loading: 'Removendo cargo...',
                    success: 'Cargo removido com sucesso!',
                    error: 'Erro ao remover cargo. Por favor, tente novamente.',
                },
                toastPromiseOptions,
            );
        },
        [options],
    );

    return {
        onSavePermissions,
        onAssignRole,
        onRevokeRole,
        isSaving,
        isAssigningRole,
        isRevokingRole,
    };
}
