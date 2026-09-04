import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/*
 * A variante `destructive` do `Alert` vendorizado pintava
 * `text-destructive-foreground` (branco) e fundo nenhum: sobre o canvas branco
 * do tema claro o texto simplesmente não existia. A correção não é escolher
 * outro branco — é o callout suave do trio de estado, que traz fundo, borda e
 * um texto medido sobre o próprio fundo.
 */
describe('Alert', () => {
    it('renders the destructive variant as the soft state callout', () => {
        render(
            <Alert variant="destructive">
                <AlertTitle>Falha ao salvar</AlertTitle>
                <AlertDescription>Tente novamente.</AlertDescription>
            </Alert>,
        );

        const alerta = screen.getByRole('alert');

        expect(alerta).toHaveClass('state-destructive-soft');
        expect(alerta.className).not.toContain('text-destructive-foreground');
    });

    it('keeps the default variant on the canvas pair', () => {
        render(<Alert>Tudo certo.</Alert>);

        expect(screen.getByRole('alert')).toHaveClass('bg-background', 'text-foreground');
    });
});
