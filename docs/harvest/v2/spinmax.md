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


## Dimensão 1 — Segurança (2026-08-12)

Workflow de **16 agentes**: 4 frentes de caça em pipeline, cada uma verificada por **3 lentes adversariais
independentes** (refutar / risco de absorção / atualidade) assim que retornou. 0 erros, ~1,57M tokens de
subagente, 496 chamadas de ferramenta, ~22 min. **28 candidatos levantados.**

> Nenhum candidato passou intacto pelas 3 lentes — o padrão da rodada se repetiu pela quarta célula seguida.
> O que está abaixo é o material bruto com os vereditos. A curadoria (o que vira fatia) está no BACKLOG.



### Frente: Autenticação, autorização e IDOR

#### Candidatos levantados

### Autenticação, autorização e IDOR

Comparei a matriz de gates, as policies, os caminhos de mutação de RBAC, a impersonation e toda superfície de binding por `{id}`/`{uuid}` dos dois lados. O achado mais pesado da frente **não veio do spinmax estar errado** — veio de o spinmax ter fechado, por matriz de permissão, uma escada que o boilerplate deixou aberta.

---

#### C1 · Escada viva no boilerplate: o `admin` concede `impersonate_users` — a permissão que o seeder lhe nega — a qualquer conta abaixo dele
- **Pergunta**: (b) guard-rail contra erro daqui — mas o erro está **no boilerplate**, e o spinmax é a prova de que o desenho correto é outro
- **Evidência (spinmax @ e4ec01e)**: `tests/Feature/User/PermissionMutationCeilingTest.php:44-57` — a matriz da spec 10 tirou `manage_permissions` do Administrador de propósito: *"dar um acesso avulso, fora do cargo, é ferramenta de suporte da Simplify. O Admin monta cargo (`manage_roles`) e escolhe quem fica em qual (`assign_roles`) — furar o próprio desenho, não."* O teste `it('does not let an admin sync permissions even onto a lower-priority user')` prova 403 mesmo **para alvo de prioridade menor**. Complementarmente, `app/Http/Controllers/PermissionRole/UpdateController.php:107-111` guarda a regra que falta do outro lado: `$concedeAlemDoProprio = array_diff($permissions, $this->permissionNamesOf($actor)); if (...) abort(403, 'Você não pode conceder um acesso que você mesmo não tem.');`
- **Equivalente no boilerplate**: `database/seeders/PermissionRoleSeeder.php:46` — `Roles::ADMIN->value => array_filter($allPermissions, fn($perm) => $perm !== Permissions::IMPERSONATE_USERS->value)`, ou seja o admin **fica** com `manage_permissions` e `manage_roles`. `app/Policies/UserPolicy.php:108-115` (`mutatePermissions`) checa só `manage_permissions` + `outranks()` — nunca *quais* permissões. `app/Http/Controllers/PermissionRole/SyncPermissionsController.php:20-25` faz `Gate::authorize('mutatePermissions', $user)` e em seguida `$user->permissions()->sync($permissionIds)` sem nenhum filtro de conteúdo.
- **O que absorver / travar**: cadeia completa e reprodutível hoje — admin (90) faz `POST /users/{manager}/sync-permissions` com `permissions: ['impersonate_users']`; passa no `can:manage_users` da rota (`routes/web.php:62`), no `SyncPermissionsRequest::authorize()` (`can(MANAGE_USERS)`) e no `mutatePermissions` (90 > 70). Com `manage_users` ele então troca a senha desse manager (`UpdateUserRequest.php:46` aceita `password`; `UpdateController.php:101-102` aplica) e assume a conta. Duas correções, ambas cabíveis: (1) portar o `array_diff` contra `getAllPermissions()` do `PermissionRole\UpdateController` para o `mutatePermissions`/`SyncPermissionsController` — o boilerplate já tem a regra escrita, só não a aplica nos dois caminhos; (2) seguir o spinmax e tirar `manage_permissions` do `ADMIN` no seeder. Somar teste espelhando `PermissionMutationCeilingTest`.
- **Superfície no boilerplate hoje**: sim, integral — rota, request, policy, service e seeder todos existem e a cadeia é exercitável com os cargos padrão (`admin` × `manager`).

---

#### C2 · Duas portas de concessão com regras diferentes: o editor de cargos proíbe "conceder o que você não tem", o grant individual não
- **Pergunta**: (a) absorver do spinmax
- **Evidência (spinmax @ e4ec01e)**: `app/Http/Controllers/PermissionRole/UpdateController.php:62-79` — *"`can:manage_roles` responde 'pode mexer em cargo?', nunca 'pode mexer NESTE cargo, com ESTAS permissões?' — e essa diferença era uma escada. […] proteger só pela matriz é proteger com a chave dentro da fechadura."* E `tests/Feature/User/RoleEditorCeilingTest.php:112-135`, que exercita as duas metades: negar o que o ator não tem, **e** permitir delegar o que ele tem (*"a trava é sobre ampliar, não sobre delegar"*).
- **Equivalente no boilerplate**: `app/Http/Controllers/PermissionRole/UpdateController.php:80-111` — a regra **já foi absorvida** para o editor de cargos (e até melhorada: usa `getAllPermissions()`, somando cargo + permissões avulsas, contra o `permissionNamesOf()` do spinmax que só lê o cargo). O que não existe é o análogo em `User\GrantPermissionController` / `PermissionRole\SyncPermissionsController`.
- **O que absorver / travar**: extrair a checagem de "superfície do ator" para um ponto só (policy ou service) e chamá-la nos **três** caminhos de concessão (role editor, grant individual, sync). Hoje o mesmo sistema responde duas coisas diferentes para a mesma pergunta, e o caminho permissivo é justamente o que o `admin` alcança.
- **Superfície no boilerplate hoje**: sim — `UpdateController` (com a regra), `GrantPermissionController` e `SyncPermissionsController` (sem), todos vivos.

---

#### C3 · Matriz cargo × tela como teste cartesiano, escrita à mão como segunda opinião do seeder
- **Pergunta**: (a) absorver do spinmax
- **Evidência (spinmax @ e4ec01e)**: `tests/Feature/Store/AdminPermissionMatrixTest.php:9-18` — *"A matriz da spec 10 §Matriz, **inteira**: todo cargo contra toda tela do painel — 6 × 7 = 42 combinações, `assertOk` ou `assertForbidden`. O allow-list abaixo é escrito à mão de propósito. Derivá-lo do `PermissionRoleSeeder` faria o teste concordar consigo mesmo […] Aqui a tabela é a segunda opinião — se ela e o seeder discordarem, fica vermelho."* O dataset gera o produto cartesiano (`:41-48`) e `:51-55` afirma cada célula. Fecha com `:66-68`, que trava `visitor` em zero permissões — *"o papel-piso existe para significar 'sem acesso'"*.
- **Equivalente no boilerplate**: não existe teste cartesiano. O que existe é um par por controller: `tests/Feature/User/IndexControllerTest.php:37-41` (`it('forbids a user without manage_users')` com **um** cargo, `VIEWER`) e `:43-45` para guest. `grep 'Roles::cases()' tests/` só aparece em contagem de seletor e catálogo (`PermissionRole/RoleSelectorTest.php`, `PermissionCatalogTest.php`), nunca contra rota.
- **O que absorver / travar**: um `tests/Feature/Permissions/PermissionMatrixTest.php` com dataset `Roles::cases() × {telas gateadas}` e allowlist literal, deliberadamente **não** derivada do `PermissionRoleSeeder`. É o teste que teria pegado o C1 sozinho: a célula "admin entra em `role-permissions`" obrigaria alguém a escrever à mão que o admin pode redesenhar cargos — e a decisão apareceria na revisão em vez de ficar implícita num `array_filter`.
- **Superfície no boilerplate hoje**: sim — 5 cargos × 4 telas gateadas (`users.index`, `role-permissions`, `users.permissions.show`, e as rotas de escrita), suficiente para o teste não passar vacuamente.

---

#### C4 · `EnsureUserIsActive` global × por grupo — boilerplate superior, mas seu teste não prova a cobertura
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `routes/web.php:61` — `Route::middleware(['auth', 'verified', \App\Http\Middleware\EnsureUserIsActive::class])->group(...)`, inline no grupo, sem alias. `bootstrap/app.php:43-48` não o inclui no `web(append:)`. Consequência verificada: `routes/settings.php:11` (`Route::middleware('auth')`) e `routes/auth.php:35` ficam **fora** dele — conta desativada mid-sessão continua trocando e-mail e senha em `/settings/*`.
- **Equivalente no boilerplate**: `bootstrap/app.php:43` — `EnsureUserIsActive::class` dentro do `$middleware->web(append:)`, cobrindo os três arquivos de rota. **Boilerplate é superior aqui.**
- **O que absorver / travar**: nada a absorver; o guard-rail é contra a regressão. `tests/Feature/EnsureUserIsActiveTest.php:14-26` só exercita `/dashboard` — uma rota de `web.php`. Mover o middleware de volta para o grupo de `web.php` (o jeito "natural" de escrever) mantém esse teste verde e reabre exatamente o buraco do spinmax. Acrescentar um caso que atravesse arquivo de rota: usuário desativado mid-sessão levando redirect em `route('profile.edit')` (de `settings.php`).
- **Superfície no boilerplate hoje**: sim — o middleware, os três arquivos de rota e o teste existem; é um caso a mais no arquivo que já está lá.

---

#### C5 · Auto-cadastro público ligado por padrão no boilerplate; o spinmax apagou a rota
- **Pergunta**: (b) guard-rail contra a limitação daqui — o spinmax dá o argumento explícito
- **Evidência (spinmax @ e4ec01e)**: `routes/auth.php:14-33` — o grupo `guest` tem **login, forgot-password e reset-password apenas**; não há `register`. O racional está gravado em `app/Http/Controllers/User/StoreController.php:89-92`: *"verificação de e-mail existe para provar que quem se cadastrou controla a caixa — e aqui NÃO EXISTE cadastro público: `routes/auth.php` não tem rota de registro, e a única forma de uma conta existir é um admin com `manage_users` digitar o endereço, ou o `store:super-user`."*
- **Equivalente no boilerplate**: `routes/auth.php:16-20` — `GET register` + `POST register` públicos. `app/Http/Controllers/Auth/RegisteredUserController.php:31-41`: `User::create([...])` sem `role_id`, depois `event(new Registered($user))` e **`Auth::login($user)` imediato**, antes de qualquer verificação. `database/migrations/0001_01_01_000000_create_users_table.php:12` dá `is_active` default `true`.
- **O que absorver / travar**: qualquer app derivado do boilerplate nasce aceitando conta de qualquer pessoa da internet — sessão autenticada, `is_active = true`, `role_id` null. Não há escalada (sem cargo, todos os gates negam), mas há sessão, cota de e-mail, poluição de `users.index` e uma porta que ninguém decidiu abrir. Como o boilerplate é o padrão de painéis internos da casa, o default deveria ser o do spinmax: rota fora, com um bloco documentado de como reativá-la. Se ficar, precisa de um teste que declare a decisão em voz alta (hoje `tests/Feature/Auth/RegistrationTest.php` só afirma que o cadastro **funciona**, o que é o oposto de uma decisão consciente).
- **Superfície no boilerplate hoje**: sim — rota, controller, página React e teste todos presentes e verdes.

---

#### C6 · Literal `"user:{id}:permissions"` escrito à mão: o boilerplate já limpou, mas nada impede a volta
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: o helper existe — `app/Traits/Models/HasRolesAndPermissions.php:48-51`, com docblock avisando que *"escrever a string à mão foi exatamente o que criou a chave morta `role:{id}:permissions` (T-906)"* — e **cinco call sites o ignoram assim mesmo**: `app/Http/Controllers/User/UpdateController.php:105`, `User/StoreController.php:113`, `PermissionRole/SyncPermissionsController.php:31`, `PermissionRole/RevokeRoleController.php:86`, `PermissionRole/AssignRoleController.php:131` — todos `Cache::forget("user:$user->id:permissions")`. Dois outros (`PermissionRole/UpdateController.php:149`, `RbacSyncCommand.php:126`) usam o helper. Sete pontos, duas convenções.
- **Equivalente no boilerplate**: `app/Traits/Models/HasRolesAndPermissions.php:49` define `permissionCacheKey()` e **os 8 call sites usam o helper** (`User/UpdateController.php:111`, `User/StoreController.php:87`, `PermissionRole/{Sync,Update,AssignRole,RevokeRole}Controller`, `SyncPermissionsCommand.php:116`, `PermissionRoleSeeder.php:74`). **Boilerplate é superior.**
- **O que absorver / travar**: um teste de arquitetura/regex que falhe diante de `user:` + `:permissions` como literal fora do trait. É invalidação de cache de **permissão** com `rememberForever`: o sintoma de uma chave divergente é permissão revogada que continua valendo para sempre — silenciosa, e nenhum teste funcional a pega, porque cada teste isolado usa o mesmo caminho que gravou.
- **Superfície no boilerplate hoje**: sim — 8 call sites reais para o teste vigiar; não passa vacuamente.

---

#### C7 · Assinatura assimétrica no mesmo recurso: `shop.order.show` é `signed`, `shop.order.status` bind no mesmo `{order:uuid}` sem assinatura
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `routes/web.php:38-40` — `Route::get('pedido/{order:uuid}', Shop\OrderStatusController::class)->middleware('signed')`. Sete linhas abaixo, `routes/web.php:51-53` — `Route::get('pedido/{order:uuid}/status', Shop\OrderStatusPollController::class)->middleware('throttle:60,1')`, **sem `signed`**, deliberadamente fora do grupo `public.store`. O controller assinado (`app/Http/Controllers/Shop/OrderStatusController.php:30-73`) devolve nome do cliente, CPF mascarado, endereço de entrega e QR Pix; o não-assinado (`OrderStatusPollController.php:19-24`) devolve só `status`/`paid`/`settled`. O link é gerado sem expiração: `app/Http/Controllers/Shop/OrderLookupController.php:41` — `URL::signedRoute('shop.order.show', ['order' => $order->uuid])`, nunca `temporarySignedRoute`.
- **Equivalente no boilerplate**: não existe rota `signed` de aplicação. A única é `routes/auth.php:39-41` (`verification.verify`, `['signed','throttle:verification']`), do Breeze, com expiração vinda do framework.
- **O que absorver / travar**: o `uuid` v4 (`app/Models/Order.php:89`, `Str::uuid()`) segura a enumeração, então não é IDOR explorável — mas o desenho é frágil por outro motivo: o `signed` de uma rota declara que o `uuid` sozinho **não** é credencial suficiente, e a rota irmã trata o mesmo `uuid` como se fosse. Vira regra em `.ai/rules`, não teste: (i) modelo alcançado por rota `signed` não pode ter rota irmã sem assinatura que exponha mais que o mínimo; (ii) link assinado que vai por e-mail usa `temporarySignedRoute`, porque `signedRoute` é credencial permanente na caixa de entrada de alguém.
- **Superfície no boilerplate hoje**: **quase nula, e isso é honesto dizer** — só `verification.verify`. Um teste varrendo rotas `signed` passaria por vacuidade. O valor está na regra escrita, para o primeiro projeto derivado que criar uma URL de acompanhamento público.

---

#### C8 · Onde o boilerplate já é superior — não regarvestar
- **Pergunta**: (a), respondida com "nada a absorver"
- **Evidência (spinmax @ e4ec01e) × boilerplate**, cinco pontos verificados um a um:
  - **`UserPolicy` com teto de prioridade + ator real**: `app/Policies/UserPolicy.php:137-183` no spinmax e `:142-184` no boilerplate são funcionalmente idênticos — `outranks()`, `effectiveActor()` via `ImpersonationService::getOriginalUser()`, `isSelf()` valendo para persona **e** humano. Paridade completa.
  - **Causer de auditoria durante impersonation**: spinmax `app/Resolvers/AuditUserResolver.php:28-38` (owen-it, plugado em `config/audit.php:33`); boilerplate `app/Resolvers/ActivityCauserResolver.php:14-20` (spatie, plugado em `AppServiceProvider.php:132-134`). Mesma decisão, pacote diferente. Paridade.
  - **Cache de permissão**: boilerplate `HasRolesAndPermissions.php:84-85` faz `unsetRelation('role')` + `unsetRelation('permissions')` antes de recomputar — *"recomputar sem descartá-las gravaria no cache forever as permissões do papel antigo"*. O spinmax (`:71-78`) **não faz**, e é bug vivo lá. Boilerplate superior.
  - **Pivô tipado**: boilerplate `app/Models/PermissionUser.php` + `->using(PermissionUser::class)` (`HasRolesAndPermissions.php:136`); spinmax faz `json_decode($permission->pivot->meta, true)` cru sem pivô dedicado (`:147`, `:199`). Boilerplate superior. Observação: **os dois** ainda fazem `json_decode` manual em `getPermissionMeta()`/`getCustomPermissionsList()` — o `PermissionUser` existe mas não declara `casts()` para `meta`, então o pivô tipado ainda não está pagando o que promete.
  - **`role_id` validado contra o enum**: boilerplate `StoreUserRequest.php:43-46` usa `Rule::exists('roles','id')->whereIn('name', $allowedRoleNames)`; spinmax (`:34-37`) aceita qualquer id de `roles`. Boilerplate superior.
  - **Contrato de autorização das rotas de escrita**: `tests/Feature/Routes/WriteRoutesAuthorizationTest.php` já existe (origem ctfinance @ b8c6d57). O spinmax **reproduz o mesmo defeito de forma independente** — `routes/web.php:87-88`, `users.impersonate` com `throttle:10,1` e nenhum `can:`, contra `routes/web.php:40` do boilerplate que tem `['throttle:impersonate','can:impersonate_users']`. Segunda ocorrência em projeto diferente: o guard-rail está certo e não é overfitting.
- **O que absorver / travar**: nada. Uma ressalva de escopo, porém: o contrato acima governa só POST/PUT/PATCH/DELETE. O spinmax mostra a forma que ele não alcança — `GET store/orders/export` (`routes/web.php:116-117`, `can:export_store_data`), um **GET** que transmite CSV com nome, e-mail e telefone de toda a base de clientes (`app/Http/Controllers/Order/ExportController.php:94-115`). Exfiltração é rota de leitura. Se o boilerplate ganhar telas de relatório/export, o contrato precisa de um irmão do lado dos GETs — hoje, sem essa superfície, um teste desses seria vácuo e não vale escrever ainda.
- **Superfície no boilerplate hoje**: `PermissionUser::casts()` é a única ação concreta que sobra deste bloco; o resto é registro para evitar retrabalho.

---

**Sem candidato por falta de evidência**: não encontrei IDOR real em `store.orders.*` nem `store.customers.*` — são single-tenant, o recurso não tem dono para escopar, e todo controller re-checa policy sobre a instância (`Order/ShowController.php:23`, `Customer/ShowController.php:18`) além do `can:` do grupo. Mass assignment também não rendeu: nenhum dos dois usa `unguarded()`, os dois rodam `Model::shouldBeStrict()` (spinmax `AppServiceProvider.php:134`, boilerplate `:64` com os três handlers de violação reportando em produção, `:70-91` — mais completo), e o único `create()` alimentado por entrada pública do spinmax monta o array à mão a partir de um DTO tipado, com preço recalculado no servidor (`app/Services/Store/CheckoutService.php:108-121`).



#### Veredito — ### REFUTAR — Autenticação, autorização e IDOR

Todos os arquivos abaixo foram lidos (boilerplate @ `e549737`, spinmax @ `e4ec01e`). Onde corrijo um número, o número correto está no texto.

---

#### C1 · **Requalificado — a "escada" não sobe.** O fato é verdadeiro, a exploração não

Os três fatos estruturais conferem: `database/seeders/PermissionRoleSeeder.php:46` deixa o `admin` com `manage_permissions` e `manage_roles`; `app/Policies/UserPolicy.php:108` (`mutatePermissions`) checa só permissão + `outranks()`; `app/Http/Controllers/PermissionRole/SyncPermissionsController.php:20,25` autoriza e sincroniza sem olhar o conteúdo. Até aí, correto.

O que não se sustenta é a cadeia:

1. **`sync()` não escreve meta.** `Permission::getIdsFromNames()` devolve uma lista de ids e `$user->permissions()->sync($permissionIds)` anexa sem pivô. Logo `getPermissionMeta()` (`app/Traits/Models/HasRolesAndPermissions.php:174`) devolve `null` e `canImpersonateAny()` (`:177-186`) devolve `false`. O `impersonate_users` assim concedido cai na regra de prioridade de `canImpersonate()` (`:196-200`): o manager (70) só impersona quem tem prioridade **< 70**.
2. **O admin já alcança tudo isso.** Com `manage_users` + `outranks()` ele já troca a senha de qualquer conta abaixo de 90 (`app/Http/Requests/User/UpdateUserRequest.php:46` — o path citado no candidato, sem o diretório `User/`, não resolve; `app/Http/Controllers/User/UpdateController.php:101-102`). "Abaixo de 70" é subconjunto estrito de "abaixo de 90". O ganho líquido é zero em capacidade — só muda o barulho do ataque (impersonation deixa rastro no activitylog e não quebra a senha da vítima; a troca de senha é destrutiva e visível). É um movimento lateral, não uma escalada.
3. **O caminho que escalaria já está fechado.** O único que grava `can_impersonate_any = true` é `PermissionManagementService::grantPermissionToUser()`, alcançado só por `GrantPermissionController` — e `app/Http/Requests/GrantPermissionRequest.php:14-17` faz `authorize(): return Auth::user()?->hasRole(Roles::SUPER_USER)`. Há teste explícito: `tests/Feature/User/GrantPermissionControllerTest.php:36-47`, `it('forbids an admin (non super user) from granting direct permissions')`.
4. **A direção de cima já está fechada** por `outranks()` estrito: auto-alvo, par `admin` e `super_user` todos negados, com testes em `tests/Feature/Policies/UserPolicyCeilingTest.php:118-144`.
5. **O editor de cargos já está fechado** por `ensureActorMayEdit` (`app/Http/Controllers/PermissionRole/UpdateController.php:80-111`), com `it('forbids granting a permission the actor does not have')` em `tests/Feature/PermissionRole/UpdateControllerTest.php:93-104`.

**E a correção (2) proposta colide com decisão vigente e testada.** `tests/Feature/Policies/UserPolicyCeilingTest.php:145-157` é `it('allows an admin to mutate the permissions of a manager')` — e o payload do teste é justamente `[Permissions::MANAGE_PERMISSIONS->value]`, afirmando que o admin **pode** distribuir `manage_permissions` para baixo. Tirar `manage_permissions` do `ADMIN` no seeder deixa esse teste vermelho. Isso é mudança de desenho do RBAC padrão da casa, não absorção de harvest — vai como decisão do dono, não como fatia.

**O que sobra, e é o real achado:** uma inconsistência interna de três portas. O mesmo sistema diz "conceder avulso = só `super_user`" (`GrantPermissionRequest:14-17`) e "sincronizar/revogar avulso = `manage_permissions` + `outranks`" (`SyncPermissionsController.php:20`, `app/Http/Controllers/User/RevokePermissionController.php:24`). O próprio spinmax diz isso com todas as letras — `tests/Feature/User/PermissionMutationCeilingTest.php:44-45`: *"O `GrantPermissionRequest` já exigia `super_user` no grant; agora o sync e o revoke dizem a mesma coisa."* Alinhar as três portas é a lição. "Escada viva no boilerplate" não é.

---

#### C2 · **Derrubado — é o mesmo item do C1, e a metade "grant" é inalcançável**

A premissa é "o grant individual não tem a regra". Verifiquei: **o admin nunca chega no grant individual.** `app/Http/Requests/GrantPermissionRequest.php:14-17` exige `SUPER_USER`. O único ator que executa `GrantPermissionController` é quem tem todas as permissões — o `array_diff($permissions, $actor->getAllPermissions())` ali seria tautologicamente vazio. Regra morta por construção.

Sobram `SyncPermissionsController` e `RevokePermissionController`. No revoke, "conceder o que você não tem" não significa nada — revogar não amplia. **Resta uma linha, em um controller** (`SyncPermissionsController.php:25`), que é exatamente a correção (1) do C1. C2 não é candidato independente; é duplicata. Fundir com C1.

Um detalhe de execução que o texto erra: *"extrair a checagem para um ponto só (policy ou service)"* — **policy não dá**. A assinatura é `mutatePermissions(User $user, User $model)`; o Gate recebe o modelo, não o payload da request. Não há por onde passar a lista de permissões sem inventar um `Gate::allows('x', [$model, $permissions])` fora do padrão dos outros call sites. O "ponto só" tem que ser um service/action — mais superfície nova do que o candidato sugere.

---

#### C3 · **Derrubado — o teste proposto não pegaria o C1, e a matriz do boilerplate é quase degenerada**

Fatos do spinmax conferem (com dois off-by-one): docblock em `tests/Feature/Store/AdminPermissionMatrixTest.php:8-18`, dataset `:25-48` (o candidato disse `:41-48`, que é só o duplo `foreach`), asserção `:50-54` (candidato: `:51-55`), visitor em `:65-67` (candidato: `:66-68`). 7 rotas × 6 cargos = 42 ✓.

Mas a afirmação central é falsa. **"É o teste que teria pegado o C1 sozinho"** — não teria. O C1 mora em `POST /users/{user}/sync-permissions`. A matriz do spinmax é GET-only: `:51` faz `->get(route($routeName))` e o `$allowed` só lista telas. Nenhuma célula toca um verbo de escrita.

E a célula que o candidato diz que forçaria a decisão a aparecer **já existe escrita à mão**, em três testes: `tests/Feature/PermissionRole/UpdateControllerTest.php:64-80` (admin não edita o próprio cargo), `:82-91` (admin não edita `super_user`), `:106+` (admin edita cargo abaixo com o que ele tem) — e o lado leitura em `tests/Feature/Policies/UserPolicyCeilingTest.php:105-113`.

**A contagem também está errada.** "5 cargos × 4 telas gateadas" — são **6** telas GET gateadas: `users.index`, `users.create`, `users.show`, `users.edit`, `users.permissions.show` (todas sob `can:manage_users`, `routes/web.php:22-36`) e `role-permissions` (`can:manage_roles`, `:45-56`). Só que elas colapsam em **2 gates de rota distintos** — a única variação real é `ShowUserPermissionsController.php:25`, que adiciona `Gate::authorize('managePermissions', $user)`. Uma matriz 5×6 = 30 células codificaria ~3 decisões. No spinmax a matriz vale porque há 6 permissões distintas espalhadas por 7 telas; aqui é cerimônia sobre uma tabela de duas colunas, redundante com `tests/Feature/User/IndexControllerTest.php:38-42`.

**Sobrevive uma linha, não o teste.** Não achei nenhuma asserção de que `visitor` tem zero permissões — `tests/Pest.php:89-94` documenta `guestUser()` como "usuário sem nenhuma permissão (cargo VISITOR)" e dezenas de testes dependem disso, mas ninguém verifica. Se alguém marcar uma caixa para `visitor` no seeder, "Remover cargo" para de remover e uma pilha de testes muda de significado em silêncio. Vale um `expect(userWithRole(Roles::VISITOR)->getAllPermissions())->toBeEmpty()`. O resto do C3 não.

---

#### C4 · **Sobrevive, mas o candidato aponta o buraco menor**

Fatos conferem: spinmax `routes/web.php:61` com o middleware inline no grupo; `routes/settings.php:10` só com `auth` (o candidato disse `:11`, que é o `Route::redirect`); boilerplate `bootstrap/app.php:43` dentro de `$middleware->web(append:)` ✓; `tests/Feature/EnsureUserIsActiveTest.php` toca só `/dashboard` e `/login` ✓. O boilerplate é superior ✓.

Tentei derrubar por "risco irreal" e não consegui: mover um middleware para o grupo de `web.php` é exatamente o refactor natural quando alguém acha que "só o painel precisa disso", e o teste atual continua verde. O guard-rail é legítimo.

Duas objeções ao formato, porém:

1. Um caso funcional em `route('profile.edit')` prova pouco e por acaso. A forma que realmente trava a decisão é asserção estrutural: varrer `Route::getRoutes()` e exigir `EnsureUserIsActive` no `gatherMiddleware()` de toda rota sob `auth` — pega os três arquivos e qualquer arquivo futuro, sem depender de alguém lembrar de acrescentar uma rota ao teste.
2. **O mesmo defeito de deriva por arquivo já está vivo no boilerplate, com outro middleware, e o candidato não viu:** `routes/settings.php:10` é `Route::middleware('auth')`, sem `verified`. `App\Models\User implements MustVerifyEmail` (`app/Models/User.php:18`) e `routes/web.php:12` usa `['auth','verified']` — ou seja, conta não verificada é barrada do painel e **passa** em `/settings/profile`, `/settings/password` e no `DELETE settings/profile`. Se o item vai existir, é esse o caso a cobrir junto, não uma hipótese.

---

#### C5 · **Sobrevive só como decisão a escrever; a leitura do risco está inflada e o custo subestimado**

Fatos conferem: `routes/auth.php:16-20` ✓, `RegisteredUserController.php:31-41` com `Auth::login($user)` em `:39` ✓, migration `:12` com `is_active` default `true` ✓, spinmax sem rota de registro em `routes/auth.php:14-33` ✓.

O que a evidência não conta:

- **`App\Models\User implements MustVerifyEmail`** (`app/Models/User.php:18`) e todo o painel está sob `['auth','verified']` (`routes/web.php:12`). O auto-cadastrado não chega ao dashboard — cai em `verification.notice`. `tests/Feature/Auth/RegistrationTest.php:20` só afirma o *alvo* do redirect, nunca que ele renderiza; ler esse teste como "entra no painel" é erro.
- A superfície realmente alcançável por essa conta é `routes/settings.php` (só `auth`, ver C4): perfil, senha, aparência e `profile.destroy`. Isso é concreto e o candidato não nomeou.
- `role_id` null ⇒ `priority()` 0 e todo gate falso (`app/Providers/AppServiceProvider.php:138-146`) ⇒ "não há escalada" ✓, isso está certo.

**Custo maior que o anunciado:** tirar a rota não é uma linha. `resources/js/pages/auth/login.tsx:111` chama `route('register')` via Ziggy — sem a rota nomeada, o Ziggy lança em runtime na tela de login. São rota + página `auth/register` + link do login + `RegistrationTest.php` inteiro + o `throttle:auth` em `:20`.

E é decisão de postura padrão do boilerplate — cabe `[proposta-adr]` para o dono, não fatia de harvest. A parte defensável e barata é a que o próprio candidato coloca como plano B: um teste que **declare** a decisão (registro público é ligado de propósito; a conta nasce sem cargo, sem verificação e sem acesso ao painel), em vez de só afirmar que o cadastro funciona.

---

#### C6 · **Sobrevive, mas a premissa "uma convenção só" é falsa neste repositório**

Fatos conferem com precisão incomum. Spinmax: helper em `app/Traits/Models/HasRolesAndPermissions.php:50` e os cinco literais exatamente onde o candidato diz — `User/UpdateController.php:105`, `User/StoreController.php:113`, `PermissionRole/SyncPermissionsController.php:31`, `PermissionRole/RevokeRoleController.php:86`, `PermissionRole/AssignRoleController.php:131` ✓. Boilerplate: os 8 call sites usam `User::permissionCacheKey()` — `User/UpdateController.php:111`, `User/StoreController.php:87`, `PermissionRole/SyncPermissionsController.php:27`, `PermissionRole/UpdateController.php:53`, `PermissionRole/RevokeRoleController.php:94`, `PermissionRole/AssignRoleController.php:126`, `Console/Commands/SyncPermissionsCommand.php:116`, `database/seeders/PermissionRoleSeeder.php:74` ✓.

Onde ele erra:

- **"o boilerplate já limpou" vale só para `app/`+`database/`.** `grep -rn "user:.*:permissions" tests/` devolve **16 literais escritos à mão**: `tests/Feature/PermissionRole/UpdateRolePermissionsInvalidatesUserCacheTest.php:54,57,67,68,73,83,84,89,132,135,146,147,161,162` e `tests/Feature/Console/SyncPermissionsCommandTest.php:93,97`. As duas convenções que o candidato quer impedir **já convivem** — mudaram de lado, não sumiram. Um regex ingênuo sobre o repositório fica vermelho no primeiro `composer ci:check`; a regra precisa de escopo explícito (`app/`, `database/`, `routes/`, exceto o trait).
- **A proteção parcial já existe:** `tests/Feature/Permissions/PermissionCacheKeyTest.php:19-23` fixa o formato (`toBe("user:{$user->id}:permissions")`). O formato não muda em silêncio; quem mexer nele tem que editar esse teste. O que continua desprotegido é só a reintrodução do literal em `app/`.

Com esse escopo e sem a narrativa de "chave morta esperando acontecer", o item se sustenta: é um grep barato guardando 8 pontos reais de invalidação de `rememberForever`. Venda como regra de lint com escopo, não como `arch()`.

---

#### C7 · **Derrubado — é exatamente o guard-rail vácuo que a rodada mandou evitar, só que num `.md`**

Fatos do spinmax conferem: `routes/web.php:38-40` (`signed`) e `:51-53` (sem `signed`, `throttle:60,1`) ✓; o assinado devolve muito mais que o irmão ✓; `URL::signedRoute` sem expiração em `OrderLookupController.php:41` ✓.

No boilerplate: `grep -rn "signed" routes/ app/` devolve **uma única ocorrência** — `routes/auth.php:47` — e **zero** `URL::signedRoute` / `temporarySignedRoute` em `app/`. O candidato admite "superfície quase nula" e então propõe mover o guard-rail de teste para `.ai/rules`. Isso não resolve o problema apontado no briefing — só troca um teste que passa vacuamente por uma regra que não governa nenhuma linha de código.

Pior: a regra (ii) ("link assinado por e-mail usa `temporarySignedRoute`") já é o comportamento do único caso existente — a notificação `VerifyEmail` do framework gera URL temporária a partir de `config('auth.verification.expire')`. A regra nasceria descrevendo o que o framework já faz, para um projeto derivado que ainda não existe.

Derrubar da rodada. Se o dono quiser, vive no checklist de projeto derivado, não no boilerplate.

---

#### C8 · **Confirmado no essencial; seis números a corrigir e a "única ação concreta" não é one-liner**

Conferi cada ponto:

| Alegação | Verificado |
|---|---|
| `UserPolicy` paridade — boilerplate `:142-184`, spinmax `:137-183` | ✓ exato nos dois (`outranks` em 142/137, `isSelf` em 181/176) |
| `ActivityCauserResolver.php:14-20`, plugado em `AppServiceProvider.php:132-134` | ✓ (o método `configActivitylog()` abre em `:130`) |
| spinmax `AuditUserResolver.php:28-38` + `config/audit.php:33` | ✓ (`resolve()` começa em `:29`; `'resolver' => \App\Resolvers\AuditUserResolver::class` em `:33`) |
| `unsetRelation` antes de recomputar — "`:84-85`" | ✗ **`:81-82`**. `:84-85` são o `Cache::forget` + `rememberForever`. Spinmax não faz ✓ |
| `PermissionUser` + `->using()` em `:136` | ✓ |
| `StoreUserRequest.php` com `Rule::exists(...)->whereIn(...)` — "`:43-46`" | ✓ regra em `:43-45` |
| `Model::shouldBeStrict()` boilerplate `:64` / spinmax `:134`, handlers "`:70-91`" | ✓ / ✓; handlers em **`:65-89`** |
| `WriteRoutesAuthorizationTest` existe, origem ctfinance @ b8c6d57 | ✓, docblock `:14-18` |

