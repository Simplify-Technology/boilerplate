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

## A saída da personificação é montada pelo layout, e é botão
Enquanto a personificação está ativa, tudo que a pessoa faz é atribuído à persona — a saída é o caminho de maior consequência do RBAC no front. Ela existe em UM lugar: `layouts/app/app-sidebar-layout.tsx` monta o `<ImpersonateBanner>`, e o banner é a única saída em código de app (`user-menu-content.tsx` tem só "Configurações" e "Sair"). Trocar o template em `layouts/app-layout.tsx` por outro que não monte o banner remove a saída; `resources/js/test/components/impersonation-exit.test.tsx` renderiza o `app-layout` com `auth.impersonating.active` e exige o controle, então a troca falha em vez de passar silenciosa. A saída é `<button type="button">`, nunca `<a href="#">` com `preventDefault`: sair da persona é ação e não destino — o link mentia o papel para o leitor de tela (ficava fora da lista de botões) e respondia a Enter mas não a Espaço. A mesma regra vale para qualquer "link" cujo href só existe para ser cancelado.

## Item de menu do Radix não cancela o próprio evento
`DropdownMenuItem` compõe o `onClick` que você passa com o `handleSelect` interno usando `composeEventHandlers(..., { checkForDefaultPrevented: true })`. Chamar `e.preventDefault()` no handler suprime o `handleSelect`, e o menu **não fecha** — foi o que deixava o dropdown aberto por cima da navegação em "Personificar", único item do menu a se comportar assim. Se precisar manter o menu aberto, use `onSelect` com `preventDefault` deliberado e documente o porquê; no `onClick` de um item que dispara navegação, não cancele nada.
