# ADR 0003 — Sem TanStack Query

**Status:** aceito

## Contexto

Em SPAs "puras", TanStack Query resolve cache, revalidação e estados de fetch. Num monólito Inertia, porém, os dados chegam como props do servidor, e o Inertia v3 já cobre os casos que antes pediam fetch client-side: deferred props (carregamento tardio com skeleton), prefetch de links, polling, `WhenVisible`/infinite scroll e partial reloads.

## Decisão

Não adicionar TanStack Query (nem SWR) ao boilerplate. Necessidades de dado assíncrono se resolvem com os recursos nativos do Inertia v3; estado local fica em hooks React simples.

## Consequências

- Uma fonte de verdade só (props do servidor) — sem cache duplicado client-side para sincronizar.
- Menos dependências e menos conceitos para quem entra no projeto.
- Se um fork desenvolver necessidade real de fetch fora do ciclo Inertia (ex.: dashboard com dezenas de widgets independentes), a adoção deve ser localizada e justificada em ADR do próprio projeto.
