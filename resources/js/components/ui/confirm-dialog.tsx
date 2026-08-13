import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    /** Rótulo do botão que executa a ação. */
    confirmLabel: string;
    cancelLabel?: string;
    /** Ações destrutivas (descartar, apagar) pintam o CTA em `destructive`. */
    destructive?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

/**
 * Confirmação genérica de ação.
 *
 * Construído sobre o `Dialog` que já existe no projeto em vez de trazer
 * `@radix-ui/react-alert-dialog`: a diferença prática entre os dois é o
 * `role="alertdialog"` e o foco inicial no cancelar, e os dois cabem aqui sem
 * uma dependência nova.
 *
 * O foco inicial vai para **Cancelar**, não para o CTA: em confirmação de ação
 * destrutiva, um Enter reflexo tem de não destruir nada.
 *
 * Para exclusões com contexto rico (detalhes, avisos, itens afetados), use o
 * `DeleteConfirmationDialog` de `@/components/delete-confirmation-dialog`.
 */
export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel = 'Cancelar',
    destructive = false,
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onCancel();
            }}
        >
            <DialogContent className="sm:max-w-md" role="alertdialog" data-testid="confirm-dialog">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel} disabled={busy} autoFocus data-testid="confirm-dialog-cancel">
                        {cancelLabel}
                    </Button>
                    {/*
                     * `busy` entra como `loading` (não como `disabled`) só no
                     * CTA: é ele que dispara a ação, então é dele o
                     * `aria-busy` e o indicador. O Cancelar fica desabilitado
                     * e mudo — ele não está ocupado, só indisponível.
                     */}
                    <Button
                        type="button"
                        variant={destructive ? 'destructive' : 'default'}
                        onClick={onConfirm}
                        loading={busy}
                        data-testid="confirm-dialog-confirm"
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