A observação sobre `PermissionUser` sem `casts()` está certa (`app/Models/PermissionUser.php` é uma subclasse vazia de `Pivot`). **Mas "única ação concreta que sobra" subestima o trabalho.** Declarar `casts(): ['meta' => 'array']` muda `$permission->pivot->meta` de `string` para `array` e quebra os dois consumidores: `HasRolesAndPermissions.php:174` (`json_decode($permissionModel->pivot->meta, true)` → `TypeError`) e `:229` (mesmo problema). E as escritas em `:116` e `:121` fazem `json_encode($meta)` à mão — teriam que parar de encodar. É um refactor de 4 pontos + testes que assertam a forma do meta (`tests/Feature/User/GrantPermissionControllerTest.php:23-34` compara com `['can_impersonate_any' => true]`, esse continua passando; mas `ImpersonateTest.php:47,103` alimentam via `givePermissionTo`). Escopar como fatia própria, não como remendo de fim de PR.

A ressalva sobre GETs de exportação está correta e bem calibrada: sem superfície de relatório no boilerplate, um teste irmão do lado dos GETs passaria por vacuidade. Concordo em não escrever agora.

---

### Resumo do veredito

| # | Veredito |
|---|---|
| **C1** | Requalificar. Fato ✓, exploração ✗ (sem meta, `impersonate_users` fica abaixo do que o admin já alcança; grant meta-bearing é super_user-only e testado). Sobra: alinhar as 3 portas de mutação avulsa. Proposta (2) do seeder colide com `UserPolicyCeilingTest.php:145-157` — vira decisão do dono |
| **C2** | **Derrubado.** Duplicata do C1; a metade "grant" é inalcançável por `GrantPermissionRequest:14-17`; e a extração "para a policy" é impossível pela assinatura |
| **C3** | **Derrubado.** Não pegaria o C1 (matriz é GET-only); as células já existem em `UpdateControllerTest`; "4 telas" são 6 e colapsam em 2 gates. Sobrevive **uma linha**: `visitor` com zero permissões, hoje sem asserção nenhuma |
| **C4** | **Sobrevive**, com duas correções de forma: asserção estrutural sobre `gatherMiddleware()` em vez de um caso funcional; e o caso realmente vivo é `verified` ausente em `routes/settings.php:10` |
| **C5** | **Sobrevive parcialmente.** Severidade inflada (`MustVerifyEmail` fecha o painel); superfície real é `settings.php`; remover a rota quebra Ziggy em `login.tsx:111`. Fica a decisão escrita, não a remoção |
| **C6** | **Sobrevive**, com escopo explícito. "Boilerplate já limpou" vale só para `app/`+`database/` — há 16 literais em `tests/`; e `PermissionCacheKeyTest.php:19-23` já fixa o formato |
| **C7** | **Derrubado.** Uma rota `signed` no repo inteiro, e a regra proposta descreve o que o framework já faz. Guard-rail vácuo mudado de lugar |
| **C8** | **Confirmado.** 6 números corrigidos acima; `PermissionUser::casts()` é refactor de 4 call sites, não one-liner |



#### Veredito — ### RISCO DE ABSORÇÃO — Autenticação, autorização e IDOR

Verifiquei os dois lados arquivo a arquivo. Três candidatos mudam de tamanho depois da checagem (C1 encolhe, C2 corrige um fato, C3 perde a justificativa principal), um sobe de risco (C5), e o único item "concreto" do C8 esconde uma corrupção de dado persistido.

---

#### C1 · Escada do `admin` via `sync-permissions` — **RISCO: MÉDIO**

**A cadeia é real, mas metade dela já está fechada.** O que confirmei:

- `database/seeders/PermissionRoleSeeder.php:46` de fato deixa `manage_permissions` com o `admin` (só `IMPERSONATE_USERS` sai).
- `app/Policies/UserPolicy.php:108` (`mutatePermissions`) checa `manage_permissions` + `outranks()` e nada sobre *quais* permissões.
- `app/Http/Controllers/PermissionRole/SyncPermissionsController.php:20` autoriza e `:25` faz `$user->permissions()->sync($permissionIds)` sem filtro de conteúdo.

**O que derruba a severidade do jeito como está escrito:**

1. **O auto-grant — o buraco que o docblock do spinmax descreve — já não existe aqui.** `outranks()` nega prioridade igual, e `tests/Feature/Policies/UserPolicyCeilingTest.php:118` (`forbids an admin from granting themselves the permission the seeder denies`) e `:130` (alvo `super_user`) já são verdes. O que sobra é só o alvo de prioridade menor.
2. **A escada não sobe.** Admin concede `impersonate_users` ao manager (70) e toma a conta pela senha (`UpdateUserRequest` aceita `password`; policy `update` = 90 > 70). Mas `HasRolesAndPermissions.php:189-207` limita esse manager a alvos de prioridade **< 70**, e o `can_impersonate_any` é inalcançável: `app/Http/Requests/GrantPermissionRequest.php:15` exige `hasRole(SUPER_USER)`, e o `sync()` passa array de IDs cru, sem pivot values, então `meta` fica null. Todas as contas assim alcançadas o admin já alcançava direto por troca de senha.
3. O dano residual honesto é **lavagem de trilha de auditoria**, não ganho de privilégio: o `ActivityCauserResolver` resolve o causer para o usuário original da sessão — o manager —, não para o admin que armou a persona.

**Risco da absorção, por eixo:**

- **Dado persistido**: a opção (1) do candidato (portar o `array_diff` de `PermissionRole/UpdateController.php:106`) é código puro — zero schema, zero migração. A opção (2) (tirar `manage_permissions` do `ADMIN` no seeder) **é mudança de dado**: `PermissionRoleSeeder` é re-executável e faz `sync()` no pivô `permission_role`, e ele mesmo invalida o cache de todo mundo (`:73-75`). Todo derivado que rodar `db:seed --class=PermissionRoleSeeder` depois disso perde `manage_permissions` de todos os admins na hora, sem aviso. Essa é a trap de migração a anotar.
- **Comportamento**: **as duas opções não são equivalentes contra o teste que já existe.** `tests/Feature/Policies/UserPolicyCeilingTest.php:146` — `it('allows an admin to mutate the permissions of a manager')` — sincroniza justamente `MANAGE_PERMISSIONS` e espera sucesso. A opção (1) o mantém verde (o admin **tem** `manage_permissions`, logo pode delegá-la — é a regra "a trava é sobre ampliar, não sobre delegar"). A opção (2) o deixa vermelho. O candidato apresenta as duas como intercambiáveis; não são, e essa é a diferença decisiva para fatiar.
- **Modo de falha**: fail-closed (403). Errar na direção restritiva nega delegação legítima do `super_user`, que percebe na hora.
- **Fraqueza importada**: nenhuma do spinmax. Mas atenção a um erro fácil ao "aplicar nos caminhos de mutação": **`RevokePermissionController` não pode entrar na trava**. Remover permissão não amplia nada; travá-la impediria um admin de arrancar `impersonate_users` de uma conta comprometida — regressão fail-open no sentido de resposta a incidente.
- **Tamanho**: opção (1) = 1 ponto de regra + 1 call site (`SyncPermissionsController`) + 1 teste. Dá para fatiar em uma fatia só. Cabe junto a limpeza da incoerência de três abilities num endpoint: rota `can:manage_users` (`routes/web.php:61-63`), `SyncPermissionsRequest::authorize()` = `can(MANAGE_USERS)`, policy = `manage_permissions`.

**Justificativa do médio**: fail-closed e sem schema, mas colide de frente com um teste verde e documentado, e uma das duas opções propostas é mudança de dado que se propaga aos 7 derivados.

---

#### C2 · Duas portas de concessão com regras diferentes — **RISCO: BAIXO** (com uma correção de fato)

**Correção**: `GrantPermissionController` **não é alcançável pelo admin**. `app/Http/Requests/GrantPermissionRequest.php:15` exige `hasRole(SUPER_USER)`. A frase "o caminho permissivo é justamente o que o `admin` alcança" vale só para o `SyncPermissionsController`. São duas portas divergentes, não três, e só uma delas é a porta do admin.

Em compensação, a assimetria mais afiada é outra e o candidato passa por ela: o `GrantPermissionController` gateia por **cargo** (`super_user`) na FormRequest e por **permissão** (`manage_permissions`, via `Gate::authorize('mutatePermissions')`) no controller. Consequência: `manage_permissions` concedida avulsa a um não-`super_user` é morta na rota de grant e viva na rota de sync. É o mesmo defeito "um sistema, duas respostas", numa forma que a proposta atual não descreve.

- **Dado persistido**: nenhum. Refactor de autorização.
- **Comportamento / modo de falha**: fail-closed.
- **Fraqueza importada**: uma, se a extração for preguiçosa. `ensureActorMayEdit` (`PermissionRole/UpdateController.php:80-111`) mistura duas coisas: o `array_diff` de superfície (`:106`) e a guarda de auto-tranca do `super_user` sobre `MANAGE_ROLES` no próprio cargo (`:88-99`). A segunda é de formato *cargo* e não traduz para concessão por usuário. Extrair **só** o `array_diff`.
- **Tamanho**: 2 arquivos + 1 teste; fatiável para 1 (só o sync) sem perder valor — e é exatamente a mesma fatia do C1 opção (1). **C1 e C2 são uma fatia, não duas.**

---

#### C3 · Matriz cargo × tela como teste cartesiano — **RISCO: BAIXO** (mas a justificativa principal não se sustenta)

Confirmei a ausência: não existe teste cartesiano; `tests/Feature/User/IndexControllerTest.php:37-41` usa um cargo só (`VIEWER`), e `Roles::cases()` em `tests/` só aparece em seletor e catálogo.

**Duas objeções que mudam o desenho da fatia:**

1. **"É o teste que teria pegado o C1 sozinho" é falso.** O C1 não é defeito de acesso a tela. A célula "admin entra em `role-permissions`" é decisão **deliberada e defendida** aqui: o admin tem `manage_roles` de propósito, e o `ensureActorMayEdit` (`PermissionRole/UpdateController.php:80-111`) é a trava que o spinmax não tinha. O C1 corre por `POST /users/{user}/sync-permissions`, rota de escrita. O que pegaria o C1 é uma tabela **permissão × cargo** ("o admin detém `manage_permissions`?"), não **tela × cargo**.
2. **A superfície é menor do que "5 × 4".** As telas gateadas do boilerplate escondem só **dois** gates distintos: `can:manage_users` (`users.index`, `users.create`, `users.show`, `users.edit`, `users.permissions.show`) e `can:manage_roles` (`role-permissions`). São 5 × 2 células de informação independente, infladas por repetição. O teste continua valendo — como detector de mudança com allowlist escrita à mão —, mas não como cobertura ampla.

- **Dado persistido / comportamento**: nenhum. Só teste.
- **Risco real**: imposto de manutenção. Os gates são auto-registrados por `Permissions::cases()` (`AppServiceProvider.php:139-140`) e o seeder dá `$allPermissions` ao admin: **todo case novo no enum amplia o `admin` sozinho**, e a allowlist manual passa a ser o único lugar onde alguém precisa escrever isso à mão. Esse é o valor — e é o motivo de o teste ser candidato a virar ruído e ser ignorado se o comentário não explicar por que ele não deriva do seeder.
- **Sugestão de fatia**: em vez do cartesiano tela × cargo, o de maior retorno aqui é **permissão × cargo** com allowlist literal (25 células, cobre o C1 e o crescimento silencioso do enum), e o de tela como complemento barato.

---

#### C4 · `EnsureUserIsActive` global — **RISCO: BAIXO**

Verificado dos dois lados: `bootstrap/app.php:43` põe `EnsureUserIsActive::class` no `web(append:)`, cobrindo `web.php`, `settings.php` e `auth.php`; o spinmax o tem inline no grupo de `routes/web.php:61`, deixando `settings.php` e `auth.php` de fora. Boilerplate superior, confirmado. `tests/Feature/EnsureUserIsActiveTest.php` de fato só exercita `/dashboard` e `/login`.

- **Dado persistido**: nenhum.
- **Comportamento**: nenhum — é caso de teste adicional, código de produção intocado.
- **Modo de falha da regressão que o teste vigia**: fail-open e silencioso (conta desativada seguindo trocando senha em `/settings/password`), que é exatamente o perfil que justifica o teste.
- **Nota de execução**: o middleware é o **último** do append, depois de `HandleInertiaRequests`, então o redirect com flash sai pelo canal Inertia — o caso novo deve usar `assertInertiaFlash('error')` como os existentes, senão passa a testar outra coisa.
- **Tamanho**: 1 caso em arquivo existente. Não dá para fatiar menor.

---

#### C5 · Auto-cadastro público ligado por padrão — **RISCO: ALTO**

Confirmei o fato (`routes/auth.php:16-20`; `RegisteredUserController::store` com `Auth::login` imediato; `is_active` default `true`). Duas correções de alcance, uma para baixo e uma para cima:

**Para baixo (o buraco é menor do que lido)**: `app/Models/User.php:18` — `User implements MustVerifyEmail`, e `routes/web.php:12` embrulha todo o painel em `['auth','verified']`. O recém-cadastrado recebe sessão mas cai em `verify-email`; nenhuma tela do painel abre. "Sessão autenticada" e "poluição de `users.index`" continuam corretos; "cota de e-mail" também.

**Para cima (a absorção é a mais cara da frente)**: apagar a rota quebra em três lugares que não falham em teste unitário nem em boot:

- `resources/js/pages/auth/login.tsx:111` — `<TextLink href={route('register')}>`. Com Ziggy (ADR 0002) a lista de rotas vai para o cliente; `route('register')` sem a rota **lança em tempo de render**, na página pública mais visitada. Não é degradação, é 500 no login.
- `resources/js/pages/auth/register.tsx:29` — a página inteira fica órfã.
- `tests/Feature/Auth/AuthRouteThrottleTest.php:29` lista `['POST', 'register']` no contrato de throttle; `tests/Feature/Auth/RegistrationTest.php` (2 testes) vira vermelho por definição.

Eixos:

- **Dado persistido**: nenhum diretamente. Mas contas já criadas por auto-cadastro nos derivados ficam com `role_id` null e sem caminho de origem documentado — decisão de limpeza que precisa ser explicitada, não um efeito automático.
- **Comportamento**: muda algo que funciona hoje, em direção fail-closed (rota some, ninguém entra). O risco não é de segurança, é de **quebra de superfície pública** num ponto que o `ci:check` só pega se o build de TS/Vite resolver `route()` — e ele não resolve, porque Ziggy resolve em runtime.
- **Tamanho real**: rota + controller + página React + link no login + 2 testes + entrada no contrato de throttle = **6 arquivos**, e é a única fatia da frente que toca frontend. **Dá para fatiar menor e melhor**: fatia A = trocar `tests/Feature/Auth/RegistrationTest.php` por um teste que **declare a decisão** (hoje ele afirma que o cadastro funciona, que é o oposto de uma decisão consciente) e documentar o bloco de reativação; fatia B, separada, = remover a rota com o link e a página juntos. A fatia A sozinha já resolve a objeção real do candidato ("uma porta que ninguém decidiu abrir") sem nenhum risco.

**Justificativa do alto**: é a única absorção da frente que quebra artefato público em runtime por caminho que os gates verdes não cobrem.

---

#### C6 · Literal `"user:{id}:permissions"` escrito à mão — **RISCO: BAIXO**

Confirmei: `app/Traits/Models/HasRolesAndPermissions.php:49` é o **único** literal em `app/`, e os 8 pontos de invalidação usam `User::permissionCacheKey()`. O spinmax tem 5 de 7 escrevendo à mão. Boilerplate superior, confirmado.

O candidato erra por omissão num ponto que muda a fatia: **já existe `tests/Feature/Permissions/PermissionCacheKeyTest.php`** — mas é comportamental (invalida via `assign-role`, via editor de cargo, via seeder), não um guard de literal. A proposta continua sendo nova.

- **Dado persistido / comportamento**: nenhum. É lint.
- **Fraqueza da própria absorção**: o regex precisa ser escopado a `app/` + `database/`. Em `tests/` há ~15 literais legítimos (`UpdateRolePermissionsInvalidatesUserCacheTest.php`, `SyncPermissionsCommandTest.php:93,97`, e o próprio `PermissionCacheKeyTest.php:22`, que compara o helper contra a string à mão de propósito). Um regex sobre o repo inteiro nasce vermelho.
- **Modo de falha do próprio guard**: **fail-open silencioso** — regex errado nunca casa e o teste passa para sempre sem vigiar nada. Mitigação barata: o teste afirma que encontra exatamente **uma** ocorrência (a definição no trait, `:49`); zero ocorrências reprova.
- **Tamanho**: 1 arquivo de teste.

---

#### C7 · Assinatura assimétrica no mesmo recurso — **RISCO: BAIXO**

Confirmei a vacuidade que o próprio candidato admite: `grep -rn signed routes/` no boilerplate devolve **uma** linha, `routes/auth.php:47`. Teste varrendo rotas assinadas passaria vazio.

- **Dado persistido / comportamento**: nenhum. É documento.
- **Onde mora**: `.ai/rules/routes.md` já existe com frontmatter `paths: routes/**` e já carrega dois contratos exatamente desse formato (limiter nomeado; escrita autenticada declara autorização). A terceira regra encaixa sem estrutura nova.
- **Fraqueza da absorção**: a regra "link assinado por e-mail usa `temporarySignedRoute`" **conflita no dia um** com a única rota assinada existente. `verification.verify` usa `signed` puro e a expiração vem do framework (`config/auth.php`, `verification.expire`), não de `temporarySignedRoute`. Sem a ressalva explícita, a regra nasce descrita como violada e perde autoridade.
- **Tamanho**: 1 arquivo, ~2 parágrafos. Menor fatia da frente inteira.

---

#### C8 · Onde o boilerplate já é superior — **RISCO: BAIXO no registro, MÉDIO na única ação concreta**

O registro de paridade/superioridade é conferência, sem risco. A **única ação concreta** (`PermissionUser::casts()`) tem armadilha de dado persistido que o candidato não menciona:

`app/Models/PermissionUser.php:14` é `Pivot` vazio, com só `@property string|null $meta` (`:12`). Adicionar `casts(): ['meta' => 'array']` **isolado** produz gravação duplamente codificada: `HasRolesAndPermissions.php:116` e `:121` já fazem `json_encode($meta)` na escrita (`attach` / `updateExistingPivot`), e o cast encodaria de novo. Resultado: linhas antigas com JSON simples e linhas novas com `"{\"can_impersonate_any\":true}"` na mesma coluna. A leitura falha de forma benigna (`canImpersonateAny()` devolve `false` → impersonação negada, fail-closed), mas a coluna fica com dois formatos e só sai disso com backfill que inspeciona linha a linha.

Portanto a fatia é indivisível: cast **+** remover `json_encode` das duas escritas **+** remover `json_decode` das duas leituras (`:174` em `getPermissionMeta`, `:229` em `getCustomPermissionsList`) **+** corrigir o `@property` para `array|null` (larastan reclama) **+** decidir sobre linhas existentes. **5 pontos em 2 arquivos, um deles com dado no banco.** Não dá para fatiar menor sem passar por um estado corrompido intermediário.

Duas observações menores, sem candidato próprio: `getPermissionMeta()` dispara uma query nova a cada chamada e `canImpersonate()` (`:203`) a invoca por checagem; e a ressalva de escopo do candidato sobre GETs de export está correta — hoje seria teste vazio, não vale escrever.

---

### Ordem de absorção por risco, se for para fatiar

| Fatia | Candidatos | Risco | Por quê |
|---|---|---|---|
| 1 | C7 (regra em `.ai/rules/routes.md`) | baixo | 1 arquivo, só documento, com a ressalva do `verification.verify` |
| 2 | C4 (caso atravessando arquivo de rota) | baixo | 1 caso em teste existente, produção intocada |
| 3 | C6 (guard de literal) | baixo | escopar a `app/`+`database/` e afirmar 1 ocorrência, não 0 |
| 4 | **C1 opção (1) + C2 juntos** | médio | mesma extração de `array_diff`; mantém `UserPolicyCeilingTest:146` verde; **excluir o revoke** |
| 5 | C3 na forma permissão × cargo | baixo | pega o C1 e o crescimento silencioso do enum; a forma tela × cargo tem só 2 gates reais |
| 6 | C8 (`PermissionUser` meta) | médio | indivisível: cast + 2 escritas + 2 leituras + backfill |
| 7 | C5 fatia A (teste que declara a decisão + doc) | baixo | resolve a objeção real sem tocar rota |
| — | C5 fatia B (remover a rota) | **alto** | quebra `login.tsx:111` em runtime via Ziggy; decisão do dono, não fatia técnica |
| — | C1 opção (2) (seeder) | **alto** | mudança de dado propagada aos 7 derivados; contradiz teste verde documentado |



#### Veredito — ### ATUALIDADE — Autenticação, autorização e IDOR

**Base verificada:** boilerplate em `laravel/framework v13.24.0`, `inertiajs/inertia-laravel v3.3.1`, `pestphp/pest v5.1.0`, PHP 8.4 (`composer.lock`). Docs consultadas via `search-docs` (version-aware, 13.x) e assinaturas conferidas no vendor real.

---

#### C1 · Escada do `admin` → `impersonate_users` — `[absorver-modernizado]`

Não há nada nativo que supere isto: o Laravel 13 não tem RBAC, e o teto "não conceda o que você não tem" não existe em ponto nenhum do framework. A cadeia que você descreve continua de pé — confirmei `SyncPermissionsController.php:20-27` (`Gate::authorize('mutatePermissions', $user)` e `$user->permissions()->sync($permissionIds)` sem filtro de conteúdo), `UserPolicy.php:108-115` (só `manage_permissions` + `outranks()`), `SyncPermissionsRequest.php:14` (`can(MANAGE_USERS)`) e `PermissionRoleSeeder.php:46` (`array_filter` que só remove `IMPERSONATE_USERS`, deixando `manage_permissions` no admin).

O que **muda com a API atual** é onde a regra mora. Hoje a proposta é copiar um `abort(403)` de dentro de um controller; o L13 já expressa isso nativamente em dois pontos que o boilerplate ainda não usa:

- **Argumentos extras em policy** — documentado em *Authorization › Supplying Additional Context* (13.x) e confirmado no vendor: `Gate.php:824` `callPolicyMethod($policy, $method, $user, array $arguments)` repassa o array inteiro. Ou seja `Gate::authorize('mutatePermissions', [$user, $request->validated('permissions')])` chega em `mutatePermissions(User $actor, User $target, array $names)`. A policy passa a responder a pergunta certa ("pode mexer NESTE alvo com ESTAS permissões?") em vez de a pergunta pela metade.
- **`Illuminate\Auth\Access\Response::deny($message)`** (vendor `Response.php:71`; também `denyWithStatus`/`denyAsNotFound` em `:84`/`:96`) — a mensagem propaga pelo `Gate::authorize`, então a frase do spinmax ("Você não pode conceder um acesso que você mesmo não tem.") sobrevive sem `abort()` espalhado.

Recomendo absorver com essa assinatura, e não com o `abort()` do spinmax. Sobre a segunda correção (tirar `manage_permissions` do ADMIN no seeder): nada de nativo a dizer, é decisão de produto, sobrevive intacta.

---

#### C2 · Duas portas de concessão com regras diferentes — `[absorver-modernizado]`

A regra sobrevive: verifiquei `PermissionRole/UpdateController.php:104-111` (o `array_diff` contra `getAllPermissions()` existe) e a **ausência** dela em `SyncPermissionsController.php` e `User/GrantPermissionController.php:24-30`. Nenhum recurso do L13 unifica isso por conta própria.

Modernização, na mesma linha do C1: o "ponto só" que você propõe tem **duas** formas nativas disponíveis, e vale escolher conscientemente —

- policy com argumento extra (verificado acima), que serve os três caminhos com um único método e devolve 403; ou
- `Rule::in()` dinâmico no FormRequest (*Validation › `in`*, 13.x — com nota explícita de que combinado com `array` ele valida cada item de `permissions.*`), alimentado por `$this->user()->getAllPermissions()->pluck('name')`, devolvendo **422 com erro por campo** em vez de 403 seco. Para uma tela de checkboxes o 422 é a resposta melhor.

**Correção de fato ao candidato, que muda a prioridade:** `GrantPermissionRequest.php:14-16` já faz `authorize()` = `hasRole(Roles::SUPER_USER)`. O grant individual, portanto, **não** está aberto ao admin — o caminho permissivo vivo é só `user.sync-permissions`. A assimetria que você aponta é real e continua valendo como dívida de desenho (três portas, três regras diferentes), mas a escada explorável é uma só.

---

#### C3 · Matriz cargo × tela como teste cartesiano — `[absorver-modernizado]`

Confirmei que o boilerplate não tem o teste (`tests/Feature/User/IndexControllerTest.php:37-47` cobre um cargo e guest). Duas coisas mudaram desde o spinmax:

1. **Pest 5 combina datasets por produto cartesiano nativamente** — docs *Datasets › Combining Datasets* (pestphp/pest@5.x): encadear `->with([...])->with('outro')` gera o produto e nomeia cada combinação na saída. O gerador `foreach` aninhado do spinmax (`AdminPermissionMatrixTest.php:41-48`) não é mais necessário **se** a expectativa por célula for calculada dentro do closure. Ressalva honesta: o gerador manual ainda se justifica quando você quer o veredito na *descrição* do teste (`"admin é barrado em role-permissions"`), que é justamente o efeito que faz o C1 aparecer na revisão. Recomendo o gerador, ciente de que a alternativa nativa existe.
2. **A matriz precisa reconhecer `#[Authorize]`** — `Illuminate\Routing\Attributes\Controllers\Authorize` existe no L13 (vendor `Illuminate/Routing/Attributes/Controllers/Authorize.php`, docs *Controllers › Authorization Attributes*) e **não** vira `can:` na pilha. O boilerplate já aprendeu isso em `tests/Feature/Routes/WriteRoutesAuthorizationTest.php:20-23`; o teste novo tem que nascer com a mesma consciência, senão passa a mentir no dia em que alguém usar o atributo.

---

#### C4 · `EnsureUserIsActive` global × por grupo — `[atual]`

Tentei derrubar e não caiu. O único mecanismo nativo próximo é `Illuminate\Session\Middleware\AuthenticateSession` + `Auth::logoutOtherDevices()` (docs *Authentication › Invalidating Sessions on Other Devices*, 13.x) — que resolve **outro** problema (invalidar sessões nas outras máquinas na troca de senha, exigindo a senha atual) e não tem nenhuma noção de conta desativada. Não há hook nativo de "usuário deixou de ser elegível mid-sessão".

Confirmei também a premissa: `bootstrap/app.php:19-22` registra só `web: routes/web.php`, e `routes/web.php:68-70` faz `require settings.php` e `require auth.php` — os três arquivos caem no grupo `web`, logo o `append` de `bootstrap/app.php:43` cobre os três. Superioridade sobre o spinmax confirmada.

Modernização só do guard-rail: `routes/settings.php:10` usa `Route::middleware('auth')` sem `verified`, então `route('profile.edit')` é exatamente o caso que atravessa arquivo de rota — é o teste a acrescentar em `tests/Feature/EnsureUserIsActiveTest.php` (hoje só `/dashboard`). E, se quiser a versão estrutural em vez da comportamental, a API nativa é `Route::getRoutes()->getRoutes()` + `$route->gatherMiddleware()` (vendor `Routing/Route.php:1060`) — que é literalmente a técnica que `WriteRoutesAuthorizationTest.php:62-66` já usa neste repositório. Não existe assertion nativa de middleware em rota no `Illuminate\Testing` (procurei; não há).

---

#### C5 · Auto-cadastro público ligado por padrão — `[atual]`

Não há chave nativa. O único "feature flag" de registro do ecossistema é `Laravel\Fortify\Features::registration()`, e Fortify **não** está instalado (`composer.json` não o lista) — seria `[dep-nova]`, além de esbarrar no território do ADR-0005. Os starter kits do L13 continuam entregando `/register` cru, exatamente como está em `routes/auth.php:16-20`. O candidato sobrevive: a decisão é remover a rota (ou declará-la em teste), não configurar nada.

Duas correções de calibragem, verificadas, que o guard-rail deve refletir:

- `app/Models/User.php:18` — `class User extends Authenticatable implements MustVerifyEmail`. Como todo o painel vive sob `['auth','verified']` (`routes/web.php:12`), o auto-cadastrado **não** alcança `/dashboard` antes de verificar o e-mail. A superfície é menor do que "sessão autenticada solta no painel".
- Mas `routes/settings.php:10` é só `auth`, sem `verified` — então o auto-cadastrado alcança `/settings/profile`, `/settings/password` e `/settings/appearance` imediatamente. A superfície existe; é essa.
- `RegisteredUserController.php:23-27` valida inline, sem FormRequest — divergente da convenção do `CLAUDE.md`. Se a rota ficar, isso entra junto.

---

#### C6 · Literal `"user:{id}:permissions"` — `[atual]`

Nada nativo. Confirmei o estado: 8 call sites de produção usando `User::permissionCacheKey()` (`User/UpdateController.php:111`, `User/StoreController.php:87`, `PermissionRole/{Sync:27,Update:53,RevokeRole:94,AssignRole:126}`, `SyncPermissionsCommand.php:116`, `PermissionRoleSeeder.php:74`), literal só em `HasRolesAndPermissions.php:51` e em comentários/testes. Nem `Cache::flexible()`, nem tags, nem qualquer novidade de cache do L13 substitui a invalidação manual aqui — e as expectativas arch do Pest 5 operam sobre *dependências entre classes*, não sobre conteúdo de string, então não existe formulação nativa de "proíba este literal".

O que existe de nativo e é mais forte que a regex: `arch()->expect('App\Http\Controllers')->not->toUse('Illuminate\Support\Facades\Cache')`, exatamente o molde de `tests/Arch/ArchTest.php:40-42` (que já faz isso para `Facades\DB`). Diga-se com clareza: **isso não é drop-in** — os 6 controllers listados acima usam a facade hoje, então a regra só fica verde se a invalidação mudar para trás de um `User::forgetPermissionCache()` / `PermissionManagementService` (`app/Services/PermissionManagementService.php` hoje só delega `givePermissionTo`/`revokePermissionTo`). É uma refatoração pequena que troca uma regex frágil por uma barreira arquitetural nativa, e de quebra elimina a possibilidade de literal novo. Se não houver apetite para a refatoração, o teste de regex continua sendo a única forma — não verificada como nativa porque não é.

---

#### C7 · Assinatura assimétrica em `shop.order.*` — `[absorver-modernizado]`

A regra sobrevive inteira (nada nativo diz "rota irmã sem assinatura não pode expor mais que o mínimo"). Confirmei que o boilerplate tem uma única rota assinada, `routes/auth.php:47`. A modernização é o vocabulário: a regra em `.ai/rules` deve nomear as APIs 13.x, todas verificadas em *Urls › Signed URLs*:

- `URL::temporarySignedRoute('nome', now()->plus(minutes: 30), [...])` — note a sintaxe atual do Carbon nomeado (`now()->plus(minutes: 30)`), não `now()->addMinutes(30)`;
- `URL::signedRoute(..., absolute: false)` combinado com o middleware `signed:relative` (`Illuminate\Routing\Middleware\ValidateSignature`) — relevante para link que atravessa domínio/CDN;
- `hasValidSignatureWhileIgnoring(['page','order'])` — o jeito nativo de permitir paginação client-side sem afrouxar o resto, que é a desculpa mais comum para largar uma rota irmã sem assinatura;
- `InvalidSignatureException` com render próprio no `bootstrap/app.php` — porque link expirado hoje cai no 403 genérico, e no boilerplate isso significa a página `errors/error-page` (`bootstrap/app.php:57-60`), que não explica nada ao cliente.

Sua leitura de que o teste passaria por vacuidade está correta e continua correta.

---

#### C8 · Onde o boilerplate já é superior — `[absorver-modernizado]` (só a ação do `PermissionUser`)

O registro de paridade não é matéria desta lente e não tenho nada que o derrube. A única ação concreta é, e aqui há nativo relevante e verificado:

`app/Models/PermissionUser.php` é um `Pivot` sem corpo. Basta declarar

```php
protected function casts(): array { return ['meta' => 'array']; }
```

— `casts()` é o método do `HasAttributes` (vendor `Concerns/HasAttributes.php:1727`), herdado por `Pivot` normalmente. E o cast vale **nos dois sentidos**, o que é o ponto não óbvio: `InteractsWithPivotTable::castAttributes()` (vendor `Concerns/InteractsWithPivotTable.php:772-777`) faz `$this->using ? $this->newPivot()->fill($attributes)->getAttributes() : $attributes`, e é chamado tanto em `updateExistingPivot` (`:278`) quanto em `formatAttachRecord` (`:427`). Como `Pivot::$guarded = []` (vendor `Relations/Pivot.php:24`), o `fill()` não descarta nada. Consequência concreta: com o cast, somem os `json_encode` de `HasRolesAndPermissions.php:114` e `:119` **e** os `json_decode` de `:167` (`getPermissionMeta`) e `:210` (`getCustomPermissionsList`) — o pivô tipado passa a pagar o que promete, que é exatamente a ressalva que você levantou. Se quiser `meta` como objeto mutável, `AsArrayObject::class` / `AsCollection::class` / `AsFluent::class` estão todos disponíveis em `vendor/.../Eloquent/Casts/`.

Sobre a ressalva de escopo do contrato de rotas de escrita (GETs de export): concordo que hoje seria vácuo, e não há nada em L13 que resolva — o `#[Authorize]` cobre a *forma* de declarar, nunca a *cobertura* de leitura.

---

**Não verificado:** nada ficou em aberto nesta frente. Não usei memória de treino para nenhuma das APIs citadas — cada uma tem doc 13.x ou linha de vendor acima.



### Frente: Middlewares, defesas de borda e webhook

#### Candidatos levantados

### Middlewares, defesas de borda e webhook

Comparação feita arquivo-a-arquivo entre `spinmax @ e4ec01e` (`/Users/cristianomorgante/workspace/laravel/clients/spinmax/app`) e o boilerplate (`/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`). Middlewares: spinmax 6 (`EnsureStoreEnabled`, `EnsureUserIsActive`, `HandleAppearance`, `HandleInertiaRequests`, `PublicStore`, `SecurityHeaders`) × boilerplate 5 (os mesmos menos `EnsureStoreEnabled`/`PublicStore`, mais `SetSensitiveCacheHeaders`).

---

