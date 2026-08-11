# ctfinance — Harvest v2

- **Path:** `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctfinance`
- **SHA pinado:** `b8c6d57` (branch `main`, working tree limpa, último commit 2026-07-21)
- **Estado:** L12 + Inertia 2 · SaaS financeiro PF/MEI com billing Asaas · criticidade ALTA
- **Ordem de varredura:** 1º (mais denso em ativos)

> Toda evidência abaixo refere-se ao SHA pinado. Valores sensíveis vão redigidos com `***`.

## Inventário

### Stack (do `composer.json` / `package.json` no SHA pinado)

PHP `^8.4` · `laravel/framework ^12.0` · `inertiajs/inertia-laravel ^2.0` · `@inertiajs/react ^2.3.21` · React `^19.2.5` · Tailwind `^4.2.2` · Vite `^7.3.2` · TypeScript `^5.9.3`.
Contra o alvo (L13 / Inertia 3 / Vite 8 / TS 6): atrasado em **framework, Inertia, Vite e TS**. Isso é matéria do PLAYBOOK de migração, não desta rodada — mas condiciona a absorção: código que dependa de API Inertia v2 precisa de modernização anotada.

### Massa (contagem verificada no SHA pinado)

| Área | ctfinance | boilerplate | Δ |
| ---- | --------: | ----------: | -: |
| `app/**/*.php` | 336 | 77 | +259 |
| Controllers | 138 | 29 | +109 |
| Form Requests | 39 | 8 | +31 |
| Models | 22 | 4 | +18 |
| Enums | 22 | 2 | +20 |
| Policies | 10 | 1 | +9 |
| Middlewares | 7 | 5 | +2 |
| Services (`app/Services`) | 30 | 4 | +26 |
| `app/Domain/**` | 14 | 0 | +14 |
| `app/Transaction/Ingestion/**` | 11 | 0 | +11 |
| API Resources | 13 | 2 | +11 |
| Observers / Jobs / Notifications | 3 / 2 / 2 | 0 / 0 / 0 | +7 |
| Console commands | 4 | 2 | +2 |
| Migrations | 47 | 6 | +41 |
| Factories / Seeders | 13 / 9 | 1 / 4 | +12 / +5 |
| `config/*.php` | 17 | 14 | +3 líquidos (5 exclusivos) |
| Rotas (linhas) | 471 (`web` 333) | — | — |
| `resources/js/**` | 441 | 170 | +271 |
| `components/ui/**` | 35 | 31 | +8 exclusivos / −4 |
| Testes PHP | 115 (107 Feature + **8 Browser**) | 56 (51 Feature + 4 Unit + 1 Arch) | +59 |
| Testes Vitest | 71 | 23 | +48 |
| Workflows CI | 3 (`ci`, `semgrep`, **`browser`**) | 2 (`ci`, `semgrep`) | +1 |

### Módulos de domínio (controllers por pasta, contagem verificada)

`User` (13) · `Settings` (13 — inclui `Privacy/` LGPD, `Sessions/`, `Notifications/`, `ProfileType*`) · `Transaction` (10) · `RecurringIncome` (10) · `RecurringExpense` (10) · `Goal` (9) · `CreditCard` (9) · `Auth` (9 — inclui `GoogleAuthController`) · `Onboarding` (8) · `FinancialInstitution` (8) · `Category` (8) · `Budget` (8) · `BankAccount` (8) · `PermissionRole` (5) · `Billing` (5) · `Wallet` (2) · `Dashboard` (2) · base (1)

### Pastas fora da árvore do boilerplate

