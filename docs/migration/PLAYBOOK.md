# Playbook de migração — projetos derivados → padrões do boilerplate

Guia operacional para migrar os 7 projetos derivados (transitado-em-julgado, cuidari, ctvitrine, ctjuris, sorteiopix, ctfinance, spinmax) para os padrões atuais deste boilerplate (Laravel 13 + Inertia v3 + React 19 + Pest 4 + Larastan). Todos os paths de origem citados existem neste repositório e foram verificados no branch da harvest.

## 1. Princípios

1. **Fatia = 1 tema = 1 PR com gates verdes.** Cada fatia entra sozinha, com CI verde e deploy em staging observado antes da próxima. PR gigante "modernização geral" é proibido: impossível de revisar, impossível de reverter.
2. **Nunca misturar upgrade de framework com refactor de convenção.** Upgrade (Laravel 12→13, Inertia 2→3) muda comportamento; refactor (Form Requests, naming) muda forma. Misturados, um bug não tem culpado. Fatias 3 e 6 jamais no mesmo PR.
3. **Rede de segurança antes da cirurgia.** Nenhuma fatia de mudança comportamental (3, 4, 5) começa sem a Fatia 1 concluída: cobertura dos fluxos críticos, gate de migrations em MySQL real e Larastan com baseline travando regressão.
4. **Alvo parado.** O boilerplate reconciliado (branch `main` pós-harvest) é a referência congelada durante toda a rodada. Não se persegue alvo móvel: mudanças novas no boilerplate entram na próxima rodada, não no meio de uma migração.

## 2. Ordem entre projetos

| # | Projeto | Justificativa |
| - | ------- | ------------- |
| 1 | **transitado-em-julgado** | Piloto: menor superfície, baixo risco de negócio. Serve para calibrar o playbook — toda lição aprendida vira ajuste aqui antes de tocar os demais. |
| 2 | **cuidari** | Segundo de menor risco; valida o playbook já calibrado em um domínio diferente. |
| 3 | **ctvitrine** | Porte médio, sem pagamento; consolida a rotina antes dos projetos com upgrade duplo. |
| 4 | **ctjuris** | Estreia o upgrade Inertia 2→3 (Fatia 3b) fora dos projetos de dinheiro. Se a receita do commit `fad56c0` tiver aresta, ela aparece aqui. |
| 5 | **sorteiopix** | Envolve dinheiro (Pix), mas fluxo mais simples que e-commerce; herda a receita Inertia já validada no ctjuris. |
| 6 | **ctfinance** | Financeiro, mas já tem Pest browser — a rede de segurança nasce mais forte; penúltimo para chegar com o playbook maduro. |
| 7 | **spinmax** | Último, deliberadamente: e-commerce com pagamento real e a trap do HMAC de CPF (ver §4). Só recebe qualquer fatia com o playbook inteiro rodado 6 vezes. |

## 3. As fatias

Cada fatia abaixo: **Objetivo → O que copiar/adaptar (origem no boilerplate) → Gate → Rollback**. Rollback padrão de toda fatia: `git revert` do merge commit + redeploy; abaixo só se documenta o que vai além disso.

### Fatia 0 — Baseline

- **Objetivo:** saber exatamente o que é "verde" hoje, antes de mexer em qualquer coisa.
- **Copiar/adaptar:**
  - `.github/workflows/ci.yml` — paridade estrutural: jobs `frontend` (types, lint, format:check, vitest, build), `backend` (Pest em SQLite `:memory:` + service MySQL 8 só para o gate de migrations), `quality` (Pint `--test` + `composer ci:stan`), `security` (`composer audit` + `pnpm audit --prod --audit-level high`), `concurrency` com `cancel-in-progress`, actions pinadas por SHA.
  - `.github/workflows/semgrep.yml` — SAST no mesmo pacote.
  - Adaptar versões (projetos ainda em L12/PHP antigos rodam o CI na versão ATUAL deles — o CI descreve o presente, não o alvo).
- **Gate:** suíte atual do projeto verde no CI novo, documentada no gap-report do projeto (quantos testes, o que cobrem, o que está skipado e por quê).
- **Rollback:** desabilitar o workflow novo (é aditivo; não toca código de app).

### Fatia 1 — Redes de segurança