#### C1 · Webhook inbox como forma reusável: recepção magra → dedup por unique → fila → reprocesso → prune
- **Pergunta**: (a) absorver do spinmax — **tema multi-fonte "webhooks"**
- **Evidência (spinmax @ e4ec01e)**:
  - `routes/web.php:56-58` — `Route::post('webhooks/mercadopago', Webhook\MercadoPagoController::class)->middleware('throttle:mp-webhook')`
  - `app/Http/Controllers/Webhook/MercadoPagoController.php:102-119` — controller magro, 4 passos, nada de negócio:
    ```php
    $event = WebhookEvent::firstOrCreate(
        ['provider' => 'mercadopago', 'external_id' => $notificationId],
        ['type' => $type !== '' ? $type : 'unknown', 'payload' => $request->all(), 'status' => 'received'],
    );
    if (!$event->wasRecentlyCreated) { return response()->json(['status' => 'duplicate'], 200); }
    if (in_array($type, self::PROCESSABLE_TOPICS, true) && $dataId !== '') {
        ProcessMercadoPagoWebhookJob::dispatch($event->id);   // id, não model serializado
    } else { $event->update(['status' => 'ignored']); }
    ```
  - `database/migrations/2026_07_22_120011_create_webhook_events_table.php:13-22` — `provider`, `external_id`, `type`, `payload` json, `status` D:`received`, `processed_at`, `error` text + **`$table->unique(['provider','external_id'])`** (a idempotência é do banco, não do código)
  - `MercadoPagoController.php:29` — `PROCESSABLE_TOPICS = ['payment','order']` com o comentário "a lista oficial do MP é incompleta e não deve virar `switch` fechado" → tópico desconhecido vira `ignored`, nunca 4xx
  - `app/Console/Commands/ReprocessWebhooksCommand.php:22-31` — reenfileira `['received','failed']` (5 min, `withoutOverlapping`)
  - `app/Console/Commands/ReconcileOrdersCommand.php:68-87` — rede para webhook **perdido**: cria evento sintético `'reconcile-' . $order->uuid . '-' . now()->format('YmdHi')` via `firstOrCreate` e despacha **o mesmo job** (10 min)
  - `PruneWebhookEventsCommand.php` — poda por idade (`store.webhooks.retention_days` = 90), 04:00
  - `MercadoPagoController.php:21` — "NUNCA confia no corpo para confirmar pagamento — o job busca o payment na API"
- **Equivalente no boilerplate**: **não existe**. Sem `app/Http/Controllers/Webhook/`, sem `WebhookEvent`, sem migration equivalente, sem `validateCsrfTokens(except:)`. O que existe no lugar é apenas a infra genérica: Horizon + `RateLimiter::for()` em `app/Providers/AppServiceProvider.php:94-109`.
- **O que absorver / travar**: a **forma**, sem o Mercado Pago — tabela `webhook_events` com `unique(provider, external_id)`, model + factory, e um `AbstractWebhookController` (ou doc + skeleton) fixando os 4 passos: validar assinatura → `firstOrCreate` → despachar job **por id** → 200 sempre (duplicata = `200 {"status":"duplicate"}`, tópico desconhecido = `ignored`, nunca 4xx que faça o provedor reentregar para sempre). Mais os 3 comandos genéricos (`webhooks:reprocess`, `webhooks:prune`) — reconcile é de domínio e fica fora. **Lição transversal**: a chave de idempotência aqui degrada para per-entrega (`input('id') ?? header('x-request-id') ?? $dataId`, `MercadoPagoController.php:100`); só não vira dupla-aprovação porque o job também é idempotente (lock + guarda de status). O guard-rail é **as duas camadas**, nunca só a tabela.
- **Superfície no boilerplate hoje**: **nenhuma** — namespace vazio. Teste sobre isso passaria vacuamente; o entregável tem de ser código (tabela + controller base + comandos) com teste sobre o próprio skeleton, não uma regra `.ai/rules` solta. Confirmar a forma contra ctfinance (Asaas) e ctvitrine antes de fixar o contrato.

---

#### C2 · A CSP do boilerplate é hardcoded, sem allowlist nem report-only — o primeiro projeto com gateway ficou simplesmente sem CSP
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `app/Http/Middleware/SecurityHeaders.php:26-30` — a constante tem **só 3 headers**, e `handle()` (l. 51-54) é `return self::stamp($next($request));`. Grep confirmando: `Content-Security-Policy`, `Strict-Transport-Security`, `Permissions-Policy` — **zero ocorrências** em `app/`, `bootstrap/`, `config/`, `resources/`, `tests/`. Não é remoção: `git log` mostra que este arquivo nasceu em `6dd1e81 [T-401]` independente do harvest do boilerplate (`e035e42`). E o motivo de nunca ter chegado lá está no front: `package.json` traz `"@mercadopago/sdk-react": "^1.0.7"`, usado em `resources/js/components/shop/payment-brick.tsx:1,33` (`initMercadoPago` injeta script e iframes de origem do MP em runtime), e `resources/views/shop.blade.php:28` inclui `partials/meta-pixel.blade.php:27,34` (script de `connect.facebook.net` + `img` de `facebook.com`).
- **Equivalente no boilerplate**: `app/Http/Middleware/SecurityHeaders.php:61-77` — CSP literal, sem seam: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `connect-src 'self'`, sem `frame-src` (cai no `default-src`). Ligada só em `app()->isProduction() && $request->isSecure()`.
- **O que absorver / travar**: mover a CSP para `config/security.php` — diretiva → array de origens, com `array_merge` de uma allowlist por projeto — e suportar `Content-Security-Policy-Report-Only` por flag. Sem isso, um projeto com gateway/pixel tem duas saídas ruins: editar o middleware à mão (e perder o sync com o boilerplate) ou não ter CSP nenhuma — foi a segunda que aconteceu. Nota agravante: como a CSP só liga sob `isProduction() && isSecure()`, o teste `tests/Feature/SecurityHeadersTest.php:21-27` afirma justamente a **ausência** dela; a quebra do Payment Brick só apareceria em produção.
- **Superfície no boilerplate hoje**: sim — o middleware e o teste existem. O `docs/migration/PLAYBOOK.md` já manda "CSP report-only com allowlist" para ctfinance/ctvitrine/cuidari, mas manda **sem mecanismo**: hoje isso é edição manual em cada projeto. Falta um teste do próprio boilerplate que force o CSP com `app()->detectEnvironment(fn() => 'production')` + `Request::setTrustedProxies`/`server HTTPS`, hoje inexistente.

---

#### C3 · Ziggy escopado por grupo — o boilerplate serializa 100% das rotas para todo browser
- **Pergunta**: (a) absorver do spinmax
- **Evidência (spinmax @ e4ec01e)**:
  - `config/ziggy.php:14-22` — `'groups' => ['shop' => ['home','shop.*','legal.*','api.shipping.*']]`
  - `app/Http/Middleware/PublicStore.php:30-37` — `Inertia::setRootView('shop')` + `'ziggy' => fn(): array => [...(new Ziggy('shop'))->toArray(), 'location' => $request->url()]`, com o comentário "Só o grupo `shop` — evita vazar a superfície admin via Ziggy"
  - `resources/views/shop.blade.php:31` — `@routes('shop')` (o Blade e o share têm de concordar; são dois pontos)
  - `tests/Feature/Store/ShopFrontendTest.php:51-59` — `it('does not leak admin routes to the shop browser')`: `assertSee('shop.buy')`, `assertDontSee('users.index')`, `assertDontSee('roles-permissions.update')`
- **Equivalente no boilerplate**: `app/Http/Middleware/HandleInertiaRequests.php:68-69` — `...(new Ziggy())->toArray()`, **sem grupo**; `resources/views/app.blade.php:61` — `@routes` sem argumento; **não existe `config/ziggy.php`** (`ls config/` = 14 arquivos, nenhum `ziggy.php`).
- **O que absorver / travar**: publicar `config/ziggy.php` com um grupo `public` vazio-por-padrão e documentar o par `@routes('grupo')` + `new Ziggy('grupo')` como o contrato de qualquer superfície não-autenticada. Compatível com ADR-0002 (Ziggy fica). Absorver junto o **teste**, que é o que segura o padrão: o escopo do spinmax depende de ordem de middleware (o `Inertia::share` do `PublicStore`, alias de rota, sobrescreve o do `HandleInertiaRequests`, global) — mover `public.store` para o grupo global antes do `HandleInertiaRequests` reverteria o escopo em silêncio, e só o `assertDontSee` pega.
- **Superfície no boilerplate hoje**: sim, mas **fraca**: hoje toda rota do boilerplate está sob `auth` (`routes/web.php:12`), então o vazamento é de nomes de rota admin para usuário já logado — baixo impacto imediato. O valor é ser o gancho pronto no dia em que um derivado abre superfície pública, que foi exatamente o momento em que o spinmax teve de inventá-lo.

---

#### C4 · `EnsureUserIsActive` por rota (spinmax) deixa `settings` e `auth` descobertos — o boilerplate já acerta, falta o teste que trava a regressão
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `routes/web.php:61` — `Route::middleware(['auth','verified', \App\Http\Middleware\EnsureUserIsActive::class])->group(...)`, registro **inline no grupo do painel**, sem alias e **ausente** de `bootstrap/app.php:43-48` (o `web(append:)` tem só `SecurityHeaders`, `HandleAppearance`, `HandleInertiaRequests`, `AddLinkHeadersForPreloadedAssets`). Consequência verificada: `routes/settings.php:10` é `Route::middleware('auth')->group(...)` e `routes/auth.php:35` idem — logo `settings/profile` (GET/PATCH/DELETE), `settings/password` (PUT) e `confirm-password` continuam servindo um usuário **desativado no meio da sessão**. O middleware do spinmax também não avisa nada ao usuário (`EnsureUserIsActive.php:29` — `redirect()->route('login')` seco).
- **Equivalente no boilerplate**: `bootstrap/app.php:37-44` — `EnsureUserIsActive::class` está no `web(append:)` **global**; `app/Http/Middleware/EnsureUserIsActive.php:30` acrescenta `Inertia::flash('error', ...)`. O boilerplate é **superior** nos dois pontos.
- **O que absorver / travar**: nada a colher — travar. Acrescentar a `tests/Feature/EnsureUserIsActiveTest.php` (hoje 3 casos, todos sobre `/dashboard`) um caso que exercite **rota de `settings.php` e de `auth.php`** com usuário desativado, e uma regra em `.ai/rules/middleware.md` (que hoje só fala de shared props): defesa de sessão entra em `web(append:)`, nunca por grupo de rota — grupo esquece os `require` de `settings.php`/`auth.php`.
- **Superfície no boilerplate hoje**: sim — middleware, registro global, `routes/settings.php` e `routes/auth.php` todos existem. O teste não passaria vacuamente.

---

#### C5 · `validateCsrfTokens(except:)` + `preventRequestsDuringMaintenance(except:)` para tráfego de integração assinada
- **Pergunta**: (a) absorver do spinmax (a política, junto com C1)
- **Evidência (spinmax @ e4ec01e)**: `bootstrap/app.php:31-41`
  ```php
  // Webhook do Mercado Pago: assinatura própria (HMAC), fora do CSRF.
  $middleware->validateCsrfTokens(except: ['webhooks/*']);
  // ...e fora do modo manutenção, pelo mesmo motivo: o webhook não é
  // tráfego de navegador, é integração assinada. O deploy roda
  // `artisan down` antes do `git pull`, e nessa janela um pagamento
  // aprovado levaria 503 — ficaria em PendingPayment até o
  // `store:reconcile-orders` passar (10 min) [...]
  $middleware->preventRequestsDuringMaintenance(except: ['webhooks/*']);
  ```
  O par é deliberado e o segundo é o menos óbvio: sem ele, `artisan down` transforma uma janela de deploy em pedidos presos. Note que **os dois usam o mesmo prefixo `webhooks/*`** — é o prefixo, não a rota, que carrega a política.
- **Equivalente no boilerplate**: **não existe nenhuma das duas chamadas** em `bootstrap/app.php` (só `trustProxies` condicional, `encryptCookies(except: ['appearance'])`, `web(append:)`). Não é lacuna hoje: sem superfície de webhook, o default correto é justamente não abrir exceção. `/up` já é isentado da manutenção pelo próprio framework (`vendor/.../ApplicationBuilder.php:168-169` chama `PreventRequestsDuringMaintenance::except($health)` quando `health:` é passado — e o boilerplate passa, `bootstrap/app.php:22`).
- **O que absorver / travar**: quando C1 entrar, o prefixo `webhooks/*` entra **junto** nos dois `except:` — e com o comentário do porquê do segundo, que é o que ninguém deduz sozinho. Antes de C1, absorver só como regra escrita em `.ai/rules/middleware.md`: rota isenta de CSRF **tem de** ter autenticação própria (HMAC/assinatura) declarada no controller; isenção sem substituto é rota aberta.
- **Superfície no boilerplate hoje**: `bootstrap/app.php` existe e é o ponto exato; a superfície de webhook, não. Regra sem código a alcançar até C1 aterrissar.

---

#### C6 · `SetSensitiveCacheHeaders` só olha `$request->user()` — superfície pública com PII sai cacheável
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `routes/web.php:38-40` — `Route::get('pedido/{order:uuid}', Shop\OrderStatusController::class)->middleware('signed')`, rota **sem auth**. O payload dessa página (`app/Http/Controllers/Shop/OrderStatusController.php:30-72`) inclui `'customer_name' => $order->customer->name`, `'masked_cpf' => $order->customer->maskedCpf()`, `'address' => $order->shipping_address` (endereço de entrega completo) e `'pix' => $this->pixData(...)` (QR + copia-e-cola) — todos redigidos aqui como `***`. Grep em todo o spinmax: `Cache-Control` = **zero ocorrências** em `app/`, `bootstrap/`, `config/`, `resources/`. Ou seja: resposta HTML com nome + CPF mascarado + endereço + código Pix, servida a requisição anônima, sem nenhum header de cache.
- **Equivalente no boilerplate**: `app/Http/Middleware/SetSensitiveCacheHeaders.php:21-23` — `if (!$request->user()) { return $response; }`. O middleware existe (o spinmax não tem equivalente algum, aqui o boilerplate é superior), mas a **chave é a sessão, não a sensibilidade do dado**. Uma rota `signed` anônima com PII passa direto. O teste `tests/Feature/SecurityHeadersTest.php:50-56` chega a **fixar** esse comportamento (`it('leaves guest responses cacheable...')`).
- **O que absorver / travar**: acrescentar um segundo gatilho ao middleware — resposta de rota com o middleware `signed` (ou marcada por um atributo/`defaults('sensitive', true)`) também recebe `private, no-store, must-revalidate`, independente de `$request->user()`. E ajustar o teste de "guest é cacheável" para valer só na superfície pública sem PII, senão ele vira o argumento contra a correção.
- **Superfície no boilerplate hoje**: o middleware, o registro (`bootstrap/app.php:39`) e o teste existem; rota `signed` com PII, **não** — o boilerplate hoje só usa `signed` em `verify-email` (`routes/auth.php:47`). Então o novo caso de teste precisa de uma rota de fixture, ou fica vacuamente verde.

---

#### C7 · O boilerplate já é superior em headers baseline, exception handler e proxies — não colher nada do spinmax aqui
- **Pergunta**: (b) evitar retrabalho na direção errada
- **Evidência (spinmax @ e4ec01e)**:
  - `app/Http/Middleware/SecurityHeaders.php:26-30` — 3 headers, **sem `Permissions-Policy`**, sem HSTS, sem CSP (ver C2)
  - `bootstrap/app.php:56-61` — o `withExceptions` inteiro é **uma linha**: `$exceptions->respond(fn(Response $response): Response => SecurityHeaders::stamp($response))`
  - Grep `TrustProxies|trustProxies` em todo o repo (fora `vendor/`): **zero**. Combinado com `AppServiceProvider::configRateLimiters()` — `RateLimiter::for('mp-webhook', fn($request) => Limit::perMinute(120)->by($request->ip()))` — atrás de LB/ploi o `ip()` é o do proxy: os 120/min viram um teto **global**, não por origem. Mesmo efeito em `throttle:10,1` (`routes/web.php:28,35,87`) e `throttle:60,1` (l. 52), que também violam a regra "throttle sempre via limiter nomeado" já escrita em `.ai/rules/routes.md`.
- **Equivalente no boilerplate**: `app/Http/Middleware/SecurityHeaders.php:27` (`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`) + l. 53-78 (HSTS + CSP sob produção/HTTPS); `bootstrap/app.php:25-33` (`trustProxies` a partir de `TRUSTED_PROXIES`, com o comentário certo: "sem isso `isSecure()` fica false e o `SecurityHeaders` nunca emite HSTS/CSP"); `bootstrap/app.php:50-73` (handler que renderiza `errors/error-page` para 403/404/500/503 fora de local/testing, faz fallback em Blade estático quando o próprio Vite quebrou, converte 419 em flash + `back()`, e **só então** carimba). O `stamp()` estático e o padrão "só preenche o que a resposta ainda não declarou" são idênticos nos dois lados — origem comum.
- **O que absorver / travar**: **nada a absorver**. Registrar no harvest que a frente "headers/handler/proxy" é caminho de mão única boilerplate → spinmax, para não gastar rodada olhando de novo. O único subproduto útil é a confirmação de que `TRUSTED_PROXIES` continua **comentado** no `.env.example` do boilerplate (`.env.example:9`, `# TRUSTED_PROXIES=`): a defesa mais dependente de infra é a que sai desligada por padrão, e o spinmax é a prova de que ninguém liga sozinho — cabe um check no `staging:check`/deploy do boilerplate que falhe quando `APP_URL` é `https://` e `TRUSTED_PROXIES` está vazio.
- **Superfície no boilerplate hoje**: sim para tudo — `SecurityHeaders`, `bootstrap/app.php`, `.env.example`, `tests/Feature/SecurityHeadersTest.php` e `tests/Feature/ErrorPagesTest.php` existem; o check de `TRUSTED_PROXIES` seria código novo sobre superfície viva.



#### Veredito — ### REFUTAR — Middlewares, defesas de borda e webhook

Verifiquei todos os path:linha citados nos dois lados. Resumo: **C7 sobrevive** (com uma correção de fato), **C4 sobrevive quase intacto** (dois erros verificáveis), **C1/C2/C3/C5/C6 caem ou encolhem muito**. Achei erro de fato em 6 dos 7 candidatos.

---

#### C1 · Webhook inbox — **derrubar como código; sobrevive só como ADR/regra**

**Fatos que conferem:** `routes/web.php:56-58`, `MercadoPagoController.php:29/100/102-119`, migration `:13-22` incl. `unique(['provider','external_id'])` em `:22`, `ReconcileOrdersCommand.php:68-87` (o `firstOrCreate` começa exatamente em 68 e o bloco fecha em 87), `PruneWebhookEventsCommand` às 04:00 (`routes/console.php:29`). Boilerplate: `grep -rin webhook app/ config/ routes/ database/ tests/ .ai/` retorna **uma** linha, `config/logging.php:82` (`LOG_SLACK_WEBHOOK_URL`). Ausência confirmada.

**O que derruba:**

1. **A própria ADR-0005 é o argumento contra.** Ela não proíbe webhook — o texto até antecipa: *"Consumo third-party de webhooks/rotas pontuais pode usar rotas assinadas ou middleware de token simples antes de justificar Sanctum completo"*. Mas o **raciocínio** registrado é: *"Instalar Sanctum e rotas `api.php` 'por via das dúvidas' cria superfície de manutenção e segurança sem consumidor real."* Tabela + model + factory + controller base + 2 comandos agendados, com **zero** provedores no boilerplate, é exatamente a mesma forma de superfície especulativa, pelo raciocínio escrito da casa. Não viola a ADR na letra; viola no espírito, e o candidato não enfrenta isso.

2. **O `AbstractWebhookController` conflita com regra escrita.** `.ai/rules/controllers.md` (front-matter `paths: app/Http/Controllers/**`): *"Controllers de domínio são single-action: `final class {Ação}Controller` com `__invoke()` … não existe camada de Actions, Jobs de request, repositories nem query objects"*. Uma base abstrata com template-method seria a **primeira hierarquia de herança** em `app/Http/Controllers/`. Isso é mudança de convenção disfarçada de feature — precisa entrar como decisão explícita, não como subproduto.

3. **O artefato concreto é pior do que o candidato descreve.** A migration tem **só** o unique — nenhum índice em `status`, nenhum em `created_at`. Os dois comandos "genéricos" varrem justamente essas colunas: `PruneWebhookEventsCommand.php:35` (`where('created_at','<',$cutoff)->delete()`) e `ReprocessWebhooksCommand.php:24-27` (`where provider` + `whereIn status` + **`->get()` sem `chunkById`**, carregando tudo em memória a cada 5 min). No volume do spinmax é invisível; como **default de boilerplate** é forma que se conserta no primeiro uso. Ou seja: o que se absorveria não é o código do spinmax, é uma reescrita — e reescrita sem consumidor não tem como ser validada.

4. **O reprocesso é double-dispatch por desenho, e a metade que protege fica de fora.** `store:reprocess-webhooks` reenfileira **todo** `received` a cada 5 min, inclusive os que já estão na fila. Só não vira dupla-aprovação porque `ProcessMercadoPagoWebhookJob` tem early-return em `status === 'processed'` + `Cache::lock("order:{uuid}")`. O candidato reconhece isso ("o guard-rail é as duas camadas") e mesmo assim propõe entregar genérico **o inbox** e deixar o job por conta de cada projeto — entrega a arma e deixa a trava com o próximo. Um skeleton com tabela + reprocessor e sem contrato mandatório de job idempotente é pior do que nada.

5. **Erros de fato:** "os **3** comandos genéricos (`webhooks:reprocess`, `webhooks:prune`)" — lista dois, e nenhum dos dois nomes existe: as assinaturas reais são `store:reprocess-webhooks` e `store:prune-webhook-events`. E `withoutOverlapping` **não está** em `ReprocessWebhooksCommand.php:22-31` como a citação implica — está em `routes/console.php:52` (o comando, `:14-36`, não tem overlap control nenhum).

**Sobrevive:** o *contrato* (validar assinatura → `firstOrCreate` → despachar por id → 200 sempre) como ADR + `.ai/rules`. Recomendo esperar o segundo provedor real (ctfinance/Asaas) e colher com dois provedores concordando, em vez de fixar o contrato num n=1 acoplado ao MP.

---

#### C2 · CSP hardcoded — **encolher muito; a narrativa não se sustenta**

**Fatos que conferem:** `SecurityHeaders.php:26-30` do spinmax tem 3 headers e `handle()` é `return self::stamp($next($request));` em `:53`. Grep de `Content-Security-Policy|Strict-Transport-Security|Permissions-Policy` em `app/ bootstrap/ config/ resources/ tests/` do spinmax: **zero**, confirmado. Boilerplate `SecurityHeaders.php:61-77` confere linha a linha. Teste `SecurityHeadersTest.php:21-27` confere exatamente.

**O que derruba:**

1. **Metade da evidência do "por que nunca chegou lá" está errada.** O boilerplate tem `img-src 'self' data: https:` em `SecurityHeaders.php:68`. O `<img src="https://www.facebook.com/tr?...">` de `partials/meta-pixel.blade.php:34` **não seria bloqueado**. Só o `<script>` para `connect.facebook.net` (`:27`) e o SDK do MP (`script-src`/`frame-src` via `default-src`/`connect-src`) quebram. O candidato conta dois vetores de pixel; um deles já passa.

2. **A causalidade do título é reconstrução post-hoc.** `git log`: `app/Http/Middleware/SecurityHeaders.php` do spinmax nasceu em `6dd1e81` em **2026-07-25**. A CSP do boilerplate nasceu em `e035e42` em **2026-08-10** — 16 dias depois, no mesmo commit que criou `SetSensitiveCacheHeaders.php`. Quando o spinmax escreveu o middleware dele, **a CSP do boilerplate não existia em lugar nenhum**. Logo o spinmax não é "o primeiro projeto com gateway que ficou sem CSP por causa do hardcode"; é o **ancestral** do arquivo, que o boilerplate depois estendeu. A evidência prova que derivado não faz back-port sozinho — não prova que CSP literal forçou escolha ruim.

3. **"Sem seam" é falso como escrito.** `SecurityHeaders.php:61` é `if (!$response->headers->has('Content-Security-Policy'))`, e o docblock `:16-18` diz explicitamente: *"Só preenche o que a resposta ainda não declarou, para uma rota poder abrir exceção explicitamente sem precisar sair do middleware."* Existe seam — por resposta, não por config. Que config seria melhor é argumento defensável; "não tem seam" não é fato.

4. **Erro de fato na motivação de rollout.** "O `docs/migration/PLAYBOOK.md` já manda 'CSP report-only com allowlist' para **ctfinance/ctvitrine/cuidari**". `PLAYBOOK.md:126` nomeia **ctfinance/sorteiopix/spinmax**. As instruções por projeto existem em `ctfinance.md:37,57`, `sorteiopix.md:42,55`, `ctjuris.md:39,53`, `cuidari.md:50` — e `grep -rn "CSP|report-only" docs/` retorna **zero hits em `ctvitrine.md`**. Dos três nomes citados, um não está na lista e dois dos mais relevantes ficaram de fora.

**Sobrevive:** exatamente o item que o candidato deixou por último — **não existe teste do boilerplate que exercite o ramo `isProduction() && isSecure()`**. `SecurityHeadersTest.php:21-27` só afirma a ausência. Esse é um buraco real sobre superfície viva, não vacuidade. A parte de `config/security.php` + `Content-Security-Policy-Report-Only` é proposta legítima, mas deve ser julgada pelo custo dela, não pelo caso spinmax, que não a sustenta.

---

#### C3 · Ziggy escopado — **derrubar: a forma proposta é bug verificado**

**Fatos que conferem:** `config/ziggy.php:14-22`, `PublicStore.php:30-37`, `shop.blade.php:31`. Boilerplate: `HandleInertiaRequests.php:68-69` (`'ziggy' => fn(): array => [` / `...(new Ziggy())->toArray(),`), `app.blade.php:61` (`@routes`), `ls config/` = 14 arquivos, nenhum `ziggy.php`. Tudo confere.

**O que derruba:**

1. **"Grupo `public` vazio-por-padrão" faz o oposto do que se quer — verificado no vendor.** `vendor/tightenco/ziggy/src/Ziggy.php:86`:
   ```php
   $reject = collect($filters)->every(fn (string $pattern) => str_starts_with($pattern, '!'));
   ```
   Com `$filters === []`, `every()` é **vacuosamente `true`** → cai no ramo `reject()` (`:89-95`), cujo `foreach` sobre array vazio não retorna nada (`null`, falsy) → **nada é rejeitado e todas as rotas ficam**. `Ziggy::group()` (`:72-73`) chega lá porque `config()->has('ziggy.groups.public')` é true mesmo com valor `[]`. Ou seja: `'groups' => ['public' => []]` + `@routes('public')` serializa **exatamente a superfície inteira** que a proposta quer impedir, e o `assertDontSee('users.index')` que viria junto nasceria **vermelho**. A proposta está errada como escrita.

2. **Guardrail #4 em cheio.** `routes/web.php:12` põe tudo sob `auth`; as rotas `guest` de `routes/auth.php` são o scaffold de login, que precisa de `route()` para funcionar. Não há superfície pública Inertia no boilerplate. Um `assertDontSee` sobre um grupo que não exclui nada é o falso conforto que o guardrail descreve.

3. **O contrato é de duas pontas e a segunda não tem onde morar.** `@routes('grupo')` no Blade **e** `new Ziggy('grupo')` no share. O boilerplate tem uma root view (`app.blade.php`) e um share. Absorver isso implica absorver também uma segunda root view + um segundo middleware — muita andaime para superfície inexistente.

4. **O padrão do spinmax tem um furo que se copiaria junto.** `config/ziggy.php:17` lista `'home'` no grupo `shop`, mas `routes/web.php:17` (`GET /`) está **fora** do grupo `public.store` e `LandingController::__invoke(): View` devolve Blade puro (`landing.blade.php`, cujo grep de `@routes` retorna zero — só `@vite` em `:81`). A entrada `'home'` no grupo é config morta, e a página de maior tráfego do site está protegida por "não é Inertia", não pelo grupo.

5. **Citação errada:** o teste é `tests/Feature/Store/ShopFrontendTest.php:52-61` (o `it(...)` está em **52**, asserts em **58-60**), não `:51-59`.

**Sobrevive:** no máximo uma nota em ADR/`.ai/rules`: qualquer futura root view pública tem de parear `@routes('grupo')` com `new Ziggy('grupo')`, e o grupo **nunca** pode ser vazio (motivo em `Ziggy.php:86`). Código, não.

---

#### C4 · `EnsureUserIsActive` — **sobrevive**, com dois defeitos na proposta

**Fatos que conferem, todos:** spinmax `routes/web.php:61` (registro inline FQCN no grupo do painel), `bootstrap/app.php:43-48` (`web(append:)` com 4 itens, sem `EnsureUserIsActive`), `routes/settings.php:10` = `Route::middleware('auth')->group(...)`, `routes/auth.php:35` = idem, `EnsureUserIsActive.php:29` = `redirect()->route('login')` seco. Boilerplate `bootstrap/app.php:43` (dentro do `web(append:)` de `:37-44`) e `EnsureUserIsActive.php:30` com `Inertia::flash('error', ...)`. A superioridade do boilerplate nos dois pontos é real.

Tentei derrubar por redundância — um teste em `/settings/profile` exercita a mesma linha global que `/dashboard`. Não colou: a regressão que ele guarda é justamente "alguém move o middleware do `web(append:)` para o grupo `['auth','verified']`", e nesse cenário o teste de `/dashboard` **continua verde** (dashboard está dentro daquele grupo). Só um teste em rota de `settings.php`/`auth.php` pega. Sinal real, não vacuidade.

**Dois defeitos a corrigir antes de aplicar:**

1. **Erro de fato:** "`tests/Feature/EnsureUserIsActiveTest.php` (hoje 3 casos, **todos sobre `/dashboard`**)". São 2 sobre `/dashboard` (`:7-12`, `:14-26`); o terceiro (`:28-38`, *"blocks a deactivated user from logging in at all"*) faz `POST /login` e **não exercita o middleware** — testa o `LoginRequest`. A frase superestima a cobertura existente do middleware.
2. **A regra proposta iria para o arquivo errado.** `.ai/rules/middleware.md` tem front-matter `paths: ['app/Http/Middleware/**']`. Uma regra que diz "defesa de sessão entra em `web(append:)`, nunca por grupo de rota" governa `bootstrap/app.php` e `routes/**` — nenhum dos dois casa com esse escopo, então a regra **nunca apareceria** para quem estivesse editando `routes/web.php`, que é exatamente onde o erro do spinmax foi cometido. Tem de ir para `.ai/rules/routes.md` (`paths: routes/**`) ou uma regra nova cobrindo `bootstrap/`.

---

#### C5 · `validateCsrfTokens`/`preventRequestsDuringMaintenance` — **derrubar por ora**

**Fatos que conferem:** `bootstrap/app.php:31-41` do spinmax, incl. o comentário de 8 linhas. Boilerplate não tem nenhuma das duas chamadas (confirmado no arquivo inteiro). `/up` isento pelo framework: `vendor/laravel/framework/src/Illuminate/Foundation/Configuration/ApplicationBuilder.php:169` — `PreventRequestsDuringMaintenance::except($health)` sob o `if (is_string($health))` de `:168`, e o boilerplate passa `health: '/up'` em `bootstrap/app.php:22`. Confere.

**O que derruba:**

1. **Zero superfície e zero código — o candidato admite** ("regra sem código a alcançar até C1 aterrissar"). Se C1 não entra agora (ver acima), C5 fica sendo texto sobre nada.
2. **Mesmo defeito de escopo do C4:** a regra proposta vai para `.ai/rules/middleware.md` (`paths: app/Http/Middleware/**`), mas `validateCsrfTokens(except:)` mora em `bootstrap/app.php`. Nunca dispararia.
3. **O prefixo é o problema, não a política.** `except: ['webhooks/*']` é wildcard de prefixo: isenta **qualquer** rota futura sob `webhooks/`, inclusive uma que alguém acrescente sem HMAC. A regra que o candidato quer escrever ("isenção sem substituto é rota aberta") é inaplicável pelo mecanismo que ele endossa — a isenção é concedida por forma de URI e nada verifica que o controller valida assinatura. Se algo daqui sobrevive, é o **inverso**: `except:` no path exato (`'webhooks/mercadopago'`) ou um teste de contrato que percorra a lista de exceções e exija validação de assinatura no controller resolvido.
4. **Efeito colateral não citado do segundo `except:`.** Isentar do modo manutenção significa que o webhook bate num app **meio-deployado** (código novo, migration talvez não). No spinmax isso é tolerável porque o controller só grava uma linha e enfileira — mitigação que é propriedade do desenho magro do C1, não da linha do `except:`. Copiar a linha sem o controller magro é pior do que não copiar.

---

#### C6 · `SetSensitiveCacheHeaders` — **derrubar a alegação central; sobra pouco**

**Fatos que conferem:** `routes/web.php:38-40` (`signed`, sem auth, dentro do grupo `public.store`), payload em `OrderStatusController` com `customer_name`/`masked_cpf`/`address`/`pix` (linhas 53, 54, 55, 62 do arquivo). Grep `Cache-Control` no spinmax: **zero**, confirmado. Boilerplate `SetSensitiveCacheHeaders.php:21-23` e `SecurityHeadersTest.php:50-56` conferem exatamente. `signed` no boilerplate só em `routes/auth.php:47` — confere.

**O que derruba:**

1. **A alegação central é falsa no fio.** "Servida a requisição anônima, **sem nenhum header de cache**" confunde "o app não seta" com "a resposta não tem". O Symfony seta: `vendor/symfony/http-foundation/ResponseHeaderBag.php:239-248` — `computeCacheControlValue()` devolve **`'no-cache, private'`** quando não há Cache-Control e não há `Last-Modified`/`Expires`. A página `pedido/{uuid}` sai com `Cache-Control: no-cache, private`. E `private` já fecha exatamente a ameaça que o middleware do boilerplate existe para fechar — o docblock dele (`:12-13`) diz *"Impede que caches compartilhados (proxies, CDNs) armazenem respostas"*. Essa ameaça está fechada pelo default do framework. O delta residual é `no-store` × `no-cache`: cache de disco do browser e restauração de back-button, não armazenamento em CDN. Real, mas uma ordem de grandeza abaixo do descrito.
2. **Isso também desmonta a leitura do teste.** `SecurityHeadersTest.php:55` é `expect($cacheControl)->not->toContain('no-store')` — **não** afirma que a resposta é cacheável; afirma que guest não recebe a diretiva mais forte. Chamá-lo de "o argumento contra a correção" é leitura errada: ele continuaria verde para qualquer página guest que não seja a nova fixture sensível.
3. **`signed` é proxy ruim para "sensível", e a única rota `signed` do boilerplate prova isso.** `routes/auth.php:47` (`verify-email/{id}/{hash}`) é assinada e não tem PII nenhuma; sob a regra proposta passaria a emitir `no-store` à toa. E o caso inverso — rota pública com PII **não** assinada (consulta de pedido por token, link de compartilhamento) — não seria pego. Só a metade `defaults('sensitive', true)` da proposta se sustenta; a metade `signed` deve cair.
4. **O gatilho proposto fura justo onde mais importa.** Assinatura inválida/expirada lança `InvalidSignatureException` → 403 renderizado pelo handler, **fora da pilha de middleware** — que é a razão de existir `SecurityHeaders::stamp()`, chamado em `bootstrap/app.php:72`. `SetSensitiveCacheHeaders` não tem `stamp()` equivalente nem é chamado do handler, então o novo ramo silenciosamente não se aplicaria ali. Se isso entrar, precisa do mesmo tratamento estático — e o candidato não menciona.
5. **Guardrail #4, concedido pelo candidato:** precisaria de rota de fixture. Teste que só passa por causa de uma rota que só existe para o teste é evidência fraca.

