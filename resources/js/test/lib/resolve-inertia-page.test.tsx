import { resolveInertiaPage } from '@/lib/resolve-inertia-page';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const resolvePageComponentMock = vi.fn();

vi.mock('laravel-vite-plugin/inertia-helpers', () => ({
    resolvePageComponent: (...args: unknown[]) => resolvePageComponentMock(...args),
}));

describe('resolveInertiaPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.sessionStorage.clear();
    });

    it('returns the resolved page module when the bundle knows the page', async () => {
        const pageModule = { default: () => <div>Dashboard real</div> };

        resolvePageComponentMock.mockResolvedValue(pageModule);

        const resolved = await resolveInertiaPage('dashboard', {
            './pages/dashboard.tsx': vi.fn(),
        });

        expect(resolvePageComponentMock).toHaveBeenCalledWith('./pages/dashboard.tsx', {
            './pages/dashboard.tsx': expect.any(Function),
        });
        expect(resolved).toBe(pageModule);
    });

    it('reloads once and falls back to an update screen when the current bundle is stale', async () => {
        const reload = vi.fn();

        resolvePageComponentMock.mockRejectedValue(new Error('Page not found: ./pages/dashboard.tsx'));

        const resolved = await resolveInertiaPage('dashboard', {}, { reload, storage: window.sessionStorage });

        expect(reload).toHaveBeenCalledTimes(1);

        const Fallback = resolved.default;

        render(<Fallback />);

        expect(screen.getByRole('heading', { name: 'Atualização necessária' })).toBeInTheDocument();
        expect(screen.getByText('Página solicitada: dashboard')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Atualizar agora' }));

        expect(reload).toHaveBeenCalledTimes(2);
    });

    it('does not reload a second time for the same missing page', async () => {
        const reload = vi.fn();

        resolvePageComponentMock.mockRejectedValue(new Error('Page not found: ./pages/dashboard.tsx'));

        await resolveInertiaPage('dashboard', {}, { reload, storage: window.sessionStorage });
        await resolveInertiaPage('dashboard', {}, { reload, storage: window.sessionStorage });

        expect(reload).toHaveBeenCalledTimes(1);
    });

    it('clears the recovery flag once the page resolves again', async () => {
        const reload = vi.fn();

        resolvePageComponentMock.mockRejectedValueOnce(new Error('Page not found: ./pages/dashboard.tsx'));
        await resolveInertiaPage('dashboard', {}, { reload, storage: window.sessionStorage });

        resolvePageComponentMock.mockResolvedValue({ default: () => <div /> });
        await resolveInertiaPage('dashboard', {}, { reload, storage: window.sessionStorage });

        expect(window.sessionStorage.getItem('app:page-recovery:./pages/dashboard.tsx')).toBeNull();
    });

    it('rethrows unrelated resolution errors', async () => {
        const chunkError = new Error('Chunk load failed');

        resolvePageComponentMock.mockRejectedValue(chunkError);

        await expect(resolveInertiaPage('dashboard', {}, { reload: vi.fn(), storage: window.sessionStorage })).rejects.toBe(chunkError);
    });
});
