import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const flushAll = vi.fn();
const post = vi.fn();
const del = vi.fn();
const calls: string[] = [];

vi.mock('@inertiajs/react', () => ({
    router: {
        flushAll: (...args: unknown[]) => {
            calls.push('flushAll');

            return flushAll(...args);
        },
        post: (...args: unknown[]) => {
            calls.push('post');

            return post(...args);
        },
        delete: (...args: unknown[]) => {
            calls.push('delete');

            return del(...args);
        },
        visit: vi.fn(),
        patch: vi.fn(),
    },
}));

import { ImpersonateBanner } from '@/components/impersonate-banner';
import { useUserActions } from '@/hooks/users/use-user-actions';
import { startImpersonation, stopImpersonation } from '@/lib/impersonation';
import type { User } from '@/types/users';

beforeEach(() => {
    calls.length = 0;
    vi.clearAllMocks();
});

/*
 * O cache de prefetch do Inertia guarda respostas por URL e não sabe quem estava
 * autenticado quando foram buscadas. Com 6 superfícies `<Link prefetch>` no
 * painel e os controllers de impersonation devolvendo 302 (não
 * `Inertia::location()`), o cache atravessa a troca de identidade inteiro — e
 * um prefetch de /settings/profile feito pelo admin mostra o nome e o e-mail
 * dele durante a personificação.
 *
 * Estes testes travam as duas metades da defesa: o módulo invalida, e ninguém
 * fora dele fala com as rotas de impersonation.
 */

describe('lib/impersonation', () => {
    it('invalidates the prefetch cache before starting impersonation', () => {
        startImpersonation(7);

        expect(flushAll).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenCalledTimes(1);
        expect(calls).toEqual(['flushAll', 'post']);
    });

    it('invalidates the prefetch cache before stopping impersonation', () => {
        stopImpersonation();

        expect(flushAll).toHaveBeenCalledTimes(1);
        expect(del).toHaveBeenCalledTimes(1);
        expect(calls).toEqual(['flushAll', 'delete']);
    });

    it('forwards visit options so callers keep their own onSuccess/onError', () => {
        const onError = vi.fn();

        startImpersonation(7, { onError });

        expect(post).toHaveBeenCalledWith(expect.anything(), {}, { onError });
    });
});

describe('call sites', () => {
    it('flushes the cache when the banner stops impersonation', async () => {
        render(<ImpersonateBanner active originalUserName="Ana" impersonatedUserName="Bruno" />);

        // `button`, não `link`: sair da persona é ação, não navegação.
        await userEvent.click(screen.getByRole('button', { name: /clique aqui para sair/i }));

        expect(calls).toEqual(['flushAll', 'delete']);
    });

    it('flushes the cache when the user list starts impersonation', () => {
        const user = { id: 9 } as User;

        renderHook(() => useUserActions({})).result.current.onImpersonate(user);

        expect(calls).toEqual(['flushAll', 'post']);
    });
});
