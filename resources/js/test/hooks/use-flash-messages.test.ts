import { useFlashMessages } from '@/hooks/use-flash-messages';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
    default: Object.assign(vi.fn(), {
        success: vi.fn(),
        error: vi.fn(),
    }),
}));

import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';

const mockedToast = toast as unknown as {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
};

/**
 * O Inertia expõe `url` no objeto de página, não entre as props — e o `share()`
 * não publica nenhuma chave `url`. Lendo de `props`, o valor era sempre
 * undefined e o reset de dedupe por página nunca disparava.
 */
function mockPage(url: string, flash: Record<string, string> | undefined) {
    (usePage as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        url,
        props: { flash },
    });
}

describe('useFlashMessages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a flash message once', () => {
        mockPage('/users', { success: 'Usuário criado' });

        renderHook(() => useFlashMessages());

        expect(mockedToast.success).toHaveBeenCalledTimes(1);
        expect(mockedToast.success).toHaveBeenCalledWith('Usuário criado', expect.anything());
    });

    it('does not repeat the same message on a re-render of the same page', () => {
        mockPage('/users', { success: 'Repetida na mesma página' });

        const { rerender } = renderHook(() => useFlashMessages());
        rerender();

        expect(mockedToast.success).toHaveBeenCalledTimes(1);
    });

    it('shows the same text again after navigating to another page', () => {
        // Antes do fix, `currentUrl` era sempre '' e a chave global de dedupe
        // (`${url}::${flash}`) colidia entre telas: a segunda ocorrência era
        // engolida até o intervalo de limpeza de 10s passar.
        mockPage('/users', { success: 'Operação concluída' });
        renderHook(() => useFlashMessages());

        mockPage('/permissions/roles', { success: 'Operação concluída' });
        renderHook(() => useFlashMessages());

        expect(mockedToast.success).toHaveBeenCalledTimes(2);
    });

    it('stays quiet when there is no flash', () => {
        mockPage('/dashboard', undefined);

        renderHook(() => useFlashMessages());

        expect(mockedToast.success).not.toHaveBeenCalled();
        expect(mockedToast.error).not.toHaveBeenCalled();
    });
});
