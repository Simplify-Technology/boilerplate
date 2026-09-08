---
paths:
    - 'package.json'
    - 'composer.json'
---

# Dependências

## Dependência de runtime tem importador, e a medição é quote-agnóstica

`package.json` só declara em `dependencies` o que algo em `resources/` importa (`from`/`import` em `resources/js`, `@import`/`@plugin`/`@source` em `resources/css`) — ou tooling que o starter kit da Laravel põe ali de propósito (vite, plugins, `globals`, `concurrently`, `@types/*`), cujo consumidor é `vite.config.ts`, `eslint.config.js`, `tsconfig.json` ou um script do `composer.json`. Pacote sem consumidor nenhum é peso no install, superfície de supply-chain e ruído no dependabot, e nenhum gate o denuncia (o bundler reclama do que falta, nunca do que sobra): `@radix-ui/react-navigation-menu` sobreviveu à poda do header e `@headlessui/react` atravessou o starter inteiro sem um import. Ao medir, procure com qualquer aspa — os primitivos do shadcn importam com aspas duplas, e a receita `grep "from '<pacote>'"` acusa 13 pacotes vivos como mortos. Remover pacote muda o `pnpm-lock.yaml`: vai na fatia de deps (nunca junto com tema), e com PR do dependabot aberta sobre o mesmo lockfile espera o merge. `resources/js/test/lib/dependency-importers.test.ts` trava isso, com dívida datada amarrada por simetria para o que ainda espera a fatia de deps.
