import { stopImpersonation as stopImpersonationVisit } from '@/lib/impersonation';

interface ImpersonateBannerProps {
    active: boolean;
    originalUserName: string | null;
    impersonatedUserName: string | null;
}

export function ImpersonateBanner({ active, originalUserName, impersonatedUserName }: ImpersonateBannerProps) {
    if (!active) {
        return null;
    }

    // Mostra o nome de quem está sendo usado como persona (não quem entrou)
    const displayName = impersonatedUserName || originalUserName || 'este usuário';

    /*
     * `bg-teal-700` e não `-500`: medido nos valores oklch do Tailwind 4.3
     * contra branco, o -500 dá 2.42:1 e reprova os 4.5:1 de texto normal; o
     * -700 dá 5.39:1. Vale para o banner inteiro, não só para o botão.
     */
    return (
        <div className="mb-2 rounded-md bg-teal-700 px-4 py-1.5 text-center text-sm text-white">
            <span>
                Você está usando o painel como <strong>{displayName}</strong>,{' '}
                {/*
                 * Sair da persona é ação, não destino: `<a href="#">` mentia o
                 * papel para o leitor de tela (ficava de fora da lista de
                 * botões) e respondia a Enter mas não a Espaço.
                 */}
                <button type="button" onClick={() => stopImpersonationVisit()} className="cursor-pointer underline hover:no-underline">
                    clique aqui para sair
                </button>
                .
            </span>
        </div>
    );
}
