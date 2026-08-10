import { DateInput } from '@/components/ui/date-input';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('DateInput', () => {
    it('renders a native date input with the given value', () => {
        render(<DateInput aria-label="Data" value="2026-08-10" onChange={vi.fn()} />);

        const input = screen.getByLabelText('Data');

        expect(input).toHaveAttribute('type', 'date');
        expect(input).toHaveValue('2026-08-10');
    });

    it('renders empty for a null value', () => {
        render(<DateInput aria-label="Data" value={null} onChange={vi.fn()} />);

        expect(screen.getByLabelText('Data')).toHaveValue('');
    });

    it('emits null when the field is emptied', () => {
        const onChange = vi.fn();

        render(<DateInput aria-label="Data" value="2026-08-10" onChange={onChange} />);

        fireEvent.change(screen.getByLabelText('Data'), { target: { value: '' } });

        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('shows the clear button only when clearable and filled', () => {
        const { rerender } = render(<DateInput aria-label="Data" value="2026-08-10" onChange={vi.fn()} clearable />);

        expect(screen.getByRole('button', { name: 'Limpar data' })).toBeInTheDocument();

        rerender(<DateInput aria-label="Data" value={null} onChange={vi.fn()} clearable />);

        expect(screen.queryByRole('button', { name: 'Limpar data' })).not.toBeInTheDocument();
    });

    it('clears via the clear button', () => {
        const onChange = vi.fn();

        render(<DateInput aria-label="Data" value="2026-08-10" onChange={onChange} clearable />);

        fireEvent.click(screen.getByRole('button', { name: 'Limpar data' }));

        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('applies the dark mode picker icon fix', () => {
        render(<DateInput aria-label="Data" value={null} onChange={vi.fn()} />);

        expect(screen.getByLabelText('Data').className).toContain('dark:[&::-webkit-calendar-picker-indicator]:invert');
        expect(screen.getByLabelText('Data').className).toContain('dark:[color-scheme:dark]');
    });

    it('marks the field invalid via aria-invalid', () => {
        render(<DateInput aria-label="Data" value={null} onChange={vi.fn()} invalid />);

        expect(screen.getByLabelText('Data')).toHaveAttribute('aria-invalid', 'true');
    });
});