**Sobrevive:** um marcador opt-in `defaults('sensitive', true)` (não `signed`) + um caminho de `stamp()` a partir do handler. A moldura "PII pública sem header de cache" **não deve entrar no harvest como escrita**.

---

#### C7 · Nada a colher em headers/handler/proxies — **sobrevive**, com uma correção

**Verifiquei tudo e o núcleo está certo.** spinmax: 3 headers em `SecurityHeaders.php:26-30`, `withExceptions` de uma linha (`bootstrap/app.php:60`), grep `TrustProxies|trustProxies|TRUSTED_PROXIES` em todo o repo fora de `vendor/`: **zero**. `AppServiceProvider.php:124` = `RateLimiter::for('mp-webhook', fn($request) => Limit::perMinute(120)->by($request->ip()))`. `throttle:10,1` em `routes/web.php:28,35,87` e `throttle:60,1` em `:52` — confere. Boilerplate: `Permissions-Policy` em `SecurityHeaders.php:27`, HSTS+CSP em `:53-78`, `trustProxies` em `bootstrap/app.php:25-33` com o comentário citado, handler em `:50-73`, `.env.example:9` = `# TRUSTED_PROXIES=` — **confere exatamente, inclusive o número da linha**. `/up` isento pelo framework, confirmado.

**Três reparos:**

1. **O único item acionável não tem onde morar.** "cabe um check no `staging:check`/deploy do boilerplate" — **o boilerplate não tem `staging:check`**. `ls app/Console/Commands/` = `CreateSuperUserCommand.php` e `SyncPermissionsCommand.php`, só. `StagingCheckCommand.php` é arquivo do **spinmax**. Isso contradiz o próprio "Superfície no boilerplate hoje: sim para tudo": o check exigiria importar antes um comando que não existe aqui — o que é outro candidato (harvest de `store:health`/`staging:check`), não rodapé deste.
2. **A violação de `.ai/rules/routes.md` está do lado errado da seta.** Que o spinmax use `throttle:N,M` inline é achado **sobre o spinmax** — item de `docs/migration/projects/spinmax.md`, não candidato de harvest projeto→boilerplate. E está subcontado: além de `web.php:28,35,52,87` há `routes/auth.php:31,41,44` (`throttle:6,1`), total **7** ocorrências, não 4.
3. **"Origem comum" está impreciso, e o correto reforça a conclusão.** `git log`: `SecurityHeaders.php` do spinmax nasceu em `6dd1e81` (**2026-07-25**); o do boilerplate em `e035e42` (**2026-08-10**), o mesmo commit que criou `SetSensitiveCacheHeaders.php`. Não é ancestral comum — o arquivo do boilerplate é **descendente** do spinmax, colhido 16 dias depois e estendido. "Mão única boilerplate → spinmax" é a conclusão certa hoje, mas a razão é "já foi colhido uma vez", não "origem independente".



#### Veredito — ### RISCO DE ABSORÇÃO — Middlewares, defesas de borda e webhook

---

#### C1 · Webhook inbox como forma reusável — risco **médio**

**Dados persistidos.** Tabela nova, aditiva: não invalida nada existente. Duas traps concretas:

- **`payload` é um sink de PII cru.** O spinmax escruta só a coluna `error` (o job chama `PiiScrubber::scrubString`) e grava `'payload' => $request->all()` sem filtro nenhum (`/Users/cristianomorgante/workspace/laravel/clients/spinmax/app/app/Http/Controllers/Webhook/MercadoPagoController.php:102-105`). O boilerplate já tem o scrubber e já decidiu essa questão no log: `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/app/Support/Logging/PiiScrubber.php:86` (`scrub(mixed)`, aceita array) com `tests/Feature/LogScrubbingTest.php` travando o canal. Absorver a forma crua abre um **segundo canal de PII fora do scrubber** — exatamente a incoerência que o log-scrubbing existe para evitar. E a tabela é lida por painel/log-viewer, sem o filtro do canal de log.
- **Retenção.** O prune é por idade e depende de `store.webhooks.retention_days`; sem chave equivalente no boilerplate, a tabela cresce sem teto. Se o inbox entra, a config de retenção entra no mesmo commit, não depois.
- **Índice.** `unique(['provider','external_id'])` com dois `string` default = `varchar(255)` utf8mb4 = 2040 bytes de chave. Passa no InnoDB DYNAMIC (3072) do MySQL 8 — e `.env.example:29` fixa `DB_CONNECTION=mysql`, `config/database.php:54` fixa `utf8mb4` — mas quebra em `COMPACT/REDUNDANT` e é desperdício em qualquer caso. `string('provider', 40)` + `string('external_id', 191)` elimina a categoria inteira.

**Idempotência do banco: verificada, o candidato sobrevive aqui.** `firstOrCreate` → `createOrFirst`, que captura `UniqueConstraintViolationException` e refaz o `first()` no write PDO, dentro de savepoint — `vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php:710-735`. Na corrida real de duas entregas simultâneas o segundo request cai em `wasRecentlyCreated === false` → `duplicate`, não 500. Vale em sqlite (a suíte) e em mysql. A afirmação "a idempotência é do banco" se sustenta no Laravel 13.

**Muda comportamento / modo de falha.** Nada existente muda (namespace vazio). Mas a forma é **fail-open por desenho**: "200 sempre" significa que uma ingestão que falha *depois* da assinatura (Redis fora no dispatch, DB caindo entre insert e enqueue) devolve 200 e o provedor **nunca reentrega**. O que segura isso não é o controller — é o `store:reprocess-webhooks` a cada 5 min. Controller-200 + inbox + reprocess são **uma peça só**; absorver o controller sem o cron entrega ao derivado perda silenciosa de pagamento. Isso tem de estar amarrado no entregável (teste que prove o laço fechado), não num docblock.

**Segurança da própria absorção — três importações indesejadas:**

1. **`ReprocessWebhooksCommand` é um amplificador de fan-out.** `->get()` sem limite, sem janela, redisparando *todo* `received`/`failed` a cada 5 min. Fila parada 1h ≈ 12 dispatches por evento; um `failed` permanente é retentado para sempre. O único freio é a idempotência do job (`ProcessMercadoPagoWebhookJob::handle` retorna cedo em `status === 'processed'`) — que um skeleton genérico **não pode garantir**. Absorvendo, o comando genérico precisa de `chunkById`, janela (`created_at > now()->subDays(N)`) e teto de tentativas em coluna.
2. **Limiter por IP.** `throttle:mp-webhook` por `$request->ip()`; com `TRUSTED_PROXIES` comentado (`.env.example:9`) isso vira teto **global**, não por origem. E `.ai/rules/routes.md` já proíbe `throttle:N,M` inline: entra como `RateLimiter::for('webhook', …)` no `AppServiceProvider::configRateLimiting()` (hoje 3 limiters) + linha no `tests/Feature/…Throttle…`.
3. **Buraco de contrato — o mais sério.** A rota de webhook seria o **primeiro POST não autenticado do boilerplate**, e `tests/Feature/Routes/WriteRoutesAuthorizationTest.php` só examina rota sob `auth`: `middlewareRequiresAuthentication()` (l. 102-114) retorna false e o loop faz `continue` (l. 66-71). A rota mais perigosa que o repo passaria a ter é justamente a que o contrato de escrita **estruturalmente não enxerga**. Absorver C1 obriga a estender esse teste: rota de escrita *sem* `auth` tem de declarar middleware de assinatura. (É o mesmo guard-rail do C5 — os dois entram juntos ou nenhum.)

**Tamanho.** Migration + model + factory + controller base + 2 comandos + agendamento + config de retenção + testes ≈ **9-10 arquivos**, e traz o **primeiro `app/Jobs/` do repo** (o diretório não existe). Com `QUEUE_CONNECTION=sync` na suíte (`phpunit.xml:32`), o teste do skeleton precisa de `Queue::fake()` ou executa o job de verdade. Fatiável em 3: (1) tabela + model + factory + `webhooks:prune` + retenção + scrub do payload; (2) controller base + extensão do contrato de rota não autenticada + limiter nomeado; (3) `webhooks:reprocess` + agendamento — que só faz sentido com um job real e pode ficar por último.

---

#### C2 · CSP configurável com allowlist e report-only — risco **médio**

**Dados persistidos.** Nenhum.

**Muda comportamento.** Só sob `app()->isProduction() && $request->isSecure()` (`app/Http/Middleware/SecurityHeaders.php:53`), e a suíte hoje afirma justamente a **ausência** (`tests/Feature/SecurityHeadersTest.php:21-27`). Ou seja: a mudança acontece exatamente onde ninguém olha. Modo de falha do merge errado nos dois sentidos — allowlist não aplicada = **fail-open silencioso** (nenhum erro, só ausência de proteção); allowlist frouxa demais no outro sentido = fail-closed em produção, o caso caro que `docs/migration/PLAYBOOK.md:126` já registra.

Cobrir é barato, o padrão já existe no repo: `tests/Feature/ErrorPagesTest.php:15` usa `$this->app['env'] = 'production'`. Falta só o lado HTTPS — `$this->get('https://localhost/login')` já faz `isSecure()` retornar true.

**Segurança da própria absorção.** O seam converte "editar middleware" (que aparece como conflito no diff do boilerplate-sync, portanto é revisado) em "valor de config" que ninguém revisa. É por aí que entra `*` ou `'unsafe-eval'` em `script-src`. A mecânica precisa travar isso: merge permitido **só** em diretivas nomeadas (`script-src`, `connect-src`, `frame-src`, `img-src`) e um teste que rejeita `*` / `unsafe-eval` / `data:` em `script-src`.

E vale calibrar a expectativa: a política base já traz `'unsafe-inline'` em `script-src` (`SecurityHeaders.php:65`), o que a torna quase decorativa contra injeção de script. Tornar a lista configurável não muda isso. O caminho que muda é nonce, e ele existe meio pronto: `vendor/tightenco/ziggy/src/BladeRouteGenerator.php:12` aceita `$nonce`, e o `@routes` do boilerplate (`resources/views/app.blade.php:61`) não passa nenhum — mas nonce exige Vite inline + `@inertiaHead` + `@routes` coerentes, é outra fatia, maior.

O flag report-only é **fail-open por desenho**: sem mecanismo de expiração, o derivado fica em report-only para sempre. O playbook já pede "observar 1-2 semanas" e não nomeia quem fecha o ciclo.

**Tamanho.** 1 middleware + `config/security.php` (que não existe: `ls config/` = 14 arquivos) + teste + chaves de env ≈ **4 arquivos**. Fatiável em 2: (1) extrair para config **sem mudar o header resultante**, com teste provando igualdade byte-a-byte antes/depois; (2) flag report-only + allowlist.

---

#### C3 · Ziggy escopado por grupo — risco **baixo na forma corrigida, médio-alto na forma proposta**

Este é o candidato onde a proposta escrita se autodestrói, e dá para provar no vendor.

**Fail-open #1 — grupo inexistente vaza tudo.** `vendor/tightenco/ziggy/src/Ziggy.php:71-77`: `group()` só filtra se `config()->has("ziggy.groups.{$group}")`; senão, `return $this->routes` — a tabela **inteira**. Um typo no nome, um `config:cache` gerado num container montado antes de o arquivo existir, ou um derivado que não publicou o config, e o browser público recebe toda a superfície admin. Silencioso, sem erro.

**Fail-open #2 — grupo vazio também vaza tudo.** `filter([])` (`Ziggy.php:82-106`) faz `$reject = collect([])->every(…)`, que é `true` para coleção vazia; o `reject` então roda com **zero padrões** e não rejeita nada → todas as rotas. Portanto `'groups' => ['public' => []]`, o "grupo `public` vazio-por-padrão" da proposta, faz **exatamente o oposto** do pretendido. A forma fail-closed é `'public' => ['!*']`: todo padrão começa com `!` → `$reject = true` → `Str::is('*', $name)` casa com tudo → coleção vazia.

**Muda comportamento hoje.** Não, desde que o config seja publicado **só com `groups`**. Nenhum ponto do boilerplate passa grupo (`app/Http/Middleware/HandleInertiaRequests.php:68`, `resources/views/app.blade.php:61`), e `applyFilters()` só entra no caminho de grupo quando `$group` é truthy (`Ziggy.php:40-44`). Mas atenção: `ziggy.only` / `ziggy.except` valem para o caminho **sem** grupo (l. 46-52) — publicar o config com essas chaves preenchidas mudaria o payload de todo mundo, inclusive do painel. Publicar `groups` sozinho é inerte.

**Dois pontos que têm de concordar.** `@routes('g')` no Blade e `new Ziggy('g')` no share. Escapar um deixa o vazamento no HTML mesmo com a prop Inertia escopada. É por isso que o `assertDontSee` é a parte que carrega o padrão — e ele é barato.

**Tamanho.** 1 config + 1 parágrafo em `.ai/rules/middleware.md` + 1 teste. A menor fatia da lista.

---

#### C4 · `EnsureUserIsActive` global + teste de regressão — risco **baixo**

**Dados / comportamento.** Nenhum dos dois: o entregável é teste + regra escrita. Confirmado que a cobertura já existe de fato: `bootstrap/app.php:37-44` registra `EnsureUserIsActive` no `web(append:)`, e `routes/settings.php:10` e `routes/auth.php:43` estão dentro do grupo `web` via os `require` de `routes/web.php:66-68`. O teste novo é **pino de regressão, não correção** — e não passa vacuamente, porque exercita rota real com usuário desativado.

**Ganho extra que verifiquei e que reforça a regra:** `config/horizon.php:86` traz `'middleware' => ['web']`, então as rotas do Horizon herdam o `web(append:)`. A regra "defesa de sessão vai no append global, nunca por grupo de rota" cobre até superfície de pacote — o registro por grupo do spinmax não cobriria.

**Único detalhe de ordem que vale anotar:** `SetSensitiveCacheHeaders` está **antes** de `EnsureUserIsActive` na lista (`bootstrap/app.php:38-43`), então na volta o usuário já foi deslogado e o redirect de conta desativada sai **sem** `no-store`. É redirect para o login, sem PII no corpo — irrelevante para segurança, mas é o que muda se alguém reordenar a lista.

**Tamanho.** 1 arquivo de teste (+2 casos) + parágrafo em `.ai/rules/middleware.md` (hoje 396 bytes, só fala de shared props). Sem modo de falha.

---

#### C5 · `validateCsrfTokens(except:)` + `preventRequestsDuringMaintenance(except:)` — risco **baixo isolado, médio se o glob entrar como está**

**Dados / comportamento.** Nada muda hoje: nenhuma das duas chamadas existe em `bootstrap/app.php`, e sem superfície de webhook o default correto é não abrir exceção.

**O risco é a forma do padrão, não o conteúdo.** `except: ['webhooks/*']` é **prefixo, não rota**. Qualquer coisa futura sob o mesmo prefixo perde CSRF em silêncio — e o inbox do C1 convida diretamente a construir essa coisa (uma tela de painel para inspecionar/reprocessar eventos moraria naturalmente em `webhooks/…`). Fail-open, sem sinal. A forma defensável é isentar a URI exata da rota de ingestão (`webhooks/{provider}`) e proibir por regra que superfície de browser more sob esse prefixo.

**O segundo `except:` tem um custo que o comentário do spinmax não menciona.** Durante `artisan down` num deploy in-place, o webhook isento roda contra código/schema no meio da atualização: `composer install` a meio caminho ou migration não aplicada faz o insert do inbox estourar 500 — e aí o provedor reentrega, que é o comportamento certo, mas destrói o argumento de "evitar a janela". Em deploy de release atômica (symlink) o `artisan down` nem é usado e a isenção é dispensável. A regra tem de ser condicionada ao estilo de deploy, não copiada como dogma.

Antes do C1, é literalmente uma regra escrita — e é a **mesma** regra do buraco que apontei no C1 (o `WriteRoutesAuthorizationTest` não vê rota fora de `auth`): isenção de CSRF sem substituto declarado é rota aberta. As duas coisas são um guard-rail só.

**Tamanho.** 2 linhas em `bootstrap/app.php` + regra. Não fatiável, e não deve entrar antes do C1.

---

#### C6 · `SetSensitiveCacheHeaders` com gatilho por rota `signed` — risco **baixo**, com ressalva de falsa cobertura

**Dados.** Nenhum. **Direção do modo de falha:** segura — o gatilho novo só **adiciona** `no-store`, nunca remove.

**Mas no boilerplate de hoje a mudança é literalmente no-op.** A única rota `signed` é `verify-email/{id}/{hash}` (`routes/auth.php:46-48`) e ela está **dentro** do grupo `auth` (l. 43), portanto já cai no `$request->user()` de `app/Http/Middleware/SetSensitiveCacheHeaders.php:21`. O caso de teste novo exercita uma rota de fixture, não a aplicação: fixa o mecanismo, não um comportamento vivo. Isso é aceitável, mas tem de ser dito no PR — senão vira teste que dá sensação de cobertura sem cobrir nada.

**O gatilho `signed` é heurística para "tem PII", e erra para o lado aberto no caso geral.** Página pública com PII que **não** é assinada — status por token em query string, boleto/nota acessível por link, página de acompanhamento por número de pedido — continua cacheável. Fecha a instância do spinmax, não a classe.

**A inversão fail-closed** (`no-store` por padrão em toda resposta HTML/JSON, opt-out explícito para página pública cacheável) é a forma que fecha a classe, mas quebra exatamente o caso de uso dos derivados: vitrine/marketing atrás de CDN, que é o que o spinmax e o ctvitrine querem. E derruba o teste `tests/Feature/SecurityHeadersTest.php:50-56`, que hoje afirma o contrário. Se for por esse caminho, é decisão consciente com ADR, não ajuste de middleware.

**Tamanho.** 1 middleware + rota de fixture no teste + ajuste do teste existente ≈ **2 arquivos**.

---

#### C7 · Nada a colher em headers/handler/proxy — risco **baixo**, mas o check proposto tem backfire concreto

**A conclusão principal sobrevive intacta.** Confirmei os dois lados: `app/Http/Middleware/SecurityHeaders.php:27` tem `Permissions-Policy`; l. 53-78 emitem HSTS + CSP sob produção/HTTPS; `bootstrap/app.php:25-33` faz `trustProxies` a partir de `TRUSTED_PROXIES`; l. 50-73 têm o handler completo (Inertia `errors/error-page` para 403/404/500/503 fora de local/testing, fallback Blade quando o próprio render falha, 419 → flash + `back()`, e só então `stamp()`). Mão única boilerplate → spinmax, sem exceção.

**O único código novo proposto é onde mora o risco.** Um check que reprova quando `APP_URL` começa com `https://` e `TRUSTED_PROXIES` está vazio é **falso-positivo em toda instalação onde o TLS termina no próprio host** (Herd/Valet local com https, nginx + php-fpm na mesma máquina): ali `isSecure()` já funciona por `$_SERVER['HTTPS']` e proxy confiável não é necessário. Note que `.env.example:5` já traz `APP_URL=https://simplify-technology-boilerplate.test` — o check reprovaria o boilerplate recém-clonado.

O desfecho previsível de um check que grita sem motivo é alguém escrever `TRUSTED_PROXIES=*` para calá-lo — e `bootstrap/app.php:31` aceita `'*'` literalmente, o que torna `X-Forwarded-For` e `X-Forwarded-Proto` forjáveis. Aí os três limiters por `$request->ip()` (`auth`, `impersonate`, `verification`, em `AppServiceProvider::configRateLimiting()`) passam a ser contornáveis por header. **O guard-rail viraria a vulnerabilidade.**

Forma melhor: checar o fato de runtime, não o env — em staging, exigir que a resposta HTTP real traga `Strict-Transport-Security` (prova direta de que `isSecure()` é verdadeiro na produção de verdade); ou avisar (não reprovar) exigindo opt-out explícito (`TRUSTED_PROXIES=none`) para silenciar. Nenhuma das duas aceita `*` sem registro.

**Tamanho.** `app/Console/Commands/` tem hoje só `CreateSuperUserCommand.php` e `SyncPermissionsCommand.php` — não existe `staging:check` no boilerplate, então isso é **comando novo**, não edição. 1 comando + 1 teste + linha de doc. Zero impacto em dado ou comportamento existente.



#### Veredito — ### ATUALIDADE — Middlewares, defesas de borda e webhook

Verificado contra o vendor real do boilerplate (Laravel 13 / Inertia 3 / Ziggy 2.4 instalados) e contra `search-docs` version-aware. Onde não consegui verificar, digo explicitamente.

---

#### C1 · Webhook inbox reusável — `[absorver-modernizado]`

**Não há nativo que faça o inbox.** Busquei docs de webhook/idempotência em `laravel/framework@13.x` e não existe nada equivalente (nem controller base, nem tabela, nem contrato). `app/Http/Controllers/` do boilerplate tem só `Auth`, `PermissionRole`, `Settings`, `User`; `app/Jobs` não existe. A forma sobrevive — mas **três das cinco peças propostas mudam de API**:

1. **`webhooks:prune` não deve ser absorvido como comando.** `Illuminate\Database\Eloquent\MassPrunable` + `Schedule::command('model:prune')->daily()` é o nativo (docs Eloquent → "Pruning Models", 13.x; `model:prune` autodetecta prunables em `app/Models`). O `WebhookEvent` ganha `prunable(): Builder` lendo o retention da config, e `routes/console.php` (hoje só linha 7, `horizon:snapshot`) ganha uma linha. Um `PruneWebhookEventsCommand` próprio seria reimplementar `model:prune`.

2. **A idempotência de banco já é entregue pelo framework, mas via outro método.** Verifiquei `vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php:710-717`: `firstOrCreate()` hoje faz um `SELECT` e **delega para `createOrFirst()`** (l. 728-735), que faz `create()` dentro de savepoint, captura `UniqueConstraintViolationException` e relê com `useWritePdo()`. Ou seja: a corrida que o candidato atribui ao `unique(provider, external_id)` é resolvida pelo framework *dado* o índice — o índice continua obrigatório. No skeleton, use `createOrFirst()` direto (pula o SELECT extra do caminho quente do webhook); `wasRecentlyCreated` continua `false` no ramo do catch, então o `200 {"status":"duplicate"}` segue funcionando.

3. **A "segunda camada" (lock + guarda de status no job) virou contrato de framework.** `ShouldBeUniqueUntilProcessing` + `#[UniqueFor(3600)]` (docs Queues 13.x — o `UniqueFor` como **atributo PHP** é a forma atual, não a propriedade `$uniqueFor`) com `uniqueId()` = id do `WebhookEvent` faz exatamente o lock que o spinmax escreveu à mão. Isso importa para o guard-rail que o candidato enuncia: as duas camadas continuam necessárias, mas a segunda deixa de ser código de domínio.

4. **`webhooks:reprocess` sobrevive parcialmente.** `queue:retry` / `queue:prune-failed` cobrem o evento cujo job chegou a `failed_jobs`; **não** cobrem o evento parado em `received` (dispatch aconteceu, job sumiu) — que é justamente o caso do comando do spinmax. Absorver, mas com o escopo reduzido a `received` e o comentário do porquê.

Contra-argumento honesto: `withoutOverlapping()` no schedule continua sendo o nativo certo, sem mudança.

---

#### C2 · CSP hardcoded — `[absorver-modernizado]`, e o alvo é outro

O seam de config **não** é nativo (não há CSP builder no Laravel 13 — verifiquei). Até aí o candidato está de pé. Mas a premissa "`'unsafe-inline'` enquanto o `app.blade.php` tiver script inline" (comentário em `app/Http/Middleware/SecurityHeaders.php:12-19`) **está desatualizada**: toda a stack instalada suporta nonce hoje.

Verificado no vendor instalado:
- `vendor/laravel/framework/src/Illuminate/Foundation/Vite.php:150,161` — `cspNonce()` / `useCspNonce()`; o nonce é aplicado a todas as tags geradas (`nonceAttribute()` l. 1053; `'nonce' => $this->nonce` l. 706, 712, 786, 804). Docs 13.x mostram o padrão exato: chamar `Vite::useCspNonce()` **num middleware** e emitir o header no mesmo lugar — ou seja, no próprio `SecurityHeaders::handle()`.
- `vendor/tightenco/ziggy/src/BladeRouteGenerator.php:13` — assinatura `generate(array|string|null $group = null, ?string $nonce = null, ?bool $json = false)`, e a diretiva repassa os argumentos crus (`ZiggyServiceProvider.php:31`). Logo `@routes(nonce: Vite::cspNonce())` funciona — e o mesmo `@routes` aceita grupo, o que junta C2 e C3 numa edição só em `resources/views/app.blade.php:61`.
- Inertia 3: `createInertiaApp({ nonce })` para os estilos inline da progress bar / error modal (docs `inertiajs/inertia-laravel@3.x`, Client-side setup). Hoje `resources/js/app.tsx:15` não passa nonce.
- **Horizon é a pegadinha:** o boilerplate serve o dashboard (`config/horizon.php:44`, path `horizon`) e as views dele não passam pelo Vite. Docs Horizon: `Horizon::cspNonce()` via middleware registrado em `config/horizon.php` `middleware`. Uma CSP com nonce sem isso derruba o Horizon em produção — e, como a CSP só liga sob `isProduction() && isSecure()`, derruba **só lá**, repetindo exatamente o modo de falha que o candidato descreve.

Dois limites do nonce (escopo honesto, para não vender fácil demais):
- Os dois blocos inline escritos à mão em `resources/views/app.blade.php:11-23` (script de tema) e `:34-44` (style de fundo) precisam do `nonce="..."` manualmente — o Vite não os toca.
- `style-src` com nonce **não** cobre atributo `style="..."` inline, e o boilerplate usa Radix pesado (`package.json:63-76`, 13 pacotes `@radix-ui/*` + `@radix-ui/themes`), que posiciona popover/dialog por style inline. Isso exigiria manter `style-src-attr 'unsafe-inline'`. **Não verificado empiricamente** neste repo (é leitura da spec CSP + presença do Radix), mas precisa entrar como risco antes de alguém prometer "CSP sem unsafe-inline".

Subproduto verificado que corrige o candidato: `resources/views/app.blade.php:59` tem `preconnect` para `https://fonts.bunny.net`, mas `grep` em `resources/css/` e `resources/views/` não encontra nenhum fetch real de bunny/googleapis/CDN. Ou seja, **a CSP atual do boilerplate é honesta hoje** — a allowlist é 100% para os derivados, não para o boilerplate. Isso muda o desenho: a config deve nascer com allowlist **vazia** e um toggle de `report_only` + um toggle de `nonce`, não com origens de exemplo.

---

#### C3 · Ziggy escopado por grupo — `[atual]` (com uma correção de fato e um aviso de ADR)

Grupos continuam vivos na versão instalada: `vendor/tightenco/ziggy/src/Ziggy.php:26-33` (`__construct(array|string|null $group, ?string $url)`), `applyFilters()` l. 41-54 e `group()` l. 60-75 lendo `config("ziggy.groups.{$group}")`; `@routes('grupo')` funciona pela assinatura de `BladeRouteGenerator::generate()`. Nada no Laravel 13 nem no Inertia 3 substitui isso dentro do ADR-0002.

**Correção de fato ao candidato:** "publicar `config/ziggy.php`" não é `vendor:publish` — `ls vendor/tightenco/ziggy/` não tem diretório `config/`, e `ZiggyServiceProvider` (32 linhas, lidas na íntegra) não registra `publishes()`. O arquivo tem que ser escrito à mão. Também vale registrar que `Ziggy` cacheia as rotas num estático (`protected static $cache`, l. 21/32) e o provider só reseta isso no evento do Octane — irrelevante hoje, mas é o tipo de coisa que morde se alguém instanciar `new Ziggy('grupo')` duas vezes no mesmo request com grupos diferentes esperando isolamento (o `filter()` reatribui `$this->routes`, então está ok; verifiquei l. 77-90).

**Aviso que o candidato não faz:** o que obsoleta C3 por inteiro é **Wayfinder**. Docs `inertiajs/inertia-laravel@3.x` o tratam como caminho de primeira classe (`<Link href={show(1)}>`, `form.submit(store())`, `router.visit(show(1))`, `config/wayfinder.php`) e afirmam que "se você usa um starter kit do Laravel, Wayfinder já vem configurado". Com Wayfinder não existe tabela de rotas serializada para o browser — o vazamento que C3 descreve é estruturalmente impossível, e o teste `assertDontSee('users.index')` perde o objeto. **Não está instalado** (`composer.json` tem `tightenco/ziggy: ^2.4`, sem `laravel/wayfinder`), é `[dep-nova]`, e o ADR-0002 manda manter Ziggy. Então C3 sobrevive — mas sobrevive *por causa do ADR*, e isso merece ir para o dono: o ADR-0002 hoje é a única coisa entre o boilerplate e o padrão que o próprio starter kit oficial adotou. Se o ADR for revisitado, C3 morre junto.

---

#### C4 · `EnsureUserIsActive` global + teste de regressão — `[atual]`

Tentei derrubar e não consegui. O alias nativo mais próximo é `auth.session` → `Illuminate\Session\Middleware\AuthenticateSession` (verifiquei a tabela `Middleware::defaultAliases()`, `vendor/laravel/framework/src/Illuminate/Foundation/Configuration/Middleware.php:805-820`): ele invalida sessões após troca de senha entre dispositivos, **não** lê flag de domínio. Nada no Laravel 13 encerra sessão por atributo do model. `verified` cobre e-mail, não `is_active`.

Confirmei o lado do boilerplate: `bootstrap/app.php:43` (registro global no `web(append:)`) e `app/Http/Middleware/EnsureUserIsActive.php:30` (`Inertia::flash('error', ...)`, canal nativo do Inertia 3). Confirmei também as duas superfícies descobertas do lado do spinmax: `routes/settings.php:10` e `routes/auth.php:42` são ambos `Route::middleware('auth')->group(...)` no boilerplate — logo o caso de teste novo tem alvo real e não passaria vacuamente.

**Um ajuste de mecanismo no entregável:** a regra proposta não cabe em `.ai/rules/middleware.md` como está — o front-matter dele é `paths: ['app/Http/Middleware/**']` (l. 1-4, arquivo tem 9 linhas), e a regra fala de `bootstrap/app.php`, que esse glob não alcança. Ou amplia o glob, ou a regra vai para `.ai/rules/app.md`. E o teste novo deve usar `assertInertiaFlash()`, já em uso em `tests/Feature/EnsureUserIsActiveTest.php:23`, não `assertSessionHas`.

---

#### C5 · `validateCsrfTokens(except:)` + `preventRequestsDuringMaintenance(except:)` — `[absorver-modernizado]`

Aqui a lente pega o achado mais direto: **`validateCsrfTokens()` está deprecada no Laravel 13.** Verifiquei `vendor/laravel/framework/src/Illuminate/Foundation/Configuration/Middleware.php:617-628`:

```php
/**
 * Configure the CSRF token validation middleware.
 *
 * @deprecated Use preventRequestForgery() instead.
 */
public function validateCsrfTokens(array $except = [])
{
    return $this->preventRequestForgery($except);
}
```

A API atual é `preventRequestForgery(array $except = [], bool $originOnly = false, bool $allowSameSite = false)` (l. 605-615), e a classe é `Illuminate\Foundation\Http\Middleware\PreventRequestForgery` — não `VerifyCsrfToken`. Copiar a linha do spinmax verbatim entra deprecada no boilerplate.

Mais importante que o rename: **o default mudou**. `PreventRequestForgery::handle()` (l. 95-112) passa quando `hasValidOrigin($request)` — header `Sec-Fetch-Site` — **antes** de cair no `tokensMatch()`. Duas consequências verificáveis para a regra que o candidato quer escrever:
- Webhook não é browser, não manda `Sec-Fetch-Site`, então cai no fallback de token e **continua tomando 419** — o `except:` segue obrigatório. A justificativa do spinmax se mantém, com um passo a mais na cadeia.
- Se alguém for tentado por `originOnly: true` (docs CSRF 13.x: "requests que falham verificação de origem recebem **403** em vez de 419"), isso **quebra o ramo 419 do próprio boilerplate** em `bootstrap/app.php:67-70`, que converte 419 em flash + `back()`. Também nota da doc: `Sec-Fetch-Site` só chega sob HTTPS. Isso merece uma linha na regra, porque é o tipo de flag que parece endurecimento gratuito e apaga uma UX existente.

`preventRequestsDuringMaintenance(except:)` continua atual e **não** deprecada (l. 713-722) — absorver como está, com o comentário do porquê. E, ao lado dele, registro que `validateSignatures(except:)` (l. 634-641) também existe e é a contraparte para C6.

---

#### C6 · `SetSensitiveCacheHeaders` só olha `$request->user()` — `[absorver-modernizado]`

O **header** tem produtor nativo, o **gatilho** não. Verifiquei os dois lados:

Nativo que existe: alias `cache.headers` → `Illuminate\Http\Middleware\SetCacheHeaders` (tabela de aliases l. 808) que faz `$response->setCache($options)`; e `vendor/symfony/http-foundation/Response.php:91-106` lista `must_revalidate`, `no_store`, `private` entre as diretivas aceitas. Logo `->middleware(SetCacheHeaders::using(['private' => true, 'no_store' => true, 'must_revalidate' => true]))` emite exatamente a string hardcoded em `app/Http/Middleware/SetSensitiveCacheHeaders.php:31`.

Por que isso **não** obsoleta o candidato (li o `handle()` inteiro, l. 50-82):
- l. 54 — sai cedo se `! $request->isMethodCacheable()`: só GET/HEAD. Um POST/PATCH Inertia devolvendo 302 com dados sensíveis em sessão não seria carimbado.
- l. 62 — sai cedo se `! $response->isSuccessful()`: um 422 de validação (resposta Inertia carregando os campos submetidos) sai sem `no-store`. O middleware do boilerplate carimba independente de status.
- É opt-in por rota, que é literalmente o esquecimento que C6 quer travar.

