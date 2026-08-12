# spinmax — harvest v2

- **Path:** `/Users/cristianomorgante/workspace/laravel/clients/spinmax/app` (a raiz Laravel é o subdiretório `app/`)
- **SHA pinado:** `e4ec01e` · branch `develop` · working tree **suja (3 arquivos)** no momento do pin
- **Varrido em:** 2026-08-12 · **dev ativo de outra pessoa** no repositório — leitura estritamente read-only
- **Legenda:** ⊕ o spinmax tem e o boilerplate não · ⊖ o boilerplate tem e o spinmax não

> Este arquivo é o INVENTÁRIO da célula 0. Ele enumera; não julga. As 8 dimensões o CONSOMEM
> e só abrem os arquivos relevantes à pergunta de cada uma — nada de re-listar o disco por célula.
> Achados com veredito adversarial entram abaixo do inventário, conforme forem produzidos.

## Inventário

Produzido por 8 frentes paralelas + 1 crítico de completude (9 agentes, 0 erros, ~966k tokens).

### ⚠️ Números corrigidos — leia ANTES de consumir este inventário

O crítico de completude mediu de novo o que as frentes afirmaram e **derrubou 12 números**. A tabela completa
está em `#### Correções de fato`, no fim do arquivo; os valores abaixo são os **medidos**, e são os que valem.
Dimensão que citar um número desta lista tem de citar o da direita.

| Alegado por uma frente | Medido (vale este) |
| ---------------------- | ------------------ |
| 63 rotas em `routes/web.php` | **52** |
| 22 rotas no grupo `store.` | **19** |
| 8 listeners | **10** em `app/Listeners/`, sendo **8** em `Listeners/Store/` (7 exclusivos) |
| 29 páginas React | **28** |
| 96 arquivos em `components/` | **94** |
| 7 em `components/shop/` · 9 em `components/store/` | **6** · **8** |
| 30 arquivos em `resources/js/test/` | **35** (33 specs + setup + d.ts) |
| landing é "Blade pura, sem JS" | **5 `<script>` inline, 593 linhas de JS vanilla** — fora do Vite, do ESLint e do Vitest |
| `app/Listeners/PiiAwareTap.php` no boilerplate | path inexistente — é `app/Support/Logging/` |
| `.pnpm-store/` versionado | não rastreado e não ignorado; contém só `v10/` vazio |
| ~180 screenshots em `specs/` | **175** |

**Contagens verificadas e corretas** (não re-medir): 72 rotas na aplicação · 24 migrations · 15 models · 12 commands ·
4 jobs · 10 events · 16 form requests · 3 policies · 2 rules · 6 middlewares · 5 enums · 12 factories · 5 seeders ·
16 configs · 117 arquivos em `tests/` (93 Feature / 18 Unit) · 209 arquivos em `resources/js/` · 30 primitivos em
`components/ui/` · `.env.example` com 51 chaves ativas.


### Rotas, middlewares e providers

#### 1. Arquivos em `routes/` — visão geral

| Arquivo | Rotas | Carregado por | Prefixo | Observação |
|---|---|---|---|---|
| `routes/web.php` | 52 | `withRouting(web:)` | — | 3 superfícies num arquivo só: loja pública, webhook, painel admin |
| `routes/auth.php` | 12 | `require` no fim do `web.php` | — | Breeze-like; `guest` (6) + `auth` (6) |
| `routes/settings.php` | 7 | `require` no fim do `web.php` | `settings/` | `auth` apenas (sem `verified`, sem `EnsureUserIsActive`) |
| `routes/api.php` | 1 | `withRouting(api:)` ⊕ | `/api` | boilerplate não registra `api:` no `withRouting` |
| `routes/console.php` | 0 rotas / 7 agendamentos + 1 comando `inspire` | `withRouting(commands:)` | — | |
| `channels.php` | — | ausente | — | Não existe broadcasting em nenhum dos dois |
| `/up` | 1 | `withRouting(health: '/up')` | — | igual ao boilerplate |

Total de rotas declaradas na aplicação: **72** (+ `/up`, + rotas de pacote: Horizon em `HORIZON_PATH` default `horizon` com `'middleware' => ['web']`, e Log Viewer com `['web', AuthorizeLogViewer::class]`).

#### 2. `routes/web.php` — agrupamentos e middlewares

**a) Landing** — `routes/web.php:17`

| Rota | Nome | Middleware | Nota |
|---|---|---|---|
| `GET /` | `home` | (só grupo `web`) | `LandingController::__invoke(): View` — retorna **Blade** (`landing.blade.php`), não Inertia. Fica **fora** do grupo `public.store`, mas **dentro** do grupo Ziggy `shop` |

**b) Loja pública** — grupo `Route::middleware('public.store')`, `routes/web.php:20-48`

Sub-grupo aninhado `store.enabled` (kill switch):

| Rota | Nome | Middleware extra |
|---|---|---|
| `GET comprar` | `shop.buy` | — |
| `GET checkout` | `shop.checkout` | — |
| `POST checkout` | `shop.checkout.store` | `throttle:10,1` |

Fora do kill switch (acompanhamento segue no ar com a loja desativada):

| Rota | Nome | Middleware extra |
|---|---|---|
| `GET pedido/consulta` | `shop.order.lookup` | — |
| `POST pedido/consulta` | `shop.order.lookup.resolve` | `throttle:10,1` |
| `GET pedido/{order:uuid}` | `shop.order.show` | **`signed`** (URL assinada) |
| `GET loja-indisponivel` | `shop.unavailable` | — |
| `GET politica-de-privacidade` | `legal.privacy` | — |
| `GET termos-de-compra` | `legal.terms` | — |
| `GET trocas-e-devolucoes` | `legal.exchanges` | — |

**c) Fora de qualquer grupo** — `routes/web.php:51-58`

| Rota | Nome | Middleware | Nota |
|---|---|---|---|
| `GET pedido/{order:uuid}/status` | `shop.order.status` | `throttle:60,1` | JSON puro; deliberadamente fora do `public.store` para não carregar root view/Inertia |
| `POST webhooks/mercadopago` | `webhooks.mercadopago` | `throttle:mp-webhook` | **integração externa** — ver §3 |

**d) Painel autenticado** — `Route::middleware(['auth','verified',EnsureUserIsActive::class])`, `routes/web.php:61-159`

| Sub-grupo (gate) | Rotas | Nomes |
|---|---|---|
| — | 1 | `dashboard` |
| — | 1 | `users.impersonate.stop` (`DELETE users/impersonate`, declarada antes de `users/{user}` de propósito) |
| `can:manage_users` | 11 | `users.index/create/store/show/edit/update/destroy/toggle-active`, `users.permissions.show/grant/revoke` |
| — (só `auth`) ⊕/⊖ | 1 | `users.impersonate` com **`throttle:10,1` e SEM `can:`** — no boilerplate a mesma rota tem `['throttle:impersonate','can:impersonate_users']` |
| `can:manage_roles` | 3 | redirect `/permissions`, `role-permissions`, `roles-permissions.update` |
| `can:assign_roles` | 2 | `user.assign-role`, `user.revoke-role` |
| `can:manage_users` | 1 | `user.sync-permissions` |
| **`prefix('store')->name('store.')`** ⊕ | 22 | ver abaixo |

Bloco `store.` (`routes/web.php:114-157`) — inteiramente ⊕ (não existe no boilerplate):

| Gate | Rotas |
|---|---|
| `can:export_store_data` | `store.orders.export` (declarada **antes** de `orders/{order}` para "export" não casar como id) |
| `can:view_orders` | `store.orders.index`, `store.orders.show` |
| `can:manage_orders` | `store.orders.ship`, `.tracking`, `.separation.start` (PATCH), `.separation.undo` (DELETE), `.deliver`, `.cancel`, `.resend-email` |
| `can:view_customers` | `store.customers.index`, `store.customers.show` |
| `can:manage_store_settings` | `store.settings.show/update`, `store.variants.show/update` |
| `can:manage_shipping_table` | `store.shipping-rates.show/update`, `store.city-shipping-rates.update` |

Detalhe documentado no próprio arquivo (`web.php:129-133`): `separation.start` e `separation.undo` compartilham a URI e diferem no verbo, com **nomes distintos porque o Ziggy indexa por nome** — nome repetido faria um dos verbos sumir do front.

#### 3. Rotas de webhook / integração externa

| Rota | Path | Proteções | Path do handler |
|---|---|---|---|
| Mercado Pago | `POST webhooks/mercadopago` | `throttle:mp-webhook` (120/min por IP); **fora do CSRF** (`validateCsrfTokens(except: ['webhooks/*'])`); **fora do maintenance mode** (`preventRequestsDuringMaintenance(except: ['webhooks/*'])`); validação HMAC via `WebhookSignatureValidator::validate()` com `x-signature` + `x-request-id` + `strtolower($dataId)` + secret de `config('services.mercadopago.webhook_secret')` (valor `***`) + tolerância `store.payment.webhook_tolerance_seconds` (300) | `app/Http/Controllers/Webhook/MercadoPagoController.php` |
| Cotação de frete (consumida pelo checkout público) | `POST /api/shipping/quote`, nome `api.shipping.quote` | sem auth; `throttle:30,1` | `routes/api.php:9`, `app/Http/Controllers/Shipping/QuoteController.php` |

O controller do webhook responde 401 em assinatura inválida, grava `WebhookEvent` para idempotência, despacha `ProcessMercadoPagoWebhookJob` e responde 200; tópicos processáveis fixados em `PROCESSABLE_TOPICS = ['payment','order']`, qualquer outro vira `ignored`. Há um re-check de janela temporal próprio para `TIMESTAMP_OUT_OF_TOLERANCE` (unidade ms × s do `ts` do MP).

#### 4. Limiters nomeados e throttles inline

| Limiter | Definição | Usado em |
|---|---|---|
| `mp-webhook` ⊕ | `AppServiceProvider.php:124` — `Limit::perMinute(120)->by($request->ip())` | `web.php:57` |

Throttles **inline** (sem limiter nomeado) — 9 ocorrências, todas com números literais:

| Throttle | Rota | Path |
|---|---|---|
| `throttle:10,1` | `shop.checkout.store` | `routes/web.php:28` |
| `throttle:10,1` | `shop.order.lookup.resolve` | `routes/web.php:35` |
| `throttle:60,1` | `shop.order.status` | `routes/web.php:52` |
| `throttle:10,1` | `users.impersonate` | `routes/web.php:87` |
| `throttle:6,1` | `password.email` | `routes/auth.php:24` |
| `throttle:6,1` | `password.store` | `routes/auth.php:31` |
| `throttle:6,1` | `verification.verify` (+ `signed`) | `routes/auth.php:40` |
| `throttle:6,1` | `verification.send` | `routes/auth.php:44` |
| `throttle:30,1` | `api.shipping.quote` | `routes/api.php:10` |

⊖ O boilerplate nomeia todos os seus (`auth`, `impersonate`, `verification` em `AppServiceProvider::configRateLimiting()`), e não tem nenhum throttle literal em rota. O spinmax não tem limiter `auth`/`verification`/`impersonate`; `POST login` (`routes/auth.php:18`) **não tem throttle nenhum** na definição de rota.

#### 5. `routes/console.php` — agendador completo

Sem `withSchedule()` no `bootstrap/app.php`; tudo vive em `routes/console.php`. Nenhum uso de `onOneServer` nem `runInBackground` no repositório.

| # | Alvo | Frequência | Opções | Linha |
|---|---|---|---|---|
| 1 | `Schedule::job(new ExpirePendingOrdersJob())` | `everyFifteenMinutes()` | — | `console.php:15` |
| 2 | `Schedule::job(new RemindStalePaidOrdersJob())` | `dailyAt('08:00')` | **`->timezone('America/Sao_Paulo')`** (único com TZ explícito; `config/app.php` em UTC) | `console.php:22` |
| 3 | `Schedule::job(new QueueHeartbeatJob())` | `everyMinute()` | — (job faz `onQueue('default')`) | `console.php:25` |
| 4 | `Schedule::command('store:prune-webhook-events')` | `dailyAt('04:00')` | — | `console.php:29` |
| 5 | `Schedule::command('store:reconcile-orders')` | `everyTenMinutes()` | **`withoutOverlapping()`** | `console.php:41` |
| 6 | `Schedule::command('horizon:snapshot')` | `everyFiveMinutes()` | — | `console.php:46` |
| 7 | `Schedule::command('store:reprocess-webhooks')` | `everyFiveMinutes()` | **`withoutOverlapping()`** | `console.php:52` |

Comentário de ausência deliberada (`console.php:31-36`): o backup do banco no R2 **não** é agendado aqui — é cron de sistema (`scripts/backup-r2.sh`); a aplicação só tem a ponta de leitura (`store:backup-report` + reprovação no `store:health`).

Comandos alcançados pelo scheduler (paths em `app/Console/Commands/`): `PruneWebhookEventsCommand.php` (`store:prune-webhook-events {--days=}`), `ReconcileOrdersCommand.php` (`store:reconcile-orders`), `ReprocessWebhooksCommand.php` (`store:reprocess-webhooks {--status=*}`). Jobs: `app/Jobs/ExpirePendingOrdersJob.php`, `app/Jobs/RemindStalePaidOrdersJob.php`, `app/Jobs/QueueHeartbeatJob.php` — os três `implements ShouldQueue`, nenhum `ShouldBeUnique`/`WithoutOverlapping`/`tries`/`backoff` declarados.

⊖ Boilerplate agenda **apenas** `horizon:snapshot` (`everyFiveMinutes`).

Demais comandos não agendados (⊕, inventário completo de `app/Console/Commands/`): `store:backup-report`, `store:bootstrap`, `store:variant-price`, `store:anonymize-customer`, `store:super-user`, `store:health {--notify}`, `store:staging-check`, `rbac:sync`, `videos:generate-posters`.

#### 6. Middlewares em `app/Http/Middleware/` (6 arquivos)

| Middleware | Path | O que faz (1 linha) | Onde é registrado | vs. boilerplate |
|---|---|---|---|---|
| `PublicStore` | `app/Http/Middleware/PublicStore.php` | Troca a root view para `shop` e injeta `ziggy` **restrito ao grupo `shop`** + prop `shop` (marca, razão social, CNPJ, endereço, whatsapp, e-mail de contato, public key do MP, fotos, `boxContents`, links legais, limites de quantidade/parcelas/desconto Pix) | alias `public.store` em `bootstrap/app.php:52` | ⊕ |
| `EnsureStoreEnabled` | `app/Http/Middleware/EnsureStoreEnabled.php` | Kill switch: `StoreSettings::storeEnabled()` falso → `redirect()->route('shop.unavailable')` | alias `store.enabled` em `bootstrap/app.php:53` | ⊕ |
| `SecurityHeaders` | `app/Http/Middleware/SecurityHeaders.php` | Carimba 3 headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) só quando ausentes; expõe `static stamp(Response)` reusada pelo handler de exceptions | `$middleware->web(append:)` + `withExceptions` | ⊖ boilerplate tem também `Permissions-Policy` e, sob produção+HTTPS, HSTS e CSP |
| `EnsureUserIsActive` | `app/Http/Middleware/EnsureUserIsActive.php` | Usuário com `is_active === false` → `logout()` + `invalidate()` + `regenerateToken()` + redirect `login` | **inline no grupo do `web.php:61`** (classe FQCN, sem alias) | ⊖ boilerplate registra no `web(append:)` global — no spinmax `routes/settings.php` e `routes/auth.php` ficam **fora** dele |
| `HandleInertiaRequests` | `app/Http/Middleware/HandleInertiaRequests.php` | Root view `app`; compartilha `name`, `quote`, `auth` (user via `Arr::only(id,name,email,email_verified_at)`, `permissions`, `roles`, `impersonating{active,originalUserName,impersonatedUserName}`), `flash` (4 chaves com `session()->pull`), `ziggy` completo | `$middleware->web(append:)` | flash via `session()->pull` ⊖ (boilerplate migrou para o canal nativo do Inertia 3, commit `a0f68d9`) |
| `HandleAppearance` | `app/Http/Middleware/HandleAppearance.php` | `View::share('appearance', cookie('appearance') ?? 'system')` | `$middleware->web(append:)` | idêntico |

⊖ Boilerplate tem `SetSensitiveCacheHeaders.php` (Cache-Control `private, no-store, must-revalidate` para respostas HTML/JSON autenticadas) — **ausente no spinmax**.

Grupo `shop` do Ziggy — `config/ziggy.php` ⊕ (arquivo inexistente no boilerplate):

```
'groups' => ['shop' => ['home', 'shop.*', 'legal.*', 'api.shipping.*']]
```

#### 7. `bootstrap/app.php` completo — `bootstrap/app.php:16-61`

| Bloco | Conteúdo |
|---|---|
| `withEvents(discover: false)` ⊕ | Desliga a descoberta automática de `app/Listeners`; o mapa único é `AppServiceProvider::configEvents()`. Comentário registra o sintoma que motivou: listeners registrados 2× → comprador recebia QR Pix, confirmação e rastreio em dobro |
| `withRouting` | `web`, `api` ⊕, `commands`, `health: '/up'` |
| `encryptCookies(except:)` | `['appearance']` — igual ao boilerplate |
| `validateCsrfTokens(except:)` ⊕ | `['webhooks/*']` |
| `preventRequestsDuringMaintenance(except:)` ⊕ | `['webhooks/*']` — justificativa no arquivo: `artisan down` durante deploy devolveria 503 a um pagamento aprovado, prendendo o pedido em `PendingPayment` até o reconcile de 10 min |
| `web(append:)` | `SecurityHeaders`, `HandleAppearance`, `HandleInertiaRequests`, `AddLinkHeadersForPreloadedAssets` (4 itens; **`EnsureUserIsActive` não está aqui**) |
| `alias()` ⊕ | `public.store => PublicStore`, `store.enabled => EnsureStoreEnabled` |
| `withExceptions` | Só `$exceptions->respond(fn(Response $r) => SecurityHeaders::stamp($r))` |
| `trustProxies` | **ausente** ⊖ (boilerplate lê `TRUSTED_PROXIES`) |
| Páginas de erro Inertia | **ausente** ⊖ (boilerplate renderiza `errors/error-page` para 403/404/500/503 e trata 419 com `Inertia::flash` + `back()`) |

#### 8. Providers — `bootstrap/providers.php` registra 2

**`app/Providers/AppServiceProvider.php`** (233 linhas; sem `declare(strict_types=1)`)

`register()` — 2 bindings ⊕:

| Abstração | Concreta | Nota |
|---|---|---|
| `App\Services\Shipping\Contracts\ShippingDriver` | `App\Services\Shipping\TableRateDriver` | bind simples |
| `App\Services\Payment\Contracts\PaymentGateway` | closure com `match((string) config('store.payment.api'))`: `'orders' => MercadoPagoOrdersGateway`, default `MercadoPagoGateway` | feature flag resolvida a cada resolução, sem reboot |

`boot()` chama 11 métodos + `getComposer()`:

| Método | O que faz | ⊕/⊖ |
|---|---|---|
| `setupLogViewer()` | `LogViewer::auth(fn => $request->user()?->hasRole(Roles::SUPER_USER))` | = |
| `configModels()` | só `Model::shouldBeStrict()` | ⊖ boilerplate adiciona os 3 handlers de violação em produção (lazy loading, missing attribute, discarded attribute) via `report()` |
| `configCommands()` | `DB::prohibitDestructiveCommands(app()->isProduction())` (+ 4 linhas comentadas, `AppServiceProvider.php:139-141`) | = |
| `configUrls()` | `URL::forceHttps()` em produção | = |
| `configDate()` | `Date::use(CarbonImmutable::class)` | = |
| `configGates()` | **1 gate por case de `Permissions`**: `Gate::define($p->value, fn($user) => (bool) $user?->hasPermissionTo(...))` | = (docblock T-915 registra a remoção de um `Log::channel('daily')->info()` que rodava a cada `Gate::allows`) |
| `configPolicies()` | `User => UserPolicy`, **`Order => OrderPolicy`** ⊕, **`Customer => CustomerPolicy`** ⊕ | |
| `configResources()` | `JsonResource::withoutWrapping()` | = |
| `configEvents()` ⊕ | 10 `Event::listen` — ver tabela abaixo | |
| `configRateLimiters()` | só `mp-webhook` | ver §4 |
| `configCompanyFromSettings()` ⊕ | Hidrata `store.company.razao_social/cnpj/address` a partir de `StoreSettings::company()` no boot **e em `Queue::before()`** (re-hidrata antes de cada job, porque o worker do Horizon vive horas e congelaria o config); `try/catch (\Throwable) { return; }` para sobreviver a `migrate` em base nova sem a tabela `store_settings` | |
| `getComposer()` | `View::composer('*')` injetando `auth` (user com `load(['permissions','role'])`, role, permissions) — **segundo canal**, paralelo ao `HandleInertiaRequests::share()` | = (idêntico ao boilerplate, incluindo o model inteiro na view) |
| `configActivitylog()` | — | ⊖ existe só no boilerplate (`CauserResolver::resolveUsing`) |

Listeners registrados em `configEvents()` (`AppServiceProvider.php:195-216`):

| Evento | Listener |
|---|---|
| `App\Events\ImpersonateStarted` | `App\Listeners\LogImpersonateStarted` |
| `App\Events\ImpersonateStopped` | `App\Listeners\LogImpersonateStopped` |
| `App\Events\OrderPlaced` ⊕ | `App\Listeners\Store\SendOrderReceivedEmail` |
| `App\Events\OrderPaid` ⊕ | `App\Listeners\Store\SendOrderPaidEmails` |
| `App\Events\OrderShipped` ⊕ | `App\Listeners\Store\SendOrderShippedEmail` |
| `App\Events\OrderExpired` ⊕ | `App\Listeners\Store\SendOrderExpiredEmail` |
| `App\Events\OrderCanceled` ⊕ | `App\Listeners\Store\SendOrderCanceledEmail` |
| `App\Events\OrderPaymentAnomaly` ⊕ | `App\Listeners\Store\SendPaymentAnomalyAlert` |
| `Illuminate\Mail\Events\MessageSending` ⊕ | `App\Listeners\Store\EnforceMailAllowlist` — fora de produção redireciona e-mail fora da allowlist para a caixa de teste |
| `Illuminate\Queue\Events\JobFailed` ⊕ | `App\Listeners\Store\SendFailedJobAlert` — job em `failed_jobs` vira alerta imediato |

Nenhum observer é registrado em provider (não há `::observe(` em `app/Providers/`), e nenhuma macro é definida.

**`app/Providers/HorizonServiceProvider.php`** (estende `HorizonApplicationServiceProvider`)

| Método | Conteúdo |
|---|---|
| `boot()` | `parent::boot()` + `Horizon::routeMailNotificationsTo($notify)` com `$notify = config('store.alert_email') ?: config('store.notify_email')`, só quando string não vazia ⊕ |
| `gate()` | `Gate::define('viewHorizon', fn(?User $user = null) => $user?->hasRole(Roles::SUPER_USER) ?? false)` — mesmo critério do Log Viewer; docblock explica que o gate publicado pelo `horizon:install` compara e-mail contra lista vazia |

---

### Jobs, filas, eventos, listeners, observers e commands

**Escopo medido** (spinmax @ `e4ec01e`): 4 jobs, 10 events, 8 listeners, 12 commands, 0 observers, 7 entradas no scheduler, 3 filas nomeadas, 1 supervisor Horizon.

---

#### 1. `app/Jobs/` — 4 jobs

| Path | Fila | `$tries` | `backoff` | `$timeout` | `retryUntil` | `ShouldBeUnique`/`uniqueId` | `middleware()` | `tags()` |
|---|---|---|---|---|---|---|---|---|
| `app/Jobs/ProcessMercadoPagoWebhookJob.php` | `payments` (via `onQueue()` no construtor) | **5** (propriedade — sobrepõe o `tries: 3` do supervisor) | método `backoff(): array` → `[10, 30, 60, 120, 300]` | — | — | — | — | — |
| `app/Jobs/ExpirePendingOrdersJob.php` | default (nenhum `onQueue`) | — | — | — | — | — | — | — |
| `app/Jobs/QueueHeartbeatJob.php` | `default` (explícito no construtor) | — | — | — | — | — | — | — |
| `app/Jobs/RemindStalePaidOrdersJob.php` | default (nenhum `onQueue`) | — | — | — | — | — | — | — |

Grep confirmando ausência: `ShouldBeUnique`, `uniqueId`, `WithoutOverlapping`, `RateLimited`, `retryUntil`, `middleware()`, `tags()`, `$timeout`, `$maxExceptions` — **zero ocorrências em `app/Jobs/`**. Todos usam o trait `Queueable` do Laravel 12 (`Illuminate\Foundation\Queue\Queueable`), todos `final class ... implements ShouldQueue`.

**Detalhes por job:**

- **`ProcessMercadoPagoWebhookJob`** (225 linhas; ~110 são docblocks). Assinatura: `__construct(public readonly int $webhookEventId)` — carrega **id**, não model serializado. `handle(PaymentGateway $gateway)` resolve o gateway por injeção. Fluxo: `WebhookEvent::find` → *early return* se `status === 'processed'` → `process()` dentro de `try/catch` que chama `recordFailure()` e **relança**. `recordFailure()` grava `status='failed'` + `error` (limitado a 1000 chars, passado por `App\Support\PiiScrubber::scrubString`). `failureSummary()` extrai `HTTP <status>` + `body['error']` + códigos de `cause[]`/`errors[]` do `MPApiException` (a mensagem do SDK é sempre a mesma string genérica). Aprovação sob `Cache::lock("order:{uuid}", 60)->block(15)` + `refresh()` + `match` sobre o status atual; anomalias (`amount_mismatch`, `paid_after_expired`, `second_approval`, `paid_on_<status>`) viram `OrderPaymentAnomaly::dispatch` e **não** transicionam.
- **`ExpirePendingOrdersJob`**. Query: `status=PendingPayment` + `created_at < now()-config('store.order.expires_after_minutes', 120)` + `whereDoesntHave('payments', status=approved)`. Cada expiração roda sob **o mesmo lock do webhook** (`Cache::lock("order:{uuid}", 30)->block(5)`) e revalida antes de `transitionStatusTo(Expired)`.
- **`QueueHeartbeatJob`**. Const pública `CACHE_KEY = 'store:queue:heartbeat'`, `Cache::forever(CACHE_KEY, now()->getTimestamp())`. `forever` deliberado (TTL tornaria "nunca rodou" indistinguível de "parou"). A const é lida por `HealthCommand` e `StagingCheckCommand` — contrato de escrita/leitura entre job e comandos.
- **`RemindStalePaidOrdersJob`**. `handle(StoreSettings $settings)`; aborta com `blank($notify)`; usa scope `Order::awaitingShipment()` + filtro `Order::isStalePaid($order->paid_at)` (régua compartilhada com o card do `DashboardController`); envia `StalePaidOrdersReminderMail`.

⊕ **Boilerplate não tem `app/Jobs/` (diretório inexistente).**

---

#### 2. `app/Events/` — 10 events

| Path | Payload do construtor | Traits | Disparado em | Listener |
|---|---|---|---|---|
| `app/Events/OrderPlaced.php` | `Order $order` | `Dispatchable`, `SerializesModels` | `app/Services/Store/CheckoutService.php:142`; `app/Http/Controllers/Order/ResendEmailController.php:35` | `SendOrderReceivedEmail` |
| `app/Events/OrderPaid.php` | `Order $order` | idem | `Order::dispatchTransitionEvent()` (`app/Models/Order.php:262`); `ResendEmailController.php:36` | `SendOrderPaidEmails` |
| `app/Events/OrderShipped.php` | `Order $order` | idem | `Order.php:263`; `ResendEmailController.php:37`; `UpdateTrackingController.php:93` | `SendOrderShippedEmail` |
| `app/Events/OrderExpired.php` | `Order $order` | idem | `Order.php:266`; `ResendEmailController.php:39` | `SendOrderExpiredEmail` |
| `app/Events/OrderCanceled.php` | `Order $order` | idem | `Order.php:265`; `ResendEmailController.php:38` | `SendOrderCanceledEmail` |
| `app/Events/OrderDelivered.php` | `Order $order` | idem | `Order.php:264` | **nenhum, deliberado** (docblock de 20 linhas explica: spec 05 não prevê e-mail de entrega; fica fora do dataset do `EventWiringTest`) |
| `app/Events/OrderPaymentAnomaly.php` | `Order $order, string $reason` | idem | `ProcessMercadoPagoWebhookJob` (4 sítios: linhas 161, 171, 203, 205, 222) | `SendPaymentAnomalyAlert` |
| `app/Events/ImpersonateStarted.php` | `User $impersonator, User $targetUser` | idem | `app/Services/ImpersonationService.php:26` | `LogImpersonateStarted` |
| `app/Events/ImpersonateStopped.php` | `User $originalUser, User $impersonatedUser` | idem | `ImpersonationService.php:45` | `LogImpersonateStopped` |
| `app/Events/RoleUserUpdatedEvent.php` | `User $user` (não-readonly, não-`final`, **sem `declare(strict_types)`**) | `Dispatchable`, `InteractsWithSockets`, `SerializesModels` | `AssignRoleController.php:134`, `RevokeRoleController.php:89` — via `Broadcast::event(...)` | nenhum listener |

**Broadcast**: só o `RoleUserUpdatedEvent`. Não implementa `ShouldBroadcast`; expõe `broadcastOn(): Channel` → `new Channel('users.roles')` (canal público) e `broadcastWith(): array` → `['id' => …, 'role' => $this->user->roles->first()->name]`.

⊕ 7 eventos de domínio da loja (`Order*`). ⊖ Os 3 restantes (`ImpersonateStarted/Stopped`, `RoleUserUpdatedEvent`) existem idênticos no boilerplate (`app/Events/`).

**Wiring:** `bootstrap/app.php` desliga a descoberta (`->withEvents(discover: false)`, com comentário de 4 linhas registrando o incidente de e-mail duplicado). O mapa único é `AppServiceProvider::configEvents()` (`app/Providers/AppServiceProvider.php`, 10 `Event::listen`). ⊕ **O boilerplate não tem `withEvents(discover: false)` nem nenhum `Event::listen` em provider — depende da auto-descoberta.**

Trava de teste: `tests/Unit/EventWiringTest.php` (2 testes) — (a) dataset de 10 eventos com "exatamente 1 listener do namespace `App\`" via `Event::getRawListeners()`; (b) "nenhum arquivo em `app/Listeners` órfão de registro" varrendo `File::allFiles(app_path('Listeners'))`.

---

#### 3. `app/Listeners/` — 8 listeners

