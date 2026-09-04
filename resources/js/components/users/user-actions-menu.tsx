import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { UserActionsMenuProps } from '@/types/users';
import { Link } from '@inertiajs/react';
import { Edit, Eye, MoreHorizontal, Settings, Trash2, UserCheck, UserCog, UserX } from 'lucide-react';

/**
 * Componente de menu de ações para usuários
 * Dropdown com todas as ações possíveis baseadas em permissões
 */
export function UserActionsMenu({
    user,
    onDelete,
    onToggleActive,
    onImpersonate,
    onAssignRole,
    onRevokeRole,
    canDelete,
    canEdit,
    canImpersonate,
    canManagePermissions,
    canAssignRoles,
    isDeleting = false,
}: UserActionsMenuProps) {
    const hasPrimaryItems = !!(canEdit || canManagePermissions);
    const hasRoleItems = !!(canAssignRoles && (onAssignRole || onRevokeRole));
    const hasImpersonateItem = !!(onImpersonate && canImpersonate(user));
    const hasToggleActiveItem = !!onToggleActive;
    const hasActionItems = hasImpersonateItem || hasToggleActiveItem;
    const hasDeleteItem = !!(onDelete && canDelete(user));

    const shouldShowPrimarySeparator = hasPrimaryItems && (hasRoleItems || hasActionItems);
    const shouldShowRolesSeparator = hasRoleItems && hasActionItems;
    const shouldShowDeleteSeparator = hasDeleteItem && (hasPrimaryItems || hasRoleItems || hasActionItems);
    const hasAnyMenuItems = hasPrimaryItems || hasRoleItems || hasActionItems || hasDeleteItem;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Mais opções para ${user.name}`}
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
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {!hasAnyMenuItems && <DropdownMenuItem disabled>Nenhuma ação disponível</DropdownMenuItem>}

                {canEdit && (
                    <DropdownMenuItem asChild>
                        <Link href={route('users.show', user.id)} className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            Detalhes
                        </Link>
                    </DropdownMenuItem>
                )}

                {canEdit && (
                    <DropdownMenuItem asChild>
                        <Link href={route('users.edit', user.id)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                    </DropdownMenuItem>
                )}

                {canManagePermissions && (
                    <DropdownMenuItem asChild>
                        <Link href={route('users.permissions.show', user.id)} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            Gerenciar Permissões
                        </Link>
                    </DropdownMenuItem>
                )}

                {shouldShowPrimarySeparator && <DropdownMenuSeparator />}

                {canAssignRoles && onAssignRole && (
                    <DropdownMenuItem onClick={() => onAssignRole(user)} className="cursor-pointer">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Atribuir Cargo
                    </DropdownMenuItem>
                )}

                {canAssignRoles && onRevokeRole && (
                    <DropdownMenuItem onClick={() => onRevokeRole(user)} className="cursor-pointer">
                        <UserX className="mr-2 h-4 w-4" />
                        Remover Cargo
                    </DropdownMenuItem>
                )}

                {shouldShowRolesSeparator && <DropdownMenuSeparator />}

                {hasImpersonateItem && (
                    /*
                     * Sem `preventDefault`: o Radix compõe o `onClick` do item
                     * com o `handleSelect` dele usando `checkForDefaultPrevented`,
                     * então cancelar o evento deixava o dropdown ABERTO por cima
                     * da navegação que a personificação acabara de iniciar —
                     * único item do menu a se comportar assim.
                     */
                    <DropdownMenuItem onClick={() => onImpersonate?.(user)} className="cursor-pointer">
                        <UserCog className="mr-2 h-4 w-4" />
                        Personificar
                    </DropdownMenuItem>
                )}

                {hasToggleActiveItem && (
                    <DropdownMenuItem
                        onClick={() => onToggleActive(user)}
                        aria-label={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                        variant={user.is_active ? 'destructive' : 'default'}
                        className={cn(
                            'cursor-pointer',
                            // `text-success` cru e a cor SOLIDA como texto (3.30:1 no claro);
                            // o texto em cor de estado e o `fg` do trio.
                            !user.is_active && 'text-state-success focus:bg-state-success focus:text-state-success',
                        )}
                    >
                        {user.is_active ? (
                            <>
                                <UserX className="mr-2 h-4 w-4" />
                                Desativar
                                <span className="bg-muted text-muted-foreground ml-auto rounded-sm px-1.5 py-0.5 text-[10px] font-medium">Ativo</span>
                            </>
                        ) : (
                            <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Ativar
                                <span className="bg-muted text-muted-foreground ml-auto rounded-sm px-1.5 py-0.5 text-[10px] font-medium">
                                    Inativo
                                </span>
                            </>
                        )}
                    </DropdownMenuItem>
                )}

                {hasDeleteItem && (
                    <>
                        {shouldShowDeleteSeparator && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(user);
                            }}
                            disabled={isDeleting}
                            variant="destructive"
                            className="cursor-pointer disabled:opacity-50"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
