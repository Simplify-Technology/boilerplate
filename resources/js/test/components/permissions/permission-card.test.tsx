import { PermissionCard } from '@/components/permissions/permission-card';
import type { PermissionOption } from '@/types/permissions';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const permission: PermissionOption = {
    name: 'manage_permissions',
    label: 'Gerenciar Permissões',
    description: 'Dar ou tirar um acesso avulso de uma pessoa, fora do cargo dela.',
};

describe('PermissionCard', () => {
    // O nome sozinho confunde "Gerenciar Permissões" com "Atribuir Cargos" —
    // a frase é o que decide a marcação.
    it('shows what the permission lets the person do', () => {
        render(<PermissionCard permission={permission} isChecked={false} onToggle={vi.fn()} />);

        expect(screen.getByText(permission.label)).toBeInTheDocument();
        expect(screen.getByText(permission.description)).toBeInTheDocument();
    });

    it('announces label and consequence together to screen readers', () => {
        render(<PermissionCard permission={permission} isChecked={false} onToggle={vi.fn()} />);

        expect(screen.getByRole('checkbox')).toHaveAccessibleName(`${permission.label}: ${permission.description}`);
    });

    it('reports the toggle by permission name', async () => {
        const onToggle = vi.fn();

        render(<PermissionCard permission={permission} isChecked={false} onToggle={onToggle} />);

        await userEvent.click(screen.getByRole('checkbox'));

        expect(onToggle).toHaveBeenCalledWith(permission.name, true);
    });
});