| Path | Escuta | O que faz |
|---|---|---|
| `app/Listeners/Store/SendOrderReceivedEmail.php` | `OrderPlaced` | `OrderReceivedMail`; guarda LGPD: `return` se `$order->customer?->isAnonymized()` |
| `app/Listeners/Store/SendOrderPaidEmails.php` | `OrderPaid` | **dois** mailables: `OrderPaidMail` ao cliente (suprimido se anonimizado) + `AdminNewPaidOrderMail` ao `notifyEmail()` (guardado por `blank()`) |
| `app/Listeners/Store/SendOrderShippedEmail.php` | `OrderShipped` | `OrderShippedMail` + guarda LGPD |
| `app/Listeners/Store/SendOrderExpiredEmail.php` | `OrderExpired` | `OrderExpiredMail` + guarda LGPD + **segunda guarda**: `return` se `$order->payments()->doesntExist()` (não avisar de expiração de pedido que nunca teve cobrança) |
| `app/Listeners/Store/SendOrderCanceledEmail.php` | `OrderCanceled` | `OrderCanceledMail` + guarda LGPD |
| `app/Listeners/Store/SendPaymentAnomalyAlert.php` | `OrderPaymentAnomaly` | `AdminAlertMail` para `StoreSettings::alertEmail()` (canal **técnico**, separado do `notifyEmail`) |
| `app/Listeners/Store/SendFailedJobAlert.php` | `Illuminate\Queue\Events\JobFailed` | `FailedJobAlertMail` com `resolveName()`, `connectionName`, `getQueue()`, `attempts()`, `uuid()` e `reason` passado por `PiiScrubber`; envolto em `try/catch` com `report($e)` — best-effort para não derrubar o worker |
| `app/Listeners/Store/EnforceMailAllowlist.php` | `Illuminate\Mail\Events\MessageSending` | 119 linhas. Fora de produção, filtra `to/cc/bcc` contra `config('store.mail.allowlist')`; bloqueados vão para `store.mail.test_inbox` (só no `to`); retorna `false` (cancela envio) quando nada sobra, `null` para seguir |
| `app/Listeners/LogImpersonateStarted.php` | `ImpersonateStarted` | grava `OwenIt\Auditing\Models\Audit` com `event='impersonate_started'`, `tags='impersonation,start'`, url/ip/user-agent |
| `app/Listeners/LogImpersonateStopped.php` | `ImpersonateStopped` | idem, `event='impersonate_stopped'`, `tags='impersonation,stop'` |

Nenhum listener implementa `ShouldQueue` — a assincronia vem dos **mailables**: `app/Mail/OrderMail.php` (abstrata, pai de `OrderReceivedMail`/`OrderPaidMail`/`OrderShippedMail`/`OrderExpiredMail`/`OrderCanceledMail`/`AdminNewPaidOrderMail`), `app/Mail/AdminAlertMail.php` e `app/Mail/StalePaidOrdersReminderMail.php` implementam **`ShouldQueueAfterCommit`** com `$this->onQueue('mail')` no construtor. `app/Mail/FailedJobAlertMail.php` e `app/Mail/HealthAlertMail.php` **não** são `ShouldQueue`, com docblock explicando por quê (o alerta de fila não pode depender da fila).

⊖ `EnforceMailAllowlist`, `LogImpersonateStarted`, `LogImpersonateStopped` existem no boilerplate em `app/Listeners/` (sem subpasta `Store/`). ⊕ Os 6 listeners de `app/Listeners/Store/` são exclusivos do spinmax.

---

#### 4. Observers

**Nenhum.** `app/Observers/` não existe; grep por `ObservedBy` e `::observe(` em `app/` e `database/` → **0 ocorrências**. O papel é feito por `protected static function booted()` em 3 models: `app/Models/Order.php:85`, `app/Models/CityShippingRate.php:56`, `app/Models/StoreSetting.php:48`. ⊖ O boilerplate também não tem `app/Observers/`.

---

#### 5. `app/Console/Commands/` — 12 commands

| Path | Assinatura | O que faz | Agendado |
|---|---|---|---|
| `HealthCommand.php` (304 l.) | `store:health {--notify}` | 3 checks sempre executados (array literal, sem curto-circuito): heartbeat da fila, `ShippingRate` ativa+`is_placeholder` em produção, idade do backup no R2. `--notify` manda `HealthAlertMail` para `alertEmail()`, com anti-flood de 6h em `Cache` (`store:health:last-alert`), alerta de transição imediato e e-mail de "normalização" ao recuperar | não (cron de sistema) |
| `StagingCheckCommand.php` (438 l.) | `store:staging-check` | 7 blocos isolados por `guarded()` (Ambiente, Isolamento, Fila, Loja, E-mail, Acesso, Backup); expectativas se invertem em produção; `deployedOnly=false` em `local` rebaixa reprovação a aviso. O bloco **Fila** assere `horizon.defaults.store.timeout < queue.connections.redis.retry_after`, `queue[0] === 'payments'`, consulta `MasterSupervisorRepository::names()` e correlaciona com a idade do heartbeat | não |
| `BootstrapStoreCommand.php` (224 l.) | `store:bootstrap {--force} {--with-shipping}` | Popula catálogo (produto + variantes **inativas, `price_cents = 0`**), força `store.enabled=false` na criação, cria `OrderSequence` `firstOrCreate`; reexecução não toca campos editáveis pelo painel. Tudo em `DB::transaction` | não |
| `SetVariantPriceCommand.php` (249 l.) | `store:variant-price {sku} {preco} {--activate} {--force}` | Preço + ativação de variante pela CLI (o caminho que faltava para o 1º cadastro em produção). Docblock declara explicitamente "não deve entrar em script nenhum" | não |
| `CreateSuperUserCommand.php` (118 l.) | `store:super-user {--force}` | `updateOrCreate` por e-mail a partir de `store.super_user.*`; valida senha ≥ 12 chars, e-mail via `FILTER_VALIDATE_EMAIL`, existência prévia do papel; senha em texto puro (cast `hashed`); `email_verified_at` fora do array (não-`fillable`) | não |
| `RbacSyncCommand.php` (172 l.) | `rbac:sync {--dry-run} {--force}` | Remaneja usuários de cargo morto → `Roles::VIEWER`, apaga `permission_role` órfão nas duas pontas, apaga roles/permissions fora do enum, tudo em `DB::transaction`; depois chama `db:seed --class=PermissionRoleSeeder --force` e faz `Cache::forget(User::permissionCacheKey($id))` dos remanejados | não |
| `AnonymizeCustomerCommand.php` (54 l.) | `store:anonymize-customer {id} {--force}` | LGPD: `$customer->anonymize()` preservando pedidos; idempotente | não |
| `BackupReportCommand.php` (75 l.) | `store:backup-report {--object=} {--bytes=0} {--seconds=0} {--failed} {--reason=} {--drill} {--dry-run}` | Ponta *de dentro* do backup: `scripts/backup-r2.sh` chama no fim; escreve em `App\Services\Store\BackupStatus`; `--failed` sai com SUCCESS de propósito | não (chamado por cron de sistema) |
| `PruneWebhookEventsCommand.php` (41 l.) | `store:prune-webhook-events {--days=}` | `delete()` por `created_at < now()->subDays(config('store.webhooks.retention_days', 90))`; recusa janela < 1 dia | **`->dailyAt('04:00')`** |
| `ReconcileOrdersCommand.php` (98 l.) | `store:reconcile-orders` | Rede para webhook **perdido**: pedidos `PendingPayment` + `gateway_payment_id` não-nulo + mais velhos que `store.payment.reconcile_after_minutes` (10) → cria `WebhookEvent` **sintético** com `external_id = "reconcile-{uuid}-{YmdHi}"` (`firstOrCreate`) e despacha o **mesmo** `ProcessMercadoPagoWebhookJob`. Idempotência em 2 camadas (chave por minuto + idempotência do job) | **`->everyTenMinutes()->withoutOverlapping()`** |
| `ReprocessWebhooksCommand.php` (37 l.) | `store:reprocess-webhooks {--status=*}` | Reenfileira `WebhookEvent` do provider `mercadopago` cujo status esteja em `['received','failed']` (default) | **`->everyFiveMinutes()->withoutOverlapping()`** |
| `VideosGeneratePosters.php` (129 l.) | `videos:generate-posters {--force} {--width=640}` | FFmpeg via `Process::run()` extrai frame (`-sseof -0.1`, fallback `-ss 1`) → WebP em `public/assets/videos/posters`. **Único comando em inglês e sem prefixo de domínio** | não |

⊕ 10 dos 12 são exclusivos. ⊖ O boilerplate tem 2 comandos correspondentes com **nomes divergentes**: `users:super-user` (`app/Console/Commands/CreateSuperUserCommand.php`, mesma classe, `--name/--email/--password` como opções, fallback `VISITOR`) vs. `store:super-user` do spinmax; e `permissions:sync` (`SyncPermissionsCommand.php`) vs. `rbac:sync` (`RbacSyncCommand.php`) — mesma forma (`--dry-run`/`--force`, `ConfirmableTrait`, remanejo de órfãos), fallback diferente (`Roles::VISITOR` no boilerplate, `Roles::VIEWER` no spinmax).

---

#### 6. Scheduler — `routes/console.php` (52 linhas, 7 entradas)

| Entrada | Cadência | Observações |
|---|---|---|
| `Schedule::job(new ExpirePendingOrdersJob())` | `everyFifteenMinutes()` | — |
| `Schedule::job(new RemindStalePaidOrdersJob())` | `dailyAt('08:00')->timezone('America/Sao_Paulo')` | **único com timezone explícito**; comentário registra que os demais ficam em UTC de propósito |
| `Schedule::job(new QueueHeartbeatJob())` | `everyMinute()` | — |
| `Schedule::command('store:prune-webhook-events')` | `dailyAt('04:00')` | posicionado depois da janela do dump das 3h |
| `Schedule::command('store:reconcile-orders')` | `everyTenMinutes()->withoutOverlapping()` | — |
| `Schedule::command('horizon:snapshot')` | `everyFiveMinutes()` | — |
| `Schedule::command('store:reprocess-webhooks')` | `everyFiveMinutes()->withoutOverlapping()` | — |

Além disso, um `Artisan::command('inspire', …)` (stock). Bloco de 7 linhas de comentário documenta a **ausência deliberada** do backup no scheduler (é cron de sistema, `scripts/backup-r2.sh`).

⊖ `routes/console.php` do boilerplate tem exatamente 2 entradas: `Schedule::command('horizon:snapshot')->everyFiveMinutes()` e o `inspire`.

---

#### 7. `config/queue.php`

Estrutura **idêntica ao stock do Laravel 12 e ao boilerplate** — mesmas 5 conexões (`sync`, `database`, `beanstalkd`, `sqs`, `redis`), `'default' => env('QUEUE_CONNECTION', 'database')`, `redis.retry_after = (int) env('REDIS_QUEUE_RETRY_AFTER', 90)`, `batching` em `job_batches`, `failed.driver = env('QUEUE_FAILED_DRIVER', 'database-uuids')` na tabela `failed_jobs`. Nenhuma fila nomeada é declarada aqui — as filas (`payments`, `mail`, `default`) existem só no `config/horizon.php` e nos `onQueue()` dos jobs/mailables.

#### 8. `config/horizon.php`

| Chave | spinmax | boilerplate |
|---|---|---|
| Nome do supervisor | `store` | `supervisor-1` |
| `queue` | `['payments', 'mail', 'default']` (ordem = prioridade, `balance: auto`) ⊕ | `['default']` |
| `balance` / `autoScalingStrategy` | `auto` / `time` | `auto` / `time` |
| `defaults.maxProcesses` | 1 | 1 |
| `defaults.tries` | **3** | **1** |
| `defaults.backoff` | **10** ⊕ | ausente |
| `defaults.timeout` | 60 | 60 |
| `defaults.memory` | 128 | 128 |
| `environments` | `production` (maxProcesses **6**), **`staging` (2)** ⊕, `local` (3) — **sem bloco `'*'`** | `production` (**10**), `local` (3), `'*'` (3) |
| `waits` | 3 entradas: `redis:payments => 30`, `redis:mail => 120`, `redis:default => 60` ⊕ | 1 entrada: `redis:default => 60` |
| `trim` | `recent/pending/completed 60`, `recent_failed/failed/monitored 10080` | igual (stock) |
| `prefix` | `env('HORIZON_PREFIX', Str::slug(APP_NAME.'-'.APP_ENV,'_').'_horizon:')`, com comentário sobre `configureStandaloneConnection` sobrescrever o `REDIS_PREFIX` | mesma forma (linha 70) |
| `silenced` / `silenced_tags` | vazios | vazios |
| `memory_limit` / `fast_termination` | 64 / `false` | 64 / `false` |

Docblock do supervisor `store` fixa duas invariantes verificadas por comando (`store:staging-check`): `timeout (60) < retry_after (90)` e `queue[0] === 'payments'`.

**`app/Providers/HorizonServiceProvider.php`** ⊕: além do gate `viewHorizon` (`hasRole(Roles::SUPER_USER)` — igual ao boilerplate, com assinatura `?User $user = null` em vez de `?User $user`), o `boot()` chama `Horizon::routeMailNotificationsTo($notify)` com `config('store.alert_email') ?: config('store.notify_email')` — ou seja, `LongWaitDetected` vai para o canal técnico. O boilerplate só chama `parent::boot()`.

---

#### 9. Webhook inbox — ciclo completo

**Tabela** `database/migrations/2026_07_22_120011_create_webhook_events_table.php`: `id`, `provider`, `external_id`, `type`, `payload` (json nullable), `status` (default `'received'`), `processed_at` (ts nullable), `error` (text nullable), `timestamps`, **`unique(['provider','external_id'])`**.

**Model** `app/Models/WebhookEvent.php`: `$fillable` com os 7 campos; `casts()` → `payload: array`, `processed_at: datetime`. Sem enum de status — os valores são strings literais espalhadas (`received`, `processed`, `ignored`, `failed`).

**Ciclo:**

1. **Recepção** — `routes/web.php:56` `POST webhooks/mercadopago` → `app/Http/Controllers/Webhook/MercadoPagoController.php` (`__invoke`, 176 linhas). Sem auth, `->middleware('throttle:mp-webhook')` (rate limiter definido em `AppServiceProvider::configRateLimiters()`: `Limit::perMinute(120)->by($request->ip())`). Isento de CSRF **e** de `preventRequestsDuringMaintenance` (`bootstrap/app.php`, com justificativa de 8 linhas sobre a janela do `artisan down`).
2. **Assinatura** — `WebhookSignatureValidator::validate($x-signature, $x-request-id, strtolower($dataId), config('services.mercadopago.webhook_secret'), config('store.payment.webhook_tolerance_seconds', 300))`. Dois desvios documentados: `strtolower` do lado da aplicação (ids `ORD01…` da Orders API) e um re-check próprio de janela (`timestampWithinTolerance()`) que aceita `ts` em segundos **ou** milissegundos quando o motivo é exatamente `TIMESTAMP_OUT_OF_TOLERANCE` (o hash já foi validado antes pelo SDK). Falha → `Log::warning('mp.webhook.invalid_signature', ['request_id','reason','ts'])` + `401 {"error":"invalid signature"}`. `signatureFailureReason()` rotula `secret_missing` quando o secret está vazio.
3. **Deduplicação** — `WebhookEvent::firstOrCreate(['provider'=>'mercadopago','external_id'=>$notificationId], [...])` onde `$notificationId = input('id') ?? header('x-request-id') ?? $dataId`. Se `!$event->wasRecentlyCreated` → **`200 {"status":"duplicate"}`** sem enfileirar nada.
4. **Despacho** — só para `type ∈ ['payment','order']` (const `PROCESSABLE_TOPICS`) **e** `dataId !== ''`; caso contrário `status='ignored'`. Sempre responde `200 {"status":"ok"}`.
5. **Processamento** — `ProcessMercadoPagoWebhookJob` (fila `payments`, 5 tentativas). Desfechos gravados: `ignored` + `error='missing data.id'` / `'unknown external_reference'`; `processed` + `processed_at` (com `error='amount mismatch'` quando aplicável); `failed` + `error` (resumo com HTTP/códigos, passado por `PiiScrubber`, `Str::limit(…, 1000)`) — e **relança** para a fila continuar tentando.
6. **Reprocesso** — dois caminhos agendados: `store:reprocess-webhooks` (5 min, reenfileira `received`+`failed`) e `store:reconcile-orders` (10 min, cria evento **sintético** `reconcile-{uuid}-{YmdHi}` para pedidos cuja notificação nunca chegou). Um evento sintético que falhe cai no primeiro caminho.
7. **Prune** — `store:prune-webhook-events` às 04:00, por **idade** (`created_at`), não por status; janela em `config('store.webhooks.retention_days')` = 90.
8. **Leitura no painel** — `app/Http/Controllers/DashboardController.php:142` expõe `failedWebhooks` = `WebhookEvent::where('status','failed')->where('created_at','>=', now()->subDay())->count()` no bloco `health`.

⊕ **O boilerplate não tem webhook inbox** — sem `WebhookEvent`, sem migration equivalente, sem `app/Http/Controllers/Webhook/`.

---

#### 10. Cobertura de teste desta frente (27 arquivos tocam job/fila/evento/comando)

`tests/Unit/EventWiringTest.php` (2 testes) · `tests/Feature/Store/WebhookFailureTrailTest.php` (8) · `QueueHealthTest.php` (15, inclui "agenda o heartbeat a cada minuto" e os testes do `SendFailedJobAlert`) · `ReconcileOrdersCommandTest.php` (7, inclui "está agendado a cada dez minutos sem sobreposição") · `ReprocessWebhooksCommandTest.php` · `PruneWebhookEventsCommandTest.php` · `MercadoPagoWebhookTest.php` · `MercadoPagoOrderWebhookTest.php` · `OrderExpirationTest.php` · `StalePaidOrdersReminderTest.php` · `BackupHealthTest.php` · `HealthAlertTest.php` · `StagingCheckCommandTest.php` · `RbacSyncCommandTest.php` · `CreateSuperUserCommandTest.php` · `AnonymizeCustomerCommandTest.php` · `BootstrapStoreCommandTest.php` · `SetVariantPriceCommandTest.php` · `CompanyConfigFreshnessTest.php` (cobre o `Queue::before` do `AppServiceProvider`).

#### 11. Ponto adjacente: `Queue::before` no `AppServiceProvider`

`app/Providers/AppServiceProvider.php::configCompanyFromSettings()` ⊕ registra `Queue::before(fn() => $this->hydrateCompanyConfig())` — re-hidrata `store.company.*` a partir de `StoreSettings` **antes de cada job**, porque o worker do Horizon vive horas e congelaria o config do boot (o Blade dos e-mails renderiza dentro do job). `hydrateCompanyConfig()` é envolto em `try/catch (\Throwable)` para o caso de `store_settings` ainda não existir durante `migrate`.

**Limitações do levantamento** (guardrail read-only): não executei `php artisan schedule:list`, `queue:failed`, `horizon:status` nem a suíte de testes — as cadências, os nomes de fila e os desfechos acima vêm da leitura do código, não de execução. A working tree do spinmax está suja (3 arquivos, não inspecionados quanto a conteúdo não-commitado nesta frente).

---

### Modelos, migrations e schema

Projeto: `/Users/cristianomorgante/workspace/laravel/clients/spinmax/app` @ `e4ec01e`. Working tree só com untracked (`docs/`, `out/`, `specs/loja-fase2/`) — `app/` e `database/` batem com o pin.

**Números medidos:** 15 models · 24 migrations · 25 tabelas · 5 enums · 0 casts customizados · 0 ValueObjects · 12 factories · 5 seeders (4 + 1 trait) · 6 models auditados · 0 usos de `SoftDeletes` · 11 colunas de dinheiro, todas `unsignedInteger` de centavos · 0 CHECK constraints.

---

#### 1. `app/Models/` — 15 models

| Path | Tabela | `$fillable` / `$hidden` | `casts()` | Relações | Scopes | Traits / contratos | Hooks, consts, accessors |
|---|---|---|---|---|---|---|---|
| `app/Models/User.php` | `users` | fill: `is_active, role_id, name, email, cpf_cnpj, phone, mobile, user_notes, password`; hidden: `password, remember_token` | `email_verified_at:datetime`, `password:hashed`, `is_active:boolean` | via trait: `role()` BelongsTo, `permissions()` BelongsToMany (`withPivot('meta',…)`) | — | `HasFactory`, `Notifiable`, `OwenIt\Auditing\Auditable`, `HasRolesAndPermissions`; implementa `MustVerifyEmail`, `Auditable` | `permissionCacheKey($id)` estática (`user:{id}:permissions`) no trait |
| `app/Models/Role.php` | `roles` | fill: `name, label, priority` | — | `permissions()` BelongsToMany, `users()` HasMany | — | — | `getPriority()` (banco → fallback `Roles` enum), `isSuperUser()` |
| `app/Models/Permission.php` | `permissions` | fill: `name, label` | — | `roles()` BelongsToMany | — | — | `getIdsFromNames(array)` estática |
| `app/Models/Product.php` | `products` | fill: `name, slug, description, package_weight_grams, package_length_cm, package_width_cm, package_height_cm, active` | 4× `integer`, `active:boolean` | `variants()` HasMany, `activeVariants()` HasMany filtrada (`active=true` + `orderBy(sort)`) | — | `HasFactory` | — |
| `app/Models/ProductVariant.php` | `product_variants` | fill: `product_id, name, sku, price_cents, stock, sort, active, coming_soon` | `price_cents/stock/sort:integer`, `active/coming_soon:boolean` | `product()` BelongsTo | `scopeActive`, `scopeOnStorefront` (`active OR coming_soon`) | `HasFactory`, `Auditable` | `isComingSoon()` = `coming_soon && !active` |
| `app/Models/Customer.php` | `customers` | fill: `name, cpf, cpf_hash, email, phone, marketing_opt_in, marketing_opt_in_at`; **hidden: `cpf, cpf_hash`** | `cpf:encrypted`, `marketing_opt_in:boolean`, `marketing_opt_in_at:datetime` | `orders()` HasMany | — | `HasFactory` | const `ANONYMIZED_NAME`; `setCpf()`, `maskedCpf()`, `findByCpf()`, `upsertByCpf()`, `anonymize()` (LGPD — zera contato, **preserva `cpf`/`cpf_hash`**), `isAnonymized()` |
| `app/Models/Order.php` (270 linhas) | `orders` | fill: 22 chaves; **`separation_started_at` e `separation_by_id` deliberadamente FORA** | `status:OrderStatus`, `payment_method:PaymentMethod`, `shipping_address:array`, 6× `integer`, 7× `datetime` (`paid_at, shipped_at, delivered_at, canceled_at, expired_at, separation_started_at, purchase_tracked_at`) | `customer()`, `separationBy()` (BelongsTo User via `separation_by_id`), `items()`, `statusHistories()`, `payments()` HasMany | `#[Scope] awaitingShipment`, `#[Scope] inSeparation`, `#[Scope] awaitingSeparation` (atributo do Laravel 12, métodos `protected`) | `HasFactory`, `Auditable` | `booted():creating` → gera `uuid`, `number` (via `OrderNumberGenerator`), `status` default. `transitionStatusTo(OrderStatus, ?User, ?string)`: valida máquina de estados → `DB::transaction` (status + timestamp derivado + histórico) → dispara evento. `applyTimestampFor()`, `dispatchTransitionEvent()`, `isStalePaid()` estática (`addWeekdays(2)`), `isInSeparation()` |
| `app/Models/OrderItem.php` | `order_items` | fill: `order_id, product_variant_id, description, sku, quantity, unit_price_cents, total_cents` | 3× `integer` | `order()`, `productVariant()` BelongsTo | — | `HasFactory` | — |
| `app/Models/OrderStatusHistory.php` | `order_status_histories` | fill: `order_id, from_status, to_status, user_id, note` | `from_status/to_status:OrderStatus`, `created_at:datetime` | `order()`, `user()` BelongsTo | — | `HasFactory` | `const UPDATED_AT = null` (tabela só tem `created_at`) |
| `app/Models/Payment.php` | `payments` | fill: `order_id, gateway_payment_id, method, status, amount_cents, installments, payload` | `amount_cents/installments:integer`, `payload:array` | `order()` BelongsTo | — | `HasFactory` | `status` é **string sem enum** de propósito (termo novo do gateway cabe na coluna) |
| `app/Models/ShippingRate.php` | `shipping_rates` | fill: `region, price_cents, deadline_days, is_placeholder, active` | `region:ShippingRegion`, 2× `integer`, 2× `boolean` | — | `scopeActive` | `HasFactory`, `Auditable` | — |
| `app/Models/CityShippingRate.php` | `city_shipping_rates` | fill: `city, city_key, uf, price_cents, deadline_days, active` | 2× `integer`, `active:boolean` | — | `scopeActive` | `HasFactory`, `Auditable` | `booted():saving` → `trim(city)`, deriva `city_key = normalizeCity(city)`, `uf = strtoupper()`. `normalizeCity()` (`Str::ascii` + lower + `preg_replace('/[^a-z0-9]+/','')`), `activeFor(city, uf)` |
| `app/Models/StoreSetting.php` | `store_settings` | fill: `key, value` | `value:array` | — | — | `HasFactory`, `Auditable` | `const CACHE_KEY = 'store:settings'`; `booted():saved`/`deleted` → `Cache::forget(self::CACHE_KEY)` |
| `app/Models/OrderSequence.php` | `order_sequences` | fill: `name, current`; `public $timestamps = false` | `current:integer` | — | — | — (sem `HasFactory`) | Escrita só via `OrderNumberGenerator` (`lockForUpdate` + `increment`) |
| `app/Models/WebhookEvent.php` | `webhook_events` | fill: `provider, external_id, type, payload, status, processed_at, error` | `payload:array`, `processed_at:datetime` | — | — | `HasFactory` | — |

Observações transversais: **nenhum** model usa `$guarded`, `$appends`, `Attribute::make`, `$table`, `$primaryKey` custom ou `SoftDeletes`. "Accessors" são métodos comuns (`maskedCpf`, `isComingSoon`, `isInSeparation`). Coexistem dois estilos de scope: `#[Scope]` (só `Order`) e `scopeX()` (`ProductVariant`, `ShippingRate`, `CityShippingRate`).

⊕ 12 dos 15 models não existem no boilerplate (só `User`, `Role`, `Permission` são comuns; `User.php` difere apenas por `Auditable` no lugar de `LogsActivity`).
⊖ Boilerplate tem `app/Models/PermissionUser.php` (Pivot tipado para o `meta` de `permission_user`); no spinmax o `meta` é lido cru com `json_decode($permission->pivot->meta)` dentro de `app/Traits/Models/HasRolesAndPermissions.php`.

---

#### 2. `database/migrations/` — 24 arquivos, 25 tabelas

**Herdadas do boilerplate, idênticas byte a byte** (conferido lado a lado): `0001_01_01_000000_create_users_table.php`, `0001_01_01_000001_create_cache_table.php`, `0001_01_01_000002_create_jobs_table.php`, `0001_01_01_000003_create_permissions_roles_tables.php`, `0001_01_01_000004_add_role_id_to_users_table.php`.

**Auditoria** — ⊕ `database/migrations/2025_03_05_232153_create_audits_table.php` (owen-it/laravel-auditing; lê `config('audit.drivers.database.*')` e `config('audit.user.morph_prefix')` para nomear conexão/tabela/colunas em runtime). ⊖ o boilerplate tem `2026_03_27_004320_create_activity_log_table.php` (spatie) — as duas soluções são mutuamente exclusivas e **não** coexistem.

**Domínio loja** (⊕ integralmente ausentes do boilerplate): `2026_07_22_120001…120011` (products, product_variants, customers, shipping_rates, store_settings, order_sequences, orders, order_items, order_status_histories, payments, webhook_events) + `2026_08_06_120000_create_city_shipping_rates_table.php`.

**Alters:** `2026_07_28_120000_add_email_to_orders_table.php` (snapshot de e-mail no pedido — docblock descreve a falha de segurança que fechou: `customer->email` sobrescrito por CPF, last-write-wins, redirecionando link assinado); `2026_08_01_120000_add_coming_soon_to_product_variants_table.php`; `2026_08_07_120000_add_separation_to_orders_table.php` (2 colunas + índice composto); `2026_08_10_120000_add_purchase_tracked_at_to_orders_table.php` (coluna + backfill).

**Migrations de DADO (3, todas com racional longo no docblock):**
- `2026_08_03_120000_drop_unit_counter_from_launch_badge.php` — troca o texto de `store_settings.launch_badge_text` **via Eloquent**, não `DB::table()->update()`, porque o `saved` do model é quem invalida `store:settings` no Redis. Só age no texto antigo exato.
- `2026_08_06_190000_verify_existing_panel_users.php` — `UPDATE users SET email_verified_at = now() WHERE email_verified_at IS NULL`. `down()` **intencionalmente vazio**, documentado.
- `2026_08_10_120000_…` (acima) — além da coluna, faz `DB::table('orders')->whereIn('status', OrderStatus::paidValues())->update(['purchase_tracked_at' => now()])`.

**Dinheiro:** zero `decimal`/`float` no schema. As 11 colunas monetárias são `unsignedInteger` de centavos: `product_variants.price_cents`, `shipping_rates.price_cents`, `city_shipping_rates.price_cents`, `orders.{subtotal,shipping,discount,total}_cents`, `order_items.{unit_price,total}_cents`, `payments.amount_cents`. Comentário na migration de `orders`: *"Dinheiro sempre em centavos"*.
⊖ O boilerplate segue o caminho oposto: `decimal(12,2)` + `app/Casts/MoneyCast.php` + `app/ValueObjects/Money.php` (VO com 24 métodos: `fromCents/fromDecimal/add/subtract/sum/multiplyRatio/percentage/allocate/compareTo/…`, `JsonSerializable`+`Stringable`). O spinmax não tem VO nem cast: `app/Support/Money.php` (26 linhas) só expõe `formatBRL(int $cents): string`.

**Status:** todos `string`, nenhum `enum` de banco, nenhum CHECK. `orders.status` (`default 'pending_payment'`, indexado, cast p/ enum PHP), `order_status_histories.from_status`/`to_status` (cast p/ enum), `payments.status` (sem enum, por decisão documentada), `webhook_events.status` (`default 'received'`).

**Datas:** todas `timestamp` nullable, sem `useCurrent` fora do `failed_jobs.failed_at`. `order_status_histories` tem só `created_at`.

**Divergência por dialeto:** nenhuma ramificação por driver — zero `getDriverName()`, zero `DB::statement`, zero SQL cru; um único conjunto de migrations serve sqlite/mysql/pgsql. Default é **sqlite** (`config/database.php:19` → `env('DB_CONNECTION','sqlite')`; `.env.example:31` `DB_CONNECTION=sqlite`; `phpunit.xml` fixa `sqlite`/`:memory:`). O único ponto de assimetria é o `->after()`, usado nas migrations antigas (`add_role_id`, `add_email_to_orders`, `add_coming_soon`) e **abandonado nas duas mais recentes**, com o motivo escrito no código: *"é modificador só do MySQL e vira no-op silencioso no SQLite da suíte"*.

**Ponto de schema a registrar:** `users.role_id` é `foreignId()->nullable()` **sem `constrained()`** — não há FK no banco (herdado do boilerplate, idêntico nos dois).

---

#### 3. `app/Enum/` — 5 enums (não existe `app/Enums`)

