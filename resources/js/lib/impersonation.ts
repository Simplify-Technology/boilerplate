import { router } from '@inertiajs/react';

/**
 * Troca de identidade — o único caminho para iniciar e encerrar impersonation.
 *
 * Existe para que seja impossível trocar de identidade sem invalidar o cache de
 * prefetch. O painel tem 5 superfícies com `<Link prefetch>` (nav-main,
 * app-sidebar, user-menu-content, settings-sidebar e o layout de settings), e o
 * Inertia guarda essas respostas por URL, sem qualquer noção de quem estava
 * autenticado quando foram buscadas. Eram 6 até a poda do `app-header`, que
 * era código morto.
 *
 * O default do framework NÃO cobre este caso. Depois de uma visita bem-sucedida
 * o core (@inertiajs/core 3.6.1) só invalida a URL de destino e as tags que a
 * visita declarou — nada mais. E os dois controllers de impersonation devolvem
 * `RedirectResponse` puro (302), não `Inertia::location()`, então a SPA não
 * reinicia: o cache atravessa a troca inteiro.
 *
 * Sem o flush, um prefetch de `/settings/profile` feito com o admin logado
 * continua no cache e é servido no clique seguinte — mostrando nome e e-mail do
 * admin enquanto se personifica outro usuário.
 *
 * Por que `flushAll()` e não `cacheTags`/`invalidateCacheTags`, que são a forma
 * idiomática na v3: modo de falha. Invalidação por tag falha ABERTO — basta
 * esquecer a tag em um dos `<Link prefetch>`, ou no próximo que alguém
 * acrescentar, e dado de outra identidade volta a ser servido em silêncio.
 * `flushAll()` falha FECHADO: o pior caso é refazer alguns prefetches, num
 * momento raro. Trocar de identidade invalida semanticamente toda página
 * cacheada, então jogar tudo fora é a operação certa, não um exagero.
 *
 * A ordem (flush antes da visita) é por simplicidade, não por corrida: o cache
 * só é consultado quando uma nova visita é iniciada, e o 302 é seguido na
 * camada HTTP sem passar por ali.
 */

type StartOptions = Parameters<typeof router.post>[2];
type StopOptions = Parameters<typeof router.delete>[1];

export function startImpersonation(userId: number | string, options: StartOptions = {}): void {
    router.flushAll();
    router.post(route('users.impersonate', userId), {}, options);
}

export function stopImpersonation(options: StopOptions = {}): void {
    router.flushAll();
    router.delete(route('users.impersonate.stop'), options);
}
