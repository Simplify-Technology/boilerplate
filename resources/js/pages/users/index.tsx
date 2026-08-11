import { AddPermissionDialog } from '@/components/add-permission-dialog';
import AssignRoleUser from '@/components/assign-role-user';
import { FilterToggle } from '@/components/data-table/filter-toggle';
import { Pagination } from '@/components/data-table/pagination';
import { SearchBar } from '@/components/data-table/search-bar';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { FilterPanel } from '@/components/users/filter-panel';
import { UserInfoDialog } from '@/components/users/user-info-dialog';
import { UserTableRow } from '@/components/users/user-table-row';
import { useFlashMessages } from '@/hooks/use-flash-messages';
import { useUserActions } from '@/hooks/users/use-user-actions';
import { useUserFilters } from '@/hooks/users/use-user-filters';
import { useUserPermissions } from '@/hooks/users/use-user-permissions';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, User } from '@/types';
import type { UsersPageProps } from '@/types/users';
import { buildPaginationParams } from '@/utils/data-table/query-params';
import { getUserInitials } from '@/utils/users/user-helpers';
import { Head, Link, router } from '@inertiajs/react';
import { Table } from '@radix-ui/themes';
import { CheckCircle, Info, Mail, Phone, Plus, Settings, Shield, User2, UserPlus, UserX } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Usuários', href: '/users' }];

