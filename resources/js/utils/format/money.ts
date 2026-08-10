/**
 * Dinheiro no front: inteiro em CENTAVOS no estado, string decimal ("1234.56")
 * na conversa com o backend, e formatação pt-BR só na borda de exibição.
 * Nenhuma matemática monetária em float — espelha o Money VO do backend.
 */

const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
});

/** 12990 → "R$ 129,90" (Intl, pt-BR). */
export function formatCentsToBRL(cents: number): string {
    return formatter.format(cents / 100);
}

/**
 * Formata a string decimal vinda do servidor ("1234.56") como BRL sem
 * recalcular nada — toda a matemática monetária é server-side.
 */
export function formatMoney(value: string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return 'R$ 0,00';
    }

    const negative = value.trim().startsWith('-');
    const [integer, fraction = '00'] = value.replace('-', '').split('.');

    const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const cents = fraction.padEnd(2, '0').slice(0, 2);

    return `${negative ? '-' : ''}R$ ${grouped},${cents}`;
}

export function isNegativeMoney(value: string | null | undefined): boolean {
    return Boolean(value?.trim().startsWith('-'));
}

/**
 * `"1234.56"` → 123456 centavos. Retorna null quando o texto ainda não é um
 * decimal válido (usuário digitando).
 */
export function toCents(value: string | null | undefined): number | null {
    if (!value) {
        return null;
    }

    const match = /^(-?)(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim());

    if (!match) {
        return null;
    }

    const sign = match[1] === '-' ? -1 : 1;
    const cents = Number.parseInt(match[3]?.padEnd(2, '0') ?? '0', 10);

    return sign * (Number.parseInt(match[2], 10) * 100 + cents);
}

/** 123456 → "1234.56" — a string decimal que o backend espera. */
export function fromCents(cents: number): string {
    const negative = cents < 0;
    const absolute = Math.abs(cents);

    return `${negative ? '-' : ''}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, '0')}`;
}

/**
 * Centavos → texto pt-BR com separador de milhar, sem "R$": 129990 → "1.299,90".
 * É o display do `CurrencyInput`: o campo mostra sempre o que está gravado.
 */
export function formatCentsToMasked(cents: number): string {
    const negative = cents < 0;
    const digits = Math.abs(Math.trunc(cents)).toString().padStart(3, '0');
    const reais = digits.slice(0, -2);
    const centavos = digits.slice(-2);
    const grouped = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return `${negative ? '-' : ''}${grouped},${centavos}`;
}

/**
 * Máscara progressiva de moeda: a digitação preenche da DIREITA, em centavos.
 * "9" → "0,09", "99" → "0,99", "9980" → "99,80", "129990" → "1.299,90".
 *
 * Com entrada livre, "9980" fica "9980" na tela e vira R$ 9.980,00 no banco —
 * um erro de 100× indistinguível de acerto. Aqui o texto exibido É o valor.
 *
 * Devolve `null` quando não sobra nenhum dígito (campo apagado), que é o estado
 * "desligado" de campos opcionais.
 *
 * Zeros à esquerda somem TODOS — inclusive quando não sobra mais nada. Sem
 * isso, "0,00" vira ponto fixo: apagar um valor tecla a tecla trava em "0,00"
 * e o campo nunca esvazia.
 */
export function maskCurrencyInput(raw: string, maxCents = 99_999_999): { display: string; cents: number | null } {
    const digits = raw.replace(/\D/g, '').replace(/^0+/, '');

    if (digits === '') {
        return { display: '', cents: null };
    }

    const cents = Math.min(Number.parseInt(digits, 10), maxCents);

    return { display: formatCentsToMasked(cents), cents };
}