| Pasta | Arquivos | Natureza |
| ----- | -------: | -------- |
| `app/Domain/Dashboard/**` | 14 | `DashboardPeriod`, 2 Queries, 3 Resources, 7 Services, `Support/DashboardCache` |
| `app/Transaction/Ingestion/**` | 11 | pipeline de ingestão de transação (parser, normalizer, decision policy, outcome) |
| `app/DataTransferObjects/` | 1 | `PermissionMetaDTO` |
| `app/Exceptions/` | 3 | `AsaasException`, `InsufficientLimitException`, `SocialAuthException` |
| `app/Helpers/` | 1 | `MoneyHelper` |
| `app/Observers/` | 3 | `BudgetObserver`, `DashboardCacheObserver`, `TransactionObserver` |
| `app/Jobs/` | 2 | `CloseCreditCardInvoicesJob`, `Lgpd/GenerateLgpdExportJob` |
| `app/Notifications/Lgpd/` | 2 | `AccountDeletionScheduledNotification`, `ExportReadyNotification` |
| `app/Support/Mei/`, `app/Support/RecurringSchedule.php`, `app/Support/UserAgentParser.php` | 3 | — |
| `app/Resolvers/AuditUserResolver.php` | 1 | equivalente ao `ActivityCauserResolver` do boilerplate |

### Ausências relevantes vs boilerplate

Não existem no ctfinance: `app/Casts/MoneyCast.php`, `app/ValueObjects/Money.php`, `app/Rules/MoneyString.php`, `app/Support/Br/{CpfFormatter,CpfHasher,PhoneNormalizer}.php`, `app/Support/Logging/{PiiScrubber,PiiScrubbingProcessor,PiiAwareTap}.php`, `app/Http/Middleware/EnsureUserIsActive.php`, `app/Console/Commands/{CreateSuperUser,SyncPermissions}Command.php`, `app/Services/PermissionCatalogService.php`, `app/Listeners/EnforceMailAllowlist.php`, `lang/pt_BR/pagination.php`.

### Rotas

**Públicas (fora de `auth`)** — `GET /` → closure `Inertia::render('public/landing')` (o boilerplate faz `redirect('/dashboard')`); `POST webhooks/asaas` → `Billing\AsaasWebhookController` sob `VerifyAsaasSignature`, isenta de CSRF por `validateCsrfTokens(except: ['webhooks/asaas'])`; `/up`. Grupo `guest`: register/login/forgot/reset (throttle inline `5,1` e `10,1`) + **`auth/google/{redirect,callback}`** (`Auth\GoogleAuthController`).

**`routes/web.php` (333 l.)** — um grupo com `['auth','verified', RedirectPendingOnboardingProfileSelection, EnsureSubscriptionActive]`; tudo herda os quatro. Módulos: Onboarding (8 rotas PATCH/POST), Dashboard (2), Billing (4, isenta do próprio `EnsureSubscriptionActive` para não fazer loop), Wallet (2), Impersonate (2), Users (13, `can:manage_users`), Permissions/Roles (6, bloco **idêntico** ao do boilerplate), FinancialInstitutions (8), CreditCards (9, `whereNumber`), Categories (8), BankAccounts (8), RecurringExpenses (10), RecurringIncomes (10), Transactions (10), Budgets (8), Goals (9). Autorização por `can:` granular em quase tudo.

**`routes/settings.php` (50 l.)** — grupo só com `auth` (sem `verified`, sem onboarding, sem billing). Profile/password/appearance iguais ao boilerplate; exclusivos: `settings/profile-type`, bloco **Privacy/LGPD** (`show`, `export`, `cancel-deletion`, `export-download/{user}/{uuid}`), `settings/notifications`, `settings/sessions` (+ `logout-others`).

> Ponteiro p/ Dimensão 1: `POST users/{user}/impersonate` do ctfinance tem só `throttle:10,1` — **sem `can:impersonate_users`** (o boilerplate tem gate + limiter nomeado). E `privacy.export.download` não usa middleware `signed`; valida `hasValidSignature()` dentro do controller (410) + `abort_if` de ownership (403).

### Execução — scheduler, comandos, jobs, reações

