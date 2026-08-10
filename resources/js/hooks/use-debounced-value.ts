import { useEffect, useState } from 'react';

/**
 * Retorna o valor apenas depois de `delay` ms sem mudanças.
 * Útil para busca digitada: a navegação só dispara quando o usuário para de digitar.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timeout);
        };
    }, [delay, value]);

    return debouncedValue;
}
