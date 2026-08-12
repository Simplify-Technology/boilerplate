import InputError from '@/components/input-error';
import { PasswordInfoDialog } from '@/components/settings/password-info-dialog';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FormEventHandler, useCallback, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSettingsActions } from '@/hooks/settings/use-settings-actions';
import { Info, KeyRound, Lock, Menu, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configurações',
        href: '/settings/password',
    },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const currentPath = window.location.pathname;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    const [data, setData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const actions = useSettingsActions({
        onUpdatePasswordSuccess: () => {
            setData({
                current_password: '',
                password: '',
                password_confirmation: '',
            });
        },
        onUpdatePasswordError: () => {
            // Foco será tratado após renderização se houver erros
            if (actions.passwordErrors.password) {
                setTimeout(() => passwordInput.current?.focus(), 100);
            } else if (actions.passwordErrors.current_password) {
                setTimeout(() => currentPasswordInput.current?.focus(), 100);
            }
        },
    });

    const errors = actions.passwordErrors;

    const updatePassword: FormEventHandler = useCallback(
        (e) => {
            e.preventDefault();
            actions.updatePassword(data.current_password, data.password, data.password_confirmation);
        },
        [actions, data.current_password, data.password, data.password_confirmation],
    );

    const handleSelectItem = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurações de Senha" />
            <div className="flex h-full flex-1 flex-col gap-3 p-3 sm:p-4 md:gap-4 md:p-6">
                {/* Mobile Menu Button */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2 sm:w-auto">
                                <Menu className="h-4 w-4 shrink-0" />
                                <span className="font-medium">Configurações</span>
                                <span className="text-muted-foreground truncate text-xs">• Senha</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0 sm:max-w-sm">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Navegar Configurações</SheetTitle>
                            </SheetHeader>
                            <div className="h-full overflow-y-auto">
                                <SettingsSidebar currentPath={currentPath} onSelectItem={handleSelectItem} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col gap-3 overflow-hidden lg:flex-row lg:gap-4">
                    {/* Sidebar - Settings Navigation (Desktop) */}
                    <div className="hidden lg:block">
                        <SettingsSidebar currentPath={currentPath} />
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-card border-border/40 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
                        {/* Password Header */}
                        <div className="bg-muted/20 border-border/30 border-b backdrop-blur-sm">
                            <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <Lock className="h-4 w-4 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                    <h2 className="dark:text-foreground text-base font-semibold tracking-tight">Atualizar Senha</h2>
                                    <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
                                                aria-label="Informações sobre senha"
                                            >
                                                <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                            </Button>
                                        </DialogTrigger>
                                    </Dialog>
                                    <PasswordInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <form onSubmit={updatePassword} className="max-w-2xl space-y-6">
                                {/* Password Section */}
                                <div>
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <KeyRound className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h3 className="dark:text-foreground text-base font-semibold">Segurança da Conta</h3>
                                        </div>
                                        <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                                            Certifique-se de que sua conta está usando uma senha longa e aleatória para manter a segurança
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="current_password">Senha Atual</Label>
                                            <Input
                                                id="current_password"
                                                ref={currentPasswordInput}
                                                value={data.current_password}
                                                onChange={(e) => setData((prev) => ({ ...prev, current_password: e.target.value }))}
                                                type="password"
                                                className="w-full"
                                                autoComplete="current-password"
                                                placeholder="Senha atual"
                                            />
                                            <InputError message={errors.current_password} />
                                        </div>

                                        <Separator />

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Nova Senha</Label>
                                            <Input
                                                id="password"
                                                ref={passwordInput}
                                                value={data.password}
                                                onChange={(e) => setData((prev) => ({ ...prev, password: e.target.value }))}
                                                type="password"
                                                className="w-full"
                                                autoComplete="new-password"
                                                placeholder="Nova senha"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
                                            <Input
                                                id="password_confirmation"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                                                type="password"
                                                className="w-full"
                                                autoComplete="new-password"
                                                placeholder="Confirmar nova senha"
                                            />
                                            <InputError message={errors.password_confirmation} />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4">
                                    <Button
                                        type="submit"
                                        disabled={actions.isUpdatingPassword}
                                        size="sm"
                                        className="h-8 w-full shrink-0 gap-1.5 bg-cyan-600 text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-700 active:scale-95 sm:w-auto dark:bg-cyan-600 dark:text-white dark:shadow-lg dark:hover:bg-cyan-700 dark:hover:shadow-xl"
                                    >
                                        {actions.isUpdatingPassword ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Salvar Senha
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