| Path | Cases | Métodos |
|---|---|---|
| `app/Enum/OrderStatus.php` ⊕ | `PendingPayment=pending_payment`, `Paid=paid`, `Shipped=shipped`, `Delivered=delivered`, `Canceled=canceled`, `Expired=expired` | `label()`, `color()` (amber/green/blue/teal/red/gray — token semântico p/ o front), `allowedTransitions()` (**única fonte da máquina de estados**: PendingPayment→[Paid,Canceled,Expired]; Paid→[Shipped,Canceled]; Shipped→[Delivered]; Delivered/Canceled/Expired→[]), `canTransitionTo()`, `isTerminal()`, `paidValues()` estática (`[paid,shipped,delivered]` — definição única de "venda" p/ faturamento, ticket médio, `LaunchPricing` e histórico), `options()` |
| `app/Enum/PaymentMethod.php` ⊕ | `Pix=pix`, `CreditCard=credit_card` | `label()`, `options()` |
| `app/Enum/ShippingRegion.php` ⊕ | `SaoPaulo=sp`, `SulSudesteCo=sul_sudeste_co`, `NorteNordeste=norte_nordeste` | `label()`, `ufs()` (agrupamento de 27 UFs; carrega um `TODO: confirmar agrupamento com a tabela real (27/07)`), `allUfs()` (derivada, sem segunda lista), `fromUf()`, `options()` |
| `app/Enum/Permissions.php` | **12 cases**: `MANAGE_USERS, MANAGE_ROLES, MANAGE_PERMISSIONS, ASSIGN_ROLES, IMPERSONATE_USERS` + ⊕ `VIEW_ORDERS, MANAGE_ORDERS, VIEW_CUSTOMERS, VIEW_REVENUE, EXPORT_STORE_DATA, MANAGE_SHIPPING_TABLE, MANAGE_STORE_SETTINGS` | `label()`, `description()` (⊕ frase por consequência, não por nome de tela). Docblock registra a remoção de **23 permissions** herdadas (CRM/Financeiro/Notificações) sem nenhum consumidor |
| `app/Enum/Roles.php` | **6 cases**: `SUPER_USER, ADMIN, VIEWER, VISITOR` + ⊕ `OPERATIONS, ACCOUNTING`; ⊖ boilerplate tem `MANAGER` que aqui não existe | `label()`, `description()`, `priority()` (100/90/60/30/10/0), `isSelectable()` (só `VISITOR` false). Docblock registra remoção de **19 papéis** do starter e a decisão explícita de **não** ter `options()` |

Boilerplate: 5 cases em `Permissions`, 5 em `Roles`, sem `OrderStatus`/`PaymentMethod`/`ShippingRegion`.

---

#### 4. Casts, ValueObjects e equivalentes

- **`app/Casts/` não existe** no spinmax; **`app/ValueObjects/` não existe**. Todos os casts são strings nativas do Laravel ou `::class` de enum.
- ⊖ boilerplate: `app/Casts/MoneyCast.php` + `app/ValueObjects/Money.php`.
- O papel de VO é preenchido por classes `final` estáticas em `app/Support/` (7 arquivos, 430 linhas) ⊕:

| Path | Linhas | Papel |
|---|---|---|
| `app/Support/Cpf.php` | 52 | `normalize()` (só dígitos), `hash()` = **HMAC-sha256 com `config('app.key')`** (docblock: sha256 puro seria invertível offline no espaço de ~10^11 CPFs, anulando a criptografia at-rest), `mask()` que **falha fechado** (11 díg → `***.456.789-**`; 14 → `**.***.789/****-**`; qualquer outro → `***`) |
| `app/Support/Money.php` | 26 | só `formatBRL(int $cents): string` |
| `app/Support/BusinessTime.php` | 116 | bordas de período no fuso do negócio devolvidas **em UTC**: `timezone()`, `now()`, `startOfToday()`, `startOfDaysAgo()`, `startOfDateInput()`, `endOfDateInput()`, `display()` |
| `app/Support/PaymentStatusLabel.php` | 37 | mapa com fallback p/ `payments.status` (8 termos → PT), deliberadamente **não** enum |
| `app/Support/PiiScrubber.php` / `ScrubPiiFromLogs.php` / `Tracking.php` | 115 / 28 / 56 | fora do escopo desta frente (logs / pixel) |

⊖ boilerplate tem `app/Support/Br/{CpfFormatter,CpfHasher,PhoneNormalizer}.php` — mesma família de problema resolvida em 3 classes, contra a `Cpf` única do spinmax.

---

#### 5. `database/factories/` — 12 (⊕ boilerplate tem 1)

| Path | States |
|---|---|
| `UserFactory.php` | `unverified()`, `inactive()` ⊕. `role_id` resolvido **pelo nome** (`Roles::VISITOR`) — o docblock registra que antes era `numberBetween(1,3)`, que sorteava super usuário e fazia testes de "acesso negado" passarem por sorte. ⊖ boilerplate: `role_id => null`, sem `inactive()` |
| `ProductFactory.php` | `inactive()` |
| `ProductVariantFactory.php` | `inactive()`, `comingSoon()` (seta os dois campos: `active=false` + `coming_soon=true`) |
| `CustomerFactory.php` | `optedIntoMarketing()`; CPF via `fake()->unique()->numerify()` + `Cpf::hash()` |
| `OrderFactory.php` (81 linhas) | `paid()`, `shipped()`, `inSeparation()` (composta sobre `paid()`), `pix()`, `creditCard()`; `shipping_address` monta o JSON completo (cep/logradouro/numero/complemento/bairro/cidade/uf) |
| `OrderItemFactory.php` | — (deriva `total_cents = quantity × unit_price`) |
| `OrderStatusHistoryFactory.php` | — |
| `PaymentFactory.php` | `approved()`, `rejected()` |
| `ShippingRateFactory.php` | `forRegion()`, `real()`; ⊕ `configure()` com `Sequence` ciclando as 3 regiões para não colidir no UNIQUE `region` em `->count(n)` |
| `CityShippingRateFactory.php` | `forCity()`, `free()` (`price_cents = 0`), `inactive()` |
| `StoreSettingFactory.php` | — |
| `WebhookEventFactory.php` | `processed()` |

Sem factory: `Role`, `Permission`, `OrderSequence`.

---

#### 6. `database/seeders/` — 4 seeders + 1 trait

- `database/seeders/NeverRunsInProduction.php` ⊕ — trait com `abortInProduction()` chamado como **primeira linha** do `run()`; lança `RuntimeException` (exit ≠ 0) antes de qualquer escrita. Docblock explica que `DB::prohibitDestructiveCommands()` não cobre `db:seed` e que aqui `db:seed` em produção é destrutivo de verdade (`updateOrCreate` sobre catálogo/frete/settings). ⊖ boilerplate usa a abordagem oposta em `database/seeders/Concerns/GuardsDemoSeeding.php`: **skip com warning** em vez de exception, liberado em `local`/`testing` ou por opt-in `SEED_DEMO=true` + `SEED_ADMIN_PASSWORD`.
- `database/seeders/DatabaseSeeder.php` — `abortInProduction()` + `call([PermissionRoleSeeder, UserSeeder, StoreSeeder])`.
- `database/seeders/PermissionRoleSeeder.php` (139 linhas) ⊕ — **único que roda em produção** (`--force`): idempotente, sem PII. `matrix()` estática e pública é a fonte da matriz cargo × permissão (ADMIN 9 permissions, OPERATIONS 4, ACCOUNTING 4, VIEWER 3, VISITOR 0; `SUPER_USER` recebe `Permissions::cases()` por construção). `updateOrCreate` em roles/permissions, `sync()` nos pivots e, ao final, `User::query()->pluck('id')->each(fn($id) => Cache::forget(User::permissionCacheKey($id)))` — invalida o cache `rememberForever` de todos os usuários. O docblock registra uma escalada de privilégio medida (Administrador com `manage_roles` marcava `impersonate_users` + `manage_permissions` no próprio cargo, PUT em `roles-permissions.update` devolvendo 302).
- `database/seeders/UserSeeder.php` — **um usuário por cargo**, dentro de `User::unguarded()` (porque `email_verified_at` não está no `$fillable`), com `updateOrCreate` casando por e-mail. E-mails no formato `{nome_do_cargo}@***` (domínio `.test`, sintético); senha de desenvolvimento em constante literal — **valor redigido: `***`**. Sem dado pessoal real. Docblock registra a redução de ~77 usuários (4 × 19 cargos) para 6.
- `database/seeders/StoreSeeder.php` (105 linhas) — `abortInProduction()`; catálogo lido de `config/store.php` (mesmo que o `store:bootstrap` usa), preços placeholder por SKU em constante (`SPX-N1/N2/N3`), tabela de frete com `is_placeholder = true` (bloqueia go-live), 5 `store_settings` (`store.enabled`, `free_shipping_min_cents`, `handling_days`, `notify_email` → **valor redigido: `***`**, `max_installments`) e `OrderSequence::firstOrCreate(['name'=>'orders'],['current'=>0])` — **`firstOrCreate` e nunca `updateOrCreate`**, com o motivo escrito: reseed zeraria o contador e o `OrderNumberGenerator` reemitiria números já usados, matando o checkout no UNIQUE de `orders.number` depois do pagamento.

**Nenhum seeder contém dado pessoal real.** As únicas credenciais são a senha de dev do `UserSeeder` (redigida acima); credenciais de produção ficam no `store:super-user`, que lê do ambiente.

---

#### 7. Tabela → colunas-chave → índices → FKs

Legenda: `U` unique · `I` index · `PK` primary key · `FK→` foreign key. Todas as colunas `_cents` são `unsignedInteger`.

| Tabela | Colunas-chave (tipo · NOT NULL · DEFAULT) | Índices | FKs |
|---|---|---|---|
| `users` | `id`; `is_active` bool D:`true`; `role_id` bigint NULL; `name`, `email`, `password` str NOT NULL; `cpf_cnpj`,`phone`,`mobile` str NULL; `user_notes` longText NULL; `email_verified_at` ts NULL; `remember_token`; timestamps | `email` U | — (`role_id` **sem** constraint) |
| `password_reset_tokens` | `email` PK; `token` str; `created_at` ts NULL | `email` PK | — |
| `sessions` | `id` PK str; `user_id` NULL; `ip_address` str(45) NULL; `user_agent` text NULL; `payload` longText; `last_activity` int | `user_id` I, `last_activity` I | — |
| `cache` / `cache_locks` | `key` PK; `value` mediumText / `owner` str; `expiration` int | `key` PK | — |
| `jobs` | `id`; `queue` str; `payload` longText; `attempts` tinyint; `reserved_at`/`available_at`/`created_at` uint | `queue` I | — |
| `job_batches` | `id` PK str; contadores int; `options` mediumText NULL | `id` PK | — |
| `failed_jobs` | `id`; `uuid` str; `failed_at` ts D:`CURRENT` | `uuid` U | — |
| `roles` | `id`; `name` str; `label` str NULL; `priority` uint D:`0`; timestamps | `name` U | — |
| `permissions` | `id`; `name` str; `label` str NULL; timestamps | `name` U | — |
| `permission_role` | `role_id`, `permission_id` | PK(`role_id`,`permission_id`) | →`roles.id`, →`permissions.id` (sem onDelete) |
| `permission_user` | `user_id`, `permission_id`; `meta` json NULL; timestamps | PK(`user_id`,`permission_id`) | →`users.id` **cascade**, →`permissions.id` **cascade** |
| `audits` ⊕ | `id` bigIncrements; `user_type` str NULL / `user_id` ubigint NULL; `event` str; `auditable_type`+`auditable_id` (morphs); `old_values`/`new_values`/`url` text NULL; `ip_address` ipAddress NULL; `user_agent` str(1023) NULL; `tags` str NULL; timestamps | `auditable_type,auditable_id` I (via `morphs`); (`user_id`,`user_type`) I composto | — (morph, sem FK) |
| `products` ⊕ | `id`; `name` str; `slug` str; `description` text NULL; `package_weight_grams` uint NULL; `package_{length,width,height}_cm` usmallint NULL; `active` bool D:`true` | `slug` U | — |
| `product_variants` ⊕ | `id`; `product_id`; `name` str; `sku` str; `price_cents`; `stock` uint NULL; `sort` usmallint D:`0`; `active` bool D:`true`; `coming_soon` bool D:`false` | `sku` U | →`products.id` **cascadeOnDelete** |
| `customers` ⊕ | `id`; `name` str; **`cpf` text** (ciphertext, excede 191); **`cpf_hash` str(64)**; `email` str; `phone` str; `marketing_opt_in` bool D:`false`; `marketing_opt_in_at` ts NULL | `cpf_hash` U, `email` I | — |
| `shipping_rates` ⊕ | `id`; `region` str; `price_cents`; `deadline_days` utinyint; `is_placeholder` bool D:`true`; `active` bool D:`true` | `region` U | — |
| `city_shipping_rates` ⊕ | `id`; `city` str (como digitado); `city_key` str (normalizado); `uf` str(2); `price_cents` (**0 legítimo** = frete grátis); `deadline_days` utinyint; `active` bool D:`true` | **U(`city_key`,`uf`)** composto | — |
| `store_settings` ⊕ | `id`; `key` str; `value` json NULL | `key` U | — |
| `order_sequences` ⊕ | `id`; `name` str; `current` ubigint D:`0`; **sem timestamps** | `name` U | — |
| `orders` ⊕ | `id`; `uuid`; `number` str; `customer_id`; `status` str D:`pending_payment`; `subtotal_cents`, `shipping_cents`, `discount_cents` D:`0`, `total_cents`; `payment_method` str NULL; `installments` utinyint D:`1`; `gateway` str D:`mercadopago`; `gateway_payment_id` str NULL; `paid_at`/`shipped_at`/`delivered_at`/`canceled_at`/`expired_at` ts NULL; `shipping_recipient` str; `email` str NULL; `shipping_address` **json**; `shipping_service_label` str; `shipping_deadline_days` utinyint; `tracking_code` str NULL; `cancel_reason` str NULL; `separation_started_at` ts NULL; `separation_by_id` NULL; `purchase_tracked_at` ts NULL | `uuid` U, `number` U, `status` I, `gateway_payment_id` I, **(`status`,`separation_started_at`) I composto** | →`customers.id` **restrictOnDelete**; →`users.id` **nullOnDelete** (`separation_by_id`) |
| `order_items` ⊕ | `id`; `order_id`; `product_variant_id`; `description` str; `sku` str (snapshot); `quantity` usmallint; `unit_price_cents`; `total_cents` | — | →`orders.id` **cascadeOnDelete**; →`product_variants.id` **restrictOnDelete** |
| `order_status_histories` ⊕ | `id`; `order_id`; `from_status` str; `to_status` str; `user_id` NULL (`null` = sistema/webhook); `note` str NULL; **só `created_at`** ts NULL | — | →`orders.id` **cascadeOnDelete**; →`users.id` **nullOnDelete** |
| `payments` ⊕ | `id`; `order_id`; `gateway_payment_id` str; `method` str; `status` str; `amount_cents`; `installments` utinyint D:`1`; `payload` json NULL (**sem dado de cartão, por contrato**) | `gateway_payment_id` U | →`orders.id` **cascadeOnDelete** |
| `webhook_events` ⊕ | `id`; `provider` str; `external_id` str; `type` str; `payload` json NULL; `status` str D:`received`; `processed_at` ts NULL; `error` text NULL | **U(`provider`,`external_id`)** composto (idempotência) | — |
| ⊖ `activity_log` (só boilerplate) | `log_name` NULL; `description` text; `subject`/`causer` nullableMorphs; `attribute_changes`, `properties` json NULL | `log_name` I, `event` I, morphs | — |

**Limitações desta varredura:** tudo foi lido estaticamente do código; nada foi executado (sem `php artisan`, sem `db:*`, sem suíte), então o schema acima é o que as migrations declaram — não o resultado de um `migrate` real, e nenhum índice/constraint criado fora de migration (ex.: direto no banco de produção) seria visível daqui.

---

### Controllers, Form Requests, regras, policies e exceptions

Projeto: `/Users/cristianomorgante/workspace/laravel/clients/spinmax/app` @ `e4ec01e`. Paths abaixo relativos a essa raiz. Boilerplate comparado: `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`.

---

#### 1. `app/Http/Controllers/` — organização e contagem

**57 arquivos** (56 controllers + 1 helper de query que mora na pasta). Padrão dominante: **single-action invokable por módulo**, `final class X extends Controller`, com `App\Http\Controllers\Controller` sendo `abstract class` que só usa `AuthorizesRequests` (idêntico byte-a-byte ao do boilerplate).

Convívio de dois estilos, herdado do starter Laravel:
- **invokable** (`__invoke`) — 40 controllers, todos os módulos de domínio.
- **multi-método** (`create/store`, `show/update`, `edit/update/destroy`) — 12: os 7 de `Auth/`, `Settings/PasswordController`, `Settings/ProfileController`, `Shop/OrderLookupController` (`show`+`resolve`), `Shop/LegalController` (`privacy`/`terms`/`exchanges`), `Store/*Controller` (`show`+`update`, 4 arquivos).

| Módulo | Nº | Arquivos |
|---|---|---|
| `Auth/` | 7 | `AuthenticatedSessionController`, `ConfirmablePasswordController`, `EmailVerificationNotificationController`, `EmailVerificationPromptController`, `NewPasswordController`, `PasswordResetLinkController`, `VerifyEmailController` |
| `Customer/` ⊕ | 2 | `IndexController`, `ShowController` |
| `Order/` ⊕ | 11 | `CancelController`, `DeliverController`, `ExportController`, `IndexController`, `OrderFilters` (não é controller), `ResendEmailController`, `ShipController`, `ShowController`, `StartSeparationController`, `UndoSeparationController`, `UpdateTrackingController` |
| `PermissionRole/` | 5 | `AssignRoleController`, `IndexController`, `RevokeRoleController`, `SyncPermissionsController`, `UpdateController` |
| `Settings/` | 2 | `PasswordController`, `ProfileController` |
| `Shipping/` ⊕ | 1 | `QuoteController` |
| `Shop/` ⊕ | 8 | `BuyController`, `CheckoutController`, `CheckoutPageController`, `LegalController`, `OrderLookupController`, `OrderStatusController`, `OrderStatusPollController`, `StoreUnavailableController` |
| `Store/` ⊕ | 4 | `CityShippingRateController`, `SettingsController`, `ShippingRateController`, `VariantController` |
| `User/` | 13 | `CreateController`, `DestroyController`, `EditController`, `GrantPermissionController`, `IndexController`, `RevokePermissionController`, `ShowController`, `ShowUserPermissionsController`, `StartImpersonateController`, `StopImpersonateController`, `StoreController`, `ToggleActiveController`, `UpdateController` |
| `Webhook/` ⊕ | 1 | `MercadoPagoController` |
| raiz | 3 | `Controller.php` (abstract), `DashboardController.php` ⊕, `LandingController.php` ⊕ |

⊖ (boilerplate tem, spinmax não): `Auth/RegisteredUserController.php` — registro público foi removido.

**Higiene de arquivo.** 12 controllers **sem** `declare(strict_types=1)`: os 9 de `Auth/`+`Settings/` (starter intocado), `User/DestroyController.php`, `User/ToggleActiveController.php`, `PermissionRole/IndexController.php`. Os outros 45 têm. 43 arquivos declaram `final class`.

**Ordem interna (authorize → validate → serviço → response).** 26 pontos de autorização explícita em controller:

| Forma | Ocorrências |
|---|---|
| `$this->authorize(...)` | `Order/{Index,Show,Ship,Cancel,Deliver,Export,ResendEmail,StartSeparation,UndoSeparation,UpdateTracking}Controller`, `User/{Index,Show,Create,Store,Edit,Update,Destroy,ToggleActive}Controller`, `Customer/{Index,Show}Controller`, `PermissionRole/{Index,Update}Controller` |
| `Gate::authorize(...)` | `User/GrantPermissionController:23`, `User/RevokePermissionController:23`, `User/ShowUserPermissionsController:20`, `User/StartImpersonateController:33`, `PermissionRole/SyncPermissionsController:19` |
| `abort(401/403, …)` cru | `PermissionRole/AssignRoleController:38`, `PermissionRole/RevokeRoleController:34`, `User/StartImpersonateController:27`, `User/StopImpersonateController:22`, `PermissionRole/UpdateController:97,104,110` |

**Validação inline (`$request->validate()`) sobrevive em 8 controllers** — `Settings/PasswordController:26`, `Settings/ProfileController:39`, `Auth/NewPasswordController:29`, `Auth/PasswordResetLinkController:23`, `Auth/ConfirmablePasswordController:22`, e **três do RBAC**: `PermissionRole/SyncPermissionsController:21`, `PermissionRole/UpdateController:29`, `PermissionRole/AssignRoleController:31`. ⊖ o boilerplate já tem FormRequests para esses três (`app/Http/Requests/PermissionRole/{AssignRoleRequest,SyncPermissionsRequest,UpdateRolePermissionsRequest}.php`).

**Controllers com corpo de domínio relevante (não-CRUD):**

| Path | O que faz |
|---|---|
| `app/Http/Controllers/Order/OrderFilters.php` (157L) ⊕ | **Não é controller** — classe estática `apply(Builder, Request, bool $defaultToPaidQueue)` compartilhada por `Order/IndexController` e `Order/ExportController` para que lista e CSV apliquem o MESMO recorte. Teto `MAX_PER_PAGE = 200` contra `?per_page=100000`; `DEFAULT_PER_PAGE = 20`; busca por CPF passa pelo `Cpf::hash()`; períodos por `BusinessTime` |
| `app/Http/Controllers/Order/ExportController.php` (144L) ⊕ | CSV streamed (`StreamedResponse`) de pedidos e de clientes; permission `export_store_data` separada por LGPD; escopo de clientes `operational` × marketing opt-in |
| `app/Http/Controllers/Order/ShipController.php` (60L) ⊕ | `Cache::lock("order:{uuid}", 30)->block(5)` + `refresh()` antes de `transitionStatusTo()`; `catch (LockTimeoutException)` e `catch (DomainException)` → `back()->with('error', …)`; grava marca de `force` no histórico |
| `app/Http/Controllers/Order/UpdateTrackingController.php` (126L) ⊕ | Corrige rastreio de pedido já enviado, decide notificar comprador (`notify`), monta nota de histórico com código antigo→novo |
| `app/Http/Controllers/Webhook/MercadoPagoController.php` (176L) ⊕ | Valida HMAC via `WebhookSignatureValidator` (com `strtolower($dataId)` explícito), grava `WebhookEvent` para idempotência, despacha `ProcessMercadoPagoWebhookJob`, responde 200. `PROCESSABLE_TOPICS = ['payment','order']`; tópico desconhecido vira `ignored` |
| `app/Http/Controllers/Shipping/QuoteController.php` (98L) ⊕ | Cotação JSON; subtotal calculado por `LaunchPricing`, nunca por `price_cents`; 422 `cep_unresolved` / `no_coverage` |
| `app/Http/Controllers/PermissionRole/UpdateController.php` (152L) | Edita a matriz de um cargo. `ensureActorMayEdit()`: super_user não pode tirar `manage_roles` do próprio cargo; não-super não edita cargo de prioridade ≥ à sua; não concede permissão que ele mesmo não tem. `Log::info('rbac.role_permissions_updated', …)` com antes/depois. `forgetPermissionsCacheOfMembers()` limpa `user:{id}:permissions` de todos os membros |
| `app/Http/Controllers/DashboardController.php` (155L) ⊕ | Métricas em 3 blocos privados: `orders()`, `revenue()`, `health()` (lê `StoreSettings`) |
| `app/Http/Controllers/LandingController.php` (428L) ⊕ | Renderiza `View` (Blade, não Inertia); varre disco para galeria/vídeos (`galleryPhotos`, `mapVideoFile`, `videoSortKey`, `featuredPhotos`) |

---

#### 2. `app/Http/Requests/` — 16 Form Requests

| Path | `authorize()` | Chaves de `rules()` | `messages()` pt-BR | `prepareForValidation` / outros hooks |
|---|---|---|---|---|
| `Auth/LoginRequest.php` | `true` | `email`, `password` | — (usa `__('auth.failed')`) | ⊕ métodos `authenticate()`/`ensureIsNotRateLimited()`/`throttleKey()`; **injeta `is_active => true` nas credenciais** para que conta desativada não autentique com mensagem genérica |
| `GrantPermissionRequest.php` | `hasRole(Roles::SUPER_USER)` | `permission` (`exists:permissions,name`), `can_impersonate_any` | ✅ 3 mensagens | — |
| `Settings/ProfileUpdateRequest.php` | ausente (default) | `name`, `email` (`Rule::unique(User)->ignore`) | — | — |
| `Shipping/ShippingQuoteRequest.php` ⊕ | `true` | `variant_id` (`exists…where active`), `quantity` (`max` de `StoreSettings::maxQuantity()`), `cep`, `uf` | ✅ 4 | `withValidator`: exige CEP **ou** UF; CEP com 8 dígitos. Helper público `normalizedCep()` |
| `Shop/OrderLookupRequest.php` ⊕ | `true` | `number` (max:40), `cpf` (`new CpfCnpj`) | ✅ 2 | Helper `normalizedNumber()` reconstrói `SPX-000123` a partir dos dígitos |
| `Shop/StoreCheckoutRequest.php` ⊕ | `true` | `name,email,phone,cpf,cep,logradouro,numero,complemento,bairro,cidade,uf,variant_id,quantity,payment_method,installments,card_token,payment_method_id,issuer_id,terms_accepted,marketing_opt_in` (20 chaves) | ✅ 4 | Tetos vindos de `StoreSettings::maxInstallments()`/`maxQuantity()`; `Rule::enum(PaymentMethod)`; `required_if` amarrado a `PaymentMethod::CreditCard` |
| `Store/CancelOrderRequest.php` ⊕ | `can('manage_orders')` | `reason` (req, max:255), `confirm` | ✅ 1 | — |
| `Store/ResendOrderEmailRequest.php` ⊕ | `can('manage_orders')` | `type` ∈ received/paid/shipped/canceled/expired | — | — |
| `Store/ShipOrderRequest.php` ⊕ | `can('manage_orders')` | `tracking_code`, `force`, `note` | ✅ 1 | **`prepareForValidation`** normaliza via `Tracking::normalize()` (o valor validado é o gravado); `withValidator` cobra formato Correios salvo se `force` |
| `Store/UpdateTrackingRequest.php` ⊕ | `can('manage_orders')` | idem + `notify` | ✅ 1 | idem `ShipOrderRequest` |
| `Store/UpdateCityShippingRatesRequest.php` ⊕ | `can('manage_shipping_table')` | `cities` (`present,array,max:200`), `cities.*.{city,uf,free,price_cents,deadline_days,active}`, `label` | — (mensagens inline no `withValidator`) | **`prepareForValidation`** uppercase de `uf`; `withValidator` recusa preço 0 sem `free` marcado e recusa cidade duplicada (comparada por `CityShippingRate::normalizeCity`) |
| `Store/UpdateShippingRatesRequest.php` ⊕ | `can('manage_shipping_table')` | `rates` (`required,array,min:1`), `rates.*.{region,price_cents(min:1),deadline_days,active}` | — | `withValidator` exige **pelo menos uma região ativa** (senão a loja não cota frete e o checkout trava) |
| `Store/UpdateSettingsRequest.php` ⊕ (373L, o maior) | `can('manage_store_settings')` | `store_enabled, free_shipping_min_cents, handling_days, notify_email, max_installments, pix_discount_percent, launch_price_cents, launch_units_limit, launch_badge_text, max_quantity, whatsapp, shipping_label, box_contents, company_razao_social, company_cnpj, company_address, company_contact_email` (17) | ✅ 8 mensagens + **`attributes()`** com 6 rótulos pt-BR de tela | **`prepareForValidation`** normaliza WhatsApp (só dígitos, prefixa `55` quando 10/11 dígitos). **`withValidator` com 5 regras cruzadas privadas**: `refuseLaunchPriceAboveFullPrice`, `refuseGlobalLaunchPriceWithSeveralVariants`, `refuseFreeShippingBelowOneUnit`, `refuseUnknownBadgePlaceholder` (só `{restantes}`/`{unidades}`), `refuseTooManyBoxLines` (≤6 linhas). Aborta o cruzamento se já houver erro simples |
| `Store/UpdateVariantsRequest.php` ⊕ | `can('manage_store_settings')` | `variants` (`required,array,min:1`), `variants.*.{id,price_cents(min:1),sort(0..65535),availability∈active/coming_soon/inactive,name}`, `product.description` | — | `withValidator` → `refuseFullPriceBelowLaunchPrice()`: o espelho do invariante de `UpdateSettingsRequest` visto da outra tela |
| `User/StoreUserRequest.php` | `can('manage_users')` | `name,email(unique),cpf_cnpj(CpfCnpj),phone,mobile,password(confirmed,Password::defaults()),role_id,is_active,user_notes` | ✅ 5 | — |
| `User/UpdateUserRequest.php` | `can('manage_users')` | idem, `email` com `Rule::unique->ignore($userId)`, `password` nullable | ✅ 4 | resolve `$userId` tolerando route-model-binding **ou** id cru |

**9 dos 16 sem `declare(strict_types=1)`**: `Auth/LoginRequest`, `Shop/OrderLookupRequest`, `Shop/StoreCheckoutRequest`, `User/UpdateUserRequest`, `User/StoreUserRequest`, `Shipping/ShippingQuoteRequest`, `Store/ResendOrderEmailRequest`, `Store/UpdateVariantsRequest`, `Store/CancelOrderRequest`.

⊖ o boilerplate tem `app/Http/Requests/PermissionRole/` (3 requests) que aqui não existe.

---

#### 3. `app/Rules/` — 2 regras

| Path | Valida |
|---|---|
| `app/Rules/CpfCnpj.php` | Dígito verificador de CPF (11) ou CNPJ (14), decidido **pelo comprimento**. Vazio passa (`nullable` decide obrigatoriedade). Mensagem: `'CPF ou CNPJ inválido: confira os números digitados.'`. **Divergiu do boilerplate**: lá a mensagem é `"O campo {$attribute} não é um CPF ou CNPJ válido."` e há três `(int)` casts a mais nos loops de checksum (spinmax não tem os casts) |
| `app/Rules/Cnpj.php` ⊕ | **CNPJ e só CNPJ** — exige 14 dígitos e depois **delega** ao `CpfCnpj` capturando o `$fail` num flag interno, para reaproveitar o checksum sem herdar a mensagem ("CPF ou CNPJ", que ali seria mentira). Usado só em `UpdateSettingsRequest` → `company_cnpj`. Motivo documentado: CPF válido no campo saía impresso como "CNPJ ###" no rodapé legal de todo e-mail e da landing |

⊖ boilerplate tem `app/Rules/MoneyString.php` (regex de decimal com até 2 casas, flag `allowNegative`) — não existe no spinmax, que trabalha com `int` centavos direto no `rules()`.

---

#### 4. `app/Policies/` — 3 policies

Registro: **explícito** em `app/Providers/AppServiceProvider.php` → `configPolicies()` (linhas 185-187), via `Gate::policy()`. Não há `AuthServiceProvider`.

```php
Gate::policy(User::class, UserPolicy::class);
Gate::policy(\App\Models\Order::class, \App\Policies\OrderPolicy::class);
Gate::policy(\App\Models\Customer::class, \App\Policies\CustomerPolicy::class);
```

Gates por permission são auto-registrados em `configGates()` (linhas 174-183): um `Gate::define()` por case de `App\Enum\Permissions`. Comentário no lugar registra que um `Log::channel('daily')->info()` por checagem foi removido (T-915).

