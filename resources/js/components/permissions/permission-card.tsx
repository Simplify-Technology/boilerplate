import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { PermissionCardProps } from '@/types/permissions';
import { Shield } from 'lucide-react';

/**
 * Componente de card para exibir uma permissão com checkbox
 */
export function PermissionCard({ permission, isChecked, onToggle }: PermissionCardProps) {
    return (
        <label
            className={cn(
                'group relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-200',
                'hover:border-cyan-500/50 hover:bg-cyan-50/50 hover:shadow-sm',
                'dark:hover:border-cyan-500/40 dark:hover:bg-cyan-950/20 dark:hover:shadow-md',
                'focus-within:ring-2 focus-within:ring-cyan-500/20 dark:focus-within:ring-cyan-500/30',
                isChecked
                    ? 'border-cyan-500/50 bg-cyan-50/50 dark:border-cyan-500/40 dark:bg-cyan-950/20 dark:shadow-sm'
                    : 'border-border bg-card dark:border-border/50 dark:bg-card',
            )}
        >
            <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => onToggle(permission.name, checked as boolean)}
                className={cn(
                    'mt-0.5',
                    'data-[state=checked]:border-cyan-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:text-white',
                    'dark:data-[state=checked]:border-cyan-500 dark:data-[state=checked]:bg-cyan-500 dark:data-[state=checked]:text-white',
                    'dark:border-foreground/30 dark:bg-card dark:data-[state=unchecked]:bg-card',
                    'border-foreground/20',
                )}
                aria-label={`${permission.label}: ${permission.description}`}
            />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <Shield
                        className={cn(
                            'h-4 w-4 transition-colors duration-200',
                            isChecked ? 'text-cyan-600 dark:text-cyan-400' : 'text-foreground/20 dark:text-foreground/30',
                        )}
                    />
                    <span className="dark:text-foreground text-sm font-medium">{permission.label}</span>
                </div>
                {/* A frase é o que decide a marcação — o nome sozinho confunde
                    "Gerenciar Permissões" com "Atribuir Cargos". */}
                {permission.description && (
                    <p className="text-muted-foreground dark:text-muted-foreground/80 mt-1 pl-6 text-xs leading-relaxed">{permission.description}</p>
                )}
            </div>
        </label>
    );
}
