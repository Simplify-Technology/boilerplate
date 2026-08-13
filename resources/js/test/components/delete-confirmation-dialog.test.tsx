import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const baseProps = {
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Excluir Usuário',
    description: 'O cadastro é apagado de vez. Não existe lixeira nem como recuperar depois.',
};

/**
 * O `role="alertdialog"` da APG exige nome **e** descrição acessíveis. O tipo
 * declara `description` obrigatória, então o caso "sem descrição" não é
 * alcançável por call site tipado — o que estes testes travam é o render
 * incondicional, que é a metade que o TypeScript não cobre.
 */
describe('DeleteConfirmationDialog', () => {
    it('descreve o alertdialog com a descrição recebida', () => {
        render(<DeleteConfirmationDialog {...baseProps} />);

        const dialog = screen.getByRole('alertdialog');

        expect(dialog).toHaveAccessibleName('Excluir Usuário');
        expect(dialog).toHaveAccessibleDescription(baseProps.description);
    });

    it('mantém a descrição ligada ao diálogo na variante de aviso', () => {
        render(<DeleteConfirmationDialog {...baseProps} variant="warning" description="Ao remover o cargo, o acesso muda." />);

        expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription('Ao remover o cargo, o acesso muda.');
    });

    it('usa a nota de consequência padrão da variante destrutiva', () => {
        render(<DeleteConfirmationDialog {...baseProps} />);

        expect(screen.getByText(/Esta ação não pode ser desfeita/)).toBeInTheDocument();
    });

    it('usa a nota de consequência padrão da variante de aviso', () => {
        render(<DeleteConfirmationDialog {...baseProps} variant="warning" />);

        expect(screen.getByText(/Esta ação afetará o acesso do usuário ao sistema/)).toBeInTheDocument();
    });

    it('deixa a nota de consequência ser sobrescrita pelo call site', () => {
        render(<DeleteConfirmationDialog {...baseProps} confirmationNote="A assinatura segue ativa até o fim do ciclo já pago." />);

        expect(screen.getByText('A assinatura segue ativa até o fim do ciclo já pago.')).toBeInTheDocument();
        expect(screen.queryByText(/Esta ação não pode ser desfeita/)).not.toBeInTheDocument();
    });

    it('sobrescreve a nota da variante de aviso também', () => {
        render(<DeleteConfirmationDialog {...baseProps} variant="warning" confirmationNote="O histórico de atendimentos permanece." />);

        expect(screen.getByText('O histórico de atendimentos permanece.')).toBeInTheDocument();
        expect(screen.queryByText(/Esta ação afetará o acesso/)).not.toBeInTheDocument();
    });

    it('mantém o rótulo "Atenção:" quando a nota é sobrescrita', () => {
        render(<DeleteConfirmationDialog {...baseProps} confirmationNote="Nota própria." />);

        expect(screen.getByText('Atenção:')).toBeInTheDocument();
    });

    it('aceita nota em ReactNode, não só string', () => {
        render(<DeleteConfirmationDialog {...baseProps} confirmationNote={<strong>Cobrança encerrada na hora.</strong>} />);

        const nota = screen.getByText('Cobrança encerrada na hora.');

        expect(nota.tagName).toBe('STRONG');
    });

    it('não renderiza nada quando fechado', () => {
        render(<DeleteConfirmationDialog {...baseProps} open={false} />);

        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
});
