import { CurrencyInput } from '@/components/ui/currency-input';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

function Controlled({ initial = null, onCents }: { initial?: number | null; onCents?: (cents: number | null) => void }) {
    const [cents, setCents] = useState<number | null>(initial);

    return (
        <CurrencyInput
            aria-label="Preço"
            value={cents}
            onChange={(next) => {
                setCents(next);
                onCents?.(next);
            }}
        />
    );
}

/**
 * Campo de dinheiro com texto livre convertido só no submit produz dois erros
 * invisíveis: "9980" grava R$ 9.980,00 e "abc" grava R$ 0,00 com toast de
 * sucesso. Estes testes travam as duas correções: o texto exibido É o valor,
 * e vazio é `null`, nunca zero.
 */
describe('CurrencyInput', () => {
    it('preenche da direita: "9980" é R$ 99,80, não R$ 9.980,00', async () => {
        const user = userEvent.setup();
        const onCents = vi.fn();
        render(<Controlled onCents={onCents} />);

        const input = screen.getByLabelText('Preço');
        await user.type(input, '9980');

        expect(input).toHaveValue('99,80');
        expect(onCents).toHaveBeenLastCalledWith(9980);
    });

    it('agrupa o milhar enquanto digita', async () => {
        const user = userEvent.setup();
        render(<Controlled />);

        const input = screen.getByLabelText('Preço');
        await user.type(input, '129990');

        expect(input).toHaveValue('1.299,90');
    });

    it('mostra o valor gravado formatado', () => {
        render(<Controlled initial={12990} />);

        expect(screen.getByLabelText('Preço')).toHaveValue('129,90');
    });

    it('campo vazio devolve null, e não zero', async () => {
        const user = userEvent.setup();
        const onCents = vi.fn();
        render(<Controlled initial={9980} onCents={onCents} />);

        await user.clear(screen.getByLabelText('Preço'));

        expect(onCents).toHaveBeenLastCalledWith(null);
    });

    it('ignora letras e símbolos em vez de virar zero', async () => {
        const user = userEvent.setup();
        const onCents = vi.fn();
        render(<Controlled onCents={onCents} />);

        const input = screen.getByLabelText('Preço');
        await user.type(input, 'R$ abc12');

        expect(input).toHaveValue('0,12');
        expect(onCents).toHaveBeenLastCalledWith(12);
    });

    it('apagar um dígito devolve o valor anterior, sem salto de casa', async () => {
        const user = userEvent.setup();
        render(<Controlled initial={9980} />);

        const input = screen.getByLabelText('Preço');
        await user.click(input);
        await user.keyboard('{Backspace}');

        expect(input).toHaveValue('9,98');
    });
});
