import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, Trash2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type DeleteDialogWarning = {
    message: string;
    severity: 'danger' | 'warning';
};

export type DeleteDialogDetail = {
    label: string;
    value: string | number;
    icon?: LucideIcon;
};

export type AffectedItemsListProps = {
    items: Array<{
        label: string;
        count: number;
        badge?: string;
    }>;
};

export type DeleteConfirmationDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    title: string;
    /**
     * Obrigatória: o `role="alertdialog"` exige descrição acessível pela APG, e
     * o irmão `ui/confirm-dialog.tsx` já cobra o mesmo. Não trocar por fallback
     * genérico — isso reabre o caminho da descrição vaga que o tipo fecha.
     */
    description: string;
    itemName?: string;
    itemType?: string;
    itemTypeLabel?: string; // Custom label for item type (e.g., "Usuário" instead of "Usuário a ser excluído")
    icon?: LucideIcon;
    details?: DeleteDialogDetail[];
    warnings?: DeleteDialogWarning[];
    children?: ReactNode;
    confirmText?: string;
    cancelText?: string;
    processing?: boolean;
    variant?: 'danger' | 'warning';
    /**
     * Sobrescreve o parágrafo de consequência ("Atenção: ..."). O default
     * descreve exclusão permanente sem lixeira, que é o comportamento do
     * boilerplate; quem tiver soft delete, retenção ou cobrança em curso passa
     * o texto certo aqui. Conteúdo **inline** — o nó é renderizado dentro de um
     * `<p>`.
     */
    confirmationNote?: ReactNode;
};

/*
 * Severidade → token do PAPEL, nunca literal da paleta: o callout suave é
 * `state-X-soft` (fundo, borda e texto de uma vez; ícone e parágrafo herdam
 * por `currentColor`), o chip é `bg-state-X` + `text-state-X`. Os pares estão
 * medidos nos dois temas em `test/styles/theme-tokens.test.ts`.
 */
