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

### Dimensão 4 — Fluidez & performance frontend ✅

Varredura em 4 recortes paralelos (build/bundle · uso do Inertia · boot/tema/PWA · percepção), secagem única, **3 lentes adversariais por candidato**. 86 arquivos abertos nos dois repositórios (mais `node_modules`/`vendor` do boilerplate, para a lente de atualidade). 15 candidatos brutos → 6 às lentes → 9 registrados sem veredito.

Nenhum candidato passou intacto. **O padrão desta célula: quase toda premissa "o ctfinance ensina X" se inverteu na verificação — o valor real está nos defeitos que o boilerplate JÁ TEM e que a leitura do ctfinance revelou por comparação.**

| # | Candidato | Votos | Destino |
| - | --------- | ----: | ------- |
| D1 | chunk manual por pacote de UI (TDZ só-em-produção) | 2/3 | rescopado, prioridade baixa — incidente não atestado na fonte |
| **D2** | **`flushAll()` na troca de identidade** | **3/3** | **fatia — bug de privacidade vivo no boilerplate** |
| D3 | closure em prop não é lazy | 3/3 | regra `.ai/rules`, sem teste arch (inviável) |
| D4 | primeiro paint em dark | 3/3 | fatia — regressão datada no boilerplate |
| D5 | spinner de busca é código morto | 3/3 | fatia — mesmo defeito, linha por linha |
| D6 | `prefers-reduced-motion` inexistente | 3/3 | **multi-fonte** (motion sweep do ctjuris) — represado |

#### D2 — o cache de prefetch sobrevive à troca de identidade `[guard-rail]` `3/3`

Origem: `resources/js/components/sidebar-context-switcher.tsx:36-38` — o ctfinance chama `router.flushAll()` antes de trocar de contexto, com comentário explicando o porquê, e trava isso em teste (`resources/js/test/components/sidebar-context-switcher.test.tsx:8,13,90`).

**O boilerplate tem os dois ingredientes do bug e nenhuma invalidação:**

- 6 superfícies com `<Link prefetch>`: `nav-main.tsx:58`, `app-sidebar.tsx:39`, `user-menu-content.tsx:25`, `app-header.tsx:97`, `settings/settings-sidebar.tsx:73`, `layouts/settings/layout.tsx:47`.
- 3 pontos de troca de identidade sem flush: `user-details-dialog.tsx:47-61`, `impersonate-banner.tsx:15-18` e — achado da lente, que o caçador perdeu — `hooks/users/use-user-actions.ts:51-53`.
- `grep -rn "flushAll\|flushByCacheTags\|invalidateCacheTags" resources/js` → **0 linhas**.

**Por que o default do Inertia não cobre** (verificado no core 3.6.1 instalado, `@inertiajs/core/dist/index.js:2488-2490`): após uma visita bem-sucedida ele só faz `flushByCacheTags(invalidateCacheTags || [])` — e `removeByTags([])` não remove nada, porque `tags.includes(tag)` é sempre falso em array vazio — mais `router.flush(page.get().url)`, que limpa **apenas a URL de destino**.

**O cheque decisivo, que nenhum caçador fez e duas lentes fizeram:** `StartImpersonateController.php:39-42` e `StopImpersonateController.php:26-28` retornam `RedirectResponse` puro (302), **não** `Inertia::location()`. Se fossem `location()`, a navegação dura limparia o cache sozinha e o candidato seria vazio. Como são 302, a SPA não reinicia e o cache genuinamente sobrevive.

**Impacto concreto de privacidade:** `pages/settings/profile.tsx:44-45` renderiza `auth.user.name` e `auth.user.email`. Um prefetch de `/settings/profile` gerado com o admin logado exibe nome e e-mail do **admin** enquanto se personifica outro usuário.

**As lentes divergiram sobre a forma, e a divergência importa:**

- A lente de ATUALIDADE propôs o idioma v3: `cacheTags` nos `<Link>` + `invalidateCacheTags: 'identity'` nas visitas (`types.d.ts:220,523`; core `dist:3225,3470`).
- REFUTAR e RISCO rejeitaram, com argumento de **modo de falha**: invalidação por tag **falha ABERTO** — esquecer a tag em 1 dos 6 `<Link>`, ou no 7º que alguém adicionar, devolve dado de identidade alheia em silêncio. `flushAll()` **falha FECHADO**: o pior caso é alguns requests extras, num momento raro.

Decisão registrada: **`flushAll()`**. Tags são para invalidação de escopo estreito; troca de identidade invalida semanticamente toda página cacheada.

**Fact-check da lente (afirmação do caçador derrubada):** "o flush precisa acontecer ANTES do `router.post`, senão o redirect já resolveu do cache" é **falso**. O cache só é consultado em `sendRequest()` (`dist:3186`), alcançado apenas quando uma nova visita é iniciada por `router.visit`/`<Link>`; o 302 é seguido pelo axios na camada HTTP e nunca reentra ali. A página velha é servida **no clique seguinte**, não no redirect. O bug e a lacuna continuam confirmados — o que cai é só o racional de ordenação.

#### D3 — closure em prop não é lazy `[guard-rail]` `3/3`, escopo reduzido a doc

