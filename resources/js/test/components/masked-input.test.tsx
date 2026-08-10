import { MaskedInput, type MaskName } from '@/components/ui/masked-input';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

function Controlled({ mask = 'cnpj', initial = '', onDigits }: { mask?: MaskName; initial?: string; onDigits?: (digits: string) => void }) {
    const [value, setValue] = useState(initial);

    return (
        <MaskedInput
            aria-label="Documento"
            mask={mask}
            value={value}
            onChange={(masked, digits) => {
                setValue(masked);
                onDigits?.(digits);
            }}
        />
    );
}

/**
 * Máscara aplicada inline (`onChange={applyCpfMask(e.target.value)}`) joga o
 * caret para o fim a cada tecla e torna impossível apagar um separador. Estes
 * testes travam o comportamento de caret deste componente.
 */
describe('MaskedInput', () => {
    it('mascara CNPJ enquanto digita', async () => {
        const user = userEvent.setup();
        const onDigits = vi.fn();
        render(<Controlled onDigits={onDigits} />);

        const input = screen.getByLabelText('Documento');
        await user.type(input, '11222333000181');

        expect(input).toHaveValue('11.222.333/0001-81');
        expect(onDigits).toHaveBeenLastCalledWith('11222333000181');
    });

    it('para de aceitar dígito além do tamanho do documento', async () => {
        const user = userEvent.setup();
        render(<Controlled />);

        const input = screen.getByLabelText('Documento');
        await user.type(input, '112223330001819999');

        expect(input).toHaveValue('11.222.333/0001-81');
    });

    it('backspace sobre um separador apaga o dígito anterior', async () => {
        const user = userEvent.setup();
        render(<Controlled initial="11.222" />);

        const input = screen.getByLabelText('Documento');
        await user.click(input);
        await user.keyboard('{Backspace}');

        expect(input).toHaveValue('11.22');
    });

    it('deleção por seleção abrangendo separador remove só o que foi selecionado', async () => {
        const user = userEvent.setup();
        render(<Controlled mask="cpf" initial="123.456" />);

        const input = screen.getByLabelText<HTMLInputElement>('Documento');
        await user.click(input);
        // Seleciona ".4" (posições 3–5) e apaga: dígitos esperados 12356 —
        // a heurística de separador não pode consumir um dígito extra.
        input.setSelectionRange(3, 5);
        await user.keyboard('{Delete}');

        expect(input).toHaveValue('123.56');
    });

    it('mantém o caret depois do dígito editado, e não no fim do campo', async () => {
        const user = userEvent.setup();
        render(<Controlled mask="cep" initial="12345-67" />);

        const input = screen.getByLabelText<HTMLInputElement>('Documento');

        // Caret entre o 1 e o 2, e digita: o dígito entra ali, não no fim — que é
        // exatamente o que a máscara aplicada inline no onChange não conseguia fazer.
        input.focus();
        input.setSelectionRange(1, 1);
        await user.keyboard('9');

        expect(input).toHaveValue('19234-567');
        expect(input.selectionStart).toBe(2);
    });

    /**
     * Campo COMPLETO: inserir no meio empurra o último dígito para fora, e o caret
     * segue no lugar da edição. É o comportamento das máscaras brasileiras usuais;
     * o truncamento não passa calado porque CPF/CNPJ têm dígito verificador e a
     * validação do servidor recusa o número mutilado.
     */
    it('em campo completo, a inserção no meio empurra o último dígito para fora', async () => {
        const user = userEvent.setup();
        render(<Controlled mask="cep" initial="12345-678" />);

        const input = screen.getByLabelText<HTMLInputElement>('Documento');

        input.focus();
        input.setSelectionRange(1, 1);
        await user.keyboard('9');

        expect(input).toHaveValue('19234-567');
        expect(input.selectionStart).toBe(2);
    });

    it('em campo completo, digitar no fim não altera o valor', async () => {
        const user = userEvent.setup();
        render(<Controlled mask="cep" initial="12345-678" />);

        const input = screen.getByLabelText<HTMLInputElement>('Documento');
        await user.type(input, '9');

        expect(input).toHaveValue('12345-678');
    });

    it('serve CPF e telefone com a mesma API', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Controlled mask="cpf" />);

        await user.type(screen.getByLabelText('Documento'), '12345678909');
        expect(screen.getByLabelText('Documento')).toHaveValue('123.456.789-09');

        unmount();

        render(<Controlled mask="phone" />);
        await user.type(screen.getByLabelText('Documento'), '11987654321');
        expect(screen.getByLabelText('Documento')).toHaveValue('(11) 98765-4321');
    });
});
