# Harvest v2 — STATE

Estado retomável da rodada. **Toda iteração termina atualizando este arquivo.**

- **Issue-âncora:** #50 · **Branch de estado:** `50-harvest-v2-rodada` · **Worktree:** `../boilerplate-harvest-state`
- **Rodada aberta em:** 2026-08-11
- **Direção:** projetos → boilerplate (inverso do PLAYBOOK de migração)
- **Situação:** Fase 0 concluída · varredura em andamento (9/70 células) · **21 fatias MESCLADAS** (A1, A3, A6, D2, D3, D4, D5, E17, E2+E13, F1, F5, F22, F42+F35, F23, S1, S2, S4, S5, C4, S3, E6+E20) · **2 PRs abertos, ambos MERGEABLE após merge de `main`** (#94 estado vazio com saída, #96 diálogo controlado)

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
| 2 | spinmax | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 3 | sorteiopix | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 4 | ctjuris | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 5 | ctvitrine | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | cuidari | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | transitado-em-julgado | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Progresso:** 9/70 células (13%) · BACKLOG: **27 aplicados (A1, A3, A6, D2, D3, D4, D5, E17, E2, E13, F1, F5, F22, F42, F35, F23, S1, S2, S4, S5, C4, S3, E6, E20, E14, E15, E30)**, 1 realocado (A2), **~110 aplicáveis** (8 de dim. 1–3 · 27 de dim. 5 · **69 de dim. 6: F1–F42 + secagem** · 11 da dim. 1 do spinmax), 7 adiados, **11 rejeitados**, 9 sem veredito (dim. 4), **4 achados internos (C1, C2, C3, C4)**, **2 `[dep-nova]` novos** (`jest-axe`, `knip`). Decisão do dono sobre o canal de flash: **resolvida em 2026-08-11 (nativo)**.

> **Onde está o quê no BACKLOG:** a dimensão 5 foi APENDADA ao fim do arquivo (E1–E25, depois secagem E26–E30, depois os rejeitados e a §Decisões). As seções de dim. 1–4 continuam no topo. Ordem do arquivo ≠ ordem de prioridade.

**Baseline de gates em `main` com as 4 fatias mescladas combinadas** (medido 2026-08-11, primeira vez que rodaram juntas): `composer ci:check` 311 testes / 1678 asserções, `corepack pnpm ci:check` 25 arquivos / 158 testes. Ambos exit 0.

### Inventário do spinmax — célula 0 ✅ (2026-08-12)

`docs/harvest/v2/spinmax.md` (210 KB). Produzido por **workflow de 9 agentes** (8 frentes paralelas + crítico de completude), 0 erros, ~966k tokens de subagente, 289 chamadas de ferramenta, ~17 min. Read-only integral: nenhum comando de escrita ou execução tocou o projeto-fonte, e o `.env` nunca foi aberto (só o `.env.example`).

**Varredura por segredo antes do commit** (o `docs/harvest/` é commitado): zero e-mail real, CPF, CNPJ, telefone, JWT, chave AWS, chave privada ou URL com credencial. 15 redações `***` feitas pelos próprios agentes; a senha de dev do `UserSeeder` está redigida na origem.

**O crítico de completude pagou o próprio custo, e caro.** Ele achou superfície inteira que as 8 frentes não enumeraram — e **derrubou 12 números**. Os corrigidos entraram num banner no TOPO do inventário, porque quem consome a célula não pode herdar contagem errada. O caso mais grave não é numérico: uma frente afirmou que a landing é "Blade pura, sem JS"; são **593 linhas de JS vanilla em 5 blocos inline**, fora do Vite, do ESLint e do Vitest.

Nota de método que vale para os 5 inventários restantes: **frente paralela erra contagem com frequência alta** (12 erros em 8 frentes), quase sempre por contar o texto que ela mesma escreveu em vez do disco. O crítico não é opcional.

### Ponteiros do inventário do spinmax (fatos verificados, ainda SEM veredito)

| # | Fato verificado no código @ `e4ec01e` | Dimensão dona |
| - | ------------------------------------- | ------------- |
| 1 | `POST users/impersonate` tem só `throttle:10,1`, **sem `can:`** (`routes/web.php:87`) — o mesmo furo do ctfinance, em segundo projeto | 1 — confirma o guard-rail A1 já mesclado |
| 2 | **9 throttles inline com número literal** e zero limiter nomeado além de `mp-webhook`; `POST login` (`routes/auth.php:18`) e `POST logout` (`:52`) **sem throttle nenhum** | 1 — guard-rail |
| 3 | Webhook MP: HMAC (`x-signature` + `x-request-id` + `dataId` + secret + tolerância de 300s), `WebhookEvent` para idempotência, job em fila, `PROCESSABLE_TOPICS` fechado, 401 em assinatura inválida | 1/3 — **tema multi-fonte "webhooks"** |
| 4 | 7 tarefas agendadas em `routes/console.php` e **zero `onOneServer`/`runInBackground` no repositório inteiro**; só uma declara timezone | 3 — guard-rail |
| 5 | `User/IndexController.php:32-37` esconde contas `super_user` do cliente — regra por **cargo**, não por e-mail, travada por `MaintenanceAccountsHiddenTest` | 1/2 — candidato |
| 6 | `resources/views/landing.blade.php`: 2.090 linhas, **593 de JS vanilla inline** fora de Vite/ESLint/Vitest, usando a **mesma chave `appearance`** do painel | 4/8 — guard-rail forte |
| 7 | `routes/settings.php:20` define `settings/appearance` como **closure** — única rota do projeto sem controller | 2 — guard-rail |
| 8 | `DELETE settings/profile` → `profile.destroy`: autoexclusão de conta | 1/5 — candidato |
| 9 | `public/site.webmanifest` é o **terceiro** lugar onde os hex da marca são declarados, fora do alcance do `scripts/check-contrast.mjs` | 6 — guard-rail |
| 10 | `app/Traits/Models/HasRolesAndPermissions.php` faz `json_decode($permission->pivot->meta)` cru; o boilerplate tem `app/Models/PermissionUser.php` para isso | 2 — direção inversa (o boilerplate é superior) |
| 11 | `tests/Feature/Auth/RegistrationTest.php` **trava a AUSÊNCIA** do registro público (404 em `GET`/`POST /register`) | 2 — candidato de método |
| 12 | `MaintenanceModeTest` injeta uma classe anônima `MaintenanceMode` no container em vez de escrever `storage/framework/down` — teste que morresse no meio prenderia a app local em 503 | 2 — candidato de método |

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
| **S1** — fix(seguranca): teto de PII no `UserResource` | [#79](https://github.com/Simplify-Technology/boilerplate/issues/79) | `79-harvest-v2-teto-pii-resource` | ✅ 10 testes + 4 mutações | ✅ ambos exit 0 (374/1931 · 30/204) | [#80](https://github.com/Simplify-Technology/boilerplate/pull/80) | ✅ **MESCLADO** 2026-08-12 |
| **S2** — fix(rbac): teto de concessão nos 3 caminhos de permissão | [#81](https://github.com/Simplify-Technology/boilerplate/issues/81) | `81-harvest-v2-teto-concessao-permissao` | ✅ 12 testes + **7 mutações** | ✅ ambos exit 0 (395/1977 · 30/204) | [#82](https://github.com/Simplify-Technology/boilerplate/pull/82) | ✅ **MESCLADO** 2026-08-12 |
| **S4** — test(auth): prova que o lockout do login morde | [#83](https://github.com/Simplify-Technology/boilerplate/issues/83) | `83-harvest-v2-lockout-login` | ✅ 7 testes + **7 mutações** | ✅ ambos exit 0 (390/1969) | [#84](https://github.com/Simplify-Technology/boilerplate/pull/84) | ✅ **MESCLADO** 2026-08-12 |
| **S5** — test(auth): alcance do `EnsureUserIsActive` | [#85](https://github.com/Simplify-Technology/boilerplate/issues/85) | `85-harvest-v2-alcance-usuario-inativo` | ✅ 4 testes + 3 mutações | ✅ ambos exit 0 (394/1984) | [#86](https://github.com/Simplify-Technology/boilerplate/pull/86) | ✅ **MESCLADO** 2026-08-12 |
| **C4** — fix(auth): limite no `confirm-password` | [#87](https://github.com/Simplify-Technology/boilerplate/issues/87) | `87-harvest-v2-limite-confirm-password` | ✅ 5 testes + 5 mutações | ✅ ambos exit 0 (395/1982) | [#88](https://github.com/Simplify-Technology/boilerplate/pull/88) | ✅ **MESCLADO** 2026-08-12 |
| **S3** — fix(lgpd): objeto e chave composta no scrubber | [#89](https://github.com/Simplify-Technology/boilerplate/issues/89) | `89-harvest-v2-scrubber-objeto-e-chave-composta` | ✅ 5 testes + 5 mutações | ✅ ambos exit 0 (416/2046) | [#90](https://github.com/Simplify-Technology/boilerplate/pull/90) | ✅ **MESCLADO** 2026-08-12 |
| **E6+E20** — fix(a11y): erro anunciado + fusão de ARIA | [#91](https://github.com/Simplify-Technology/boilerplate/issues/91) | `91-harvest-v2-erro-anunciado` | ✅ 9 testes + 5 mutações | ✅ ambos exit 0 (31/212) | [#92](https://github.com/Simplify-Technology/boilerplate/pull/92) | ✅ **MESCLADO** 2026-08-12 |
| **E14+E15** — fix(ux): estado vazio com saída + metade visual | [#93](https://github.com/Simplify-Technology/boilerplate/issues/93) | `93-harvest-v2-vazio-com-saida` | ✅ 7 testes + 5 mutações | ✅ ambos exit 0 (31/211) | [#94](https://github.com/Simplify-Technology/boilerplate/pull/94) | **aguardando merge do dono** |
| **E30** — fix(ux): diálogo de excluir conta controlado | [#95](https://github.com/Simplify-Technology/boilerplate/issues/95) | `95-harvest-v2-dialogo-controlado` | ✅ 5 testes + 4 mutações | ✅ ambos exit 0 (31/209) | [#96](https://github.com/Simplify-Technology/boilerplate/pull/96) | **aguardando merge do dono** |

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

### S1 — o que entrou (2026-08-12)

`app/Policies/UserPolicy.php` (`viewSensitive`) + `app/Http/Resources/UserResource.php` + `tests/Feature/User/UserResourceSensitiveCeilingTest.php` (novo, 10 testes) + `.ai/rules/resources.md`. PR [#80](https://github.com/Simplify-Technology/boilerplate/pull/80).

**Primeira correção de segurança real da rodada** — as anteriores eram guard-rail ou defeito de UI. Um `manager` (70) lia CPF, telefones e notas internas do `admin` (90) em claro, em 5 controllers, sem nenhum teste tocando o resource.

| Mutação | Resultado |
| ------- | --------- |
| Campos sem condicional (o defeito original) | ⨯ 3 falham |
| Teto frouxo: prioridade maior **ou igual** | ⨯ 3 falham |
| "A si mesmo" medido na **persona**, não no humano | ⨯ falha |
| Sem a checagem de `manage_users` | ⨯ falha |

**⚠️ As duas últimas passaram VERDES na primeira passada — e são o achado de método da fatia.** Escrevi 8 testes que cobriam o defeito de todos os ângulos que eu tinha imaginado, e mesmo assim:

1. Trocar `effectiveActor($user)->id` por `$user->id` na regra de "a si mesmo" **não quebrava nada** — e é escalada: um gerente vestindo um administrador leria o CPF desse administrador, porque a persona é o próprio alvo. O caso que discrimina exige persona ACIMA do humano, que nenhum dos 8 testes montava.
2. Apagar a checagem de `manage_users` **não quebrava nada** — o único negativo existente (`viewer` 10 × `manager` 70) já era barrado pela prioridade. Separar as condições exige ator sem a permissão e ACIMA do alvo (`viewer` 10 × `visitor` 5).

Generalização para o resto da rodada: **teste de teto com duas condições (permissão E prioridade) precisa de um caso onde cada uma falha SOZINHA.** Cobertura que só usa o alvo "óbvio" prova uma condição e finge provar duas.

### S2 — o que entrou (2026-08-12)

`app/Traits/Models/HasRolesAndPermissions.php` (`permissionsBeyondOwn()`) + `app/Policies/UserPolicy.php` (`mutatePermissions` com `$granting` + `grantsWithinOwnSurface`) + `app/Enum/Permissions.php` (`grantDenialMessage()`) + os 3 call sites (`SyncPermissions`, `GrantPermission`, `RevokePermission`) + `PermissionRole/UpdateController` perdendo a cópia própria da regra + `tests/Feature/Policies/PermissionGrantCeilingTest.php` (novo, 12 testes) + `.ai/rules/policies.md` (3 seções) e `controllers.md` (1 linha). PR [#82](https://github.com/Simplify-Technology/boilerplate/pull/82). Stash de backup do lint-staged: `ef34352`.

**Registrado como NÃO-escalada, de propósito** — a requalificação do BACKLOG confere no código: `sync()` grava IDs sem pivô, `meta` fica nulo, `canImpersonateAny()` é falso, e o gerente promovido só alcança < 70, que o admin já alcançava trocando senha. O ganho é consistência e trilha de auditoria, e o PR diz isso em vez de vender conserto que não houve.

| Mutação | Resultado |
| ------- | --------- |
| Policy sem o teto de conteúdo (o defeito original) | ⨯ 4 falham |
| Superfície medida na **persona**, não no humano | ⨯ 2 falham |
| Sem o bypass do `super_user` | ⨯ falha |
| Superfície só do **cargo**, ignorando as avulsas | ⨯ falha |
| `permissionsBeyondOwn` sempre vazio | ⨯ **6 falham, nos dois caminhos** |
| Recusa muda, sem nomear a permissão | ⨯ falha |
| Revogação tratada como concessão | ⨯ falha |

**Achado de método: exceção que a matriz padrão nunca exercita é indistinguível de código morto.** O bypass do `super_user` sobreviveu à 1ª passada de mutação — e não porque o teste fosse fraco, mas porque no `PermissionRoleSeeder` o suporte tem TODAS as permissões, então o teto nunca morde nele e tirar o bypass não muda resultado nenhum. O caso que discrimina exige um `super_user` com o **próprio cargo aparado** — situação alcançável pelo painel, provada pelo `UpdateControllerTest`. Generalização: ao testar um bypass, pergunte "o que a matriz padrão faz esta condição valer sozinha?" — se a resposta for "nada", o teste precisa sair da matriz padrão.

**Segunda nota, sobre a própria mutação:** a mutação nº 6 (recusa muda) sobreviveu por defeito MEU, não do teste — troquei a frase mas deixei o `%s` do `sprintf`, que seguia interpolando os nomes. Mutação que altera texto de formato precisa atacar o **interpolador**, não a moldura. Vale como par da trap do `preg_match` do F42.

**Dois achados colaterais medidos e registrados no BACKLOG** (C2 e C3), nenhum dos dois entrou na fatia: o catálogo das telas de RBAC não é filtrado pela superfície de quem olha (as duas telas, comportamento anterior a esta fatia), e desmarcar/remarcar `impersonate_users` no sync apaga o `can_impersonate_any` em silêncio. O C3 foi **medido com teste descartável**, e o palpite inicial estava errado nos dois sentidos — sync que MANTÉM a permissão preserva o pivô; só o par remover+re-adicionar perde.

### S4 — o que entrou (2026-08-12)

`tests/Feature/Auth/LoginLockoutTest.php` (novo, 7 testes) + seção nova em `.ai/rules/routes.md`. Zero linha de app tocada — é guard-rail puro. PR [#84](https://github.com/Simplify-Technology/boilerplate/pull/84).

| Mutação no `LoginRequest` | Resultado |
| ------------------------- | --------- |
| Sem o `ensureIsNotRateLimited()` | ⨯ 3 falham |
| Checagem **tarde**, depois do `Auth::attempt()` | ⨯ 3 falham |
| Chave só por **IP** | ⨯ falha |
| Chave só por **e-mail** | ⨯ falha |
| Sem o `RateLimiter::clear()` | ⨯ falha |
| Limite frouxo (5 → 50) | ⨯ 3 falham |
| Sem o `event(new Lockout(...))` | ⨯ falha |

**Trap de mutação paga aqui, e é irmã da do F42:** as mutações de chave mataram **7 testes cada** na 1ª passada. O `// MUTACAO` comia o `);` da chamada e virava erro de sintaxe — o arquivo morria inteiro, não a propriedade. Refeitas com `/* */`, matam **exatamente 1** cada. **Regra: mutação com sinal amplo demais para o que ela muda é mutação a auditar, não evidência a comemorar.** A do F42 era o mesmo erro na direção oposta (comentário citando tag enganava o extrator e deixava VERDE).

**Correção de fato feita antes do commit:** eu havia escrito "login é a única rota de autenticação sem throttle". Falso — `POST logout` e `POST confirm-password` também não têm. A afirmação correta, e a que entrou no código e na regra, é "única do grupo `guest`".

**Achado colateral registrado (C4):** `POST confirm-password` não tem throttle de rota **nem** limiter próprio no controller — sessão sequestrada chuta a senha do dono à vontade para abrir as áreas de `password.confirm`. É o mesmo segredo do login, defendido de um lado e não do outro. Fatia própria.

### S5 — o que entrou (2026-08-12)

4 casos novos em `tests/Feature/EnsureUserIsActiveTest.php` + correção de fato em `.ai/rules/middleware.md`. Zero linha de app. PR [#86](https://github.com/Simplify-Technology/boilerplate/pull/86).

| Mutação | Resultado |
| ------- | --------- |
| Fora do grupo `web`, nada no lugar | ⨯ 5 falham |
| Só no grupo autenticado de `routes/web.php` (**a forma do spinmax**) | ⨯ 4 falham |
| Declarado nos **três** arquivos de rota, fora do grupo | ⨯ **exatamente 2** (rota sem `auth` + estrutural) |

**O gradiente é o achado.** As três mutações matam quantidades diferentes, e a terceira é a que justifica os dois últimos casos: declarar o middleware nos três arquivos deixa verdes os três testes "por arquivo" e já quebrou a promessa — o próximo `routes/*.php` nasce descoberto. Guard-rail de ALCANCE precisa de um caso que não seja "mais uma rota"; precisa de um caso sobre a FORMA da declaração.

**⚠️ Regra nova, e é dívida que a rodada mesma criou:** `.ai/rules/middleware.md` ainda descrevia `flash` como prop compartilhada lida com `session()->pull()` — contrato desfeito pela fatia E2+E13 (PR #68, mesclada em 2026-08-11). Aquela fatia atualizou `controllers.md` e `js.md` e deixou `middleware.md` afirmando algo falso por 4 fatias. **Fatia que muda um contrato tem de varrer `.ai/rules` INTEIRO por menções ao contrato antigo** (`grep -rn "<termo>" .ai/rules/`), não só os arquivos que ela edita. Corrigido nesta fatia, com a lista real do `share()` (`name`, `quote`, `auth`, `ziggy`).

**Segunda correção, minha, dentro da própria fatia:** a primeira versão da regra nova citava `tests/Feature/Inertia/SharedPropsContractTest.php`, caminho que não existe — o arquivo é `tests/Feature/SharedPropsTest.php`. Peguei antes do commit. Ponteiro para arquivo em regra é afirmação verificável como qualquer outra: `ls` antes de escrever.

### C4 — o que entrou (2026-08-12)

`RateLimiter::for('password-confirmation')` no `AppServiceProvider` + `throttle:password-confirmation` na rota + 5 testes em `AuthRouteThrottleTest` + 2 entradas em `.ai/rules/routes.md`. PR [#88](https://github.com/Simplify-Technology/boilerplate/pull/88).

**Primeiro achado interno da rodada a virar conserto de segurança real** — os C1–C3 são dívida registrada, este era buraco vivo: `POST confirm-password` conferia a senha do próprio usuário sem teto em lugar nenhum, então sessão sequestrada abria por força bruta tudo que está atrás de `password.confirm`.

| Mutação | Resultado |
| ------- | --------- |
| Rota sem o throttle (o defeito original) | ⨯ 2 falham |
| Limiter chaveado por **IP** | ⨯ falha |
| Limiter **global**, sem chave | ⨯ falha |
| Limite frouxo (6 → 600) | ⨯ falha |
| `throttle:6,1` inline no lugar do nomeado | ⨯ falha |

**Nota de método, e é a terceira vez que a rodada esbarra nela:** o teste "o limite é por usuário, não global" **já passava antes do conserto** — sem limiter nenhum, ninguém tranca ninguém. Teste que passa na ausência da feature não prova a feature; só depois da correção ele passa a discriminar, e são as mutações 2 e 3 que mostram isso. É o mesmo formato do bypass do `super_user` (S2) e do "documenta a ausência" do `AuthRouteThrottleTest` (S4): **verde sem significado é o modo de falha recorrente desta rodada.**

**Achado de varredura que vale registrar:** o levantamento que produziu o C4 ("quais rotas de auth têm limite") custou um `grep` e achou um buraco vivo. Vale repetir a mesma pergunta mecânica por eixo — quais rotas de escrita têm autorização (foi o A1), quais rotas que conferem segredo têm teto (foi este) — em vez de esperar a dimensão certa chegar no projeto certo.

### S3 — o que entrou (2026-08-12)

`app/Support/Logging/PiiScrubber.php` (ramo `Arrayable` + lista de chaves partida em duas + `user_notes`) + 5 casos em `tests/Feature/LogScrubbingTest.php` + seção em `.ai/rules/support.md`. PR [#90](https://github.com/Simplify-Technology/boilerplate/pull/90).

**Era vazamento vivo, não guard-rail** — o BACKLOG classificava S3 como `[guard-rail]` e a medição mostrou coisa maior: `Log::info('x', ['user' => $user])` gravava nome, `cpf_cnpj` **formatado** e `user_notes` em claro. O objeto atravessava o processor intacto e só o formatter do Monolog o serializava, **depois** das duas camadas — por isso vazava até o CPF, que a camada de padrão pegaria numa string comum.

| Mutação | Resultado |
| ------- | --------- |
| Sem o ramo `Arrayable` (o vazamento original) | ⨯ 2 falham |
| Volta à igualdade exata de chave | ⨯ falha |
| **Tudo** por substring, inclusive os ambíguos | ⨯ falha |
| `cep` promovido a substring (come `exception`) | ⨯ falha |
| Sem `user_notes`/`notes` na lista | ⨯ falha |

**O achado que só a auditoria prévia pegaria: `cep` está dentro de "ex`cep`tion".** Promover `cep` a substring apagaria a classe do erro em TODO log de falha — o scrubber destruiria justamente a informação que ia depurar o incidente. Achado antes de escrever a lista, ao procurar cada termo dentro de palavras comuns de log; `rg` (o**rg**anization, ta**rg**et) e `auth` (**auth**or) vieram junto. Virou regra em `.ai/rules/support.md`: **termo novo de substring se procura dentro de palavra comum antes de entrar.**

**Absorção parcial, de propósito:** a forma do spinmax entrou (duas listas + `Arrayable`), os termos de DOMÍNIO dele não (`customer`, `payer`, `holder`, `recipient` apagariam `customer_id` num boilerplate genérico). A lente já tinha marcado "não generaliza" e a medição confirmou.

**Limite medido e documentado, não consertado:** `Throwable` em `['exception' => $e]` é renderizado pelo formatter, fora do alcance de qualquer processor — testei, vaza e-mail na mensagem. Fica como regra de escrita ("não coloque PII em mensagem de exception"), igual à conclusão da própria origem.

### E6+E20 — o que entrou (2026-08-12)

`resources/js/components/input-error.tsx` (`role="alert"` + `data-slot` + guarda de branco) + `ui/date-input.tsx` (fusão de `aria-invalid`) + `test/components/input-error.test.tsx` (novo) + 3 casos em `date-input.test.tsx` + 2 seções em `.ai/rules/js.md`. PR [#92](https://github.com/Simplify-Technology/boilerplate/pull/92). **Primeira fatia de frontend puro da rodada com gate de componente real** (Vitest + Testing Library) — sem depender do `pest-plugin-browser`, que segue `[dep-nova]` represado.

| Mutação | Resultado |
| ------- | --------- |
| Sem `role="alert"` (o defeito original) | ⨯ 3 falham |
| `aria-live="polite"` no lugar (**o remédio do ctfinance**) | ⨯ 3 falham |
| Sem a guarda de string em branco | ⨯ falha |
| `DateInput` redeclara depois do spread (o defeito original) | ⨯ falha |
| `DateInput` só move para antes do spread (**a correção ERRADA**) | ⨯ falha |

**As duas mutações que valem a fatia são as das alternativas plausíveis**, não as do defeito: `aria-live` no lugar de `role="alert"` é o que a origem fez, e mover a declaração para antes do spread é o que qualquer revisor proporia. As duas ficam cobertas por teste — o que impede que a "simplificação" volte num refactor futuro.

### ⚠️ Trap de ferramenta paga aqui: `cd` de invocação anterior vaza para a seguinte

O `git checkout -b 91-...` rodou **no worktree de ESTADO**, porque o `cd` de um comando anterior (a atualização do BACKLOG) tinha deixado o cwd lá. Efeitos: o branch 91 nasceu no worktree errado, a fatia inteira foi commitada em cima do branch do S3 (que tem PR aberto), e o hook de commit-msg prefixou `[89]:` numa mensagem que já dizia `[91]:`. Um `pnpm exec vitest` anterior também rodou no worktree de estado — e disparou `pnpm install` lá.

Consertado sem perder nada: worktree de estado de volta para `50-harvest-v2-rodada`, `git reset --soft HEAD~1` no principal (nunca `--hard`, ver trap do trabalho não commitado do dono), `checkout` do 91 levando o índice, commit e push. **`origin/89` e o PR #90 nunca chegaram a receber o commit intruso** — verificado antes e depois.

**Regras que saem daí:**

- **Todo comando git/pnpm de fatia leva `cd <worktree principal>` explícito**, ou usa `git -C <path>`. Nunca confie no cwd herdado — ele atravessa invocações.
- **Depois de `checkout -b`, confira `git branch --show-current` no worktree que você acha que está usando**, antes de editar arquivo.
- Um commit no branch errado se desfaz com `reset --soft` + `checkout`, que carrega o índice para o branch certo. O `--hard` é que é irreversível.

### ⚠️ A trap do worktree sem hook VIROU: agora o worktree de estado tem hook e ele não passa

O `pnpm install` acidental descrito acima gerou `.husky/_/` no worktree de ESTADO, que até então não tinha hook nenhum (era a trap registrada na Fase 0). Efeito colateral: o `pre-push` passou a rodar lá — e falha, porque o worktree de estado **nunca teve `vendor/`**, então o `composer ci:check` do hook não tem o que executar.

**`SKIP_GIT_HOOKS=1` usado no push do estado de 2026-08-12 (9f8a16b), e registrado aqui conforme o Guardrail 7.** É o caso de exceção previsto — falha de AMBIENTE, não gate vermelho: o diff são 2 arquivos markdown (`BACKLOG.md`, `STATE.md`), o branch de estado nunca toca código (checagem contra a merge-base segue vazia), e os dois `ci:check` rodaram verdes no worktree PRINCIPAL em cada fatia desta invocação (S3: 416/2046; E6+E20: 31/212 · composer exit 0).

Para as próximas invocações: o push do estado precisará do mesmo `SKIP_GIT_HOOKS=1` enquanto o worktree de estado não tiver `vendor/`. A alternativa — rodar `composer install` lá — custa espaço e não compra nada, porque o branch é markdown puro.

### E14+E15 — o que entrou (2026-08-12)

`resources/js/components/empty-state.tsx` (reescrito) + os 2 call-sites (`permissions/role-users-table.tsx`, `pages/users/index.tsx`) + `test/components/empty-state.test.tsx` (novo, 7 testes) + 2 seções em `.ai/rules/js.md`. PR [#94](https://github.com/Simplify-Technology/boilerplate/pull/94).

| Mutação | Resultado |
| ------- | --------- |
| Título volta a ser `<p>`, sem semântica de cabeçalho | ⨯ falha |
| Sem a prop `action` (o beco sem saída original) | ⨯ falha |
| Ícone decorativo sem `aria-hidden` | ⨯ falha |
| Volta o ramo de linha de tabela (o HTML inválido original) | ⨯ falha |
| Sem o `data-testid` | ⨯ falha |

**Conflito entre células resolvido — e desta vez a favor da dimensão 6.** A entrada de dim. 5 mandava NÃO trazer o corpo Tailwind ("é dimensão 6"); a tabela de pareamento produzida depois, pela varredura da 6, reclassificou: a metade visual viaja junto e tem dependência **nenhuma**. Vale a decisão mais recente, que é a informada — o inverso do precedente do `eslint-plugin-jsx-a11y`, onde a rejeição da dim. 5 valeu porque a 6 não refutou o FATO que a sustentava. **Regra que fecha os dois casos: entre células, ganha quem tem o fato verificado, não quem veio depois.**

**Correção minha, pega antes do commit:** ao extrair a condição duplicada para `hasActiveFilters`, escrevi `filters.search !== undefined`, o que faria `search: ''` contar como filtro ativo e mostrar "limpar filtros" numa lista sem filtro. O original é truthy (`filters.search ||`). Voltou para `Boolean(filters.search)`. Extração de condição duplicada é refactor com semântica, não com aparência.

**Nota de método (3ª mutação mal desenhada da rodada, e a mais instrutiva):** a mutação do ramo de tabela produziu JSX inválido e o vitest devolveu **"no tests"** — não uma falha. As três já vistas erram de formas diferentes (`//` comendo o fecho da chamada no S4; `sprintf` ainda interpolando no S2; build quebrado aqui), mas o sintoma é sempre o mesmo: **sinal diferente do vermelho esperado é sinal a auditar.** Vale como checagem fixa: se a linha de resumo não disser "N failed", a mutação não mediu nada.

### E30 — o que entrou (2026-08-12)

`resources/js/components/delete-user.tsx` (diálogo controlado, funil único) + `test/components/delete-user.test.tsx` (novo, 5 testes) + 1 seção em `.ai/rules/js.md`. PR [#96](https://github.com/Simplify-Technology/boilerplate/pull/96).

| Mutação | Resultado |
| ------- | --------- |
| `Dialog` volta a ser não controlado (o defeito original) | ⨯ 3 falham |
| Controlado, mas sem limpar ao fechar | ⨯ 3 falham |
| **Limpeza volta para o botão Cancelar** | ⨯ **exatamente 2** (Esc e X) |
| Limpa o formulário mas não os erros | ⨯ 3 falham |

**A 3ª mutação explica por que o bug sobreviveu tanto tempo:** com a limpeza no Cancelar, o caminho que se testa à mão é justamente o que funciona. Só Esc e X denunciam, e ninguém fecha diálogo de teste com Esc. **Generalização para a fila de UX: em componente com vários caminhos de saída, o teste tem de cobrir os que a mão não usa.**

**Nota sobre o mock:** ele reproduz de propósito a topologia real (estado do `useForm` no COMPONENTE, não dentro do `<Dialog>`) — é isso que faz o erro persistir entre aberturas. Um mock com estado dentro do conteúdo do diálogo passaria verde nos dois lados e não provaria nada. Vale para a fila: mock que não reproduz a topologia do defeito é teste decorativo.

**Detalhe de API confirmado no código:** `onOpenChange` do Radix não dispara quando o `open` muda por código, então o fechamento programático (`onSuccess`) chama o funil explicitamente. Está comentado no arquivo e na regra.

### ⚠️ Trap estrutural: PR de frontend em paralelo SEMPRE conflita em `.ai/rules/js.md`

Com #90 e #92 mesclados, os dois PRs que restavam (#94 e #96) viraram `CONFLICTING` — os dois no MESMO arquivo, `.ai/rules/js.md`, e pelo mesmo motivo: **toda fatia de frontend acrescenta seção ao fim dele**. Não é conflito de conteúdo, é colisão de append. Vai se repetir em cada leva de fatias de UX/UI que ficar aberta junto.

**Resolução correta, e o erro que quase entrou:** o conflito vem em formato **diff3** (`<<<<<<<` / `||||||| base` / `=======` / `>>>>>>>`), três partes. Tratá-lo como duas partes deixa o marcador `||||||| <sha>` DENTRO do arquivo resolvido — foi o que aconteceu na primeira tentativa, e passaria despercebido num arquivo markdown que nenhum linter cobre.

A forma à prova disso é resolver pelos **estágios do índice**, não pelo texto marcado:

```
base  = git show :1:<arquivo>
nosso = git show :2:<arquivo>
deles = git show :3:<arquivo>
# append puro dos dois lados ⇒ resultado = deles + (nosso - base)
```

com `assert nosso.startswith(base) and deles.startswith(base)` — se a asserção falhar, não era append puro e a resolução precisa de leitura humana.

**Checagem que fecha:** `git diff origin/main --stat -- <arquivo>` tem de mostrar SÓ as linhas que a fatia acrescenta (3 no #96, 6 no #94). Se mostrar remoção, alguma seção do main se perdeu.

Depois disso: `git add`, os **dois `ci:check`** no merge (não só na fatia — a árvore mesclada é nova: 32 arquivos / 217 e 219 testes), `git commit --no-edit`, push. Os dois PRs voltaram a `MERGEABLE`.

**`rerere` está ligado neste repositório** e gravou as duas resoluções, então repetições idênticas se resolvem sozinhas. Não confie nisso para conflito de conteúdo real — só para este, que é mecânico.

**Alternativa para a próxima leva:** manter no máximo um PR de frontend aberto por vez, ou aceitar o merge de `main` como passo fixo antes de pedir revisão. A segunda é mais barata e é o que ficou feito aqui.

## Próxima unidade

**Reconciliação da 7ª invocação (2026-08-12):** os TRÊS PRs abertos — **#82 (S2)**, **#86 (S5)** e **#88 (C4)** — foram mesclados pelo dono. `main` em `f43478a`. Os 7 SHAs das fontes seguem idênticos aos pinados: **zero drift** desde a abertura da rodada, 7 invocações atrás.

~~**S3**~~ ✅ aplicado — PR [#90](https://github.com/Simplify-Technology/boilerplate/pull/90) aberto. **Com isso a dimensão 1 do spinmax está esgotada de fatias aplicáveis:** S1, S2, S3, S4, S5 e C4 saíram; o que resta (S6–S13) é multi-fonte represado, `[proposta-adr]`, risco ALTO ou decisão do dono.

**Reconciliação da 6ª invocação (2026-08-12):** **#84 (S4) mesclado**; **#82 (S2) segue aberto**. `main` em `c599f05`. Os 7 SHAs das fontes seguem idênticos aos pinados — **zero drift** desde a abertura da rodada.

~~**S5**~~ ✅ aplicado — PR [#86](https://github.com/Simplify-Technology/boilerplate/pull/86) aberto. **Com isso a célula 1 do spinmax não tem mais fatia P pronta**: S1, S2, S4 e S5 saíram; sobra S3 (M, risco médio) e os S7–S13, todos com decisão do dono ou escopo grande.

**Reconciliação da 5ª invocação (2026-08-12):** os DOIS que o STATE dava como abertos — **#76 (F42+F35)** e **#80 (S1)** — já estavam **mesclados**. Corrigido acima antes de executar qualquer unidade. `main` local em `a3cc87e`. Os 7 SHAs das fontes seguem idênticos aos pinados: **zero drift na rodada até agora**. Nota operacional: `gh issue create` foi bloqueado pelo classificador de permissões na primeira tentativa desta sessão e passou na segunda, a pedido do dono — se repetir, é a mesma coisa.

~~**S2**~~ ✅ aplicado — PR [#82](https://github.com/Simplify-Technology/boilerplate/pull/82) aberto.

~~**S4**~~ ✅ aplicado — PR [#84](https://github.com/Simplify-Technology/boilerplate/pull/84) aberto.

**Fila de fatias prontas do BACKLOG (prioridade 1 do protocolo), em ordem sugerida:**

1. Fila de UX/UI pareada da dimensão 5+6: **E12+E21+F12** · **E22+E24** · **E18+E23+E25+F21** · **E27+E29** · **F32** (poda barata) · **F7** (cor de marca — decisão do dono).

**Quando a fila de P do spinmax secar, a unidade mais rentável volta a ser varredura** — a matriz está em 9/70 e cinco projetos ainda não têm inventário. Candidato natural: **célula 0 (inventário) do cuidari ou do ctvitrine**, os dois L13 + Inertia 3 em produção, que são exatamente os que destravam o F3 (a decisão fundacional de tokens de estado, represada desde 2026-08-12).

~~**F1**~~ ✅ PR #70 · ~~**F5**~~ ✅ PR #72 · ~~**F22**~~ ✅ PR #74 — **todos mesclados pelo dono em 2026-08-12**. Reconciliação da 4ª invocação: zero PR aberto, zero fatia em andamento, e os 7 SHAs das fontes seguem idênticos aos pinados (sem drift na rodada).

~~**F42+F35**~~ ✅ aplicados juntos — PR [#76](https://github.com/Simplify-Technology/boilerplate/pull/76) aberto.

~~**Célula: spinmax × dimensão 1 (Segurança)**~~ ✅ — 28 candidatos, 16 agentes. ~~**Fatia S1 é a próxima unidade**~~ ✅ aplicada (PR #80): teto de PII no `UserResource`, a única escalada de leitura VIVA da célula, verificada por mim de primeira mão. As duas peças (`Roles::priority()`, `ImpersonationService::getOriginalUser()`) já existem no boilerplate; falta aplicá-las no resource, que hoje tem **zero** testes.

~~**Célula: spinmax × dimensão 1 (Segurança).**~~ O inventário deixou 12 ponteiros, 5 deles de segurança, e o spinmax é o projeto de criticidade MÁXIMA (e-commerce em produção com pagamento). É a célula com maior densidade de material pronto.

**Sobre o F3 — adiado com motivo, não esquecido.** Ele é fatia de aplicação pronta (prioridade 1 do protocolo), mas canonizar uma ARQUITETURA de tokens de estado é decisão fundacional, e a pergunta de abertura da dimensão 6 é literalmente "qual projeto tem o sistema mais maduro". Responder isso tendo lido só o ctfinance — sem cuidari e ctvitrine, os dois L13 + Inertia 3 em produção — é o tipo de escolha que se refaz. Ele destrava quando as células 6 desses dois estiverem varridas. A catraca do teste do F1 segura o `destructive` em 3.67:1 enquanto isso, então nada regride na espera.

~~**Fatia F3 — trio `--state-{status}-{bg,fg,border}`.**~~ É a próxima unidade grande e a mais destravante: tem catraca esperando no teste do F1 (`destructive` escuro parado em 3.67:1), é pré-requisito da metade visual do E6 (sem ele o `InputError` regride ao trocar de className) e o F2 (os 6 pares `--color-success/warning/info` que nunca foram exportados, com call-site vivo em `user-actions-menu.tsx:125`) viaja junto. M, risco médio. **Não copiar os percentuais do ctfinance** — a aritmética já foi refeita e 3 dos 4 reprovam na paleta daqui; os `fg` entram como HEX literais derivados de alvo calculado.

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