| Path | Métodos | Notas |
|---|---|---|
| `app/Policies/UserPolicy.php` (~200L) | `viewAny`, `view`, `create`, `update`, `delete`, `toggleActive`, `impersonate`, `managePermissions`, `assignRole`, `mutatePermissions` + privados `outranks`, `effectiveActor`, `priority`, `isSelf` | Teto de autoridade por `role->getPriority()`, ator real resolvido por `ImpersonationService::getOriginalUser()`. **Praticamente idêntico ao do boilerplate** — só divergem os docblocks (spinmax cita T-905/spec 10; boilerplate cita o `PermissionRoleSeeder`) e o boilerplate tem um docblock extra em `managePermissions()`. Assinaturas e corpos batem |
| `app/Policies/OrderPolicy.php` ⊕ | `viewAny`, `view`, `manage`, `export` | Cada um mapeia 1:1 para `Permissions::{VIEW_ORDERS, MANAGE_ORDERS, EXPORT_STORE_DATA}`. Sem teto de prioridade |
| `app/Policies/CustomerPolicy.php` ⊕ | `viewAny`, `view`, `export` | `Permissions::{VIEW_CUSTOMERS, EXPORT_STORE_DATA}` |

---

#### 5. Exceptions

**Não existe `app/Exceptions/`.** Uma única exception própria em todo o projeto:

| Path | Tipo | Como é lançada / renderizada |
|---|---|---|
| `app/Services/Payment/PaymentException.php` (74L) ⊕ | `final class … extends RuntimeException` | Named constructor `::declined(?string $reason, ?Throwable $previous)` + `isDeclined()`/`declineReason()`; `withContext(array)`/`context()` — o método `context()` é o hook que o handler do Laravel usa em `report()`. Docblock avisa: **só identificador, nunca PII**. Lançada em `PaymentAttemptCreator:50,59,63,124`, `MercadoPagoOrdersGateway:168,212,239`, `FakeGateway:47`. **Renderizada num único ponto**: `app/Http/Controllers/Shop/CheckoutController.php:27` — `catch` que bifurca a mensagem ao comprador entre "o banco não autorizou esse cartão" (declined) e "não conseguimos iniciar o pagamento agora" (falha de sistema), sempre via `back()->withInput()->with('error', …)` |

**`DomainException` (SPL) é o veículo do erro de máquina de estados**, sem classe própria:
- Origem: `app/Models/Order.php:154` — `transitionStatusTo()` valida `OrderStatus::canTransitionTo()` e lança; também `app/Services/Store/CheckoutService.php:103` (total inválido) e lançamentos locais em `Order/CancelController:32`, `Order/StartSeparationController:46`, `Order/UndoSeparationController:38`, `Order/UpdateTrackingController:59`.
- Renderização: **6 `catch (DomainException)` em controllers** (`Ship`, `Cancel`, `Deliver`, `UndoSeparation`, `StartSeparation`, `UpdateTracking`), todos devolvendo `back()->with('error', $exception->getMessage())` — a mensagem já é escrita em pt-BR para a tela.
- `ValidationException::withMessages()` usada como erro de domínio em `CheckoutService:1155` (`variant_id` → "Produto indisponível.") e em `Auth/LoginRequest`.

**Configuração global de exception** — `bootstrap/app.php`, bloco `withExceptions()`: uma única linha, `$exceptions->respond(fn(Response $r) => SecurityHeaders::stamp($r))`, para carimbar headers de segurança nas respostas que saem por fora da pilha de middleware (login redirect, 403, 404, 500). ⊕ em relação ao boilerplate.

---

#### 6. `app/Http/Resources/` — 2 resources

| Path | Conteúdo |
|---|---|
| `app/Http/Resources/UserResource.php` | `preserveKeys = true`; expõe `id,name,email,cpf_cnpj,phone,mobile,is_active,user_notes,role,permissions,custom_permissions_count,custom_permissions_list,can_impersonate,created_at,updated_at`. ⊕ **Mascaramento de PII na exibição**: privado `viewerOutranksOrOwns()` — CPF sai por `Cpf::mask()` e `phone`/`mobile`/`user_notes` viram `null` a menos que o viewer seja o próprio, `super_user`, ou tenha prioridade estritamente maior. Viewer resolvido pelo `ImpersonationService::getOriginalUser()`. ⊖ **o boilerplate expõe `cpf_cnpj` e `phone` em claro** (linhas 27-28) |
| `app/Http/Resources/RoleResource.php` | `preserveKeys = true`; `id,name,label,permissions(whenLoaded),users(whenLoaded),created_at,updated_at` + estático `toArrayCollection(Collection, Request)` que força array numérico para o React. Estruturalmente igual ao do boilerplate |

`JsonResource::withoutWrapping()` em `AppServiceProvider::configResources()`.

---

#### 7. Camada de serviço — `app/Services/`, `app/Support/`, `app/Resolvers/`

**Não existe `app/Actions/` nem `app/Domain/`.** 30 arquivos em `app/Services/`, 7 em `app/Support/`, 1 em `app/Resolvers/`.

**RBAC / identidade** (compartilhados com o boilerplate):

| Path | Responsabilidade |
|---|---|
| `app/Services/ImpersonationService.php` (74L) | `start`/`stop`/`isImpersonating`/`getOriginalUser`/`getOriginalUserName` sobre 2 chaves de sessão; dispara `ImpersonateStarted`/`ImpersonateStopped`. `stop()` resolve o original **antes** de mexer na sessão |
| `app/Services/PermissionManagementService.php` (26L) | Concede/revoga permissão individual, injetando meta `can_impersonate_any` quando a permission é `impersonate_users` |
| `app/Services/RoleFilterService.php` (156L) | Quais cargos o ator vê × pode atribuir, em 4 métodos que separam **ator real × persona** e **exibir × autorizar** |
| `app/Resolvers/AuditUserResolver.php` (59L) | `UserResolver` do `owen-it/auditing` que grava o **impersonador**, não a persona |
| `app/Traits/Models/HasRolesAndPermissions.php` | Trait de cache `user:{id}:permissions` (fora do escopo desta frente, citado por ser o que `UserPolicy` e `PermissionRole/UpdateController` invalidam) |

⊖ o boilerplate tem `app/Services/PermissionCatalogService.php` (catálogo de permissões ordenado pelo enum, interseccionado com o banco) — inexistente aqui.

**Pagamento** ⊕ (`app/Services/Payment/`):

| Path | Responsabilidade em uma linha |
|---|---|
| `Contracts/PaymentGateway.php` (18L) | Interface: `createPayment(PaymentIntent): PaymentResult`, `getPayment(string): PaymentResult` |
| `MercadoPagoGateway.php` (146L) | Driver da Payments API legada; `EXPIRATION_FORMAT = 'Y-m-d\TH:i:s.vP'` (milissegundos obrigatórios sob pena de 400 em todo Pix) |
| `MercadoPagoOrdersGateway.php` (334L) | Driver da Orders API (`POST /v1/orders`), escolhido por `store.payment.api`; `STATUS_MAP` traduz o vocabulário da Orders para o canônico do app e `STATUS_UNKNOWN` é deliberadamente não-canônico |
| `FakeGateway.php` (91L) | Gateway em memória para testes (singleton); flags `pixStatus`, `cardStatus`, `throwOnCreate`, `declineOnCreate` |
| `PaymentAttemptCreator.php` (246L) | Cria a tentativa de pagamento de uma order sob `Cache::lock("order:{uuid}", 60)`, com guardas de "já aprovado"/"não está mais pendente" e tradução de falha do gateway em `PaymentException` |
| `PaymentException.php` (74L) | (ver seção 5) |

**Frete** ⊕ (`app/Services/Shipping/`):

| Path | Responsabilidade |
|---|---|
| `Contracts/ShippingDriver.php` (20L) | Interface `rate(ShippingRegion): ?RateResult` |
| `TableRateDriver.php` (50L) | Lê `shipping_rates` ativa da região; **em produção recusa linha `is_placeholder`** |
| `ShippingCalculator.php` (125L) | Orquestra driver + regras (frete grátis por limiar, handling no prazo); `quoteForAddress()` recebe o `CepResult` resolvido, nunca a cidade digitada; cidade > região |
| `CepResolver.php` (104L) | CEP → endereço, ViaCEP primário + BrasilAPI fallback, cache por CEP; nunca lança |

**Loja** ⊕ (`app/Services/Store/`):

| Path | Responsabilidade |
|---|---|
| `StoreSettings.php` (326L) | Acesso tipado às settings key/value com `Cache::rememberForever`, fallback para `config/store.php`; `forget()` distinto de `set(null)` |
| `CheckoutService.php` (181L) | Orquestra o checkout: recalcula tudo server-side, cria customer + order + snapshot em transaction, dispara a 1ª tentativa fora dela |
| `LaunchPricing.php` (171L) | Fonte única do preço vigente (promocional × cheio) com memo de `soldUnits` por instância |
| `PixDiscount.php` (66L) | Percentual vigente do Pix e valor em centavos, com truncamento (`intdiv`) e clamp defensivo |
| `StorefrontCatalog.php` (127L) | O catálogo como as duas vitrines (landing e `/comprar`) o veem: vendável × "Em breve", preço vigente, riscado |
| `OrderNumberGenerator.php` (31L) | `SPX-000123` sob `lockForUpdate()` na linha de sequência |
| `BackupStatus.php` (130L) | Ponte entre `scripts/backup-r2.sh` e `store:health`; 3 marcas independentes (`backup.last_success/failure/drill`) gravadas em `store_settings` |

**`app/Support/`** (7 arquivos):

| Path | Responsabilidade |
|---|---|
| `Money.php` (26L) | `formatBRL(int $cents)` — dinheiro é sempre int em centavos |
| `Cpf.php` (52L) ⊕ | `normalize()`, `hash()` (HMAC-sha256 com `app.key`, para dedupe/busca sobre coluna criptografada) e `mask()` que **falha fechado** |
| `Tracking.php` (~60L) ⊕ | `normalize()`, `isCorreiosFormat()`, `correiosUrl(?string)` — as 4 superfícies que olham rastreio concordando |
| `BusinessTime.php` (116L) ⊕ | Bordas de dia/período no fuso do negócio devolvidas em **UTC** para ir à query |
| `PaymentStatusLabel.php` (37L) ⊕ | Mapa status→rótulo pt-BR **com fallback** (devolve o termo cru do MP em vez de mentir) |
| `PiiScrubber.php` (115L) | Redação de PII em mensagem/contexto de log — 2 regras (chave sensível → subárvore inteira; padrão inequívoco em string). Lista `SENSITIVE_KEY_PARTS` com 22 termos |
| `ScrubPiiFromLogs.php` (28L) | Tap de canal que empurra o processor do `PiiScrubber` no **logger** (antes do `PsrLogMessageProcessor`) |

⊖ o boilerplate organiza o equivalente em subpastas — `app/Support/Br/{CpfFormatter,CpfHasher,PhoneNormalizer}.php`, `app/Support/Listing/ListQueryNormalizer.php`, `app/Support/Logging/{PiiAwareTap,PiiScrubber,PiiScrubbingProcessor}.php` — e tem `app/ValueObjects/Money.php` + `app/Casts/MoneyCast.php`, ausentes aqui.

---

#### 8. DTOs

**Zero `final readonly class`** no projeto inteiro (`grep -rn 'readonly class' app/` → nada). O padrão é `final class` com **propriedades promovidas `public readonly`**, todos imutáveis na prática:

| Path | Campos / entrada |
|---|---|
| `app/Services/Store/CheckoutData.php` (60L) | 13 props + `array $address`; named constructor `::fromValidated(array)` que faz todo o casting a partir do `validated()` do `StoreCheckoutRequest` |
| `app/Services/Payment/Data/PaymentIntent.php` (42L) | 13 props; método `idempotencyKey()` = `orderUuid:attempt` |
| `app/Services/Payment/Data/PaymentResult.php` (59L) | 9 props + `isApproved/isRejected/isPending/isReversed/pixPayload()` |
| `app/Services/Payment/Data/CardData.php` (20L) | `token`, `paymentMethodId`, `issuerId`, `installments` — o PAN nunca chega ao backend |
| `app/Services/Payment/Data/PayerData.php` (16L) | `email`, `firstName`, `lastName`, `cpf` |
| `app/Services/Shipping/CepResult.php` (34L) | `cep,uf,cidade,bairro,logradouro` + `toArray()` |
| `app/Services/Shipping/RateResult.php` (19L) | `priceCents`, `deadlineDays`, `serviceLabel` — tarifa bruta, antes das regras |
| `app/Services/Shipping/ShippingQuote.php` (54L) | `priceCents,deadlineDays,region,serviceLabel,isFree` + `priceFormatted()/deadlineLabel()/toArray()` |

Todos ⊕ (o boilerplate não tem camada de DTO; seu único value object é `app/ValueObjects/Money.php`).

---

#### Limitações desta varredura

- Só leitura estática: nenhum `artisan`, teste ou build foi executado (guardrail).
- Cobertura de testes destes controllers/requests não foi verificada — `tests/` não fazia parte desta frente.
- `routes/web.php` (163 linhas, 63 declarações de rota) foi apenas contado, não mapeado rota-a-rota; o mapeamento controller↔rota↔middleware fica para a frente de rotas/middleware.

---

### Integrações, mails/notifications, config e .env.example

#### 1. `app/Mail/` — 11 mailables, 0 notifications

`app/Notifications/` **não existe** no spinmax (⊕ nenhum; ⊖ boilerplate também não tem). Todo aviso sai por `Mailable` + `Mail::to()->send()` disparado por listener. Nenhum canal além de `mail` (sem database/broadcast/Slack notification).

| Path | Base | Fila | `ShouldQueue*` | View markdown | Reply-To |
|---|---|---|---|---|---|
| `app/Mail/OrderMail.php` (abstract, 88 L) | `Mailable` | `mail`, `tries=5`, `backoff [60,300,900]` | `ShouldQueueAfterCommit` | abstrata (`markdownView()`) | `StoreSettings::contactEmail()` (setting do painel, não config) |
| `app/Mail/OrderReceivedMail.php` (18 L) | `OrderMail` | herda | herda | `mail.order-received` | herda |
| `app/Mail/OrderPaidMail.php` (18 L) | `OrderMail` | herda | herda | `mail.order-paid` | herda |
| `app/Mail/OrderCanceledMail.php` (18 L) | `OrderMail` | herda | herda | `mail.order-canceled` | herda |
| `app/Mail/OrderExpiredMail.php` (18 L) | `OrderMail` | herda | herda | `mail.order-expired` | herda |
| `app/Mail/OrderShippedMail.php` (48 L) | `OrderMail` | herda | herda | `mail.order-shipped` | herda |
| `app/Mail/AdminNewPaidOrderMail.php` (18 L) | `OrderMail` | herda | herda | `mail.admin-new-paid-order` | herda |
| `app/Mail/AdminAlertMail.php` (63 L) | `Mailable` | `mail`, `tries=5`, backoff igual | `ShouldQueueAfterCommit` | `mail.admin-alert` | `config('store.mail.reply_to')` |
| `app/Mail/StalePaidOrdersReminderMail.php` (63 L) | `Mailable` | `mail`, `tries=5`, backoff igual | `ShouldQueueAfterCommit` | `mail.stale-paid-orders` | `config('store.mail.reply_to')` |
| `app/Mail/FailedJobAlertMail.php` (46 L) | `Mailable` | **síncrono** | **nenhum, deliberado** | `mail.failed-job-alert` | `config('store.mail.reply_to')` |
| `app/Mail/HealthAlertMail.php` (53 L) | `Mailable` | **síncrono** | **nenhum, deliberado** | `mail.health-alert` | — (sem replyTo) |

Padrões observáveis, com o motivo documentado no próprio arquivo:

- **Dois mailables NÃO são enfileirados de propósito** (`FailedJobAlertMail`, `HealthAlertMail`): ambos alertam sobre a fila estar quebrada/parada; enfileirá-los prenderia o alerta no problema que ele denuncia. O `FailedJobAlertMail` acrescenta o argumento do laço: `JobFailed` do próprio envio dispararia outro alerta.
- **`ShouldQueueAfterCommit` em todos os enfileirados** — `OrderReceivedMail` nasce dentro da transaction do checkout.
- **`loadMissing()` no `content()`** (`OrderMail`: `items, customer, payments`; `AdminAlertMail`: `items, customer`) porque o mailable re-hidrata sem relações e `Model::shouldBeStrict()` estouraria no render.
- **Herança por template method**: `OrderMail::subjectLine()` + `markdownView()` abstratos; 6 subclasses de 18 linhas cada.
- **Dois Reply-To distintos e conscientes**: e-mail do comprador → setting editável no painel (`company.contact_email`); alertas internos → `config('store.mail.reply_to')`.
- `OrderShippedMail::trackingWasCorrected()` deriva do histórico (`whereColumn('from_status','to_status')`) para trocar assunto e template quando é correção de rastreio, não postagem.

**Views markdown próprias** (`resources/views/mail/`, 10 arquivos + 2 partials):

| Path | L |
|---|---|
| `resources/views/mail/order-received.blade.php` | 30 (embute QR Code Pix como `data:image/png;base64` + painel copia-e-cola) |
| `resources/views/mail/admin-alert.blade.php` | 28 |
| `resources/views/mail/order-shipped.blade.php` | 25 |
| `resources/views/mail/health-alert.blade.php` | 25 |
| `resources/views/mail/failed-job-alert.blade.php` | 24 |
| `resources/views/mail/admin-new-paid-order.blade.php` | 19 |
| `resources/views/mail/stale-paid-orders.blade.php` | 15 |
| `resources/views/mail/order-paid.blade.php` | 13 |
| `resources/views/mail/order-canceled.blade.php` | 12 |
| `resources/views/mail/order-expired.blade.php` | 11 |
| `resources/views/mail/partials/order-summary.blade.php` | 18 (`x-mail::table` + subtotal/desconto Pix condicional/frete/total) |
| `resources/views/mail/partials/footer.blade.php` | 11 (`x-mail::subcopy` com razão social, CNPJ, endereço, link de privacidade) |

**Tema Laravel publicado e customizado** (`resources/views/vendor/mail/`): 16 blades + 1 CSS. Só **2 dos 17 divergem do stock do framework** — verificado por `diff` contra `vendor/laravel/framework/src/Illuminate/Mail/resources/views/`:
- `resources/views/vendor/mail/html/header.blade.php` — troca o logo condicional do Laravel por `<img src="{{ asset('spinmax-logo-email.png') }}">` (comentário: PNG < 30KB porque SVG não renderiza em Outlook).
- `resources/views/vendor/mail/html/themes/default.css` (312 L) — hex de marca espelhando os tokens de `_brand.css` (ocean/tropic/sand/coral/ink), botão primário/secundário/destrutivo repintados, com nota de contraste AA.
- Todos os 8 `resources/views/vendor/mail/text/*.blade.php` são idênticos ao stock (publicados sem alteração).

**Listeners que despacham** (`app/Listeners/Store/`): `SendOrderReceivedEmail`, `SendOrderPaidEmails`, `SendOrderCanceledEmail`, `SendOrderExpiredEmail`, `SendOrderShippedEmail`, `SendPaymentAnomalyAlert`, `SendFailedJobAlert`, `EnforceMailAllowlist`.
- `SendOrderPaidEmails` suprime o e-mail ao cliente quando `customer->isAnonymized()` (LGPD) mas mantém o alerta ao admin.
- `SendFailedJobAlert` passa `$event->exception->getMessage()` por `App\Support\PiiScrubber::scrubString()` antes de mandar, e engole `Throwable` com `report()` porque roda dentro do worker no caminho de falha.
- Os três alertas técnicos usam `blank($notify)` (não `!== null`) porque env vazia vira `''` e `Mail::to('')` estoura no build do `Address`.

#### 2. Integrações externas

**Mercado Pago** — SDK `mercadopago/dx-php ^3.10` (⊕; ausente no boilerplate).

| Peça | Path |
|---|---|
| Contrato | `app/Services/Payment/Contracts/PaymentGateway.php` (2 métodos: `createPayment`, `getPayment`) |
| Driver Payments API (legada, `POST /v1/payments`) | `app/Services/Payment/MercadoPagoGateway.php` |
| Driver Orders API (`POST /v1/orders`) | `app/Services/Payment/MercadoPagoOrdersGateway.php` |
| Fake para testes | `app/Services/Payment/FakeGateway.php` |
| Criação com lock/idempotência | `app/Services/Payment/PaymentAttemptCreator.php` |
| DTOs | `app/Services/Payment/Data/{CardData,PayerData,PaymentIntent,PaymentResult}.php` |
| Exceção de domínio | `app/Services/Payment/PaymentException.php` |
| Webhook | `app/Http/Controllers/Webhook/MercadoPagoController.php` |
| Job de processamento | `app/Jobs/ProcessMercadoPagoWebhookJob.php` |
| Persistência do evento | `app/Models/WebhookEvent.php` |
| Reconciliação / reprocessamento | `app/Console/Commands/ReconcileOrdersCommand.php`, `app/Console/Commands/ReprocessWebhooksCommand.php`, `app/Console/Commands/PruneWebhookEventsCommand.php` |

Detalhes de mecanismo, todos com comentário justificando:
- **Seleção de driver por env**, não por git: `config('store.payment.api')` = `payments` | `orders`; rollback = trocar env + `config:cache` + `queue:restart`.
- **Timeout**: `MercadoPagoGateway::requestOptions()` converte `store.payment.gateway_timeout_seconds` (10) × 1000 porque o SDK espera milissegundos — e o comentário registra que cobre só DNS+TCP+TLS (o SDK não seta `CURLOPT_TIMEOUT`). A conta documentada: `4 × timeout + 3,5s < 60s` (LOCK_TTL do `PaymentAttemptCreator`), travada por `tests/Unit/Payment/MercadoPagoGatewayResilienceTest`.
- **Formato de expiração**: `const EXPIRATION_FORMAT = 'Y-m-d\TH:i:s.vP'` — com milissegundos, senão o MP devolve 400 e derruba todo checkout Pix.
- **Delegação cruzada**: `MercadoPagoGateway::getPayment()` reencaminha id não-numérico para o driver Orders, porque `(int) 'ORD…'` viraria 0.
- **Parsing defensivo**: `toResult()` lê tudo com `??` porque as propriedades de `MercadoPago\Resources\Payment` são tipadas sem default e o acesso a chave ausente lança `Error` (não `Exception`), passando por qualquer `catch (\Exception)`.

**Verificação de assinatura do webhook** — `app/Http/Controllers/Webhook/MercadoPagoController.php`:
1. `MercadoPago\Webhook\WebhookSignatureValidator::validate($x-signature, $x-request-id, strtolower($dataId), config('services.mercadopago.webhook_secret'), config('store.payment.webhook_tolerance_seconds'))`.
2. `strtolower($dataId)` é feito **do lado da aplicação** — comentário registra que do dx-php 3.12 em diante o SDK usa o id como recebe; sem isso todo webhook da Orders API (`ORD01…`, maiúsculo) volta 401.
3. **Re-check de janela próprio** (`timestampWithinTolerance()`): quando o motivo é `SignatureFailureReason::TIMESTAMP_OUT_OF_TOLERANCE`, o hash já foi validado, então a falha é de **unidade** — o validador compara contra `microtime(true)*1000` mas o MP assina `ts` em segundos. Heurística: `strlen >= 13` → milissegundos. Incidente citado: staging 29/07, Pix aprovado 03:44, três 401 às 03:45–03:47.
4. Idempotência: `WebhookEvent::firstOrCreate(['provider'=>'mercadopago','external_id'=>$notificationId])`; duplicata devolve `200 {"status":"duplicate"}`.
5. Tópicos processáveis: `private const PROCESSABLE_TOPICS = ['payment','order']` — o resto grava `status = 'ignored'` (comentário: a lista oficial do MP é incompleta, não vira `switch` fechado).
6. Nunca confia no corpo: despacha `ProcessMercadoPagoWebhookJob` que busca o payment na API.

**Tradução de erros** — três camadas distintas, cada uma com path próprio:

| Camada | Path | O que faz |
|---|---|---|
| Gateway → domínio | `app/Services/Payment/MercadoPagoOrdersGateway.php:42` `STATUS_MAP` | `action_required→pending`, `processed→approved`, `processing→in_process`, `failed→rejected`, `canceled→cancelled`, `refunded→refunded`, `charged_back→charged_back`, `expired→cancelled`. Desconhecido **passa cru** (não vira aprovado); ausente vira `STATUS_UNKNOWN = 'unknown'`, que nenhum `is*()` casa → job vira no-op |
| Domínio → tela (status) | `app/Support/PaymentStatusLabel.php` | mapa `LABELS` com 8 entradas e fallback que devolve o termo cru do MP |
| Exceção → mensagem ao comprador | `app/Services/Payment/PaymentException.php` + `app/Http/Controllers/Shop/CheckoutController.php:27-36` | `PaymentException::declined($reason)` separa recusa do emissor de falha de sistema; o controller escolhe entre "O banco não autorizou esse cartão. Tente outro cartão ou pague com Pix." e "Não conseguimos iniciar o pagamento agora. Tente novamente em instantes." O `declineReason` (slug do MP) é só log, nunca tela. `withContext()`/`context()` alimenta o `report()` do handler — comentário: **só identificador, nunca PII** |

**Falha de assinatura → rótulo acionável**: `signatureFailureReason()` devolve `secret_missing` quando `services.mercadopago.webhook_secret` é `''` (o SDK lança `InvalidArgumentException`, fora do enum). O docblock enumera os 4 motivos e a correção de cada um. A resposta ao chamador é sempre `401 {"error":"invalid signature"}` seco; o diagnóstico vai só para `Log::warning('mp.webhook.invalid_signature', ['request_id','reason','ts'])`.

**E-mail transacional** — `resend/resend-laravel ^1.4` (⊕). `MAIL_MAILER=resend` no `.env.example`; `config/services.php` expõe `resend.key` (⊖ o boilerplate já tem a mesma chave). `config/mail.php` do spinmax é **stock do Laravel 12** (116 L, mailers `smtp/ses/postmark/resend/sendmail/log/array/failover/roundrobin`, `default => env('MAIL_MAILER','log')`).

**CEP** — `app/Services/Shipping/CepResolver.php`: ViaCEP (`https://viacep.com.br/ws/{cep}/json/`) primário, `app/Services/Shipping/CepResolver.php::brasilApi()` como fallback, `Http::timeout(config('store.shipping.http_timeout'))` (3 s), cache por CEP (`cep:{cep}`, `config('store.shipping.cep_cache_days')` = 30 d). **Nunca lança** — devolve `null` e o front cai no UF manual.

**Storage / backup Cloudflare R2** — o disco R2 **não existe em `config/filesystems.php`** (o arquivo é byte-a-byte idêntico ao do boilerplate: `local`, `public`, `s3`; sem taps nem discos extras). A integração roda fora do Laravel:
- `scripts/backup-r2.sh` — dump MySQL → gzip → `gpg` com **chave pública** (o servidor só guarda a que cifra) → upload via `rclone` → confere o objeto → aplica retenção → avisa a aplicação. Config em `~/.spinmax-backup.env` (fora do repo, modo 600); `umask 077`. Tem modo `--check` de pré-voo.
- `app/Services/Store/BackupStatus.php` — a ponta de dentro: 3 chaves em `store_settings` (`backup.last_success`, `backup.last_failure`, `backup.last_drill`). Chave ausente e chave ilegível devolvem ambas `null`, de propósito, para o healthcheck reprovar igual.
- `scripts/restore-drill.sh` — teste de restauração trimestral, fora do healthcheck (cobrado pelo `store:staging-check`).
- Outros: `scripts/provision-staging.sh`, `scripts/optimize-photos.sh`, `scripts/check-contrast.mjs`.

**Meta Pixel (Facebook)** — `resources/views/partials/meta-pixel.blade.php` (36 L), incluído em `resources/views/shop.blade.php:28` e `resources/views/landing.blade.php:83` (painel fica de fora, de propósito). Renderiza só com `config('services.spinmax.meta_pixel_id')` preenchido; usa `Illuminate\Support\Js::from()` no `fbq('init')` e `urlencode()` no `<noscript>`. **⚠ O `.env.example:118` transcreve o ID de produção da Spinmax em comentário** (valor redigido aqui como `***`).

**Marketplaces** — `config/services.php` → `spinmax.marketplaces.{primary,mercado_livre,shopee,amazon}`, sem default (comentário: os defaults antigos apontavam para a homepage dos marketplaces e o JSON-LD declarava `Offer` com URL errada para o Google).

**Auditoria** — `owen-it/laravel-auditing ^14.0` (⊕; boilerplate usa `spatie/laravel-activitylog ^5.0`, ⊖).

#### 3. `config/*.php` — 16 arquivos

| Path | L | Estado vs. boilerplate |
|---|---|---|
| `config/app.php` | 126 | `locale`/`faker_locale` = `en`/`en_US` (⊖ boilerplate já em `pt_BR`) |
| `config/auth.php` | 115 | **idêntico** |
| `config/cache.php` | 109 | `prefix` embute `APP_ENV`: `Str::slug(APP_NAME.'-'.APP_ENV,'_').'_cache_'` ⊕. Falta store `failover` e `serializable_classes` ⊖ |
| `config/database.php` | 177 | `redis.options.prefix` embute `APP_ENV` ⊕ (comentário: staging não pode consumir webhook de produção). Faltam `max_retries`/`backoff_*` do Redis ⊖ |
| `config/filesystems.php` | 80 | **idêntico** |
| `config/horizon.php` | 293 | ver abaixo |
| `config/inertia.php` | 55 | forma antiga (Inertia 2): `ssr.enabled/url` hardcoded + bloco `testing`. Boilerplate tem 142 L com `ssr.runtime/throw_on_error/ensure_*` e `pages` ⊖ |
| `config/log-viewer.php` | 237 | **idêntico** |
| `config/logging.php` | 136 | ver abaixo |
| `config/mail.php` | 116 | stock Laravel; **sem** o bloco `allowlist`/`test_inbox` que o boilerplate tem ⊖ (o spinmax coloca isso em `store.mail`) |
| `config/queue.php` | 112 | **idêntico** (redis `retry_after` = `env('REDIS_QUEUE_RETRY_AFTER', 90)`) |
| `config/services.php` | 76 | +`mercadopago`, +`spinmax` ⊕ |
| `config/session.php` | 217 | `cookie` usa `Str::slug(APP_NAME,'_').'_session'` (separador `_`) |
| `config/audit.php` | 206 | **não-padrão** ⊕ |
| `config/store.php` | 537 | **não-padrão** ⊕ — o config de domínio do projeto |
| `config/ziggy.php` | 23 | **não-padrão** ⊕ |

**`config/store.php` (537 L)** — chaves, todas com bloco de comentário justificando a decisão e a data:

| Chave | Conteúdo |
|---|---|
| `enabled` | default inicial do kill switch (`STORE_ENABLED`); valor efetivo vive em `store_settings` |
| `timezone` | `STORE_TIMEZONE`, default `America/Sao_Paulo` — fuso do **negócio**, distinto de `app.timezone` (UTC). Consumido por `App\Support\BusinessTime`; espelho no front em `resources/js/utils/format/datetime.ts` |
| `quantity.min/max` | 1 / 10 — piso; teto real é a setting `max_quantity` |
| `launch.badge_text` | selo de escassez, com marcadores `{restantes}` e `{unidades}` (concordância) |
| `installments.max` | 12 — **teto do que o painel pode escolher**, não valor vigente |
| `pix_discount.max_percent` | 20 — reaplicado na leitura por `App\Services\Store\PixDiscount` porque a setting é key/value sem validação |
| `order.expires_after_minutes` / `pix_expires_after_minutes` | 120 / 60 |
| `payment.api` | `MP_PAYMENT_API`, default `payments` |
| `payment.statement_descriptor` | `SPINMAX` |
| `payment.webhook_tolerance_seconds` | 300 |
| `payment.gateway_timeout_seconds` | 10 (com a conta `4×t + 3,5s < 60s`) |
| `payment.lock_wait_seconds` | 10 |
| `payment.reconcile_after_minutes` | 10 |
| `mail.reply_to` | `STORE_REPLY_TO`, default `sac@***` |
| `mail.allowlist` | `STORE_MAIL_ALLOWLIST` explodida por vírgula, trim, filter — aceita e-mail exato ou `@dominio` |
| `mail.test_inbox` | `STORE_MAIL_TEST_INBOX` |
| `health.heartbeat_max_age_minutes` | 5 |
| `health.backup_max_age_hours` | `(int) env(...,26) ?: 26` — o `?:` cobre o `CHAVE=` vazio que o `cp .env.example .env` do CI produz |
| `health.backup_drill_max_age_days` | idem, 90 |
| `webhooks.retention_days` | 90 |
| `variants.enabled` | `STORE_VARIANTS_ENABLED`, default `false` — flag de **ambiente**, não setting, com o argumento escrito |
| `catalog.product` | slug/nome/descrição/peso/dimensões — fonte única lida por `store:bootstrap` e `StoreSeeder` |
| `catalog.photos` | lista explícita com `src` + `alt` escrito à mão (embalagem primeiro, com o motivo) |
| `catalog.box_contents` | irmão de `photos`, nunca dentro de `product` (senão `MassAssignmentException` no seed) |
| `catalog.variants` | 3 SKUs (`SPX-N1/N2/N3`) com `coming_soon` — só vale na criação |
| `legal.path` | `null` = `resource_path('legal')` resolvido em runtime (caminho absoluto seria congelado por `config:cache`) |
| `company.{name,razao_social,cnpj,address,privacy_url,whatsapp,contact_email}` | identificação legal; `razao_social` com `?:` de fallback |
| `order_number.prefix/pad` | `SPX-` / 6 |
| `shipping.{service_label,local_service_label,cep_cache_days,http_timeout,placeholder_rates}` | `placeholder_rates` cobre 3 regiões (`sp`, `sul_sudeste_co`, `norte_nordeste`), nasce `is_placeholder = true` e o `TableRateDriver` filtra em produção |
| `settings.*` | defaults das settings editáveis: `store.enabled`, `free_shipping_min_cents`, `handling_days`, `notify_email`, `max_installments`, `launch_price_cents`, `launch_units_limit` (os dois últimos nulos de propósito) |
| `alert_email` | `STORE_ALERT_EMAIL` — destinatário **técnico**, fora do array `settings` justamente para não ser editável no painel; cai em `notify_email` quando vazio |
| `super_user.{name,email,password}` | `SUPER_USER_*`. `password` **sem default** — o comando recusa rodar. `name`/`email` têm default com **nome e e-mail reais** hardcoded no config (valores redigidos: `***`) |

**`config/audit.php` (206 L)** — publicado do `owen-it/laravel-auditing` com 2 desvios: `user.resolver => App\Resolvers\AuditUserResolver::class` e `queue.connection => env('AUDIT_QUEUE_CONNECTION','redis')`. O comentário do segundo registra o bug que motivou: a conexão estava fixa em `redis`, o `QUEUE_CONNECTION=sync` do `phpunit.xml` não valia, e todo teste que gravasse modelo auditado morria com `RedisException` no CI. Demais: `driver database`, tabela `audits`, eventos `created/updated/deleted/restored`, `console => false`, `timestamps => false`, `strict => false`, `threshold => 0`.

**`config/ziggy.php` (23 L)** ⊕ — um único grupo `shop` com `['home','shop.*','legal.*','api.shipping.*']`. Comentário: a superfície administrativa nunca é serializada para o browser do comprador (`@routes('shop')` + `new Ziggy('shop')` no middleware).

#### 4. `config/logging.php`, `config/mail.php`, `config/filesystems.php` — discos, canais, taps

**`config/logging.php` (136 L)** — mesma estrutura do boilerplate, tap com nome diferente:

| Canal | Tap no spinmax | Tap no boilerplate |
|---|---|---|
| `stack` | *(nenhum)* | `PiiAwareTap` ⊖ |
| `single` | `App\Support\ScrubPiiFromLogs` | `App\Support\Logging\PiiAwareTap` |
| `daily` | `App\Support\ScrubPiiFromLogs` | `App\Support\Logging\PiiAwareTap` |
| `stderr` | `App\Support\ScrubPiiFromLogs` ⊕ | *(nenhum)* |
| `slack`, `papertrail`, `syslog`, `errorlog`, `null`, `emergency` | sem tap | sem tap |

Implementação do scrub: `app/Support/ScrubPiiFromLogs.php` + `app/Support/PiiScrubber.php` (o boilerplate tem o equivalente em `app/Listeners/PiiAwareTap.php`, `PiiScrubber.php`, `PiiScrubbingProcessor.php`). O `PiiScrubber` também é chamado fora do logging, em `app/Listeners/Store/SendFailedJobAlert.php`.

**`config/mail.php` (116 L)** — stock. Não tem tap nem allowlist; a trava de staging mora em `config/store.php` + `app/Listeners/Store/EnforceMailAllowlist.php` (114 L), registrado em `app/Providers/AppServiceProvider.php:211` via `Event::listen(MessageSending::class, ...)`. O listener filtra `to` (com fallback para `test_inbox`), `cc` e `bcc` (sem fallback) e devolve `?bool` — comentário: `until()` só para em retorno não-nulo. Cobertura no `app/Console/Commands/StagingCheckCommand.php:250-260`, que exige allowlist **e** caixa preenchidas juntas ("allowlist preenchida com caixa vazia CANCELA o envio em vez de redirecionar").

**`config/filesystems.php` (80 L)** — idêntico ao boilerplate. Discos: `local` (`storage_path('app/private')`, `serve => true`), `public` (`env('APP_URL').'/storage'`), `s3` (envs AWS). Um link simbólico. **Sem disco R2** — o backup usa `rclone` fora da aplicação.

**`config/horizon.php` (293 L)** — 4 desvios do boilerplate, todos comentados:
1. `prefix` embute `APP_ENV` — obrigatório porque `Horizon::configureStandaloneConnection` **sobrescreve** o `options.prefix` da conexão, então o `REDIS_PREFIX` não alcança as chaves dele.
2. `waits`: `redis:payments => 30`, `redis:mail => 120`, `redis:default => 60` (boilerplate: só `redis:default => 60`).
3. Supervisor renomeado `supervisor-1` → **`store`**, `queue => ['payments','mail','default']` (ordem = prioridade com `balance: auto`), `tries 1→3`, `+backoff 10`, `timeout 60` com a invariante escrita: `timeout (60) < retry_after (90)`.
4. `environments`: `production.store.maxProcesses = 6`, **`staging` acrescentado** (2 processos, "divide o servidor com produção"), `local = 3`.

`app/Providers/HorizonServiceProvider.php` — `Horizon::routeMailNotificationsTo(config('store.alert_email') ?: config('store.notify_email'))` e `Gate::define('viewHorizon', fn => $user?->hasRole(Roles::SUPER_USER))`, com o comentário de que o gate publicado pelo `horizon:install` compara e-mail contra lista vazia e convida a colar e-mails no código.

#### 5. `.env.example` — 195 linhas, 51 chaves ativas + 31 comentadas

Padrão de escrita distintivo: **chaves opcionais ficam comentadas de propósito**, com o motivo repetido em 3 lugares — o CI faz `cp .env.example .env` e, no dotenv, `CHAVE=` vale string vazia, que **vence o default do `config/`**. Descomentar `STORE_ENABLED=` desligaria a loja; `STORE_COMPANY_NAME=` apagaria o rodapé legal; `STORE_BACKUP_MAX_AGE_HOURS=` viraria `(int) '' = 0`.

O arquivo tem ~90 linhas de comentário explicativo (rotação de `APP_KEY` e o ciphertext de `customers.cpf`; `LOG_LEVEL` de dev vs. `warning`+`daily` de produção; hardening de sessão; prefixo de Redis compartilhado; a invariante `retry_after > timeout`; separação `STORE_NOTIFY_EMAIL` × `STORE_ALERT_EMAIL`; geração da senha do super user com `openssl rand -base64 24`).

**Diff de chaves ativas contra `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/.env.example`** (51 no spinmax, 56 no boilerplate, 36 em comum):

⊕ **Só no spinmax (15)**

| Chave | Lida por |
|---|---|
| `MP_ACCESS_TOKEN` | `config/services.php` |
| `MP_PUBLIC_KEY` | `config/services.php` |
| `MP_WEBHOOK_SECRET` | `config/services.php` |
| `MP_PAYMENT_API` | `config/store.php` |
| `RESEND_KEY` | `config/services.php` (chave existe no `config` do boilerplate, mas não no `.env.example` dele) |
| `STORE_REPLY_TO` | `config/store.php` |
| `STORE_CONTACT_EMAIL` | `config/store.php` |
| `STORE_NOTIFY_EMAIL` | `config/store.php` |
| `STORE_ALERT_EMAIL` | `config/store.php` |
| `STORE_MAIL_ALLOWLIST` | `config/store.php` |
| `STORE_MAIL_TEST_INBOX` | `config/store.php` |
| `STORE_COMPANY_CNPJ` | `config/store.php` |
| `STORE_COMPANY_ADDRESS` | `config/store.php` |
| `STORE_WHATSAPP` | `config/store.php` |
| `SUPER_USER_PASSWORD` | `config/store.php` |

⊖ **Só no boilerplate (20)**: `ACTIVITYLOG_BUFFER_ENABLED`, `ACTIVITYLOG_ENABLED`, `AWS_ACCESS_KEY_ID`, `AWS_BUCKET`, `AWS_DEFAULT_REGION`, `AWS_SECRET_ACCESS_KEY`, `AWS_USE_PATH_STYLE_ENDPOINT`, `BROADCAST_CONNECTION`, `DB_DATABASE`, `DB_HOST`, `DB_PASSWORD`, `DB_PORT`, `DB_USERNAME`, `HORIZON_PATH`, `INERTIA_SSR_ENABLED`, `INERTIA_SSR_URL`, `LOG_VIEWER_API_ONLY`, `LOG_VIEWER_ENABLED`, `MAIL_ENCRYPTION`, `MEMCACHED_HOST`.
*(Nota: `DB_*` e `HORIZON_PATH` existem no spinmax **comentadas** — `DB_CONNECTION=sqlite` é o default ativo lá.)*

**Em comum (36)**: `APP_{DEBUG,ENV,FAKER_LOCALE,FALLBACK_LOCALE,KEY,LOCALE,MAINTENANCE_DRIVER,NAME,URL}`, `BCRYPT_ROUNDS`, `CACHE_STORE`, `DB_CONNECTION`, `FILESYSTEM_DISK`, `LOG_{CHANNEL,DEPRECATIONS_CHANNEL,LEVEL,STACK}`, `MAIL_{FROM_ADDRESS,FROM_NAME,HOST,MAILER,PASSWORD,PORT,USERNAME}`, `PHP_CLI_SERVER_WORKERS`, `QUEUE_CONNECTION`, `REDIS_{CLIENT,HOST,PASSWORD,PORT}`, `SESSION_{DOMAIN,DRIVER,ENCRYPT,LIFETIME,PATH}`, `VITE_APP_NAME`.

**Chaves comentadas — só no spinmax (⊕, 22)**: `APP_PREVIOUS_KEYS`, `LOG_DAILY_DAYS`, `META_PIXEL_ID`, `REDIS_PREFIX`, `REDIS_QUEUE_RETRY_AFTER`, `SESSION_HTTP_ONLY`, `SPINMAX_MARKETPLACE_{PRIMARY,ML,SHOPEE,AMAZON}_URL`, `STORE_{BACKUP_DRILL_MAX_AGE_DAYS,BACKUP_MAX_AGE_HOURS,COMPANY_NAME,COMPANY_RAZAO_SOCIAL,ENABLED,PRIVACY_URL,SHIPPING_LABEL,VARIANTS_ENABLED}`, `SUPER_USER_EMAIL`, `SUPER_USER_NAME`, `DB_{DATABASE,HOST,PASSWORD,PORT,USERNAME}`, `HORIZON_PATH`, `HORIZON_PREFIX`.
**Comentadas só no boilerplate (⊖, 9)**: `HORIZON_DOMAIN`, `HORIZON_NAME`, `INERTIA_ENCRYPT_HISTORY`, `INERTIA_SSR_RUNTIME`, `LOG_VIEWER_{API_STATEFUL_DOMAINS,CACHE_DRIVER,PRODUCTION_TOKEN}`, `TRUSTED_PROXIES`.
**Comentadas em ambos (3)**: `APP_MAINTENANCE_STORE`, `CACHE_PREFIX`, `HORIZON_PREFIX`, `SESSION_SAME_SITE`, `SESSION_SECURE_COOKIE`.

**⚠ Valores sensíveis presentes no `.env.example` (redigidos):** `.env.example:118` traz o **ID do Meta Pixel de produção da Spinmax** em texto de comentário (`***`); `MAIL_FROM_ADDRESS` traz o endereço de produção (`***`); `config/store.php` traz **nome e e-mail reais** nos defaults de `super_user` (`***`).

**Não lidos, por guardrail**: `.env` e `.env.staging` existem na raiz mas não foram abertos.

#### 6. `lang/` — 1 idioma (`pt_BR`), 5 arquivos

| Path | Chaves (aprox.) | Linhas | vs. boilerplate |
|---|---|---|---|
| `lang/pt_BR/validation.php` | ~230 | 312 | ⊕ **63 chaves a mais** que as ~167 do boilerplate |
| `lang/pt_BR/passwords.php` | 5 | 13 | paridade (5 chaves, 11 L) |
| `lang/pt_BR/auth.php` | 3 | 11 | paridade (3 chaves, 9 L) |
| `lang/pt_BR/pagination.php` | 2 | 10 | paridade (2 chaves, 8 L) |
| `lang/pt_BR.json` | 5 | — | ⊕ **não existe no boilerplate** |

`lang/pt_BR.json` traduz as 5 strings do **layout de e-mail do Laravel**: `"All rights reserved."`, `"Whoops!"`, `"Hello!"`, `"Regards"` e a frase longa do `subcopy` com `:actionText`.

`lang/pt_BR/validation.php` tem três partes além do stock:
1. **Header de 17 linhas** registrando o bug de origem: `APP_LOCALE`/`APP_FALLBACK_LOCALE` em `pt_BR` sem diretório `lang/` fazia o Laravel devolver a **chave crua** — um `min:1` mostrava literalmente `validation.min.numeric` no `<InputError>` de toda tela do painel e do checkout.
2. **`'custom'`** (linhas 189-224) — 8 blocos de mensagem por campo, todos para campos de **dinheiro em centavos**, porque a mensagem genérica de `min:1` sai "deve ser no mínimo 1" e o leitor entende "R$ 1,00": `variants.*.price_cents`, `rates.*.price_cents`, `cities.*.city`, `cities.*.uf`, `cities.*.price_cents`, `free_shipping_min_cents`, `launch_price_cents`, `launch_units_limit`. Usa notação `*`, com o comentário explicando que o tradutor resolve `custom.variants.0.price_cents.min` via `custom.variants.*.price_cents.min`.
3. **`'attributes'`** (linha 225 em diante) — nomes de campo em português, agrupados por seção comentada ("Conta / autenticação", "Configurações da loja", …): `name`, `email`, `password`, `password_confirmation`, `current_password`, `role_id`, `is_active`, `permission`, `can_impersonate_any`, `store_enabled`, `free_shipping_min_cents`, `handling_days`, `notify_email`, `max_installments`, `launch_price_cents`, `launch_units_limit`, `company_razao_social`, …

Notar a contradição interna: `config/app.php` do spinmax tem `locale => env('APP_LOCALE','en')` e `faker_locale => 'en_US'`, mas o `.env.example` seta `APP_LOCALE` e o header do `validation.php` afirma que ambos são `pt_BR` — o default do config e a premissa do arquivo de tradução divergem.

#### Limitações

- Nenhum comando foi executado no projeto-fonte (guardrail): não há verificação de `config:cache`, nem de que a suíte cobre o que os comentários afirmam.
- `.env` e `.env.staging` não foram abertos, então não há como confirmar quais chaves comentadas estão de fato preenchidas em produção/staging (o próprio `config/store.php` alerta que `STORE_REPLY_TO` no `.env` do servidor venceria a unificação de 06/08).
- Contagens de chaves de `lang/*.php` são por regex `^\s*'…'\s*=>` — chaves aninhadas contam individualmente, então são aproximações, não exatas.

---

### Frontend — páginas, componentes, hooks, utils

**Escopo medido:** 209 arquivos em `resources/js/` (~19.000 LOC entre pages/components/hooks/utils/types/layouts) + 5 arquivos em `resources/css/`. HEAD `e4ec01e`.

#### 1. Convenção de nomes (real, não declarada)

| Convenção | Evidência |
|---|---|
| **kebab-case** para arquivos (dominante) | 207 de 209 arquivos |
| Exceções vivas (camelCase/PascalCase) | `resources/js/hooks/useUserSearch.ts`, `resources/js/layouts/permissions/PermissionsGuard.tsx` |
| Componentes funcionais tipados, `export function X` nomeado no painel; `export default function X` nas páginas e em `components/shop/*` | `components/shop/order-summary.tsx`, `components/shop/pix-panel.tsx`, `components/shop/payment-brick.tsx`, `components/shop/product-gallery.tsx`, `components/shop/quantity-selector.tsx` usam `export default` |
| Layout por módulo (`pages/{mod}`, `components/{mod}`, `hooks/{mod}`, `utils/{mod}`, `types/{mod}.d.ts`) | seguido em `users`, `permissions`, `settings`, `store`, `shop`, `data-table` |
| Alias `@/` → `resources/js` | `tsconfig.json:114-116`, `vite.config.ts` (`resolve.alias`) |

A árvore de `components/` é **idêntica à do boilerplate** exceto por duas pastas: `components/shop/` e `components/store/` (⊕). Idem `components/users/`, `components/data-table/`, `components/permissions/`, `components/settings/` — mesmos arquivos, nome por nome.

---

#### 2. `pages/` — 29 páginas, 6.286 LOC

| Módulo | Path | LOC | Layout |
|---|---|---|---|
| raiz | `resources/js/pages/dashboard.tsx` | 276 | AppLayout |
| auth | `resources/js/pages/auth/login.tsx` | 103 | AuthLayout |
| auth | `resources/js/pages/auth/reset-password.tsx` | 98 | AuthLayout |
| auth | `resources/js/pages/auth/forgot-password.tsx` | 63 | AuthLayout |
| auth | `resources/js/pages/auth/confirm-password.tsx` | 57 | AuthLayout |
| auth | `resources/js/pages/auth/verify-email.tsx` | 41 | AuthLayout |
| users | `resources/js/pages/users/index.tsx` | 415 | AppLayout |
| users | `resources/js/pages/users/show.tsx` | 321 | AppLayout |
| users | `resources/js/pages/users/permissions.tsx` | 276 | AppLayout |
| users | `resources/js/pages/users/create.tsx` | 67 | AppLayout |
| users | `resources/js/pages/users/edit.tsx` | 66 | AppLayout |
| permission-role | `resources/js/pages/permission-role/roles.tsx` | 271 | AppLayout |
| settings | `resources/js/pages/settings/profile.tsx` | 265 | AppLayout |
| settings | `resources/js/pages/settings/password.tsx` | 222 | AppLayout |
| settings | `resources/js/pages/settings/appearance.tsx` | 113 | AppLayout |
| **shop** ⊕ | `resources/js/pages/shop/checkout.tsx` | 647 | ShopLayout |
| **shop** ⊕ | `resources/js/pages/shop/buy.tsx` | 258 | ShopLayout |
| **shop** ⊕ | `resources/js/pages/shop/order-status.tsx` | 252 | ShopLayout |
| **shop** ⊕ | `resources/js/pages/shop/order-lookup.tsx` | 69 | ShopLayout |
| **shop** ⊕ | `resources/js/pages/shop/store-unavailable.tsx` | 47 | ShopLayout |
| **shop** ⊕ | `resources/js/pages/shop/legal.tsx` | 40 | ShopLayout |
| **store** ⊕ | `resources/js/pages/store/settings.tsx` | 501 | StoreSettingsLayout |
| **store** ⊕ | `resources/js/pages/store/orders/index.tsx` | 461 | AppLayout |
| **store** ⊕ | `resources/js/pages/store/variants.tsx` | 314 | StoreSettingsLayout |
| **store** ⊕ | `resources/js/pages/store/customers/index.tsx` | 266 | AppLayout |
| **store** ⊕ | `resources/js/pages/store/shipping-rates.tsx` | 193 | StoreSettingsLayout |
| **store** ⊕ | `resources/js/pages/store/orders/show.tsx` | 179 | AppLayout |
| **store** ⊕ | `resources/js/pages/store/customers/show.tsx` | 129 | AppLayout |

⊖ O boilerplate tem `pages/auth/register.tsx` e `pages/errors/error-page.tsx`; o spinmax não tem nenhum dos dois.

Padrões internos notáveis:
- `pages/shop/checkout.tsx:22` — único `React.lazy` do projeto: `const PaymentBrick = lazy(() => import('@/components/shop/payment-brick'))` (SDK do Mercado Pago fora do bundle inicial). Subcomponentes locais `Section`/`Field`/`PaymentTab` (linhas 570/586/608).
- `pages/shop/order-status.tsx:43-57` — polling manual com `window.setInterval` + `fetch` num endpoint de status, e `router.reload()` quando `poll.settled`. Não usa `usePoll` do Inertia.
- `pages/dashboard.tsx:54` — subcomponente `Stat` local; props `orders/revenue/health` com contador `orders.stale`.

---

#### 3. `components/` — 96 arquivos, 8.875 LOC

**`components/ui/` (30 primitivos)** — todos shadcn/Radix, listados um a um:

`alert.tsx` (66) · `avatar.tsx` (51) · `badge.tsx` (46) · `breadcrumb.tsx` (109) · `button.tsx` (75) · `card.tsx` (68) · `checkbox.tsx` (30) · `collapsible.tsx` (33) · `currency-input.tsx` (74) · `date-input.tsx` (86) · `dialog.tsx` (134) · `dropdown-menu.tsx` (255) · `icon.tsx` (14) · `input.tsx` (31) · **`integer-input.tsx` (72) ⊕** · `label.tsx` (22) · `masked-input.tsx` (99) · `navigation-menu.tsx` (168) · `placeholder-pattern.tsx` (20) · `select.tsx` (179) · `separator.tsx` (26) · `sheet.tsx` (137) · `sidebar.tsx` (722) · `skeleton.tsx` (14) · `table.tsx` (74) · `textarea.tsx` (21) · `toast-provider.tsx` (19) · `toggle-group.tsx` (71) · `toggle.tsx` (45) · `tooltip.tsx` (60)

- ⊕ `components/ui/integer-input.tsx` — inteiro em `type="text"` + `inputMode="numeric"`, clamp de min/max **no blur** (não no keystroke), `value: number | null` para permitir campo vazio, opção `groupThousands`. Justificativa documentada no próprio arquivo (4 defeitos de `type="number"`).
- ⊖ O boilerplate tem `ui/confirm-dialog.tsx` e `ui/form-field.tsx`; o spinmax não.
- ⊕ `components/ui/button.tsx:29-33` — variante **`brand`** ausente do boilerplate: pill coral com glow, `bg-[var(--sm-cta-bg,#ff4d67)]`, `rounded-full`, e `size` com alturas de toque na base + `md:` devolvendo densidade de mouse. O `focus-visible:ring` também diverge (`ring-ring/50` vs `ring-ring` do boilerplate).
- `.prettierignore` isenta `resources/js/components/ui/*` do Prettier (mesma política do boilerplate).

**`components/shop/` (7 arquivos) ⊕ — nenhum existe no boilerplate**

| Path | LOC | Expõe |
|---|---|---|
| `resources/js/components/shop/product-gallery.tsx` | 162 | `default ProductGallery({photos, className})` |
| `resources/js/components/shop/order-summary.tsx` | 124 | `default OrderSummary` |
| `resources/js/components/shop/pix-panel.tsx` | 94 | `default PixPanel({qrCodeBase64, copyPaste, expiresInSeconds})` |
| `resources/js/components/shop/payment-brick.tsx` | 60 | `default PaymentBrick({publicKey, amountReais, maxInstallments, payerEmail, onToken, onError})` |
| `resources/js/components/shop/quantity-selector.tsx` | 54 | `default QuantitySelector({value, onChange, min, max, disabled})` |
| `resources/js/components/shop/company-legal.tsx` | 21 | `CompanyLegal({razaoSocial, cnpj, address})` |

**`components/store/` (9 arquivos) ⊕ — nenhum existe no boilerplate**

| Path | LOC | Expõe |
|---|---|---|
| `resources/js/components/store/order-actions.tsx` | 567 | `OrderActions({order})` + 7 subcomponentes internos: `TrackingFields` (35), `ShipDialog` (79), `EditTrackingDialog` (152), `DeliverDialog` (245), `CancelDialog` (284), `ResendDialog` (374), `SeparationControl` (447); consts `RESEND_OPTIONS`, `TRACKING_PATTERN = 'AA123456789BR'` |
| `resources/js/components/store/city-shipping-rates.tsx` | 287 | `CityShippingRates({cities, ufs, localLabel})` |
| `resources/js/components/store/nf-block.tsx` | 205 | `buildNfText(order)` (gerador de texto de NF) + `NfBlock({order})` + `CopyField` interno |
| `resources/js/components/store/order-timeline.tsx` | 50 | `OrderTimeline({entries})` |
| `resources/js/components/store/store-form-card.tsx` | 52 | `StoreFormCard({title, description, onSubmit, processing, submitLabel, dirty, children, className})` |
| `resources/js/components/store/payment-method-label.tsx` | 35 | `paymentMethodLabel(method)` + `PaymentMethodLabel` |
| `resources/js/components/store/separation-badge.tsx` | 22 | `SeparationBadge({className})` |
| `resources/js/components/store/status-badge.tsx` | 19 | `StatusBadge({status, label, className})` |

**Demais pastas** (todas presentes no boilerplate com os mesmos nomes de arquivo):

- `components/data-table/`: `date-range-filter.tsx` (91), `search-bar.tsx` (80), `table-header.tsx` (55, exporta `DataTableHeader`), `pagination.tsx` (45), `filter-toggle.tsx` (30).
- `components/users/`: `filter-panel.tsx` (177), `user-table-row.tsx` (164, `React.memo`), `user-actions-menu.tsx` (157), `user-show-info-dialog.tsx` (104), `user-info-dialog.tsx` (99).
- `components/permissions/`: `role-users-table.tsx` (166), `role-info-dialog.tsx` (79), `roles-sidebar.tsx` (57), `permission-card.tsx` (50).
- `components/settings/`: `appearance-info-dialog.tsx` (90), `password-info-dialog.tsx` (87), `delete-account-info-dialog.tsx` (86), `settings-sidebar.tsx` (85), `profile-info-dialog.tsx` (83).
- `components/dialogs/module-info-dialog.tsx` (67), `components/layout/page-header.tsx` (69, exporta `PageHeader` + `PageHeaderAction`).
- Raiz: `ui/sidebar.tsx`-relacionados e utilitários — `user-form.tsx` (381), `delete-confirmation-dialog.tsx` (264), `add-permission-dialog.tsx` (226), `user-details-dialog.tsx` (218), `assign-role-user.tsx` (215), `app-header.tsx` (182), `nav-main.tsx` (118), `app-sidebar.tsx` (112), `page-info.tsx` (100), `delete-user.tsx` (96), `appearance-dropdown.tsx` (53), `empty-state.tsx` (44, usa primitivos do `@radix-ui/themes` — `Box/Flex/Table/Text`), `user-menu-content.tsx` (40), `nav-user.tsx` (36), `nav-footer.tsx` (34), `impersonate-banner.tsx` (34), `breadcrumbs.tsx` (34), `appearance-tabs.tsx` (34), `app-shell.tsx` (29), `user-info.tsx` (22), `text-link.tsx` (19), `app-content.tsx` (18), `app-sidebar-header.tsx` (14), `app-logo.tsx` (12), `icon.tsx` (11), `input-error.tsx` (10), `app-logo-icon.tsx` (9), `heading.tsx` (8), `heading-small.tsx` (8).

**Divergência funcional relevante nos comuns:**
- ⊕ `resources/js/components/nav-main.tsx` (82 linhas de diff vs boilerplate) — suporta **grupos recolhíveis** (`Collapsible` + `SidebarMenuSub`): `filteredItems` filtra o grupo pelos **filhos** (grupo com permissões mistas aparece se o usuário puder abrir ao menos um filho), `isGroupOpen` abre o grupo quando um filho está ativo, `isItemActive` ignora query string e hash.
- ⊕ `resources/js/types/index.d.ts` — `NavItem.children?: NavItem[]` (o boilerplate não tem `children`).
- ⊕ `resources/js/components/app-sidebar.tsx` — grupo `Loja` com 3 filhos (`Produto`/`Frete`/`Configurações`), item `Pedidos` com URL pré-filtrada `/store/orders?status=paid`, e `footerNavItems` com "Ver site" → `/` (aba nova).

---

#### 4. `layouts/` — 11 arquivos, 440 LOC

| Path | LOC | Notas |
|---|---|---|
| `resources/js/layouts/store/settings-layout.tsx` ⊕ | 103 | Casca das 3 telas de config da loja: abas `TABS` filtradas por `hasPermission`, breadcrumb de 2 níveis derivado de `page.url`, botão "Ver na loja" (`/comprar`, aba nova) |
| `resources/js/layouts/shop-layout.tsx` ⊕ | 85 | Header/footer do funil público; `<Head>` com `meta description` e **`noindex` por padrão** (`indexable` opt-in); âncora nativa `<a href={route('home')}>` (a landing é Blade, `<Link>` cairia no modal de erro do Inertia); alvos de toque `min-h-11 md:min-h-0`; chama `useFlashMessages()` |
| `resources/js/layouts/auth/auth-split-layout.tsx` | 47 | |
| `resources/js/layouts/permissions/layout.tsx` | 44 | |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | 41 | |
| `resources/js/layouts/auth/auth-card-layout.tsx` | 37 | |
| `resources/js/layouts/auth/auth-simple-layout.tsx` | 34 | |
| `resources/js/layouts/app/app-header-layout.tsx` | 14 | |
| `resources/js/layouts/app-layout.tsx` | 14 | |
| `resources/js/layouts/permissions/PermissionsGuard.tsx` | 11 | |
| `resources/js/layouts/auth-layout.tsx` | 10 | |

⊖ O boilerplate tem `layouts/settings/layout.tsx`; o spinmax não (as páginas de settings montam `AppLayout` direto).

