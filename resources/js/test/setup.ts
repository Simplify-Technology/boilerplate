import '@testing-library/jest-dom/vitest';
import './vitest.d.ts';

// Mock do helper `route` (Ziggy) para testes
global.route = (name: string, params?: Record<string, string>) => {
    return `/${name}${params ? '?' + new URLSearchParams(params).toString() : ''}`;
};
// (a assinatura permissiva fica em vitest.d.ts; o mock aceita o que os testes passam)

if (typeof window !== 'undefined') {
    // Mock do window.matchMedia para testes
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });

    // Mock do localStorage
    const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    };

    Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
    });
}

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
