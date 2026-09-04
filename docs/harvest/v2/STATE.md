# Harvest v2 — STATE

Estado retomável da rodada. **Toda iteração termina atualizando este arquivo.**

- **Issue-âncora:** #50 · **Branch de estado:** `50-harvest-v2-rodada` · **Worktree:** `../boilerplate-harvest-state`
- **Rodada aberta em:** 2026-08-11
- **Direção:** projetos → boilerplate (inverso do PLAYBOOK de migração)
- **Situação:** Fase 0 concluída · varredura em andamento (12/70 células) · **33 fatias MESCLADAS** (A1, A3, A6, D2, D3, D4, D5, E17, E2+E13, F1, F5, F22, F42+F35, F23, S1, S2, S4, S5, C4, S3, E6+E20, E14+E15, E30, E22+E24, E27+E29, E18+E23+E25, E21+E12, E28, F32, E26, V6S-1+V6T14+V6T13, F2+F3+F9b) · **2 PRs abertos: [#123](https://github.com/Simplify-Technology/boilerplate/pull/123) (E12+E21 metade visual) · [#125](https://github.com/Simplify-Technology/boilerplate/pull/125) (F38 — poda de `public/` + `<head>`)**

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
- **⚠️ QUARTA PEGADINHA — TRÊS baselines do lado ALVO, e confundir dois quaisquer inverte a conclusão.** Apanhada na 9ª invocação (2026-08-12) no inventário do cuidari, em duas camadas, e a segunda é a interessante.
  - **Camada 1 (o que o crítico acusou):** o worktree principal do boilerplate fica com a **branch da fatia corrente** em checkout. Frente que compara lendo o disco (`Read`, `cat`, `find`, `grep`) compara contra código **ainda não mesclado**.
  - **Camada 2 (o que o crítico ERROU, e é a lição maior):** ele "corrigiu" 12 números medindo contra **`main` local**, que estava 40 arquivos / +1.794 linhas atrás de `origin/main`. Como a branch de fatia **nasce de `origin/main`**, para tudo já mesclado as frentes estavam certas e o crítico não. **11 das 12 correções dele estão erradas** — `.ai/rules` 23 (não 22), `tests/*.php` 66 (não 63), `RateLimiter::for` 4 (não 3), `throttle` em `routes/auth.php` 6 (não 5), `HasRolesAndPermissions` 260 LOC (não 234), `permissionsBeyondOwn()` presente (não "só na branch").
  - **Inflação real, e só ela:** teste de front, 33 arquivos → 34 e 204 casos → 217, diferença que é exatamente o `toast-config.test.ts` + 13 casos da fatia #102. Nenhuma outra métrica contaminada.
  - **Regra para os 4 inventários restantes (sorteiopix, ctjuris, ctvitrine, tej):** comparação com o boilerplate sai de `git -C <boilerplate> ls-tree -r origin/main --name-only` e `git -C <boilerplate> show origin/main:<caminho>` — **`origin/main`, com o prefixo `origin/`, e nunca `main` seco nem o disco**. Isto entra no prompt de TODA frente E no do crítico; o inventário do cuidari mostra que frente compara mesmo quando o escopo não pede, e que o crítico erra do mesmo jeito se ninguém disser qual é o ref.
  - **Lição de método:** verificador com o baseline errado é mais caro que verificador nenhum — ele produz correção com aparência de autoridade. O que salvou aqui foi eu re-executar as contagens dele. **Toda tabela de "números derrubados" que um crítico produzir precisa ter o ref conferido antes de entrar em doc.**
  - Isto **não é** o mesmo problema do drift do ctvitrine (lá é a fonte que anda; aqui é o alvo). Os dois coexistem e precisam de tratamento separado.
- **Terceira pegadinha, apanhada na 8ª invocação (2026-08-12): agora o hook EXISTE no worktree de estado e falha por ambiente.** Em algum ponto o `.husky/_` passou a existir ali, então o `pre-push` dispara — e morre em `composer ci:check` com `Rode: cp .env.example .env && php artisan key:generate`, porque o worktree de estado **não tem `.env`**. É o caso de ambiente do Guardrail 7, não gate vermelho. Procedimento usado e a repetir: (1) provar que o branch de estado não toca código com `git diff $(git merge-base origin/main HEAD)..HEAD --stat -- ':!docs'` **vazio**; (2) `SKIP_GIT_HOOKS=1 git push` só naquele push; (3) registrar aqui. **Não** criar `.env` no worktree de estado só para satisfazer o hook — o branch é markdown puro por construção, e um `.env` ali é superfície de segredo sem motivo. Pushes com a válvula: 2026-08-12 (commits de E22+E24 e de E27+E29), 2026-08-13 (lote de 3: E21+E12, E28 e F32), 2026-08-20 (lote de 2: E26 e o inventário do ctvitrine — diff contra a merge-base conferido vazio antes), 2026-08-31 (commit único da fatia V6S-1+V6T14+V6T13; push normal tentado primeiro e falhou com a MESMA mensagem de APP_KEY, diff contra a merge-base conferido vazio antes), 2026-09-04 (lote de 3 commits da 15ª invocação — reconciliação, fatia F2+F3+F9b e este registro; push normal falhou com a mesma mensagem, `git diff $(git merge-base origin/main HEAD)..HEAD --stat -- ':!docs'` vazio antes), 2026-09-04 (commit único da 16ª invocação — fatia E12+E21 metade visual; diff contra a merge-base conferido vazio antes), 2026-09-04 (segundo commit da 16ª invocação — fatia F38; idem).

### ⚠️ QUINTA PEGADINHA — a máquina dormir mata agente em voo, e o `parallel()` não avisa

Apanhada na 13ª invocação (2026-08-20) na dimensão 6 do ctvitrine. A célula rodou **4h23** e **10 dos 17 agentes morreram** com `API Error: Your computer went to sleep mid-response`. Não é erro de prompt nem de ferramenta: é o Mac entrando em idle sleep no meio de uma execução longa.

- **O que morreu é pior que o quanto morreu.** Sobreviveram 3 dos 4 caçadores e 3 dos 12 vereditos. O que morreu foi **o caçador 1 inteiro com as 3 lentes dele** — justamente o que carrega o entregável obrigatório do F3 (a tabela comparativa de tokens de estado). Perder 10 de 17 uniformemente seria menos grave que perder o único bloco indispensável.
- **A secagem rodou mesmo assim, sobre um mapa parcial.** Ela não tem como saber que o mapa está furado: `agent()` devolve `null` no erro terminal e o `.then()` só embrulha o `null` num objeto, então o item **não** vira `null` e o `pipeline` segue. A célula teria sido declarada ✅ com 45 KB de síntese produzida sobre 4 dos 12 vereditos. **É a mesma família da lição do cuidari (frente perdida por erro de API), com uma diferença que importa: lá a checagem `frentes_ok === 8` salvou; aqui a checagem existia para os caçadores e não para os VEREDITOS.**
- **Correção de método, para toda célula com lentes:** a guarda de completude tem de cobrir **todos os estágios**, não só o primeiro. O script precisa contar `vereditos.length === lentes.length * caçadores.length` **antes** de montar o mapa da secagem, e recusar-se a sintetizar com furo.
- **Correção de ambiente, e é a barata:** antes de disparar workflow longo, `caffeinate -i -t <segundos>` (bounded, expira sozinho). Custou zero e teria evitado as 10 mortes.
- **A recuperação é barata e existe:** `Workflow({scriptPath, resumeFromRunId})` replaya de cache todo agente cujo `(prompt, opts)` não mudou e re-executa só os mortos. Os 3 caçadores bons e os 3 vereditos bons voltaram de graça; o prompt das lentes do caçador 1 muda sozinho quando o caçador 1 volta a produzir texto (o `null` saía escrito no prompt), então elas re-executam pelo motivo certo. **Nunca refaça uma célula do zero por causa de erro de API.**
- Custo da passada perdida, para dimensionar as próximas: **3,81M tokens de subagente e 1.132 chamadas de ferramenta** — a célula mais cara da rodada até aqui, e a única que precisou de retomada.

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
| 5 | ctvitrine | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| 6 | cuidari | ✅ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| 7 | transitado-em-julgado | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Progresso:** 12/70 células (17%) · BACKLOG: **50 aplicados (A1, A3, A6, D2, D3, D4, D5, E17, E2, E13, F1, F5, F22, F42, F35, F23, S1, S2, S4, S5, C4, S3, E6, E20, E14, E15, E30, E22, E24, E27, E29, E18, E23, E25, E21, E12, E28, F32, V6T13, V6T14, V6S-1, F2, F3, F9b, E12+E21-visual, V6F-4, V6T10, V6D-3, V6D-2, V6F-1)**, 1 realocado (A2), **~110 aplicáveis** (8 de dim. 1–3 · 27 de dim. 5 · **69 de dim. 6: F1–F42 + secagem** · 11 da dim. 1 do spinmax), 7 adiados, **11 rejeitados**, 9 sem veredito (dim. 4), **4 achados internos (C1, C2, C3, C4)**, **2 `[dep-nova]` novos** (`jest-axe`, `knip`). Decisão do dono sobre o canal de flash: **resolvida em 2026-08-11 (nativo)**.

> **Onde está o quê no BACKLOG:** a dimensão 5 foi APENDADA ao fim do arquivo (E1–E25, depois secagem E26–E30, depois os rejeitados e a §Decisões). As seções de dim. 1–4 continuam no topo. Ordem do arquivo ≠ ordem de prioridade.

**Baseline de gates.** Em `main` com as 4 primeiras fatias (2026-08-11): `composer ci:check` 311 testes / 1678 asserções, `corepack pnpm ci:check` 25 arquivos / 158 testes. **Com 30 fatias mescladas + a branch da #112 (2026-08-20):** back **416 testes / 2046 asserções**, front **39 arquivos / 297 testes**. Ambos exit 0 nas três medições. O back não anda desde 2026-08-12 porque as últimas seis fatias foram todas de frontend.

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
| **D5** — fix: spinner de busca (nunca aparecia / nunca parava) | [#59](https://github.com/Simplify-Technology/boilerplate/issues/59) | `59-harvest-v2-spinner-busca` | ✅ 8 testes + 3 mutações | ✅ ambos exit 0 | [#60](https://github.com/Simplify-Technology/boilerplate/pull/60) | ✅ **MESCLADO** 2026-08-11 |
| **D4** — fix: fundo escuro inline com literal + `color-scheme` | [#61](https://github.com/Simplify-Technology/boilerplate/issues/61) | `61-harvest-v2-fundo-inline-tema` | ✅ 4 testes + 3 mutações | ✅ ambos exit 0 | [#62](https://github.com/Simplify-Technology/boilerplate/pull/62) | ✅ **MESCLADO** 2026-08-11 |
| **D3** — docs: closure em prop de render não adia nada | [#63](https://github.com/Simplify-Technology/boilerplate/issues/63) | `63-harvest-v2-regra-props-lazy` | — (só doc; gate inviável, ver BACKLOG) | ✅ ambos exit 0 | [#64](https://github.com/Simplify-Technology/boilerplate/pull/64) | ✅ **MESCLADO** 2026-08-11 18:56 |

| **E17** — fix: ordenação e page size crus na listagem (500 por URL) | [#65](https://github.com/Simplify-Technology/boilerplate/issues/65) | `65-harvest-v2-normaliza-ordenacao-listagem` | ✅ 41 testes + 4 mutações | ✅ ambos exit 0 (352/1831) | [#66](https://github.com/Simplify-Technology/boilerplate/pull/66) | ✅ **MESCLADO** 2026-08-11 |
| **E2+E13** — refactor: canal de flash nativo do Inertia 3 | [#67](https://github.com/Simplify-Technology/boilerplate/issues/67) | `67-harvest-v2-flash-nativo` | ✅ 15 testes + 2 mutações | ✅ ambos exit 0 (364/1896) | [#68](https://github.com/Simplify-Technology/boilerplate/pull/68) | ✅ **MESCLADO** 2026-08-11 |
| **F1** — fix: colisão de token que matava o dark mode | [#69](https://github.com/Simplify-Technology/boilerplate/issues/69) | `69-harvest-v2-conserta-theme` | ✅ 18 testes + 3 mutações | ✅ ambos exit 0 (364/1896) | [#70](https://github.com/Simplify-Technology/boilerplate/pull/70) | ✅ **MESCLADO** 2026-08-12 |
| **F5** — fix: anel de foco invisível no tema claro | [#71](https://github.com/Simplify-Technology/boilerplate/issues/71) | `71-harvest-v2-anel-de-foco` | ✅ 30 testes de estilo + 6 mutações | ✅ ambos exit 0 (364/1896) | [#72](https://github.com/Simplify-Technology/boilerplate/pull/72) | ✅ **MESCLADO** 2026-08-12 |
| **F22** — fix: `<a><button>` aninhado em 6 links-botão | [#73](https://github.com/Simplify-Technology/boilerplate/issues/73) | `73-harvest-v2-link-botao` | ✅ 8 testes + 3 mutações | ✅ ambos exit 0 (364/1896 · 29/192) | [#74](https://github.com/Simplify-Technology/boilerplate/pull/74) | ✅ **MESCLADO** 2026-08-12 |
| **F42+F35** — fix: tema fora do React (500 de último recurso + cromo nativo) | [#75](https://github.com/Simplify-Technology/boilerplate/issues/75) | `75-harvest-v2-tema-fora-do-react` | ✅ 17 testes + **9 mutações** | ✅ ambos exit 0 (373/1911 · 30/204) | [#76](https://github.com/Simplify-Technology/boilerplate/pull/76) | ✅ **MESCLADO** 2026-08-12 |
| **F23** — fix: `<button>` sem `type` + regra `react/button-has-type` | [#77](https://github.com/Simplify-Technology/boilerplate/issues/77) | `77-harvest-v2-button-type` | ✅ lint como gate + 2 mutações | ✅ ambos exit 0 (364/1896 · 30/204) | [#78](https://github.com/Simplify-Technology/boilerplate/pull/78) | ✅ **MESCLADO** 2026-08-12 |
| **S1** — fix(seguranca): teto de PII no `UserResource` | [#79](https://github.com/Simplify-Technology/boilerplate/issues/79) | `79-harvest-v2-teto-pii-resource` | ✅ 10 testes + 4 mutações | ✅ ambos exit 0 (374/1931 · 30/204) | [#80](https://github.com/Simplify-Technology/boilerplate/pull/80) | ✅ **MESCLADO** 2026-08-12 |
| **S2** — fix(rbac): teto de concessão nos 3 caminhos de permissão | [#81](https://github.com/Simplify-Technology/boilerplate/issues/81) | `81-harvest-v2-teto-concessao-permissao` | ✅ 12 testes + **7 mutações** | ✅ ambos exit 0 (395/1977 · 30/204) | [#82](https://github.com/Simplify-Technology/boilerplate/pull/82) | ✅ **MESCLADO** 2026-08-12 |
| **S4** — test(auth): prova que o lockout do login morde | [#83](https://github.com/Simplify-Technology/boilerplate/issues/83) | `83-harvest-v2-lockout-login` | ✅ 7 testes + **7 mutações** | ✅ ambos exit 0 (390/1969) | [#84](https://github.com/Simplify-Technology/boilerplate/pull/84) | ✅ **MESCLADO** 2026-08-12 |
| **S5** — test(auth): alcance do `EnsureUserIsActive` | [#85](https://github.com/Simplify-Technology/boilerplate/issues/85) | `85-harvest-v2-alcance-usuario-inativo` | ✅ 4 testes + 3 mutações | ✅ ambos exit 0 (394/1984) | [#86](https://github.com/Simplify-Technology/boilerplate/pull/86) | ✅ **MESCLADO** 2026-08-12 |
| **C4** — fix(auth): limite no `confirm-password` | [#87](https://github.com/Simplify-Technology/boilerplate/issues/87) | `87-harvest-v2-limite-confirm-password` | ✅ 5 testes + 5 mutações | ✅ ambos exit 0 (395/1982) | [#88](https://github.com/Simplify-Technology/boilerplate/pull/88) | ✅ **MESCLADO** 2026-08-12 |
| **S3** — fix(lgpd): objeto e chave composta no scrubber | [#89](https://github.com/Simplify-Technology/boilerplate/issues/89) | `89-harvest-v2-scrubber-objeto-e-chave-composta` | ✅ 5 testes + 5 mutações | ✅ ambos exit 0 (416/2046) | [#90](https://github.com/Simplify-Technology/boilerplate/pull/90) | ✅ **MESCLADO** 2026-08-12 |
| **E6+E20** — fix(a11y): erro anunciado + fusão de ARIA | [#91](https://github.com/Simplify-Technology/boilerplate/issues/91) | `91-harvest-v2-erro-anunciado` | ✅ 9 testes + 5 mutações | ✅ ambos exit 0 (31/212) | [#92](https://github.com/Simplify-Technology/boilerplate/pull/92) | ✅ **MESCLADO** 2026-08-12 |
| **E14+E15** — fix(ux): estado vazio com saída + metade visual | [#93](https://github.com/Simplify-Technology/boilerplate/issues/93) | `93-harvest-v2-vazio-com-saida` | ✅ 7 testes + 5 mutações | ✅ ambos exit 0 (31/211) | [#94](https://github.com/Simplify-Technology/boilerplate/pull/94) | ✅ **MESCLADO** 2026-08-12 |
| **E30** — fix(ux): diálogo de excluir conta controlado | [#95](https://github.com/Simplify-Technology/boilerplate/issues/95) | `95-harvest-v2-dialogo-controlado` | ✅ 5 testes + 4 mutações | ✅ ambos exit 0 (31/209) | [#96](https://github.com/Simplify-Technology/boilerplate/pull/96) | ✅ **MESCLADO** 2026-08-12 20:55 |
| **E22+E24** — fix(a11y): landmark, `aria-current` e skip-link | [#97](https://github.com/Simplify-Technology/boilerplate/issues/97) | `97-harvest-v2-navegacao-landmark` | ✅ 10 testes + **8 mutações** | ✅ ambos exit 0 (416/2046 · 34/234) | [#98](https://github.com/Simplify-Technology/boilerplate/pull/98) | ✅ **MESCLADO** 2026-08-12 |
| **E27+E29** — fix(ux): poda de código morto + caminho vivo de personificar | [#99](https://github.com/Simplify-Technology/boilerplate/issues/99) | `99-harvest-v2-poda-e-personificacao` | ✅ 5 testes + **8 mutações** | ✅ ambos exit 0 (416/2046 · 34/229) | [#100](https://github.com/Simplify-Technology/boilerplate/pull/100) | ✅ **MESCLADO** 2026-08-13 |
| **E18+E23+E25** — fix(a11y): busca anuncia o desfecho + severidade de toast | [#101](https://github.com/Simplify-Technology/boilerplate/issues/101) | `101-harvest-v2-busca-anunciada` | ✅ 17 testes + **6 mutações** | ✅ ambos exit 0 (416/2046 · 34/237) | [#102](https://github.com/Simplify-Technology/boilerplate/pull/102) | ✅ **MESCLADO** 2026-08-13 |
| **E21+E12** — fix(a11y): diálogo destrutivo (descrição obrigatória + nota sobrescrevível) | [#103](https://github.com/Simplify-Technology/boilerplate/issues/103) | `103-harvest-v2-dialogo-destrutivo` | ✅ 10 testes + **6 mutações** | ✅ ambos exit 0 (416/2046 · 37/262) | [#104](https://github.com/Simplify-Technology/boilerplate/pull/104) | ✅ **MESCLADO** 2026-08-13 |
| **E28** — fix(a11y): estado de envio no Button (`loading`/`aria-busy`) | [#105](https://github.com/Simplify-Technology/boilerplate/issues/105) | `105-harvest-v2-botao-em-envio` | ✅ (ver invocação 11) | ✅ ambos exit 0 | [#106](https://github.com/Simplify-Technology/boilerplate/pull/106) | ✅ **MESCLADO** 2026-08-17 |
| **F32** — fix(ui): poda do CSS morto de toast | [#107](https://github.com/Simplify-Technology/boilerplate/issues/107) | `107-harvest-v2-poda-css-toast` | ✅ (ver invocação 11) | ✅ ambos exit 0 | [#108](https://github.com/Simplify-Technology/boilerplate/pull/108) | ✅ **MESCLADO** 2026-08-17 |
| **E26** — fix(a11y): guarda do atalho global + atalho exposto | [#111](https://github.com/Simplify-Technology/boilerplate/issues/111) | `111-harvest-v2-guarda-atalho-sidebar` | ✅ 19 testes + **9 mutações** | ✅ ambos exit 0 (416/2046 · 39/297) | [#112](https://github.com/Simplify-Technology/boilerplate/pull/112) | ✅ **MESCLADO** 2026-08-21 00:04 UTC |
| **V6S-1+V6T14+V6T13** — fix(a11y): severidade do toast em `toast.promise` + `iconTheme` morto + par gráfico | [#118](https://github.com/Simplify-Technology/boilerplate/issues/118) | `118-harvest-v2-severidade-toast-promise` | ✅ 29 testes novos + **9 mutações** | ✅ ambos exit 0 (416/2046 · **40/326**) | [#119](https://github.com/Simplify-Technology/boilerplate/pull/119) | ✅ **MESCLADO** (confirmado 2026-09-03) |
| **F2+F3+F9b** — feat(tema): trio de tokens de estado + pares no `@theme` + `Alert destructive` | [#120](https://github.com/Simplify-Technology/boilerplate/issues/120) | `120-harvest-v2-tokens-de-estado` | ✅ 60 testes novos (front 40/326 → **42/386**) + **12 mutações** | ✅ ambos exit 0 (416/2046 · 42/386), também no `pre-push` | [#121](https://github.com/Simplify-Technology/boilerplate/pull/121) | ✅ **MESCLADO** 2026-09-04 13:45 UTC |
| **E12+E21 (metade visual)** — fix(ui): diálogo destrutivo veste severidade com o token do papel | [#122](https://github.com/Simplify-Technology/boilerplate/issues/122) | `122-harvest-v2-dialogo-destrutivo-tokens` | ✅ 11 testes novos + 2 entradas na catraca (front 42/386 → **43/399**) + **9 mutações** | ✅ ambos exit 0 (416/2046 · 43/399), também no `pre-push` | [#123](https://github.com/Simplify-Technology/boilerplate/pull/123) | 🟡 **ABERTO** 2026-09-04 |
| **F38** (V6F-4 + V6T10/V6D-3 + V6D-2/V6F-1) — fix(views): `public/` e o `<head>` só carregam o que se usa | [#124](https://github.com/Simplify-Technology/boilerplate/issues/124) | `124-harvest-v2-poda-public-head` | ✅ 6 casos / 23 asserções novos (back 416/2046 → **422/2069**) + **7 mutações** | ✅ ambos exit 0 (422/2069 · 42/386), também no `pre-push` | [#125](https://github.com/Simplify-Technology/boilerplate/pull/125) | 🟡 **ABERTO** 2026-09-04 |

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

**Repetiu na mesma tarde, como previsto.** Mesclado o #94, o #96 conflitou de novo no mesmo arquivo — agora contra as duas seções do `EmptyState`. Mesma resolução pelos estágios do índice, mesmo resultado (3 linhas acrescentadas, zero removida), gates verdes na árvore mesclada (33 arquivos / 224 testes). **O `rerere` NÃO ajudou**: ele casa o conflito exato, e cada merge novo traz um lado diferente. O custo real é um merge de `main` por PR por leva — o que confirma a leitura de que isto é estrutural e não vale tentar evitar com truque de ferramenta.

## Próxima unidade

### Reconciliação da 16ª invocação (2026-09-04)

Feita ANTES de qualquer ação.

- **PR #121 (F2+F3+F9b) confirmado MESCLADO** pelo dono às 13:45 UTC; o STATE o dava como aberto — corrigido acima. `origin/main` em **`e0d8ded`** (= merge do `4acc22b`). A rodada entrou nesta invocação com **zero PR aberto e zero fatia em andamento** ⇒ Prioridade 1 do protocolo (fatia pronta do BACKLOG): a primeira da lista que a 15ª invocação deixou destravada.
- **Drift novo em DUAS fontes que nunca tinham andado:** ctfinance em **`5865134`** (pin `b8c6d57`) e cuidari em **`0bb97f8`** (pin `a7a1170`). Oitavo drift do spinmax: **`ee7962a`** (era `7726363`; pin `e4ec01e`). ctvitrine segue em `f9f17f6`. sorteiopix, ctjuris e tej idênticos aos pinados. **Pins inalterados** — o ctfinance é a fonte de 6 das 8 células varridas até aqui; o que ele fez depois de `b8c6d57` vai para o RELATORIO como "evoluiu durante a rodada".
- **Worktree principal:** estava na branch `120-…` (já mesclada) com o WIP do dono em `docs/migration/PLAYBOOK.md` e `docs/migration/projects/transitado-em-julgado.md` (+ `.claude/commands/` não rastreado). Conferido que `origin/main` não toca esses caminhos antes do `git switch -c`. Nada do dono é commitado — `git add` por caminho.
- **⚠️ Trap de shell nova, e é do zsh:** `path=...` como variável de loop **sobrescreve o `PATH`** (em zsh `path` é o array espelho de `PATH`) — o preflight inteiro voltou `command not found` para `wc`, `tr`, `head`, `git` e `corepack`. Nome de variável em script de preflight: `dir`, nunca `path`. E a trap anterior (zsh não faz word-splitting) mordeu de novo: `prettier $FILES` com 5 caminhos numa string vira UM padrão sem match — passar os caminhos como argumentos separados.
- **Hooks rodaram de verdade** (lint-staged no pre-commit, os dois `ci:check` no pre-push). Sem `SKIP_GIT_HOOKS` na fatia.

### Fatia E12+E21 (metade visual) — aplicada (2026-09-04)

Issue [#122](https://github.com/Simplify-Technology/boilerplate/issues/122) · PR [#123](https://github.com/Simplify-Technology/boilerplate/pull/123) **aberto, aguardando merge do dono**. Commit `46fec83` sobre `origin/main` = `e0d8ded`. 11 testes de componente novos + 2 entradas na catraca (front 42/386 → **43/399**), **9 mutações, todas mordem**, os dois gates exit 0 (rodados também pelo `pre-push`).

**O que entrou.** `delete-confirmation-dialog.tsx` (35 literais → 0): severidade → token por mapa fechado (`calloutBySeverity`); chip do título `bg-state-X` + `text-state-X`; avisos e quadro "Atenção" de aviso em `state-X-soft` com ícone e parágrafo herdando por `currentColor`; botão de confirmar `warning` vira o sólido `bg-warning text-warning-foreground hover:bg-warning/90` (era `bg-orange-600 text-white`); chip do item vai para o trio **info**; `data-slot` nos quatro nós de estado. `delete-account-info-dialog.tsx` (14 literais → 0): seções vestem o estado que descrevem, "irreversível" em `text-state-destructive`; ganhou o primeiro teste. `.ai/rules/js.md`: frase do `currentColor` (fact-checked em `lucide-react@1.34.0`) e do mapa fechado.

**Três fatos que esta fatia produziu:**

1. **O `dark:text-blue-400` do chip do item era remendo do F1, e removê-lo "de volta ao `text-primary`" reprovaria.** Medido: `text-primary` (`#379bcb`) sobre `bg-primary/30` sobre o navy dá **2,92:1** no escuro (gráfico exige 3:1); sobre o `#111113` que o Radix pinta de verdade (fato 2 da 15ª) daria 3,81 — ou seja, a leitura "está bom no browser" seria falsa assim que o V6T5/F6 consertar o canvas. O chip foi para `bg-state-info` + `text-state-info`, cujo par `fg × bg` o `theme-tokens.test.ts` mede nos dois temas. **Regra derivada:** toda medição de contraste feita "sobre `bg-background`" no escuro precisa ser feita DUAS vezes (navy e `#111113`) enquanto o F6 não sair — passar numa e reprovar na outra é o sinal de que o token está errado, não de que o canvas está.
2. **`state-X-soft` deixa o ícone e o parágrafo SEM classe de cor, e isso é a forma, não preguiça.** O lucide desenha com `stroke="currentColor"`; classe própria no ícone desamarra o ícone do par medido (foi o que a mutação M4 provou: um `text-state-destructive` a mais no ícone de um callout `warning` passa despercebido por qualquer teste de contraste de token). O teste de componente trava a AUSÊNCIA de classe `text-*` no SVG do callout.
3. **A guarda de fonte do F3 e o teste de componente se cobrem, não se duplicam.** A mutação `text-white` no botão de aviso acordou os dois; as outras 8 acordaram só o de componente. A catraca de arquivos limpos pega "voltou a literal"; só o teste de DOM pega "trocou o token pelo do estado errado" — que é o defeito mais provável em manutenção (copiar o ramo `danger` para o `warning`).

**Divergências deliberadas:** sem variante `warning` no `Button` (1 call site; vira candidato se aparecer o segundo); o chip do item é `info`, não `primary`; os outros 6 `*-info-dialog.tsx` (24 `iconColor` em cyan/purple/blue/yellow) ficaram de fora — são F7 (marca) e F20 (catraca), não estado.

### Fatia F38 (V6F-4 + V6T10/V6D-3 + V6D-2/V6F-1) — aplicada (2026-09-04, 2ª unidade da 16ª invocação)

Issue [#124](https://github.com/Simplify-Technology/boilerplate/issues/124) · PR [#125](https://github.com/Simplify-Technology/boilerplate/pull/125) **aberto, aguardando merge do dono**. Commit `7dd029f` sobre `origin/main` = `e0d8ded` (independente da #123 — nasce de `main`, não toca `js.md`). 6 casos / 23 asserções novos em `tests/Unit/Views/PublicAssetsTest.php` (back 416/2046 → **422/2069**), **7 mutações, todas mordem**, os dois gates exit 0 (também no `pre-push`).

**O que entrou.** Poda de 5 arquivos sem alcance em `public/` (−190 KB versionados): a fonte duplicada `aptos-extrabold-italic 2.woff2`, `favicon-16x16/32x32.png` (o `.ico` carrega 16/32/48 px — medido no ICONDIR) e `android-chrome-192/512.png` (só teriam consumidor num manifest). `<head>` linka `favicon.ico` (`sizes="any"`) e `apple-touch-icon.png` (180×180) e perde o `preconnect` para `fonts.bunny.net`. Teste com os três contratos (fontes ↔ `_fonts.css` nos dois sentidos · `href` do `<head>` ↔ disco · árvore de `public/` ↔ referência, com convenção + dívida datada amarrada por simetria). `.ai/rules/views.md` ganha a 4ª seção.

**Três decisões de escopo, todas com o porquê registrado no BACKLOG:**

1. **Manifest NÃO entrou — e os `android-chrome-*` saíram por isso.** A lente do V6D-2 deixou as duas saídas ("ou acrescenta o manifest, ou poda os dois"); a regra dos temas multi-fonte decide: manifest é PWA (ctfinance `vite-plugin-pwa` × sorteiopix), ainda sem comparação, e o `vite-plugin-pwa` **gera** o manifest — um à mão nasceria para ser substituído. De carona, evitou-se o `AddType application/manifest+json` no `.htaccess` (com `nosniff` incondicional, `php artisan serve` recusaria o manifest) e a amarra com o V6F-6 (`display: standalone`). Os PNG voltam de `e0d8ded:public/` se a fatia PWA os quiser.
2. **`theme-color` NÃO entrou.** É o F14, e a modernização "par com `media=(prefers-color-scheme)`" segue o SO, não a troca de tema do app — precisa do mesmo mecanismo que o F35 usou para o `color-scheme`. Um hex fixo pintaria a barra do Chrome Android de navy sobre o tema claro.
3. **`favicon-16x16/32x32` foram podados, não linkados.** O candidato original mandava linkar 4 PNG; a lente de atualidade disse que 16/32 são redundantes com o `.ico` e a medição confirmou (3 entradas: 16, 32, 48 px). Linkar redundante é peso; podar com o teste de árvore é o estado que não regride.

**Dois fatos de método:**

- **Teste sem asserção é "risky" no Pest e passa em silêncio.** A primeira versão do caso de `preconnect` iterava a lista de dicas — vazia depois da poda — e não afirmava nada. Trocado por `expect($semConsumidor)->toBe([])`, que afirma inclusive "não há dica nenhuma". **Toda guarda que itera uma lista que pode ser vazia precisa afirmar sobre a lista, não dentro do loop.**
- **A trap do zsh mordeu de novo, agora como `path=`.** Em zsh `path` é o array-espelho do `PATH`; usá-lo como variável de loop apaga o `PATH` da sessão. Registrado na reconciliação acima.

### Próxima unidade sugerida (após F38)

Com F3 e F38 mesclando, a fila P da dimensão 6 do ctvitrine fica assim:

1. **V6D-11** (3 idiomas de spinner — o botão de confirmar do `delete-confirmation-dialog` é um dos 15 infratores; a #123 não o tocou de propósito) + **V6P-1** (`min-w-0` no `SidebarInset`) + **V6S-2/V6S-4/V6P-5/V6P-6/V6F-6/V6F-7** — P, autossuficientes. **Recomendada: V6D-11** (fecha o follow-up do E28 que já tem regra escrita e furada). ⚠️ Toca `js.md` — só depois de #123 mesclar, ou nasce em conflito.
2. **V6T5/F6 (Radix × `--color-background`)** — decisão do dono pendente (ver 15ª).
3. **F14** (`theme-color` que segue a troca de tema) — agora com o `<head>` aberto e travado pela #125; precisa do mecanismo do F35.
4. **F20** (catraca de literais de cor) — quando a leva acima secar.

Alternativas: **dimensão 1 (Segurança) do cuidari ou do ctvitrine**, ou **inventário do sorteiopix** (matriz em 12/70).

### Reconciliação da 15ª invocação (2026-09-03)

Feita ANTES de qualquer ação.

- **PR #119 (V6S-1+V6T14+V6T13) confirmado MESCLADO** pelo dono; o STATE o dava como aberto — corrigido acima. **As três PRs de dependabot também entraram:** #114 (actions), #116 (composer minor/patch, 7 pacotes) e #117 (npm minor/patch, 16 pacotes). `origin/main` em **`5b40183`**. A rodada entrou nesta invocação com **zero PR aberto e zero fatia em andamento** ⇒ Prioridade 1 do protocolo (fatia pronta do BACKLOG).
- **Consequência para a prioridade 3 (deps):** com #116/#117 mesclados, o levantamento de 2026-08-20 está coberto; sobra só o pin `typescript ^6.0.3 → ~6.0.3` (PLAYBOOK §4). Re-levantar `composer outdated`/`pnpm outdated` antes de abrir fatia de deps, porque os lockfiles andaram.
- **Sétimo drift do spinmax:** working tree em **`7726363`** (era `fdd499e`; pin `e4ec01e`). ctvitrine segue em `f9f17f6` (pin `53d7d9a`). Os outros 5 idênticos aos pinados. Pins inalterados.
- **Worktree principal:** estava na branch `118-…` (já mesclada) com o WIP do dono em `docs/migration/PLAYBOOK.md` e `docs/migration/projects/transitado-em-julgado.md` (+ `.claude/commands/` não rastreado). Conferido que `origin/main` não toca esses caminhos (branch 118 e `origin/main` idênticos neles) antes do `git switch -c`. Nada do dono é commitado — `git add` por caminho.
- **Trap de ferramenta nova, e é do shell desta sessão:** `grep` é uma **função de shell** (do snapshot do zsh) e devolve vazio para padrões que o `/usr/bin/grep` casa — a listagem de cabeçalhos do STATE.md voltou vazia três vezes até trocar para `/usr/bin/grep`. Em script de medição, usar `/usr/bin/grep` explícito (ou `git grep`), nunca `grep` seco.
- **Unidade escolhida: fatia F2+F3** (tokens de estado). A "decisão do F1" que a 14ª invocação pediu antes dela foi **medida em vez de assumida** — ver a seção da fatia abaixo: o que `@utility` herda de cascata é exatamente o que `text-destructive` já tem hoje, e o Defeito 3 do F1 (Radix × `--color-background`) não alcança nenhum token do trio.

### Fatia F2+F3+F9b — aplicada (2026-09-04)

Issue [#120](https://github.com/Simplify-Technology/boilerplate/issues/120) · PR [#121](https://github.com/Simplify-Technology/boilerplate/pull/121) **aberto, aguardando merge do dono**. Commit `4acc22b` sobre `origin/main` = `5b40183`. 60 testes novos (front 40/326 → **42/386**), **12 mutações, todas mordem**, os dois gates exit 0 (rodados também pelo `pre-push`, sem `SKIP_GIT_HOOKS`).

**O que entrou.** F2: os 6 pares `--color-success/warning/info(-foreground)` no `@theme`. F3: sólidos recalibrados (claro: green-700/amber-700/sky-700, rótulo branco; escuro: rose-400 no lugar de `#f43f5e`, rótulo navy em todos, como já era em `--primary`) + trio `--state-{success,warning,info,destructive}-{bg,fg,border}` nos dois temas + 16 `@utility` por PAPEL (`bg-state-X`, `text-state-X`, `border-state-X`, `state-X-soft`). F9b: `Alert destructive` vira o callout do trio. Metade visual do **E6** (`InputError` → `text-state-destructive`). `Button`/`Badge` destrutivos consomem o par em vez de `text-white`; item `destructive` do `DropdownMenu` deixa de ser branco sobre branco; `delete-user`, `user-actions-menu` e `role-users-table` migram do literal para o token. `theme-tokens.test.ts` ganhou avaliador de `color-mix(in oklab)` e o contrato do trio; `state-color-consumers.test.ts` (novo, teste de fonte) trava o papel de cada token no call site; `.ai/rules/css.md` e `js.md` com as regras.

**Seis fatos que esta fatia produziu:**

1. **A "decisão do F1" que represava o F3 era um falso pré-requisito, e foi medida em vez de assumida.** `@utility` emite na `@layer utilities` — a mesma de `text-destructive` — então o trio herda exatamente a cascata que todo utilitário já tinha; o que está fora de layer (46 `!important`, Radix) sombreia `text-state-X` tanto quanto sombreia `text-destructive` hoje. Isso é a V6T4/V6T6, não condição do F3. Conferido no compilado: `focus:text-state-success` @76033 sai depois de `focus:text-accent-foreground` @75843 (e `focus:bg-state-success` depois de `focus:bg-accent`), então o foco do item de menu vence sem configurar `tailwind-merge`.
2. **⚠️ O Defeito 3 do F1 (Radix × `--color-background`) é um BUG VISUAL VIVO no escuro, e ninguém tinha medido no browser.** Com `.dark` no `<html>`, a folha do Radix (sem layer) redeclara `--color-background: var(--gray-1)` em `:is(.dark, .dark-theme)` e em `:is(.dark,.dark-theme) :where(.radix-themes:not(.light,.light-theme))`. Medido por `getComputedStyle` na página real: **`body` pinta `#111111`, `bg-background` dentro do `<Theme>` pinta `#111113`, e `var(--background)` é `#0f2a44`.** O canvas escuro do app não é o navy da marca — só o que usa `bg-card` é. No claro os dois valem `white` e o defeito é invisível. Toda medição "× navy" do teste de tokens para superfícies que usam `bg-background` está, na prática, medindo contra `#111` (direção segura: fundo mais escuro sobe o contraste de texto claro). **Vira fatia própria (V6T5/F6) com prioridade alta e risco ALTO** — a cura de menor raio é `@theme inline` só para o bloco de cores (o F1 mediu que `inline` quebra `var(--font-sans)` do toast e `var(--color-border, currentColor)` do preflight; os dois têm conserto de uma linha), e `hasBackground` do `<Theme>` também merece decisão. Registrado no BACKLOG.
3. **O polyfill de `color-mix` do Tailwind cai na PRIMEIRA cor da mistura.** `--state-success-bg: var(--success)}@supports (color:color-mix(in lab, red, red)){:root{--state-success-bg:color-mix(…)}}` — com o sólido na frente, browser sem `color-mix` pintaria texto verde-escuro sobre verde-escuro. O card vem primeiro em todas as 16 misturas e o teste trava a ordem. Regra que vale para qualquer token derivado por `color-mix`.
4. **O avaliador de OKLab do teste reproduz o browser hex a hex** (8/8: `#e5f0e7`, `#a9ccaf`, `#f8eae3`, `#e3edf4`, `#ffe8e8`, `#12444d`, `#156555`, `#37444b`). Fecha o ponto cego que a lente de risco apontou ("`color-mix` é invisível ao gate"): agora é medido, desde que fique em token e não em `bg-[color-mix(…)]` no JSX.
5. **Achado colateral que a fatia corrigiu de carona:** o item "Excluir" do menu de usuários (`user-actions-menu.tsx:156`, `variant="destructive"`) pintava `text-destructive-foreground` = **branco sobre o popover branco** no claro — invisível, mesma família do F9b, sem registro em lugar nenhum. E `dropdown-menu.tsx` e `alert.tsx` vendorizados carregam a versão antiga do shadcn (`-foreground` onde o upstream atual usa `text-destructive`): vale conferir os outros primitivos por esse padrão na V6 restante.
6. **Trap de ferramenta:** `grep` é função de shell no snapshot desta sessão e devolve vazio para padrão que `/usr/bin/grep` casa. E as regras do browser proíbem digitar senha, então a evidência visual saiu por injeção de markup na página pública `/login` dentro do `.radix-themes` (cascata real) — é o caminho para toda fatia de UI enquanto não houver suíte browser.

**Divergências deliberadas da origem:** nome `destructive` (não `error` como no ctfinance); `@utility` por papel (não `.state-X-soft` em `@layer components`); valores calculados aqui (3 dos 4 percentuais do ctfinance reprovam nesta paleta); o par emerald das telas de auth (14.38:1) **não** foi trocado — `state-success-soft` entrega 6–7:1 (AAA) e trocar 14 por 7 é escolha de desenho, decisão separada.

### Próxima unidade sugerida (após F2+F3)

Com o F3 aplicado, **destravou uma leva de fatias P que estavam represadas**, todas de prioridade 1:

1. **Metade visual do E12+E21** — `delete-confirmation-dialog.tsx` (13 literais) + `settings/delete-account-info-dialog.tsx` → trio; era "depende de `--color-warning` (F2)". Entra na lista de arquivos limpos do `state-color-consumers.test.ts`.
2. **V6F-4 + V6T10/V6D-3 + V6D-2/V6F-1 (F38)** — poda de `public/` (fonte duplicada de 79 KB, `preconnect` bunny, favicons órfãos e `<head>` sem ícone): P, risco baixo, o mais limpo da rodada.
3. **V6D-11** (trava do follow-up do E28: 3 idiomas de spinner) e **V6P-1** (`min-w-0` no `SidebarInset`), **V6S-2/V6S-4/V6P-5/V6P-6/V6F-6/V6F-7** — P, autossuficientes.
4. **V6T5/F6 (Radix × `--color-background`)** — agora com o bug do canvas escuro medido (fato 2 acima). É a fatia de maior impacto visual pendente e a de maior risco sem suíte browser: **decisão do dono** sobre o caminho (`@theme inline` no bloco de cores × `layer()` × abandonar `@radix-ui/themes`, que é a `[proposta-adr]` F27/V6P-9).
5. **F20** (catraca de literais de cor) — a lista de arquivos limpos já nasceu no teste de fonte desta fatia; a catraca de contagem decrescente entra quando a leva acima secar.

Alternativas: **dimensão 1 (Segurança) do cuidari ou do ctvitrine** (as duas com inventário e ponteiros), ou **inventário do sorteiopix** (matriz em 12/70; 3 projetos ainda sem célula 0).

### Fatia V6S-1 + V6T14 + V6T13 — aplicada (2026-08-31)

Issue [#118](https://github.com/Simplify-Technology/boilerplate/issues/118) · PR [#119](https://github.com/Simplify-Technology/boilerplate/pull/119) **aberto, aguardando merge do dono**. 29 testes novos (front foi de 39/297 para **40/326**), **9 mutações, todas mortas**, os dois gates exit 0.

**O que entrou.** `toastPromiseOptions` em `lib/toast-config.ts` + os 6 call sites; `iconTheme` morto removido de aviso e info com asserção simétrica no lugar; terceiro par (objeto gráfico × superfície, 3:1) no `theme-tokens.test.ts` com catraca datada de 3 dívidas; guarda de call site nova (`test/lib/toast-promise-call-sites.test.ts`); `.ai/rules/css.md` e `.ai/rules/js.md` corrigidas/estendidas; comentário em `app.css` sobre os dois tokens que a fatia orfanou.

**Quatro fatos que esta fatia produziu, e três são de método:**

1. **A prova de que o `<Toaster>` não alcança `ariaProps` está no merge, não na doc.** `createToast` grava `ariaProps: {role:'status','aria-live':'polite'}` no PRÓPRIO toast e o merge do provider é `{...defaults, ...defaults[type], ...toast}` — o toast é o último spread e sempre vence. Isso significa que **nenhuma configuração de provider** pode consertar severidade: o canal é por chamada, e só. Vale como fato reutilizável para toda fatia futura que quiser "centralizar" comportamento de toast — só `style` (que é merge de um nível) e `duration` (que tem cadeia própria de fallback) são centralizáveis.
2. **A morte do `iconTheme` de warning/info é DUPLA, e isso muda o conserto.** `ToastIcon` sai pelo ramo do `icon` antes de olhar `iconTheme`, E devolve `null` no tipo `blank`. Como aviso/info têm as duas condições, apagar o emoji para "ativar" o `iconTheme` não funcionaria — deixaria o toast sem ícone nenhum. Foi por isso que a fatia acrescentou a asserção que **preserva o emoji**: sem ela, a próxima pessoa lê "iconTheme é o canal certo" na regra e apaga a coisa errada.
3. **⚠️ Catraca de dívida grava o PISO da medição, nunca o arredondado.** Escrevi `2.15` (o número que o BACKLOG cita) para um par que mede `2.1476…`, e `2.28` para um que mede `2.2786…`. As duas catracas nasceram **vermelhas**, porque `toBeGreaterThanOrEqual(2.15)` reprova 2.1476. O valor certo é `Math.floor(medido * 100) / 100`. **O número que a célula de varredura publica é arredondado para leitura; o teste precisa do piso.** Isto vale para toda dívida datada que as fatias do F1/F2/F3 forem acrescentar.
4. **A asserção de simetria pegou erro meu que nenhum outro teste pegaria.** Escrevi uma tabela de dívida com 5 linhas e uma tabela de pares medidos que, corretamente, excluía warning/info do glifo (eles não desenham disco). Duas linhas de dívida ficaram órfãs — autorizando contraste que ninguém mede. A asserção "toda chave de dívida corresponde a um par medido" ficou vermelha e me mandou apagar as duas. **Toda tabela de exceção precisa de uma asserção que a amarre à tabela que ela excepciona**; sem isso a dívida sobrevive ao par e vira licença permanente.

**Efeito colateral registrado, não escondido:** `--warning-foreground` e `--info-foreground` ficaram **sem consumidor** (o `iconTheme` morto era o único). Ficaram no `app.css` com comentário, porque o par `--X`/`--X-foreground` é o contrato que o **F2** exporta ao levar `--success`/`--warning`/`--info` para o `@theme`. É insumo do F2, não dívida nova.

### ~~Próxima unidade sugerida: **F1** (decisão, não só fila)~~ — superada em 2026-09-04: a decisão foi medida dentro da fatia F2+F3 (ver acima)

O BACKLOG e a secagem da dimensão 6 concordam: a ordem é **F1 → F2 → F3 → resto da dimensão 6**. O F1 precisa ser *decidido*, não só enfileirado, porque o F3 depende dele — `@utility` emite dentro de `@layer utilities`, a camada mais fraca do arquivo, que perde para os 46 `!important` fora de layer e para os 812 KB do Radix não-layerizado.

Esta fatia deixou dois insumos prontos para o F2/F3: os dois tokens órfãos comentados no `app.css`, e a tabela de dívida do par gráfico já medida e amarrada.

**Alternativas:**

- **Dimensão 1 (Segurança) do cuidari ou do ctvitrine** — as duas com inventário e ponteiros já listados.
- **Fatia de deps** — ver a reconciliação abaixo: o dependabot **já abriu** a PR de composer minor/patch (#116) e a de npm (#117), que era o grosso do que o levantamento de 2026-08-20 planejava. O que sobra de nosso é o pin `typescript ^6.0.3 → ~6.0.3` do PLAYBOOK §4 — fatia minúscula, e agora quase autossuficiente demais para gastar uma unidade.

### Reconciliação da 14ª invocação (2026-08-31)

Feita ANTES de qualquer ação.

- **PR #112 (E26) confirmado MESCLADO**; `origin/main` em **`beb848e`**, o mesmo da 13ª invocação. A rodada entrou nesta invocação com **zero PR de fatia aberto e zero fatia em andamento** ⇒ Prioridade 1 do protocolo (fatia pronta do BACKLOG) era a unidade correta, e a fatia recomendada pela secagem da dimensão 6 (V6T13+V6T14+V6S-1) foi executada inteira.
- **⚠️ Novidade que o STATE não previa: TRÊS PRs de dependabot estão ABERTAS** — #114 (`actions-minor-patch`, codeql 4.37.6→4.37.7), **#116 (`composer-minor-patch`, 7 pacotes)** e **#117 (`npm-minor-patch`, 16 pacotes)**; #113 e #115 foram fechadas por superseding. **Consequência direta para a prioridade 3 do protocolo:** o levantamento de deps de 2026-08-20 planejava uma fatia nossa de composer minor/patch, e o dependabot a cobriu sozinho. Sobra o pin `typescript ^6.0.3 → ~6.0.3` (mina do PLAYBOOK §4), que o dependabot **não** faz. As três PRs são do dono para mesclar; não abrir fatia concorrente sobre os mesmos lockfiles.
- **Sexto drift do spinmax e do ctvitrine:** spinmax em **`fdd499e`** (era `9fd04be`; pin `e4ec01e`), ctvitrine em **`f9f17f6`** (era `c62438a`; pin `53d7d9a`). Os outros 5 idênticos aos pinados. Pin inalterado — commits novos das fontes ficam para a próxima harvest, registrados no RELATORIO como "evoluiu durante a rodada".
- **Alvo estável durante a célula:** `origin/main` era `beb848e` no início E no fim da fatia (a prática que a 13ª invocação mandou adotar depois de o alvo andar no meio da dimensão 6). Nenhum candidato precisou de re-conferência.
- **Worktree principal:** o WIP do dono em `docs/migration/PLAYBOOK.md` e `docs/migration/projects/transitado-em-julgado.md` (+ `.claude/commands/` não rastreado) seguia presente e **não foi commitado** — `git add` explícito por caminho, os 10 arquivos da fatia. Conferido antes do `git switch -c` que `origin/main` não tocava nenhum dos dois caminhos.
- **Hooks rodaram de verdade** neste worktree (lint-staged no pre-commit, os dois `ci:check` no pre-push). Sem `SKIP_GIT_HOOKS`.

---

### Dimensão 6 (UI) do ctvitrine — célula ✅ (2026-08-20)

**45 candidatos · 30 sobrevivem · 15 derrubados.** Material em `ctvitrine.md` (o arquivo foi a 961 KB); candidatos priorizados em `BACKLOG.md`. Custo total da célula **~6,6M tokens de subagente** em duas passadas — a mais cara da rodada, e a única que precisou de retomada.

**⭐ O F3 está DESTRAVADO.** A linha de comparação do tema multi-fonte "tokens de estado" está fechada no BACKLOG com os quatro concorrentes medidos. Veredito: **o F3 canoniza o DESENHO do ctfinance dentro do MÉTODO do boilerplate, com a TÉCNICA do ctvitrine, e não copia valor de ninguém** — o ctfinance vence a forma (o trio que separa preenchimento de texto), o ctvitrine vence a técnica (`color-mix(in oklab)`, que é o idioma do Tailwind 4.3 instalado — 159 ocorrências no CSS compilado do alvo), o boilerplate vence o guard-rail (é o único dos quatro que mede contraste) e o cuidari perde (colisão de token ainda viva).

**Três coisas que a célula mudou no F3, e nenhuma estava na cadeia original:**

1. **`@utility` emite dentro de `@layer utilities`, a camada mais fraca do arquivo** — perde para os 46 `!important` fora de layer e para os 812 KB do Radix não-layerizado. **O F3 depende do F1 estar DECIDIDO, não só enfileirado.**
2. **São TRÊS pares a medir, não dois.** O terceiro é *objeto gráfico × superfície do toast* (3:1, SC 1.4.11), e ele tem **quatro** canais hoje — dois reprovando por token (borda `warning` 2.15:1, `info` 2.77:1 no claro; `iconTheme` `success` 2.28:1 no escuro) e um **fora de qualquer token**: `toast.promise`, disco `#61d345` a **1.92:1**, em 6 call-sites.
3. **Há contraste bom a preservar:** o par emerald das telas de auth está em **14.38:1**, e não em uma página — são **três** (`forgot-password.tsx:30`, `login.tsx:44`, `verify-email.tsx:25`), com um segundo par a 7.03:1. Correção minha ao texto dos agentes, que falavam só de `verify-email`.

**⚠️ O padrão "nenhum candidato passa intacto" QUEBROU, depois de 4 células.** Dois passaram sem redução de escopo — **V6F-4** (79 KB de fonte duplicada por artefato de Finder vivendo no `origin/main` **daqui**, com zero referências: o único cujos números todos reproduziram sem correção) e **V6T14** (`iconTheme` morto, que as 3 lentes **ampliaram** em vez de cortar, achando a terceira cópia da afirmação falsa em `.ai/rules/css.md:20-21`). Um terceiro saiu ampliado: **V6D-11**, de 9 para 15 infratores. Isso não afrouxa a verificação — dois dos três são achados sobre o **próprio boilerplate**, onde a lente tem o código à mão e erra menos.

**Fact-check meu antes de gravar:** re-medi as afirmações capazes de inverter decisão e **todas reproduzem** — 6 call-sites de `toast.promise`; defaults `#61d345`/`#ff4b4b`/`#616161` da lib instalada; `DIVIDA_DESTRUCTIVE_ESCURO = 3.67` com a catraca `toBeLessThan(4.5)`; a dupla emissão de `.font-title` (byte 44.554 dentro de `@layer utilities{`, que abre em 16.742, × byte 815.278 **fora de qualquer layer**, com `!important`); 46 `!important`; 159 `color-mix(in oklab`; e o 14.38:1 que a secagem marcou como não medido.

~~**Próxima unidade sugerida: a fatia V6T13 + V6T14 + V6S-1**~~ ✅ **executada na 14ª invocação (2026-08-31) — PR [#119](https://github.com/Simplify-Technology/boilerplate/pull/119)**. Era prioridade 1 do protocolo (fatia pronta), e a própria secagem argumentava que ela ia **antes do F1**. Mesma família (tokens de estado × os canais que os consomem), os três P, os três executando política já escrita e já furada (`.ai/rules/css.md:12` manda acrescentar a linha na tabela do teste no mesmo commit do token). Separá-los faz o V6T13 travar contraste de tokens que o V6T14 vai apagar, e deixa o V6S-1 travando um canal que o V6T13 acabou de justificar. Fecha a Definition of Done sem gate de browser: é teste de estilo lendo CSS + teste de componente, os dois idiomas que o boilerplate já tem.

Depois dela, na ordem: **F1** (decisão, não só fila — o F3 depende dela) → **F2** → **F3** → o resto da dimensão 6.

**Alternativas se a preferência for outra:** fatia de deps (levantamento pronto abaixo, autossuficiente, sem decisão do dono) · dimensão 1 (Segurança) do cuidari ou do ctvitrine, as duas com inventário e ponteiros listados.


**Reconciliação da 13ª invocação (2026-08-20, noite).** Feita ANTES de qualquer ação, com a unidade 3 ainda em voo.

- **PR #112 (E26) foi MESCLADO** pelo dono às 00:04 UTC de 21/08 — `origin/main` avançou de `2965f8c` para `beb848e`. A rodada volta a **zero PR aberto**; 31 fatias mescladas.
- **Quinto drift do spinmax/ctvitrine:** spinmax em **`9fd04be`** (era `5864ea7`, pin `e4ec01e`); ctvitrine segue em `c62438a` (pin `53d7d9a`). Os outros 5 idênticos aos pinados. Pin inalterado — os commits novos das fontes ficam para a próxima harvest, registrados no RELATORIO como "evoluiu durante a rodada".
- **⚠️ Consequência do merge para a unidade 3, e é preciso anotar:** os 17 agentes da dimensão 6 mediram o alvo contra `origin/main` = **`2965f8c`**, que era o ref correto no momento em que rodaram. O merge do #112 (que toca `ui/sidebar.tsx`, `lib/keyboard.ts` e `.ai/rules/js.md`) aterrissou **durante** a execução. Qualquer candidato da célula que fale de `ui/sidebar.tsx`, de atalho de teclado ou da regra de `js.md` precisa ser re-conferido contra `beb848e` antes de virar fatia. É o mesmo gênero da "quarta pegadinha" (baselines do lado alvo), com uma camada nova: **o alvo pode andar no meio de uma célula longa.** Para as células grandes seguintes, anotar o SHA do alvo no início E no fim da execução.


**Reconciliação da 12ª invocação (2026-08-20).** Sete dias sem invocação; a rodada voltou com passivo de merge inteiramente resolvido pelo dono.

- **Os TRÊS que o STATE dava como abertos foram mesclados:** #104 (E21+E12), #106 (E28) e #108 (F32), todos em 2026-08-17. Corrigido na tabela de fatias **antes** de executar qualquer unidade. `origin/main` em `2965f8c`.
- **Duas PRs de dependabot entraram sozinhas na `main`:** #109 (`actions-minor-patch`) e #110 (`npm-minor-patch`) — `lucide-react` 1.28→1.31, `vite` 8.2.0→8.2.1, `@testing-library/jest-dom` 7.0.0→7.0.1, `@types/node` 26.1.2→26.2.0, `eslint` 10.8.0→10.8.1. **Consequência para o levantamento de deps (prioridade 3 do protocolo): o patch/minor de npm está em dia sem fatia nossa;** o que sobra para a primeira fatia de deps é o lado do composer e o pin `typescript ^6.0.3 → ~6.0.3` do PLAYBOOK §4.
- **Drift em DUAS fontes, e é o quarto do ctvitrine:** ctvitrine em **`c62438a`** (era `734acac`, antes `bda5e6b`, antes `89251fc`; pin `53d7d9a`) e spinmax em **`5864ea7`** (era `e4ec01e` = o pin). Os outros 5 seguem idênticos aos pinados. O pin da rodada não muda: ler por `git -C <fonte> show <SHA-pinado>:<arquivo>`.
- **O worktree principal seguia na branch `107-...` já mesclada**, com trabalho não commitado do dono em `docs/migration/PLAYBOOK.md` e `docs/migration/projects/transitado-em-julgado.md` (+ `.claude/commands/` não rastreado). Conferido que `origin/main` **não** tocou nenhum desses caminhos antes de trocar de branch, então o `git switch -c` carregou o WIP sem conflito. **Nada do dono foi commitado** — o `git add` desta fatia é explícito por caminho, nunca `git add -A`.

~~**E26**~~ ✅ aplicado — PR [#112](https://github.com/Simplify-Technology/boilerplate/pull/112) aberto. **A fila de fatias P do BACKLOG está agora VAZIA de verdade:** sobra só o **F7** (cor de marca, decisão do dono) e o que espera F2/F3.

**Três fatos que esta fatia produziu:**

1. **O jsdom não implementa `isContentEditable`** — a propriedade fica `false` sempre. A guarda escrita "certa" (só a propriedade, que é a correta no browser porque é **herdada** e cobre o nó interno onde o caret pousa) passava no browser e era **inexercitável** no gate. A forma final checa a propriedade **e** `closest('[contenteditable]:not([contenteditable="false"])')`, que cobre a mesma hierarquia pelo atributo. Descoberto pelo teste falhando, não por leitura. **Regra que nasce daí, e vale para toda fatia de a11y adiante:** quando o guard-rail depende de API de DOM, conferir se o jsdom a implementa **antes** de declarar o teste como prova — a mutação 3 desta fatia é exatamente essa medição.
2. **A absorção não era de código, e o BACKLOG já sabia.** `ctfinance ui/sidebar.tsx` é **byte-idêntico** ao daqui e igualmente sem guarda. O ativo colhido do derivado foi a **comparação** — é o quarto caso da rodada em que ler o derivado ao lado do boilerplate revelou defeito de casa em vez de código a portar (os três primeiros estão registrados em "O que a dimensão 4 ensinou"). A forma da dica de atalho (tooltip) veio de `dashboard/balance-visibility-toggle.tsx:58,77`, e é a única linha de fato colhida.
3. **A trap do zsh sem word-splitting mordeu de novo, e silenciosamente.** A bateria de mutações rodava `vitest run $T` com `T` guardando dois caminhos; o zsh passa isso como **um argumento só**, o vitest não casa arquivo nenhum, e o `grep` da linha de resultado volta vazio — cinco mutações "sem saída" que pareciam problema de captura. Já está registrado em "Trap de ambiente: zsh não faz word-splitting" (fatia F42+F35) e reapareceu mesmo assim. **Em script de mutação, escrever os caminhos por extenso.**

~~**Próxima unidade: célula 0 (inventário) do ctvitrine**~~ ✅ executada nesta invocação (2ª unidade) — ver a seção do inventário abaixo. Matriz em **11/70**.

**Próxima unidade sugerida:** **dimensão 6 (UI) do ctvitrine** — é a que a rodada está esperando desde 2026-08-12. O **F3** (trio `--state-{status}-{bg,fg,border}`) está represado há oito dias com uma catraca esperando por ele no teste do F1, e a pergunta de abertura da dimensão 6 é literalmente "qual projeto tem o sistema mais maduro de tokens". Os dois L13 + Inertia 3 em produção agora têm inventário (cuidari em 12/08, ctvitrine hoje), então **a condição que o F3 aguardava está satisfeita assim que esta célula fechar** — e ela já tem material pronto: `app.css` de 721 linhas com **52 `!important`** e 40 tokens no `@theme`, `_fonts.css` com 34 `@font-face` self-hosted, `var(--palette-primary)`/`var(--palette-accent)` com **zero uso**, e o bloco pré-paint do `app.blade.php:114` usando `var(--palette-primary-dark)` (mesmo gênero de bug do D4, já corrigido aqui).

Alternativas, se a invocação for curta ou se a preferência for fechar dívida:

- **Fatia de deps** (prioridade 3 do protocolo, e o levantamento já está feito — ver abaixo): 10 diretos do composer em patch/minor, **zero major**, mais o pin `typescript ^6.0.3 → ~6.0.3` do PLAYBOOK §4. Autossuficiente e sem decisão do dono.
- **Dimensão 1 (Segurança) do cuidari** ou **do ctvitrine**: as duas com inventário e ponteiros já listados.

**Levantamento de deps de 2026-08-20 (feito, ainda sem fatia).** `composer audit` e `pnpm audit --prod` **limpos**. Composer com **10 diretos** em patch/minor e **zero major**: `laravel/framework` 13.24.0→13.26.1, `spatie/laravel-activitylog` 5.0.0→5.1.0, `rector/rector` 2.6.1→2.6.3, `laravel/sail` 1.65→1.67, `mockery` 1.6.12→1.6.15, `laravel/boost` 2.5.3→2.5.5, `laravel/horizon` 5.48.2→5.48.3, `pestphp/pest` 5.1.0→5.1.1, `phpunit` 13.3.0→13.3.1, `tightenco/ziggy` 2.6.3→2.6.4. npm com 5 patch/minor (`@testing-library/user-event`, os dois `@typescript-eslint`, `globals`, `laravel-vite-plugin`) — **o dependabot já cobriu o grosso sozinho nas PRs #109/#110**. **`typescript 6.0.3 → 7.0.2` NÃO se toma**: typescript-eslint suporta `<6.1`, e o pin do `package.json:57` ainda é `"^6.0.3"`, que já permite o 6.1 que não existe suporte — a fatia troca por `~6.0.3`, que é exatamente a mina registrada no PLAYBOOK §4.


**Reconciliação da 10ª invocação (2026-08-13):** os TRÊS que o STATE dava como abertos — **#98 (E22+E24)**, **#100 (E27+E29)** e **#102 (E18+E23+E25)** — foram **mesclados** pelo dono (12/08 23:41, 13/08 01:02, 13/08 13:02). Corrigido na tabela de fatias antes de executar qualquer unidade. `origin/main` em `54f9b13` (o `main` local estava em `8b0381b`, atrás). **Zero PR aberto, zero fatia em andamento** ⇒ Prioridade 1 do protocolo (fatia pronta do BACKLOG) é a unidade correta, e é o momento ideal para uma fatia de frontend: sem outro PR aberto, não há a colisão de append em `.ai/rules/js.md`.

**Terceiro drift do ctvitrine:** working tree em **`734acac`** (era `bda5e6b`, antes `89251fc`). O pin da rodada segue `53d7d9a`; ler por `git show 53d7d9a:<arquivo>` continua obrigatório. Os outros 6 seguem idênticos aos pinados.

~~**E21+E12**~~ ✅ aplicado — PR [#104](https://github.com/Simplify-Technology/boilerplate/pull/104) aberto. `description` virou obrigatória no tipo do `DeleteConfirmationDialog` com render incondicional, e o parágrafo de consequência ganhou `confirmationNote?: ReactNode`. 10 testes num componente que tinha **zero**, 6 mutações.

**Três fatos que esta fatia produziu:**

1. **A mutação mais importante passou VERDE na primeira rodada — pela segunda vez na rodada (a primeira foi no E17).** Com `description` sempre preenchida nos testes, voltar ao render condicional era indistinguível do incondicional. O tipo obrigatório **não** impede `''` (TypeScript aceita string vazia), e é só nesse caso que a diferença é observável: o nó some e o `aria-describedby` do Radix aponta para id inexistente. O teste que faltava entrou em commit próprio antes do PR. **Padrão que já se repetiu:** quando a correção é "tornar obrigatório", o teste natural usa o valor bom e nasce cego ao caso degenerado que o tipo ainda permite.
2. **Divergi da origem de propósito, e é a quarta vez na rodada.** O ctfinance mantém `description?` opcional com fallback genérico (`description?.trim() || 'Confirme se deseja continuar. A exclusão é permanente.'`). Absorver isso reabriria o caminho da descrição vaga que a obrigatoriedade fecha — fallback transforma "esqueci de descrever" em texto plausível que passa na revisão. **Escopo certo maior que o da origem** desta vez, ao contrário das três anteriores (E18/E23, E22+E24, E27+E29), em que foi menor.
3. **A BACKLOG entry E21 é internamente inconsistente, e o disco decidiu.** Ela manda "remover o `role="button"` redundante em `page-info.tsx:72`" **e**, três linhas abaixo, declara `PageHeader` "componente com 0 call sites — mexer nele é arrumar código morto". `PageHeader` é o **único** caminho até o `PageInfo` (`git grep "PageHeader\|page-header"` fora do próprio arquivo → vazio), então a cadeia inteira é morta e as duas metades da entrada se contradizem. Ficou fora da fatia; a poda dos dois arquivos vai para a sequência do #100.

**Nota de tipo que vale para as próximas fatias:** mutação de TIPO não é observável no Vitest — `corepack pnpm types` é o gate dela. As mutações 3 e 4 desta fatia foram o par que mede isso (tirar a prop do call site ⇒ `TS2741`; devolver o `?` ao tipo ⇒ passa), e é a forma de provar que um contrato de tipo está de fato mordendo.

### Inventário do cuidari — célula 0 ✅ (2026-08-12)

`docs/harvest/v2/cuidari.md` (330 KB, 3.437 linhas). Workflow de 9 agentes em **duas passadas** — 2.05M tokens de subagente, 808 chamadas de ferramenta, ~53 min. Read-only integral; nenhum `.env` aberto; varredura de segredo/PII limpa antes do commit.

**A 1ª passada perdeu a frente 3 (camada de domínio) por erro de conexão da API, e o crítico apanhou sozinho.** Ele mediu o buraco — `app/Services` 38 arquivos / 6.101 LOC (mais que os controllers, que foram enumerados), `app/DataTransferObjects` 25 com **zero menções**, `app/Http/Resources` 30 com 29 não citados, `app/Rules` 3, e as 100 abilities das 16 policies contadas mas nunca lidas: ~8.700 LOC. A frente foi refeita com escopo endurecido e o crítico rodou a 2ª passada sobre o conjunto completo. **Isto valida o crítico como não-opcional pela segunda rodada seguida — e desta vez ele pegou uma falha de INFRAESTRUTURA, não de leitura.**

**Duas lições de método, ambas caras:**

1. **Frente que morre por erro de API não avisa ninguém.** O `parallel()` resolve a thunk como `null` e o workflow segue com 7/8. Sem crítico, a célula teria sido declarada ✅ com a camada de domínio inteira faltando — e as dimensões 1, 2 e 3 do cuidari julgariam RBAC, contrato de serialização e regra de negócio com metade da evidência. Para os 4 inventários restantes: **conferir `frentes_ok === 8` antes de montar o documento**, e refazer a frente perdida via `resumeFromRunId` (o cache replaya as 7 boas de graça).
2. **Verificador com baseline errado é pior que verificador nenhum** — ver a QUARTA PEGADINHA na seção de traps. O crítico produziu uma tabela de 12 "números derrubados" com aparência de autoridade, e 11 estavam errados. O que salvou foi re-executar as contagens dele antes de gravar. O banner de correções do `cuidari.md` é o **meu**, não o dele; o dele fica preservado no documento com a revogação explícita em cima.

**Reconciliação da 11ª invocação (2026-08-13):** **#104 (E21+E12) mesclado** — o STATE dava como aberto. `main` em `028dd78`. Zero PR aberto e zero fatia em andamento na entrada, então Prioridade 1 (fatia pronta) foi de novo a unidade correta. Os 7 SHAs das fontes seguem nos pinados (o drift do ctvitrine continua sendo o único da rodada, e o pin não muda).

~~**E28**~~ ✅ aplicado — PR [#106](https://github.com/Simplify-Technology/boilerplate/pull/106) aberto. `loading`/`loadingText`/`aria-busy` no `ui/button.tsx`, `busy → loading` no CTA do `ui/confirm-dialog.tsx`, `asChild` redundante fora do `delete-user.tsx`. 20 testes novos (13 no `Button.test.tsx`, incluindo os 2 que travam a divergência do `asChild`), 6 mutações. Gates: 416/2046 no back, 37 arquivos/274 testes no front.

~~**F32**~~ ✅ aplicado — PR [#108](https://github.com/Simplify-Technology/boilerplate/pull/108) aberto. Segunda unidade da mesma invocação, e a mais barata da rodada até agora. Saíram de `app.css` 4 blocos `[class*='toast-icon'], [data-icon]`, o par `[data-state='entering'|'exiting']` e as 2 `@keyframes` que só eles usavam. 4 asserções novas travando o `iconTheme` (o canal que de fato funciona), regra em `.ai/rules/css.md`, CSS do bundle 824,70 → 824,00 kB.

**O que a verificação mudou no escopo, e é o padrão da rodada de novo:** o BACKLOG registrava o F32 como uma linha de tabela ("animação de toast é CSS morto"), sem entrada detalhada. A checagem no `dist/` da lib mostrou que o buraco era **maior** que o registrado — os 4 blocos de ícone estavam mortos pelo mesmo motivo e ninguém tinha contado — e ao mesmo tempo que a intenção deles **já estava viva** pela API certa (`iconTheme`, nas 4 variantes de `lib/toast-config.ts`). Sem essa segunda metade, a poda teria parecido perda de recurso em vez de remoção de duplicata morta.

**Fato corrigido durante a escrita, que vale como aviso:** meu primeiro comentário no CSS dizia que a lib "troca uma classe entre os dois estados". É falso — ela aplica `animation:` por **style inline** derivado de `t.visible` (verificado no `dist/index.js`). Comentário errado dentro do arquivo é exatamente o tipo de desinformação que a fatia estava removendo; corrigido antes do commit. Guardrail 5 vale para o comentário, não só para a regra.

**A lição da fatia E28 é sobre o EXPERIMENTO de mutação, não sobre o código.** Duas das 6 mutações "sobreviveram" e as duas eram falso negativo do meu próprio script:

1. A regex `s/disabled=\{isDisabled \|\| undefined\}/.../` casou **`aria-disabled`** primeiro (é superstring do alvo) e mutou a linha errada — o teste passou porque a mutação que eu queria nunca chegou a existir. **Toda mutação por regex precisa ser conferida com `grep` na linha mutada antes de se ler o resultado.** Mutação que "sobrevive" é hipótese a investigar, nunca conclusão. Refeita com âncora de início de linha, ela mata.
2. A remoção do `aria-hidden` do ícone sobreviveu de verdade — e a investigação achou o motivo: `lucide-react@1.28.0` já injeta `aria-hidden` em ícone sem prop de a11y (`dist/cjs/lucide-react.js:92`). A linha da origem era redundante. **Absorvi removendo-a**, mantendo o teste como guarda do resultado. É a quarta vez na rodada que o escopo certo é MENOR que o da origem — e a primeira em que quem apontou o excesso foi a mutação, não a lente.

**Consequência de método para o resto da rodada:** o par "mutação sobreviveu" tem exatamente duas leituras — teste fraco ou linha morta — e as duas exigem ação. Nenhuma delas é "seguir em frente".

**Achado que atravessa a fronteira e vale para o boilerplate também:** `Password::defaults()` é chamado em 5 lugares do cuidari e **não é definido em lugar nenhum** — política de senha no default do Laravel (`min:8`, sem `uncompromised`) num app com CPF, RG e prontuário. Confirmar se o boilerplate tem o mesmo buraco é candidato natural da dimensão 1.

**Reconciliação da 9ª invocação (2026-08-12):** `main` **inalterada** em `9650ea5`; #98 e #100 seguem abertos e MERGEABLE — primeira invocação da rodada que entra com PR do dono ainda por mesclar. **Segundo drift do ctvitrine:** `89251fc` → `bda5e6b`. O pin segue `53d7d9a`; a instrução de ler por `git show` continua valendo e ficou mais necessária.

~~**E18+E23+E25**~~ ✅ aplicado — PR [#102](https://github.com/Simplify-Technology/boilerplate/pull/102) aberto. A região viva desceu da página para o `SearchBar` e passou a anunciar o **desfecho** (inclusive "nenhum resultado", o caso em que o silêncio confunde mais); o `<div role="button">` da lupa perdeu o papel falso; erro e aviso viraram `assertive` no `ariaProps`, sucesso e info ficaram `polite` com teste travando os dois sentidos. 17 testes, 6 mutações.

**Decisão de escopo que diverge do ctfinance e vale registrar:** lá o slot da lupa virou `<button type="button">`. Aqui **não** — o único efeito do controle é focar o campo que está ao lado e já é o próximo na ordem de tabulação, então um botão real seria parada de tab que não leva a lugar nenhum. Regra generalizada em `.ai/rules/js.md`: promova a `<button>` só quando a ação não existir em outro lugar alcançável; caso contrário remova o papel falso e marque `aria-hidden`. **Absorver o ctfinance não é copiá-lo** — é a terceira vez nesta rodada que o escopo certo é menor que o da origem.

**Custo de leva confirmado, agora com 3 PRs:** #98, #100 e #102 todos apendam em `.ai/rules/js.md`. O conflito é textual e append-only nos três (resolução = manter as três seções), mas ele existe e cresce linearmente com PRs de frontend abertos por leva. Isso é argumento operacional para intercalar unidades de VARREDURA entre fatias, não só a razão de mérito.

**Reconciliação da 8ª invocação (2026-08-12):** **#96 (E30) mesclado** — o STATE dava como aberto. `main` em `9650ea5`. Zero PR aberto e zero fatia em andamento na entrada, então Prioridade 1 (fatia pronta) foi a unidade correta.

**⚠️ PRIMEIRO DRIFT DA RODADA — ctvitrine.** A fonte saiu de `53d7d9a` para **`89251fc`** (8 commits, 2026-08-12): copy da landing (razão social/CNPJ no rodapé, badge RECOMENDADO, piso de preço anual, claim "Compra segura" removido), compressão de PNGs, um lote de specs e a remoção de um resíduo de imagem. **Nada estrutural** — não toca middleware, config, migrations nem `lang/`. Os outros 6 seguem idênticos aos pinados.

- **O pin NÃO muda:** ctvitrine continua ancorado em `53d7d9a` (regra da Fase 0). Registrado no RELATORIO.md como "evoluiu durante a rodada".
- **Consequência operacional para quando a célula 0 do ctvitrine rodar:** a working tree do projeto está em `89251fc` **e suja (10 arquivos)** — ler arquivo do disco lá agora entrega código que **não é** o do SHA da rodada, misturado com trabalho não commitado do dono. O inventário do ctvitrine tem de ler por `git -C <path> show 53d7d9a:<arquivo>` e `git -C <path> ls-tree -r 53d7d9a --name-only`, nunca por Read direto. Isso também é o que mantém o Guardrail 2 (read-only) honesto num projeto com dev ativo.

~~**E22+E24**~~ ✅ aplicado — PR [#98](https://github.com/Simplify-Technology/boilerplate/pull/98) aberto. Landmark nomeado no `SidebarContent`, `aria-current="page"` no item atual do `nav-main`, skip-link como primeiro focável apontando para o `<main>` do `SidebarInset`. `ui/sidebar.tsx` **não** foi tocado — landmark e `id` entram por prop do call-site, e o `id` atravessa `AppContent` (`{...props}`) até o primitivo. 10 testes renderizando a árvore real, 8 mutações, regra nova em `.ai/rules/js.md`.

~~**E27+E29**~~ ✅ aplicado — PR [#100](https://github.com/Simplify-Technology/boilerplate/pull/100) aberto. Quatro arquivos mortos apagados (`app-header-layout`, `app-header`, `ui/navigation-menu`, `user-details-dialog`), o `preventDefault()` que travava o dropdown aberto removido, a saída do banner virou `<button>` e o fundo saiu de `bg-teal-500` (**2.42:1**) para `bg-teal-700` (**5.39:1**). 5 testes, 8 mutações.

**Três coisas que esta fatia ensinou e não estavam previstas:**

1. **A catraca do F5 se pagou sozinha.** A asserção "não carrega entrada obsoleta na lista de mortos conhecidos", escrita naquela fatia, **cobrou** a remoção da isenção assim que o arquivo isento sumiu — o teste avisou em vez de apodrecer. Vale como modelo para toda lista de exceção que as próximas fatias criarem: escreva junto a asserção que exige esvaziá-la.
2. **`test/setup.ts` tinha um defeito que nenhum teste alcançava.** O mock de `ResizeObserver` era `vi.fn().mockImplementation(() => ({...}))` — arrow function não é construtível, e `new ResizeObserver(...)` estourava. Ninguém tinha percebido porque **nenhum teste renderizava elemento flutuante do Radix**. Consequência para o resto da rodada: qualquer fatia de UI que precise abrir dropdown/popover/tooltip estava bloqueada por isto, silenciosamente. Agora não está.
3. **A poda tem valor de diagnóstico, não só de peso.** Duas das quatro peças mortas fizeram caçadores desta rodada errarem o diagnóstico (E23 e E29). "Código morto = desinformação ativa" deixou de ser tese do BACKLOG e virou fato medido duas vezes.

**Fato novo que a fatia E22+E24 produziu, e que vale para as próximas:** o `<main>` real de toda página autenticada é o do `SidebarInset` (`ui/sidebar.tsx:303-315`) — confirmado em runtime pelo teste, não só por leitura. A correção que o BACKLOG já tinha registrado contra o caçador (que mandava ancorar no `<main>` de `app-content.tsx:14`, o ramo morto) estava certa.

**A cadeia F2/F3 continua represada, e agora com medida.** F2 sozinho exporta utilitários que **reprovam em AA no claro** (`text-warning` 2.15:1, `text-info` 2.77:1, `text-success` 3.30:1); ele só sai junto do F3, e o F3 é decisão fundacional de tokens de estado que espera a dimensão 6 do cuidari e do ctvitrine. Não force nenhum dos dois antes disso.

**Reconciliação da 7ª invocação (2026-08-12):** os TRÊS PRs abertos — **#82 (S2)**, **#86 (S5)** e **#88 (C4)** — foram mesclados pelo dono. `main` em `f43478a`. Os 7 SHAs das fontes seguem idênticos aos pinados: **zero drift** desde a abertura da rodada, 7 invocações atrás.

~~**S3**~~ ✅ aplicado — PR [#90](https://github.com/Simplify-Technology/boilerplate/pull/90) aberto. **Com isso a dimensão 1 do spinmax está esgotada de fatias aplicáveis:** S1, S2, S3, S4, S5 e C4 saíram; o que resta (S6–S13) é multi-fonte represado, `[proposta-adr]`, risco ALTO ou decisão do dono.

**Reconciliação da 6ª invocação (2026-08-12):** **#84 (S4) mesclado**; **#82 (S2) segue aberto**. `main` em `c599f05`. Os 7 SHAs das fontes seguem idênticos aos pinados — **zero drift** desde a abertura da rodada.

~~**S5**~~ ✅ aplicado — PR [#86](https://github.com/Simplify-Technology/boilerplate/pull/86) aberto. **Com isso a célula 1 do spinmax não tem mais fatia P pronta**: S1, S2, S4 e S5 saíram; sobra S3 (M, risco médio) e os S7–S13, todos com decisão do dono ou escopo grande.

**Reconciliação da 5ª invocação (2026-08-12):** os DOIS que o STATE dava como abertos — **#76 (F42+F35)** e **#80 (S1)** — já estavam **mesclados**. Corrigido acima antes de executar qualquer unidade. `main` local em `a3cc87e`. Os 7 SHAs das fontes seguem idênticos aos pinados: **zero drift na rodada até agora**. Nota operacional: `gh issue create` foi bloqueado pelo classificador de permissões na primeira tentativa desta sessão e passou na segunda, a pedido do dono — se repetir, é a mesma coisa.

~~**S2**~~ ✅ aplicado — PR [#82](https://github.com/Simplify-Technology/boilerplate/pull/82) aberto.

~~**S4**~~ ✅ aplicado — PR [#84](https://github.com/Simplify-Technology/boilerplate/pull/84) aberto.

**Fila de fatias prontas do BACKLOG (prioridade 1 do protocolo), em ordem sugerida:**

1. ~~**E27+E29**~~ ✅ · ~~**E18+E23+E25**~~ ✅ · ~~**E12+E21**~~ ✅ (a metade visual segue esperando o F2) · ~~**E28**~~ ✅ · ~~**F32**~~ ✅ · ~~**E26**~~ ✅ (PR #112) · **F7** (cor de marca — decisão do dono, único que sobrou).

> **A fila de fatias P prontas SECOU.** Sobrou o **E26** (P, autossuficiente) e o **F7** (decisão do dono). Todo o resto aplicável ou espera o F2/F3 — represados na dimensão 6 do cuidari e do ctvitrine —, ou é `[dep-nova]` sem aprovação. **A partir daqui varredura é a unidade mais rentável, sem competição:** a matriz está em 10/70 e quatro projetos ainda não têm inventário. Fazer o E26 antes do inventário do ctvitrine seria escolher a última fatia pequena em vez do que destrava as grandes.

**Próxima unidade sugerida:** **célula 0 (inventário) do ctvitrine** — é o que falta para destravar o F3/F2 (com o cuidari já feito, falta o segundo dos dois L13 + Inertia 3 em produção que a pergunta de abertura da dimensão 6 exige). Atenção dupla nesse: (a) **drift da fonte** — ler por `git -C <ctvitrine> show 53d7d9a:<arquivo>` e `ls-tree -r 53d7d9a`, porque a working tree está em `bda5e6b` e suja; (b) **baseline do alvo** — comparar por `git -C <boilerplate> show origin/main:<arquivo>`, nunca pelo disco nem por `main` seco.

Alternativa se a invocação for curta: **dimensão 1 (Segurança) do cuidari**, que agora tem inventário e cujos ponteiros já estão listados abaixo — inclui a regressão de PII no `share()` e o `Auth::attempt` sem `is_active`, os dois com contraparte já resolvida no boilerplate (direção inversa, vira guard-rail).

### Inventário do ctvitrine — célula 0 ✅ (2026-08-20)

`docs/harvest/v2/ctvitrine.md` (441 KB, 3.903 linhas). Workflow de **9 agentes** (8 frentes + crítico), **8/8 frentes concluídas, 0 erros**, ~1,38M tokens de subagente, 348 chamadas de ferramenta, ~31 min. Read-only integral sobre `53d7d9a`; nenhum `.env` aberto; nenhum comando de escrita ou execução tocou a fonte.

**A checagem `frentes_ok === 8` entrou no script** (lição do cuidari, onde uma frente morreu por erro de API e o `parallel()` a resolveu como `null` em silêncio). Passou de primeira: as 8 voltaram com texto, e o script ainda carregava o retry automático das perdidas, que não precisou disparar.

**Varredura de segredo/PII antes do commit:** zero chave, token, JWT, credencial em URL, CPF, CNPJ, telefone real ou endereço. **Duas redações minhas** (`demo@`/`contato@` → `***@ctvitrine.com.br`) — não são dado pessoal, mas uma é o login de um `SUPER_USER` de demo de produto em produção. O telefone `(16) 90000-0001` que aparece é fictício **por decisão da própria fonte** (comentário no seeder: "jamais um número real"). Achado que fica: o **mesmo** `DemoGarimpoSeeder` que redige as vendedoras carrega o telefone e o endereço **reais** da loja-âncora nos campos `whatsapp`/`pix_key`/`about_text` — as frentes citaram só nome de campo, o valor nunca entrou no documento.

**⚠️ O crítico acertou 8 de 8, e isso INVERTE o resultado do cuidari — a diferença é identificável.** No cuidari, 11 das 12 correções do crítico estavam erradas, todas pelo mesmo motivo: baseline medido contra `main` local. Aqui o prompt do crítico trazia o ref (`origin/main`, com o prefixo) escrito de forma literal **e** exigia o comando exato em cada linha derrubada. **Re-medi as oito, uma a uma, antes de deixá-las entrar no documento** — todas reproduzem. Vale para as 3 células de inventário restantes: **o que corrigiu o crítico não foi o modelo, foi o prompt dizer qual é o ref e cobrar o comando.**

**As oito derrubadas** (banner no topo do inventário): `RoleUserUpdatedEvent` "não é disparado" (**é**, em 2 call sites); `config/vitrine.php` "~380 linhas" (**487**); `reserved_slugs` "46" (**45**); helpers de teste "86 medido" (**83** com o pathspec citado, 96 com `tests` inteiro); `detectTls` "sem try/catch derruba o config" (**falso na causa** — o `new URL()` só roda no ramo `https://`); citação de linha do falso-positivo de `arch(` (**305**, não 148); 39 × 37 arquivos em `resources/js/test/` do boilerplate (**os dois certos, medindo coisas diferentes sem dizer**); "6 subdiretórios de `app/`" (a tabela lista 10, e `app/` tem **15**).

**O que só apareceu porque o crítico enumerou `public/`** — diretório que nenhuma frente abriu, e é o segundo maior do repositório: fonte `.woff2` **duplicada** por artefato do Finder (mesmo blob, 79 KB mortos); **4 favicons órfãos** (277 KB) incluindo o par `android-chrome-*` que só um `site.webmanifest` referenciaria — **e não existe manifest**; branding do produto anterior ainda versionado; e **85% do repositório são binários de demo e marketing** (29,2 MB de árvore, dos quais 13,0 MB de `.jpg` de seeder e 11,7 MB de `public/`). Fecha com uma assimetria que vale regra: o projeto tem `ImageOptimizer` que corta upload de lojista a 1600px/q82 e serve PNG de 2,28 MB cru na própria landing.

### Ponteiros do inventário do ctvitrine (fatos verificados @ `53d7d9a`, ainda SEM veredito)

| # | Fato | Dimensão dona |
| - | ---- | ------------- |
| 1 | **12 dos 15 middlewares são `Ensure*`** — módulo ativável por env em três estados (`off`/`demo`/`live`), com o único uso de middleware parametrizado do projeto (`EnsureMetricsMode::class . ':live'`) e ordem forçada por `prependToPriorityList` no `bootstrap/app.php` | 2 — ⭐ candidato forte, é a marca do projeto |
| 2 | `EnsureTermsAccepted` + `TermsAcceptance`: aceite click-wrap auditável, model com `$fillable` **vazio de propósito** (tudo por `forceFill`), registro imutável, e o grupo da própria tela de aceite fica **fora** do middleware para não fazer loop. Recibo por e-mail carrega o **texto integral** do termo, para sobreviver ao churn da instância | 1/5 — ⭐ candidato |
| 3 | `Services/Metrics/SessionHasher.php` (28 LOC): identidade anônima que **rotaciona por dia** — `sha256(data\|ip\|ua\|app.key)`, IP e UA nunca persistidos, `app.key` como pepper | 1 — ⭐ candidato · **compara com o `CpfHasher` do boilerplate** (contexto versionado × pepper diário) |
| 4 | `Rules/SafeLinkUrl.php` (60 LOC): allow-list para `href` de CTA — recusa `//host`, `/\host` e todo caractere de controle ` -`; `javascript:`/`data:` ficam impossíveis por construção | 1 — ⭐ candidato, generaliza para qualquer URL vinda de formulário |
| 5 | `Services/Signup/OpsBearer.php` (24 LOC): bearer com `hash_equals` e **config vazia nunca autoriza** — autorização artesanal fora do sistema de gates, em 2 endpoints que devolvem 20 chaves de PII (`payer_name`, `cpf_cnpj`, `email`, `phone`, ids do Asaas) | 1 — candidato **e** trap (PII em JSON sem policy) |
| 6 | `stubs/ops/` (2 arquivos, só aqui): `deploy-script.stub` e `instance.env.stub` de provisionamento multi-instância no Ploi, **todo em placeholders** e com 5 divergências do deploy padrão comentadas no próprio arquivo (tee que engolia log do painel, `npx -y pnpm@11.5.3` por falta de PATH, sentinela `.provisioned` porque o seeder não é idempotente, `horizon:terminate`, `trap - EXIT`) | 8 — ⭐ método de ops |
| 7 | **`docs/` é servido dentro da app** por glob (`Services/Docs/DocsRepository.php` + `docs.index`/`docs.show`), `usuario/` para a loja e `tecnico/` só para `super_user`: **um `.md` novo em `docs/` vira página visível ao cliente** | 8 — ⭐ candidato de método |
| 8 | `semgrep.yml` com SARIF no Code Scanning + `ci.yml` com 4 jobs encadeados; **13/13 e 3/3 actions pinadas por SHA** — mas o boilerplate **já tem os dois workflows e já pina por SHA**. Idem `minimumReleaseAge: 10080`, idêntico dos dois lados | 8 — **nada a colher, registrar para não re-investigar** (a v1 já absorveu) |
| 9 | `Jobs/ProcessPhotoBackground.php`: `$tries = 1` com justificativa escrita de CUSTO ("a chamada é ~US$ 0,12; repetir dobraria"), timeout 120s calibrado para vencer o `Http::timeout(60)` e o supervisor do Horizon, e re-leitura do model antes de gravar para não ressuscitar foto descartada | 3 — ⭐ candidato de método (job idempotente com invariante de negócio) |
| 10 | **`Broadcast::event()` em `assign-role`/`revoke-role` não pode funcionar:** sem `config/broadcasting.php`, sem `reverb`/`pusher` no `composer.json`, sem `channels:` no `withRouting()`, e o `broadcastWith()` lê uma relação `roles` que **não existe** sob `Model::shouldBeStrict()`. `revoke-role` tem **zero** call site em teste | 1/2 — direção inversa + ⭐ guard-rail (rota de escrita de RBAC sem teste de caminho feliz) |
| 11 | **`APP_FALLBACK_LOCALE=pt_BR` sem um único arquivo de tradução pt_BR** (`lang/` não existe, sem `laravel-lang/common`): `__('auth.failed')`, `__('auth.throttle')`, `__('auth.password')` e o `__($status)` do password broker devolvem **a chave crua**. O boilerplate já tem `lang/pt_BR/{auth,pagination,passwords,validation}.php` | 7 — direção inversa, vira **guard-rail** (teste que prova que a chave resolve) |
| 12 | `Signup\StoreSignupRequest`: `after()` roda `TurnstileVerifier` **só quando o resto está válido**, para não gastar o desafio de uso único; `prepareForValidation()` normaliza `slug`/`whatsapp`/`phone`/`cpf_cnpj` antes de validar | 5 — ⭐ candidato (ordem de validação com custo externo) |
| 13 | `ImageOptimizer` (101 LOC, Imagick): orientação EXIF aplicada nos pixels, achata alpha sobre branco, JPEG progressivo + `stripImage()`, e **falha → `null`** (upload nunca trava) | 3/5 — candidato · `[dep-nova]`? confirmar se depende de extensão além do que o boilerplate exige |
| 14 | Deltas de camada medidos nos dois lados: a fonte tem `Jobs`, `Mail`, `DataTransferObjects` e 14 subpastas de `Services` que o boilerplate não tem; o boilerplate tem `Casts/MoneyCast`, `ValueObjects/Money`, `Support/{Br,Listing,Logging}`, `Models/PermissionUser`, `Listeners/EnforceMailAllowlist`, `Services/PermissionCatalogService` e `Rules/MoneyString`, ausentes na fonte | 2 — mapa de direção, **os dois sentidos** |
| 15 | **Zero linha de CSP/`SecurityHeaders`/`X-Frame-Options`/HSTS** na fonte (o boilerplate tem `Middleware/SecurityHeaders` e `SetSensitiveCacheHeaders`); **zero `arch()`** nos 708 casos Pest; zero `tests/{Unit,Arch,Browser,Contract}` | 1/2 — direção inversa, confirma guard-rails já mesclados |
| 16 | `.env.example` com **136 chaves únicas** (67 ativas + 69 comentadas) contra 69 do boilerplate: **85 só na fonte, 18 só no boilerplate, 51 em ambos** | 8 — insumo da dimensão 8 |

### Ponteiros do inventário do cuidari (fatos verificados @ `a7a1170`, ainda SEM veredito)

| # | Fato | Dimensão dona |
| - | ---- | ------------- |
| 1 | `LoginRequest.php:31` faz `Auth::attempt($this->only('email','password'))` **sem `is_active`** — `toggle-active` desativa a conta e a pessoa continua logando. O boilerplate já injeta `'is_active' => true` (`LoginRequest.php:36`) | 1 — direção inversa, vira guard-rail |
| 2 | `HandleInertiaRequests.php:43` publica `'user' => $user` (model inteiro) em toda navegação; `$hidden` só cobre `password`/`remember_token`, então `cpf_cnpj`, `phone`, `mobile`, `user_notes` vazam. O boilerplate já corrigiu com `SHARED_USER_FIELDS` | 1 — direção inversa |
| 3 | `PatientResource.php:21` faz o gating certo de campo sensível por `viewSensitive`, mas o **`UserResource` do próprio cuidari não aplica o padrão** — CPF/telefone/anotações de todo usuário vão para quem abrir `/users` | 1 — ⭐ a TÉCNICA generaliza |
| 4 | `configRateLimiting()` **não existe** no cuidari; zero `RateLimiter::for`. `forgot-password` e `reset-password` sem throttle nenhum | 1 — guard-rail |
| 5 | `Password::defaults()` chamado em 5 pontos, **definido em nenhum** — política de senha no default do Laravel num app com prontuário | 1 — checar se vale para o boilerplate |
| 6 | 16 policies, 100 abilities, **zero com `before()`** — sem bypass de super-admin, decisão de design forte e não documentada | 1/2 — comparar com os gates do boilerplate |
| 7 | `app/Services/*OptionsProvider.php` — 4 classes (450 LOC) que montam os options de select do Inertia por módulo; o boilerplate não tem equivalente | 2 — ⭐ candidato |
| 8 | 25 DTOs em `app/DataTransferObjects/`, 22 `readonly`; boilerplate tem **0**. Elo `FormRequest → DTO → Service` completo | 2 — ⭐ candidato forte |
| 9 | `MoneyCast` + módulo financeiro (Payable/Receivable/Payment/LedgerEntry/caixa) com schema decimal 12,2 | 2 — **tema multi-fonte "dinheiro"** |
| 10 | 6 `*TenantIsolationTest.php` + suíte `Foundation` de invariantes | 2 — ⭐ padrão de teste |
| 11 | `barryvdh/laravel-dompdf` é a **única** dependência de produção a mais que o boilerplate (9 × 8); renderiza 3 templates de PDF (596 linhas), incluindo variante de bobina térmica 80mm | 8 — `[dep-nova]` |
| 12 | `docs/specs/` com 22 specs numeradas; `app/Enum/Module.php` declara 18 módulos e só 4 têm código — **o "enum inflado" é desenho deliberado**, e sem as specs o leitor conclui o contrário | 8 — ⭐ método de doc |
| 13 | `stubs/` com 54 arquivos versionados, **byte-idênticos** aos do boilerplate | 8 — nada a colher, registrar para não re-investigar |
| 14 | 22 fontes `.woff2` self-hosted (Aptos, Merriweather Sans, Montserrat) com `@font-face` próprio; o boilerplate abre `preconnect` para `fonts.bunny.net` | 4/6 — candidato (casa com o F38) |

> **Correção de referência:** a fila antiga citava um "F12" que **não existe** no BACKLOG (`grep F12` → 0 ocorrências). A metade visual do E12+E21 é a linha da tabela "Metades visuais", que depende do **F2**.

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
