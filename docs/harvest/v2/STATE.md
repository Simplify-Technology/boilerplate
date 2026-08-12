# Harvest v2 — STATE

Estado retomável da rodada. **Toda iteração termina atualizando este arquivo.**

- **Issue-âncora:** #50 · **Branch de estado:** `50-harvest-v2-rodada` · **Worktree:** `../boilerplate-harvest-state`
- **Rodada aberta em:** 2026-08-11
- **Direção:** projetos → boilerplate (inverso do PLAYBOOK de migração)
- **Situação:** Fase 0 concluída · varredura em andamento (7/70 células) · **12 fatias MESCLADAS** (A1, A3, A6, D2, D3, D4, D5, E17, E2+E13, F1, F5, F22) · **1 PR aberto** (#76, tema fora do React)

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

- Confirmado no push de 2026-08-11: os 3 commits de estado subiram sem que uma linha de gate rodasse. Aceitável **só porque o diff é markdown puro**.
- **⚠️ Correção de 2026-08-11 (2ª invocação): a checagem que estava escrita aqui está errada e dá falso alarme.** `git diff origin/main -- ':!docs'` **não** volta mais vazio — não porque o branch de estado toque código, mas porque ele nasceu de `c6982fa` e a `main` já andou 5 fatias à frente; o diff mostra a `main` nova contra o snapshot velho. A checagem correta é contra a merge-base: `git diff $(git merge-base origin/main HEAD)..HEAD --stat -- ':!docs'` — **esta** volta vazia. Não rebase o branch de estado só para satisfazer a checagem antiga.
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
| 1 | ctfinance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | spinmax | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | sorteiopix | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | ctjuris | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | ctvitrine | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | cuidari | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | transitado-em-julgado | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Progresso:** 7/70 células (10%) · BACKLOG: **16 aplicados (A1, A3, A6, D2, D3, D4, D5, E17, E2, E13, F1, F5, F22, F42, F35, F23)**, 1 realocado (A2), **~104 aplicáveis** (8 de dim. 1–3 · 27 de dim. 5 · **69 de dim. 6: F1–F42 + secagem**), 7 adiados, **11 rejeitados**, 9 sem veredito (dim. 4), 1 achado interno (C1), **2 `[dep-nova]` novos** (`jest-axe`, `knip`). Decisão do dono sobre o canal de flash: **resolvida em 2026-08-11 (nativo)**.

> **Onde está o quê no BACKLOG:** a dimensão 5 foi APENDADA ao fim do arquivo (E1–E25, depois secagem E26–E30, depois os rejeitados e a §Decisões). As seções de dim. 1–4 continuam no topo. Ordem do arquivo ≠ ordem de prioridade.

**Baseline de gates em `main` com as 4 fatias mescladas combinadas** (medido 2026-08-11, primeira vez que rodaram juntas): `composer ci:check` 311 testes / 1678 asserções, `corepack pnpm ci:check` 25 arquivos / 158 testes. Ambos exit 0.

### ⚠️ O que a dimensão 4 ensinou sobre a rodada

Das 6 candidaturas julgadas, **três não eram código a portar — eram defeitos que o boilerplate já tem**, revelados só pela leitura comparada (cache de prefetch na impersonation, spinner morto, token de tema inexistente no primeiro paint). O ativo colhido do projeto-fonte foi o **diagnóstico**, não o arquivo.

Isso corrige a expectativa da rodada: "harvest" não é só copiar o melhor de cada derivado. Ler o derivado ao lado do boilerplate é o que torna visível o defeito de casa. As dimensões seguintes devem manter o par de perguntas explícito — a segunda vem rendendo mais que a primeira.

Segundo padrão confirmado: **nenhum candidato passou intacto pelas 3 lentes, e o caçador errou fatos verificáveis em 5 dos 6.** Entre outros: `manualChunks` "não existe mais no Vite 8" (existe, via Rolldown); `once()` "substitui o `??=`" (é cache no cliente, não memoização); "11 telas afetadas" (eram 9, misturando dois componentes); "o dev achou que closure era lazy" (o teste da fonte prova o contrário); "flush precisa vir antes do post" (o cache nem é consultado no redirect). A verificação adversarial está pagando o próprio custo.

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
| **A1** — guard-rail: rota de escrita autenticada declara autorização | [#51](https://github.com/Simplify-Technology/boilerplate/issues/51) | `51-harvest-v2-guard-rota-escrita-autorizada` | ✅ 3 testes + 3 mutações | ✅ ambos exit 0 | [#52](https://github.com/Simplify-Technology/boilerplate/pull/52) | ✅ **MESCLADO** 2026-08-11 |
| **A3** — guard-rail: shape do `share()` + espelho TS | [#53](https://github.com/Simplify-Technology/boilerplate/issues/53) | `53-harvest-v2-contrato-share-props` | ✅ 1 teste novo + 3 mutações | ✅ ambos exit 0 | [#54](https://github.com/Simplify-Technology/boilerplate/pull/54) | ✅ **MESCLADO** 2026-08-11 |
| **A6** — guard-rail: invariante de banco que vira no-op no SQLite | [#55](https://github.com/Simplify-Technology/boilerplate/issues/55) | `55-harvest-v2-guard-invariante-por-dialeto` | ✅ 3 testes + 6 mutações | ✅ ambos exit 0 | [#56](https://github.com/Simplify-Technology/boilerplate/pull/56) | ✅ **MESCLADO** 2026-08-11 17:20 |
| **D2** — fix: cache de prefetch sobrevive à troca de identidade | [#57](https://github.com/Simplify-Technology/boilerplate/issues/57) | `57-harvest-v2-flush-prefetch-identidade` | ✅ 7 testes + 3 mutações | ✅ ambos exit 0 | [#58](https://github.com/Simplify-Technology/boilerplate/pull/58) | ✅ **MESCLADO** 2026-08-11 |
| **D5** — fix: spinner de busca (nunca aparecia / nunca parava) | [#59](https://github.com/Simplify-Technology/boilerplate/issues/59) | `59-harvest-v2-spinner-busca` | ✅ 8 testes + 3 mutações | ✅ ambos exit 0 | [#60](https://github.com/Simplify-Technology/boilerplate/pull/60) | **aguardando merge do dono** |
| **D4** — fix: fundo escuro inline com literal + `color-scheme` | [#61](https://github.com/Simplify-Technology/boilerplate/issues/61) | `61-harvest-v2-fundo-inline-tema` | ✅ 4 testes + 3 mutações | ✅ ambos exit 0 | [#62](https://github.com/Simplify-Technology/boilerplate/pull/62) | **aguardando merge do dono** |
| **D3** — docs: closure em prop de render não adia nada | [#63](https://github.com/Simplify-Technology/boilerplate/issues/63) | `63-harvest-v2-regra-props-lazy` | — (só doc; gate inviável, ver BACKLOG) | ✅ ambos exit 0 | [#64](https://github.com/Simplify-Technology/boilerplate/pull/64) | ✅ **MESCLADO** 2026-08-11 18:56 |

| **E17** — fix: ordenação e page size crus na listagem (500 por URL) | [#65](https://github.com/Simplify-Technology/boilerplate/issues/65) | `65-harvest-v2-normaliza-ordenacao-listagem` | ✅ 41 testes + 4 mutações | ✅ ambos exit 0 (352/1831) | [#66](https://github.com/Simplify-Technology/boilerplate/pull/66) | ✅ **MESCLADO** 2026-08-11 |
| **E2+E13** — refactor: canal de flash nativo do Inertia 3 | [#67](https://github.com/Simplify-Technology/boilerplate/issues/67) | `67-harvest-v2-flash-nativo` | ✅ 15 testes + 2 mutações | ✅ ambos exit 0 (364/1896) | [#68](https://github.com/Simplify-Technology/boilerplate/pull/68) | ✅ **MESCLADO** 2026-08-11 |
| **F1** — fix: colisão de token que matava o dark mode | [#69](https://github.com/Simplify-Technology/boilerplate/issues/69) | `69-harvest-v2-conserta-theme` | ✅ 18 testes + 3 mutações | ✅ ambos exit 0 (364/1896) | [#70](https://github.com/Simplify-Technology/boilerplate/pull/70) | ✅ **MESCLADO** 2026-08-12 |
| **F5** — fix: anel de foco invisível no tema claro | [#71](https://github.com/Simplify-Technology/boilerplate/issues/71) | `71-harvest-v2-anel-de-foco` | ✅ 30 testes de estilo + 6 mutações | ✅ ambos exit 0 (364/1896) | [#72](https://github.com/Simplify-Technology/boilerplate/pull/72) | ✅ **MESCLADO** 2026-08-12 |
| **F22** — fix: `<a><button>` aninhado em 6 links-botão | [#73](https://github.com/Simplify-Technology/boilerplate/issues/73) | `73-harvest-v2-link-botao` | ✅ 8 testes + 3 mutações | ✅ ambos exit 0 (364/1896 · 29/192) | [#74](https://github.com/Simplify-Technology/boilerplate/pull/74) | ✅ **MESCLADO** 2026-08-12 |
| **F42+F35** — fix: tema fora do React (500 de último recurso + cromo nativo) | [#75](https://github.com/Simplify-Technology/boilerplate/issues/75) | `75-harvest-v2-tema-fora-do-react` | ✅ 17 testes + **9 mutações** | ✅ ambos exit 0 (373/1911 · 30/204) | [#76](https://github.com/Simplify-Technology/boilerplate/pull/76) | **aguardando merge do dono** |
| **F23** — fix: `<button>` sem `type` + regra `react/button-has-type` | [#77](https://github.com/Simplify-Technology/boilerplate/issues/77) | `77-harvest-v2-button-type` | ✅ lint como gate + 2 mutações | ✅ ambos exit 0 (364/1896 · 30/204) | [#78](https://github.com/Simplify-Technology/boilerplate/pull/78) | ✅ **MESCLADO** 2026-08-12 |

**Reconciliação de 2026-08-11 (2ª invocação):** `gh pr list` mostrou **#64 já mesclado** — o STATE dizia "aguardando merge". Corrigido acima antes de executar qualquer unidade. Seguem abertos só **#60 (D5)** e **#62 (D4)**. `main` local avançada para `9814f46`.

**Reconciliação de 2026-08-12 (3ª invocação):** os TRÊS que o STATE dava como pendentes — **#60 (D5)**, **#62 (D4)** e **#70 (F1)** — já estavam **mesclados**. Corrigido acima antes de executar qualquer unidade. A rodada entrou nesta invocação **sem nenhum PR aberto e sem fatia em andamento**, então Prioridade 1 do protocolo (fatia pronta do BACKLOG) foi a unidade correta. `main` local em `03b4440`.

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

### A6 — o que entrou

`tests/Unit/Database/MigrationDialectInvariantTest.php` (novo) + `.ai/rules/migrations.md` (novo) + 1 linha no `.ai/rules/index.md`.

| Mutação aplicada | Resultado |
| ---------------- | --------- |
| A forma exata do ctfinance (`getDriverName` + `DB::statement` + `return` no sqlite) | ⨯ falha nomeando o arquivo |
| `DB::unprepared` puro com SQL válido no sqlite | ⨯ falha |
| `DB::connection()->statement` (facade indireta) | ⨯ falha |
| Entrada morta na allowlist | ⨯ falha nomeando a entrada |
| Migration **declarada** na allowlist | ✓ as 3 passam |
| `DB::statement` só dentro de comentário | ✓ passa — falso positivo evitado por `token_get_all` |

Três fatos medidos nesta fatia:

1. **A guarda não podia morar em `Feature`.** Lá ela herda o `RefreshDatabase` e passa a depender de as migrations rodarem — exatamente o que quebra quando alguém comete o erro que ela existe para pegar. Medido: a migration-sonda com trigger MySQL derrubou a suíte com `QueryException` **antes** de qualquer asserção, e as mutações 2 e 3 tiveram de ser refeitas com SQL válido no sqlite para isolar a guarda. Foi para `tests/Unit` (TestCase base, sem app), com caminho por `dirname(__DIR__, 3)` em vez de `database_path()`.
2. **Lente de atualidade confirmada no vendor 13.24.0**, não só nos docs: `Blueprint` não tem `check()` (grep → 0 ocorrências) e a introspecção nativa é `getTables`/`getViews`/`getColumns`/`getIndexes`/`getForeignKeys` — **não existe** `getCheckConstraints()`. Grep no texto da migration segue sendo o único caminho, como o BACKLOG previa.
3. **A perna 2 que eu tinha imaginado morreu na medição.** "FK declarada existe no schema materializado" nasceria verde por acidente: `Schema::getForeignKeys()` na suíte devolve `[]` para `users` e `sessions` porque essas colunas **não declaram FK nenhuma** (ver achado interno no BACKLOG). Fatia entregue só com a perna que tem corpo.

### D2 — o que entrou

`resources/js/lib/impersonation.ts` (novo) + 2 arquivos de teste + 3 call sites convertidos + regra em `.ai/rules/js.md`.

| Mutação aplicada | Resultado |
| ---------------- | --------- |
| Tirar `router.flushAll()` de `startImpersonation` | ⨯ 3 testes falham |
| Somar 4º call site chamando `router.post(route('users.impersonate'))` direto | ⨯ guarda de propriedade de rota falha |
| Reverter `impersonate-banner` para o `router.delete` direto | ⨯ 2 testes falham |

**Primeira fatia da rodada que conserta bug, não só previne.** As anteriores (A1, A3, A6) travavam contratos já corretos; esta corrige vazamento de dado entre identidades que estava vivo em `main`.

Decisão de forma que vale registrar: a correção **não** foi espalhar `flushAll()` pelos 3 call sites, e sim fazer `lib/impersonation.ts` o único caminho, com teste de propriedade proibindo nomear as rotas fora dele. Os 3 call sites nasceram um de cada vez sem saber uns dos outros — foi assim que o buraco apareceu, e espalhar a chamada conserta hoje e reabre no quarto.

**Verificação própria antes de codar:** as afirmações do fan-out foram reconferidas no código real (3 call sites, 6 `<Link prefetch>`, `grep` de invalidação vazio, `RedirectResponse` nos dois controllers, `flushAll(): void` em `types/router.d.ts:40`). Todas bateram.

## Achado interno registrado no BACKLOG

`users.role_id` e `sessions.user_id` usam `foreignId()` **sem** `->constrained()` — coluna sem FK real, em todos os dialetos. Medido nesta fatia, entrou no BACKLOG como C1. Não é harvest (não veio de projeto-fonte) e não entrou nesta fatia: mudar isso é comportamental e merece fatia própria.

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

### O que a dimensão 5 ensinou (2026-08-11)

Célula de maior rendimento da rodada: 32 candidatos caçados em 4 frentes, **28 sobreviveram**, mais 6 da secagem (5 sobreviveram) = **33 itens de BACKLOG**. Três coisas mudam a leitura da rodada:

1. **A proporção "defeito de casa" subiu de 3/4 (dim. 4) para 22/28.** A pergunta (b) — "que limitação daqui vira guard-rail lá?" — deixou de ser a segunda pergunta e virou a principal. As dimensões 6–8 devem ser abertas com ela na frente.
2. **A verificação adversarial pagou de novo, e mais caro.** Entre os fatos derrubados: `aria-live` num nó recém-montado **não** anuncia (o remédio do ctfinance não funciona); `replace: true` no autosave é desnecessário quando a URL não muda; a correção proposta para o `flash` **não preserva nada** porque `ageFlashData()` roda em toda requisição; o `<main>` real é o do `SidebarInset`, não o do `app-content` (o skip-link do caçador apontaria para id inexistente); `@radix-ui/react-dialog@1.1.23` não emite o warning que justificava um candidato; o boilerplate tinha **3 offenders vivos** de máscara inline onde o caçador jurou "nasce verde".
3. **Código morto é desinformação ativa.** Sete peças órfãs medidas no boilerplate, e **duas delas fizeram caçadores errarem o diagnóstico nesta mesma célula** (E23 e E29 acusaram defeitos em componentes que nunca renderizam). Isso justifica sozinho uma fatia de limpeza.

### ⚠️ Decisão do dono represando fatias

~~**Canal de flash.**~~ ✅ **DECIDIDO pelo dono em 2026-08-11: usar o nativo.** Aplicado no PR #68 — `Inertia::flash()` nos 13 call sites, um `router.on('flash')` em `app.tsx`, `use-flash-messages.tsx` e as 9 chamadas por página apagados. E2 e E13 saem juntos do BACKLOG.

Segue pendente, de antes: a **fatia única de `.ai/rules`** juntando A2, A7, A9, A12, B4 e B6 (guard-rails sem superfície executável no boilerplate hoje).

### E17 — o que entrou (2026-08-11)

`app/Support/Listing/ListQueryNormalizer.php` (novo) + `User/IndexController.php` + 2 arquivos de teste + linha nova em `.ai/rules/controllers.md`. PR [#66](https://github.com/Simplify-Technology/boilerplate/pull/66).

**Segunda fatia da rodada que conserta bug em vez de prevenir** (depois da D2), e a primeira de disponibilidade: o 500 foi **reproduzido pelo teste antes da correção** (`InvalidArgumentException` de `Query\Builder:2992`).

| Mutação aplicada | Resultado |
| ---------------- | --------- |
| Direção crua no `orderBy()` (o defeito original) | ⨯ 5 testes falham |
| `perPage()` sem teto/piso | ⨯ 2 falham |
| Allow-list de campo desligada | ⨯ 3 falham |
| `$default` de direção sem validação | ⨯ 1 falha |

Três fatos medidos nesta fatia:

1. **A quarta mutação passou verde na primeira rodada.** A proteção contra `$default` inválido — que o próprio docblock prometia — não tinha cobertura. O teste que faltava entrou antes do commit. Sem a passada de mutação, a fatia teria entregue uma garantia escrita e não testada.
2. **O ponto de pouso sugerido pela lente estava em conflito com a convenção da casa.** O BACKLOG dizia "extrair para trait/FormRequest do kit", mas `.ai/rules/controllers.md` proíbe camada de query objects e reserva `App\Services` para lógica reusada por vários controllers. `App\Support\Listing\` (final, estático, puro) é o encaixe que `.ai/rules/support.md` já descreve — e um FormRequest daria **422 num GET de listagem**, quebrando bookmark antigo, quando o comportamento desejado é fallback gracioso.
3. **`sort_by`/`sort_order` não são emitidos pela UI hoje** — `resources/js` só **lê** `per_page`, nunca envia nenhum dos três. O bug só era alcançável por URL montada à mão. É o E19 (ordenação clicável) que o tornaria alcançável por clique — daí a ordem obrigatória.

### E2+E13 — o que entrou (2026-08-11)

`resources/js/lib/flash.ts` (novo) + `app.tsx` + 13 call sites de backend + `share()` + tipos + 2 arquivos de teste novos, contra a remoção de `use-flash-messages.tsx`, das 9 chamadas por página e do teste do hook. PR [#68](https://github.com/Simplify-Technology/boilerplate/pull/68).

| Mutação aplicada | Resultado |
| ---------------- | --------- |
| Republicar `flash` como prop no `share()` | ⨯ o guard A3 (`SharedPropsTest`) falha com "Unexpected properties" |
| `Inertia::flash()` antes do `session()->invalidate()` | ⨯ o teste do usuário desativado falha |

Quatro fatos medidos:

1. **O flash nativo é chave do OBJETO DE PÁGINA, não prop.** Medido no payload real de um partial reload pedindo só `users`: `props` traz `errors` e `users`, e `flash.success` chega no topo. O E13 deixa de ser possível por construção — não é remendo.
2. **`assertInertiaFlash` / `hasFlash` / `missingFlash` são macros nativos do adapter**, mas o `AssertableInertia` **não parseia resposta parcial** ("Not a valid Inertia response"). O teste do partial reload assere no payload cru, o que por acaso trava melhor o ponto: `props` **não** tem `flash` e a página tem.
3. **Pegadinha de ordem que virou regra:** `Inertia::flash()` escreve na sessão na hora, ao contrário do `->with()`, aplicado só no envio. Em `EnsureUserIsActive` a chamada precisa vir **depois** do `invalidate()`. Está em `.ai/rules/controllers.md` e travada por mutação.
4. **Dado morto encontrado:** `RevokeRoleController:98` usava a forma em array e flashava `'role' => $user->role?->name`. O `share()` só publicava as quatro chaves de mensagem — ninguém nunca leu. A forma em array também escapou do primeiro grep de migração; vale lembrar que `->with([...])` existe.

**Some junto** toda a deduplicação do hook antigo (Map global, `setInterval` de 5s, refs por componente): ela existia porque o dado morava em props e reaparecia a cada re-render e a cada volta no histórico.

### O que a dimensão 6 mostrou (2026-08-12)

**67 candidatos → 68 vereditos** (um nasceu na verificação), 66 sobreviveram. Célula de maior rendimento da rodada, e a que mais mudou o entendimento do boilerplate.

**O `@theme` do boilerplate está quebrado de três formas, medidas no CSS COMPILADO:** `--color-primary` e `--color-accent` estão declarados duas vezes — uma dentro do `@theme`, outra num `:root` **sem layer**, que vence. `bg-primary`/`text-primary` resolvem para o mesmo hex nos dois temas (`text-primary` no escuro = **1.28:1**) e `--primary` nunca chega a utilitário; o comentário "Buttons/CTAs should be high-contrast in dark mode" descreve efeito morto. E os 6 pares `--color-success/warning/info(-foreground)` nunca foram exportados, então `.text-success` **não existe** no CSS gerado — com call-site vivo em `user-actions-menu.tsx:125`. Achado novo da verificação, pior que os três: `@radix-ui/themes` redeclara `--color-background` sem layer e sequestra `bg-background` no app inteiro, por `app.tsx:7`.

**A lição de método desta célula:** o mecanismo da correção é uma palavra (`@theme inline`), e foi exatamente aí que a verificação pagou — ela mediu que **pós-correção o `bg-primary` no escuro cai de 11.4:1 para 3.13:1 e reprova AA**. Uma "correção de uma linha" teria embarcado regressão de contraste. Três outros candidatos tiveram o remédio derrubado pela mesma razão: o `Alert destructive` "mínimo viável" dá 4.00:1 (ainda reprova), os percentuais de `color-mix` do ctfinance reprovam 3 dos 4 estados na paleta daqui, e o `--ring` precisava de valor novo, não da classe `.focus-ring-brand` do derivado.

**O pareamento com a dimensão 5 valeu.** Nove fatias já decididas ganharam a metade visual no mesmo PR, e quatro pareamentos que o caçador propôs foram **corrigidos** — o mais importante: escopar o CSS do Radix Themes não viaja com o `EmptyState`, porque acoplar risco de cascata de 69 regras a uma reescrita de componente torna a revisão impossível.

### ⚠️ Conflito entre células resolvido a favor da dimensão 5

A dimensão 6 ressuscitou o `eslint-plugin-jsx-a11y` como `[dep-nova]`. A dimensão 5 já o havia **rejeitado** por incompatibilidade dura (o plugin declara peer até ESLint 9; o boilerplate roda 10.8.0) e a célula 6 não refutou esse fato. **A rejeição vale**; a alternativa segue sendo `jest-axe`.

### F1 — o que entrou (2026-08-12)

`resources/css/app.css` + `resources/js/test/styles/theme-tokens.test.ts` (novo) + `.ai/rules/css.md` (novo, não havia glob para `resources/css/**`) + `.ai/rules/index.md` + `tests/Unit/Theme/InlineThemeBackgroundTest.php`. PR [#70](https://github.com/Simplify-Technology/boilerplate/pull/70).

| Mutação | Resultado |
| ------- | --------- |
| Recriar `--color-primary: #1f3c57` no `:root` | ⨯ falha |
| Voltar o `--primary-foreground` do escuro para branco | ⨯ falha (3.13:1) |
| Igualar o `--primary` do escuro ao do claro | ⨯ 2 falham |

Cinco fatos medidos nesta fatia:

1. **`--color-primary: #1f3c57` tinha ZERO consumidores** — existia só para sombrear a entrada do `@theme`. Foi apagado, não renomeado. A colisão de `--color-accent` tinha 1 consumidor (`.dark { --primary }`), esse sim renomeado.
2. **`@theme inline` — o mecanismo que a análise recomendava — foi APLICADO E REVERTIDO.** Ele quebra dois consumidores vivos: `lib/toast-config.ts:16` lê `var(--font-sans)` e `app.css:89` usa `var(--color-border, currentColor)` como borda padrão; com `inline` o Tailwind deixa de emitir essas variáveis e as duas caem no fallback em silêncio. Desfazer a colisão já resolve (verificado no artefato), então o `inline` seria raio extra sem ganho. **Corrige o escopo do F1 no BACKLOG.**
3. **A terceira colisão (Radix) foi CONFIRMADA e deixada de fora.** O artefato tem 3 declarações de `--color-background`, 2 fora de qualquer layer, vindas da folha do Radix. A cura é ordenar layer de folha de terceiro — mecanismo diferente, raio visual grande, e o mesmo `@import` é alvo do **F6**. Os dois viajam juntos.
4. **Erro meu no meio do caminho, que o build pegou:** o regex do rename atingiu também a entrada `--color-accent` *dentro* do `@theme`, e o Tailwind falhou com `Cannot apply unknown utility class hover:bg-accent`. Lição: rename de token por regex precisa distinguir o bloco `@theme` do `:root`.
5. **O guard da fatia D4 pegou o rename.** `InlineThemeBackgroundTest` assere que o fundo inline do blade bate com o token do `app.css` e ficou vermelho até as duas pontas serem atualizadas — guard-rail de fatia anterior pagando o próprio custo.

**Dívida registrada como catraca:** `destructive` no escuro dá 3.67:1 e não passa. Não dá para pagar aqui — escurecer para `#e11d48` leva o botão a 4.70 mas derruba `text-destructive` de 3.99 para 3.12, e é ele que o E6 vai usar no `InputError`. O teste impede piorar **e** falha se alguém consertar sem mover o par para a tabela principal. A cura é o **F3**.

### F5 — o que entrou (2026-08-12)

`resources/css/app.css` + `resources/js/test/styles/focus-ring.test.ts` (novo) + asserções novas em `theme-tokens.test.ts` + 8 primitivos + `.ai/rules/css.md`. PR [#72](https://github.com/Simplify-Technology/boilerplate/pull/72).

| Mutação | Resultado |
| ------- | --------- |
| Volta `--ring` do claro para o ciano claro | ⨯ 2 falham |
| Volta só `--sidebar-ring` do claro | ⨯ 4 falham |
| `--brand-cyan-dark` vira o `--brand-cyan` puro | ⨯ 4 falham (passa vs fundo, reprova vs `--input`) |
| Devolve `ring-ring/50` ao Button | ⨯ falha |
| Esvazia a allowlist de código morto | ⨯ falha |
| Entrada obsoleta na allowlist | ⨯ falha |

Cinco fatos medidos, e os três primeiros **corrigem o candidato**:

1. **A prescrição do BACKLOG estava invertida.** "Dar a `--ring` um par próprio no `.dark`" — mas o `.dark` é justamente o que já estava certo (7.93:1 vs fundo, 5.18:1 vs `--input`). Quem reprovava era o `:root`: **1.85:1** e **1.49:1**. O tema escuro acertava por acidente de o mesmo ciano claro servir aos dois papéis.
2. **`focus-visible:border-ring` é no-op em 5 das 6 variantes de `Button`.** Ele pinta só a *cor* da borda; o preflight do Tailwind deixa `border-width: 0`, e `default`/`destructive`/`secondary`/`ghost`/`link` não declaram borda. Com `outline-none` no lugar, o halo de 50% era o indicador **inteiro**. Isso eleva a severidade do F5: não era "anel fraco", era "foco invisível em todo botão".
3. **O alfa fazia parte do defeito, não só o valor.** Composto a 50% sobre branco, **nenhum** tom da família ciano da marca alcança 3:1 — teto medido ~3.08:1 e só com um azul quase preto. Por isso a fatia mexeu na opacidade (`ring-ring/50` → `ring-ring`), contra a letra do BACKLOG ("manter"), que fora escrita para impedir a absorção da `.focus-ring-brand` do ctfinance — não para proibir que o alfa fosse examinado.
4. **Um terceiro idioma de foco apareceu, e é código morto.** `ui/navigation-menu.tsx` usa `ring-ring/10 dark:ring-ring/20` + `outline-ring/50` — pior que o de 50%. Ficou de fora porque a cadeia `app-header-layout → app-header → navigation-menu` é **órfã** (nada importa o layout). Isso **soma 3 arquivos à lista do E27** e entrou como allowlist verificada nos dois sentidos.
5. **`--ring` é o único token que troca de família entre os temas.** Ciano escuro no claro, ciano claro no escuro — ele contrasta com o canvas, então acompanha o inverso dele. Registrado em `.ai/rules/css.md` para ninguém "corrigir" a assimetria depois.

### ⚠️ Trap de método paga nesta fatia — mutação sem backup destrói trabalho

A passada de mutação usou `git checkout -- <arquivo>` para reverter cada mutação. Como a fatia ainda **não estava commitada**, o `checkout` restaurou o HEAD e apagou as edições reais junto com a mutação — três edições do `app.css` tiveram de ser refeitas. **Regra para as próximas fatias:** mutar só depois de commitar, ou copiar o arquivo para o scratchpad antes de mutar. Vale para toda a rodada.

### F22 — o que entrou (2026-08-12)

6 call sites (`user-table-row`, `users/index`, `users/permissions`, `users/show`) + `resources/js/test/components/link-button-nesting.test.ts` (novo) + 2 testes de DOM em `user-table-row.test.tsx` + `.ai/rules/js.md`. PR [#74](https://github.com/Simplify-Technology/boilerplate/pull/74).

| Mutação | Resultado |
| ------- | --------- |
| Devolve o aninhamento em `index.tsx` | ⨯ 2 falham |
| Tira o `asChild` do Button do `user-table-row` | ⨯ 3 falham (fonte + DOM) |
| Mock do `Link` volta a descartar as props | ⨯ 2 falham |

Dois fatos que valem para as próximas fatias de frontend:

1. **O mock de `@inertiajs/react` era cego às props.** `Link: ({ children }) => <a href="#">{children}</a>` descartava tudo — className, `aria-label`, `ref`. Qualquer teste escrito sobre ele para provar que o Slot do Radix repassa props teria passado verde **sem provar nada**. Corrigido no mesmo commit; vale conferir esse padrão nos outros mocks antes de escrever teste de `asChild`.
2. **O contador do candidato bateu exato** (6 pontos, os 6 path:linha) — a lente já havia dito "nenhum fato errado" nesta entrada, e a aplicação confirmou. É a primeira entrada da rodada em que isso acontece.

### ⚠️ Trap grave: o worktree principal carrega trabalho não commitado do dono

O worktree do boilerplate tem, desde o início desta rodada, **duas modificações não commitadas do dono** que não são da harvest: `docs/migration/PLAYBOOK.md` e `docs/migration/projects/transitado-em-julgado.md` (do outro playbook, o de migração). Elas atravessam todas as trocas de branch das fatias.

Nesta invocação um `git checkout origin/main -- .` (feito para inspecionar arquivos de outro branch) **sobrescreveu as duas** junto com o resto da árvore. Recuperado na íntegra, mas por sorte: o `lint-staged` grava um stash de backup do estado ORIGINAL a cada commit — `git show --stat <sha>` naqueles "Backing up original state… (<sha>)" mostra o conteúdo, e `git restore --source=<sha> --worktree <paths>` traz de volta.

**Regras que saem daí, para o resto da rodada:**

- **Nunca** usar `git checkout <ref> -- .` nem `git reset --hard` no worktree principal. Para ler arquivo de outro ref, `git show <ref>:<path>`.
- Restaurar sempre por caminho explícito (`git restore --source=<ref> --worktree <path>`), nunca por `.`.
- Antes de qualquer operação de árvore inteira, conferir `git status --short` e tratar tudo que não é da fatia como intocável.
- O SHA do backup do `lint-staged` aparece na saída do próprio `git commit` — vale copiar para o STATE quando a fatia tiver diff grande.

### ⚠️ Trap de ambiente: zsh não faz word-splitting

A 1ª passada de mutação do F22 **não mediu nada e pareceu verde**: a função de teste recebia os caminhos numa variável (`vitest run $T`), e no zsh `$T` sem aspas **não** se divide em palavras — o vitest recebeu um argumento único inválido, não achou arquivo e o grep voltou vazio. Só a ausência total de saída denunciou. **Regra:** em script de mutação, caminhos literais ou array (`${(z)T}`/`"${T[@]}"`), nunca `$T` cru — e sempre imprimir a linha de baseline antes da primeira mutação, que é o que torna o silêncio visível.

### F42+F35 — o que entrou (2026-08-12)

`resources/views/errors/500.blade.php` + `app.blade.php` + `tests/Unit/Theme/InlineThemeBackgroundTest.php` (reescrito) + 5 testes novos em `ErrorPagesTest.php` + `.ai/rules/views.md` (novo — não havia glob para `resources/views/**`) + `index.md`. PR [#76](https://github.com/Simplify-Technology/boilerplate/pull/76).

| Mutação | Resultado |
| ------- | --------- |
| Fundo escuro do 500 volta ao slate-900 | ⨯ falha |
| Só a regra do `@media` (system) diverge | ⨯ falha |
| Fundo escuro do `app.blade` diverge | ⨯ falha |
| Fundo escuro do `app.blade` vira `var()` | ⨯ 2 falham |
| 500 ignora `$appearance` | ⨯ 5 falham |
| 500 sem allowlist de valores | ⨯ 5 falham |
| Tira o `color-scheme` escuro do `app.blade` | ⨯ falha |
| Tira o `color-scheme` da regra `.dark` do 500 | ⨯ falha |
| Tira o `color-scheme` claro do 500 | ⨯ falha |

Quatro fatos, e o primeiro é o mais importante da rodada até aqui:

1. **⚠️ "O texto aparece no bloco?" NÃO é guarda — e o BOILERPLATE já tinha uma assim.** A guarda do D4 perguntava `str_contains($style, $token)`. No `app.blade.php` isso funcionava por acidente (o hex aparece uma vez só); no 500 o mesmo hex aparece como `color` do tema CLARO, então a guarda passava verde **com o fundo escuro apontando para o slate-900**. O mesmo vale para `color-scheme: dark`, satisfeito pela ocorrência dentro do `@media`. **Quatro das nove mutações só passaram a morder depois de a guarda achatar as regras e medir a declaração da regra certa.**

   **Auditei as demais guardas da rodada antes de generalizar o alarme — e o recorte é mais estreito do que parecia.** As guardas *proibitivas* (`expect(offenders).toEqual([])`: `focus-ring`, `theme-tokens`, `link-button-nesting`, `impersonation-call-sites`) são sãs por construção — falso positivo é seguro e todas têm controle positivo contra glob quebrado. A maioria dos `toContain` do repo é sobre **array** (middleware de rota, nomes de permissão, comandos do Artisan), que é pertinência exata, não substring. O padrão frágil é específico: **asserção afirmativa de substring sobre um blob de texto com vários itens, onde o needle pode ser satisfeito por um item que não é o alvo.** Instâncias confirmadas: a guarda do D4 (corrigida aqui) e `HorizonAccessTest:38-39`, que assere `*/5 * * * *` e `horizon:snapshot` **independentemente** sobre a saída inteira do scheduler — as duas podem vir de linhas diferentes. Pequena, pré-existente, registrada; não abri fatia.
2. **O F42 era maior que a cor.** O candidato dizia "pinta fundo escuro diferente"; o defeito de verdade é que o 500 decidia por `prefers-color-scheme` enquanto o app decide por CLASSE — quem escolheu escuro com o SO em claro recebia página branca. Custo zero de resolver: `$appearance` já vinha por `View::share` do `HandleAppearance` e o cookie está fora do `encryptCookies`.
3. **O F35 não precisava de JS.** O candidato pedia atualizar o `<meta>` na troca de tema. Preso à classe `.dark` no mesmo bloco inline, o `color-scheme` acompanha de graça, já no primeiro paint, e não há estado para dessincronizar.
4. **`errors/500.blade.php` é a única página que roda sem o `app.css`** — o `catch` de `bootstrap/app.php:65` existe para manifest/build quebrado. Isso a coloca na MESMA classe do `<style>` inline do `app.blade.php`, e é o que justifica os literais duplicados nos dois.

### ⚠️ Três traps de ferramenta pagas nesta fatia

- **Blade compilado em cache falseia mutação nos dois sentidos.** Uma mutação aplicada continuou "verde" e, pior, o estado **restaurado** continuou vermelho: o Laravel servia o `.php` compilado de `storage/framework/views`. Em fatia que toca blade, `php artisan view:clear` antes de CADA rodada — está embutido na função de teste do script de mutação.
- **`toContain` do Pest trata o 2º argumento como OUTRO needle, não como mensagem.** Custou dois ciclos vermelhos. Asserção com explicação vai por `expect(str_contains(...))->toBe(true, "…")` / `expect(in_array(...))->toBe(true, "…")`.
- **Comentário Blade citando uma tag quebra extrator por regex.** O comentário novo do 500 escrevia `<style>` em prosa e o `preg_match` mordeu a citação, devolvendo "CSS" que continha o que o comentário dissesse — e o teste passou verde por isso. O extrator agora remove `{{-- … --}}` antes de procurar a tag.

### F23 — o que entrou (2026-08-12)

3 `<button>` (`appearance-tabs`, `data-table/filter-toggle`, `ui/sidebar` rail) + `react/button-has-type` como `error` no `eslint.config.js`. PR [#78](https://github.com/Simplify-Technology/boilerplate/pull/78).

| Mutação | Resultado |
| ------- | --------- |
| Tira o `type` do `filter-toggle` | ⨯ lint aponta arquivo e linha |
| Desliga a regra e repete a mutação | ✓ passa — prova que é a regra que cobra |

Três notas:

1. **A contagem do candidato (3) estava certa; a minha primeira medição (6) é que estava errada** — grep de linha acha `<button` sem ver o `type=` que vem duas linhas abaixo. Só um scanner que recorta a tag de abertura inteira responde a pergunta.
2. **Severidade menor que o rótulo sugere: é latente, não bug vivo.** Nenhum dos três vive dentro de `<form>` hoje (`settings/appearance.tsx` e `users/index.tsx` não têm formulário; o rail fica no shell). O valor está na regra, não nos três atributos — registrado assim no PR para não vender conserto que não houve.
3. **Sem entrada em `.ai/rules`, de propósito.** O ESLint é o teste e falha o gate; prosa em paralelo criaria segunda fonte para o mesmo fato. Primeira fatia da rodada que fecha sem tocar em `.ai/rules`, e o motivo vale como precedente.

## Próxima unidade

~~**F1**~~ ✅ PR #70 · ~~**F5**~~ ✅ PR #72 · ~~**F22**~~ ✅ PR #74 — **todos mesclados pelo dono em 2026-08-12**. Reconciliação da 4ª invocação: zero PR aberto, zero fatia em andamento, e os 7 SHAs das fontes seguem idênticos aos pinados (sem drift na rodada).

~~**F42+F35**~~ ✅ aplicados juntos — PR [#76](https://github.com/Simplify-Technology/boilerplate/pull/76) aberto.

**Fatia F3 — trio `--state-{status}-{bg,fg,border}`.** É a próxima unidade grande e a mais destravante: tem catraca esperando no teste do F1 (`destructive` escuro parado em 3.67:1), é pré-requisito da metade visual do E6 (sem ele o `InputError` regride ao trocar de className) e o F2 (os 6 pares `--color-success/warning/info` que nunca foram exportados, com call-site vivo em `user-actions-menu.tsx:125`) viaja junto. M, risco médio. **Não copiar os percentuais do ctfinance** — a aritmética já foi refeita e 3 dos 4 reprovam na paleta daqui; os `fg` entram como HEX literais derivados de alvo calculado.

~~**F23**~~ ✅ aplicado — PR [#78](https://github.com/Simplify-Technology/boilerplate/pull/78). **Alternativa barata se a unidade tiver de ser curta:** **F32** (animação de toast é CSS morto — `react-hot-toast` 2.6.0 não emite `data-state` nem `data-icon`; poda autossuficiente).

**F3 segue subindo:** tem catraca esperando no teste do F1 (`destructive` escuro em 3.67:1) e destrava a metade visual do E6. É M/risco médio — a próxima unidade "grande" natural.

Fila com as metades visuais pareadas: **E6+F-input-error** · **E14+E15+F13** · **E12+E21+F12** · **E30** · **E22+E24** · **E18+E23+E25+F21** · **E27+E29** (agora **+3 arquivos**: `navigation-menu`, `app-header`, `app-header-layout`, achados no F5) · **F7** (cor de marca — decisão do dono).

**F3 subiu de prioridade:** ele agora tem uma catraca esperando por ele no teste do F1, e destrava a metade visual do E6 (sem o F3, o E6 entra sem a troca de className, senão regride).

Fila com as metades visuais pareadas: **E6+F-input-error** · **E14+E15+F13** · **E12+E21+F12** · **E30** · **E22+E24** · **E18+E23+E25+F21** · **E27+E29** · **F7** (cor de marca — decisão do dono).

~~Ordem antiga~~: **E14+E15** (`empty-state.tsx`) · **E21+E12** (`delete-confirmation-dialog.tsx`) · **E30** (`delete-user.tsx`, bug que todo derivado tem) · **E22+E24** (landmark + skip-link) · **E6+E20** (ARIA de campo) · **E23** · **E18** · **E27+E29** (limpeza de código morto).

~~**Fatia E17**~~ ✅ aplicada — PR #66 aberto. Justificativa que valeu e segue valendo para a fila acima: Prioridade 1 do protocolo (fatia de aplicação pronta), e a fila de P deixou de estar seca: a dimensão 5 entregou 20 candidatos P de risco baixo.

Por que E17 primeiro entre eles: é o único **bug de disponibilidade** da leva (`/users?sort_order=<lixo>` → 500, `Builder.php:2985-2993`), a correção já existe pronta no ctfinance (`RecurringExpense/IndexController.php:94-103`, absorção verbatim), é backend puro com teste de negação natural (fecha a Definition of Done sem depender de gate de browser), e é **pré-requisito do E19**.

Fila sugerida depois dele, todos P e agrupados por arquivo para manter o PR pequeno: **E14+E15** (`empty-state.tsx`) · **E21+E12** (`delete-confirmation-dialog.tsx`) · **E30** (`delete-user.tsx`, bug que todo derivado tem) · **E22+E24** (landmark + skip-link) · **E6+E20** (ARIA de campo) · **E23** · **E18** · **E27+E29** (limpeza de código morto).

Varredura só volta a ser a unidade mais rentável quando essa fila de P secar. **Não abrir a dimensão 6 (UI) antes** — ela está represada pelos ponteiros que a dimensão 5 já acumulou e cresce de valor esperando.

## Vereditos das dimensões 1–3 (ctfinance)

20 candidatos levantados, 3 lentes adversariais cada (refutar / risco de absorção / atualidade via `search-docs`). **Nenhum passou intacto** — 15 sobreviveram com escopo reduzido, 3 foram derrubados por lente, 2 eram direção inversa. O escopo corrigido está no BACKLOG; fatia que reabrir o escopo original está errada.

Correções mais importantes que as lentes trouxeram:

1. **`Auth::logoutOtherDevices()` não encerra sessão nenhuma** sem o middleware `AuthenticateSession` (`SessionGuard.php:740-777`). As 3 lentes convergiram nisso independentemente. Na origem, o botão grava "Demais sessões foram encerradas." e nada é encerrado.
2. **Tirar `role_id`/`is_active` do `$fillable` sem inverter o modo de falha antes é fail-OPEN**: `handleDiscardedAttributeViolationUsing` só faz `report()` em produção (`AppServiceProvider.php:81-89`), então `revokeRole` e `toggleActive` virariam no-op silencioso. São 8 call sites, não 3.
3. **`Rule::exists()->where()` já é o nativo** para FK escopada por dono — não criar `ValidationRule` nova.
4. Metade do candidato de idempotência já é `Builder::createOrFirst()` nativo; a forma da origem tem bug de portabilidade (catch dentro da transação quebra em pgsql).
5. `withPhpSets()` resolve a versão pelo `composer.json`, não pelo runtime — a adaptação proposta estava errada.