---

#### 5. `hooks/` — 16 arquivos

| Path | Expõe |
|---|---|
| `resources/js/hooks/use-appearance.tsx` | `Appearance`, `initializeTheme()`, `useAppearance()` — ⊕ além da classe `.dark`, escreve `data-theme` e `data-theme-source` no `<html>` (a `landing.css` casa `[data-theme]`) |
| `resources/js/hooks/use-flash-messages.tsx` ⊕ | `useFlashMessages()` — lê `page.props.flash`, dedupe por `Map<string, timestamp>` global + `setInterval` de limpeza (10s de TTL, varredura a cada 5s) pendurado em `window.__flashCleanupInterval`; chave `${url}::${JSON.stringify(flash)}` |
| `resources/js/hooks/use-countdown.ts` ⊕ | `Countdown`, `useCountdown(totalSeconds)` — calcula restante a partir de um **deadline de relógio**, não decremento (aba em background estrangula timer) |
| `resources/js/hooks/use-shop.ts` ⊕ | `useShop(): ShopSharedProps` — lê `usePage().props.shop` |
| `resources/js/hooks/use-permissions.ts` | `usePermissions()` |
| `resources/js/hooks/use-initials.tsx` | `useInitials()` |
| `resources/js/hooks/use-mobile.tsx` | `useIsMobile()` |
| `resources/js/hooks/use-mobile-navigation.ts` | `useMobileNavigation()` |
| `resources/js/hooks/useUserSearch.ts` ⊕ | `UserSearchParams`, `UseUserSearchOptions`, `default useUserSearch({users, initialFilters, routeName, debounceMs=300})` — arquivo em camelCase; o boilerplate tem o equivalente em `hooks/use-user-search.ts` |
| `resources/js/hooks/users/use-user-filters.ts` | `UseUserFiltersOptions`, `UseUserFiltersReturn`, `useUserFilters()` |
| `resources/js/hooks/users/use-user-actions.ts` | `UseUserActionsOptions`, `useUserActions()` |
| `resources/js/hooks/users/use-user-permissions.ts` | `useUserPermissions()` |
| `resources/js/hooks/users/use-user-modals.ts` | `useUserModals()` |
| `resources/js/hooks/permissions/use-permission-actions.ts` | `UsePermissionActionsOptions`, `UsePermissionActionsReturn`, `usePermissionActions()` |
| `resources/js/hooks/permissions/use-permission-permissions.ts` | `usePermissionPermissions()` |
| `resources/js/hooks/settings/use-settings-actions.ts` | `useSettingsActions()` |

⊖ O boilerplate tem `hooks/use-debounced-value.ts`; o spinmax não (o debounce vive inline em `useUserSearch`/`use-user-filters`).

---

#### 6. `lib/` — 4 arquivos

| Path | Expõe |
|---|---|
| `resources/js/lib/meta-pixel.ts` ⊕ (81) | `PurchasePayload`, `trackPurchase(purchase)` — dedupe por `Set<event_id>` + `eventID` para deduplicar contra a Conversions API; `trackInertiaPageViews()` — `router.on('navigate')` **descartando a primeira navegação** (o Inertia dispara `navigate` na carga inicial, que o snippet do `<head>` já contou); devolve a função de unsubscribe |
| `resources/js/lib/status-colors.ts` ⊕ (66) | `STATUS_BADGE_CLASSES`, `STATUS_HERO_CLASSES`, `STATUS_COLORS`, `STATUS_LABELS` — todos `Record<>` tipados por `OrderStatusValue`/`StatusColor` |
| `resources/js/lib/toast-config.ts` (102) | `toastDefaultOptions`, `toastSuccessOptions`, `toastErrorOptions`, `toastWarningOptions`, `toastInfoOptions` |
| `resources/js/lib/utils.ts` (6) | `cn()` |

⊖ O boilerplate tem `lib/flash.ts` (`showFlash`, `registerFlashListener` — flash nativo do Inertia 3), `lib/resolve-inertia-page.tsx`, `lib/form-styles.ts` (`FORM_CONTROL_LABEL_CLASSNAME`) e `lib/impersonation.ts` (`startImpersonation`/`stopImpersonation`); o spinmax não tem nenhum dos quatro.

---

#### 7. `utils/` — 8 arquivos

| Path | Expõe |
|---|---|
| `resources/js/utils/format/money.ts` (174) | `formatCentsToBRL`, `centsToReais` ⊕, `pixDiscountCents(subtotalCents, percent)` ⊕, `formatCentsToInput` ⊕, `parseInputToCents` ⊕, `tryParseInputToCents` ⊕, `formatCentsToMasked`, `maskCurrencyInput(raw, maxCents=99_999_999)` |
| `resources/js/utils/format/masks.ts` (103) | `removeNonNumeric`, `applyCpfMask`, `applyCnpjMask`, `applyCpfCnpjMask`, `applyPhoneMask`, `applyMobileMask`, `applyPhoneAutoMask`, `applyCepMask`, `removeMask` — assinatura idêntica à do boilerplate |
| `resources/js/utils/format/datetime.ts` ⊕ (104) | `todayBusinessISO()` (dia útil), `shiftISODate(date, days)`, `formatDateTime(iso)`, `formatDate(iso)` |
| `resources/js/utils/format/plural.ts` ⊕ (7) | `plural(count, singular, pluralForm)` |
| `resources/js/utils/users/permissions.ts` (163) | `PermissionCheckContext`, `canDeleteUser`, `canEditUser`, `canImpersonateUser`, `canAssignRole`, `canRevokeRole`, `canManageUserPermissions`, `canToggleUserActive`, `getUserPermissionChecks` |
| `resources/js/utils/users/user-helpers.ts` (90) | `getUserInitials`, `isValidUser`, `formatUserDisplayName`, `hasRole`, `getUserRoleLabel`, `isUserActive`, `getUserEmail`, `getUserPhone`, `hasCustomPermissions`, `getCustomPermissions` |
| `resources/js/utils/users/constants.ts` (54) | `SUPER_USER_ROLE`, `ADMIN_ROLE`, `SEARCH_DEBOUNCE_DELAY=300`, `DEFAULT_PER_PAGE=15`, `DEFAULT_SORT_BY`, `DEFAULT_SORT_ORDER`, `ALLOWED_SORT_FIELDS`, `PERMISSION_MANAGE_USERS`, `PERMISSION_ASSIGN_ROLES`, `PERMISSION_IMPERSONATE_USERS`, `USER_AVATAR_SIZE`, `TABLE_ROW_HOVER_CLASSES`, `INVALID_FILTER_VALUES` |
| `resources/js/utils/data-table/query-params.ts` (106) | `isValidFilterValue`, `sanitizeQueryParams`, `buildQueryParams`, `mergeQueryParams`, `clearQueryParams`, `buildPaginationParams`, `buildSortParams` |

⊖ O boilerplate tem `utils/data-table/date.ts` (`todayISO`, `shiftISODate`), `utils/data-table/constants.ts` e `utils/via-cep.ts` (`fetchViaCep`); o spinmax não — `shiftISODate` vive em `utils/format/datetime.ts` e a variante de "hoje" é `todayBusinessISO()` (dia útil), não `todayISO()`. `money.ts` diverge em 154 linhas: o boilerplate tem `formatMoney`/`isNegativeMoney`/`toCents`/`fromCents`, ausentes aqui.

---

#### 8. `types/` — 10 arquivos, 1.075 LOC

| Path | LOC | Conteúdo |
|---|---|---|
| `resources/js/types/store.d.ts` ⊕ | 363 | 30 tipos: `PaymentMethodValue`, `OrderStatusValue`, `StatusColor`, `StatusOption`, `StorePagination`, `OrderAddress`, `OrderRow`, `OrderCounters`, `SeparationFilter`, `OrderIndexFilters`, `OrdersIndexPageProps`, `OrderItem`, `OrderNf`, `OrderCustomerSummary`, `TimelineEntry`, `OrderPayment`, `OrderDetail`, `OrderShowPageProps`, `CustomerRow`, `CustomerIndexFilters`, `CustomersIndexPageProps`, `CustomerOrderRow`, `CustomerDetail`, `CustomerShowPageProps`, `StoreSettingsData`, `SettingsPageProps`, `VariantRow`, `VariantAvailability`, `ShippingRegionOption`, `ShippingRateRow`, `CityShippingRateRow`, `ShippingRatesPageProps` |
| `resources/js/types/users.ts` | 177 | `User` (re-export), `UserFilterParams`, `UserFilterKey`, `UserActionType`, `UserActionHandlers`, `UserModalType`, `UserModalState`, `UserModalActions`, `UserTableRowProps`, `UserActionsMenuProps`, `UserInfoDialogProps`, `UsersPageProps`, `OnUserAction`, `OnFilterChange`, `OnPageChange`, `UserPermissionChecks`, `UserTableConfig`, `UserFormData`, `UserFormProps` |
| `resources/js/types/shop.d.ts` ⊕ | 169 | `ShopPhoto`, `ShopSharedProps`, `ShopVariant`, `ShopUpcomingVariant`, `ShopCheckoutVariant`, `ShopAddress`, `ShippingQuote`, `ShippingQuoteError`, `PaymentMethodValue`, `OrderStatusValue`, `OrderStatusItem`, `OrderStatusData`, `OrderStatusPoll` |
| `resources/js/types/data-table.ts` | 107 | `SearchBarProps`, `TableColumn`, `TableHeaderProps`, `PaginationProps`, `FilterToggleProps`, `DateRange`, `DateRangeFilterProps`, `QueryParams`, `QueryParamsBuilder` |
| `resources/js/types/index.d.ts` | 98 | `Auth`, `BreadcrumbItem`, `NavGroup`, `NavItem` (⊕ com `children`), `SharedData`, `User`, `Permission`, `Role`, `PermissionGuardProps` |
| `resources/js/types/dialogs.ts` | 57 | `InfoSection`, `ModuleInfoDialogProps`, `DialogAction`, `BaseDialogProps` |
| `resources/js/types/permissions.ts` | 47 | `RoleData`, `RolesData`, `PermissionCardProps`, `RoleUsersTableProps`, `RoleInfoDialogProps`, `PermissionsPageProps`, `PermissionActionHandlers` |
| `resources/js/types/settings.ts` | 42 | `ProfileFormData`, `PasswordFormData`, `ProfilePageProps`, `PasswordPageProps`, `AppearancePageProps`, `SettingsActionHandlers`, `UseSettingsActionsOptions`, `UseSettingsActionsReturn` |
| `resources/js/types/global.d.ts` | 14 | `const route` (ziggy) + ⊕ `Window.fbq?` (Meta Pixel, opcional porque o script só existe com `META_PIXEL_ID`) |
| `resources/js/types/vite-env.d.ts` | 1 | referência de tipos do Vite |

`types/index.d.ts` **não declara `flash`** em `SharedData` (a interface tem `name`, `quote`, `auth`, `ziggy` + index signature); o shape de flash está inline em `hooks/use-flash-messages.tsx`. ⊖ O boilerplate declara `FlashMessages` em `types/index.d.ts` (a partir da linha 52).

---

#### 9. Entradas e resolvedor de páginas

**Três entradas, duas Inertia.** ⊕ (o boilerplate tem só `app.tsx` + `ssr.tsx`)

| Entry | Path | Resolve | CSS | Extras |
|---|---|---|---|---|
| Painel | `resources/js/app.tsx` (43) | `resolvePageComponent('./pages/'+name+'.tsx', import.meta.glob('./pages/**/*.tsx'))` | `../css/app.css` | envolve em `<Theme>` do `@radix-ui/themes` com `fontFamily`/`--default-font-family` inline (Aptos); `<ToastProvider/>`; `progress.color: '#4B5563'`; `initializeTheme()` |
| Loja ⊕ | `resources/js/shop.tsx` (29) | `import.meta.glob('./pages/shop/**/*.tsx')` — **glob restrito**: chunks do painel nunca entram no bundle do comprador | `../css/shop.css` | `trackInertiaPageViews()` chamado **antes** do `createInertiaApp` (o evento da carga inicial precisa ser descartado pelo listener já registrado); sem `<Theme>` do Radix; `title` cai para `appName` quando vazio; `progress.color: '#00647b'` |
| SSR | `resources/js/ssr.tsx` (30) | `import.meta.glob('./pages/**/*.tsx')` | — | injeta `global.route<RouteName>` a partir de `page.props.ziggy` |

**Tratamento de asset stale/deploy: NÃO EXISTE.** ⊖ Grep por `stale|location.reload|Page not found|dynamically imported` em `resources/js` (fora de `/test/`) retorna apenas `lib/meta-pixel.ts:67` (`router.on('navigate')`) e três ocorrências de `orders.stale` em `pages/dashboard.tsx` (métrica de negócio, não de bundle). O boilerplate tem `resources/js/lib/resolve-inertia-page.tsx` (reload único guardado por flag em `sessionStorage` + fallback com botão "Atualizar agora") e o usa em `app.tsx`; o spinmax chama `resolvePageComponent` cru nos três entries.

**Blades raiz** — ambas fazem preload do chunk da página atual:
- `resources/views/app.blade.php:73` — `@vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])`; `@routes` completo; script inline anti-flash que resolve `localStorage` vs cookie do servidor e escreve `.dark` + `data-theme` + `data-theme-source`; preload de 5 woff2; sem Meta Pixel (deliberado).
- `resources/views/shop.blade.php:33` — `@vite(['resources/js/shop.tsx', ...])`; **`@routes('shop')`** (só o grupo público, nada da superfície admin); `data-theme="light"` fixo no `<html>`; `@include('partials.meta-pixel')`.
- `resources/views/landing.blade.php:81` — `@vite('resources/css/landing.css')`, sem JS (landing é Blade pura, não Inertia).

---

#### 10. `resources/css/` — 5 arquivos, forma do theme

| Path | Linhas | Papel |
|---|---|---|
| `resources/css/_brand.css` ⊕ | 187 | **Fonte única** dos hex da marca: paletas `--sm-ocean-*`, `--sm-tropic-*`, `--sm-sand-*`, `--sm-coral-*` (5 tons cada), `--sm-ink`, superfícies dark `--sm-dark-bg/surface/text/muted/border`, tokens do CTA `--sm-cta-*`, e os **remaps shadcn→marca** em dois blocos: `:root` (linha 97, light) e `.dark` (linha 139). Tem `@supports (color: color-mix(...))` (linha 176) para fazer upgrade do fallback rgb da borda dark |
| `resources/css/_fonts.css` | 200 | `@font-face` locais: **Aptos** (300/400/600/700/800/900 + itálicos, 10 faces), **Montserrat** (300/400/600/…, woff2 v31 latin), **Merriweather Sans** |
| `resources/css/app.css` | 677 | Entry do painel |
| `resources/css/shop.css` ⊕ | 178 | Entry da loja — `@import './app.css'` e sobrescreve |
| `resources/css/landing.css` ⊕ | 1.272 | Entry da landing Blade — `@import 'tailwindcss'` + `@import './_brand.css'` direto (não passa pelo `app.css`) |

**Forma do theme:**
- Tailwind **v4 com `@theme`** (`app.css`, ~40 tokens `--color-*` apontando para variáveis semânticas `--background`, `--foreground`, `--card`, `--primary`, `--sidebar-*`, `--chart-1..5`) + `@plugin 'tailwindcss-animate'` + `@source "../views"` e `@source` da paginação do Laravel.
- **Dark mode por CLASSE** no painel/loja: `@custom-variant dark (&:is(.dark *))` (`app.css`). O `.dark` real é escrito pelo script inline da blade e por `use-appearance.tsx`.
- **Dark mode por MEDIA + atributo** na landing: `landing.css:68` `@media (prefers-color-scheme: dark) { :root:not([data-theme]) {...} }` + `landing.css:111` `:root[data-theme='dark']` (override do toggle) + `landing.css:171` `:root[data-theme='light']`. Ou seja: **duas mecânicas de tema convivendo** no mesmo projeto, ligadas pelos mesmos tokens `--sm-*`.
- Colisão documentada e corrigida no `app.css`: o `styles.css` do `@radix-ui/themes` declara `--color-background` **fora de `@layer`**, vencendo o `@theme`; o arquivo redeclara `:root, .dark, .radix-themes { --color-background: var(--background) }` depois do import para devolver o token ao tema.
- Tipografia por especificidade bruta: `app.css` tem ~15 blocos de seletores encadeados (`html body [data-radix-theme] .rt-Heading, …`) com `!important` mapeando Montserrat→títulos/table-headers, Merriweather Sans→subtítulos/`.text-muted-foreground`/`[data-slot='card-description']`, Aptos→corpo/UI. O `shop.css` precisa **neutralizar** esses blocos espelhando os seletores (bloco "Tipografia", linhas 52-85) porque importa o `app.css` inteiro para reaproveitar os `ui/*`.
- `shop.css` traz `@font-face` de **Akmorn Grotesque** (400/700), redefine `--font-sans`/`--font-title` e `--radius: 0.75rem`, e declara `.shop-title` e um bloco `.legal-prose` (~75 linhas) que reconstrói hierarquia tipográfica para o HTML de `Str::markdown()` — sem `@tailwindcss/typography` no projeto.
- `app.css` também carrega: `.custom-scrollbar` (webkit + firefox, com variante `.dark`), scrollbar de `[data-slot='dialog-content']` no dark, `@supports (-webkit-touch-callout: none) { .ios-input-16 … font-size: 16px }` (anti-zoom iOS), e ~120 linhas de estilo de toast (`.toast-custom`, `.toast-success/error/warning/info`, keyframes `slideInRight`/`slideOutRight`).
- ⊖ O boilerplate tem só `resources/css/_fonts.css` + `resources/css/app.css`.

---

#### 11. `vite.config.ts`

```ts
plugins: [ ...(process.env.VITEST ? [] : laravel({...})), react(), tailwindcss() ]
```

| Item | Valor |
|---|---|
| `input` ⊕ | 5 entradas: `resources/css/app.css`, `resources/css/landing.css`, `resources/css/shop.css`, `resources/js/app.tsx`, `resources/js/shop.tsx` |
| `ssr` | `resources/js/ssr.tsx` |
| `detectTls` ⊕ | `process.env.CI ? false : 'spinmax-app.test'` |
| `refresh` | `true` |
| Plugin `laravel` desligado sob `VITEST` ⊕ | `process.env.VITEST ? [] : laravel(...)` |
| `esbuild.jsx` | `'automatic'` |
| `resolve.alias` | `'@' → resolve(__dirname, 'resources/js')` |
| `test` (Vitest inline no vite.config) ⊕ | `globals: true`, `environment: 'jsdom'`, `setupFiles: ['./resources/js/test/setup.ts']`, `css: true`, `include: ['resources/js/**/*.{test,spec}.{ts,tsx}']` — a restrição de `include` existe porque sem ela o Vitest varre `vendor/` e tenta rodar os `.spec.js` do pest-plugin-browser |
| **Chunking** | **Nenhuma config manual** — sem `build.rollupOptions.output.manualChunks`. A separação painel/loja vem do `import.meta.glob` restrito em `shop.tsx`, não do Rollup |

Configs adjacentes: `components.json` (shadcn, `style: default`, `baseColor: neutral`, `iconLibrary: lucide`, aponta para `tailwind.config.js` que **não existe** no repo — v4 é CSS-first), `.prettierrc` (`printWidth: 150`, `tabWidth: 4`, plugins `organize-imports` + `tailwindcss`, `tailwindFunctions: ['clsx','cn']`), `.prettierignore` (ignora `components/ui/*`, `ziggy.js`, `.history`), `eslint.config.js` (flat config, 6 blocos; `react-hooks/exhaustive-deps` em **`warn`**; globais do Vitest declarados manualmente em dois blocos; `@typescript-eslint/no-explicit-any: off` nos testes), `tsconfig.json` (`paths: {"@/*": ["./resources/js/*"]}`, `jsx: react-jsx`, `types: ["vitest/globals"]`).

⊕ `scripts/check-contrast.mjs` (7.8 KB) — gate de contraste WCAG que lê os tokens de `resources/css/_brand.css`, resolve as cadeias de `var()` e valida 12 pares de texto a **AA ≥ 4.5:1** (exit 1 em falha) + pares não-texto a 3:1 (informativos). Exposto como `pnpm run check:contrast`; **não está encadeado no `ci:check`**.

---

#### 12. `package.json`

**Scripts** (15): `build`, `build:ssr`, `dev`, `prepare` (`husky`), `format`, `format:check`, `lint:check`, `lint:fix`, `types`, ⊕ `check:contrast`, `ci:lint` (= lint:check + format:check + types), `ci:fix`, `test`, `test:run`, `test:ui`, `test:coverage`, `ci:test` (= `npm run test:run`), `ci:build`, `ci:check` (= ci:lint + ci:test + ci:build).

Diferenças de forma vs boilerplate: os scripts invocam **`npm run`**, não `pnpm -s`, apesar de `packageManager: pnpm@11.17.0`. `ci:test` **não define `LARAVEL_BYPASS_ENV_CHECK=1`** (o boilerplate define). Não há `lint-staged` no `package.json` (⊖ o boilerplate declara o bloco `lint-staged` com Pint + prettier + eslint), nem `format:dirty`. `lint` chama-se `lint:check` e **não usa cache** (⊖ o boilerplate usa `--cache --cache-location node_modules/.cache/eslint`).

**`engines`** ⊕: `{"node": ">=24 <25"}` — o boilerplate não declara `engines`.

**dependencies** (⊕ = ausente no boilerplate):

| Pacote | Spinmax | Boilerplate |
|---|---|---|
| ⊕ `@mercadopago/sdk-react` | `^1.0.7` | — |
| `@inertiajs/react` | `^2.3.27` | `^3.6.1` |
| `@headlessui/react` | `^2.2.10` | `^2.2.10` |
| `@radix-ui/react-avatar` … `react-tooltip` (14 pacotes) | idênticos | idênticos |
| `@radix-ui/themes` | `^3.3.0` | `^3.3.0` |
| `@tailwindcss/vite` | `^4.3.3` | `^4.3.3` |
| `@types/react` / `@types/react-dom` | `^19.2.18` / `^19.2.4` | idem |
| `@vitejs/plugin-react` | `^5.2.0` | `^6.0.5` |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss`, `tailwindcss-animate`, `react`, `react-dom`, `react-hot-toast`, `ziggy-js` | idênticos | idênticos |
| `concurrently` | `^9.2.4` | `^10.0.4` |
| `globals` | `^15.15.0` | `^17.9.0` |
| `laravel-vite-plugin` | `^2.1.0` | `^3.1.3` |
| `lucide-react` | `^0.475.0` | `^1.28.0` |
| `vite` | `^7.3.6` | `^8.2.0` |
| ⊕ `typescript` em `dependencies` | `^5.9.3` | está em devDeps (`^6.0.3`) |

**devDependencies** (⊕ = ausente no boilerplate):

| Pacote | Spinmax | Boilerplate |
|---|---|---|
| ⊕ `playwright` | `^1.62.1` | — |
| ⊕ `@testing-library/user-event` | `^14.6.3` | também presente (`^14.6.3`) — não é ⊕ |
| `@eslint/js` | `^9.39.5` | `^10.0.1` |
| `@testing-library/jest-dom` | `^6.10.0` | `^7.0.0` |
| `@testing-library/react` | `^16.3.2` | `^16.3.2` |
| `@types/node` | `^22.20.1` | `^26.1.2` |
| `@typescript-eslint/*` | `^8.66.0` | `^8.66.0` |
| `@vitest/ui` / `vitest` | `^3.2.7` | `^4.1.10` |
| `eslint` | `^9.39.5` | `^10.8.0` |
| `eslint-config-prettier`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `husky`, `prettier`, `prettier-plugin-organize-imports` | idênticos | idênticos |
| `jsdom` | `^27.4.0` | `^30.0.1` |
| `prettier-plugin-tailwindcss` | `^0.6.14` | `^0.8.1` |
| — | — | ⊖ `chokidar`, ⊖ `lint-staged` |

**optionalDependencies** (linux CI): `@rollup/rollup-linux-x64-gnu@4.9.5` (boilerplate: `4.62.4`), `@tailwindcss/oxide-linux-x64-gnu@^4.3.3`, `lightningcss-linux-x64-gnu@^1.33.0` — mesmas três chaves nos dois.

---

#### 13. Padrões Inertia em uso (contagem de arquivos, `/test/` excluído)

| Padrão | Arquivos |
|---|---|
| `useForm` | 13 |
| `usePage` | 11 |
| `preserveScroll` | 19 |
| `router.post` | 6 |
| `prefetch` (prop de `<Link>`) | 6 |
| `preserveState` | 5 |
| `router.visit` | 2 |
| `router.reload` | 1 |
| `<Form>` (componente Inertia 2/3) | **0** |
| `WhenVisible` | **0** |
| `Deferred` | **0** |
| `usePoll` | **0** |

---

#### 14. Suíte de testes do frontend — 30 arquivos em `resources/js/test/`

`test/setup.ts` (mock de `global.route`, `window.matchMedia`, `localStorage`, `ResizeObserver`), `test/vitest.d.ts`, `test/utils.test.ts`.

- ⊕ `test/shop/` (10): `checkout.test.tsx`, `order-status.test.tsx`, `order-summary.test.tsx`, `product-gallery.test.tsx`, `quantity-selector.test.tsx`, `shop-layout.test.tsx`, `legal.test.tsx`, `company-legal.test.tsx`, `masks.test.ts`, `meta-pixel.test.ts`, `money.test.ts`
- ⊕ `test/store/` (11): `orders-index.test.tsx`, `order-show.test.tsx`, `order-actions.test.tsx`, `order-timeline.test.tsx`, `customers-index.test.tsx`, `variants-page.test.tsx`, `city-shipping-rates.test.tsx`, `nf-block.test.tsx`, `status-badge.test.tsx`, `status-colors.test.ts`, `datetime.test.ts`, `money.test.ts`
- `test/components/` (6): `Button.test.tsx` (PascalCase), `currency-input.test.tsx`, `date-input.test.tsx`, ⊕ `integer-input.test.tsx`, `masked-input.test.tsx`, `nav-footer.test.tsx`
- `test/hooks/` (2): ⊕ `use-countdown.test.ts`, `use-permissions.test.ts`
- `test/auth/login.test.tsx`

⊖ O boilerplate organiza os testes espelhando a árvore de origem (`test/components/data-table/`, `test/components/permissions/`, `test/components/ui/`, `test/components/users/`, `test/layouts/permissions/`, `test/lib/`, `test/styles/`, `test/utils/data-table/`); o spinmax agrupa por domínio (`test/shop/`, `test/store/`) e tem `test/styles/` ausente.

---

#### 15. Limitações desta varredura

- Não executei build, tsc, vitest, lint nem qualquer comando de pacote (guardrail read-only) — todas as contagens vêm de leitura estática de arquivo.
- Não abri `package-lock`/`pnpm-lock.yaml` para resolver versões efetivamente instaladas; as faixas acima são as declaradas em `package.json`.
- Não inspecionei `public/build/` nem o manifest gerado, logo não posso afirmar o tamanho real dos bundles painel vs loja — apenas que o glob de `shop.tsx` restringe o grafo de módulos.
- `components.json` aponta para `tailwind.config.js`, que não existe no repositório (Tailwind v4 é CSS-first); não verifiquei se algum comando do shadcn CLI ainda depende disso.

---

### Testes, CI e tooling

Raiz Laravel do spinmax = subdiretório `app/` do repo; todos os paths abaixo são relativos a essa raiz.

#### 1. Árvore de `tests/` — 117 arquivos, 4 suítes

| Suíte | Diretório | Arquivos | Casos medidos | Registrada em |
|---|---|---|---|---|
| Feature | `tests/Feature/` | 93 | 674 declarações `it()/test()` + 12 métodos PHPUnit (`ImpersonateTest`) = **686** | `phpunit.xml` + `tests/Pest.php` (`RefreshDatabase`) |
| Unit | `tests/Unit/` | 18 | **86** | `phpunit.xml` + `tests/Pest.php` (sem `RefreshDatabase`) |
| Browser | `tests/Browser/` | 1 | **1** | `phpunit.xml`; grupo `browser` **excluído** da suíte padrão |
| Contract | `tests/Contract/` | 1 | **2** | `phpunit.xml`; grupo `contract` **excluído** da suíte padrão |
| Suporte | `tests/Support/FakeMpHttpClient.php`, `tests/fixtures/pix-discount.json` | 2 | — | autoload `Tests\` |

`describe()` não é usado em lugar nenhum (0 ocorrências); 38 datasets via `->with(`. Não existe `tests/Arch/` — **⊖ o boilerplate tem `tests/Arch/ArchTest.php`** (presets `php()`+`security()`, enums, controllers invokable, models estendem `Model`, VOs finais, controllers sem facade `DB`) e o spinmax **não tem nenhum teste `arch()`**.

Suítes/arquivos não-óbvios:

| Path | Casos | O que cobre |
|---|---|---|
| `tests/Browser/ShopSmokeTest.php` | 1 | ⊕ Smoke real de browser (`pest-plugin-browser` + Chromium do Playwright): `/comprar` → `/checkout` → Pix → tela de status. Servidor HTTP roda no mesmo processo, então `FakeGateway` e `Http::fake` do ViaCEP valem para as requisições do browser (zero rede). Tira screenshots `comprar` e `checkout` como gate visual. |
| `tests/Contract/MercadoPagoPixTest.php` | 2 | ⊕ Contrato real com a sandbox do Mercado Pago (Orders API). Não roda no CI. `markTestSkipped` sem `MP_ACCESS_TOKEN`; trava explícita que recusa credencial de produção (`APP_USR-` é ambíguo, `TEST-` é sandbox). |
| `tests/Support/FakeMpHttpClient.php` | — | Dublê de `MercadoPago\Net\MPHttpClient`: corpo canned + captura das `MPRequest`, exercita os drivers do gateway sem rede. |
| `tests/Feature/Store/` | 82 arquivos | Núcleo do domínio loja: checkout, frete (regional + por cidade), webhooks MP, e-mails transacionais, painel admin, comandos artisan, health/backup. |
| `tests/Feature/User/` | 9 arquivos | ⊕ RBAC com **teto de autoridade** (ver §3). |
| `tests/Unit/Payment/` | 7 arquivos, 46 casos | Payload/parse dos drivers MP (Pix, cartão, leitura, normalização de status, resiliência, binding). |

#### 2. `tests/Pest.php` e `tests/TestCase.php`

`tests/TestCase.php` é **vazio** (`abstract class TestCase extends BaseTestCase { // }`) — idêntico em espírito ao do boilerplate; toda a customização vive no `Pest.php`.

`tests/Pest.php` — 4 bindings de suíte + 5 helpers globais:

| Helper | Assinatura | Nota |
|---|---|---|
| `checkoutPayload()` | `(int $variantId, array $overrides = []): array` | Payload padrão de checkout. Carrega PII **fictícia** de fixture (nome/e-mail/CPF de teste). |
| `fakeCep()` | `(string $uf, string $city = 'São Paulo'): void` | ⊕ Fake do ViaCEP. Docblock registra o bug que a moveu para cá: declarada dentro de `CheckoutTest.php`, só existia nos processos que carregassem aquele arquivo → em paralelo, 4 testes caíam em `Call to undefined function fakeCep()` (erro, não falha) e a feature de tarifa por cidade ficava sem cobertura efetiva. |
| `userWithRole()` | `(App\Enum\Roles $role): App\Models\User` | Único helper de persona. Cria via factory com `is_active` + `role_id` do `PermissionRoleSeeder`. **Não** semeia sozinho — cada arquivo precisa do seu `beforeEach(fn() => $this->seed(PermissionRoleSeeder::class))`. |
| `mpWebhookSignature()` | `(string $dataId, string $requestId, string $secret, ?int $ts = null): array` | HMAC-SHA256 do manifesto do webhook MP. Docblock documenta a ambiguidade de unidade do `ts` (MP real assina em **segundos**; default em ms por causa do validador do dx-php). |
| `something()` / `expect()->toBeOne()` | — | Restos do stub do Pest, nunca removidos. |

⊖ O boilerplate tem um kit de persona bem maior em `tests/Pest.php`: `userWithRole()` **com auto-seed idempotente**, `actingAsUserWithRole()`, `actingAsSuperUser()`, `guestUser()`, `selectableRoles()`. O spinmax só tem o primeiro, e sem auto-seed.

#### 3. Testes-guarda

| Path | Casos | O que trava |
|---|---|---|
| `tests/Unit/EventWiringTest.php` | 2 (+dataset) | ⊕ **Wiring de eventos.** `bootstrap/app.php` usa `withEvents(discover: false)` e o mapa é o `AppServiceProvider::configEvents()`. Duas metades: (a) listener único por evento — religar a descoberta registra tudo 2× e manda e-mail duplicado ao comprador; (b) todo listener em disco tem de estar registrado à mão — senão nasce morto. Nenhuma das duas falhas aparece nos testes de e-mail (`Mail::assertQueued` com callback passa com 1 ou N). |
| `tests/Feature/ValidationMessagesArePortugueseTest.php` | 5 | ⊕ **Tradução.** Quebra se apagarem `lang/pt_BR/`, mudarem o locale sem traduzir, ou criarem campo sem entrada em `attributes`. Assere que nenhum erro começa com `validation.` **e** que o nome do campo é traduzido (não só a frase). ⊖ O boilerplate tem `tests/Feature/TranslationTest.php` (papel equivalente) + `laravel-lang/common`. |
| `tests/Feature/SecurityHeadersTest.php` | 3 | 3 headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`) em 6 superfícies públicas por dataset + superfícies admin. Existe também no boilerplate. |
| `tests/Feature/GateLoggingTest.php` | 3 | ⊕ **Gate não escreve log.** `Log::spy()` + `shouldNotHaveReceived('channel'|'info')`; mais 2 casos provando que a remoção do log não mexeu na resposta de autorização. |
| `tests/Feature/LogScrubbingTest.php` | 2 | Escrita real em arquivo via canal `single` com `tap => ScrubPiiFromLogs`; confere que e-mail/CPF/endereço/CEP **não** chegam ao disco e que o `gateway_payment_id` continua chegando. Existe no boilerplate com o mesmo nome. |
| `tests/Feature/Store/ExportCsvInjectionTest.php` | 1 | ⊕ **Injeção CSV/DDE**: campos começando com `=`/`+`/`-`/`@` precisam sair prefixados com `'`. |
| `tests/Feature/Store/ShippingPlaceholderGuardTest.php` | 4 | ⊕ **Guarda de env**: tarifa marcada `is_placeholder` recusa cotação **em produção** (`detectEnvironment('production')`) e não muda nada em dev/CI. |
| `tests/Feature/Store/CompanyConfigFreshnessTest.php` | 1 | ⊕ **Freshness de config em worker longo**: `config('store.company.*')` re-hidrata a cada `JobProcessing`, senão o Horizon serve o dado legal congelado no boot até um `queue:restart`. |
| `tests/Feature/Store/StoreSettingsCoherenceTest.php` | 17 | ⊕ **Coerência entre campos** das settings (promoção mais cara que o cheio, frete grátis em pedido de 1 unidade, promo global com 2 variantes à venda, cache sobrevivendo a seed). |
| `tests/Feature/Store/MailAllowlistTest.php` | 7 | Allowlist de destinatários + inbox de captura fora de produção. Equivalente ao `tests/Feature/Mail/EnforceMailAllowlistTest.php` do boilerplate. |
| `tests/Feature/User/RoleAssignmentCeilingTest.php` | 5 | ⊕ Teto de autoridade sobre o **alvo** em `assign-role`/`revoke-role` (antes: `assign_roles` rebaixava admin/super_user a `visitor`). |
| `tests/Feature/User/PermissionMutationCeilingTest.php` | 5 | ⊕ Bloqueia auto-alvo: admin auto-concedendo `impersonate_users` via `sync-permissions`. |
| `tests/Feature/User/RoleEditorCeilingTest.php` | 11 | ⊕ Teto na tela de Cargos (a única capaz de ampliar o próprio acesso): trava o cargo editável **e** as permissões marcáveis. |
| `tests/Feature/User/UserResourceCpfCeilingTest.php` | 2 | ⊕ Teto na **exibição**: CPF/telefone/notas internas só em claro para si, super_user ou prioridade maior. |
| `tests/Feature/Store/StagingCheckCommandTest.php` | 17 | ⊕ Converte 16 checagens manuais de go-live (DoD da spec 13) em asserções de que o comando **reprova** quando deve. |
| `tests/Feature/Store/BackupHealthTest.php` / `QueueHealthTest.php` / `HealthAlertTest.php` | 15 / 15 / 6 | ⊕ Healthcheck: heartbeat de fila, `store:health`, alerta de `queue:failing`, frescor do backup no R2. |
| `tests/Feature/Store/ShippingQuoteEndpointTest.php` | 10 | Único arquivo com cobertura de **throttle** (`RateLimiter`/429) em toda a suíte. ⊖ O boilerplate tem `tests/Feature/Auth/AuthRouteThrottleTest.php`; o spinmax **não trava throttle de auth**. |

Guardas presentes só no boilerplate (⊖): `tests/Feature/Foundation/SchemaIdentifierLengthTest.php`, `tests/Unit/Database/MigrationDialectInvariantTest.php`, `tests/Feature/Routes/WriteRoutesAuthorizationTest.php`, `tests/Feature/Laravel13ConfigurationDefaultsTest.php`, `tests/Feature/SharedPropsTest.php`, `tests/Feature/CopyPainelTest.php`, `tests/Feature/HorizonDevelopmentScriptsTest.php`, `tests/Unit/Theme/InlineThemeBackgroundTest.php`.

#### 4. `phpunit.xml`

- 4 testsuites (Unit/Feature/Browser/Contract) — ⊕ as duas últimas não existem no boilerplate (que tem Arch no lugar).
- ⊕ Bloco `<groups><exclude>` com `browser` e `contract` — mecanismo de suíte-de-duas-velocidades que o boilerplate não tem.
- Envs: os 10 padrão do Laravel (SQLite `:memory:`, `CACHE_STORE=array`, `BCRYPT_ROUNDS=4`, `QUEUE_CONNECTION=sync`, `MAIL_MAILER=array`, Pulse/Telescope off) **+ ⊕ `AUDIT_QUEUE_CONNECTION=sync`** — `owen-it/laravel-auditing` traz a própria conexão de fila em `config/audit.php`, fora do alcance do `QUEUE_CONNECTION`; sem isso o CI dava "Connection refused" no Redis em todo teste que gravasse modelo auditado.

#### 5. `.github/workflows/`

**`.github/workflows/ci.yml`** — gatilhos `push` e `pull_request` em `[main, develop]`; `permissions: contents: read`; **sem** `concurrency`; actions por tag (`@v4`), não SHA-pinadas. 5 jobs:

| Job | Matriz | Passos-chave | Bloqueia PR |
|---|---|---|---|
| `frontend` | `node: [24]` | `pnpm/action-setup@v4` + cache pnpm (`cache-dependency-path: pnpm-lock.yaml`) → `types` → `lint:check` → `test:run` (`CI=true`, `LARAVEL_BYPASS_ENV_CHECK=1`) → `build`. **Não roda `format:check`** aqui (fica no job `quality`). | sim |
| `backend` | `php: [8.4]`, `node: [24]`; `needs: frontend` | service **MySQL 8.0** só para o gate de migrations (`php artisan migrate --force` contra MySQL, enquanto a suíte roda SQLite `:memory:`) → `vendor/bin/pest` → ⊕ `pnpm exec playwright install --with-deps chromium` → ⊕ `pest --group=browser` → ⊕ `upload-artifact` dos screenshots (`tests/Browser/Screenshots`, `if: always()`). Cache Composer por `hashFiles('**/composer.lock')`. | sim |
| `quality` | — | `pint --test` + `pnpm run format:check`. ⊖ **Sem PHPStan** (o boilerplate roda `composer ci:stan`). ⊖ Sem `composer validate --strict`. | sim |
| `security` | — | ⊕ `composer audit --format=json` filtrado por **`jq`** para falhar só em `high`/`critical` (medium/low não bloqueiam); `pnpm audit --prod --audit-level high`. O boilerplate usa `composer audit --locked` cru (falha em qualquer severidade). | sim |
| `rector` | — | `rector process --dry-run`, `continue-on-error: true` — **não bloqueia**. Idêntico ao boilerplate. | não |

