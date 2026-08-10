/**
 * Helpers para aplicação de máscaras em inputs
 * Funções puras e reutilizáveis para formatação de dados brasileiros
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function removeNonNumeric(value: string): string {
    return value.replace(/\D/g, '');
}

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export function applyCpfMask(value: string): string {
    const numbers = removeNonNumeric(value);
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
}

/**
 * Aplica máscara de CNPJ (00.000.000/0000-00)
 */
export function applyCnpjMask(value: string): string {
    const numbers = removeNonNumeric(value);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
}

/**
 * Aplica máscara de CPF ou CNPJ automaticamente baseado no tamanho
 * CPF: 11 dígitos (000.000.000-00)
 * CNPJ: 14 dígitos (00.000.000/0000-00)
 */
export function applyCpfCnpjMask(value: string): string {
    const numbers = removeNonNumeric(value);

    // Se tiver 11 dígitos ou menos, aplica máscara de CPF
    if (numbers.length <= 11) {
        return applyCpfMask(value);
    }

    // Se tiver mais de 11 dígitos, aplica máscara de CNPJ
    return applyCnpjMask(value);
}

/**
 * Aplica máscara de telefone fixo (00) 0000-0000
 * Para números com 10 dígitos
 */
export function applyPhoneMask(value: string): string {
    const numbers = removeNonNumeric(value);
    if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : '';
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    // Limita a 10 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
}

/**
 * Aplica máscara de celular (00) 00000-0000
 * Para números com 11 dígitos
 */
export function applyMobileMask(value: string): string {
    const numbers = removeNonNumeric(value);
    if (numbers.length <= 2) return numbers.length > 0 ? `(${numbers}` : '';
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    // Limita a 11 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Aplica máscara de telefone escolhendo fixo (10 díg.) ou celular (11 díg.)
 * automaticamente conforme o comprimento digitado.
 */
export function applyPhoneAutoMask(value: string): string {
    const numbers = removeNonNumeric(value);
    return numbers.length > 10 ? applyMobileMask(value) : applyPhoneMask(value);
}

/**
 * Aplica máscara de CEP (00000-000)
 */
export function applyCepMask(value: string): string {
    const numbers = removeNonNumeric(value).slice(0, 8);
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
}

/**
 * Remove máscara de uma string, retornando apenas números
 * Útil para enviar dados ao backend
 */
export function removeMask(value: string): string {
    return removeNonNumeric(value);
}
