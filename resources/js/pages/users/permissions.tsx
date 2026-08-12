import { PermissionCard } from '@/components/permissions/permission-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, User } from '@/types';
import type { PermissionOption } from '@/types/permissions';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Save, Shield, User2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usuários', href: '/users' },
    { title: 'Permissões', href: '#' },
];

interface UserPermissionsProps {
    user: User & {
        custom_permissions_list: Array<{
            name: string;
            label: string;
            meta?: {
                can_impersonate_any?: boolean;
            };
        }>;
        role?: {
            id: number;
            name: string;
            label: string;
            permissions?: Array<{
                name: string;
                label: string;
            }>;
        };
    };
    all_permissions: PermissionOption[];
}

export default function UserPermissions({ user, all_permissions }: UserPermissionsProps) {
    // Estado local das permissões selecionadas
    const [userPermissions, setUserPermissions] = useState<string[]>(() => {
        return user.custom_permissions_list.map((p) => p.name);
    });
    const [isSaving, setIsSaving] = useState(false);

    // Get role permissions (readonly)
    const rolePermissions = useMemo(() => {
        if (!user.role) return [];
        return Array.isArray(user.role.permissions) ? user.role.permissions : [];
    }, [user.role]);

    const rolePermissionNames = useMemo(() => {
        return rolePermissions.map((p) => p.name);
    }, [rolePermissions]);

    // Handler para toggle de permissões
    const handlePermissionToggle = useCallback((permissionName: string, checked: boolean) => {
        setUserPermissions((prev) => {
            if (checked) {
                return [...prev, permissionName];
            } else {
                return prev.filter((p) => p !== permissionName);
            }
        });
    }, []);

    // Handler para salvar permissões
    const handleSavePermissions = useCallback(async () => {
        setIsSaving(true);

        router.post(
            route('user.sync-permissions', user.id),
            { permissions: userPermissions },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSaving(false);
                },
                onError: () => {
                    setIsSaving(false);
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    }, [user.id, userPermissions]);

    // Verificar se há mudanças não salvas
    const hasChanges = useMemo(() => {
        const currentPermissions = user.custom_permissions_list.map((p) => p.name).sort();
        const newPermissions = [...userPermissions].sort();
        return JSON.stringify(currentPermissions) !== JSON.stringify(newPermissions);
    }, [user.custom_permissions_list, userPermissions]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Permissões - ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-3 p-4 md:gap-4 md:p-6">
                <div className="bg-card border-border/40 overflow-hidden rounded-lg border shadow-sm">
                    {/* Header */}
                    <div className="bg-muted/20 border-border/30 rounded-t-lg border-b backdrop-blur-sm">
                        <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <Shield className="h-4 w-4 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                <h2 className="truncate text-base font-semibold tracking-tight">Permissões: {user.name}</h2>
                                <span className="text-muted-foreground/80 text-xs font-medium">• O que esta pessoa pode fazer</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild className="h-8">
                                    <Link href={route('users.index')}>
                                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                        Voltar
                                    </Link>
                                </Button>
                                <Button size="sm" variant="outline" asChild className="h-8 gap-1.5">
                                    <Link href={route('users.edit', user.id)}>
                                        <Edit className="h-3.5 w-3.5" />
                                        Editar Usuário
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <div className="space-y-6">
                            {/* User Header */}
                            <div className="mb-6">
                                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <User2 className="h-5 w-5 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h2 className="text-foreground truncate text-lg font-semibold sm:text-xl">{user.name}</h2>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                                            <p className="text-muted-foreground dark:text-muted-foreground/70 text-xs sm:text-sm">
                                                Gerencie as permissões individuais deste usuário
                                            </p>
                                            <span className="text-muted-foreground dark:text-muted-foreground/50 hidden text-xs sm:inline">•</span>
                                            <span className="text-muted-foreground dark:text-muted-foreground/70 text-xs">
                                                {userPermissions.length} {userPermissions.length === 1 ? 'permissão' : 'permissões'}{' '}
                                                {userPermissions.length === 1 ? 'individual' : 'individuais'} selecionada
                                                {userPermissions.length === 1 ? '' : 's'}
                                            </span>
                                            {user.role && (
                                                <>
                                                    <span className="text-muted-foreground dark:text-muted-foreground/50 hidden text-xs sm:inline">
                                                        •
                                                    </span>
                                                    <span className="text-muted-foreground dark:text-muted-foreground/70 text-xs">
                                                        Cargo: {user.role.label}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleSavePermissions}
                                        disabled={!hasChanges || isSaving}
                                        size="sm"
                                        className="h-8 w-full shrink-0 gap-1.5 bg-cyan-600 text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-700 active:scale-95 sm:w-auto dark:bg-cyan-600 dark:text-white dark:shadow-lg dark:hover:bg-cyan-700 dark:hover:shadow-xl"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Salvar Permissões
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <Separator className="mt-4" />
                            </div>

                            {/* Permissões em Duas Colunas */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                                {/* Coluna Esquerda: Permissões do Cargo */}
                                <div className="lg:col-span-2">
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <User2 className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h3 className="text-foreground text-base font-semibold">Permissões do Cargo</h3>
                                            <span className="text-muted-foreground/70 text-xs">
                                                ({rolePermissions.length} {rolePermissions.length === 1 ? 'permissão' : 'permissões'})
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                                            Estas permissões são herdadas do cargo e não podem ser alteradas individualmente. Para modificar, altere
                                            as permissões do cargo.
                                        </p>
                                    </div>
                                    {user.role ? (
                                        <>
                                            <div className="mb-3 flex items-center gap-2">
                                                <Shield className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                <p className="text-foreground text-sm font-medium">{user.role.label}</p>
                                            </div>
                                            {rolePermissions.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {rolePermissions.map((permission) => (
                                                        <Badge
                                                            key={permission.name}
                                                            variant="outline"
                                                            className="border-cyan-500/50 bg-cyan-50/50 text-xs dark:border-cyan-500/40 dark:bg-cyan-950/20"
                                                        >
                                                            {permission.label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="border-border/40 bg-muted/20 rounded-md border p-4 text-center">
                                                    <p className="text-muted-foreground text-sm">Este cargo não possui permissões atribuídas.</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="border-border/40 bg-muted/20 rounded-md border p-4 text-center">
                                            <p className="text-muted-foreground text-sm">Usuário não possui cargo atribuído.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Coluna Direita: Permissões Disponíveis */}
                                <div className="lg:col-span-5">
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h3 className="text-foreground text-base font-semibold">Permissões Disponíveis</h3>
                                        </div>
                                        <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                                            Selecione as permissões individuais que este usuário deve possuir (apenas permissões não incluídas no
                                            cargo)
                                        </p>
                                    </div>

                                    {/* Grid de Permissões */}
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                        {all_permissions
                                            .filter((permission) => {
                                                // Filtrar permissões que já estão no cargo (elas são herdadas automaticamente)
                                                return !rolePermissionNames.includes(permission.name);
                                            })
                                            .map((permission) => (
                                                <PermissionCard
                                                    key={permission.name}
                                                    permission={permission}
                                                    isChecked={userPermissions.includes(permission.name)}
                                                    onToggle={handlePermissionToggle}
                                                />
                                            ))}
                                    </div>

                                    {/* Mensagem se todas as permissões estão no cargo */}
                                    {all_permissions.every((p) => rolePermissionNames.includes(p.name)) && (
                                        <div className="border-border/40 bg-muted/20 rounded-md border p-4 text-center">
                                            <p className="text-muted-foreground text-sm">
                                                Todas as permissões disponíveis já estão incluídas no cargo deste usuário.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
