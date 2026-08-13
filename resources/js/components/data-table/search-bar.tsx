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
    resultCount,
    ariaLabel = 'Pesquisar',
    className,
}: SearchBarProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    /*
     * O desfecho da busca, não só o começo. A região vivia na página e dizia
     * "Buscando..." enquanto `isSearching`, voltando a string vazia ao
     * terminar — quem depende de leitor de tela ouvia a busca começar e nunca
     * ficava sabendo se veio resultado. Ela desce para cá porque quem já é
     * dono de `isSearching` é este componente; na página, a próxima listagem
     * repetiria o copy-paste (no ctfinance o mesmo bloco está em 11 telas).
     *
     * Silêncio deliberado quando não se buscou nada: sem `value`, não há
     * desfecho a anunciar. E `resultCount` é opcional porque a contagem não
     * existe no hook de filtros — ela vem das props da página.
     */
    const searchStatus = React.useMemo(() => {
        if (isSearching) {
            return 'Buscando…';
        }

        if (!value || resultCount === undefined) {
            return '';
        }

        if (resultCount === 0) {
            return 'Nenhum resultado encontrado.';
        }

        return `${resultCount.toLocaleString('pt-BR')} ${resultCount === 1 ? 'resultado encontrado' : 'resultados encontrados'}.`;
    }, [isSearching, value, resultCount]);

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
            {/*
             * Renderizada SEMPRE, mesmo vazia: `aria-live` num nó recém-montado
             * não anuncia nada — é a mudança de conteúdo de uma região que já
             * existia que dispara o anúncio.
             */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {searchStatus}
            </div>
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
            {/*
             * Sem `role="button"`: o slot dizia ser botão para o leitor de
             * tela e não tinha `tabIndex` nem handler de teclado (4.1.2).
             * Virar `<button>` de verdade também é errado aqui — o único
             * efeito dele é focar o campo que está ao lado e já é o próximo
             * na ordem de tabulação, então seria uma parada de tab que não
             * leva a lugar nenhum. O papel falso sai, o clique de mouse fica.
             */}
            <div className="absolute top-1/2 left-3 -translate-y-1/2 cursor-pointer" onClick={focusInput} aria-hidden="true">
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
