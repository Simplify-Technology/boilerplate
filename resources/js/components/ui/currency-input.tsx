import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatCentsToMasked, maskCurrencyInput } from '@/utils/format/money';
import * as React from 'react';

interface CurrencyInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'inputMode'> {
    /** Valor em CENTAVOS. `null` = campo vazio (campo opcional desligado). */
    value: number | null;
    onChange: (cents: number | null) => void;
    /** Teto de segurança; o padrão é R$ 999.999,99. */
    maxCents?: number;
}

/**
 * Campo de dinheiro com máscara progressiva. O estado é UM só — centavos — e o
 * texto exibido é derivado dele. Sem float em nenhum ponto.
 *
 * Manter dois estados por campo (a string digitada e os centavos) e converter só
 * no submit deixa o campo aceitar qualquer coisa: "9980" fica "9980" na tela e
 * vira R$ 9.980,00 no banco, e "abc" vira R$ 0,00 com toast de sucesso.
 *
 * A digitação preenche da direita (centavos primeiro), então o caret vive no fim
 * do campo. Isso é deliberado: num campo de moeda de 4-8 dígitos, editar no meio
 * não é o gesto que alguém faz, e forçar o caret ao fim é o que evita que apagar
 * um separador produza um número diferente do que está na tela.
 */
export function CurrencyInput({ value, onChange, maxCents, className, ...props }: CurrencyInputProps) {
    const display = value === null ? '' : formatCentsToMasked(value);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { cents } = maskCurrencyInput(event.target.value, maxCents);
        onChange(cents);
    };

    // O caret volta ao fim depois de cada re-render: sem isto, digitar com o
    // cursor no meio insere o dígito na posição errada em relação à máscara.
    const keepCaretAtEnd = (event: React.SyntheticEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        requestAnimationFrame(() => {
            const end = input.value.length;
            input.setSelectionRange(end, end);
        });
    };

    return (
        <div className="relative">
            {/* O "R$" acompanha o estado do campo: sempre sólido, um campo VAZIO
                leria-se como "R$ <placeholder>" — ou seja, como um valor
                preenchido. O símbolo de moeda ao lado de um número só faz sentido
                quando existe número. */}
            <span
                aria-hidden="true"
                className={cn(
                    'pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm select-none',
                    value === null ? 'text-muted-foreground/40' : 'text-muted-foreground',
                )}
            >
                R$
            </span>
            <Input
                {...props}
                type="text"
                inputMode="numeric"
                value={display}
                onChange={handleChange}
                onFocus={keepCaretAtEnd}
                onClick={keepCaretAtEnd}
                className={cn('pl-9 text-right tabular-nums', className)}
            />
        </div>
    );
}
