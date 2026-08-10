import { Input } from '@/components/ui/input';
import { applyCepMask, applyCnpjMask, applyCpfCnpjMask, applyCpfMask, applyPhoneAutoMask, removeNonNumeric } from '@/utils/format/masks';
import * as React from 'react';

const MASKS = {
    cpf: applyCpfMask,
    cnpj: applyCnpjMask,
    cpfCnpj: applyCpfCnpjMask,
    cep: applyCepMask,
    phone: applyPhoneAutoMask,
} as const;

export type MaskName = keyof typeof MASKS;

interface MaskedInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'inputMode'> {
    mask: MaskName;
    /** Valor JÁ mascarado — é o que o campo mostra e o que o formulário guarda. */
    value: string;
    /** Recebe o valor mascarado e os dígitos crus, para quem precisa enviar sem máscara. */
    onChange: (masked: string, digits: string) => void;
}

/**
 * Input mascarado com preservação de caret.
 *
 * Aplicar a máscara inline — `onChange={(e) => setData('cpf', applyCpfMask(e.target.value))}` —
 * reposiciona o caret no fim a cada tecla: editar no meio de um CPF já digitado
 * joga o cursor para o fim, e apagar um separador ("." ou "-") não apaga nada,
 * porque a máscara o recoloca na mesma posição.
 *
 * A correção é contar DÍGITOS antes do caret (não caracteres), remascarar, e pôr
 * o caret depois do mesmo número de dígitos. Backspace sobre um separador consome
 * o dígito anterior, que é o que se espera dele.
 */
export function MaskedInput({ mask, value, onChange, ...props }: MaskedInputProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const caretDigits = React.useRef<number | null>(null);

    const applyMask = MASKS[mask];

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.target;
        const rawValue = input.value;
        const caret = input.selectionStart ?? rawValue.length;

        const digitsBeforeCaret = removeNonNumeric(rawValue.slice(0, caret)).length;

        // Backspace exatamente sobre um separador não muda a contagem de dígitos:
        // sem isto o campo ficava travado, porque a máscara reinseria o separador.
        // Vale APENAS para deleção de um único caractere não-dígito — deleção por
        // seleção (delta > 1) cai no caminho normal, senão um dígito legítimo
        // antes do caret seria removido junto.
        const removedExactlyOne = value.length - rawValue.length === 1;
        const deletedSeparator =
            removedExactlyOne &&
            /\D/.test(value[caret] ?? '') &&
            digitsBeforeCaret === removeNonNumeric(value.slice(0, caret + 1)).length;

        const digits = deletedSeparator
            ? removeNonNumeric(rawValue.slice(0, caret).replace(/\d(?=\D*$)/, '')) + removeNonNumeric(rawValue.slice(caret))
            : removeNonNumeric(rawValue);

        const masked = applyMask(digits);

        caretDigits.current = deletedSeparator ? Math.max(0, digitsBeforeCaret - 1) : digitsBeforeCaret;

        onChange(masked, removeNonNumeric(masked));
    };

    // Reposiciona o caret DEPOIS do commit do React: `masked` só está no DOM aqui.
    React.useEffect(() => {
        const input = inputRef.current;
        const target = caretDigits.current;

        if (input === null || target === null) {
            return;
        }

        caretDigits.current = null;

        let seen = 0;
        let position = value.length;

        for (let index = 0; index < value.length; index++) {
            if (/\d/.test(value[index])) {
                seen++;

                if (seen === target) {
                    position = index + 1;

                    break;
                }
            }
        }

        if (target === 0) {
            position = 0;
        }

        input.setSelectionRange(position, position);
    }, [value]);

    return <Input {...props} ref={inputRef} type="text" inputMode="numeric" value={value} onChange={handleChange} />;
}