- **Objetivo:** garantir que as fatias seguintes quebram o CI, não a produção.
- **Copiar/adaptar:**
  - **Cobertura de fluxos críticos:** escrever testes Feature dos fluxos que pagam as contas (login, checkout, geração de documento, sorteio…). Referências de estilo: `tests/Feature/SecurityHeadersTest.php`, `tests/Feature/EnsureUserIsActiveTest.php`, `tests/Feature/LogScrubbingTest.php` e `.ai/rules/tests.md`.
  - **Smoke browser:** ctfinance e spinmax já têm Pest browser — reutilizar e ampliar para as rotas críticas; nos demais, um smoke mínimo (páginas-chave carregam sem erro JS) já paga o custo.
  - **Gate de migrations MySQL real:** copiar do `ci.yml` o service `mysql:8.0` + step `php artisan migrate --force` apontando para ele (a suíte continua em SQLite; o gate pega migration incompatível com MySQL que o SQLite deixa passar).
  - **Larastan com baseline:** copiar `phpstan.neon.dist` e rodar `vendor/bin/phpstan analyse --generate-baseline`. **Diferente do boilerplate** (que exige zero erros): nos derivados o baseline congela o passivo existente e trava só código novo. Reduzir o baseline é trabalho contínuo, não pré-requisito.
- **Gate:** fluxos críticos cobertos e verdes; `composer ci:stan` verde com baseline; gate MySQL verde.
- **Rollback:** testes e baseline são aditivos — remover o step específico se um gate estiver instável, nunca a fatia inteira.

### Fatia 2 — Tooling/CI

- **Objetivo:** mesma régua de formatação, refactor automático, hooks e supply-chain em todos os projetos.
- **Copiar/adaptar:**
  - `pint.json` (copiar inteiro; rodar `vendor/bin/pint` no repo todo em commit separado "só formatação" dentro do PR).
  - `rector.php` + script `ci:rector` do `composer.json` (`--dry-run` no CI).
  - Hooks Husky: `.husky/pre-commit`, `.husky/pre-push`, `.husky/commit-msg`, `.husky/prepare-commit-msg` + `scripts/format/format-dirty.mjs` e `scripts/git/get-issue-id.sh`.
  - `.github/dependabot.yml` (semanal, minor+patch agrupados) e SHA-pinning de todas as actions.
  - `.mise.toml` (Node 22, pnpm 11.5.3 — mesmas versões do CI) e `pnpm-workspace.yaml` com `minimumReleaseAge: 10080` (pacote npm só entra 7 dias após publicado — mitiga supply-chain attack de release recém-envenenada).
  - Scripts `ci:*` do `composer.json` e `package.json` para que `composer ci:check` / `pnpm ci:check` existam com a mesma semântica do boilerplate.
  - **Antecipação recomendada da Fatia 6-docs:** copiar já aqui `.ai/rules/` + `CLAUDE.md`/`AGENTS.md` adaptados ao projeto (ver Fatia 6) — agentes com as regras carregadas produzem fatias 3–6 melhores.
- **Gate:** `composer ci:check` e `pnpm ci:check` verdes; hooks disparando localmente; primeiro PR do Dependabot abrindo sem ruído.
- **Rollback:** tooling é quase todo aditivo; o commit "só formatação" do Pint é o único volumoso — revertê-lo isolado se necessário.

### Fatia 3 — Upgrades (quando aplicável)

**3a. Laravel 12→13 (fatia própria).**

- **Objetivo:** framework na mesma major do boilerplate antes de qualquer convenção nova.
- **Como:** considerar **Laravel Shift** para o grosso mecânico (renames de config, skeleton, deprecations); revisar o diff do Shift manualmente. Comparar `config/`, `bootstrap/app.php` e `lang/` com os deste repo (ver trap de chaves em §4). Referência de asserção pós-upgrade: `tests/Feature/Laravel13ConfigurationDefaultsTest.php`.
- **Gate:** suíte inteira verde + gate MySQL verde + staging observado por alguns dias antes da 3b.
- **Rollback:** revert do PR; como nada de convenção mudou junto (Princípio 2), o revert é limpo.

**3b. Inertia 2→3 (fatia separada, NUNCA junto com 3a).**

Receita real extraída do commit `fad56c0` ("Upgrade Inertia.js to v3") deste repo — use `git show fad56c0` como gabarito:

- `inertiajs/inertia-laravel ^2.0 → ^3.0` e `@inertiajs/react 2.x → 3.x` (pré-requisitos: PHP 8.4, Laravel 13, React 19 — por isso 3a vem antes).
- Republicar `config/inertia.php` na estrutura v3: bloco `pages` (substitui `testing.page_paths`/`page_extensions`), `ssr.runtime` + `ssr.throw_on_error`, `history.encrypt`, `expose_shared_prop_keys`.
- `resources/js/app.tsx` e `resources/js/ssr.tsx`: tipar o glob do `resolve()` (`import.meta.glob<{ default: ResolvedComponent }>`) e desembrulhar `module.default` — v3 é mais estrito na tipagem.
- Breaking changes do guia v3 a caçar no código do projeto: **eventos renomeados** (grep nos listeners `router.on(...)`/`@inertiajs` events), **`router.cancelAll()`** substituindo a API antiga de cancelamento, **config `future` removida** (flags viraram default), e uso de axios (o boilerplate não tinha; projetos podem ter).
- **Gate:** o mesmo do commit: `tsc`, eslint, prettier, vitest, `build:ssr` + health check do runtime SSR, Pest.
- **Rollback:** revert + `pnpm install --frozen-lockfile`/`composer install` dos lockfiles antigos.

### Fatia 4 — Hardening

- **Objetivo:** superfície web dos derivados com as mesmas defesas do boilerplate.
- **Copiar/adaptar:**
  - `app/Http/Middleware/SecurityHeaders.php` — **CSP em `Content-Security-Policy-Report-Only` primeiro** (adaptar o middleware; o boilerplate aplica direto, derivados com scripts de terceiros não podem). Observar reports por 1–2 semanas, então promover a enforce. Copiar também o `SecurityHeaders::stamp()` chamado no exception handler de `bootstrap/app.php` (respostas de exceção saem fora da pilha de middleware).
  - `app/Http/Middleware/SetSensitiveCacheHeaders.php` — `no-store` em rotas sensíveis.
  - `app/Http/Middleware/EnsureUserIsActive.php` + `is_active` na query de credenciais de `app/Http/Requests/Auth/LoginRequest.php` (conta desativada nem autentica). Ver trap de deploy em §4.
  - `app/Support/Logging/PiiScrubber.php`, `PiiScrubbingProcessor.php` e `PiiAwareTap.php` + registro via `'tap' => [PiiAwareTap::class]` em `config/logging.php`. Teste de referência: `tests/Feature/LogScrubbingTest.php`.
  - `TRUSTED_PROXIES` em `bootstrap/app.php` (env `TRUSTED_PROXIES`, `*` ou lista CSV) — sem isso, atrás de LB/CDN o `isSecure()` falha e HSTS/CSP de produção nunca ligam.
  - Páginas de erro: `resources/views/errors/500.blade.php` (fallback sem Vite) e `resources/js/pages/errors/error-page.tsx`. Teste: `tests/Feature/ErrorPagesTest.php`.
  - Strict mode com report em produção: bloco `Model::shouldBeStrict()` + `handleLazyLoadingViolationUsing`/`handleMissingAttributeViolationUsing`/`handleDiscardedAttributeViolationUsing` chamando `report(...)` em `app/Providers/AppServiceProvider.php` — em produção viola-se para o Sentry (ADR `0006-error-tracking-sentry`), não com 500 na cara do usuário.
- **Gate:** `tests/Feature/SecurityHeadersTest.php` e `EnsureUserIsActiveTest.php` adaptados e verdes; zero violações de CSP relevantes no período report-only; smoke browser verde.
- **Rollback:** cada middleware é uma linha no bootstrap — remover a linha reverte o comportamento sem revert do PR inteiro. CSP: voltar de enforce para report-only é mudança de um header.

### Fatia 5 — Kit BR / dedupe

