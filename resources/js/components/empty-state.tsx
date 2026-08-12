import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { FileQuestion, LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    /**
     * A saída do vazio. Vazio-por-filtro e vazio-inicial são estados
     * diferentes e pedem ações diferentes: limpar o filtro num, criar o
     * primeiro registro no outro. Sem isto, a tela diz o que aconteceu e não
     * dá caminho — inclusive quando o próprio texto promete um ("Limpe os
     * filtros", sem botão de limpar).
     */
    action?: ReactNode;
    className?: string;
}

/**
 * Estado vazio de listagem.
 *
 * Não emite linha de tabela: o ramo `type="row"` que existia aqui montava
 * `Table.Row`/`Table.Cell` PRÓPRIOS, e o único call-site já embrulhava o
 * componente — o que chegava ao DOM era `<tr>` dentro de `<div>` dentro de
 * `<td>`. Quem posiciona a célula é a tabela; este componente é só o conteúdo.
 */
export function EmptyState({ title, description, icon = FileQuestion, action, className }: EmptyStateProps) {
    return (
        <div
            data-slot="empty-state"
            data-testid="empty-state"
            className={cn('flex flex-col items-center justify-center gap-3 py-8 text-center', className)}
        >
            <span aria-hidden="true" className="bg-muted text-muted-foreground flex size-12 shrink-0 items-center justify-center rounded-full">
                <Icon iconNode={icon} className="size-6" />
            </span>

            <div className="flex flex-col gap-1">
                <h3 className="text-foreground text-base font-medium">{title}</h3>
                {description ? <p className="text-muted-foreground max-w-prose text-sm">{description}</p> : null}
            </div>

            {action ? <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
        </div>
    );
}