`fn() => ...` numa prop de `Inertia::render` resolve **sempre**, em todo full load. Verificado no vendor do próprio alvo: `PropsResolver.php:278-280` e `:355-360` só excluem do primeiro load quem implementa `IgnoreFirstLoad` (`OptionalProp.php:5`, `DeferProp.php:5`).

No ctfinance, `DashboardPageBuilder.php:151,163-165` entrega `categories`/`tags`/`recurring_expenses` como closure nua e o front (`dashboard.tsx:166-168`) re-pede exatamente essas chaves — trabalho feito duas vezes.

**Três correções que as lentes impuseram:**

1. **O teste arch/grep é tecnicamente inviável.** Barrar `=> fn(` produziria falso positivo em 100 % do uso correto, porque `Inertia::defer(fn() => ...)` e `Inertia::optional(fn() => ...)` contêm a própria string barrada. Pest `arch()` também não assere posição de closure dentro de uma call. **Regra de doc, sem gate.**
2. **`once()` NÃO é memoização intra-request** — e gravar isso seria orientação ativamente errada. `ResolvesOnce.php` expõe `until()`/`expiresAt()`/`as()`/`fresh()`, vocabulário de cache **no cliente entre visitas**; `PropsResolver.php:371-373` condiciona a exclusão ao que o cliente já carregou. Pior: `once()` em dado por usuário introduz staleness nova. O `??=` do ctfinance resolve outro problema (compartilhar uma chamada entre três caminhos de prop no mesmo request) e continua necessário.
3. **A regra precisa separar dois casos**, senão vira dano: prop de `Inertia::render` (closure = eager) versus shared prop de `share()` (closure = **correta**, precisa reavaliar por request — é o caso do `'ziggy' => fn(): array =>` em `HandleInertiaRequests.php:74`). Sem essa separação, um agente lendo a regra "conserta" a linha do Ziggy e quebra o `location` por navegação.

**Fact-check:** a narrativa "o dev achou que closure era lazy" é falsa. `tests/Feature/DashboardTest.php:80-84` do ctfinance assere `->has('categories')` no primeiro load, ao lado de `->missing('monthly_data')` para as props genuinamente deferidas — o contrato testado é que essas chaves **chegam**. O defeito real é partial reload redundante, não intenção frustrada.

#### D4 — primeiro paint em dark `[absorver]` `3/3`, re-enquadrado como guard-rail

`resources/views/app.blade.php:30` do boilerplate usa `background-color: var(--color-primary-dark)`, e `--color-primary-dark: #0f2a44` só é declarado em `resources/css/app.css:107` — arquivo que chega pelo `@vite(...)` da linha 52, **depois** do `<style>` inline da linha 23. Enquanto o CSS não é parseado, a declaração é inválida em computed-value time.

**É regressão datada, não decisão:** `git blame` mostra a linha como `oklch(0.14 0.006 220)` literal até `c2ffbc7` ("feat: add Aptos, Montserrat…"). A linha irmã (`html { background-color: white; }`, `:25`) continua literal — a inconsistência confirma o acidente. O `<style>` inline existe justamente para funcionar **sem** o `app.css`.

**Duas correções das lentes:**

1. **Severidade superestimada.** "Canvas branco" é problema de **dev**, não de produção: em produção o `@vite` emite o CSS como `<link>` render-blocking, então o token já existe antes do primeiro paint e o `var()` quebrado é latente. A janela real está em `composer dev`, onde o Vite injeta CSS por JS. A fatia conserta o **acoplamento frágil** e o canvas/scrollbars nativos — não deve ser vendida como conserto de flash visível em produção.
2. **`classList.add` sem remove não é bug.** A classe `dark` só chega por `@class([...])` em `app.blade.php:2`, e nesse ramo o guard `appearance === 'system'` é falso — o script nunca roda sobre um `<html>` que já tem a classe. O runtime já usa `classList.toggle('dark', isDark)` (`use-appearance.tsx:25`). Melhoria de legibilidade, não correção; não pode ser vendida como bug fix.

**Não absorver o `data-theme` do ctfinance:** escrito em três lugares e `grep -rn "data-theme" ctfinance/resources` não encontra **nenhum** seletor que o consuma — é código morto. O boilerplate usa `[data-radix-theme]` (`app.css:95`), que é outra coisa.

#### D5 — o spinner de busca nunca aparece `[guard-rail]` `3/3`

`resources/js/components/data-table/search-bar.tsx:73` do boilerplate: `{isSearching && !value && (` — o spinner só renderiza quando o campo está **vazio**, ou seja, nunca enquanto o usuário digita, que é exatamente quando ele serviria. O estado é calculado e propagado corretamente (`hooks/use-user-search.ts:31,142`, `hooks/users/use-user-filters.ts:31,154`) e descartado só na renderização. Nenhum teste trava isso: `grep -rln "SearchBar" resources/js/test/` → vazio.

O ctfinance tem o mesmo defeito (`search-bar.tsx:86`) — é o primitivo compartilhado, herdado.

**Correções das lentes:** a superfície defeituosa é **9 telas no ctfinance** (não 11 — os pares de linha citados misturavam `SearchBar` e `FilterPanel`, e o uso no FilterPanel não é defeituoso) e **1 tela no boilerplate** (`pages/users/index.tsx:168`). O argumento de alavancagem (é o primitivo que os derivados copiam) continua válido; a fatia não deve alegar largura que não tem.

