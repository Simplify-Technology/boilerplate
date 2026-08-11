import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RolesData } from '@/types/permissions';
import { Shield } from 'lucide-react';

interface RolesSidebarProps {
    roles: RolesData;
    selectedRole: string;
    onSelectRole: (roleName: string) => void;
    totalRoles: number;
}

/**
 * Sidebar vertical para navegação entre roles
 * Estilo limpo e funcional
 */
export function RolesSidebar({ roles, selectedRole, onSelectRole, totalRoles }: RolesSidebarProps) {
    const rolesEntries = Object.entries(roles);

    return (
        <aside className="bg-card border-border/40 flex w-full shrink-0 flex-col overflow-hidden rounded-lg border shadow-sm lg:w-64 lg:max-w-xs">
            {/* Cargos Header */}
            <div className="bg-muted/20 border-border/30 border-b backdrop-blur-sm">
                <div className="flex items-center gap-2 px-3 py-2">
                    <Shield className="h-4 w-4 text-cyan-600 transition-colors duration-200 dark:text-cyan-500" />
                    <h2 className="dark:text-foreground text-base font-semibold tracking-tight">Cargos</h2>
                    <span className="text-muted-foreground/80 dark:text-muted-foreground/70 text-xs font-medium">
                        • {totalRoles} {totalRoles === 1 ? 'cargo' : 'cargos'}
                    </span>
                </div>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto p-2">
                {rolesEntries.map(([roleName, roleData]) => {
                    const isActive = selectedRole === roleName;

                    return (
                        <Button
                            key={roleName}
                            variant={isActive ? 'secondary' : 'ghost'}
                            className={cn(
                                'h-auto w-full justify-start px-3 py-2.5 text-left transition-all duration-200',
                                isActive
                                    ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-l-2 dark:border-cyan-500 dark:bg-cyan-500/20 dark:text-cyan-200 dark:shadow-sm dark:hover:bg-cyan-500/30'
                                    : 'hover:bg-muted/60 hover:text-foreground dark:hover:bg-muted/50 dark:text-foreground/90 dark:hover:text-foreground dark:hover:bg-muted/60',
                            )}
                            onClick={() => onSelectRole(roleName)}
                        >
                            <span className={cn('text-sm font-medium', isActive ? 'dark:text-cyan-200' : 'dark:text-foreground/90')}>
                                {roleData.label || roleName}
                            </span>
                        </Button>
                    );
                })}
            </nav>
        </aside>
    );
}
