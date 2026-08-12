import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SearchBarProps } from '@/types/data-table';
import { Search, X } from 'lucide-react';
import React from 'react';

/**
 * Componente genérico de barra de busca
 * Reutilizável em qualquer módulo (Usuários, CRM, Financeiro, etc.)
 */
export function SearchBar({
    value,
    onChange,
    onClear,
    placeholder = 'Buscar...',
    isSearching = false,
    ariaLabel = 'Pesquisar',
    className,
}: SearchBarProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const focusInput = React.useCallback((e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        const inputElement = containerRef.current?.querySelector('input');
        if (inputElement) {
            inputElement.focus();
        }
    }, []);

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape' && value) {
                e.preventDefault();
                onClear();
            }
        },
        [value, onClear],
    );

    return (
        <div ref={containerRef} className={cn('relative flex-1 sm:w-64', className)}>
            <Input
                id="search"
                type="text"
                autoComplete="off"
                data-form-type="search"
                placeholder={placeholder}
                className="border-secondary-foreground/20 h-8 pr-8 pl-9 text-xs [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label={ariaLabel}
            />
            {/*
             * O indicador de busca ocupa o lugar da lupa, não o canto direito.
             * Ali vive o botão de limpar, que aparece com o campo preenchido —
             * exatamente quando a busca está em curso. Disputar aquele canto
             * faria o X piscar a cada tecla, o que é pior do que não ter
             * indicador. Aqui o slot já é fixo e o conteúdo só alterna.
             */}
            <div className="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer" onClick={focusInput} role="button" aria-label="Focar busca">
                {isSearching ? (
                    <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" data-testid="search-spinner" />
                ) : (
                    <Search className="text-muted-foreground dark:text-muted-foreground/70 h-4 w-4" />
                )}
            </div>
            {value && (
                <button
                    type="button"
                    className="hover:bg-muted/80 dark:hover:bg-muted/60 absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 transition-all duration-200 ease-in-out hover:scale-110 active:scale-95"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClear();
                    }}
                    aria-label="Limpar busca"
                >
                    <X className="text-muted-foreground hover:text-foreground dark:text-muted-foreground/70 dark:hover:text-foreground/90 h-4 w-4 transition-colors duration-200" />
                </button>
            )}
        </div>
    );
}
