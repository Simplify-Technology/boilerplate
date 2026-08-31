import { toastPromiseOptions } from '@/lib/toast-config';
import type { UseSettingsActionsOptions, UseSettingsActionsReturn } from '@/types/settings';
import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Hook para gerenciar ações do módulo de Settings
 */
export function useSettingsActions(options: UseSettingsActionsOptions = {}): UseSettingsActionsReturn {
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

    const updateProfile = useCallback(
        async (name: string, email: string) => {
            setIsUpdatingProfile(true);
            setProfileErrors({});

            await toast.promise(
                new Promise((resolve, reject) => {
                    router.patch(
                        route('profile.update'),
                        {
                            name,
                            email,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                setIsUpdatingProfile(false);
                                resolve('Perfil atualizado com sucesso!');
                                options.onUpdateProfileSuccess?.();
                            },
                            onError: (errors) => {
                                setIsUpdatingProfile(false);
                                setProfileErrors(errors as Record<string, string>);
                                reject('Erro ao atualizar perfil!');
                                options.onUpdateProfileError?.();
                            },
                        },
                    );
                }),
                {
                    loading: 'Atualizando perfil...',
                    success: 'Perfil atualizado com sucesso!',
                    error: 'Erro ao atualizar perfil. Por favor, tente novamente.',
                },
                toastPromiseOptions,
            );
        },
        [options],
    );

    const updatePassword = useCallback(
        async (currentPassword: string, password: string, passwordConfirmation: string) => {
            setIsUpdatingPassword(true);
            setPasswordErrors({});

            await toast.promise(
                new Promise((resolve, reject) => {
                    router.put(
                        route('password.update'),
                        {
                            current_password: currentPassword,
                            password,
                            password_confirmation: passwordConfirmation,
                        },
                        {
                            preserveScroll: true,
                            onSuccess: () => {
                                setIsUpdatingPassword(false);
                                resolve('Senha atualizada com sucesso!');
                                options.onUpdatePasswordSuccess?.();
                            },
                            onError: (errors) => {
                                setIsUpdatingPassword(false);
                                setPasswordErrors(errors as Record<string, string>);
                                reject('Erro ao atualizar senha!');
                                options.onUpdatePasswordError?.();
                            },
                        },
                    );
                }),
                {
                    loading: 'Atualizando senha...',
                    success: 'Senha atualizada com sucesso!',
                    error: 'Erro ao atualizar senha. Por favor, tente novamente.',
                },
                toastPromiseOptions,
            );
        },
        [options],
    );

    return {
        updateProfile,
        updatePassword,
        isUpdatingProfile,
        isUpdatingPassword,
        profileErrors,
        passwordErrors,
    };
}
