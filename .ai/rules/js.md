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
