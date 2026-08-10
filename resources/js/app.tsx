import '../css/app.css';

import ToastProvider from '@/components/ui/toast-provider';
import { resolveInertiaPage } from '@/lib/resolve-inertia-page';
import { createInertiaApp } from '@inertiajs/react';
import { Theme } from '@radix-ui/themes';
import type { CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
const pages = import.meta.glob('./pages/**/*.tsx');

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolveInertiaPage(name, pages).then((module) => module.default),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <Theme
                    style={
                        {
                            fontFamily:
                                "'Aptos', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                            '--default-font-family':
                                "'Aptos', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
                        } as CSSProperties
                    }
                >
                    <ToastProvider />
                    <App {...props} />
                </Theme>
            </>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
