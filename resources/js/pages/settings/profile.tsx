import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { FormEventHandler, useCallback, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import { DeleteAccountInfoDialog } from '@/components/settings/delete-account-info-dialog';
import { ProfileInfoDialog } from '@/components/settings/profile-info-dialog';
import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSettingsActions } from '@/hooks/settings/use-settings-actions';
import { useFlashMessages } from '@/hooks/use-flash-messages';
import AppLayout from '@/layouts/app-layout';
import type { ProfilePageProps } from '@/types/settings';
import { Info, Mail, Menu, Save, Trash2, User2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configurações',
        href: '/settings/profile',
    },
];

interface ProfileForm {
    name: string;
    email: string;
}

export default function Profile({ mustVerifyEmail, status }: ProfilePageProps) {
    useFlashMessages();

    const { auth } = usePage<SharedData>().props;
    const currentPath = window.location.pathname;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showInfoDialog, setShowInfoDialog] = useState(false);
    const [showDeleteInfoDialog, setShowDeleteInfoDialog] = useState(false);

    const [data, setData] = useState<Required<ProfileForm>>({
        name: auth.user.name,
        email: auth.user.email,
    });

    const actions = useSettingsActions({
        onUpdateProfileSuccess: () => {
            // Toast já é mostrado pelo hook
        },
    });

    const errors = actions.profileErrors;

    const submit: FormEventHandler = useCallback(
        (e) => {
            e.preventDefault();
            actions.updateProfile(data.name, data.email);
        },
        [actions, data.name, data.email],
    );

    const handleSelectItem = useCallback(() => {
        setSidebarOpen(false);
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configurações de Perfil" />
            <div className="flex h-full flex-1 flex-col gap-3 p-3 sm:p-4 md:gap-4 md:p-6">
                {/* Mobile Menu Button */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2 sm:w-auto">
                                <Menu className="h-4 w-4 shrink-0" />
                                <span className="font-medium">Configurações</span>
                                <span className="text-muted-foreground truncate text-xs">• Perfil</span>
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

                    {/* Main Content Area - Grid */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden lg:gap-4">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
                            {/* Profile Information Card */}
                            <div className="bg-card border-border/40 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
                                {/* Profile Header */}
                                <div className="bg-muted/20 border-border/30 border-b backdrop-blur-sm">
                                    <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            <User2 className="h-4 w-4 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h2 className="dark:text-foreground text-base font-semibold tracking-tight">Informações do Perfil</h2>
                                            <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
                                                        aria-label="Informações sobre o perfil"
                                                    >
                                                        <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                                    </Button>
                                                </DialogTrigger>
                                            </Dialog>
                                            <ProfileInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                    <form onSubmit={submit} className="space-y-6">
                                        {/* Profile Information Section */}
                                        <div>
                                            <div className="mb-4">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <User2 className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                                    <h3 className="dark:text-foreground text-base font-semibold">Dados Pessoais</h3>
                                                </div>
                                                <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                                                    Atualize seu nome e endereço de e-mail
                                                </p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">Nome</Label>
                                                    <Input
                                                        id="name"
                                                        className="w-full"
                                                        value={data.name}
                                                        onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                                                        required
                                                        autoComplete="name"
                                                        placeholder="Nome completo"
                                                    />
                                                    <InputError message={errors.name} />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label htmlFor="email">Endereço de e-mail</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        className="w-full"
                                                        value={data.email}
                                                        onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                                                        required
                                                        autoComplete="username"
                                                        placeholder="Endereço de e-mail"
                                                    />
                                                    <InputError message={errors.email} />
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Verificação de e-mail */}
                                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                                    <h3 className="dark:text-foreground text-base font-semibold">Verificação de e-mail</h3>
                                                </div>
                                                <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                                                    Seu endereço de e-mail não foi verificado.{' '}
                                                    <Link
                                                        href={route('verification.send')}
                                                        method="post"
                                                        as="button"
                                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                    >
                                                        Clique aqui para reenviar o e-mail de verificação.
                                                    </Link>
                                                </p>

                                                {status === 'verification-link-sent' && (
                                                    <div className="mt-2 text-sm font-medium text-green-600 dark:text-green-500">
                                                        Um novo link de verificação foi enviado para seu endereço de e-mail.
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-4">
                                            <Button
                                                type="submit"
                                                disabled={actions.isUpdatingProfile}
                                                size="sm"
                                                className="h-8 w-full shrink-0 gap-1.5 bg-cyan-600 text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-700 active:scale-95 sm:w-auto dark:bg-cyan-600 dark:text-white dark:shadow-lg dark:hover:bg-cyan-700 dark:hover:shadow-xl"
                                            >
                                                {actions.isUpdatingProfile ? (
                                                    <>
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        Salvando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4" />
                                                        Salvar Alterações
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            {/* Delete Account Card */}
                            <div className="bg-card border-border/40 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
                                {/* Delete Account Header */}
                                <div className="bg-muted/20 border-border/30 border-b backdrop-blur-sm">
                                    <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                                            <Trash2 className="h-4 w-4 shrink-0 text-red-600 transition-colors duration-200 dark:text-red-500" />
                                            <h2 className="dark:text-foreground text-base font-semibold tracking-tight">Excluir Conta</h2>
                                            <Dialog open={showDeleteInfoDialog} onOpenChange={setShowDeleteInfoDialog}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-red-50 hover:text-red-700 active:scale-95 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                                                        aria-label="Informações sobre exclusão de conta"
                                                    >
                                                        <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                                    </Button>
                                                </DialogTrigger>
                                            </Dialog>
                                            <DeleteAccountInfoDialog open={showDeleteInfoDialog} onOpenChange={setShowDeleteInfoDialog} />
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                    <DeleteUser />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