Então: absorver o segundo gatilho, mas **detectá-lo com API nativa, não com `in_array('signed', ...)`**. Verifiquei que a inspeção por nome é frágil: `Illuminate\Routing\Route::middleware()` (l. 1079) e `gatherMiddleware()` (l. 1060) existem, mas `signed` pode aparecer como alias `'signed'`, como `ValidateSignature::class`, ou como `ValidateSignature::relative()` — que retorna a string `"...\ValidateSignature:relative"` (`vendor/laravel/framework/src/Illuminate/Routing/Middleware/ValidateSignature.php:33-38`). O probe agnóstico de forma é `$request->hasValidSignature()` (por trás, `UrlGenerator::hasValidSignature()`, `vendor/laravel/framework/src/Illuminate/Routing/UrlGenerator.php:434`) — ou o `defaults('sensitive', true)` explícito que o candidato já sugere, que eu preferiria como fonte primária por ser declarativo, com o `hasValidSignature()` como rede.

Confirmei a ressalva do candidato sobre o teste: a **única** rota `signed` do boilerplate é `verify-email/{id}/{hash}` (`routes/auth.php:46-47`), e ela está dentro de `Route::middleware('auth')` (l. 42) — ou seja, já cai no ramo `$request->user()` e não exercita o gatilho novo. **Fixture de rota é mesmo necessária**, e o teste `it('leaves guest responses cacheable...')` (`tests/Feature/SecurityHeadersTest.php:50-56`) precisa ser reescrito junto, senão vira o argumento contra a correção — o candidato acertou nos dois pontos.

---

#### C7 · Headers baseline / handler / proxies — `[atual]` (nada a colher, e nada obsoleto)

Verifiquei que as três APIs que o boilerplate usa continuam correntes no Laravel 13: `trustProxies(array|string|null $at, ?int $headers)` (`Middleware.php:696-710`, com `headers:` disponível se um dia precisarem estreitar), `$exceptions->respond(fn (Response, Throwable, Request))` — assinatura idêntica à documentada pelo Inertia 3 para o handler de erro e para o 419 → `back()` — e o carimbo por `SecurityHeaders::stamp()`. Nada deprecado, nada superado.

Uma emenda de atualidade sobre o próprio C7: ele declara a frente "headers/handler/proxy" encerrada, mas a parte **CSP** do `SecurityHeaders` é justamente o que C2 reabre com nonce. Fechar C7 como "mão única, não olhar de novo" e depois modernizar a CSP com nonce mexe no mesmo arquivo e no mesmo teste. Vale registrar como "encerrado exceto CSP", senão as duas fatias colidem.

Sobre o check de `TRUSTED_PROXIES` (`.env.example:9` comentado): **não há nativo**. `php artisan about` reporta, não afirma; não achei nenhum health/environment check no framework que falhe quando `APP_URL` é `https://` e o proxy não está configurado. Continua sendo código novo — `[atual]`.



### Frente: Rate limiting e superfície de abuso

#### Candidatos levantados

### Rate limiting e superfície de abuso

**Correção ao inventário antes dos candidatos.** `POST login` **não** está sem limitação: `routes/auth.php:18` realmente não tem `throttle:`, mas `app/Http/Requests/Auth/LoginRequest.php:48-64` implementa `ensureIsNotRateLimited()` (5 tentativas, chave `lower(email)|ip`). O fato correto é "sem throttle **de rota**, com limite próprio no FormRequest". `POST logout` (`routes/auth.php:52`) está mesmo sem nada — e o boilerplate também (`routes/auth.php:59`), então não é diferencial. Os outros números batem: **9** throttles inline literais (web.php:28,35,52,87 · auth.php:24,31,40,44 · api.php:10) e **1** limiter nomeado (`AppServiceProvider.php:124`).

---

#### C1 · O boilerplate já venceu no eixo "limiter nomeado" — o que falta é o censo mecânico
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `app/Providers/AppServiceProvider.php:122-125` tem um único limiter — `RateLimiter::for('mp-webhook', fn(Request $request) => Limit::perMinute(120)->by($request->ip()));` — e 9 literais espalhados, com quatro números diferentes (`10,1` · `60,1` · `6,1` · `30,1`) e nenhuma justificativa de valor em lugar nenhum. Dois deles convivem no mesmo arquivo a 20 linhas de distância (`routes/web.php:35` e `:52`).
- **Equivalente no boilerplate**: `app/Providers/AppServiceProvider.php:93-109` (`auth` 10/min por IP, `impersonate` e `verification` por `user()->id ?? ip`), `.ai/rules/routes.md:8-9`, `.ai/rules/providers.md:8-9`, `tests/Feature/Auth/AuthRouteThrottleTest.php`.
- **O que absorver / travar**: **Nada a absorver — o boilerplate é estritamente superior aqui, e o spinmax é a prova de campo do custo.** O buraco é de *enforcement*: `AuthRouteThrottleTest.php:37-47` só proíbe as strings `throttle:10,1` / `throttle:6,1` em **três URIs nomeadas**. Uma rota nova com `throttle:20,1` passa em tudo — teste, Pint, Rector, larastan. Guard-rail: um teste que varre `Route::getRoutes()` inteiro e falha se `gatherMiddleware()` de qualquer rota da aplicação casar `/^throttle:\d+(,\d+)?$/`, com a mensagem apontando para `configRateLimiting()`.
- **Superfície no boilerplate hoje**: sim, real — 6 rotas com throttle nomeado hoje (auth.php:20,31,38,47,51 + web.php:40). O teste não passa vacuamente: ele varre a tabela de rotas real e trava a próxima rota adicionada.

---

#### C2 · O limite do `POST login` mora num FormRequest e não tem teste em nenhum dos dois repositórios
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `routes/auth.php:18` — `Route::post('login', [AuthenticatedSessionController::class, 'store']);` sem middleware. O limite existe só em `app/Http/Requests/Auth/LoginRequest.php:50` (`RateLimiter::tooManyAttempts($this->throttleKey(), 5)`). Varredura de `tests/`: zero ocorrências de `Lockout`, `RateLimiter`, `assertStatus(429)` fora de `tests/Feature/Store/ShippingQuoteEndpointTest.php:171`. `tests/Feature/Auth/AuthenticationTest.php` cobre render, sucesso, senha inválida e logout — nenhum caso de bloqueio.
- **Equivalente no boilerplate**: `app/Http/Requests/Auth/LoginRequest.php:49-70` — código idêntico (mesmas 5 tentativas, mesma `throttleKey()`). `tests/Feature/Auth/AuthenticationTest.php` tem os mesmos 4 testes, sem lockout. E `AuthRouteThrottleTest.php:20-21` **exclui o login por escrito**: *"O login não entra aqui porque já tem limitação própria via LoginRequest"* — declara a dependência e não a testa.
- **O que absorver / travar**: adicionar em `AuthenticationTest.php` um teste de lockout: 5 POSTs com senha errada para o mesmo e-mail, o 6º devolve erro de validação em `email` com a mensagem `auth.throttle` (e opcionalmente `Event::assertDispatched(Lockout::class)`). É o único ponto de rate limit do endpoint de maior valor da aplicação (credential stuffing) e hoje qualquer refactor do `LoginRequest` que remova a chamada a `ensureIsNotRateLimited()` passa verde.
- **Superfície no boilerplate hoje**: sim — `POST login` existe e é a rota mais exposta do painel. Teste não-vácuo.

---

#### C3 · Rota pública de escrita sem teste de que o limite morde
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: três superfícies públicas de escrita — `POST checkout` (`routes/web.php:27-29`, `throttle:10,1`), `POST pedido/consulta` (`routes/web.php:34-36`, `throttle:10,1`), `POST api/shipping/quote` (`routes/api.php:9-11`, `throttle:30,1`). Só a terceira tem teste do limite: `tests/Feature/Store/ShippingQuoteEndpointTest.php:161-172` — `for ($i = 0; $i < 30; $i++) { ...->assertOk(); } ...->assertStatus(429);`. O checkout, que é a rota que **cria linhas no banco e chama a API do gateway de pagamento a cada request**, não tem nenhum.
- **Equivalente no boilerplate**: `tests/Feature/Auth/AuthRouteThrottleTest.php:49-63` — o teste "forgot-password blocks the 11th request within a minute" é exatamente a forma certa, e é o único do gênero.
- **O que absorver / travar**: absorver a **forma** do teste do spinmax (loop até o limite + 1 request que dá 429) como padrão obrigatório, e registrar em `.ai/rules/tests.md` a regra: *rota alcançável sem `auth` que usa POST/PUT/PATCH/DELETE precisa de limiter nomeado **e** de um teste que o 429 realmente acontece*. A generalização para censo automático (varrer rotas guest de escrita) exige allowlist para o `POST login` — use o mecanismo de duas vias de `WriteRoutesAuthorizationTest.php:39-50` / `:150-162`, que já provou funcionar.
- **Superfície no boilerplate hoje**: **parcial, e é preciso dizer**. Hoje as únicas rotas guest de escrita são `register`, `forgot-password`, `reset-password` e `login` — todas em `routes/auth.php`, e três já cobertas. Um censo automático seria quase vácuo *agora*; o valor é para o projeto derivado que ganha o primeiro endpoint público (foi exatamente o caminho do spinmax). Escreva a regra `.ai/rules` mesmo assim, mas não gaste um teste de censo com 4 rotas conhecidas.

---

#### C4 · `throttle:` ocupando o lugar de `can:` — segunda ocorrência de campo da mesma falha
- **Pergunta**: (b) guard-rail — **já travado, sem ação de código**
- **Evidência (spinmax @ e4ec01e)**: `routes/web.php:86-88` — `Route::post('users/{user}/impersonate', User\StartImpersonateController::class)->middleware('throttle:10,1')->name('users.impersonate');`. Dentro do grupo `['auth','verified',EnsureUserIsActive]` (`:61`), mas **fora** do `can:manage_users` que fecha em `:83`. Qualquer usuário autenticado alcança a rota; a autorização real depende inteiramente do controller/policy.
- **Equivalente no boilerplate**: `routes/web.php:39-41` — `->middleware(['throttle:impersonate', 'can:impersonate_users'])`. O caso está travado por três camadas: `.ai/rules/routes.md:11-12` ("Throttle não é autorização"), o censo genérico `tests/Feature/Routes/WriteRoutesAuthorizationTest.php` (allowlist de self-service verificada nos dois sentidos) e a regressão nomeada em `:167-174`.
- **O que absorver / travar**: nada de código. O achado é que a falha **recorre**: o cabeçalho do teste (`:15-17`) credita a origem ao ctfinance @ b8c6d57; o spinmax é a segunda instância independente, com a mesma rota e a mesma forma. Vale atualizar só o comentário de origem para citar as duas — evidência de classe, não de acidente, e justifica manter o censo genérico em vez de degradá-lo a teste pontual.
- **Superfície no boilerplate hoje**: sim — o censo varre 20+ rotas de escrita sob `auth` em `routes/web.php` e `routes/settings.php`. Não passa vacuamente.

---

#### C5 · Webhook limitado por IP: a forma está certa, e o perigo é o desenho oposto
- **Pergunta**: (a) absorver do spinmax — como receita documentada
- **Evidência (spinmax @ e4ec01e)**: `app/Providers/AppServiceProvider.php:124` — `Limit::perMinute(120)->by($request->ip())`, aplicado em `routes/web.php:56-58` (`->middleware('throttle:mp-webhook')`). Acompanhado, em `bootstrap/app.php`, de `validateCsrfTokens(except: ['webhooks/*'])` e `preventRequestsDuringMaintenance(except: ['webhooks/*'])`, e no controller de validação HMAC (`x-signature` + `x-request-id`, secret `***`) que responde 401 antes de qualquer escrita.
- **Equivalente no boilerplate**: **não existe.** Não há `routes/api.php`, não há `app/Http/Controllers/Webhook/`, `bootstrap/app.php:19-23` registra só `web`, `commands` e `health: '/up'`. Nenhum limiter nomeado do gênero.
- **O que absorver / travar**: respondendo à pergunta direta — **um webhook limitado por IP não é limitável pelo atacante**: o tráfego dele preenche o balde do próprio IP e deixa o balde do provedor intacto. O desenho perigoso é o oposto (limite global/sem `by()`), que transforma qualquer script num DoS de notificação de pagamento. O que o boilerplate deve absorver é a **regra**, não o código: em `.ai/rules/routes.md`, "throttle de webhook é sempre `->by($request->ip())`, nunca global; e só é aceitável um limite finito porque existe caminho de replay/reconcile" — no spinmax esse caminho é `store:reconcile-orders` (10 min) + `store:reprocess-webhooks` (5 min). Sem a rede de reconcile, 120/min por IP significa perder silenciosamente a notificação nº 121.
- **Superfície no boilerplate hoje**: **nenhuma.** Um teste sobre isso passaria vazio — por isso o entregável é regra `.ai/rules` + doc, e o código só quando um derivado ganhar o primeiro webhook.

---

#### C6 · Enumeração: a resposta já é genérica nos dois; o vazamento residual é por tempo e por chave de limiter
- **Pergunta**: (b) guard-rail contra erro daqui
- **Evidência (spinmax @ e4ec01e)**: `app/Http/Controllers/Auth/PasswordResetLinkController.php:27-31` chama `Password::sendResetLink()` e devolve **sempre** `back()->with('status', 'Se existir uma conta com esse e-mail, o link de redefinição será enviado.')` — resposta idêntica para conta existente e inexistente. `app/Http/Controllers/Shop/OrderLookupController.php:35-39` idem: um único `'Dados não conferem. Confira o número do pedido e o CPF usado na compra.'` para CPF errado e número errado (documentado em `:15-19`). Duas fugas restam: (1) não existe `app/Notifications/` no repo e o `User` não sobrescreve `sendPasswordResetNotification`, então o `ResetPassword` padrão do framework é enviado **de forma síncrona dentro do request** — conta existente custa um round-trip SMTP a mais, conta inexistente responde na hora; (2) `throttle:6,1` (`routes/auth.php:24`) é chaveado só pelo IP, então 6 e-mails de reset por minuto para um endereço-alvo escolhido pelo atacante.
- **Equivalente no boilerplate**: `app/Http/Controllers/Auth/PasswordResetLinkController.php:27-34` — mesma resposta genérica (em pt-BR, com comentário explicando por que não passa por `__()`). Também sem `app/Notifications/`, também síncrono. E `throttle:auth` é `Limit::perMinute(10)->by($request->ip())` (`AppServiceProvider.php:95-98`) — mesmo padrão de chave, teto **mais alto** (10 vs 6), embora o balde seja compartilhado entre `register`/`forgot-password`/`reset-password` (a chave do limiter nomeado é `md5('auth'.$ip)`, não por rota).
- **O que absorver / travar**: no eixo "resposta genérica", os dois estão corretos e o boilerplate não tem o que absorver — registre isso para não gastar PR. O que travar: (1) endpoint que dispara e-mail para endereço fornecido pelo request precisa de chave composta — `Limit::perMinute(6)->by($request->ip() . '|' . Str::lower((string) $request->input('email')))` — senão o teto por IP é um bombardeio de caixa postal alheia; (2) a notificação de reset deve implementar `ShouldQueue` (via `User::sendPasswordResetNotification()` com notification própria), o que fecha o canal de tempo **e** tira o SMTP do caminho do request.
- **Superfície no boilerplate hoje**: sim, real e imediata — `POST forgot-password` existe, é guest, dispara e-mail e está sob `throttle:auth`. O teste do bombardeio (mesmo e-mail, 7ª tentativa → 429) e o de fila (`Notification::assertSentTo` + `ShouldQueue`) rodam contra código existente. Atenção: `AuthRouteThrottleTest.php:49-63` hoje varia o e-mail a cada iteração (`ghost{$attempt}@example.com`) — ele valida o teto por IP e continuaria verde; o caso novo é o inverso, e-mail fixo.



#### Veredito — ### REFUTAR — Rate limiting e superfície de abuso

Baselines conferidos: spinmax `e4ec01eb0dbc7425d1839033c913f047d8c70985` (o `e4ec01e` pedido); boilerplate `e5497379dbd0b70db7543845ac91d562b3d7d1e3` — **note que o boilerplate avançou** desde os números citados (dois commits de a11y depois), mas todos os `path:linha` citados ainda batem.

**Correção ao inventário — confirmada, com um ajuste de linha.** `grep -rn "throttle:" routes/` no spinmax dá 10 ocorrências, das quais 1 é `throttle:mp-webhook` (`routes/web.php:57`) ⇒ **9 literais**, exatamente nos paths citados. `ensureIsNotRateLimited()` está em `LoginRequest.php:48-65` (não `:48-64`; `:64` é o `]);` e `:65` fecha o método) e `tooManyAttempts($this->throttleKey(), 5)` em `:50`. Boilerplate `routes/auth.php:59` — `POST logout` sem throttle ✓.

---

#### C1 · Censo mecânico de throttle inline — **sobrevive**, com dois furos no regex proposto

Tentei derrubar por três vias e não consegui:

- **Já existe?** Não. `grep -rn "throttle" tests/` no boilerplate retorna **apenas** `AuthRouteThrottleTest.php` e uma menção em comentário (`tests/Feature/Routes/WriteRoutesAuthorizationTest.php:16`). `tests/Arch/ArchTest.php` (41 linhas, li inteiro) não toca em rotas. Pint/Rector são formatadores. A afirmação "uma rota nova com `throttle:20,1` passa em tudo" é verdadeira.
- **Escopo do teste atual.** `AuthRouteThrottleTest.php:37-47` tem exatamente 3 datasets (`impersonate start`, `verification verify`, `verification send`) e proíbe só as strings `throttle:10,1` / `throttle:6,1` nessas 3 URIs ✓.
- **Vacuidade.** Contei os throttles nomeados: `routes/auth.php:20,31,38,47,51` + `routes/web.php:40` = **6** ✓. E `grep -rn "throttle" vendor/laravel/horizon/routes/ vendor/opcodesio/log-viewer/routes/` retorna **zero** — nenhuma rota de pacote carrega throttle inline, então o censo passa verde hoje sem allowlist. Não-vacuo.

**Duas correções ao entregável, não ao candidato:** o regex proposto `/^throttle:\d+(,\d+)?$/` deixa passar duas formas que o Laravel aceita e que produzem exatamente o mal que se quer travar — (1) `throttle` **sem argumento** (`ThrottleRequests` cai em 60,1 por padrão) e (2) a forma de 3 argumentos `throttle:60,1,prefixo`. Use algo como `/^throttle(:\d+.*)?$/` — ou o inverso, mais robusto: falhe quando o entry começa com `throttle:` **e** o que vem depois dos dois-pontos não é nome de limiter registrado (`RateLimiter::limiter($nome) !== null`), que também pega `throttle:auth` digitado errado.

---

#### C2 · Lockout do `POST login` sem teste — **sobrevive intacto**

Cada fato foi conferido nos dois repositórios:

- spinmax `routes/auth.php:18` sem middleware ✓; `LoginRequest.php:50` com `tooManyAttempts(..., 5)` ✓.
- `grep -rn "Lockout\|RateLimiter\|429" tests/` no spinmax → **exatamente uma linha**: `tests/Feature/Store/ShippingQuoteEndpointTest.php:171` ✓. A varredura está certa.
- boilerplate `routes/auth.php:25` — `POST login` também sem middleware ✓. `LoginRequest.php:49-70` é byte-a-byte o mesmo `ensureIsNotRateLimited()` + `throttleKey()` ✓ (o `authenticate()` diverge — o boilerplate injeta `'is_active' => true` nas credenciais — mas o trecho citado é idêntico).
- `tests/Feature/Auth/AuthenticationTest.php` do boilerplate tem **4** testes (render, sucesso, senha errada, logout), nenhum de lockout ✓. O spinmax tem 6 (ganhou dois de `is_active`), também nenhum de lockout ✓.
- `AuthRouteThrottleTest.php:20-21` contém literalmente *"O login não entra aqui porque já tem limitação própria via LoginRequest (por email+ip)"* ✓ — declara a dependência sem testá-la.

**Viabilidade do teste proposto, checada:** `phpunit.xml:27` fixa `CACHE_STORE=array`, então o balde do `RateLimiter` é por teste e não vaza. `tooManyAttempts(key, 5)` é `attempts >= 5`, logo após 5 POSTs errados o **6º** é o bloqueado — o número no candidato está certo. E `throttleKey()` inclui o e-mail, que vem de factory única, então não colide com os testes vizinhos.

Nada a derrubar. É o candidato mais forte da célula.

---

#### C3 · Teste de 429 em rota pública de escrita — **metade morre por já existir**

Os fatos do spinmax batem (`web.php:27-29`, `:34-36`, `api.php:9-11`, e o teste em `ShippingQuoteEndpointTest.php:161-172` com o loop de 30 + `assertStatus(429)`). O que não se sustenta é o **entregável**:

1. **"Absorver a *forma* do teste do spinmax" é redundante — a forma já está no boilerplate.** `tests/Feature/Auth/AuthRouteThrottleTest.php:49-63` é o mesmo padrão (loop até o teto, requisição seguinte espera 429), e o próprio candidato o cita como "exatamente a forma certa". Não há nada a importar do spinmax: o boilerplate não aprendeu a forma com ele, já a tinha. Isso não é "absorção", é uma segunda observação da mesma forma.
2. **`.ai/rules/routes.md:9` já cobre metade da regra proposta** — "Toda rota com rate limit usa limiter nomeado […] nunca `throttle:N,M` inline". O que é genuinamente novo é só o predicado *"rota guest de escrita **precisa** de limiter"* e *"precisa de um teste que o 429 acontece"*.
3. **O censo automático o próprio candidato já retira**, e com razão: `routes/auth.php:19,25,30,37` são as 4 únicas rotas guest de escrita, três já cobertas.

**Sobra:** uma frase em `.ai/rules/tests.md` (que hoje tem 4 regras, nenhuma sobre rate limit). Entregável legítimo, mas é uma frase de doc — não um PR, e não uma absorção. Reclassifique de "(a) absorver" para "(b) regra", e corte a parte de "absorver a forma".

---

#### C4 · `throttle:` no lugar de `can:` — **sobrevive**, com um número errado

Tudo conferido e correto: spinmax `routes/web.php:86-88` com só `throttle:10,1` ✓, grupo `['auth','verified',EnsureUserIsActive]` abre em `:61` ✓, `can:manage_users` fecha em `:83` ✓ — a rota de impersonate está mesmo fora dele. Boilerplate `routes/web.php:39-41` com `['throttle:impersonate', 'can:impersonate_users']` ✓. `.ai/rules/routes.md:11-12` diz literalmente "Throttle não é autorização" ✓. `WriteRoutesAuthorizationTest.php:15-17` credita ctfinance @ b8c6d57 ✓, allowlist nos dois sentidos em `:134-162` ✓, regressão nomeada em `:167-174` ✓.

**Fato errado:** *"o censo varre 20+ rotas de escrita sob `auth`"*. Contei uma a uma na tabela de rotas do boilerplate: **18**, não 20+ — `routes/web.php` 12 (`DELETE users/impersonate`, `POST users`, `PUT users/{user}`, `DELETE users/{user}`, `PATCH users/{user}/toggle-active`, `POST …/permissions/grant`, `DELETE …/permissions/{permission}`, `POST …/impersonate`, `PUT /permissions/roles/{role}`, `POST …/assign-role`, `DELETE …/revoke-role`, `POST …/sync-permissions`), `routes/settings.php` 3 (`:14`, `:15`, `:18`), `routes/auth.php` 3 sob `auth` (`:50`, `:57`, `:59`). Não muda a conclusão — 18 continua sendo não-vacuo, e a `selfServiceWriteRoutes()` de 7 entradas prova que o censo está mordendo código real. Mas em rodada cujo mandato é conferir contagem, o número tinha que estar certo.

Conclusão mantida: **nada de código**, só o comentário de origem.

---

#### C5 · Webhook limitado por IP — **sobrevive como regra**, mas o conselho está incompleto e omite a peça que o boilerplate tem e o spinmax não

Fatos conferidos: `AppServiceProvider.php:124` com `Limit::perMinute(120)->by($request->ip())` ✓; `routes/web.php:56-58` ✓; `bootstrap/app.php:32` `validateCsrfTokens(except: ['webhooks/*'])` e `:41` `preventRequestsDuringMaintenance(except: ['webhooks/*'])` ✓; `MercadoPagoController.php:36-52` valida HMAC (`x-signature`, `x-request-id`, secret via `config('services.mercadopago.webhook_secret')`) e devolve **401 antes de qualquer escrita** em `:80` ✓; a rede de reconcile é `routes/console.php:41` (`store:reconcile-orders`, `everyTenMinutes()`) e `:52` (`store:reprocess-webhooks`, `everyFiveMinutes()`) ✓. Boilerplate sem `routes/api.php` (`ls routes/` → `auth.php console.php settings.php web.php`) e `bootstrap/app.php:19-23` com só `web`/`commands`/`health` ✓.

**Duas objeções:**

1. **O raciocínio "IP não é limitável pelo atacante" tem um pressuposto não declarado, e o spinmax não o satisfaz.** `->by($request->ip())` só isola o provedor se `$request->ip()` for o IP real. Atrás de LB/CDN sem `trustProxies`, todo tráfego colapsa no IP do proxy e o balde de 120/min vira **global** — que é exatamente o "desenho perigoso" que o candidato diz evitar. O boilerplate já resolve isso em `bootstrap/app.php:28-33` (`TRUSTED_PROXIES` → `$middleware->trustProxies()`); o `bootstrap/app.php` do spinmax **não tem nenhuma chamada a `trustProxies`**. Ou seja: a receita "sempre `->by(ip())`" é meio-conselho. A regra tem que ser *"`->by($request->ip())` **e** `trustProxies` configurado — sem o segundo, o `by(ip)` é decorativo"*.
2. **Custo do entregável.** `.ai/rules/routes.md` tem frontmatter `paths: ['routes/**']`, então a prosa sobre webhook é carregada em **toda** edição de rota, num boilerplate com zero webhooks e zero `routes/api.php`. Duas frases sobre uma superfície inexistente é o mesmo tipo de falso conforto que o guardrail 4 manda apontar, só que em doc em vez de teste. Se entrar, entra como **uma** frase, com o ponto do `trustProxies` embutido — não como seção.

Sobrevive, encolhido.

---

#### C6 · Enumeração no reset de senha — **cai, e é o candidato com mais fato errado da célula**

Quatro erros verificáveis, sendo dois que invertem a conclusão.

**(a) Evidência do spinmax é do boilerplate.** O candidato cita, como prova do spinmax, `back()->with('status', 'Se existir uma conta com esse e-mail, o link de redefinição será enviado.')`. Essa string **não existe no spinmax**. `clients/spinmax/app/app/Http/Controllers/Auth/PasswordResetLinkController.php:31` é:

```php
return back()->with('status', __('A reset link will be sent if the account exists.'));
```

— inglês, via `__()`. A frase em pt-BR (e o comentário de 3 linhas explicando por que não passa por `__()`) é do **boilerplate**, em `PasswordResetLinkController.php:31-34`. O ponto semântico ("resposta genérica idêntica nos dois") continua verdadeiro; a evidência citada foi copiada do repositório errado.

**(b) "Conta inexistente responde na hora" é falso — o framework já fecha o canal de tempo.** `vendor/laravel/framework/src/Illuminate/Auth/Passwords/PasswordBroker.php:88` embrulha o corpo inteiro de `sendResetLink()` em `$this->timebox->call(function () { … }, $this->timeboxDuration)`. O `timeboxDuration` vem de `PasswordBrokerManager.php:75` (`config('auth.timebox_duration', 200000)`) e o default do construtor é `200000` µs (`PasswordBroker.php:66`) = **200 ms de piso, igual para conta existente e inexistente**. O `INVALID_USER` não "responde na hora": é acolchoado. O canal residual só reabre se o SMTP síncrono estourar os 200 ms — muito mais estreito do que o candidato descreve, e não é um buraco do boilerplate, é comportamento do L13.

**(c) O "bombardeio de caixa postal alheia" é impossível — a premissa inteira é falsa.** `config/auth.php:98` do boilerplate: `'throttle' => 60`. E `PasswordBroker.php:94-95`:

```php
if ($this->tokens->recentlyCreatedToken($user)) {
    return static::RESET_THROTTLED;
}
```

Um endereço recebe **no máximo 1 e-mail de reset por 60 segundos**, independentemente de IP, de limiter e de quantas requisições cheguem. "6 e-mails de reset por minuto para um endereço-alvo escolhido pelo atacante" (spinmax) e o equivalente de 10 no boilerplate não acontecem: são 1. O problema que a chave composta resolveria não existe.

**(d) O fix proposto é uma regressão, e a afirmação sobre o teste existente está invertida.** Trocar a chave do limiter `auth` para `$request->ip() . '|' . Str::lower($request->input('email'))` **quebra `AuthRouteThrottleTest.php:49-63`**: aquele teste varia o e-mail a cada iteração (`ghost{$attempt}@example.com`), então sob a chave composta cada requisição cai num balde distinto com 1 hit, nunca chega a 429, e `expect($blocked->status())->toBe(429)` falha. O candidato escreve *"ele valida o teto por IP e continuaria verde"* — o oposto: o mecanismo inteiro daquele teste é o balde de IP compartilhado que a proposta remove. Pior, no eixo de segurança a mudança **afrouxa**: hoje um IP tem 10 requisições/min no total da família `auth` (`ThrottleRequests.php:134` — a chave é `md5($limiterName.$limit->key)`, então `register`/`forgot-password`/`reset-password` dividem o mesmo balde, como o candidato corretamente observa); com a chave composta o mesmo IP ganha 10 por endereço distinto, isto é, **spray ilimitado** — exatamente a enumeração que a seção abre dizendo querer conter. Se algo fosse desejável, seria um limite **adicional** (`RateLimiter::for()` aceita array de `Limit`), nunca substituto — e pelo item (c) não há o que proteger. Nota de lambuja: `->by(...$request->input('email'))` põe string arbitrária controlada pelo atacante no espaço de chaves do cache (Redis em produção, `.env.example:45`), uma chave nova por endereço por minuto.

**(e) `ShouldQueue` — custo > ganho.** Em teste, `phpunit.xml:32` fixa `QUEUE_CONNECTION=sync`, então o "teste de fila" proposto se reduz a `instanceof ShouldQueue` sobre classe nossa — asserção de reflexão, não de comportamento. Em produção (`QUEUE_CONNECTION=redis` + Horizon, `config/horizon.php` presente) enfileirar a notificação de reset significa que **a recuperação de acesso para de funcionar em silêncio quando o worker cai** — num fluxo cuja razão de existir é recuperar acesso. E o preço é um `App\Notifications\ResetPassword` próprio + override de `User::sendPasswordResetNotification()` + template de e-mail para manter, para fechar um canal que o timebox de 200 ms de (b) já cobre. Confirmei que nenhum dos dois repositórios tem `app/Notifications/` nem override — mas isso é o default do L13, não uma omissão.

**Nota adicional:** o teste sugerido ("mesmo e-mail, 7ª tentativa → 429") usa o teto do spinmax (6/min); no boilerplate `throttle:auth` é 10/min (`AppServiceProvider.php:95-98` ✓), logo seria a 11ª. E, sob o código atual, e-mail fixo e e-mail variável dão **resultado idêntico** (a chave é só o IP) — o teste "novo" seria uma cópia de `AuthRouteThrottleTest.php:49-63`. Ele só passa a ser distinto depois da mudança de (d), que quebra o original.

**O que sobra do C6:** só a metade defensiva — *"resposta genérica está correta nos dois; não gaste PR"* — mais um registro de que `config/auth.php:98` (`'throttle' => 60`) e o `Timebox` do broker são as peças que já sustentam isso, para o próximo caçador não redescobrir o mesmo falso buraco. **Derrubar as duas ações propostas.**



#### Veredito — ### RISCO DE ABSORÇÃO — Rate limiting e superfície de abuso

**Nota transversal (afeta C1, C5 e C6).** Todos os limiters do boilerplate chaveiam por `$request->ip()` (`/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/app/Providers/AppServiceProvider.php:95-108`), e `ip()` só é confiável se o TrustProxies estiver certo. Verifiquei `bootstrap/app.php:28-33`: o boilerplate só chama `trustProxies()` quando `TRUSTED_PROXIES` está setado, e `.env.example:9` traz a chave **comentada** (`# TRUSTED_PROXIES=`). Consequências reais dos dois extremos: sem a env atrás de LB, todo tráfego colapsa no IP do balanceador e todo limiter `by(ip)` vira limiter **global** — exatamente o desenho que o C5 chama de perigoso; com `TRUSTED_PROXIES=*` sem LB na frente, o atacante escolhe o `X-Forwarded-For` e ganha um balde novo por request, evadindo o limite por completo. Qualquer regra de `.ai/rules` que diga "throttle de webhook é sempre `by(ip)`" precisa carregar essa condição no mesmo parágrafo, senão a regra promete uma garantia que a configuração pode não estar entregando.

**Axis 1 respondido de uma vez:** nenhum dos seis candidatos toca schema, migration ou formato de dado persistido. Não há trap de migração de dados em lote nenhum. O único que mexe em algo com estado é o C6b (fila), e mesmo lá `password_reset_tokens` fica idêntico. Abaixo só trato o axis 1 onde há nuance.

---

#### C1 · Censo mecânico de `throttle:` inline — **risco: médio**

*Justificativa: o guard-rail proposto tem duas evasões verificadas e uma dependência de carregamento que dá fatal; um censo que passa verde numa rota não-limitada é pior que nenhum censo, porque vira licença.*

**Muda comportamento?** Não — é teste puro, nada em runtime. Modo de falha da absorção: **fail-open silencioso**, e é o pior tipo, porque o teste verde documenta uma garantia inexistente.

**Risco da própria absorção — duas evasões que confirmei no vendor:**

1. O regex proposto `/^throttle:\d+(,\d+)?$/` não cobre a forma fluente. `vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php:67-70`:
   ```php
   public static function with($maxAttempts = 60, $decayMinutes = 1, $prefix = '')
   {
       return static::class.':'.implode(',', func_get_args());
   }
   ```
   `->middleware(ThrottleRequests::with(20))` produz a string `Illuminate\Routing\Middleware\ThrottleRequests:20` — passa pelo regex. Existe também `ThrottleRequestsWithRedis` no mesmo diretório, com a mesma herança. É literalmente a lição que o `WriteRoutesAuthorizationTest.php:117-132` já aprendeu com `can:` vs. `#[Authorize]` e resolveu aceitando as duas formas; o censo de throttle precisa da mesma dobra.
2. O regex exige `\d+`, então o alias nu `->middleware('throttle')` (que o framework resolve para 60,1) também escapa.

**Terceira armadilha, de mecânica de teste:** o candidato sugere reusar `routeIsOwnedByTheApplication()`, e essa função está declarada em escopo global dentro de `tests/Feature/Routes/WriteRoutesAuthorizationTest.php:88-97`. Chamá-la de `AuthRouteThrottleTest.php` cria dependência de ordem de inclusão dos arquivos de teste — se o arquivo de throttle rodar primeiro, é `Call to undefined function`. O lugar certo é `tests/Pest.php`, que já é o domicílio dos helpers globais do projeto (`userWithRole()`, `selectableRoles()`, `guestUser()`).

