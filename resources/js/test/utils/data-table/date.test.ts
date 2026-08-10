import { shiftISODate, todayISO } from '@/utils/data-table/date';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('todayISO', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns the local date in yyyy-mm-dd', () => {
        vi.setSystemTime(new Date(2026, 7, 10, 15, 30)); // 10/08/2026 local

        expect(todayISO()).toBe('2026-08-10');
    });

    it('pads month and day with zeros', () => {
        vi.setSystemTime(new Date(2026, 0, 5, 8, 0)); // 05/01/2026 local

        expect(todayISO()).toBe('2026-01-05');
    });

    it('follows the local clock, not UTC (late evening stays on the same day)', () => {
        vi.setSystemTime(new Date(2026, 7, 10, 23, 30)); // 23:30 local

        expect(todayISO()).toBe('2026-08-10');
    });
});

describe('shiftISODate', () => {
    it('shifts forward across month boundaries', () => {
        expect(shiftISODate('2026-01-30', 3)).toBe('2026-02-02');
    });

    it('shifts backwards across year boundaries', () => {
        expect(shiftISODate('2026-01-01', -1)).toBe('2025-12-31');
    });

    it('handles leap years', () => {
        expect(shiftISODate('2024-02-28', 1)).toBe('2024-02-29');
        expect(shiftISODate('2025-02-28', 1)).toBe('2025-03-01');
    });

    it('returns the same date for a zero shift', () => {
        expect(shiftISODate('2026-08-10', 0)).toBe('2026-08-10');
    });
});