**Achado que muda a fatia:** o estado `value === '' && isSearching === true` inclui um caso genuinamente travado — early-return em `use-user-filters.ts:54` sem reset. Ou seja, o único spinner hoje visível é, com frequência, um spinner que **nunca para**. São dois arquivos a corrigir, não um.

**Cuidados:** X e spinner disputam o mesmo canto (`right-2` na `:62` vs `right-3` na `:74`) — a correção precisa de slot de largura fixa alternando conteúdo, senão o X pisca durante a digitação, o que é pior. E a região `aria-live` que já anuncia o estado (`pages/users/index.tsx:139-141`) não pode ser removida: a lacuna é estritamente visual.

#### D6 — `prefers-reduced-motion` `[guard-rail]` `3/3` — **represado como multi-fonte**

`grep -rn "prefers-reduced-motion\|motion-safe:\|motion-reduce:" resources/ app/` no boilerplate → **0 ocorrências**, contra 17 usos de `animate-*` (`animate-pulse` em `ui/skeleton.tsx:8`, `animate-spin` em `search-bar.tsx:75`) e as animações de toast em `app.css:673-678`. O ctfinance conhece a media query num único lugar pontual (`use-post-onboarding-contextual-highlight.ts:35-37`), sem tratamento global.

**Não vira fatia agora:** o tema colide com o "sweep de a11y/**motion** no Vitest" do ctjuris, registrado como multi-fonte. Comparar antes de eleger.

**Precaução já registrada:** não zerar `animation` de forma cega — matar a animação de spinner/skeleton apaga a única pista de que o sistema trabalha e piora a percepção para todo mundo. A prática correta é reduzir/desacelerar. E as animações de Radix vêm de data-attributes do próprio pacote, então cobertura parcial dá falsa sensação de resolvido.

#### D1 — chunk manual por pacote de UI `2/3` — rescopado, prioridade baixa

O único candidato que uma lente derrubou. As três divergiram de forma instrutiva:

- **ATUALIDADE e RISCO sobreviveram, invertendo a premissa do caçador:** `manualChunks` **não** sumiu no Vite 8. `vite/dist/node/index.d.ts:2182` declara `rollupOptions?: RolldownOptions` sem `Omit` em `output`; rolldown 1.2.2 tipa `manualChunks?: ManualChunksFunction` (`define-config-DSMNXceb.d.mts:806`, `@deprecated`) e o traduz em runtime para `codeSplitting.groups`. Logo não é erro de `tsc` nem no-op — **o hazard está vivo**, e a "rede de segurança do CI" que o caçador alegava não existe.
- **REFUTAR derrubou pela evidência:** o incidente TDZ **nunca foi atestado** no ctfinance. `git log --all --grep=TDZ -i` devolve só `490de93`, que apenas *cita* o caveat; os dois "reverts" são `refactor(vite)` e `chore(ci)`, nenhum `fix(`. Somado a isso, o boilerplate não tem `recharts`, e a etiologia é específica do Rollup, não verificada no Rolldown. Escrever a regra propagaria uma afirmação não verificada para 7 derivados.

**Resolução (Guardrail 5 — regra que afirma fato falso é pior que nada):** a regra, se um dia existir, cita a documentação do Rolldown, que confirma a **classe** do bug em fonte primária ("manual splitting can affect application behavior if side effects occur before modules are loaded", com `strictExecutionOrder` como mitigação nativa — presente no instalado, `define-config-DSMNXceb.d.mts:978`) e **não** o incidente do ctfinance. Como o boilerplate hoje não tem chunk manual algum (`grep` por `manualChunks|codeSplitting|advancedChunks|rollupOptions` → vazio), a regra nasceria sem call site. Prioridade baixa.

#### Direção inversa — onde o boilerplate já é superior (nota, não candidato)

1. **`tryParseUrl()`** (`vite.config.ts:13-19`): o ctfinance chama `new URL(appUrl)` cru em `:57` e `:80` — um `APP_URL=myapp.test` sem scheme derruba o config inteiro, e com ele `vite`, `build` e o Vitest. Se a derivação de host/porta por `APP_URL` for absorvida algum dia, tem de passar por `tryParseUrl`.
2. **Paridade `app.tsx` ↔ `ssr.tsx`**: o ctfinance ainda usa `resolvePageComponent` cru no `ssr.tsx:14` enquanto o `app.tsx:16` usa o resolver de recuperação. O boilerplate usa `resolveInertiaPage` nos dois. O que sobra do ctfinance aqui é a **lição**, não o código.
3. **`useDebouncedValue`** (`hooks/use-debounced-value.ts:7`, genérico, 21 linhas, com teste): o ctfinance não tem equivalente — hand-rolla `setTimeout` + `useRef` + flag `isInitialMount` dentro de **10 hooks de filtro quase idênticos**.
4. **Duas versões de API à frente**: `Inertia::once()`/`shareOnce()`, `DefersProps::defer()` fluente, `defer(..., rescue: true)`, `scroll()`; no front `flushByCacheTags` e `invalidateCacheTags`. Vários workarounds manuais do ctfinance são obsoletos por construção no alvo.

### Dimensão 5 — UX ✅

