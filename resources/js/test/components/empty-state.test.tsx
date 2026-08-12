import { EmptyState } from '@/components/empty-state';
import { render, screen } from '@testing-library/react';
import { UserX } from 'lucide-react';
import { describe, expect, it } from 'vitest';

/*
 * Dois defeitos moravam aqui.
 *
 * 1. O ramo `type="row"` montava `Table.Row`/`Table.Cell` PRÓPRIOS, e o único
 *    call-site já embrulhava o componente numa célula — o DOM recebia `<tr>`
 *    dentro de `<div>` dentro de `<td>`. Quem posiciona a célula é a tabela.
 * 2. O vazio não tinha saída: a tela dizia "Limpe os filtros" sem oferecer o
 *    botão de limpar, e "atribua o cargo pela tela de usuários" sem link.
 */
describe('EmptyState', () => {
    it('announces the title as a heading', () => {
        render(<EmptyState title="Nenhum usuário cadastrado ainda" />);

        expect(screen.getByRole('heading', { name: 'Nenhum usuário cadastrado ainda' })).toBeInTheDocument();
    });

    it('renders the description when given', () => {
        render(<EmptyState title="Vazio" description="Cadastre a primeira pessoa." />);

        expect(screen.getByText('Cadastre a primeira pessoa.')).toBeInTheDocument();
    });

    it('renders the action so the empty state is not a dead end', () => {
        render(<EmptyState title="Vazio" action={<button type="button">Limpar filtros</button>} />);

        expect(screen.getByRole('button', { name: 'Limpar filtros' })).toBeInTheDocument();
    });

    it('works without an action', () => {
        render(<EmptyState title="Vazio" />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('hides the decorative icon from assistive tech', () => {
        const { container } = render(<EmptyState title="Vazio" icon={UserX} />);

        expect(container.querySelector('[aria-hidden="true"] svg')).not.toBeNull();
    });

    it('never emits table markup of its own', () => {
        /*
         * A regressão que este teste existe para pegar: um `<tr>` ou `<td>`
         * saindo daqui só é válido se a tabela inteira vier junto, e o
         * componente é usado DENTRO de uma célula que o call-site já abriu.
         */
        const { container } = render(<EmptyState title="Vazio" description="Sem nada" />);

        expect(container.querySelector('tr')).toBeNull();
        expect(container.querySelector('td')).toBeNull();
        expect(container.querySelector('table')).toBeNull();
    });

    it('carries the slot marker for the call sites', () => {
        render(<EmptyState title="Vazio" />);

        expect(screen.getByTestId('empty-state')).toHaveAttribute('data-slot', 'empty-state');
    });
});
