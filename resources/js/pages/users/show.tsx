import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { UserShowInfoDialog } from '@/components/users/user-show-info-dialog';
import { useFlashMessages } from '@/hooks/use-flash-messages';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Role, User } from '@/types';
import { applyCpfCnpjMask, applyMobileMask, applyPhoneMask } from '@/utils/format/masks';
import { Head, Link } from '@inertiajs/react';
import { Calendar, CheckCircle, Edit, Info, Mail, Phone, Shield, User2, UserCheck, UserX, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuários', href: '/users' },
    { title: 'Detalhes do Usuário', href: '#' },
];

type ShowUserProps = {
    user: User;
    roles: Role[];
};

export default function Show({ user }: ShowUserProps) {
    useFlashMessages();
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    // Formatar dados com máscaras
    const formattedCpfCnpj = user.cpf_cnpj ? applyCpfCnpjMask(user.cpf_cnpj) : null;
    const formattedPhone = user.phone ? applyPhoneMask(user.phone) : null;
    const formattedMobile = user.mobile ? applyMobileMask(user.mobile) : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Usuário - ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-3 p-4 md:gap-4 md:p-6">
                <div className="bg-card border-border/40 overflow-hidden rounded-lg border shadow-sm">
                    {/* Header */}
                    <div className="bg-muted/20 border-border/30 rounded-t-lg border-b backdrop-blur-sm">
                        <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <User2 className="h-4 w-4 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                <h2 className="truncate text-base font-semibold tracking-tight">{user.name}</h2>
                                <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
                                            aria-label="Informações sobre visualização de usuários"
                                        >
                                            <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                                <UserShowInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
                                <span className="text-muted-foreground/80 text-xs font-medium">• Detalhes</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={route('users.index')}>
                                    <Button variant="outline" size="sm" className="h-8">
                                        Voltar
                                    </Button>
                                </Link>
                                <Link href={route('users.edit', user.id)}>
                                    <Button
                                        size="sm"
                                        className="h-8 gap-1.5 bg-cyan-600 text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-700 active:scale-95 dark:bg-cyan-600 dark:text-white dark:shadow-lg dark:hover:bg-cyan-700 dark:hover:shadow-xl"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Editar
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                            {/* Coluna Principal - Informações Pessoais e Sistema */}
                            <div className="space-y-4 lg:col-span-2">
                                {/* Card: Informações Pessoais */}
                                <Card className="border-border/40">
                                    <CardContent className="px-4 py-1.5 sm:px-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <User2 className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h3 className="text-foreground text-base font-semibold">Informações Pessoais</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <p className="text-muted-foreground text-xs font-medium">Nome Completo</p>
                                                <p className="text-foreground text-sm font-medium">{user.name}</p>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-muted-foreground text-xs font-medium">E-mail</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                    <p className="text-foreground text-sm break-all">{user.email}</p>
                                                </div>
                                            </div>
                                            {formattedCpfCnpj && (
                                                <div className="space-y-1.5">
                                                    <p className="text-muted-foreground text-xs font-medium">CPF/CNPJ</p>
                                                    <p className="text-foreground font-mono text-sm">{formattedCpfCnpj}</p>
                                                </div>
                                            )}
                                            {formattedPhone && (
                                                <div className="space-y-1.5">
                                                    <p className="text-muted-foreground text-xs font-medium">Telefone</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                        <p className="text-foreground text-sm">{formattedPhone}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {formattedMobile && (
                                                <div className="space-y-1.5">
                                                    <p className="text-muted-foreground text-xs font-medium">Celular</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <Phone className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                        <p className="text-foreground text-sm">{formattedMobile}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card: Informações do Sistema */}
                                <Card className="border-border/40">
                                    <CardContent className="px-4 py-1.5 sm:px-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h3 className="text-foreground text-base font-semibold">Informações do Sistema</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <p className="text-muted-foreground text-xs font-medium">Status da Conta</p>
                                                <div>
                                                    {user.is_active ? (
                                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                                            <UserCheck className="mr-1 h-3 w-3" />
                                                            Ativo
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                                                            <UserX className="mr-1 h-3 w-3" />
                                                            Inativo
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-muted-foreground text-xs font-medium">Cargo</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Shield className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                    <p className="text-foreground text-sm">{user.role?.label || user.role?.name || 'Sem cargo'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-muted-foreground text-xs font-medium">Verificação de Email</p>
                                                <div className="flex items-center gap-1.5">
                                                    {user.email_verified_at ? (
                                                        <>
                                                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                                                            <p className="text-foreground text-sm">
                                                                {new Date(user.email_verified_at).toLocaleDateString('pt-BR', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                })}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                            <p className="text-muted-foreground text-sm">Não verificado — o painel fica bloqueado</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <p className="text-muted-foreground text-xs font-medium">Criado em</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                    <p className="text-foreground text-sm">
                                                        {user.created_at
                                                            ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                                                                  day: '2-digit',
                                                                  month: '2-digit',
                                                                  year: 'numeric',
                                                              })
                                                            : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 sm:col-span-2">
                                                <p className="text-muted-foreground text-xs font-medium">Última atualização</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                    <p className="text-foreground text-sm">
                                                        {user.updated_at
                                                            ? new Date(user.updated_at).toLocaleDateString('pt-BR', {
                                                                  day: '2-digit',
                                                                  month: '2-digit',
                                                                  year: 'numeric',
                                                              })
                                                            : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Card: Notas */}
                                {user.user_notes && (
                                    <Card className="border-border/40">
                                        <CardContent className="px-4 py-1.5 sm:px-6">
                                            <div className="mb-4 flex items-center gap-2">
                                                <Info className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                                <h3 className="text-foreground text-base font-semibold">Notas</h3>
                                            </div>
                                            <div className="border-border/40 bg-muted/20 rounded-md border p-4">
                                                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{user.user_notes}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Card: Permissões Extras */}
                                {user.permissions && user.permissions.length > 0 && (
                                    <Card className="border-border/40">
                                        <CardContent className="px-4 py-1.5 sm:px-6">
                                            <div className="mb-4 flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                                <h3 className="text-foreground text-base font-semibold">Permissões Extras</h3>
                                                <span className="text-muted-foreground/70 text-xs">
                                                    ({user.permissions.length} {user.permissions.length === 1 ? 'permissão' : 'permissões'})
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {user.permissions.map((permission) => (
                                                    <Badge key={permission.name} variant="secondary" className="text-xs">
                                                        {permission.label || permission.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Sidebar - Resumo Rápido */}
                            <div className="space-y-4">
                                <Card className="border-border/40 sticky top-4">
                                    <CardContent className="px-4 py-1.5 sm:px-6">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h3 className="text-foreground text-sm font-semibold">Resumo</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-muted-foreground mb-1 text-xs font-medium">Status</p>
                                                {user.is_active ? (
                                                    <Badge className="w-full justify-center bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                                        <UserCheck className="mr-1 h-3 w-3" />
                                                        Conta Ativa
                                                    </Badge>
                                                ) : (
                                                    <Badge className="w-full justify-center bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                                                        <UserX className="mr-1 h-3 w-3" />
                                                        Conta Inativa
                                                    </Badge>
                                                )}
                                            </div>
                                            <Separator />
                                            <div>
                                                <p className="text-muted-foreground mb-1 text-xs font-medium">Cargo</p>
                                                <p className="text-foreground text-sm font-medium">
                                                    {user.role?.label || user.role?.name || 'Sem cargo'}
                                                </p>
                                            </div>
                                            {user.permissions && user.permissions.length > 0 && (
                                                <>
                                                    <Separator />
                                                    <div>
                                                        <p className="text-muted-foreground mb-1 text-xs font-medium">Permissões Extras</p>
                                                        <p className="text-foreground text-sm font-medium">
                                                            {user.permissions.length} permissão{user.permissions.length > 1 ? 'ões' : ''} direta
                                                            {user.permissions.length > 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </>
                                            )}
                                            <Separator />
                                            <div>
                                                <p className="text-muted-foreground mb-1 text-xs font-medium">Membro desde</p>
                                                <p className="text-foreground text-sm">
                                                    {user.created_at
                                                        ? new Date(user.created_at).toLocaleDateString('pt-BR', {
                                                              month: 'long',
                                                              year: 'numeric',
                                                          })
                                                        : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