- **Scheduler dividido em dois lugares**: `routes/console.php` tem `lgpd:hard-delete` (`dailyAt 02:00`, tz SP, `onOneServer`, `when(isProduction)`); **`bootstrap/app.php` tem um bloco `withSchedule`** com `CloseCreditCardInvoicesJob` (`dailyAt 00:00`, **sem `withoutOverlapping`/`onOneServer`**) e `recurrences:generate-pending` (`00:10`, `withoutOverlapping`, `runInBackground`). Não há Horizon (sem provider, sem `config/horizon.php`, sem `horizon:snapshot`).
- **Commands (4):** `recurrences:generate-pending` (chunkById 100, pula users com `pending_hard_delete_at`, `--dry-run`), `lgpd:hard-delete`, `budgets:recalculate`, `credit-cards:recalculate-limits`.
- **Jobs (2):** `CloseCreditCardInvoicesJob` (`DB::transaction` + `lockForUpdate` por item; branch MySQL/MariaDB com `whereRaw` e fallback PHP), `Lgpd/GenerateLgpdExportJob`. **Nenhum dos dois declara `$queue`/`$tries`/`$backoff`/`$timeout`/`middleware()`.**
- **Events:** `ImpersonateStarted`/`Stopped` e `RoleUserUpdatedEvent` iguais ao boilerplate; `ProfileTypeConvertedToMei` **disparado sem nenhum listener**.
- **Listeners:** os 2 de impersonation (gravam em `owen-it` `Audit`) + `StartTrialOnRegister` (idempotente, gated por `config('billing.enabled')`). Falta o `EnforceMailAllowlist` do boilerplate.
- **Observers (3, boilerplate não tem a pasta):** `TransactionObserver` (invariantes de parcelamento via `ValidationException`, recálculo de budget do mês antigo quando `date/category_id/status/type` mudam, saldo quando `bank_account_id/status/type/paid_at` mudam, `DashboardCache::forgetForUser`), `BudgetObserver`, `DashboardCacheObserver` (aplicado a 4 models).
- **Notifications (2, LGPD):** `AccountDeletionScheduledNotification`; `ExportReadyNotification` com `via()` retornando `[]` quando a preferência está desligada e `URL::temporarySignedRoute(…, 7 dias)`.

### `bootstrap/app.php` e providers

`withMiddleware`: `encryptCookies(except:['appearance'])`, `validateCsrfTokens(except:['webhooks/asaas'])`, `web(append: [SecurityHeaders, HandleAppearance, HandleInertiaRequests, AddLinkHeadersForPreloadedAssets, SetSensitiveCacheHeaders])`. **Sem alias, sem `trustProxies`, e `withExceptions` VAZIO** — não há `errors/error-page`, nem fallback Blade, nem tratamento de 419, nem `SecurityHeaders::stamp()`. O boilerplate tem tudo isso.

`AppServiceProvider::boot()` roda 12 configuradores. Exclusivos úteis: `configDatabaseTimezone()` (`SET time_zone` por conexão MySQL/MariaDB com try/catch), `configQueryMonitoring()` (`DB::whenQueryingForLongerThan(500)` + `DB::listen` perfilando queries do dashboard sob header `X-Dashboard-Profile`, só em local), `configCommands()` com escape por config (`database.allow_destructive_commands`), `setupLogViewer()`. `configGates()` loga `[Gate Denied]` sempre e `[Gate Allowed]` fora de produção. **Zero rate limiters nomeados** (o boilerplate tem `auth`/`impersonate`/`verification`); `RateLimiter::` só aparece dentro do `LoginRequest`. `configModels()` só chama `shouldBeStrict()` — sem os três `handle*ViolationUsing` com `report()` do boilerplate.

**Policies (10)** contra 1 do boilerplate. `configPolicies()` mapeia 8 — **`CreditCardPolicy` e `RecurringIncomePolicy` ficam de fora do mapa** (dependem de auto-discovery). `TransactionPolicy` tem bypass `SUPER_USER` por método, regras por role e janela de 24 h + `!is_approved` para o dono.

### Middlewares (7)

