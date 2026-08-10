import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

type ViteEnvironment = Record<string, string>;

/**
 * `new URL()` sem lançar: valores sem scheme (ex.: APP_URL=myapp.test, comum em
 * .env legado) ou malformados retornam null em vez de derrubar o config inteiro.
 */
function tryParseUrl(value: string): URL | null {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

/**
 * Deriva o host para o `detectTls` do plugin Laravel a partir do APP_URL.
 * Só entra em jogo quando o app roda sob HTTPS local (Herd/Valet).
 */
export function resolveDetectTlsHost(env: ViteEnvironment): string | undefined {
    const appUrl = env.APP_URL?.trim();

    if (!appUrl) {
        return undefined;
    }

    const resolvedUrl = tryParseUrl(appUrl);

    if (!resolvedUrl || resolvedUrl.protocol !== 'https:') {
        return undefined;
    }

    return resolvedUrl.hostname;
}

/**
 * Configuração de dev server/HMR derivada de VITE_DEV_SERVER_URL.
 * Sem a variável (o caso comum), o Vite decide sozinho — nada é forçado.
 */
export function resolveDevServerConfig(command: string, env: ViteEnvironment) {
    if (command !== 'serve') {
        return undefined;
    }

    const viteDevServerUrl = env.VITE_DEV_SERVER_URL?.trim();

    if (!viteDevServerUrl) {
        return undefined;
    }

    const resolvedUrl = tryParseUrl(viteDevServerUrl);

    if (!resolvedUrl) {
        return undefined;
    }

    const port = resolvedUrl.port ? Number(resolvedUrl.port) : 5173;

    return {
        host: true,
        port,
        strictPort: true,
        hmr: {
            host: resolvedUrl.hostname,
            protocol: resolvedUrl.protocol === 'https:' ? 'wss' : 'ws',
            port,
            clientPort: port,
        },
    };
}

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const detectTlsHost = process.env.CI ? undefined : resolveDetectTlsHost(env);

    return {
        plugins: [
            // Sob Vitest o plugin Laravel só atrapalha (procura manifest/hot file).
            ...(process.env.VITEST
                ? []
                : laravel({
                      input: ['resources/css/app.css', 'resources/js/app.tsx'],
                      ssr: 'resources/js/ssr.tsx',
                      refresh: true,
                      detectTls: detectTlsHost,
                  })),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic' as const,
        },
        build: {
            // Medir gzip de cada chunk só deixa o build de CI mais lento.
            reportCompressedSize: !process.env.CI,
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'resources/js'),
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            },
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./resources/js/test/setup.ts'],
            css: true,
            // Os testes do front vivem em resources/js. Sem esta restrição o
            // Vitest ainda varre `vendor/` e tenta rodar specs de pacotes PHP.
            include: ['resources/js/**/*.{test,spec}.{ts,tsx}'],
        },
        server: resolveDevServerConfig(command, env),
    };
});
