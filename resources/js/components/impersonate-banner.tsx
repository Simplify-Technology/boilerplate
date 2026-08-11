import { router } from '@inertiajs/react';
import type { MouseEvent } from 'react';

interface ImpersonateBannerProps {
    active: boolean;
    originalUserName: string | null;
    impersonatedUserName: string | null;
}

export function ImpersonateBanner({ active, originalUserName, impersonatedUserName }: ImpersonateBannerProps) {
    if (!active) {
        return null;
    }

    const stopImpersonation = (e: MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        router.delete(route('users.impersonate.stop'));
    };

    // Mostra o nome de quem está sendo usado como persona (não quem entrou)
    const displayName = impersonatedUserName || originalUserName || 'este usuário';

    return (
        <div className="mb-2 rounded-md bg-teal-500 px-4 py-1.5 text-center text-sm text-white">
            <span>
                Você está usando o painel como <strong>{displayName}</strong>,{' '}
                <a href="#" onClick={stopImpersonation} className="cursor-pointer underline hover:no-underline">
                    clique aqui para sair
                </a>
                .
            </span>
        </div>
    );
}