Varredura em 4 frentes paralelas (fluxos ponta a ponta · formulários · tabelas/listas/estados · a11y/navegação), **3 lentes adversariais por frente**, secagem única. 32 candidatos brutos → **28 sobreviveram, 4 derrubados por lente**; mais 6 da secagem, verificados à parte.

**A célula com o maior rendimento da rodada até aqui — e o padrão da dimensão 4 se confirmou em forma mais extrema: de 28 sobreviventes, 22 são defeitos vivos no PRÓPRIO boilerplate**, visíveis só ao ler o ctfinance ao lado. Só 6 são código a portar do derivado.

Duas frentes independentes convergiram nos mesmos três achados sem se falarem (`InputError` sem live region, `FormField` com zero adoção, `useFlashMessages` opt-in por página) — evidência convergente, não repetição.

#### O achado que muda a prioridade da rodada

`app/Http/Controllers/User/IndexController.php:64-73,76` passa `sort_order` cru para `orderBy()` e não põe teto em `per_page`. `/users?sort_order=<lixo>` **derruba a listagem em 500** (`Builder.php:2985-2993` lança). Não é hipótese: a rota é autenticada e autorizada, mas qualquer usuário com `manage_users` alcança. E a defesa **já existe pronta no ctfinance** (`RecurringExpense/IndexController.php:94-103`), com allow-list de campo, normalização de direção e teto de page size via o helper nativo `$request->integer()`. O caçador tinha afirmado que a defesa do ctfinance "é constante de frontend, nunca chega ao servidor" — a lente mediu e era falso.

#### Vereditos

| # | Candidato | Classe | Origem do valor |
| - | --------- | ------ | --------------- |
| E1 | motivo de bloqueio morre na fronteira do hook (`onError: () =>` descarta o bag) | guard-rail M | defeito de casa |
| E2 | consumo de flash é opt-in por página — 8 de 17 não chamam o hook | absorver M | defeito de casa |
| E3 | `/` não é destino: logout e auto-exclusão ricocheteiam mudos até o login | guard-rail P | defeito de casa |
| E4 | contrato de gate que redireciona (isenção, memória do destino, beco explicado) | guard-rail P | padrão do derivado |
| E5 | 429 dos limiters do boilerplate sem tratamento — HTML cru no modal do Inertia | guard-rail M | defeito de casa |
| E6 | `InputError` não é live region | absorver P | defeito de casa |
| E7 | `FormField` existe, é testado e tem **zero** adoção — 27 erros sem `aria-describedby` | guard-rail M | defeito de casa |
| E8 | posse do `InputError` + rejeição de filho não-host no `FormField` | guard-rail P | defeito de casa |
| E9 | máscara inline no `onChange` sem preservação de caret — **3 offenders vivos** | absorver M | defeito de casa |
| E10 | validação progressiva de form longo → Precognition, não `intent` no payload | guard-rail P | padrão do derivado (modernizado) |
| E11 | visita repetida disparada por digitação (debounce, dedup, corrida, `preserveState`) | guard-rail P | padrão do derivado |
| E12 | `confirmationNote` + `w-full sm:w-auto` + fallback de `DialogDescription` | absorver P | padrão do derivado |
| E13 | `flash` no `share()` não é `Inertia::always()` — partial reload consome e o toast some | absorver P | defeito de casa |
| E14 | `EmptyState type="row"` emite `<tr>` dentro de `<div>` dentro de `<td>` | guard-rail P | defeito de casa |
| E15 | `EmptyState` sem `action` — estado vazio é beco sem saída | absorver P | padrão do derivado |
| E16 | sem variante mobile-card e sem piso de alvo de toque | absorver M | padrão do derivado |
| **E17** | **`sort_order`/`per_page` crus — 500 alcançável por URL** | **absorver P** | **defeito de casa** |
| E18 | toast de erro anunciado como `role=status`/`polite` | guard-rail P | defeito de casa |
| E19 | peças mortas do kit data-table (`DataTableHeader`, `DateRangeFilter`, `use-user-search`) | guard-rail P | defeito de casa |
| E20 | `DateInput` sobrescreve o `aria-invalid` que o `FormField` injeta | guard-rail P | defeito de casa |
| E21 | `DeleteConfirmationDialog` com `description` opcional — alertdialog sem descrição | guard-rail P | defeito de casa |
| E22 | navegação principal não é landmark e o item ativo não é anunciado | guard-rail P | defeito de casa |
| E23 | `<div role="button">` na busca: não focável, sem handler de teclado | guard-rail P | padrão do derivado |
| E24 | nenhum skip-link | guard-rail P | defeito de casa |
| E25 | live region da busca anuncia o começo e nunca o resultado | guard-rail P | defeito de casa |

Derrubados (motivo completo no BACKLOG): janela de arrependimento de exclusão de conta (sobreposto ao B1, e o nativo é `SoftDeletes` + `Prunable`) · `intent` no payload como contrato (Precognition é nativo; regra sobre wizard inexistente é imposto de contexto) · `required` do `FormField` ser só asterisco (os call sites reais usam `required` nativo, que **entrega** a semântica) · `eslint-plugin-jsx-a11y` (peer declara até ESLint 9; o boilerplate roda 10.8.0 — é incompatibilidade, não decisão).

#### O que as lentes corrigiram (amostra — a íntegra está no escopo corrigido de cada item do BACKLOG)

