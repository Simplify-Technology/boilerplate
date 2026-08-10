import { formatCentsToBRL, formatCentsToMasked, formatMoney, fromCents, isNegativeMoney, maskCurrencyInput, toCents } from '@/utils/format/money';
import { describe, expect, it } from 'vitest';

describe('formatMoney', () => {
    it('formata a string decimal do servidor como BRL', () => {
        expect(formatMoney('1234.56')).toBe('R$ 1.234,56');
        expect(formatMoney('0.05')).toBe('R$ 0,05');
        expect(formatMoney('12')).toBe('R$ 12,00');
    });

    it('preserva o sinal negativo', () => {
        expect(formatMoney('-1234.56')).toBe('-R$ 1.234,56');
    });

    it('vazio/null vira R$ 0,00', () => {
        expect(formatMoney(null)).toBe('R$ 0,00');
        expect(formatMoney(undefined)).toBe('R$ 0,00');
        expect(formatMoney('')).toBe('R$ 0,00');
    });

    it('completa fração de um dígito', () => {
        expect(formatMoney('12.5')).toBe('R$ 12,50');
    });
});

describe('isNegativeMoney', () => {
    it('detecta o sinal', () => {
        expect(isNegativeMoney('-10.00')).toBe(true);
        expect(isNegativeMoney('10.00')).toBe(false);
        expect(isNegativeMoney(null)).toBe(false);
    });
});

describe('toCents', () => {
    it('converte string decimal em centavos inteiros', () => {
        expect(toCents('1234.56')).toBe(123456);
        expect(toCents('1234')).toBe(123400);
        expect(toCents('12,5')).toBe(1250);
        expect(toCents('-10.00')).toBe(-1000);
    });

    it('devolve null para o que ainda não é decimal válido', () => {
        expect(toCents('')).toBeNull();
        expect(toCents(null)).toBeNull();
        expect(toCents('abc')).toBeNull();
        expect(toCents('12.345')).toBeNull();
        expect(toCents('1.2.3')).toBeNull();
    });
});

describe('fromCents', () => {
    it('converte centavos na string decimal que o backend espera', () => {
        expect(fromCents(123456)).toBe('1234.56');
        expect(fromCents(5)).toBe('0.05');
        expect(fromCents(-50)).toBe('-0.50');
        expect(fromCents(0)).toBe('0.00');
    });

    it('faz round-trip com toCents', () => {
        expect(toCents(fromCents(98765))).toBe(98765);
    });
});

describe('formatCentsToBRL', () => {
    it('formata centavos como BRL via Intl', () => {
        expect(formatCentsToBRL(12990)).toContain('129,90');
        expect(formatCentsToBRL(12990)).toMatch(/^R\$/);
    });

    it('agrupa o milhar', () => {
        expect(formatCentsToBRL(1234567)).toContain('12.345,67');
    });
});

describe('formatCentsToMasked', () => {
    it('agrupa milhar e mantém duas casas', () => {
        expect(formatCentsToMasked(9980)).toBe('99,80');
        expect(formatCentsToMasked(129990)).toBe('1.299,90');
        expect(formatCentsToMasked(5)).toBe('0,05');
        expect(formatCentsToMasked(0)).toBe('0,00');
        expect(formatCentsToMasked(100000000)).toBe('1.000.000,00');
    });
});

describe('maskCurrencyInput', () => {
    it('preenche da direita em centavos', () => {
        expect(maskCurrencyInput('9')).toEqual({ display: '0,09', cents: 9 });
        expect(maskCurrencyInput('99')).toEqual({ display: '0,99', cents: 99 });
        expect(maskCurrencyInput('9980')).toEqual({ display: '99,80', cents: 9980 });
        expect(maskCurrencyInput('129990')).toEqual({ display: '1.299,90', cents: 129990 });
    });

    it('descarta o que não é dígito em vez de zerar o campo', () => {
        expect(maskCurrencyInput('R$ 99,80')).toEqual({ display: '99,80', cents: 9980 });
        expect(maskCurrencyInput('a1b2')).toEqual({ display: '0,12', cents: 12 });
    });

    it('campo apagado é null, não zero', () => {
        expect(maskCurrencyInput('')).toEqual({ display: '', cents: null });
        expect(maskCurrencyInput('abc')).toEqual({ display: '', cents: null });
    });

    // Regressão: com `^0+(?=\d)` os dígitos "00" viravam "0" e o display
    // remontava "0,00" — apagando um valor tecla a tecla o campo travava ali e
    // nunca esvaziava.
    it('apagar tecla a tecla chega a vazio, sem travar em 0,00', () => {
        let display = '99,80';
        const trilha: string[] = [];

        for (let i = 0; i < 8 && display !== ''; i++) {
            display = maskCurrencyInput(display.slice(0, -1)).display;
            trilha.push(display);
        }

        expect(display).toBe('');
        expect(trilha).toEqual(['9,98', '0,99', '0,09', '']);
    });

    it('zero digitado não é um valor — é campo vazio', () => {
        expect(maskCurrencyInput('0')).toEqual({ display: '', cents: null });
        expect(maskCurrencyInput('000')).toEqual({ display: '', cents: null });
        expect(maskCurrencyInput('05')).toEqual({ display: '0,05', cents: 5 });
    });

    it('respeita o teto', () => {
        expect(maskCurrencyInput('999999999999', 99_999_999).cents).toBe(99_999_999);
    });
});