Exclusivos: **`EnsureSubscriptionActive`** (gated por `config('billing.enabled')`, allowlist de 10 padrões, 402 JSON `subscription_inactive` ou redirect `/billing`), **`RedirectPendingOnboardingProfileSelection`** (guarda o destino em `OnboardingEntryRedirector` antes de desviar), **`VerifyAsaasSignature`** (HMAC do corpo cru contra header `asaas-signature`; em falha grava `BillingWebhookLog` com `signature_valid=false` por upsert `source+event_id` e devolve 401). Compartilhados: `HandleAppearance`, `HandleInertiaRequests`, `SecurityHeaders` (**sem `stamp()`**), `SetSensitiveCacheHeaders`. Ausente: `EnsureUserIsActive`.

### Dados — schema

- **`users`** base byte-idêntica à do boilerplate; adiciona `pending_hard_delete_at` (timestamp null, indexado) e `notification_preferences` (json null).
- **Dinheiro persistido em `decimal(15,2)`** com cast `decimal:2` em todas as tabelas do domínio (`transactions.amount`, `bank_accounts.*_balance`, `credit_cards.credit_limit/available_limit`, `recurring_*.amount`, `budgets.amount/spent`, `goals.*_amount`, `credit_card_payments.amount`). Única coluna em centavos: `plans.price_cents` (unsignedInteger), que **não** passa pelo `MoneyHelper`.
- **Integridade de verdade:** XOR `bank_account_id`/`credit_card_id` em `recurring_expenses` implementado por dialeto — `CHECK` no pgsql, **dois triggers com `SIGNAL SQLSTATE '45000'`** no MySQL, **no-op no SQLite** (invariante só no model). 5 migrations de normalização/backfill (`normalize_transaction_statuses_to_posted`, `backfill_paid_at_*`, `normalize_orphaned_onboarding_entry_profile`, …), com teste próprio para uma delas.
- `audits` (owen-it) contra `activity_log` (spatie) do boilerplate — **pilhas de auditoria divergentes**.
- **`Transaction` concentra 17 scopes** (`posted`, `forActiveSphere`, `dashboardCashFlowFor`, `withinDateRange` com `whereDate` para compat SQLite, `upcomingDueBetween`, …), todos qualificando coluna via `qualifyColumn()`.

### Domínio — `MoneyHelper`, `Domain/`, `Ingestion/`

`app/Helpers/MoneyHelper.php` tem **só dois métodos estáticos** (`toCents(string): int`, `fromCents(int): string`) — sem VO, sem aritmética, sem imutabilidade; 6 consumidores. O boilerplate já é estritamente superior aqui (`ValueObjects/Money.php` com ~25 métodos + `Casts/MoneyCast.php` + `Rules/MoneyString.php`). Direção da troca neste tema: **boilerplate → ctfinance**, não o inverso.

`app/Domain/Dashboard/**` (14) é o único bounded context com pasta própria: `DashboardPeriod`, 2 Queries, 3 Resources de opção, 7 Services (`DashboardPageBuilder`, `FutureBalanceProjectionService`, `RealLeftoverCalculationService`, `BusinessCashflowViewService`, `BusinessCommitmentsService`, `MeiSummaryDashboardService`, `ResolveDashboardContext`) e `Support/DashboardCache`. `app/Transaction/Ingestion/**` (11) é um pipeline `final`/`readonly` (normalizer → parser → context resolver → decision policy → outcome).

### Plataforma — config e env

17 configs. **Exclusivos:** `audit.php` (owen-it, resolver próprio `AuditUserResolver`, fila redis), `billing.php` (flag `enabled` + trial + bloco `asaas` com base_url derivada de `ASAAS_SANDBOX`, timeout 15, retry 3), `finance.php` (`approval_limit`, `max_attachments`, `attachment_max_kb`), `pulse.php` (10 recorders), `social_auth.php` (allowed domains CSV, `bootstrap.default_role`, bloco google). Só no boilerplate: `activitylog.php`, `horizon.php`.

Divergências que importam: **`logging.php` do ctfinance não tem tap de PII** (o boilerplate aplica `PiiAwareTap` em `stack`/`single`/`daily`); **`inertia.php` está no formato v2**; `mail.php` não tem o bloco `allowlist`/`test_inbox`; `cache.php` não tem o store `failover` nem `serializable_classes=>false`; `database.php` tem `allow_destructive_commands` e `timezone` por conexão (o boilerplate não) mas não tem os `max_retries`/`backoff_*` do Redis.

