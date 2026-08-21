import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

function StateProbe() {
    const { state } = useSidebar();

    return <span data-testid="sidebar-state">{state}</span>;
}

function renderShell() {
    return render(
        <SidebarProvider defaultOpen>
            <SidebarTrigger />
            <StateProbe />
            <input aria-label="Buscar" />
            <textarea aria-label="Observações" />
            <div contentEditable aria-label="Editor" data-testid="editor" />
        </SidebarProvider>,
    );
}

const state = () => screen.getByTestId('sidebar-state').textContent;

describe('atalho Cmd/Ctrl+B da sidebar', () => {
    it('alterna a sidebar quando o foco não está num campo', () => {
        renderShell();

        expect(state()).toBe('expanded');

        fireEvent.keyDown(window, { key: 'b', ctrlKey: true });

        expect(state()).toBe('collapsed');
    });

    /*
     * O caso que originou a fatia: no macOS, Ctrl+B é o binding do sistema para
     * mover o cursor um caractere à esquerda dentro de um campo. O handler
     * global fazia `preventDefault()` sem olhar o alvo, então digitar Ctrl+B na
     * busca fechava o menu em vez de mover o cursor.
     */
    it.each([
        ['input', 'Buscar'],
        ['textarea', 'Observações'],
    ])('ignora o atalho quando o foco está num <%s>', (_tag, label) => {
        renderShell();

        const field = screen.getByLabelText(label);
        field.focus();

        const handled = fireEvent.keyDown(field, { key: 'b', ctrlKey: true });

        expect(state()).toBe('expanded');
        expect(handled).toBe(true); // nada foi cancelado: a tecla segue para o campo
    });

    it('ignora o atalho dentro de um nó contenteditable', () => {
        renderShell();

        const editor = screen.getByTestId('editor');
        fireEvent.keyDown(editor, { key: 'b', metaKey: true });

        expect(state()).toBe('expanded');
    });

    it('ignora o atalho num campo também com a tecla ⌘', () => {
        renderShell();

        fireEvent.keyDown(screen.getByLabelText('Buscar'), { key: 'b', metaKey: true });

        expect(state()).toBe('expanded');
    });

    it('não confunde a tecla sem modificador com o atalho', () => {
        renderShell();

        fireEvent.keyDown(window, { key: 'b' });

        expect(state()).toBe('expanded');
    });
});

describe('SidebarTrigger', () => {
    it('declara as duas teclas do atalho para a tecnologia assistiva', () => {
        renderShell();

        expect(screen.getByRole('button', { name: 'Abrir ou fechar o menu lateral' })).toHaveAttribute('aria-keyshortcuts', 'Control+B Meta+B');
    });

    it('mostra o atalho na tooltip, que antes não existia em lugar nenhum', async () => {
        const user = userEvent.setup();
        renderShell();

        await user.hover(screen.getByRole('button', { name: 'Abrir ou fechar o menu lateral' }));

        await waitFor(() => {
            expect(screen.getAllByText(/Abrir ou fechar o menu lateral \((⌘B|Ctrl\+B)\)/).length).toBeGreaterThan(0);
        });
    });
});
