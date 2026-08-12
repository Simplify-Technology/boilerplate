import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import * as React from 'react';

interface DateInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type' | 'size' | 'min' | 'max'> {
    /** Data em `yyyy-mm-dd`. `null` = campo vazio. */
    value: string | null;
    /** String vazia vira `null`: "sem data" é um estado, não um texto em branco. */
    onChange: (value: string | null) => void;
    /** Bordas do intervalo aceito, também em `yyyy-mm-dd`. */
    min?: string;
    max?: string;
    invalid?: boolean;
    /** Mostra um `×` para esvaziar o campo quando há data escolhida. */
    clearable?: boolean;
    /** `sm` é a densidade das barras de filtro. */
    size?: 'sm' | 'default';
}

/**
 * Entrada de data padrão da aplicação: `<input type="date">` nativo embrulhado
 * no `Input` do shadcn — focus ring, `aria-invalid`, dark mode e densidade sem
 * copiar classe, e sem os ~40kB de um date picker de biblioteca.
 *
 * O que este componente corrige do controle nativo:
 * - o ícone do seletor fica invisível no dark mode (preto sobre fundo escuro)
 *   — daí o `invert` no `::-webkit-calendar-picker-indicator`;
 * - o calendário que o navegador abre só respeita `color-scheme`, não a classe
 *   `.dark` do tema — daí o `dark:[color-scheme:dark]`.
 *
 * ATENÇÃO ao formato exibido: `type="date"` mostra a data no formato do locale
 * do sistema (dd/mm/aaaa aqui, mm/dd/yyyy num Mac em inglês) e isso não é
 * controlável. O valor trocado com o React é sempre `yyyy-mm-dd`.
 */
export function DateInput({ value, onChange, min, max, invalid, clearable = false, size = 'default', className, ...props }: DateInputProps) {
    const showClear = clearable && Boolean(value);

    return (
        <div className="relative">
            <Input
                {...props}
                type="date"
                data-slot="date-input"
                value={value ?? ''}
                min={min}
                max={max}
                // FUSÃO, não redeclaração. O `FormField` injeta `aria-invalid`
                // por `cloneElement`, e este atributo vinha DEPOIS do
                // `{...props}` — o próprio ganhava sempre, e o campo dentro de
                // um formulário com erro ficava válido para o leitor de tela.
                // Mover a linha para antes do spread reintroduz o bug
                // espelhado: o `cloneElement` grava `'aria-invalid': undefined`
                // como chave PRÓPRIA quando não há erro, e esse `undefined`
                // apagaria o `invalid` daqui.
                aria-invalid={props['aria-invalid'] ?? invalid ?? undefined}
                onChange={(event) => onChange(event.target.value || null)}
                className={cn(
                    // O ícone de calendário do WebKit é ESTILIZADO, não escondido:
                    // é a única affordance de que o campo abre um seletor. No escuro
                    // ele vem preto sobre fundo escuro, daí o `invert`.
                    '[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert',
                    'dark:[color-scheme:dark]',
                    // Nunca `h-8` no celular: 32px fica abaixo do alvo de toque.
                    size === 'sm' && 'h-9 text-sm md:h-8',
                    // Abre a vaga do `×` na borda, ao lado do ícone nativo.
                    showClear && 'pr-8',
                    className,
                )}
            />
            {showClear && (
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    aria-label="Limpar data"
                    className="hover:bg-muted/80 dark:hover:bg-muted/60 absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 transition-colors"
                >
                    <X className="text-muted-foreground hover:text-foreground h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