`.env.example`: 74 chaves contra 56. 25 só no ctfinance (Asaas ×5, Billing ×3, Google ×8, Finance ×3, `PULSE_ENABLED`, `SESSION_SECURE_COOKIE`, `SUPER_USER_PASSWORD`, `DB_ALLOW_DESTRUCTIVE_COMMANDS`, `AUTH_*` ×2), 7 só no boilerplate (`ACTIVITYLOG_*`, `HORIZON_PATH`, `INERTIA_SSR_*`, `LOG_VIEWER_*`). Fortemente comentado em pt-BR, com instrução de remover `SUPER_USER_PASSWORD` após o bootstrap.

### Plataforma — deps, CI, tooling

**Deps só no ctfinance:** `laravel/pulse ^1.7`, `laravel/socialite ^5.26`, `owen-it/laravel-auditing ^14.0`, `pestphp/pest-plugin-browser ^4.3.1`; no front `playwright 1.59.1` (pin exato), `vite-plugin-pwa ^1.2.0`, `workbox-window ^7.4.0`, `sharp`, `recharts ^3.8.1`, `zod ^4.3.6` + `zod-validation-error`, `date-fns`, `react-day-picker`, `@radix-ui/react-{popover,progress,tabs}`, e 4 pacotes `@simplify-technology/squadpack-*`. **Sem larastan, sem `phpstan.neon`, sem `ci:stan`. Sem `.ai/rules`** (o equivalente são 14 `.mdc` em `.cursor/rules/` + 14 skills em `.cursor/skills/`).

**CI:** `ci.yml` tem 2 jobs (frontend, backend) contra 5 do boilerplate — **faltam `quality`, `security` e `rector`**, e não há service MySQL para o gate de migrations. Actions **não pinadas por SHA**; sem `dependabot.yml`. Roda Node 22 / pnpm 10.33 (`.mise.toml`), sem `minimumReleaseAge` no `pnpm-workspace.yaml`. O `.husky/commit-msg` tem `REQUIRE_ISSUE_ID` **default 0** — exigência de ID de issue desligada, com comentário dizendo para religar antes do lançamento.

**`browser.yml` (exclusivo, completo):** dispara em push `main`, PR para `main`/`develop` (types opened/synchronize/reopened), **cron `13 4 * * *`** e `workflow_dispatch`; `concurrency` com cancel-in-progress; job único PHP 8.4 + Node 22, SQLite; cacheia Composer, `vendor/` **e os browsers do Playwright** (`~/.cache/ms-playwright`, key por `pnpm-lock.yaml`); `pnpm exec playwright install --with-deps chromium`; roda `composer ci:browser` = `pnpm ci:build` com `CI_DISABLE_PWA=1` + `pest --testsuite=Browser`. **Não publica artefato nenhum** (sem screenshots/traces).

**`vite.config.ts` (7,6 KB, bem mais elaborado que o do boilerplate):** `VitePWA` desligável por `CI_DISABLE_PWA=1` (`registerType:'prompt'`, `injectRegister:false`, `navigateFallback:'/offline.html'` com denylist para `/build`, `/horizon`, `/log-viewer`…, `skipWaiting:false`); `manualChunks` por função própria com `onlyExplicitManualChunks:true` e comentário avisando para **não** dividir `recharts` nem `@radix-ui/*` (TDZ só em produção); dev server derivando host/porta do `APP_URL` quando não há `VITE_DEV_SERVER_URL`; `reportCompressedSize` desligado em CI. `rector.php` **habilita `withPhpSets()`** (comentado no boilerplate).

### Frontend

61 páginas. Exclusivas de plataforma: `public/landing`, `onboarding/show` (1 960 l., wizard PF/MEI com autosave), `billing/index`, `wallet/{index,institutions-hub}`, `settings/{notifications,privacy,profile-type,sessions}`. **Não tem `pages/errors/error-page.tsx`.**

