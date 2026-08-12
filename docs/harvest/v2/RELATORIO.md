# Harvest v2 — RELATÓRIO

Preenchido no **fechamento** da rodada (após os merges do dono). Até lá, serve de caderno para o que não cabe no STATE nem no BACKLOG.

## O melhor de cada projeto

| Projeto | Absorvido | Adiado | Rejeitado |
| ------- | --------- | ------ | --------- |
| ctfinance | — | — | — |
| spinmax | — | — | — |
| sorteiopix | — | — | — |
| ctjuris | — | — | — |
| ctvitrine | — | — | — |
| cuidari | — | — | — |
| transitado-em-julgado | — | — | — |

## PRs da rodada

| PR | Tema | Origem | Estado |
| -- | ---- | ------ | ------ |
| — | — | — | — |

## Fontes que evoluíram durante a rodada

Commits nas fontes posteriores ao SHA pinado na Fase 0 — **fora desta rodada**, entram na próxima harvest.

| Projeto | SHA pinado | HEAD observado | O que mudou |
| ------- | ---------- | -------------- | ----------- |
| ctvitrine | `53d7d9a` | `89251fc` (2026-08-12, 8ª invocação) | 8 commits, **nenhum estrutural**: razão social + CNPJ no rodapé da landing, concordância e "setup incluso" nos dois ciclos do signup, badge RECOMENDADO no lugar do selo de popularidade, preço anual deixa de imprimir mensal abaixo do piso, remoção do claim "Compra segura" da barra de confiança, compressão dos PNGs de mockup, lote de specs de risco/infra, remoção de um PNG residual. Sem toque em middleware, config, migrations ou `lang/`. **A célula 0 do ctvitrine varre `53d7d9a` via `git show`, não o disco** (working tree em `89251fc` e suja). |
| — (demais 6) | — | idênticos ao pinado | zero drift até a 8ª invocação |

## Pendências para o dono

| Item | Tipo | Decisão necessária |
| ---- | ---- | ------------------ |
| Path do spinmax no comando `.claude/commands/harvest-v2.md` | correção de doc | Raiz Laravel é `clients/spinmax/app`, não `clients/spinmax` |
| Branch-base das fatias | correção de doc | Não existe `develop` no remoto; fatias saem de `main` |
