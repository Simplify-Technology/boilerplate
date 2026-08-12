import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import UserForm from '@/components/user-form';
import { UserInfoDialog } from '@/components/users/user-info-dialog';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Role } from '@/types';
import { Head } from '@inertiajs/react';
import { Info, UserPlus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuários', href: '/users' },
    { title: 'Criar Usuário', href: '/users/create' },
];

type CreateUserProps = {
    roles: Role[];
};

export default function Create({ roles }: CreateUserProps) {
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Criar Usuário" />
            <div className="flex h-full flex-1 flex-col gap-3 p-4 md:gap-4 md:p-6">
                <div className="bg-card border-border/40 overflow-hidden rounded-lg border shadow-sm">
                    {/* Header */}
                    <div className="bg-muted/20 border-border/30 rounded-t-lg border-b backdrop-blur-sm">
                        <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <UserPlus className="h-4 w-4 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                <h2 className="text-base font-semibold tracking-tight">Criar Novo Usuário</h2>
                                <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
                                            aria-label="Informações sobre criação de usuários"
                                        >
                                            <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                                <UserInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
                                <span className="text-muted-foreground/80 text-xs font-medium">• Novo registro</span>
                            </div>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-4 sm:p-6">
                        <div className="max-w-3xl">
                            <p className="text-muted-foreground mb-6 text-sm">Preencha os dados abaixo para criar um novo usuário no sistema.</p>
                            <UserForm roles={roles} routeName="users.store" />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