const calloutBySeverity = {
    danger: 'state-destructive-soft',
    warning: 'state-warning-soft',
} as const;

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    itemName,
    itemType,
    itemTypeLabel,
    icon: Icon = Trash2,
    details,
    warnings,
    children,
    confirmText = 'Excluir',
    cancelText = 'Cancelar',
    processing = false,
    variant = 'danger',
    confirmationNote,
}: DeleteConfirmationDialogProps) {
    const variantConfig = {
        danger: {
            iconBg: 'bg-state-destructive',
            iconColor: 'text-state-destructive',
            buttonVariant: 'destructive' as const,
            buttonClassName: '',
        },
        warning: {
            iconBg: 'bg-state-warning',
            iconColor: 'text-state-warning',
            buttonVariant: 'default' as const,
            /*
             * O `Button` não tem variante `warning`; sobre a `default` vai o
             * sólido de aviso com o rótulo do PRÓPRIO par — nunca `text-white`,
             * que no escuro dava 2.69:1 sobre o sólido claro.
             */
            buttonClassName: 'bg-warning text-warning-foreground hover:bg-warning/90',
        },
    };

    const config = variantConfig[variant];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]" role="alertdialog">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div data-slot="delete-dialog-icon" className={cn('rounded-lg p-2', config.iconBg)}>
                            <Icon className={cn('h-5 w-5', config.iconColor)} />
                        </div>
                        <span>{title}</span>
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">{description}</DialogDescription>
                </DialogHeader>

                <Separator />

                <div className="space-y-4 py-2">
                    {/* Item Name Display with Details */}
                    {itemName && (
                        <div className="bg-muted/50 dark:bg-muted/30 border-border/50 space-y-3 rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                                <div
                                    data-slot="delete-dialog-item-icon"
                                    className="bg-state-info flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                >
                                    <Info className="text-state-info h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                                        {itemTypeLabel ||
                                            (itemType ? `${itemType} a ser excluído${itemType.endsWith('o') ? '' : 'a'}` : 'Item a ser excluído')}
                                    </p>
                                    <p className="text-foreground text-base font-semibold break-words">{itemName}</p>
                                </div>
                            </div>

                            {/* Details */}
                            {details && details.length > 0 && (
                                <div className="border-border/50 space-y-2.5 border-t pt-2">
                                    {details.map((detail, index) => (
                                        <div key={index} className="flex items-center justify-between gap-3 text-sm">
                                            <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-2">
                                                {detail.icon && (
                                                    <detail.icon className="text-muted-foreground/70 dark:text-muted-foreground/60 h-3.5 w-3.5 shrink-0" />
                                                )}
                                                <span className="font-medium">{detail.label}</span>
                                            </div>
                                            <span className="text-foreground text-right font-semibold break-words">{detail.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Details fallback if no itemName */}
                    {!itemName && details && details.length > 0 && (
                        <div className="bg-muted/50 dark:bg-muted/30 border-border/50 space-y-2.5 rounded-lg border p-4">
                            {details.map((detail, index) => (
                                <div key={index} className="flex items-center justify-between gap-3 text-sm">
                                    <div className="text-muted-foreground flex min-w-0 flex-1 items-center gap-2">
                                        {detail.icon && (
                                            <detail.icon className="text-muted-foreground/70 dark:text-muted-foreground/60 h-3.5 w-3.5 shrink-0" />
                                        )}
                                        <span className="font-medium">{detail.label}</span>
                                    </div>
                                    <span className="text-foreground text-right font-semibold break-words">{detail.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Warnings */}
                    {warnings && warnings.length > 0 && (
                        <div className="space-y-2">
                            {warnings.map((warning, index) => (
                                <div
                                    key={index}
                                    data-slot="delete-dialog-warning"
                                    className={cn('flex gap-2 rounded-lg border p-3', calloutBySeverity[warning.severity])}
                                >
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    <p className="text-sm">{warning.message}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Custom Children */}
                    {children}

                    {/* Confirmation Message */}
                    <div
                        data-slot="delete-dialog-note"
                        className={cn('rounded-lg p-3', variant === 'danger' ? 'bg-muted dark:bg-muted/50' : 'state-warning-soft border')}
                    >
                        <p className={cn('text-sm', variant === 'danger' && 'text-foreground')}>
                            <span className="font-semibold">Atenção:</span>{' '}
                            {confirmationNote ??
                                (variant === 'danger'
                                    ? 'Esta ação não pode ser desfeita. Todos os dados relacionados serão permanentemente removidos.'
                                    : 'Esta ação afetará o acesso do usuário ao sistema. Certifique-se de que o usuário possui outras permissões ou que você pretende atribuir um novo cargo posteriormente.')}
                        </p>
                    </div>
                </div>

                <Separator />

                <DialogFooter className="sm:justify-between">
                    <p className="text-muted-foreground text-xs">Pressione ESC para fechar</p>
                    <div className="flex gap-2">
                        {/* Foco inicial no Cancelar: um Enter reflexo não pode excluir nada. */}
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing} autoFocus>
                            {cancelText}
                        </Button>
                        <Button
                            type="button"
                            variant={config.buttonVariant}
                            onClick={onConfirm}
                            disabled={processing}
                            className={cn('gap-2', config.buttonClassName)}
                        >
                            {processing ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    {variant === 'warning' ? 'Removendo...' : 'Excluindo...'}
                                </>
                            ) : (
                                <>
                                    {variant === 'warning' ? <Icon className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                    {confirmText}
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Helper component for displaying list of affected items
 */
export function AffectedItemsList({ items }: AffectedItemsListProps) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">Itens que serão afetados:</p>
            <ul className="space-y-1.5">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.count}</span>
                            {item.badge && (
                                <Badge variant="secondary" className="text-xs">
                                    {item.badge}
                                </Badge>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
