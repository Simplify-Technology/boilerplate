import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DeleteUser() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm<Required<{ password: string }>>({ password: '' });

    /**
     * Funil ÚNICO de abertura e fechamento.
     *
     * O diálogo era não controlado e a limpeza (`clearErrors` + `reset`)
     * estava pendurada só no botão Cancelar. O X, o Escape e o clique no
     * overlay fechavam por fora dela — e como o `useForm` vive FORA do
     * `<Dialog>`, ele não desmonta: quem errava a senha, fechava com Esc e
     * reabria encontrava "senha incorreta" sobre um campo vazio, como se a
     * tentativa nova já tivesse sido rejeitada. Numa tela de exclusão
     * permanente de conta.
     *
     * Mesma forma do `ui/confirm-dialog.tsx`, que já era o padrão da casa.
     */
    const handleOpenChange = (next: boolean) => {
        setOpen(next);

        if (!next) {
            clearErrors();
            reset();
        }
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => handleOpenChange(false),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="mb-2 flex items-center gap-2">
                    <h3 className="dark:text-foreground text-base font-semibold">Excluir Conta Permanentemente</h3>
                </div>
                <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                    Exclua sua conta e todos os seus recursos permanentemente
                </p>
            </div>

            <div className="space-y-4 rounded-lg border border-red-100 bg-red-50/50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
                <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
                    <p className="font-medium">Aviso</p>
                    <p className="text-sm">Por favor, proceda com cautela. Esta ação não pode ser desfeita.</p>
                </div>

                <Dialog open={open} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                        <Button variant="destructive">Excluir Conta</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogTitle>Você tem certeza que deseja excluir sua conta?</DialogTitle>
                        <DialogDescription>
                            Uma vez que sua conta for excluída, todos os seus recursos e dados também serão permanentemente excluídos. Por favor,
                            insira sua senha para confirmar que deseja excluir permanentemente sua conta.
                        </DialogDescription>
                        <form className="space-y-6" onSubmit={deleteUser}>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="sr-only">
                                    Senha
                                </Label>

                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    ref={passwordInput}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full"
                                    placeholder="Senha"
                                    autoComplete="current-password"
                                />

                                <InputError message={errors.password} />
                            </div>

                            <DialogFooter className="gap-2">
                                {/*
                                 * Sem `onClick` próprio: o `DialogClose` já
                                 * dispara o `onOpenChange`, e limpar em dois
                                 * lugares é como o Esc ficou de fora.
                                 */}
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancelar</Button>
                                </DialogClose>

                                {/*
                                 * Sem `asChild`: ele existia só para trocar o
                                 * `type` do botão, que é prop nativa e cabe
                                 * direto. O embrulho custava o indicador de
                                 * envio — sob `asChild` o Slot clona um filho
                                 * só e o `Button` não pode injetar o spinner.
                                 */}
                                <Button type="submit" variant="destructive" loading={processing}>
                                    Excluir Conta
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
