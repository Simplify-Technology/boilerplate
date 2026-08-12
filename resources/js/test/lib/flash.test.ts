import { registerFlashListener, showFlash } from '@/lib/flash';
import { toastErrorOptions, toastInfoOptions, toastSuccessOptions, toastWarningOptions } from '@/lib/toast-config';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-hot-toast', () => {
    const base = vi.fn();

    return {
        default: Object.assign(base, {
            success: vi.fn(),
            error: vi.fn(),
        }),
    };
});

const mockedToast = vi.mocked(toast);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('showFlash', () => {
    it('exibe cada chave com as opções do toast-config', () => {
        showFlash({ success: 'Deu certo', error: 'Deu errado', warning: 'Cuidado', info: 'Fica sabendo' });

        expect(mockedToast.success).toHaveBeenCalledWith('Deu certo', toastSuccessOptions);
        expect(mockedToast.error).toHaveBeenCalledWith('Deu errado', toastErrorOptions);
        expect(mockedToast).toHaveBeenCalledWith('Cuidado', toastWarningOptions);
        expect(mockedToast).toHaveBeenCalledWith('Fica sabendo', toastInfoOptions);
    });

    it('não exibe nada para flash vazio', () => {
        showFlash({});

        expect(mockedToast.success).not.toHaveBeenCalled();
        expect(mockedToast.error).not.toHaveBeenCalled();
        expect(mockedToast).not.toHaveBeenCalled();
    });

    it('ignora chave presente com string vazia', () => {
        showFlash({ success: '' });

        expect(mockedToast.success).not.toHaveBeenCalled();
    });

    it('exibe só a chave que veio', () => {
        showFlash({ error: 'Só o erro' });

        expect(mockedToast.error).toHaveBeenCalledWith('Só o erro', toastErrorOptions);
        expect(mockedToast.success).not.toHaveBeenCalled();
    });
});

describe('registerFlashListener', () => {
    it('assina o evento nativo `flash` do router', () => {
        const off = vi.fn();
        const on = vi.spyOn(router, 'on').mockReturnValue(off);

        const cleanup = registerFlashListener();

        expect(on).toHaveBeenCalledWith('flash', expect.any(Function));
        expect(cleanup).toBe(off);

        on.mockRestore();
    });

    it('exibe o toast quando o evento dispara', () => {
        let handler: ((event: { detail: { flash: Record<string, string> } }) => void) | undefined;

        const on = vi.spyOn(router, 'on').mockImplementation(((_type: string, callback: never) => {
            handler = callback;

            return vi.fn();
        }) as never);

        registerFlashListener();
        handler?.({ detail: { flash: { success: 'Veio pelo evento' } } });

        expect(mockedToast.success).toHaveBeenCalledWith('Veio pelo evento', toastSuccessOptions);

        on.mockRestore();
    });

    it('devolve a função de remoção do listener', () => {
        // Nenhum componente registra isto hoje (é chamado uma vez em app.tsx),
        // mas quem registrar dentro de um componente precisa do cleanup — a
        // própria doc do Inertia avisa que listener em layout não persistente
        // acumula e dispara várias vezes.
        const off = vi.fn();
        const on = vi.spyOn(router, 'on').mockReturnValue(off);

        registerFlashListener()();

        expect(off).toHaveBeenCalledOnce();

        on.mockRestore();
    });
});
