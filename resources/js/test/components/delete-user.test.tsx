import DeleteUser from '@/components/delete-user';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const ERRO = 'A senha informada está incorreta.';

/*
 * O `useForm` do Inertia vive FORA do `<Dialog>` e por isso não desmonta
 * quando o diálogo fecha — é o que torna o erro persistente. O mock reproduz
 * exatamente essa topologia: estado no componente, não no conteúdo do
 * diálogo.
 */
vi.mock('@inertiajs/react', async () => {
    const React = await import('react');

    return {
        useForm: () => {
            const [data, setData] = React.useState({ password: '' });
            const [errors, setErrors] = React.useState<Record<string, string>>({});

            return {
                data,
                setData: (key: string, value: string) => setData((atual) => ({ ...atual, [key]: value })),
                delete: (_url: string, opts?: { onError?: () => void; onFinish?: () => void }) => {
                    setErrors({ password: ERRO });
                    opts?.onError?.();
                    opts?.onFinish?.();
                },
                processing: false,
                reset: () => setData({ password: '' }),
                errors,
                clearErrors: () => setErrors({}),
            };
        },
    };
});

async function abrirEErrarASenha(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Excluir Conta' }));
    await user.type(screen.getByPlaceholderText('Senha'), 'errada');
    await user.click(screen.getByRole('button', { name: /Excluir Conta$/ }));
}

describe('DeleteUser', () => {
    it('shows the password error after a failed attempt', async () => {
        const user = userEvent.setup();
        render(<DeleteUser />);

        await abrirEErrarASenha(user);

        expect(screen.getByText(ERRO)).toBeInTheDocument();
    });

    it('clears the error when the dialog is closed with Escape', async () => {
        /*
         * O defeito: o `clearErrors` estava pendurado só no botão Cancelar, e o
         * Escape fecha por fora dele. Reabrir mostrava "senha incorreta" sobre
         * um campo vazio — numa tela de exclusão permanente de conta.
         */
        const user = userEvent.setup();
        render(<DeleteUser />);

        await abrirEErrarASenha(user);
        await user.keyboard('{Escape}');
        await user.click(screen.getByRole('button', { name: 'Excluir Conta' }));

        expect(screen.queryByText(ERRO)).not.toBeInTheDocument();
    });

    it('clears the error when the dialog is closed with the X', async () => {
        // O X é sempre renderizado pelo `DialogContent` e também não passava
        // pela limpeza.
        const user = userEvent.setup();
        render(<DeleteUser />);

        await abrirEErrarASenha(user);
        await user.click(screen.getByRole('button', { name: 'Fechar' }));
        await user.click(screen.getByRole('button', { name: 'Excluir Conta' }));

        expect(screen.queryByText(ERRO)).not.toBeInTheDocument();
    });

    it('clears the error when the dialog is closed with Cancelar', async () => {
        // O caminho que já funcionava — fica travado para que a limpeza não
        // migre de volta para o botão e deixe os outros dois de fora.
        const user = userEvent.setup();
        render(<DeleteUser />);

        await abrirEErrarASenha(user);
        await user.click(screen.getByRole('button', { name: 'Cancelar' }));
        await user.click(screen.getByRole('button', { name: 'Excluir Conta' }));

        expect(screen.queryByText(ERRO)).not.toBeInTheDocument();
    });

    it('empties the password field when reopened', async () => {
        const user = userEvent.setup();
        render(<DeleteUser />);

        await abrirEErrarASenha(user);
        await user.keyboard('{Escape}');
        await user.click(screen.getByRole('button', { name: 'Excluir Conta' }));

        expect(screen.getByPlaceholderText('Senha')).toHaveValue('');
    });
});
