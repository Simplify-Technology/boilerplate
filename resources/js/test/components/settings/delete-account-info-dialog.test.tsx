import { DeleteAccountInfoDialog } from '@/components/settings/delete-account-info-dialog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/*
 * O diálogo informativo da exclusão de conta pinta cada seção com uma cor de
 * estado: o que se perde (destructive), o que protege (success) e o que
 * conferir antes (warning). O que está travado aqui é que a cor vem do `fg`
 * do trio — medido contra canvas, card e popover nos dois temas em
 * `test/styles/theme-tokens.test.ts` — e não de `text-red-600 dark:…`, que
 * ficava fora de qualquer contrato de contraste.
 */
describe('DeleteAccountInfoDialog — cor de estado vem do token do papel', () => {
    const iconeDaSecao = (titulo: string) => screen.getByRole('heading', { name: titulo }).parentElement!.querySelector('svg');

    it('o chip do título é o trio destructive', () => {
        render(<DeleteAccountInfoDialog open onOpenChange={vi.fn()} />);

        const heading = screen.getByRole('heading', { name: 'Informações sobre Exclusão de Conta' });
        const chip = heading.querySelector('div');

        expect(chip).toHaveClass('bg-state-destructive');
        expect(chip!.querySelector('svg')).toHaveClass('text-state-destructive');
    });

    it('a palavra "irreversível" é texto em cor de estado sobre o card, não literal da paleta', () => {
        render(<DeleteAccountInfoDialog open onOpenChange={vi.fn()} />);

        const destaque = screen.getByText('irreversível');

        expect(destaque.tagName).toBe('STRONG');
        expect(destaque).toHaveClass('text-state-destructive');
        expect([...destaque.classList].some((c) => /-(red|rose)-\d+/.test(c))).toBe(false);
    });

    it('cada seção veste o estado que descreve: perda, proteção e conferência', () => {
        render(<DeleteAccountInfoDialog open onOpenChange={vi.fn()} />);

        expect(iconeDaSecao('O que acontece ao excluir')).toHaveClass('text-state-destructive');
        expect(iconeDaSecao('Processo de Exclusão')).toHaveClass('text-state-destructive');
        expect(iconeDaSecao('Segurança')).toHaveClass('text-state-success');
        expect(iconeDaSecao('Antes de Excluir')).toHaveClass('text-state-warning');
    });

    it('a seção de segurança não é pintada como perda', () => {
        render(<DeleteAccountInfoDialog open onOpenChange={vi.fn()} />);

        expect(iconeDaSecao('Segurança')).not.toHaveClass('text-state-destructive');
        expect(iconeDaSecao('Antes de Excluir')).not.toHaveClass('text-state-destructive');
    });
});
