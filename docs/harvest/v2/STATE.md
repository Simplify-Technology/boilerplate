# Harvest v2 — STATE

Estado retomável da rodada. **Toda iteração termina atualizando este arquivo.**

- **Issue-âncora:** #50 · **Branch de estado:** `50-harvest-v2-rodada` · **Worktree:** `../boilerplate-harvest-state`
- **Rodada aberta em:** 2026-08-11
- **Direção:** projetos → boilerplate (inverso do PLAYBOOK de migração)
- **Situação:** Fase 0 concluída · varredura em andamento · **as 4 primeiras fatias (A1, A3, A6, D2) MESCLADAS em 2026-08-11**

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
| 1 | ctfinance | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 2 | spinmax | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | sorteiopix | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | ctjuris | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | ctvitrine | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | cuidari | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | transitado-em-julgado | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Progresso:** 6/70 células (8,6%) · BACKLOG: **7 aplicados (A1, A3, A6, D2, D3, D4, D5)**, 1 realocado (A2), **38 aplicáveis** (8 de dim. 1–3 + **30 de dim. 5: E1–E30**), 7 adiados, **10 rejeitados**, 9 sem veredito (dim. 4), 1 achado interno (C1), **2 `[dep-nova]` novos** (`jest-axe`, `knip`), **1 decisão de arquitetura pendente do dono** (flash nativo do Inertia 3.6)

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

**Reconciliação de 2026-08-11 (2ª invocação):** `gh pr list` mostrou **#64 já mesclado** — o STATE dizia "aguardando merge". Corrigido acima antes de executar qualquer unidade. Seguem abertos só **#60 (D5)** e **#62 (D4)**. `main` local avançada para `9814f46`.

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

**Canal de flash.** O Inertia 3.6 tem flash nativo (`Inertia::flash()` + `Page['flash']` + `router.on('flash')`); o boilerplate reimplementa com `->with()` + prop no `share()` + `use-flash-messages.tsx` + 9 chamadas por página. Migrar resolve E2 **e** E13 de uma vez e apaga o hook caseiro. Não conflita com ADR vigente — é escolha ainda não registrada. **Nenhuma fatia de flash abre antes dessa decisão.** Alternativa conservadora registrada no BACKLOG.

Segue pendente, de antes: a **fatia única de `.ai/rules`** juntando A2, A7, A9, A12, B4 e B6 (guard-rails sem superfície executável no boilerplate hoje).

## Próxima unidade

**Fatia E17 — `sort_order`/`per_page` crus em `User/IndexController`.** Prioridade 1 do protocolo (fatia de aplicação pronta), e a fila de P deixou de estar seca: a dimensão 5 entregou 20 candidatos P de risco baixo.

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
