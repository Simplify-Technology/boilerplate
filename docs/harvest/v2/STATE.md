# Harvest v2 — STATE

Estado retomável da rodada. **Toda iteração termina atualizando este arquivo.**

- **Issue-âncora:** #50 · **Branch de estado:** `50-harvest-v2-rodada` · **Worktree:** `../boilerplate-harvest-state`
- **Rodada aberta em:** 2026-08-11
- **Direção:** projetos → boilerplate (inverso do PLAYBOOK de migração)
- **Situação:** Fase 0 concluída · varredura em andamento

## Fase 0 — Preflight (2026-08-11)

### Paths resolvidos e SHA pinado

Toda evidência/veredito desta rodada refere-se ao SHA abaixo. Commits posteriores nas fontes estão **fora da rodada** (registrar em RELATORIO.md como "evoluiu durante a rodada").

| # | Projeto | Path absoluto | SHA pinado | Branch da fonte | Working tree | Último commit |
| - | ------- | ------------- | ---------- | --------------- | ------------ | ------------- |
| 1 | ctfinance | `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctfinance` | `b8c6d57` | `main` | limpa | 2026-07-21 |
| 2 | spinmax | `/Users/cristianomorgante/workspace/laravel/clients/spinmax/app` | `e4ec01e` | `develop` | **suja (3)** | 2026-08-10 |
| 3 | sorteiopix | `/Users/cristianomorgante/workspace/laravel/simplify-technology/sorteiopix` | `b98327b` | `main` | limpa | 2026-03-13 |
| 4 | ctjuris | `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctjuris` | `3897a86` | `feature/CTJ-2-loop-p1p2` | **suja (1)** | 2026-08-03 |
| 5 | ctvitrine | `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine` | `53d7d9a` | `main` | **suja (7)** | 2026-08-04 |
| 6 | cuidari | `/Users/cristianomorgante/workspace/laravel/simplify-technology/cuidari` | `a7a1170` | `22-optical-lab-pdf-board` | limpa | 2026-08-10 |
| 7 | transitado-em-julgado | `/Users/cristianomorgante/workspace/laravel/simplify-technology/transitado-em-julgado` | `7749a1e` | `chore/9-fatia-2b-toolchain` | **suja (9)** | 2026-08-10 |

### Correções ao enunciado do comando (aplicar em `.claude/commands/harvest-v2.md`)

1. **Path do spinmax está errado no comando.** A raiz Laravel é `~/workspace/laravel/clients/spinmax/app`, não `~/workspace/laravel/clients/spinmax` (o diretório-pai tem só `.DS_Store`, `_to_delete/`, um `.docx` e `app/`).
2. **Não existe branch `develop` no boilerplate.** Remoto tem apenas `main` + branches de feature/dependabot. Fatias saem de **`main`**, não de `develop`.
3. **ctjuris está em Inertia 2 no comando; confirmar na varredura** (tabela do comando diz "L13 + Inertia 2").

### Ferramentas

- `gh auth status` ✅ (CrisMorgantee, ssh, scopes `repo`/`read:org`)
- `git remote -v` ✅ `git@github.com:Simplify-Technology/boilerplate.git`
- `corepack pnpm -v` ✅ `11.19.0`
- Worktree de estado ✅ criado a partir de `origin/main` (`c6982fa`)

### Reconciliação

Rodada nova, sem passivo: zero branches `*harvest-v2*`, zero issues/PRs com `harvest-v2` antes da issue #50, worktree único.

## Matriz de varredura — projeto × (inventário + 8 dimensões)

Legenda: ⬜ pendente · 🔍 em andamento · ✅ concluída

| # | Projeto | Inv | 1 Seg | 2 Arq | 3 Perf-BE | 4 Front | 5 UX | 6 UI | 7 Copy | 8 Ops | Crítico | Projeto |
| - | ------- | --- | ----- | ----- | --------- | ------- | ---- | ---- | ------ | ----- | ------- | ------- |
| 1 | ctfinance | ✅ | 🔍 | 🔍 | 🔍 | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | spinmax | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | sorteiopix | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | ctjuris | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | ctvitrine | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | cuidari | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | transitado-em-julgado | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Progresso:** 1/70 células (1,4%)

### Ponteiros levantados no inventário (entram como candidatos nas dimensões, ainda SEM veredito)

| # | Fato verificado no código | Dimensão dona |
| - | ------------------------- | ------------- |
| 1 | `POST users/{user}/impersonate` do ctfinance tem só `throttle:10,1`, **sem `can:impersonate_users`** (`routes/web.php:99-102`) | 1 — guard-rail |
| 2 | `use-permissions.ts:18` do ctfinance faz `hasRole('super_user') \|\| set.has(p)`; o boilerplate (`:28`) não tem esse bypass | 1 — guard-rail |
| 3 | `bootstrap/app.php:49-51` do ctfinance tem `withExceptions` **vazio** — sem error-page, sem `SecurityHeaders::stamp()`, sem 419 | 1 — o boilerplate já é superior |
| 4 | `MoneyHelper` tem só `toCents`/`fromCents`; boilerplate tem `Money` VO + `MoneyCast` + `MoneyString` | 2 — tema multi-fonte "dinheiro" |
| 5 | `.husky/commit-msg:16` do ctfinance tem `REQUIRE_ISSUE_ID="${REQUIRE_ISSUE_ID:-0}"` — gate desligado | 8 — não absorver |
| 6 | `MobileResponsiveAuditTest` percorre 56 rotas em 390×844 medindo overflow e rankeando o elemento culpado | 5/6 — candidato forte |
| 7 | `browser.yml` com cron noturno + cache de browsers Playwright; boilerplate não tem suíte browser (PLAYBOOK §4) | 8 — `[dep-nova]` |
| 8 | `CloseCreditCardInvoicesJob` agendado **sem `withoutOverlapping`/`onOneServer`**; nenhum job declara `$tries`/`$backoff`/`$timeout` | 3 — guard-rail |
| 9 | `CreditCardPolicy` e `RecurringIncomePolicy` existem mas ficam fora de `configPolicies()` | 2 — guard-rail (teste Arch) |
| 10 | XOR de `recurring_expenses` é CHECK no pgsql, trigger no MySQL e **no-op no SQLite** (suíte roda em SQLite) | 2 — guard-rail |

## Fatias abertas

Nenhuma.

| Tema | Issue | Branch | Testes | Gates | PR | Estado |
| ---- | ----- | ------ | ------ | ----- | -- | ------ |
| — | — | — | — | — | — | — |

## Próxima unidade

**Dimensões 1–3 do ctfinance** (Segurança, Arquitetura, Performance backend) — em execução.