**`.github/workflows/semgrep.yml`** — `pull_request` + `push` em `[main, develop]`, **`schedule: cron "17 5 * * *"` (nightly)** e `workflow_dispatch`. Container `semgrep/semgrep`, `SEMGREP_APP_TOKEN` via secret, cache de regras em `~/.semgrep`, saída SARIF publicada como artifact. Existe também no boilerplate (mesmo cron); diferença: o do boilerplate declara `security-events: write`, o do spinmax não.

Ausentes no spinmax e presentes no boilerplate (⊖): `.github/dependabot.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`, `concurrency` com `cancel-in-progress`, actions SHA-pinadas, cache do Vite, setup de pnpm via Corepack.

⊕ `.github/skills/` no spinmax traz 3 skills (`pest-testing`, `inertia-react-development`, `tailwindcss-development`); o boilerplate tem essas 3 + `configuring-horizon`, `infer-conventions`, `laravel-best-practices` (com 18 arquivos de regra).

#### 6. `composer.json`

Scripts:

| Script | Conteúdo | vs boilerplate |
|---|---|---|
| `ci:test` | `vendor/bin/pest` | igual |
| `ci:lint` | `vendor/bin/pint --test` | igual |
| `ci:fix` | `vendor/bin/pint` | ⊕ (boilerplate chama de `lint:fix`) |
| `ci:rector` | `rector process --dry-run --config ./rector.php` | igual |
| `ci:check` | `[@ci:lint, @ci:test]` — **2 passos** | ⊖ o do boilerplate é `[@ci:lint, @ci:rector, @ci:stan, @ci:test]` (4 passos, com Rector e PHPStan dentro do gate) |
| `dev` | `concurrently` com `serve` + `queue:listen --queue=payments,mail,default --tries=1` + `pail` + `pnpm dev` | boilerplate usa `horizon:listen` + `schedule:work` no lugar do `queue:listen` |
| `dev:herd` | ⊕ variante sem `artisan serve` (Herd serve o vhost) | ⊕ |
| `dev:ssr` | `build:ssr` + 4 processos + `inertia:start-ssr` | equivalente |
| — | — | ⊖ boilerplate tem `ci:stan`, `format`, `format:check`, `lint`, `horizon:terminate` |

`require-dev` (faixa de versão):

| Pacote | spinmax | boilerplate | Marca |
|---|---|---|---|
| `pestphp/pest` | `^4.1` | `^5.1` | — |
| `pestphp/pest-plugin-laravel` | `^4` | `^5.0` | — |
| `pestphp/pest-plugin-browser` | `^4.3` | ausente | **⊕** |
| `laradumps/laradumps` | `^4.0` | `^5.3` | — |
| `laravel/boost` | `^2.0` | `^2.4` | — |
| `fakerphp/faker` | `^1.23` | `^1.23` | — |
| `laravel/pail` | `^1.2.2` | `^1.2.2` | — |
| `laravel/pint` | `^1.18` | `^1.18` | — |
| `laravel/sail` | `^1.41` | `^1.41` | — |
| `mockery/mockery` | `^1.6` | `^1.6` | — |
| `nunomaduro/collision` | `^8.6` | `^8.6` | — |
| `rector/rector` | `^2.0` | `^2.0` | — |
| `larastan/larastan` | **ausente** | `^3.10` | **⊖** |
| `laravel-lang/common` | **ausente** | `^6.8` | **⊖** |
| `phpunit/phpunit` (explícito) | **ausente** | `^13.0` | **⊖** |

`config.allow-plugins`: `pestphp/pest-plugin`, `php-http/discovery` — idêntico ao boilerplate.

#### 7. `package.json`

Scripts: `build`, `build:ssr`, `dev`, `prepare: husky`, `format`, `format:check`, `lint:check`, `lint:fix`, `types`, ⊕ `check:contrast`, `ci:lint` (= lint + format:check + types), ⊕ `ci:fix` (= lint:fix + format), `test`/`test:run`/`test:ui`/`test:coverage`, `ci:test`, `ci:build`, `ci:check`.
Diferenças estruturais: ⊖ o boilerplate usa `eslint --cache --cache-location node_modules/.cache/eslint`, embute `LARAVEL_BYPASS_ENV_CHECK=1` dentro do `ci:test`, tem `format:dirty` (script próprio) e um bloco **`lint-staged`** — o spinmax **não tem `lint-staged`** (ver §9).

devDependencies ⊕ (spinmax tem, boilerplate não): **`playwright ^1.62.1`** (dá suporte ao `pest-plugin-browser`).
devDependencies ⊖ (boilerplate tem, spinmax não): `lint-staged ^17.3.0`, `chokidar ^5.0.0`.
Demais devDeps coincidem em nome com versões mais antigas no spinmax (`eslint ^9.39.5` vs `^10.8.0`, `vitest ^3.2.7` vs `^4.1.10`, `jsdom ^27` vs `^30`, `typescript ^5.9.3` vs `^6.0.3`, `@testing-library/jest-dom ^6.10` vs `^7.0`).

⊕ `pnpm-workspace.yaml` com `allowBuilds: {esbuild: true}` e **`overrides` de segurança** (`axios >=1.16.0`, `form-data >=4.0.6`, `postcss >=8.5.18`, `shell-quote >=1.9.0`) — o boilerplate não fixa overrides.
`engines: node >=24 <25`; `packageManager: pnpm@11.17.0` (boilerplate: `pnpm@11.19.0` com hash SHA-512); ⊕ `.mise.toml` pinando `node = "24"`.

#### 8. Ferramentas de qualidade — configs

| Ferramenta | Arquivo | Configuração | vs boilerplate |
|---|---|---|---|
| Pint | `pint.json` | preset `psr12` + ~40 regras (alinhamento `=`/`=>` com `align_single_space_minimal`, `blank_line_before_statement` com 17 statements, `braces` same-line, `closure_function_spacing: none`, `ordered_imports`, `no_unused_imports`, `elseif: false`, `no_useless_else: false`) | **byte-a-byte idêntico** |
| Rector | `rector.php` | paths `app/`, `bootstrap/app.php`, `database/`, `routes/`; `withPhpVersion(PHP_VERSION_ID)`; regra `TypedPropertyFromStrictConstructorRector`; `withTypeCoverageLevel(0)`; sets `deadCode` + `codeQuality`; skip `RemoveUselessReadOnlyTagRector`; envolto em `try/catch` de `InvalidConfigurationException` | **byte-a-byte idêntico** |
| PHPStan / Larastan | **não existe** | — | ⊖ boilerplate: `phpstan.neon.dist`, **level 6**, paths `app`, `database`, `routes`, `bootstrap/app.php`, exclui `bootstrap/cache`, no gate `ci:check` e no job `quality` do CI |
| ESLint | `eslint.config.js` (flat, 6 blocos) | `js.configs.recommended`; TS parser + `tseslint.configs.recommended`; React flat + `jsx-runtime`; globals extras (`route` do Ziggy, `__dirname`, globals do Vitest); `react-hooks/rules-of-hooks: error`, `exhaustive-deps: warn`; override de testes desliga `no-explicit-any` e `no-constant-binary-expression`; ignora `vendor`, `node_modules`, `public`, `bootstrap/ssr`, `tailwind.config.js`, `.history`; `eslint-config-prettier` por último | **idêntico exceto uma regra**: ⊖ o boilerplate acrescenta `'react/button-has-type': 'error'` |
| Prettier | `.prettierrc` + `.prettierignore` | `printWidth 150`, `tabWidth 4`, `singleQuote`, plugins `organize-imports` + `tailwindcss`, `tailwindFunctions: [clsx, cn]`, override `tabWidth 2` para `*.yml`. Ignora `resources/js/components/ui/*`, `resources/js/ziggy.js`, `.history` | `.prettierrc` **idêntico** |
| Vitest | `vite.config.ts` (bloco `test`) | `globals: true`, `environment: jsdom`, `setupFiles: ./resources/js/test/setup.ts`, `css: true`, ⊕ `include: ['resources/js/**/*.{test,spec}.{ts,tsx}']` — restrição necessária porque sem ela o Vitest varria `vendor/` e tentava rodar os `.spec.js` de exemplo do `pest-plugin-browser`. Plugin `laravel()` desligado sob `process.env.VITEST`; `detectTls: process.env.CI ? false : 'spinmax-app.test'` | ⊕ o `include` e o `detectTls` condicional são específicos daqui |
| Setup do Vitest | `resources/js/test/setup.ts` | `@testing-library/jest-dom`; mock global de `route()` do Ziggy; mocks de `matchMedia`, `localStorage`, `ResizeObserver` | — |
| Husky | `.husky/pre-commit`, `.husky/commit-msg` | ver §9 | ⊖ boilerplate tem **4** hooks: `pre-commit`, `pre-push`, `commit-msg`, `prepare-commit-msg` |
| EditorConfig / gitattributes | `.editorconfig`, `.gitattributes` | LF, UTF-8, indent 4 (2 em yml); `diff=php/css/html/markdown` | — |

Testes de frontend: **33 arquivos, 210 casos** em `resources/js/test/` (`auth/`, `components/`, `hooks/`, `shop/` 12 arquivos, `store/` 12 arquivos). Boilerplate: 30 arquivos, 184 casos.

#### 9. Hooks do husky

`.husky/pre-commit` — ⊕ **estratégia oposta à do boilerplate**: em vez de `lint-staged`, roda a pipeline inteira em 3 fases sobre a árvore toda.
1. Captura os staged com `git diff --cached --name-only -z --diff-filter=ACMR` para um `mktemp` (`-z` + arquivo porque `$(...)` não preserva NUL), roda `composer ci:fix` + `pnpm run ci:fix`, e **re-encena** com `xargs -0 git add --`. O comentário registra o defeito que motivou isso: sem re-stage, o commit levava a versão pré-formatação e o job `quality` do CI quebrava mesmo com o hook saindo 0. Efeito colateral assumido: arquivo staged parcialmente (`git add -p`) entra inteiro.
2. Confere com **os mesmos comandos do CI**: `composer ci:lint` (pint `--test`) e `pnpm run ci:lint` (eslint + prettier check + tsc) — rodar o check *depois* do fix é o que faz o hook reprovar o não-auto-corrigível.
3. Roda `composer ci:test` (Pest, sem os grupos `browser`/`contract`) **e** `pnpm run ci:test` (Vitest) — ou seja, **a suíte inteira no pre-commit**, não no pre-push.
Não há escape hatch: ⊖ o boilerplate honra `SKIP_GIT_HOOKS=1` no `pre-push`; este hook não tem equivalente.

`.husky/commit-msg` — proíbe commit direto em `main`/`develop`; extrai o ID de issue da branch com `^\d+`; se a mensagem não contiver o ID, **reescreve** o arquivo de mensagem para `[$ISSUE_ID]: <mensagem>`. Todo em POSIX `sh` (usa `expr`, não `[[ ]]`). Arquivo termina com uma linha espúria `sh`.

#### 10. `scripts/` na raiz — 5 arquivos, 1242 linhas

| Path | Linhas | O que faz |
|---|---|---|
| `scripts/backup-r2.sh` | 334 | ⊕ Backup diário de produção para Cloudflare R2: dump MySQL → gzip → **gpg com chave pública** → upload rclone → verifica o objeto no destino → aplica retenção → avisa a app via `store:backup-report` (o que mantém `store:health` verde). Bash e não artisan de propósito: "backup não pode depender de a aplicação subir". Chave pública e não senha: o servidor só guarda o que **cifra**; a chave privada mora no cofre. Segredos vêm do ambiente. |
| `scripts/restore-drill.sh` | 236 | ⊕ Teste de restauração: baixa do R2, decifra, restaura num banco **descartável** cujo nome precisa começar com `spinmax_restore_test_` (recusa qualquer outro), confere e derruba. Flags `--object`, `--file`, `--keep`. Roda de preferência fora do servidor, provando de uma vez que o objeto existe, que a chave privada decifra e que o dado volta. |
| `scripts/provision-staging.sh` | 275 | ⊕ Provisiona o staging no ploi via API (`set -Eeuo pipefail`). Reusa o contrato de API já validado em outro projeto da Simplify. Segredos exclusivamente por env (`PLOI_TOKEN`, `MP_ACCESS_TOKEN`, `RESEND_KEY`, `MP_WEBHOOK_SECRET`, …) — nenhum valor no arquivo. Declara "NUNCA toca produção". |
| `scripts/check-contrast.mjs` | 208 | ⊕ **Gate WCAG**: lê os tokens de `resources/css/_brand.css` (`:root` = light, `.dark` = dark), resolve cadeias de `var()` e valida contraste. Pares de **texto**: AA ≥ 4.5:1 → `exit 1`. Pares não-texto (ring/border, WCAG 1.4.11, alvo 3:1): informativos. Exposto como `pnpm run check:contrast`. **Não está em nenhum `ci:*` nem no CI** — roda só sob demanda. |
| `scripts/optimize-photos.sh` | 189 | ⊕ Converte fotos para WebP (maior lado 2000px, q80, resample LANCZOS via ffmpeg — o `cwebp -resize` não deixa escolher o filtro). Parâmetros **medidos** sobre 5 fotos reais (corte de ~75%), não estimados. Só binários de sistema, zero dependência nova. Preserva o nome-base porque o `LandingController` escolhe hero/galeria por trecho do nome. |

⊖ O `scripts/` do boilerplate é outra coisa: `scripts/format/format-dirty.mjs`, `scripts/git/get-issue-id.sh`, `scripts/migration/status.sh` — nenhum sobreposto com os cinco acima.

#### 11. Limitações desta leitura

- Nada foi executado (guardrail read-only): as contagens de casos são por `grep` de declarações `it()/test()`, não por execução do Pest — datasets (38 `->with(`) multiplicam o número real de asserções executadas.
- `docs/` do spinmax tem permissão `drwx------` e não foi varrido; a especificação de testes referenciada pelos docblocks é `specs/loja-fase1/09-testes-e-aceite.md` (não lida em profundidade, fora do escopo desta frente).
- Nenhum `.env*` foi aberto exceto pela listagem de diretório; nenhum valor de segredo aparece acima.

---

### Ops, backup, observabilidade e docs de agente

Projeto pinado em `e4ec01e`. Working tree suja em três caminhos **não rastreados**: `docs/`, `out/`, `specs/loja-fase2/` (`git status --porcelain`). `docs/` inteiro é untracked (`git ls-files docs` → 0 arquivos); `specs/` tem 203 arquivos rastreados; `out/` tem 0.

---

#### 1. Backup

| Item | Path | O que faz |
|---|---|---|
| Script de backup | `scripts/backup-r2.sh` (334 linhas) | Cron de sistema. `mysqldump --single-transaction --quick --routines --no-tablespaces --hex-blob` → `gzip -9` → `gpg --encrypt --recipient` (chave **pública**) → `rclone copyto` para Cloudflare R2 → confere o objeto no destino → retenção → `php artisan store:backup-report`. Modo `--check` roda só o pré-voo. |
| Teste de restauração | `scripts/restore-drill.sh` (236 linhas) | Baixa do R2, decifra, restaura em banco descartável, confere e apaga. |
| Ponta de dentro | `app/Console/Commands/BackupReportCommand.php` (`store:backup-report`, 75 linhas) | Grava último sucesso / última falha / último drill. Flags: `--object --bytes --seconds --failed --reason --drill --dry-run`. |
| Estado persistido | `app/Services/Store/BackupStatus.php` (130 linhas) | Três chaves em `store_settings`: `backup.last_success`, `backup.last_failure`, `backup.last_drill`. Mora no banco (não no cache) para sobreviver a `cache:clear` e deploy. Chave ilegível devolve `null` igual a chave ausente — de propósito, para não deixar o healthcheck verde com registro corrompido. |
| Runbook | `specs/loja-fase1/RUNBOOK.md` §9 (§9.1 instalação, §9.2 o que o script recusa, §9.3 drill, §9.4 leitura das mensagens de falha, §9.5 restauração real de incidente) — 1130 linhas no total |
| Spec | `specs/loja-fase1/08-infra-deploy-golive.md` §Backups |

**O que cifra e para onde manda:** dump MySQL completo (contém PII em claro: nome, e-mail, telefone, endereço; `customers.cpf` já é ciphertext do cast `encrypted`), cifrado com **GPG por chave pública** (`GPG_RECIPIENT`), destino `r2:spinmax-backups/mysql`, retenção 30 dias (`RETENTION_DAYS`), objeto `spinmax-AAAA-MM-DD-HHMM.sql.gz.gpg`. O dump em claro é apagado **antes** do upload. `umask 077`; senha do MySQL vai por `--defaults-file` em arquivo 600, nunca em `-p` (evita `ps aux`). Configuração fora do repo: `~/.spinmax-backup.env` (modo 600); credenciais do banco lidas do `.env` da aplicação por um parser próprio (`env_get`).

**Travas de sanidade no dump** (todas em `scripts/backup-r2.sh`): piso de bytes (`MIN_DUMP_BYTES`, default 10240), `gzip -t`, exigência do marcador `Dump completed` na cauda, e presença obrigatória das tabelas `REQUIRED_TABLES` = `orders order_sequences customers payments`. Lock por `flock`. Verificação pós-upload comparando o tamanho lido de volta (`rclone lsl`) com o local. Retenção só roda **depois** de o objeto de hoje estar conferido. Qualquer falha chama `store:backup-report --failed --reason "<passo> (linha N)"` antes de morrer, via `trap ... ERR`.

**Drill de restauração — existe e é código, mas não há teste automatizado do script:**
- O drill em si: `scripts/restore-drill.sh`. Trava de destino: nome do banco precisa começar em `spinmax_restore_test_`, criado com timestamp e dropado no `trap EXIT` (inclusive se o script morrer no meio). Confere `orders`, `customers`, `payments`, `store_settings`, `users`, `MAX(orders.number)` e — o item que reprova — `order_sequences` (sem o contador, a restauração reemite números de pedido já usados). Roda **fora do servidor** de propósito: a chave privada mora no cofre e não deve existir na máquina de produção. Cadência documentada: antes do go-live e a cada 90 dias (`RUNBOOK` §9.3).
- **Cobrança automatizada do drill:** `app/Console/Commands/StagingCheckCommand.php:317-361` (grupo **Backup**) reprova em produção quando `backup.last_drill` está ausente ou mais velho que `store.health.backup_drill_max_age_days` (90).
- **Limitação:** os dois scripts bash não têm arquivo de teste. Os testes cobrem a ponta PHP (`tests/Feature/Store/BackupHealthTest.php`, 329 linhas / 15 casos). Não executei nada para confirmar o comportamento dos scripts (guardrail read-only).

⊕ Boilerplate não tem `scripts/` de backup nem qualquer rotina equivalente — `scripts/` lá contém apenas `scripts/format/format-dirty.mjs`, `scripts/git/get-issue-id.sh`, `scripts/migration/status.sh`.

---

#### 2. Healthchecks

| Check | Path | Detalhe |
|---|---|---|
| Endpoint HTTP | `bootstrap/app.php:26` — `health: '/up'` | Padrão Laravel 12. ⊖ o boilerplate também tem. |
| Healthcheck da loja | `app/Console/Commands/HealthCommand.php` (`store:health`, 304 linhas) | Três checks **sempre todos executados** (array literal, sem curto-circuito): fila, frete, backup. Exit ≠ 0 = incidente. |
| Heartbeat de fila | `app/Jobs/QueueHeartbeatJob.php` + `routes/console.php` (`Schedule::job(...)->everyMinute()`) | Só worker vivo grava a chave de cache; `store:health` reprova se a idade > `store.health.heartbeat_max_age_minutes` (5). |
| Frete real | `HealthCommand::checkShippingRates()` | Reprova em produção com `ShippingRate` `active` + `is_placeholder`. |
| Backup | `HealthCommand::checkBackup()` | Reprova em produção em três estados distintos: nunca reportou / falhou depois do último sucesso / atrasado > `backup_max_age_hours` (26). |
| Alerta por e-mail | `HealthCommand::notify()` + `app/Mail/HealthAlertMail.php` | Flag `--notify`. Transição reprova → alerta imediato; repetição limitada a 6h via cache `store:health:last-alert`; cache indisponível manda assim mesmo; manda e-mail de normalização quando volta. Destinatário: `StoreSettings::alertEmail()` (`STORE_ALERT_EMAIL`, fallback `STORE_NOTIFY_EMAIL`). |
| DoD de deploy | `app/Console/Commands/StagingCheckCommand.php` (`store:staging-check`, 438 linhas) | 7 grupos: Ambiente, Isolamento, Fila, Loja, E-mail, Acesso, **Backup**. Cada bloco em `guarded()` — Redis fora vira uma linha vermelha, não stack trace. Em `local` as checagens de ambiente implantado viram aviso (`⚠`, não derrubam exit code). |
| Job falho | `app/Listeners/Store/SendFailedJobAlert.php` + `app/Mail/FailedJobAlertMail.php`, registrado em `app/Providers/AppServiceProvider.php:215` (`Event::listen(JobFailed::class, ...)`) | E-mail imediato ao alerta técnico; a mensagem da exception passa por `PiiScrubber::scrubString()` antes de sair. |
| Anomalia de pagamento | `app/Listeners/Store/SendPaymentAnomalyAlert.php`, registrado em `AppServiceProvider.php:207` | Evento `App\Events\OrderPaymentAnomaly`. |
| Scheduler | `routes/console.php` (um único cron `* * * * * artisan schedule:run`, `RUNBOOK` §5) | `ExpirePendingOrdersJob` 15min · `RemindStalePaidOrdersJob` diário 08:00 America/Sao_Paulo · `QueueHeartbeatJob` 1min · `store:prune-webhook-events` 04:00 · `store:reconcile-orders` 10min `withoutOverlapping` · `horizon:snapshot` 5min · `store:reprocess-webhooks` 5min `withoutOverlapping`. Há um comentário-âncora explicando por que o backup **não** está agendado ali. |
| Cron do healthcheck | `RUNBOOK` §8 e §9.1 passo 7 | `store:health --notify` de hora em hora; backup `0 3 * * *` com `MAILTO` (e-mail redigido: `***`) e `|| tail -n 25 <log>` para o `>>` não engolir a saída. Usuário `ploi`, nunca root. |
| Config das janelas | `config/store.php:219-223` | `heartbeat_max_age_minutes: 5`, `backup_max_age_hours: env(STORE_BACKUP_MAX_AGE_HOURS, 26) ?: 26`, `backup_drill_max_age_days: env(..., 90) ?: 90`. |