**Sobre o filtro de vendor:** verifiquei que hoje ele não é estritamente necessário — `find vendor -path '*/routes/*.php' | xargs grep -l throttle` volta **vazio**, e `config/horizon.php:86` (`'middleware' => ['web']`) e `config/log-viewer.php:74-93` não injetam throttle. Mas os dois pacotes estão no `composer.json` com constraint aberta (`^5.45`, `^3.24`); sem o filtro, um `composer update` que adicione throttle inline num pacote quebra o CI num arquivo que ninguém pode editar.

**Tamanho da fatia:** 2 arquivos (`tests/Feature/Auth/AuthRouteThrottleTest.php` + `tests/Pest.php` para mover o helper). Dá para fatiar menor ainda: mover o helper primeiro, num commit isolado que não muda comportamento de teste nenhum, e o censo depois.

---

#### C2 · Teste de lockout do `POST login` — **risco: baixo**

*Justificativa: acréscimo de teste sobre código que já existe e já funciona, com isolamento de estado verificado.*

**Muda comportamento?** Não. Nenhuma linha de produção. `LoginRequest.php:49-65` fica intacto.

**A pergunta que eu esperava derrubar o candidato — estado de rate limiter vazando entre testes — não derruba:** `phpunit.xml` define `<env name="CACHE_STORE" value="array"/>`, então o balde do `RateLimiter` morre junto com a instância da aplicação a cada teste. O novo teste não contamina os outros nem depende de ordem. (Se algum derivado sobrescrever `CACHE_STORE` para `file`/`redis` no `phpunit.xml`, aí sim o teste vira flaky — vale uma linha no comentário do teste avisando disso, porque é a única forma de ele quebrar.)

**Detalhe de forma:** a mensagem esperada vem de `lang/pt_BR/auth.php:8` (`'throttle' => 'Tentativas de login em excesso. Tente novamente em :seconds segundos.'`). Asserte pela **presença do erro em `email`** e por `Event::assertDispatched(Lockout::class)`, não pela string traduzida — senão o teste vira teste de copy e quebra na próxima revisão de texto.

**Tamanho da fatia:** 1 arquivo, ~15 linhas. Não dá para fatiar menor.

**Nota de higiene que a fatia vai encostar:** `tests/Feature/Auth/AuthenticationTest.php:5` declara `uses(\Illuminate\Foundation\Testing\RefreshDatabase::class)` e usa `test()`, ambos contra `.ai/rules/tests.md:9,12` (que mandam `it()` e proíbem o `uses` por arquivo, porque `tests/Pest.php:23-25` já aplica em `Feature`). Não corrija isso na mesma fatia — é ruído de diff sobre um arquivo herdado do starter kit; ou é fatia própria, ou fica.

---

#### C3 · Regra "rota guest de escrita precisa de limiter + teste do 429" — **risco: baixo**

*Justificativa: entrega só texto de regra, e o próprio candidato já reconhece que o censo automático seria quase vácuo hoje.*

**Muda comportamento?** Não. Modo de falha: regra que não morde em nada hoje envelhece e vira decoração.

**Risco real da absorção, e é de escopo:** a regra como enunciada ("rota alcançável sem `auth` com POST/PUT/PATCH/DELETE") pega `POST login` (`routes/auth.php:24`), que **deliberadamente** não tem throttle de rota — a limitação mora no `LoginRequest`. Se a regra entrar sem essa exceção escrita, a primeira coisa que um agente vai fazer é somar `throttle:auth` ao login. Isso não é neutro: o limiter `auth` é chaveado por `md5('auth'.$ip)` — confirmei em `ThrottleRequests.php:119-140`, `'key' => self::$shouldHashKeys ? md5($limiterName.$limit->key) : ...` — ou seja, um **balde único por IP compartilhado** entre `register`, `forgot-password` e `reset-password`. Somar o login a esse balde faz com que 10 tentativas de login queimem a cota de recuperação de senha do mesmo IP (e vice-versa), que é justamente o cenário de escritório/NAT. A exceção do login precisa estar no texto da regra, não só no comentário do teste.

**Tamanho da fatia:** 1 arquivo (`.ai/rules/tests.md`), talvez 2 com `.ai/rules/routes.md`. Mínimo possível.

**Processo:** o repo tem a skill `infer-conventions`, que registra regra via `record-rule` do Boost. Editar `.ai/rules/*.md` na mão funciona (o formato é só front-matter `paths:` + markdown, ver `.ai/rules/routes.md:1-4`), mas se a regra for adicionada à mão é preciso lembrar de conferir `.ai/rules/index.md` — `tests/**` já está mapeado na linha 25, então não há entrada nova a criar.

---

#### C4 · Atualizar o comentário de origem no censo de autorização — **risco: baixo**

*Justificativa: alteração de comentário, zero superfície executável; o único risco é o de não fazer nada.*

Confirmei o alvo: `tests/Feature/Routes/WriteRoutesAuthorizationTest.php:15-17` credita a origem só ao ctfinance @ b8c6d57, e a regressão nomeada em `:164-174` repete o crédito. Confirmei também a segunda instância no spinmax: `routes/web.php:85-88` tem `->middleware('throttle:10,1')` e nada mais, dentro do grupo `auth` que abre em `:61`, com o `can:manage_users` fechando em `:83` — a rota de impersonate cai fora dele. O boilerplate está travado em `routes/web.php:39-41` (`['throttle:impersonate', 'can:impersonate_users']`).

**Único risco:** nenhum de código. Vale dizer o que **não** fazer junto: não transformar isso em oportunidade de mexer no censo. Ele já cobre o caso, e mexer num teste de segurança verde para melhorar um comentário é como o guard-rail se degrada.

**Tamanho da fatia:** 1 arquivo, 2 linhas de comentário. Candidato natural para viajar de carona com o C1, já que é o mesmo diretório de testes e o mesmo tema.

---

#### C5 · Receita documentada de webhook limitado por IP — **risco: baixo (mas a regra está incompleta como escrita)**

*Justificativa: não entra código nenhum, e a superfície no boilerplate é zero — confirmei que não há `routes/api.php` (só `auth.php`, `console.php`, `settings.php`, `web.php`) e que `bootstrap/app.php:19-23` registra apenas `web`, `commands` e `health`.*

**A resposta à pergunta direta do candidato está certa e eu não consegui derrubá-la:** com `by($request->ip())`, o tráfego do atacante enche o balde do IP dele; o balde do provedor fica intacto. O desenho perigoso é o oposto. Mas a regra precisa de duas cláusulas que hoje não estão no texto proposto:

1. **A cláusula do TrustProxies** (ver nota transversal). Sem `TRUSTED_PROXIES` correto atrás de LB, `by(ip)` degenera **exatamente** no limiter global que a regra proíbe. A regra que afirma "por IP é seguro" sem essa condição é falsa em metade das implantações.
2. **A cláusula do `api:` routing.** Se um derivado adicionar `api: __DIR__.'/../routes/api.php'` ao `withRouting()`, o framework anexa `throttle:api` automaticamente (`vendor/laravel/framework/src/Illuminate/Foundation/Configuration/Middleware.php:497`), e o limiter `api` **não existe** em `configRateLimiting()`. O modo de falha aqui é bom e vale registrar como tal: `ThrottleRequests::resolveMaxAttempts()` lança `MissingRateLimiterException` — 500 alto e imediato em toda request, **fail-closed e barulhento**, não 429 silencioso nem passagem livre. Isso é um argumento a favor de limiter nomeado que o `.ai/rules/providers.md:8-9` ainda não usa: errar o nome do limiter é impossível de não notar.

**Risco de importar a forma do spinmax junto:** o pacote do spinmax inclui `validateCsrfTokens(except: ['webhooks/*'])` e `preventRequestsDuringMaintenance(except: ['webhooks/*'])` (`bootstrap/app.php:32,41`). São exceções por **wildcard de prefixo** — qualquer rota futura sob `webhooks/*` herda "sem CSRF" sem que ninguém decida isso. Se a receita for documentada, documente a exceção como caminho literal por rota, não glob. E a dependência de reconcile é real e verificável: `routes/console.php:41,52` (`store:reconcile-orders` a cada 10 min, `store:reprocess-webhooks` a cada 5 min, ambos `withoutOverlapping()`). Sem essa rede, "120/min por IP" é uma decisão de perder a notificação 121.

**Tamanho da fatia:** 1-2 arquivos de texto. Zero código, zero teste — e é importante que fique assim: um teste sobre webhook aqui passaria vazio, e teste vazio no repositório é o mesmo fail-open do C1.

---

#### C6 · Chave composta no reset + notificação em fila — **risco: alto na forma proposta, baixo na forma corrigida. Precisa virar duas fatias.**

Este é o único candidato onde tentei derrubar e **encontrei um fail-open concreto na proposta como escrita**.

##### C6a — chave composta (ip + email)

A proposta é `Limit::perMinute(6)->by($request->ip() . '|' . Str::lower((string) $request->input('email')))`. Aplicada como **substituição** da chave do limiter `auth`, ela abre um buraco, e o buraco é maior do que o furo que fecha:

- O limiter `auth` é compartilhado por **três** rotas: `routes/auth.php:20` (`register`), `:31` (`forgot-password`) e `:38` (`reset-password`) — e o balde é único por IP (`md5('auth'.$ip)`, confirmado em `ThrottleRequests.php:135`).
- Trocar a chave para incluir o e-mail dá ao atacante um balde novo **por e-mail escolhido por ele**. Em `POST register`, isso significa cadastro em massa sem teto nenhum a partir de um único IP: hoje `Limit::perMinute(10)->by($request->ip())` (`AppServiceProvider.php:95-98`) limita a 10/min; depois da troca, ilimitado. Fail-open silencioso, e numa rota que **grava no banco**.

**Forma correta, e ela é menor que a proposta:** manter a chave por IP e **acrescentar um segundo `Limit`**, em vez de trocar. Confirmei que o framework suporta: `ThrottleRequests.php:130` faz `Collection::wrap($limiterResponse)->map(...)`, ou seja, o closure do limiter nomeado pode devolver um array de `Limit` e todos são avaliados.

```php
RateLimiter::for('auth', static fn(Request $request): array => [
    Limit::perMinute(10)->by($request->ip()),                       // teto por IP, preservado
    Limit::perMinute(6)->by($request->ip().'|'.Str::lower((string) $request->input('email'))),
]);
```

Isso tem três propriedades boas: (1) o teto por IP não se mexe, então nada que hoje funciona muda; (2) `register` e `reset-password` também ganham a dimensão de e-mail sem prejuízo — um e-mail só se registra uma vez, um usuário legítimo só reseta uma vez; (3) **não muda o nome do middleware**, o que evita a trap de migração abaixo.

**Trap de migração se alguém preferir um limiter novo (ex.: `throttle:password-email`):** `tests/Feature/Auth/AuthRouteThrottleTest.php:28-32` tem `['POST', 'forgot-password']` num dataset que asserta `toContain('throttle:auth')`. Renomear o middleware quebra esse teste — o que é o comportamento desejado do contrato, mas precisa entrar no mesmo commit, não na revisão seguinte.

**O teste existente sobrevive à mudança, e verifiquei por quê:** `AuthRouteThrottleTest.php:49-63` varia o e-mail a cada iteração (`ghost{$attempt}@example.com`), então cada request gasta 1 de 6 no balde por e-mail e 1 de 10 no balde por IP — o 11º ainda estoura pelo IP. O caso novo (e-mail fixo, 7ª tentativa → 429) é ortogonal e não conflita.

**Sobre `(string) $request->input('email')`:** o limiter roda no middleware, **antes** da validação, então o input é arbitrário. Testei o raciocínio contra o vendor: `email[]=a&email[]=b` faz o cast de array para string emitir warning e render `"Array"` — não é fatal, e o balde resultante é mais restritivo, não menos. A chave também não cresce sem limite porque vira `md5()` (`ThrottleRequests.php:135`). Ainda assim, prefira um guard explícito (`is_string(...) ? ... : 'invalid'`) a depender de um warning silencioso de conversão.

**Risco C6a na forma corrigida: baixo.** 2 arquivos (`app/Providers/AppServiceProvider.php` + teste). Modo de falha se a absorção estiver errada: mais restritivo (usuário legítimo tomando 429 cedo demais), não mais permissivo — desde que o `Limit` por IP permaneça.

##### C6b — `ShouldQueue` na notificação de reset

**Risco: médio.** É a fatia mais cara das seis e a única com modo de falha silencioso em produção.

- Confirmei o ponto de partida: `app/Notifications/` **não existe** no boilerplate, `app/Models/User.php` só usa `Notifiable` (linha 23) e não sobrescreve `sendPasswordResetNotification`. Então a fatia cria um diretório novo, uma classe nova e um override no `User`.
- **Quebra três testes existentes.** `tests/Feature/Auth/PasswordResetTest.php:22,32,48` fazem `Notification::assertSentTo($user, ResetPassword::class)` com o `Illuminate\Auth\Notifications\ResetPassword` importado na linha 4. O `NotificationFake` indexa por nome de classe exato — uma subclasse própria **não** casa. Os três testes precisam mudar de classe no mesmo commit.
- **Modo de falha em produção: fail-open silencioso.** `.env.example:45` traz `QUEUE_CONNECTION=redis` e o repo tem `laravel/horizon` no `composer.json`. Numa implantação de derivado onde o worker não está de pé, o e-mail de recuperação de senha simplesmente **não chega**, sem erro em lugar nenhum — hoje ele falha alto, dentro do request. É uma troca deliberada, não um upgrade puro, e precisa estar escrita.
- **O teste proposto não prova o que promete.** `phpunit.xml` define `QUEUE_CONNECTION=sync`, e `Notification::fake()` intercepta *antes* do enfileiramento — `Notification::assertSentTo` continua verde tanto com quanto sem `ShouldQueue`. Para provar de fato, asserte a interface dentro do callback (`expect($notification)->toBeInstanceOf(ShouldQueue::class)`) ou faça disso um teste de Arch em `tests/Arch/ArchTest.php`.
- **Correção medida ao candidato:** enfileirar **não fecha** o canal de tempo, apenas o estreita. `Password::sendResetLink()` continua fazendo lookup no banco e `INSERT` em `password_reset_tokens` só quando a conta existe; some o round-trip SMTP, permanece a diferença de uma query mais uma escrita. É melhora real e vale — mas descrever como "fecha o canal" é forte demais para o que a mudança entrega.

**Tamanho da fatia:** ~5 arquivos (`app/Notifications/*` novo, `app/Models/User.php`, `tests/Feature/Auth/PasswordResetTest.php`, teste de fila, possivelmente `lang/pt_BR/passwords.php`). **Fatie:** C6a (chave composta, 2 arquivos, risco baixo, ganho de segurança imediato) primeiro e sozinha; C6b depois, ou nunca — o ganho dela é o canal de tempo residual, que é o de menor valor da rodada.



#### Veredito — ### ATUALIDADE — Rate limiting e superfície de abuso

Ambiente verificado: `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate` → `php artisan --version` = **Laravel Framework 13.24.0**, `composer.json` = `laravel/framework ^13.0`, `inertiajs/inertia-laravel ^3.0`, `pestphp/pest ^5.1`, `php ^8.4`. Todas as citações de `vendor/` abaixo são desse checkout.

---

#### C1 · Censo mecânico de throttle inline — `[atual]`, mas o regex proposto está errado para o L13

**Tentei derrubar por três caminhos e nenhum pegou:**

- Não existe `RateLimiter::fake()` nem qualquer introspecção nativa de "quais rotas usam throttle inline" — grep em `vendor/laravel/framework/src/Illuminate/Cache/RateLimiter.php` e `.../Support/Facades/RateLimiter.php` não retorna nada com `fake`. A superfície pública é `for()` (`:49`), `limiter()` (`:64`), `attempt()` (`:106`), `tooManyAttempts()` (`:128`), `hit/increment/decrement`, `attempts`, `remaining`, `retriesLeft`, `clear`, `availableIn`.
- `Route::getRoutes()->getRoutes()` + `gatherMiddleware()` continua sendo a API nativa e já funciona — `tests/Feature/Auth/AuthRouteThrottleTest.php:23-27` faz exatamente isso hoje.
- Arch test do Pest 5 não alcança: `routes/*.php` não são classes.

**Veredito: `[atual]`.** O guard-rail sobrevive intacto — o boilerplate segue estritamente superior ao spinmax nesse eixo (`app/Providers/AppServiceProvider.php:92-109`, três limiters nomeados; `routes/auth.php:20,31,38,47,51` + `routes/web.php:40`, seis rotas, zero inline).

**Correção de atualidade que o candidato precisa absorver:** o regex proposto — `/^throttle:\d+(,\d+)?$/` — **cobre só uma das quatro formas inline que o L13 aceita**. `vendor/laravel/framework/src/Illuminate/Routing/Middleware/ThrottleRequests.php:85`:

```php
public function handle($request, Closure $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = '')
```

e `resolveMaxAttempts()` em `:194-214`. As formas válidas são:

| forma | exemplo | o regex proposto pega? |
|---|---|---|
| numérica | `throttle:20,1` | sim |
| com prefixo (3º arg) | `throttle:20,1,checkout` | **não** |
| guest\|auth | `throttle:10\|60,1` | **não** |
| atributo do model | `throttle:rate_limit,1` | **não** |

O discriminador correto não é regex — é a **própria condição de dispatch do framework** (`ThrottleRequests.php:87-90`): um `throttle:X` é limiter nomeado se e somente se `X` não contém vírgula **e** `RateLimiter::limiter(X) !== null`. Escreva o censo assim:

```php
// para cada middleware string que começa com 'throttle:'
$param = Str::after($middleware, 'throttle:');
expect(str_contains($param, ','))->toBeFalse()
    ->and(RateLimiter::limiter($param))->not->toBeNull();
```

Isso fecha as quatro formas com uma regra só e usa `RateLimiter::limiter()` (`RateLimiter.php:64`), que o `AuthRouteThrottleTest.php:9,13` já usa. Nota de convenção: `.ai/rules/tests.md:9` manda `it()` — o arquivo atual usa `test()` em `:8,:22,:49`; teste novo entra como `it()`.

---

#### C2 · Teste de lockout do `POST login` — `[atual]`, com uma alternativa nativa que muda comportamento

**O `ensureIsNotRateLimited()` não é padrão obsoleto.** A doc do L13 (`authentication.md`, seção *Login Throttling*) descreve exatamente esse comportamento como o que os starter kits aplicam: *"the user will not be able to login for one minute... throttling is unique to the user's username / email address and their IP address"* — que é `app/Http/Requests/Auth/LoginRequest.php:69` (`Str::lower(email) . '|' . ip()`) ao pé da letra. Não há classe nativa que substitua. **`[atual]`** — o teste faltante continua sendo o entregável.

**Existe, porém, uma API nativa que o candidato não considerou** e que é documentada no L13 para este caso exato (`routing.md`, *Multiple Rate Limits*):

```php
RateLimiter::for('login', fn (Request $request) => [
    Limit::perMinute(500),
    Limit::perMinute(3)->by($request->input('email')),
]);
```

`Limit` aceita array desde que os `by()` sejam distintos, e `ThrottleRequests::handleRequestUsingNamedLimiter` (`:108+`) itera a lista. Isso permitiria `->middleware('throttle:login')` na rota, eliminando a exclusão por escrito em `AuthRouteThrottleTest.php:19-21` e fazendo o login cair automaticamente no censo do C1.

**Mas não recomendo trocar, e é preciso dizer por quê:** o limiter nomeado responde **429 bruto**, enquanto o `LoginRequest` devolve `ValidationException` em `email` com `auth.throttle` (`LoginRequest.php:59-64`) — que o Inertia renderiza como erro de campo no formulário — e dispara `Illuminate\Auth\Events\Lockout` (`:55`). São dois contratos de UX diferentes. Verdito prático: **mantenha o `LoginRequest` e adicione o teste**; se algum dia quiser o `throttle:login`, saiba que ele é nativo e disponível, mas que o preço é a mensagem no campo e o evento `Lockout`.

Modernização da assertion: use `assertTooManyRequests()` (`vendor/laravel/framework/src/Illuminate/Testing/Concerns/AssertsStatusCodes.php:239`) em vez de `assertStatus(429)` / `expect(...->status())->toBe(429)`.

---

#### C3 · Forma do teste "loop até o limite + 429" — `[absorver-modernizado]` (assertion), regra `[atual]`

A **forma** (N requests + 1 que estoura) não tem substituto nativo: não há `RateLimiter::fake()`, e limpar o balde por fora é inviável porque a chave do limiter nomeado é hasheada (`ThrottleRequests::resolveRequestSignature` + `cleanRateLimiterKey`, `RateLimiter.php:285`) — `RateLimiter::clear()` (`:257`) exigiria reconstruir a chave à mão. O loop é a forma honesta. **Regra `.ai/rules/tests.md`: `[atual]`, absorva.**

Duas modernizações concretas sobre o que o candidato escreveu:

1. `assertTooManyRequests()` (`AssertsStatusCodes.php:239`) substitui o `assertStatus(429)` copiado do spinmax. Vale também para `AuthRouteThrottleTest.php:62`, que hoje usa `expect($blocked->status())->toBe(429)`.
2. **`Limit::after()` é nova e muda o desenho recomendado para rota pública de escrita.** `vendor/laravel/framework/src/Illuminate/Cache/RateLimiting/Limit.php:145` + `ThrottleRequests.php:163-171` — callback que decide, **olhando a resposta**, se o request conta para o balde. A doc do L13 (`routing.md`, *Response-Based Rate Limiting*) apresenta isso explicitamente como defesa anti-enumeração e como forma de não gastar o teto do usuário em erro de validação. Para o caso do C3 (checkout que cria linha e chama gateway), o desenho atual é `->after(fn (Response $r) => $r->isSuccessful())` — só a escrita bem-sucedida consome. Registre isso na regra: um limiter novo de rota pública de escrita **começa com a pergunta "o que deve contar?"**, não só "quantos por minuto".

Confirmo a leitura do candidato sobre superfície: `routes/auth.php` tem só 4 rotas guest de escrita (`:19,25,30,37`) e `bootstrap/app.php:19-23` não registra `api:` — censo automático seria quase vácuo hoje. Regra sim, censo não.

---

#### C4 · `throttle:` no lugar de `can:` — `[atual]`, nada mudou no L13

Verifiquei se o L13 trouxe algo que tornasse o censo redundante. Não trouxe, e o censo **já está atualizado** para a única novidade relevante: o cabeçalho de `tests/Feature/Routes/WriteRoutesAuthorizationTest.php:19-22` documenta que o L13 aceita as duas formas (`can:` e o atributo `#[Authorize]`, que vira `Illuminate\Auth\Middleware\Authorize:<ability>` e não `can:`) e o teste importa `Illuminate\Auth\Middleware\Authorize as AuthorizeMiddleware` (`:6`) para cobrir a segunda. `.ai/rules/routes.md:11-12` diz o mesmo.

**`[atual]`.** Nada de código, como o candidato já concluiu — e nada de atualidade a corrigir. A mudança de comentário de origem (creditar ctfinance @ b8c6d57 **e** spinmax @ e4ec01e em `:15-17`) é a ação inteira.

---

#### C5 · Webhook limitado por IP — `[absorver-modernizado]`: a regra vale, escreva-a com a API de hoje

Nenhum recurso nativo do L13 substitui a regra. Confirmado que a superfície não existe: `bootstrap/app.php:19-23` tem só `web`, `commands`, `health`, e o `withMiddleware` (`:24-45`) **não registra nenhuma exceção de CSRF** — não há `validateCsrfTokens(except:)` no boilerplate. `[atual]` no mérito.

Três atualizações de API para a receita documentada, todas verificadas:

1. **`Limit::after()`** (`Limit.php:145`) — para webhook é o ajuste mais útil que existe hoje e não existia quando o padrão do spinmax foi escrito: `->after(fn (Response $r) => $r->getStatusCode() >= 400)` faz o balde contar **só as entregas rejeitadas** (assinatura HMAC inválida, payload malformado). O provedor legítimo, que sempre assina certo, nunca enche o próprio balde — o que dissolve boa parte da preocupação com "perder silenciosamente a notificação nº 121". A rede de reconcile continua sendo obrigatória, mas deixa de ser o único anteparo.
2. **`Limit::perMinutes($decayMinutes, $maxAttempts)`** (`Limit.php:87`) — janela arbitrária sem aritmética manual, quando 120/min não for o formato certo.
3. **`->response(callable)`** (`Limit.php:158`, consumido em `ThrottleRequests.php:244-255`) — o 429 de um webhook precisa sair no formato que o provedor entende como "reenvie", não como página de erro. Vale citar na receita.

Sobre ADR 0005 (sem API/Sanctum): registre na regra que **um webhook não exige `routes/api.php`** — ele pode viver em `routes/web.php` com `validateCsrfTokens(except:)` em `bootstrap/app.php`, exatamente como o spinmax faz. A receita não conflita com o ADR.

---

#### C6 · Enumeração no reset de senha — **o achado mais afetado pela lente. Duas das três recomendações caem.**

**(a) "6 e-mails de reset por minuto para um endereço-alvo" → `[rejeitado-obsoleto]`. O framework já limita a 1 por 60s, por e-mail.**

`config/auth.php:93-100` do boilerplate:
```php
'users' => [ 'provider' => 'users', 'table' => ..., 'expire' => 60, 'throttle' => 60 ],
```

`vendor/laravel/framework/src/Illuminate/Auth/Passwords/PasswordBroker.php:94-96`:
```php
if ($this->tokens->recentlyCreatedToken($user)) {
    return static::RESET_THROTTLED;
}
```

e `DatabaseTokenRepository.php:110-134` — `recentlyCreatedToken()` consulta `password_reset_tokens` **`->where('email', $user->getEmailForPasswordReset())`** e compara `created_at + throttle` com agora. Ou seja: o balde por e-mail **já existe, é nativo, roda antes de `sendPasswordResetNotification()` (`:107`) e está configurado a 60s no boilerplate**. Um atacante mirando `vitima@empresa.com` consegue **1 e-mail por minuto**, não 6. A proposta `Limit::perMinute(6)->by(ip|email)` seria **mais permissiva** do que o que já está lá — absorvê-la como "correção de segurança" seria um retrocesso documentado como avanço.

O que resta legitimamente da ideia é outro argumento, mais fraco: chave composta impede que um atacante drene o balde compartilhado `throttle:auth` (10/min por IP, `AppServiceProvider.php:95-98`) e negue `register`/`reset-password` a quem compartilha NAT com ele. Isso é **disponibilidade**, não caixa postal. Se for escrever, escreva com essa justificativa e como array de limits (`routing.md`, *Multiple Rate Limits*), não substituindo o teto por IP.

**(b) "vazamento por tempo: conta existente custa um round-trip SMTP a mais" → `[rejeitado-obsoleto]` em ~200ms; `[absorver-modernizado]` só na cauda.**

`PasswordBroker.php:82-113` — o método **inteiro**, incluindo `getUser()`, `recentlyCreatedToken()` e `$user->sendPasswordResetNotification($token)`, roda dentro de `$this->timebox->call($closure, $this->timeboxDuration)`, com `$timeboxDuration = 200000` microssegundos declarado no construtor (`:66`). `Illuminate\Support\Timebox::call()` (`Timebox.php:27-50`) calcula o resto e dorme via `Sleep::usleep()`. **Conta inexistente NÃO "responde na hora"** — ela é acolchoada até 200ms, igualando-se à conta existente. `Password::reset()` recebe o mesmo tratamento (`:146`).

O resíduo é real mas estreito: `Timebox` só estabelece **piso**, não teto (`:39-43`, `if (! $earlyReturn && $remainder > 0)`). Se o envio SMTP síncrono passar de 200ms — o que é comum contra SMTP externo — a diferença reaparece na cauda. **É aí, e só aí, que o `ShouldQueue` fecha o canal.**

**(c) `ResetPassword` com `ShouldQueue` → `[atual]`, absorver — mas com a razão corrigida.**

Verificado: `vendor/laravel/framework/src/Illuminate/Auth/Notifications/ResetPassword.php:9` — `class ResetPassword extends Notification`, **sem `ShouldQueue`** no L13. Idem `VerifyEmail.php:12`. Não há config global de "enfileirar todas as notifications". O hook nativo e documentado (`passwords.md`, *Reset Email Customization*) é sobrescrever `sendPasswordResetNotification($token)` no `App\Models\User` — verificado que o model do boilerplate **não** sobrescreve nenhum dos dois, e `app/Notifications/` não existe. `config/queue.php:16` já tem default `database` e `.env.example:45` `QUEUE_CONNECTION=redis`, com Horizon instalado (`laravel/horizon ^5.45`) — a fila está pronta.

**Absorva, mas venda pelo motivo certo:** tirar o SMTP do caminho do request (latência, resiliência a MTA fora do ar, e fechar a cauda do timing acima de 200ms). Não venda como "o canal de tempo está aberto" — não está.

**(d) Correção ao teste proposto — como está escrito, ele falha.** O candidato pede "mesmo e-mail, 7ª tentativa → 429". No boilerplate `throttle:auth` é `Limit::perMinute(10)` (`AppServiceProvider.php:95-98`), não 6 — o 429 vem na **11ª**, não na 7ª. Pior: com e-mail fixo, as tentativas 2–10 batem em `RESET_THROTTLED` e o controller **descarta o status** (`app/Http/Controllers/Auth/PasswordResetLinkController.php:27-29` ignora o retorno de `sendResetLink`), então a resposta é idêntica — o teste mediria o teto por IP de novo, exatamente o que `AuthRouteThrottleTest.php:49-63` já mede.

O teste que realmente vale, e que exercita o mecanismo nativo recém-descoberto:

```php
it('sends at most one reset link per email within the broker throttle window', function () {
    Notification::fake();
    Sleep::fake();                       // Sleep.php:319 — mata o pad de 200ms/request
    $user = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        $this->post('/forgot-password', ['email' => $user->email]);
    }

    Notification::assertSentToTimes($user, ResetPassword::class, 1);
});
```

Isso trava `config/auth.php:98` (`'throttle' => 60`) contra alguém zerar o valor, e continua verde independentemente do teto por IP.

**(e) Bônus de atualidade para o eixo enumeração:** `Limit::after()` (`Limit.php:145`) é apresentado pela doc do L13 (`routing.md`, *Response-Based Rate Limiting*) literalmente como ferramenta anti-enumeração — *"Only count 404 responses toward the rate limit to prevent enumeration..."*. Não há uso hoje no boilerplate. É a API certa para `throttle:auth` deixar de gastar o teto de um usuário legítimo que errou o formato do e-mail (422) enquanto continua contando os POSTs que de fato disparam trabalho.

**(f) Observação de custo, verificada:** `AuthRouteThrottleTest.php:49-63` faz 11 POSTs em `/forgot-password` e cada um paga o timebox de 200ms via `Sleep::usleep` → **~2,2s de sleep real** nesse único teste hoje. `Sleep::fake()` (`Sleep.php:319`, curto-circuita antes de dormir e só registra na sequência) elimina isso. Vale aplicar no teste existente junto com qualquer teste novo desta família.

---

**Resumo dos vereditos:** C1 `[atual]` (com correção do discriminador — regex não serve no L13) · C2 `[atual]` (alternativa nativa `throttle:login` existe, mas troca UX e evento) · C3 regra `[atual]`, assertion `[absorver-modernizado]` (`assertTooManyRequests`, `Limit::after`) · C4 `[atual]` · C5 `[absorver-modernizado]` (`Limit::after`/`perMinutes`/`response`; webhook não precisa de `routes/api.php`) · C6 **parcialmente `[rejeitado-obsoleto]`** — o throttle por e-mail e o timebox já são nativos e o teste proposto está numericamente errado; sobra `ShouldQueue` como `[atual]`.



### Frente: LGPD/PII, uploads, sessão e queries

#### Candidatos levantados

All verified. Here are the findings.

### LGPD/PII, uploads, sessão e queries

Varri as duas bases inteiras nas quatro áreas. Dois achados são de absorção direta com superfície viva no boilerplate (C1, C2); dois são guard-rails contra limitação confirmada nos dois lados (C4, C6); um é o boilerplate já sendo superior e não devendo copiar nada (C3). **Uploads e open redirect não existem em nenhum dos dois** — detalho no fim para não gerar teste vácuo.

---

#### C1 · `UserResource` devolve CPF, telefone e notas internas em claro para qualquer um com `manage_users`
- **Pergunta**: (a) absorver do spinmax
- **Evidência (spinmax @ e4ec01e)**: `app/Http/Resources/UserResource.php:25-35` — o viewer é resolvido pelo usuário **original** (não o impersonado) e o teto é aplicado na exibição:
  ```php
  $viewer          = app(ImpersonationService::class)->getOriginalUser() ?? $currentUser;
  $canSeeSensitive = $this->viewerOutranksOrOwns($viewer);
  'cpf_cnpj'   => $canSeeSensitive ? $this->cpf_cnpj : Cpf::mask((string) $this->cpf_cnpj),
  'phone'      => $canSeeSensitive ? $this->phone : null,
  'user_notes' => $canSeeSensitive ? $this->user_notes : null,
  ```
  `viewerOutranksOrOwns()` (`:69-80`) libera para si mesmo, `SUPER_USER`, ou prioridade **estritamente maior**. Coberto por `tests/Feature/User/UserResourceCpfCeilingTest.php` (2 casos, incluindo o negativo).
- **Equivalente no boilerplate**: `app/Http/Resources/UserResource.php:26-31` — sem teto nenhum: `'cpf_cnpj' => $this->cpf_cnpj, 'phone' => $this->phone, 'mobile' => $this->mobile, 'user_notes' => $this->user_notes`.
- **O que absorver / travar**: portar `viewerOutranksOrOwns()` + mascaramento. O custo é baixo porque **as duas peças já existem no boilerplate**: `App\Enum\Roles::priority()` (`app/Enum/Roles.php:49`, SUPER_USER 100 / ADMIN 90 / MANAGER 70) e `ImpersonationService::getOriginalUser()` (já usado em `app/Policies/UserPolicy.php:166`). Falta só aplicar no resource. Usar `CpfFormatter::mask()` do próprio boilerplate, não o `Cpf::mask` do spinmax.
- **Superfície no boilerplate hoje**: **sim, e é escalada real.** `UserResource` é consumido em 5 pontos (`User/IndexController.php:136`, `ShowController.php:34`, `EditController.php:40`, `ShowUserPermissionsController.php:30`, `PermissionRole/IndexController.php:44`), todos atrás de `can:manage_users` (`routes/web.php:22-30`). `MANAGER` tem `MANAGE_USERS` (`database/seeders/PermissionRoleSeeder.php:48-51`) e prioridade 70 → **um MANAGER abre `/users` e lê CPF, telefone, celular e notas internas do ADMIN (prioridade 90) em claro**. É exatamente a escalada que o docblock do spinmax diz ter fechado. Hoje **zero testes** do boilerplate tocam `UserResource` (`grep -rln UserResource tests/` → vazio).

---

