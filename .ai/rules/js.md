---
paths:
  - 'resources/js/**'
---

# Js

## Organização e naming do frontend
Páginas em pages/<domínio>/<ação>.tsx com export default; componentes de domínio em components/<domínio>/, primitivos shadcn em components/ui/, hooks em hooks/<domínio>/use-*.ts, infra em lib/, helpers de domínio em utils/<domínio>/, tipos em types/<domínio>.ts. Nomeie todo arquivo novo em kebab-case.

## Autorização no frontend: usePermissions e PermissionsGuard
Cheque autorização no frontend com usePermissions() (hasPermission/hasRole sobre os nomes compartilhados em auth) ou com hooks de domínio use-<domínio>-permissions que expõem callbacks canX(); itens de navegação declaram permission/role e são filtrados em nav-main. Não leia auth.user.role diretamente em componentes.

## Feedback pós-ação: um listener global, página nenhuma consome flash
O consumo de flash é global e nativo: `registerFlashListener()` (resources/js/lib/flash.ts) registra UM `router.on('flash')` no ponto de montagem em app.tsx, e ele exibe as chaves success|error|warning|info via react-hot-toast com as opções de lib/toast-config. Página nenhuma consome flash — não chame nada no componente, não leia `page.flash` na tela, não dispare toasts manualmente para respostas do servidor. A regra anterior mandava cada página chamar um hook e 8 das 17 esqueceram, deixando mudas as telas de auth e o dashboard; consumo opt-in por tela não volta. O flash nativo vive no OBJETO DE PÁGINA (irmão de component/props/url), então não é prop: nenhum filtro de partial reload o alcança e ele não persiste no history state. Se precisar tipar chaves novas, edite `FlashMessages` em resources/js/types — o `declare module '@inertiajs/core'` ao lado é o que faz `event.detail.flash` chegar tipado.

## Tabelas com Table de @radix-ui/themes, não shadcn
Construa tabelas de listagem (e Box/Flex/Tabs dessas telas) com @radix-ui/themes — o app já é envolvido em <Theme>; não use o components/ui/table.tsx do shadcn, que existe mas não é adotado.

## Troca de identidade invalida o cache de prefetch
Iniciar e encerrar impersonation passa por startImpersonation/stopImpersonation de lib/impersonation.ts, que chamam router.flushAll() antes da visita; não chame router.post/delete com as rotas users.impersonate direto, mesmo que pareça uma linha só. O cache de prefetch do Inertia guarda respostas por URL sem noção de quem estava autenticado, os controllers devolvem 302 (não Inertia::location()), e o default do framework só invalida a URL de destino — sem o flush, uma página prefetchada com o admin logado é servida durante a personificação. Use flushAll e não cacheTags/invalidateCacheTags para escopo de identidade: tag esquecida em um Link falha aberto e vaza em silêncio, enquanto flushAll no máximo refaz alguns prefetches. Dois testes em resources/js/test/lib/ travam o contrato, incluindo a proibição de nomear as rotas fora do módulo.

## Botão que navega é `<Button asChild><Link/></Button>`
`<button>` é conteúdo interativo e o HTML proíbe aninhá-lo dentro de `<a>`, então `<Link><Button/></Link>` está errado — e é o que sai naturalmente do dedo. O que ele produz: dois nós focáveis para uma ação só (o Tab para duas vezes), leitor de tela anunciando link **e** botão, e — dentro de `TooltipTrigger asChild` — o clone pousando no `<a>` em vez do `<Button>` que carrega o `aria-label`. A forma certa inverte o aninhamento e deixa o Slot do Radix fundir as props do botão no link: um `<a>` só, com aparência de botão. `className` e `aria-label` ficam no `<Button>`. O inverso sem `asChild` (`<Button><Link/></Button>`) é o mesmo erro pelo outro lado. `resources/js/test/components/link-button-nesting.test.ts` trava os dois.

## Textos de UI em português hardcoded
O frontend é monolíngue pt_BR: escreva textos de UI (páginas React, labels, mensagens) diretamente em português, sem biblioteca de i18n nem chaves JSON.

## Erro de campo é anunciado por role="alert", nunca por aria-live
Mensagem de erro de formulário só existe DEPOIS da falha, e `aria-live` num nó recém-montado não anuncia — a região precisa preexistir à mudança. Use `InputError` (que já traz `role="alert"`, `data-slot="input-error"` e guarda de string em branco) e não reescreva o `<p>` na tela. Não troque o `role="alert"` por `aria-live` "para ficar menos intrusivo": isso devolve o silêncio. Região polite persistente de nível de formulário é uma evolução separada — ela precisa preexistir de verdade, com slot sempre renderizado, e tem consequências de layout (o gap do `flex-col`) e de `aria-describedby` a decidir antes.

## Wrapper de primitivo FUNDE o ARIA que vem em props, não redeclara
Componente que faz `{...props}` e depois escreve `aria-*` próprio sempre ganha do que veio de fora — foi assim que o `DateInput` apagava o `aria-invalid` que o `FormField` injeta por `cloneElement`. Mover a declaração para antes do spread NÃO resolve e cria o bug espelhado: o `cloneElement` grava `'aria-invalid': undefined` como chave própria quando não há erro, e esse `undefined` apaga o valor do wrapper. A única forma correta é a fusão, com o de fora tendo precedência e o próprio como fallback: `aria-invalid={props['aria-invalid'] ?? invalid ?? undefined}`. Vale para todo `aria-*` e para `role` em wrapper de primitivo.