1. **`aria-live` num nó recém-montado não anuncia.** O remédio do ctfinance (`aria-live="polite"` no `InputError`) não funciona no nó que ele mesmo monta — a região precisa preexistir. O certo é `role="alert"` para o uso avulso e slot sempre renderizado dentro do `FormField`. **Absorver o problema, rejeitar o remédio do derivado.**
2. **`replace: true` no autosave é desnecessário** quando a resposta volta para a mesma URL: o Inertia 3.6.1 já faz replace sozinho (`isSameUrlWithoutHash` no core). O caçador tinha vendido isso como "o detalhe que importa".
3. **A correção proposta para o `flash` (closure pelada) não preserva nada** — `Store::save()` chama `ageFlashData()` em toda requisição (`Session/Store.php:181-183,233-240`), então a mensagem é apagada no fim do próprio request parcial. O mecanismo nativo correto é `AlwaysProp`, que faz bypass do filtro em `PropsResolver.php:325`.
4. **O Inertia 3.6 tem flash nativo** (`Inertia::flash()`, `Page['flash']`, evento `inertia:flash` / `router.on('flash')`) — o canal caseiro `->with()` + prop + `use-flash-messages.tsx` é reimplementação. Isso subsome E2 e E13 e é decisão de arquitetura, não fatia: registrado como proposta para o dono.
5. **`app-header.tsx` e `app-header-layout.tsx` são código morto** — `AppHeaderLayout` não é importado por ninguém; `layouts/app-layout.tsx:1` importa fixo o `app-sidebar-layout`. O caçador tinha o título "em toda página autenticada"; nenhum dos dois botões renderiza jamais. O único caso vivo da família é `data-table/search-bar.tsx:56`.
6. **O `<main>` real é o do `SidebarInset` (`ui/sidebar.tsx:304`)**, não o de `app-content.tsx:14` (ramo `variant="header"`, alcançável só pelo layout morto). Seguir o caçador produziria um skip-link apontando para um id que nunca existe.
7. **`@radix-ui/react-dialog@1.1.23` não emite warning de descrição ausente** (`grep -n "warn"` no dist → 0 linhas). O argumento se sustenta em ARIA, não em ruído de console.
8. **3 offenders vivos de máscara inline** em `user-form.tsx:172-175,235-238,257-260` — o caçador afirmara "o boilerplate hoje tem 0 offenders, nasce verde". E não existe máscara `mobile` no mapa `MASKS`, então a migração não é 1:1.
9. **`role="text"` (usado no `hidden-text`/`hidden-value` do ctfinance) não é role ARIA válido** — era extensão só do Safari. O mascaramento de dado sensível vira só visual.
10. **`jest-axe` sobre a suíte Vitest existente pega o que o `jsx-a11y` estruturalmente não pega** (nome acessível computado através de `<Button>`, Slot do Radix e `asChild`): teria pegado 4 dos achados desta célula; o lint não pegaria nenhum, porque todos passam por componentes.

#### Direção inversa — onde o boilerplate já é superior (nota, não candidato)

1. **`ui/confirm-dialog.tsx:6`** já torna `description` obrigatória no tipo — é o padrão a replicar no `DeleteConfirmationDialog`, melhor que as strings de fallback do ctfinance (que só poluem a árvore de a11y).
2. **`pages/users/index.tsx:139`** já usa o padrão correto de live region (região sr-only preexistente) — é o modelo interno a seguir, não o `InputError` do ctfinance.
3. **`autoFocus` no botão Cancelar** do `DeleteConfirmationDialog`, que o ctfinance não tem.
4. **`withExceptions` completo** (página Inertia + fallback Blade + 419 + `SecurityHeaders::stamp()`) contra o bloco **vazio** do ctfinance.
5. **`Settings/Privacy/ShowController.php:19`** do ctfinance publica `pendingDeleteUntil` uma segunda vez, na mesma página em que o `share()` já publica (`HandleInertiaRequests.php:75`) — é exatamente o segundo canal que o `CLAUDE.md` do boilerplate proíbe. Absorver verbatim importaria o defeito.

#### Secagem (passada extra ÚNICA) — 6 candidatos, 5 sobreviveram

Rendeu uma família que nenhuma das 4 frentes viu: **código morto herdado do starter kit**. Sete peças medidas no boilerplate — `app-header-layout.tsx`, `app-header.tsx`, `user-details-dialog.tsx`, `layout/page-header.tsx`, `data-table/table-header.tsx`, `hooks/use-user-search.ts`, `DateRangeFilter`.

**Duas delas fizeram caçadores errarem o diagnóstico nesta mesma célula** (E23 acusou "botões sem nome em toda página autenticada" olhando o `app-header` morto; E29 acusou "dois caminhos, um com feedback" olhando o `user-details-dialog` morto). Código morto não é só peso: é desinformação ativa, e custou duas premissas falsas numa varredura que fez de tudo para não errar.