**Primitivos `ui/` exclusivos (8):** `color-picker` (17 presets + `<input type=color>` + hex validado), `date-picker` (+`DatePickerWithRange`, `react-day-picker` locale ptBR, CSS próprio de 696 l.), `hidden-text` / `hidden-value` (blur de saldo), `popover`, `progress`, `section-header` (tokenizado, com `data-testid`), `tabs`. `button.tsx` ganha variantes `toolbar`/`toolbarActive`. Na direção inversa o boilerplate tem 4 que faltam lá: `confirm-dialog`, `currency-input`, `date-input`, `masked-input`.

**Plataforma fora de `ui/`:** `pwa/pwa-chrome` (barra fixa combinando offline / reconectado / nova versão / prompt de instalação — ignora deliberadamente o `navigator.onLine` inicial), `auth/{auth-form-panel,auth-support-note,social-auth-card}`, `sidebar-context-switcher` (faz `router.flushAll()` antes do PATCH para invalidar prefetch, e partial reload `only:` só quando está em `/dashboard`), `pending-delete-banner`, `trial-countdown-banner`, `empty-state` (100 % Tailwind/tokens — o do boilerplate ainda depende de `@radix-ui/themes`), `page-info` (sempre renderiza `DialogDescription`, evitando dialog sem description), `layout/page-header` (delega a `SectionHeader`).

**Genéricos:** `lib/pwa-registration.ts`, `utils/analytics.ts` (`trackClientEvent` sem vendor — dataLayer + `window.analytics` + `CustomEvent`), `utils/lucide-icons.ts` (~130 ícones + `resolveLucideIcon` com alias/PascalCase/fallback), `contexts/balance-visibility-context` (persiste em localStorage com try/catch). `utils/data-table/query-params.ts` é **byte-a-byte igual** ao do boilerplate salvo o import (o boilerplate já extraiu `utils/data-table/constants.ts`). Faltam lá: `use-debounced-value`, `use-user-search`, `utils/format/money.ts`, `utils/via-cep.ts`, `utils/data-table/{constants,date}.ts`.

> Ponteiro p/ Dimensão 1: `use-permissions` do ctfinance faz `hasPermission = hasRole('super_user') || set.has(p)` — bypass de super_user no front que o boilerplate não faz.

**Shared props:** `share()` do ctfinance publica, além do esqueleto comum, `auth.subscription`, `auth.pendingDeleteUntil`, `auth.user.avatar` (resolvido de `socialAccounts`), `onboarding` e `dashboard_context`. Faz `loadMissing(['onboardingState','role.permissions'])`. **Contrato mais frouxo que o do boilerplate:** o boilerplate usa `SHARED_USER_FIELDS` + `Arr::only()` amarrado ao tipo `AuthUser`; o ctfinance monta o array literal e tipa `Auth.user` como o `User` inteiro — o tipo TS é mais largo do que o `share()` entrega.

`ssr.tsx` **diverge de verdade**: ainda usa `resolvePageComponent` cru do `laravel-vite-plugin`, sem o resolver de recuperação (o `app.tsx` usa `resolveInertiaPage`; o boilerplate usa nos dois).

**Design tokens:** `app.css` com 1 072 l., `@theme` expondo `success/warning/info`, `surface-{base,elevated,overlay,subtle}`, `text-*`, `border-*`, `chart-1..5`; escalas `--space-1..12`, `--radius-{control,surface,hero}`, `--touch-target-comfort`, `--focus-ring-*`, `--state-*`; `@layer components` com `.surface-page`, `.surface-panel`, `.focus-ring-brand`, `.dashboard-theme-*`. **Travado por `test/styles/design-tokens-contract.test.ts`** (lê o CSS como texto e exige 26 tokens + 11 classes, incluindo que `:root` **e** `.dark` definam `--surface-base`).

### Copy

