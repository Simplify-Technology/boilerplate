import AssignRoleUser from '@/components/assign-role-user';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { RoleUsersTableProps } from '@/types/permissions';
import { getUserInitials } from '@/utils/users/user-helpers';
import { Link } from '@inertiajs/react';
import { Table } from '@radix-ui/themes';
import { Ellipsis, Mail, Settings, UserPlus, Users, UserX } from 'lucide-react';
import { useState } from 'react';

/**
 * Componente de tabela para exibir usuários de uma role específica
 */
export function RoleUsersTable({ users, roleLabel, assignableRoles = [], onRevokeRole, canAssignRoles }: RoleUsersTableProps) {
    const [assignRoleOpen, setAssignRoleOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{
        id: number;
        name: string;
        email: string;
        role?: { name?: string; label?: string } | null;
    } | null>(null);

    const handleAssignRole = (user: { id: number; name: string; email: string; role?: { name?: string; label?: string } | null }) => {
        setSelectedUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role ? { name: user.role.name, label: user.role.label } : null,
        });
        setAssignRoleOpen(true);
    };

    return (
        <>
            <div className="bg-muted/30 dark:bg-muted/20 border-border/40 dark:border-border/50 overflow-hidden rounded-lg border">
                <div className="overflow-x-auto p-3 sm:p-4">
                    <Table.Root variant="surface">
                        <Table.Header>
                            <Table.Row className="bg-muted/10">
                                <Table.ColumnHeaderCell className="text-sm font-semibold">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                                        Usuário
                                    </div>
                                </Table.ColumnHeaderCell>
                                <Table.ColumnHeaderCell className="text-sm font-semibold">
                                    <div className="flex items-center gap-1.5">
                                        <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                                        Email
                                    </div>
                                </Table.ColumnHeaderCell>
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
                                    <Table.Row
                                        key={user.id}
                                        className={cn(
                                            'group hover:bg-muted/40 dark:hover:bg-muted/20 transition-all duration-200 ease-in-out will-change-transform hover:shadow-sm',
                                            index % 2 === 0 && 'bg-muted/5 dark:bg-muted/5',
                                        )}
                                    >
                                        <Table.RowHeaderCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-sm transition-transform duration-200 ease-in-out group-hover:scale-105 dark:from-cyan-600 dark:to-blue-700">
                                                    {getUserInitials(user.name)}
                                                </div>
                                                <div>
                                                    <div className="dark:text-foreground text-sm font-semibold">{user.name}</div>
                                                </div>
                                            </div>
                                        </Table.RowHeaderCell>
                                        <Table.Cell>
                                            <div className="text-muted-foreground dark:text-muted-foreground/80 text-xs">{user.email}</div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center justify-end gap-2">
                                                {canAssignRoles && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="group h-8 w-8 transition-all duration-200 ease-in-out hover:scale-105 hover:bg-cyan-50 hover:text-cyan-700 active:scale-95 dark:hover:bg-cyan-950/20 dark:hover:text-cyan-400"
                                                                aria-label={`Ações para ${user.name}`}
                                                            >
                                                                <Ellipsis className="text-muted-foreground dark:text-muted-foreground/70 h-4 w-4 transition-colors duration-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    handleAssignRole({
                                                                        id: user.id,
                                                                        name: user.name,
                                                                        email: user.email,
                                                                        role: user.role,
                                                                    });
                                                                }}
                                                                className="focus:bg-cyan-50 focus:text-cyan-700 dark:focus:bg-cyan-950/20 dark:focus:text-cyan-400"
                                                            >
                                                                <UserPlus className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-500" />
                                                                Atribuir Cargo
                                                            </DropdownMenuItem>
                                                            {user.role?.name && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => onRevokeRole(user)} variant="destructive">
                                                                        <UserX className="mr-2 h-4 w-4" />
                                                                        Remover Cargo
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            ) : (
                                <Table.Row>
                                    <Table.Cell colSpan={3}>
                                        <EmptyState
                                            title="Nenhum usuário encontrado"
                                            description={`Ninguém está no cargo de ${roleLabel} ainda. O cargo se atribui na tela de usuários.`}
                                            icon={UserX}
                                            action={
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={route('users.index')}>Ir para usuários</Link>
                                                </Button>
                                            }
                                        />
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table.Root>
                </div>
            </div>

            {assignRoleOpen && selectedUser && (
                <AssignRoleUser
                    currentRole={selectedUser.role?.name}
                    currentRoleLabel={selectedUser.role?.label}
                    userId={selectedUser.id}
                    roles={assignableRoles}
                    onClose={() => {
                        setAssignRoleOpen(false);
                        setSelectedUser(null);
                    }}
                />
            )}
        </>
    );
}