| # | Candidato | Classe | Nota |
| - | --------- | ------ | ---- |
| E26 | Ctrl+B come tecla dentro de campo de texto, e o atalho é invisível | guard-rail P | o ctfinance tem o **mesmo** handler sem guarda — colhe-se dele só a dica em Tooltip |
| E27 | layout morto sem o banner de personificação | guard-rail P | latente, não vivo — mas a única saída da personificação não tem teste que a trave |
| E28 | `loading`/`aria-busy` no `Button` (16 spinners, 2 idiomas, 0 `aria-busy`) | absorver M | copiar verbatim faria "Excluir Conta" perder o `disabled` real sob `asChild` |
| E29 | personificar pelo menu é mudo — e o `preventDefault` trava o dropdown aberto | absorver P | o Inertia 3.6 **já** aborta a visita em voo; não implementar guarda de duplo-POST |
| E30 | erro de senha sobrevive ao Esc/X — `<Dialog>` não controlado | guard-rail P | **arquivo verbatim do starter kit: todo derivado tem o bug** |
| — | interruptor de preferência sem ponto de leitura | **rejeitado** | o boilerplate não tem nenhuma preferência persistida — o gate nasceria vácuo |

#### Ponteiros que a dimensão 5 deixou para as células 6, 7 e 8

Fatos verificados que **não** são UX. Entram como candidatos quando a célula dona abrir — não reabrem esta.

**Para a dimensão 6 (UI):**

| Fato verificado | Onde |
| --------------- | ---- |
| `empty-state.tsx:2` do boilerplate ainda importa `{ Box, Flex, Table, Text } from '@radix-ui/themes'`; o do ctfinance é 100% Tailwind/tokens | troca de implementação (o contrato `action` já virou E15) |
| `delete-confirmation-dialog.tsx:66-76` fixa cores literais (`bg-red-100 dark:bg-red-900/40`, `bg-orange-100`…) em vez de tokens | o mesmo arquivo existe nos dois e o diff é exatamente tokens × literais |
| `pages/users/index.tsx` tem cor de marca hardcoded em 4 pontos (`text-cyan-600 dark:text-cyan-500` em `:149,226,234`; `bg-cyan-600 hover:bg-cyan-700` em `:190`); o ctfinance usa `text-primary`/`Button` sem override | — |
| `data-table/filter-toggle.tsx:14-24` usa `<button>` cru com `bg-primary/20 dark:bg-primary/40` hardcoded; o ctfinance usa as variantes CVA `toolbar`/`toolbarActive`, que **não existem** no `ui/button.tsx` do boilerplate | — |
| `input-error.tsx:6` usa `text-sm text-red-600 dark:text-red-400`; o ctfinance usa `text-destructive` + tokens de tipografia | cor de erro fora do token semântico |
| `ui/button.tsx:27` do boilerplate tem `icon: "size-9"` (36px) contra `size-11` (44px, piso de alvo de toque) no ctfinance `:31`; e `rounded-md` hardcoded contra `rounded-[var(--radius-control)]` | conversa com o E16 fatia A |
| `layout/page-header.tsx:41` monta classe Tailwind por interpolação (`from-${iconGradient.from}`) — o JIT não varre string dinâmica, **o gradiente nunca é gerado**. Componente tem 0 call sites | código morto **e** quebrado |
| o `Alert` do ctfinance tem `variant="success"`; o boilerplate repete classes emerald inline no call-site (`pages/auth/verify-email.tsx:25-28`, idem `forgot-password.tsx`) | — |
| ctfinance tem `test/styles/design-tokens-contract.test.ts` (26 custom properties + 11 classes travadas por teste, incluindo `.dark` definir `--surface-base`) e `test/components/design-token-consumers.test.tsx`; o boilerplate não tem equivalente | **padrão forte a absorver na 6** |
| ctfinance define `--focus-ring-{color,width,offset,offset-color}` (`app.css:181-184`, redefinidos no escuro em `:279-280`) + classe `.focus-ring-brand` (`:362-375`); o boilerplate tem **0** ocorrências de `focus-ring` e espalha 19 usos de `focus-visible:` pelos primitivos | comportamento (foco visível existe) está OK nos dois — é centralização |
| ctfinance transforma a navegação de settings em `Sheet` lateral no mobile (`pages/settings/privacy.tsx:73-95`, `lg:hidden` + trigger com o item atual no rótulo) | comparar com `layouts/settings/layout.tsx` |
| ctfinance `critical-alerts-banner.tsx:31` combina `role="alert" aria-live="assertive" aria-atomic="true"`; o boilerplate só tem `role="alert"` no primitivo (`ui/alert.tsx:30`), sem `aria-live` em call site nenhum | — |
| ctfinance `ui/date-picker.tsx` é híbrido de 322 l. (input digitável dd/MM/yyyy + popover `react-day-picker`, ISO no fio, locale ptBR); o `ui/date-input.tsx` do boilerplate tem 75 l. e é `<input type="date">` nativo | trocar exige `react-day-picker` + `date-fns` = **`[dep-nova]`** |
| **`role="text"` não é role ARIA válido** (era extensão só do Safari) e o ctfinance o usa nos dois componentes que mascaram dado sensível (`ui/hidden-text.tsx:70`, `ui/hidden-value.tsx:48`) — o `aria-label` irmão pode ser ignorado e o mascaramento vira só visual | **não absorver assim** |
| ctfinance `ui/date-picker.tsx:1` importa `InputError` dentro do primitivo (2 usos) — se a posse do `InputError` virar lint (E8), esta é a exceção que a célula 6 precisa decidir | — |

**Para a dimensão 7 (copy):**

