import AppearanceTabs from '@/components/appearance-tabs';
import type { Appearance } from '@/hooks/use-appearance';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/*
 * O seletor de tema era uma <div> de três <button> cujo estado ativo vivia só
 * na cor de fundo. O nome de cada opção existia (é texto visível); o que
 * faltava era o ESTADO — qual está escolhida — e ele vinha em inglês num
 * produto pt-BR. Estes casos travam o contrato público (papel, nome, estado
 * ARIA e o valor emitido), não a implementação.
 */

const hook = vi.hoisted(() => ({
    appearance: 'system' as Appearance,
    updateAppearance: vi.fn(),
}));

vi.mock('@/hooks/use-appearance', () => ({
    useAppearance: () => ({ appearance: hook.appearance, updateAppearance: hook.updateAppearance }),
}));

beforeEach(() => {
    hook.appearance = 'system';
    hook.updateAppearance.mockReset();
});

describe('AppearanceTabs', () => {
    it('is a radiogroup named "Tema" with the three options in pt-BR', () => {
        render(<AppearanceTabs />);

        expect(screen.getByRole('radiogroup', { name: 'Tema' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Claro' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Escuro' })).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Sistema' })).toBeInTheDocument();
        expect(screen.queryByRole('radio', { name: /light|dark|system/i })).toBeNull();
    });

    it('exposes the active theme as aria-checked, not just as a colour', () => {
        hook.appearance = 'dark';

        render(<AppearanceTabs />);

        const active = screen.getByRole('radio', { name: 'Escuro' });

        expect(active).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('radio', { name: 'Claro' })).toHaveAttribute('aria-checked', 'false');
        expect(screen.getByRole('radio', { name: 'Sistema' })).toHaveAttribute('aria-checked', 'false');
        // Em seleção única o Radix anula aria-pressed de propósito: o estado é aria-checked.
        expect(active).not.toHaveAttribute('aria-pressed');
    });

    it('updates the appearance with the stored value, never with the label', () => {
        render(<AppearanceTabs />);

        fireEvent.click(screen.getByRole('radio', { name: 'Claro' }));

        expect(hook.updateAppearance).toHaveBeenCalledTimes(1);
        expect(hook.updateAppearance).toHaveBeenCalledWith('light');
    });

    it('ignores the empty value a single-select group emits when the active option is clicked again', () => {
        hook.appearance = 'dark';

        render(<AppearanceTabs />);

        fireEvent.click(screen.getByRole('radio', { name: 'Escuro' }));

        expect(hook.updateAppearance).not.toHaveBeenCalled();
    });

    it('moves focus between options with the arrow keys', async () => {
        render(<AppearanceTabs />);

        const claro = screen.getByRole('radio', { name: 'Claro' });
        claro.focus();
        fireEvent.keyDown(claro, { key: 'ArrowRight' });

        // O foco itinerante do Radix move no próximo tick (setTimeout), não no mesmo evento.
        await waitFor(() => expect(screen.getByRole('radio', { name: 'Escuro' })).toHaveFocus());
    });
});
