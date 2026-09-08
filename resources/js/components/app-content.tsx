import { SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import * as React from 'react';

/*
 * O `<main>` do app é o `SidebarInset`, e só ele. O ramo `header` que vivia
 * aqui renderizava um `<main>` próprio — e era o default, então `<AppContent>`
 * sem prop caía num `<main>` que não era o alvo do skip-link. `{...props}`
 * precisa continuar chegando ao `<main>`: é por ele que `id="conteudo"` e
 * `tabIndex={-1}` do layout encontram o `href="#conteudo"`.
 *
 * `min-w-0` (harvest: ctvitrine ui/sidebar.tsx@53d7d9a): flex item tem
 * `min-width: auto`, então conteúdo de min-content largo empurraria o `<main>`
 * para fora do viewport em vez de rolar dentro do próprio container. As
 * tabelas do `@radix-ui/themes` já rolam sozinhas (`Table.Root` embrulha num
 * `ScrollArea`) — isto é defesa genérica, não conserto de sintoma visto. Vai
 * no call-site, e não em `ui/sidebar.tsx`, para o vendorizado continuar
 * rastreável ao upstream.
 */
export function AppContent({ className, ...props }: React.ComponentProps<'main'>) {
    return <SidebarInset className={cn('min-w-0', className)} {...props} />;
}