- `hooks/permissions/use-permission-actions.ts:45,77,107` responde "Erro ao atribuir cargo!" + "Por favor, tente novamente." para falhas que **nunca** vão passar numa nova tentativa (ex.: "Você não pode remover o seu próprio cargo!").
- ctfinance põe a regra de bloqueio na própria `description` do diálogo (`categories/index.tsx:331`) e usa `cancelText="Manter categoria"` em vez de "Cancelar"; o diálogo de revogar cargo do boilerplate (`pages/users/index.tsx:373-400`) não enuncia nenhuma das 4 condições que bloqueiam a ação.
- ctfinance centraliza mensagens de fluxo em `app/Services/Onboarding/OnboardingFlashMessages` e nomeia o passo de destino ("Voltou para {$previousLabel}."); o boilerplate tem `grep -rn "with('success'" app/` → **11 literais inline**.
- ctfinance centraliza microcopy em `resources/js/content/phase-one-surface-copy.ts` (`internalAccessMicrocopy`, `authSurfaceMicrocopy`) com **3 testes de linguagem**; o boilerplate hardcoda as mesmas strings inline nas 6 páginas de auth e em `pages/users/index.tsx`.
- ctfinance concentra mensagem de validação acionável via `messages()` no FormRequest (`UpdatePfFinancialBaseRequest.php:88-95`) em vez do default do Laravel — medir a cobertura de `messages()` nos dois lados.
- `ui/breadcrumb.tsx:96`: **única** diferença entre os dois arquivos é `sr-only` "Mais" (boilerplate) × "More" (ctfinance) — string em inglês no derivado.
- Textos destrutivos divergem por escolha: boilerplate "O cadastro é apagado de vez. Não existe lixeira nem como recuperar depois." (`:312`) + alternativa de desativar (`:326`); ctfinance "Essa pessoa perderá o acesso… você pode incluí-la novamente depois." (`:317`) — e o do ctfinance é factualmente **mais brando** que o hard delete que B1 mapeou.

**Para a dimensão 8 (ops/DX):**

- ctfinance `EnsureSubscriptionActive.php:46-48` torna o gate inteiro no-op sob `config('billing.enabled')`, com docblock (`:14-19`) explicando que isso mantém o app abrível em beta e em todo PR — **padrão de feature flag para gate ainda incompleto**.
- ctfinance `Category/DestroyController.php:24-28,35-39,46-50,57-61,68-72` emite `Log::warning` estruturado (user_id, category_id, category_name) em **cada** bloqueio de exclusão e `Log::info` no sucesso (`:81-85`) — observabilidade de ação negada, que no boilerplate só existe para RBAC (`RevokeRoleController.php:56-62,75-82`).
- boilerplate `bootstrap/app.php:57` desliga a página de erro Inertia em `local` **e `testing`**, então nem o time nem a suíte jamais exercitam `pages/errors/error-page.tsx` num request real.
- ctfinance `utils/analytics.ts:18-39` é sink de evento sem vendor (`dataLayer` + `window.analytics` + `CustomEvent`) — ponto de plugue único para GA/PostHog sem acoplar o app; **mas tem 1 call-site só**.
- ctfinance `tests/Browser/DashboardContextSwitcherBrowserTest.php:103-125` prova, no MESMO caso, que a afordância some da tela **e** que o endpoint recusa (403) — é a prova executável da doutrina "`PermissionsGuard` no React é UX-only" do `CLAUDE.md`. O boilerplate cobre bem só a metade backend (46 asserções de 403 em 19 arquivos) e não tem infra de Pest Browser para pendurar a outra metade.
- Compatibilidade a anotar se testes browser do ctfinance forem portados: `CategoryDeleteConfirmationBrowserTest.php:130` seleciona `[role="dialog"]`, mas o boilerplate marca `delete-confirmation-dialog.tsx:82` e `ui/confirm-dialog.tsx:50` com `role="alertdialog"` — o seletor não casaria. E `:110-113` seleciona por `button[aria-label="Mais opções para %s"]`, o que transforma `aria-label` em contrato travado por teste.

### Dimensão 6 — UI ✅

Varredura em 4 frentes (tokens/tema · primitivos `ui/` · CVA/ícones/densidade · skeleton/microinteração), **3 lentes adversariais por frente**, secagem única. **67 candidatos caçados → 68 vereditos** (um achado novo nasceu na verificação), **66 sobreviveram, 1 rejeitado**, mais 8 da secagem. É de longe a célula de maior rendimento da rodada.

Os 17 ponteiros que a dimensão 5 deixou entraram como candidatos a julgar. Todos receberam veredito; três tiveram o escopo invertido.

#### O achado que domina a célula: o `@theme` do boilerplate está quebrado de três formas

Medido no CSS **compilado** (`public/build/assets/app-*.css`), não só no fonte:

1. **`--color-primary` está definido duas vezes com valores diferentes** — `app.css:37` dentro do `@theme` (`var(--primary)`) e `app.css:108` num `:root` **sem layer** (`#1f3c57`). Declaração sem layer vence declaração em `@layer`: confirmado no artefato (a primeira sai na posição 11239, dentro de `@layer theme{`; a segunda na 813686, fora de qualquer layer). Resultado: `bg-primary`, `text-primary` e `hover:bg-primary/90` resolvem para **`#1f3c57` nos dois temas**, e `--primary` — que o `.dark` troca por `var(--color-accent)` — **nunca chega a utilitário nenhum**. O comentário `/* Buttons/CTAs should be high-contrast in dark mode */` na `:169` descreve um efeito morto. `text-primary` no escuro dá **1.28:1**.
2. **Mesma colisão em `--color-accent`** (`:46` × `:111`): `hover:bg-accent` de todo `Button variant="ghost"`/`outline` pinta `#379bcb` saturado em vez do azul pálido do tema, idêntico nos dois. Alcance real medido: **59 matches em 39 linhas** (o caçador disse 84 — era contagem de `grep -o`, e 25 eram `-foreground`, que não é sombreado).
3. **Os 6 pares `--color-success/warning/info(-foreground)` nunca entraram no `@theme`.** Os tokens `--success`/`--warning`/`--info` existem em `:root` e `.dark`, mas sem o export viram **classe morta**: no CSS compilado de 832 KB há **0 ocorrências** de `.text-success`, `.bg-success`, `.text-warning`, `.text-info`. Controle positivo: `.text-destructive` existe. E há call-site vivo — `users/user-actions-menu.tsx:125` escreve `text-success focus:text-success`, que é descartado.

**Achado novo, nascido na verificação e pior que os três:** `@radix-ui/themes` **redeclara `--color-background` sem layer** e sequestra `bg-background` em todo o app. Chega globalmente por `app.tsx:7` (`import { Theme }`), que é justamente o que impede escopar a folha sem efeito colateral.

**O mecanismo da correção é uma palavra** — `@theme {` → `@theme inline {` (`app.css:14`) — mas a lente mediu o que o caçador não mediu: **pós-correção, `bg-primary` + `text-primary-foreground` no escuro cai de 11.4:1 para 3.13:1 e reprova em AA**. Ou seja, a fatia é a palavra **mais** recalibração das duas paletas. Sem essa medição, a "correção de uma linha" teria embarcado uma regressão de contraste.

**Nada disso se copia do ctfinance:** ele tem a mesma colisão (`app.css:119-126`) e não a resolveu — nele o dano é menor só porque o valor pinado coincide com o do escuro. O que se colheu foi o **diagnóstico**, e a prova do mecanismo veio de um bloco que o ctfinance escreveu **de propósito** (`app.css:299-311`, remapeando `--color-cyan-*` no `:root` justamente por saber que um `:root` não-layerizado vence o `@theme`).

#### Segundo bug visível, independente do primeiro

**`<Alert variant="destructive">` renderiza texto branco em fundo branco no tema claro.** E a lente derrubou também o remédio proposto: `bg-destructive/10 text-destructive` dá **4.00:1**, ainda abaixo de AA. A forma correta, que é a do shadcn atual, é `border-destructive/30 bg-card text-destructive` — `#e11d48` sobre branco dá **4.70:1**.

#### Terceiro: HTML interativo aninhado

`<Link><Button>` produz `<a><button>` em **6 pontos** do boilerplate. O certo é `<Button asChild><Link/></Button>`. O melhor precedente do caso difícil (Tooltip + `asChild` + `size="icon"`) está em `ctfinance users/user-table-row.tsx:92`.

#### O que as lentes corrigiram (amostra)

1. **Os percentuais de `color-mix` do ctfinance não se copiam.** Aritmética refeita ao centésimo: aplicando a fórmula dele à paleta do boilerplate, **3 dos 4 estados reprovam** (warning 2.53:1, info 3.26:1, success 3.92:1). E o emerald inline que hoje está em `verify-email.tsx` tem **14.38:1** — trocá-lo por um `.state-success-soft` mal calibrado é **regressão**.
2. **`--ring` é idêntico nos dois temas e dá 1.34:1 no claro** — o anel de foco é praticamente invisível. Veredito: **corrigir o valor, não absorver a forma**; nada de classe `.focus-ring-brand`.
3. **E16 fatia A encolheu.** Subir `icon: size-9 → size-11` no CVA muda **1 call-site vivo** — "é quase no-op, e o ctfinance prova que não resolve". O que vale de fato é o `<InfoTrigger>` + a regra de piso.
4. **O pareamento com a dimensão 5 foi corrigido em 4 casos.** O mais importante: escopar o CSS do Radix Themes **não** viaja com E14+E15 — "acoplar um risco de cascata de 69 regras a uma reescrita de componente torna a PR irrevisável".
5. **`react-hot-toast` 2.6.0 não emite `data-state` nem `data-icon`** — a animação de toast do boilerplate é **CSS morto**.
6. **`ui/table.tsx` tem 0 usos** e convive com a `Table` do `@radix-ui/themes`; é o único lugar com estado de linha selecionada. Virou `[proposta-adr]`.

#### Direção inversa e notas

- O `delete-confirmation-dialog` do ctfinance é **idêntico** ao do boilerplate nas cores literais — ele não resolveu nada ali. A cura é `state-*-soft`, não cópia.
- `page-header.tsx` monta className por interpolação e **o gradiente nunca é gerado** — bug idêntico nos dois projetos, em componente morto nos dois.
- `role="text"` (inválido, só existiu no Safari) no ctfinance; `role="button"` redundante sobre `<Button>` no boilerplate. ARIA escrita à mão sem nada checando, dos dois lados.