export default function Index({ users, roles, assignableRoles = [], filters = {}, pagination }: UsersPageProps) {
    useFlashMessages();

    // Local state for modals and processing
    const [showFilters, setShowFilters] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showInfoDialog, setShowInfoDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showAddPermissionDialog, setShowAddPermissionDialog] = useState(false);
    const [showAssignRoleDialog, setShowAssignRoleDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showRevokeRoleDialog, setShowRevokeRoleDialog] = useState(false);
    const [userToRevokeRole, setUserToRevokeRole] = useState<User | null>(null);
    const [isRevokingRole, setIsRevokingRole] = useState(false);

    // Hooks
    const { localSearch, isSearching, setLocalSearch, handleFilterChange, clearFilters, clearSingleFilter, searchContainerRef } = useUserFilters({
        initialFilters: filters,
        routeName: 'users.index',
    });

    const { canDeleteUser, canEdit, canImpersonate, canManagePermissions, canAssignRoles } = useUserPermissions();

    // Pré-calcular flags de permissão uma vez (otimização para evitar chamadas repetidas no map)
    const hasManagePermissions = useMemo(() => canManagePermissions(), [canManagePermissions]);
    const hasAssignRoles = useMemo(() => canAssignRoles(), [canAssignRoles]);
    const canEditUsers = useMemo(() => canEdit(), [canEdit]);

    const actions = useUserActions({
        onDeleteSuccess: () => {
            setShowDeleteDialog(false);
            setUserToDelete(null);
        },
        onDeleteError: () => {
            setIsDeleting(false);
        },
        onRevokeRoleSuccess: () => {
            setShowRevokeRoleDialog(false);
            setUserToRevokeRole(null);
        },
        onRevokeRoleError: () => {
            setIsRevokingRole(false);
        },
    });

    // Handlers for modals
    const handleDelete = useCallback(() => {
        if (!userToDelete) return;
        setIsDeleting(true);
        actions.onDelete(userToDelete);
    }, [userToDelete, actions]);

    const handleAddPermission = useCallback((user: User) => {
        setSelectedUser(user);
        setShowAddPermissionDialog(true);
    }, []);

    const handleAssignRole = useCallback((user: User) => {
        setSelectedUser(user);
        setShowAssignRoleDialog(true);
    }, []);

    const handleRevokeRole = useCallback((user: User) => {
        setUserToRevokeRole(user);
        setShowRevokeRoleDialog(true);
    }, []);

    const confirmRevokeRole = useCallback(() => {
        if (!userToRevokeRole) return;
        setIsRevokingRole(true);
        actions.onRevokeRole(userToRevokeRole);
    }, [userToRevokeRole, actions]);

    const handlePageChange = useCallback(
        (page: number) => {
            const params = buildPaginationParams(page, filters);
            router.get(route('users.index'), params, {
                preserveState: true,
                preserveScroll: false,
            });
        },
        [filters],
    );

    // Calculate active filters count (incluindo busca)
    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.search?.trim()) count++;
        if (filters.role_id) count++;
        if (filters.is_active !== undefined && filters.is_active !== '') count++;
        return count;
    }, [filters]);

    // Table columns configuration (memoizado para evitar recriação a cada render)
    const tableColumns = useMemo(
        () => [
            { key: 'name', label: 'Nome', icon: User2 },
            { key: 'email', label: 'E-mail', icon: Mail },
            { key: 'mobile', label: 'Celular', icon: Phone },
            { key: 'role', label: 'Cargo', icon: Shield },
            { key: 'status', label: 'Status', icon: CheckCircle },
        ],
        [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usuários" />
            {/* Aria live region for screen readers */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {isSearching ? 'Buscando usuários...' : ''}
            </div>
            <div className="flex h-full flex-1 flex-col gap-3 p-4 md:gap-4 md:p-6">
                {/* Data Table with Integrated Filters */}
                <div className="bg-card border-border/40 overflow-hidden rounded-lg border shadow-sm">
                    {/* Table Header with Search and Filter Toggle */}
                    <div className="bg-muted/20 border-border/30 border-b backdrop-blur-sm">
                        <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                                <h2 className="text-base font-semibold tracking-tight">Usuários</h2>
                                <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:bg-accent/50 dark:hover:bg-accent/20 hover:text-primary dark:hover:text-primary/90 h-6 w-6 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
                                            aria-label="Sobre a tela de usuários"
                                        >
                                            <Info className="text-muted-foreground dark:text-muted-foreground/80 h-4 w-4 transition-colors duration-200" />
                                        </Button>
                                    </DialogTrigger>
                                </Dialog>
                                <UserInfoDialog open={showInfoDialog} onOpenChange={setShowInfoDialog} />
                                <span className="text-muted-foreground/80 text-xs font-medium">
                                    • {pagination.total.toLocaleString('pt-BR')} registros
                                </span>
                                <div ref={searchContainerRef} className="ms-4">
                                    <SearchBar
                                        value={localSearch}
                                        onChange={setLocalSearch}
                                        onClear={() => {
                                            setLocalSearch('');
                                            clearSingleFilter('search');
                                        }}
                                        placeholder="Buscar nome, email ou celular"
                                        isSearching={isSearching}
                                        ariaLabel="Pesquisar usuários"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <FilterToggle
                                    isOpen={showFilters}
                                    onToggle={() => setShowFilters(!showFilters)}
                                    activeFiltersCount={activeFiltersCount}
                                />
                                <Link href={route('users.create')}>
                                    <Button
                                        size="sm"
                                        className="h-8 gap-1.5 bg-cyan-600 text-white transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-700 active:scale-95 dark:bg-cyan-600 dark:text-white dark:shadow-lg dark:hover:bg-cyan-700 dark:hover:shadow-xl"
                                    >
                                        <Plus className="h-4 w-4 transition-transform duration-200" />
                                        Novo Usuário
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        {/* Advanced Filters Panel - Collapsible */}
                        {showFilters && (
                            <div className="animate-in fade-in-50 duration-200">
                                <FilterPanel
                                    filters={filters}
                                    roles={roles}
                                    isSearching={isSearching}
                                    onFilterChange={(key, value) => handleFilterChange(key as keyof typeof filters, value)}
                                    onClearFilters={clearFilters}
                                    onClearSingleFilter={(key) => clearSingleFilter(key as keyof typeof filters)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Table Content */}
                    <div className="p-3">
                        <Table.Root variant="surface">
                            <Table.Header>
                                <Table.Row className="bg-muted/10">
                                    {tableColumns.map((column) => {
                                        const Icon = column.icon;
                                        return (
                                            <Table.ColumnHeaderCell
                                                key={column.key}
                                                className={`text-sm font-semibold ${column.key === 'mobile' ? 'hidden md:table-cell' : ''}`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <Icon className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                                                    {column.label}
                                                </div>
                                            </Table.ColumnHeaderCell>
                                        );
                                    })}
                                    <Table.ColumnHeaderCell className="text-end text-sm font-semibold">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <Settings className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                                            Ações
                                        </div>
                                    </Table.ColumnHeaderCell>
                                </Table.Row>
                            </Table.Header>

                            <Table.Body>
                                {users.length > 0 ? (
                                    users.map((user, index) => (
                                        <UserTableRow
                                            key={user.id}
                                            user={user}
                                            index={index}
                                            onView={actions.onView}
                                            onEdit={canEditUsers ? actions.onEdit : undefined}
                                            onDelete={
                                                hasManagePermissions && canDeleteUser(user)
                                                    ? (user) => {
                                                          setUserToDelete(user);
                                                          setShowDeleteDialog(true);
                                                      }
                                                    : undefined
                                            }
                                            onToggleActive={hasManagePermissions ? actions.onToggleActive : undefined}
                                            onImpersonate={canImpersonate(user) ? actions.onImpersonate : undefined}
                                            onAssignRole={hasAssignRoles ? handleAssignRole : undefined}
                                            onRevokeRole={hasAssignRoles ? handleRevokeRole : undefined}
                                            onAddPermission={hasManagePermissions ? handleAddPermission : undefined}
                                            canDelete={canDeleteUser}
                                            canEdit={canEditUsers}
                                            canImpersonate={canImpersonate}
                                            canManagePermissions={hasManagePermissions}
                                            canAssignRoles={hasAssignRoles}
                                            getUserInitials={getUserInitials}
                                        />
                                    ))
                                ) : (
                                    <Table.Row>
                                        <Table.Cell colSpan={6}>
                                            <EmptyState
                                                title={
                                                    filters.search || filters.role_id !== undefined || filters.is_active !== undefined
                                                        ? 'Nenhum usuário bate com esses filtros'
                                                        : 'Nenhum usuário cadastrado ainda'
                                                }
                                                description={
                                                    filters.search || filters.role_id !== undefined || filters.is_active !== undefined
                                                        ? 'Limpe os filtros ou tente outro termo de busca'
                                                        : 'Clique em "Novo Usuário" para cadastrar o primeiro'
                                                }
                                                icon={User2}
                                            />
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Root>
                    </div>
                </div>

                {/* Pagination */}
                <Pagination
                    currentPage={pagination.current_page}
                    lastPage={pagination.last_page}
                    perPage={pagination.per_page}
                    total={pagination.total}
                    onPageChange={handlePageChange}
                    itemLabel="usuários"
                />
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                title="Excluir Usuário"
                description="O cadastro é apagado de vez. Não existe lixeira nem como recuperar depois."
                itemName={userToDelete?.name}
                itemType="Usuário"
                icon={User2}
                details={
                    userToDelete
                        ? [
                              { label: 'E-mail', value: userToDelete.email, icon: Mail },
                              { label: 'Cargo', value: userToDelete.role?.label || 'Não definido', icon: Shield },
                          ]
                        : []
                }
                warnings={[
                    {
                        message: 'Se você só quer tirar o acesso, desative a conta: a pessoa não entra mais e o cadastro fica.',
                        severity: 'warning',
                    },
                    {
                        message: 'O registro de auditoria das ações desta pessoa permanece, sem vínculo com o cadastro apagado.',
                        severity: 'danger',
                    },
                ]}
                variant="danger"
                processing={isDeleting}
            />

            {/* Add Permission Dialog */}
            {selectedUser && (
                <AddPermissionDialog
                    open={showAddPermissionDialog}
                    onOpenChange={(open) => {
                        setShowAddPermissionDialog(open);
                        if (!open) {
                            setSelectedUser(null);
                        }
                    }}
                    user={{
                        id: selectedUser.id,
                        name: selectedUser.name,
                        custom_permissions_list:
                            (
                                selectedUser as User & {
                                    custom_permissions_list?: Array<{ name: string; label: string; meta?: { can_impersonate_any?: boolean } }>;
                                }
                            ).custom_permissions_list || [],
                    }}
                />
            )}

            {/* Assign Role Dialog */}
            {selectedUser && showAssignRoleDialog && (
                <AssignRoleUser
                    userId={selectedUser.id}
                    roles={assignableRoles.length > 0 ? assignableRoles : roles}
                    currentRole={selectedUser.role?.name || undefined}
                    currentRoleLabel={selectedUser.role?.label || undefined}
                    onClose={() => {
                        setShowAssignRoleDialog(false);
                        setSelectedUser(null);
                    }}
                />
            )}

            {/* Revoke Role Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={showRevokeRoleDialog}
                onOpenChange={setShowRevokeRoleDialog}
                onConfirm={confirmRevokeRole}
                title="Remover Cargo do Usuário"
                description="Ao remover o cargo, o usuário perderá automaticamente todas as permissões vinculadas a esse cargo. Esta ação pode afetar o acesso do usuário ao sistema."
                itemName={userToRevokeRole?.name}
                itemType="Usuário"
                itemTypeLabel="Usuário"
                icon={UserX}
                details={
                    userToRevokeRole
                        ? [
                              { label: 'E-mail', value: userToRevokeRole.email, icon: Mail },
                              { label: 'Cargo Atual', value: userToRevokeRole.role?.label || 'Não definido', icon: Shield },
                          ]
                        : []
                }
                warnings={[
                    {
                        message:
                            'Todas as permissões herdadas deste cargo serão removidas automaticamente. O usuário ficará apenas com permissões individuais que foram concedidas diretamente a ele.',
                        severity: 'warning',
                    },
                    {
                        message:
                            'Se o usuário não possuir outras permissões ou cargos, ele poderá perder acesso a funcionalidades importantes do sistema.',
                        severity: 'warning',
                    },
                    {
                        message: 'Você pode atribuir um novo cargo a este usuário a qualquer momento para restaurar as permissões necessárias.',
                        severity: 'warning',
                    },
                ]}
                variant="warning"
                confirmText="Remover Cargo"
                cancelText="Cancelar"
                processing={isRevokingRole}
            />
        </AppLayout>
    );
}
