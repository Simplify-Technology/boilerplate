import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Appearance, useAppearance } from '@/hooks/use-appearance';
import { LucideIcon, Monitor, Moon, Sun } from 'lucide-react';
import { ComponentProps } from 'react';

/*
 * Escolha exclusiva entre três opções visíveis. Era uma <div> de três <button>
 * cujo estado ativo vivia só na cor de fundo: quem usa leitor de tela sabia o
 * nome de cada opção (é texto visível), mas não qual estava escolhida. O
 * ToggleGroup type="single" entrega o par que faltava — raiz role="radiogroup",
 * itens role="radio" + aria-checked — e o foco itinerante por setas, de graça.
 *
 * Os `value` são o dado persistido ('light' | 'dark' | 'system'): é o que
 * useAppearance grava em localStorage e cookie, então o rótulo muda, o value não.
 */
const options: { value: Appearance; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
    { value: 'system', icon: Monitor, label: 'Sistema' },
];

const isAppearance = (value: string): value is Appearance => options.some((option) => option.value === value);

type AppearanceTabsProps = Omit<ComponentProps<typeof ToggleGroup>, 'type' | 'value' | 'defaultValue' | 'onValueChange'>;

export default function AppearanceTabs(props: AppearanceTabsProps) {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <ToggleGroup
            type="single"
            variant="outline"
            aria-label="Tema"
            value={appearance}
            /* Seleção única não fica vazia: clicar de novo na opção ativa emite '' e é ignorado. */
            onValueChange={(value) => {
                if (isAppearance(value)) {
                    updateAppearance(value);
                }
            }}
            {...props}
        >
            {options.map(({ value, icon: Icon, label }) => (
                <ToggleGroupItem key={value} value={value} className="px-3.5">
                    <Icon />
                    {label}
                </ToggleGroupItem>
            ))}
        </ToggleGroup>
    );
}