- **Objetivo:** um único kit de máscara/normalização/formatação BR, o do boilerplate; apagar as cópias locais divergentes.
- **Copiar/adaptar:**
  - Backend: `app/Support/Br/CpfFormatter.php`, `app/Support/Br/PhoneNormalizer.php`, `app/Support/Br/CpfHasher.php`.
  - Frontend: `resources/js/utils/format/masks.ts`, `resources/js/utils/format/money.ts`, `resources/js/components/ui/masked-input.tsx`, com os testes `resources/js/test/utils/masks.test.ts`, `resources/js/test/utils/money.test.ts`, `resources/js/test/components/masked-input.test.tsx`.
  - Substituir os helpers locais por imports do kit; deletar os arquivos locais no mesmo PR (dedupe de verdade, não convivência).
  - **⚠️ TRAP spinmax (ver §4):** o `CpfHasher` do boilerplate é HMAC-SHA256 com chave derivada da `APP_KEY` (contexto `app:cpf-hash:v1`). O spinmax tem hashes de CPF **persistidos** no banco. Antes de trocar a implementação: escrever teste de compatibilidade que hasheia CPFs conhecidos com a implementação local e com a nova e compara com valores reais do banco. Ou o formato é preservado (adaptar o hasher do boilerplate ao formato legado), ou se faz migração de re-hash deliberada — nunca troca silenciosa.
- **Gate:** testes do kit verdes; grep confirma zero usos dos helpers antigos; no spinmax, teste de compatibilidade de hash verde ANTES do merge.
- **Rollback:** revert do PR. No spinmax, se houve re-hash: a migration de re-hash precisa de `down()` real ou snapshot da coluna antiga até estabilizar.

### Fatia 6 — Convenções

- **Objetivo:** código novo dos derivados indistinguível de código do boilerplate.
- **Copiar/adaptar:**
  - **Form Requests em toda escrita de domínio** — validação inline nos controllers migra para `app/Http/Requests/` conforme `.ai/rules/requests.md` e `.ai/rules/controllers.md`. Migrar por módulo, não tudo de uma vez.
  - **Rate limiters nomeados** — padrão `RateLimiter::for('auth', ...)` de `app/Providers/AppServiceProvider.php` + `throttle:auth` nas rotas; matar `throttle:60,1` mágicos.
  - **`.ai/rules/` + `CLAUDE.md`/`AGENTS.md` adaptados** — copiar `.ai/rules/index.md` e os arquivos de área aplicáveis, ajustando exemplos aos domínios do projeto. *Na prática esta é a sub-fatia mais barata e mais rentável: antecipe-a para a Fatia 2* — agentes lendo as regras certas produzem todas as fatias seguintes no padrão.
  - **Naming kebab-case** no frontend (arquivos/rotas), conforme `.ai/rules/js.md`.
  - **RBAC alinhado** — se o projeto usa o mesmo trait, sincronizar com `app/Traits/Models/HasRolesAndPermissions.php` (RBAC próprio por decisão registrada: ADR `0001-rbac-proprio`; sem spatie).
  - Respeitar as decisões dos ADRs ao "limpar" dependências dos derivados: `0002-ziggy-mantido`, `0003-sem-tanstack-query`, `0004-sem-telescope`, `0005-sem-api-sanctum-por-padrao`, `0006-error-tracking-sentry`.
- **Gate:** `composer ci:check` verde (Pint + Rector + Larastan-baseline + Pest); nenhum controller novo com validação inline (revisável via grep em `$request->validate(`).
- **Rollback:** por módulo — cada módulo convertido é um commit revertível.

## 4. Armadilhas conhecidas

