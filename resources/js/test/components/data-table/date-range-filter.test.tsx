import { DateRangeFilter } from '@/components/data-table/date-range-filter';
import { shiftISODate, todayISO } from '@/utils/data-table/date';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('DateRangeFilter', () => {
    it('renders the label and both date fields', () => {
        render(<DateRangeFilter from={null} to={null} onChange={vi.fn()} />);

        expect(screen.getByText('Período')).toBeInTheDocument();
        expect(screen.getByLabelText('Data inicial')).toBeInTheDocument();
        expect(screen.getByLabelText('Data final')).toBeInTheDocument();
    });

    it('emits the whole range when a shortcut is clicked', () => {
        const onChange = vi.fn();
        const today = todayISO();

        render(<DateRangeFilter from={null} to={null} onChange={onChange} />);

        fireEvent.click(screen.getByRole('radio', { name: '7 dias' }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith({ from: shiftISODate(today, -6), to: today });
    });

    it('marks the shortcut matching the current range as active', () => {
        const today = todayISO();

        render(<DateRangeFilter from={today} to={today} onChange={vi.fn()} />);

        expect(screen.getByRole('radio', { name: 'Hoje' })).toHaveAttribute('data-state', 'on');
        expect(screen.getByRole('radio', { name: '7 dias' })).toHaveAttribute('data-state', 'off');
    });

    it('does not clear the range when the active shortcut is clicked again', () => {
        const onChange = vi.fn();
        const today = todayISO();

        render(<DateRangeFilter from={today} to={today} onChange={onChange} />);

        fireEvent.click(screen.getByRole('radio', { name: 'Hoje' }));

        expect(onChange).not.toHaveBeenCalled();
    });

    it('emits a partial range when one field changes', () => {
        const onChange = vi.fn();

        render(<DateRangeFilter from={null} to={null} onChange={onChange} />);

        fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-08-01' } });

        expect(onChange).toHaveBeenCalledWith({ from: '2026-08-01', to: null });
    });

    it('caps the "to" field at today', () => {
        render(<DateRangeFilter from={null} to={null} onChange={vi.fn()} />);

        expect(screen.getByLabelText('Data final')).toHaveAttribute('max', todayISO());
    });
});
