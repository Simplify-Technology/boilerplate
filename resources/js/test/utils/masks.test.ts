import { applyCepMask, applyCnpjMask, applyCpfCnpjMask, applyCpfMask, applyPhoneAutoMask, removeMask } from '@/utils/format/masks';
import { describe, expect, it } from 'vitest';

describe('applyCpfMask', () => {
    it('formata CPF completo como 000.000.000-00', () => {
        expect(applyCpfMask('12345678909')).toBe('123.456.789-09');
    });

    it('formata progressivamente enquanto digita', () => {
        expect(applyCpfMask('123')).toBe('123');
        expect(applyCpfMask('1234')).toBe('123.4');
        expect(applyCpfMask('1234567')).toBe('123.456.7');
        expect(applyCpfMask('1234567890')).toBe('123.456.789-0');
    });

    it('descarta o que não é dígito e limita a 11 dígitos', () => {
        expect(applyCpfMask('123.456.789-09999')).toBe('123.456.789-09');
        expect(applyCpfMask('abc123def456')).toBe('123.456');
    });
});

describe('applyCnpjMask', () => {
    it('formata CNPJ completo como 00.000.000/0000-00', () => {
        expect(applyCnpjMask('11222333000181')).toBe('11.222.333/0001-81');
    });

    it('limita a 14 dígitos', () => {
        expect(applyCnpjMask('112223330001819999')).toBe('11.222.333/0001-81');
    });
});

describe('applyCpfCnpjMask', () => {
    it('até 11 dígitos formata como CPF', () => {
        expect(applyCpfCnpjMask('12345678909')).toBe('123.456.789-09');
    });

    it('do 12º dígito em diante vira CNPJ', () => {
        expect(applyCpfCnpjMask('112223330001')).toBe('11.222.333/0001');
        expect(applyCpfCnpjMask('11222333000181')).toBe('11.222.333/0001-81');
    });
});

describe('applyCepMask', () => {
    it('formata CEP como 00000-000', () => {
        expect(applyCepMask('01001000')).toBe('01001-000');
    });

    it('não adiciona o hífen antes do 6º dígito', () => {
        expect(applyCepMask('01001')).toBe('01001');
    });

    it('limita a 8 dígitos', () => {
        expect(applyCepMask('010010009999')).toBe('01001-000');
    });

    it('descarta o que não é dígito', () => {
        expect(applyCepMask('abc01001def000')).toBe('01001-000');
    });
});

describe('applyPhoneAutoMask', () => {
    it('formata fixo (10 dígitos)', () => {
        expect(applyPhoneAutoMask('1133334444')).toBe('(11) 3333-4444');
    });

    it('formata celular (11 dígitos)', () => {
        expect(applyPhoneAutoMask('11987654321')).toBe('(11) 98765-4321');
    });
});

describe('removeMask', () => {
    it('devolve só os dígitos (unmask para envio ao backend)', () => {
        expect(removeMask('123.456.789-09')).toBe('12345678909');
        expect(removeMask('(11) 98765-4321')).toBe('11987654321');
        expect(removeMask('01001-000')).toBe('01001000');
    });
});
