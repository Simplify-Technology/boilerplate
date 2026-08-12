import { PermissionCard } from '@/components/permissions/permission-card';
import { RoleInfoDialog } from '@/components/permissions/role-info-dialog';
import { RoleUsersTable } from '@/components/permissions/role-users-table';
import { RolesSidebar } from '@/components/permissions/roles-sidebar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePermissionActions } from '@/hooks/permissions/use-permission-actions';
import { usePermissionPermissions } from '@/hooks/permissions/use-permission-permissions';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import type { PermissionsPageProps } from '@/types/permissions';
import { Head } from '@inertiajs/react';
import { Info, Menu, Save, Shield, UserCog, Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permissões',
        href: '/permissions/roles',
    },
];

export default function Roles({ roles, assignableRoles = [], permissions }: PermissionsPageProps) {
    // Local state
    const [selectedRole, setSelectedRole] = useState<string>(Object.keys(roles)[0] || '');
    const [showInfoDialog, setShowInfoDialog] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
        return Object.entries(roles).reduce(
            (acc, [roleName, roleData]) => {
                acc[roleName] = Object.keys(roleData.permissions || {});
                return acc;
            },
            {} as Record<string, string[]>,
        );
    });

    // Hooks
    const { canAssignRoles } = usePermissionPermissions();

    const actions = usePermissionActions({
        onSaveSuccess: () => {
            // Toast já é mostrado pelo hook
        },
    });

    // Handlers
    const handlePermissionToggle = useCallback((roleName: string, permissionName: string, checked: boolean) => {
        setRolePermissions((prev) => {
            const current = prev[roleName] || [];
            if (checked) {
                return {
                    ...prev,
                    [roleName]: [...current, permissionName],
                };
            } else {
                return {
                    ...prev,
                    [roleName]: current.filter((p) => p !== permissionName),
                };
            }
        });
    }, []);

    const handleSavePermissions = useCallback(
        async (roleName: string) => {
            await actions.onSavePermissions(roleName, rolePermissions[roleName] || []);
        },
        [actions, rolePermissions],
    );

    const handleRevokeRole = useCallback(
        (user: { id: number }) => {
            actions.onRevokeRole(user.id);
        },
        [actions],
    );

    const handleRoleSelect = useCallback((roleName: string) => {
        setSelectedRole(roleName);
        setSidebarOpen(false); // Fecha o menu mobile após seleção
    }, []);

    // Memoizations
    const rolesEntries = useMemo(() => Object.entries(roles), [roles]);
    const selectedRoleData = useMemo(() => roles[selectedRole], [roles, selectedRole]);

    // Calculate stats
    const totalRoles = useMemo(() => rolesEntries.length, [rolesEntries]);
    const totalPermissions = useMemo(() => permissions.length, [permissions]);

    if (!selectedRoleData) {
        return null;
    }

    const usersArray = Array.isArray(selectedRoleData.users) ? selectedRoleData.users : Object.values(selectedRoleData.users || {});

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gerenciar Permissões" />
            <div className="flex h-full flex-1 flex-col gap-3 p-3 sm:p-4 md:gap-4 md:p-6">
                {/* Mobile Menu Button */}
                <div className="flex items-center gap-2 lg:hidden">
                    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full justify-start gap-2 sm:w-auto">
                                <Menu className="h-4 w-4 shrink-0" />
                                <span className="font-medium">Cargos</span>
                                <span className="text-muted-foreground truncate text-xs">• {selectedRoleData.label}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0 sm:max-w-sm">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Selecionar cargo</SheetTitle>
                            </SheetHeader>
                            <div className="h-full overflow-y-auto">
                                <RolesSidebar roles={roles} selectedRole={selectedRole} onSelectRole={handleRoleSelect} totalRoles={totalRoles} />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 flex-col gap-3 overflow-hidden lg:flex-row lg:gap-4">
                    {/* Sidebar - Navegação de cargos (Desktop) */}
                    <div className="hidden lg:block">
                        <RolesSidebar roles={roles} selectedRole={selectedRole} onSelectRole={setSelectedRole} totalRoles={totalRoles} />
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-card border-border/40 flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border shadow-sm">
                        {/* Permissions Header */}
                        <div className="bg-muted/20 border-border/30 border-b backdrop-blur-sm">
                            <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <Shield className="h-4 w-4 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                    <h2 className="dark:text-foreground text-base font-semibold tracking-tight">Permissões</h2>
                                    <span className="text-muted-foreground/80 dark:text-muted-foreground/70 text-xs font-medium whitespace-nowrap">
                                        • {totalPermissions} {totalPermissions === 1 ? 'permissão' : 'permissões'}
                                    </span>
                                    <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
                                                aria-label="Sobre a tela de cargos"
                                            >
                                                <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                            </Button>
                                        </DialogTrigger>
                                    </Dialog>
                                    <RoleInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
                                </div>
                            </div>
                            {/* Tabs Navigation */}
                            <div className="border-border/30 flex items-center gap-1 border-t px-3 pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 gap-1.5 rounded-b-none border-b-2 border-cyan-600 px-3 text-xs font-medium text-cyan-600 transition-all duration-200 dark:border-cyan-500 dark:text-cyan-400"
                                    data-active
                                >
                                    <Shield className="h-3.5 w-3.5" />
                                    Cargos
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {/* Role Header */}
                            <div className="mb-6">
                                <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <UserCog className="h-5 w-5 shrink-0 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                            <h2 className="dark:text-foreground truncate text-lg font-semibold sm:text-xl">
                                                {selectedRoleData.label}
                                            </h2>
                                        </div>
                                        {/* A quem este cargo se destina. "Gerente" sozinho não diz. */}
                                        {selectedRoleData.description && (
                                            <p className="text-muted-foreground dark:text-muted-foreground/70 mt-1 text-xs sm:text-sm">
                                                {selectedRoleData.description}
                                            </p>
                                        )}
                                        <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                                            <span className="text-muted-foreground dark:text-muted-foreground/70 text-xs">
                                                {Object.keys(selectedRoleData.permissions || {}).length}{' '}
                                                {Object.keys(selectedRoleData.permissions || {}).length === 1 ? 'permissão' : 'permissões'} vinculada
                                                {Object.keys(selectedRoleData.permissions || {}).length === 1 ? '' : 's'}
                                            </span>
                                            <span className="text-muted-foreground dark:text-muted-foreground/50 hidden text-xs sm:inline">•</span>
                                            <span className="text-muted-foreground dark:text-muted-foreground/70 text-xs">
                                                {usersArray.length} {usersArray.length === 1 ? 'usuário' : 'usuários'}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleSavePermissions(selectedRole)}
                                        disabled={actions.isSaving}
                                        size="sm"
                                        className="h-8 w-full shrink-0 gap-1.5 bg-cyan-600 text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-700 active:scale-95 sm:w-auto dark:bg-cyan-600 dark:text-white dark:shadow-lg dark:hover:bg-cyan-700 dark:hover:shadow-xl"
                                    >
                                        {actions.isSaving ? (
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

                            {/* Permissions Section */}
                            <div className="mb-8">
                                <div className="mb-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                        <h3 className="dark:text-foreground text-base font-semibold">Permissões Disponíveis</h3>
                                    </div>
                                    <p className="text-muted-foreground dark:text-muted-foreground/70 text-sm">
                                        Marque o que este cargo libera. Vale na hora para todo mundo que já o tem.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {permissions.map((permission) => (
                                        <PermissionCard
                                            key={permission.name}
                                            permission={permission}
                                            isChecked={(rolePermissions[selectedRole] || []).includes(permission.name)}
                                            onToggle={(permissionName, checked) => handlePermissionToggle(selectedRole, permissionName, checked)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Users Section */}
                            <div>
                                <div className="mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                                        <h3 className="dark:text-foreground text-base font-semibold">Usuários</h3>
                                    </div>
                                    <p className="text-muted-foreground dark:text-muted-foreground/70 mt-1 text-sm">Quem está neste cargo hoje</p>
                                </div>
                                <RoleUsersTable
                                    users={usersArray}
                                    roleLabel={selectedRoleData.label}
                                    assignableRoles={assignableRoles}
                                    onRevokeRole={handleRevokeRole}
                                    canAssignRoles={canAssignRoles()}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
