import { INVALID_FILTER_VALUES } from '@/utils/data-table/constants';
import { buildQueryParams, clearQueryParams, isValidFilterValue, mergeQueryParams } from '@/utils/data-table/query-params';
import { describe, expect, it } from 'vitest';

describe('isValidFilterValue', () => {
    it('rejects every sentinel in INVALID_FILTER_VALUES', () => {
        for (const value of INVALID_FILTER_VALUES) {
            expect(isValidFilterValue(value)).toBe(false);
        }
    });

    it('accepts real filter values, including falsy ones like 0 and false', () => {
        expect(isValidFilterValue('active')).toBe(true);
        expect(isValidFilterValue(0)).toBe(true);
        expect(isValidFilterValue(false)).toBe(true);
    });
});

describe('buildQueryParams', () => {
    it('drops invalid values and keeps the rest', () => {
        expect(buildQueryParams({ search: '', status: 'all', page: 2, sort_by: 'name' })).toEqual({ page: 2, sort_by: 'name' });
    });
});

describe('mergeQueryParams', () => {
    it('replaces updated keys and drops keys updated to invalid values', () => {
        expect(mergeQueryParams({ search: 'ana', page: 3 }, { search: '', page: 1 })).toEqual({ page: 1 });
    });

    it('removes explicitly listed keys', () => {
        expect(mergeQueryParams({ search: 'ana', role: 'admin' }, {}, ['role'])).toEqual({ search: 'ana' });
    });
});

describe('clearQueryParams', () => {
    it('keeps only the requested valid keys', () => {
        expect(clearQueryParams({ search: 'ana', page: 2, sort_by: '' }, ['page', 'sort_by'])).toEqual({ page: 2 });
    });
});
