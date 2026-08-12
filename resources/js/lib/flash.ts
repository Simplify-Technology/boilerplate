import { toastErrorOptions, toastInfoOptions, toastSuccessOptions, toastWarningOptions } from '@/lib/toast-config';
import type { FlashMessages } from '@/types';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';

/**
 * Consumo de flash, em um lugar só.
 *
 * O flash nativo do Inertia 3 vive no OBJETO DE PÁGINA (irmão de `component`,
 * `props` e `url`), não entre as props — então nenhum filtro de partial reload
 * o alcança, e o servidor o descarta assim que ele chega ao cliente.
 *
 * O evento `flash` dispara uma vez por resposta que carregue flash, o que
 * dispensa toda a maquinaria de deduplicação que o hook antigo precisava ter:
 * como o dado morava em props, ele reaparecia a cada re-render e a cada volta
 * no histórico. Se você sentir vontade de somar um cache de "já exibi este",
 * pare — é sinal de que alguém voltou a publicar flash como prop.
 */
export function showFlash(flash: FlashMessages): void {
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
}

/**
 * Liga o consumo global. Chamado UMA vez, no ponto de montagem (`app.tsx`).
 *
 * Página nenhuma consome flash — foi justamente o consumo opt-in por página
 * que deixou 8 das 17 telas mudas, incluindo o login, para onde
 * `EnsureUserIsActive` manda o aviso de conta desativada.
 *
 * Devolve a função de remoção que o `router.on` entrega. O `app.tsx` não a
 * usa (o listener vive enquanto a página viver), mas ela existe para os
 * testes e para quem um dia registrar isto dentro de um componente.
 */
export function registerFlashListener(): () => void {
    return router.on('flash', (event) => showFlash(event.detail.flash));
}
