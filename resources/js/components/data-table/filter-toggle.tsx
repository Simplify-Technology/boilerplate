import { cn } from '@/lib/utils';
import type { FilterToggleProps } from '@/types/data-table';
import { SlidersHorizontal } from 'lucide-react';

/**
 * Componente genérico de botão para mostrar/ocultar filtros
 * Reutilizável em qualquer módulo (Usuários, CRM, Financeiro, etc.)
 */
export function FilterToggle({ isOpen, onToggle, label = 'Filtros', className, activeFiltersCount = 0 }: FilterToggleProps) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all',
                isOpen
                    ? 'bg-primary/20 text-primary hover:bg-primary/30 dark:bg-primary/40 dark:hover:bg-primary/50 dark:text-white dark:shadow-sm'
                    : 'text-foreground/70 hover:bg-muted/60 hover:text-foreground dark:text-foreground/90 dark:hover:bg-muted/60 dark:border-border/50 dark:border dark:hover:text-white',
                className,
            )}
            aria-label={`${isOpen ? 'Ocultar' : 'Mostrar'} ${label}`}
            aria-pressed={isOpen}
        >
            <SlidersHorizontal className="h-4 w-4 transition-transform duration-200 ease-in-out" />
            {isOpen ? 'Ocultar' : label}
            {activeFiltersCount > 0 && (
                <span className="bg-primary/20 text-primary ml-1 rounded-full px-1.5 text-xs font-semibold">{activeFiltersCount}</span>
            )}
        </button>
    );
}
