---
paths:
  - 'resources/css/**'
---

# Css

## `--color-*` é namespace do `@theme`, não lugar para hex de marca
O Tailwind gera utilitário de cor a partir de cada `--color-X` do bloco `@theme` (`bg-X`, `text-X`, `border-X`…). Declarar um `--color-*` em qualquer outro lugar do arquivo **sombreia o do `@theme` sem aviso**, porque declaração fora de layer vence declaração dentro de `@layer theme`: o utilitário passa a resolver para o valor cru e o `.dark { … }` nunca chega nele. Foi o que aconteceu por meses com `--color-primary` e `--color-accent` (`text-primary` no escuro dava 1.28:1 e o comentário "high-contrast in dark mode" descrevia efeito morto). Os hexes da marca vivem em `--brand-*`; o `@theme` só mapeia token semântico para `var(--token)`, nunca para literal. `resources/js/test/styles/theme-tokens.test.ts` trava isso.

## Par de token que vira texto tem contraste medido, não estimado
Todo par `--X` / `--X-foreground` precisa atingir 4.5:1 nos DOIS temas, e o teste de contrato calcula a razão resolvendo as cadeias de `var()` — não confie em olho nem em "parece escuro o bastante". Ao acrescentar um token semântico, acrescente a linha correspondente na tabela do teste no mesmo commit. Cuidado com o token que faz dois trabalhos: um `--X` usado como preenchimento (precisa contrastar com o próprio foreground) e como cor de texto sobre o canvas (precisa contrastar com o `--background`) puxa para lados opostos — nesse caso a saída é separar em tokens de estado, não escolher um meio-termo que reprova nos dois usos.

## Folha de terceiro entra em layer
`@import` de CSS de biblioteca traz declarações fora de layer, que vencem o `@theme`. Hoje `@radix-ui/themes/styles.css` redeclara `--color-background` e sequestra `bg-background` no app inteiro — dívida registrada, ainda não paga. Ao acrescentar folha de terceiro, importe em `layer(...)` com a ordem declarada, ou reafirme explicitamente os tokens que ela pisa.
