import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('FormField', () => {
    it('wires label and control through htmlFor/id', () => {
        render(
            <FormField label="Nome" htmlFor="name">
                <Input />
            </FormField>,
        );

        const input = screen.getByLabelText('Nome');

        expect(input).toHaveAttribute('id', 'name');
    });

    it('keeps an explicit id on the control', () => {
        render(
            <FormField label="Nome" htmlFor="name">
                <Input id="custom-id" />
            </FormField>,
        );

        expect(screen.getByRole('textbox')).toHaveAttribute('id', 'custom-id');
    });

    it('links hint and error through aria-describedby', () => {
        render(
            <FormField label="E-mail" htmlFor="email" hint="Nunca compartilhamos seu e-mail." error="E-mail inválido.">
                <Input />
            </FormField>,
        );

        const input = screen.getByLabelText(/E-mail/);
        const describedBy = input.getAttribute('aria-describedby') ?? '';

        expect(describedBy.split(' ')).toHaveLength(2);
        expect(screen.getByText('Nunca compartilhamos seu e-mail.')).toHaveAttribute('id', describedBy.split(' ')[0]);
        expect(screen.getByText('E-mail inválido.')).toHaveAttribute('id', describedBy.split(' ')[1]);
    });

    it('sets aria-invalid automatically when there is an error', () => {
        render(
            <FormField label="Nome" htmlFor="name" error="Obrigatório.">
                <Input />
            </FormField>,
        );

        expect(screen.getByLabelText(/Nome/)).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid or describedby without hint/error', () => {
        render(
            <FormField label="Nome" htmlFor="name">
                <Input />
            </FormField>,
        );

        const input = screen.getByLabelText('Nome');

        expect(input).not.toHaveAttribute('aria-invalid');
        expect(input).not.toHaveAttribute('aria-describedby');
    });

    it('renders the required marker', () => {
        render(
            <FormField label="Nome" htmlFor="name" required>
                <Input />
            </FormField>,
        );

        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders the action slot next to the label', () => {
        render(
            <FormField label="Senha" htmlFor="password" action={<a href="/forgot">Esqueceu?</a>}>
                <Input type="password" />
            </FormField>,
        );

        expect(screen.getByRole('link', { name: 'Esqueceu?' })).toBeInTheDocument();
    });
});
