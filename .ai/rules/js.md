---
paths:
  - 'resources/js/**'
---

# Js

## Organização e naming do frontend
Páginas em pages/<domínio>/<ação>.tsx com export default; componentes de domínio em components/<domínio>/, primitivos shadcn em components/ui/, hooks em hooks/<domínio>/use-*.ts, infra em lib/, helpers de domínio em utils/<domínio>/, tipos em types/<domínio>.ts. Nomeie todo arquivo novo em kebab-case.

## Autorização no frontend: usePermissions e PermissionsGuard
Cheque autorização no frontend com usePermissions() (hasPermission/hasRole sobre os nomes compartilhados em auth) ou com hooks de domínio use-<domínio>-permissions que expõem callbacks canX(); itens de navegação declaram permission/role e são filtrados em nav-main. Não leia auth.user.role diretamente em componentes.

## Feedback pós-ação: useFlashMessages, nunca toast manual
Cada página Inertia chama useFlashMessages() no topo do componente — o hook exibe as flash keys success|error|warning|info via react-hot-toast com as opções de lib/toast-config. Não dispare toasts manualmente para respostas do servidor.

## Tabelas com Table de @radix-ui/themes, não shadcn
Construa tabelas de listagem (e Box/Flex/Tabs dessas telas) com @radix-ui/themes — o app já é envolvido em <Theme>; não use o components/ui/table.tsx do shadcn, que existe mas não é adotado.

## Textos de UI em português hardcoded
O frontend é monolíngue pt_BR: escreva textos de UI (páginas React, labels, mensagens) diretamente em português, sem biblioteca de i18n nem chaves JSON.
