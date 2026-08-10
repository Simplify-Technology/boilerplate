# ADR 0002 — Ziggy mantido; Wayfinder reavaliado quando estabilizar

**Status:** aceito (revisitar)

## Contexto

O frontend precisa gerar URLs a partir das rotas nomeadas do Laravel. Usamos Ziggy (`route()` no TS, rotas compartilhadas via shared props). O Laravel Wayfinder promete rotas/actions totalmente tipadas geradas em build, mas ainda está amadurecendo no ecossistema e migrá-lo tocaria todas as páginas e testes do frontend.

## Decisão

Ficar no Ziggy por ora. Reavaliar o Wayfinder quando ele estabilizar (API estável, adoção consolidada, integração comprovada com Inertia v3 + Vite) e o ganho de tipagem justificar o custo de migração.

## Consequências

- Zero custo de migração agora; padrão já conhecido pelos forks.
- Nomes de rota não são checados em compile-time — erro de rota aparece em runtime/teste.
- Quando a reavaliação acontecer, deve ser feita no boilerplate primeiro e propagada aos forks, nunca projeto a projeto.
