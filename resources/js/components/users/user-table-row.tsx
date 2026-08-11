import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { UserTableRowProps } from '@/types/users';
import { TABLE_ROW_HOVER_CLASSES } from '@/utils/users/constants';
import { Link } from '@inertiajs/react';
import { Table } from '@radix-ui/themes';
import { Eye, EyeOff, Shield } from 'lucide-react';
import React from 'react';
import { UserActionsMenu } from './user-actions-menu';

/**
 * Componente de linha da tabela de usuários
 * Renderiza uma linha completa com dados do usuário e ações
 * Memoizado para evitar re-renders desnecessários quando props não mudam
 */
export const UserTableRow = React.memo(
    function UserTableRow({
        user,
        index,
        onView,
        onEdit,
        onDelete,
        onToggleActive,
        onImpersonate,
        onAssignRole,
        onRevokeRole,
        onAddPermission,
        canDelete,
        canEdit,
        canImpersonate,
        canManagePermissions,
        canAssignRoles,
        getUserInitials,
    }: UserTableRowProps) {
        return (
            <Table.Row key={user.id} className={cn(TABLE_ROW_HOVER_CLASSES, index % 2 === 0 && 'bg-muted/5 dark:bg-muted/5')}>
                <Table.RowHeaderCell>
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-semibold text-white shadow-sm transition-transform duration-200 ease-in-out group-hover:scale-105 dark:from-cyan-600 dark:to-blue-700">
                            {getUserInitials(user.name)}
                        </div>
                        <div className="dark:text-foreground text-sm font-semibold">{user.name}</div>
                    </div>
                </Table.RowHeaderCell>
                <Table.Cell>
                    <div className="text-muted-foreground dark:text-muted-foreground/80 text-xs">{user.email}</div>
                </Table.Cell>
                <Table.Cell className="hidden md:table-cell">
                    <div className="text-muted-foreground dark:text-muted-foreground/80 text-xs">{user.mobile || '-'}</div>
                </Table.Cell>
                <Table.Cell>
                    <div className="flex flex-wrap items-center gap-2">
                        {user.role?.label ? (
                            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-0 text-xs font-medium">
                                {user.role.label}
                            </Badge>
                        ) : (
                            <span className="text-muted-foreground/60 text-xs">-</span>
                        )}
                        {(user.custom_permissions_count ?? 0) > 0 && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge
                                        variant="outline"
                                        className="border-cyan-500/50 bg-cyan-50/50 text-xs dark:border-cyan-500/40 dark:bg-cyan-950/20"
                                    >
                                        <Shield className="mr-1 h-3 w-3" />
                                        {user.custom_permissions_count}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {user.custom_permissions_count}{' '}
                                    {user.custom_permissions_count === 1 ? 'permissão individual' : 'permissões individuais'}
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </Table.Cell>
                <Table.Cell>
                    {user.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-900 dark:bg-green-400/10 dark:text-green-300">
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            Ativo
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            <EyeOff className="mr-1 h-3.5 w-3.5" />
                            Inativo
                        </Badge>
                    )}
                </Table.Cell>
                <Table.Cell>
                    <div className="flex items-center justify-end gap-2">
                        {/* Ver Detalhes - Botão visível (ação mais utilizada) */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link href={route('users.show', user.id)}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Ver detalhes de ${user.name}`}
                                        className={cn(
                                            'h-8 w-8 transition-all duration-200 ease-in-out',
                                            'hover:bg-muted/60 hover:text-primary hover:scale-105 active:scale-95',
                                            'dark:hover:bg-muted/40 dark:hover:text-primary',
                                            '[&_svg]:h-4 [&_svg]:w-4',
                                            '[&_svg]:text-muted-foreground dark:[&_svg]:text-muted-foreground/70',
                                            'hover:[&_svg]:text-primary dark:hover:[&_svg]:text-secondary-foreground/80',
                                            '[&_svg]:transition-all [&_svg]:duration-200 hover:[&_svg]:scale-110',
                                        )}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>Detalhes</TooltipContent>
                        </Tooltip>

                        {/* Dropdown Menu - Ações menos utilizadas */}
                        <UserActionsMenu
                            user={user}
                            onView={onView}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggleActive={onToggleActive}
                            onImpersonate={onImpersonate}
                            onAssignRole={onAssignRole}
                            onRevokeRole={onRevokeRole}
                            onAddPermission={onAddPermission}
                            canDelete={canDelete}
                            canEdit={canEdit}
                            canImpersonate={canImpersonate}
                            canManagePermissions={canManagePermissions}
                            canAssignRoles={canAssignRoles}
                        />
                    </div>
                </Table.Cell>
            </Table.Row>
        );
    },
    (prevProps, nextProps) => {
        // Comparação customizada para evitar re-renders desnecessários
        // Compara apenas as propriedades que realmente afetam a renderização
        return (
            prevProps.user.id === nextProps.user.id &&
            prevProps.user.name === nextProps.user.name &&
            prevProps.user.email === nextProps.user.email &&
            prevProps.user.mobile === nextProps.user.mobile &&
            prevProps.user.is_active === nextProps.user.is_active &&
            prevProps.user.role?.id === nextProps.user.role?.id &&
            prevProps.user.role?.label === nextProps.user.role?.label &&
            (prevProps.user.custom_permissions_count ?? 0) === (nextProps.user.custom_permissions_count ?? 0) &&
            prevProps.index === nextProps.index &&
            prevProps.canEdit === nextProps.canEdit &&
            prevProps.canManagePermissions === nextProps.canManagePermissions &&
            prevProps.canAssignRoles === nextProps.canAssignRoles &&
            prevProps.canDelete(prevProps.user) === nextProps.canDelete(nextProps.user) &&
            prevProps.canImpersonate(prevProps.user) === nextProps.canImpersonate(nextProps.user)
        );
    },
);
