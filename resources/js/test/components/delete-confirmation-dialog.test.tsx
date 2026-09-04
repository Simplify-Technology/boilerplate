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

    /**
     * `description: string` obrigatória não impede `''` — TypeScript aceita
     * string vazia, e um render condicional (`{description && <...>}`) some com
     * o nó nesse caso, deixando o `aria-describedby` do Radix apontando para um
     * id inexistente. Este é o único caso em que a diferença entre render
     * condicional e incondicional é observável, então é ele que trava a metade
     * que o tipo não cobre.
     */
    it('mantém o nó de descrição no DOM mesmo com descrição vazia', () => {
        render(<DeleteConfirmationDialog {...baseProps} description="" />);

        const dialog = screen.getByRole('alertdialog');
        const describedBy = dialog.getAttribute('aria-describedby');

        expect(describedBy).toBeTruthy();
        expect(document.getElementById(describedBy!)).toBeInTheDocument();
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

/*
 * A severidade é o único dado que o diálogo tem para escolher cor, e o mapa
 * severidade → token é o contrato desta metade visual: `danger` veste o
 * `destructive` do trio, `warning` veste o `warning`, nunca um literal da
 * paleta. O que estes testes travam é o PAPEL de cada token no call site
 * (callout suave = `state-X-soft`, chip = `bg-state-X` + `text-state-X`,
 * botão sólido = `bg-X text-X-foreground`); o contraste de cada par vive em
 * `test/styles/theme-tokens.test.ts`.
 */
describe('DeleteConfirmationDialog — cor de estado vem do token do papel', () => {
    const chip = () => screen.getByRole('alertdialog').querySelector('[data-slot="delete-dialog-icon"]');
    const note = () => screen.getByRole('alertdialog').querySelector('[data-slot="delete-dialog-note"]');
    const warningBox = (message: string) => screen.getByText(message).closest('[data-slot="delete-dialog-warning"]');

    it('a variante destrutiva veste o chip do título com o trio destructive', () => {
        render(<DeleteConfirmationDialog {...baseProps} />);

        expect(chip()).toHaveClass('bg-state-destructive');
        expect(chip()!.querySelector('svg')).toHaveClass('text-state-destructive');
        expect(chip()).not.toHaveClass('bg-state-warning');
    });

    it('a variante de aviso veste o chip do título com o trio warning, não com o destructive', () => {
        render(<DeleteConfirmationDialog {...baseProps} variant="warning" />);

        expect(chip()).toHaveClass('bg-state-warning');
        expect(chip()!.querySelector('svg')).toHaveClass('text-state-warning');
        expect(chip()).not.toHaveClass('bg-state-destructive');
        expect(chip()!.querySelector('svg')).not.toHaveClass('text-state-destructive');
    });

    it('cada aviso é um callout suave do próprio estado, e o ícone herda a cor do callout', () => {
        render(
            <DeleteConfirmationDialog
                {...baseProps}
                warnings={[
                    { message: 'A auditoria permanece.', severity: 'danger' },
                    { message: 'Prefira desativar a conta.', severity: 'warning' },
                ]}
            />,
        );

        const perigo = warningBox('A auditoria permanece.');
        const aviso = warningBox('Prefira desativar a conta.');

        expect(perigo).toHaveClass('state-destructive-soft');
        expect(perigo).not.toHaveClass('state-warning-soft');
        expect(aviso).toHaveClass('state-warning-soft');
        expect(aviso).not.toHaveClass('state-destructive-soft');

        // `currentColor` do lucide: ícone sem classe de cor própria pega a do callout.
        for (const box of [perigo, aviso]) {
            const classesDoIcone = [...box!.querySelector('svg')!.classList];

            expect(classesDoIcone.some((c) => /(^|:)text-/.test(c))).toBe(false);
        }
    });

    it('o quadro "Atenção" da variante de aviso é um callout warning; o da destrutiva fica neutro', () => {
        const { unmount } = render(<DeleteConfirmationDialog {...baseProps} variant="warning" />);

        expect(note()).toHaveClass('state-warning-soft');

        unmount();
        render(<DeleteConfirmationDialog {...baseProps} />);

        expect(note()).not.toHaveClass('state-warning-soft');
        expect(note()).not.toHaveClass('state-destructive-soft');
    });

    it('o botão de confirmar da variante de aviso é o sólido warning com o rótulo do par, nunca text-white', () => {
        render(<DeleteConfirmationDialog {...baseProps} variant="warning" confirmText="Remover Cargo" />);

        const botao = screen.getByRole('button', { name: 'Remover Cargo' });

        expect(botao).toHaveClass('bg-warning', 'text-warning-foreground');
        expect(botao).not.toHaveClass('text-white');
        expect(botao).not.toHaveClass('bg-destructive');
    });

    it('o botão de confirmar da variante destrutiva segue sendo o destructive do primitivo', () => {
        render(<DeleteConfirmationDialog {...baseProps} />);

        const botao = screen.getByRole('button', { name: 'Excluir' });

        expect(botao).toHaveClass('bg-destructive', 'text-destructive-foreground');
        expect(botao).not.toHaveClass('bg-warning');
    });

    it('o chip do item a ser excluído é informativo: trio info nos dois temas', () => {
        render(<DeleteConfirmationDialog {...baseProps} itemName="Ana Souza" itemType="Usuário" />);

        const item = screen.getByRole('alertdialog').querySelector('[data-slot="delete-dialog-item-icon"]');

        expect(item).toHaveClass('bg-state-info');
        expect(item!.querySelector('svg')).toHaveClass('text-state-info');
    });
});