## Vazio-por-filtro e vazio-inicial são estados diferentes, com saídas diferentes
Listagem vazia porque o filtro não casou nada pede "limpar filtros"; listagem vazia porque não há registro nenhum pede o CTA de criar o primeiro. Use `EmptyState` com a prop `action` e escolha a saída pela condição — não basta trocar o TEXTO e deixar a pessoa sem caminho, que era o caso de `pages/users/index.tsx` ("Limpe os filtros ou tente outro termo" sem botão de limpar, com o `clearFilters` do `use-user-filters` já disponível na mesma tela). Todo estado vazio de listagem sai com uma ação.

## EmptyState não emite linha de tabela
`EmptyState` renderiza só o conteúdo; quem abre `<Table.Row>`/`<Table.Cell>` é o call-site. O componente já teve um ramo `type="row"` que montava a linha por dentro enquanto o call-site também montava — e o DOM recebia `<tr>` dentro de `<div>` dentro de `<td>`. Ao usar em tabela, abra a célula na tabela e ponha o `EmptyState` dentro dela, sem embrulho extra.

## Diálogo é controlado, e fechar tem um funil só
`<Dialog>` recebe `open` e `onOpenChange`, e toda limpeza (resetar formulário, `clearErrors`, zerar seleção) mora DENTRO do `onOpenChange` — nunca pendurada no `onClick` do botão Cancelar. O X do `DialogContent`, o Escape e o clique no overlay fecham por fora de qualquer handler de botão; se o estado do formulário vive fora do `<Dialog>` (o caso do `useForm`), ele não desmonta e o erro da tentativa anterior reaparece na próxima abertura. O padrão é o do `ui/confirm-dialog.tsx`: `onOpenChange={(next) => { if (!next) limpar(); }}`. Fechamento programático (ex.: `onSuccess`) chama o MESMO funil, porque `onOpenChange` não dispara sozinho quando o estado muda por código.

## Navegação: landmark nomeado, `aria-current` no item atual, skip-link no layout
A sidebar de `app-sidebar.tsx` declara o landmark no `SidebarContent` (`role="navigation"` + `aria-label`), não no `<Sidebar>` inteiro — o rodapé é menu de conta, não navegação — e nunca dentro de `ui/sidebar.tsx`, que é código shadcn e tem de continuar rastreável ao upstream: atributo de landmark entra por prop do call-site. O item ativo de `nav-main.tsx` carrega `aria-current="page"`; `isActive` decide só a cor, e quem não enxerga a tela depende do atributo. Quando o item NÃO é o atual, o atributo fica ausente — `aria-current="false"` é ruído que alguns leitores anunciam mesmo assim, então o ternário termina em `undefined`, não em `"false"`. O skip-link mora em `layouts/app/app-sidebar-layout.tsx`, antes do `<AppSidebar/>` para ser o primeiro focável, e aponta para o `id` que o mesmo arquivo passa ao `<AppContent variant="sidebar">` — que repassa para o `<main>` do `SidebarInset`. O alvo precisa de `tabIndex={-1}`: `<main>` não é focável por padrão e sem isso o browser rola a página mas deixa o foco no link. `resources/js/test/components/navigation-landmarks.test.tsx` trava os três.

## Região viva mora no componente que sabe o estado, e anuncia o desfecho
A região `aria-live` de uma busca pertence ao `SearchBar` (que já é dono de `isSearching`), não à página — na página, cada listagem nova repete o bloco por copy-paste, que é como o ctfinance acabou com o mesmo trecho em 11 telas. Ela é renderizada **sempre**, mesmo vazia: `aria-live` num nó recém-montado não anuncia nada, é a mudança de conteúdo de uma região preexistente que dispara o anúncio (mesma razão pela qual erro de campo usa `role="alert"` e não `aria-live`). E o anúncio cobre o **desfecho**, não só o começo: "Buscando…" seguido de silêncio deixa a pessoa sem saber se veio resultado. A contagem entra por `resultCount`, que vem das props da página porque o hook de filtros não a tem.

## Papel interativo só em elemento que o teclado alcança
`role="button"` num `<div>` sem `tabIndex` e sem handler de teclado anuncia um widget que não existe (WCAG 4.1.2) — era o caso do slot da lupa no `SearchBar`. A correção nem sempre é promover a `<button>`: quando o controle só duplica algo que já está ao lado e já é focável (ali, focar o próprio campo de busca), um botão de verdade vira parada de tabulação que não leva a lugar nenhum. Nesse caso o certo é remover o papel falso e marcar o slot `aria-hidden="true"`, preservando o clique de mouse como afordância. Promova a `<button>` só quando a ação não existir em outro lugar alcançável.

## Severidade de toast é `ariaProps`, e não é igual para todos
`react-hot-toast` aplica `ariaProps: { role: "status", "aria-live": "polite" }` a todo toast. `lib/toast-config.ts` sobrescreve para `{ role: "alert", "aria-live": "assertive" }` **só** em erro e aviso: falha que a pessoa não ouve a tempo a deixa seguindo em frente com a tela em estado que ela acredita ter mudado. Sucesso e info ficam `polite` de propósito — assertive em tudo treina a pessoa a ignorar o canal inteiro. Não compense a falta de urgência aumentando `duration`: o `ui/toast-provider.tsx` não tem botão de dispensa, então toast longo (e `Infinity` em especial) fica preso na tela.
