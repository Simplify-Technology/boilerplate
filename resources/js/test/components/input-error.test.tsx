import InputError from '@/components/input-error';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/*
 * O erro de formulário chegava mudo ao leitor de tela: `<p>` sem `role` nem
 * `aria-live`, em 28 usos. O campo ganhava `aria-invalid` e o MOTIVO nunca era
 * falado.
 *
 * O remédio do projeto de origem — `aria-live="polite"` no próprio nó — não
 * funciona: `aria-live` só anuncia mudança dentro de uma região que JÁ existia.
 * Um nó recém-montado não é anunciado. Para conteúdo inserido dinamicamente, o
 * mecanismo é `role="alert"`.
 */
describe('InputError', () => {
    it('announces the message through role="alert"', () => {
        render(<InputError message="A senha informada está incorreta." />);

        const alerta = screen.getByRole('alert');

        expect(alerta).toHaveTextContent('A senha informada está incorreta.');
    });

    it('renders nothing without a message', () => {
        const { container } = render(<InputError />);

        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing for a blank message', () => {
        // Um `role="alert"` vazio é pior que nenhum: o leitor anuncia o silêncio
        // e o campo ganha um nó descrito sem descrição.
        const { container } = render(<InputError message="   " />);

        expect(container).toBeEmptyDOMElement();
    });

    it('paints the message with the state token, not a palette literal', () => {
        // `text-red-600 dark:text-red-400` era literal fora de qualquer
        // contrato: `--state-destructive-fg` é medido nos dois temas contra o
        // canvas em `styles/theme-tokens.test.ts`, o literal não era.
        render(<InputError message="Campo obrigatório." />);

        const alerta = screen.getByRole('alert');

        expect(alerta).toHaveClass('text-state-destructive');
        expect(alerta.className).not.toMatch(/text-red-/);
    });

    it('carries the slot marker and keeps forwarded props', () => {
        render(<InputError id="campo-erro" message="Campo obrigatório." />);

        const alerta = screen.getByRole('alert');

        expect(alerta).toHaveAttribute('id', 'campo-erro');
        expect(alerta).toHaveAttribute('data-slot', 'input-error');
    });

    it('is the node that aria-describedby points at inside a FormField', async () => {
        const { FormField } = await import('@/components/ui/form-field');

        render(
            <FormField label="E-mail" htmlFor="email" error="Informe um e-mail válido.">
                <input id="email" />
            </FormField>,
        );

        const alerta = screen.getByRole('alert');
        const campo = screen.getByLabelText('E-mail');

        expect(campo.getAttribute('aria-describedby')).toContain(alerta.id);
    });
});