- **HMAC de CPF no spinmax.** Dados persistidos dependem do algoritmo/chave/contexto do hasher local. Trocar pelo `CpfHasher` do boilerplate sem plano quebra busca e unicidade de CPF silenciosamente (hash novo nunca bate com o gravado). Teste de compatibilidade primeiro; preservar formato ou migrar com re-hash — ver Fatia 5. Lembrar: rotacionar `APP_KEY` também invalida os hashes.
- **`EnsureUserIsActive` derruba sessões vivas no deploy.** Usuários com `is_active = false` que estejam logados no momento do deploy são deslogados imediatamente. Antes de ativar: auditar quantos users inativos têm sessão ativa, comunicar se relevante, e deployar fora de pico.
- **CSP quebra inline scripts de terceiros — pagamento incluso.** Gateways de pagamento, pixels e widgets injetam `<script>` inline e hosts externos que a CSP do boilerplate (`script-src 'self' 'unsafe-inline'`, `connect-src 'self'`) bloqueia. Em ctfinance/sorteiopix/spinmax: **report-only obrigatório**, allowlist dos domínios do gateway, e só então enforce. Checkout quebrado por CSP é perda de receita direta.
- **Audits nascem vermelhos no derivado (Fatia 0).** `composer audit`/`pnpm audit` auditam o lockfile do dia: derivado com deps paradas há meses chega à Fatia 0 com advisories reais, inclusive transitivos (no piloto: guzzle e commonmark no composer; axios via @inertiajs/react e nanoid via vite/postcss no pnpm). Atualizar deps está fora do escopo da fatia, então o job `security` entra com `continue-on-error: true` + issue rastreando os advisories, e o `continue-on-error` sai na primeira atualização de deps. Sem essa válvula, o gate "CI novo verde" força update de deps fora de escopo ou deixa a fatia eternamente aberta. No piloto a válvula durou horas: com update autorizado pelo dono, os quatro advisories saíram com `composer update` pontual das duas libs + `overrides` com seletor de range no `pnpm-workspace.yaml` (`'axios@<1.18.0': '^1.18.0'` — só reescreve resolução vulnerável, não trava major futura), e o job virou bloqueante no commit seguinte.
- **`minimumReleaseAge` vs lockfile recém-atualizado.** Com `minimumReleaseAge: 10080`, um `pnpm update` que acabou de puxar versão publicada há menos de 7 dias falha na resolução seguinte. Sintoma: CI vermelho "sem motivo" logo após update de deps. Ou espere a janela, ou use a exceção pontual, ou fixe a versão anterior.
- **Projetos L12 têm chaves de `lang/` e `config/` diferentes.** Copiar middleware/testes do boilerplate (L13) para projeto ainda em L12 quebra por chave de tradução/config inexistente. Na Fatia 3a, diffar `config/` e `lang/` contra o boilerplate — não assumir paridade.
- **spinmax: deploy fora de pico, sempre.** E-commerce com pagamento real: toda fatia entra em janela de baixo tráfego, com rollback ensaiado.
- **spinmax: smoke de checkout verde ANTES de qualquer fatia.** O primeiro PR no spinmax é o smoke browser do checkout completo (Fatia 1) — nenhuma outra fatia entra sem esse teste existindo e verde, porque é ele que detecta regressão de receita.
- **Smoke browser da Fatia 1 não tem origem no boilerplate.** O playbook pede "smoke mínimo (páginas-chave carregam sem erro JS)" nos projetos sem Pest browser, mas o próprio boilerplate não tem `pest-plugin-browser`/Playwright — não há path para copiar, e instalar é decisão de deps (plugin composer + binários Playwright) que exige autorização do dono. Combinar ANTES de abrir a fatia, ou ela trava no último item (aconteceu no piloto). Paliativo aceitável: smoke server-side com `assertInertia` nas páginas-chave cobre "responde e monta o componente"; só não pega erro de runtime JS. **Decisão do piloto:** adiar o browser smoke para a **Fatia 4**, cujo gate já exige "smoke browser verde" — é lá que ele paga o custo, detectando quebra silenciosa por CSP; instalar o plugin passa a ser parte da Fatia 4 nos projetos sem Pest browser.
- **Zerar Larastan portando tipos do boilerplate traz "caronas" de comportamento.** Nos arquivos de origem comum (RBAC etc.), a versão tipada do boilerplate embute fixes de comportamento colhidos na harvest (ex.: `unsetRelation` no refresh do cache de permissões, `is_active` no `LoginRequest`, generalização do `RoleFilterService`). Na fatia de análise estática, portar SÓ tipos/anotações e deixar cada fix para a fatia dona (4/6) — senão o Princípio 2 quebra em miniatura e o diff fica sem culpado. Exceção: correção exigida pelo próprio type-check (ex.: referência a relação inexistente, cast em aritmética de string) entra junto, documentada no gap-report.

## 5. Definição de pronto (por fatia, em cada projeto)

Uma fatia só está PRONTA quando **todos** os itens abaixo valem:

1. `composer ci:check` verde no projeto (Pint + Rector dry-run + Larastan com baseline + Pest).
2. `pnpm ci:check` verde no projeto (lint + testes + build).
3. Suíte própria do projeto inteira verde — incluindo os testes novos da fatia e o smoke browser onde existir.
4. Deploy em staging feito e **observado** (logs, Sentry, reports de CSP quando aplicável) — não apenas "subiu".
5. Checklist do gap-report do projeto atualizado: item da fatia marcado, desvios em relação ao boilerplate anotados, traps novas descobertas registradas neste playbook.