- `lang/pt_BR.json` — só **15 chaves**, todas de notificação/e-mail do Laravel. O boilerplate não tem esse arquivo.
- **`lang/pt_BR/messages.php` (198 l.)** — dicionário por módulo com sub-chaves `validation`/`flash`/`warnings`/`errors`. Quatro grupos são **plataforma pura, não domínio financeiro**: `common`, `impersonation`, `users`, `permission_roles` (ex.: `impersonation.started => 'Você está acessando o sistema como :name.'`, `users.validation.role_assignment_forbidden`, `permission_roles.flash.permissions_updated_for_role`). O boilerplate não tem `messages.php`.
- `auth/passwords/validation.php` existem nos dois e **os três divergem**. Falta `pagination.php`.
- **`resources/js/content/phase-one-surface-copy.ts` (191 l.)** — 6 objetos `as const`. `internalAccessMicrocopy` (~40 chaves) traduz o vocabulário RBAC para linguagem de produto: role → "perfil", permission → "acesso", user → "pessoa". Junto de `internalAccessHelpMicrocopy`, `peopleFormMicrocopy`, `peoplePagesMicrocopy` formam um pente de copy aplicável a qualquer app; `landingMicrocopy` e `authSurfaceMicrocopy` são do produto. Coberto por 3 testes de linguagem.

### Testes

**PHP:** `phpunit.xml` tem suites `Feature` + **`Browser`** (não tem `Unit` nem `Arch`; o boilerplate tem `Unit`/`Feature`/`Arch`). 107 Feature + 8 Browser.

**`tests/Browser/**` (1 997 l., Pest 4 + Playwright):** 4 smokes de delete-confirmation (desktop **e** mobile, incluindo o caso bloqueado por vínculo), 2 de dashboard/contexto, 1 de onboarding (467 l., 6 testes), e **`MobileResponsiveAuditTest`** — um único teste que percorre **56 rotas nomeadas**, faz `resize(390,844)` + `refresh()` + `waitForEvent('networkidle')` e roda JS medindo `scrollWidth - vw` com tolerância de 2 px, **rankeando os elementos culpados** (`nowrap`, `flex-shrink:0`, leaf, `selfOverflow`) e falhando com o pior offender por rota.

**Vitest (71):** setup com stubs de `route`, `matchMedia`, `localStorage`, `ResizeObserver`; mock de `virtual:pwa-register` compartilhado entre teste e build. Cobre primitivos, 18 arquivos de dashboard, mobile-card/table-row por módulo, plataforma, páginas, hooks e infra (`design-tokens-contract`, `lucide-icons`, `resolve-inertia-page`).

### Documentação de agente

`CLAUDE.md` (8,8 KB) — **não há `AGENTS.md`**. O grosso vive em `.cursor/`: 14 regras `.mdc` numeradas por área, 14 skills (com `references/`), `agents/PLAYBOOKS.md`, 6 planos. `docs/` tem `MANIFEST.md`, 2 ADRs, `identidade/` (7), `mvp/` (5), **`phases/` (10 fases, ~65 arquivos)**, `roadmap/` (8), `specs/` (sprint-3 e sprint-4).

## Achados por dimensão

_(a preencher — as 8 dimensões consomem o inventário acima)_

### Dimensões 1–3 — resumo (detalhe e escopo corrigido no BACKLOG)

| Dim | Candidatos | Sobreviveram | Derrubados por lente | Direção inversa |
| --- | ---------: | -----------: | -------------------: | --------------: |
| 1 Segurança | 7 | 7 (5 com escopo reduzido) | — | `PiiScrubber`, `EnsureUserIsActive`, limiters nomeados, `withExceptions` |
| 2 Arquitetura | 7 | 6 | 1 (`form-request-concerns-trait`) | larastan / `phpstan.neon` |
| 3 Perf backend | 7 | 6 | 1 (`guard-cache-derivado-o1`) | Horizon, supervisors |

Os 12 candidatos aplicáveis viraram A1–A12 no `BACKLOG.md`; 7 foram adiados (B1–B7) e 5 rejeitados com motivo registrado.
