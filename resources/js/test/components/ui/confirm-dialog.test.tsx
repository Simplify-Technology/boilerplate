import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const baseProps = {
    open: true,
    title: 'Descartar alterações?',
    description: 'Tudo que você digitou será perdido.',
    confirmLabel: 'Descartar',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
};

describe('ConfirmDialog', () => {
    it('renders as an alertdialog with title and description', () => {
        render(<ConfirmDialog {...baseProps} />);

        const dialog = screen.getByRole('alertdialog');

        expect(dialog).toBeInTheDocument();
        expect(screen.getByText('Descartar alterações?')).toBeInTheDocument();
        expect(screen.getByText('Tudo que você digitou será perdido.')).toBeInTheDocument();
    });

    it('renders nothing when closed', () => {
        render(<ConfirmDialog {...baseProps} open={false} />);

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('gives initial focus to the cancel button', () => {
        render(<ConfirmDialog {...baseProps} destructive />);

        expect(screen.getByTestId('confirm-dialog-cancel')).toHaveFocus();
    });

    it('fires onConfirm from the CTA and onCancel from the cancel button', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />);

        fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('disables both buttons while busy', () => {
        render(<ConfirmDialog {...baseProps} busy />);

        expect(screen.getByTestId('confirm-dialog-confirm')).toBeDisabled();
        expect(screen.getByTestId('confirm-dialog-cancel')).toBeDisabled();
    });

    it('paints the CTA as destructive when asked to', () => {
        render(<ConfirmDialog {...baseProps} destructive />);

        expect(screen.getByTestId('confirm-dialog-confirm').className).toContain('destructive');
    });
});
