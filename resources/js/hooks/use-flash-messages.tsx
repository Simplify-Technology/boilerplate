import { toastErrorOptions, toastInfoOptions, toastSuccessOptions, toastWarningOptions } from '@/lib/toast-config';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

interface WindowWithFlashCleanup extends Window {
    __flashCleanupInterval?: ReturnType<typeof setInterval>;
}

// Store global para rastrear flashes já exibidos (persiste entre navegações)
// Usa Map com timestamp para limpeza automática
const displayedFlashes = new Map<string, number>();

// Limpa flashes antigos periodicamente (evita memory leak)
// Usa uma única instância do interval para evitar múltiplos timers
if (typeof window !== 'undefined' && !(window as WindowWithFlashCleanup).__flashCleanupInterval) {
    (window as WindowWithFlashCleanup).__flashCleanupInterval = setInterval(() => {
        const now = Date.now();
        const maxAge = 10000; // 10 segundos

        for (const [key, timestamp] of displayedFlashes.entries()) {
            if (now - timestamp > maxAge) {
                displayedFlashes.delete(key);
            }
        }
    }, 5000);
}

export function useFlashMessages() {
    // `url` vive no objeto de página do Inertia, não entre as props — e o
    // `share()` não publica nenhuma chave `url`. Lido de `props`, era sempre
    // `undefined`, e o reset de dedupe ao trocar de página nunca acontecia:
    // a mesma mensagem em outra tela ficava engolida pela chave global até o
    // intervalo de limpeza de 10s passar.
    const page = usePage<{ flash?: FlashMessages }>();
    const { flash } = page.props;
    const url = page.url;
    const componentRef = useRef<{ lastFlash: string; lastUrl: string }>({
        lastFlash: '',
        lastUrl: '',
    });

    useEffect(() => {
        const currentUrl = url || '';

        // Se mudou de URL, reseta o flash local (permite novos flashes em nova página)
        if (currentUrl !== componentRef.current.lastUrl) {
            componentRef.current.lastFlash = '';
            componentRef.current.lastUrl = currentUrl;
        }

        // Se não há flash ou flash vazio, não faz nada
        if (!flash || (!flash.success && !flash.error && !flash.warning && !flash.info)) {
            return;
        }

        // Cria uma string única identificando o flash atual
        const flashContent = JSON.stringify(flash);
        const flashKey = `${currentUrl}::${flashContent}`;

        // Verifica se já foi exibido antes (globalmente ou nesta instância)
        const alreadyDisplayed = flashContent === componentRef.current.lastFlash || displayedFlashes.has(flashKey);

        if (!alreadyDisplayed) {
            // Exibe as notificações
            if (flash.success) {
                toast.success(flash.success, toastSuccessOptions);
            }
            if (flash.error) {
                toast.error(flash.error, toastErrorOptions);
            }
            if (flash.warning) {
                toast(flash.warning, toastWarningOptions);
            }
            if (flash.info) {
                toast(flash.info, toastInfoOptions);
            }

            // Marca como exibido (globalmente e localmente)
            displayedFlashes.set(flashKey, Date.now());
            componentRef.current.lastFlash = flashContent;
            componentRef.current.lastUrl = currentUrl;
        }
    }, [flash, url]);
}
