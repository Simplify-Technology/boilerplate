/**
 * Helpers de data pura (`yyyy-mm-dd`) para filtros de período.
 *
 * `yyyy-mm-dd` é o formato que o `<input type="date">` fala e que o backend
 * espera nos filtros — nada aqui carrega hora ou fuso.
 */

/**
 * A data de HOJE no fuso local do usuário, em `yyyy-mm-dd`.
 *
 * NÃO usar `new Date().toISOString().slice(0, 10)`: isso devolve a data em UTC
 * e, à noite em UTC-3, o atalho "Hoje" pediria amanhã.
 */
export function todayISO(): string {
    const now = new Date();
    const year = String(now.getFullYear()).padStart(4, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Soma (ou subtrai, com `days` negativo) dias de calendário a uma data `yyyy-mm-dd`.
 *
 * A conta roda em UTC de propósito: a entrada é uma data pura — sem hora e sem
 * fuso — e à meia-noite UTC a aritmética é exata, sem escorregar um dia por
 * horário de verão.
 */
export function shiftISODate(date: string, days: number): string {
    const [year, month, day] = date.split('-').map(Number);

    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
