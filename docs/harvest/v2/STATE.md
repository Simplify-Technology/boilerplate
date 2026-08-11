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

### ⚠️ TRAP DA RODADA — worktree novo não tem hook nenhum

`core.hooksPath` do repositório é **`.husky/_`**, que é **gerado pelo `pnpm install`** (script `prepare`) e é gitignorado. Um worktree recém-criado (`git worktree add`) não tem `.husky/_/`, então o git **não encontra hook algum**: nem `pre-commit` (lint-staged), nem `commit-msg` (guard de ID de issue e de branch), nem `pre-push` (os dois `ci:check`). Eles não falham — simplesmente não existem, sem aviso.

- Confirmado no push de 2026-08-11: os 3 commits de estado subiram sem que uma linha de gate rodasse. Aceitável **só porque o diff é markdown puro** — `git diff origin/main -- ':!docs' ':!.claude'` volta vazio, zero código.
- **Consequência para as fatias de código desta rodada:** worktree de fatia precisa de `corepack pnpm install` **antes do primeiro commit**, senão os gates são silenciosamente pulados e o Guardrail 7 vira letra morta. Não é caso de `SKIP_GIT_HOOKS=1` — é o oposto: o skip aqui é o default acidental.
- Segunda pegadinha do mesmo worktree: `.mise.toml` nasce **não confiado** (`mise ERROR ... are not trusted`), o que quebra qualquer comando antes de chegar ao hook. Resolver com `mise trust` no worktree novo.

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
| 1 | ctfinance | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | spinmax | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | sorteiopix | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | ctjuris | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | ctvitrine | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | cuidari | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | transitado-em-julgado | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Progresso:** 4/70 células (5,7%) · BACKLOG: **2 aplicados (A1, A3)**, 1 realocado (A2), 9 aplicáveis, 7 adiados, 5 rejeitados

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