#### C2 · O `PiiScrubber` do boilerplate casa chave por igualdade exata e ignora objetos — vaza `customer_name`, `card_token` e models inteiros
- **Pergunta**: (a) absorver do spinmax
- **Evidência (spinmax @ e4ec01e)**: `app/Support/PiiScrubber.php:38-49` separa duas listas e casa por **substring**:
  ```php
  private const SENSITIVE_KEY_PARTS = ['cpf','cnpj','document','email','mail','phone',…,'customer','payer','recipient','holder','password','secret','token','authorization'];
  private const SENSITIVE_KEYS = ['name','nome']; // exato: role_name/permission_name é dado operacional
  ```
  `isSensitiveKey()` (`:103-116`) faz `str_contains($key, $part)`. E `scrub()` (`:79-82`) normaliza objetos antes de descer: `if ($value instanceof Arrayable) { $value = $value->toArray(); }`.
- **Equivalente no boilerplate**: `app/Support/Logging/PiiScrubber.php:92` — `in_array(mb_strtolower($key), self::SENSITIVE_KEYS, true)`, **match exato**, lista única. E `scrub()` (`:88-110`) trata só `is_array` e `is_string`; qualquer outro tipo cai no `return $value` da linha 109.
- **O que absorver / travar**: (1) adotar o casamento por substring com a lista `SENSITIVE_KEY_PARTS` + a lista exata só para `name`/`nome` — a separação do spinmax é o detalhe fino que evita redigir `role_name`; (2) adicionar o ramo `Arrayable` antes do `is_array`. Manter os placeholders tipados do boilerplate (`[CPF]`, `[EMAIL]`), que são melhores que o `[REDACTED]` único do spinmax.
- **Superfície no boilerplate hoje**: **sim.** `PiiAwareTap` está plugado em `single`, `daily` e `stack` (`app/Support/Logging/PiiAwareTap.php` + asserção em `tests/Feature/LogScrubbingTest.php`, caso "keeps the shipped channels wired"), então é o caminho de todo `Log::*`. Dois vazamentos concretos, nenhum coberto pelo teste atual (que só usa chaves exatas `cpf`/`cnpj`/`endereco`/`jwt`):
  - `Log::info('x', ['customer_name' => 'João da Silva'])` → chave não bate exato, valor não casa nenhum regex → **grava o nome inteiro**. No spinmax, `str_contains('customer_name','customer')` redige.
  - `Log::info('x', ['user' => $user])` → `User` é `Arrayable` mas não é array nem string → devolvido intacto, e o formatter do Monolog serializa depois do scrub. `App\Models\User` tem `$hidden = ['password','remember_token']` apenas (`app/Models/User.php:42-45`), então **`cpf_cnpj`, `phone`, `mobile`, `user_notes` e `email` vão para o disco em claro**.
  - Mesma classe de furo para `card_token`/`webhook_token` (boilerplate tem `token` exato, não substring).

---

#### C3 · `CpfHasher`: o boilerplate já é superior — não absorver o `Cpf::hash()` do spinmax
- **Pergunta**: (a) — resultado é **não absorver**; registrar para evitar retrabalho
- **Evidência (spinmax @ e4ec01e)**: `app/Support/Cpf.php:31-34` usa a `APP_KEY` **crua** e não valida nada:
  ```php
  return hash_hmac('sha256', self::normalize($cpf), (string) config('app.key'));
  ```
  Consequências: a chave é a string literal `base64:…` (o prefixo entra no HMAC); `APP_KEY` vazia gera HMAC com chave `''` — hash público, invertível no espaço de ~10^11 CPFs — **em silêncio**; e `Cpf::hash('')` ou `Cpf::hash('123')` devolvem hash aparentemente válido, então lixo vira chave de dedupe em `Customer::upsertByCpf()` (`app/Models/Customer.php:99-108`).
- **Equivalente no boilerplate**: `app/Support/Br/CpfHasher.php:62-79` — deriva a chave (`hash_hmac('sha256', 'app:cpf-hash:v1', $secret, true)`), decodifica o `base64:`, **lança `RuntimeException` com segredo vazio**, e `normalize()` (`:52-57`) devolve `null` fora de 11 dígitos, então `hash()` devolve `null` em vez de hashear lixo. `tests/Unit/Br/CpfHasherTest.php:16` chega a assertar explicitamente que o resultado **não** é a forma do spinmax: `->not->toBe(hash_hmac('sha256', '39053344705', (string) config('app.key')))`.
- **O que absorver / travar**: nada do hash. A **única** peça em que o spinmax ganha é `Cpf::mask()` (`app/Support/Cpf.php:41-55`), que **falha fechado**: 11 dígitos → `***.456.789-**`, 14 → `**.***.789/****-**`, qualquer outro comprimento → `'***'`. O `CpfFormatter::mask()` do boilerplate (`app/Support/Br/CpfFormatter.php:47-60`) aplica formato de CPF a qualquer comprimento, rotulando CNPJ como CPF. Vale absorver só o ramo de 14 dígitos e o fallback total.
- **Superfície no boilerplate hoje**: **`CpfHasher` está dormente** — `grep -rn CpfHasher app/` só encontra a própria classe; nenhum model ou controller a chama, e não há coluna `cpf_hash` nas migrations. `CpfFormatter::mask()` também não é chamado em produção hoje. Ou seja: a classe é melhor que a do spinmax mas nada a exercita — o consumo natural dela é justamente o C1.

---

#### C4 · `profile.destroy` é hard delete idêntico nos dois; o conceito de anonimização só existe no spinmax
- **Pergunta**: (b) guard-rail contra limitação daqui (que o spinmax herdou sem corrigir para `User`)
- **Evidência (spinmax @ e4ec01e)**: `app/Http/Controllers/Settings/ProfileController.php:36-53` é **byte-idêntico** ao do boilerplate (`diff` retorna vazio): exige `current_password`, `Auth::logout()`, `$user->delete()`, `session()->invalidate()` + `regenerateToken()`. Sem `SoftDeletes` no `User`. Mas para o titular de dados **de verdade** o spinmax construiu outro caminho, deliberado — `app/Models/Customer.php:76-95`:
  ```php
  public function anonymize(): void {
      $this->forceFill(['name' => self::ANONYMIZED_NAME, 'email' => '', 'phone' => '',
                        'marketing_opt_in' => false, 'marketing_opt_in_at' => null])->save();
  }
  ```
  com docblock justificando o que **não** apaga (`cpf`/`cpf_hash` ficam: pedido é documento fiscal, retenção ≥ 5 anos), comando idempotente `store:anonymize-customer` (`app/Console/Commands/AnonymizeCustomerCommand.php:26-52`, com `ConfirmableTrait`), e **todo consumidor a jusante checando a flag** — 5 listeners em `app/Listeners/Store/` fazem `return` se `$order->customer?->isAnonymized()`.
- **Equivalente no boilerplate**: `app/Http/Controllers/Settings/ProfileController.php:36-53` (hard delete) e **nada mais** — não há `anonymize()`, nem flag, nem comando, nem retenção, nem agendamento.
- **O que absorver / travar**: o padrão, não o código (`Customer` é domínio do spinmax). Absorver: (1) apagar/anonimizar como operação **explícita e idempotente** com o que se preserva documentado no código; (2) marcar o estado e fazer os consumidores checarem, em vez de assumir que a linha sumiu. Travar: um teste sobre `profile.destroy` que fixe o contrato hoje implícito — que sessão morre e o que sobra de rastro. Vale registrar em `.ai/rules` que exclusão de titular no boilerplate é **hard delete sem anonimização**, para que projeto derivado com dado fiscal não descubra isso em produção.
- **Superfície no boilerplate hoje**: **sim** — a rota `DELETE settings/profile` existe e está viva (`routes/settings.php:16`). Ponto de atenção concreto: o `User` do boilerplate é auditado, então o hard delete **deixa PII para trás** nas linhas de auditoria (`old_values`), e o registro em `sessions` do usuário some só se o driver for banco — o `.env.example` traz `SESSION_DRIVER=redis` (`.env.example:34`). Nada disso é testado.

---

#### C5 · Troca de senha não derruba as outras sessões — nos dois, mesmo código Breeze
- **Pergunta**: (b) guard-rail
- **Evidência (spinmax @ e4ec01e)**: `app/Http/Controllers/Settings/PasswordController.php:25-35` — `diff` contra o boilerplate retorna **idêntico**. Faz `current_password` + `Hash::make` + `return back()`. `grep -rn logoutOtherDevices app/ tests/` no spinmax → **vazio**.
- **Equivalente no boilerplate**: mesmo arquivo, mesmo comportamento. `grep -rn "logoutOtherDevices"` em `app/` → vazio; as únicas invalidações de sessão são `EnsureUserIsActive.php:27-28`, `ProfileController.php:49-50` e `AuthenticatedSessionController.php:37-38` — todas na sessão corrente.
- **O que absorver / travar**: chamar `Auth::logoutOtherDevices($password)` no `PasswordController::update()` (exige `AuthenticateSession` no grupo web) ou, no mínimo, um teste que fixe a decisão de **não** fazer isso. Hoje o comportamento não é decisão registrada, é default do Breeze que ninguém revisitou: quem troca a senha porque desconfia de acesso indevido não expulsa o invasor.
- **Superfície no boilerplate hoje**: **sim** — rota `PUT settings/password` viva (`routes/settings.php:19`), com `SESSION_DRIVER=redis` e `SESSION_LIFETIME=120`. O boilerplate já é superior ao spinmax na vizinhança: tem `EnsureUserIsActive` **global** no stack web (`bootstrap/app.php:38-45`), que encerra a sessão de usuário desativado no meio do caminho — o spinmax não tem esse middleware em lugar nenhum.

---

#### C6 · Zero SQL cru dos dois lados, mas o arch test só proíbe a facade `DB` em controllers
- **Pergunta**: (b) guard-rail — e registro de que **os dois estão limpos hoje**
- **Evidência (spinmax @ e4ec01e)**: varredura completa por `DB::raw|whereRaw|selectRaw|orderByRaw|havingRaw|groupByRaw|DB::statement|DB::select|DB::unprepared` em todo o repositório (fora de `vendor/` e `node_modules/`) → **0 ocorrências**. Inclusive a busca por CPF no admin evita cru por construção: `Order/OrderFilters.php` filtra por `Cpf::hash()` sobre a coluna indexada `cpf_hash`, e `Customer::findByCpf()` (`app/Models/Customer.php:65-68`) é `where('cpf_hash', Cpf::hash($cpf))` — binding normal. Não há concatenação de input em SQL em lugar nenhum.
- **Equivalente no boilerplate**: também **0** ocorrências em código de aplicação (as 3 linhas que a grep pega em `tests/Unit/Database/MigrationDialectInvariantTest.php:12,13,58` são comentário e regex do próprio guard). O guard existente é `tests/Arch/ArchTest.php:39-41`, e o escopo dele é estreito: `expect('App\Http\Controllers')->not->toUse('Illuminate\Support\Facades\DB')`.
- **O que absorver / travar**: o arch test cobre **controller + facade `DB`**. Não pega `->whereRaw()` / `->selectRaw()` / `DB::raw()` chamados de model, service, job ou repository — que é onde query de relatório costuma nascer. Ampliar o guard para os namespaces `App\Models`, `App\Services` e `App\Jobs`, ou trocar por uma varredura textual pelos métodos `*Raw(` no estilo do `MigrationDialectInvariantTest` (que já tem a mecânica de `stripPhpComments` pronta e reaproveitável). Fica como allowlist declarada, não proibição absoluta.
- **Superfície no boilerplate hoje**: **sim, mas preventiva** — há `App\Services` e `App\Models` populados e nenhum deles é alcançado pelo arch test atual. O `MigrationDialectInvariantTest` já cobre bem o lado das migrations (allowlist hoje vazia).

---

#### C7 · Allowlist de e-mail: paridade no listener, boilerplate melhor testado, gap é o pré-voo
- **Pergunta**: (a) absorver do spinmax — só a ideia do pré-voo
- **Evidência (spinmax @ e4ec01e)**: `app/Listeners/Store/EnforceMailAllowlist.php` é **funcionalmente idêntico** ao do boilerplate (mesma estrutura, `filter()`/`allowed()`, match exato ou por domínio, `return false` quando nada sobra); difere só no namespace, na chave de config (`store.mail.allowlist` vs `mail.allowlist`) e no registro (explícito, porque o spinmax usa `withEvents(discover: false)` em `bootstrap/app.php:22`). O que o spinmax tem a mais é o pré-voo em `app/Console/Commands/StagingCheckCommand.php:248-262`, que exige as duas configs **juntas**:
  ```php
  // As duas juntas, sempre: allowlist preenchida com caixa vazia
  // CANCELA o envio em vez de redirecionar.
  $this->passDeployed('E-mail', $allowlist !== [] && $inbox !== '', …);
  ```
- **Equivalente no boilerplate**: `app/Listeners/EnforceMailAllowlist.php` (listener, paridade) + `config/mail.php:129-134` (`allowlist`/`test_inbox`). O boilerplate é **superior no teste**: `tests/Feature/Mail/EnforceMailAllowlistTest.php` tem 8 casos, incluindo o negativo exato (`'cancels the send when nothing is allowlisted and no test inbox is set'`, linha 58) e a fiação por auto-discovery (linha 89) — o spinmax tem 7 e depende de registro manual.
- **O que absorver / travar**: só o pré-voo. O modo de falha — `MAIL_ALLOWLIST` preenchida com `MAIL_TEST_INBOX` vazia cancela **todo** e-mail de staging em silêncio — está testado como comportamento, mas nada avisa o operador de que a config está assim. Um `artisan` de checagem (ou um teste de config em CI) que exija as duas juntas fora de produção fecha a lacuna.
- **Superfície no boilerplate hoje**: **parcial.** O listener e o config existem e estão vivos. O que **não** existe é onde pendurar a checagem: `app/Console/Commands/` tem só `CreateSuperUserCommand.php` e `SyncPermissionsCommand.php` — não há comando de health/staging-check no boilerplate, então absorver isso significa criar a categoria, não estender uma existente.

---

### Áreas do escopo sem achado — declarado para não gerar teste vácuo

- **Uploads: não existem em nenhum dos dois.** `grep -rn "UploadedFile|->store\(|storeAs|Storage::|putFile|temporaryUrl|'mimes"` em `app/` e `routes/` → **0 ocorrências** nos dois repositórios; nenhum `<input type="file">` em `resources/` do spinmax. O `config/filesystems.php` do spinmax tem os discos stock (`local`, `public`, `s3`) e o `links` padrão, todos sem uso. Regra de MIME/size, disco privado ou URL assinada **não têm onde ser testadas** — qualquer guard-rail aqui passaria vacuamente. Se o boilerplate for ganhar upload, a regra tem de nascer junto com a primeira feature.
- **Open redirect: não existe superfície.** Todos os redirecionamentos do spinmax são `back()` ou `redirect()->intended(route('dashboard', absolute: false))` (`Auth/AuthenticatedSessionController.php:31`, `Auth/VerifyEmailController.php:15,24`, `Auth/ConfirmablePasswordController.php:33`). Nenhum parâmetro de retorno controlado pelo usuário (`?next=`, `return_to`, `redirect_url`) em nenhum dos dois.
- **Sessão/cookies: paridade, com o boilerplate à frente.** `config/session.php` difere em **uma linha** — o separador do nome do cookie (`Str::slug(…) . '-session'` no boilerplate vs `Str::slug(…, '_') . '_session'` no spinmax, `:129-132`), puramente cosmético. `encryptCookies(except: ['appearance'])` é igual nos dois. O boilerplate tem a mais, no `bootstrap/app.php`: `trustProxies` via `TRUSTED_PROXIES` (`:26-35`, sem o qual `isSecure()` é false atrás de LB e o HSTS/CSP nunca sai), `SetSensitiveCacheHeaders` e `EnsureUserIsActive` no stack web — nenhum dos três existe no spinmax.



#### Veredito — ### REFUTAR — LGPD/PII, uploads, sessão e queries

Reli os dois lados no código. Dois candidatos sobrevivem, dois sobrevivem reduzidos, dois caem no essencial (a proposta, não o fato), e um cai por inteiro. Também corrijo 14 citações de linha e três afirmações de fato falsas.

---

#### C1 — teto de PII no `UserResource` · **SOBREVIVE** (é a única escalada viva desta célula)

Tentei derrubar por quatro vias e nenhuma pegou:

- **Já existe no boilerplate?** Não. `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/app/Http/Resources/UserResource.php:27-31` devolve `cpf_cnpj`, `phone`, `mobile` e `user_notes` sem condicional nenhuma. Não há outro ponto de mascaramento: `grep -rn "CpfFormatter" app/` só encontra a própria classe (`app/Support/Br/CpfFormatter.php:12`).
- **A policy já cobre?** Não — e isto **reforça** o candidato. `app/Policies/UserPolicy.php:23-31`: `viewAny()` e `view()` são `hasPermissionTo('manage_users')` puro. O teto de prioridade existe só a partir de `update()` (`:38-51`, via `outranks()` em `:142-151`). O docblock da classe (`:11-20`) enumera o risco de `manage_users` ir para `super_user`/`admin`/`manager` e trata só de mutação. Leitura ficou de fora, deliberadamente ou não.
- **Tem mesmo superfície?** Sim. `IndexController` não filtra visibilidade: `app/Http/Controllers/User/IndexController.php:28` é `User::query()->with(['role','permissions'])` e paginação — nenhum `where` por prioridade — e o payload sai em `:136`. As colunas existem (`database/migrations/0001_01_01_000000_create_users_table.php:15-18`) e o seeder padrão dá `MANAGE_USERS` ao `MANAGER` (`database/seeders/PermissionRoleSeeder.php:48-51`), que roda por default (`DatabaseSeeder.php:17-19`). Prioridade `MANAGER` 70 < `ADMIN` 90 (`app/Enum/Roles.php:52-56`). A escalada de leitura é real.
- **Custo?** Baixo: `ImpersonationService::getOriginalUser()` já é o padrão da casa em 8 pontos (`UserPolicy.php:166`, `RoleFilterService.php:44,159`, `StoreController.php:35`, `UpdateController.php:47`, `AssignRoleController.php:39`, `RevokeRoleController.php:39`, `PermissionRole/UpdateController.php:120`).

**Correções de fato:** o `$viewer` do spinmax está em `:24`, não `:25`; o intervalo BP `:26-31` começa em `email`, os campos sensíveis são `:27-31`; o grupo `can:manage_users` vai de `routes/web.php:22` a `:36` (o candidato parou em `:30` e deixou de fora `users/{user}/permissions`, que também serve `UserResource` — `ShowUserPermissionsController.php:30`). **Ponto de porte que o candidato não viu:** `tests/Feature/User/UserResourceCpfCeilingTest.php:27,41` usa `Roles::OPERATIONS`, cargo que **não existe** no enum do boilerplate (`SUPER_USER/ADMIN/MANAGER/VIEWER/VISITOR`) — o teste não é copiável, tem de ser reescrito com `MANAGER`. E o teto no spinmax lê a prioridade pelo **model** `Role::getPriority()` (`UserResource.php:79`), não pelo enum — o boilerplate tem `Role::getPriority()` em `app/Models/Role.php:39` com fallback para o enum, então use esse, como o `UserPolicy.php:174` já faz.

---

#### C2 — `PiiScrubber` sem substring e sem `Arrayable` · **SOBREVIVE PARCIALMENTE** (a proposta, como escrita, é regressão)

O mecanismo é verdadeiro: `app/Support/Logging/PiiScrubber.php:92` casa `in_array(mb_strtolower($key), self::SENSITIVE_KEYS, true)` e `scrub()` (`:86-109`, não `:88-110`) só trata `is_array` e `is_string`, caindo no `return $value` de `:108`. `PiiAwareTap` está mesmo nos três canais (`config/logging.php:60,68,77`). Mas o candidato exagera o tamanho do furo e propõe um remédio que subtrai cobertura:

1. **A camada de padrão já cobre a maior parte do exemplo.** `PATTERNS` (`:65-84`) pega e-mail, CPF/CNPJ formatado, CEP, telefone BR e E.164, JWT, `Bearer …` **e sequência solta de 11–14 dígitos** (`'/\b\d{11,14}\b/' => '[NUMERIC_ID]'`, `:83`) em qualquer string, independente da chave. Logo `contact_email`, `doc_cliente`, `cpf_do_titular` etc. não vazam. O furo residual é estreito e específico: chaves cujo **valor não tem padrão reconhecível** — nomes próprios (`customer_name`, `nome_completo`, `recipient_name`) e segredos opacos (`api_token`, `webhook_token`, `card_token`). É esse o achado, não "vaza tudo".
2. **`customer_name` e `card_token` são exemplos do domínio do spinmax.** No boilerplate as sete chamadas `Log::` existentes passam **só escalares**: `auth_user_id`, `effective_user_id`, `target_user_id`, `target_user_role`, `new_role_priority`, `requested_role_name`, `is_impersonating` (`AssignRoleController.php:68-73,89-96`, `RevokeRoleController.php:57-62,76`, `StoreController.php:53-59`, `UpdateController.php:70`). Nenhuma passa model nem nome. O furo é **latente**, para código futuro — o que justifica um scrubber, mas não a moldura de "vazamento em produção hoje".
3. **Adotar `SENSITIVE_KEY_PARTS` do spinmax verbatim perde 12 chaves que o boilerplate hoje redige.** Confrontei as duas listas: `api_key`, `api-key`, `apikey`, `cookie`, `session`, `auth`, `bearer`, `mobile`, `rg`, `full_name`, `first_name`, `last_name` **não casam nenhum** dos 22 termos de `spinmax/app/app/Support/PiiScrubber.php:34-41`, e nenhum é exatamente `name`/`nome` (`:47`). A proposta só é aceitável como **união** (partes do spinmax **+** lista exata atual), nunca como troca. Do jeito que o candidato escreveu ("adotar o casamento por substring com a lista `SENSITIVE_KEY_PARTS` + a lista exata só para `name`/`nome`"), é regressão líquida.
4. **O ramo `Arrayable` sobrevive intacto.** `App\Models\User` é `Arrayable`/`JsonSerializable`, `$hidden` só esconde `password` e `remember_token` (`app/Models/User.php:42-45`), e o processor roda antes do formatter (`PiiScrubbingProcessor.php:27-35`) — o objeto passa cru e o Monolog serializa depois. Duas linhas de correção, ganho real.

---

#### C3 — `CpfHasher` já superior · **SOBREVIVE no hash, DERRUBADO na máscara**

A metade principal confere: `spinmax/app/app/Support/Cpf.php:30` usa `config('app.key')` cru, sem validar, sem derivar e sem rejeitar entrada de tamanho errado; `app/Support/Br/CpfHasher.php:35-44,51-56,62-80` deriva a chave, decodifica `base64:`, lança com segredo vazio e devolve `null` fora de 11 dígitos; `tests/Unit/Br/CpfHasherTest.php:16` assere explicitamente que o resultado difere da forma do spinmax. Confirmo também a dormência: `grep -rn CpfHasher app/ database/ routes/` só acha a própria classe, e não existe coluna `cpf_hash` em migration nenhuma.

**Mas a recomendação de absorver a máscara está invertida e eu a derrubo.** O candidato diz que `Cpf::mask()` "falha fechado" e que `CpfFormatter::mask()` é pior. No código:

- `spinmax/app/app/Support/Cpf.php:38-51` (não `:41-55`) devolve `***.456.789-**` para CPF — **expõe 6 dos 11 dígitos** — e `**.***.789/****-**` para CNPJ (3 dígitos).
- `app/Support/Br/CpfFormatter.php:46-59` (não `:47-60`) devolve `***.***.***-` + os **2 últimos** dígitos, para qualquer comprimento, e `null` para entrada vazia.

No eixo que importa para LGPD — quanto do documento sai — o boilerplate é **estritamente mais restritivo**. O único defeito real é cosmético: um CNPJ sai com pontuação de CPF. Absorver "o ramo de 14 dígitos e o fallback total" trocaria 2 dígitos expostos por 6 no caso comum. Se algo mudar aqui, mude só o rótulo do CNPJ, mantendo os 2 dígitos.

---

#### C4 — hard delete sem anonimização · **SOBREVIVE MUITO REDUZIDO** (metade do "gap" já é teste verde)

`diff` confirma que `ProfileController` é byte-idêntico nos dois, e as peças do spinmax existem (`Customer::anonymize()` em `Customer.php:79-88` — não `:76-95`, que começa dentro do docblock; `isAnonymized()` em `:90-95`; `AnonymizeCustomerCommand.php:24-53`). Três objeções:

1. **"Nada disso é testado" é falso.** `tests/Feature/Settings/ProfileUpdateTest.php:55` (`user can delete their account`) já fixa `assertGuest()`, o redirect e `expect($user->fresh())->toBeNull()`; `:72` cobre a negação por senha errada. O contrato que o candidato quer "travar" já está travado. O que resta sem teste é só o **rastro** (linhas de `activity_log` e sessão), não a rota.
2. **A afirmação sobre `sessions` está errada.** `database/migrations/0001_01_01_000000_create_users_table.php:33` é `$table->foreignId('user_id')->nullable()->index()` — **índice, sem constraint e sem cascade**. A linha de sessão sobrevive ao hard delete **também** no driver de banco; a distinção "some só se o driver for banco" não existe. O ponto sobre `SESSION_DRIVER=redis` (`.env.example:34`, default `database` em `config/session.php:21`) continua válido só como "a sessão não é limpa em lugar nenhum".
3. **O rastro de auditoria é o achado que sobra, e é real:** `app/Models/User.php:56-73` loga `name`, `email`, `cpf_cnpj`, `phone`, `mobile`, `user_notes` — o hard delete apaga a linha de `users` e deixa a PII nas `properties` do activitylog. Isso não veio do spinmax (lá o `User` é igualmente auditado e igualmente não tratado); é achado do próprio boilerplate.
4. **O padrão do spinmax não generaliza.** `anonymize()` é do `Customer`, cuja justificativa é retenção fiscal do pedido (`Customer.php:71-78`). O boilerplate não tem titular de dados além do `User` nem obrigação de retenção — criar um `anonymize()` genérico é superfície que não existe. Nota de precisão: dos 5 listeners, `SendOrderPaidEmails.php:25` usa a forma **invertida** (`if (!$isAnonymized)` envolvendo só parte do envio), não `return` como os outros quatro.

**O que sobra para absorver:** um teste que assere o rastro pós-`profile.destroy` e uma linha em `.ai/rules` dizendo que exclusão é hard delete sem anonimização. Não uma feature.

---

#### C5 — `logoutOtherDevices` · **SOBREVIVE COMO TO-DO, DERRUBADO COMO ACHADO DE HARVEST**

`diff` confirma `PasswordController` idêntico e `grep -rn "logoutOtherDevices\|AuthenticateSession"` em `app/ bootstrap/ config/ tests/` dos **dois** repositórios retorna vazio. Ou seja: o spinmax não ensina nada aqui — é o default do Breeze intocado nos dois. Um candidato de harvest cuja evidência na fonte é "a fonte também não faz" não é colheita; é backlog interno disfarçado. Ele pode virar tarefa, mas não por causa desta rodada.

**Uma afirmação de apoio é falsa:** "o spinmax não tem esse middleware em lugar nenhum". Tem — `spinmax/app/app/Http/Middleware/EnsureUserIsActive.php:18`, montado em `spinmax/app/routes/web.php:61` no grupo `['auth','verified', EnsureUserIsActive::class]`. A vantagem do boilerplate é de **escopo** (append global em `bootstrap/app.php:43`, portanto cobre também `settings/*` e `auth/*`), não de existência.

**Sobre o custo:** ligar `AuthenticateSession` no grupo web é mudança de comportamento em todo projeto derivado (qualquer rehash de senha desloga todas as sessões; integração malfeita produz laço de logout). `Auth::logoutOtherDevices($password)` em si é barato — o `PasswordController::update()` já tem a senha em claro validada. Se entrar, entra com o middleware e com teste; se não entrar, entra o teste que registra a decisão. As duas coisas são defensáveis; o que não se sustenta é chamar isto de aprendizado do spinmax.

---

#### C6 — arch test de SQL cru · **DERRUBADO**

- **O fato é verdadeiro e mata o candidato.** Reproduzi a varredura no repositório inteiro do spinmax (`--include=*.php --exclude-dir=vendor --exclude-dir=node_modules`, 9 marcadores): **0 ocorrências**. No boilerplate, as 3 linhas que a grep pega são comentário e regex do próprio guard (`tests/Unit/Database/MigrationDialectInvariantTest.php:12,13,58`). Nenhum dos dois lados tem um único caso. Não há fato colhido — há uma regra inventada na ausência de fato.
- **O remédio proposto não faz o que o candidato diz.** `arch()->expect('App\Services')->not->toUse('Illuminate\Support\Facades\DB')` **não** pega `->whereRaw()`, `->selectRaw()` nem `->orderByRaw()`: esses são métodos do builder Eloquent, sem qualquer import da facade `DB`. Ampliar o namespace do guard de `tests/Arch/ArchTest.php:39-41` deixa exatamente o caso que motivou o candidato passando.
- **Guardrail 4, literal.** `ls app/Jobs` → *No such file or directory*. Uma regra `arch()` sobre `App\Jobs` no boilerplate passa **vacuamente** e vira falso conforto. `App\Services` existe mas tem 4 arquivos, todos de RBAC (`ImpersonationService`, `PermissionCatalogService`, `PermissionManagementService`, `RoleFilterService`), nenhum com query além de Eloquent.
- Resta a versão por varredura textual, que funcionaria — mas é um invariante novo, com allowlist, contra um problema que nunca ocorreu em nenhum dos dois repositórios. Default: derrubar.

---

#### C7 — pré-voo da allowlist de e-mail · **DERRUBADO na forma proposta; sobra uma linha de log**

- **A parte do listener não é achado:** o `diff` entre `spinmax/app/app/Listeners/Store/EnforceMailAllowlist.php` e `app/Listeners/EnforceMailAllowlist.php` mostra **só** namespace, docblock e a chave de config (`store.mail.*` vs `mail.*`). Lógica idêntica. Contagem de testes confere (8 em `tests/Feature/Mail/EnforceMailAllowlistTest.php` contra 7 em `spinmax/…/tests/Feature/Store/MailAllowlistTest.php`), e o 8º é o parse do env, que o spinmax não tem.
- **O modo de falha já está documentado e testado, não é silêncio de projeto.** `EnforceMailAllowlistTest.php:58` (`cancels the send when nothing is allowlisted and no test inbox is set`), `config/mail.php:125` e o comentário em `app/Listeners/EnforceMailAllowlist.php:51` dizem exatamente isso. É decisão fail-closed registrada.
- **O custo do remédio é desproporcional.** `StagingCheckCommand` do spinmax é um comando de domínio (checa `ShippingRate` placeholder, `STORE_NOTIFY_EMAIL`, CNPJ/endereço do rodapé legal — `:239-245,266-270`); o resíduo genérico é `checkMail()` (`:248-262`), e dentro dele o pedaço aproveitável são **duas leituras de config**. Absorver isso significa criar a categoria "comando de health" no boilerplate (hoje `app/Console/Commands/` tem só `CreateSuperUserCommand.php` e `SyncPermissionsCommand.php`) para hospedar duas linhas.
- **O que de fato falta é menor e mais barato:** o listener retorna `false` (`:53`) sem registrar nada — o cancelamento é que é silencioso, não a config. Um `Log::warning` nessa linha resolve o cegamento do operador sem comando novo, e cabe no teste que já existe.

---

### Áreas sem achado — confirmo o veredito, corrijo a enumeração

- **Uploads: confirmado 0 × 0.** `grep -rnE "UploadedFile|->store\(|storeAs|Storage::|putFile|temporaryUrl|'mimes|file\(\)"` em `app/` e `routes/` dos dois repositórios: vazio nos dois. Nenhum `type="file"` em `spinmax/resources/`. Qualquer `arch()` ou teste de política de upload aqui é o caso vacuoso do guardrail 4 — de acordo com o candidato.
- **Open redirect: veredito certo, contagem errada.** São **6** sítios de `intended()` em cada repositório, não 4: o candidato omitiu `Auth/EmailVerificationPromptController.php:16` e `Auth/EmailVerificationNotificationController.php:14` (existem nos dois). Nenhum recebe alvo controlado pelo usuário; `->away(` não aparece em nenhum dos dois. Conclusão preservada.
- **Sessão/cookies: confirmado.** `diff config/session.php` retorna **exatamente uma** linha (`:132`, separador do nome do cookie). `encryptCookies(except: ['appearance'])` igual nos dois. `trustProxies` (`bootstrap/app.php:29-33`) e `SetSensitiveCacheHeaders` (`:39`) são mesmo exclusivos do boilerplate — verifiquei `spinmax/app/bootstrap/app.php:28-54` e `spinmax/app/app/Http/Middleware/` (6 arquivos, nenhum de cache header, nenhum trustProxies). **`EnsureUserIsActive` não é exclusivo** — ver C5.



#### Veredito — ### RISCO DE ABSORÇÃO — LGPD/PII, uploads, sessão e queries

Li os dois lados. Confirmo a maior parte dos achados, mas três premissas do relatório anterior estão erradas ou incompletas e mudam o custo da fatia (C1: a máscara quebra o front e estoura lazy loading; C3: o formato da máscara do spinmax é *pior*, não melhor; C4/C5: os fluxos **têm** teste hoje). Detalhe por candidato.

---

#### C1 · Teto de PII no `UserResource` — risco **MÉDIO**
Não toca schema e falha fechado no eixo de segurança, mas altera um payload consumido por 5 controllers e 2 telas, e a forma literal do spinmax quebra duas delas.

**1. Dados persistidos.** Nenhum. É camada de exibição; nada é gravado. Sem trap de migração.

