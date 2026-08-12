import type { ResolvedComponent } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

type PageModule = {
    default: ResolvedComponent;
};

type PageMap = Record<string, () => Promise<unknown>>;

type RecoveryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type ResolveInertiaPageOptions = {
    reload?: () => void;
    storage?: RecoveryStorage | null;
};

function recoveryKey(pagePath: string): string {
    return `app:page-recovery:${pagePath}`;
}

function defaultReload(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.location.reload();
}

function defaultStorage(): RecoveryStorage | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.sessionStorage;
}

function isMissingPageError(error: unknown, pagePath: string): error is Error {
    return error instanceof Error && error.message.includes(`Page not found: ${pagePath}`);
}

function createMissingPageFallback(name: string, reload: () => void): PageModule {
    function MissingPageFallback() {
        return (
            <main className="bg-background text-foreground flex min-h-svh items-center justify-center px-4 py-8 sm:px-6">
                <div className="bg-card text-card-foreground w-full max-w-xl rounded-xl border p-6 shadow-sm sm:p-8">
                    <div className="space-y-4">
                        <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.18em] uppercase">Compatibilidade de versão</p>
                        <h1 className="text-2xl font-semibold tracking-tight">Atualização necessária</h1>
                        <p className="text-muted-foreground text-sm leading-6">
                            Encontramos uma página nova do aplicativo, mas esta aba ainda está com uma versão anterior carregada.
                        </p>
                        <p className="text-sm leading-6 font-medium">Página solicitada: {name}</p>
                        <button
                            type="button"
                            onClick={reload}
                            className="bg-primary text-primary-foreground focus-visible:ring-ring hover:bg-primary/90 inline-flex min-h-9 w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] sm:w-auto"
                        >
                            Atualizar agora
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return {
        default: MissingPageFallback,
    };
}

/**
 * Resolve uma página Inertia detectando bundle "stale" pós-deploy.
 *
 * Depois de um deploy, uma aba aberta continua com o manifest antigo; ao
 * navegar para uma página que só existe no bundle novo, o resolver falha com
 * "Page not found". Aqui isso vira: um ÚNICO reload automático (a flag no
 * sessionStorage impede loop caso o reload não resolva) e, se ainda assim a
 * página não existir, um fallback amigável com botão de atualizar.
 */
export async function resolveInertiaPage(name: string, pages: PageMap, options: ResolveInertiaPageOptions = {}): Promise<PageModule> {
    const pagePath = `./pages/${name}.tsx`;
    const reload = options.reload ?? defaultReload;
    const storage = options.storage ?? defaultStorage();
    const key = recoveryKey(pagePath);

    try {
        const module = await resolvePageComponent(pagePath, pages);

        storage?.removeItem(key);

        return module as PageModule;
    } catch (error) {
        if (!isMissingPageError(error, pagePath)) {
            throw error;
        }

        if (storage?.getItem(key) !== '1') {
            storage?.setItem(key, '1');
            reload();
        }

        return createMissingPageFallback(name, reload);
    }
}