| Tema | Issue | Branch | Testes | Gates | PR | Estado |
| ---- | ----- | ------ | ------ | ----- | -- | ------ |
| **A1** — guard-rail: rota de escrita autenticada declara autorização | [#51](https://github.com/Simplify-Technology/boilerplate/issues/51) | `51-harvest-v2-guard-rota-escrita-autorizada` | ✅ 3 testes + 3 mutações | ✅ ambos exit 0 | [#52](https://github.com/Simplify-Technology/boilerplate/pull/52) | **aguardando merge do dono** |
| **A3** — guard-rail: shape do `share()` + espelho TS | [#53](https://github.com/Simplify-Technology/boilerplate/issues/53) | `53-harvest-v2-contrato-share-props` | ✅ 1 teste novo + 3 mutações | ✅ ambos exit 0 | [#54](https://github.com/Simplify-Technology/boilerplate/pull/54) | **aguardando merge do dono** |

### A1 — o que entrou

`tests/Feature/Routes/WriteRoutesAuthorizationTest.php` (novo) + linha nova em `.ai/rules/routes.md`.

Verificado **por mutação**, não só por passar verde:

| Mutação aplicada | Resultado |
| ---------------- | --------- |
| Remover `can:impersonate_users` da rota de impersonation (o furo exato do ctfinance) | ⨯ 2 testes falham, nomeando `POST users/{user}/impersonate` |
| Somar rota de escrita autenticada sem gate | ⨯ falha nomeando a rota nova |
| Deixar entrada morta na allowlist | ⨯ falha nomeando a entrada obsoleta |

Allowlist de self-service com 7 entradas, verificada nos dois sentidos. Cobre `can:` **e** o atributo nativo `#[Authorize]` (que produz `Illuminate\Auth\Middleware\Authorize:<ability>`, não o alias) — exigência que veio da lente de atualidade.

Gates rodaram de verdade: o `pre-push` disparou no worktree principal (que tem `.husky/_`), com `composer ci:check` (307 testes) e `corepack pnpm ci:check` ambos em exit 0.

### A3 — o que entrou

`tests/Feature/SharedPropsTest.php` (teste novo) + `resources/js/types/index.d.ts` + `resources/js/hooks/use-flash-messages.tsx`.

| Mutação aplicada | Resultado |
| ---------------- | --------- |
| Chave nova no topo do `share()` | ⨯ `Unexpected properties were found on the root level` |
| Chave nova dentro de `auth` | ⨯ `Unexpected properties were found in scope [auth]` |
| Chave removida de `flash` | ⨯ `Property [flash.warning] does not exist` |

Dois fatos medidos que corrigem o candidato original:

1. **O `interacted()` NÃO roda sozinho no escopo raiz** do `AssertableInertia` — só nos escopos aninhados. Sem a chamada explícita, o guard passava verde com uma chave `telemetry` inventada no topo. Descoberto por mutação; o teste teria nascido meio cego.
2. **O `[key: string]: unknown` de `SharedData` não pode sair** — é exigência do constraint `PageProps` do `@inertiajs/react`; removê-lo quebra `usePage<SharedData>()` em 7 arquivos (`TS2344`). Ou seja, a metade "proibir tipo TS mais largo que o payload" do candidato A3 é **inalcançável no nível de tipo**, e é exatamente por isso que o contrato de runtime importa. Registrado em comentário no próprio arquivo para ninguém tentar de novo.

Achado de brinde, na mesma direção: `flash` era publicado pelo `share()` e não existia em `SharedData` — vivia numa interface privada dentro de `use-flash-messages.tsx`, o segundo canal para o mesmo dado que o `CLAUDE.md` proíbe.

## ⚠️ Observação estratégica — guard-rail vazio não é guard-rail

Aplicando A1 e A3 ficou visível um limite do BACKLOG atual: **a maioria dos guard-rails restantes do ctfinance prescreve para código que o boilerplate ainda não tem.**

| Candidato | Superfície no boilerplate hoje |
| --------- | ------------------------------ |
| A2 — FK escopada por dono | zero recursos com dono (`app/Models/` = User, Role, Permission, PermissionUser) |
| A7 — contrato de fila do job | `app/Jobs` não existe; zero `ShouldQueue` |
| A9 — transação + `lockForUpdate` | zero código de dinheiro; e o SQLite da suíte compila `FOR UPDATE` para string vazia |
| A12 — enum como máquina de estado | `app/Enum` = `Permissions`, `Roles` |
| B4 — upload em disco privado | zero `Storage::`/`UploadedFile` |
| B6 — exception de domínio | `app/Exceptions` não existe |

Teste `arch()` sobre namespace inexistente devolve layer vazia e **passa vacuamente** — vira falso conforto. A1 e A3 escaparam disso porque tinham superfície real (rotas e o `share()`).

**Recomendação:** juntar A2, A7, A9, A12, B4 e B6 numa **fatia única de `.ai/rules`** — prescrição honesta para código futuro, sem teste vazio fingindo cobertura — e reservar teste executável para quando a superfície existir. Decisão do dono; não executei.

## Próxima unidade

**A6** — guard-rail de invariante de banco por dialeto (`DB::statement`/`getDriverName` em migration). É o próximo com superfície real: as 6 migrations existem e o teste tem molde irmão em `tests/Feature/Foundation/SchemaIdentifierLengthTest.php`.

Depois dele, ou a fatia única de regras acima, ou as dimensões 4–6 do ctfinance.

## Vereditos das dimensões 1–3 (ctfinance)

20 candidatos levantados, 3 lentes adversariais cada (refutar / risco de absorção / atualidade via `search-docs`). **Nenhum passou intacto** — 15 sobreviveram com escopo reduzido, 3 foram derrubados por lente, 2 eram direção inversa. O escopo corrigido está no BACKLOG; fatia que reabrir o escopo original está errada.

Correções mais importantes que as lentes trouxeram:

1. **`Auth::logoutOtherDevices()` não encerra sessão nenhuma** sem o middleware `AuthenticateSession` (`SessionGuard.php:740-777`). As 3 lentes convergiram nisso independentemente. Na origem, o botão grava "Demais sessões foram encerradas." e nada é encerrado.
2. **Tirar `role_id`/`is_active` do `$fillable` sem inverter o modo de falha antes é fail-OPEN**: `handleDiscardedAttributeViolationUsing` só faz `report()` em produção (`AppServiceProvider.php:81-89`), então `revokeRole` e `toggleActive` virariam no-op silencioso. São 8 call sites, não 3.
3. **`Rule::exists()->where()` já é o nativo** para FK escopada por dono — não criar `ValidationRule` nova.
4. Metade do candidato de idempotência já é `Builder::createOrFirst()` nativo; a forma da origem tem bug de portabilidade (catch dentro da transação quebra em pgsql).
5. `withPhpSets()` resolve a versão pelo `composer.json`, não pelo runtime — a adaptação proposta estava errada.