**2. Muda comportamento — e onde falha.**
- **Fail-closed no que importa** (esconde a mais), mas **fail-open em silêncio se o teto for calculado errado**: `viewerOutranksOrOwns()` devolve `false` para viewer sem cargo, o que só esconde mais. O caso perigoso é o inverso — `$viewer->role` não carregado devolvendo `null` → prioridade 0 → mascara **para todo mundo**, inclusive para quem tem direito. Ruído, não vazamento.
- **Quebra confirmada nº 1 — lazy loading.** `Model::shouldBeStrict()` está ligado em todos os ambientes (`app/Providers/AppServiceProvider.php:64`) e no Laravel 13.24 o flag é per-instância, setado só quando o hydrate traz **mais de uma linha** (`vendor/laravel/framework/src/Illuminate/Database/Eloquent/Builder.php:471-478`). Em `PermissionRole/IndexController.php:41` os usuários vêm de `$role->users` **sem** `role` carregado: com 2+ usuários no mesmo cargo, `$this->resource->role?->getPriority()` estoura `LazyLoadingViolationException` em dev/test e, em produção, vira N+1 reportado (`AppServiceProvider.php:67-72`). Hoje esse acesso não acontece porque `can_impersonate` (`UserResource.php:59`) sai cedo em `canImpersonate()` antes de tocar `$targetUser->role` (`HasRolesAndPermissions.php:199`). Pior: `tests/Feature/PermissionRole/IndexControllerTest.php` **não pega** — cada cargo tem ≤1 usuário nos cenários, e com 1 linha o flag nem é setado. Absorver exige `$role->load('users.role')` e um teste com 2 usuários no mesmo cargo.
- **Quebra confirmada nº 2 — front.** `resources/js/pages/users/show.tsx:28` faz `applyCpfCnpjMask(user.cpf_cnpj)`, que começa com `removeNonNumeric()` (`utils/format/masks.ts:41-42`). Máscara vinda do backend (`***.***.***-25`) vira `"25"` na tela. `users/show` é acessível ao MANAGER porque `UserPolicy::view()` só exige `manage_users` (`app/Policies/UserPolicy.php:28-31`) — ou seja, é exatamente o caso que a absorção quer proteger que renderiza lixo.
- **Não quebra o formulário**: `EditController` chama `authorize('update')` e `UserPolicy::update()` termina em `outranks()` estrito, então quem vê a tela de edição sempre outranks — máscara nunca chega ao `user-form.tsx:28` e não há risco de gravar `***` por cima do CPF real. Isso derruba a hipótese de corrupção de dado.
- **Regressão de contrato TS:** `phone`/`mobile` viram `null`; `resources/js/types/index.d.ts:104-108` já é `?: string | null`, mas `resources/js/types/users.ts:150-157` é `?: string`. `pnpm types` reclama.

**3. Segurança da própria absorção.** Copiar `Cpf::mask((string) $this->cpf_cnpj)` importa dois defeitos: (a) CPF nulo vira `'***'` (cast de `null` para `''`), então o front passa a exibir um documento inexistente; (b) o formato do spinmax expõe 6 dígitos (ver C3). Usar `CpfFormatter::mask()` puro também está errado hoje: rotula CNPJ como CPF. E `getOriginalUser()` (`app/Services/ImpersonationService.php:58-71`) faz `User::find()` sem memoização — durante impersonação, uma listagem de 25 linhas vira 25 SELECTs a mais; fora dela retorna `null` no primeiro `if` e custa zero.

**4. Fatia.** Como escrito: `UserResource.php` + `CpfFormatter.php` + `users/show.tsx` + `types/users.ts` + `PermissionRole/IndexController.php` + testes ≈ 6 arquivos. **Dá para fatiar em duas.** Fatia A (1 arquivo + 1 teste, sem front): `phone`, `mobile`, `user_notes` → `null` quando o viewer não outranks — o front já trata ausência (`show.tsx:216`, `user-details-dialog.tsx:99`). Fatia B (o CPF), que depende de C3 e do `load('users.role')`. Faça A primeiro: fecha a leitura de anotações internas do ADMIN pelo MANAGER (o pior item) sem tocar em TS nem em máscara.

---

#### C2 · `PiiScrubber` por substring + ramo `Arrayable` — risco **MÉDIO**
Só log, nada persistido — mas o "flip para substring" na lista atual do boilerplate destrói o rastro de auditoria que esses logs existem para deixar.

**1. Dados persistidos.** Nenhum. Nem invalida log antigo (o scrub roda na escrita).

**2. Muda comportamento — e onde falha.** Fail-closed por natureza (redige demais), e é aí que dói. As **8 únicas** chamadas `Log::` do boilerplate são de auditoria de RBAC e todas carregam `auth_user_id` / `effective_user_id` / `target_user_role` / `requested_role_name` (`PermissionRole/AssignRoleController.php:68-73, 89-96, 108-115`, `User/UpdateController.php:70-78`, `User/StoreController.php:53`, `PermissionRole/RevokeRoleController.php:57,76`). A lista atual do boilerplate tem `'auth'` (`PiiScrubber.php:38`) e `'name'` (`:54`) como **chaves exatas**. Trocar `in_array(...)` (`:92`) por `str_contains` sem a divisão em duas listas redige `auth_user_id`, `auth_user_role`, `auth_user_priority` e `requested_role_name` — o log de "gerente tentou rebaixar administrador" perde **quem** tentou. Falha silenciosa: ninguém percebe até precisar do log.

**3. Segurança da própria absorção.** A divisão do spinmax (`SENSITIVE_KEY_PARTS` vs `SENSITIVE_KEYS = ['name','nome']`, `app/Support/PiiScrubber.php:38-49`) é obrigatória, não cosmética — e mesmo ela precisa de poda: `'customer'`, `'payer'`, `'recipient'`, `'holder'` são vocabulário de e-commerce, inertes no boilerplate. Não importe a lista `PATTERNS` do spinmax junto: ela não tem o `\b\d{11,14}\b → [NUMERIC_ID]` do boilerplate (`PiiScrubber.php:100`), e o spinmax documenta que **removeu** esse padrão de propósito por causa de `gateway_payment_id`. Trocar seria regressão. O ramo `Arrayable` é o item de maior valor e o de maior efeito colateral: `Log::info('x', ['user' => $user])` hoje vaza tudo (Model é `JsonSerializable`, o formatter serializa depois do processor, e `$hidden` só cobre `password`/`remember_token` — `app/Models/User.php:42-45`); com o ramo, um `Collection` grande vira uma linha de log gigante e `toArray()` roda dentro do processor. Limite herdado que continua de pé nos dois: `Throwable` não é `Arrayable` e escapa (o próprio spinmax documenta isso).

**4. Fatia.** 1 arquivo (`app/Support/Logging/PiiScrubber.php`) + casos novos em `tests/Feature/LogScrubbingTest.php`. Fatiável em duas independentes: (a) ramo `Arrayable`; (b) duas listas + substring. Cada uma vale sozinha. Peça um teste que asserte o **negativo** — `auth_user_id` e `requested_role_name` sobrevivem ao scrub.

---

#### C3 · Não absorver `Cpf::hash()`; da máscara, só o fallback — risco **BAIXO**
Confirmo o veredito, e a inversão vai além: o **formato** da máscara do spinmax é menos protetor que o do boilerplate.

**1. Dados persistidos.** `CpfHasher` está dormente — `grep -rn CpfHasher app/` só acha a própria classe, não há coluna `cpf_hash` em `database/migrations/`, e `users.cpf_cnpj` é `string` nullable em claro (`0001_01_01_000000_create_users_table.php:14`), gravado **como digitado** (não há `prepareForValidation` normalizando; `StoreUserRequest.php:39` só valida com a rule `CpfCnpj`). Absorver qualquer coisa aqui não mexe em dado. A trap fica registrada para o dia em que alguém ligar o hash: `DERIVATION_CONTEXT` ou rotação da `APP_KEY` invalida todos os hashes gravados — o docblock do `CpfHasher` já avisa.

**2. Muda comportamento.** Só `CpfFormatter::mask()`, hoje sem nenhum call site em produção. Adotar o fallback (14 dígitos → CNPJ; qualquer outro tamanho → redação total) é estritamente mais seguro.

**3. Segurança da própria absorção — inversão.** `Cpf::mask()` do spinmax devolve `***.456.789-**`: expõe 6 dos 11 dígitos. Com d4..d9 conhecidos, restam ~10³ candidatos. O `CpfFormatter::mask()` atual expõe os 2 últimos (dígitos verificadores), o que deixa ~10⁷ candidatos após a restrição do DV. **Copiar o formato é regredir três ordens de grandeza no espaço de busca.** Absorva o comportamento (falha fechado por comprimento), mantenha o formato do boilerplate. E `Cpf::hash()` do spinmax fica fora por três motivos verificados (`app/Support/Cpf.php:31-34`): chave crua com o prefixo `base64:` dentro do HMAC, `APP_KEY` vazia gerando HMAC público em silêncio, e `hash('123')` devolvendo chave de dedupe válida — `tests/Unit/Br/CpfHasherTest.php:16` já asserta explicitamente que o boilerplate **não** é essa forma.

**4. Fatia.** 1 arquivo + 1 teste unitário. É a menor fatia da lista e é pré-requisito da metade "CPF" de C1.

---

#### C4 · Anonimização vs. hard delete — risco **BAIXO** (doc + teste) / **ALTO** (portar o padrão)
A parte barata é registrar a decisão; a parte cara colide com um índice único e com o log de atividade.

**1. Dados persistidos — trap real.** `users.email` é `unique()` (`0001_01_01_000000_create_users_table.php:13`). Em `customers` do spinmax o e-mail é só `index()` (`database/migrations/2026_07_22_120003_create_customers_table.php:16`) — por isso `anonymize()` pode escrever `email = ''` lá. Copiar essa forma para `users` **viola a unique no segundo usuário anonimizado**. Anonimização em `users` exige e-mail sintético único (ou `SoftDeletes` + coluna de estado), ou seja: migração. Segundo ponto persistido: `User` usa `LogsActivity` com `logOnly([... 'cpf_cnpj','phone','mobile','user_notes'])` (`app/Models/User.php:60-68`), e `activity_log` guarda `nullableMorphs('subject')` sem FK (`2026_03_27_004320_create_activity_log_table.php:12`). O hard delete **deixa CPF, telefone e notas internas nas linhas antigas**; `config/activitylog.php:18` define `clean_after_days => 365`, mas `routes/console.php` só agenda `horizon:snapshot` — o `activitylog:clean` **nunca roda**, então a retenção é infinita. Uma anonimização que não trate o `activity_log` é fail-open: promete apagar e não apaga.

**2. Muda comportamento.** Correção ao relatório anterior: o fluxo **está testado** — `tests/Feature/Settings/ProfileUpdateTest.php:55` (`user can delete their account`, com `expect($user->fresh())->toBeNull()`) e `:72` (senha errada). O que não existe é teste do resíduo. Absorver o padrão inteiro muda o significado de "excluído" em toda a aplicação (consumidores passam a precisar checar a flag) — no spinmax isso custou 5 listeners em `app/Listeners/Store/`.

**3. Segurança da própria absorção.** Anonimizar sem `SoftDeletes` e sem invalidar o cache `user:{id}:permissions` deixaria uma conta "anônima" ainda autenticável. E `sessions` existe como tabela (`0001_01_01_000000_create_users_table.php:31-38`) mas o `.env.example:34` traz `SESSION_DRIVER=redis`: apagar linha de `sessions` não derruba sessão nenhuma no deploy padrão.

**4. Fatia.** Fatia mínima (**baixo**): um teste que fixe o contrato atual (sessão morre, linha some, rastro fica) + uma linha em `.ai/rules` dizendo que exclusão de titular é hard delete sem anonimização. Fatia completa (**alto**): migração + model + comando + todo consumidor + limpeza do `activity_log`. Uma fatia intermediária que vale sozinha: agendar `activitylog:clean` (1 linha em `routes/console.php`), que faz o `clean_after_days` já configurado significar alguma coisa.

---

#### C5 · `logoutOtherDevices` na troca de senha — risco **ALTO**
É a única absorção da lista que mexe em toda sessão autenticada, e o mecanismo real não é o que o candidato descreve.

**1. Dados persistidos.** `Auth::logoutOtherDevices()` **reescreve a coluna `password`** (`vendor/.../SessionGuard.php:766-777`, `rehashPasswordIfRequired(..., force: true)`). Não é só sessão.

**2. Muda comportamento — ordem importa e o efeito principal não vem do que se pensa.** `logoutOtherDevices()` não faz nada sem `AuthenticateSession` no grupo web (não está lá: `bootstrap/app.php:38-45`). E ao adicionar `AuthenticateSession`, o efeito de derrubar outras sessões passa a existir **sozinho**: o middleware compara `password_hash_web` da sessão com o hash atual do usuário (`vendor/.../Session/Middleware/AuthenticateSession.php:63-69`), e `PasswordController::update()` (`app/Http/Controllers/Settings/PasswordController.php:31-33`) já grava um hash novo. Consequência: **com só o middleware, quem troca a senha é deslogado inclusive na sessão corrente**; o `logoutOtherDevices()` existe justamente para atualizar o hash da sessão atual e poupá-la. As duas mudanças têm de entrar juntas, e na ordem certa — chamar `logoutOtherDevices($nova)` **antes** do `update()` lança `InvalidArgumentException` (`SessionGuard.php:770-772`) → 500 na troca de senha. Falha alta e barulhenta, não silenciosa.

**3. Segurança da própria absorção.** Verifiquei a interação com impersonação e ela **sobrevive**, por pouco: `ImpersonationService::start()`/`stop()` usam `Auth::login()` (`app/Services/ImpersonationService.php:27,42`), e o `tap()` pós-resposta do middleware regrava o hash da nova persona (`AuthenticateSession.php:71-75`), então a próxima requisição bate. Isso é acidental e não está coberto por teste — `tests/Feature/ImpersonateTest.php` e `ImpersonateStopOrderingTest.php` passariam a depender de um detalhe de ordem de middleware. Também entra no jogo o ramo `viaRemember()` (`:52-59`): com `remember_me`, o cookie carrega o hash e o rehash da senha invalida o "lembrar-me" — comportamento correto, mas novo. Já testado hoje: `tests/Feature/Settings/PasswordUpdateTest.php` (2 casos), que passariam a exigir revisão.

**4. Fatia.** Duas linhas de produção (`PasswordController` + `bootstrap/app.php`), mas superfície = toda requisição autenticada, mais testes novos para impersonação, remember-me e sessão corrente. Fatia menor e honesta: **só o teste que fixa a decisão atual** ("trocar a senha não derruba as outras sessões"), transformando um default do Breeze em decisão registrada; a mudança de comportamento vira ADR separada.

---

#### C6 · Ampliar o guard de SQL cru — risco **BAIXO**
Teste puro, sem runtime; o único cuidado é não escrever a regra na forma que quebra código legítimo.

**1. Dados persistidos.** Nenhum. **2. Comportamento.** Nenhum em produção; falha em CI (vermelho), fail-closed por definição.

**3. Segurança/forma.** Confirmo 0 ocorrências de `DB::raw|whereRaw|selectRaw|orderByRaw|havingRaw|groupByRaw|DB::statement|DB::select|DB::unprepared` em `app/`, `database/` e `routes/` do boilerplate, e que `arch()->preset()->security()` (`tests/Arch/ArchTest.php:12`) não cobre SQL — a lista dele é `md5/sha1/eval/exec/...` (`vendor/pestphp/pest/src/ArchPresets/Security.php:15-35`). **A forma errada é estender `not->toUse('Illuminate\Support\Facades\DB')` para outros namespaces**: `SyncPermissionsCommand.php:83,96,101` usa `DB::transaction()` e `DB::table('permission_role')->whereIn(...)->delete()`, que são bindings normais e legítimos. A regra tem de mirar os métodos `*Raw(` / `statement` / `unprepared`, não a facade. A mecânica textual já existe pronta em `tests/Unit/Database/MigrationDialectInvariantTest.php` (com `stripPhpComments`) e evita justamente o falso positivo de comentário.

**4. Fatia.** 1 arquivo de teste. Não dá para fatiar menor e não precisa.

---

#### C7 · Pré-voo da allowlist de e-mail — risco **BAIXO** (config + teste) / **MÉDIO** (comando novo)
O gap é real e a fatia barata é menor do que o candidato sugere.

**1. Dados persistidos.** Nenhum. **2. Comportamento.** Um comando de checagem não muda nada em runtime; um teste de config muda só o CI.

**3. Segurança da própria absorção — o teste vazio é a armadilha.** `phpunit.xml:24-35` não define `MAIL_ALLOWLIST` nem `MAIL_TEST_INBOX`, então `config('mail.allowlist')` é `[]` na suíte: um teste que asserte "allowlist e caixa de teste sempre juntas" **passa vacuamente** e vira falsa confiança. O teste tem de setar a config e checar o par (ou o comando tem de ser rodado no deploy, não no CI). Achado novo: `MAIL_ALLOWLIST`/`MAIL_TEST_INBOX` **não estão no `.env.example`** — as únicas referências no repositório são o listener, o `config/mail.php` e o teste. Quem faz o deploy de staging não tem como saber que a variável existe, quanto mais que ela é meia-trava sem a caixa.

**4. Fatia.** Menor do que "criar a categoria de comando": (a) duas linhas comentadas no `.env.example` documentando que as duas andam juntas; (b) um teste que, com allowlist preenchida e caixa vazia, asserte o cancelamento **e** falhe se o par estiver incompleto na config carregada. Isso são 2 arquivos. O `StagingCheckCommand` do spinmax tem 438 linhas e é quase todo domínio de loja — portar a categoria inteira é uma decisão separada (e o boilerplate hoje só tem `CreateSuperUserCommand` e `SyncPermissionsCommand` em `app/Console/Commands/`).

---

### Uploads e open redirect — risco de absorção: **N/A, e é isso que deve ser registrado**
Confirmo: zero superfície nos dois lados. O risco aqui não é absorver, é **fingir que absorveu**: qualquer teste de MIME/tamanho/disco privado ou de redirect com `?next=` passa vacuamente hoje, exatamente como o teste de allowlist em C7. Guard-rail vazio é pior que nenhum, porque o próximo agente lê o teste verde e conclui que a regra está coberta. Se virar item, que vire linha em `.ai/rules` ("upload nasce com disco privado, allowlist de MIME e URL assinada"), não teste.

### Ordem sugerida por risco/retorno
C3 (baixo, 1 arquivo, destrava C1) → C2-a (`Arrayable`, baixo) → C1-fatia-A (`phone`/`mobile`/`user_notes`, fecha a escalada real sem tocar no front) → C6 (teste só) → C7-a (`.env.example` + teste com config setada) → C2-b (duas listas) → C1-fatia-B (CPF, exige `load('users.role')` e `show.tsx`) → C4-doc → C5-teste-que-fixa-a-decisão. `C4` completo e `C5` completo ficam como ADR, não como fatia.



#### Veredito — ### ATUALIDADE — LGPD/PII, uploads, sessão e queries

Boilerplate verificado: `laravel/framework ^13.0`, `inertiajs/inertia-laravel v3.3.1`, `monolog/monolog 3.10.0`, `pestphp/pest ^5.1`, `spatie/laravel-activitylog ^5.0` (`composer.json` + `composer.lock`). Tudo abaixo foi conferido contra `search-docs` (version-aware, 13.x) e contra o vendor real.

---

#### C1 · Teto de visibilidade no `UserResource` — `[absorver-modernizado]`

**Tentei derrubar e não caiu.** Enumerei o trait inteiro de condicionais de resource em `vendor/laravel/framework/src/Illuminate/Http/Resources/ConditionallyLoadsAttributes.php`: `when` (:120), `mergeWhen` (:163), `whenHas` (:208), `whenNull` (:226), `whenNotNull` (:240), `whenAppended` (:255), `whenLoaded` (:272), `whenCounted` (:303), `whenAggregated` (:336), `whenExistsLoaded` (:367), `whenPivotLoaded` (:394), `whenPivotLoadedAs` (:408). **Não existe `whenCan` / `whenAuthorized`** — o L13 não tem condicional de campo ligada a gate/policy. A regra de precedência de cargo continua sendo código de aplicação.

**O que muda com a API atual.** O ternário do spinmax (`$canSeeSensitive ? $this->cpf_cnpj : Cpf::mask(...)`) é exatamente a assinatura de `when($condition, $value, $default)` — o terceiro parâmetro existe desde sempre e tem default `new MissingValue`. Escreva:

```php
'cpf_cnpj' => $this->when($canSeeSensitive, $this->cpf_cnpj, fn() => CpfFormatter::mask($this->cpf_cnpj)),
```

**Não use `mergeWhen` aqui**, apesar de ser a resposta natural para "três campos, uma condição". Dois motivos verificados: (1) `mergeWhen` **remove** as chaves quando falso, e o `CLAUDE.md` deste repo trata `resources/js/types/` como contrato espelhado — sumir com `cpf_cnpj`/`phone`/`user_notes` do payload quebra o tipo em vez de mascarar; (2) o doc do 13.x traz warning explícito de que `mergeWhen` não deve ser usado em arrays que misturam chave string e numérica. `when()` com default preserva a chave e o shape TS.

Confirmei as duas peças de apoio no boilerplate: `app/Enum/Roles.php:49-58` (`priority()`, SUPER_USER 100 / ADMIN 90 / MANAGER 70 / VIEWER 10 / VISITOR 5) e `app/Services/ImpersonationService.php:58-64` (`getOriginalUser()`, devolve `null` fora de impersonation — o `?? $currentUser` do spinmax é necessário). O `app/Http/Resources/UserResource.php:26-31` hoje devolve `cpf_cnpj`, `phone`, `mobile`, `user_notes` sem condicional nenhuma. **O achado sobrevive inteiro; só a forma de escrever muda.**

---

#### C2 · `PiiScrubber` — fiação `[atual]`, lógica `[absorver-modernizado]`

**A fiação por `tap` não foi superada — e é a única saída.** Verifiquei `vendor/laravel/framework/src/Illuminate/Log/LogManager.php`: `createSingleDriver()` (:308-318) monta o Monolog com processors fixos — `$config['replace_placeholders'] ? [new PsrLogMessageProcessor()] : []` — e **ignora `$config['processors']` por completo**. A chave `processors` só é lida em `createMonologDriver()` (:433-469), ou seja, apenas em canais `driver => 'monolog'`. Como `config/logging.php` usa `single`/`daily`/`stack`, o `PiiAwareTap` (`config/logging.php:60,68,77`) é o mecanismo correto e atual. `[rejeitado-obsoleto]` seria errado aqui.

**Também não há redação nativa.** `Context::addHidden()` (13.x) só mantém fora do log o que você deliberadamente esconde — não varre o que você passou em `Log::info('x', [...])`. Não é substituto.

**A modernização é na chave do ramo de objeto, e é mais forte que a do spinmax.** O spinmax normaliza via `Arrayable`; o gatilho real no stack atual é `JsonSerializable`. Verifiquei em `vendor/monolog/monolog/src/Monolog/Formatter/NormalizerFormatter.php:219`:

```php
if ($data instanceof \JsonSerializable) {
    $value = $data->jsonSerialize();
}
```

`Illuminate\Database\Eloquent\Model` implementa `JsonSerializable`. O processor roda **antes** do formatter, então `Log::info('x', ['user' => $user])` passa pelo `scrub()` (`app/Support/Logging/PiiScrubber.php:88-110`), cai no `return $value` da linha 109 por não ser array nem string, e só depois o `NormalizerFormatter` chama `jsonSerialize() → toArray()`. Com `$hidden = ['password','remember_token']` (`app/Models/User.php:42-45`), **`email`, `cpf_cnpj`, `phone`, `mobile` e `user_notes` chegam ao disco em claro**. Ramifique por `JsonSerializable` (cobre todo Model e mais), não por `Arrayable`.

O casamento por substring do spinmax segue válido: `SENSITIVE_KEYS` do boilerplate (:24-64) já inclui `name` exato, então `customer_name`/`card_token` escapam. Nada nativo cobre isso.

**Nota de atualidade adjacente que ninguém pediu mas é real:** o Inertia 3.3.1 trouxe um **segundo** canal de redação — `devtools.redact` (`vendor/inertiajs/inertia-laravel/config/inertia.php:177-201`). O `config/inertia.php` publicado no boilerplate **não declara o bloco `devtools`** (grep por `devtools|redact` só acha a linha 42, de outro assunto), então ele roda no default do pacote, cuja lista de keys é `password, password_confirmation, current_password, token, _token, access_token, refresh_token, secret, client_secret, api_key` — **zero PII brasileira**: sem `cpf`, `cnpj`, `phone`, `email`, `user_notes`. Se o recorder for ligado (`INERTIA_DEVTOOLS_ENABLED`), props de `UserResource` são gravadas em `storage/inertia-devtools` com CPF em claro. Isso não substitui o C2 — é um alvo novo que a versão atual criou e que deve receber a mesma lista.

---

#### C3 · `CpfHasher` / `CpfFormatter` — hasher `[atual]`, `mask()` `[absorver-modernizado]`

**Hasher: nada nativo.** Não há blind index no L13. Confirmei `app/Support/Br/CpfHasher.php:62-79` — deriva com `hash_hmac(..., DERIVATION_CONTEXT, $secret, true)`, decodifica `base64:`, lança `RuntimeException` com segredo vazio. A conclusão de "não absorver o `Cpf::hash()` do spinmax" se mantém.

**Mas a versão atual criou um risco que o docblock só menciona de passagem.** O doc 13.x de Encryption traz `APP_PREVIOUS_KEYS`: na rotação, o framework tenta a chave atual e cai para as anteriores **no caminho de decrypt**. Isso salva o cast `encrypted` da coluna e não salva nada do hash: `CpfHasher::key()` lê só `config('app.key', '')`, sem fallback. Resultado concreto no stack atual — rotacionar `APP_KEY` com `APP_PREVIOUS_KEYS` preenchido deixa o dado cifrado legível e **órfã 100% dos `cpf_hash` gravados**, silenciosamente, porque nada quebra: a busca simplesmente para de achar. O docblock diz "exige rotina deliberada de re-hash"; o que mudou é que o L13 agora torna a rotação **indolor para tudo, menos para o hash**, o que aumenta a chance de alguém rotacionar sem lembrar. Vale um `DERIVATION_CONTEXT` versionado + segredo próprio (`config('app.cpf_hash_key')`) em vez de acoplar à `APP_KEY`.

**`mask()`: use `Str::mask()`.** Confirmado nos docs 13.x (`Str::mask` e a variante fluente `Str::of()->mask()`), com offset negativo — que é exatamente o caso do CNPJ. `app/Support/Br/CpfFormatter.php:47-60` hoje concatena `substr()` à mão e, pior, aplica formato de CPF a qualquer comprimento. Absorva o comportamento do spinmax (11 → parcial, 14 → forma de CNPJ, resto → `'***'`), mas escrito com `Str::mask` em vez de `substr`.

---

#### C4 · Anonimização vs. hard delete — conceito `[atual]`, retenção `[rejeitado-obsoleto]`

**A anonimização em si é `[atual]`.** Não há nada nativo no L13 para "preservar o documento fiscal e apagar o resto". O padrão do spinmax (`anonymize()` + flag checada a jusante) sobrevive.

**A metade de retenção não é.** Duas APIs nativas cobrem o que um comando caseiro faria:

1. **`Prunable` / `MassPrunable` + `model:prune`** (doc 13.x, Eloquent → Pruning Models). É a API atual para janela de retenção, com `--pretend` e agendamento por `Schedule::command('model:prune')`. Escrever um comando de expurgo à mão hoje já nasce obsoleto.
2. **`activitylog:clean` — já instalado e já configurado, e não roda.** Verifiquei `vendor/spatie/laravel-activitylog/src/Commands/CleanActivitylogCommand.php` (existe) e `config/activitylog.php:18` (`'clean_after_days' => 365`). E `routes/console.php` agenda **só** `Schedule::command('horizon:snapshot')->everyFiveMinutes()`. O limpador nativo nunca é invocado.

**Isso torna o C4 pior do que o relato, e eu confirmei o vetor exato.** `app/Models/User.php:55-75` — `getActivitylogOptions()` faz `logOnly([...])` com **`email`, `cpf_cnpj`, `phone`, `mobile`, `user_notes`** explicitamente na lista. Combinado com o hard delete de `app/Http/Controllers/Settings/ProfileController.php:36-53`, o titular que exerce direito de exclusão some da tabela `users` e **permanece integralmente em `activity_log.properties`**, sem teto de tempo, porque o cleaner nativo não está agendado. Uma linha (`Schedule::command('activitylog:clean')->daily()`) fecha a metade de retenção com API atual; o resto — decidir anonimizar em vez de apagar — segue sem nativo.

---

#### C5 · `logoutOtherDevices` — `[absorver-modernizado]`, e é a maior vitória de atualidade da rodada

O achado sobrevive, mas o **custo despencou** e a receita mudou em dois pontos que importam.

**1. O pré-requisito virou uma linha.** O doc fala em "colocar `auth.session` num route group". No L11+ existe helper de configuração: `vendor/laravel/framework/src/Illuminate/Foundation/Configuration/Middleware.php:771-776` define `authenticateSessions()`, e :492 injeta `$this->authenticatedSessions ? 'auth.session' : null` direto no grupo `web` padrão. O `bootstrap/app.php` do boilerplate **não chama** esse método (li o arquivo inteiro — só `trustProxies`, `encryptCookies`, `web(append: [...])`). Então o pré-requisito é `$middleware->authenticateSessions();` dentro do `withMiddleware()` que já existe, não um route group novo. O alias existe em `Middleware.php:808`.

**2. A ordem no `PasswordController` é load-bearing — e o código atual conflita.** `SessionGuard::logoutOtherDevices()` (`vendor/.../Auth/SessionGuard.php:740`) chama `rehashUserPasswordForDeviceLogout()` (:766), que faz `Hash::check($password, $user->getAuthPassword())` e **lança `InvalidArgumentException`** se não bater, e então `rehashPasswordIfRequired($user, ['password' => $password], force: true)` → `EloquentUserProvider.php:169-178` → `forceFill(['password' => $this->hasher->make($password)])->save()`. Ou seja: **o próprio `logoutOtherDevices` persiste a senha nova**.

Consequência prática para `app/Http/Controllers/Settings/PasswordController.php:25-35`: chamar `Auth::logoutOtherDevices($validated['password'])` *antes* do `update()` **explode** (o hash em banco ainda é o antigo); chamar *depois* funciona mas faz `Hash::make` duas vezes. A forma atual correta é **substituir** o `$request->user()->update(['password' => Hash::make(...)])` por `Auth::logoutOtherDevices($validated['password'])` — uma chamada que grava o hash novo e rotaciona a sessão.

**3. O mecanismo, confirmado.** `AuthenticateSession::handle()` (`vendor/.../Session/Middleware/AuthenticateSession.php:60-68`) compara `session('password_hash_web')` com o hash vivo e faz `logout()` na divergência. É o force-rehash que derruba as outras sessões — não há caminho nativo alternativo.

O `#[\SensitiveParameter]` já está em `logoutOtherDevices` (:740) e em `rehashUserPasswordForDeviceLogout` (:766), então a senha não vaza em stack trace. **Achado válido, receita atualizada em três pontos.**

---

#### C6 · Guarda de SQL cru — `[atual]`

**Tentei derrubar por preset e por nativo; nenhum dos dois pega.**

Li o corpo inteiro de `vendor/pestphp/pest/src/ArchPresets/Security.php`: são 20 entradas num único `expect([...])->not->toBeUsed()` — `md5, sha1, uniqid, rand, mt_rand, tempnam, str_shuffle, shuffle, array_rand, eval, exec, shell_exec, system, passthru, create_function, unserialize, extract, mb_parse_str, dl, assert`. **Nenhuma entrada de SQL.** Li também `ArchPresets/Laravel.php` inteiro — nada de SQL lá tampouco. E `tests/Arch/ArchTest.php:14` já roda `arch()->preset()->security()`, então o preset está ligado e comprovadamente não cobre.

**E o próprio `toUse` é estruturalmente incapaz de cobrir o caso principal.** Ampliar `->expect('App\Models')->not->toUse(DB::class)` pegaria `DB::raw()` e `DB::statement()` (são imports de classe), mas **não pega `$query->whereRaw(...)`/`->selectRaw(...)`**, que são chamadas de método no query builder, não dependência de classe. Isso confirma que a proposta certa é a varredura textual, não uma expectativa arch.

O `tests/Unit/Database/MigrationDialectInvariantTest.php` é o host correto e o cabeçalho dele (linhas 22-27) já diz literalmente que "não proíbe SQL cru… o que ela proíbe é fazer isso EM SILÊNCIO", com allowlist declarada — a mesma mecânica. Reconfirmei o estado: `grep -rnE "whereRaw|selectRaw|orderByRaw|havingRaw|groupByRaw|DB::raw|DB::statement|DB::select|DB::unprepared" app/` → **NONE**. Guarda preventiva, sem nativo que a substitua.

---

#### C7 · Allowlist de e-mail — listener `[atual]`, pré-voo `[absorver-modernizado]`

**O listener não foi superado.** `vendor/laravel/framework/src/Illuminate/Mail/Mailer.php` tem exatamente dois helpers globais: `alwaysFrom` (:114) e `alwaysTo` (:149). O doc 13.x é explícito: `alwaysTo` redireciona **tudo** para um endereço e "any additional cc or bcc addresses will be removed". Isso não é allowlist — não sabe deixar passar `@empresa.com.br` e desviar o resto, e destrói cc/bcc legítimos. `app/Listeners/EnforceMailAllowlist.php` (match exato ou por domínio, `return false` para cancelar) resolve um problema que `alwaysTo` não resolve. `[rejeitado-obsoleto]` seria errado.

**O pré-voo, ao contrário, não deve virar comando novo.** A proposta era portar o `StagingCheckCommand`. Duas superfícies nativas já existentes fazem isso melhor e o boilerplate não usa nenhuma:

1. **`AboutCommand::add()`** — verificado em `vendor/laravel/framework/src/Illuminate/Foundation/Console/AboutCommand.php:302`. Uma seção "Mail" em `php artisan about` mostrando allowlist preenchida / test inbox vazio custa três linhas no `AppServiceProvider` e aparece em toda inspeção de ambiente, sem inventar categoria.
2. **`DiagnosingHealth`** — verificado: `vendor/laravel/framework/src/Illuminate/Foundation/Events/DiagnosingHealth.php` existe, e `bootstrap/app.php:22` **já declara `health: '/up'`**. O doc 13.x diz que o evento é despachado a cada request do health route e que um listener pode lançar exceção para reprovar. Um listener que lança quando `mail.allowlist !== [] && mail.test_inbox === ''` fora de produção faz o `/up` ficar vermelho no deploy — que é o que o `StagingCheckCommand` queria e o monitor já consome.

Isso também dissolve o custo levantado ("não há onde pendurar; `app/Console/Commands/` só tem `CreateSuperUserCommand` e `SyncPermissionsCommand`" — confirmei, é isso mesmo): com as duas APIs nativas, não se cria comando nenhum.

---

### Áreas sem achado — confirmação sob a lente de atualidade

- **Uploads.** Concordo que não há superfície e que guard-rail hoje passaria vácuo. Registro só a nota prospectiva: quando nascer a primeira feature, a API atual **não** é `'mimes:pdf|max:2048'` em string — é `Illuminate\Validation\Rules\File` (`vendor/laravel/framework/src/Illuminate/Validation/Rules/File.php`, com `ImageFile.php` e `Dimensions.php` ao lado). Absorver regra de upload de um projeto que roda L12 tende a trazer a forma antiga; a regra deve nascer com `File::image()->max(...)`.
- **Open redirect.** Nada a acrescentar: sem parâmetro de retorno controlado pelo usuário, não há o que modernizar.
- **Sessão/cookies.** A diferença é cosmética, como relatado. A única atualização relevante nessa vizinhança é o C5 — e ela cai justamente sobre `bootstrap/app.php`, o mesmo arquivo onde o boilerplate já está à frente do spinmax.

**Não verificado:** se `Str::mask()` preserva multibyte de forma equivalente ao `substr()` atual do `CpfFormatter` — irrelevante para dígitos, mas não confirmei o comportamento em input não-ASCII.