Testes: `tests/Feature/Store/BackupHealthTest.php` (15), `tests/Feature/Store/QueueHealthTest.php` (15), `tests/Feature/Store/HealthAlertTest.php` (6), `tests/Feature/Store/GatewayFailureReportingTest.php` (11).

⊕ Nenhum equivalente a `store:health` / `store:staging-check` / heartbeat de fila no boilerplate (`app/Console/Commands/` lá tem só `CreateSuperUserCommand.php` e `SyncPermissionsCommand.php`).

---

#### 3. Observabilidade

**Não há Sentry nem equivalente pago.** `grep -i "sentry|bugsnag|flare|rollbar|telescope|nightwatch|pulse|honeybadger"` em `composer.json`, `config/`, `bootstrap/`, `.env.example` → zero ocorrências. A spec declara a escolha: `specs/loja-fase1/08-infra-deploy-golive.md` §"Monitoramento (F1, sem ferramenta paga)". Logo, não existe `before_send`, contexto de release nem scrubbing de SDK — o scrubbing é caseiro e vive no canal de log.

⊖ O boilerplate tem `docs/adr/0006-error-tracking-sentry.md` decidindo Sentry (e `docs/adr/0004-sem-telescope.md`), mas também sem pacote Sentry instalado no momento.

| Peça | Path | Detalhe |
|---|---|---|
| Scrubbing de PII no log | `app/Support/PiiScrubber.php` (115 linhas) | Duas regras: (1) chave sensível → valor inteiro e subárvore viram `[REDACTED]`; (2) padrão inequívoco em qualquer string. `SENSITIVE_KEY_PARTS`: cpf, cnpj, document, email, mail, phone, telefone, celular, whatsapp, address, endereco, logradouro, complemento, bairro, cep, zip, customer, payer, recipient, destinatario, holder, password, secret, token, authorization. `SENSITIVE_KEYS` (match exato): `name`, `nome`. `PATTERNS`: e-mail, CPF formatado, CNPJ formatado, CEP formatado. Não mascara 11 dígitos crus fora de chave sensível — colidiria com `gateway_payment_id` do MP. |
| Tap de canal | `app/Support/ScrubPiiFromLogs.php` (28 linhas) | Processor do **Logger** (não do handler), roda antes do `PsrLogMessageProcessor`. |
| Ligação | `config/logging.php` | `tap => [ScrubPiiFromLogs::class]` nos canais `single`, `daily`, `stderr`. **Não** está em `slack`, `papertrail`, `syslog`, `errorlog`. |
| Limite conhecido, documentado no próprio arquivo | `app/Support/PiiScrubber.php` docblock | `['exception' => $e]` é renderizado pelo formatter do Monolog, fora do alcance do processor. |
| Testes | `tests/Unit/Support/PiiScrubberTest.php` (9 casos), `tests/Feature/LogScrubbingTest.php` (2 casos) | |
| Log viewer | `config/log-viewer.php` + `app/Providers/AppServiceProvider.php:127-129` | `LogViewer::auth(fn($request) => $request->user()?->hasRole(Roles::SUPER_USER))`. Rota `/logs`. Pacote `opcodesio/log-viewer ^3.15`. ⊖ boilerplate também tem `config/log-viewer.php`. |
| Auditoria | `config/audit.php` (6183 bytes) + `app/Resolvers/AuditUserResolver.php` | `owen-it/laravel-auditing ^14.0`. Driver `database`, tabela `audits`, eventos created/updated/deleted/restored, `'exclude' => []` (vazio — nenhuma coluna excluída globalmente), `'console' => false`, `threshold: 0`. ⊕ O boilerplate usa outro pacote: `config/activitylog.php` (spatie). |
| Log de autorização removido | `app/Providers/AppServiceProvider.php:160-175` (docblock de `configGates()`) | Havia um `Log::channel('daily')->info()` por checagem de gate; removido no T-915 por custo de I/O — não por PII. |
| Horizon | `config/horizon.php` (10309 bytes) | Supervisor `store`, filas em ordem `['payments','mail','default']`, `balance: auto`, `tries: 3`, `timeout: 60` (tem de ser < `retry_after` 90 da conexão redis), `memory: 128`, `memory_limit: 64` no master. `maxProcesses` por ambiente: produção 6, staging 2, local 3. `prefix` embute `APP_ENV` porque o Horizon **sobrescreve** o `options.prefix` da conexão Redis. Gate do dashboard: `app/Providers/HorizonServiceProvider.php` — só `SUPER_USER` (o gate publicado por `horizon:install` foi substituído). `horizon:snapshot` agendado a cada 5 min em `routes/console.php`. ⊖ boilerplate também tem `config/horizon.php`. |
| Uptime externo | `RUNBOOK` §8 | Monitor do ploi ou UptimeRobot em `/up` e `/comprar`. |

---

#### 4. Deploy e provisionamento

| Item | Path |
|---|---|
| Script de deploy de **produção** | `specs/loja-fase1/RUNBOOK.md` §3 (linhas 223-378) — não é arquivo executável no repo; mora no painel do ploi, versionado como bloco de código no runbook |
| Script de deploy de **staging** | `RUNBOOK` §3 "O script do **staging** (site 392997)", linhas 446-578 |
| Diferenças documentadas | `RUNBOOK` §3 "O que difere do script de staging" (380), "Notas que evitam incidente" (409), "Uma escolha em aberto" (438) |
| Provisionamento de staging via API do ploi | `scripts/provision-staging.sh` (275 linhas) — one-shot; segredos só por env (`PLOI_TOKEN`, `PLOI_SERVER_ID`, `GH_REPO`, `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `RESEND_KEY`, `MP_WEBHOOK_SECRET`), gera `DB_PASS` e `APP_KEY` com `openssl rand` |
| Spec de staging | `specs/loja-fase1/13-staging-ploi.md` (189 linhas), inclui §3.1 "Cron do scheduler — o passo que some quando o site é criado pela UI" |
| Serviço stateful — Horizon | `RUNBOOK` §4 "Workers — Horizon (ploi → Daemons)": 1 daemon (`php artisan horizon`), `processes: 1` no painel é o master, quem escala é `maxProcesses`; exige `ext-pcntl` + `ext-posix` |
| Scheduler | `RUNBOOK` §5 |
| Webhook do MP por ambiente | `RUNBOOK` §6, inclui §"Quando o webhook volta 401" |
| Go-live / rollback | `RUNBOOK` §10 (sequência), §11 (rollback), §12 (conferência diária semana 1), §13 (referência de comandos) |
| Modelo de branches | `RUNBOOK` §0 — trunk + ponteiros fast-forward (develop → staging → main) |

Não há Reverb, Docker, Dockerfile, docker-compose nem Sail ativo (`boost.json` traz `"sail": false`). Sem arquivos de deploy declarativos (Deployer, Envoy, Ansible) no repo.

**Stubs de env por instância:**
- `.env.example` (8994 bytes) — o único versionado. Fortemente comentado, agrupado por: App/APP_PREVIOUS_KEYS, Log, DB, Session, Filesystem/Queue/Cache, Redis (+`REDIS_PREFIX`, `REDIS_QUEUE_RETRY_AFTER`), Mail/Resend, `STORE_*` (identificação legal, operação, allowlist de e-mail, notify/alert), backup (`STORE_BACKUP_MAX_AGE_HOURS`, `STORE_BACKUP_DRILL_MAX_AGE_DAYS`), super user, Horizon (`HORIZON_PREFIX`, `HORIZON_PATH`), Mercado Pago (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `MP_PAYMENT_API`), Vite. Várias chaves ficam **comentadas de propósito** porque o CI faz `cp .env.example .env` e `CHAVE=` vazia venceria o default do `config/`.
- `.env` e `.env.staging` existem no working tree e **não foram lidos** (guardrail). `.gitignore` traz `.env*` + `!.env.example`, com comentário explicando que a lista explícita anterior não cobria `.env.staging` nem o `.env.staging.rendered` que a spec 13 §3 manda gerar com segredos.
- Bloco "§2. Variáveis de ambiente" do `RUNBOOK` (linhas 78-222) é o stub comentado do `.env` de produção.

---

#### 5. `docs/` e arquivos de agente

**`.ai/rules/` NÃO EXISTE no spinmax.** ⊖ Só o boilerplate tem (`/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/.ai/rules/`, 22 arquivos, com `index.md` mapeando glob → arquivo: `app/**`→app.md, `app/Console/Commands/**`→commands.md, `app/Http/Controllers/**`→controllers.md, `app/Enum/**`→enum.md, `app/Events/**`→events.md, `resources/css/**`→css.md, `resources/js/**`→js.md, `app/Listeners/**`→listeners.md, `app/Http/Middleware/**`→middleware.md, `app/Models/**`→models.md, `app/Policies/**`→policies.md, `app/Providers/**`→providers.md, `app/Http/Requests/**`→requests.md, `app/Http/Resources/**`→resources.md, `routes/**`→routes.md, `database/migrations/**`→migrations.md, `database/seeders/**`→seeders.md, `app/Support/**`→support.md, `tests/**`→tests.md, `app/Traits/**`→traits.md, `app/ValueObjects/**`→value-objects.md).

**Arquivos de agente no spinmax:**

| Path | Nota |
|---|---|
| `AGENTS.md` (280 linhas) | Gerado pelo Laravel Boost — genérico da stack. **Byte-a-byte idêntico** a `.github/copilot-instructions.md` (`diff -q` sem saída). Sem seção de convenção específica do projeto. |
| `.github/copilot-instructions.md` (280 linhas) | idem acima |
| `.cursor/rules/laravel-boost.mdc` (283 linhas), `.cursor/rules/mcp-instructions.mdc` (4 linhas) | |
| `.cursor/mcp.json` | Servers `laravel-boost` e `herd` (chave `env.SITE_PATH`). Valores não transcritos. |
| `.cursor/skills/{inertia-react-development,pest-testing,tailwindcss-development}/SKILL.md` | |
| `.codex/skills/{inertia-react-development,pest-testing,tailwindcss-development}/SKILL.md` | |
| `.github/skills/{inertia-react-development,pest-testing,tailwindcss-development}/SKILL.md` | |
| `boost.json` | `agents: [cursor, codex, copilot]`, `guidelines: true`, `herd_mcp: true`, `mcp: true`, `sail: false`, `skills: [pest-testing, inertia-react-development, tailwindcss-development]` |
| `.claude/settings.local.json` | Só `permissions.allow: ["Bash(gh issue *)", "Bash(gh pr *)"]`. Está no `.gitignore`. |
| `loop.md` (2486 bytes) | ⊕ Prompt de iteração lido pelo `/loop` sem argumento: aponta para `specs/loja-fase1/LOOP.md` e `STATUS.md`, define protocolo de 6 passos por task (pre-flight → task ⬜ → escopo → gate verde → commit `[T-xxx]` → bloqueio 🚫). |
| **Ausente: `CLAUDE.md`** | ⊖ boilerplate tem (57 linhas). |
| **Ausente: `.agents/skills/`** | ⊖ boilerplate tem 6 skills com `references/` e `rules/`. |
| **Ausente: `.mcp.json` na raiz** | ⊖ boilerplate tem. |

**`docs/` (11 arquivos, todos untracked)** — documentação de **cliente**, não de engenharia:

| Path | Natureza |
|---|---|
| `docs/2026-08-04-roteiro-homologacao.md` (187 linhas) + `.html` | Roteiro de homologação em 5 passos + anexo com cartões de teste do MP |
| `docs/entregas-pendentes-spinmax.md` (162 linhas) + `.html` | Lista de pendências do cliente (frete, textos legais, WhatsApp, preço, chave Pix) |
| `docs/reunioes/2026-08-03-pauta.md` (125 linhas) + `.html` | Pauta de reunião |
| `docs/2026-08-03-mensagem-whatsapp.md`, `docs/2026-08-05-mensagem-whatsapp.md`, `docs/2026-08-06-faq-respostas.md` | Rascunhos de comunicação com o cliente |
| `docs/Termo de política de privacidade - Spinmax.docx`, `docs/Tabela Platinum 2026_Corredor de Negócios.xls` | Binários do cliente. **Não abertos.** |

⊖ O boilerplate usa `docs/` para engenharia: `docs/adr/0001..0006` + `docs/adr/README.md` + `docs/migration/PLAYBOOK.md`. O spinmax **não tem ADRs**; as decisões arquiteturais moram embutidas em comentários longos no código e em blocos justificativos do `RUNBOOK` (ex.: §9 "três decisões que valem ficar registradas", §9 "O backup diário já roda no Linode. Ainda precisa do R2?" com tabela comparativa cenário × snapshot × dump).

**`specs/` (203 arquivos rastreados)** ⊕ — o corpo real de documentação de engenharia:
- `specs/loja-fase1/` — 00-visao-geral, 01-dados-e-migracoes, 02-checkout-e-pagamento, 03-frete, 04-painel-pedidos-clientes, 05-emails-transacionais, 06-frontend-publico, 07-legal-lgpd-seguranca, 08-infra-deploy-golive, 09-testes-e-aceite, 10-roles-permissoes-spinmax, 11-identidade-visual, 12-migracao-orders-api, 13-staging-ploi, 18-precos-por-meio-de-pagamento, 19-densidade-formularios-painel, 20-midia-peso-e-entrega + `LOOP.md`, `RUNBOOK.md` (1130 linhas), `STATUS.md`
- `specs/loja-fase2/` — `14-bling-fundacao.md`, `prep-f2-bling.md` (untracked)
- `specs/ui-responsividade/` — `LOOP.md`, `tools/README.md` + 6 scripts `.mjs` (`audit.mjs`, `audit-interactive.mjs`, `landing-header.mjs`, `landing-shots.mjs`, `photo-quality.mjs`, `shots.mjs`) + ~180 screenshots antes/depois em `shots/{R-201,R-202,R-203,R-204,R-401,R1,T-1108,T-1201}/` nos breakpoints 360/390/768/1024/1440, light e dark

---

#### 6. `README.md` — seções que existem

`README.md` (5540 bytes, 136+ linhas): `# Spinmax — Loja (Fase 1)` · `## Provisionar o ambiente local` (`### 1. Serviços`, `### 2. Dependências`, `### 3. .env`, `### 4. Banco e dados de trabalho`, `### 5. Subir`, `### 6. Conferir`) · `## Rodar os testes` · `## Commits`.

Não tem seção de arquitetura, de decisões nem de deploy — deploy/go-live estão no `RUNBOOK`. ⊖ O README do boilerplate (59 linhas) tem `## Requisitos`, `## Quickstart`, `## Scripts principais`, `## Arquitetura`, `## Convenções de git`, `## Testes`, `## Decisões de arquitetura`.

---

#### 7. Raiz do projeto — o que não é padrão Laravel

| Path | O que é | ⊕/⊖ |
|---|---|---|
| `scripts/` (5 arquivos rastreados) | `backup-r2.sh`, `restore-drill.sh`, `provision-staging.sh`, `optimize-photos.sh` (189 linhas), `check-contrast.mjs` (208 linhas) | ⊕ conteúdo (boilerplate tem `scripts/` com outro propósito) |
| `specs/` | ver §5 | ⊕ |
| `docs/` | untracked, cliente | conteúdo ⊕/⊖ divergente |
| `out/` | untracked — artefatos de auditoria visual (PNGs, `.gray`, `audit.json`, `cls-antes/depois.json`, `.mjs` avulsos: `checkout-check.mjs`, `dupe.mjs`, `e2e.mjs`) | ⊕ (lixo de trabalho, não versionado) |
| `loop.md` | prompt de `/loop` | ⊕ |
| `boost.json` | config do Laravel Boost | ⊖ boilerplate também tem |
| `.mise.toml` | `[tools] node = "24"` | ⊖ boilerplate também tem |
| `pnpm-workspace.yaml` | `allowBuilds: esbuild`; `overrides`: axios ≥1.16.0, form-data ≥4.0.6, postcss ≥8.5.18, shell-quote ≥1.9.0 (pins de segurança) | ⊖ boilerplate também tem |
| `stubs/` (54 arquivos, todos rastreados) | stubs do Laravel publicados via `stub:publish` | |
| `.husky/` | `pre-commit` (Pint fix + ESLint/Prettier fix + re-stage por `git diff --cached -z` + `composer ci:lint` + `pnpm ci:lint` + `composer ci:test` + `pnpm ci:test`), `commit-msg` (proíbe commit em main/develop; exige ID de issue no nome da branch; **reformata** a mensagem para `[ID]: msg`). **Não há `pre-push`.** | ⊖ boilerplate tem `pre-push` e `prepare-commit-msg` |
| `.github/workflows/ci.yml` | 5 jobs: `frontend` (Node 24: types, lint:check, test:run, build), `backend` (PHP 8.4 + service MySQL 8 só para o gate de migrations; Pest em SQLite `:memory:`; Playwright Chromium + `pest --group=browser`; upload de screenshots), `quality` (`pint --test`, `format:check`), `security` (`composer audit` filtrado por jq para high/critical + `pnpm audit --prod --audit-level high`), `rector` (`continue-on-error: true`) | ⊕ jobs de segurança e o gate de migrations MySQL |
| `.github/workflows/semgrep.yml` | SAST em container `semgrep/semgrep`, em PR/push + cron diário `17 5 * * *` + `workflow_dispatch`; SARIF publicado como artifact; usa `secrets.SEMGREP_APP_TOKEN` | ⊕ |
| `.editorconfig`, `.prettierrc`, `.prettierignore`, `eslint.config.js`, `pint.json`, `rector.php`, `tsconfig.json` (13210 bytes), `vite.config.ts`, `components.json`, `phpunit.xml`, `.gitattributes` | ferramental padrão da casa | |
| **Ausente: `phpstan.neon.dist`** | ⊖ boilerplate tem larastan configurado; `composer ci:check` do spinmax é só `ci:lint` + `ci:test` | |
| `.pnpm-store/` | store local do pnpm no repo | |

**Fora da raiz do projeto Laravel**, em `/Users/cristianomorgante/workspace/laravel/clients/spinmax/`: `_to_delete/` e um `.docx` de aditivo contratual — não fazem parte do repo (a raiz git é `app/`).

---

#### Limitações desta varredura

- Não executei `php artisan`, `composer`, `pnpm`, nem a suíte de testes (guardrail). Contagens de casos de teste vêm de `grep -c "^\(it\|test\)("`, não de execução.
- `.env`, `.env.staging` e os binários `.docx`/`.xls` de `docs/` não foram abertos.
- Os scripts de deploy de produção e staging vivem no painel do ploi; o que existe no repo é a transcrição em `RUNBOOK` §3 — não consegui confirmar que o painel e o runbook estão em sincronia.
- `docs/` e `out/` estão untracked no commit pinado; se o inventário for consumido a partir de um clone limpo de `e4ec01e`, esses dois diretórios não existirão.

---

### Secagem — o que as frentes não enumeraram

#### Faltou

**Conteúdo e mídia versionados (nenhuma frente citou o arquivo)**

| Path | O que é | Quem consome |
|---|---|---|
| `resources/legal/privacy.md` (81 L), `resources/legal/terms.md` (48 L), `resources/legal/exchanges.md` (48 L) | O **texto legal em si** — fonte das 3 rotas `legal.*`. As frentes citaram `config('store.legal.path')`, o `LegalController`, o `.legal-prose` do `shop.css` e `tests/Feature/Store/LegalPagesTest.php`, mas nunca os três arquivos que carregam o conteúdo | `app/Http/Controllers/Shop/LegalController.php` |
| `public/assets/fotos/` (38 arquivos), `public/assets/videos/` (8), `public/assets/videos/posters/` (7) — **53 arquivos rastreados** | A mídia da landing, escaneada em runtime | `app/Http/Controllers/LandingController.php:249` (`public_path('assets/fotos')`), `:269` (videos), `:338` (posters); `app/Console/Commands/VideosGeneratePosters.php`; `scripts/optimize-photos.sh` |
| `public/fonts/woff2/` — **40 faces em 4 famílias**: `akmorn-grotesque/` (18), `aptos/` (11), `merriweather-sans/` (5), `montserrat/` (6) | As frentes citam as famílias em `_fonts.css`/`shop.css`, nunca o diretório nem a contagem. Inclui um arquivo duplicado por download: `public/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2` (com espaço no nome) | `resources/css/_fonts.css`, `resources/css/shop.css` |
| `public/vendor/log-viewer/` (7 arquivos: `app.css`, `app.js`, `app.js.LICENSE.txt`, `img/log-viewer-{32,64,128}.png`, `mix-manifest.json`) | Assets publicados do `opcodesio/log-viewer` **commitados** no repo | `/logs` |

**Superfície de SEO / PWA (zero menções)**

- `public/robots.txt` (11 linhas, com cabeçalho de comentário referenciando a spec 08): `Disallow: /checkout` e `Disallow: /pedido` — a metade "robô não rastreia" da dupla com o `noindex` do `shop-layout.tsx`. Travado por `tests/Feature/Store/RobotsTxtTest.php`, também não enumerado.
- `public/site.webmanifest` — manifesto PWA: `display: standalone`, `background_color: #F8FFE5`, `theme_color: #00647B`, ícone `/spinmax-icon-verde.svg` `purpose: any maskable`. É o **terceiro** lugar onde os hex da marca são declarados (além de `_brand.css` e `vendor/mail/html/themes/default.css`), fora do alcance de `scripts/check-contrast.mjs`.
- `public/favicon.ico`, `public/logo.svg`, `public/spinmax-icon-verde.svg`, `public/spinmax-logo-horizontal-padrao.svg`, `public/spinmax-logo-vertical-padrao.svg`, `public/.htaccess` — só `public/spinmax-logo-email.png` foi citado (pela frente de mails).

**`resources/views/landing.blade.php` — 2.090 linhas, o maior arquivo-fonte do repositório**

A frente de frontend cita esse arquivo apenas por duas linhas (`:81` `@vite`, `:83` `@include('partials.meta-pixel')`) e afirma que é "Blade pura, **sem JS**". Não enumerado:

| Bloco | Linhas | Conteúdo |
|---|---|---|
| 5 blocos `<script>` inline, **593 linhas de JS vanilla** | `62-74`, `85-93`, `229-242`, `244-246`, **`1534-2087` (554 L)** | Toggle de tema (mesma chave `appearance` do painel), lightbox de galeria (`#gallery-lightbox`), lightbox de vídeo (`#video-lightbox`), menu mobile, `#back-to-top`. **Fora do Vite, do TypeScript, do ESLint e do Vitest** — nenhuma das 3 entradas do `vite.config.ts` carrega JS para a landing |
| 3 blocos `application/ld+json` | `:85`, `:229` (FAQPage), `:244` | O JSON-LD que a nota de `config/services.php` sobre `spinmax.marketplaces` menciona (`Offer` com URL errada) mora aqui — nenhuma frente mostrou onde |
| 11 `<section>` com id | `#especificacoes`, `#videos`, `#beneficios`, `#fotografia`, `#atletas`, `#galeria`, `#essencia-historia` (+ `#manifesto`, `#quem-somos`), `#perguntas`, `#comprar` | A estrutura da landing, incluindo o bloco de marketplaces (`:1429`) e a linha legal razão social · CNPJ · endereço (`:1463`) |

**Rotas nunca abertas nome a nome**

- `routes/settings.php` (7 rotas) só apareceu como número. Contém **`DELETE settings/profile` → `profile.destroy`** (`routes/settings.php:15`) — autoexclusão de conta, comportamento de segurança que nenhuma frente registrou (nem o `Settings/ProfileController::destroy`, nem o `components/settings/delete-account-info-dialog.tsx` foi ligado a ele). E `routes/settings.php:20` define `settings/appearance` como **closure** — a única rota do projeto sem controller.
- `routes/auth.php` (12 rotas) idem: `POST logout` (`routes/auth.php:52`) é a única rota de escrita de auth **sem throttle nenhum**, junto com `POST login` (`:18`) que a frente de rotas já apontou.

**`composer.json` — bloco `require` de produção (10 pacotes) nunca tabulado**

Só o `require-dev` ganhou tabela. Faltou: `php ^8.4`, `inertiajs/inertia-laravel ^2.0`, `laravel/framework ^12.0`, `laravel/horizon ^5.48`, **`laravel/tinker ^2.10.1`**, `mercadopago/dx-php ^3.10`, `opcodesio/log-viewer ^3.15`, `owen-it/laravel-auditing ^14.0`, `resend/resend-laravel ^1.4`, **`tightenco/ziggy ^2.4`**. O nome do pacote é `simplify/spinmax-app`.

**Comportamento de painel não enumerado**

- `app/Http/Controllers/User/IndexController.php:32-37` — a listagem de usuários do painel **esconde contas `super_user`** do cliente. Regra por **cargo**, não por e-mail; `super_user` continua vendo tudo. Travado por `tests/Feature/Store/MaintenanceAccountsHiddenTest.php`. Nenhuma das frentes (controllers, RBAC, testes) registrou isso.

**Testes que representam feature não enumerada**

| Path | O que trava |
|---|---|
| `tests/Feature/Store/MaintenanceModeTest.php` | Contrato do `preventRequestsDuringMaintenance(except: webhooks/*)`. Usa uma `fakeMaintenanceMode()` que injeta uma classe anônima `Illuminate\Contracts\Foundation\MaintenanceMode` no container em vez de escrever `storage/framework/down` (teste que morresse no meio prenderia a app local em 503) |
| `tests/Feature/Store/MaintenanceAccountsHiddenTest.php` | (acima) |
| `tests/Feature/Auth/RegistrationTest.php` | **Trava a ausência** do registro público: `GET /register` e `POST /register` devem devolver 404. A frente de controllers registrou o ⊖ do `RegisteredUserController`, mas não o teste que impede a volta |
| `tests/Feature/LandingTest.php`, `tests/Feature/LandingGalleryTest.php`, `tests/Feature/LandingVideosTest.php`, `tests/Feature/VideosGeneratePostersCommandTest.php` | Toda a cobertura da landing (a única superfície Blade) |
| `tests/Unit/ExampleTest.php` | Stub do Laravel nunca removido (par do `something()`/`toBeOne` que a frente de testes citou no `Pest.php`) |

**Diretório inteiro só citado de passagem**

- `app/Traits/` — único arquivo `app/Traits/Models/HasRolesAndPermissions.php`, citado por 3 frentes como "fora do escopo" e nunca descrito: é ele que define `permissionCacheKey()`, o `rememberForever` de `user:{id}:permissions`, as relações `role()`/`permissions()` do `User` e o `json_decode($permission->pivot->meta)` cru (⊖ o boilerplate usa `app/Models/PermissionUser.php`).

---

#### Correções de fato

| # | Onde | Alegado | Medido |
|---|---|---|---|
| 1 | Frente de controllers, §"Limitações" | "`routes/web.php` (163 linhas, **63 declarações de rota**)" | 163 linhas ✔, **52** declarações. Contradiz a própria frente de rotas (que diz 52) |
| 2 | Frente de rotas, §2d, bloco `store.` | "**22**" rotas no grupo `prefix('store')` | **19** (`web.php` linhas 116,120,121,125,128,133–137,141,142,146–149,153–155). Com 22 a soma da tabela dá 55, não os 52 declarados no topo da mesma frente |
| 3 | Frente de jobs, §"Escopo medido" e §3 | "**8 listeners**"; "os **6** listeners de `app/Listeners/Store/` são exclusivos" | `app/Listeners/` tem **10** arquivos (a própria tabela da §3 lista 10 linhas); `app/Listeners/Store/` tem **8**, dos quais **7** são exclusivos (o boilerplate tem só `EnforceMailAllowlist` em `app/Listeners/`) |
| 4 | Frente de frontend, §2 | "**29 páginas**, 6.286 LOC" | **28** arquivos em `resources/js/pages/` — e a própria tabela lista 28 linhas |
| 5 | Frente de frontend, §3 | "`components/` — **96 arquivos**" | **94** (`git ls-files resources/js/components \| wc -l`) |
| 6 | Frente de frontend, §3 | "`components/shop/` (**7 arquivos**)" | **6** — a tabela abaixo do título lista 6 |
| 7 | Frente de frontend, §3 | "`components/store/` (**9 arquivos**)" | **8** — a tabela lista 8 |
| 8 | Frente de frontend, §14 | "**30 arquivos** em `resources/js/test/`"; "`test/shop/` (10)"; "`test/store/` (11)" | **35** arquivos no diretório (**33** especs + `setup.ts` + `vitest.d.ts`); `test/shop/` tem **11** (a própria lista enumera 11), `test/store/` tem **12** (enumera 12). A frente de testes acerta: "33 arquivos" |
| 9 | Frente de frontend, §9 | "`landing.blade.php:81` — `@vite('resources/css/landing.css')`, **sem JS** (landing é Blade pura, não Inertia)" | Sem *entry* Vite de JS ✔, mas o arquivo carrega **5 `<script>` inline, 593 linhas** de JS vanilla (`1534-2087` sozinho tem 554) |
| 10 | Frente de integrações, §4 | "o boilerplate tem o equivalente em **`app/Listeners/PiiAwareTap.php`**, `PiiScrubber.php`, `PiiScrubbingProcessor.php`" | Esse path **não existe**. É `app/Support/Logging/{PiiAwareTap,PiiScrubber,PiiScrubbingProcessor}.php` — como a §7 da mesma frente diz corretamente. `app/Listeners/` do boilerplate tem só `EnforceMailAllowlist.php`, `LogImpersonateStarted.php`, `LogImpersonateStopped.php` |
| 11 | Frente de ops, §7 | "`.pnpm-store/` \| store local do pnpm **no repo**" | Não está rastreado (`git ls-files .pnpm-store` → 0) **nem** listado no `.gitignore`; o diretório contém apenas `v10/` vazio, por isso não aparece em `git status` |
| 12 | Frente de ops, §5 | "~180 screenshots" em `specs/ui-responsividade/shots/` | **175** arquivos rastreados sob `shots/` (de 203 arquivos em `specs/`) |

Verificados e **corretos** (para não gerar retrabalho): as 52 rotas totais de `web.php`; 72 rotas na aplicação; 24 migrations; 15 models; 12 commands; 4 jobs; 10 events; 16 form requests; 3 policies; 2 rules; 6 middlewares; 5 enums; 12 factories; 5 seeders; 16 configs; 117 arquivos em `tests/` (93 Feature / 18 Unit); 54 stubs; 209 arquivos em `resources/js/`; 30 primitivos em `components/ui/`; 16 hooks; 8 utils; 10 types; 11 layouts; 4 libs; 10 views de mail + 2 partials; 16 blades + 1 CSS em `vendor/mail/`; `.env.example` com 195 linhas / 51 chaves ativas / 31 comentadas; `lang/pt_BR/validation.php` com 312 linhas; e todas as contagens de linha citadas para `ProcessMercadoPagoWebhookJob` (225), `HealthCommand` (304), `StagingCheckCommand` (438), `AppServiceProvider` (233), `LandingController` (428), `UpdateSettingsRequest` (373), `OrderFilters` (157), `StoreSettings` (326), `config/store.php` (537) e os 5 arquivos de `scripts/`.
