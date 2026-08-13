import { Button } from '@/components/ui/button';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('Button Component', () => {
    it('renders with default props', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toBeInTheDocument();
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('applies variant classes correctly', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-destructive');
    });

    it('applies size classes correctly', () => {
        render(<Button size="lg">Large Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('h-10');
    });

    it('can be disabled', () => {
        render(<Button disabled>Disabled Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('handles click events', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);

        const button = screen.getByRole('button');
        button.click();

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    /*
     * Antes disto o estado de envio era `disabled={processing}` e nada mais:
     * o botão ficava esmaecido na tela e MUDO para leitor de tela — sem
     * `aria-busy`, quem não enxerga não tem como saber se o clique pegou.
     */
    describe('estado de envio', () => {
        it('announces aria-busy and disables while loading', () => {
            render(<Button loading>Salvar</Button>);

            const button = screen.getByRole('button');

            expect(button).toHaveAttribute('aria-busy', 'true');
            expect(button).toBeDisabled();
        });

        it('renders the indicator hidden from assistive tech', () => {
            const { container } = render(<Button loading>Salvar</Button>);

            const icon = container.querySelector('[data-slot="button-loading-icon"]');

            expect(icon).toBeInTheDocument();
            expect(icon).toHaveAttribute('aria-hidden', 'true');
            expect(icon).toHaveClass('animate-spin');
        });

        it('keeps the original label when no loadingText is given', () => {
            render(<Button loading>Salvar</Button>);

            expect(screen.getByRole('button')).toHaveAccessibleName('Salvar');
        });

        it('swaps the label for loadingText while loading', () => {
            render(
                <Button loading loadingText="Salvando…">
                    Salvar
                </Button>,
            );

            expect(screen.getByRole('button')).toHaveAccessibleName('Salvando…');
            expect(screen.queryByText('Salvar')).not.toBeInTheDocument();
        });

        it('ignores loadingText when not loading', () => {
            render(<Button loadingText="Salvando…">Salvar</Button>);

            expect(screen.getByRole('button')).toHaveAccessibleName('Salvar');
        });

        it('leaves aria-busy off when idle, and off when merely disabled', () => {
            const { rerender } = render(<Button>Salvar</Button>);

            expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');

            /*
             * Ocupado e indisponível não são a mesma coisa: um botão
             * desabilitado por falta de permissão não está processando nada,
             * e anunciar `aria-busy` ali seria mentira.
             */
            rerender(<Button disabled>Salvar</Button>);

            const button = screen.getByRole('button');

            expect(button).not.toHaveAttribute('aria-busy');
            expect(button).toHaveAttribute('aria-disabled', 'true');
            expect(button.querySelector('[data-slot="button-loading-icon"]')).toBeNull();
        });
    });

    /*
     * A origem desta absorção (ctfinance `ui/button.tsx:60,82`) faz
     * `disabled={asChild ? undefined : isDisabled}` — sob `asChild` sobra só
     * `aria-disabled`, que ANUNCIA mas não IMPEDE. Copiar aquilo teria
     * devolvido o clique ao "Excluir Conta" durante o envio. Estes dois
     * travam a divergência.
     */
    describe('asChild', () => {
        it('still passes a real disabled attribute down to the child', () => {
            render(
                <Button asChild loading>
                    <button type="submit">Excluir</button>
                </Button>,
            );

            const button = screen.getByRole('button', { name: 'Excluir' });

            expect(button).toBeDisabled();
            expect(button).toHaveAttribute('type', 'submit');
            expect(button).toHaveAttribute('aria-busy', 'true');
        });

        it('does not inject the indicator, because the Slot clones a single child', () => {
            const { container } = render(
                <Button asChild loading>
                    <a href="/algum-lugar">Ir</a>
                </Button>,
            );

            expect(container.querySelector('[data-slot="button-loading-icon"]')).toBeNull();
            expect(screen.getByRole('link', { name: 'Ir' })).toBeInTheDocument();
        });
    });
});
