# ctvitrine — inventário e achados (harvest v2)

- **Fonte:** `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`
- **SHA pinado da rodada:** `53d7d9a` (working tree em `c62438a` e suja — **quarto drift** da rodada; nada aqui foi lido do disco)
- **Alvo da comparação:** boilerplate @ `origin/main` = `2965f8c` (nunca `main` seco, nunca o disco)
- **Célula 0 (inventário):** ✅ 2026-08-20 · workflow de **9 agentes** (8 frentes + crítico), **8/8 frentes concluídas**, 0 erros, ~1,38M tokens de subagente, 348 chamadas de ferramenta, ~31 min
- **Varredura de segredo/PII antes do commit:** zero chave, token, JWT, credencial em URL, CPF, CNPJ, telefone real ou endereço. Duas redações minhas (`demo@` e `contato@` → `***@ctvitrine.com.br`): não são dado pessoal, mas uma delas é o login de um `SUPER_USER` de demo de um produto em produção. O telefone `(16) 90000-0001` que aparece é fictício **por decisão da própria fonte**, documentada com comentário no seeder. O telefone e o endereço REAIS da loja-âncora existem no `DemoGarimpoSeeder` e **não** foram copiados para cá — as frentes citaram só nome de campo (o achado em si está registrado na Frente 5).
- **Leitura read-only integral:** só `git ls-tree`/`git show`/`git grep` sobre o SHA pinado. Nenhum comando de escrita ou execução tocou a fonte; `.env` nunca foi aberto (só `.env.example`).

> **Stack confirmada:** L13 (`laravel/framework ^13.0`) + **Inertia 3** (`@inertiajs/react ^3.4.0`, `inertiajs/inertia-laravel ^3.0`), PHP ^8.4, pnpm 11.5.3, Vite 7.3.5, React 19.2, Tailwind 4.3, TypeScript 5.9. **Zero pacote de RBAC externo** (ADR 0001 preservado), zero Sentry no `composer.json`, zero Telescope.

## ⚠️ Banner — o que o crítico derrubou (LEIA ANTES DAS SEÇÕES)

As oito correções abaixo saíram do crítico de completude e **foram TODAS re-medidas por mim, uma a uma, antes de entrar neste documento** — exigência nascida do inventário do cuidari, onde 11 das 12 "correções" de um crítico estavam erradas por baseline trocado. Desta vez as oito reproduzem exatamente. As seções abaixo do banner **não** foram editadas: quem consumir uma contagem tem de conferir aqui primeiro.

| # | O que a seção diz | O que o disco diz | Comando que mediu |
| - | ----------------- | ----------------- | ----------------- |
| 1 | **Frente 3 §5:** `RoleUserUpdatedEvent` "não é disparado em `app/`", wiring "não registrado" | **Falso.** Dois call sites: `AssignRoleController.php:119` e `RevokeRoleController.php:78`, ambos `Broadcast::event(new RoleUserUpdatedEvent($user))` fora de try/catch. A Frente 2 registrou certo; a 3 negou | `git grep -n "RoleUserUpdatedEvent" 53d7d9a -- app` |
| 2 | **Frente 1 §8:** `config/vitrine.php` "~380 linhas" | **487** | `git show 53d7d9a:config/vitrine.php \| wc -l` |
| 3 | **Frente 1 §8:** `signup.reserved_slugs` tem "46 subdomínios" | **45** — a margem sobre os 43 `RESERVED_SLUGS` do comando é 2, não 3 | `awk`/`grep -oE`/`sort -u \| wc -l` sobre o bloco |
| 4 | **Frente 7 §1:** "86 funções-helper locais (medido)" com pathspec `tests/Feature` | **83** com esse pathspec; **96** com `tests` inteiro. Nenhum dos dois é 86 | `git grep -n -E '^function [a-zA-Z]' 53d7d9a -- tests/Feature \| wc -l` |
| 5 | **Frente 6 §6.11:** `detectTls` faz `new URL(env.APP_URL)` "sem try/catch — `APP_URL` sem scheme derruba o config" | **Falso na causa.** `vite.config.ts:15` é `env.APP_URL?.startsWith('https://') ? new URL(...) : null`; sem scheme cai no ramo `null` e o config sobe | `git show 53d7d9a:vite.config.ts` |
| 6 | **Frente 7 §Medições:** o falso-positivo de `arch(` está em `MetricsStrategyTest.php:148` | A linha é **305**, e é um `array_search(`. O achado (zero `arch()` no projeto) está certo; a citação, não | `git grep -n "arch(" 53d7d9a -- tests` |
| 7 | **Frente 6 §6.13** diz 39 arquivos em `resources/js/test/` do boilerplate; **Frente 7 §8** diz 37 | Os dois medem coisas diferentes sem dizer: **39** entradas, **37** casam `.test.*` (as outras são `setup.ts` e `vitest.d.ts`) | `ls-tree … \| wc -l` × `\| grep -cE '\.test\.'` |
| 8 | **Frente 3 §10:** "os outros **6** subdiretórios de `app/`" | A tabela lista **10** linhas; `app/` tem **15** subdiretórios (`Console DataTransferObjects Enum Events Http Jobs Listeners Mail Models Policies Providers Resolvers Rules Services Traits`) | `ls-tree -r … -- app \| awk -F/ 'NF>=2{print $2}' \| sort -u` |

### O que o crítico achou que nenhuma frente amarrou — os dois achados que valem fatia

**(A) `assign-role` e `revoke-role` chamam um broadcast que não pode funcionar, e o caminho feliz não tem teste.** Quatro fatos, cada um enumerado por uma frente diferente, nunca cruzados — **todos re-verificados**:

- `Broadcast::event(new RoleUserUpdatedEvent($user))` é a última instrução das duas actions, **fora de try/catch**.
- **`config/broadcasting.php` não existe** (`ls-tree -- config/broadcasting.php` → 0), `.env.example:66` define `BROADCAST_CONNECTION=reverb`, e **nem `reverb` nem `pusher` estão no `composer.json`/`package.json`** (`git grep -i "reverb\|pusher" -- composer.json package.json` → 0 linhas).
- `bootstrap/app.php` `withRouting()` **não declara `channels:`** (`grep -c channels` → 0) e não existe `routes/channels.php`.
- `RoleUserUpdatedEvent::broadcastWith()` lê `$this->user->roles->first()->name`, mas `HasRolesAndPermissions` define só `permissions()` e `role()` — **não existe relação `roles`** — e `AppServiceProvider::configModels()` liga `Model::shouldBeStrict()` incondicionalmente.
- **Cobertura:** `git grep "assign-role\|revoke-role" 53d7d9a -- tests` → **1 linha**, e é um `assertSessionHasErrors(['role'])` que retorna antes do broadcast. **`revoke-role` tem zero call site em teste.** Os 708 casos Pest nunca executam uma atribuição de papel bem-sucedida por rota.

**(B) `APP_FALLBACK_LOCALE=pt_BR` sem um único arquivo de tradução pt_BR.** A Frente 8 enumerou "não existe `lang/`" mas apresentou a seção como "como o pt-BR chega ao usuário"; o que fica de fora é que **as chaves não resolvem para nada**. `.env.example:35-36` define `APP_LOCALE=pt_BR` **e** `APP_FALLBACK_LOCALE=pt_BR`; `git ls-tree -r 53d7d9a --name-only | grep -c "^lang/"` → **0**; sem `laravel-lang/common` no `composer.json`, locale e fallback apontam para um grupo inexistente e o `FileLoader` só encontra o `en` do framework. Consequência medida: `__('auth.failed')`, `__('auth.throttle')`, `__('auth.password')` e o `__($status)` do password broker devolvem **a chave crua**, e o mesmo vale para toda regra de validação do framework nos 7 Form Requests sem `messages()`. O boilerplate resolve com `lang/pt_BR/{auth,pagination,passwords,validation}.php` (4 arquivos, confirmados em `origin/main`) e `APP_FALLBACK_LOCALE=en`.

### Cinco fatos que só apareceram porque o crítico enumerou `public/` (nenhuma frente abriu o diretório)

1. **Fonte duplicada, 79 KB mortos:** `public/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2` e `aptos-extrabold-italic.woff2` são o **mesmo blob** (`fc88540e…`, 78.980 B cada) — confirmado por `ls-tree`. O nome com ` 2` é artefato de duplicação do Finder, e é a única das 24 woff2 sem referência em `_fonts.css` (que cita 23 URLs).
2. **Quatro favicons órfãos, 277 KB:** `android-chrome-{192,512}.png`, `favicon-48x48.png` e `favicon.png` têm zero referência na árvore; `app.blade.php:15-19` linka só cinco ícones. Os dois `android-chrome-*` são o par que um `site.webmanifest` referenciaria — **e não existe manifest algum**.
3. **Branding do produto anterior ainda versionado:** `logo-desapego.png` (272 KB) e `logo-simplify.png` (116 KB), com referências vivas.
4. **85% do repositório são binários de demo e marketing:** árvore = 29,2 MB, dos quais `database/seeders/data` (77 `.jpg`) = 13,0 MB e `public/` = 11,7 MB. Nenhuma frente somou isso.
5. **Assimetria de compressão:** o projeto tem `app/Services/ImageOptimizer.php` que reduz upload de lojista a 1600px/qualidade 82 — e serve `jaqueta.png` (2,28 MB) e `bolsa.png` (1,79 MB) crus na landing.

### Nota de método — o crítico acertou 8 de 8, e a diferença é identificável

No cuidari, 11 das 12 correções do crítico estavam **erradas**, todas pelo mesmo motivo: ele mediu contra `main` local em vez de `origin/main`. Nesta célula o prompt do crítico trazia o ref escrito de forma literal **e** exigia o comando exato em cada linha derrubada — e as oito reproduzem. O que mudou não foi o modelo: foi o prompt dizer qual é o ref e cobrar o comando. Vale para as três células de inventário restantes (sorteiopix, ctjuris, transitado-em-julgado).

---

## Inventário


---

### Frente 1 — rotas, middlewares, providers, config e `.env.example` (ctvitrine @ `53d7d9a`)

Projeto-fonte: `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, SHA `53d7d9a`. Alvo de comparação: `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate` @ `origin/main`.

Inventário bruto: **4** arquivos em `routes/` · **97** definições de rota (78 web + 12 auth + 7 settings) · **48** rotas de escrita em `routes/web.php` · **15** middlewares · **12** deles `Ensure*` · **15** arquivos em `config/` · **2** providers · **8** `Schedule::command` · **15** ocorrências de `throttle:` · **4** `RateLimiter::for`.

---

#### 1. Rotas — `routes/web.php` (78 definições)

Coluna "pilha declarada" = middleware do grupo + o da própria rota, na ordem em que aparecem no arquivo. `A` = ESCRITA (POST/PUT/PATCH/DELETE) **sem nenhuma autorização declarada na rota** (nem `auth`, nem `can:`).

##### 1.1 Público — vitrine

| # | Método | URI | Nome | Alvo | Pilha declarada | Caminho |
|---|---|---|---|---|---|---|
| 1 | GET | `/` | `home` | `Site\HomeController` | `EnsureVitrineActive` | `routes/web.php:34` |
| 2 | GET | `peca/{item:slug}` | `site.item` | `Site\ShowItemController` | `EnsureVitrineActive` | `routes/web.php:36` |
| 3 | GET | `sitemap.xml` | `sitemap` | `Site\SitemapController` | `EnsureVitrineActive` | `routes/web.php:37` |
| 4 | GET | `robots.txt` | `robots` | `Site\RobotsController` | — (nenhum, de propósito: serve mesmo suspensa) | `routes/web.php:40` |

##### 1.2 Público — páginas legais (gate `EnsureLandingMode`)

| # | Método | URI | Nome | Alvo | Pilha declarada | Caminho |
|---|---|---|---|---|---|---|
| 5 | GET | `termos` | `legal.terms` | `Site\TermsController` | `EnsureLandingMode` | `routes/web.php:49` |
| 6 | GET | `privacidade` | `legal.privacy` | `Site\PrivacyController` | `EnsureLandingMode` | `routes/web.php:50` |

##### 1.3 Público — adesão self-service (gate `EnsureSignupMode`)

| # | Método | URI | Nome | Alvo | Pilha declarada | Caminho |
|---|---|---|---|---|---|---|
| 7 | GET | `assinar` | `signup.show` | `Signup\ShowSignupController` | `EnsureSignupMode` | `routes/web.php:62` |
| 8 | **POST** ⚠A | `assinar` | `signup.store` | `Signup\StoreSignupController` | `EnsureSignupMode`, `throttle:5,1` | `routes/web.php:63` |
| 9 | GET | `assinar/disponibilidade` | `signup.slug` | `Signup\CheckSlugController` | `EnsureSignupMode`, `throttle:20,1` | `routes/web.php:67` |
| 10 | GET | `assinar/{order}` | `signup.order` | `Signup\ShowOrderController` | `EnsureSignupMode` | `routes/web.php:70` |
| 11 | **POST** ⚠A | `webhooks/asaas-signup` | `webhooks.asaas-signup` | `Signup\SignupWebhookController` | `EnsureSignupMode`, `throttle:30,1` | `routes/web.php:72` |
| 12 | GET | `api/ops/signup-orders/{order}` | `signup.ops.show` | `Signup\ShowOrderOpsController` | `EnsureSignupMode`, `throttle:30,1` | `routes/web.php:78` |
| 13 | **POST** ⚠A | `api/ops/signup-orders/{order}/provisioned` | `signup.ops.provisioned` | `Signup\MarkProvisionedOpsController` | `EnsureSignupMode`, `throttle:30,1` | `routes/web.php:81` |

Autorização das linhas ⚠A dessa faixa mora **no controller**, não na rota: #11 valida `authToken` do Asaas, #12/#13 validam bearer via `App\Services\Signup\OpsBearer::valid()` com `hash_equals` (`app/Services/Signup/OpsBearer.php`). #8 (checkout público) é intencionalmente anônimo — o anti-bot é Turnstile, configurado em `config/vitrine.php` (`signup.turnstile_*`). Todas essas URIs estão na lista de exceção de CSRF em `bootstrap/app.php`.

##### 1.4 Público — billing e métricas

| # | Método | URI | Nome | Alvo | Pilha declarada | Caminho |
|---|---|---|---|---|---|---|
| 14 | **POST** ⚠A | `webhooks/asaas` | `webhooks.asaas` | `Webhook\AsaasController` | `EnsureBillingMode`, `throttle:30,1` | `routes/web.php:90` |
| 15 | GET | `metricas` | `metrics.index` | `Metrics\ShowController` | `EnsureMetricsMode`, `auth`, `verified` | `routes/web.php:101` |
| 16 | GET | `metricas/relatorio` | `metrics.report` | `Metrics\ShowReportController` | `EnsureReportMode`, `auth`, `verified` | `routes/web.php:108` |
| 17 | **POST** ⚠A | `m/e` | `metrics.track` | `Metrics\TrackController` | `EnsureMetricsMode:live`, `EnsureVitrineActive`, `throttle:metrics-track` | `routes/web.php:114` |

#14 valida `hash_equals` sobre o header `asaas-access-token` + filtro por `subscription_id` no controller (`app/Http/Controllers/Webhook/AsaasController.php`); token errado → 401, assinatura de outra loja → 200 ignorado. #15/#16 são as duas únicas rotas do projeto que declaram `auth`/`verified` **depois** de um `Ensure*` na lista literal — a ordem real é forçada via `prependToPriorityList` em `bootstrap/app.php`. #17 é o único uso de parâmetro em middleware de classe (`EnsureMetricsMode::class . ':live'`).

##### 1.5 Logado — aceite do Termo (grupo `['auth','verified',EnsureTermsMode]`, `routes/web.php:123`)

| # | Método | URI | Nome | Alvo | Pilha declarada | Caminho |
|---|---|---|---|---|---|---|
| 18 | GET | `termos-de-adesao/aceite` | `legal.accept.show` | `Legal\ShowAcceptController` | `auth`, `verified`, `EnsureTermsMode` | `routes/web.php:124` |
| 19 | POST | `termos-de-adesao/aceite` | `legal.accept.store` | `Legal\StoreAcceptController` | `auth`, `verified`, `EnsureTermsMode` (**sem `can:`**) | `routes/web.php:125` |

Grupo deliberadamente **fora** de `EnsureTermsAccepted` (comentário no arquivo: evitaria loop de redirect).

##### 1.6 Logado — área administrativa (grupo `['auth','verified',EnsureTermsAccepted]`, `routes/web.php:133`)

Todas as linhas abaixo herdam `auth`, `verified`, `EnsureTermsAccepted`.

| # | Método | URI | Nome | Alvo | Autorização adicional | Caminho |
|---|---|---|---|---|---|---|
| 20 | GET | `dashboard` | `dashboard` | **closure** (redirect p/ `items.index` se `can('manage_items')`, senão `Inertia::render('dashboard')`) | — | `routes/web.php:137` |
| 21 | GET | `docs` | `docs.index` | `Docs\IndexController` | — (grupo `tecnico` autorizado dentro do controller) | `routes/web.php:148` |
| 22 | GET | `docs/{group}/{page}` | `docs.show` | `Docs\ShowController` | — · `where group=usuario\|tecnico`, `where page=[a-z0-9-]+` | `routes/web.php:149` |

Subgrupo `can:manage_items` (`routes/web.php:156`):

| # | Método | URI | Nome | Alvo | Middleware extra da rota | Caminho |
|---|---|---|---|---|---|---|
| 23 | GET | `items` | `items.index` | `Item\IndexController` | — | `routes/web.php:157` |
| 24 | GET | `items/create` | `items.create` | `Item\CreateController` | — | `routes/web.php:158` |
| 25 | GET | `items/studio` | `items.studio` | `Item\Studio\ShowController` | `EnsureAiStudioMode` (grupo, l.163) | `routes/web.php:164` |
| 26 | GET | `items/studio/state` | `items.studio.state` | `Item\Studio\StateController` | `EnsureAiStudioMode` | `routes/web.php:165` |
| 27 | POST | `items/studio/drafts` | `items.studio.drafts.store` | `Item\Studio\StoreDraftController` | `EnsureAiStudioMode`, `throttle:ai-studio` | `routes/web.php:167` |
| 28 | PUT | `items/studio/drafts/{item}` | `items.studio.drafts.update` | `Item\Studio\UpdateDraftController` | `EnsureAiStudioMode` | `routes/web.php:170` |
| 29 | POST | `items/studio/drafts/{item}/photos` | `items.studio.drafts.photos` | `Item\Studio\AddDraftPhotosController` | `EnsureAiStudioMode`, `throttle:ai-studio` | `routes/web.php:172` |
| 30 | POST | `items/studio/drafts/{item}/analyze` | `items.studio.drafts.reanalyze` | `Item\Studio\ReanalyzeDraftController` | `EnsureAiStudioMode`, `throttle:ai-studio` | `routes/web.php:176` |
| 31 | POST | `items/studio/drafts/{item}/publish` | `items.studio.drafts.publish` | `Item\Studio\PublishDraftController` | `EnsureAiStudioMode` | `routes/web.php:179` |
| 32 | POST | `items/studio/drafts/{item}/manual` | `items.studio.drafts.manual` | `Item\Studio\ConvertToManualController` | `EnsureAiStudioMode` | `routes/web.php:181` |
| 33 | DELETE | `items/studio/drafts/{item}` | `items.studio.drafts.discard` | `Item\Studio\DiscardDraftController` | `EnsureAiStudioMode` | `routes/web.php:182` |
| 34 | POST | `items/ai-draft` | `items.ai-draft` | `Item\AiDraftController` | `EnsureAiIntakeMode`, `throttle:ai-intake` | `routes/web.php:188` |
| 35 | POST | `items` | `items.store` | `Item\StoreController` | — | `routes/web.php:191` |
| 36 | GET | `items/{item}/edit` | `items.edit` | `Item\EditController` | — | `routes/web.php:192` |
| 37 | POST | `items/{item}` | `items.update` | `Item\UpdateController` | — (POST em vez de PUT por multipart) | `routes/web.php:194` |
| 38 | PATCH | `items/{item}/status` | `items.update-status` | `Item\UpdateStatusController` | — | `routes/web.php:195` |
| 39 | PATCH | `items/{item}/featured` | `items.toggle-featured` | `Item\ToggleFeaturedController` | — | `routes/web.php:197` |
| 40 | DELETE | `items/{item}` | `items.destroy` | `Item\DestroyController` | — | `routes/web.php:198` |
| 41 | DELETE | `items/{item}/photos/{photo}` | `items.photos.destroy` | `Item\DestroyPhotoController` | — | `routes/web.php:199` |
| 42 | POST | `items/{item}/photos/{photo}/ai-background` | `items.photos.ai-background` | `Item\AiBackgroundController` | `EnsureAiImageMode`, `throttle:ai-image` | `routes/web.php:203` |
| 43 | DELETE | `items/{item}/photos/{photo}/ai-background` | `items.photos.ai-background.revert` | `Item\RevertBackgroundController` | — (revert funciona com módulo off) | `routes/web.php:206` |
| 44 | GET | `categories` | `categories.index` | `Category\IndexController` | — | `routes/web.php:210` |
| 45 | POST | `categories` | `categories.store` | `Category\StoreController` | — | `routes/web.php:211` |
| 46 | PATCH | `categories/reorder` | `categories.reorder` | `Category\ReorderController` | — | `routes/web.php:213` |
| 47 | PUT | `categories/{category}` | `categories.update` | `Category\UpdateController` | — | `routes/web.php:214` |
| 48 | DELETE | `categories/{category}` | `categories.destroy` | `Category\DestroyController` | — | `routes/web.php:215` |
| 49 | POST | `categories/{category}/image` | `categories.image` | `Category\UpdateImageController` | — | `routes/web.php:219` |
| 50 | DELETE | `categories/{category}/image` | `categories.image.remove` | `Category\RemoveImageController` | — | `routes/web.php:220` |

Subgrupo `can:manage_site_settings` (`routes/web.php:226`):

| # | Método | URI | Nome | Alvo | Observação | Caminho |
|---|---|---|---|---|---|---|
| 51 | GET | `site-settings` | `site-settings.edit` | `SiteSetting\EditController` | — | `routes/web.php:227` |
| 52 | POST | `site-settings` | `site-settings.update` | `SiteSetting\UpdateController` | POST por multipart | `routes/web.php:229` |
| 53 | PATCH | `site-settings/layout` | `site-settings.layout` | `SiteSetting\UpdateLayoutController` | **segunda camada de autorização no FormRequest** (`authorize` exige `super_user`; `manage_site_settings` sozinho → 403) | `routes/web.php:233` |
| 54 | POST | `site-settings/banners` | `banners.store` | `Banner\StoreController` | — | `routes/web.php:238` |
| 55 | POST | `site-settings/banners/{banner}` | `banners.update` | `Banner\UpdateController` | POST por multipart | `routes/web.php:239` |
| 56 | DELETE | `site-settings/banners/{banner}` | `banners.destroy` | `Banner\DestroyController` | — | `routes/web.php:240` |
| 57 | POST | `site-settings/sellers` | `sellers.store` | `Seller\StoreController` | — | `routes/web.php:244` |
| 58 | PUT | `site-settings/sellers/{seller}` | `sellers.update` | `Seller\UpdateController` | PUT (sem upload) | `routes/web.php:245` |
| 59 | DELETE | `site-settings/sellers/{seller}` | `sellers.destroy` | `Seller\DestroyController` | — | `routes/web.php:246` |

Usuários, impersonação, papéis:

| # | Método | URI | Nome | Alvo | Autorização declarada | Caminho |
|---|---|---|---|---|---|---|
| 60 | **DELETE** | `users/impersonate` | `users.impersonate.stop` | `User\StopImpersonateController` | **só `auth`+`verified`+`EnsureTermsAccepted` — nenhum `can:`** | `routes/web.php:251` |
| 61 | GET | `users` | `users.index` | `User\IndexController` | `can:manage_users` + `EnsureUserManagement` (grupo l.257) | `routes/web.php:258` |
| 62 | GET | `users/create` | `users.create` | `User\CreateController` | idem | `routes/web.php:259` |
| 63 | POST | `users` | `users.store` | `User\StoreController` | idem | `routes/web.php:260` |
| 64 | GET | `users/{user}` | `users.show` | `User\ShowController` | idem | `routes/web.php:261` |
| 65 | GET | `users/{user}/edit` | `users.edit` | `User\EditController` | idem | `routes/web.php:262` |
| 66 | PUT | `users/{user}` | `users.update` | `User\UpdateController` | idem | `routes/web.php:263` |
| 67 | DELETE | `users/{user}` | `users.destroy` | `User\DestroyController` | idem | `routes/web.php:264` |
| 68 | PATCH | `users/{user}/toggle-active` | `users.toggle-active` | `User\ToggleActiveController` | idem | `routes/web.php:265` |
| 69 | GET | `users/{user}/permissions` | `users.permissions.show` | `User\ShowUserPermissionsController` | idem | `routes/web.php:268` |
| 70 | POST | `users/{user}/permissions/grant` | `users.permissions.grant` | `User\GrantPermissionController` | idem | `routes/web.php:269` |
| 71 | DELETE | `users/{user}/permissions/{permission}` | `users.permissions.revoke` | `User\RevokePermissionController` | idem | `routes/web.php:270` |
| 72 | POST | `users/{user}/impersonate` | `users.impersonate` | `User\StartImpersonateController` | `throttle:10,1`, `can:impersonate_users` | `routes/web.php:274` |
| 73 | REDIRECT | `/permissions` → `/permissions/roles` | — | `Route::redirect` | `can:manage_roles` (grupo l.280) | `routes/web.php:281` |
| 74 | GET | `/permissions/roles` | `role-permissions` | `PermissionRole\IndexController` | `can:manage_roles` | `routes/web.php:282` |
| 75 | PUT | `/permissions/roles/{role}` | `roles-permissions.update` | `PermissionRole\UpdateController` | `can:manage_roles` | `routes/web.php:286` |
| 76 | POST | `/users/{user}/assign-role` | `user.assign-role` | `PermissionRole\AssignRoleController` | `can:assign_roles` (grupo l.292) | `routes/web.php:293` |
| 77 | DELETE | `/users/{user}/revoke-role` | `user.revoke-role` | `PermissionRole\RevokeRoleController` | `can:assign_roles` | `routes/web.php:294` |
| 78 | POST | `/users/{user}/sync-permissions` | `user.sync-permissions` | `PermissionRole\SyncPermissionsController` | `can:manage_users` (na própria rota) | `routes/web.php:296` |

Observação de ordenação declarada no arquivo (padrão da casa, repetido 5×): literal antes de binding — `assinar/disponibilidade` antes de `assinar/{order}`; `items/studio*` e `items/ai-draft` antes de `items/{item}`; `categories/reorder` antes de `categories/{category}`; `users/impersonate` (#60) antes de `users/{user}`.

#### 2. Rotas — `routes/auth.php` (12 definições)

`declare(strict_types = 1)` presente. Comentário no topo: **não existe rota de registro público** (`register`) — equipe nasce por seed/provisioning e pela aba Usuários.

| Método | URI | Nome | Alvo | Pilha | Caminho |
|---|---|---|---|---|---|
| GET | `login` | `login` | `Auth\AuthenticatedSessionController@create` | `guest` | `routes/auth.php:19` |
| POST | `login` | *(sem nome)* | `Auth\AuthenticatedSessionController@store` | `guest` (**sem `throttle:` na rota**) | `routes/auth.php:22` |
| GET | `forgot-password` | `password.request` | `Auth\PasswordResetLinkController@create` | `guest` | `routes/auth.php:24` |
| POST | `forgot-password` | `password.email` | `Auth\PasswordResetLinkController@store` | `guest` (**sem `throttle:`**) | `routes/auth.php:27` |
| GET | `reset-password/{token}` | `password.reset` | `Auth\NewPasswordController@create` | `guest` | `routes/auth.php:30` |
| POST | `reset-password` | `password.store` | `Auth\NewPasswordController@store` | `guest` (**sem `throttle:`**) | `routes/auth.php:33` |
| GET | `verify-email` | `verification.notice` | `Auth\EmailVerificationPromptController` | `auth` | `routes/auth.php:38` |
| GET | `verify-email/{id}/{hash}` | `verification.verify` | `Auth\VerifyEmailController` | `auth`, `signed`, `throttle:6,1` | `routes/auth.php:40` |
| POST | `email/verification-notification` | `verification.send` | `Auth\EmailVerificationNotificationController@store` | `auth`, `throttle:6,1` | `routes/auth.php:44` |
| GET | `confirm-password` | `password.confirm` | `Auth\ConfirmablePasswordController@show` | `auth` | `routes/auth.php:47` |
| POST | `confirm-password` | *(sem nome)* | `Auth\ConfirmablePasswordController@store` | `auth` (**sem `throttle:`**) | `routes/auth.php:50` |
| POST | `logout` | `logout` | `Auth\AuthenticatedSessionController@destroy` | `auth` | `routes/auth.php:52` |

#### 3. Rotas — `routes/settings.php` (7 definições)

Grupo único `Route::middleware('auth')` — **sem `verified`, sem `EnsureTermsAccepted`**.

| Método | URI | Nome | Alvo | Caminho |
|---|---|---|---|---|
| REDIRECT | `settings` → `settings/profile` | — | `Route::redirect` | `routes/settings.php:11` |
| GET | `settings/profile` | `profile.edit` | `Settings\ProfileController@edit` | `routes/settings.php:13` |
| PATCH | `settings/profile` | `profile.update` | `Settings\ProfileController@update` | `routes/settings.php:14` |
| DELETE | `settings/profile` | `profile.destroy` | `Settings\ProfileController@destroy` | `routes/settings.php:15` |
| GET | `settings/password` | `password.edit` | `Settings\PasswordController@edit` | `routes/settings.php:17` |
| PUT | `settings/password` | `password.update` | `Settings\PasswordController@update` | `routes/settings.php:18` |
| GET | `settings/appearance` | `appearance` | **closure** (`Inertia::render('settings/appearance')`) | `routes/settings.php:20` |

#### 4. `routes/console.php` — agendamento (8 `Schedule::command` + 1 `Artisan::command`)

Padrão notável: **6 dos 8 agendamentos estão dentro de `if (Modo::enabled())`** — o schedule só existe quando o módulo está ligado.

| Comando | Cadência | Guarda de módulo | Caminho |
|---|---|---|---|
| `horizon:snapshot` | `everyFiveMinutes()` | — | `routes/console.php:12` |
| `metrics:prune` | `daily()` | `if (MetricsMode::live())` | `routes/console.php:16` |
| `metrics:monthly-report` | `monthlyOn(1, '08:00')` tz `America/Sao_Paulo`, `appendOutputTo(storage_path('logs/monthly-report.log'))` | `if (ReportMode::enabled())` | `routes/console.php:24` |
| `items:prune-drafts` | `daily()` | `if (AiStudioMode::enabled())` | `routes/console.php:32` |
| `ai:destravar` | `everyFiveMinutes()` | — (deliberado: estado preso precisa ser reparável com o módulo off) | `routes/console.php:38` |
| `items:prune-trashed` | `dailyAt('03:30')` | — | `routes/console.php:42` |
| `billing:evaluate` | `dailyAt('09:00')` tz `America/Sao_Paulo` | `if (BillingMode::enabled())` | `routes/console.php:45` |
| `signup:expire` | `dailyAt('08:30')` tz `America/Sao_Paulo` | `if (SignupMode::enabled())` | `routes/console.php:52` |
| `inspire` (`Artisan::command`) | — | — | `routes/console.php:55` |

Nenhum `->withoutOverlapping()`, `->onOneServer()` ou `->runInBackground()` no arquivo.

#### 5. Middlewares — `app/Http/Middleware/*` (15 arquivos)

Nenhum é registrado como **alias**; `bootstrap/app.php` não chama `$middleware->alias(...)` (grep por `alias|appendToGroup|prependToGroup|->api(` em `bootstrap/app.php`: zero linhas). Os `Ensure*` são aplicados **por FQCN direto na rota**.

| Middleware | O que faz | Registro / escopo | Caminho |
|---|---|---|---|
| `EnsureAiImageMode` | `abort_unless(AiImageMode::enabled(), 404)` | rota (#42) | `app/Http/Middleware/EnsureAiImageMode.php` |
| `EnsureAiIntakeMode` | `abort_unless(AiIntakeMode::enabled(), 404)` | rota (#34) | `app/Http/Middleware/EnsureAiIntakeMode.php` |
| `EnsureAiStudioMode` | `abort_unless(AiStudioMode::enabled(), 404)` | grupo de rota (#25–33) | `app/Http/Middleware/EnsureAiStudioMode.php` |
| `EnsureBillingMode` | `abort_unless(BillingMode::enabled(), 404)` | rota (#14) | `app/Http/Middleware/EnsureBillingMode.php` |
| `EnsureLandingMode` | `abort_unless(LandingMode::enabled(), 404)` | grupo (#5–6) **+ `prependToPriorityList` antes de `AuthenticatesRequests`** | `app/Http/Middleware/EnsureLandingMode.php` |
| `EnsureMetricsMode` | **único parametrizado**: `handle($r, $next, string $requirement = 'enabled')`; `'live'` → `MetricsMode::live()`, senão `MetricsMode::enabled()`; 404 | rotas (#15, #17 com `:live`) **+ prioridade antes de `auth`** | `app/Http/Middleware/EnsureMetricsMode.php` |
| `EnsureReportMode` | `abort_unless(ReportMode::enabled(), 404)` | rota (#16) **+ prioridade antes de `auth`** | `app/Http/Middleware/EnsureReportMode.php` |
| `EnsureSignupMode` | `abort_unless(SignupMode::enabled(), 404)` | grupo (#7–13) **+ prioridade antes de `auth`** | `app/Http/Middleware/EnsureSignupMode.php` |
| `EnsureTermsAccepted` | Gate click-wrap. Passa direto se: módulo off, `$user === null`, papel ≠ `OWNER`, sessão de impersonação (`ImpersonationService::isImpersonating()`), ou já existe `TermsAcceptance` da versão vigente. Senão grava `url.intended` **só em GET** e redireciona para `legal.accept.show` | grupo administrativo (#20–78), depois de `auth`/`verified` | `app/Http/Middleware/EnsureTermsAccepted.php` |
| `EnsureTermsMode` | `abort_unless(TermsMode::enabled(), 404)` | grupo (#18–19), **depois** de `auth`/`verified` (sem prioridade) | `app/Http/Middleware/EnsureTermsMode.php` |
| `EnsureUserManagement` | Gate de **plano**: `abort_if(config('vitrine.plan') === 'essencial' && !$isSuper, 404)`; `$isSuper` = `$request->user()?->role?->name === Roles::SUPER_USER->value`; plano vazio passa | grupo de rota junto com `can:manage_users` (#61–71) | `app/Http/Middleware/EnsureUserManagement.php` |
| `EnsureVitrineActive` | No-op se `!BillingMode::enabled()`; lê `SiteSetting::query()->first()`; se `isSuspended()` e o usuário **não** tem `manage_items`, devolve `view('errors.vitrine-suspended', …)` com **503 + header `Retry-After: 86400`** | grupo público (#1–3) e rota #17 | `app/Http/Middleware/EnsureVitrineActive.php` |
| `HandleAppearance` | `View::share('appearance', $request->cookie('appearance') ?? 'system')` | **grupo `web` (append)** | `app/Http/Middleware/HandleAppearance.php` |
| `HandleInertiaRequests` | `share()` das props globais (detalhe em §7) | **grupo `web` (append)** | `app/Http/Middleware/HandleInertiaRequests.php` |
| `RedirectDemoToCanonicalHost` | No-op se `!config('vitrine.demo.instance')`; se o host termina em `config('vitrine.demo.suffix')` e o case ativo (`Cache::get('demo:active_case')`) tem outro host, `redirect()->away('https://' . $canonical . $request->getRequestUri(), 302)` | **grupo `web` (prepend)** | `app/Http/Middleware/RedirectDemoToCanonicalHost.php` |

**Ausências verificadas** (grep por `Content-Security-Policy|SecurityHeaders|X-Frame-Options|Strict-Transport` em `app config bootstrap routes resources/views` @ `53d7d9a`: **zero linhas**): não existe middleware de headers de segurança/CSP/HSTS, nem `SetSensitiveCacheHeaders`, nem `EnsureUserIsActive`, nem `trustProxies` — os três primeiros existem no boilerplate (`app/Http/Middleware/SecurityHeaders.php`, `SetSensitiveCacheHeaders.php`, `EnsureUserIsActive.php` em `origin/main`).

#### 6. `bootstrap/app.php` e `bootstrap/providers.php`

`bootstrap/app.php` (`declare(strict_types = 1)`):

| Bloco | Conteúdo | Caminho |
|---|---|---|
| `withRouting` | `web: routes/web.php`, `commands: routes/console.php`, `health: '/up'`. **Sem `api:`, sem `channels:`, sem `then:`** | `bootstrap/app.php:20` |
| `encryptCookies` | `except: ['appearance']` | `bootstrap/app.php:27` |
| `validateCsrfTokens` | `except: ['m/e', 'webhooks/asaas', 'webhooks/asaas-signup', 'api/ops/signup-orders/*']` (4 entradas) | `bootstrap/app.php:33` |
| `prependToPriorityList` ×4 | `before: AuthenticatesRequests::class` para `EnsureMetricsMode`, `EnsureReportMode`, `EnsureLandingMode`, `EnsureSignupMode` — garante 404 antes do redirect de login | `bootstrap/app.php:45–70` |
| `web(prepend:)` | `RedirectDemoToCanonicalHost` | `bootstrap/app.php:72` |
| `web(append:)` | `HandleAppearance`, `HandleInertiaRequests`, `AddLinkHeadersForPreloadedAssets::using(5)` — cap de 5 no header `Link:` para não estourar `fastcgi_buffer_size` do nginx (502 em full-page logado) | `bootstrap/app.php:77` |
| `withExceptions` | **um único** `$exceptions->render(PostTooLargeException …)`: se `expectsJson()` → JSON 413 com mensagem própria; senão `back()->withErrors(['photos' => …])`. **Não há `$exceptions->respond(...)`, nem página de erro Inertia, nem tratamento de 419** | `bootstrap/app.php:88` |

`bootstrap/providers.php` — 2 entradas: `App\Providers\AppServiceProvider::class`, `App\Providers\HorizonServiceProvider::class`.

#### 7. Providers — `app/Providers/*` (2 arquivos)

`app/Providers/AppServiceProvider.php`:

| Método | O que faz |
|---|---|
| `register()` | 2 binds por interface, resolvidos por config sem deploy de código: `VisionAnalyzer` → `OpenAiAnalyzer` ou `GeminiAnalyzer` conforme `AiIntakeMode::provider()`; `BackgroundEditor` → `OpenAiBackgroundEditor` |
| `boot()` | orquestra 11 métodos privados, nesta ordem: `setupLogViewer`, `configModels`, `configCommands`, `configUrls`, `configDate`, `configActivitylog`, `configGates`, `configPolicies`, `configResources`, `configEvents`, `configRateLimiting` |
| `setupLogViewer()` | `LogViewer::auth(fn($request) => $request->user()?->hasRole(Roles::SUPER_USER))` |
| `configModels()` | `Model::shouldBeStrict()` — **incondicional** (sem guarda por ambiente) |
| `configCommands()` | `DB::prohibitDestructiveCommands(app()->isProduction())` |
| `configUrls()` | `URL::forceHttps()` se `app()->isProduction()` |
| `configDate()` | `Date::use(CarbonImmutable::class)` |
| `configActivitylog()` | `app(CauserResolver::class)->resolveUsing(fn() => ActivityCauserResolver::resolve())` |
| `configGates()` | loop sobre `Permissions::cases()` → `Gate::define($permission->value, …$user->hasPermissionTo(...))` (um gate por case do enum) |
| `configPolicies()` | `Gate::policy(User::class, UserPolicy::class)` — **única policy registrada** |
| `configResources()` | `JsonResource::withoutWrapping()` |
| `configEvents()` | `Event::listen(ImpersonateStarted → LogImpersonateStarted)`, `Event::listen(ImpersonateStopped → LogImpersonateStopped)` |
| `configRateLimiting()` | 4 limiters nomeados (tabela §9) |

**Não há** no provider: morph map (`Relation::enforceMorphMap`), política de senha (`Password::defaults`), `Vite::prefetch`, observers, `Sleep`/`Http::preventStrayRequests`.

`app/Providers/HorizonServiceProvider.php`: `boot()` chama `parent::boot()`; `gate()` define `Gate::define('viewHorizon', fn(?User $user) => $user?->hasRole(Roles::SUPER_USER) ?? false)`.

Middleware de props globais — `app/Http/Middleware/HandleInertiaRequests.php` (`$rootView = 'app'`), chaves de `share()`: `name`, `branding` (`name`, `logo_url`, `logo_dark_url`, `mark_url`, `favicon_url`), `quote`, `features` (`metrics_mode`, `metrics.insights_tier`, `ai_intake`, `ai_usage` (closure lazy), `ai_image`, `ai_image_usage` (closure lazy), `ai_studio`, `report`, `user_management`, `legal.{enabled,version}`, `signup`, `tracking`), `billing` (`status`, `invoice_url`; `null` com módulo off), `auth` (`user`, `permissions`, `roles`, `impersonating.{active,originalUserName,impersonatedUserName}`), `flash` (`success`, `error`, `warning`, `info`), `ziggy` (closure). Faz **uma query por request** (`SiteSetting::query()->first()`, leitura pura, sem `firstOrCreate`, com comentário explicando que não pode criar registro nem disparar activity log).

#### 8. `config/*` — 15 arquivos

Coluna "vs boilerplate `origin/main`" comparada por hash do conteúdo (comando em §Medições).

| Arquivo | vs boilerplate `origin/main` | O que muda na fonte |
|---|---|---|
| `config/vitrine.php` | **não existe no boilerplate** | Arquivo próprio do produto, ~380 linhas, 14 blocos (detalhe abaixo) |
| `config/app.php` | **DIFF** (2 linhas) | `locale` = `env('APP_LOCALE', 'en')` e `faker_locale` = `env('APP_FAKER_LOCALE', 'en_US')` — o boilerplate usa `pt_BR` / `pt_BR` nos dois defaults. **Fonte atrás do boilerplate** |
| `config/filesystems.php` | **DIFF** | disco `public`: `'url' => '/storage'` (relativa, de propósito) em vez de `env('APP_URL') . '/storage'`. Disco `s3`: acrescenta `'root' => env('AWS_ROOT', '')` (isolamento multi-instância por prefixo = slug), `'request_checksum_calculation'` e `'response_checksum_validation'` = `env('AWS_S3_CHECKSUM', 'when_required')` (compat Cloudflare R2 — aws-sdk-php ≥ 3.337 quebra com `not implemented`). **Fonte à frente** |
| `config/logging.php` | **DIFF** (4 linhas) | A fonte **não tem** `App\Support\Logging\PiiAwareTap` — o boilerplate declara `'tap' => [PiiAwareTap::class]` em 3 canais. **Fonte atrás** |
| `config/mail.php` | **DIFF** (20 linhas) | A fonte **não tem** o bloco `allowlist` / `test_inbox` (`MAIL_ALLOWLIST`, `MAIL_TEST_INBOX`) do boilerplate. **Fonte atrás** |
| `config/queue.php` | **DIFF** | `database.retry_after` default `180` (boilerplate: `90`) e `redis.retry_after` default `180` (boilerplate: `90`), com comentário: precisa ser maior que o maior `$timeout` de job (`ProcessPhotoBackground` = 120s), senão a fila reentrega e a chamada paga ao provider roda 2×. **Fonte à frente** |
| `config/activitylog.php` | idêntico | — |
| `config/auth.php` | idêntico | — |
| `config/cache.php` | idêntico | — |
| `config/database.php` | idêntico | — |
| `config/horizon.php` | idêntico | — |
| `config/inertia.php` | idêntico | — |
| `config/log-viewer.php` | idêntico | — |
| `config/services.php` | idêntico | (contém `postmark`, `ses`, `resend`, `slack.notifications`) |
| `config/session.php` | idêntico | — |

Estrutura de `config/vitrine.php` — chaves de topo, em ordem: `whatsapp`, `instagram`, `pix_key`, `pix_key_type`, `pix_name`, `pix_city`, `staff_password`, `admin.{name,email}`, `super_user.{email,name,password}`, `plan`, `default_layout`, `items.trash_retention_days`, `demo.{instance,suffix,cases}`, `metrics.{mode,retention_days,cache_ttl}`, `report.{mode,whatsapp}`, `ai_intake.{mode,provider,monthly_limit,max_photos,timeout,queued_timeout,store_niche,gemini.{key,model},openai.{key,model,price_in,price_out}}`, `ai_image.{mode,provider,monthly_limit,timeout,openai.{key,model,quality,size,price_per_image}}`, `ai_studio.{mode,auto_background,batch,draft_ttl_hours,stuck_after_minutes}`, `billing.{mode,webhook_token,subscription_id,grace_days,cycle,invoice_note}`, `landing.{mode,whatsapp,message}`, `legal.{mode,version,plan,receipt_bcc}`, `signup.{mode,asaas_token,asaas_env,webhook_token,notify_email,ops_token,order_ttl_days,turnstile_site,turnstile_secret,reserved_slugs}`, `tracking.{mode,pixel_id,capi_token,test_event_code,graph_version,timeout}`, `ops.{ploi.{token,server_id,repo,branch},client_suffix,provider_keys.{openai,gemini},mail.{resend_key,from},storage.{key,secret,bucket,endpoint,url},super_password,asaas.{token,env,base_urls.{sandbox,production}},signup.{url,token}}`.

Pontos estruturais de `config/vitrine.php` que valem registro (valores redigidos):
- `staff_password` tem **default literal em código**: `env('VITRINE_STAFF_PASSWORD', '***')`.
- `super_user.email` tem **default literal em código com e-mail real de pessoa**: `env('VITRINE_SUPER_EMAIL', '***')`; `super_user.password` = `env('VITRINE_SUPER_PASSWORD') ?: env('VITRINE_STAFF_PASSWORD')` (cadeia de fallback de senha).
- `demo.cases` é um mapa de 5 entradas `{seeder: Database\Seeders\Demo*Seeder::class, host: <subdomínio>}`: `garimpo`, `oticavisao`, `ctvitrine`, `manas`, `lulu` — referencia classes de seeder direto do config.
- `signup.reserved_slugs` é uma lista literal de 46 subdomínios reservados, declarada como superset da `RESERVED_SLUGS` do comando `instance:provision`.
- `legal.plan` reusa **a mesma env** de `plan` (`VITRINE_PLAN`), com comentário justificando a duplicação de leitura.
- `ai_intake.timeout` traz um teto duro documentado (20s, pior caso 42s com 2 retries, abaixo dos 60s do nginx) e um `queued_timeout` separado para o mesmo trabalho na fila.
- Todos os módulos seguem o mesmo contrato `mode: off|live` (métricas tem um terceiro estado `demo`), com "config parcial = off silencioso" resolvido em classes `*Mode` fora do config.

#### 9. Rate limiting

`RateLimiter::for` — 4 definições, todas em `app/Providers/AppServiceProvider.php` (método `configRateLimiting()`):

| Nome | Limite | Chave | Usado em | Caminho |
|---|---|---|---|---|
| `metrics-track` | `Limit::perMinute(60)` | `$request->ip()` | rota #17 (`POST m/e`) | `app/Providers/AppServiceProvider.php` |
| `ai-intake` | `Limit::perMinute(10)` | `$request->user()?->id` | rota #34 (`POST items/ai-draft`) | `app/Providers/AppServiceProvider.php` |
| `ai-image` | `Limit::perMinute(10)` | `$request->user()?->id` | rota #42 (`POST …/ai-background`) | `app/Providers/AppServiceProvider.php` |
| `ai-studio` | `Limit::perMinute(20)` | `$request->user()?->id` | rotas #27, #29, #30 | `app/Providers/AppServiceProvider.php` |

Todos os 15 usos de `throttle:` (comando em §Medições) — **11 com número literal, 4 com limiter nomeado**:

| Declaração | Tipo | Rota | Caminho |
|---|---|---|---|
| `throttle:6,1` | **literal** | `verification.verify` | `routes/auth.php:41` |
| `throttle:6,1` | **literal** | `verification.send` | `routes/auth.php:45` |
| `throttle:5,1` | **literal** | `signup.store` | `routes/web.php:64` |
| `throttle:20,1` | **literal** | `signup.slug` | `routes/web.php:68` |
| `throttle:30,1` | **literal** | `webhooks.asaas-signup` | `routes/web.php:73` |
| `throttle:30,1` | **literal** | `signup.ops.show` | `routes/web.php:79` |
| `throttle:30,1` | **literal** | `signup.ops.provisioned` | `routes/web.php:82` |
| `throttle:30,1` | **literal** | `webhooks.asaas` | `routes/web.php:91` |
| `throttle:metrics-track` | **nomeado** | `metrics.track` | `routes/web.php:115` |
| `throttle:ai-studio` | **nomeado** | `items.studio.drafts.store` | `routes/web.php:168` |
| `throttle:ai-studio` | **nomeado** | `items.studio.drafts.photos` | `routes/web.php:173` |
| `throttle:ai-studio` | **nomeado** | `items.studio.drafts.reanalyze` | `routes/web.php:177` |
| `throttle:ai-intake` | **nomeado** | `items.ai-draft` | `routes/web.php:189` |
| `throttle:ai-image` | **nomeado** | `items.photos.ai-background` | `routes/web.php:204` |
| `throttle:10,1` | **literal** | `users.impersonate` | `routes/web.php:275` |

Nenhuma rota de `POST login`, `POST forgot-password`, `POST reset-password` ou `POST confirm-password` declara `throttle:` (a proteção de login vem do `LoginRequest`/`RateLimiter` interno, fora do escopo desta frente).

#### 10. `.env.example` — chaves da fonte

`docs/migration`-style: **67 chaves ativas** + **69 chaves comentadas** = **136 chaves únicas** (nenhuma aparece nas duas formas). O arquivo é organizado por 4 "perfis de instância" (dev local / cliente / marketing / operador) e declara na cabeça a convenção `linha ATIVA` vs `linha COMENTADA`, além de "segredo nunca recebe valor aqui (guard G4 na suíte)".

Chaves **ativas** (67), na ordem do arquivo — `.env.example`:
`APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL`, `APP_LOCALE`, `APP_FALLBACK_LOCALE`, `APP_FAKER_LOCALE`, `APP_MAINTENANCE_DRIVER`, `PHP_CLI_SERVER_WORKERS`, `BCRYPT_ROUNDS`, `LOG_CHANNEL`, `LOG_STACK`, `LOG_DEPRECATIONS_CHANNEL`, `LOG_LEVEL`, `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `SESSION_DRIVER`, `SESSION_LIFETIME`, `SESSION_ENCRYPT`, `SESSION_PATH`, `SESSION_DOMAIN`, `BROADCAST_CONNECTION`, `FILESYSTEM_DISK`, `QUEUE_CONNECTION`, `REDIS_QUEUE_RETRY_AFTER`, `CACHE_STORE`, `MEMCACHED_HOST`, `REDIS_CLIENT`, `REDIS_HOST`, `REDIS_PASSWORD`, `REDIS_PORT`, `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `AWS_USE_PATH_STYLE_ENDPOINT`, `VITE_APP_NAME`, `VITRINE_WHATSAPP`, `VITRINE_INSTAGRAM`, `VITRINE_PIX_KEY`, `VITRINE_PIX_KEY_TYPE`, `VITRINE_PIX_NAME`, `VITRINE_PIX_CITY`, `VITRINE_STAFF_PASSWORD`, `VITRINE_ADMIN_NAME`, `VITRINE_ADMIN_EMAIL`, `VITRINE_PLAN`, `VITRINE_METRICS_MODE`, `VITRINE_METRICS_RETENTION_DAYS`, `VITRINE_TRASH_RETENTION_DAYS`, `PLOI_REPO`, `PLOI_BRANCH`, `VITRINE_CLIENT_SUFFIX`, `ASAAS_OPS_ENV`.

Chaves **comentadas** (69), na ordem do arquivo — `.env.example`:
`APP_MAINTENANCE_STORE`, `CACHE_PREFIX`, `VITRINE_SUPER_EMAIL`, `VITRINE_SUPER_NAME`, `VITRINE_SUPER_PASSWORD`, `VITRINE_DEFAULT_LAYOUT`, `VITRINE_REPORT_MODE`, `VITRINE_REPORT_WHATSAPP`, `VITRINE_AI_MODE`, `VITRINE_AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `VITRINE_AI_MONTHLY_LIMIT`, `VITRINE_AI_TIMEOUT`, `VITRINE_AI_QUEUED_TIMEOUT`, `VITRINE_AI_NICHE`, `VITRINE_AI_IMAGE_MODE`, `VITRINE_AI_IMAGE_PROVIDER`, `OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`, `OPENAI_IMAGE_SIZE`, `OPENAI_IMAGE_PRICE`, `VITRINE_AI_IMAGE_MONTHLY_LIMIT`, `VITRINE_AI_IMAGE_TIMEOUT`, `VITRINE_AI_STUDIO_MODE`, `VITRINE_AI_STUDIO_AUTO_BG`, `VITRINE_AI_STUDIO_BATCH`, `VITRINE_AI_STUDIO_DRAFT_TTL`, `VITRINE_AI_STUCK_MINUTES`, `VITRINE_BILLING_MODE`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_SUBSCRIPTION_ID`, `VITRINE_BILLING_GRACE_DAYS`, `VITRINE_BILLING_CYCLE`, `VITRINE_LANDING_MODE`, `VITRINE_LANDING_WHATSAPP`, `VITRINE_LANDING_MESSAGE`, `VITRINE_TERMS_MODE`, `VITRINE_TERMS_VERSION`, `VITRINE_TERMS_RECEIPT_EMAIL`, `VITRINE_SIGNUP_MODE`, `ASAAS_SIGNUP_TOKEN`, `ASAAS_SIGNUP_ENV`, `ASAAS_SIGNUP_WEBHOOK_TOKEN`, `VITRINE_SIGNUP_NOTIFY_EMAIL`, `VITRINE_SIGNUP_OPS_TOKEN`, `VITRINE_SIGNUP_ORDER_TTL_DAYS`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `VITRINE_TRACKING_MODE`, `META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_TEST_EVENT_CODE`, `VITRINE_DEMO_INSTANCE`, `VITRINE_DEMO_SUFFIX`, `PLOI_API_TOKEN`, `PLOI_SERVER_ID`, `RESEND_KEY`, `VITRINE_MAIL_FROM`, `VITRINE_R2_KEY`, `VITRINE_R2_SECRET`, `VITRINE_R2_BUCKET`, `VITRINE_R2_ENDPOINT`, `VITRINE_R2_URL`, `ASAAS_OPS_TOKEN`, `SIGNUP_OPS_URL`, `SIGNUP_OPS_TOKEN`.

Todas as chaves de segredo do arquivo (`*_TOKEN`, `*_KEY`, `*_SECRET`, `*_PASSWORD`) estão **sem valor** no `.env.example`. Uma exceção: o comentário de `VITRINE_SUPER_EMAIL` traz um e-mail real como default (redigido aqui como `***`).

Duas envs **lidas por `config/filesystems.php` mas ausentes do `.env.example`**: `AWS_ROOT` e `AWS_S3_CHECKSUM` (também `AWS_URL` e `AWS_ENDPOINT`, que existem no Laravel default mas não estão listadas no arquivo da fonte).

#### 11. DIFF de chaves `.env.example` — fonte vs boilerplate `origin/main`

Universo comparado: união de chaves ativas + comentadas dos dois arquivos. Fonte: **136** únicas. Boilerplate: **69** únicas (56 ativas + 13 comentadas). Interseção: **51**.

**Só na fonte (85)** — `.env.example` do ctvitrine:

| Bloco | Chaves |
|---|---|
| Infra (2) | `REDIS_QUEUE_RETRY_AFTER`, `RESEND_KEY` |
| Identidade da loja (10) | `VITRINE_WHATSAPP`, `VITRINE_INSTAGRAM`, `VITRINE_PIX_KEY`, `VITRINE_PIX_KEY_TYPE`, `VITRINE_PIX_NAME`, `VITRINE_PIX_CITY`, `VITRINE_STAFF_PASSWORD`, `VITRINE_ADMIN_NAME`, `VITRINE_ADMIN_EMAIL`, `VITRINE_DEFAULT_LAYOUT` |
| Super usuário / plano (4) | `VITRINE_SUPER_EMAIL`, `VITRINE_SUPER_NAME`, `VITRINE_SUPER_PASSWORD`, `VITRINE_PLAN` |
| Métricas + relatório (4) | `VITRINE_METRICS_MODE`, `VITRINE_METRICS_RETENTION_DAYS`, `VITRINE_REPORT_MODE`, `VITRINE_REPORT_WHATSAPP` |
| IA — intake (8) | `VITRINE_AI_MODE`, `VITRINE_AI_PROVIDER`, `VITRINE_AI_MONTHLY_LIMIT`, `VITRINE_AI_TIMEOUT`, `VITRINE_AI_QUEUED_TIMEOUT`, `VITRINE_AI_NICHE`, `GEMINI_API_KEY`, `GEMINI_MODEL` |
| IA — OpenAI (6) | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_IMAGE_MODEL`, `OPENAI_IMAGE_QUALITY`, `OPENAI_IMAGE_SIZE`, `OPENAI_IMAGE_PRICE` |
| IA — imagem (4) | `VITRINE_AI_IMAGE_MODE`, `VITRINE_AI_IMAGE_PROVIDER`, `VITRINE_AI_IMAGE_MONTHLY_LIMIT`, `VITRINE_AI_IMAGE_TIMEOUT` |
| IA — estúdio (5) | `VITRINE_AI_STUDIO_MODE`, `VITRINE_AI_STUDIO_AUTO_BG`, `VITRINE_AI_STUDIO_BATCH`, `VITRINE_AI_STUDIO_DRAFT_TTL`, `VITRINE_AI_STUCK_MINUTES` |
| Billing (5) | `VITRINE_BILLING_MODE`, `VITRINE_BILLING_GRACE_DAYS`, `VITRINE_BILLING_CYCLE`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_SUBSCRIPTION_ID` |
| Landing (3) | `VITRINE_LANDING_MODE`, `VITRINE_LANDING_WHATSAPP`, `VITRINE_LANDING_MESSAGE` |
| Legal (3) | `VITRINE_TERMS_MODE`, `VITRINE_TERMS_VERSION`, `VITRINE_TERMS_RECEIPT_EMAIL` |
| Signup (10) | `VITRINE_SIGNUP_MODE`, `VITRINE_SIGNUP_NOTIFY_EMAIL`, `VITRINE_SIGNUP_OPS_TOKEN`, `VITRINE_SIGNUP_ORDER_TTL_DAYS`, `ASAAS_SIGNUP_TOKEN`, `ASAAS_SIGNUP_ENV`, `ASAAS_SIGNUP_WEBHOOK_TOKEN`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `SIGNUP_OPS_URL` (+`SIGNUP_OPS_TOKEN`, contado em ops) |
| Tracking Meta (4) | `VITRINE_TRACKING_MODE`, `META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_TEST_EVENT_CODE` |
| Demo (2) | `VITRINE_DEMO_INSTANCE`, `VITRINE_DEMO_SUFFIX` |
| Higiene (1) | `VITRINE_TRASH_RETENTION_DAYS` |
| Ops — provisioning (5) | `PLOI_API_TOKEN`, `PLOI_SERVER_ID`, `PLOI_REPO`, `PLOI_BRANCH`, `VITRINE_CLIENT_SUFFIX` |
| Ops — mail/storage/asaas (9) | `VITRINE_MAIL_FROM`, `VITRINE_R2_KEY`, `VITRINE_R2_SECRET`, `VITRINE_R2_BUCKET`, `VITRINE_R2_ENDPOINT`, `VITRINE_R2_URL`, `ASAAS_OPS_TOKEN`, `ASAAS_OPS_ENV`, `SIGNUP_OPS_TOKEN` |

**Só no boilerplate (18)** — ausentes do `.env.example` da fonte:

| Chave | Bloco |
|---|---|
| `TRUSTED_PROXIES` | infra atrás de LB/CDN (usada em `bootstrap/app.php` do boilerplate) |
| `SESSION_SAME_SITE` | sessão |
| `SESSION_SECURE_COOKIE` | sessão |
| `INERTIA_SSR_ENABLED` | Inertia SSR |
| `INERTIA_SSR_URL` | Inertia SSR |
| `INERTIA_SSR_RUNTIME` | Inertia SSR |
| `INERTIA_ENCRYPT_HISTORY` | Inertia |
| `HORIZON_PATH` | Horizon |
| `HORIZON_NAME` | Horizon |
| `HORIZON_DOMAIN` | Horizon |
| `HORIZON_PREFIX` | Horizon |
| `LOG_VIEWER_ENABLED` | log-viewer |
| `LOG_VIEWER_API_ONLY` | log-viewer |
| `LOG_VIEWER_API_STATEFUL_DOMAINS` | log-viewer |
| `LOG_VIEWER_CACHE_DRIVER` | log-viewer |
| `LOG_VIEWER_PRODUCTION_TOKEN` | log-viewer |
| `ACTIVITYLOG_ENABLED` | activitylog |
| `ACTIVITYLOG_BUFFER_ENABLED` | activitylog |

Observação factual: `config/horizon.php`, `config/log-viewer.php` e `config/activitylog.php` da fonte são **byte-idênticos** aos do boilerplate (§8) — logo essas 11 envs de Horizon/log-viewer/activitylog **são lidas pelo código da fonte**, apenas não estão documentadas no `.env.example` dela.

---

#### Medições

Todos os comandos abaixo foram executados; `$SRC = /Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `$BP = /Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`.

```bash
# 4 arquivos em routes/ · 15 middlewares · 15 configs · 2 providers
git -C $SRC ls-tree -r 53d7d9a --name-only -- routes            | wc -l   # 4
git -C $SRC ls-tree -r 53d7d9a --name-only -- app/Http/Middleware | wc -l # 15
git -C $SRC ls-tree -r 53d7d9a --name-only -- config            | wc -l   # 15
git -C $SRC ls-tree -r 53d7d9a --name-only -- app/Providers     | wc -l   # 2
git -C $SRC ls-tree -r 53d7d9a --name-only -- app/Http/Middleware | grep -c '/Ensure'  # 12
git -C $SRC ls-tree -r 53d7d9a --name-only -- config | grep -c vitrine     # 1

# 97 definições de rota (78 + 12 + 7)
git -C $SRC show 53d7d9a:routes/web.php      | grep -cE '^\s*Route::(get|post|put|patch|delete|redirect)\('  # 78
git -C $SRC show 53d7d9a:routes/auth.php     | grep -cE '^\s*Route::(get|post|put|patch|delete|redirect)\('  # 12
git -C $SRC show 53d7d9a:routes/settings.php | grep -cE '^\s*Route::(get|post|put|patch|delete|redirect)\('  # 7

# quebra por verbo (web.php): get 29 · post 26 · put 5 · patch 5 · delete 12 · redirect 1
for v in get post put patch delete redirect; do \
  git -C $SRC show 53d7d9a:routes/web.php | grep -cE "^\s*Route::$v\("; done

# 48 rotas de ESCRITA em web.php
git -C $SRC show 53d7d9a:routes/web.php | grep -cE "^\s*Route::(post|put|patch|delete)\("   # 48

# 15 throttle: (13 web + 2 auth) e as 15 linhas com número de linha
git -C $SRC grep -c "throttle:" 53d7d9a -- routes          # web.php:13, auth.php:2
git -C $SRC grep -n "throttle:" 53d7d9a -- app routes bootstrap config

# 4 RateLimiter::for
git -C $SRC grep -c "RateLimiter::for" 53d7d9a -- app      # AppServiceProvider.php:4

# 8 Schedule::command
git -C $SRC show 53d7d9a:routes/console.php | grep -cE "^\s*Schedule::command"   # 8

# ausência de CSP / headers de segurança: zero linhas
git -C $SRC grep -ni "Content-Security-Policy\|SecurityHeaders\|X-Frame-Options\|Strict-Transport" \
  53d7d9a -- app config bootstrap routes resources/views

# ausência de aliases / grupo api no bootstrap: zero linhas
git -C $SRC grep -n "alias\|appendToGroup\|prependToGroup\|->api(" 53d7d9a -- bootstrap/app.php

# config: idêntico vs DIFF (hash do conteúdo, fonte@53d7d9a vs boilerplate@origin/main)
for f in config/activitylog.php config/app.php config/auth.php config/cache.php \
         config/database.php config/filesystems.php config/horizon.php config/inertia.php \
         config/log-viewer.php config/logging.php config/mail.php config/queue.php \
         config/services.php config/session.php; do \
  a=$(git -C $SRC show 53d7d9a:$f | shasum | cut -c1-10); \
  b=$(git -C $BP show origin/main:$f | shasum | cut -c1-10); \
  [ "$a" = "$b" ] && echo "SAME  $f" || echo "DIFF  $f"; done
# → SAME: activitylog, auth, cache, database, horizon, inertia, log-viewer, services, session
# → DIFF: app, filesystems, logging, mail, queue
# conteúdo de cada DIFF obtido com:
diff <(git -C $BP show origin/main:$f) <(git -C $SRC show 53d7d9a:$f)

# .env.example — chaves ativas e comentadas
git -C $SRC show 53d7d9a:.env.example | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | cut -d= -f1 | wc -l          # 67
git -C $SRC show 53d7d9a:.env.example | grep -E '^# *[A-Z][A-Z0-9_]*='   | sed -E 's/^# *([A-Z0-9_]+)=.*/\1/' | wc -l   # 69
git -C $BP  show origin/main:.env.example | grep -E '^[A-Za-z_][A-Za-z0-9_]*=' | cut -d= -f1 | wc -l      # 56
git -C $BP  show origin/main:.env.example | grep -E '^# *[A-Z][A-Z0-9_]*=' | sed -E 's/^# *([A-Z0-9_]+)=.*/\1/' | wc -l # 13

# DIFF de chaves (união ativas+comentadas, ordenada e deduplicada em src_all.txt / bp_all.txt)
sort -u src_all.txt | wc -l   # 136
sort -u bp_all.txt  | wc -l   # 69
comm -23 src_all.txt bp_all.txt | wc -l   # 85  (só na fonte)
comm -13 src_all.txt bp_all.txt | wc -l   # 18  (só no boilerplate)
comm -12 src_all.txt bp_all.txt | wc -l   # 51  (em ambos)
```

---

### Frente 2 — Controllers, Form Requests, Rules, Policies, Resources (ctvitrine @ `53d7d9a`)

Escopo lido: `app/Http/Controllers/**`, `app/Http/Requests/**`, `app/Rules/*`, `app/Policies/*`, `app/Http/Resources/*`, mais `routes/web.php`, `routes/auth.php` e `routes/settings.php` (para atribuir o gate real de cada controller) e `app/Traits/Requests/*` (traits usadas por Form Requests).

---

#### 1. Controllers — visão geral

**86 arquivos** em `app/Http/Controllers/**` (excluindo a base `app/Http/Controllers/Controller.php`), dos quais **79 são single-action invokable** e **7 são multi-método**. A base é `abstract class Controller` com apenas `use AuthorizesRequests` (`app/Http/Controllers/Controller.php`) — sem `ValidatesRequests`, sem trait de resposta.

Os 7 multi-método (todos herdados do scaffold Breeze/starter, nenhum de domínio):

| Caminho | Métodos |
|---|---|
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | `create`, `store`, `destroy` |
| `app/Http/Controllers/Auth/ConfirmablePasswordController.php` | `show`, `store` |
| `app/Http/Controllers/Auth/EmailVerificationNotificationController.php` | `store` |
| `app/Http/Controllers/Auth/NewPasswordController.php` | `create`, `store` |
| `app/Http/Controllers/Auth/PasswordResetLinkController.php` | `create`, `store` |
| `app/Http/Controllers/Settings/PasswordController.php` | `edit`, `update` |
| `app/Http/Controllers/Settings/ProfileController.php` | `edit`, `update`, `destroy` |

Todo o resto do domínio (Banner, Category, Docs, Item, Item/Studio, Legal, Metrics, PermissionRole, Seller, Signup, Site, SiteSetting, User, Webhook) é single-action `__invoke()`.

---

#### 2. Controllers — tabela exaustiva

Legenda da coluna **Authz no controller**: `—` = nenhuma checagem de autorização dentro do controller (o gate é 100% de rota e/ou do `authorize()` do FormRequest). `abort_*` marcado quando é guard de *pertencimento/estado*, não de permissão.

##### 2.1 Auth (7)

| Caminho | Forma | FormRequest / validação | Serviço / query | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | multi | `Auth\LoginRequest` (store) | `Auth::guard('web')` | `create`→`Inertia::render('auth/login')` props `canResetPassword`,`status`; `store`→`redirect()->intended(route('dashboard'))`; `destroy`→`redirect('/')` | — | `guest` (create/store) / `auth` (destroy) |
| `app/Http/Controllers/Auth/ConfirmablePasswordController.php` | multi | inline `Auth::guard('web')->validate` + `ValidationException` | — | `show`→`Inertia::render('auth/confirm-password')` (sem props); `store`→`redirect()->intended` | — | `auth` |
| `app/Http/Controllers/Auth/EmailVerificationNotificationController.php` | multi (`store`) | — | `$request->user()->sendEmailVerificationNotification()` | `back()->with('status','verification-link-sent')` ou `redirect()->intended` | — | `auth` + `throttle:6,1` |
| `app/Http/Controllers/Auth/EmailVerificationPromptController.php` | invokable | — | — | `Inertia::render('auth/verify-email')` prop `status`, ou `redirect()->intended` | — | `auth` |
| `app/Http/Controllers/Auth/NewPasswordController.php` | multi | **inline**: `token=required`, `email=required\|email`, `password=[required, confirmed, Rules\Password::defaults()]` | `Password::reset` | `create`→`Inertia::render('auth/reset-password')` props `email`,`token`; `store`→`to_route('login')` ou `ValidationException` | — | `guest` |
| `app/Http/Controllers/Auth/PasswordResetLinkController.php` | multi | **inline**: `email=required\|email` | `Password::sendResetLink` | `create`→`Inertia::render('auth/forgot-password')` prop `status`; `store`→`back()->with('status', …)` — mensagem neutra ("A reset link will be sent if the account exists.") | — | `guest` |
| `app/Http/Controllers/Auth/VerifyEmailController.php` | invokable | `EmailVerificationRequest` (framework) | — | `redirect()->intended(dashboard.'?verified=1')` | — | `auth` + `signed` + `throttle:6,1` |

##### 2.2 Banner (3)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Banner/StoreController.php` | invokable | `Banner\StoreBannerRequest` | `ContentImageService::store($image,'banners')` | `back()->with('success', …)` | — | `can:manage_site_settings` |
| `app/Http/Controllers/Banner/UpdateController.php` | invokable | `Banner\UpdateBannerRequest` | `ContentImageService::replace` | `back()->with('success', …)` | — | `can:manage_site_settings` |
| `app/Http/Controllers/Banner/DestroyController.php` | invokable | **nenhum** | `ContentImageService::forget` | `back()->with('success', …)` | — | `can:manage_site_settings` |

Padrão notável: `image_path` fora do `$fillable`, escrito por `forceFill` — arquivo nunca vem de mass assignment (comentado em `StoreController.php` e `UpdateController.php`).

##### 2.3 Category (7)

| Caminho | Forma | FormRequest | Serviço / query | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Category/IndexController.php` | invokable | — | `Category::withCount('items')->orderBy('position')->orderBy('name')` | `Inertia::render('categories/index')` prop `categories[]` = `{id,name,slug,position,is_active,items_count,image_url}` | — | `can:manage_items` |
| `app/Http/Controllers/Category/StoreController.php` | invokable | `Category\StoreCategoryRequest` | `Category::create` + `Category::max('position')+1` | `redirect()->route('categories.index')` | — | `can:manage_items` |
| `app/Http/Controllers/Category/UpdateController.php` | invokable | `Category\UpdateCategoryRequest` | `$category->update` (slug imutável) | `redirect()->route('categories.index')` | — | `can:manage_items` |
| `app/Http/Controllers/Category/DestroyController.php` | invokable | **nenhum** | guard `items()->withTrashed()->exists()`; `ContentImageService::forget` | `redirect()->route('categories.index')` com `error` ou `success` | — | `can:manage_items` |
| `app/Http/Controllers/Category/ReorderController.php` | invokable | `Category\ReorderCategoriesRequest` | `DB::transaction` + `Category::whereKey()->update(['position'=>…])` | `redirect()->route('categories.index')` | — | `can:manage_items` |
| `app/Http/Controllers/Category/UpdateImageController.php` | invokable | `Category\UpdateCategoryImageRequest` | `ContentImageService::replace(…,'categories')` + `forceFill` | `back()->with('success', …)` | — | `can:manage_items` |
| `app/Http/Controllers/Category/RemoveImageController.php` | invokable | **nenhum** | `ContentImageService::forget` + `forceFill(['image_path'=>null])` | `back()->with('success', …)` | — | `can:manage_items` |

##### 2.4 Docs (2)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Docs/IndexController.php` | invokable | — | `Docs\DocsRepository::first('usuario')` | `abort_if(null,404)` → `redirect()->route('docs.show', ['group'=>'usuario','page'=>…])` | `abort_if` (404) | `auth`+`verified`+`EnsureTermsAccepted` |
| `app/Http/Controllers/Docs/ShowController.php` | invokable | — | `DocsRepository::exists/render/accessibleTree` | `Inertia::render('docs/show')` props `tree`, `current`={`group`,`page`,`title`}, `html` | **sim, artesanal**: `abort_unless(in_array($group,$accessible),403)` + `abort_unless($docs->exists(),404)`; grupo `tecnico` só com `$request->user()?->hasRole(Roles::SUPER_USER)` | `auth`+`verified`+`EnsureTermsAccepted`; `where('group','usuario\|tecnico')`, `where('page','[a-z0-9-]+')` |

##### 2.5 Item — cadastro manual (12)

| Caminho | Forma | FormRequest / validação | Serviço / query | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Item/IndexController.php` | invokable | — (filtros lidos crus do `Request`) | `Item::notDraft()->with(['photos','category'])` + filtros `search`/`status`/`category` + `paginate($request->get('per_page',15))` | `Inertia::render('items/index')` props `items[]`, `categories`, `conditions`, `statuses`, `filters`, `pagination`={`current_page`,`last_page`,`per_page`,`total`} | — | `can:manage_items` |
| `app/Http/Controllers/Item/CreateController.php` | invokable | — | `Category::adminOptions()`, `ItemCondition::options()`, `ItemStatus::options()` | `Inertia::render('items/create')` props `categories`,`conditions`,`statuses` | — | `can:manage_items` |
| `app/Http/Controllers/Item/StoreController.php` | invokable | `Item\StoreItemRequest` | `ItemPhotoService::storePhotos` | `redirect()->route('items.index')` | — | `can:manage_items` |
| `app/Http/Controllers/Item/EditController.php` | invokable | — | `$item->load(['photos','category'])`; `categoryOptions()` privado (ativas + a inativa do próprio item, rotulada "(inativa)") | `Inertia::render('items/edit')` props `item`={`id`,`name`,`description`,`price`,`original_price`,`category_id`,`condition`,`size`,`colors`,`status`,`is_published`,`is_featured`,`photos[]`={`id`,`url`,`position`,`ai_status`,`original_url`,`has_ai_edit`}}, `categories`,`conditions`,`statuses` | — | `can:manage_items` |
| `app/Http/Controllers/Item/UpdateController.php` | invokable | `Item\UpdateItemRequest` | `ItemPhotoService::storePhotos`; guard `photos()->count()+count($photos) > 8` | `redirect()->back()->withErrors(['photos'=>…])->withInput()` ou `redirect()->route('items.index')` | — | `can:manage_items` |
| `app/Http/Controllers/Item/UpdateStatusController.php` | invokable | **inline**: `status = ['required', Rule::enum(ItemStatus::class)]` | `$item->update` | `back()->with('success', "Status alterado para …")` | — | `can:manage_items` |
| `app/Http/Controllers/Item/ToggleFeaturedController.php` | invokable | **nenhuma** | `$item->update(['is_featured'=>!…])` | `back()->with('success', …)` | — | `can:manage_items` |
| `app/Http/Controllers/Item/DestroyController.php` | invokable | **nenhum** | `$item->delete()` (soft) | `redirect()->route('items.index')` | — | `can:manage_items` |
| `app/Http/Controllers/Item/DestroyPhotoController.php` | invokable | **nenhum** | `ItemPhotoService::deletePhoto` | `back()->with('success', …)` | `abort(404)` se `photo->item_id !== item->id` | `can:manage_items` |
| `app/Http/Controllers/Item/AiDraftController.php` | invokable | `Item\AiDraftRequest` | `AiIntake\VisionAnalyzer::analyze`, `AiUsage::limitReached/snapshot`, `AiAnalysis::create` (auditoria sempre), `Category::active()` | **JSON**: 200 `{draft, usage}`; 422 `{message}` (limite / refused / failed). Erro real só no `Log::warning` | — | `EnsureAiIntakeMode` + `throttle:ai-intake` + `can:manage_items` |
| `app/Http/Controllers/Item/AiBackgroundController.php` | invokable | **nenhum** (`Request` cru) | `AiImageUsage::limitReached`, `ProcessPhotoBackground::dispatch`; janela de "preso" via `config('vitrine.ai_studio.stuck_after_minutes',10)` | **`RedirectResponse\|JsonResponse` por `wantsJson()`**: JSON `{ok:true}` / `{ok:false,message}` 422; ou `back()->with('info'/'error')` | `abort_unless($photo->item_id === $item->id, 404)` | `EnsureAiImageMode` + `throttle:ai-image` + `can:manage_items` |
| `app/Http/Controllers/Item/RevertBackgroundController.php` | invokable | **nenhum** | `Storage::delete`, `$photo->update` | `RedirectResponse\|JsonResponse` por `wantsJson()` | `abort_unless($photo->item_id === $item->id, 404)` | `can:manage_items` (sem `EnsureAiImageMode` — desfazer funciona com o módulo off) |

##### 2.6 Item/Studio — cadastro IA-first (9)

| Caminho | Forma | FormRequest | Serviço / query | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Item/Studio/ShowController.php` | invokable | — | `Item::drafts()->with(['photos','category'])->orderByDesc('drafted_at')`; `AiStudio\DraftPresenter::collection`; `AiStudioMode::batchEnabled/backgroundAvailable` | `Inertia::render('items/studio')` props `drafts[]`, `categories`, `conditions`, `batch`, `backgroundAvailable` | — | `EnsureAiStudioMode` + `can:manage_items` |
| `app/Http/Controllers/Item/Studio/StateController.php` | invokable | — | mesma query de drafts + `AiUsage::snapshot`, `AiImageUsage::snapshot` | **JSON** `{drafts, ai_usage, ai_image_usage}` (polling) | — | idem |
| `app/Http/Controllers/Item/Studio/StoreDraftController.php` | invokable | `Item\Studio\StoreDraftRequest` | `ItemPhotoService::storePhotos`, `AiStudio\DraftDispatcher::dispatch`, `DraftPresenter` | **JSON 201** `{draft, ai_usage, ai_image_usage}` | — | idem + `throttle:ai-studio` |
| `app/Http/Controllers/Item/Studio/AddDraftPhotosController.php` | invokable | `Item\Studio\StoreDraftRequest` (reuso) | `ItemPhotoService::storePhotos`, `DraftDispatcher::backgrounds` | **JSON** `{draft, ai_image_usage}`; 422 `{ok:false,message}` no teto de 8 fotos | `abort_unless($item->isDraft(),404)` | idem + `throttle:ai-studio` |
| `app/Http/Controllers/Item/Studio/UpdateDraftController.php` | invokable | `Item\Studio\SaveDraftRequest` | `forceFill(...)->saveQuietly()` | **JSON** `{ok:true}` | `abort_unless($item->isDraft(),404)` | idem |
| `app/Http/Controllers/Item/Studio/ReanalyzeDraftController.php` | invokable | **nenhum** | `DraftDispatcher::analyzeFields`, `AiUsage::limitReached/snapshot`, `DraftPresenter` | **JSON** `{draft, ai_usage}`; 422 `{message}` no limite | `abort_unless($item->isDraft(),404)` | idem + `throttle:ai-studio` |
| `app/Http/Controllers/Item/Studio/PublishDraftController.php` | invokable | `Item\Studio\PublishDraftRequest` | `forceFill` + `save()` (com eventos, para o activity log) | **JSON** `{ok:true, id, redirect: route('items.index')}` | `abort_unless($item->isDraft(),404)` | idem |
| `app/Http/Controllers/Item/Studio/ConvertToManualController.php` | invokable | **nenhum** | fallback `Category::active()->orderBy('position')->value('id')`; `forceFill` normalizando `condition`/`category_id` | **JSON** `{ok:true, redirect: route('items.edit',$item)}`; 422 `{message}` se não há categoria | `abort_unless($item->isDraft(),404)` | idem |
| `app/Http/Controllers/Item/Studio/DiscardDraftController.php` | invokable | **nenhum** | `ItemPhotoService::deleteAllPhotos`, `disableLogging()`, `forceDelete()` | **JSON** `{ok:true}` | `abort_unless($item->isDraft(),404)` | idem |

Shape de `draft` (compartilhado entre a página Inertia e o polling) definido em `app/Services/AiStudio/DraftPresenter.php`: `{id,name,description,price,original_price,category_id,condition,size,is_published,ai_intake_status,drafted_at,photos[]={id,url,position,ai_status,original_url,has_ai_edit}}`.

##### 2.7 Legal (2)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Legal/ShowAcceptController.php` | invokable | — | `TermsAcceptance` query por `user_id`+`document`+`version`; `Legal\TermsDocument::htmlForPlan`, `TermsMode::version/plan` | `Inertia::render('legal/accept')` props `title`,`html`,`version`,`updatedAt`,`acceptedAt` | — | `auth`+`verified`+`EnsureTermsMode` |
| `app/Http/Controllers/Legal/StoreAcceptController.php` | invokable | `Legal\StoreAcceptRequest` | `TermsAcceptance` idempotente por versão; `TermsDocument::hash`; `Mail::to(...)->queue(TermsAcceptanceReceiptMail)` + bcc opcional; `SiteSetting::query()->first()` (leitura pura) | `redirect()->intended(route('dashboard'))->with('success', …)` | — | idem |

Trilha inteira derivada no servidor (`version`, `document_hash`, `ip`, `user_agent` truncado em 255, `accepted_at`) via `forceFill` — nada do request.

##### 2.8 Metrics (3)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Metrics/ShowController.php` | invokable | — (query `?periodo` normalizada por `MetricsMode::resolvePeriod`, sem 404) | `Metrics\MetricsQueryService::payload` ou `Metrics\DemoPayload::make` | `Inertia::render('metrics/index')` prop `payload` | **`Gate::authorize()` dinâmico**: `Permissions::VIEW_METRICS` em live, `Permissions::MANAGE_ROLES` em demo | `EnsureMetricsMode` + `auth` + `verified` |
| `app/Http/Controllers/Metrics/ShowReportController.php` | invokable | `Metrics\ShowReportRequest` | `MonthlyReport::build`, `MonthlyReportText::render`, `ReportCalendar::anchor/available`, `SiteSetting::query()->first()` | `Inertia::render('metrics/report')` props `report`,`text`,`months`,`month`,`whatsapp` | `Gate::authorize(Permissions::VIEW_METRICS->value)` | `EnsureReportMode` + `auth` + `verified` |
| `app/Http/Controllers/Metrics/TrackController.php` | invokable | `Metrics\TrackEventRequest` | `SessionHasher::hash`, `SourceClassifier::classify`, `MetricEvent::create` dentro de `try/catch` + `report()` | **`response()->noContent()` (204) sempre** — inclusive para bot (regex `BOT_PATTERN`) e UA vazio | — (endpoint público) | `EnsureMetricsMode:live` + `EnsureVitrineActive` + `throttle:metrics-track` |

##### 2.9 PermissionRole (5)

| Caminho | Forma | FormRequest / validação | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/PermissionRole/IndexController.php` | invokable (classe **não** `final`, sem `declare(strict_types)`) | — | `RoleFilterService::getVisibleRolesForCurrentSession/getAssignableRolesForCurrentSession`; `RoleResource::toArrayCollection`; `UserResource::collection`; `Permission::all()` | **`inertia('permission-role/roles', …)`** (único helper `inertia()` do projeto) props `roles` (map por `name`→`{id,label,permissions,users}`), `assignableRoles`, `permissions` | `$this->authorize('manage_roles')` | `can:manage_roles` |
| `app/Http/Controllers/PermissionRole/UpdateController.php` | invokable (não `final`, sem strict_types) | `PermissionRole\UpdateRolePermissionsRequest` | `Permission::getIdsFromNames`, `sync`, `Cache::forget/rememberForever("role:{id}:permissions")`, invalidação por `chunkById(500)` de `user:{id}:permissions` e `:roles` | `redirect()->back()->with('success', …)` | `abort_unless(in_array($roleName, $allowedRoleNames), 404)` (whitelist do enum `Roles`) | `can:manage_roles` |
| `app/Http/Controllers/PermissionRole/AssignRoleController.php` | invokable | **inline**: `role = ['required','exists:roles,name', Rule::in($allowedRoleNames)]` | `RoleFilterService::getAssignableRoles`, `ImpersonationService::getOriginalUser/isImpersonating`, `Cache::forget`, `Broadcast::event(RoleUserUpdatedEvent)` | `redirect()->back()->withErrors(['error'=>…])` (5 caminhos de negação) ou `->with('success', …)` | **artesanal, sem Gate/policy**: `abort(401)` sem user; `hasPermissionTo('assign_roles')`; só SUPER_USER atribui SUPER_USER; auto-atribuição bloqueada; comparação de `getPriority()`; whitelist `assignableRoles` | `can:assign_roles` |
| `app/Http/Controllers/PermissionRole/RevokeRoleController.php` | invokable | **nenhuma** (nada do request é validado) | mesmos serviços; alvo fixo `Roles::VISITOR` | `redirect()->back()->withErrors` ou `->with(['success'=>…,'role'=>…])` | artesanal, idem (401, `assign_roles`, auto-revogação, `assignableRoles`) | `can:assign_roles` |
| `app/Http/Controllers/PermissionRole/SyncPermissionsController.php` | invokable | **inline**: `permissions=['nullable','array']`, `permissions.*=['required','exists:permissions,name']` | `Permission::getIdsFromNames`, `$user->permissions()->sync`, `Cache::forget("user:{id}:permissions")` | `redirect()->back()->with('success', …)` | `Gate::authorize('managePermissions', $user)` | `can:manage_users` |

Divergência de "quem manda": o gate de rota é `can:manage_users`, mas a ability de policy verificada é `managePermissions` (que exige `manage_permissions`) — dois nomes de permissão diferentes na mesma requisição.

##### 2.10 Seller (3)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Seller/StoreController.php` | invokable | `Seller\StoreSellerRequest` | `Seller::create($request->validated())` | `back()->with('success','Vendedora cadastrada!')` | — | `can:manage_site_settings` |
| `app/Http/Controllers/Seller/UpdateController.php` | invokable | `Seller\UpdateSellerRequest` | `$seller->update` | `back()->with('success', …)` | — | idem |
| `app/Http/Controllers/Seller/DestroyController.php` | invokable | **nenhum** | `$seller->delete()` | `back()->with('success','Vendedora removida.')` | — | idem |

##### 2.11 Settings (2)

| Caminho | Forma | FormRequest / validação | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Settings/ProfileController.php` | multi | `Settings\ProfileUpdateRequest` (update); **inline** `password=['required','current_password']` (destroy) | `Auth::logout`, `$user->delete()` | `edit`→`Inertia::render('settings/profile')` props `mustVerifyEmail`,`status`; `update`→`to_route('profile.edit')`; `destroy`→`redirect('/')` | — | `auth` |
| `app/Http/Controllers/Settings/PasswordController.php` | multi | **inline**: `current_password=['required','current_password']`, `password=['required',Password::defaults(),'confirmed']` | `Hash::make` | `edit`→`Inertia::render('settings/password')` props `mustVerifyEmail`,`status`; `update`→`back()` | — | `auth` |

##### 2.12 Signup — checkout self-service (7)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Signup/ShowSignupController.php` | invokable | — (query `plano`/`ciclo`/`ref` sanitizada inline; `ref` truncado em 60) | `Ops\PlanMap`, `Signup\SignupService::price/setupFee`, `Ops\OpsConfig::clientSuffix`, `SignupMode::turnstileSiteKey` | `Inertia::render('site/signup')` props `plans[]`={`value`,`label`,`monthly`,`yearly`}, `setupFee`, `preselected`={`plan`,`cycle`,`ref`}, `clientSuffix`, `turnstileSiteKey` + **`->withViewData(['meta'=>…])`** | — | `EnsureSignupMode` |
| `app/Http/Controllers/Signup/StoreSignupController.php` | invokable | `Signup\StoreSignupRequest` | `SignupService::place`; catch `AsaasApiException\|ConnectionException` | `redirect()->route('signup.order',$order)` ou `back()->with('error', …)` | — | `EnsureSignupMode` + `throttle:5,1` |
| `app/Http/Controllers/Signup/CheckSlugController.php` | invokable | **nenhum** (query crua, `mb_strtolower(trim(...))`) | `Signup\SignupSlug::available` | **JSON** `{available: bool}` | — | `EnsureSignupMode` + `throttle:20,1` |
| `app/Http/Controllers/Signup/ShowOrderController.php` | invokable | — | `PlanMap::label`, `OpsConfig::clientSuffix`, `SignupMode::orderTtlDays` | `Inertia::render('site/signup-order')` prop `order`={`publicId`,`status`,`statusLabel`,`plan`,`planLabel`,`cycle`,`storeName`,`domain`,`amount`,`setupFeeAmount`,`invoiceUrl`,`paidAt`,`expiresAt`} | — (URL secreta por ULID público) | `EnsureSignupMode` |
| `app/Http/Controllers/Signup/ShowOrderOpsController.php` | invokable | **nenhum** | `Signup\OpsBearer::valid($request)` | **JSON** com 20 chaves do pedido, incluindo `payer_name`, `cpf_cnpj`, `email`, `phone`, `asaas_customer_id`, `asaas_subscription_id`, `asaas_setup_payment_id`, `invoice_url`; 401 `{message}` sem bearer | **sim, artesanal**: bearer via `OpsBearer::valid` (comparação constante), fora do sistema de gates | `EnsureSignupMode` + `throttle:30,1` |
| `app/Http/Controllers/Signup/MarkProvisionedOpsController.php` | invokable | **nenhum** | `OpsBearer::valid`; `forceFill(['status'=>SignupOrderStatus::PROVISIONED])` | **JSON** `{ok:true,status}` (idempotente); 401 sem bearer; 409 se não está `PAID` | bearer, idem | `EnsureSignupMode` + `throttle:30,1` |
| `app/Http/Controllers/Signup/SignupWebhookController.php` | invokable | **nenhum** (payload lido via `$request->json()->all()`) | `hash_equals` no header `asaas-access-token`; `DB::transaction` + `lockForUpdate`; `Mail::queue` (notificação ops + boas-vindas); `SendMetaCapiEvent::dispatch` sob `TrackingMode::capiEnabled` | `response('',401)` / `response('',200)` (ignorado, duplicado, ou processado) | token do header, não gate | `EnsureSignupMode` + `throttle:30,1`; CSRF dispensado em `bootstrap/app.php` |

##### 2.13 Site — vitrine pública (7)

| Caminho | Forma | FormRequest | Serviço / query | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Site/HomeController.php` | invokable | — | delega para `LandingController` se `LandingMode::enabled()`; `SiteSetting::current()`, `Item::published()->notSold()->with(['photos','category'])->orderByRaw(...)`, `Seller::active()`, `Banner::active()->limit(3)`, `Category::active()` | **`Inertia::render($layout->homePage(), $props)`** — página dinâmica: `site/home` (Clássico) ou `site/boutique/home` (Boutique), via `App\Enum\SiteLayout::homePage()`. Props sempre: `categories`,`statuses`,`settings`,`items`; **só no Boutique**: `banners`,`featured`,`categoryCards`,`sellers`. `->withViewData(['meta'=>…])` | — (público) | `EnsureVitrineActive` |
| `app/Http/Controllers/Site/ShowItemController.php` | invokable | — | `$item->load(['photos','category'])`; `related` = 4 da mesma categoria; `Seller::pick($item->id,$sellers)` | `Inertia::render($layout->itemPage(), $props)` — `site/item` ou `site/boutique/item`. Props `item`,`related`,`settings` (+ `sellers` e `item.whatsapp` no Boutique). `->withViewData(['meta'=>…, 'jsonLd'=>…])` com `schema.org/Product` + `Offer` | `abort_if(!$item->is_published, 404)`; item vendido continua acessível | `EnsureVitrineActive`, binding `{item:slug}` |
| `app/Http/Controllers/Site/LandingController.php` | invokable | — | `config('vitrine.landing.*')` | `Inertia::render('site/landing')` prop `whatsapp`={`number`,`message`} + `withViewData(['meta'=>…])` | — | **sem rota própria** — só invocado pelo `HomeController` |
| `app/Http/Controllers/Site/TermsController.php` | invokable | — | `TermsDocument::html(TERMS)`, `TermsMode::version` | `Inertia::render('site/legal')` props `document`,`title`,`html`,`version`,`updatedAt` + `withViewData` | — | `EnsureLandingMode` |
| `app/Http/Controllers/Site/PrivacyController.php` | invokable | — | `TermsDocument::html(PRIVACY)` | `Inertia::render('site/legal')` (mesmas props) + `withViewData` | — | `EnsureLandingMode` |
| `app/Http/Controllers/Site/SitemapController.php` | invokable | — | `Cache::remember('sitemap.xml', 1h)`, `Item::published()->notSold()->get(['slug','updated_at'])` | **`response($xml,200,['Content-Type'=>'application/xml'])`** | — | `EnsureVitrineActive` |
| `app/Http/Controllers/Site/RobotsController.php` | invokable | — | `route('sitemap')` | **`response(texto,200,['Content-Type'=>'text/plain'])`** com `Disallow` de `/items`,`/users`,`/settings`,`/site-settings`,`/permissions`,`/dashboard`,`/login` | — | nenhum (fora do `EnsureVitrineActive`, de propósito) |

##### 2.14 SiteSetting (3)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/SiteSetting/EditController.php` | invokable | — | `SiteSetting::current()`, `Banner::orderBy('position')`, `Seller::orderBy('position')`, `Category::options()`, `SiteLayout::options()`, `SellerSelection::options()` | `Inertia::render('site-settings/edit')` props `settings`={`whatsapp`,`instagram`,`pix_key`,`pix_key_type`,`pix_name`,`pix_city`,`hero_title`,`hero_subtitle`,`about_text`,`logo_url`,`mark_url`,`primary_color`,`seller_selection`}, `layout`, `layout_options`, `banners[]`, `sellers[]`, `seller_selection_options`, `banner_categories` | — | `can:manage_site_settings` |
| `app/Http/Controllers/SiteSetting/UpdateController.php` | invokable | `SiteSetting\UpdateSiteSettingRequest` | `resolveBrandingPath()` privado (`Storage::delete` + `storeAs('branding', Str::uuid())`) — **só toca em branding se a request falar dele** (defesa contra o autosave campo-a-campo) | `redirect()->route('site-settings.edit')->with('success', …)` | — | `can:manage_site_settings` |
| `app/Http/Controllers/SiteSetting/UpdateLayoutController.php` | invokable | `SiteSetting\UpdateSiteLayoutRequest` | `SiteSetting::current()->forceFill(['layout'=>…])->save()` | `redirect()->route('site-settings.edit')` | — (o 403 vem do `authorize()` do FormRequest, que exige `Roles::SUPER_USER`) | `can:manage_site_settings` |

##### 2.15 User (13)

| Caminho | Forma | FormRequest / validação | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/User/IndexController.php` | invokable | — (filtros crus: `search`,`role_id`,`is_active`,`has_individual_permissions`,`sort_by`,`sort_order`,`per_page`; `sort_by` com whitelist `['name','email','created_at','updated_at']`, `sort_order` **sem** whitelist) | `RoleFilterService`, `UserResource::collection(...)->toArray($request)`, `RoleResource::toArrayCollection` | `Inertia::render('users/index')` props `users`,`roles`,`assignableRoles`,`filters`,`pagination` | `$this->authorize('viewAny', User::class)` + ocultação de `super_user` na query para quem não é super | `can:manage_users` + `EnsureUserManagement` |
| `app/Http/Controllers/User/CreateController.php` | invokable | — | `RoleFilterService::getAssignableRolesForCurrentSession` | `Inertia::render('users/create')` prop `roles` | `$this->authorize('create', User::class)` | idem |
| `app/Http/Controllers/User/StoreController.php` | invokable | `User\StoreUserRequest` | `RoleFilterService`, `ImpersonationService::getOriginalUser`, `Hash::make`, `Cache::forget("user:{id}:permissions"/":roles")` | `redirect()->route('users.index')` ou `back()->withErrors(['role_id'=>…])->withInput()` | `$this->authorize('create', User::class)` + regras artesanais de role (assignable, só SUPER_USER cria SUPER_USER) | idem |
| `app/Http/Controllers/User/ShowController.php` | invokable | — | `RoleFilterService` | `Inertia::render('users/show')` props `user` (UserResource), `roles` | `$this->authorize('view', $user)` | idem |
| `app/Http/Controllers/User/EditController.php` | invokable | — | `RoleFilterService` (+ push do role atual se ausente) | `Inertia::render('users/edit')` props `user`,`roles` | `$this->authorize('update', $user)` | idem |
| `app/Http/Controllers/User/UpdateController.php` | invokable | `User\UpdateUserRequest` | `RoleFilterService`, `ImpersonationService`, `Hash::make`, `Cache::forget` (só se role mudou) | `redirect()->route('users.show',$user)` ou `back()->withErrors` | `$this->authorize('update', $user)` + regras artesanais (assignable, SUPER_USER, auto-alteração de cargo) | idem |
| `app/Http/Controllers/User/DestroyController.php` | invokable (não `final`, sem strict_types) | — | `$user->delete()` | `redirect()->route('users.index')` | `$this->authorize('delete', $user)` | idem |
| `app/Http/Controllers/User/ToggleActiveController.php` | invokable (não `final`, sem strict_types) | — | `Plan\PlanSeats::full()/message()` | `back()->with('error'\|'success', …)` | `$this->authorize('toggleActive', $user)` | idem |
| `app/Http/Controllers/User/ShowUserPermissionsController.php` | invokable | — | `Permission::all()` | `Inertia::render('users/permissions')` props `user` (UserResource), `all_permissions[]`={`id`,`name`,`label`} | `Gate::authorize('managePermissions', $user)` | idem |
| `app/Http/Controllers/User/GrantPermissionController.php` | invokable | `GrantPermissionRequest` | `PermissionManagementService::grantPermissionToUser(canImpersonateAny: $request->boolean(...))` | `back()->with('success', …)` | `Gate::authorize('managePermissions', $user)` | idem |
| `app/Http/Controllers/User/RevokePermissionController.php` | invokable | **nenhum** (`string $permission` da rota, `Permission::where('name',…)->firstOrFail()`) | `PermissionManagementService::revokePermissionFromUser` | `back()->with('success', …)` | `Gate::authorize('managePermissions', $user)` | idem |
| `app/Http/Controllers/User/StartImpersonateController.php` | invokable | **nenhum** | `ImpersonationService::start/isImpersonating`; **`User::findOrFail($request->route('user'))` refazendo o binding à mão** ("model binding is not working in tests") | `redirect()->route('dashboard')->with('success', …)` | `abort(403)` se já impersonando + `Gate::authorize('impersonate', $targetUser)` | `throttle:10,1` + `can:impersonate_users` |
| `app/Http/Controllers/User/StopImpersonateController.php` | invokable | **nenhum** | `ImpersonationService::stop` | `redirect()->route('users.index')->with('success', …)` | `abort(403)` se não está impersonando | **apenas `auth`+`verified`+`EnsureTermsAccepted`** — fora do grupo `can:manage_users`/`EnsureUserManagement` |

##### 2.16 Webhook (1)

| Caminho | Forma | FormRequest | Serviço | Resposta | Authz no controller | Gate da rota |
|---|---|---|---|---|---|---|
| `app/Http/Controllers/Webhook/AsaasController.php` | invokable | **nenhum** | `hash_equals` no header `asaas-access-token`; filtro por `subscription`; idempotência `AsaasWebhookEvent`; `DB::transaction` envolvendo `create` + `Billing\WebhookHandler::handle` | `response('',401)` ou `response('',200)`; exceção estoura 500 com rollback da linha de idempotência (o Asaas re-tenta) | token do header | `EnsureBillingMode` + `throttle:30,1`; CSRF dispensado em `bootstrap/app.php` |

---

#### 3. Form Requests — 28 arquivos (2 abstratas + 26 concretas)

`attributes()` não existe em nenhum dos 28. `messages()` existe em 21. `prepareForValidation()` em 5. `after()` em 2. `withValidator()` em 1. `failedValidation()` em 1.

| Caminho | `authorize()` | Regras (campo → regra) | `messages()` | Outros hooks |
|---|---|---|---|---|
| `app/Http/Requests/Auth/LoginRequest.php` | `true` | `email` → `required,string,email`; `password` → `required,string` | não | métodos extra `authenticate()`, `ensureIsNotRateLimited()` (5 tentativas), `throttleKey()` (`Str::lower(email)\|ip`), evento `Lockout` |
| `app/Http/Requests/Banner/BannerRequest.php` (**abstract**) | `$this->user()->can('manage_site_settings')` | `baseRules()`: `title`→`nullable,string,max:80`; `cta_label`→`nullable,string,max:30,required_with:cta_url`; `cta_url`→`nullable,string,max:255,required_with:cta_label,`**`new SafeLinkUrl()`**; `position`→`nullable,integer,min:0,max:99`; `is_active`→`nullable,boolean,`*closure* (máx. 3 banners ativos, ignorando o próprio) | sim (12 chaves: `image.required/image/mimes/max`, `title.max`, `cta_label.max/required_with`, `cta_url.max/required_with`, `position.integer/min/max`) | `prepareForValidation()` → `normalizeBlankPosition()` + `normalizeIsActive()` (abstrato); usa trait `NormalizesPosition` |
| `app/Http/Requests/Banner/StoreBannerRequest.php` | herda | `image` → `required,image,mimes:jpg,jpeg,png,webp,max:2048` + `baseRules()` | herda | `normalizeIsActive()` → `merge(['is_active'=>$this->boolean('is_active', true)])` (fecha o buraco do default da coluna) |
| `app/Http/Requests/Banner/UpdateBannerRequest.php` | herda | `image` → `nullable,image,mimes:…,max:2048` + `baseRules()` | herda | `normalizeIsActive()` → só normaliza se `has('is_active')` |
| `app/Http/Requests/Category/ReorderCategoriesRequest.php` | `can('manage_items')` | `ids`→`required,array,min:1`; `ids.*`→`integer,distinct,exists:categories,id` | sim (`ids.required`) | — |
| `app/Http/Requests/Category/StoreCategoryRequest.php` | `can('manage_items')` | `name`→`required,string,max:60,unique:categories,name`; `is_active`→`sometimes,boolean` | sim (`name.required/max/unique`) | — |
| `app/Http/Requests/Category/UpdateCategoryRequest.php` | `can('manage_items')` | `name`→`required,string,max:60,`​`Rule::unique('categories','name')->ignore($this->route('category'))`; `is_active`→`required,boolean` | sim (4 chaves) | — |
| `app/Http/Requests/Category/UpdateCategoryImageRequest.php` | `can('manage_items')` | `image`→`required,image,mimes:jpg,jpeg,png,webp,max:2048` (SVG recusado de propósito) | sim (4 chaves) | — |
| `app/Http/Requests/GrantPermissionRequest.php` | `Auth::user()?->hasRole(Roles::SUPER_USER) ?? false` | `permission`→`required,string,Rule::exists('permissions','name')`; `can_impersonate_any`→`sometimes,boolean` | sim (3 chaves) | — |
| `app/Http/Requests/Item/AiDraftRequest.php` | `(bool) $this->user()?->can('manage_items')` | `photos`→`required,array,min:1,max:8`; `photos.*`→`image,mimes:jpg,jpeg,png,webp,max:5120` | sim (7 chaves) | — |
| `app/Http/Requests/Item/StoreItemRequest.php` | `can('manage_items')` | `name`→`required,string,max:255`; `description`→`nullable,string,max:5000`; `price`/`original_price`→`nullable,numeric,min:0,max:99999999.99`; `category_id`→`required,`​`Rule::exists('categories','id')->where('is_active',true)`; `condition`→`required,Rule::enum(ItemCondition)`; `size`→`nullable,string,max:30`; `colors`→`nullable,array,max:20`; `colors.*`→`string,max:30`; `status`→`sometimes,Rule::enum(ItemStatus)`; `is_published`→`sometimes,boolean`; `is_featured`→`sometimes,boolean`; `photos`→`nullable,array,max:8`; `photos.*`→`image,mimes:…,max:5120` | sim (13 chaves) | `prepareForValidation()` → `normalizeColors()` (trait `NormalizesColors`) |
| `app/Http/Requests/Item/UpdateItemRequest.php` | `can('manage_items')` | igual ao Store, com 2 diferenças: `category_id`→`required,Rule::exists('categories','id')` (**sem** filtro `is_active`, para item que já aponta para categoria inativa) e `status`→`required` (em vez de `sometimes`) | sim (15 chaves) | `prepareForValidation()` → `normalizeColors()` |
| `app/Http/Requests/Item/Studio/StoreDraftRequest.php` | `(bool) $this->user()?->can('manage_items')` | `photos`→`required,array,min:1,max:8`; `photos.*`→`image,mimes:…,max:5120` | sim (7 chaves) | — |
| `app/Http/Requests/Item/Studio/SaveDraftRequest.php` | `(bool) $this->user()?->can('manage_items')` | tudo `sometimes,nullable`: `name`(max:255), `description`(max:5000), `price`/`original_price`(numeric,min:0,max:99999999.99), `category_id`(`Rule::exists(...)->where('is_active',true)`), `condition`(`Rule::enum`), `size`(max:30) | **não** | — |
| `app/Http/Requests/Item/Studio/PublishDraftRequest.php` | `(bool) $this->user()?->can('manage_items')` | `name`→`required,string,max:255`; `description`→`nullable,string,max:5000`; `price`/`original_price`→`nullable,numeric,min:0,max:99999999.99`; `category_id`→`required,Rule::exists(...)->where('is_active',true)`; `condition`→`required,Rule::enum(ItemCondition)`; `size`→`nullable,string,max:30`; `is_published`→`sometimes,boolean` | sim (4 chaves) | — |
| `app/Http/Requests/Legal/StoreAcceptRequest.php` | `true` (gate nos middlewares) | `accept`→`accepted` | sim (1 chave) | — |
| `app/Http/Requests/Metrics/ShowReportRequest.php` | `true` (autorização no controller) | `month`→`nullable,string,regex:/^\d{4}-(0[1-9]\|1[0-2])$/` | sim (`month.regex`) | `withValidator()` → `ReportCalendar::isAllowed($month)`; `failedValidation()` → **`HttpResponseException` JSON 422** (força 422 num GET); método público `month()` com default `ReportCalendar::default()` |
| `app/Http/Requests/Metrics/TrackEventRequest.php` | `true` (endpoint público) | `event`→`required,Rule::enum(MetricEvent)`; `item_id`→`nullable,integer,`​`Rule::requiredIf(event === ITEM_VIEW)`,`Rule::exists('items','id')`; `utm`→`nullable,string,max:40`; `ref`→`nullable,string,max:255` | sim (5 chaves) | — |
| `app/Http/Requests/PermissionRole/UpdateRolePermissionsRequest.php` | `$this->user()?->can('manage_roles') ?? false` | `permissions`→`present,array`; `permissions.*`→`string,Rule::exists('permissions','name')` | sim (4 chaves) | — |
| `app/Http/Requests/Seller/SellerRequest.php` (**abstract**) | `$this->user()->can('manage_site_settings')` | `name`→`required,string,max:60`; `whatsapp`→`required,string,max:30,regex:/^[0-9()+\- ]+$/`; `is_active`→`nullable,boolean`; `position`→`nullable,integer,min:0,max:99` | sim (7 chaves) | `prepareForValidation()` → `normalizeBlankPosition()` + normalização condicional de `is_active` |
| `app/Http/Requests/Seller/StoreSellerRequest.php` | herda | **corpo vazio** — só herda | herda | — |
| `app/Http/Requests/Seller/UpdateSellerRequest.php` | herda | **corpo vazio** — só herda | herda | — |
| `app/Http/Requests/Settings/ProfileUpdateRequest.php` | **ausente** (default `true` do framework) | `name`→`required,string,max:255`; `email`→`required,string,lowercase,email,max:255,`​`Rule::unique(User::class)->ignore($this->user()->id)` | não | — |
| `app/Http/Requests/Signup/StoreSignupRequest.php` | `true` | `plan`→`required,string,Rule::in(PlanMap::plans())`; `cycle`→`required,string,Rule::in(['monthly','yearly'])`; `store_name`→`required,string,max:120`; `slug`→`required,string,regex:SignupSlug::PATTERN`; `whatsapp`→`required,digits_between:10,13`; `payer_name`→`required,string,max:120`; `cpf_cnpj`→`required,string,max:20,`*closure* `DocumentValidator::isValid`; `email`→`required,email,max:190`; `phone`→`required,digits_between:10,13`; `ref`→`nullable,string,max:60`; `accept`→`accepted`; `turnstile_token`→`required,string` | sim (17 chaves) | `prepareForValidation()` → lowercase/trim do `slug`, `preg_replace('/\D/')` em `whatsapp`, `phone`, `cpf_cnpj`; `after()` → `SignupSlug::availableFor` + `TurnstileVerifier::verify` (só quando o resto está válido, para não gastar o desafio de uso único) |
| `app/Http/Requests/SiteSetting/UpdateSiteSettingRequest.php` | `can('manage_site_settings')` | `whatsapp`→`nullable,string,max:30,regex:/^[0-9()+\- ]+$/`; `instagram`→`nullable,string,max:100`; `pix_key`→`nullable,string,max:140`; `pix_key_type`→`nullable,Rule::in(['cpf','cnpj','email','phone','random'])`; `pix_name`→`nullable,string,max:100`; `pix_city`→`nullable,string,max:60`; `hero_title`→`nullable,string,max:120`; `hero_subtitle`→`nullable,string,max:255`; `about_text`→`nullable,string,max:5000`; `logo`/`mark`→`nullable,image,mimes:jpg,jpeg,png,webp,max:2048`; `remove_logo`/`remove_mark`→`nullable,boolean`; `primary_color`→`nullable,string,regex:/^#[0-9a-fA-F]{6}$/`; `seller_selection`→`nullable,Rule::enum(SellerSelection)` | sim (12 chaves) | — |
| `app/Http/Requests/SiteSetting/UpdateSiteLayoutRequest.php` | **`(bool) $this->user()?->hasRole(Roles::SUPER_USER)`** — único request que autoriza por role, não por permissão | `layout`→`required,Rule::enum(SiteLayout)` | sim (2 chaves) | — |
| `app/Http/Requests/User/StoreUserRequest.php` | `$this->user()->can('manage_users')` | `name`→`required,string,max:255`; `email`→`required,string,lowercase,email,max:255,unique:App\Models\User`; `cpf_cnpj`→`nullable,string,`**`new CpfCnpj()`**; `phone`/`mobile`→`nullable,string,max:20`; `password`→`required,confirmed,Password::defaults()`; `role_id`→`nullable,`​`Rule::exists('roles','id')->whereIn('name', Roles::cases())`; `is_active`→`sometimes,boolean`; `user_notes`→`nullable,string,max:65535` | sim (5 chaves) | `after()` → teto de assentos do plano: `PlanSeats::full()` adiciona erro em `email` quando o usuário nasce ativo |
| `app/Http/Requests/User/UpdateUserRequest.php` | `$this->user()->can('manage_users')` | igual ao Store, com: `email`→`Rule::unique(User::class)->ignore($userId)` (`$userId` resolvido do route param, aceitando model **ou** escalar) e `password`→`nullable,confirmed,Password::defaults()`. **Sem** `after()` de assentos | sim (5 chaves) | — |

Traits usadas pelos Form Requests:
- `app/Traits/Requests/NormalizesColors.php` — dedup case-insensitive + trim + descarte de vazio na lista `colors`; usada por `StoreItemRequest` e `UpdateItemRequest`.
- `app/Traits/Requests/NormalizesPosition.php` — `normalizeBlankPosition()`: `position` em branco vira `0` (coluna NOT NULL vs. `ConvertEmptyStringsToNull`); ausente continua ausente; usada por `BannerRequest` e `SellerRequest`.

---

#### 4. Rules customizadas — 2

| Caminho | O que valida |
|---|---|
| `app/Rules/CpfCnpj.php` | `ValidationRule`. Vazio/não-string passa (delega ao `nullable`). Remove não-dígitos; 11 dígitos → dígitos verificadores de CPF (recusa repetições `(\d)\1{10}`); 14 → CNPJ (recusa `(\d)\1{13}`); qualquer outro comprimento → inválido. Mensagem: `"O campo {$attribute} não é um CPF ou CNPJ válido."` (usa o nome cru do atributo, sem `attributes()`) |
| `app/Rules/SafeLinkUrl.php` | `ValidationRule`, `final`. Lista de **permissão** para o `href` do CTA de banner: (a) caminho relativo iniciado por `/`, recusando `^/[/\\]` (protocol-relative e `/\host`, que o navegador resolve como absolutos); (b) URL `^https?://` que também passe em `FILTER_VALIDATE_URL`. Recusa qualquer valor com caractere de controle `[\x00-\x1F\x7F]` (tab/LF/CR são removidos pelo navegador antes de resolver a URL). `javascript:`/`data:` ficam impossíveis por construção. Uma única mensagem privada `message()` |

---

#### 5. Policies — 1 policy, 8 abilities, 0 `before()`

`app/Policies/UserPolicy.php` (classe `UserPolicy`, sem `HandlesAuthorization`, **sem `before()`**):

| Ability | Assinatura | Regra |
|---|---|---|
| `viewAny` | `(User $user)` | `hasPermissionTo('manage_users')` |
| `view` | `(User $user, User $model)` | `hasPermissionTo('manage_users')` (ignora `$model`) |
| `create` | `(User $user)` | `hasPermissionTo('manage_users')` |
| `update` | `(User $user, User $model)` | exige `manage_users`; **lê `request()->has('is_active')`** para bloquear auto-alteração de status; `super_user` pode tudo; demais não editam `super_user` |
| `delete` | `(User $user, User $model)` | exige `manage_users`; bloqueia auto-exclusão; `super_user` pode tudo; demais não deletam `super_user` |
| `toggleActive` | `(User $user, User $model)` | exige `manage_users`; bloqueia auto-desativação; `super_user` pode tudo; demais não desativam `super_user` |
| `impersonate` | `(User $user, User $model)` | delega para `$user->canImpersonate($model)` |
| `managePermissions` | `(User $user)` | `hasPermissionTo('manage_permissions')` — **sem segundo parâmetro**, embora seja invocada como `Gate::authorize('managePermissions', $user)` em 4 controllers |

Comparações de role são por **string literal** (`hasRole('super_user')`), não pelo enum `App\Enum\Roles`, ao contrário do resto do projeto.

---

#### 6. Resources — 2

| Caminho | Campos expostos | Gating condicional |
|---|---|---|
| `app/Http/Resources/UserResource.php` | `id`, `name`, `email`, `cpf_cnpj`, `phone`, `mobile`, `is_active`, `user_notes`, `role`, `permissions`, `custom_permissions_count`, `custom_permissions_list`, `can_impersonate`, `created_at`, `updated_at`. `$preserveKeys = true` | **Nenhum gating de campo sensível por permissão**: `cpf_cnpj`, `phone`, `mobile`, `email` e `user_notes` saem sempre que o resource é usado. Os únicos condicionais são de *carregamento* (`whenLoaded('role')`, `whenLoaded('permissions')`) — não de autorização. `can_impersonate` é derivado do viewer (`$request->user()->canImpersonate($this->resource)`), com fallback `false` sem usuário. `role.permissions` só é preenchido se `$this->role->relationLoaded('permissions')` |
| `app/Http/Resources/RoleResource.php` | `id`, `name`, `label`, `permissions` (`whenLoaded`, mapeado para `{name,label}`), `users` (`whenLoaded`, **objeto Eloquent cru, não passado por `UserResource`**), `created_at`, `updated_at`. `$preserveKeys = true`. Helper estático `toArrayCollection(Collection $roles, Request $request): array` (`collection()->values()->toArray()`) para o front receber array numérico | Só `whenLoaded`; nenhum gating por permissão |

Onde os resources são consumidos: `User/IndexController`, `User/ShowController`, `User/EditController`, `User/CreateController`, `User/ShowUserPermissionsController`, `PermissionRole/IndexController`. **Nenhum outro módulo usa Resources** — Item, Category, Banner, Seller, SiteSetting, Site, Signup, Metrics e Studio serializam à mão (closures `->map(fn(...) => [...])` no controller, `toPublicArray()`/`toCardArray()` no model, ou `App\Services\AiStudio\DraftPresenter`).

---

#### 7. Padrão de página Inertia

**29 chamadas `Inertia::render` em controllers + 1 helper `inertia()`** (`PermissionRole/IndexController`) = 30 pontos de render. Mais 2 renders em closures de rota: `Inertia::render('dashboard')` em `routes/web.php` e `Inertia::render('settings/appearance')` em `routes/settings.php`.

**Nenhum uso de `Inertia::defer`, `Inertia::optional`, `Inertia::merge` ou `Inertia::always`** em `app/` ou `resources/` — a única ocorrência da string no repo é um comentário em `resources/js/hooks/use-settings-autosave.ts:26`. Todas as props são resolvidas de forma síncrona; o "carregamento tardio" do Estúdio IA é feito por polling num endpoint JSON separado (`items.studio.state`), não por `defer`.

| Página Inertia | Controller | Chaves das props |
|---|---|---|
| `auth/login` | `Auth/AuthenticatedSessionController::create` | `canResetPassword`, `status` |
| `auth/confirm-password` | `Auth/ConfirmablePasswordController::show` | — (nenhuma) |
| `auth/verify-email` | `Auth/EmailVerificationPromptController` | `status` |
| `auth/reset-password` | `Auth/NewPasswordController::create` | `email`, `token` |
| `auth/forgot-password` | `Auth/PasswordResetLinkController::create` | `status` |
| `categories/index` | `Category/IndexController` | `categories` |
| `docs/show` | `Docs/ShowController` | `tree`, `current`, `html` |
| `items/create` | `Item/CreateController` | `categories`, `conditions`, `statuses` |
| `items/edit` | `Item/EditController` | `item`, `categories`, `conditions`, `statuses` |
| `items/index` | `Item/IndexController` | `items`, `categories`, `conditions`, `statuses`, `filters`, `pagination` |
| `items/studio` | `Item/Studio/ShowController` | `drafts`, `categories`, `conditions`, `batch`, `backgroundAvailable` |
| `legal/accept` | `Legal/ShowAcceptController` | `title`, `html`, `version`, `updatedAt`, `acceptedAt` |
| `metrics/index` | `Metrics/ShowController` | `payload` |
| `metrics/report` | `Metrics/ShowReportController` | `report`, `text`, `months`, `month`, `whatsapp` |
| `permission-role/roles` | `PermissionRole/IndexController` (helper `inertia()`) | `roles`, `assignableRoles`, `permissions` |
| `settings/password` | `Settings/PasswordController::edit` | `mustVerifyEmail`, `status` |
| `settings/profile` | `Settings/ProfileController::edit` | `mustVerifyEmail`, `status` |
| `settings/appearance` | closure em `routes/settings.php` | — |
| `dashboard` | closure em `routes/web.php` | — |
| `site/signup` | `Signup/ShowSignupController` | `plans`, `setupFee`, `preselected`, `clientSuffix`, `turnstileSiteKey` (+ `withViewData.meta`) |
| `site/signup-order` | `Signup/ShowOrderController` | `order` |
| `site/home` **ou** `site/boutique/home` (dinâmico via `SiteLayout::homePage()`) | `Site/HomeController` | sempre `categories`, `statuses`, `settings`, `items`; **só Boutique**: `banners`, `featured`, `categoryCards`, `sellers` (+ `withViewData.meta`) |
| `site/item` **ou** `site/boutique/item` (dinâmico via `SiteLayout::itemPage()`) | `Site/ShowItemController` | sempre `item`, `related`, `settings`; **só Boutique**: `sellers` e `item.whatsapp` (+ `withViewData.meta` e `withViewData.jsonLd`) |
| `site/landing` | `Site/LandingController` | `whatsapp` (+ `withViewData.meta`) |
| `site/legal` | `Site/TermsController` **e** `Site/PrivacyController` (mesma página, 2 controllers) | `document`, `title`, `html`, `version`, `updatedAt` (+ `withViewData.meta`) |
| `site-settings/edit` | `SiteSetting/EditController` | `settings`, `layout`, `layout_options`, `banners`, `sellers`, `seller_selection_options`, `banner_categories` |
| `users/index` | `User/IndexController` | `users`, `roles`, `assignableRoles`, `filters`, `pagination` |
| `users/create` | `User/CreateController` | `roles` |
| `users/show` | `User/ShowController` | `user`, `roles` |
| `users/edit` | `User/EditController` | `user`, `roles` |
| `users/permissions` | `User/ShowUserPermissionsController` | `user`, `all_permissions` |

Padrão transversal: **6 call-sites de `->withViewData(['meta' => …])`** (SEO/OG server-side, porque o crawler não executa JS) — `Signup/ShowSignupController`, `Site/HomeController`, `Site/LandingController`, `Site/PrivacyController`, `Site/ShowItemController`, `Site/TermsController`. `Site/ShowItemController` é o único que também passa `jsonLd` (`schema.org/Product` com `Offer` e `availability` mapeado de `ItemStatus`). O boilerplate em `origin/main` tem **0** ocorrências de `withViewData`.

Padrão de resposta não-Inertia: **14 controllers tipados com `JsonResponse`** (Item/AiBackground, Item/AiDraft, Item/RevertBackground, os 8 do Item/Studio com resposta JSON, Signup/CheckSlug, Signup/MarkProvisionedOps, Signup/ShowOrderOps); 2 controllers devolvem texto/XML cru (`Site/RobotsController`, `Site/SitemapController`); 1 devolve 204 sempre (`Metrics/TrackController`); 2 devolvem `response('',…)` de webhook (`Webhook/AsaasController`, `Signup/SignupWebhookController`); 2 são híbridos `RedirectResponse|JsonResponse` decididos por `$request->wantsJson()` (`Item/AiBackgroundController`, `Item/RevertBackgroundController`).

---

#### 8. Tabela-resumo

| Métrica | ctvitrine @ `53d7d9a` | boilerplate @ `origin/main` |
|---|---|---|
| Controllers (`app/Http/Controllers/**`, excl. base `Controller.php`) | **86** | **28** |
| — single-action invokable | **79** | não medido |
| — multi-método | **7** | não medido |
| — com `$this->authorize(...)` | **9** | não medido |
| — com `Gate::authorize(...)` | **7** | não medido |
| — com `abort`/`abort_if`/`abort_unless` | **17** | não medido |
| — que injetam um FormRequest | **27** | não medido |
| — com `$request->validate(...)` inline | **7** | não medido |
| — tipados `JsonResponse` | **14** | não medido |
| Form Requests (`app/Http/Requests/**`) | **28** (2 abstratas base + 26 concretas) | **8** |
| — com `authorize()` próprio | **23** (5 sem: 2 Banner e 2 Seller herdam da base; `ProfileUpdateRequest` não tem) | não medido |
| — com `rules()` próprio | **25** (3 sem: `BannerRequest` usa `baseRules()`; `Store/UpdateSellerRequest` herdam) | não medido |
| — com `messages()` | **21** | não medido |
| — com `attributes()` | **0** | não medido |
| — com `prepareForValidation()` | **5** | não medido |
| Rules (`app/Rules/*`) | **2** (`CpfCnpj`, `SafeLinkUrl`) | **2** (`CpfCnpj`, `MoneyString`) |
| Policies (`app/Policies/*`) | **1** (`UserPolicy`) | **1** (`UserPolicy`) |
| — abilities | **8** | não medido |
| — com `before()` | **0** | não medido |
| Resources (`app/Http/Resources/*`) | **2** (`RoleResource`, `UserResource`) | **2** (`RoleResource`, `UserResource`) |
| `Inertia::render` (call-sites em controllers) | **29** (+1 helper `inertia()`) | **13** |
| `->withViewData(...)` (call-sites em controllers) | **6** | **0** |
| `Inertia::defer/optional/merge/always` em `app/` + `resources/` | **1 ocorrência, e é comentário** (`resources/js/hooks/use-settings-autosave.ts:26`) | não medido |

Deltas de inventário relevantes para a comparação (fatos, não veredito): o boilerplate tem `app/Http/Requests/PermissionRole/AssignRoleRequest.php` e `app/Http/Requests/PermissionRole/SyncPermissionsRequest.php`, que **não existem** no ctvitrine — lá `PermissionRole/AssignRoleController.php` e `PermissionRole/SyncPermissionsController.php` validam inline. O ctvitrine não tem `app/Http/Controllers/Auth/RegisteredUserController.php` (auto-registro removido, documentado em `routes/auth.php`) nem `app/Rules/MoneyString.php`.

---

#### Medições

Todos os comandos abaixo foram executados com `cd /Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine` (fonte) ou `.../boilerplate` (alvo). Nenhum acesso à working tree: só `ls-tree`, `show` e `grep` no SHA/ref.

```bash
# --- FONTE: ctvitrine @ 53d7d9a ---

# Controllers: 87 com a base, 86 sem ela
git ls-tree -r 53d7d9a --name-only -- app/Http/Controllers | wc -l                       # 87
git ls-tree -r 53d7d9a --name-only -- app/Http/Controllers \
  | grep -v '^app/Http/Controllers/Controller.php$' | wc -l                               # 86

# Single-action invokable
git grep -l 'function __invoke' 53d7d9a -- 'app/Http/Controllers/*' | wc -l               # 79
# Multi-método = 86 - 79 = 7 (lista obtida por diff dos dois conjuntos)
comm -23 <(git ls-tree -r 53d7d9a --name-only -- app/Http/Controllers \
           | grep -v '^app/Http/Controllers/Controller.php$' | sort) \
         <(git grep -l 'function __invoke' 53d7d9a -- 'app/Http/Controllers/*' \
           | sed 's/^53d7d9a://' | sort)                                                  # 7 linhas

# Autorização
git grep -l '\$this->authorize(' 53d7d9a -- 'app/Http/Controllers/*' | wc -l              # 9
git grep -l 'Gate::authorize(' 53d7d9a -- 'app/Http/Controllers/*' | wc -l                # 7
git grep -l -E 'abort(_if|_unless)?\(' 53d7d9a -- 'app/Http/Controllers/*' | wc -l        # 17

# Consumo de FormRequest / validação inline / JSON
git grep -l 'use App\\Http\\Requests' 53d7d9a -- 'app/Http/Controllers/*' | wc -l         # 27
git grep -l '\$request->validate(' 53d7d9a -- 'app/Http/Controllers/*' | wc -l            # 7
git grep -l 'JsonResponse' 53d7d9a -- 'app/Http/Controllers/*' | wc -l                    # 14

# Form Requests
git ls-tree -r 53d7d9a --name-only -- app/Http/Requests | wc -l                           # 28
git grep -l 'abstract class' 53d7d9a -- 'app/Http/Requests/*' | wc -l                     # 2
git grep -l 'function authorize'  53d7d9a -- 'app/Http/Requests/*' | wc -l                # 23
git grep -l 'function rules'      53d7d9a -- 'app/Http/Requests/*' | wc -l                # 25
git grep -l 'function messages'   53d7d9a -- 'app/Http/Requests/*' | wc -l                # 21
git grep -l 'function attributes' 53d7d9a -- 'app/Http/Requests/*' | wc -l                # 0
git grep -l 'function prepareForValidation' 53d7d9a -- 'app/Http/Requests/*' | wc -l      # 5
git grep -l 'function after' 53d7d9a -- 'app/Http/Requests/*'                             # 2 arquivos

# Rules / Policies / Resources
git ls-tree -r 53d7d9a --name-only -- app/Rules | wc -l                                   # 2
git ls-tree -r 53d7d9a --name-only -- app/Policies | wc -l                                # 1
git show 53d7d9a:app/Policies/UserPolicy.php | grep -cE '^    public function '           # 8
git show 53d7d9a:app/Policies/UserPolicy.php | grep -c 'function before'                  # 0
git ls-tree -r 53d7d9a --name-only -- app/Http/Resources | wc -l                          # 2

# Inertia
git grep -n 'Inertia::render' 53d7d9a -- 'app/Http/Controllers/*' | wc -l                 # 29
git grep -n 'return inertia(' 53d7d9a -- 'app/Http/Controllers/*' | wc -l                 # 1
git grep -n '\->withViewData(' 53d7d9a -- 'app/Http/Controllers/*' | wc -l                # 6
git grep -n -E 'Inertia::(defer|optional|merge|always)' 53d7d9a -- app resources | wc -l  # 1 (comentário TS)

# --- ALVO: boilerplate @ origin/main (sempre com prefixo origin/) ---
git -C .../boilerplate ls-tree -r origin/main --name-only -- app/Http/Controllers | wc -l # 29 (28 + base)
git -C .../boilerplate ls-tree -r origin/main --name-only -- app/Http/Requests   | wc -l  # 8
git -C .../boilerplate ls-tree -r origin/main --name-only -- app/Policies        | wc -l  # 1
git -C .../boilerplate ls-tree -r origin/main --name-only -- app/Rules           | wc -l  # 2
git -C .../boilerplate ls-tree -r origin/main --name-only -- app/Http/Resources  | wc -l  # 2
git -C .../boilerplate grep -n 'Inertia::render'  origin/main -- 'app/Http/Controllers/*' | wc -l  # 13
git -C .../boilerplate grep -n 'withViewData'     origin/main -- 'app/Http/Controllers/*' | wc -l  # 0
```

Contagens declaradas como "não medido" nesta seção não foram executadas e não devem ser inferidas do texto acima.

---

### Frente 3 — camada de domínio do **ctvitrine** (`53d7d9a`): Services, Models, Enums, Casts, DTOs, Events, Jobs, Mail, Exceptions, Traits

**Escopo verificado:** `git ls-tree -r 53d7d9a -- app` devolve **258 arquivos / 18.969 linhas**. `app/` tem exatamente **15 subdiretórios** e **nenhum arquivo solto na raiz de `app/`**. Os 15 estão todos enumerados abaixo (os 6 fora da minha frente aparecem na seção 10, listados um a um).

---

#### 1. `app/Services/**` — 62 arquivos, 6.505 linhas, 14 subpastas + 6 arquivos na raiz

##### 1.1 `app/Services/AiImage/` (5 arq. / 244 linhas)

| Caminho | LOC | Responsabilidade | API pública | Deps injetadas | Externo |
|---|---|---|---|---|---|
| `app/Services/AiImage/AiImageMode.php` | 55 | Liga/desliga do módulo "fundo estúdio por IA". Único lugar que lê `config('vitrine.ai_image.*')`. Config parcial → off silencioso, nunca exceção. | `enabled()`, `provider()`, `diagnostics()`; consts `OFF`/`LIVE`/`OPENAI` | nenhuma (tudo `static`) | — (só checa presença da chave com `filled()`) |
| `app/Services/AiImage/AiImageUsage.php` | 43 | Uso mensal de fundos da instância (`kind=background`), base da prop `features.ai_image_usage` e do bloqueio por teto. | `used()`, `limit()`, `limitReached()`, `snapshot()` | `App\Models\AiAnalysis` (static) | — |
| `app/Services/AiImage/BackgroundEditor.php` | 15 | Contrato do editor de fundo; resolvido no container. | `edit(string $imageBytes): ImageEditResult` | — | — |
| `app/Services/AiImage/ImageEditResult.php` | 38 | DTO `readonly` do resultado da edição (status canônico de `AiAnalysis`, bytes, custo). | `ok()`, `failed()`, `isOk()`; props `status`, `bytes`, `costUsd`, `failureReason` | — | — |
| `app/Services/AiImage/OpenAiBackgroundEditor.php` | 93 | Driver OpenAI de edição de fundo, sem SDK (`Http` facade); resposta base64 → bytes. | `edit()` | — (constrói-se sem args) | **OpenAI** `POST https://api.openai.com/v1/images/edits` (multipart `image`, `model=gpt-image-2`, `output_format=jpeg`, `retry(1, 2000)` só rede/5xx). Credencial: `Http::withToken(config('vitrine.ai_image.openai.key'))` — valor `***`. Prompt lido de `resource_path('prompts/ai-image-background.md')` |

##### 1.2 `app/Services/AiIntake/` (9 arq. / 624 linhas)

| Caminho | LOC | Responsabilidade | API pública | Externo |
|---|---|---|---|---|
| `app/Services/AiIntake/AbstractVisionAnalyzer.php` | 143 | Base dos drivers: monta system/user prompt com as categorias da loja, detecta mime e **interpreta o JSON do modelo defensivamente** (JSON inválido/campo errado → `failed`, nunca exceção). Categoria e condição sugeridas só passam se existirem na loja/enum. | `abstract providerName()`; protegidos `systemPrompt()`, `userPrompt()`, `detectMime()`, `interpret()` | lê `resource_path('prompts/ai-intake.md')` |
| `app/Services/AiIntake/AiIntakeMode.php` | 60 | Liga/desliga do cadastro por foto; único leitor de `config('vitrine.ai_intake.*')`. | `enabled()`, `provider()`, `diagnostics()`; consts `OFF`/`LIVE`/`GEMINI`/`OPENAI` | — |
| `app/Services/AiIntake/AiUsage.php` | 40 | Uso mensal (`kind=intake`) da loja. | `used()`, `limit()`, `limitReached()`, `snapshot()` | — |
| `app/Services/AiIntake/AnalysisContext.php` | 40 | DTO `readonly` do contexto: categorias ativas, nicho, moeda **e orçamento de tempo** (request vs. fila). | `timeout()`, `categorySlugs()` | — |
| `app/Services/AiIntake/AnalysisResult.php` | 44 | DTO `readonly` do resultado (status `ok|refused|failed`, tokens, custo). | `ok()`, `refused()`, `failed()`, `isOk()` | — |
| `app/Services/AiIntake/GeminiAnalyzer.php` | 111 | Driver Gemini com structured output via `generationConfig.responseSchema`. Custo 0 (free tier documentado); tokens de `usageMetadata`. | `analyze()`, `providerName()` | **Google Gemini** `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`; header `x-goog-api-key` = `config('vitrine.ai_intake.gemini.key')` (`***`); `retry(2, 2000)` só rede/5xx, `connectTimeout(5)` |
| `app/Services/AiIntake/ItemDraft.php` | 42 | DTO `readonly` do rascunho sugerido (todo campo incerto vem `null`). | `toArray()` | — |
| `app/Services/AiIntake/OpenAiAnalyzer.php` | 126 | Driver OpenAI com `response_format: json_schema` strict; imagens como data-URI `detail=low`. Custo pelos preços/1M tokens do config. | `analyze()`, `providerName()` | **OpenAI** `POST https://api.openai.com/v1/chat/completions`; `Http::withToken(config('vitrine.ai_intake.openai.key'))` (`***`); `retry(2, 2000)` |
| `app/Services/AiIntake/VisionAnalyzer.php` | 18 | Contrato do analisador. | `analyze(array $photoContents, AnalysisContext $context): AnalysisResult` | — |

##### 1.3 `app/Services/AiStudio/` (3 arq. / 185 linhas)

| Caminho | LOC | Responsabilidade | API pública | Deps |
|---|---|---|---|---|
| `app/Services/AiStudio/AiStudioMode.php` | 62 | Liga/desliga do Estúdio IA; exige `ai_intake` ligado, e `ai_image` para o fundo automático. | `enabled()`, `backgroundAvailable()`, `batchEnabled()`, `diagnostics()` | `AiIntakeMode`, `AiImageMode` (static) |
| `app/Services/AiStudio/DraftDispatcher.php` | 70 | **Orquestração automática da IA no nascimento do rascunho** — sem botão "Analisar": marca `processing` e despacha análise de campos + fundo por foto, respeitando o teto mensal (estouro degrada com graça). | `dispatch(Item, ?int)`, `analyzeFields(Item, ?int)`, `backgrounds(iterable, ?int)` | usa `Jobs\AnalyzeDraftFields`, `Jobs\ProcessPhotoBackground`, `AiUsage`, `AiImageUsage` |
| `app/Services/AiStudio/DraftPresenter.php` | 53 | Shape único do rascunho para a página Inertia e para o endpoint de polling. | `present(Item)`, `collection(Collection)` | — |

##### 1.4 `app/Services/Asaas/` (3 arq. / 232 linhas)

| Caminho | LOC | Responsabilidade | API pública | Externo |
|---|---|---|---|---|
| `app/Services/Asaas/AsaasApiException.php` | 22 | Falha de chamada após esgotar retries; guarda método/rota/status — **nunca corpo nem chave**. | props `asaasMethod`, `asaasPath`, `status` | — |
| `app/Services/Asaas/AsaasClient.php` | 185 | Wrapper fino da API Asaas v3, **neutro de credencial de propósito**: `__construct(string $token, string $baseUrl)` — ops passa `OpsConfig`, signup passa `SignupMode`. Retry ≤3, 429 respeita `Retry-After`, 5xx backoff linear via `Sleep` (fakeável). | `findCustomerByCpfCnpj`, `createCustomer`, `updateCustomer`, `createSubscription`, `deleteSubscription`, `findSubscriptionByExternalReference`, `paymentsByExternalReference`, `createPayment`, `deletePayment`, `firstPayment`, `createWebhook`, `updateWebhook`, `listWebhooks`; const `BASE_URLS` | **Asaas v3** — base `https://api-sandbox.asaas.com/v3` \| `https://api.asaas.com/v3`; rotas `/customers`, `/customers/{id}`, `/subscriptions`, `/subscriptions/{id}`, `/payments`, `/payments/{id}`, `/webhooks`, `/webhooks/{id}`. Auth: header `access_token` recebido no construtor (`***`) |
| `app/Services/Asaas/DueDate.php` | 25 | 1ª fatura vence em D+2 (BRT); âncora do ciclo. | `firstInvoice(): string` | — |

##### 1.5 `app/Services/Billing/` (2 arq. / 146 linhas)

| Caminho | LOC | Responsabilidade | API pública | Observação |
|---|---|---|---|---|
| `app/Services/Billing/BillingMode.php` | 50 | Liga/desliga da cobrança recorrente: exige `mode=live` **E** `webhook_token` **E** `subscription_id`. | `enabled()`, `diagnostics()` | Config parcial → webhook 404 |
| `app/Services/Billing/WebhookHandler.php` | 96 | Traduz evento de pagamento (já autenticado/desduplicado no controller) em estado local. `PAYMENT_CONFIRMED\|RECEIVED` → `active` + `paid_until` a partir do **`dueDate`** (não da data do evento); `PAYMENT_OVERDUE` → `past_due`; `PAYMENT_DELETED\|REFUNDED` → `past_due` **só se for o pagamento vigente** (consulta `AsaasWebhookEvent`). | `handle(array $payload)` | Escreve `SiteSetting` `billing_*` com `forceFill` — colunas fora do `$fillable` de propósito |

##### 1.6 Raiz de `app/Services/` (6 arq. / 548 linhas)

| Caminho | LOC | Responsabilidade | API pública | Deps injetadas |
|---|---|---|---|---|
| `app/Services/ContentImageService.php` | 50 | Imagens de conteúdo do lojista (banner/foto de categoria): nome aleatório, apaga o antigo ao trocar. Caminho público (`/x.jpg`) é ignorado no delete. | `store()`, `replace()`, `forget()` | — (`Storage`, `Str`) |
| `app/Services/ImageOptimizer.php` | 101 | Imagick: aplica orientação EXIF nos pixels (`autoOrientImage` indisponível no build), reduz ao teto, achata alpha sobre branco, JPEG progressivo + `stripImage()`. Falha → `null` (upload nunca trava). | `optimize(string): ?string` | `__construct(int $maxDimension = 1600, int $quality = 82)` |
| `app/Services/ImpersonationService.php` | 68 | Sessão de impersonação (`impersonate_original_user_id/_name`) + eventos. | `start()`, `stop()`, `isImpersonating()`, `getOriginalUserName()`, `getOriginalUser()` | — |
| `app/Services/ItemPhotoService.php` | 90 | Guarda fotos otimizadas em `items/{id}/`, mantém posição, e no delete apaga **também o `original_path`** (arquivo de IA que ficaria órfão). | `storePhotos()`, `deletePhoto()`, `deleteAllPhotos()` | `ImageOptimizer` (constructor promotion) |
| `app/Services/PermissionManagementService.php` | 26 | Concede/revoga permissão direta ao usuário, injetando `meta.can_impersonate_any` quando a permissão é `impersonate_users`. | `grantPermissionToUser()`, `revokePermissionFromUser()` | — |
| `app/Services/RoleFilterService.php` | 213 | Filtro de roles por prioridade, com **par duplicado** de métodos: `*ForCurrentSession` (UX, usa o usuário impersonado) vs. o par de segurança (usa o impersonador). Corpo das quatro é quase idêntico. | `getAssignableRoles()`, `getAssignableRolesForCurrentSession()`, `getVisibleRoles()`, `getVisibleRolesForCurrentSession()` | `ImpersonationService` |

##### 1.7 `Docs`, `Env`, `Landing`, `Legal`, `Plan`, `Tracking`

| Caminho | LOC | Responsabilidade | API pública |
|---|---|---|---|
| `app/Services/Docs/DocsRepository.php` | 183 | Serve `docs/**.md` como páginas logadas; grupos `usuario`/`tecnico`; descoberta automática (título = 1º `#`); reescreve links `.md` para rotas e **rebaixa a texto** links de grupo sem acesso; anti-traversal por `realpath` + prefixo. | const `GROUPS`; `accessibleTree()`, `pages()`, `first()`, `exists()`, `render()` |
| `app/Services/Env/EnvInventory.php` | 105 | Inventário de envs varrendo `config/*.php` **como texto** (regex `env('NOME')`), porque com `config:cache` a relação env→chave não existe em runtime. Alimenta testes-guarda e `vitrine:env`. | const `PRODUCT_PREFIXES` (`VITRINE_`, `ASAAS_`, `PLOI_`, `OPENAI_`, `GEMINI_`, `TURNSTILE_`, `RESEND_`, `META_`, `SIGNUP_OPS_`); `fromConfigFiles()`, `extract()`, `productEnvs()`, `isProduct()`, `isSecret()` (sufixos `_KEY`/`_TOKEN`/`_SECRET`/`_PASSWORD`) |
| `app/Services/Landing/LandingMode.php` | 52 | Liga/desliga da landing; exige WhatsApp comercial preenchido; typo de env → off silencioso. | `mode()`, `enabled()`, `diagnostics()` |
| `app/Services/Legal/TermsDocument.php` | 167 | Lê/renderiza `resources/legal/*.md`; **hash sha256 do arquivo cru é a prova do que foi aceito**; HTML cacheado `rememberForever` por hash; recorte do Termo por anexo do plano (`I`/`II`/`III` + `IV` comum) com fallback seguro para o documento inteiro. | consts `TERMS`, `PRIVACY`, `DOCUMENTS`; `exists()`, `html()`, `htmlForPlan()`, `hash()`, `raw()`, `updatedAt()` |
| `app/Services/Legal/TermsMode.php` | 105 | Liga/desliga do módulo legal: `live` + versão preenchida + **os dois textos em disco**. | `mode()`, `enabled()`, `version()`, `plan()`, `receiptBcc()`, `diagnostics()`; const `DOCUMENTS` |
| `app/Services/Plan/PlanSeats.php` | 78 | Teto de usuários do painel por plano (1 no Essencial, 5 nos demais). Plano ausente/typo = **sem teto** (gate novo não tira acesso de quem já tinha). Super usuário de manutenção e usuário desativado não ocupam assento. | `limit()`, `used()`, `full()`, `message()` |
| `app/Services/Tracking/TrackingMode.php` | 99 | Dois níveis: `enabled()` = Pixel do navegador (basta `pixel_id`), `capiEnabled()` = server-side (exige token). Token nunca vai ao front. | `mode()`, `enabled()`, `capiEnabled()`, `pixelId()`, `capiToken()`, `testEventCode()`, `graphVersion()` (default `v23.0`), `timeout()`, `diagnostics()` |

##### 1.8 `app/Services/Metrics/` (10 arq. / 2.003 linhas)

| Caminho | LOC | Responsabilidade | API pública | Deps |
|---|---|---|---|---|
| `app/Services/Metrics/MetricsQueryService.php` | **1.049** | Engine do painel de métricas: KPIs, deltas, série diária, funil, origens, vendas por categoria, top produtos, `extras`, e a **engine de insights** (6 geradores + card de upgrade), com limiares declarados como consts e prioridade única. `payload()` é cacheado em `metrics:payload:{days}` por `config('vitrine.metrics.cache_ttl', 600)`. | `payload(int $days)`, `insightsForWindow(CarbonImmutable, CarbonImmutable)` | — (usa `Item`, `MetricEvent`, `Category`, `SessionTally`, `MetricsMode`) |
| `app/Services/Metrics/MonthlyReport.php` | 240 | Relatório de mês-calendário **em America/Sao_Paulo** com bordas convertidas para UTC antes da query; comparativo com o mês anterior; `headline_insight` vem da mesma engine do painel. | `build(CarbonImmutable $month): array` | `MetricsQueryService` (constructor promotion) |
| `app/Services/Metrics/MonthlyReportText.php` | 145 | Renderiza o payload como texto de WhatsApp (`*negrito*`, emoji comedido, teto de 900 chars — encolhe "Mais desejadas" antes de cortar a decisão). Mês sem dado ganha texto honesto. | `render(array $report, string $storeName): string` | — |
| `app/Services/Metrics/MetricsMode.php` | 126 | Modo `off\|demo\|live` + **fronteira de plano**: `insightsTier()` (basic vs per_item, com disjunção plano **OU** módulo `report`), `perItemNumbers()`, `allowedPeriods()` (`[7,30]` vs `[7,30,90]`), `resolvePeriod()`. | `mode()`, `enabled()`, `live()`, `demo()`, `diagnostics()`, `insightsTier()`, `perItemNumbers()`, `allowedPeriods()`, `resolvePeriod()`; consts `TIER_BASIC`/`TIER_PER_ITEM` | — |
| `app/Services/Metrics/SessionTally.php` | 146 | Definição **única** de "visita", "abriu produto", "interesse" e "origem" a partir dos eventos ordenados — painel e relatório consomem a mesma classe para nunca divergirem. | `fromEvents(Collection)`, `visits()`, `openedSessions()`, `interests()`, `totalVisits()`, `bySource()`, `topSource()` | — |
| `app/Services/Metrics/DemoPayload.php` | 105 | Payload ilustrativo do modo demo (números fecham entre si; mesmo contrato do payload real). | `make(): array` | — |
| `app/Services/Metrics/ReportCalendar.php` | 63 | Meses dentro da retenção (`vitrine.metrics.retention_days`, default 395), fonte única do seletor + FormRequest + command. | `available()`, `default()`, `isAllowed()`, `anchor()` | — |
| `app/Services/Metrics/ReportMode.php` | 48 | Relatório mensal exige `live` **E** métricas em `live`. | `mode()`, `enabled()`, `diagnostics()` | `MetricsMode` |
| `app/Services/Metrics/SessionHasher.php` | 28 | Identidade anônima que rotaciona por dia: `sha256(data\|ip\|ua\|app.key)`. IP/UA nunca persistidos; `app.key` é pepper. | `hash(CarbonInterface, string $ip, string $ua)` | — |
| `app/Services/Metrics/SourceClassifier.php` | 53 | Classifica origem por `utm_source` + host do referrer (a URL crua nunca é guardada). | `classify(?string, ?string): MetricSource` | — |

##### 1.9 `app/Services/Ops/` (12 arq. / 1.197 linhas)

| Caminho | LOC | Responsabilidade | API pública | Externo / credencial |
|---|---|---|---|---|
| `app/Services/Ops/PloiClient.php` | 205 | Wrapper da API do ploi, sem SDK; retry ≤3, 429 respeita `Retry-After`, 5xx backoff linear via `Sleep`. Documenta duas armadilhas reais da API (o `type` obrigatório no banco; o usuário do banco como passo separado). | `createSite`, `createDatabase`, `createDatabaseUser`, `installRepository`, `updateDeployScript`, `getEnv`, `updateEnv`, `deploy`, `deployLog`, `requestCertificate`, `createDaemon`, `createScheduledJob` | **ploi.io** base `https://ploi.io/api`; rotas `/servers/{id}/sites`, `/servers/{id}/databases[/{id}/users]`, `/servers/{id}/sites/{id}/{repository,deploy/script,env,deploy,log,certificates}`, `/servers/{id}/daemons`, `/servers/{id}/crontabs`. Auth `Http::withToken($token)` recebido no construtor (`***`) |
| `app/Services/Ops/BillingSubscriber.php` | 330 | Pipeline de ativação de cobrança: customer + subscription no Asaas → webhook (cria **ou atualiza**, nunca duplica) → merge dos envs de billing no `.env` remoto → redeploy → smoke test. Idempotente via `InstanceState`. O `authToken` do webhook é gerado (`Str::random(48)`) e empurrado ao webhook e ao `.env` no **mesmo passo**, nunca gravado no estado. | `run(BillingInput, Closure): array`, `attachToInstance(...): array` | Asaas + ploi via `OpsConfig::asaasToken()/asaasBaseUrl()/token()` (`***`); smoke `Http` em `https://{domain}/webhooks/asaas` (401 = live, 404 = off), até 12 tentativas de 10s |
| `app/Services/Ops/OpsConfig.php` | 156 | Leitor **único** de `config('vitrine.ops.*')` — nenhum comando lê a config espalhada. | `token`, `serverId`, `repo`, `branch`, `clientSuffix`, `openaiKey`, `geminiKey`, `resendKey`, `mailFrom` (fallback `noreply@{client_suffix}`), `r2Key/r2Secret/r2Bucket/r2Endpoint/r2Url/r2Configured`, `superPassword`, `asaasToken`, `asaasEnv`, `asaasProduction`, `asaasBaseUrl`, `signupUrl`, `signupToken` | Todas as credenciais são `***`, lidas só do `.env` local do operador |
| `app/Services/Ops/PlanMap.php` | 153 | Fonte única plano → envs de módulo e preços; módulos avulsos (`report`, `ai`) sobrepõem a franquia. | `plans()`, `isValid()`, `envs()`, `usesAi()`, `label()`, `monthlyPrice()`, `yearlyPrice()`, `setupPrice()` (hoje `0.00`, zerando a cadeia de setup) | — |
| `app/Services/Ops/InstanceState.php` | 98 | Estado do provisionamento em `storage/ops/instances/{slug}.json`: passos, ids, timestamps — **nunca segredos**. Habilita `--resume` e a proteção contra sobrescrever cliente vivo. | `for()`, `exists()`, `completed()`, `complete()`, `put()`, `get()`, `path()`, `toArray()` | — |
| `app/Services/Ops/DocumentValidator.php` | 73 | CPF/CNPJ por dígito verificador, para não criar pagador inválido no Asaas. | `isValid(string): bool` | — |
| `app/Services/Ops/StubRenderer.php` | 42 | Renderiza `stubs/ops/*.stub` trocando `{{CHAVE}}`; **falha alto em placeholder órfão**. | `render()`, `path()` | — |
| `app/Services/Ops/EnvMerge.php` | 38 | Merge de chaves num `.env` existente sem sobrescrever o arquivo inteiro (armadilha que apagaria `APP_KEY`/`DB_*`). | `apply(string $existing, array $updates): string` | — |
| `app/Services/Ops/BillingInput.php` | 31 | DTO imutável das entradas do `billing:subscribe`. | props `slug`,`plan`,`cycle`,`name`,`cpfCnpj`,`email`,`phone`,`domain`,`resume`; `yearly()` | — |
| `app/Services/Ops/OpsGuard.php` | 31 | **Gate duplo**: comandos `instance:*` nunca em produção; sem token do ploi, recusa clara. | `check(): ?string` | — |
| `app/Services/Ops/PloiApiException.php` | 23 | Exceção de domínio: método/rota/status, sem corpo nem token. | props `ploiMethod`, `ploiPath`, `status` | — |
| `app/Services/Ops/ProvisioningException.php` | 17 | Exceção de domínio para falha assíncrona do ploi (site que não subiu, clone que falhou) — distinta de erro HTTP. | — | — |

##### 1.10 `app/Services/Signup/` (5 arq. / 537 linhas)

| Caminho | LOC | Responsabilidade | API pública | Externo |
|---|---|---|---|---|
| `app/Services/Signup/SignupService.php` | 260 | Orquestra o POST do checkout: cria **ou reaproveita** o pedido (transação + `lockForUpdate` + unique de `slug_lock`), congela snapshot de preços do `PlanMap`, grava a trilha do aceite, cobra no Asaas de forma **idempotente por campo**, e enfileira o comprovante. Double-submit serializado por `Cache::lock("signup:charge:{id}", 60)->block(15)`. | `place(array, string $ip, string $ua): SignupOrder`; static `price()`, `setupFee()` | Asaas via `new AsaasClient(SignupMode::asaasToken(), SignupMode::asaasBaseUrl())` (`***`): customer, subscription (`billingType=UNDEFINED`, `externalReference = public_id`), payment de setup, `firstPayment` p/ `invoiceUrl` |
| `app/Services/Signup/SignupMode.php` | 150 | Liga/desliga do checkout self-service: exige `live` + landing + termos + **6 credenciais** preenchidas. | `mode()`, `enabled()`, `asaasEnv()`, `sandbox()`, `asaasBaseUrl()`, `asaasToken()`, `webhookToken()`, `notifyEmail()`, `opsToken()`, `turnstileSiteKey()`, `turnstileSecret()`, `orderTtlDays()`, `reservedSlugs()`, `diagnostics()` | — (só presença; valores `***`) |
| `app/Services/Signup/SignupSlug.php` | 65 | Regras do endereço da vitrine: formato (`/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/`), reservados e disponibilidade entre pedidos vivos. | const `PATTERN`; `validFormat()`, `reserved()`, `available()`, `availableFor()`, `sameDocument()` | — |
| `app/Services/Signup/TurnstileVerifier.php` | 38 | Anti-bot server-side; qualquer falha reprova ("na dúvida, nada é criado"). | const `VERIFY_URL`; `verify(?string $token, ?string $ip): bool` | **Cloudflare Turnstile** `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` (`asForm`, timeout 10). Segredo: `SignupMode::turnstileSecret()` (`***`) |
| `app/Services/Signup/OpsBearer.php` | 24 | Bearer dos endpoints ops do signup, com `hash_equals`; config vazia nunca autoriza. | `valid(Request): bool` | — |

##### 1.11 Resumo dos serviços externos falados a partir de `app/`

| Provedor | Onde | Endpoint(s) | Como a credencial é lida |
|---|---|---|---|
| OpenAI (visão) | `app/Services/AiIntake/OpenAiAnalyzer.php` | `POST https://api.openai.com/v1/chat/completions` | `Http::withToken(config('vitrine.ai_intake.openai.key'))` — `***` |
| OpenAI (imagem) | `app/Services/AiImage/OpenAiBackgroundEditor.php` | `POST https://api.openai.com/v1/images/edits` | `Http::withToken(config('vitrine.ai_image.openai.key'))` — `***` |
| Google Gemini | `app/Services/AiIntake/GeminiAnalyzer.php` | `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | header `x-goog-api-key` ← `config('vitrine.ai_intake.gemini.key')` — `***` |
| Asaas v3 | `app/Services/Asaas/AsaasClient.php` (usado por `Ops/BillingSubscriber.php` e `Signup/SignupService.php`) | `/customers`, `/subscriptions`, `/payments`, `/webhooks` | header `access_token` **injetado no construtor** — `***` |
| ploi.io | `app/Services/Ops/PloiClient.php` | `https://ploi.io/api/servers/...` | `Http::withToken($token)` do construtor, vindo de `OpsConfig::token()` — `***` |
| Cloudflare Turnstile | `app/Services/Signup/TurnstileVerifier.php` | `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` | `SignupMode::turnstileSecret()` — `***` |
| Meta Conversions API | `app/Jobs/SendMetaCapiEvent.php` | `POST https://graph.facebook.com/{version}/{pixel-id}/events` | `access_token` no corpo ← `TrackingMode::capiToken()` — `***` |
| Smoke test da instância | `app/Services/Ops/BillingSubscriber.php` | `https://{domain}/webhooks/asaas` | — |

---

#### 2. `app/Models/*` — 14 arquivos, 1.280 linhas

Nenhum model declara `$table` nem `$guarded` (verificado por grep); todos usam a convenção. `$hidden` existe **apenas** em `User`. Soft delete **apenas** em `Item`.

| Caminho | LOC | Tabela | `$fillable` | `casts()` | Relações / scopes / hooks | Traits |
|---|---|---|---|---|---|---|
| `app/Models/Item.php` | 238 | `items` | `name, description, price, original_price, category_id, condition, size, colors, status, is_published, is_featured` | `price/original_price/sold_price: decimal:2`, `sold_at/drafted_at: immutable_datetime`, `condition: ItemCondition`, `colors: array`, `status: ItemStatus`, `is_published/is_featured/is_draft: boolean` | `category()` BelongsTo, `photos()` HasMany (ordenado por `position`); scopes `published`, `featured`, `notSold`, `notDraft`, `drafts`; **`booted()`**: `creating` gera slug imutável com sufixo aleatório; `saving` deriva o snapshot de venda (`sold_at`/`sold_price` fora do `$fillable`, congela ao virar SOLD e limpa ao desfazer). Accessor `getRevenueAttribute()`; `toPublicArray()`, `toCardArray()` (corte enxuto p/ listagens), `isDraft()`. Consts `AI_INTAKE_PROCESSING/DONE/FAILED/REFUSED` | `HasFactory`, **`SoftDeletes`**, `LogsActivity` (log `items`) |
| `app/Models/SiteSetting.php` | 225 | `site_settings` | `whatsapp, instagram, pix_key, pix_key_type, pix_name, pix_city, hero_title, hero_subtitle, about_text, logo_path, logo_dark_path, mark_path, primary_color, seller_selection` (`layout` fica **fora** de propósito) | `billing_paid_until: immutable_date`, `billing_updated_at: immutable_datetime` | `$attributes` default `billing_status/layout/seller_selection` (evita o getter mágico resolver `layout()` como relação); `layout(): SiteLayout`, `sellerSelection(): SellerSelection`, `isSuspended/isPastDue/isActive`, `assetUrl()` static, `faviconUrl()`, `current()` (linha única `firstOrCreate` + `forceFill` do layout só na criação), `toPublicArray()`. Consts `DEFAULT_LOGO_URL`, `DEFAULT_MARK_URL`, `DEFAULT_PRIMARY_COLOR = '#2a7ba2'` (AA), `BILLING_ACTIVE/PAST_DUE/SUSPENDED` | `LogsActivity` (log `site_settings`) |
| `app/Models/Category.php` | 137 | `categories` | `name, slug, position, is_active` (`image_path` fora) | `position: integer`, `is_active: boolean` | `items()` HasMany; scope `active`; **`booted()`** `creating` gera slug único (`uniqueSlug()` com sufixo numérico), imutável no update; `imageUrl()`, `options()`, `adminOptions()` | `HasFactory`, `LogsActivity` (log `categories`) |
| `app/Models/SignupOrder.php` | 97 | `signup_orders` | `plan, cycle, store_name, slug, whatsapp, payer_name, cpf_cnpj, email, phone, ref` (estado/preço/ids do Asaas/trilha de aceite só por `forceFill`) | `status: SignupOrderStatus`, `amount/setup_fee_amount: integer`, `paid_at/setup_paid_at/terms_accepted_at: datetime` | `getRouteKeyName() = 'public_id'` (ulid público; id sequencial nunca exposto); scope `holdingSlug`; `isPending()`, `withoutCharge()`, `yearly()` | `LogsActivity` (log `signup_orders`) |
| `app/Models/AiAnalysis.php` | 79 | `ai_analyses` | `user_id, kind, provider, model, status, failure_reason, prompt_tokens, completion_tokens, cost_usd, photos_count` | `created_at: immutable_datetime`, tokens `integer`, `cost_usd: decimal:6`, `photos_count: integer` | `UPDATED_AT = null` (registro imutável); `$attributes` default `kind = intake`; `user()` BelongsTo; scope `thisMonth` (conta **todos** os status, inclusive failed/refused, para o teto mensal). Consts `STATUS_OK/REFUSED/FAILED`, `KIND_INTAKE/KIND_BACKGROUND` | — |
| `app/Models/Seller.php` | 76 | `sellers` | `name, whatsapp, is_active, position` | `is_active: boolean`, `position: integer` | `pick(int $itemId, Collection $active)` — **rodízio determinístico `ativas[id % N]`**, único lugar da fórmula; scope `active` | `HasFactory`, `LogsActivity` (log `sellers`) |
| `app/Models/Banner.php` | 70 | `banners` | `title, cta_label, cta_url, position, is_active` (`image_path` fora) | `position: integer`, `is_active: boolean` | scope `active`; `imageUrl()`. Sem soft delete de propósito | `HasFactory`, `LogsActivity` (log `banners`) |
| `app/Models/User.php` | 70 | `users` | `is_active, role_id, name, email, cpf_cnpj, phone, mobile, user_notes, password` | `email_verified_at: datetime`, `password: hashed`, `is_active: boolean` | `$hidden = ['password','remember_token']`; implementa `MustVerifyEmail`; sem `$with` (comentário: eager loading automático removido) | `HasFactory`, `Notifiable`, **`HasRolesAndPermissions`**, `LogsActivity` (log `users`) |
| `app/Models/ItemPhoto.php` | 68 | `item_photos` | `item_id, path, position, original_path, ai_status, ai_edited_at` | `position: integer`, `ai_edited_at: immutable_datetime` | `$appends = ['url']`; `item()` BelongsTo; `getUrlAttribute()`, `originalUrl()`, `isAiProcessing()`, `hasAiEdit()`. Consts `AI_PROCESSING/DONE/FAILED` | `HasFactory` |
| `app/Models/MetricEvent.php` | 56 | `metric_events` | `occurred_at, event, session_hash, item_id, source` | `occurred_at: immutable_datetime`, `event: Enum\MetricEvent`, `source: MetricSource` | `$timestamps = false` (a única data é `occurred_at`); `item()` BelongsTo; scopes `inWindow(from,to)`, `ofType(...MetricEvent)` | — |
| `app/Models/TermsAcceptance.php` | 55 | `terms_acceptances` | **`[]` — vazio de propósito** (tudo derivado no servidor via `forceFill`) | `accepted_at: datetime` | `user()` BelongsTo. Registro imutável (sem update/delete) | `LogsActivity` (log `terms_acceptances`) |
| `app/Models/Role.php` | 53 | `roles` | `name, label, priority` | — | `permissions()` BelongsToMany, `users()` HasMany; `getPriority()` (banco → fallback no enum `Roles`, `ValueError` → 0), `isSuperUser()` | — |
| `app/Models/AsaasWebhookEvent.php` | 35 | `asaas_webhook_events` | `asaas_event_id, event_type, payment_id, processed_at` | `processed_at: immutable_datetime` | `UPDATED_AT = null`; log de idempotência (só metadados, nunca o payload com dados do pagador) | — |
| `app/Models/Permission.php` | 21 | `permissions` | `name, label` | — | `roles()` BelongsToMany; `getIdsFromNames(array)`. **Sem `declare(strict_types=1)`** | — |

---

#### 3. `app/Enum/*` — 9 arquivos, 344 linhas

| Caminho | LOC | Cases | Métodos |
|---|---|---|---|
| `app/Enum/Roles.php` | 57 | `SUPER_USER`, `ADMIN`, `OWNER`, `STAFF`, `VISITOR` | `options()`, `label()`, `priority()` (100/90/60/40/5) |
| `app/Enum/Permissions.php` | 37 | Loja: `MANAGE_ITEMS`, `MANAGE_SITE_SETTINGS`, `VIEW_METRICS`; Plataforma: `MANAGE_USERS`, `MANAGE_PERMISSIONS`, `ASSIGN_ROLES`, `IMPERSONATE_USERS`, `MANAGE_ROLES` | `label()` |
| `app/Enum/SiteLayout.php` | 62 | `CLASSIC`, `BOUTIQUE` | `fromSetting(?string)` (null/typo → CLASSIC), `options()`, `label()`, `homePage()`, `itemPage()` — mapeia direto para componentes Inertia |
| `app/Enum/SellerSelection.php` | 43 | `ESCOLHA`, `RODIZIO` | `fromSetting(?string)` (null/typo → ESCOLHA), `options()`, `label()` |
| `app/Enum/SignupOrderStatus.php` | 41 | `PENDING_PAYMENT`, `PAID`, `PROVISIONED`, `EXPIRED`, `CANCELED` | `holdingSlug(): list<self>` (os 3 primeiros), `label()` |
| `app/Enum/ItemCondition.php` | 29 | `NEW`, `LIKE_NEW`, `USED` | `options()`, `label()` |
| `app/Enum/ItemStatus.php` | 29 | `AVAILABLE`, `RESERVED`, `SOLD` | `options()`, `label()` |
| `app/Enum/MetricSource.php` | 26 | `SHARED`, `INSTAGRAM`, `GOOGLE`, `DIRECT`, `OTHER` | `label()` |
| `app/Enum/MetricEvent.php` | 20 | `HOME_VIEW`, `ITEM_VIEW`, `WHATSAPP_CLICK`, `LINK_COPY` | — (homônimo proposital do model; importado como `MetricEventType` onde convivem) |

---

#### 4. Casts customizados, DTOs e Value Objects

**Não existe `app/Casts/` no ctvitrine** e **nenhuma classe implementa `CastsAttributes`** (grep com 0 ocorrências). Todos os casts são nativos ou enums.

| Caminho | LOC | O que é |
|---|---|---|
| `app/DataTransferObjects/PermissionMetaDTO.php` | 35 | Único arquivo de `app/DataTransferObjects/`. `readonly class` com `name`, `label`, `meta`; `fromPermission(Permission)` (decodifica `pivot->meta` JSON) e `toArray()` |

DTOs/objetos de valor **fora** de `app/DataTransferObjects/`, todos vivendo dentro de `app/Services/`:

| Caminho | Forma | Papel |
|---|---|---|
| `app/Services/AiIntake/ItemDraft.php` | `final readonly` | Rascunho sugerido pela IA; `toArray()` em snake_case |
| `app/Services/AiIntake/AnalysisResult.php` | `final readonly` | Resultado da análise + tokens/custo; construtores nomeados `ok/refused/failed` |
| `app/Services/AiIntake/AnalysisContext.php` | `final readonly` | Contexto da loja + orçamento de tempo |
| `app/Services/AiImage/ImageEditResult.php` | `final readonly` (construtor privado) | Resultado da edição de fundo |
| `app/Services/Ops/BillingInput.php` | `final` com props `readonly` | Entradas do `billing:subscribe` |
| `app/Services/Ops/InstanceState.php` | `final` mutável com persistência em JSON | Estado do provisionamento |

---

#### 5. `app/Events`, `app/Listeners`, observers

**Não existe `app/Observers/` e nenhum arquivo em `app/` ou `bootstrap/` menciona `Observer`** (grep sem resultados). Os hooks de model são `static::booted()` inline em `Item` e `Category` (seção 2).

| Caminho | LOC | Dispara / reage | Wiring |
|---|---|---|---|
| `app/Events/ImpersonateStarted.php` | 21 | Disparado por `ImpersonationService::start()`; props `readonly User $impersonator`, `User $targetUser`. `Dispatchable` + `SerializesModels` | `AppServiceProvider::configEvents()` |
| `app/Events/ImpersonateStopped.php` | 21 | Disparado por `ImpersonationService::stop()`; props `readonly User $originalUser`, `User $impersonatedUser` | idem |
| `app/Events/RoleUserUpdatedEvent.php` | 31 | Broadcast em canal público `users.roles` com `{id, role}`. **Nenhum `dispatch()` desta classe existe em `app/`** (grep de `Event::listen`/dispatch só encontra os dois de impersonação) e usa `$this->user->roles->first()` — relação `roles` que `HasRolesAndPermissions` **não define** (só `role()` e `permissions()`). Sem `declare(strict_types=1)` | não registrado |
| `app/Listeners/LogImpersonateStarted.php` | 38 | Reage a `ImpersonateStarted`: `activity('security')->performedOn(target)->causedBy(impersonator)->event('impersonate_started')` com propriedades `type/scope/request{url,ip_address,user_agent}/impersonation{...}` | `Event::listen(...)` no `AppServiceProvider` |
| `app/Listeners/LogImpersonateStopped.php` | 38 | Espelho do anterior para `ImpersonateStopped` (corpo praticamente idêntico) | idem |
| `app/Resolvers/ActivityCauserResolver.php` | 41 | Não é listener, mas fecha a cadeia: resolve o causer do activitylog para o **usuário original** durante impersonação; varre `activitylog.causer_guards` com `try/catch` por guard | `AppServiceProvider::configActivitylog()` via `CauserResolver::resolveUsing()` |

---

#### 6. `app/Jobs` — 3 arquivos, 573 linhas

Nenhum job usa `onQueue()`, `$queue`, `ShouldBeUnique`, `WithoutOverlapping`, `uniqueId()`, `retryUntil()` ou `middleware()` (grep sem ocorrências). Todos caem na fila **`default`** (`config/queue.php` → `QUEUE_CONNECTION=database`; `config/horizon.php` supervisor `'queue' => ['default']`).

| Caminho | LOC | Fila | `$tries` | `$timeout` | backoff | `failed()` | Idempotência / re-leitura |
|---|---|---|---|---|---|---|---|
| `app/Jobs/AnalyzeDraftFields.php` | 218 | `default` | **2** ("custa centavos, vale insistir") | 100s (queued_timeout 40 × 2 + espera) | `public array $backoff = [15]` | **sim** — sem ele o rascunho fica em `processing` para sempre | Relê o `Item` **depois** da chamada (15–20s) antes de escrever, para não apagar o que a lojista digitou nesse intervalo; preenche **só campos vazios**; aborta se o rascunho sumiu/publicou. `handle(VisionAnalyzer $analyzer)` — driver injetado. Audita toda tentativa em `ai_analyses(kind=intake)`, inclusive na falha |
| `app/Jobs/ProcessPhotoBackground.php` | 160 | `default` | **1** ("edição de imagem é a chamada cara ~US$ 0,12; repetir dobraria o custo") | 120s (precisa vencer o `Http::timeout(60)` e o timeout do supervisor do Horizon) | — | **sim** — foto presa em `processing` faria a tela girar eternamente | Relê a `ItemPhoto` e confere `isAiProcessing()` **e** `original_path` inalterado antes de gravar (evita ressuscitar foto descartada / atropelar revert). `handle(BackgroundEditor, ImageOptimizer)`. Audita em `ai_analyses(kind=background)` mesmo no `failed()` |
| `app/Jobs/SendMetaCapiEvent.php` | 195 | `default` | **3** | 30s | `public const array BACKOFF = [30, 300]` + `release()` manual em `retryLater()` (não a propriedade `$backoff`) | não implementado (falha morre em log) | **Dedupe pelo `event_id` = `signup-order-{public_id}`** — re-webhook do Asaas ou retry contam uma venda só. `event_time` é o `paid_at` (não o instante do worker). Reconfere `TrackingMode::capiEnabled()` no início (deploy pode ter desligado). PII com `sha256` (e-mail normalizado, telefone E.164 sem `+`); payload da fila carrega só `orderId`. Nunca lança: o pagamento já foi aceito |

**Pontos de dispatch** (4, todos verificados): `app/Services/AiStudio/DraftDispatcher.php:42` e `:67`; `app/Http/Controllers/Item/AiBackgroundController.php:53`; `app/Http/Controllers/Signup/SignupWebhookController.php:128`.

---

#### 7. `app/Mail` e notificações — 4 mailables, 234 linhas

**Não existe `app/Notifications/`.** A única notificação usada é a nativa de verificação de e-mail (`$request->user()->sendEmailVerificationNotification()` em `app/Http/Controllers/Auth/EmailVerificationNotificationController.php`), via trait `Notifiable` em `User`. Todos os 4 mailables implementam `ShouldQueue` e usam `Content(markdown: ...)`.

| Caminho | LOC | Canal | View | Destinatário / BCC | Payload |
|---|---|---|---|---|---|
| `app/Mail/TermsAcceptanceReceiptMail.php` | 66 | mail (queued) | `emails.legal.terms-acceptance-receipt` | definido no dispatch em `app/Http/Controllers/Legal/StoreAcceptController.php:67` (`Mail::to()->bcc()`) | `name`, `email`, `store`, `version`, `hash`, `acceptedAt`, `ip` + **texto integral** via `TermsDocument::raw(TERMS)` — cópia autossuficiente que sobrevive ao churn da instância |
| `app/Mail/SignupTermsReceiptMail.php` | 59 | mail (queued) | `emails.signup.terms-receipt` | `app/Services/Signup/SignupService.php:247`, BCC de `TermsMode::receiptBcc()` | mesma trilha, a partir do `SignupOrder` |
| `app/Mail/SignupPaidNotificationMail.php` | 58 | mail (queued) | `emails.signup.paid-notification` | `SignupMode::notifyEmail()` (`app/Http/Controllers/Signup/SignupWebhookController.php:120`) | resumo do pedido + **linha de comando pronta**: `php artisan instance:provision {slug} --plan={plano} --from-order={public_id}` |
| `app/Mail/SignupWelcomeMail.php` | 51 | mail (queued) | `emails.signup.welcome` | `$order->email` (`SignupWebhookController.php:121`) | `order`, `planLabel`, `domain` = `{slug}.{OpsConfig::clientSuffix()}`; fixa a expectativa de 48h úteis |

Views correspondentes: `resources/views/emails/legal/terms-acceptance-receipt.blade.php`, `resources/views/emails/signup/{paid-notification,terms-receipt,welcome}.blade.php`.

---

#### 8. Exceptions de domínio

Não existe `app/Exceptions/`. As exceções de domínio moram junto do serviço que as lança:

| Caminho | LOC | Estende | Contrato |
|---|---|---|---|
| `app/Services/Asaas/AsaasApiException.php` | 22 | `RuntimeException` | Guarda `asaasMethod`, `asaasPath`, `status` — **nunca o corpo (dados do pagador) nem a chave** |
| `app/Services/Ops/PloiApiException.php` | 23 | `RuntimeException` | Guarda `ploiMethod`, `ploiPath`, `status` — nunca corpo nem token |
| `app/Services/Ops/ProvisioningException.php` | 17 | `RuntimeException` | Falha assíncrona do ploi (site que não subiu, clone reportado como falha), distinta de erro HTTP |

Fora isso, `app/Services/Legal/TermsDocument.php` lança `InvalidArgumentException` e `app/Services/Ops/StubRenderer.php` lança `RuntimeException` em placeholder órfão; `app/Services/Signup/SignupService.php` lança `ValidationException::withMessages(['slug' => ...])` na corrida de slug. O único handler customizado é o de `PostTooLargeException` em `bootstrap/app.php` (ramo JSON 413 para o Estúdio + `back()->withErrors()` para o resto).

---

#### 9. `app/Traits` — 3 arquivos, 278 linhas

| Caminho | LOC | Usado por | API pública |
|---|---|---|---|
| `app/Traits/Models/HasRolesAndPermissions.php` | 197 | `App\Models\User` | `hasRole()`, `hasPermissionTo()` (cache `user:{id}:permissions` via `Cache::rememberForever`), `getAllPermissions()`, `assignRole()`, `revokeRole()` (cai para `VISITOR`), `givePermissionTo(perm, meta)` (attach/updateExistingPivot com `meta` JSON), `permissions()` BelongsToMany com pivot `meta`, `revokePermissionTo()`, `role()` BelongsTo, `getPermissionMeta()`, `canImpersonateAny()`, `canImpersonate(User)`, `getCustomPermissionsCount()`, `getCustomPermissionsList()`. Privado: `getPermissionCacheKey()`, `refreshPermissionsCache()` (forget + re-remember) |
| `app/Traits/Requests/NormalizesColors.php` | 51 | FormRequests de item | `normalizeColors()` protegido: trim, remove vazios e duplicatas case-insensitive antes da validação |
| `app/Traits/Requests/NormalizesPosition.php` | 30 | FormRequests de banner e vendedora | `normalizeBlankPosition()`: campo em branco → `0` (o `ConvertEmptyStringsToNull` + coluna NOT NULL davam 500); campo **ausente** continua ausente de propósito, para o update parcial não zerar a ordenação |

---

#### 10. Os outros 6 subdiretórios de `app/` (fora desta frente, listados para fechar o `ls-tree`)

| Caminho | Arq. | LOC | Conteúdo |
|---|---|---|---|
| `app/Http/Controllers` | 87 | 4.308 | single-action por verbo, agrupados por módulo (`Auth`, `Banner`, `Category`, `Docs`, `Item` + `Item/Studio`, `Legal`, `Metrics`, `PermissionRole`, `Seller`, `Settings`, `Signup`, `Site`, `SiteSetting`, `User`, `Webhook`) |
| `app/Http/Requests` | 28 | 1.365 | FormRequests por módulo |
| `app/Http/Middleware` | 15 | 619 | `EnsureAiImageMode`, `EnsureAiIntakeMode`, `EnsureAiStudioMode`, `EnsureBillingMode`, `EnsureLandingMode`, `EnsureMetricsMode`, `EnsureReportMode`, `EnsureSignupMode`, `EnsureTermsAccepted`, `EnsureTermsMode`, `EnsureUserManagement`, `EnsureVitrineActive`, `HandleAppearance`, `HandleInertiaRequests`, `RedirectDemoToCanonicalHost` |
| `app/Http/Resources` | 2 | 102 | `RoleResource.php`, `UserResource.php` |
| `app/Console/Commands` | 19 | 2.677 | `ai-image:usage` (41), `ai-studio:usage` (64), `billing:evaluate` (62), `billing:status` (104), `demo:manas-down` (109), `demo:manas-up` (76), `demo:switch` (105), `metrics:prune` (40), `instance:migrate-storage` (123), `metrics:monthly-report` (52), **`billing:subscribe` (195)**, **`instance:provision` (818)**, `photos:optimize` (80), `items:prune-drafts` (50), `items:prune-orphans` (138), `items:prune-trashed` (61), `signup:expire` (141), `ai:destravar` (64), **`vitrine:env` (354)** |
| `app/Policies` | 1 | 99 | `app/Policies/UserPolicy.php`: `viewAny/view/create/update/delete/toggleActive/impersonate/managePermissions`; usa strings cruas (`'manage_users'`, `'super_user'`) em vez dos enums, e `update()` lê `request()->has('is_active')` de dentro da policy |
| `app/Providers` | 2 | 199 | `AppServiceProvider.php` (170): `register()` faz binding de `VisionAnalyzer` (Gemini/OpenAI por config) e `BackgroundEditor`; `boot()` chama 11 configuradores — `Model::shouldBeStrict()`, `DB::prohibitDestructiveCommands()`, `URL::forceHttps()` em prod, `Date::use(CarbonImmutable)`, causer do activitylog, **gates auto-registrados um por case de `Permissions`**, `Gate::policy(User::class, UserPolicy::class)`, `JsonResource::withoutWrapping()`, `Event::listen` dos 2 de impersonação, e 4 rate limiters (`metrics-track` 60/min por IP, `ai-intake` 10/min, `ai-image` 10/min, `ai-studio` 20/min por usuário) + `LogViewer::auth` restrito a `SUPER_USER`. `HorizonServiceProvider.php` (29): gate `viewHorizon` = `SUPER_USER` |
| `app/Rules` | 2 | 161 | `CpfCnpj.php` (101, sem `strict_types`, duplica a lógica de `Ops\DocumentValidator`), `SafeLinkUrl.php` (60 — allow-list para `href` de CTA: relativo `/…` ou `http(s)://`; recusa `//host`, `/\host` e qualquer caractere de controle `\x00-\x1F\x7F`) |
| `app/Resolvers` | 1 | 41 | `ActivityCauserResolver.php` (detalhado na seção 5) |
| `app/DataTransferObjects` | 1 | 35 | seção 4 |

---

#### 11. Arquivos e LOC por subdiretório de `app/` — ctvitrine `53d7d9a` × boilerplate `origin/main`

| Subdiretório de `app/` | ctvitrine arq. | ctvitrine LOC | boilerplate arq. | boilerplate LOC |
|---|---:|---:|---:|---:|
| `Console` | 19 | 2.677 | 2 | 313 |
| `DataTransferObjects` | 1 | 35 | — | — |
| `Enum` | 9 | 344 | 2 | 142 |
| `Events` | 3 | 73 | 3 | 78 |
| `Http` | 132 | 6.394 | 44 | 2.357 |
| `Jobs` | 3 | 573 | — | — |
| `Listeners` | 2 | 76 | 3 | 200 |
| `Mail` | 4 | 234 | — | — |
| `Models` | 14 | 1.280 | 4 | 184 |
| `Policies` | 1 | 99 | 1 | 255 |
| `Providers` | 2 | 199 | 2 | 224 |
| `Resolvers` | 1 | 41 | 1 | 41 |
| `Rules` | 2 | 161 | 2 | 136 |
| `Services` | **62** | **6.505** | **4** | **363** |
| `Traits` | 3 | 278 | 1 | 260 |
| `Casts` | — | — | 1 | 50 |
| `Support` | — | — | 7 | 522 |
| `ValueObjects` | — | — | 1 | 214 |
| **Total `app/`** | **258** | **18.969** | **78** | **5.339** |

Detalhe de `app/Services/` do ctvitrine por subpasta (soma = 62 arq. / 6.505 linhas):

| Subpasta | Arq. | LOC |
|---|---:|---:|
| `app/Services/Metrics` | 10 | 2.003 |
| `app/Services/Ops` | 12 | 1.197 |
| `app/Services/AiIntake` | 9 | 624 |
| `app/Services/Signup` | 5 | 537 |
| `(raiz de app/Services)` | 6 | 548 |
| `app/Services/Legal` | 2 | 272 |
| `app/Services/AiImage` | 5 | 244 |
| `app/Services/Asaas` | 3 | 232 |
| `app/Services/AiStudio` | 3 | 185 |
| `app/Services/Docs` | 1 | 183 |
| `app/Services/Billing` | 2 | 146 |
| `app/Services/Env` | 1 | 105 |
| `app/Services/Tracking` | 1 | 99 |
| `app/Services/Plan` | 1 | 78 |
| `app/Services/Landing` | 1 | 52 |

**Deltas estruturais desta frente** (ambos os lados medidos, não inferidos): o ctvitrine tem 4 diretórios de domínio que o boilerplate não tem (`Jobs`, `Mail`, `DataTransferObjects`, e as 14 subpastas de `Services`); o boilerplate tem 3 que o ctvitrine não tem (`Casts` — `MoneyCast.php`; `Support` — `Br/CpfFormatter`, `Br/CpfHasher`, `Br/PhoneNormalizer`, `Listing/ListQueryNormalizer`, `Logging/PiiAwareTap`, `Logging/PiiScrubber`, `Logging/PiiScrubbingProcessor`; `ValueObjects` — `Money.php`). Os 4 arquivos compartilhados por nome em `Services` são `ImpersonationService.php`, `PermissionManagementService.php`, `RoleFilterService.php` (o boilerplate tem ainda `PermissionCatalogService.php`, ausente no ctvitrine). Em `Models`, o boilerplate tem `PermissionUser.php`, que não existe no ctvitrine. Em `Listeners`, o boilerplate tem `EnforceMailAllowlist.php`, ausente no ctvitrine. Em `Rules`, `CpfCnpj.php` existe nos dois e `MoneyString.php` só no boilerplate; `SafeLinkUrl.php` só no ctvitrine.

---

#### Medições

Todos os comandos abaixo foram efetivamente executados. `SRC=/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `BP=/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`. "LOC" = linhas físicas contadas por `wc -l` (inclui comentários e linhas em branco).

1. **258 arquivos em `app/`** — `git -C $SRC ls-tree -r 53d7d9a --name-only -- app | wc -l` → `258`
2. **18.969 linhas em `app/`** — `git -C $SRC ls-tree -r 53d7d9a --name-only -- app | while IFS= read -r f; do git -C $SRC show "53d7d9a:$f"; done | wc -l` → `18969`
3. **Arq./LOC por subdiretório de `app/` (tabela da seção 11, coluna ctvitrine)** —
   `git -C $SRC ls-tree -r 53d7d9a --name-only -- app | while IFS= read -r f; do d=$(echo "$f" | awk -F/ 'NF>2{print $2} NF==2{print "(root)"}'); n=$(git -C $SRC show "53d7d9a:$f" | wc -l | tr -d ' '); echo "$d $n"; done | awk '{files[$1]++; loc[$1]+=$2} END {for (k in files) printf "%s|%d|%d\n", k, files[k], loc[k]}' | sort`
   (nenhuma linha `(root)` foi emitida → confirma que não há arquivo solto na raiz de `app/`)
4. **Arq./LOC por subpasta de `app/Services` (tabela final da seção 11)** — mesmo pipeline com `-- app/Services` e `awk -F/ 'NF>3{print $3} NF==3{print "(Services root)"}'`. A raiz de `Services` foi então medida arquivo a arquivo: `for f in ContentImageService ImageOptimizer ImpersonationService ItemPhotoService PermissionManagementService RoleFilterService; do git -C $SRC show "53d7d9a:app/Services/$f.php" | wc -l; done` → `50 101 68 90 26 213` = **548**. Conferência de fechamento: 5.957 (subpastas) + 548 (raiz) = **6.505** = total de `Services`.
5. **62 / 14 / 9 arquivos** — `git -C $SRC ls-tree -r 53d7d9a --name-only -- app/Services | wc -l` → `62`; idem `-- app/Models` → `14`; idem `-- app/Enum` → `9`
6. **LOC por arquivo (colunas "LOC" das seções 1–9)** —
   `for f in $(git -C $SRC ls-tree -r 53d7d9a --name-only -- app/Services); do echo "$(git -C $SRC show "53d7d9a:$f" | wc -l) $f"; done` e o mesmo laço para `app/Models app/Enum app/Events app/Listeners app/Jobs app/Mail app/Traits app/DataTransferObjects app/Rules app/Policies app/Resolvers app/Providers`
7. **Subdivisão de `app/Http` (seção 10)** — mesmo pipeline do item 3 com `-- app/Http` e `cut -d/ -f3` → `Controllers|87|4308`, `Middleware|15|619`, `Requests|28|1365`, `Resources|2|102` (soma 132 / 6.394 = bate com a linha `Http` do item 3)
8. **LOC + `signature` dos 19 comandos (seção 10)** — `for f in $(git -C $SRC ls-tree -r 53d7d9a --name-only -- app/Console); do n=$(git -C $SRC show "53d7d9a:$f" | wc -l); sig=$(git -C $SRC show "53d7d9a:$f" | grep -m1 -E "signature *="); echo "$f|$n|$sig"; done`
9. **Coluna boilerplate da seção 11** — `git -C $BP ls-tree -r origin/main --name-only -- app | while IFS= read -r f; do d=$(echo "$f" | awk -F/ 'NF>2{print $2} NF==2{print "(root)"}'); n=$(git -C $BP show "origin/main:$f" | wc -l | tr -d ' '); echo "$d $n"; done | awk '{files[$1]++; loc[$1]+=$2} END {for (k in files) printf "%s|%d|%d\n", k, files[k], loc[k]}' | sort` (sempre `origin/main`, nunca o disco nem `main` local). Lista de nomes para os deltas: `git -C $BP ls-tree -r origin/main --name-only -- app | sort`
10. **Ausência de casts customizados** — `git -C $SRC grep -c "CastsAttributes" 53d7d9a -- app` → sem ocorrências
11. **Ausência de observers** — `git -C $SRC grep -ln "Observer" 53d7d9a -- app bootstrap` → saída vazia
12. **Wiring de eventos (2 registros)** — `git -C $SRC grep -n "Event::listen\|->listen(" 53d7d9a -- app bootstrap` → 2 linhas, ambas em `app/Providers/AppServiceProvider.php:167-168`
13. **`$table` / `$guarded` / `$hidden` / SoftDeletes nos models** — `git -C $SRC grep -n 'protected \$table' 53d7d9a -- app/Models` → nenhum; `'protected \$guarded'` → nenhum; `'protected \$hidden'` → 1 (`app/Models/User.php:37`); `git -C $SRC grep -ln "SoftDeletes" 53d7d9a -- app/Models` → 1 (`app/Models/Item.php`)
14. **Configuração de fila dos jobs** — `git -C $SRC grep -n "onQueue\|public \$queue\|\$this->queue" 53d7d9a -- app` → sem ocorrências; `git -C $SRC grep -n "ShouldBeUnique\|WithoutOverlapping\|uniqueId\|retryUntil\|middleware()" 53d7d9a -- app` → sem ocorrências; `git -C $SRC show 53d7d9a:config/queue.php | grep -n default` → `'default' => env('QUEUE_CONNECTION', 'database')`; `git -C $SRC show 53d7d9a:config/horizon.php | grep -n queue` → `'queue' => ['default']`
15. **Pontos de dispatch dos jobs (4)** — `git -C $SRC grep -n "AnalyzeDraftFields::dispatch\|ProcessPhotoBackground::dispatch\|SendMetaCapiEvent::dispatch" 53d7d9a -- app`
16. **Views de e-mail (4)** — `git -C $SRC ls-tree -r 53d7d9a --name-only -- resources/views/emails`
17. **Ausência de `app/Notifications`** — decorre do item 1 (o `ls-tree` completo de `app/` não contém esse caminho); uso de notificação nativa localizado por `git -C $SRC grep -n "Notification" 53d7d9a -- app`

Nenhum valor de chave, token, segredo, senha, e-mail real, CPF/CNPJ ou telefone foi transcrito: onde o código lê credencial, este documento cita apenas o caminho, a env/chave de config e `***`.

---

### Frente 4 — commands, scheduler, filas/Horizon

Fonte: `ctvitrine` @ `53d7d9a` (somente `git show`/`git ls-tree`/`git grep`). Alvo de comparação: `boilerplate` @ `origin/main`.

---

#### 4.1 Inventário de `app/Console/Commands/**` — 19 arquivos, 19 comandos

Todos os 19 são `final class` com `declare(strict_types = 1)` (19/19 medidos). Nenhum implementa `Isolatable`, nenhum define `protected $hidden` (0 ocorrências medidas). Nenhum define `$signature` com `{--isolated}`.

| # | Caminho | Signature | Descrição (`$description`) |
|---|---|---|---|
| 1 | `app/Console/Commands/AiImageUsageCommand.php` | `ai-image:usage` | Exibe o uso mensal e o custo estimado do fundo por IA |
| 2 | `app/Console/Commands/AiStudioUsageCommand.php` | `ai-studio:usage` | Exibe o uso mensal e o custo estimado do Estúdio IA |
| 3 | `app/Console/Commands/BillingEvaluateCommand.php` | `billing:evaluate` | Aplica carência/suspensão e reconciliação do estado de cobrança |
| 4 | `app/Console/Commands/BillingStatusCommand.php` | `billing:status {status?} {--paid-until=} {--show}` | Força/exibe o estado de cobrança (override manual de suporte) |
| 5 | `app/Console/Commands/DemoManasDownCommand.php` | `demo:manas-down {--backup=} {--force}` | Restaura os dados de antes do case de demonstração |
| 6 | `app/Console/Commands/DemoManasUpCommand.php` | `demo:manas-up {--force}` | Ativa o case de demonstração (com backup para reversão) |
| 7 | `app/Console/Commands/DemoSwitchCommand.php` | `demo:switch {case?} {--force}` | Troca o case ativo da instância de demonstração |
| 8 | `app/Console/Commands/MetricsPruneCommand.php` | `metrics:prune {--all}` | Remove eventos de métricas além da janela de retenção |
| 9 | `app/Console/Commands/MigrateStorageToR2Command.php` | `instance:migrate-storage {slug} {--dry-run} {--overwrite} {--force}` | Copia as fotos do disco local (public) para o R2 (s3) sob o prefixo do slug. Roda NA instância. |
| 10 | `app/Console/Commands/MonthlyReportCommand.php` | `metrics:monthly-report {--month=}` | Gera o relatório mensal da vitrine em texto pronto para WhatsApp |
| 11 | `app/Console/Commands/Ops/BillingSubscribeCommand.php` | `billing:subscribe {slug} {--plan=} {--cycle=monthly} {--name=} {--cpf-cnpj=} {--email=} {--phone=} {--domain=} {--resume}` | Ativa a assinatura Asaas de um cliente (customer, subscription, webhook e envs na instância) |
| 12 | `app/Console/Commands/Ops/ProvisionInstanceCommand.php` | `instance:provision {slug} {--plan=essencial} {--domain=} {--server=} {--whatsapp=} {--admin-email=} {--admin-name=} {--instagram=} {--pix-key=} {--pix-type=} {--pix-name=} {--pix-city=} {--module=*} {--resume} {--force} {--from-order=} {--with-billing} {--billing-name=} {--billing-cpf-cnpj=} {--billing-email=} {--billing-phone=} {--billing-cycle=monthly}` | Provisiona uma instância de cliente no ploi (site, banco, .env, deploy, SSL, Horizon, cron) |
| 13 | `app/Console/Commands/PhotosOptimizeCommand.php` | `photos:optimize {--force}` | Reprocessa as fotos existentes para o padrão da vitrine |
| 14 | `app/Console/Commands/PruneDraftsCommand.php` | `items:prune-drafts` | Remove rascunhos órfãos do Estúdio IA além do TTL |
| 15 | `app/Console/Commands/PruneOrphanPhotoFilesCommand.php` | `items:prune-orphans {--apply} {--hours=24}` | Lista (ou apaga, com `--apply`) arquivos de foto que nenhum item referencia |
| 16 | `app/Console/Commands/PruneTrashedItemsCommand.php` | `items:prune-trashed {--days=}` | Apaga os arquivos de foto dos itens na lixeira além da janela de retenção |
| 17 | `app/Console/Commands/SignupExpireCommand.php` | `signup:expire` | Expira pedidos de adesão pendentes além do TTL e cancela as cobranças no Asaas |
| 18 | `app/Console/Commands/UnstickAiStatesCommand.php` | `ai:destravar {--minutes=}` | Marca como falha os estados de IA presos em processamento além da janela |
| 19 | `app/Console/Commands/VitrineEnvCommand.php` | `vitrine:env {--check} {--file=}` | Diagnostica módulos, tunables, segredos e higiene do .env da instância |

#### 4.2 O que cada comando faz, idempotência e efeitos colaterais

| Caminho | O que faz (fato do código) | Reexecução | Escreve em disco | Escreve em banco | Serviço externo |
|---|---|---|---|---|---|
| `app/Console/Commands/AiImageUsageCommand.php` | `AiImageUsage::used()/limit()` + `sum('cost_usd')` de `ai_analyses` `thisMonth()` `kind=background`; imprime `$this->table` com módulo e provider/modelo | Sem efeito (leitura pura) | não | não (só SELECT) | não |
| `app/Console/Commands/AiStudioUsageCommand.php` | Soma `AiUsage::snapshot()` + `AiImageUsage::snapshot()` + custo `kind IN (intake,background)`; conta `Item::drafts()`, fotos `ai_status=processing` e drafts `ai_intake_status=processing` mais velhos que `vitrine.ai_studio.stuck_after_minutes` | Sem efeito (leitura pura) | não | não (só SELECT) | não |
| `app/Console/Commands/BillingEvaluateCommand.php` | `SiteSetting::current()`; se `isPastDue()` e `paid_until + grace_days < hoje` → `BILLING_SUSPENDED`; se suspenso/atrasado e `paid_until >= hoje` → `BILLING_ACTIVE`; `forceFill(['billing_status','billing_updated_at'])->save()` + `Log::info` | Converge (estado alvo derivado de `paid_until`/`grace`); segunda passada no mesmo dia cai no ramo "sem mudança" | não | sim (`site_settings`) | não |
| `app/Console/Commands/BillingStatusCommand.php` | Sem argumento ou `--show` só imprime estado + último `AsaasWebhookEvent`; com `active\|past_due\|suspended` faz `forceFill` + `save`, valida `--paid-until` com `CarbonImmutable::parse` (try/catch → FAILURE) e grava `activity('billing')->log("billing_override_{$status}")` | Reexecutar com o mesmo status reescreve `billing_updated_at` e grava **nova** linha de activity log | não | sim (`site_settings` + activity log) | não |
| `app/Console/Commands/DemoManasDownCommand.php` | Resolve backup (`--backup` ou o mais recente de `demo-backups/*.json` no disco `local`), valida o JSON; com confirmação (`--force` pula) remove os itens do catálogo (`require database_path('seeders/data/items-demo-manas.php')`) via `deleteAllPhotos` + `forceDelete`; `SiteSetting::current()->update($backup['settings'])`; `Storage::delete(['branding/…logo.jpg','branding/…mark.jpg'])`; republica `published_item_ids`; remove a usuária do case (`User::firstWhere('email', '***')` → `permissions()->detach()` + `forceDelete()`); `Cache::forget('sitemap.xml')` | Segunda passada remove 0 itens/usuária mas **reaplica** settings e republicação do mesmo backup | sim (apaga arquivos de foto e de branding) | sim (delete/update em items, users, site_settings) | não |
| `app/Console/Commands/DemoManasUpCommand.php` | Grava backup JSON em `storage/app/private/demo-backups/<prefixo>-{Y-m-d_His}.json` (settings + ids publicados); `Item::published()->update(['is_published' => false])` (mass update, sem eventos/activity log); instancia `DemoManasSeeder` sem command (guard interativo do seeder desligado de propósito); conta itens publicados; `Cache::forget('sitemap.xml')` | **Cada run cria um arquivo de backup novo** (nome com timestamp); o 2º backup já reflete o case aplicado (o comando avisa quando detecta isso) | sim (novo JSON em `storage/app/private/demo-backups/`) | sim (mass update + seeder) | não |
| `app/Console/Commands/DemoSwitchCommand.php` | Recusa se `!config('vitrine.demo.instance')`; sem argumento lista case ativo (`Cache::get('demo:active_case')`) e disponíveis; com case: apaga **todos** os itens (`withTrashed` + `deleteAllPhotos` + `forceDelete`), `Category::delete()`, `Seller::delete()`, banners (`Storage::delete($banner->image_path)` + `delete()`), zera `layout`/`seller_selection` com `saveQuietly()`, roda o seeder do case, `Cache::forever('demo:active_case', $slug)` e `Cache::forget('sitemap.xml')` | Reexecutar re-apaga tudo e re-semeia; sem argumento é leitura pura | sim (apaga fotos e imagens de banner) | sim (delete em items/categories/sellers/banners + seeder) | não |
| `app/Console/Commands/MetricsPruneCommand.php` | `MetricEvent::where('occurred_at','<', now()->subDays(vitrine.metrics.retention_days ?? 395))->delete()`; `--all` pede `confirm()` e apaga a tabela inteira | Idempotente (2ª passada apaga 0) | não | sim (`metric_events`) | não |
| `app/Console/Commands/MigrateStorageToR2Command.php` | Exige `filesystems.disks.s3.bucket` e `.key` preenchidos; lista `Storage::disk('public')->allFiles()`; avisa quando `AWS_ROOT !== $slug`; `--dry-run` lista sem escrever; sem `--force` pede confirmação; copia via `readStream`/`writeStream` pulando arquivos com `exists()` **e** `size()` iguais; conta copiados/pulados/falhas; `FAILURE` se houve falha; **não tem OpsGuard** (roda na instância, por design documentado no docblock) | Idempotente por skip de tamanho igual (`--overwrite` força recópia) | lê `public`, escreve no disco `s3` | não | **sim — R2/S3** |
| `app/Console/Commands/MonthlyReportCommand.php` | `ReportMode::enabled()` falso → `error` + `FAILURE`; valida `--month` com `ReportCalendar::isAllowed()`; monta via `MonthlyReport::build()` + `MonthlyReportText::render()`; lê o nome da loja com `SiteSetting::query()->first()` (comentário explícito: sem `firstOrCreate` para não criar linha nem poluir o activity log) | Sem efeito (leitura pura) | não (o scheduler é que anexa a saída a um log) | não | não |
| `app/Console/Commands/Ops/BillingSubscribeCommand.php` | `OpsGuard::check()` + exige `ASAAS_OPS_TOKEN`; valida slug `^[a-z0-9-]+$`, plano (`PlanMap`), ciclo, 4 campos obrigatórios do pagador, CPF/CNPJ (`DocumentValidator`) e e-mail (`FILTER_VALIDATE_EMAIL`); exige `InstanceState::exists($slug)` ou `--domain`; recusa se `completed('billing_subscription')` sem `--resume`; delega ao `BillingSubscriber::run()`; em `AsaasApiException\|PloiApiException` imprime o caminho de retomada; `activity('ops')->log('billing:subscribe')` dentro de try/catch (auditoria best-effort) | `--resume` retoma sem recriar cobrança; sem `--resume` recusa quando já há assinatura | sim (`storage/ops/instances/{slug}.json` via `InstanceState`) | sim (activity log) | **sim — Asaas + ploi** |
| `app/Console/Commands/Ops/ProvisionInstanceCommand.php` | `OpsGuard::check()`; `--from-order` busca o pedido na landing (`GET /api/ops/signup-orders/{publicId}` com bearer, timeout 15s) e exige status `paid` + `asaas_subscription_id`; 43 slugs reservados bloqueados salvo `--force`; senha inicial `Str::password(14, symbols: false)`; 9 passos idempotentes gravados em `InstanceState`: `stepSite`, `stepRepository`, `stepDeployScript`, `stepDatabaseAndEnv`, `stepDeploy`, `stepSsl`, `stepDaemon`, `stepCron`, `stepSmoke`; smoke com `SMOKE_MAX_ATTEMPTS=60` × `SMOKE_INTERVAL_SECONDS=10` procurando `id="app"`; encadeia `--with-billing` (`BillingSubscriber`) ou adota o billing do pedido e faz `POST …/provisioned` | `--resume` pula passos já `completed()`; sem `--resume` recusa se o estado já existe | sim (`storage/ops/instances/{slug}.json`) | sim (activity log `ops`) | **sim — ploi (site, DB, env, deploy, SSL, daemon, cron), Asaas, landing** |
| `app/Console/Commands/PhotosOptimizeCommand.php` | Conta fotos; sem `--force` pede confirmação; `chunkById(100)`; para cada foto: `ImageOptimizer::optimize()`, grava `items/{item_id}/{uuid}.jpg`, apaga o arquivo antigo, `update(['path' => …])`; conta feitas/ignoradas | **Não idempotente por design** — o próprio docblock diz "Reexecutar reotimiza (leve perda de qualidade a cada passada)" | sim (reescreve e apaga arquivos) | sim (`item_photos.path`) | não |
| `app/Console/Commands/PruneDraftsCommand.php` | Guarda dupla: sai cedo se `!AiStudioMode::enabled()`; corta `Item::drafts()` com `updated_at < now()->subHours(vitrine.ai_studio.draft_ttl_hours ?? 48)`; `deleteAllPhotos` + `disableLogging()` + `forceDelete()` | Idempotente (2ª passada acha 0) | sim (apaga fotos) | sim (hard delete de items/photos) | não |
| `app/Console/Commands/PruneOrphanPhotoFilesCommand.php` | Monta o conjunto de caminhos referenciados (`path` + `original_path` de `item_photos`); varre `Storage::allFiles('items')`; pula arquivos com `lastModified > now()-hours` (carência, default 24h); imprime tabela (total, referenciados, recentes, órfãos, bytes); **dry-run por padrão** (lista até 20 + "e mais N"); com `--apply` faz `Storage::delete($orphans)` e remove diretórios de item vazios; docblock declara as três decisões (dry-run default, **não agendado de propósito**, carência) | Idempotente | sim, só com `--apply` | não | não |
| `app/Console/Commands/PruneTrashedItemsCommand.php` | `Item::onlyTrashed()->whereHas('photos')->where('deleted_at','<', now()->subDays($days))`; `$days` de `--days` ou `vitrine.items.trash_retention_days` (30); `deletePhoto()` por foto + `Storage::deleteDirectory("items/{$item->id}")`; **nunca** apaga o registro do item (comentário: métricas/relatório leem `withTrashed`) | Idempotente (`whereHas('photos')` faz o item sair da varredura seguinte) | sim (apaga arquivos e diretórios) | sim (`item_photos`) | não |
| `app/Console/Commands/SignupExpireCommand.php` | Sai cedo se `!SignupMode::enabled()`; seleciona `SignupOrder` `PENDING_PAYMENT` com `updated_at < now()->subDays(SignupMode::orderTtlDays())`; `refresh()` antes de tocar no Asaas; cancela `deleteSubscription()` e (se `setup_paid_at === null`) `deletePayment()`; 404 tolerado como sucesso; falha de API → `Log::warning` + mantém pendente para retry; transição em `DB::transaction` com `lockForUpdate()` re-checando `isPending()`; zera `slug_lock`; avisa estorno manual quando o setup estava pago | Idempotente e desenhado para retry diário (404 vale como já-cancelado) | não | sim (`signup_orders`) | **sim — Asaas** |
| `app/Console/Commands/UnstickAiStatesCommand.php` | `$minutes` de `--minutes` ou `vitrine.ai_studio.stuck_after_minutes` (10); `ItemPhoto::where('ai_status', AI_PROCESSING)->where('updated_at','<',$cutoff)->update(['ai_status' => AI_FAILED])`; drafts `ai_intake_status=processing` → `forceFill(...)->saveQuietly()`; `Log::warning('ai: estados presos destravados', [...])` quando houve algo; **roda mesmo com o módulo off, de propósito** | Idempotente | não | sim (`item_photos`, `items`) | não |
| `app/Console/Commands/VitrineEnvCommand.php` | Diagnóstico em 6 blocos: identificação (`APP_ENV/URL/DEBUG`, `MAIL_MAILER`, perfil), 10 módulos × `mode::enabled()` + `diagnostics()`, valores de conferência (plano, versão do termo comparada com o cabeçalho de `resources/legal/…md`, ambiente Asaas do signup, ciclo do billing), 11 tunables (valor efetivo × default), 18 segredos (só "definida"/"ausente" — **o valor jamais é impresso**), higiene do `.env` via `Dotenv::parse` do arquivo apontando typos de nome com `EnvInventory`, e bloco ops (erro se credencial de operador presente em produção); `--check` → `FAILURE` quando há live incompleto, versão de termo divergente ou typo | Sem efeito (leitura pura; lê o arquivo `.env` só para a higiene) | não | não | não |

**Guardas transversais observadas:** `App\Services\Ops\OpsGuard::check()` (recusa em `production` e sem `PLOI_API_TOKEN`) protege os 2 comandos de `Ops/`; `instance:migrate-storage` deliberadamente **não** o usa; `demo:switch` tem gate próprio por `config('vitrine.demo.instance')`; `items:prune-drafts`, `metrics:monthly-report` e `signup:expire` têm gate de módulo dentro do `handle()` **além** do gate no scheduler.

#### 4.3 Scheduler — `routes/console.php`

Não há `withSchedule()` em `bootstrap/app.php`: o `Application::configure()` só registra `commands: __DIR__.'/../routes/console.php'` e `health: '/up'`. Todo o agendamento vive em `routes/console.php` (8 chamadas `Schedule::command` medidas), 5 delas **dentro de `if` de módulo** avaliado em tempo de boot do arquivo de rotas.

| Caminho:linha | Comando | Frequência | Gate | `onOneServer` | `withoutOverlapping` | `runInBackground` | `timezone` | falha/e-mail | ping/healthcheck |
|---|---|---|---|---|---|---|---|---|---|
| `routes/console.php:11` | `horizon:snapshot` | `everyFiveMinutes()` | — | **ausente** | **ausente** | **ausente** | **ausente** (herda `config/app.php:68` `'timezone' => 'UTC'`) | **ausente** | **ausente** |
| `routes/console.php:15` | `metrics:prune` | `daily()` | `if (MetricsMode::live())` | **ausente** | **ausente** | **ausente** | **ausente** | **ausente** | **ausente** |
| `routes/console.php:23-26` | `metrics:monthly-report` | `monthlyOn(1, '08:00')` | `if (ReportMode::enabled())` | **ausente** | **ausente** | **ausente** | `->timezone('America/Sao_Paulo')` | **ausente** — usa `->appendOutputTo(storage_path('logs/monthly-report.log'))` (única saída capturada do arquivo) | **ausente** |
| `routes/console.php:30` | `items:prune-drafts` | `daily()` | `if (AiStudioMode::enabled())` | **ausente** | **ausente** | **ausente** | **ausente** | **ausente** | **ausente** |
| `routes/console.php:36` | `ai:destravar` | `everyFiveMinutes()` | nenhum (deliberado: comentário diz que precisa reparar mesmo com o Estúdio off) | **ausente** | **ausente** | **ausente** | **ausente** | **ausente** (o próprio comando faz `Log::warning`) | **ausente** |
| `routes/console.php:40` | `items:prune-trashed` | `dailyAt('03:30')` | nenhum ("a lixeira é do produto") | **ausente** | **ausente** | **ausente** | **ausente** — o `03:30` roda em UTC | **ausente** | **ausente** |
| `routes/console.php:44` | `billing:evaluate` | `dailyAt('09:00')` | `if (BillingMode::enabled())` | **ausente** | **ausente** | **ausente** | `->timezone('America/Sao_Paulo')` | **ausente** | **ausente** |
| `routes/console.php:51` | `signup:expire` | `dailyAt('08:30')` | `if (SignupMode::enabled())` | **ausente** | **ausente** | **ausente** | `->timezone('America/Sao_Paulo')` | **ausente** | **ausente** |

Também em `routes/console.php`: `Artisan::command('inspire', …)->purpose('Display an inspiring quote')` (herdado do skeleton, igual ao boilerplate).

**Ausências medidas no repositório inteiro** (`app`, `routes`, `bootstrap`): `onOneServer`, `withoutOverlapping`, `runInBackground`, `emailOutputOnFailure`, `onFailure`, `onSuccess`, `pingOnSuccess`, `pingOnFailure`, `thenPing`, `sendOutputTo` → **0 ocorrências**. O único modificador de saída/observabilidade em todo o scheduler é o `appendOutputTo` da linha 26.

**Ausências de rotinas de manutenção padrão do Laravel/pacotes** — `activitylog:clean`, `model:prune`, `queue:prune-batches`, `queue:prune-failed`, `auth:clear-resets`, `cache:prune-stale-tags`, `telescope:prune`: **0 ocorrências** em `app/`, `routes/`, `config/`, `composer.json`, `docs/`. `config/activitylog.php` não define `delete_records_older_than_days` (a chave não existe no arquivo) e a app usa `spatie/laravel-activitylog` com `'enabled' => env('ACTIVITYLOG_ENABLED', true)`; `queue.failed` usa `database-uuids` sem nenhum expurgo agendado.

#### 4.4 Cron e daemon provisionados na infra (fora do `routes/console.php`)

| Caminho | O que declara |
|---|---|
| `app/Console/Commands/Ops/ProvisionInstanceCommand.php:556-567` (`stepDaemon`) | `$ploi->createDaemon($serverId, 'php8.4 artisan horizon', 'ploi', "/home/ploi/{$domain}")` — o daemon do Horizon é criado no provisionamento |
| `app/Console/Commands/Ops/ProvisionInstanceCommand.php:569-580` (`stepCron`) | `$ploi->createScheduledJob($serverId, "php8.4 /home/ploi/{$domain}/artisan schedule:run", '* * * * *', 'ploi')` |
| `app/Services/Ops/PloiClient.php:138-146` | `createDaemon` → `POST /servers/{id}/daemons` com `command`, `system_user`, `processes => 1`, `directory` |
| `app/Services/Ops/PloiClient.php:149-156` | `createScheduledJob` → `POST /servers/{id}/crontabs` com `command`, `frequency`, `user` |
| `stubs/ops/deploy-script.stub` | Deploy: `artisan down --retry=60`, `git reset --hard`, `install -d -m 0775` das pastas de storage, `composer install --no-dev`, `pnpm build`, `migrate --force`, seed único protegido pela sentinela `storage/app/.provisioned`, `artisan optimize`, **`artisan horizon:terminate \|\| true`**, reload do `php8.4-fpm`, `artisan up`, com `trap cleanup EXIT` que garante `artisan up` |
| `composer.json` (scripts) | `"horizon:terminate": "@php artisan horizon:terminate"`; `dev` e `dev:ssr` sobem `php artisan horizon:listen` **e** `php artisan schedule:work` via `concurrently` |
| `tests/Feature/HorizonDevelopmentScriptsTest.php` | Trava por teste: `dev[1]` e `dev:ssr[2]` contêm `horizon:listen` + `schedule:work`; `scripts['horizon:terminate']` é exatamente `@php artisan horizon:terminate`; `package.json.devDependencies.chokidar` existe e não é vazio |

#### 4.5 Filas — `config/queue.php`, jobs e `config/cache.php`

`config/queue.php` (`53d7d9a`):

| Chave | Valor |
|---|---|
| `default` | `env('QUEUE_CONNECTION', 'database')` |
| `connections.database.retry_after` | `(int) env('DB_QUEUE_RETRY_AFTER', 180)` — com comentário explicando que é o mesmo teto do redis porque `database` é o driver default do arquivo |
| `connections.redis.retry_after` | `(int) env('REDIS_QUEUE_RETRY_AFTER', 180)` — comentário: "Precisa ser MAIOR que o maior `$timeout` de job (ProcessPhotoBackground = 120s), senão a fila reentrega o job por baixo do pano e a chamada paga ao provider roda duas vezes" |
| `connections.redis.block_for` | `null` |
| `connections.beanstalkd.retry_after` | `90` (default de skeleton, intocado) |
| `batching` | `database` = `env('DB_CONNECTION','sqlite')`, tabela `job_batches` |
| `failed` | driver `env('QUEUE_FAILED_DRIVER','database-uuids')`, tabela `failed_jobs` |
| `after_commit` | `false` em todas as conexões |

`.env.example` (`53d7d9a`) fixa `QUEUE_CONNECTION=redis` (l.68), `REDIS_QUEUE_RETRY_AFTER=180` (l.71), `CACHE_STORE=redis` (l.73), `SESSION_DRIVER=redis` (l.60), `REDIS_CLIENT=phpredis` (l.78).

Jobs (`app/Jobs/`, 3 arquivos medidos; nenhum usa `onQueue`, `ShouldBeUnique`, `uniqueFor`, `maxExceptions`, `deleteWhenMissingModels` ou `afterCommit` — 0 ocorrências):

| Caminho | `$timeout` | `$tries` | backoff | `failed()` | Observação do próprio código |
|---|---|---|---|---|---|
| `app/Jobs/AnalyzeDraftFields.php` | `100` (l.38) | `2` (l.44) | `public array $backoff = [15]` (l.47) | sim (l.118) | "Pior caso do provider: queued_timeout (40) × 2 tentativas + 2s ≈ 82s"; `failed()` é obrigatório porque o estado nasce `processing` antes do dispatch |
| `app/Jobs/ProcessPhotoBackground.php` | `120` (l.41) | `1` (l.48) | — | sim (l.122) | "Vence o timeout do supervisor do Horizon (60s), que mataria o processo no meio do Http"; 1 tentativa porque a chamada é cara (~US$ 0,12) |
| `app/Jobs/SendMetaCapiEvent.php` | `30` (l.42) | `3` (l.44) | `public const array BACKOFF = [30, 300]` (constante, **não** a propriedade `$backoff`) | não | dedupe por `event_id` derivado do `public_id`; PII sempre em SHA-256 |

Também implementam `ShouldQueue` (fora de `app/Jobs`): `app/Mail/SignupPaidNotificationMail.php`, `app/Mail/SignupTermsReceiptMail.php`, `app/Mail/SignupWelcomeMail.php`, `app/Mail/TermsAcceptanceReceiptMail.php`.

`config/cache.php` (`53d7d9a`): **byte a byte idêntico** ao `origin/main` do boilerplate (`diff -u` sem saída). `default` = `env('CACHE_STORE','database')`, store `failover` (`database` → `array`) presente, `serializable_classes => false`.

#### 4.6 Horizon — `config/horizon.php` e comparação com o boilerplate

`diff -u` entre `boilerplate origin/main:config/horizon.php` e `ctvitrine 53d7d9a:config/horizon.php`: **saída vazia — os arquivos são idênticos, zero divergência**. Valores (iguais nos dois lados):

| Chave | Valor |
|---|---|
| `name` / `domain` / `path` | `env('HORIZON_NAME')` / `env('HORIZON_DOMAIN')` / `env('HORIZON_PATH','horizon')` |
| `use` | `'default'` |
| `prefix` | `env('HORIZON_PREFIX', Str::slug(env('APP_NAME','laravel')).'-horizon:')` |
| `middleware` | `['web']` (a autorização real vem do gate) |
| `waits` | `['redis:default' => 60]` |
| `trim` | recent 60, pending 60, completed 60, recent_failed 10080, failed 10080, monitored 10080 |
| `silenced` / `silenced_tags` | vazios (só os comentários do skeleton) |
| `metrics.trim_snapshots` | job 24, queue 24 |
| `fast_termination` | `false` |
| `memory_limit` | `64` |
| `defaults.supervisor-1` | `connection: redis`, `queue: ['default']`, `balance: auto`, `autoScalingStrategy: time`, `maxProcesses: 1`, `maxTime: 0`, `maxJobs: 0`, `memory: 128`, `tries: 1`, `timeout: 60`, `nice: 0` |
| `environments.production.supervisor-1` | `maxProcesses: 10`, `balanceMaxShift: 1`, `balanceCooldown: 3` |
| `environments.local.supervisor-1` | `maxProcesses: 3` |
| `environments.*.supervisor-1` | `maxProcesses: 3` |

Fatos correlatos que **não** estão no `config/horizon.php` e divergem entre projeto e boilerplate:

| Item | `ctvitrine` @ `53d7d9a` | `boilerplate` @ `origin/main` |
|---|---|---|
| `config/queue.php` `database.retry_after` | `180` (com comentário) | `90` |
| `config/queue.php` `redis.retry_after` | `180` (com comentário justificando contra `ProcessPhotoBackground::$timeout = 120`) | `90` |
| `.env.example` | tem `REDIS_QUEUE_RETRY_AFTER=180` (l.71) | não define `REDIS_QUEUE_RETRY_AFTER` (só `QUEUE_CONNECTION=redis` l.45, `CACHE_STORE=redis` l.47, `SESSION_DRIVER=redis` l.34) |
| `routes/console.php` | 8 `Schedule::command` (7 do produto + `horizon:snapshot`) | 1 `Schedule::command` — só `horizon:snapshot`, `everyFiveMinutes()` |
| `app/Console/Commands/**` | 19 comandos | 2 comandos: `app/Console/Commands/CreateSuperUserCommand.php` (`users:super-user`) e `app/Console/Commands/SyncPermissionsCommand.php` (`permissions:sync`) |
| Equivalentes dos comandos do boilerplate | **ausentes** — `permissions:sync` não existe (a sincronização de permissões acontece por seeder `PermissionRoleSeeder` e pelo controller `app/Http/Controllers/PermissionRole/SyncPermissionsController.php`); o super usuário vem do `InstanceSuperUserSeeder` | presentes como comandos |

Gate do Horizon: `app/Providers/HorizonServiceProvider.php:27` → `Gate::define('viewHorizon', fn(?User $user): bool => $user?->hasRole(Roles::SUPER_USER) ?? false)`; registrado em `bootstrap/providers.php`. Coberto por `tests/Feature/HorizonAccessTest.php` (super user permite; guest e admin negam; e um teste que roda `Artisan::call('schedule:list')`, tira os códigos ANSI com `preg_replace('/\e\[[\d;]*m/', …)` e exige `*/5 * * * *` + `horizon:snapshot` na saída).

`config/horizon.php` não é o único ponto do timeout: `ProcessPhotoBackground::$timeout = 120` é **maior** que `defaults.supervisor-1.timeout = 60` — o próprio docblock do job (`app/Jobs/ProcessPhotoBackground.php:36-40`) registra que o valor "vence o timeout do supervisor do Horizon (60s)".

#### 4.7 Backups, healthchecks e cron de manutenção

| Item | Situação em `53d7d9a` |
|---|---|
| Pacote de backup (`spatie/laravel-backup` ou similar) | **ausente** — `composer.json` `require` tem apenas `inertiajs/inertia-laravel`, `laravel/framework ^13.0`, `laravel/horizon ^5.45`, `laravel/tinker`, `league/flysystem-aws-s3-v3`, `opcodesio/log-viewer`, `spatie/laravel-activitylog`, `tightenco/ziggy` |
| Backup de banco / restore drill | **ausente** — nenhum comando, nenhuma tarefa agendada, nenhum script |
| Único "backup" do repositório | `app/Console/Commands/DemoManasUpCommand.php` / `DemoManasDownCommand.php` — snapshot JSON de *settings + ids publicados* em `storage/app/private/demo-backups/`, exclusivo do case de demonstração; nunca agendado |
| Healthcheck HTTP | `bootstrap/app.php:24` → `health: '/up'` (rota padrão do Laravel). Nenhuma chamada `pingOnSuccess`/`pingOnFailure`/`thenPing` e nenhum integrador externo (Oh Dear, Better Uptime) — 0 ocorrências medidas |
| Smoke test pós-deploy | Só dentro do provisionamento: `ProvisionInstanceCommand::stepSmoke` (60 tentativas × 10s procurando `id="app"`) — one-shot, não recorrente |
| Cron de manutenção recorrente | Os 8 agendamentos da §4.3. Os de higiene de disco/banco são `metrics:prune`, `items:prune-drafts`, `items:prune-trashed`, `ai:destravar`; `items:prune-orphans` é a única faxina **deliberadamente não agendada** (docblock: "Não é agendado. Roda à mão") |
| Retenção documentada | `docs/tecnico/05-operacao-e-comandos.md` traz a tabela de todos os comandos próprios e um bloco "Cache & filas" listando exatamente os 8 agendamentos e dizendo que "o cron do servidor precisa chamar `schedule:run` a cada minuto" |

#### 4.8 Cobertura de teste dos comandos

7 arquivos de teste com nome ligado a comando/console/schedule/queue/horizon; 21 arquivos de teste contêm `->artisan(`/`artisan(`; **18 nomes de comando distintos** são exercitados. Dos 19 comandos, o único nunca invocado em teste é **`ai-image:usage`** (`app/Console/Commands/AiImageUsageCommand.php`).

| Comando | Teste(s) |
|---|---|
| `ai-studio:usage` | `tests/Feature/AiStudio/AiStudioUsageCommandTest.php` |
| `ai:destravar` | `tests/Feature/AiStudio/UnstickAiStatesCommandTest.php` (5 invocações, inclui `--minutes`) |
| `items:prune-drafts` | `tests/Feature/AiStudio/DraftLifecycleTest.php:396,408` |
| `billing:evaluate` | `tests/Feature/Billing/BillingEvaluateTest.php` (4 invocações) |
| `billing:status` | `tests/Feature/Billing/BillingOverrideTest.php` (inclui status inválido → `assertFailed()` e `--show`) |
| `billing:subscribe` | `tests/Feature/Ops/BillingSubscribeTest.php` (inclui CPF/CNPJ inválido e plano inválido → exit 1) |
| `demo:manas-up` / `demo:manas-down` | `tests/Feature/Demo/DemoManasSwitchTest.php` (inclui caminho de falha sem backup) |
| `demo:switch` | `tests/Feature/Demo/DemoSwitchTest.php`, `DemoOticaVisaoSeederTest.php`, `DemoPlatformUserTest.php`, `tests/Feature/Layout/DemoLayoutTest.php` |
| `instance:migrate-storage` | `tests/Feature/Ops/MigrateStorageTest.php` (inclui `--dry-run` e reexecução) |
| `instance:provision` | `tests/Feature/Ops/ProvisionInstanceTest.php`, `tests/Feature/Ops/ProvisionFromOrderTest.php` (slug reservado, slug inválido, sem `--whatsapp`, pedido não pago) |
| `items:prune-orphans` | `tests/Feature/Items/PruneOrphanFilesTest.php` (10 invocações, dry-run e `--hours`) |
| `items:prune-trashed` | `tests/Feature/Items/TrashHygieneTest.php` (9 invocações, inclui `--days`) |
| `metrics:prune` | `tests/Feature/Metrics/MetricsTrackingTest.php:128,131` (inclui `--all`) |
| `metrics:monthly-report` | `tests/Feature/Metrics/MonthlyReportCommandTest.php` (inclui mês fora da retenção) |
| `photos:optimize` | `tests/Feature/Items/PhotoOptimizationTest.php:90` |
| `signup:expire` | `tests/Feature/Signup/SignupExpireTest.php` (6 invocações) |
| `vitrine:env` | `tests/Feature/Env/VitrineEnvCommandTest.php` (20 invocações, com `--file` e `--check`) |
| Horizon (gate + snapshot agendado) | `tests/Feature/HorizonAccessTest.php` |
| Horizon (scripts de dev/deploy) | `tests/Feature/HorizonDevelopmentScriptsTest.php` |

---

#### Medições

Todos os comandos abaixo foram executados; `CT` = `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `BP` = `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`, `S` = diretório de scratchpad da sessão.

| Número reportado | Comando exato | Resultado |
|---|---|---|
| 19 arquivos em `app/Console` | `git -C CT ls-tree -r 53d7d9a --name-only -- app/Console \| wc -l` | `19` |
| 19 signatures / 19 comandos | `git -C CT grep -c "protected \$signature" 53d7d9a -- app/Console \| wc -l` | `19` |
| 19 `final class` | `git -C CT grep -c "^final class" 53d7d9a -- app/Console \| wc -l` | `19` |
| 19 `declare(strict_types` | `git -C CT grep -c "declare(strict_types" 53d7d9a -- app/Console \| wc -l` | `19` |
| 0 `Isolatable`, 0 `$hidden` | `git -C CT grep -c "Isolatable" 53d7d9a -- app/Console` / `git -C CT grep -n "protected \$hidden" 53d7d9a -- app/Console` | sem saída (0) |
| 8 `Schedule::command` | `git -C CT show 53d7d9a:routes/console.php \| grep -c "Schedule::command"` | `8` |
| 1 única ocorrência de modificador de scheduler (o `appendOutputTo`) | `git -C CT grep -n "onOneServer\|withoutOverlapping\|runInBackground\|emailOutputOnFailure\|onFailure\|pingOnSuccess\|pingOnFailure\|thenPing\|sendOutputTo\|appendOutputTo\|onSuccess" 53d7d9a -- routes app bootstrap` | 1 linha: `routes/console.php:26: ->appendOutputTo(...)` |
| 0 rotinas `activitylog:clean` / `model:prune` / `queue:prune` / `auth:clear-resets` / `telescope:prune` / `cache:prune` | `git -C CT grep -n "activitylog:clean\|model:prune\|queue:prune\|auth:clear-resets\|telescope:prune\|cache:prune" 53d7d9a -- app routes config composer.json docs` | sem saída (0) |
| `config/horizon.php` idêntico ao boilerplate | `git -C BP show origin/main:config/horizon.php > S/bp-horizon.php; git -C CT show 53d7d9a:config/horizon.php > S/ct-horizon.php; diff -u S/bp-horizon.php S/ct-horizon.php` | saída vazia |
| `config/cache.php` idêntico ao boilerplate | `diff -u S/bp-cache.php S/ct-cache.php` (arquivos gerados por `git show origin/main:config/cache.php` e `git show 53d7d9a:config/cache.php`) | saída vazia |
| `config/queue.php`: só `retry_after` 90→180 nas conexões `database` e `redis` (+ comentários) | `diff -u S/bp-queue.php S/ct-queue.php` | 2 hunks, ambos em `retry_after` |
| 3 arquivos em `app/Jobs` | `git -C CT ls-tree -r 53d7d9a --name-only -- app/Jobs \| wc -l` | `3` |
| `$timeout`/`$tries`/`$backoff`/`failed()` dos jobs | `git -C CT grep -n "public int \$tries\|public int \$timeout\|\$backoff\|onQueue\|ShouldBeUnique\|uniqueFor\|public function failed\|maxExceptions\|deleteWhenMissingModels\|afterCommit" 53d7d9a -- app/Jobs app/Mail` | 8 linhas (valores citados na §4.5); 0 hits para `onQueue`, `ShouldBeUnique`, `uniqueFor`, `maxExceptions`, `deleteWhenMissingModels`, `afterCommit` |
| 7 arquivos de teste com nome de comando/console/schedule/horizon/queue | `git -C CT ls-tree -r 53d7d9a --name-only -- tests \| grep -ic "command\|console\|schedul\|prune\|horizon\|queue"` | `7` |
| 21 arquivos de teste chamando `artisan(` | `git -C CT grep -c "artisan(" 53d7d9a -- tests \| wc -l` | `21` |
| 18 comandos distintos exercitados em teste | `git -C CT grep -h "artisan(" 53d7d9a -- tests \| grep -o "artisan('[a-z0-9:-]*'" \| sed "s/artisan('//;s/'//" \| sort -u \| wc -l` | `18` |
| 43 slugs reservados no `instance:provision` | `git -C CT show 53d7d9a:app/Console/Commands/Ops/ProvisionInstanceCommand.php \| sed -n '/RESERVED_SLUGS = \[/,/\];/p' \| grep -o "'[a-z0-9]*'" \| wc -l` | `43` |
| 9 `stepX` no `instance:provision` | `git -C CT show 53d7d9a:app/Console/Commands/Ops/ProvisionInstanceCommand.php \| grep -n "private function step"` | 9 linhas |
| 2 comandos no boilerplate | `git -C BP ls-tree -r origin/main --name-only -- app/Console` | 2 arquivos |
| 1 `Schedule::command` no boilerplate | `git -C BP show origin/main:routes/console.php` | única linha `Schedule::command('horizon:snapshot')->everyFiveMinutes();` |
| `.env.example` do boilerplate sem `REDIS_QUEUE_RETRY_AFTER` | `git -C BP show origin/main:.env.example \| grep -n "QUEUE\|REDIS_QUEUE\|CACHE_STORE\|SESSION_DRIVER"` | 3 linhas (34, 45, 47), nenhuma de `RETRY_AFTER` |
| `.env.example` do ctvitrine com `REDIS_QUEUE_RETRY_AFTER=180` | `git -C CT show 53d7d9a:.env.example \| grep -n "QUEUE\|REDIS\|HORIZON\|CACHE\|SESSION_DRIVER\|DB_CONNECTION"` | l.68 `QUEUE_CONNECTION=redis`, l.71 `REDIS_QUEUE_RETRY_AFTER=180`, l.73 `CACHE_STORE=redis` |
| `timezone` da app | `git -C CT show 53d7d9a:config/app.php \| grep -n "timezone"` | l.68 `'timezone' => 'UTC'` |
| Ausência de pacote/rotina de backup e de healthcheck externo | `git -C CT grep -ln "backup" 53d7d9a -- app config routes docs database resources composer.json` e `git -C CT grep -n "healthcheck\|health-check\|/up\|uptime\|betteruptime\|ohdear\|pingUrl" 53d7d9a -- app config routes bootstrap composer.json` | "backup" só nos 2 comandos de demo, 2 docs e 4 arquivos de copy/legal; healthcheck: única linha `bootstrap/app.php:24: health: '/up'` |

**Redações aplicadas:** o e-mail da usuária do case de demonstração em `app/Console/Commands/DemoManasDownCommand.php` foi substituído por `***`; nomes de loja/`hero_title` e números de telefone que aparecem em seeders e fixtures de teste não foram transcritos.

---

### Frente 5 — Migrations (schema completo), factories e seeders — `ctvitrine` @ `53d7d9a`

Fonte lida exclusivamente por `git show 53d7d9a:<path>` / `git ls-tree -r 53d7d9a` / `git grep 53d7d9a`. Nenhum arquivo da working tree foi tocado.

**Panorama medido:** 136 arquivos em `database/` — 30 migrations, 5 factories, 100 entradas em `database/seeders/` (19 classes PHP + 4 catálogos `data/*.php` + 77 `.jpg` versionados) + `database/.gitignore` (conteúdo: `*.sqlite*`).

**Referência do alvo (`boilerplate` @ `origin/main`):** 6 migrations, 1 factory, 4 seeders. As 6 migrations de base existem nos dois repos com **conteúdo byte-idêntico** (0 linhas de diferença nas 6). O drift está todo em seeders/factory e nas 24 migrations que só existem no ctvitrine.

---

#### 1. Schema completo — tabela a tabela

Convenções da coluna "Índ./Constr.": `PK` = primary key, `U` = unique, `I` = índice não-único, `FK→` = chave estrangeira com a regra de exclusão. `string` sem tamanho = `varchar(255)` (default do Laravel). Nenhuma migration do projeto declara `onUpdate` em FK alguma; nenhuma declara `check` constraint; nenhuma usa `enum` de banco.

##### `users` — `database/migrations/0001_01_01_000000_create_users_table.php` (+ `0001_01_01_000004_add_role_id_to_users_table.php`)

| Coluna | Tipo | Null | Default | Índ./Constr. |
|---|---|---|---|---|
| `id` | bigIncrements | não | — | PK |
| `is_active` | boolean | não | `true` | — |
| `role_id` | foreignId (unsignedBigInteger) | **sim** | — | **sem FK, sem índice** (ver §4) |
| `name` | string | não | — | — |
| `email` | string | não | — | U |
| `cpf_cnpj` | string | sim | — | — |
| `phone` | string | sim | — | — |
| `mobile` | string | sim | — | — |
| `user_notes` | longText | sim | — | — |
| `email_verified_at` | timestamp | sim | — | — |
| `password` | string | não | — | — |
| `remember_token` | string(100) | sim | — | — |
| `created_at` / `updated_at` | timestamp | sim | — | — |

Sem `softDeletes`. `role_id` é adicionada por migration posterior com `->after('is_active')`.

##### `password_reset_tokens` — `database/migrations/0001_01_01_000000_create_users_table.php`

| Coluna | Tipo | Null | Índ./Constr. |
|---|---|---|---|
| `email` | string | não | PK |
| `token` | string | não | — |
| `created_at` | timestamp | sim | — |

##### `sessions` — `database/migrations/0001_01_01_000000_create_users_table.php`

| Coluna | Tipo | Null | Índ./Constr. |
|---|---|---|---|
| `id` | string | não | PK |
| `user_id` | foreignId | sim | I — **sem FK** |
| `ip_address` | string(45) | sim | — |
| `user_agent` | text | sim | — |
| `payload` | longText | não | — |
| `last_activity` | integer | não | I |

##### `cache` / `cache_locks` — `database/migrations/0001_01_01_000001_create_cache_table.php`

`cache`: `key` string PK · `value` mediumText NOT NULL · `expiration` integer NOT NULL.
`cache_locks`: `key` string PK · `owner` string NOT NULL · `expiration` integer NOT NULL.

##### `jobs` / `job_batches` / `failed_jobs` — `database/migrations/0001_01_01_000002_create_jobs_table.php`

`jobs` (7 col): `id` PK · `queue` string I · `payload` longText · `attempts` unsignedTinyInteger · `reserved_at` unsignedInteger NULL · `available_at` unsignedInteger · `created_at` unsignedInteger.
`job_batches` (10 col): `id` string PK · `name` string · `total_jobs`/`pending_jobs`/`failed_jobs` integer · `failed_job_ids` longText · `options` mediumText NULL · `cancelled_at` integer NULL · `created_at` integer · `finished_at` integer NULL.
`failed_jobs` (7 col): `id` PK · `uuid` string **U** · `connection` text · `queue` text · `payload` longText · `exception` longText · `failed_at` timestamp `useCurrent()` — **único `useCurrent()` do schema inteiro**.

##### `roles` / `permissions` / `permission_role` / `permission_user` — `database/migrations/0001_01_01_000003_create_permissions_roles_tables.php`

| Tabela | Coluna | Tipo | Null | Default | Índ./Constr. |
|---|---|---|---|---|---|
| `roles` | `id` | bigIncrements | não | — | PK |
| `roles` | `name` | string | não | — | U |
| `roles` | `label` | string | sim | — | — |
| `roles` | `priority` | unsignedInteger | não | `0` | — |
| `roles` | `created_at`/`updated_at` | timestamp | sim | — | — |
| `permissions` | `id` | bigIncrements | não | — | PK |
| `permissions` | `name` | string | não | — | U |
| `permissions` | `label` | string | sim | — | — |
| `permissions` | `created_at`/`updated_at` | timestamp | sim | — | — |
| `permission_role` | `role_id` | foreignId | não | — | **FK→`roles.id` SEM onDelete** |
| `permission_role` | `permission_id` | foreignId | não | — | **FK→`permissions.id` SEM onDelete** |
| `permission_role` | — | — | — | — | PK composta (`role_id`,`permission_id`) |
| `permission_user` | `user_id` | foreignId | não | — | FK→`users.id` `onDelete('cascade')` |
| `permission_user` | `permission_id` | foreignId | não | — | FK→`permissions.id` `onDelete('cascade')` |
| `permission_user` | `meta` | json | sim | — | — |
| `permission_user` | `created_at`/`updated_at` | timestamp | sim | — | — |
| `permission_user` | — | — | — | — | PK composta (`user_id`,`permission_id`) |

`permission_role` **não tem timestamps**; `permission_user` tem. Assimetria deliberada segundo o `down()` do próprio arquivo (que, aliás, dropa na ordem `roles → permissions → permission_user → permission_role`, ou seja, dropa as tabelas-pai antes dos pivôs).

##### `activity_log` — `database/migrations/2026_03_27_004320_create_activity_log_table.php`

| Coluna | Tipo | Null | Índ./Constr. |
|---|---|---|---|
| `id` | bigIncrements | não | PK |
| `log_name` | string | sim | I |
| `description` | text | **não** | — |
| `subject_type` / `subject_id` | `nullableMorphs('subject','subject')` | sim | I composto (nome `subject`) |
| `event` | string | sim | I |
| `causer_type` / `causer_id` | `nullableMorphs('causer','causer')` | sim | I composto (nome `causer`) |
| `attribute_changes` | json | sim | — |
| `properties` | json | sim | — |
| `created_at` / `updated_at` | timestamp | sim | — |

Sem FK para `users` (o causer é morph). 12 colunas, 4 índices.

##### `items` — `database/migrations/2026_07_05_000001_create_items_table.php` + **6 migrations de ALTER**

Estado final (21 colunas):

| Coluna | Tipo | Null (final) | Default | Índ./Constr. | Origem |
|---|---|---|---|---|---|
| `id` | bigIncrements | não | — | PK | `2026_07_05_000001_create_items_table.php` |
| `name` | string | **sim** | — | — | criada NOT NULL em `..._create_items_table.php`, **virou nullable** em `2026_07_16_000001_add_ai_studio_draft_to_items.php` |
| `description` | text | sim | — | — | `2026_07_05_000001_create_items_table.php` |
| `category_id` | unsignedBigInteger | **sim** | — | **FK→`categories.id` `restrictOnDelete`** | `2026_07_08_000001_create_categories_and_migrate_items.php` (nullable → NOT NULL na mesma migration) → **volta a nullable** em `2026_07_16_000001_add_ai_studio_draft_to_items.php` |
| `price` | **decimal(10,2)** | sim | — | — | `2026_07_05_000001_create_items_table.php` |
| `original_price` | **decimal(10,2)** | sim | — | — | `2026_07_05_000001_create_items_table.php` |
| `condition` | string(20) | **sim** | `'used'` | — | criada NOT NULL default `'used'`; **virou nullable** (default mantido) em `2026_07_16_000001_add_ai_studio_draft_to_items.php` |
| `size` | string(30) | sim | — | — | `2026_07_05_000001_create_items_table.php` |
| `colors` | **json** | sim | — | — | `2026_07_20_000001_add_colors_to_items.php` (`after('size')`) |
| `status` | string(20) | não | `'available'` | I | `2026_07_05_000001_create_items_table.php` |
| `sold_at` | timestamp | sim | — | I | `2026_07_14_000002_add_sale_data_to_items_table.php` (`after('status')`) |
| `sold_price` | **decimal(10,2)** | sim | — | — | `2026_07_14_000002_add_sale_data_to_items_table.php` (`after('sold_at')`) |
| `is_published` | boolean | não | `true` | I | `2026_07_05_000001_create_items_table.php` |
| `is_featured` | boolean | não | `false` | **sem índice** | `2026_07_17_000004_add_is_featured_to_items.php` (`after('is_published')`) |
| `is_draft` | boolean | não | `false` | I | `2026_07_16_000001_add_ai_studio_draft_to_items.php` (`after('is_published')`) |
| `drafted_at` | timestamp | sim | — | **sem índice** | `2026_07_16_000001_add_ai_studio_draft_to_items.php` |
| `ai_intake_status` | string(20) | sim | — | — | `2026_07_16_000001_add_ai_studio_draft_to_items.php` |
| `slug` | string(140) | sim | — | **U** | `2026_07_06_000001_add_slug_to_items_table.php` (com backfill) |
| `created_at` / `updated_at` | timestamp | sim | — | — | `2026_07_05_000001_create_items_table.php` |
| `deleted_at` | softDeletes | sim | — | **sem índice** | `2026_07_05_000001_create_items_table.php` |

**Coluna que nasceu e morreu:** `category` string(30) NOT NULL default `'other'` + índice — criada em `database/migrations/2026_07_05_000001_create_items_table.php`, **dropada** (índice primeiro, depois a coluna) em `database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php`. Esta é a única tabela do projeto com `softDeletes`.

##### `item_photos` — `database/migrations/2026_07_05_000002_create_item_photos_table.php` + `2026_07_15_000001_add_ai_background_to_item_photos.php`

| Coluna | Tipo | Null | Default | Índ./Constr. |
|---|---|---|---|---|
| `id` | bigIncrements | não | — | PK |
| `item_id` | foreignId | não | — | **FK→`items.id` `cascadeOnDelete`** |
| `path` | string | não | — | — |
| `original_path` | string | sim | — | — |
| `ai_status` | string(10) | sim | — | — |
| `ai_edited_at` | timestamp | sim | — | — |
| `position` | unsignedSmallInteger | não | `0` | — |
| `created_at` / `updated_at` | timestamp | sim | — | — |

**Zero índice explícito.** Sem unique em (`item_id`,`position`) — nada no banco impede duas fotos na mesma posição.

##### `site_settings` — `database/migrations/2026_07_05_000003_create_site_settings_table.php` + **4 ALTERs**

| Coluna | Tipo | Null | Default | Origem |
|---|---|---|---|---|
| `id` | bigIncrements | não | — | `..._create_site_settings_table.php` |
| `whatsapp` | string(30) | sim | — | `..._create_site_settings_table.php` |
| `instagram` | string(100) | sim | — | idem |
| `pix_key` | string(140) | sim | — | idem |
| `pix_key_type` | string(20) | sim | — | idem |
| `pix_name` | string(100) | sim | — | idem |
| `pix_city` | string(60) | sim | — | idem |
| `hero_title` | string(120) | sim | — | idem |
| `hero_subtitle` | string | sim | — | idem |
| `about_text` | text | sim | — | idem |
| `logo_path` | string | sim | — | `2026_07_06_000002_add_branding_to_site_settings_table.php` |
| `logo_dark_path` | string | sim | — | `2026_07_14_000004_add_logo_dark_path_to_site_settings.php` (`after('logo_path')`) |
| `mark_path` | string | sim | — | `2026_07_06_000002_add_branding_to_site_settings_table.php` |
| `primary_color` | string(7) | sim | — | idem |
| `layout` | string(20) | sim | — | `2026_07_17_000001_add_layout_to_site_settings.php` (`after('primary_color')`) |
| `seller_selection` | string(20) | sim | — | idem (`after('layout')`) |
| `billing_status` | string(15) | **não** | `'active'` | `2026_07_14_000006_add_billing_state_to_site_settings.php` |
| `billing_paid_until` | **date** | sim | — | idem |
| `billing_last_invoice_url` | string | sim | — | idem |
| `billing_updated_at` | timestamp | sim | — | idem |
| `created_at` / `updated_at` | timestamp | sim | — | `..._create_site_settings_table.php` |

**Zero índice, zero unique, zero FK.** É tabela-singleton por convenção de aplicação (`SiteSetting::current()`), sem nenhuma constraint de banco que impeça uma segunda linha.

##### `categories` — `database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php` + `2026_07_17_000003_add_image_to_categories.php`

| Coluna | Tipo | Null | Default | Índ./Constr. |
|---|---|---|---|---|
| `id` | bigIncrements | não | — | PK |
| `name` | string(60) | não | — | — |
| `slug` | string(80) | não | — | **U** |
| `image_path` | string | sim | — | — (`after('slug')`, `2026_07_17_000003_add_image_to_categories.php`) |
| `position` | unsignedSmallInteger | não | `0` | **sem índice** |
| `is_active` | boolean | não | `true` | I |
| `created_at` / `updated_at` | timestamp | sim | — | — |

##### `metric_events` — `database/migrations/2026_07_14_000003_create_metric_events_table.php`

| Coluna | Tipo | Null | Índ./Constr. |
|---|---|---|---|
| `id` | bigIncrements | não | PK |
| `occurred_at` | timestamp | não | I |
| `event` | string(20) | não | I composto (`event`,`occurred_at`) |
| `session_hash` | string(64) | não | I |
| `item_id` | foreignId | sim | **FK→`items.id` `nullOnDelete`** |
| `source` | string(20) | não | — |

**Sem `timestamps()`** (a migration diz explicitamente: sem `user_agent`, IP ou URL crua — "LGPD-clean por design").

##### `ai_analyses` — `database/migrations/2026_07_14_000005_create_ai_analyses_table.php` + `2026_07_15_000002_add_kind_to_ai_analyses.php`

| Coluna | Tipo | Null | Default | Índ./Constr. |
|---|---|---|---|---|
| `id` | bigIncrements | não | — | PK |
| `user_id` | foreignId | sim | — | **FK→`users.id` `nullOnDelete`** |
| `kind` | string(12) | não | `'intake'` | I (`after('user_id')`, `2026_07_15_000002_...`) |
| `provider` | string(20) | não | — | — |
| `model` | string(60) | não | — | — |
| `status` | string(10) | não | — | — |
| `failure_reason` | string | sim | — | — |
| `prompt_tokens` | unsignedInteger | não | `0` | — |
| `completion_tokens` | unsignedInteger | não | `0` | — |
| `cost_usd` | **decimal(10,6)** | não | `0` | — |
| `photos_count` | unsignedTinyInteger | não | `0` | — |
| `created_at` | timestamp | sim | — | I |

**Sem `updated_at`** (registro imutável, `$table->timestamp('created_at')->nullable()->index()` avulso). Não há índice composto (`user_id`,`kind`,`created_at`) — a consulta de limite mensal por categoria bate em dois índices separados.

##### `asaas_webhook_events` — `database/migrations/2026_07_14_000007_create_asaas_webhook_events_table.php`

| Coluna | Tipo | Null | Índ./Constr. |
|---|---|---|---|
| `id` | bigIncrements | não | PK |
| `asaas_event_id` | string | não | **U** (chave de idempotência) |
| `event_type` | string(40) | não | — |
| `payment_id` | string | sim | I |
| `processed_at` | timestamp | não | **sem índice** |
| `created_at` | timestamp | sim | — |

**Sem `updated_at`.** Sem FK.

##### `banners` — `database/migrations/2026_07_17_000002_create_banners_table.php`

| Coluna | Tipo | Null | Default |
|---|---|---|---|
| `id` | bigIncrements | não | — (PK) |
| `title` | string(80) | sim | — |
| `cta_label` | string(30) | sim | — |
| `cta_url` | string(255) | sim | — |
| `image_path` | string | **não** | — |
| `position` | unsignedTinyInteger | não | `0` |
| `is_active` | boolean | não | `true` |
| `created_at`/`updated_at` | timestamp | sim | — |

**Zero índice, zero unique, sem softDeletes** — a migration documenta a ausência de índice como decisão ("a tabela é minúscula, máx. 3 no ar"). O teto de 3 ativos é validação de aplicação, não constraint.

##### `sellers` — `database/migrations/2026_07_17_000005_create_sellers_table.php`

| Coluna | Tipo | Null | Default |
|---|---|---|---|
| `id` | bigIncrements | não | — (PK) |
| `name` | string(60) | não | — |
| `whatsapp` | string(30) | não | — |
| `is_active` | boolean | não | `true` |
| `position` | unsignedTinyInteger | não | `0` |
| `created_at`/`updated_at` | timestamp | sim | — |

**Zero índice, zero unique** — ausência de unique em `whatsapp` é documentada como decisão consciente na própria migration.

##### `terms_acceptances` — `database/migrations/2026_07_24_000001_create_terms_acceptances_table.php`

| Coluna | Tipo | Null | Índ./Constr. |
|---|---|---|---|
| `id` | bigIncrements | não | PK |
| `user_id` | foreignId | não | **FK→`users.id` `cascadeOnDelete`** |
| `document` | string | não | parte do U composto |
| `version` | string | não | parte do U composto |
| `document_hash` | string(64) | não | — |
| `accepted_at` | timestamp | não | — |
| `ip` | string(45) | não | — |
| `user_agent` | string(255) | não | — |
| `created_at`/`updated_at` | timestamp | sim | — |
| — | — | — | **U composto (`user_id`,`document`,`version`)** |

Contradição factual registrável: a migration documenta o registro como "trilha de evidência imutável", mas a FK é `cascadeOnDelete` — apagar o usuário apaga a evidência do aceite.

##### `signup_orders` — `database/migrations/2026_07_24_000002_create_signup_orders_table.php` (29 colunas, a maior tabela do schema)

| Coluna | Tipo | Null | Índ./Constr. |
|---|---|---|---|
| `id` | bigIncrements | não | PK (comentário: "nunca exposto") |
| `public_id` | **ulid** | não | **U** |
| `status` | string | não | I |
| `plan` | string | não | — |
| `cycle` | string | não | — |
| `store_name` | string | não | — |
| `slug` | string | não | **sem índice, sem unique** |
| `slug_lock` | string | sim | **U** (N NULLs permitidos — libera o endereço quando o pedido morre) |
| `whatsapp` | string | não | — |
| `payer_name` | string | não | — |
| `cpf_cnpj` | string | não | **sem índice** |
| `email` | string | não | **sem índice, sem unique** |
| `phone` | string | não | — |
| `ref` | string | sim | **sem índice** |
| `amount` | **unsignedInteger (centavos)** | não | — |
| `setup_fee_amount` | **unsignedInteger (centavos)** | não | — |
| `asaas_customer_id` | string | sim | **sem índice** |
| `asaas_subscription_id` | string | sim | I |
| `asaas_setup_payment_id` | string | sim | I |
| `invoice_url` | string | sim | — |
| `paid_at` | timestamp | sim | — |
| `setup_paid_at` | timestamp | sim | — |
| `terms_version` | string | não | — |
| `terms_hash` | string(64) | não | — |
| `terms_accepted_at` | timestamp | não | — |
| `terms_ip` | string(45) | não | — |
| `terms_user_agent` | string(255) | não | — |
| `created_at`/`updated_at` | timestamp | sim | — |

**Zero FK** — a tabela guarda `cpf_cnpj`, `email` e `phone` do pagador sem qualquer vínculo a `users` (o pedido nasce antes da conta). É a **segunda tabela do schema a guardar CPF/CNPJ**, a outra sendo `users.cpf_cnpj`.

---

#### 2. Tipos por natureza do dado

**Dinheiro — duas convenções coexistindo no mesmo schema:**

| Coluna | Tipo | Caminho |
|---|---|---|
| `items.price` | `decimal(10,2)` | `database/migrations/2026_07_05_000001_create_items_table.php` |
| `items.original_price` | `decimal(10,2)` | `database/migrations/2026_07_05_000001_create_items_table.php` |
| `items.sold_price` | `decimal(10,2)` | `database/migrations/2026_07_14_000002_add_sale_data_to_items_table.php` |
| `ai_analyses.cost_usd` | `decimal(10,6)` | `database/migrations/2026_07_14_000005_create_ai_analyses_table.php` |
| `signup_orders.amount` | `unsignedInteger` em **centavos** | `database/migrations/2026_07_24_000002_create_signup_orders_table.php` |
| `signup_orders.setup_fee_amount` | `unsignedInteger` em **centavos** | `database/migrations/2026_07_24_000002_create_signup_orders_table.php` |

A fase 16 (`signup_orders`) inaugurou centavos-em-inteiro sem migrar o catálogo (`items`) para a mesma convenção; nada no schema documenta a divergência (o único indício é o comentário `// Snapshot do PlanMap no momento do pedido (centavos)`).

**Datas/horas:** 14 colunas `timestamp` nomeadas + os `timestamps()` das 15 tabelas que os têm; **uma única** coluna `date` (`site_settings.billing_paid_until`). **Zero** `dateTime`, **zero** `timestampTz`/`dateTimeTz`, **zero** coluna de timezone. Não há `useCurrent()` fora de `failed_jobs.failed_at`.

**Status — 100% `string` + enum PHP, nunca enum de banco, nunca check:**

| Coluna | Tipo | Default | Enum PHP correspondente (por comentário/uso) | Caminho |
|---|---|---|---|---|
| `items.status` | string(20) | `'available'` | `App\Enum\ItemStatus` | `database/migrations/2026_07_05_000001_create_items_table.php` |
| `items.condition` | string(20) | `'used'` | `App\Enum\ItemCondition` | idem |
| `items.ai_intake_status` | string(20) | — | `null\|processing\|done\|failed\|refused` (só comentário) | `database/migrations/2026_07_16_000001_add_ai_studio_draft_to_items.php` |
| `item_photos.ai_status` | string(**10**) | — | `processing\|done\|failed` (só comentário) | `database/migrations/2026_07_15_000001_add_ai_background_to_item_photos.php` |
| `ai_analyses.status` | string(**10**) | — | `ok\|refused\|failed` (só comentário) | `database/migrations/2026_07_14_000005_create_ai_analyses_table.php` |
| `ai_analyses.kind` | string(**12**) | `'intake'` | `intake\|background` (só comentário) | `database/migrations/2026_07_15_000002_add_kind_to_ai_analyses.php` |
| `site_settings.billing_status` | string(**15**) | `'active'` | `active\|past_due\|suspended` (só comentário) | `database/migrations/2026_07_14_000006_add_billing_state_to_site_settings.php` |
| `site_settings.layout` | string(20) | **nenhum** | `App\Enum\SiteLayout::fromSetting` (fallback na leitura) | `database/migrations/2026_07_17_000001_add_layout_to_site_settings.php` |
| `site_settings.seller_selection` | string(20) | **nenhum** | `App\Enum\SellerSelection::fromSetting` | idem |
| `site_settings.pix_key_type` | string(20) | — | — | `database/migrations/2026_07_05_000003_create_site_settings_table.php` |
| `signup_orders.status` | string (**sem limite**) | — | `App\Enum\SignupOrderStatus` | `database/migrations/2026_07_24_000002_create_signup_orders_table.php` |
| `signup_orders.cycle` | string (sem limite) | — | `monthly\|yearly` (só comentário) | idem |
| `metric_events.event` | string(20) | — | — | `database/migrations/2026_07_14_000003_create_metric_events_table.php` |
| `metric_events.source` | string(20) | — | — | idem |

Sete tamanhos diferentes (`10, 12, 15, 20, 20, 20, sem limite`) para o mesmo tipo de dado.

---

#### 3. Migrations que ALTERAM tabela depois — a linha do tempo

| # | Migration (caminho) | Tabela | O que muda |
|---|---|---|---|
| 1 | `database/migrations/0001_01_01_000004_add_role_id_to_users_table.php` | `users` | + `role_id` (nullable, sem FK) |
| 2 | `database/migrations/2026_07_06_000001_add_slug_to_items_table.php` | `items` | + `slug` nullable **unique** + backfill via `DB::table()->chunkById()` (sem model, para não disparar events/activity log) |
| 3 | `database/migrations/2026_07_06_000002_add_branding_to_site_settings_table.php` | `site_settings` | + `logo_path`, `mark_path`, `primary_color` |
| 4 | `database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php` | `items` | cria `categories`; **+ `category_id` nullable → backfill → `->nullable(false)->change()` (NOT NULL)**; dropa índice `category` e depois a coluna `category` |
| 5 | `database/migrations/2026_07_14_000001_prune_boilerplate_roles_and_permissions.php` | `roles`,`permissions`,`permission_role`,`permission_user`,`users` | **migration só de DADOS** (nenhum DDL): apaga papéis/permissões herdados do boilerplate, rebaixa usuários órfãos para `visitor`, e chama `Cache::flush()`. `down()` vazio e documentado como irreversível |
| 6 | `database/migrations/2026_07_14_000002_add_sale_data_to_items_table.php` | `items` | + `sold_at` (I), `sold_price`; backfill `sold_at = updated_at`, `sold_price = price` para `status='sold'` |
| 7 | `database/migrations/2026_07_14_000004_add_logo_dark_path_to_site_settings.php` | `site_settings` | + `logo_dark_path` |
| 8 | `database/migrations/2026_07_14_000006_add_billing_state_to_site_settings.php` | `site_settings` | + `billing_status` (NOT NULL default `'active'`), `billing_paid_until`, `billing_last_invoice_url`, `billing_updated_at` |
| 9 | `database/migrations/2026_07_15_000001_add_ai_background_to_item_photos.php` | `item_photos` | + `original_path`, `ai_status`, `ai_edited_at` |
| 10 | `database/migrations/2026_07_15_000002_add_kind_to_ai_analyses.php` | `ai_analyses` | + `kind` (default `'intake'` faz o backfill implícito) + índice |
| 11 | `database/migrations/2026_07_16_000001_add_ai_studio_draft_to_items.php` | `items` | **3 `->change()` afrouxando NOT NULL**: `name` NOT NULL→NULL, `category_id` NOT NULL→NULL, `condition` NOT NULL→NULL; + `is_draft` (I), `drafted_at`, `ai_intake_status` |
| 12 | `database/migrations/2026_07_17_000001_add_layout_to_site_settings.php` | `site_settings` | + `layout`, `seller_selection` (ambas nullable, **sem default no banco** — fallback é na leitura, pelo enum) |
| 13 | `database/migrations/2026_07_17_000003_add_image_to_categories.php` | `categories` | + `image_path` |
| 14 | `database/migrations/2026_07_17_000004_add_is_featured_to_items.php` | `items` | + `is_featured` (default `false`, **sem índice**) |
| 15 | `database/migrations/2026_07_20_000001_add_colors_to_items.php` | `items` | + `colors` (json nullable) |

**Fato relevante pedido explicitamente:** `items.category_id` **nasceu nullable, virou NOT NULL** (`2026_07_08_000001`, mesma migration) **e voltou a nullable** (`2026_07_16_000001`). `items.name` e `items.condition` **nasceram NOT NULL e viraram nullable** em `2026_07_16_000001` — a garantia de "peça tem nome e categoria" saiu do banco e passou a viver só na camada de validação da publicação. `items` acumula **6 ALTERs**, `site_settings` **4**.

Total de `->change()` no repo: 7 ocorrências em 2 arquivos (`database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php`, `database/migrations/2026_07_16_000001_add_ai_studio_draft_to_items.php`) — 4 delas em `up()`, 3 em `down()`.

---

#### 4. FKs sem `onDelete` e colunas de busca sem índice

**As 9 FKs do schema, com regra de exclusão:**

| Tabela.coluna | Regra | Caminho |
|---|---|---|
| `permission_role.role_id` | **SEM `onDelete` declarado** | `database/migrations/0001_01_01_000003_create_permissions_roles_tables.php` |
| `permission_role.permission_id` | **SEM `onDelete` declarado** | idem |
| `permission_user.user_id` | `onDelete('cascade')` | idem |
| `permission_user.permission_id` | `onDelete('cascade')` | idem |
| `item_photos.item_id` | `cascadeOnDelete` | `database/migrations/2026_07_05_000002_create_item_photos_table.php` |
| `items.category_id` | `restrictOnDelete` | `database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php` |
| `metric_events.item_id` | `nullOnDelete` | `database/migrations/2026_07_14_000003_create_metric_events_table.php` |
| `ai_analyses.user_id` | `nullOnDelete` | `database/migrations/2026_07_14_000005_create_ai_analyses_table.php` |
| `terms_acceptances.user_id` | `cascadeOnDelete` | `database/migrations/2026_07_24_000001_create_terms_acceptances_table.php` |

**Nenhuma FK do projeto declara `onUpdate`.** As duas de `permission_role` são as únicas sem `onDelete` — e a migration `database/migrations/2026_07_14_000001_prune_boilerplate_roles_and_permissions.php` compensa isso à mão no PHP, com o comentário literal `// Pivots primeiro (permission_role não tem cascade), depois os registros.`

**Colunas `foreignId` que NÃO viraram FK** (3 ocorrências de `foreignId(` sem `constrained` — a terceira é falso positivo por quebra de linha):

| Coluna | Tem índice? | FK? | Caminho |
|---|---|---|---|
| `users.role_id` | **não** | **não** | `database/migrations/0001_01_01_000004_add_role_id_to_users_table.php` |
| `sessions.user_id` | sim (`->index()`) | **não** | `database/migrations/0001_01_01_000000_create_users_table.php` |
| `items.category_id` | implícito via FK | sim (`restrictOnDelete`) | `database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php` (declaração multi-linha) |

`users.role_id` é o caso mais agudo: é a coluna que todo `HasRolesAndPermissions` lê, **sem índice e sem integridade referencial** — e é exatamente a coluna que a migration `2026_07_14_000001_prune_...` faz `UPDATE ... whereIn('role_id', $removedRoleIds)`.

**Tabelas com ZERO índice explícito** (5): `banners`, `sellers`, `site_settings`, `item_photos`, `terms_acceptances` — caminhos em `database/migrations/2026_07_17_000002_create_banners_table.php`, `..._000005_create_sellers_table.php`, `2026_07_05_000003_create_site_settings_table.php`, `2026_07_05_000002_create_item_photos_table.php`, `2026_07_24_000001_create_terms_acceptances_table.php` respectivamente. Nas três primeiras, `is_active` e `position` — as colunas por que a vitrine filtra e ordena — não têm índice nenhum.

**Colunas de busca/filtro sem índice, por tabela:**

| Coluna | Uso aparente | Caminho da migration |
|---|---|---|
| `items.is_featured` | seção "Destaques" do Boutique | `database/migrations/2026_07_17_000004_add_is_featured_to_items.php` |
| `items.deleted_at` | todo `whereNull(deleted_at)` do soft delete | `database/migrations/2026_07_05_000001_create_items_table.php` |
| `items.drafted_at` | ordenação da fila do modo lote (comentário da própria migration) | `database/migrations/2026_07_16_000001_add_ai_studio_draft_to_items.php` |
| `items.ai_intake_status` | polling do rascunho | idem |
| `item_photos.item_id` + `position` | ordenação da galeria | `database/migrations/2026_07_05_000002_create_item_photos_table.php` |
| `categories.position` | ordenação da strip/drawer | `database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php` |
| `banners.is_active`, `banners.position` | carrossel do Boutique | `database/migrations/2026_07_17_000002_create_banners_table.php` |
| `sellers.is_active`, `sellers.position` | rodízio `ativas[id % N]` | `database/migrations/2026_07_17_000005_create_sellers_table.php` |
| `signup_orders.slug` | checagem de disponibilidade do endereço | `database/migrations/2026_07_24_000002_create_signup_orders_table.php` |
| `signup_orders.email`, `signup_orders.cpf_cnpj` | busca do pedido pelo pagador | idem |
| `signup_orders.asaas_customer_id` | reconciliação com o Asaas | idem |
| `asaas_webhook_events.processed_at` | janela de reprocessamento | `database/migrations/2026_07_14_000007_create_asaas_webhook_events_table.php` |
| `ai_analyses` (`user_id`,`kind`,`created_at`) | limite mensal por categoria | `database/migrations/2026_07_14_000005_...` + `2026_07_15_000002_...` |
| `users.role_id` | resolução de papel de todo request autenticado | `database/migrations/0001_01_01_000004_add_role_id_to_users_table.php` |

---

#### 5. Factories

5 arquivos. O boilerplate (`origin/main`) só tem `UserFactory` — e ela **diverge** (9 linhas de diferença).

| Factory (caminho) | Model | States | Observações |
|---|---|---|---|
| `database/factories/UserFactory.php` | `User` (implícito, sem `$model`) | `unverified()` | Sem `declare(strict_types=1)` e sem `namespace`-doc; gera `cpf_cnpj`, `phone`, `mobile`, `user_notes` sintéticos; `is_active` **aleatório** (`fake()->boolean()`); `role_id => null`; senha memoizada em `static ?string $password` |
| `database/factories/ItemFactory.php` | `Item` | `sold()`, `soldAt(CarbonImmutable $when, ?float $price = null)`, `reserved()`, `unpublished()`, `draft()` | `soldAt()` é o único state com **parâmetros** e o único que usa `afterCreating` + `forceFill(...)->saveQuietly()` para escapar do hook de transição; `category_id => Category::factory()`; `size` de uma lista fixa de tamanhos infantis (`RN, P, M, G, 0-3m, ..., 1 ano`) — enviesada para o nicho fundador; **nenhum state cobre `is_featured` nem `colors`** |
| `database/factories/CategoryFactory.php` | `Category` | `inactive()` | Não gera `slug` (delegado ao hook `creating` do model, comentado no arquivo); `name` com `fake()->unique()` |
| `database/factories/BannerFactory.php` | `Banner` | `inactive()` | `cta_url` fixo `/?categoria=vestidos`; `image_path` = `banners/{uuid}.jpg` (arquivo inexistente) |
| `database/factories/SellerFactory.php` | `Seller` | `inactive()` | `name` = `'Vendas ' . fake()->firstName('female')`; `whatsapp` = `'(16) 9' . fake()->numerify('####-####')` — DDD fixo do cliente-âncora |

**Sem factory:** `SiteSetting`, `ItemPhoto`, `MetricEvent`, `AiAnalysis`, `AsaasWebhookEvent`, `TermsAcceptance`, `SignupOrder`, `Role`, `Permission` — 9 dos 14 models de domínio.

---

#### 6. Seeders — as 19 classes

| Seeder (caminho) | O que semeia | Chama (dependências) | Idempotência |
|---|---|---|---|
| `database/seeders/DatabaseSeeder.php` | orquestrador | `PermissionRoleSeeder`, `InstanceAdminSeeder`, `InstanceSuperUserSeeder`, `DefaultCategoriesSeeder`; + `UserSeeder` **só se `!app()->isProduction()`** | — |
| `database/seeders/PermissionRoleSeeder.php` | `roles` + `permissions` a partir de `App\Enum\Roles`/`Permissions`; faz `sync()` do pivô `permission_role` por papel (SUPER_USER=todas, ADMIN=todas menos impersonar, OWNER=5, STAFF=3, VISITOR=0); invalida `user:{id}:permissions` e `user:{id}:roles` de **todos** os usuários | — | `updateOrCreate` |
| `database/seeders/InstanceAdminSeeder.php` | dono da loja (papel `OWNER`) a partir de `config('vitrine.admin.email'/'admin.name')`; sem e-mail configurado **não cria ninguém** | `PermissionRoleSeeder` | `firstOrCreate` |
| `database/seeders/InstanceSuperUserSeeder.php` | super usuário de manutenção da plataforma (papel `SUPER_USER`), oculto do proprietário; sem e-mail **ou** sem senha não cria nada | `PermissionRoleSeeder` | `firstOrCreate` |
| `database/seeders/DefaultCategoriesSeeder.php` | 9 categorias do nicho infantil (`clothes, shoes, toys, strollers, nursery, feeding, bath, accessories, other`) — as mesmas do backfill da migration | — | `firstOrCreate` por slug |
| `database/seeders/GarimpoCategoriesSeeder.php` | 8 categorias adultas (`vestidos, conjuntos, blusas, saias, calcas-shorts, blazers-kimonos, body, macacoes`) | — | `firstOrCreate` por slug |
| `database/seeders/OticaVisaoCategoriesSeeder.php` | 3 categorias de ótica (`oculos-de-sol, armacoes, esportivo`) | — | `firstOrCreate` por slug |
| `database/seeders/UserSeeder.php` | 1 super user fixo + 1 usuário por papel + 3 usuários aleatórios por papel, todos com senha `password` | — | **não** (`User::factory()->create()` puro; re-run duplica) |
| `database/seeders/DesapegoStaffSeeder.php` | **2 usuárias STAFF com nome e e-mail pessoais reais** (ver §7) | `PermissionRoleSeeder` | `firstOrCreate` |
| `database/seeders/DemoPlatformUserSeeder.php` | usuário `SUPER_USER` da demo (`***@ctvitrine.com.br`), só se `config('vitrine.demo.instance')` ou fora de produção | — | `firstOrCreate` |
| `database/seeders/DemoCtVitrineSeeder.php` | case neutro da marca: `site_settings` (contato/PIX placeholder, logos SVG de `public/`), usuária STAFF `***@ctvitrine.com.br`, força `layout=BOUTIQUE` via `forceFill`+`saveQuietly`; **não semeia produtos** | `PermissionRoleSeeder`, `DemoPlatformUserSeeder`, `DefaultCategoriesSeeder` | sim (`update`/`firstOrCreate`) |
| `database/seeders/DemoGarimpoSeeder.php` | case completo: `site_settings` (**dados reais de negócio**, §7), branding de `data/branding-garimpo/`, **2 `sellers` fictícias**, **6 `banners`** (3 ativos + 3 inativos) de `data/banners-garimpo/`, usuária STAFF, layout BOUTIQUE | `PermissionRoleSeeder`, `DemoPlatformUserSeeder`, `GarimpoCategoriesSeeder`, `ItemDemoGarimpoSeeder` | sim (banners: `where('title')->exists()`) |
| `database/seeders/DemoLuluSeeder.php` | case do cliente fundador: `site_settings` (**nome civil real em `pix_name`**, §7), branding = fallbacks nulos, usuária STAFF, layout BOUTIQUE | `PermissionRoleSeeder`, `DemoPlatformUserSeeder`, `DefaultCategoriesSeeder`, `ItemImportSeeder` | sim |
| `database/seeders/DemoManasSeeder.php` | case completo: `site_settings` (**dados reais de negócio**, §7), branding de `data/branding-manas/`, usuária STAFF, categoria `clothes` inline, layout BOUTIQUE | `PermissionRoleSeeder`, `DemoPlatformUserSeeder`, `ItemDemoManasSeeder` | sim |
| `database/seeders/DemoOticaVisaoSeeder.php` | case da vertical de ótica: `site_settings` (**dados reais de negócio**, §7), branding de `data/branding-oticavisao/`, usuária STAFF, layout BOUTIQUE | `PermissionRoleSeeder`, `DemoPlatformUserSeeder`, `OticaVisaoCategoriesSeeder`, `ItemDemoOticaVisaoSeeder` | sim |
| `database/seeders/ItemImportSeeder.php` | **classe-base** do import de catálogo: lê `database/seeders/data/{$dataFile}`, resolve `category` (slug) → `category_id`, pula item se a categoria não existe ou se a pasta de fotos falta, copia fotos para `items/{id}/{uuid}.ext` via `Storage::putFileAs` e cria `item_photos` na ordem natural. `photosBasePath()` = `storage_path('app/import')` (**não versionado**) | — | por `name`, incluindo soft-deleted (`Item::withTrashed()`) |
| `database/seeders/ItemDemoGarimpoSeeder.php` | `extends ItemImportSeeder`; `$dataFile = 'items-demo-garimpo.php'`, fotos em `database/seeders/data/photos-garimpo` | herda | herda |
| `database/seeders/ItemDemoManasSeeder.php` | `extends ItemImportSeeder`; `$dataFile = 'items-demo-manas.php'`, fotos em `database/seeders/data/photos-manas` | herda | herda |
| `database/seeders/ItemDemoOticaVisaoSeeder.php` | `extends ItemImportSeeder`; `$dataFile = 'items-demo-oticavisao.php'`, fotos em `database/seeders/data/photos-oticavisao` | herda | herda |

**Grafo de dependências (raízes → folhas):**
`DatabaseSeeder` → `PermissionRoleSeeder` · `InstanceAdminSeeder`→`PermissionRoleSeeder` · `InstanceSuperUserSeeder`→`PermissionRoleSeeder` · `DefaultCategoriesSeeder` · [`UserSeeder`].
`Demo{CtVitrine,Garimpo,Lulu,Manas,OticaVisao}Seeder` → `PermissionRoleSeeder` + `DemoPlatformUserSeeder` + (seeder de categorias do case) + (seeder de itens do case).
`PermissionRoleSeeder` é chamado por **8** dos 19 seeders e referenciado em **15** arquivos de `app/`+`tests/`+`config/`.
**Órfãos de produção:** `DesapegoStaffSeeder` não é chamado por nenhum outro seeder nem por `app/`; sua única referência viva é `tests/Feature/Permissions/DesapegoStaffSeederTest.php` (que o executa 2×), enquanto `docs/tecnico/02-papeis-e-permissoes.md:117` afirma que ele "**não faz mais parte do fluxo**".

**Catálogos `database/seeders/data/*.php`:**

| Arquivo | Itens | Categorias usadas | Fotos versionadas? | Consumido por |
|---|---|---|---|---|
| `database/seeders/data/items.php` | 7 | `clothes` (5), `shoes` (2) | **não** — `photos_dir` aponta para `storage/app/import/` (fora do git) → os 7 itens são **pulados** em qualquer máquina sem rsync | `ItemImportSeeder` (via `DemoLuluSeeder`) |
| `database/seeders/data/items-demo-garimpo.php` | 42 | 8 slugs (`conjuntos` 21, `vestidos` 6, `blusas` 6, `saias` 3, `calcas-shorts` 2, `blazers-kimonos` 2, `macacoes` 1, `body` 1) | sim — 42 pastas em `database/seeders/data/photos-garimpo/` | `ItemDemoGarimpoSeeder` |
| `database/seeders/data/items-demo-manas.php` | 14 | `clothes` (14) | sim — 14 pastas em `database/seeders/data/photos-manas/` (o docblock do arquivo ainda diz `storage/app/import/`, desatualizado) | `ItemDemoManasSeeder` |
| `database/seeders/data/items-demo-oticavisao.php` | 7 | `oculos-de-sol` (5), `esportivo` (1), `armacoes` (1) | sim — 7 pastas em `database/seeders/data/photos-oticavisao/` (uma com 2 fotos) | `ItemDemoOticaVisaoSeeder` |

Fatos medidos sobre os 70 itens dos 4 catálogos: **`ItemStatus::SOLD` aparece 0 vezes** (nenhuma venda semeada → toda a série de faturamento/métricas nasce vazia); `is_published => true` em 70/70; `photos_dir` em 70/70; `ItemCondition::LIKE_NEW` em 63 (garimpo 42 + manas 14 + items.php 7) e `ItemCondition::NEW` em 7 (ótica). **A chave `'colors'` não aparece em nenhum dos 4 catálogos** — a coluna `items.colors`, criada em `database/migrations/2026_07_20_000001_add_colors_to_items.php` justamente a pedido da Ótica Visão, não é exercitada por seed algum.

**Assets binários versionados** (77 `.jpg`, todos sob `database/seeders/data/`): 6 banners em `banners-garimpo/`, 2 em `branding-garimpo/`, 2 em `branding-manas/`, 3 em `branding-oticavisao/`, 42 em `photos-garimpo/`, 14 em `photos-manas/`, 8 em `photos-oticavisao/`. Os maiores individuais passam de 500 KB (`photos-manas/manas-vestido-estampado-azul/1.jpg`, `photos-manas/manas-vestido-floral-turquesa/1.jpg`).

---

#### 7. Dado real dentro de seeders — achado

Os seeders de case **não são dados sintéticos**: são registros de pessoas e empresas reais, versionados em git. Nada abaixo é citado com o valor original.

| Caminho | Campo(s) | Natureza |
|---|---|---|
| `database/seeders/DesapegoStaffSeeder.php` (const `STAFF`) | `name`, `email` de 2 usuárias | **Nomes próprios + 2 e-mails pessoais reais** (`***@hotmail.com`, `***@gmail.com`, provedores de consumo, não corporativos). Viram contas STAFF ativas com senha de `.env` e `email_verified_at` forçado. Executado por `tests/Feature/Permissions/DesapegoStaffSeederTest.php` |
| `database/seeders/DemoLuluSeeder.php` (const `SETTINGS`) | `pix_name` | **Nome civil completo de pessoa física real** (`***`) — chave PIX nominal |
| `database/seeders/DemoLuluSeeder.php` | `whatsapp`, `pix_key` | **Telefone celular real** (`(**) *****-****`), repetido nos dois campos |
| `database/seeders/DemoLuluSeeder.php` (docblock) | — | URL do site público do cliente (`***.***.com.br`) |
| `database/seeders/DemoGarimpoSeeder.php` (const `SETTINGS`) | `whatsapp`, `pix_key` | **Telefone comercial real** (`(16) *****-****`), repetido nos dois campos |
| `database/seeders/DemoGarimpoSeeder.php` | `instagram`, `pix_name`, `pix_city` | Handle real do Instagram, razão social e cidade da loja |
| `database/seeders/DemoGarimpoSeeder.php` | `about_text` | **Endereço físico completo da loja** (`Rua ***, *** — Centro, ***/SP`) + horário de funcionamento |
| `database/seeders/DemoManasSeeder.php` (const `SETTINGS`) | `whatsapp`, `pix_key` | **Telefone comercial real** (`(17) *****-****`), repetido nos dois campos |
| `database/seeders/DemoManasSeeder.php` | `instagram`, `pix_name`, `pix_city` | Handle real, razão social, cidade |
| `database/seeders/DemoManasSeeder.php` | `about_text` | **Endereço físico da loja** (`Rua **, nº *** — esquina com a **, ***/SP`) + horário |
| `database/seeders/DemoOticaVisaoSeeder.php` (const `SETTINGS`) | `whatsapp`, `pix_key` | **Telefone fixo comercial real** (`(17) ****-****`) |
| `database/seeders/DemoOticaVisaoSeeder.php` | `instagram`, `pix_name`, `pix_city` | Handle real, razão social, cidade |
| `database/seeders/InstanceSuperUserSeeder.php` (docblock) | — | **E-mail nominal do operador da plataforma** citado em texto livre (`***@***.com.br`) |
| `database/seeders/data/items-demo-garimpo.php` (cabeçalho) | — | Declara que o catálogo foi "gerado a partir dos **Stories públicos do Instagram do prospect**, APENAS para a demonstração privada enviada a ele. **Não publicar.**" — e as 42 fotos correspondentes estão versionadas no repo |
| `database/seeders/data/items-demo-manas.php` (cabeçalho) | — | Mesma declaração ("posts públicos do Instagram do prospect… Não publicar") — 14 fotos versionadas |
| `database/seeders/data/items-demo-oticavisao.php` (cabeçalho) | — | "prints de carrossel do Instagram" + instrução `REVISAR com o *** antes de usar em proposta real` (nome próprio real no comentário) |
| `database/seeders/data/photos-garimpo/**`, `photos-manas/**`, `photos-oticavisao/**` | 63 `.jpg` | **Fotografias de produto de terceiros**, obtidas de Stories/posts de Instagram alheios, redistribuídas no git |
| `database/seeders/data/branding-garimpo/**`, `branding-manas/**`, `branding-oticavisao/**` | 7 `.jpg` | **Logotipos/marcas de empresas reais** versionados |

Contraste registrável: `database/seeders/DemoGarimpoSeeder.php` **fictícia deliberadamente** as vendedoras (const `SELLERS`, números `(16) 90000-0001/0002`) e o link do grupo VIP (`.../DEMOVIPgarimpo`), com comentário explícito "jamais um número real"; mas os campos `whatsapp`/`pix_key`/`about_text` do mesmo arquivo carregam o telefone e o endereço reais da loja. A regra de redação existe no projeto e é aplicada a um subconjunto dos campos.

Medições de forma (contagem de **linhas** com match, não de ocorrências): telefone BR literal em 5 arquivos (`DemoCtVitrine` 2, `DemoGarimpo` 4, `DemoLulu` 2, `DemoManas` 2, `DemoOticaVisao` 2); padrão de e-mail em 10 arquivos de `database/seeders/*.php`; `Rua <maiúscula/dígito>` em 2 (`DemoGarimpo`, `DemoManas`); URL `http(s)://` em 1 (`DemoGarimpo`). Nenhum CPF/CNPJ literal foi encontrado em seeder — as colunas `users.cpf_cnpj` e `signup_orders.cpf_cnpj` só recebem valor de `fake()->numerify()` em `database/factories/UserFactory.php`.

---

#### 8. Tabelas × colunas × índices × FKs (medido)

Saída direta do parser sobre os `up()` das 30 migrations. "IDX" = índices não-únicos **declarados explicitamente** (índices implícitos criados pelo MySQL para FK não entram); "UNIQ" = uniques simples + compostos; "ALTERs" = nº de migrations posteriores que alteram a tabela.

| Tabela | Cols | IDX | UNIQ | FK | ALTERs | Criada em |
|---|---|---|---|---|---|---|
| `activity_log` | 12 | 4 | 0 | 0 | 0 | `database/migrations/2026_03_27_004320_create_activity_log_table.php` |
| `ai_analyses` | 12 | 2 | 0 | 1 | 1 | `database/migrations/2026_07_14_000005_create_ai_analyses_table.php` |
| `asaas_webhook_events` | 6 | 1 | 1 | 0 | 0 | `database/migrations/2026_07_14_000007_create_asaas_webhook_events_table.php` |
| `banners` | 9 | 0 | 0 | 0 | 0 | `database/migrations/2026_07_17_000002_create_banners_table.php` |
| `cache` | 3 | 0 | 0 | 0 | 0 | `database/migrations/0001_01_01_000001_create_cache_table.php` |
| `cache_locks` | 3 | 0 | 0 | 0 | 0 | `database/migrations/0001_01_01_000001_create_cache_table.php` |
| `categories` | 8 | 1 | 1 | 0 | 1 | `database/migrations/2026_07_08_000001_create_categories_and_migrate_items.php` |
| `failed_jobs` | 7 | 0 | 1 | 0 | 0 | `database/migrations/0001_01_01_000002_create_jobs_table.php` |
| `item_photos` | 9 | 0 | 0 | 1 | 1 | `database/migrations/2026_07_05_000002_create_item_photos_table.php` |
| `items` | 21 | 4 | 1 | 1 | **6** | `database/migrations/2026_07_05_000001_create_items_table.php` |
| `job_batches` | 10 | 0 | 0 | 0 | 0 | `database/migrations/0001_01_01_000002_create_jobs_table.php` |
| `jobs` | 7 | 1 | 0 | 0 | 0 | `database/migrations/0001_01_01_000002_create_jobs_table.php` |
| `metric_events` | 6 | 3 | 0 | 1 | 0 | `database/migrations/2026_07_14_000003_create_metric_events_table.php` |
| `password_reset_tokens` | 3 | 0 | 0 | 0 | 0 | `database/migrations/0001_01_01_000000_create_users_table.php` |
| `permission_role` | 2 | 0 | 0 | 2 | 0 | `database/migrations/0001_01_01_000003_create_permissions_roles_tables.php` |
| `permission_user` | 5 | 0 | 0 | 2 | 0 | `database/migrations/0001_01_01_000003_create_permissions_roles_tables.php` |
| `permissions` | 5 | 0 | 1 | 0 | 0 | `database/migrations/0001_01_01_000003_create_permissions_roles_tables.php` |
| `roles` | 6 | 0 | 1 | 0 | 0 | `database/migrations/0001_01_01_000003_create_permissions_roles_tables.php` |
| `sellers` | 7 | 0 | 0 | 0 | 0 | `database/migrations/2026_07_17_000005_create_sellers_table.php` |
| `sessions` | 6 | 2 | 0 | 0 | 0 | `database/migrations/0001_01_01_000000_create_users_table.php` |
| `signup_orders` | **29** | 3 | 2 | 0 | 0 | `database/migrations/2026_07_24_000002_create_signup_orders_table.php` |
| `site_settings` | 22 | **0** | **0** | **0** | 4 | `database/migrations/2026_07_05_000003_create_site_settings_table.php` |
| `terms_acceptances` | 10 | 0 | 1 | 1 | 0 | `database/migrations/2026_07_24_000001_create_terms_acceptances_table.php` |
| `users` | 14 | 0 | 1 | 0 | 1 | `database/migrations/0001_01_01_000000_create_users_table.php` |
| **TOTAL — 24 tabelas** | **222** | **21** | **10** | **9** | **15** | — |

Chaves primárias: 19 tabelas com `id` auto-increment; 4 com PK de string/composta (`cache.key`, `cache_locks.key`, `password_reset_tokens.email`, `sessions.id`, `job_batches.id`) e 2 com PK composta de pivô (`permission_role`, `permission_user`).

---

#### Medições

Todas as contagens acima vêm destes comandos, executados nesta sessão. `CT=/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `BP=/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`, `SP=/private/tmp/claude-501/-Users-cristianomorgante-workspace-laravel-simplify-technology-boilerplate/d8004fea-fc6c-4549-80cd-c5c1639cda27/scratchpad`.

```bash
# 136 / 30 / 5 / 100
git -C $CT ls-tree -r 53d7d9a --name-only -- database | wc -l
git -C $CT ls-tree -r 53d7d9a --name-only -- database/migrations | wc -l
git -C $CT ls-tree -r 53d7d9a --name-only -- database/factories | wc -l
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders | wc -l

# 19 classes PHP de seeder / 4 catálogos data / 77 jpg
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders | grep -c '^database/seeders/[^/]*\.php$'
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders/data | grep -c '\.php$'
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders/data | grep -c '\.jpg$'

# fonte do censo: cada migration extraída por git show para $SP/mig/ (30 arquivos)
for f in $(git -C $CT ls-tree -r 53d7d9a --name-only -- database/migrations); do
  git -C $CT show 53d7d9a:$f > $SP/mig/$(basename $f); done; ls $SP/mig | wc -l

# tabela §8 (24 tabelas / 222 cols / 21 idx / 10 uniq / 9 FK) — parser só do up(),
# com FK detectada em statements com quebra de linha normalizada
python3 $SP/census3.py $SP/mig

# lista das 9 FKs com a regra de onDelete (§4)
python3 $SP/fks.py $SP/mig

# foreignId sem constrained (3 linhas, 1 falso positivo multi-linha)
grep -n "foreignId(" $SP/mig/*.php | grep -v "constrained"

# colunas de dinheiro: 4 decimal + 2 unsignedInteger de centavos
grep -hn "decimal(" $SP/mig/*.php
grep -hn "unsignedInteger('amount'\|setup_fee_amount" $SP/mig/*.php

# datas: 14 timestamp nomeados + 1 date, 0 dateTime
grep -ho "\->\(timestamp\|dateTime\|date\)('[a-z_]*'" $SP/mig/*.php | sort | uniq -c | sort -rn

# 25 linhas com ->default(...)/useCurrent; 1 arquivo com softDeletes; 7 ->change()
grep -hn "useCurrent\|->default(" $SP/mig/*.php | grep '\$table->' | wc -l
grep -ln "softDeletes" $SP/mig/*.php
grep -n "\->change()" $SP/mig/*.php

# pastas de fotos por case: 42 / 14 / 7 ; banners: 6
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders/data/photos-garimpo    | sed 's|/[^/]*$||' | sort -u | wc -l
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders/data/photos-manas      | sed 's|/[^/]*$||' | sort -u | wc -l
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders/data/photos-oticavisao | sed 's|/[^/]*$||' | sort -u | wc -l
git -C $CT ls-tree -r 53d7d9a --name-only -- database/seeders/data/banners-garimpo   | wc -l

# itens por catálogo (7 / 42 / 14 / 7) e estados
for f in items.php items-demo-garimpo.php items-demo-manas.php items-demo-oticavisao.php; do
  git -C $CT show 53d7d9a:database/seeders/data/$f | grep -c "'name'"; done
git -C $CT grep -c "ItemStatus::SOLD"      53d7d9a -- 'database/seeders/data/*.php'   # nenhum match
git -C $CT grep -c "ItemStatus::AVAILABLE" 53d7d9a -- 'database/seeders/data/*.php'
git -C $CT grep -c "ItemCondition::LIKE_NEW" 53d7d9a -- 'database/seeders/data/*.php'
git -C $CT grep -c "ItemCondition::NEW"    53d7d9a -- 'database/seeders/data/*.php'
git -C $CT grep -c "'photos_dir'"          53d7d9a -- 'database/seeders/data/*.php'
git -C $CT grep -c "'colors'"              53d7d9a -- 'database/seeders/data/*.php'   # nenhum match
for f in ...; do git -C $CT show 53d7d9a:database/seeders/data/$f \
  | grep -o "'category'       => '[a-z-]*'" | sed "s/.*=> //" | sort | uniq -c | sort -rn; done

# PII: contagem de LINHAS com match (git grep -c), não de ocorrências
git -C $CT grep -c -E "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}" 53d7d9a -- 'database/seeders/*.php'
git -C $CT grep -c -E "\([0-9][0-9]\) ?[0-9]{4,5}-[0-9]{4}"            53d7d9a -- 'database/seeders/*.php' 'database/factories/*.php'
git -C $CT grep -c -E "https?://[a-z0-9.-]+"                            53d7d9a -- 'database/seeders/*.php'
git -C $CT grep -c -E "Rua [A-Z0-9]"                                    53d7d9a -- 'database/seeders/*.php'

# referências externas a cada seeder (PermissionRoleSeeder=15, DesapegoStaffSeeder=1, ...)
for s in <19 nomes>; do git -C $CT grep -l "$s" 53d7d9a -- app tests config | wc -l; done
git -C $CT grep -n "DesapegoStaffSeeder" 53d7d9a -- app tests config docs

# alvo: boilerplate origin/main (6 migrations / 1 factory / 4 seeders)
git -C $BP ls-tree -r origin/main --name-only -- database/migrations | wc -l
git -C $BP ls-tree -r origin/main --name-only -- database/factories | wc -l
git -C $BP ls-tree -r origin/main --name-only -- database/seeders   | wc -l

# drift das 6 migrations compartilhadas = 0 linhas em todas as 6;
# DatabaseSeeder=20, PermissionRoleSeeder=48, UserSeeder=18, UserFactory=9 linhas
diff <(git -C $CT show 53d7d9a:database/migrations/<f>) <(git -C $BP show origin/main:database/migrations/<f>) | grep -c '^[<>]'
```

Não medido (fora do alcance dos comandos permitidos): tamanho real das tabelas em disco, plano de execução das queries, e se algum índice implícito de FK existe de fato no MySQL da instância.

---

### Frente 6 — Frontend: `resources/js`, CSS, views, Vite, `package.json` (ctvitrine @ `53d7d9a`)

Fonte lida exclusivamente via `git show 53d7d9a:<path>` / `git ls-tree -r 53d7d9a` / `git grep 53d7d9a`. Comparação sempre contra `origin/main` do boilerplate.

---

#### 6.1 Mapa quantitativo de `resources/js` (199 arquivos)

| Diretório | Arquivos |
|---|---|
| `resources/js/components/` | 96 (26 em `ui/`, 70 de domínio) |
| `resources/js/pages/` | 33 |
| `resources/js/hooks/` | 17 |
| `resources/js/test/` | 16 |
| `resources/js/lib/` | 11 |
| `resources/js/layouts/` | 10 |
| `resources/js/types/` | 9 |
| `resources/js/utils/` | 5 |
| raiz (`app.tsx`, `ssr.tsx`) | 2 |
| **total** | **199** |

Subdivisão de `components/`: raiz 31 · `ui/` 26 · `site/` 13 · `users/` 5 · `settings/` 5 · `permissions/` 4 · `items/` 4 · `data-table/` 4 · `site-settings/` 2 · `layout/` 1 · `dialogs/` 1.

Os 10 maiores arquivos (linhas): `pages/site/landing.tsx` 1483 · `pages/items/studio.tsx` 1342 · `pages/metrics/index.tsx` 770 · `components/ui/sidebar.tsx` 724 · `components/items/item-form.tsx` 675 · `pages/site-settings/edit.tsx` 605 · `pages/site/signup.tsx` 567 · `pages/categories/index.tsx` 471 · `pages/site/boutique/home.tsx` 457 · `components/site-settings/banners-section.tsx` 453.

---

#### 6.2 `resources/js/pages/` (33)

| Caminho | O que é |
|---|---|
| `resources/js/pages/auth/confirm-password.tsx` | Confirmação de senha; `useForm<{password}>` + `AuthLayout`. |
| `resources/js/pages/auth/forgot-password.tsx` | Solicitar link de reset; prop `status`. |
| `resources/js/pages/auth/login.tsx` | Login; props `status`, `canResetPassword`. |
| `resources/js/pages/auth/reset-password.tsx` | Reset com `token`/`email` na prop. |
| `resources/js/pages/auth/verify-email.tsx` | Reenvio de verificação (`useForm({})`). |
| `resources/js/pages/categories/index.tsx` | CRUD de categorias com reordenação (`router.patch('categories.reorder')`), foto por categoria comprimida no browser antes do POST (evita estourar `post_max_size`). |
| `resources/js/pages/dashboard.tsx` | Dashboard placeholder do admin. |
| `resources/js/pages/docs/show.tsx` | Visualizador de documentação em Markdown renderizado no servidor; árvore de navegação + HTML injetado, com tabelas/código rolando na horizontal. |
| `resources/js/pages/items/create.tsx` | Novo item; props `categories`, `conditions`, `statuses`. |
| `resources/js/pages/items/edit.tsx` | Edição de item (mesmas props + `item`). |
| `resources/js/pages/items/index.tsx` | Listagem de itens com filtros, troca de status inline (`router.patch`), destaque (estrela) e paginação por `router.get`. |
| `resources/js/pages/items/studio.tsx` | Fluxo "Estúdio IA" (cadastro IA-first): envio em levas pequenas, **polling manual com backoff crescente**, teto de falhas consecutivas, prazo-limite de `processing` e relógio próprio da tela. Não usa polling do Inertia. |
| `resources/js/pages/legal/accept.tsx` | Aceite do Termo de Adesão; modo leitura quando já aceito; blockquote do markdown vira destaque visual (CDC art. 54 §4º). |
| `resources/js/pages/metrics/index.tsx` | Painel de métricas (funil, top itens, categorias, origens, insights) com card `locked` quando `features.metrics.insights_tier === 'basic'`; formatação `Intl.NumberFormat('pt-BR')`. |
| `resources/js/pages/metrics/report.tsx` | Relatório mensal + texto pronto para WhatsApp; troca de mês por `router.get` com `preserveState`. |
| `resources/js/pages/permission-role/roles.tsx` | Tela de roles/permissões (sidebar de roles + cards de permissão). |
| `resources/js/pages/settings/appearance.tsx` | Seletor de tema (`useAppearance`). |
| `resources/js/pages/settings/password.tsx` | Troca de senha com foco em erro. |
| `resources/js/pages/settings/profile.tsx` | Perfil; `mustVerifyEmail`, `status`. |
| `resources/js/pages/site-settings/edit.tsx` | Tela white-label da vitrine: autosave campo a campo (`useSettingsAutosave`), upload de logo/marca, cor primária com validação hex no cliente, e troca de layout (só super usuário) por rota separada. |
| `resources/js/pages/site/boutique/home.tsx` | Home do layout Boutique: carrossel de banners, faixa de categorias, grid com renderização incremental por lote, busca com normalização de acento/caixa, sheet de escolha de vendedora. Injeta `--brand` via `style`. |
| `resources/js/pages/site/boutique/item.tsx` | Produto no Boutique; `related` reaproveita o shape reduzido do Clássico; injeta `--brand`. |
| `resources/js/pages/site/home.tsx` | Home do layout Clássico; tracking `home_view`; modal de produto com trava de scroll e Esc. |
| `resources/js/pages/site/item.tsx` | Produto no Clássico; pré-seleção de cor; tracking `item_view`. |
| `resources/js/pages/site/landing.tsx` | Landing de marketing (1483 linhas, self-contained). Paleta da plataforma **hardcoded no arquivo** (`NAVY`, `PETROLEO`, `CREAM`, `BRAND` do mockup). Exporta `CtaButton` e `PlanComparison` para teste. |
| `resources/js/pages/site/legal.tsx` | Documento legal público servido na landing, tema claro fixo. |
| `resources/js/pages/site/signup-order.tsx` | Status do pedido de adesão por ULID público (pendente / pago / expirado). |
| `resources/js/pages/site/signup.tsx` | Checkout self-service `/assinar`; preços em centavos vindos por prop; paleta da plataforma hardcoded. |
| `resources/js/pages/users/create.tsx` | Criação de usuário (`roles` por prop). |
| `resources/js/pages/users/edit.tsx` | Edição de usuário. |
| `resources/js/pages/users/index.tsx` | Listagem de usuários com filtros/modais/permissões pré-calculadas. |
| `resources/js/pages/users/permissions.tsx` | Permissões diretas do usuário (toggle + permissões do role em readonly). |
| `resources/js/pages/users/show.tsx` | Detalhe do usuário com máscaras aplicadas na exibição. |

---

#### 6.3 `resources/js/components/ui/` (26) — comparação de LISTA com o boilerplate

Fonte 26 · boilerplate 30 · em comum 25.

| Situação | Arquivos |
|---|---|
| **Só na fonte** (1) | `resources/js/components/ui/navigation-menu.tsx` |
| **Só no boilerplate** (5) | `resources/js/components/ui/confirm-dialog.tsx`, `currency-input.tsx`, `date-input.tsx`, `form-field.tsx`, `masked-input.tsx` |
| **Nos dois** (25) | `alert.tsx`, `avatar.tsx`, `badge.tsx`, `breadcrumb.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `collapsible.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `icon.tsx`, `input.tsx`, `label.tsx`, `placeholder-pattern.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `sidebar.tsx`, `skeleton.tsx`, `table.tsx`, `textarea.tsx`, `toast-provider.tsx`, `toggle-group.tsx`, `toggle.tsx`, `tooltip.tsx` |

Consequência direta: os primitivos de formulário que o boilerplate já tem (`form-field`, `masked-input`, `currency-input`, `date-input`) **não existem** na fonte — as máscaras vivem em `resources/js/lib/masks.ts` + `resources/js/utils/format/masks.ts` (duplicados, ver 6.6) e o diálogo destrutivo vive em `resources/js/components/delete-confirmation-dialog.tsx` (264 linhas, API própria com `details`/`warnings`/`AffectedItemsList`) em vez de `ui/confirm-dialog.tsx`.

`resources/js/components/ui/toast-provider.tsx`: `<Toaster>` do `react-hot-toast`, `position="top-right"`, `containerClassName="toast-container"`, `gutter={12}`, `toastOptions={toastDefaultOptions}`.

---

#### 6.4 `resources/js/components/` de domínio (70)

**Casca do app (raiz, 31)**

| Caminho | O que é |
|---|---|
| `resources/js/components/app-content.tsx` | Wrapper do conteúdo, variantes `header`/`sidebar`. |
| `resources/js/components/app-header.tsx` | Topbar (variante header); `<Link href="/dashboard" prefetch>`. |
| `resources/js/components/app-logo-icon.tsx` | Marca da instância vinda de `branding` (fallback: ícone padrão). |
| `resources/js/components/app-logo.tsx` | Logo + nome vindos de `branding`. |
| `resources/js/components/app-shell.tsx` | Shell do layout. |
| `resources/js/components/app-sidebar-header.tsx` | Cabeçalho com breadcrumbs no layout sidebar. |
| `resources/js/components/app-sidebar.tsx` | Sidebar; nav base declarativa com `permission` por item (Itens, Categorias, Configurações do Site, Usuários, Permissões, Métricas, Guia/Docs). |
| `resources/js/components/appearance-dropdown.tsx` | Troca de tema em dropdown. |
| `resources/js/components/appearance-tabs.tsx` | Troca de tema em tabs. |
| `resources/js/components/assign-role-user.tsx` | Atribuir role a um usuário (`useForm` + checagem de permissão). |
| `resources/js/components/billing-banner.tsx` | Banner de cobrança na área logada (`past_due` amarelo / `suspended` vermelho); nada renderiza com `billing === null`. |
| `resources/js/components/breadcrumbs.tsx` | Trilha de navegação. |
| `resources/js/components/delete-confirmation-dialog.tsx` | Diálogo destrutivo genérico: `details`, `warnings` com severidade, lista de itens afetados, ícone e labels customizáveis. |
| `resources/js/components/delete-user.tsx` | Exclusão da própria conta com confirmação por senha. |
| `resources/js/components/empty-state.tsx` | Estado vazio com ícone/tipo. |
| `resources/js/components/heading.tsx` / `heading-small.tsx` | Títulos de seção. |
| `resources/js/components/icon.tsx` | Wrapper de ícone lucide. |
| `resources/js/components/impersonate-banner.tsx` | Faixa de impersonação; mostra o nome do impersonado e `router.delete('users.impersonate.stop')`. |
| `resources/js/components/input-error.tsx` | Mensagem de erro de campo. |
| `resources/js/components/nav-footer.tsx` | Itens de rodapé da sidebar. |
| `resources/js/components/nav-main.tsx` | Nav principal com filtro por `permission`/`role` e detecção de rota ativa por prefixo de pathname; `<Link prefetch>`. |
| `resources/js/components/nav-user.tsx` | Bloco do usuário na sidebar. |
| `resources/js/components/page-info.tsx` | `InfoSection` + `InfoFeatureList` (blocos de ajuda). |
| `resources/js/components/text-link.tsx` | `Link` estilizado. |
| `resources/js/components/user-details-dialog.tsx` | Detalhe do usuário em modal + atalho para permissões. |
| `resources/js/components/user-form.tsx` | Form de usuário; aplica máscaras nos dados iniciais vindos do backend. |
| `resources/js/components/user-info.tsx` | Avatar + nome (+ e-mail opcional). |
| `resources/js/components/user-menu-content.tsx` | Menu do usuário; link do Termo só com `features.legal.enabled`; `<Link ... as="button" prefetch>`. |
| `resources/js/components/whatsapp-icon.tsx` | SVG próprio do glifo WhatsApp (lucide não tem ícones de marca); herda cor por `currentColor`. |

**`data-table/` (4)** — genéricos, documentados como "reutilizável em qualquer módulo":
`resources/js/components/data-table/filter-toggle.tsx` (botão mostrar/ocultar filtros com contador), `pagination.tsx`, `search-bar.tsx`, `table-header.tsx` (colunas + sort).

**`dialogs/` (1)** — `resources/js/components/dialogs/module-info-dialog.tsx`: diálogo genérico de "sobre este módulo", base dos 6 diálogos específicos abaixo.

**`layout/` (1)** — `resources/js/components/layout/page-header.tsx`: cabeçalho de página com título, subtítulo, ícone, ajuda e `actions[]`.

**`items/` (4)**

| Caminho | O que é |
|---|---|
| `resources/js/components/items/color-chips-input.tsx` | Entrada de cores por chip (Enter/vírgula cria, Backspace apaga, colar "A, B, C" adiciona todos num **único** `onChange` para não ler `value` obsoleto). |
| `resources/js/components/items/item-form.tsx` | Form de item (675 linhas): upload de fotos com compressão, bloco de IA condicionado a `features.ai_intake`, `router.reload({ only: ['item'] })` para atualizar fotos. |
| `resources/js/components/items/photo-ai-controls.tsx` | Controles de fundo-estúdio sobre uma foto salva; chamadas por `fetch` JSON (não pelo router), alvo de toque 44px, barra sempre visível em `@media(hover:none)`. |
| `resources/js/components/items/studio-photo.tsx` | Foto no Estúdio com estado "travado há tempo demais" e botão de retentar. |

**`permissions/` (4)** — `permission-card.tsx` (permissão + checkbox), `role-info-dialog.tsx`, `role-users-table.tsx` (usuários de um role, com revogar), `roles-sidebar.tsx`.

**`settings/` (5)** — `appearance-info-dialog.tsx`, `delete-account-info-dialog.tsx`, `password-info-dialog.tsx`, `profile-info-dialog.tsx`, `settings-sidebar.tsx` (nav lateral de settings, `<Link prefetch>`).

**`users/` (5)** — `filter-panel.tsx`, `user-actions-menu.tsx` (dropdown de ações por permissão), `user-info-dialog.tsx`, `user-show-info-dialog.tsx`, `user-table-row.tsx` (`React.memo`).

**`site-settings/` (2)**

| Caminho | O que é |
|---|---|
| `resources/js/components/site-settings/banners-section.tsx` | Banners do Boutique; exporta `parseLink`/`buildLink` — o lojista escolhe o destino em linguagem de loja e o front traduz para `cta_url` (e de volta, ao editar). |
| `resources/js/components/site-settings/sellers-section.tsx` | Vendedoras + modo de atendimento; rótulos de microcópia ficam no componente, não no enum. |

**`site/` (13)** — chrome público dos dois layouts

| Caminho | O que é |
|---|---|
| `resources/js/components/site/boutique/banner-carousel.tsx` | Carrossel; distingue path relativo (navega na SPA) de externo (`//host` conta como externo). |
| `resources/js/components/site/boutique/category-strip.tsx` | Faixa de categorias com snap e anel de foco em `var(--brand)`. |
| `resources/js/components/site/boutique/footer.tsx` | Rodapé do Boutique. |
| `resources/js/components/site/boutique/header.tsx` | Header do Boutique (com `backLink` na página de produto); alt da logo cai no nome da marca quando `hero_title` é nulo. |
| `resources/js/components/site/boutique/item-card.tsx` | Card de produto (favorito, CTA WhatsApp, modo `compact` sem coração/CTA). |
| `resources/js/components/site/boutique/menu-drawer.tsx` | Drawer com trava de scroll e Esc; linha da vendedora salva. |
| `resources/js/components/site/boutique/search-bar.tsx` | Busca; esconde o cancel button nativo do webkit. |
| `resources/js/components/site/boutique/seller-sheet.tsx` | Sheet "Quem vai te atender?", com opção de limpar. |
| `resources/js/components/site/boutique/trust-bar.tsx` | Faixa de garantias em `bg-[var(--brand)]`. |
| `resources/js/components/site/color-selector.tsx` | Chips de cor do produto (vale nos dois layouts). |
| `resources/js/components/site/site-footer.tsx` | Rodapé do Clássico. |
| `resources/js/components/site/site-topbar.tsx` | Topbar do Clássico. |
| `resources/js/components/site/suspended-notice.tsx` | Faixa de vitrine suspensa — extraída do topbar justamente porque o Boutique subiu sem ela; nada renderiza fora do estado `suspended`. |

---

#### 6.5 `resources/js/layouts/` (10) e `resources/js/hooks/` (17)

| Caminho | O que é |
|---|---|
| `resources/js/layouts/app-layout.tsx` | Alias que aponta direto para `app/app-sidebar-layout` (o header-layout existe mas não é o default). |
| `resources/js/layouts/app/app-header-layout.tsx` | Variante com topbar. |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Variante com sidebar (a usada). |
| `resources/js/layouts/auth-layout.tsx` | Wrapper de auth (delega ao simple). |
| `resources/js/layouts/auth/auth-card-layout.tsx` | Auth em card. |
| `resources/js/layouts/auth/auth-simple-layout.tsx` | Auth simples; só troca logo por tema quando há variante escura configurada. |
| `resources/js/layouts/auth/auth-split-layout.tsx` | Auth em duas colunas (usa `quote`). |
| `resources/js/layouts/permissions/PermissionsGuard.tsx` | `PermissionGuard` — UX-only (nome em PascalCase, fora do kebab-case do resto). |
| `resources/js/layouts/permissions/layout.tsx` | Layout do módulo de permissões; só renderiza no cliente durante SSR. |
| `resources/js/layouts/settings/layout.tsx` | Layout de settings com nav lateral e `<Link prefetch>`. |

| Caminho | O que é |
|---|---|
| `resources/js/hooks/use-appearance.tsx` | `Appearance = light\|dark\|system`; grava em `localStorage` **e** cookie `appearance` (SameSite=Lax, 365d); `initializeTheme()` chamado no fim de `app.tsx`. |
| `resources/js/hooks/use-favorites.ts` | Favoritos em storage, guarda de SSR, falha silenciosa em quota cheia/modo privado. |
| `resources/js/hooks/use-flash-messages.tsx` | Consumo de flash → toast. Store global `Map` com timestamp + `setInterval` global em `window.__flashCleanupInterval` (limpeza a cada 5s, TTL 10s) para deduplicar entre navegações. Tipa o flash **localmente** (`usePage<{ flash?: FlashMessages; url?: string }>`), não pelo `SharedData`. |
| `resources/js/hooks/use-initials.tsx` | Iniciais do nome. |
| `resources/js/hooks/use-mobile-navigation.ts` | Remove `pointer-events` residual do `body` após navegação. |
| `resources/js/hooks/use-mobile.tsx` | Breakpoint mobile. |
| `resources/js/hooks/use-permissions.ts` | Lê `auth.permissions`/`auth.roles`, aceita array de string **ou** de objeto, com fallback para `auth.user`. |
| `resources/js/hooks/use-seller.ts` | Vendedora escolhida/auto persistida no dispositivo. |
| `resources/js/hooks/use-settings-autosave.ts` | Autosave de um campo por vez em POST parcial + `only: ['settings']` para descartar o flash de sucesso (evitar toast fantasma) mantendo os erros de validação. Suporta multipart e callback `onSaved`. |
| `resources/js/hooks/useUserSearch.ts` | Busca de usuários com debounce (**camelCase — fora da convenção kebab-case; o boilerplate tem `use-user-search.ts`**). |
| `resources/js/hooks/permissions/use-permission-actions.ts` | Ações do módulo de permissões. |
| `resources/js/hooks/permissions/use-permission-permissions.ts` | Checagens de permissão do próprio módulo. |
| `resources/js/hooks/settings/use-settings-actions.ts` | Ações de perfil/senha. |
| `resources/js/hooks/users/use-user-actions.ts` | Deletar/ativar/impersonar/revogar role/navegar. |
| `resources/js/hooks/users/use-user-filters.ts` | Filtros + debounce + query params. |
| `resources/js/hooks/users/use-user-modals.ts` | `useReducer` de modais (OPEN/CLOSE/SET_PROCESSING). |
| `resources/js/hooks/users/use-user-permissions.ts` | Regras de segurança de UX (não deletar super_user, não deletar a si mesmo). |

---

#### 6.6 `resources/js/lib/` (11) e `resources/js/utils/` (5)

| Caminho | O que é |
|---|---|
| `resources/js/lib/ai-fetch.ts` | Camada de rede das telas de IA. Existe porque `response.json()` estoura quando o servidor devolve HTML (504 nginx, 419 sessão expirada, redirect de login); normaliza tudo num `FetchResult` com `status` (0 = nem completou), timeout com abort e mensagem em pt-BR. |
| `resources/js/lib/clipboard.ts` | Copia com fallback para `prompt()` quando a Clipboard API não existe (http sem TLS); retorna `false` para o chamador não dizer "copiado!". |
| `resources/js/lib/format.ts` | `formatBRL`, `onlyDigits`, `whatsappLink` (assume DDI 55 quando ausente). |
| `resources/js/lib/images.ts` | Compressão no navegador (máx. 1600px, reencode JPEG) usada em fotos de item, banner e categoria. |
| `resources/js/lib/landing-origin.ts` | Sufixo de atribuição de origem nos CTAs de WhatsApp da landing; lista fechada de parâmetros, whitelist `[a-zA-Z0-9_-]`, teto de 40 chars por parâmetro; sem UTM a mensagem fica byte a byte a do config. |
| `resources/js/lib/masks.ts` | `maskPhoneBR`, `maskCPF`, `maskCNPJ`, `maskCpfCnpj` (sem dependências). |
| `resources/js/lib/meta-tracking.ts` | `trackMetaEvent('Lead'\|'InitiateCheckout')`; no-op sem `window.fbq`; `eventId` para dedupe com a Conversions API; nunca lança. |
| `resources/js/lib/metrics.ts` | `useTracker()` para a vitrine pública: `home_view`/`item_view`/`whatsapp_click`/`link_copy`, dedupe por visita de página, `sendBeacon` com fallback `keepalive`; no-op fora de `metrics_mode === 'live'`. |
| `resources/js/lib/site.ts` | `statusStyles`, `pixKeyTypeLabels`, `itemUrl` (com UTM opcional), `interestMessage`. |
| `resources/js/lib/toast-config.ts` | `toastDefaultOptions` + `toastSuccess/Error/Warning/InfoOptions`; todos os estilos referenciam tokens CSS (`var(--card)`, `var(--success)`, `var(--warning)`, `var(--info)`, `var(--destructive)`) e `className` `toast-custom`/`toast-success`/… casada com o CSS. |
| `resources/js/lib/utils.ts` | `cn()` (clsx + tailwind-merge). |
| `resources/js/utils/data-table/query-params.ts` | `isValidFilterValue`, `sanitizeQueryParams`, builder de query params. |
| `resources/js/utils/format/masks.ts` | `removeNonNumeric`, `applyCpfMask`, `applyCnpjMask`… — **duplicata funcional de `lib/masks.ts`**, os dois vivos no repo. |
| `resources/js/utils/users/constants.ts` | `SUPER_USER_ROLE`, `ADMIN_ROLE`, `SEARCH_DEBOUNCE_DELAY = 300`. |
| `resources/js/utils/users/permissions.ts` | `canDeleteUser` e afins (mesmas regras do hook `use-user-permissions`). |
| `resources/js/utils/users/user-helpers.ts` | `getUserInitials`, `isValidUser`, `formatUserDisplayName`. |

---

#### 6.7 Contrato com o backend — `resources/js/types/*` (9)

| Caminho | O que declara |
|---|---|
| `resources/js/types/index.d.ts` | `Auth`, `SharedData`, `User`, `Permission`, `Role`, `NavItem`/`NavGroup`, `BreadcrumbItem`, `MetricsMode`, `AiUsage`, `BillingStatus`, `BillingState`, `PermissionGuardProps`. |
| `resources/js/types/global.d.ts` | `declare global { const route: typeof routeFn }`. |
| `resources/js/types/vite-env.d.ts` | `/// <reference types="vite/client" />`. |
| `resources/js/types/vitrine.ts` | 390 linhas: `Option`, `ItemPhoto`, `AdminItem`, `AdminItemListRow`, `PublicItem`, payloads de métricas (`MetricsPayload`, `MetricsFunnelStage`, `MetricsInsight`, `MetricsTopItem`, `MetricsOrigin`, `MetricsCategorySale`, `MetricsDailyPoint`, `MetricsExtras`), settings do site, banners, sellers. |
| `resources/js/types/data-table.ts` | `SearchBarProps`, `TableColumn`, `TableHeaderProps`, paginação. |
| `resources/js/types/dialogs.ts` | `InfoSection`, `ModuleInfoDialogProps`, `DialogAction`. |
| `resources/js/types/permissions.ts` | `RoleData`, `RolesData`, `PermissionsPageProps`, props dos componentes do módulo. |
| `resources/js/types/settings.ts` | `ProfileFormData`, `PasswordFormData`, props das páginas e do hook de ações. |
| `resources/js/types/users.ts` | `UserFilterParams`, `UserModalState`/`UserModalActions`/`UserModalType`, handlers. |

**Espelhamento contra `app/Http/Middleware/HandleInertiaRequests::share()` do próprio projeto** (o `share()` devolve `name`, `branding`, `quote`, `features`, `billing`, `auth`, `flash`, `ziggy`):

| Chave em `share()` | Em `SharedData` (`resources/js/types/index.d.ts`) |
|---|---|
| `name` | ✔ `name: string` |
| `branding` (`name`, `logo_url`, `logo_dark_url`, `mark_url`, `favicon_url`) | ✔ mesmo shape, `favicon_url: string \| null` |
| `quote` (`message`, `author`) | ✔ |
| `features.metrics_mode` | ✔ `MetricsMode` |
| `features.metrics.insights_tier` | ✔ `'basic' \| 'per_item'` |
| `features.ai_intake` / `ai_usage` | ✔ (`ai_usage: AiUsage \| null` — no PHP é closure lazy, o front vê o valor resolvido) |
| `features.ai_image` / `ai_image_usage` | ✔ |
| `features.ai_studio`, `report`, `user_management`, `signup`, `tracking` | ✔ |
| `features.legal` (`enabled`, `version`) | ✔ |
| `billing` (`status`, `invoice_url`) | ✔ `BillingState \| null` |
| `auth.user` / `permissions` / `roles` / `impersonating` | ✔ — mas `permissions`/`roles` tipados como `string[] \| Permission[]` / `string[] \| Role[]` enquanto o PHP **sempre** manda `string[]` (`pluck('name')`); o union largo é o que obriga `use-permissions.ts` a normalizar em runtime. |
| **`flash`** (`success`, `error`, `warning`, `info`) | ✘ **ausente do `SharedData`** — `git grep "flash" 53d7d9a -- resources/js/types` não retorna nada. O tipo é redeclarado inline em `resources/js/hooks/use-flash-messages.tsx` (`interface FlashMessages`) e num call site (`usePage<SharedData & { flash?: { error?: string \| null } }>`). |
| `ziggy` | ✔ `Config & { location: string }` |

`SharedData` termina com `[key: string]: unknown`, o que faz o `flash` ausente compilar em silêncio.

Uso do tipo: `usePage<SharedData>` aparece em **28** linhas (21 delas como `usePage<SharedData>().props`); há 1 uso com tipo local de flash e 1 com interseção ad-hoc.

---

#### 6.8 Boot: `app.tsx`, `ssr.tsx`, blade

`resources/js/app.tsx`:
- importa `../css/app.css`;
- `resolve` usa **`resolvePageComponent` cru** de `laravel-vite-plugin/inertia-helpers` com `import.meta.glob` inline — **não** há variante deploy-safe. O boilerplate tem `resources/js/lib/resolve-inertia-page.tsx`, que captura `Page not found: <path>`, faz **um** reload guardado por flag em `sessionStorage` e cai num fallback "Atualização necessária" com botão. Nada equivalente na fonte: aba antiga pós-deploy quebra na navegação;
- `setup()` monta `<Theme>` do `@radix-ui/themes` com `fontFamily`/`--default-font-family` Aptos inline, `<ToastProvider />` e `<App />`. Não registra listener de flash (o boilerplate chama `registerFlashListener()` aqui) — na fonte cada tela chama `useFlashMessages()`;
- `progress: { color: '#4B5563' }` (idêntico ao boilerplate);
- `initializeTheme()` no fim do módulo.

`resources/js/ssr.tsx`: `createServer` + `renderToString`; injeta `global.route` a partir de `page.props.ziggy` com três `@ts-expect-error` dentro de um bloco `eslint-disable`. Mesmo `resolvePageComponent` cru.

Tema antes do primeiro paint (`resources/views/app.blade.php`):
- `<html @class(['dark' => ($appearance ?? 'system') == 'dark'])`;
- script inline que aplica `.dark` quando `appearance === 'system'` e `prefers-color-scheme: dark`;
- `<style>` inline pintando `html { background-color: white }` / `html.dark { background-color: var(--palette-primary-dark) }`. **O valor escuro é uma `var()` declarada no `app.css`**, que só chega depois pelo `@vite` — exatamente a janela que o bloco deveria cobrir. O boilerplate usa hex literal (`#0f2a44`) com comentário explicando o porquê, e ainda declara `color-scheme` (em `<meta>` e no CSS, preso à classe `.dark`). A fonte **não** tem `color-scheme` em lugar nenhum do blade;
- `<meta name="theme-color" content="{{ $meta['theme_color'] ?? '#0f2a44' }}">`.

O que a fonte tem no blade e o boilerplate não: favicon por instância (`branding.favicon_url` com fallback para os 5 arquivos padrão `?v=2`), bloco completo de SEO/Open Graph/Twitter (com `og:image:width/height/type/alt`), `<script type="application/ld+json">`, snippet base do Pixel da Meta com `@json($trackingPixelId)` (gate `TrackingMode::enabled()`) + `<noscript>` com `urlencode`, e preload **condicional** de Playfair Display só quando `$page['component']` começa com `site/boutique/`.

Ambos usam a mesma entrada dupla `@vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])` (o chunk da página entra no HTML do servidor).

Progress bar: a padrão do Inertia (`progress.color`). Toaster: `react-hot-toast` via `ui/toast-provider.tsx`, montado uma vez em `app.tsx`.

---

#### 6.9 Uso do Inertia 3

| Recurso | Call sites |
|---|---|
| `Deferred` | **0 ocorrências** em `resources/js`. A lazy-loading fica no PHP (closures em `features.ai_usage`, `ai_image_usage`, `ziggy`). |
| `WhenVisible` | **0 ocorrências**. A "renderização incremental" do grid do Boutique é feita à mão em `resources/js/pages/site/boutique/home.tsx` (lote de renderização + estado local). |
| `usePoll` / polling do Inertia | **0 ocorrências**. `resources/js/pages/items/studio.tsx` implementa polling manual (backoff crescente, teto de falhas consecutivas, prazo do cliente, relógio próprio). |
| `<Form>` (componente) | **0 ocorrências** (o único match de `<Form` é `useState<FormState>` em `studio.tsx`). Tudo é `useForm`/`router`. |
| `prefetch` | 7 call sites: `components/app-header.tsx:97`, `components/app-sidebar.tsx:84`, `components/nav-main.tsx:58`, `components/settings/settings-sidebar.tsx:73`, `components/user-menu-content.tsx:28`, `layouts/settings/layout.tsx:47`, `pages/docs/show.tsx:68`. Sempre o atributo booleano em `<Link>`; nenhum `cacheFor`/`prefetch="mount"`. |
| `useForm` | 15 desestruturações: `components/assign-role-user.tsx:29`, `components/delete-user.tsx:13`, `components/items/item-form.tsx:77`, `components/site-settings/banners-section.tsx:76`, `components/site-settings/sellers-section.tsx:58`, `components/user-form.tsx:32`, `hooks/permissions/use-permission-actions.ts:25`, `pages/auth/confirm-password.tsx:13`, `pages/auth/forgot-password.tsx:15`, `pages/auth/login.tsx:26`, `pages/auth/reset-password.tsx:24`, `pages/auth/verify-email.tsx:12`, `pages/categories/index.tsx:135`, `pages/legal/accept.tsx:54`, `pages/site/signup.tsx:113`. |
| `router.reload` | 2: `components/items/item-form.tsx:197` (`{ only: ['item'], onFinish: schedule }`) e `components/items/photo-ai-controls.tsx:51` (`{ only: ['item'] }`). |
| `only:` em requisição | 4 ocorrências no total (as 2 acima + `hooks/use-settings-autosave.ts:43` num `router.post`, + 1 na doc do próprio hook, linha 23). |
| `preserveState` / `preserveScroll` | 55 ocorrências. |
| `<Head>` | 35 arquivos. |
| `router.get/post/put/patch/delete/visit` | ~48 call sites (listagem completa disponível pelo grep de 6.11); concentrados em `hooks/users/*`, `hooks/permissions/*`, `pages/items/*`, `pages/categories/index.tsx`, `pages/users/*`, `pages/metrics/*`. |

Ponto notável: `resources/js/components/items/photo-ai-controls.tsx` e `resources/js/lib/ai-fetch.ts` deliberadamente **saem** do router do Inertia e usam `fetch` JSON, com toda a normalização de resposta não-JSON feita à mão.

---

#### 6.10 CSS — `resources/css/*`

Dois arquivos: `resources/css/app.css` (721 linhas) e `resources/css/_fonts.css` (218 linhas, **34** blocos `@font-face`). O boilerplate tem os mesmos dois nomes; seu `app.css` tem 681 linhas.

**Cadeia de imports** (`resources/css/app.css`, topo): `@import './_fonts.css'` → `@import 'tailwindcss'` → `@import '@radix-ui/themes/styles.css'` → `@plugin 'tailwindcss-animate'` → `@source "../views"` + `@source` da paginação do framework → `@custom-variant dark (&:is(.dark *))`.

**`@theme`** — 40 linhas de token (boilerplate: 39). Contém:
- fontes: `--font-sans` (Aptos), `--font-title` (Montserrat), `--font-subtitle` (Merriweather Sans), `--font-boutique` (Playfair Display) — este último exclusivo da fonte;
- raios `--radius-sm/md/lg/xl` derivados de `--radius`;
- mapeamento `--color-*` → `var(--*)` para background, foreground, card, popover, primary, secondary, muted, accent, destructive, border, input, ring, `chart-1..5` e os 8 tokens de `sidebar`.

**Fora do `@theme`**, em `:root` e `.dark`, existem `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground` — **não** mapeados para `--color-*`, portanto sem utilitário Tailwind correspondente; são consumidos só como `var()` no CSS de toast e em `resources/js/lib/toast-config.ts`.

**Variáveis de marca** declaradas em `:root` de `resources/css/app.css`:

| Token | Valor | Usado? |
|---|---|---|
| `--palette-primary-dark` | `#0f2a44` | sim (background/foreground/primary/sidebar, dark mode) |
| `--palette-primary` | `#1f3c57` | **não** — `git grep "var(--palette-primary)"` não retorna nada |
| `--palette-primary-darker` | `#2c485e` | sim (muted-foreground, border/input no dark) |
| `--palette-accent-light` | `#8ac7e5` | sim (secondary/accent/ring; vira `--primary` no dark) |
| `--palette-accent` | `#379bcb` | **não** — `git grep "var(--palette-accent)"` não retorna nada |
| `--palette-muted-light` | `#e6e7e8` | sim (muted/border/input) |

O boilerplate nomeia os mesmos hex como `--brand-navy-dark`, `--brand-navy-soft`, `--brand-cyan-light`, `--brand-cyan`, `--brand-cyan-dark` (`#2a7ba2`), `--brand-gray` — **nomenclatura divergente para a mesma paleta**.

O dark mode traz uma decisão documentada no comentário: `--primary` flipa para o accent claro porque o upstream usava `#379bcb` com texto branco (~3,1:1, abaixo de AA) e o par accent-claro/texto-escuro dá ~7,9:1.

**Onde os hex da marca são declarados — varredura completa** (`git grep -ciE "#(0f2a44|379bcb|8ac7e5|1f3c57|2c485e|e6e7e8|f6f3ee)" 53d7d9a -- resources config app database routes`):

| Caminho | Ocorrências | Natureza |
|---|---|---|
| `resources/css/app.css` | 9 | fonte canônica (`--palette-*` + charts `#4b9cd3`, `#13b5ea`, `#a5d8f3`, `#d6ebf7`) |
| `resources/js/pages/site/landing.tsx` | 51 | **hardcoded** — consts `NAVY='#0f2a44'`, `PETROLEO='#379bcb'`, `CREAM='#f6f3ee'`, `BRAND='#b26e79'` (loja fictícia do mockup) + literais em classes |
| `resources/js/pages/site/signup.tsx` | 17 | **hardcoded** — `NAVY`, `#379bcb`, `#2f89b5`, `bg-[#f6f3ee]` |
| `resources/js/pages/site/legal.tsx` | 9 | hardcoded |
| `resources/js/pages/site/signup-order.tsx` | 9 | hardcoded |
| `resources/views/app.blade.php` | 1 | `theme_color` default `#0f2a44` |
| `app/Http/Controllers/Site/LandingController.php` | 1 | `'theme_color' => '#0f2a44'` |
| `app/Http/Controllers/Site/TermsController.php` | 1 | idem |
| `app/Http/Controllers/Site/PrivacyController.php` | 1 | idem |
| `app/Http/Controllers/Signup/ShowSignupController.php` | 1 | idem |
| `app/Models/SiteSetting.php` | 1 | default da cor da instância |
| `public/ctvitrine-icon.svg`, `ctvitrine-logo.svg`, `ctvitrine-logo-light.svg`, `ctvitrine-logo-dark.svg`, `ctvitrine-logo-inverse.svg` | — | `#0F2A44` / `#F2EEE8` dentro dos SVGs |
| `marketing/instrucoes-chatgpt-instagram.md`, `COWORK.md` | — | documentação da paleta |

Não existe `tailwind.config.js` no repo (o `components.json` aponta para `"config": "tailwind.config.js"`, arquivo que **não** está no tree — resíduo do shadcn v3). Não existe `manifest.json`/`site.webmanifest` (o único `mix-manifest.json` é do log-viewer vendorizado).

A cor **do cliente** é a `--brand`, injetada em runtime via `style={{ '--brand': settings.primary_color }}` em 4 páginas: `pages/site/home.tsx:97`, `pages/site/item.tsx:50`, `pages/site/boutique/home.tsx:230`, `pages/site/boutique/item.tsx:121`. Os componentes públicos a consomem como `var(--brand)` e `color-mix(in oklab, var(--brand), white NN%)`. Dois componentes de admin usam `var(--brand,#2a7ba2)` com fallback hardcoded (`components/items/photo-ai-controls.tsx:23`, `components/items/studio-photo.tsx:23`) — mas `--brand` não é definido no admin, então o fallback é o que sempre vale.

**Peso do CSS de tipografia:** 25 declarações `font-family` e **52** `!important` em `app.css` (boilerplate: 46). O arquivo carrega uma escada de seletores de máxima especificidade (`html body [data-radix-theme] .rt-TableHeader .rt-TableColumnHeaderCell`, etc.) para forçar Montserrat em títulos/table headers, Merriweather Sans em subtítulos/descrições e Aptos no resto, sobrescrevendo o `@radix-ui/themes`. Um comentário no bloco Boutique admite o efeito colateral: as regras com `!important` vencem os utilitários do Tailwind, então `[data-vitrine='boutique'] .font-boutique` precisa reafirmar a serifa.

**Blocos de toast** (`.toast-container`, `.toast-custom`, `.toast-success/error/warning/info`, variantes `.dark`, seletores `[data-state='entering'|'exiting']`) e **2** `@keyframes` (`slideInRight`, `slideOutRight`). Outros blocos: `.custom-scrollbar` (+ variantes dark e para `[data-slot='dialog-content']`), `.rt-TableRoot` retematizado com variáveis próprias, e `@supports (-webkit-touch-callout: none) { .ios-input-16 … font-size: 16px }` contra o auto-zoom do Safari iOS.

---

#### 6.11 `vite.config.ts`

Fonte (`vite.config.ts`, 53 linhas úteis):
- `defineConfig(({ mode }) => …)` com `loadEnv(mode, process.cwd(), '')`;
- **plugins**: `laravel({ input: ['resources/css/app.css','resources/js/app.tsx'], ssr: 'resources/js/ssr.tsx', refresh: true, detectTls })`, `react()`, `tailwindcss()`;
- `detectTls` derivado de `new URL(env.APP_URL).host` **sem try/catch** — `APP_URL` sem scheme derruba o config. Comentário longo explica por que `detectTls: true` não serve (deriva o host do nome da pasta, e a convenção local usa o slug do caminho completo);
- `esbuild: { jsx: 'automatic' }`;
- **aliases**: `@` → `resources/js`, `ziggy-js` → `vendor/tightenco/ziggy`;
- `test`: `globals`, `environment: 'jsdom'`, `setupFiles: ['./resources/js/test/setup.ts']`, `css: true`;
- **não tem**: `build.rollupOptions.manualChunks`, `build.reportCompressedSize`, `test.include`, `server`/HMR configurável, guarda de `process.env.VITEST` ou `process.env.CI`.

Diferenças materiais contra `origin/main` do boilerplate: o boilerplate exporta `resolveDetectTlsHost`/`resolveDevServerConfig` testáveis com `tryParseUrl` tolerante, desliga o plugin Laravel sob Vitest, desliga `detectTls` no CI, restringe `test.include: ['resources/js/**/*.{test,spec}.{ts,tsx}']` (senão o Vitest varre `vendor/`) e usa `reportCompressedSize: !process.env.CI`. Nenhum dos dois faz code splitting manual.

`tsconfig.json` (fonte): `strict`, `noImplicitAny`, `isolatedModules`, `moduleResolution: "bundler"`, `jsx: "react-jsx"`, `types: ["vitest/globals"]`, paths `@/*` → `./resources/js/*` e `ziggy-js` → `./vendor/tightenco/ziggy`; `include` só `resources/js/**`.

---

#### 6.12 `resources/views/*` (6), `resources/prompts`, `resources/legal`, `marketing/`

| Caminho | O que é |
|---|---|
| `resources/views/app.blade.php` | Root view do Inertia (detalhada em 6.8): favicon por instância, OG/Twitter/JSON-LD, Pixel da Meta condicional, script de tema pré-paint, preloads de fonte (Playfair só no Boutique), `@routes` + `@vite` com chunk da página. |
| `resources/views/errors/vitrine-suspended.blade.php` | Página HTML pura (79 linhas) servida pelo `EnsureVitrineActive` no 503: `noindex`, `theme-color` da cor do lojista, título e descrição neutros ("em manutenção") — de propósito sem motivo financeiro, para não constranger o lojista em previews antigos no WhatsApp. |
| `resources/views/emails/legal/terms-acceptance-receipt.blade.php` | Comprovante de aceite do Termo (`x-mail::message` + `x-mail::table`), com registro de loja/aceitante e o texto integral anexado. |
| `resources/views/emails/signup/terms-receipt.blade.php` | Mesmo comprovante, na variante emitida no momento da contratação self-service. |
| `resources/views/emails/signup/welcome.blade.php` | Boas-vindas pós-pagamento; `x-mail::panel` com o domínio da loja e a promessa "no ar em até 48h úteis". |
| `resources/views/emails/signup/paid-notification.blade.php` | Aviso interno "pedido pago — provisionar `slug`" com tabela de loja/endereço/plano/ciclo/valor. |

| Caminho | O que é |
|---|---|
| `resources/prompts/ai-intake.md` | Prompt de catalogação por foto (32 linhas): responde só JSON do schema, campo incerto = `null`, proibido inventar tamanho, `category_slug` restrito à lista fornecida. |
| `resources/prompts/ai-image-background.md` | Prompt de fundo-estúdio (10 linhas): troca só o fundo para branco `#ffffff`, preserva integralmente a peça, mantém enquadramento, proíbe texto/logo/marca d'água. |
| `resources/legal/termo-de-adesao.md` | Termo de Adesão v1.7 (337 linhas), com qualificação das partes (razão social, CNPJ `***`, NIRE `***`, endereço `***`) e Anexos de plano; é a fonte que `pages/legal/accept.tsx` e `pages/site/legal.tsx` renderizam. |
| `resources/legal/politica-de-privacidade.md` | Política de Privacidade v1.5 (145 linhas), LGPD, com dados do controlador (CNPJ `***`, endereço `***`). |

| Caminho | O que é |
|---|---|
| `marketing/ctvitrine-playbook.md` | Playbook comercial (158 linhas): posicionamento, o que o cliente compra, objeções. |
| `marketing/guia-vendedores.md` | Guia do vendedor (103 linhas): cliente ideal e limites do que pode ser prometido. |
| `marketing/instrucoes-chatgpt-instagram.md` | Instruções de projeto ChatGPT para Instagram (353 linhas); é onde a paleta da marca está documentada em prosa (navy/petróleo/petróleo-claro/creme). |
| `marketing/prospects.md` | Tabela de prospects mapeados por perfil público de Instagram (41 linhas) — contém nomes/handles/cidades de negócios reais; **não citado aqui por redação**. |
| `marketing/roteiro-video-vendas.md` | Roteiro de vídeo de vendas 60–75s (58 linhas). |

---

#### 6.13 `resources/js/test/` (16) — o que a fonte fixa no front

| Caminho | O que trava |
|---|---|
| `resources/js/test/setup.ts` | Mocks globais: Inertia, `window.matchMedia`, `localStorage`. |
| `resources/js/test/vitest.d.ts` | `/// <reference types="vitest/globals" />`. |
| `resources/js/test/utils.test.ts` | `cn()`: merge, condicionais, `undefined`/`null`, string vazia. |
| `resources/js/test/masks.test.ts` | `maskCpfCnpj`: vira CNPJ a partir do 12º dígito, sem separador solto no fim, idempotente sobre valor já mascarado, descarta lixo colado. |
| `resources/js/test/components/Button.test.tsx` | Smoke do `ui/button` (variantes, tamanhos, disabled, click). |
| `resources/js/test/components/banner-link.test.ts` | `parseLink`/`buildLink` são inversos (senão editar banner abre no modo errado). |
| `resources/js/test/components/boutique-chrome.test.tsx` | Renderiza header/drawer/sheet do Boutique; pega o que o Pest não vê (faixa de suspensa lida via `usePage` dentro do componente, botão "Entrar" que é markup). |
| `resources/js/test/components/color-selection.test.tsx` | Cor na `interestMessage` + chips de cor. |
| `resources/js/test/components/plan-comparison.test.tsx` | Copy da tabela de planos como contrato (âncoras, grupos, `<details>` nasce fechado). |
| `resources/js/test/components/site-settings-sections.test.tsx` | Smoke de render das seções novas do admin, com Inertia mockado. |
| `resources/js/test/hooks/use-permissions.test.ts` | Retorna `false` sem usuário autenticado/undefined. |
| `resources/js/test/hooks/use-settings-autosave.test.ts` | Salva um campo por vez (payload parcial — é o que impede reescrever a logo); `setFieldError`/limpeza. |
| `resources/js/test/layouts/permissions/PermissionsGuard.test.tsx` | Guard por `permission` e por `role`. |
| `resources/js/test/landing-origin.test.tsx` | Sem UTM a mensagem é exatamente a do config; valor de URL nunca chega cru. |
| `resources/js/test/meta-tracking.test.tsx` | Gate duplo (prop `features.tracking` + `window.fbq`). |
| `resources/js/test/signup-initiate-checkout.test.tsx` | `InitiateCheckout` na abertura de `/assinar`, com módulo off = zero evento. |

Para contraste de cobertura: o boilerplate em `origin/main` tem 39 arquivos em `resources/js/test/`, incluindo `styles/focus-ring.test.ts`, `styles/theme-tokens.test.ts`, `vite-config.test.ts`, `lib/resolve-inertia-page.test.tsx`, `lib/flash.test.ts` e `lib/impersonation-call-sites.test.ts` — categorias inteiras (tokens de tema, focus ring, config do Vite, resolver de página) que não existem na fonte.

---

#### 6.14 `package.json` — diff de dependências contra `origin/main`

Os dois arquivos declaram **58** pacotes cada. `scripts` e `lint-staged` são **byte a byte idênticos** (build, build:ssr, dev, prepare, format, format:dirty, format:check, lint, lint:fix, types, ci:lint, test, test:run, test:ui, test:coverage, ci:test, ci:build, ci:check).

| Situação | Pacotes |
|---|---|
| **Só na fonte** | **0** |
| **Só no boilerplate** | **0** |
| **Mesma versão e mesma seção** (14) | `@headlessui/react` ^2.2.10 · `@radix-ui/themes` ^3.3.0 · `@testing-library/react` ^16.3.2 · `chokidar` ^5.0.0 · `class-variance-authority` ^0.7.1 · `clsx` ^2.1.1 · `eslint-config-prettier` ^10.1.8 · `eslint-plugin-react` ^7.37.5 · `eslint-plugin-react-hooks` ^7.1.1 · `husky` ^9.1.7 · `prettier-plugin-organize-imports` ^4.3.0 · `react-hot-toast` ^2.6.0 · `tailwind-merge` ^3.6.0 · `tailwindcss-animate` ^1.0.7 |

**Versão (ou seção) diferente — 44 pacotes:**

| Pacote | Fonte (`53d7d9a`) | Boilerplate (`origin/main`) |
|---|---|---|
| `@inertiajs/react` | dep ^3.4.0 | dep ^3.6.1 |
| `vite` | dep ^7.3.5 | dep ^8.2.1 |
| `laravel-vite-plugin` | dep ^2.1.0 | dep ^3.1.3 |
| `@vitejs/plugin-react` | dep ^5.2.0 | dep ^6.0.5 |
| `vitest` | dev ^3.2.6 | dev ^4.1.10 |
| `@vitest/ui` | dev ^3.2.6 | dev ^4.1.10 |
| `typescript` | **dep** ^5.9.3 | **dev** ^6.0.3 |
| `eslint` | dev ^9.39.4 | dev ^10.8.1 |
| `@eslint/js` | dev ^9.39.4 | dev ^10.0.1 |
| `lucide-react` | dep ^0.475.0 | dep ^1.31.0 |
| `jsdom` | dev ^27.4.0 | dev ^30.0.1 |
| `@types/node` | dev ^22.19.21 | dev ^26.2.0 |
| `lint-staged` | dev ^16.4.0 | dev ^17.3.0 |
| `concurrently` | dep ^9.2.1 | dep ^10.0.4 |
| `globals` | dep ^15.15.0 | dep ^17.9.0 |
| `@testing-library/jest-dom` | dev ^6.9.1 | dev ^7.0.1 |
| `prettier-plugin-tailwindcss` | dev ^0.6.14 | dev ^0.8.1 |
| `@rollup/rollup-linux-x64-gnu` | opt 4.9.5 | opt 4.62.4 |
| `@radix-ui/react-slot` | dep ^1.2.5 | dep ^1.3.3 |
| `@radix-ui/react-avatar` | dep ^1.1.12 | dep ^1.2.6 |
| `@radix-ui/react-navigation-menu` | dep ^1.2.15 | dep ^1.2.22 |
| `@radix-ui/react-dropdown-menu` | dep ^2.1.17 | dep ^2.1.24 |
| `@radix-ui/react-collapsible` | dep ^1.1.13 | dep ^1.1.20 |
| `@radix-ui/react-dialog` | dep ^1.1.16 | dep ^1.1.23 |
| `@radix-ui/react-toggle-group` | dep ^1.1.12 | dep ^1.1.19 |
| `@radix-ui/react-toggle` | dep ^1.1.11 | dep ^1.1.18 |
| `@radix-ui/react-tooltip` | dep ^1.2.9 | dep ^1.2.16 |
| `@radix-ui/react-separator` | dep ^1.1.9 | dep ^1.1.15 |
| `@radix-ui/react-label` | dep ^2.1.9 | dep ^2.1.15 |
| `@radix-ui/react-checkbox` | dep ^1.3.4 | dep ^1.3.11 |
| `@radix-ui/react-select` | dep ^2.3.0 | dep ^2.3.7 |
| `@typescript-eslint/eslint-plugin` | dev ^8.61.0 | dev ^8.66.0 |
| `@typescript-eslint/parser` | dev ^8.61.0 | dev ^8.66.0 |
| `@testing-library/user-event` | dev ^14.6.1 | dev ^14.6.3 |
| `prettier` | dev ^3.8.4 | dev ^3.9.6 |
| `tailwindcss` | dep ^4.3.0 | dep ^4.3.3 |
| `@tailwindcss/vite` | dep ^4.3.0 | dep ^4.3.3 |
| `@tailwindcss/oxide-linux-x64-gnu` | opt ^4.3.0 | opt ^4.3.3 |
| `lightningcss-linux-x64-gnu` | opt ^1.32.0 | opt ^1.33.0 |
| `react` | dep ^19.2.7 | dep ^19.2.8 |
| `react-dom` | dep ^19.2.7 | dep ^19.2.8 |
| `@types/react` | dep ^19.2.17 | dep ^19.2.18 |
| `@types/react-dom` | dep ^19.2.3 | dep ^19.2.4 |
| `ziggy-js` | dep ^2.6.2 | dep ^2.6.3 |

`packageManager`: fonte `pnpm@11.5.3+sha512.…`, boilerplate `pnpm@11.19.0+sha512.…`.

**`pnpm-workspace.yaml`** — os dois arquivos têm o **mesmo conteúdo efetivo**: `allowBuilds: { esbuild: true }` (com o comentário de que o pnpm 11 substituiu `onlyBuiltDependencies`) e `minimumReleaseAge: 10080` (7 dias), com a mesma justificativa de supply-chain e a mesma receita de escape (`pnpm add pacote@x.y.z --config.minimum-release-age=0`). Única diferença é uma frase de comentário: a fonte acrescenta "Este app está em produção:" antes de "a janela de 7 dias cobre o padrão dos ataques". Nenhuma outra política de supply-chain (`overrides`, `peerDependencyRules`, `packageExtensions`, `catalog`) em nenhum dos dois.

`components.json` (fonte): shadcn schema, `style: default`, `baseColor: neutral`, `cssVariables: true`, `iconLibrary: lucide`, aliases `@/components`, `@/lib/utils`, `@/components/ui`, `@/lib`, `@/hooks` — e `tailwind.config: "tailwind.config.js"`, arquivo inexistente no tree.

---

#### Medições

Todas as contagens acima vieram destes comandos (`R=/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `B=/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`):

```bash
# 199 arquivos em resources/js
git -C $R ls-tree -r 53d7d9a --name-only -- resources/js | wc -l          # 199
# 6 views
git -C $R ls-tree -r 53d7d9a --name-only -- resources/views | wc -l       # 6

# distribuição por diretório de resources/js (96/33/17/16/11/10/9/5/2)
git -C $R ls-tree -r 53d7d9a --name-only -- resources/js \
  | sed 's|resources/js/||' \
  | awk -F/ 'NF==1{print "(raiz)"} NF>1{print $1}' | sort | uniq -c | sort -rn

# subdivisão de components (raiz 31, ui 26, site 13, users 5, settings 5,
# permissions 4, items 4, data-table 4, site-settings 2, layout 1, dialogs 1)
git -C $R ls-tree -r 53d7d9a --name-only -- resources/js/components \
  | sed 's|resources/js/components/||' \
  | awk -F/ 'NF==1{print "(components raiz)"} NF>1{print $1"/"}' | sort | uniq -c | sort -rn

# components não-ui = 70
git -C $R ls-tree -r 53d7d9a --name-only -- resources/js/components | grep -vc '/ui/'   # 70

# components/ui: fonte 26, boilerplate 30, comuns 25, só-fonte 1, só-bp 5
git -C $R ls-tree -r 53d7d9a --name-only -- resources/js/components/ui | sed 's|.*/||' | sort > /tmp/f6/ui_src.txt
git -C $B ls-tree -r origin/main --name-only -- resources/js/components/ui | sed 's|.*/||' | sort > /tmp/f6/ui_bp.txt
wc -l < /tmp/f6/ui_src.txt          # 26
wc -l < /tmp/f6/ui_bp.txt           # 30
comm -23 /tmp/f6/ui_src.txt /tmp/f6/ui_bp.txt   # só na fonte (1)
comm -13 /tmp/f6/ui_src.txt /tmp/f6/ui_bp.txt   # só no boilerplate (5)
comm -12 /tmp/f6/ui_src.txt /tmp/f6/ui_bp.txt | wc -l   # 25

# tamanhos de arquivo (top 30 por linhas)
for f in $(git -C $R ls-tree -r 53d7d9a --name-only -- resources/js); do
  echo "$(git -C $R show 53d7d9a:$f | wc -l) $f"; done | sort -rn | head -30

# CSS
git -C $R show 53d7d9a:resources/css/app.css   | wc -l                    # 721
git -C $R show 53d7d9a:resources/css/_fonts.css| wc -l                    # 218
git -C $B show origin/main:resources/css/app.css | wc -l                  # 681
git -C $R show 53d7d9a:resources/css/app.css | sed -n '/^@theme {/,/^}/p' | grep -c '^\s*--'   # 40
git -C $B show origin/main:resources/css/app.css | sed -n '/^@theme {/,/^}/p' | grep -c '^\s*--' # 39
git -C $R show 53d7d9a:resources/css/_fonts.css | grep -c '@font-face'    # 34
git -C $R show 53d7d9a:resources/css/app.css | grep -c '!important'       # 52
git -C $B show origin/main:resources/css/app.css | grep -c '!important'   # 46
git -C $R show 53d7d9a:resources/css/app.css | grep -c '@keyframes'       # 2
git -C $R show 53d7d9a:resources/css/app.css | grep -c 'font-family'      # 25
git -C $R show 53d7d9a:resources/css/app.css | sed -n '/^@theme {/,/^}/p' | grep -nE "success|warning|info"   # vazio
git -C $R grep -n -- "var(--palette-primary)\|var(--palette-accent)" 53d7d9a                                  # vazio

# hex da marca por arquivo (tabela de 6.10)
git -C $R grep -ciE "#(0f2a44|379bcb|8ac7e5|1f3c57|2c485e|e6e7e8|f6f3ee)" 53d7d9a -- resources config app database routes

# Inertia 3
git -C $R grep -nE "Deferred|WhenVisible|usePoll" 53d7d9a -- resources/js | wc -l   # 0
git -C $R grep -n "<Form"          53d7d9a -- resources/js                          # 1 falso-positivo (useState<FormState>)
git -C $R grep -n "prefetch"       53d7d9a -- resources/js | wc -l                  # 7
git -C $R grep -n "= useForm"      53d7d9a -- resources/js | wc -l                  # 15
git -C $R grep -n "router.reload"  53d7d9a -- resources/js | wc -l                  # 2
git -C $R grep -n "only: \["       53d7d9a -- resources/js | wc -l                  # 4
git -C $R grep -nE "preserveState|preserveScroll" 53d7d9a -- resources/js | wc -l   # 55
git -C $R grep -n "usePage<SharedData>" 53d7d9a -- resources/js | wc -l             # 28
git -C $R grep -l "<Head"          53d7d9a -- resources/js | wc -l                  # 35
git -C $R grep -n "flash" 53d7d9a -- resources/js/types                             # vazio (flash ausente do SharedData)

# package.json: 58 vs 58, 0 só-fonte, 0 só-bp, 44 diferentes, 14 idênticos
git -C $R show 53d7d9a:package.json     > /tmp/f6/src.json
git -C $B show origin/main:package.json > /tmp/f6/bp.json
node -e 'const a=require("/tmp/f6/src.json"),b=require("/tmp/f6/bp.json");
 const S=["dependencies","devDependencies","optionalDependencies"];const A={},B={};
 for(const s of S){for(const[k,v]of Object.entries(a[s]||{}))A[k]=[s,v];for(const[k,v]of Object.entries(b[s]||{}))B[k]=[s,v];}
 console.log(Object.keys(A).filter(k=>!B[k]).length, Object.keys(B).filter(k=>!A[k]).length,
 Object.keys(A).filter(k=>B[k]&&(B[k][1]!==A[k][1]||B[k][0]!==A[k][0])).length,
 Object.keys(A).filter(k=>B[k]&&B[k][1]===A[k][1]&&B[k][0]===A[k][0]).length,
 Object.keys(A).length, Object.keys(B).length)'   # 0 0 44 14 58 58

# testes do boilerplate para contraste (39)
git -C $B ls-tree -r origin/main --name-only -- resources/js/test | wc -l   # 39
```

Não medido (declarado como tal): número de linhas divergentes dentro dos 25 primitivos `ui/` comuns — a comparação feita foi de LISTA de arquivos, não de conteúdo.

---

### Frente 7 — suíte de testes do ctvitrine (o que existe e o que ela TRAVA)

Fonte: `ctvitrine` @ `53d7d9a` (lido só por `git show`/`git ls-tree`/`git grep`). Alvo de comparação: `boilerplate` @ `origin/main`.

**Panorama estrutural.** A suíte PHP é 100% `tests/Feature` — **não existe `tests/Unit`, `tests/Arch`, `tests/Contract` nem `tests/Browser`**. `phpunit.xml` declara **uma única testsuite** (`Feature`), então mesmo que alguém criasse `tests/Unit` ele não rodaria. Um único arquivo (`tests/Feature/ImpersonateTest.php`) é classe PHPUnit legada; os outros 105 são Pest funcional.

---

#### 1. Bootstrap: `tests/Pest.php`, `tests/TestCase.php`, `phpunit.xml`

| Caminho | Conteúdo |
|---|---|
| `tests/TestCase.php` | `abstract class Tests\TestCase extends Illuminate\Foundation\Testing\TestCase` com corpo **vazio** (`//`). Zero helper, zero trait, zero persona. |
| `tests/Pest.php` | `pest()->extend(Tests\TestCase::class)->use(RefreshDatabase::class)->in('Feature')`. Sem `->in('Unit')`, sem `->in('Arch')`. |
| `tests/Pest.php` | Restos do esqueleto Pest **nunca removidos**: `expect()->extend('toBeOne', …)` (única expectation customizada do repo, sem nenhum uso) e `function something() { // .. }` vazia. |
| `phpunit.xml` | Testsuite única `Feature`. Envs de teste: `APP_ENV=testing`, `BCRYPT_ROUNDS=4`, `CACHE_STORE=array`, `DB_CONNECTION=sqlite` / `DB_DATABASE=:memory:`, `MAIL_MAILER=array`, `PULSE_ENABLED=false`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=array`, `TELESCOPE_ENABLED=false`. |
| `phpunit.xml` | **Baseline anti-vazamento de `.env` do dev** (4 envs de produto forçadas em `off`, cada uma com comentário explicando o sequestro que evitam): `VITRINE_LANDING_MODE=off` (senão a landing sequestra o `/` e derruba os testes da vitrine), `VITRINE_TERMS_MODE=off` (senão o gate de aceite sequestra o admin), `VITRINE_SIGNUP_MODE=off`, `VITRINE_REPORT_MODE=off` (senão o módulo avulso vaza no entitlement das métricas). |

**Helpers globais de modo/persona/fixture declarados em `tests/Pest.php`** (21 símbolos; nenhum é persona de RBAC genérica — são todos de feature-flag ou de fixture de domínio):

| Símbolo (`tests/Pest.php`) | O que trava/prepara |
|---|---|
| `const ASAAS_TEST_TOKEN` / `ASAAS_TEST_SUBSCRIPTION` | Token de webhook e id de assinatura sintéticos (valores `***`). |
| `enableBillingLive()` | Liga `vitrine.billing.mode=live` + token + subscription + `grace_days` + `cycle`. |
| `asaasPayload(event, overrides, eventId)` | Monta payload de webhook Asaas com defaults coerentes. |
| `billingManager()` | `User::factory()` + `Permissions::MANAGE_ITEMS` (bypass da suspensão de vitrine). |
| `enableAiImageLive()` | `vitrine.ai_image` live + provider `openai` + chave `***` + modelo + `monthly_limit`. |
| `enableAiIntakeLive()` | `vitrine.ai_intake` live + provider + chave `***` + modelo + `monthly_limit`. |
| `enableAiStudioLive(bool $withBackground = true)` | Encadeia `enableAiIntakeLive()`; **desliga explicitamente** `ai_image` quando `$withBackground=false` para ser determinístico mesmo com `.env` de dev em live. |
| `enableReportLive(?string $whatsapp)` | Exige `metrics.mode=live` junto — o relatório sem coleta é off silencioso. |
| `enableTermsLive(string $version = '1.0')` | Liga o módulo legal; bump de versão entre chamadas simula reaceite. |
| `legalUser(Roles $role)` | Usuário ativo com `role_id` resolvido do seeder. |
| `const SIGNUP_TEST_WEBHOOK_TOKEN` / `SIGNUP_TEST_OPS_TOKEN` | Tokens sintéticos (`***`). |
| `const SIGNUP_TEST_CPF` / `SIGNUP_TEST_OTHER_CPF` | Dois CPFs com dígito verificador válido (valores `***`) para o checkout. |
| `enableSignupLive()` | Liga landing + termos + signup (asaas token/env/webhook/notify/ops/ttl/turnstile) — codifica a regra "vender sem contrato, jamais". |
| `const META_TEST_PIXEL_ID` / `META_TEST_CAPI_TOKEN` | Pixel e token de CAPI sintéticos (`***`). |
| `enableTrackingLive(bool $withCapi = true)` | Pixel ligado com/sem token da CAPI — modela o estado real de quem criou o pixel e ainda não gerou token. |
| `makeSignupOrder(array $attributes, SignupOrderStatus $status)` | Fixture de pedido: separa `fillable` (form) de `forceFill` (estado interno: `public_id` ULID, `status`, `slug_lock` derivado de `SignupOrderStatus::holdingSlug()`, `amount`, `setup_fee_amount` por ciclo, `terms_version/hash/accepted_at/ip/user_agent`). |

Além disso há **86 funções-helper locais** definidas dentro dos próprios arquivos de teste (medido). Destaques por classe de uso, com caminho:

- Personas por permissão, uma por arquivo (duplicação): `aiManager()` `tests/Feature/AiIntake/AiDraftEndpointTest.php:12`, `bannerManager()` `tests/Feature/Banner/BannerCrudTest.php:16`, `itemsManager()` `tests/Feature/Category/CategoryImageTest.php:18`, `featuredManager()` `tests/Feature/Items/FeaturedItemTest.php:17`, `colorsManager()` `tests/Feature/Items/ItemColorsTest.php:15`, `itemManager()` `tests/Feature/Items/ItemCrudTest.php:13`, `photoManager()` `tests/Feature/Items/PhotoOptimizationTest.php:19`, `trashManager()` `tests/Feature/Items/TrashHygieneTest.php:21`, `sellerManager()` `tests/Feature/Seller/SellerCrudTest.php:18`, `settingsManager()` `tests/Feature/SiteSettings/UpdateSiteSettingsTest.php:14`, `seatOwner()` `tests/Feature/User/PlanSeatsTest.php:18`, `layoutManager(Roles)` `tests/Feature/Layout/UpdateLayoutTest.php:23`, `planGateUser(Roles)` `tests/Feature/User/UserManagementPlanGateTest.php:15`, `roleId(Roles)` `tests/Feature/HorizonAccessTest.php:42`.
- **Colisão de nome com o boilerplate:** `function userWithRole(Roles $role)` existe em `tests/Feature/Permissions/DesapegoPermissionsTest.php:17` como helper **de arquivo**, enquanto no boilerplate o mesmo nome é helper **global** de `tests/Pest.php`.
- Fakes de infra: `fakePloiLogReady()` / `fakePloiHappy()` `tests/Feature/Ops/ProvisionInstanceTest.php:28,37`, `fakeBillingHappy()` `tests/Feature/Ops/BillingSubscribeTest.php:49`, `fakeSignupCheckout()` `tests/Feature/Signup/SignupStoreTest.php:47`, `geminiFake()` `tests/Feature/AiIntake/AiDraftEndpointTest.php:30`, `fakeAnalyzer()` `tests/Feature/AiStudio/DraftLifecycleTest.php:27`, `bindEditor()`/`bindEditorThatMutates()` `tests/Feature/AiImage/ProcessPhotoBackgroundJobTest.php:23,41`.
- Semeadores de métrica: `seedMetricEvent()` `.../MetricsQueryTest.php:17`, `seedInsightEvent()` `.../MetricsInsightsTest.php:23`, `seedStrategyEvent()` `.../MetricsStrategyTest.php:21`, `seedReportEvent()` `.../MonthlyReportTest.php:18`, `numbersEvent()` `.../MetricsNumbersPlanGateTest.php:21`, `seedTrendingTraffic()` `.../MetricsStrategyTest.php:187`, `seedPriceTraffic()` `.../MetricsStrategyTest.php:101`, `seedCategoryTraffic()` `.../MetricsStrategyTest.php:75`, `seedItemTraffic()` `.../MetricsInsightsTest.php:97`, `seedRichInsightsScenario()` `.../MetricsStrategyTest.php:264`, `seedLegacyInsightsScenario()` `.../MetricsInsightsTest.php:51`, `juneAnchor()` `.../MonthlyReportTest.php:30`.

**Não há** `travelTo`, `freezeTime` nem `testTime` em lugar nenhum da suíte (medido: 0 arquivos cada) — o controle de tempo é feito por datas explícitas nos seeds (`now()->subDays(...)`, `CarbonImmutable` fixo) e por `--minutes` / `--days` / `--hours` nos comandos.

---

#### 2. Testes de arquitetura (`arch()`)

**Nenhum.** `git grep "arch(" 53d7d9a -- tests` devolve **1 linha, e é falso positivo**: `tests/Feature/Metrics/MetricsStrategyTest.php:148`, um `array_search(...)` cujo texto casa o padrão. O ctvitrine **não tem `tests/Arch/`, não usa `arch()->preset()->php()`, `->security()`, `toBeEnums()`, `toBeInvokable()`, `toExtend()`, `toBeFinal()` nem `toUseStrictTypes()`**.

---

#### 3. Inventário completo de `tests/Feature/**` — 106 arquivos, o que cada um trava

Coluna **N** = casos declarados (`test('` / `it('` no início da linha). **DS** = nº de `->with(` (datasets, que expandem N em runtime).

##### `tests/Feature/AiImage/` — 3 arquivos, 20 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/AiImage/AiBackgroundEndpointTest.php` | 6 | 0 | O endpoint de fundo por IA despacha job **uma vez**, preserva o arquivo original, respeita `monthly_limit`, é idempotente com `processing` recente, re-despacha quando o `processing` está preso além da janela, responde 404 com módulo off e 404 para foto de outro item. |
| `tests/Feature/AiImage/AiImageModeTest.php` | 4 | 0 | `AiImageMode::enabled()` exige `mode=live` **E** chave do provider; `off` permanece off mesmo com chave; a prop compartilhada `features.ai_image` e `ai_image_usage` (`used`/`limit`) acompanham. |
| `tests/Feature/AiImage/ProcessPhotoBackgroundJobTest.php` | 10 | 0 | Contrato do job de fundo: grava arquivo otimizado novo, marca `done`, preserva o original, audita custo; `failed` não atropela foto que já saiu de `processing`, não estoura com foto apagada, e o `revert` durante a chamada **não é sobrescrito**; timeout do job > timeout da chamada ao provider e `tries=1`; original sumido do storage vira `failed` em vez de silêncio. |

##### `tests/Feature/AiIntake/` — 3 arquivos, 24 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/AiIntake/AiDraftEndpointTest.php` | 10 | 0 | Rota de análise: 404 com módulo off, 404 em live sem chave, 403 sem `manage_items`, 200 gravando `ai_analyses` com tokens/custo, `size` null e categoria inexistente **preservados como null** (a IA não inventa), `refused`/`failed` → 422 com mensagem pt-BR, limite mensal barra antes de chamar o provider, throttle 10/min → 429. |
| `tests/Feature/AiIntake/AiIntakeModeTest.php` | 7 | 0 | `enabled()` exige live **E** chave; live sem chave cai para off; provider inválido no env cai para `gemini`; props `features.ai_intake` / `ai_usage` acompanham o modo. |
| `tests/Feature/AiIntake/AnalyzerTest.php` | 7 | 0 | Formato do request por provider (Gemini com schema; OpenAI `json_schema` strict com data-URI), custo zero no free tier vs. cálculo por preço, JSON malformado vira `failed` sem exceção, `refused` para foto que não mostra produto, retry só em 5xx (500→200 = ok em 2 tentativas), 4xx **não** re-tenta. |

##### `tests/Feature/AiStudio/` — 7 arquivos, 56 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/AiStudio/AiStudioModeTest.php` | 6 | 0 | Estúdio exige `ai_intake`; `backgroundAvailable` exige Estúdio + `ai_image` + `auto_background`; sem `ai_image` o Estúdio funciona sem fundo automático. |
| `tests/Feature/AiStudio/AiStudioUsageCommandTest.php` | 1 | 0 | `ai-studio:usage` soma análises + fundos do mês, custo e rascunhos abertos. |
| `tests/Feature/AiStudio/DraftLifecycleTest.php` | 23 | 0 | Ciclo de vida do rascunho: nasce oculto, dispara análise (+fundo só se houver `ai_image`); **a IA nunca sobrescreve campo digitado pela lojista**, inclusive numa corrida (digitação durante a análise); autosave parcial não apaga o que a IA preencheu mas consegue limpar campo explicitamente vazio; publicar exige campos obrigatórios (422) e move o item para vitrine+listagem; descartar apaga rascunho e fotos; rascunho descartado durante a análise **não é ressuscitado**; job de análise tem teto de tempo e tentativas; `items:prune-drafts` remove órfãos além do TTL e é no-op com módulo off; item sem categoria/estado não derruba listagem nem form. |
| `tests/Feature/AiStudio/ReanalyzeDraftTest.php` | 8 | 0 | Reanálise: só rascunho (404 caso contrário), 404 com Estúdio off, 403 sem `manage_items`, guarda quem pediu (auditoria com dono), limite estourado avisa em pt-BR sem despachar, análise em voo devolve estado sem gastar chamada, `processing` preso re-despacha. |
| `tests/Feature/AiStudio/StudioAccessTest.php` | 5 | 0 | **Rascunho nunca vaza**: 404 com módulo off, e o rascunho não aparece na vitrine pública, nem no sitemap, nem na listagem admin. |
| `tests/Feature/AiStudio/StudioStateTest.php` | 8 | 0 | Shape do endpoint de estado (polling): rascunhos + fotos + uso do mês; foto sem fundo não finge ter original; sem `ai_image` o uso de fundos vem null; item publicado fica fora; lista vazia para o polling parar sozinho; 404 off; 403 sem permissão. |
| `tests/Feature/AiStudio/UnstickAiStatesCommandTest.php` | 5 | 0 | Comando de destravamento: solta foto e rascunho presos além da janela, não toca em quem começou agora, **funciona com o módulo desligado** (estado preso precisa ser reparável), `--minutes` sobrepõe o config, no-op sem estado preso. |

##### `tests/Feature/Auth/` — 5 arquivos, 16 casos (herdados do starter kit, com um desvio)

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Auth/AuthenticationTest.php` | 4 | 0 | Tela de login renderiza; autentica; recusa senha inválida; logout. |
| `tests/Feature/Auth/EmailVerificationTest.php` | 3 | 0 | Tela de verificação; verificação válida; hash inválido não verifica. |
| `tests/Feature/Auth/PasswordConfirmationTest.php` | 3 | 0 | Tela de confirmação; confirma; recusa senha errada. |
| `tests/Feature/Auth/PasswordResetTest.php` | 4 | 0 | Tela de link; solicitação; tela de reset; reset com token válido. |
| `tests/Feature/Auth/RegistrationTest.php` | 2 | 0 | **Divergência do boilerplate:** trava que o auto-registro **não existe** — `GET /register` → 404 e o POST não tem rota. |

##### `tests/Feature/Banner/`, `Category/`, `Seller/`, `SiteSettings/` — CRUD de conteúdo, 5 arquivos, 63 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Banner/BannerCrudTest.php` | 19 | 4 | Limite de **3 banners ativos** (inclusive ao ativar via `update`, e sem contar contra si mesmo); `position` em branco vira 0 em vez de estourar constraint; `update` parcial não zera posição; `cta_url` só aceita caminho relativo ou `http/https`; rótulo e link do CTA exigidos **em par**; imagem obrigatória e validada; troca de imagem apaga a antiga; `destroy` apaga registro **e** arquivo; activity log em cada mutação; 403 sem `manage_site_settings`; visitante → login. |
| `tests/Feature/Category/CategoryImageTest.php` | 10 | 1 | Foto de categoria vai para `categories/`, novo upload apaga a anterior, remover apaga arquivo e anula campo, excluir a categoria leva a foto, arquivo inválido recusado, 403/redirect por permissão, a foto **precede** o fallback automático na home Boutique e o `DELETE` devolve o fallback, listagem envia `image_url` (null sem foto). |
| `tests/Feature/Seller/SellerCrudTest.php` | 17 | 1 | CRUD de vendedora + activity log; nome e WhatsApp obrigatórios (mesma regra do número padrão da loja); `position` em branco vira 0; duas ativas fazem o WhatsApp dos produtos **alternar** na home Boutique; excluir todas devolve a vitrine ao número padrão; tela envia ativas+inativas ordenadas; `seller_selection` persiste pelo form principal, chega às props públicas, valor inválido recusado, payload sem o campo mantém o valor atual. |
| `tests/Feature/SiteSettings/SiteSettingBrandingTest.php` | 2 | 0 | `assetUrl` resolve caminho público, storage e default; `logo_dark_url` repete o claro sem variante escura. |
| `tests/Feature/SiteSettings/UpdateSiteSettingsTest.php` | 15 | 1 | Permissão para ver/editar; upload/remoção/substituição de logo e marca apagando o arquivo anterior; **SVG recusado como logo (XSS)**; cor primária hex validada e propagada ao site público; WhatsApp com caracteres inválidos recusado; a tela envia banners ordenados; **salvar um campo sozinho não regride os outros nem encosta na logo** (3 casos dedicados). |

##### `tests/Feature/Billing/` — 5 arquivos, 30 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Billing/BillingEvaluateTest.php` | 4 | 0 | Máquina de estados: `past_due` além da carência → `suspended`; dentro da carência mantém; `suspended` com `paid_until` futuro reconcilia para `active`; `active` intocado. |
| `tests/Feature/Billing/BillingModeTest.php` | 5 | 0 | `enabled()` exige live **E** token **E** `subscription_id`; config parcial = off silencioso; prop `billing` é null com off e traz `status`+`invoice_url` com live. |
| `tests/Feature/Billing/BillingOverrideTest.php` | 4 | 0 | `billing:status` força estado com `paid_until` e registra no activity log; **funciona com o módulo off** (destrava cliente); recusa estado inválido; `--show` não altera. |
| `tests/Feature/Billing/BillingWebhookTest.php` | 11 | 0 | Webhook Asaas: 404 com módulo off ou env incompleto; token inválido → 401; assinatura divergente → 200 ignorado; `PAYMENT_RECEIVED`/`CONFIRMED` ativam e estendem `paid_until` (+1 mês do `dueDate`, +1 ano no ciclo anual) salvando `invoiceUrl`; **evento duplicado → 200 sem reprocessar**; `PAYMENT_OVERDUE` → `past_due` com vitrine ainda 200; `PAYMENT_REFUNDED` do pagamento vigente volta a `past_due`, de pagamento não vigente é ignorado. |
| `tests/Feature/Billing/VitrineSuspensionTest.php` | 6 | 0 | Suspensão: home e página de produto → **503 com página própria e `Retry-After`**, sitemap → 503; módulo off ignora `suspended`; lojista com `manage_items` vê 200 + faixa de preview; **área administrativa continua acessível**. |

##### `tests/Feature/Demo/` + `tests/Feature/Seeders/` + `tests/Feature/Layout/DemoLayoutTest.php` — instância de demonstração, 8 arquivos, 46 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Demo/DemoGarimpoBannersTest.php` | 4 | 0 | Seed do case cria 6 banners (3 ativos/3 inativos) com imagens no disco, na ordem do carrossel; o banner VIP aponta para grupo **fictício**, nunca um real; re-seed não duplica nem deixa arquivo órfão. |
| `tests/Feature/Demo/DemoManasSwitchTest.php` | 3 | 0 | `up` faz backup, oculta itens atuais e aplica o case; `down` restaura configurações e publicações e remove itens/usuária do case; `down` sem backup **não altera nada** e falha com mensagem. |
| `tests/Feature/Demo/DemoOticaVisaoSeederTest.php` | 6 | 0 | Catálogo publicado com categorias e fotos do descritor; identidade da loja em `site_settings`; usuária do case entra como equipe verificada; re-seed idempotente; `demo:switch` apaga o case anterior. |
| `tests/Feature/Demo/DemoPlatformUserTest.php` | 6 | 1 | **Todo** case da demo cria o super usuário que apresenta (dataset por seeder); ele troca layout e vê docs técnicas/métricas, coisa que a usuária da loja não pode; trocar de case não duplica nem rebaixa; **instância de cliente em produção não ganha esse usuário**, a demo pública ganha. |
| `tests/Feature/Demo/DemoSwitchTest.php` | 8 | 0 | `demo:switch` recusa rodar fora da instância de demonstração e recusa case desconhecido; sem argumento lista ativo+disponíveis; troca limpa o conteúdo anterior; middleware redireciona subdomínio de demo que não é o case ativo para o host canônico e é inerte fora da instância de demo. |
| `tests/Feature/Layout/DemoLayoutTest.php` | 6 | 2 | Todos os cases abrem no Boutique; **nenhum case polui o activity log** com a troca de layout; o reset devolve o Clássico a case que não opta por layout; trocar de case não leva vendedoras, banners nem modo de atendimento do case anterior. |
| `tests/Feature/Seeders/DemoCtVitrineSeederTest.php` | 4 | 0 | Branding com logo claro e escuro; vitrine sem produtos (catálogo manual); usuária no papel de equipe; re-seed idempotente. |
| `tests/Feature/Seeders/DemoManasSeederTest.php` | 4 | 1 | Case completo, catálogo com as fotos versionadas no repo, usuária com escopo de cliente, re-seed idempotente. |
| `tests/Feature/Seeders/ProductionSeedTest.php` | 5 | 0 | **O seed de produção não roda o `UserSeeder`** (usuárias de teste + `fake()`); cria o dono da loja a partir do `.env` com papel OWNER; sem `VITRINE_ADMIN_EMAIL`/senha de super **não cria usuário nenhum**; cria o super usuário de manutenção oculto do dono; fora de produção inclui as usuárias de teste. |

##### `tests/Feature/Docs/` e `tests/Feature/Env/` — **guardas de infraestrutura**, 6 arquivos, 38 casos

Esta é a família de testes-GUARDA. É a novidade estrutural do ctvitrine.

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Env/EnvExampleGuardTest.php` | 2 | 0 | **G1** — toda env do produto declarada em `config/` tem linha (mesmo comentada) em `.env.example`, via `EnvInventory::productEnvs()` + regex `^#?\s*NOME=`. **G4** — env classificada como segredo (`EnvInventory::isSecret`) **nunca tem valor após o `=`** no `.env.example`, "nem placeholder". Mensagem de falha instrui a corrigir "no mesmo commit". |
| `tests/Feature/Env/EnvDocsGuardTest.php` | 4 | 0 | **G2** — toda env do produto é citada em `docs/tecnico/12-variaveis-de-ambiente.md`. **G3** — toda env extraída de `config/vitrine.php` casa um prefixo de `EnvInventory::PRODUCT_PREFIXES` (nome fora do padrão quebra). **G5** — as páginas `12-variaveis-de-ambiente` e `13-implementando-um-modulo` estão no índice técnico e renderizam para `super_user`; usuário comum segue com 403. |
| `tests/Feature/Env/EnvInventoryTest.php` | 7 | 0 | Motor do inventário: `extract()` reconhece `env()` com aspas simples, duplas com default e chamada multilinha, ignora nome fora do padrão e não duplica; `fromConfigFiles()` varre o diretório de config **como texto**; o inventário real do repo contém as envs centrais; `productEnvs()` filtra por prefixo; `isProduct()` aceita cada prefixo da allowlist e recusa o resto; `isSecret()` cobre os quatro sufixos e recusa nomes comuns. |
| `tests/Feature/Env/ModeDiagnosticsTest.php` | 1 | 1 | **O invariante central de feature-flag do projeto**: `Mode::enabled() === (todos os `ok` de `Mode::diagnostics()`)`. Um dataset `'cenários por módulo'` com **40 cenários** (medido) cobre 10 classes `*Mode` (`MetricsMode`, `ReportMode`, `AiIntakeMode`, `AiImageMode`, `AiStudioMode`, `BillingMode`, `LandingMode`, `TermsMode`, `SignupMode`, `TrackingMode`), cada uma em off / live completo / live faltando cada pré-requisito / typo no modo. Também trava o **shape** de `diagnostics()` (`['requisito' => string, 'ok' => bool]`, lista não vazia). Se um Mode ganhar pré-requisito novo sem linha em `diagnostics()`, quebra. |
| `tests/Feature/Env/VitrineEnvCommandTest.php` | 16 | 0 | O comando `vitrine:env`: lista todos os módulos com tudo off/demo e **nenhum valor de segredo no stdout**; nomeia a env faltante em live incompleto e `--check` → exit 1; aponta typo com prefixo do produto; fixture limpa passa; arquivo inexistente vira aviso, não erro; detecta perfil aparente (demo coringa com case ativo, landing); imprime valores de conferência (plano, versão do termo, ambiente do signup, ciclo); termo live com versão divergente do cabeçalho do arquivo → aviso + exit 1; signup live em produção apontando para sandbox → aviso; tracking live sem pixel nomeia `META_PIXEL_ID`; tracking com pixel e sem token avisa que a CAPI está off **sem imprimir o token**; `APP_DEBUG=true` + `MAIL_MAILER=log` em produção é denunciado. |
| `tests/Feature/Docs/DocsAccessTest.php` | 8 | 0 | Documentação servida dentro do app: visitante → login; `/docs` redireciona ao primeiro doc do guia do usuário; qualquer logado vê o guia; usuário comum → 403 na doc técnica; super usuário vê ambos; grupo/página inexistente → 404; o render converte Markdown GFM em HTML e reescreve links internos; **links para grupo sem acesso viram texto puro**. |

##### `tests/Feature/Items/` — pipeline de mídia e faxina, 6 arquivos, 53 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Items/ItemCrudTest.php` | 11 | 0 | Redirect/403 por permissão; criação com fotos; limite de 8 fotos; update; troca rápida de status e status inválido recusado; soft delete; remoção de foto individual apaga o arquivo; **não remove foto de outro item**. |
| `tests/Feature/Items/ItemColorsTest.php` | 7 | 1 | Cores persistidas, limpas (apara, remove vazias e duplicatas case-insensitive), limite de 30 chars por cor, edição sem regredir outros campos, esvaziar é possível, produto sem cor tem `colors` vazio (não null quebrado), a página do produto expõe cores **nos dois layouts** (dataset). |
| `tests/Feature/Items/FeaturedItemTest.php` | 9 | 0 | Destaque no `store`/`update`/`toggle` com activity log e flash; `is_featured` em branco recusado **na validação, não no banco**; 403/redirect por permissão; **rascunho do Estúdio marcado como destaque não vaza para a vitrine**; ao desmarcar, o fallback de novidades reassume. |
| `tests/Feature/Items/PhotoOptimizationTest.php` | 5 | 0 | `ImageOptimizer` reduz o lado maior ao teto e devolve JPEG, **não amplia** imagem menor, achata PNG com alpha sem estourar; foto do cadastro é salva já otimizada como `.jpg`; `photos:optimize` reprocessa o acervo. |
| `tests/Feature/Items/PruneOrphanFilesTest.php` | 10 | 0 | Faxina de órfãos: lista sem apagar sem `--apply`; arquivo referenciado por `path` nunca apagado; **o original do fundo de IA é referência legítima**; foto de item na lixeira é preservada (o dono do arquivo é a linha); arquivo recém-gravado é poupado (job em voo); `--hours` encurta a carência; pasta de item hard-deletado é varrida inteira; **não encosta em branding nem banners**; sem sujeira, avisa e sai. |
| `tests/Feature/Items/TrashHygieneTest.php` | 11 | 0 | Apagar foto com fundo de IA leva o original junto; fundo em voo (path == original) não estoura; expurgo respeita a janela de retenção e `--days`; **o REGISTRO do item nunca é apagado** (as métricas leem item removido) e depois do expurgo o produto continua no ranking de mais vistas; rodar duas vezes é inócuo. |

##### `tests/Feature/Layout/` (exceto DemoLayout) — 4 arquivos, 41 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Layout/BoutiquePropsTest.php` | 19 | 0 | Contrato de props do layout Boutique vs Clássico: com layout null nenhuma prop extra vaza; meta tags do crawler e JSON-LD de Product **não mudam** entre layouts; banners só ativos, por `position`, no máximo 3, com URL e CTA; `featured` só destaques publicados e não vendidos, caindo nas 10 mais recentes sem destaque; `categoryCards` com contagem honesta, precedência de `image_path` sobre capa automática, `image_url` null sem foto, categoria inativa fora; vitrine vazia não quebra; suspensa → 503 também no Boutique; **payload de card sem `description` e sem o array de fotos**, capa = primeira foto por `position` (não por inserção). |
| `tests/Feature/Layout/SellerRoutingTest.php` | 7 | 0 | `sellers` só ativas ordenadas por `position` e **inexistente no Clássico**; rodízio par/ímpar; vendedora inativa fora; sem ativa o `whatsapp` do item é null; `Seller::pick` é a **única fórmula** e é determinística; a página do produto resolve o mesmo número da home — `featured` leva o campo, `related` não. |
| `tests/Feature/Layout/SiteLayoutTest.php` | 8 | 3 | `SiteLayout::fromSetting` degrada para clássico (dataset); `options()` alimenta o seletor; cada layout aponta ao seu componente Inertia; `SellerSelection::fromSetting` degrada para "escolha"; **o form do lojista não troca o layout por mass assignment**, mas `seller_selection` continua fillable. |
| `tests/Feature/Layout/UpdateLayoutTest.php` | 7 | 1 | Só super usuário troca o layout (redirect + persistência + activity log); papel de cliente com `manage_site_settings` recebe **403** (dataset por Roles); visitante → login; layout inválido/ausente recusado na validação; a tela envia layout atual + opções. |

##### `tests/Feature/Legal/` — 5 arquivos, 21 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Legal/LegalPagesTest.php` | 4 | 0 | Com landing live, `/termos` e `/privacidade` → 200 com HTML, versão, data e meta OG; com landing off → 404 mesmo deslogado; **módulo legal live + owner sem aceite não afeta a vitrine pública `/`**. |
| `tests/Feature/Legal/TermsAcceptanceTest.php` | 4 | 0 | Aceite grava a trilha, registra no activitylog, **enfileira o comprovante** e libera o admin; sem BCC o comprovante vai só ao owner; sem a caixa marcada → erro de validação; segundo POST na mesma versão é idempotente (sem duplicar registro nem comprovante). |
| `tests/Feature/Legal/TermsGateTest.php` | 4 | 0 | Default off: owner navega sem gate e as rotas de aceite são 404; live sem aceite → redirect ao aceite, com a página abrindo e o logout livre; staff/admin/super_user **não** são bloqueados; bump de versão bloqueia de novo e gera segundo registro. |
| `tests/Feature/Legal/TermsModeTest.php` | 3 | 0 | Default off sem env nova; config parcial ou arquivo ausente = off silencioso sem exceção; `TermsDocument` — o hash acompanha o conteúdo cru e o HTML é cacheado por hash. |
| `tests/Feature/Legal/TermsPlanAnnexTest.php` | 6 | 0 | Recorte de anexos por plano na página de aceite (cada plano vê só os seus + o comum); sem `VITRINE_PLAN` ou com plano fora do mapa → documento completo (fallback que **não esconde nada**); **o recorte é só exibição** — o aceite grava o hash do arquivo integral com e sem plano; a landing serve sempre o documento completo. |

##### `tests/Feature/Metrics/` — 12 arquivos, 101 casos (o maior módulo)

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Metrics/MetricsModeTest.php` | 4 | 0 | `mode()` reflete config e os atalhos são coerentes; valor inválido cai para off sem exceção; off → tela e coleta 404; a prop compartilhada acompanha `demo` e `live`. |
| `tests/Feature/Metrics/MetricsPageTest.php` | 6 | 0 | Em `demo` só quem tem `manage_roles` vê (payload de demonstração) e a equipe da loja não; em `live` a equipe com `view_metrics` vê dados reais; 403 sem permissão; `?periodo` inválido cai para 30; visitante → login. |
| `tests/Feature/Metrics/MetricsQueryTest.php` | 10 | 0 | KPIs e funil batem com eventos/vendas em datas controladas; série diária preenche dias vazios com zero; deltas só existem com cobertura da janela anterior (senão null); top produtos ordenados por views, limitado a 5; insight de parados só a partir do mínimo; **payload de demo e de live têm exatamente o mesmo shape**; o payload live é cacheado (2ª chamada não refaz queries); item sem categoria não derruba o ranking. |
| `tests/Feature/Metrics/MetricsTrackingTest.php` | 9 | 0 | Coleta: 204 com `session_hash` de 64 chars e **sem IP/UA persistidos**; origem classificada na gravação a partir de utm/referrer; `item_view` exige `item_id` (422 para evento/item inválido); **user-agent de bot responde 204 sem gravar**; 61ª requisição no minuto → 429; `SessionHasher` estável no dia e diferente no dia seguinte; `metrics:prune` respeita retenção e `--all` esvazia. |
| `tests/Feature/Metrics/MetricsInsightsTest.php` | 14 | 5 | Motor de insights por produto (`demand_leak`): números + CTA de edição + tier `per_item`; sem 3 produtos elegíveis não há mediana logo não há insight; produto com <25 visitas nunca é candidato; taxa fora dos limiares não vaza; vendido/reservado fora; **desempate determinístico** (maior views → menor taxa → menor id); vitrine vazia não lança exceção. Gate por plano: no Essencial nenhum insight por produto sai (só contagem, e sem teaser quando não há decisão), fora dele saem inteiros; `features.metrics.insights_tier` acompanha o plano; **contrato de todo insight**: action imperativa, tier válido e CTA só com alvo; os 3 insights legados mantêm `kind`, ganham `action` e continuam `basic`. |
| `tests/Feature/Metrics/MetricsStrategyTest.php` | 18 | 5 | `price_sweet_spot` (faixa quente/morta, limiares, desempate), `trending_now` (pico medido contra o ritmo anterior, CTA para o produto, limiares, produto novo com média anterior zero), `best_category` (números + filtro da vitrine, limiares, desempate por sales → id); painel entrega todos os insights **na ordem de prioridade** e `insightsForWindow` entrega exatamente o mesmo; `headline_insight` = maior prioridade da janela, null sem decisão ou sem dado; gate do relatório: no Essencial o chefe cai para o primeiro `basic` e **nunca é o teaser**; `MonthlyReportText` — sem chefe o texto é **byte a byte** o de hoje, e estourando o teto "Mais desejadas" encolhe **antes** da decisão. |
| `tests/Feature/Metrics/MetricsNumbersPlanGateTest.php` | 11 | 2 | Fronteira comercial dos números: fora do Essencial há ranking por produto e tendências; no Essencial não — mas **as métricas de loja continuam inteiras** (o corte é cirúrgico); o seletor de período não abre 90 dias no Essencial e `?periodo=90` na mão **não burla** (cai para 30 e o payload acompanha); o corte não depende de haver dado; o módulo avulso (relatório) libera as métricas do Anexo IV **mas não abre assentos nem gestão de usuários**; o relatório mensal segue a mesma fronteira. |
| `tests/Feature/Metrics/MonthlyReportTest.php` | 11 | 0 | Builder do relatório: KPIs, top produtos, origem e vendas do mês; **eventos fora do mês não contam (bordas do fuso BRT)**; deltas só com cobertura e `previous.deltas` null sem divisão por zero; mês sem dado vira "insuficiente" em vez de zeros; `sold_price` nulo conta a venda e é ignorado na receita; item vendido e depois soft-deleted continua contando; o texto traz números, nome da loja, origem e produto mais desejado; mês corrente marcado `(parcial)`; **"visitas" do relatório == definição de sessão da tela de métricas**. |
| `tests/Feature/Metrics/MonthlyReportCommandTest.php` | 3 | 0 | Off → falha com mensagem clara e exit 1; live imprime o texto do mês anterior; `--month` inválido → exit 1. |
| `tests/Feature/Metrics/ReportModeTest.php` | 3 | 0 | Typo no mode cai para off; `enabled()` exige report live **E** métricas live (4 combinações); métricas em `demo` **não** ligam o relatório. |
| `tests/Feature/Metrics/ReportPageTest.php` | 7 | 0 | 404 com off (mesmo deslogado) e com métricas fora de live; visitante → login; 403 sem `view_metrics`; props corretas com permissão; `?month` inválido ou fora da retenção → 422; o WhatsApp do payload vem da config do relatório quando definida. |
| `tests/Feature/Metrics/SaleDataTest.php` | 5 | 0 | Marcar vendido **congela** `sold_at` e o preço vigente; editar o preço depois não altera o snapshot; desfazer limpa ambos; a receita usa o preço congelado com fallback ao de tabela; o backfill do migration marca vendidos pré-existentes. |

##### `tests/Feature/Ops/` — provisionamento e cobrança operacional, 8 arquivos, 55 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Ops/ProvisionInstanceTest.php` | 16 | 0 | **Gate: recusa em produção e sem token do ploi, sem fazer nenhuma chamada HTTP**; valida WhatsApp, slug `[a-z0-9-]` e `--admin-email`; slug reservado bloqueado sem `--force`; pipeline feliz com chamadas na ordem e payloads corretos; **espera o vhost subir antes de instalar o repositório**; clone que falha no log aborta ANTES do deploy e do SSL; com chave de e-mail transacional a instância nasce com SMTP e remetente compartilhado, sem ela cai em `MAIL_MAILER=log`; falha no deploy salva estado e `--resume` refaz só do deploy; domínio próprio adia o SSL com aviso; `--with-billing` encadeia; a opção `--billing-due-day` foi **removida** e invocá-la falha; **o output não contém a senha do banco nem o token**. |
| `tests/Feature/Ops/BillingSubscribeTest.php` | 14 | 0 | Mesmo gate de produção/token sem HTTP; base URL de sandbox por default; payloads do pipeline mensal (valor do `PlanMap`, `UNDEFINED`, `nextDueDate` D+2, description); **D+2 calculado em BRT, não UTC** (borda de fuso); ciclo anual; customer existente por CPF/CNPJ não cria segundo cadastro; webhook com `authToken` de 48 chars e URL da instância correta, e webhook existente é atualizado, não duplicado; envs injetados por merge preservando pré-existentes + redeploy; `--resume` não recria subscription; validações → exit 1; `--due-day` removida; **stdout não vaza o token do Asaas nem o `authToken`, e o estado salvo não guarda `authToken`**. |
| `tests/Feature/Ops/ProvisionFromOrderTest.php` | 4 | 0 | `--from-order` incompatível com `--with-billing`; sem as envs de ops recusa **antes de qualquer chamada**; pedido não pago ou slug divergente → recusa; caminho feliz: o pedido preenche os dados, o pipeline roda, o billing é **adotado** (não recriado) e o funil fecha. |
| `tests/Feature/Ops/PloiClientTest.php` | 4 | 0 | `createSite` envia payload e Bearer ao endpoint certo; **429 com `Retry-After` respeita a espera**; 3× 5xx esgota tentativas e lança `PloiApiException`; **a exceção não vaza o token nem o corpo da resposta**. |
| `tests/Feature/Ops/StubRenderTest.php` | 4 | 0 | O `.env` renderizado não tem placeholder órfão, tem `APP_KEY` base64 e os seeds da loja; instância sem R2 nasce com disco `public` e **sem credenciais s3**; stub adulterado (placeholder sem valor) dispara exceção; o deploy script renderiza diretório e branch. |
| `tests/Feature/Ops/MigrateStorageTest.php` | 4 | 0 | Copia todos os arquivos de `public` para `s3`; idempotente; `--dry-run` não escreve; **aborta quando o disco s3 não está configurado**. |
| `tests/Feature/Ops/PlanMapTest.php` | 5 | 0 | As envs por plano seguem a tabela comercial; `--module=report` liga o relatório no Essencial **sem tocar em IA**; `--module=ai` liga a IA com a franquia do avulso; preços mensal/anual expostos; planos válidos/inválidos. |
| `tests/Feature/Ops/SuperUserTest.php` | 4 | 0 | O seeder cria o super usuário de manutenção verificado; **não cria ninguém sem senha configurada**; a listagem de usuários **esconde** o super usuário de quem não é super usuário e o mostra para outro super usuário. |

##### `tests/Feature/PermissionRole/`, `tests/Feature/Permissions/`, `ImpersonateTest` — RBAC, 6 arquivos, 23 casos Pest + 13 métodos PHPUnit

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/PermissionRole/AssignRoleAllowlistTest.php` | 3 | 0 | Papel legado que existe no banco mas não está na allowlist do enum `Roles` **não pode ser atribuído** — nem via assign, nem no create, nem no update de usuário. |
| `tests/Feature/PermissionRole/UpdateRolePermissionsInvalidatesUserCacheTest.php` | 3 | 0 | Atualizar permissões de um papel invalida o cache **dos usuários afetados e só deles**; payload inválido não muda permissões nem invalida cache; papel legado fora do enum não aceita update. |
| `tests/Feature/Permissions/GetAllPermissionsTest.php` | 2 | 0 | `getAllPermissions()` inclui permissões diretas mesmo sem papel; vazio sem papel e sem diretas. |
| `tests/Feature/Permissions/DesapegoPermissionsTest.php` | 11 | 3 | Matriz de papéis do produto: quem gerencia a vitrine; permissões de plataforma fora do alcance da equipe da loja; **impersonação exclusiva do super user**; admin com toda a gestão de usuários/papéis; proprietário gerencia loja e equipe mas não a plataforma e **só atribui papéis abaixo do seu**; visitor 403 nas telas administrativas; **nenhum papel ou permissão de boilerplate sobrevive no banco**; re-seed invalida cache defasado. |
| `tests/Feature/Permissions/DesapegoStaffSeederTest.php` | 4 | 3 | O seeder cria as duas usuárias de equipe ativas e verificadas com permissões de vitrine+métricas e **sem plataforma**; acessam itens/configurações mas não usuários; re-seed idempotente sem resetar. |
| `tests/Feature/ImpersonateTest.php` | 0 Pest / **13 métodos PHPUnit** | — | Único arquivo em classe (`final class ImpersonateTest extends Tests\TestCase`, `setUp` semeando `PermissionRoleSeeder`). Trava: super user personifica qualquer um; meta `can_impersonate_any` permite alcançar super user; não personifica a si mesmo, nem inativo, nem sem permissão, nem papel de prioridade ≥; eventos `ImpersonateStarted`/`Stopped` disparados; não inicia estando já personificando; para e não para quando não está; **o activity log registra com o contexto do ator REAL**, tentativa proibida não cria log, e mudanças feitas durante a personificação são atribuídas ao usuário original. |

##### `tests/Feature/Signup/` — checkout self-service, 7 arquivos, 44 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Signup/SignupModeTest.php` | 6 | 0 | Default off: **todas** as rotas do checkout 404 sem env nova, `features.signup` false e landing intocada; live liga tudo; config parcial = off silencioso; **sem landing ou sem termos o checkout não existe**; sandbox por default, produção só com env explícita. |
| `tests/Feature/Signup/SignupFormTest.php` | 4 | 0 | Form abre com plano/ciclo da query pré-selecionados e `ref` gravável; **preços vêm do `PlanMap`, nenhum valor hardcoded**; disponibilidade de slug: formato inválido/reservado/pedido vivo → indisponível, livre e slug de pedido expirado → disponível. |
| `tests/Feature/Signup/SignupStoreTest.php` | 15 | 1 | POST feliz com snapshot do `PlanMap` e redirect ao pedido; customer existente reusado por CPF/CNPJ **e atualizado** com os dados do formulário; taxa de setup zerada (dataset por ciclo) mas pedido antigo com taxa cobrada continua reconciliando; CPF/CNPJ inválido barrado antes do Asaas; máscara da tela aceita e normalizada; Turnstile reprovado → validação, nada criado; **corrida de slug com outro CPF → erro amigável sem segunda cobrança**; retry idempotente reaproveita o pedido, pode trocar plano/ciclo **enquanto não há cobrança** e recongela o snapshot, mas pedido com cobrança não aceita troca e completa o que falta sem duplicar; aceite grava trilha **do servidor** e enfileira comprovante — sem aceite, nada criado. |
| `tests/Feature/Signup/SignupWebhookTest.php` | 7 | 0 | Token errado/ausente → 401; `PAYMENT_RECEIVED`/`CONFIRMED` liquidam e disparam e-mail ao operador (com o comando pronto) e ao cliente; re-envio → 200 idempotente **sem segundo e-mail**; pagamento do setup avulso só marca `setup_paid_at`; pagamento de pedido expirado → 200 **sem transição automática e sem e-mail** (ação manual); pagamento órfão e evento desconhecido → 200, loga e ignora. |
| `tests/Feature/Signup/SignupExpireTest.php` | 6 | 0 | Pendente vencido cancela subscription **e** cobrança avulsa no Asaas, expira e libera o slug; falha no cancelamento mantém o pedido pendente para retry; pedido recente intocado; 404 no cancelamento (já cancelado ontem) não trava o pedido; setup já pago não é deletável — expira sem tentar delete (estorno manual); módulo off → no-op. |
| `tests/Feature/Signup/SignupOpsEndpointsTest.php` | 4 | 0 | Bearer ausente/errado → 401; bearer correto devolve JSON do pedido com os campos de provisioning e **sem segredos**; `public_id` inexistente → 404; `POST /provisioned`: `paid` → `provisioned`, repetido → ok idempotente, pendente → 409. |
| `tests/Feature/Signup/SignupOrderPageTest.php` | 2 | 0 | Pendente mostra resumo + fatura + validade (TTL a partir da criação); pago mostra confirmação com o compromisso de 48h úteis e **nunca id interno na URL**. |

##### `tests/Feature/Site/` — vitrine pública e SEO, 4 arquivos, 23 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Site/HomePageTest.php` | 4 | 0 | Abre para visitante; só itens publicados; vendidos não aparecem (disponíveis e reservados sim); as configurações do site chegam à página. |
| `tests/Feature/Site/LandingPageTest.php` | 7 | 3 | Off → `/` é a vitrine; live+whatsapp → `site/landing` com props corretas; **live sem whatsapp = off silencioso**; modo inválido cai em off (dataset); live serve as meta tags OG no HTML; `LandingMode::mode()` valida e cai em off no typo (dataset); `enabled()` exige live **E** whatsapp (dataset). |
| `tests/Feature/Site/ShowItemPageTest.php` | 9 | 0 | Slug gerado na criação, único para nomes iguais e **imutável no update**; item não publicado e slug inexistente → 404; vendido continua acessível com estado vendido; o HTML traz meta OG e JSON-LD de Product; relacionados só da mesma categoria, publicados, não vendidos, sem o próprio item, máx. 4. |
| `tests/Feature/Site/SitemapTest.php` | 3 | 0 | Sitemap lista home + publicados não vendidos e omite ocultos/vendidos; `robots.txt` aponta para o sitemap com URL absoluta e bloqueia a área admin. |

##### `tests/Feature/Tracking/` — Meta Pixel + CAPI, 3 arquivos, 24 casos

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/Tracking/TrackingModeTest.php` | 5 | 2 | `mode()` cai em off no typo (dataset); `enabled()` exige live **E** pixel — o token da CAPI não entra (dataset); `capiEnabled()` exige pixel ligado **E** token; config ausente (instância de cliente) = tudo off sem exceção; acessores devolvem null com valor em branco. |
| `tests/Feature/Tracking/TrackingPixelTest.php` | 6 | 1 | Off por default: **nenhum vestígio do pixel no HTML**; live+pixel injeta snippet base + PageView; config parcial ou typo = off silencioso (dataset de `Closure`); **o token da CAPI jamais chega ao HTML nem com tudo ligado**; instância de cliente sem as envs não recebe pixel nem na vitrine nem no admin. |
| `tests/Feature/Tracking/MetaCapiTest.php` | 13 | 1 | Tracking off → pedido pago não enfileira nada; live sem token → pixel mede, nada server-side; com CAPI enfileira o Purchase do pedido certo e **re-webhook não enfileira um segundo** (venda única); payload com `event_id` estável (dedupe da Meta), `em`/`ph` em SHA-256, `value`/`currency`, `action_source`; `test_event_code` só quando a env existe; falha e timeout da Meta são logados e **não propagam** (o pagamento já foi aceito) e o webhook responde 200 com a Meta fora do ar; **gate reconferido no worker** (módulo desligado depois do dispatch não chama a Meta); pedido apagado entre dispatch e worker não faz nada; normalização de telefone por dataset. |

##### Raiz de `tests/Feature/` — 5 arquivos, 22 casos + os 13 métodos do Impersonate

| Caminho | N | DS | Invariante travada |
|---|---|---|---|
| `tests/Feature/DashboardTest.php` | 2 | 0 | Visitante → login; autenticado acessa o dashboard. |
| `tests/Feature/HorizonAccessTest.php` | 3 | 0 | Super user vê o Horizon fora de `local`; visitante e não-super são negados; **`horizon:snapshot` está agendado a cada 5 minutos**. |
| `tests/Feature/HorizonDevelopmentScriptsTest.php` | 2 | 0 | Guard de `composer.json`: o script `dev` roda Horizon e o scheduler; existe um script de terminação seguro para deploy e a dependência do watcher. |
| `tests/Feature/Laravel13ConfigurationDefaultsTest.php` | 2 | 0 | Guard de config: usa os defaults de cache/sessão do Laravel 13 quando não há override, e honra overrides explícitos para evitar churn de namespace. |
| `tests/Feature/User/PlanSeatsTest.php` | 8 | 1 | Teto de assentos por plano: sem `VITRINE_PLAN` **não há teto** (instância antiga não regride) e typo idem; Profissional barra o 6º ativo com mensagem do plano (dataset); com assento livre passa; **usuário desativado não ocupa assento** e o super usuário de manutenção **não consome assento do cliente**; reativar respeita o teto (senão o toggle contornava o limite); Essencial tem teto 1 com mensagem convidando ao Profissional. |
| `tests/Feature/User/UserManagementPlanGateTest.php` | 6 | 0 | No Essencial `/users` responde **404** ao proprietário mas o super usuário de manutenção acessa; Profissional libera; instância sem `VITRINE_PLAN` não regride; `features.user_management` é false para o proprietário no Essencial e true para o super usuário. |
| `tests/Feature/Settings/PasswordUpdateTest.php` | 2 | 0 | Troca de senha; senha atual correta obrigatória. |
| `tests/Feature/Settings/ProfileUpdateTest.php` | 5 | 0 | Página exibida; dados atualizados; e-mail inalterado não zera verificação; exclusão da própria conta; senha correta obrigatória para excluir. |

---

#### 4. Testes que fazem `Http::fake` de integração externa

9 arquivos (medido), 5 serviços externos + 1 auto-chamada:

| Serviço | Padrão de fake | Caminhos |
|---|---|---|
| **Asaas** (cobrança) | `api-sandbox.asaas.com/v3/customers*`, `/v3/payments*`, `/v3/subscriptions*`, `/v3/webhooks*`, `/v3/subscriptions/<id>`, `/v3/payments/<id>` | `tests/Feature/Ops/BillingSubscribeTest.php`, `tests/Feature/Signup/SignupStoreTest.php`, `tests/Feature/Signup/SignupExpireTest.php`, `tests/Feature/Ops/ProvisionFromOrderTest.php` |
| **Ploi.io** (provisionamento) | `ploi.io/api/servers/*/sites`, `.../sites/*/log`, `.../sites/*/deploy`, `ploi.io/api/*` | `tests/Feature/Ops/PloiClientTest.php` (inclui `Http::fakeSequence`), `tests/Feature/Ops/ProvisionInstanceTest.php`, `tests/Feature/Ops/ProvisionFromOrderTest.php` |
| **Google Gemini** | `generativelanguage.googleapis.com/*` (incl. `Http::sequence()` para retry) | `tests/Feature/AiIntake/AiDraftEndpointTest.php`, `tests/Feature/AiIntake/AnalyzerTest.php` |
| **OpenAI** | `api.openai.com/*` | `tests/Feature/AiIntake/AnalyzerTest.php` |
| **Meta Graph / CAPI** | `graph.facebook.com/*` + `Http::fake(fn() => throw new ConnectionException(...))` para timeout | `tests/Feature/Tracking/MetaCapiTest.php` |
| **API de ops da própria landing** | `landing.test/api/ops/signup-orders/*`, `.../provisioned` | `tests/Feature/Ops/ProvisionFromOrderTest.php` |
| **Smoke da instância recém-criada** | `*/webhooks/asaas` → 401 e catch-all `'*'` devolvendo HTML de app Inertia | `tests/Feature/Ops/BillingSubscribeTest.php`, `tests/Feature/Ops/ProvisionInstanceTest.php`, `tests/Feature/Ops/ProvisionFromOrderTest.php` |

`Http::preventStrayRequests()` aparece em **5 arquivos / 17 ocorrências** (medido) — concentrado nos testes de Signup e Ops. `Http::fake()` sem argumento é usado deliberadamente como **assert de "nenhuma chamada"** (`assertNothingSent`) nos gates de produção/token.

---

#### 5. Testes de modo / feature-flag: como o teste liga e desliga o módulo

O ctvitrine tem **10 módulos ativáveis por env**, e a suíte codifica o mecanismo em três camadas:

1. **Baseline em `phpunit.xml`** — 4 envs (`VITRINE_LANDING_MODE`, `VITRINE_TERMS_MODE`, `VITRINE_SIGNUP_MODE`, `VITRINE_REPORT_MODE`) forçadas em `off` para que o `.env` do dev não sequestre a suíte.
2. **Helpers `enable*Live()` em `tests/Pest.php`** — sempre via `config()->set('vitrine.<modulo>.…')`, **nunca** via `putenv`/`$_ENV`. Encadeiam pré-requisitos reais (`enableAiStudioLive()` chama `enableAiIntakeLive()`; `enableSignupLive()` liga landing + termos; `enableReportLive()` liga métricas). Medido: **377 chamadas `config()->set('vitrine…` em 50 arquivos de teste**.
3. **Um `*ModeTest.php` por módulo** (10 arquivos) + o invariante cruzado `ModeDiagnosticsTest`:

| Módulo | Arquivo do teste de modo | Regra do `enabled()` que ele trava |
|---|---|---|
| metrics | `tests/Feature/Metrics/MetricsModeTest.php` | 3 estados (`off`/`demo`/`live`), typo → off |
| report | `tests/Feature/Metrics/ReportModeTest.php` | report live **E** metrics live (4 combinações) |
| ai_intake | `tests/Feature/AiIntake/AiIntakeModeTest.php` | live **E** chave; provider inválido → gemini |
| ai_image | `tests/Feature/AiImage/AiImageModeTest.php` | live **E** chave |
| ai_studio | `tests/Feature/AiStudio/AiStudioModeTest.php` | live **E** ai_intake; `backgroundAvailable` exige +ai_image +auto_background |
| billing | `tests/Feature/Billing/BillingModeTest.php` | live **E** token **E** subscription_id |
| landing | `tests/Feature/Site/LandingPageTest.php` | live **E** whatsapp |
| terms/legal | `tests/Feature/Legal/TermsModeTest.php` | live **E** versão **E** arquivo presente |
| signup | `tests/Feature/Signup/SignupModeTest.php` | live **E** landing **E** termos **E** credenciais |
| tracking | `tests/Feature/Tracking/TrackingModeTest.php` | live **E** pixel; `capiEnabled()` exige +token |

Padrão recorrente e explícito em todos: **"config parcial = off silencioso, sem exceção"** e **"typo no modo cai para off"**. E cada módulo tem um teste de que a rota responde **404** (não 403) quando desligado.

---

#### 6. Testes-GUARDA de infraestrutura (validam repo, não código de runtime)

| Caminho | O que o teste lê do disco | Guarda |
|---|---|---|
| `tests/Feature/Env/EnvExampleGuardTest.php` | `base_path('.env.example')` | G1 (toda env do produto tem linha) e G4 (segredo sem valor) |
| `tests/Feature/Env/EnvDocsGuardTest.php` | `base_path('docs/tecnico/12-variaveis-de-ambiente.md')`, `config_path('vitrine.php')` | G2 (toda env documentada), G3 (nome de env dentro da allowlist de prefixos), G5 (docs no índice + RBAC) |
| `tests/Feature/Env/EnvInventoryTest.php` | diretório `config/` como texto | O parser do inventário (`EnvInventory::extract/fromConfigFiles/productEnvs/isProduct/isSecret`) |
| `tests/Feature/Env/VitrineEnvCommandTest.php` | fixtures de `.env` geradas em runtime + `resources/legal/` | O comando de diagnóstico, incluindo **não vazar segredo no stdout** e divergência de versão do termo |
| `tests/Feature/Env/ModeDiagnosticsTest.php` | — (config) | `enabled() === diagnostics()` para 10 Modes / 40 cenários |
| `tests/Feature/Docs/DocsAccessTest.php` | `docs/**` via `DocsRepository` | Docs renderizáveis, indexadas e com RBAC; links para grupo sem acesso viram texto puro |
| `tests/Feature/HorizonDevelopmentScriptsTest.php` | `composer.json` | Scripts `dev` e de terminação do Horizon |
| `tests/Feature/Laravel13ConfigurationDefaultsTest.php` | `config/` | Defaults de cache/sessão do Laravel 13 |
| `tests/Feature/Ops/StubRenderTest.php` | stubs de `.env` e de deploy script | Nenhum placeholder órfão; stub adulterado estoura |

**Não existe no ctvitrine** (medido, 0 arquivos): guarda de tradução/locale (`lang/`, `__(`, `trans(`), guarda de contraste/tokens de tema, guarda de tamanho de identificador de schema, guarda de cabeçalhos de segurança (`Content-Security-Policy`, `X-Frame-Options`), guarda de `focus-ring`.

---

#### 7. Frontend — Vitest

Config: `vite.config.ts` bloco `test: { globals: true, environment: 'jsdom', setupFiles: ['./resources/js/test/setup.ts'], css: true }`. Scripts em `package.json`: `test`, `test:run`, `test:ui`, `test:coverage`, `ci:test` (`LARAVEL_BYPASS_ENV_CHECK=1 pnpm -s test:run`), `ci:check` = `ci:lint && ci:test && ci:build`.

Infra: `resources/js/test/setup.ts` (jest-dom, `global.route()` mockado, `window.matchMedia`, `localStorage`, `ResizeObserver`) e `resources/js/test/vitest.d.ts` (`/// <reference types="vitest/globals" />` + declaração global de `route`).

**14 arquivos de teste, 92 casos, 28 blocos `describe`** (medido):

| Caminho | N | Invariante travada |
|---|---|---|
| `resources/js/test/components/Button.test.tsx` | 5 | Props default, classes de variante e de tamanho, disabled, clique. (Versão reduzida do arquivo homônimo do boilerplate, que tem 13.) |
| `resources/js/test/components/banner-link.test.ts` | 2 | `parseLink` reconhece cada destino a partir da `cta_url` salva, `buildLink` monta a `cta_url` a partir da escolha, e o round-trip de editar um banner existente fecha. |
| `resources/js/test/components/boutique-chrome.test.tsx` | 7 | `SuspendedNotice` só aparece com assinatura suspensa (some com ativa e com `billing` null); `MenuDrawer` mantém o "Entrar" que o Clássico tinha no topbar; `SellerSheet` oferece "Não tenho preferência" no primeiro contato e "esquecer a escolha" na troca, e o reset chama `onClear`, não `onChoose`. |
| `resources/js/test/components/color-selection.test.tsx` | 8 | `interestMessage` cita a cor só quando há cor; `ColorSelector` não renderiza nada sem cor e chama `onSelect`; `ColorChipsInput`: Enter adiciona, duplicata case-insensitive ignorada, vírgula adiciona ao digitar, **colar lista separada por vírgula adiciona todas num evento só**, X remove. |
| `resources/js/test/components/plan-comparison.test.tsx` | 5 | A tabela nasce fechada (`<details>` sem `open`); renderiza 4 grupos × 3 planos a partir do array; âncoras vêm da copy validada contra os Anexos; célula ✓/— carrega texto para leitor de tela; sem módulo legal o rodapé cita o Termo **sem link**. |
| `resources/js/test/components/site-settings-sections.test.tsx` | 10 | `BannersSection`: contador de ativos, aviso de layout que some com Boutique no ar, **não desabilita nada com 3 ativos (o limite é do backend)**, estado vazio, dialog de criação com hint de imagem e construtor de link. `SellersSection`: lista com número mascarado e estado, escreve a regra do atendimento na tela, marca o modo atual no radio, avisa que sem vendedora tudo vai ao número padrão, abre o dialog. |
| `resources/js/test/hooks/use-permissions.test.ts` | 4 | Retorna funções falsas sem usuário autenticado e com usuário undefined; checa permissões corretamente; lida com arrays vazios. |
| `resources/js/test/hooks/use-settings-autosave.test.ts` | 6 | Salva **um campo por vez** como POST parcial (não o form inteiro); escalar não vira multipart, arquivo vira; ciclo `saving → saved` limpando o erro do campo; erro de validação guarda a mensagem; `onSaved` só quando o servidor confirma; `setFieldError` mostra e some sem bater no servidor. |
| `resources/js/test/landing-origin.test.tsx` | 14 | `sanitizeOriginValue` deixa passar só `[a-zA-Z0-9_-]`, trunca em 40 chars, devolve vazio para ausente; `originSuffix` compõe na ordem source/medium/campaign sanitizando antes; `messageWithOrigin` sem UTM devolve a mensagem **byte a byte**; `useLandingWhatsappHref` monta o href com número do config; o CTA sem UTM é o de sempre (zero regressão para o orgânico), com UTM leva a origem encodada, e **valor malicioso na URL não chega cru ao href**. |
| `resources/js/test/layouts/permissions/PermissionsGuard.test.tsx` | 5 | Renderiza com permissão ou role permitidos, bloqueia quando negados, renderiza quando nenhum dos dois é informado. |
| `resources/js/test/masks.test.ts` | 10 | `maskCpfCnpj`: formata como CPF até 11 dígitos, vira CNPJ a partir do 12º, sem separador solto no fim, **reaplica sobre valor já mascarado** (o `onChange` devolve o próprio valor), ignora lixo colado, apagar o último dígito volta ao formato de CPF, vazio continua vazio. `maskPhoneBR`: celular 11, fixo 10, reaplica e descarta o 12º. |
| `resources/js/test/meta-tracking.test.tsx` | 8 | `trackMetaEvent` é no-op silencioso sem snippet, dispara com parâmetros, manda `eventID` (dedupe com a CAPI) e **engole exceção do `fbq`**; `useMetaTracking` respeita `features.tracking`; o CTA de WhatsApp dispara `Lead` com `content_name` e com módulo off não dispara nada (o link segue funcionando). |
| `resources/js/test/signup-initiate-checkout.test.tsx` | 2 | `/assinar` dispara `InitiateCheckout` **uma vez** na abertura com o plano pré-selecionado; com módulo off a página abre sem evento. |
| `resources/js/test/utils.test.ts` | 6 | `cn()`: merge, classes condicionais, `undefined`/`null`, strings vazias, arrays, objetos com boolean. |

---

#### 8. Contagens por diretório (medidas)

**ctvitrine @ 53d7d9a**

| Diretório | Arquivos | Casos declarados |
|---|---|---|
| `tests/` (total, inclui `Pest.php`+`TestCase.php`) | 108 | 708 Pest + 13 PHPUnit = **721** |
| `tests/Feature/` (total) | 106 | 708 Pest + 13 PHPUnit |
| `tests/Feature/AiImage` | 3 | 20 |
| `tests/Feature/AiIntake` | 3 | 24 |
| `tests/Feature/AiStudio` | 7 | 56 |
| `tests/Feature/Auth` | 5 | 16 |
| `tests/Feature/Banner` | 1 | 19 |
| `tests/Feature/Billing` | 5 | 30 |
| `tests/Feature/Category` | 1 | 10 |
| `tests/Feature/Demo` | 5 | 27 |
| `tests/Feature/Docs` | 1 | 8 |
| `tests/Feature/Env` | 5 | 30 |
| `tests/Feature/Items` | 6 | 53 |
| `tests/Feature/Layout` | 5 | 47 |
| `tests/Feature/Legal` | 5 | 21 |
| `tests/Feature/Metrics` | 12 | 101 |
| `tests/Feature/Ops` | 8 | 55 |
| `tests/Feature/PermissionRole` | 2 | 6 |
| `tests/Feature/Permissions` | 3 | 17 |
| `tests/Feature/Seeders` | 3 | 13 |
| `tests/Feature/Seller` | 1 | 17 |
| `tests/Feature/Settings` | 2 | 7 |
| `tests/Feature/Signup` | 7 | 44 |
| `tests/Feature/Site` | 4 | 23 |
| `tests/Feature/SiteSettings` | 2 | 17 |
| `tests/Feature/Tracking` | 3 | 24 |
| `tests/Feature/User` | 2 | 14 |
| raiz de `tests/Feature/` (5 arquivos soltos) | 5 | 9 Pest + 13 PHPUnit |
| `tests/Unit`, `tests/Arch`, `tests/Browser`, `tests/Contract` | **0** | **0** |
| `resources/js/test/` (Vitest) | 14 | **92** (28 `describe`) |

Recursos de teste, medidos em `tests/`: `RefreshDatabase` em 57 arquivos (103 ocorrências), `Storage::fake` em 18 arquivos (93), `->artisan(` em 21 arquivos (109), `assertInertia` em 33 arquivos (104), `beforeEach(` em 35 arquivos (35), `Queue::fake` 4/16, `Mail::fake` 6/9, `Event::fake` 2/2, `Notification::fake` 1/3, `Bus::fake` **0**, `->with(` (datasets) 44 ocorrências.

**boilerplate @ origin/main** (para referência da coluna comparativa)

| Diretório | Arquivos | Casos |
|---|---|---|
| `tests/` (total) | 66 | 336 Pest + 13 PHPUnit = **349** |
| `tests/Arch` | 1 | 0 casos, **7 regras `arch()`** |
| `tests/Feature` (total) | 56 | 278 + 13 PHPUnit |
| `tests/Unit` (total) | 7 | 58 |
| `resources/js/test/` (Vitest) | 37 | **254** |

---

#### 9. Diff de cobertura conceitual — ctvitrine × boilerplate

Sobreposição de caminhos (medida por `comm` sobre os dois `ls-tree`): **17 caminhos PHP em comum**, **49 só no boilerplate**, **91 só no ctvitrine**. No frontend: **4 arquivos de teste em comum** (+`setup.ts` e `vitest.d.ts`), **10 só no ctvitrine**, **33 só no boilerplate**.

Os 17 caminhos comuns: `tests/Pest.php`, `tests/TestCase.php`, `Auth/{Authentication,EmailVerification,PasswordConfirmation,PasswordReset,Registration}Test`, `DashboardTest`, `HorizonAccessTest`, `HorizonDevelopmentScriptsTest`, `ImpersonateTest`, `Laravel13ConfigurationDefaultsTest`, `PermissionRole/{AssignRoleAllowlist,UpdateRolePermissionsInvalidatesUserCache}Test`, `Permissions/GetAllPermissionsTest`, `Settings/{PasswordUpdate,ProfileUpdate}Test`.

##### 9a. Classes de teste que existem no boilerplate e **não** no ctvitrine (49 arquivos)

| Classe de invariante | Caminhos no boilerplate (`origin/main`) | Existe no ctvitrine? |
|---|---|---|
| **Arquitetura (`arch()`)** — presets php+security, `App\Enum` só enums, controllers invokable, models estendem `Model`, VOs finais+strict, controllers sem facade `DB` | `tests/Arch/ArchTest.php` (7 regras) | **Não** — zero `arch()` |
| **Throttle e lockout de login** | `tests/Feature/Auth/AuthRouteThrottleTest.php` (9), `tests/Feature/Auth/LoginLockoutTest.php` (8) | **Não** |
| **Money / cast monetário** | `tests/Feature/Casts/MoneyCastTest.php` (4), `tests/Unit/MoneyTest.php` (18) | **Não** |
| **Comandos de console de RBAC** | `tests/Feature/Console/CreateSuperUserCommandTest.php` (9), `tests/Feature/Console/SyncPermissionsCommandTest.php` (5) | **Não** (o ctvitrine testa comandos, mas de domínio: `ai-studio:usage`, `billing:status`, `vitrine:env`, `demo:switch`, `items:prune-drafts`, `metrics:prune`, `photos:optimize`) |
| **Guarda de copy/terminologia do painel** — "Cargos" como termo único, nenhum rótulo caindo em termo abandonado, o enum carregando o rótulo até o banco, mensagens de senha/impersonation em pt-BR com concordância de gênero | `tests/Feature/CopyPainelTest.php` (8) | **Não** |
| **Middleware de usuário desativado** | `tests/Feature/EnsureUserIsActiveTest.php` (8) | **Não** |
| **Páginas de erro Inertia** — 404/500 em produção, 419 com flash, 500 de último recurso pintado com a aparência escolhida | `tests/Feature/ErrorPagesTest.php` (6) | **Não** |
| **Contrato de flash messages** — sobrevive a partial reload, não deixa resto na navegação seguinte, publica só as chaves setadas | `tests/Feature/FlashMessagesTest.php` (8) | **Não** |
| **Limite de 64 chars em identificador de índice (MySQL)** | `tests/Feature/Foundation/SchemaIdentifierLengthTest.php` (1) | **Não** |
| **Ordenação do stop de impersonation** | `tests/Feature/ImpersonateStopOrderingTest.php` (2) | **Não** |
| **Scrubbing de PII no log** — o que chega ao arquivo, canais fiados ao scrubber, model/collection no contexto, chave composta, chaves ambíguas | `tests/Feature/LogScrubbingTest.php` (7) | **Não** |
| **Allowlist de e-mail fora de produção** | `tests/Feature/Mail/EnforceMailAllowlistTest.php` (8) | **Não** |
| **Controllers de gestão de papéis/permissões** (7 arquivos além dos 2 comuns) | `tests/Feature/PermissionRole/{AssignRoleController,IndexController,PermissionCatalog,RevokeRoleController,RoleSelector,SyncPermissionsController,UpdateController}Test.php` (43 casos no diretório) | **Não** (o ctvitrine tem 6 casos nesse diretório) |
| **Cache de permissões: chave e refresh** | `tests/Feature/Permissions/PermissionCacheKeyTest.php` (4), `tests/Feature/Permissions/RefreshPermissionsCacheTest.php` (2) | **Não** (o ctvitrine só cobre invalidação por update de role) |
| **Tetos de policy** — teto de concessão de permissão e teto do `UserPolicy` | `tests/Feature/Policies/PermissionGrantCeilingTest.php` (15), `tests/Feature/Policies/UserPolicyCeilingTest.php` (18) | **Não** — o ctvitrine cobre a ideia parcialmente e só por rota (`DesapegoPermissionsTest`: "proprietário só atribui papéis abaixo do seu") |
| **Autorização declarada em TODA rota de escrita** (varredura do route list + allowlist de self-service) | `tests/Feature/Routes/WriteRoutesAuthorizationTest.php` (3) | **Não** |
| **Cabeçalhos de segurança** — baseline, HSTS/CSP só em produção, no-store em resposta autenticada | `tests/Feature/SecurityHeadersTest.php` (5) | **Não** |
| **Guarda de seeding de demo fora de local/testing** (`SEED_DEMO`, `SEED_ADMIN_PASSWORD`) | `tests/Feature/Seeders/GuardsDemoSeedingTest.php` (4) | **Parcial** — `tests/Feature/Seeders/ProductionSeedTest.php` cobre a mesma preocupação por outro caminho (não roda `UserSeeder` em produção, não cria usuário sem env) |
| **Contrato das shared props** — trava o conjunto inteiro de props globais e os campos do usuário autenticado | `tests/Feature/SharedPropsTest.php` (3) | **Não** — o ctvitrine testa props **por módulo** (`features.ai_image`, `features.signup`, `billing`, …) mas nunca o conjunto fechado |
| **Tradução/locale** — `pt_BR` default, defaults em `config/app.php`, mensagens de auth/validation/password traduzidas, **cobertura de toda regra de validação do framework** | `tests/Feature/TranslationTest.php` (6) | **Não** |
| **CRUD de usuário por controller single-action** (12 arquivos) | `tests/Feature/User/{Create,Destroy,Edit,GrantPermission,Index,RevokePermission,Show,ShowUserPermissions,Store,ToggleActive,Update}ControllerTest.php` + `UserResourceSensitiveCeilingTest.php` (63 casos) | **Não** — o ctvitrine tem 2 arquivos em `tests/Feature/User/` e ambos são **gate comercial** (assentos e plano), não CRUD |
| **Primitivos BR unitários** | `tests/Unit/Br/CpfFormatterTest.php` (5), `CpfHasherTest.php` (6), `PhoneNormalizerTest.php` (6) | **Não como unit** — o ctvitrine valida CPF/CNPJ dentro de `SignupStoreTest` (Feature) e normalização de telefone dentro de `MetaCapiTest` (dataset) |
| **Invariante de dialeto em migration** (proíbe SQL específico sem fallback sqlite declarado) | `tests/Unit/Database/MigrationDialectInvariantTest.php` (3) | **Não** |
| **Normalizador de query de listagem** | `tests/Unit/Support/Listing/ListQueryNormalizerTest.php` (15) | **Não** |
| **Background de tema inline** — literal (nunca variável CSS), sincronizado com o token de `app.css`, `color-scheme` declarado nos dois temas + meta | `tests/Unit/Theme/InlineThemeBackgroundTest.php` (5) | **Não** |

No frontend, os **33 arquivos Vitest só do boilerplate** cobrem classes ausentes no ctvitrine: `styles/focus-ring.test.ts`, `styles/theme-tokens.test.ts`, `vite-config.test.ts`, `components/link-button-nesting.test.ts`, `components/navigation-landmarks.test.tsx`, `components/ui/{confirm-dialog,date-input,form-field}.test.tsx`, `components/delete-confirmation-dialog.test.tsx`, `components/{currency-input,empty-state,impersonation-exit,input-error,masked-input}.test.tsx`, `components/data-table/{date-range-filter,search-bar}.test.tsx`, `components/permissions/permission-card.test.tsx`, `components/users/user-table-row.test.tsx`, `components/delete-user.test.tsx`, `hooks/{use-debounced-value,use-user-filters,use-user-permissions,use-user-search}.test.ts`, `lib/{flash,impersonation,impersonation-call-sites,resolve-inertia-page,toast-config}.test.*`, `utils/{data-table/date,data-table/query-params,masks,money,via-cep}.test.ts`.

##### 9b. Classes de teste que existem no ctvitrine e **não** no boilerplate (91 arquivos)

| Classe de invariante (só no ctvitrine) | Caminhos-âncora | Peso |
|---|---|---|
| **Contrato de feature-flag por módulo** — 1 `*ModeTest` por módulo + o invariante `enabled() === diagnostics()` com 40 cenários; padrão "config parcial = off silencioso", "typo → off", "módulo off responde 404, não 403" | `tests/Feature/Env/ModeDiagnosticsTest.php`, `Metrics/MetricsModeTest.php`, `Metrics/ReportModeTest.php`, `AiIntake/AiIntakeModeTest.php`, `AiImage/AiImageModeTest.php`, `AiStudio/AiStudioModeTest.php`, `Billing/BillingModeTest.php`, `Legal/TermsModeTest.php`, `Signup/SignupModeTest.php`, `Tracking/TrackingModeTest.php`, `Site/LandingPageTest.php` | 11 arquivos |
| **Guardas de sincronia `.env.example` ↔ config ↔ doc** (G1–G5) + o motor `EnvInventory` + o comando `vitrine:env` com asserts de não-vazamento de segredo no stdout | `tests/Feature/Env/{EnvExampleGuard,EnvDocs&nbsp;Guard,EnvInventory,VitrineEnvCommand}Test.php` | 4 arquivos / 29 casos |
| **Docs servidas dentro do app com RBAC** (render GFM, reescrita de links, link para grupo sem acesso vira texto puro) | `tests/Feature/Docs/DocsAccessTest.php` | 8 casos |
| **Integração externa faked de ponta a ponta**: Asaas, Ploi, Gemini, OpenAI, Meta Graph, API de ops própria — com `preventStrayRequests`, `Http::sequence`, retry/`Retry-After`, e **asserts explícitos de que o token não aparece em stdout, exceção nem HTML** | `tests/Feature/Ops/*`, `tests/Feature/Signup/*`, `tests/Feature/AiIntake/*`, `tests/Feature/Tracking/MetaCapiTest.php` | 9 arquivos com `Http::fake` |
| **Comandos de provisionamento com gate de produção "sem nenhuma chamada HTTP"**, `--resume` idempotente e estado parcial persistido | `tests/Feature/Ops/{ProvisionInstance,BillingSubscribe,ProvisionFromOrder,PloiClient,StubRender,MigrateStorage}Test.php` | 8 arquivos / 55 casos |
| **Webhooks idempotentes** (evento duplicado → 200 sem reprocessar; re-webhook não gera segundo e-mail nem segundo Purchase) | `Billing/BillingWebhookTest.php`, `Signup/SignupWebhookTest.php`, `Tracking/MetaCapiTest.php` | 3 arquivos |
| **Gates comerciais por plano** (assentos, gestão de usuários, corte de métricas, anexos do termo, tier de insights) | `User/PlanSeatsTest.php`, `User/UserManagementPlanGateTest.php`, `Metrics/MetricsNumbersPlanGateTest.php`, `Legal/TermsPlanAnnexTest.php`, `Metrics/MetricsInsightsTest.php` | 5 arquivos |
| **Aceite de contrato como gate de navegação** (redirect ao aceite, reaceite por bump de versão, comprovante enfileirado, hash do arquivo integral) | `tests/Feature/Legal/*` | 5 arquivos / 21 casos |
| **Suspensão de vitrine por inadimplência** (503 com `Retry-After`, admin ainda acessível, lojista vê preview) | `tests/Feature/Billing/VitrineSuspensionTest.php` | 6 casos |
| **Pipeline de mídia e faxina de arquivo** (otimização, órfãos, lixeira, referência legítima de arquivo, carência de job em voo) | `Items/{PhotoOptimization,PruneOrphanFiles,TrashHygiene}Test.php` | 3 arquivos / 26 casos |
| **Corridas job × usuário** — "o que a lojista digita DURANTE a análise não é sobrescrito", "rascunho descartado durante a análise não é ressuscitado", "revert durante a chamada não é sobrescrito pelo job", "gate reconferido no worker" | `AiStudio/DraftLifecycleTest.php`, `AiImage/ProcessPhotoBackgroundJobTest.php`, `Tracking/MetaCapiTest.php` | 3 arquivos |
| **Comandos de destravamento de estado preso** (`processing` órfão reparável **com o módulo desligado**) | `AiStudio/UnstickAiStatesCommandTest.php`, `AiStudio/ReanalyzeDraftTest.php` | 2 arquivos |
| **SEO da vitrine pública** (sitemap, robots com URL absoluta, meta OG, JSON-LD de Product, slug imutável) | `Site/{Sitemap,ShowItemPage,LandingPage}Test.php`, `Layout/BoutiquePropsTest.php` | 4 arquivos |
| **Dois layouts públicos com contrato de props e mass-assignment travado** | `Layout/{BoutiqueProps,SiteLayout,SellerRouting,UpdateLayout}Test.php` | 4 arquivos / 41 casos |
| **Instância de demonstração com switch de case reversível** (backup/restore, limpeza de resíduo, super usuário de apresentação, host canônico) | `Demo/*`, `Seeders/*`, `Layout/DemoLayoutTest.php` | 9 arquivos / 46 casos |
| **Domínio de métricas/analytics** (KPIs, funil, deltas com cobertura, bordas de fuso BRT, motor de insights com desempate determinístico e contrato de payload, texto do relatório byte a byte) | `tests/Feature/Metrics/*` | 12 arquivos / 101 casos |
| **Coleta anti-abuso** (bot 204 sem gravar, throttle 60/min, `session_hash` sem IP/UA persistido, retenção com `metrics:prune`) | `Metrics/MetricsTrackingTest.php` | 9 casos |
| **Auto-registro proibido** (`GET /register` → 404) — inverte o teste homônimo do boilerplate | `Auth/RegistrationTest.php` | 2 casos |

Frontend só do ctvitrine (10 arquivos): sanitização de UTM antes de compor href de WhatsApp (`landing-origin.test.tsx`), Meta Pixel com módulo off/on e exceção engolida (`meta-tracking.test.tsx`, `signup-initiate-checkout.test.tsx`), máscaras CPF/CNPJ/telefone reaplicáveis (`masks.test.ts`), autosave por campo (`use-settings-autosave.test.ts`), construtor de link de banner (`banner-link.test.ts`), chrome do layout Boutique (`boutique-chrome.test.tsx`), seleção de cor com colagem em lote (`color-selection.test.tsx`), tabela de comparação de planos ancorada nos Anexos (`plan-comparison.test.tsx`), seções de configuração de banners/vendedoras (`site-settings-sections.test.tsx`).

---

#### Medições

Todos os comandos abaixo foram executados; `$C` = `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `$B` = `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`.

```bash
# Inventário de arquivos
git -C $C ls-tree -r 53d7d9a --name-only -- tests                      # 108 linhas
git -C $C ls-tree -r 53d7d9a --name-only -- tests | grep -c '\.php$'   # 108
git -C $C ls-tree -r 53d7d9a --name-only | grep -Ei '\.(test|spec)\.(ts|tsx|js|jsx)$'  # 14
git -C $C ls-tree -r 53d7d9a --name-only -- resources/js/test | grep -cE '\.test\.'    # 14

# Casos por arquivo (padrão com aspas, para não contar `test()->actingAs(...)`)
for f in $(git -C $C ls-tree -r 53d7d9a --name-only -- tests/Feature); do
  n=$(git -C $C show 53d7d9a:$f | grep -cE "^[[:space:]]*(it|test)\(['\"]")
  w=$(git -C $C show 53d7d9a:$f | grep -cE -e "->with\(")
  echo "$f|$n|$w"
done

# Totais ctvitrine
git -C $C grep -c -E "^[[:space:]]*(it|test)\(['\"]" 53d7d9a -- tests | awk -F: '{s+=$NF} END {print s}'                  # 708
git -C $C grep -c -E "public function test_" 53d7d9a -- tests | awk -F: '{s+=$NF} END {print s}'                          # 13
git -C $C grep -c -E -e "->with\(" 53d7d9a -- tests | awk -F: '{s+=$NF} END {print s}'                                    # 44
git -C $C grep -c -E "^[[:space:]]*(it|test)\(['\"]" 53d7d9a -- resources/js/test | awk -F: '{s+=$NF} END {print s}'       # 92
git -C $C grep -c -E "^[[:space:]]*describe\(" 53d7d9a -- resources/js/test | awk -F: '{s+=$NF} END {print s}'             # 28

# Por diretório (ctvitrine) — o loop que gerou a tabela da seção 8
for d in $(git -C $C ls-tree -r 53d7d9a --name-only -- tests/Feature | xargs -n1 dirname | sort -u); do
  f=$(git -C $C ls-tree -r 53d7d9a --name-only -- $d | grep -c '\.php$')
  c=$(git -C $C grep -c -E "^[[:space:]]*(it|test)\(['\"]" 53d7d9a -- $d | awk -F: '{s+=$NF} END {print s+0}')
  echo "$d files=$f cases=$c"
done

# Arch no ctvitrine
git -C $C grep -n "arch(" 53d7d9a -- tests        # 1 linha, falso positivo em MetricsStrategyTest.php:148

# Http::fake
git -C $C grep -l "Http::fake" 53d7d9a -- tests | wc -l   # 9

# Recursos de teste (o loop que gerou os números do fim da seção 8)
for p in Queue::fake Mail::fake Notification::fake Storage::fake Event::fake Bus::fake \
         "Http::preventStrayRequests" travelTo freezeTime testTime RefreshDatabase "artisan(" "config()->set('vitrine"; do
  printf "%-28s files=%s hits=%s\n" "$p" \
    "$(git -C $C grep -l -F -e "$p" 53d7d9a -- tests | wc -l)" \
    "$(git -C $C grep -c -F -e "$p" 53d7d9a -- tests | awk -F: '{s+=$NF} END {print s+0}')"
done
# => Queue::fake 4/16 · Mail::fake 6/9 · Notification::fake 1/3 · Storage::fake 18/93
#    Event::fake 2/2 · Bus::fake 0/0 · Http::preventStrayRequests 5/17
#    travelTo 0/0 · freezeTime 0/0 · testTime 0/0 · RefreshDatabase 57/103
#    artisan( 21/109 · config()->set('vitrine 50/377
git -C $C grep -c -E "^beforeEach\(" 53d7d9a -- tests | awk -F: '{s+=$NF} END {print s}'   # 35 (35 arquivos)
git -C $C grep -c -F -e "assertInertia" 53d7d9a -- tests | awk -F: '{s+=$NF} END {print s}' # 104 (33 arquivos)

# Cenários do ModeDiagnosticsTest
git -C $C show 53d7d9a:tests/Feature/Env/ModeDiagnosticsTest.php | grep -cE "^[[:space:]]{8}'[^']+' => \["   # 40

# Helpers locais
git -C $C grep -n -E "^function [a-zA-Z]" 53d7d9a -- tests/Feature   # 86 linhas

# Guardas ausentes (0 arquivos cada, exceto "contrast" que é falso positivo em MetricsStrategyTest.php:148)
for p in "lang/" "__(" "trans(" contrast contraste SchemaIdentifier Identifier \
         security_headers Content-Security-Policy X-Frame-Options focus-ring theme-token; do
  printf "%-28s %s\n" "$p" "$(git -C $C grep -l -F -e "$p" 53d7d9a -- tests resources/js/test | wc -l)"
done

# Totais boilerplate (SEMPRE via -C $B e origin/main)
git -C $B ls-tree -r origin/main --name-only -- tests | grep -c '\.php$'                                                    # 66
git -C $B grep -c -E "^[[:space:]]*(it|test)\(['\"]" origin/main -- tests | awk -F: '{s+=$NF} END {print s}'                # 336
git -C $B grep -c -E "public function test_" origin/main -- tests | awk -F: '{s+=$NF} END {print s}'                        # 13
git -C $B grep -c -E "^arch\(" origin/main -- tests | awk -F: '{s+=$NF} END {print s+0}'                                    # 7
git -C $B ls-tree -r origin/main --name-only -- resources/js/test | grep -cE '\.test\.'                                     # 37
git -C $B grep -c -E "^[[:space:]]*(it|test)\(['\"]" origin/main -- resources/js/test | awk -F: '{s+=$NF} END {print s}'    # 254

# Overlap de caminhos (comm sobre os dois ls-tree, ordenados)
comm -12 ct.txt bp.txt | wc -l   # 17 (PHP em comum)
comm -13 ct.txt bp.txt | wc -l   # 49 (só boilerplate)
comm -23 ct.txt bp.txt | wc -l   # 91 (só ctvitrine)
comm -13 ctjs.txt bpjs.txt | wc -l   # 33 (JS só boilerplate)
comm -23 ctjs.txt bpjs.txt | wc -l   # 10 (JS só ctvitrine)
```

Não medido (declarado como tal): número de casos **expandidos em runtime** pelos 44 datasets — a suíte não foi executada.

---

### Frente 8 — CI, ops, scripts, stubs, docs, specs, docs de agente, i18n

Fonte: `ctvitrine` @ `53d7d9a` (1053 arquivos versionados). Alvo: `boilerplate` @ `origin/main` (719 arquivos). Dos 478 caminhos que existem nos dois, **306 têm blob idêntico e 172 divergem** (medição no bloco final). Todos os valores de segredo/identificador foram substituídos por `***`.

---

#### 1. `.github/workflows/` — 2 workflows

| Caminho | Gatilhos | Jobs | Barra o quê |
|---|---|---|---|
| `.github/workflows/ci.yml` | `push` e `pull_request` em `main`/`develop` | `frontend` → `backend` (needs frontend) → `quality`, `rector` | tipo/lint/format/vitest/build; composer validate + pest; pint --test |
| `.github/workflows/semgrep.yml` | `pull_request`, `push` (main/develop), `schedule` cron `17 5 * * *`, `workflow_dispatch` | `semgrep` (container `semgrep/semgrep`, `if: github.actor != 'dependabot[bot]'`) | achados do `semgrep ci`; publica SARIF em artifact + Code Scanning |

Detalhe medido de `ci.yml` (ctvitrine):

| Item | ctvitrine `53d7d9a` | boilerplate `origin/main` |
|---|---|---|
| Actions pinadas por SHA | **13/13 em `ci.yml`, 3/3 em `semgrep.yml`** | idem (SHAs mais novos) |
| `actions/checkout` | `@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4.3.1` | `@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` |
| `actions/setup-node` | `@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0` | `@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0` |
| `actions/cache` | `@0057852bfaa89a56745cba8c7296529d2fc39830 # v4.3.0` | `@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0` |
| `shivammathur/setup-php` | `@f3e473d116dcccaddc5834248c87452386958240 # v2.37.2` | **mesmo SHA** |
| `actions/upload-artifact` (semgrep) | `@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2` | `@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1` |
| `github/codeql-action/upload-sarif` | `@411c4c9a36b3fca4d674f06b6396b2c6d23522c6 # v3` | `@5595ccaf912efad79be6eef63a5619ff05969be3 # v3` |
| Node da matriz | `22` | `24` |
| pnpm via corepack | `pnpm@11.5.3` | `pnpm@11.19.0` |
| `concurrency` / `cancel-in-progress` | **ausente** | presente (`ci-${{ github.workflow }}-${{ github.ref }}`) |
| Job `security` (composer audit + pnpm audit) | **ausente** | presente |
| Serviço MySQL 8 + gate `php artisan migrate --force` em MySQL | **ausente** (suíte só SQLite) | presente |
| Cache `node_modules/.vite` | **ausente** | presente |
| PHPStan/larastan no job `quality` | **ausente** | `composer ci:stan` |
| `extensions` do setup-php (backend) | `sqlite, pdo_sqlite` | `sqlite, pdo_sqlite, pdo_mysql` |
| Job `rector` | `continue-on-error: true` (não bloqueia) | idêntico em intenção |

`.github/` do ctvitrine **não tem** `ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md` nem `dependabot.yml` — os três existem no boilerplate (`.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/dependabot.yml`).

---

#### 2. Espelhos de skills — `.github/skills`, `.cursor/skills`, `.agents/skills`, `.codex/skills`

**Fato central medido:** os três diretórios `.github/skills`, `.cursor/skills` e `.agents/skills` têm **29 arquivos cada e são byte-a-byte idênticos entre si** — ao juntar os três `ls-tree` e normalizar o prefixo, 87 linhas colapsam em **29 pares (hash, caminho) distintos**. São cópias literais geradas pelo Laravel Boost a partir de `boost.json` → `"agents": ["cursor","codex","copilot"]`. Não há "fonte de verdade" versionada dentro do repo: a fonte é o pacote `laravel/boost` (`^2.4` no `composer.json`), e o repo carrega o output replicado.

Conteúdo dos 29 (mesmo em cada espelho, `<E>` = `.github/skills` | `.cursor/skills` | `.agents/skills`):

| Caminho (em cada um dos 3 espelhos) | Blob |
|---|---|
| `<E>/configuring-horizon/SKILL.md` | `68477acd28bbca21593565d29e05ee0b725db78e` |
| `<E>/configuring-horizon/references/metrics.md` | `7e1aea6bb83e14a3f0da76fd2c781b4f43621709` |
| `<E>/configuring-horizon/references/notifications.md` | `d6d3feed9bbb94becc634c77c22b206df0f02de7` |
| `<E>/configuring-horizon/references/supervisors.md` | `b71285cfd66bc42c1d56496c401200ace96579f0` |
| `<E>/configuring-horizon/references/tags.md` | `8234e4adb3d467d4df35b931bb4f72a2a7ad9d03` |
| `<E>/inertia-react-development/SKILL.md` | `813e62f6684f525f68d89101c220b34f368cd5a2` |
| `<E>/laravel-best-practices/SKILL.md` | `965e267e1dda34ab2d5bb92f82a1db248f783ebf` |
| `<E>/laravel-best-practices/rules/advanced-queries.md` | `f12876e4c16a27a6498ad1575e0036af840f0511` |
| `<E>/laravel-best-practices/rules/architecture.md` | `51c6e65dc76c47d185447f8a1c4486fbb42cce75` |
| `<E>/laravel-best-practices/rules/blade-views.md` | `5f0b3a1e3054f53430d9911f75ef26a7e83ccb29` |
| `<E>/laravel-best-practices/rules/caching.md` | `67408d6e1bce6869dabed11d151bc8bcafb42c82` |
| `<E>/laravel-best-practices/rules/collections.md` | `18e8d9e1d5e6ca759c5a1f5bb631fbcf47213269` |
| `<E>/laravel-best-practices/rules/config.md` | `9bea727b39d5b3e32b92c2d240cd4eddfbb07399` |
| `<E>/laravel-best-practices/rules/db-performance.md` | `c49ba164ead209974781a855de2fe1125307b33e` |
| `<E>/laravel-best-practices/rules/eloquent.md` | `413d5da420ea8bab672b8f5f5b4b1fb0b08695d8` |
| `<E>/laravel-best-practices/rules/error-handling.md` | `4b14866766a3df40e7126ff2e13140078e125890` |
| `<E>/laravel-best-practices/rules/events-notifications.md` | `82e329e8f567680792029dd85ada1ada4c108571` |
| `<E>/laravel-best-practices/rules/http-client.md` | `8e2f16e8a4a14cf44f2cbf607d2030412a48cf91` |
| `<E>/laravel-best-practices/rules/mail.md` | `7c717336d0dc505cea19bd362c6c11353c6a19c7` |
| `<E>/laravel-best-practices/rules/migrations.md` | `df6f5f33c446584396d578e4c73878f14ac1ee40` |
| `<E>/laravel-best-practices/rules/queue-jobs.md` | `c41915e2b5423bb03ec63c325299da7207d9ff9f` |
| `<E>/laravel-best-practices/rules/routing.md` | `b6e30864f971b5df3f65edbecc2ca185cd92dbb9` |
| `<E>/laravel-best-practices/rules/scheduling.md` | `a984794500eeb2ae4dc6ee774a7a7153ea2b5467` |
| `<E>/laravel-best-practices/rules/security.md` | `2d7200c298ff7aeb0e674467853601b9672fad77` |
| `<E>/laravel-best-practices/rules/style.md` | `64d173081e8db2fc8bd8774408653c25e87c1ec5` |
| `<E>/laravel-best-practices/rules/testing.md` | `4fbf12f8ad99e3fa0558de079b316c9baa9c08bb` |
| `<E>/laravel-best-practices/rules/validation.md` | `5fde1064a20fea505570990fdd18400c908e678d` |
| `<E>/pest-testing/SKILL.md` | `ab271616504874f028df55fc3da6c52846068e73` |
| `<E>/tailwindcss-development/SKILL.md` | `c0cb2fbcd85039a257f97fd1ba0641ed2e2ce8d3` |

`.codex/skills` do ctvitrine tem **apenas 3 arquivos**, e os três **divergem** dos espelhos acima (geração anterior, não sincronizada):

| Caminho | Blob (ctvitrine) | Blob correspondente nos outros 3 espelhos | vs. boilerplate |
|---|---|---|---|
| `.codex/skills/inertia-react-development/SKILL.md` | `dcd104f9a9516f3b02a013fdb64aa2f4b75ddb2e` (368L) | `813e62f6…` | difere do bp (524L, 311 linhas de diff) |
| `.codex/skills/pest-testing/SKILL.md` | `67455e7e6af57a217d29326d534c11f7a22f24f6` (173L) | `ab271616…` | difere do bp (166L, 70 linhas de diff) |
| `.codex/skills/tailwindcss-development/SKILL.md` | `12bd896bb3cfaa2db6cab1997b76e46c960fc6c3` (123L) | `c0cb2fbc…` | difere do bp (119L, 51 linhas de diff) |

O boilerplate tem **31 arquivos em `.codex/skills`** (inclui `configuring-horizon/*`, `laravel-best-practices/*` e a skill `infer-conventions`), além de `.codex/config.toml` — nada disso existe no ctvitrine.

Comparação dos 29 espelhados contra o boilerplate: **24 dos 29 são idênticos**; 5 divergem, e a divergência é a mesma nos três espelhos:

| Caminho (×3 espelhos) | ctvitrine | boilerplate | linhas de diff |
|---|---|---|---|
| `…/laravel-best-practices/SKILL.md` | 190L | 59L | 207 |
| `…/laravel-best-practices/rules/architecture.md` | 202L | 202L | 2 |
| `…/laravel-best-practices/rules/eloquent.md` | 148L | 150L | 6 |
| `…/laravel-best-practices/rules/security.md` | 198L | 198L | 2 |
| `…/laravel-best-practices/rules/style.md` | 125L | 125L | 2 |

Skills que existem no boilerplate e **não** no ctvitrine: `infer-conventions/SKILL.md` + `infer-conventions/references/checklist.md`, nos 4 espelhos do boilerplate (`.agents`, `.codex`, `.cursor`, `.github`) e em `.claude/skills/` (que o ctvitrine não tem).

---

#### 3. `.cursor/rules/` — 13 `.mdc` + `.cursor/mcp.json`

`.cursor/mcp.json` é **idêntico** ao do boilerplate. Dos 13 `.mdc`, **12 são idênticos** ao boilerplate; só `laravel-boost.mdc` diverge.

| Caminho | Linhas | Escopo | Assunto |
|---|---|---|---|
| `.cursor/rules/activitylog-auditing.mdc` | 29 | `alwaysApply: true` | padrão de auditoria com `spatie/laravel-activitylog` |
| `.cursor/rules/formatting-and-checks.mdc` | 24 | `alwaysApply: true` | padrão de finalização: formatar + rodar checks antes de encerrar tarefa |
| `.cursor/rules/github-actions-ci-php.mdc` | 12 | glob `.github/workflows/**/*.yml` | padrões de CI PHP/Composer |
| `.cursor/rules/github-actions-ci-pnpm.mdc` | 13 | glob `.github/workflows/**/*.yml` | padrões de CI pnpm/Corepack |
| `.cursor/rules/js-dependency-policy.mdc` | 12 | glob `resources/js/**/*.{ts,tsx}` | import direto tem de estar declarado no `package.json` |
| `.cursor/rules/laravel-13-context.mdc` | 28 | `alwaysApply: true` | contexto de upgrade Laravel 13 e pacotes temporários |
| `.cursor/rules/laravel-boost.mdc` | 283 | `alwaysApply: true` | **divergente** — dump das guidelines do Boost |
| `.cursor/rules/mcp-instructions.mdc` | 4 | `alwaysApply: true` | metodologia `context7 → sequential-thinking → MCP-compass` nessa ordem |
| `.cursor/rules/node-scripts-error-handling.mdc` | 44 | glob `scripts/**/*.{js,mjs,cjs,ts,mts,cts}` | robustez de `execFileSync`/ferramentas externas |
| `.cursor/rules/react-conditional-redundancy.mdc` | 19 | glob `resources/js/**/*.tsx` | evitar condições redundantes em TSX |
| `.cursor/rules/semgrep-code-scanning.mdc` | 12 | glob `.github/workflows/semgrep.yml` | Semgrep deve publicar SARIF no Code Scanning |
| `.cursor/rules/testing-realistic-coverage.mdc` | 33 | `alwaysApply: true` | proibir teste trivial; cobertura de caso real |
| `.cursor/rules/ui-ux-consistency.mdc` | 23 | glob `resources/**/*.{ts,tsx,css}` | design system, legibilidade, dark mode |

---

#### 4. Deriva interna das docs de agente do ctvitrine (fato)

Os três artefatos gerados pelo Boost no ctvitrine **discordam entre si sobre a versão do Inertia**, o que fixa gerações diferentes do gerador no mesmo commit:

| Caminho | Versão do Inertia declarada | Versão do Pest declarada | Linhas |
|---|---|---|---|
| `AGENTS.md` | `inertiajs/inertia-laravel (INERTIA_LARAVEL) - v3` + bloco `# Inertia v3` com `useHttp`, `Inertia::optional()`, `router.cancelAll()` | v4 | 207 |
| `.github/copilot-instructions.md` | `inertiajs/inertia-laravel (INERTIA) - v2` + bloco `=== inertia-laravel/v2 rules ===` | v4 | 280 |
| `.cursor/rules/laravel-boost.mdc` | `(INERTIA) - v2` + `=== inertia-laravel/v2 rules ===` | v4 | 283 |

O `composer.json` do ctvitrine pede `"inertiajs/inertia-laravel": "^3.0"` — ou seja, **2 dos 3 arquivos estão desatualizados frente ao próprio lock do projeto**. `AGENTS.md` é o único regenerado pelo Boost novo (lista `laravel/horizon (HORIZON) - v5`, `laravel/boost (BOOST) - v2`, `laravel/pail (PAIL) - v1`, manda `vendor/bin/pint --dirty --format agent`, `php artisan list` em vez de `list-artisan-commands`, e `herd` CLI). Os outros dois ainda mandam `list-artisan-commands` e `vendor/bin/pint --dirty`.

Contra o boilerplate: `AGENTS.md` do bp tem 280L (mesma geração antiga do copilot-instructions) e declara `pestphp/pest (PEST) - v5`, `inertia v3`, `php - 8.4.17`. Nenhum dos dois `AGENTS.md` tem seção escrita à mão do projeto — os dois são 100% dump do Boost.

---

#### 5. `AGENTS.md`, `CLAUDE.md`, `COWORK.md`, `HANDOFF.md`, `boost.json`

| Caminho | Bytes | Linhas | O que estabelece | Existe no bp? |
|---|---|---|---|---|
| `AGENTS.md` | 11174 | 207 | dump `<laravel-boost-guidelines>`: versões da stack, ativação de skills, regras PHP/Herd/tests/Inertia/Laravel/Pint/Pest | sim, **divergente** |
| `CLAUDE.md` | 10601 | 177 | guia escrito à mão: produto, comandos, **padrão de módulos ativáveis** (5 passos), gate por plano `VITRINE_PLAN`, convenções PHP/front/testes, fluxo de commit, "regra de sincronia (fato copiado apodrece)" | sim, **divergente** (bp é sobre boilerplate) |
| `COWORK.md` | 15624 | 258 | **não existe no bp** — ver §5.1 | não |
| `HANDOFF.md` | 63422 | 910 | **não existe no bp** — ver §5.2 | não |
| `boost.json` | 364 | 19 | `agents: [cursor, codex, copilot]`, `skills: [laravel-best-practices, configuring-horizon, pest-testing, inertia-react-development, tailwindcss-development]`, `cloud:false, guidelines:true, herd_mcp:true, mcp:true, sail:false` | sim, **divergente**: bp acrescenta `"claude_code"` em `agents`, `"nightwatch": false` e a skill `infer-conventions` |

**5.1 — O método que `COWORK.md` codifica.** É a *fonte versionada* do campo *Instructions* de um projeto de chat externo (Claude). O arquivo abre com uma instrução operacional: "cole a partir de *Seu papel*" e, antes disso, **anexe como arquivos do projeto** `CLAUDE.md`, `marketing/ctvitrine-playbook.md`, `HANDOFF.md`, `docs/tecnico/*.md` e a spec da fase corrente. A tese explícita é *"fato copiado apodrece"*: instrução colada congela, arquivo anexado se atualiza. Estrutura:

- **Papel tríplice** do agente `@cowork`: parceiro de produto/consultor sênior, autor de specs para o `@code`, dono de materiais/design/PDF.
- **Tabela "fonte da verdade"** (assunto → quem manda → o que nunca fazer): preço → `marketing/ctvitrine-playbook.md` / nunca citar de memória; convenção e commit → `CLAUDE.md`; env/módulo/default → `config/vitrine.php`; estado de fase → `HANDOFF.md`; detalhe de módulo → `docs/tecnico/`.
- **Regra de precedência:** "se algo nestas instruções conflitar com um arquivo anexado, o arquivo vence — e me avise que a instrução está velha."
- **Bloco comercial marcado como volátil e datado**, com o motivo escrito: a versão anterior das instruções passou meses afirmando um plano que não existia mais.
- **Divisão de trabalho** em 3 donos (`@cowork`, `@cristiano`, `@code`) e a regra "não commite arquivo de outro dono".
- **Formato de resposta obrigatório:** suposição crítica explícita; UMA recomendação principal com passos; no máximo 2–3 alternativas com pró/contra de uma linha; ordem de prioridade `correção > segurança > performance > manutenibilidade > escalabilidade`; spec para o `@code` "extremamente detalhada" com testes Pest e o que **não** fazer.

**5.2 — O método que `HANDOFF.md` codifica.** É a **fila única de passagem de bastão**, com 910 linhas e 63 KB. Cabeçalho define: 3 donos (`@cowork`/`@cristiano`/`@code`), 3 estados (`[ ]` a fazer, `[~]` em andamento, `[x]` feito → mover ao histórico), item novo entra no topo da seção do dono. Seções (linhas medidas):

| Linha | Seção |
|---|---|
| 23 | `## Pendências abertas` |
| 25 | `### @cowork` |
| 71 | `### @cristiano (decisões)` |
| 281 | `### @code` |
| 373 | `## Histórico (feito)` — 17 blocos datados, do mais recente (`2026-08-04`) ao mais antigo (`2026-07-25`) |

O mecanismo mais específico é a **regra de sincronia com projetos de chat**, escrita no cabeçalho e repetida em `CLAUDE.md`: mexeu em preço, env, papel, posicionamento ou estado de fase, o `@code` atualiza `COWORK.md`/`marketing/instrucoes-chatgpt-instagram.md` **e** abre um item `@cowork` aqui pedindo o *re-colar*, porque editar o `.md` não altera o projeto de chat que já roda. Itens abertos referenciam artefatos por caminho (`resources/legal/`, `scripts/legal/gerar-pdf.py`, `public/img/mock/…`, `specs/fix-landing-whatsapp-e-origem.md`) e carregam decisão jurídica/infra como bloqueio nominal de deploy (ex.: "não ligue `VITRINE_TRACKING_MODE=live`" enquanto a política v1.5 não for revisada; o pixel ID aparece literal no arquivo, aqui `***`).

---

#### 6. `scripts/` — 4 arquivos

| Caminho | Linhas | O que faz | Quem chama | vs. bp |
|---|---|---|---|---|
| `scripts/format/format-dirty.mjs` | — | formata só os arquivos sujos do git via prettier | `composer format` (`"pnpm -s run format:dirty"`) e `package.json` → `"format:dirty"` | **blob idêntico** |
| `scripts/git/get-issue-id.sh` | — | extrai o ID de issue do nome da branch | `.husky/commit-msg` e `.husky/prepare-commit-msg` (via `$REPO_ROOT/scripts/git/get-issue-id.sh`) | **blob idêntico** |
| `scripts/deploy/deploy.sh` | — | deploy Ploi do site principal: re-exec de cópia estável em `mktemp` (porque `git reset --hard` sobrescreve o próprio script em voo), `artisan down` → fetch/reset → `install -d` de `bootstrap/cache` e `storage/framework/*` → `composer install --no-dev` → `storage:link` → `npx -y pnpm@11.5.3 install --frozen-lockfile --prod=false` → `rm -rf public/build` → `build` → `migrate --force` → `db:seed --class=***Seeder --force` → `optimize` → `queue:restart` → `schedule:interrupt` → reload/restart `php8.4-fpm` via `sudo -n systemctl` → `artisan up`; `trap cleanup EXIT` garante `artisan up`; loga em `deploy.log` via `tee` | campo "Deploy script" do Ploi (uso documentado no cabeçalho) | **só no ctvitrine** |
| `scripts/legal/gerar-pdf.py` | 177 | gera os PDFs do Termo de Adesão e da Política de Privacidade a partir dos `.md` de `resources/legal/` (fonte de verdade — "os bytes são o contrato"); markdown→HTML com renderer mínimo próprio, impressão via Chrome headless (`/Applications/Google Chrome.app/…`), CSS `@page A4`; nome do PDF carrega a versão lida do cabeçalho do próprio texto | manual (`python3 scripts/legal/gerar-pdf.py`), citado como pendência no `HANDOFF.md` | **só no ctvitrine** |

O boilerplate tem 3 scripts: os dois idênticos acima + `scripts/migration/status.sh` (inexistente no ctvitrine).

---

#### 7. `stubs/` — 56 arquivos (54 compartilhados + 2 de ops)

**Os 54 stubs compartilhados com o boilerplate têm blob IDÊNTICO — zero divergência.** São: `cast.inbound.stub`, `cast.stub`, `class.invokable.stub`, `class.stub`, `console.stub`, `controller.api.stub`, `controller.invokable.stub`, `controller.model.api.stub`, `controller.model.stub`, `controller.nested.api.stub`, `controller.nested.singleton.api.stub`, `controller.nested.singleton.stub`, `controller.nested.stub`, `controller.plain.stub`, `controller.singleton.api.stub`, `controller.singleton.stub`, `controller.stub`, `enum.backed.stub`, `enum.stub`, `event.stub`, `factory.stub`, `job.queued.stub`, `job.stub`, `listener.queued.stub`, `listener.stub`, `listener.typed.queued.stub`, `listener.typed.stub`, `mail.stub`, `markdown-mail.stub`, `markdown-notification.stub`, `middleware.stub`, `migration.create.stub`, `migration.stub`, `migration.update.stub`, `model.pivot.stub`, `model.stub`, `notification.stub`, `observer.plain.stub`, `observer.stub`, `pest.stub`, `pest.unit.stub`, `policy.plain.stub`, `policy.stub`, `provider.stub`, `request.stub`, `resource-collection.stub`, `resource.stub`, `rule.stub`, `scope.stub`, `seeder.stub`, `test.stub`, `test.unit.stub`, `trait.stub`, `view-component.stub` (todos com prefixo `stubs/`).

`stubs/ops/` (2 arquivos, **só no ctvitrine**) — templates de provisioning multi-instância no Ploi, consumidos por `app/Console/Commands/Ops/ProvisionInstanceCommand.php`:

| Caminho | O que é |
|---|---|
| `stubs/ops/deploy-script.stub` | script de deploy **por instância**, com placeholders `{{SITE_DIRECTORY}}` e `{{BRANCH}}`. Difere do `scripts/deploy/deploy.sh` em pontos comentados no próprio arquivo: (a) **sem** `exec > >(tee …)` — a substituição de processo engolia a captura de log do painel Ploi; (b) `pnpm` via `npx -y pnpm@11.5.3` porque o servidor não tem pnpm no PATH; (c) seed guardado por **sentinela** `storage/app/.provisioned` (o `UserSeeder` não é idempotente); (d) `artisan horizon:terminate` em vez de `queue:restart`; (e) `trap - EXIT` antes do `artisan up` final |
| `stubs/ops/instance.env.stub` | `.env` completo de uma instância, todo em placeholders `{{…}}` (`{{APP_KEY}}`, `{{DB_PASSWORD}}`, `{{AWS_SECRET_ACCESS_KEY}}`, `{{RESEND_KEY}}`, `{{OPENAI_API_KEY}}`, `{{GEMINI_API_KEY}}`, `{{VITRINE_STAFF_PASSWORD}}`, `{{VITRINE_SUPER_PASSWORD}}` — nenhum valor real no arquivo). Blocos: App/Laravel, `INERTIA_SSR_ENABLED=false` com justificativa escrita (SSR ligado sem servidor SSR derruba o worker → 502 na área logada), log, DB MySQL, sessão, object storage (`public` local × `s3`/R2 com bucket compartilhado isolado por `AWS_ROOT={slug}`), Redis+Horizon, SMTP Resend, sementes de identidade da loja, gate de plano `VITRINE_PLAN`, modos por módulo (`VITRINE_METRICS_MODE`, `VITRINE_REPORT_MODE`, `VITRINE_AI_*`), chaves de IA e `VITRINE_BILLING_MODE` |

---

#### 8. `docs/` — 18 arquivos (README + 14 técnicos + 3 de usuário)

Mecanismo: `docs/` **é servido dentro da aplicação**, com descoberta automática por glob — `app/Services/Docs/DocsRepository.php` (único arquivo que faz `base_path('docs…')`), rotas em `routes/web.php:145-152` (`docs.index` → `Docs\IndexController`, `docs/{group}/{page}` → `Docs\ShowController`). Título da página = 1º `#` do arquivo; `usuario/` para toda a equipe da loja, `tecnico/` só para `super_user`. Ou seja: **um `.md` novo em `docs/` vira página visível ao cliente**.

| Caminho | Linhas | Assunto (1º `#`) |
|---|---|---|
| `docs/README.md` | 69 | Documentação — ctvitrine (índice + visão de produto) |
| `docs/tecnico/01-arquitetura.md` | 194 | Arquitetura e stack |
| `docs/tecnico/02-papeis-e-permissoes.md` | 125 | Papéis e permissões (RBAC) |
| `docs/tecnico/03-modulo-metricas.md` | 350 | Módulo de métricas (Fase 3) |
| `docs/tecnico/04-instancia-demo.md` | 164 | Instância de demonstração (coringa) |
| `docs/tecnico/05-operacao-e-comandos.md` | 161 | Operação e comandos |
| `docs/tecnico/06-modulos-de-ia.md` | 127 | Módulos de IA (Fases 4, 6 e 7) |
| `docs/tecnico/07-relatorio-mensal.md` | 144 | Relatório mensal no WhatsApp (Fase 9) |
| `docs/tecnico/08-provisioning-instancias.md` | 328 | Provisioning de instâncias via ploi (Fase 10) |
| `docs/tecnico/09-billing-automacao.md` | 107 | Ativação de cobrança via API do Asaas (Fase 11) |
| `docs/tecnico/10-adesao-self-service.md` | 171 | Adesão self-service pela landing (Fase 16) |
| `docs/tecnico/11-termo-e-aceite.md` | 153 | Termo de Adesão e aceite click-wrap (Fase 15) |
| `docs/tecnico/12-variaveis-de-ambiente.md` | 356 | Variáveis de ambiente |
| `docs/tecnico/13-implementando-um-modulo.md` | 232 | Implementando um módulo (o padrão da casa) |
| `docs/tecnico/14-tracking-meta.md` | 101 | Tracking Meta: Pixel + Conversions API (Fase 18) |
| `docs/usuario/01-vitrine-publica.md` | 73 | O site da sua loja |
| `docs/usuario/02-area-administrativa.md` | 87 | O painel da loja |
| `docs/usuario/03-metricas.md` | 94 | Métricas da vitrine |

Nenhum desses 18 caminhos existe no boilerplate. O `docs/` do boilerplate (15 arquivos) é outra coisa: `docs/adr/0001-rbac-proprio.md` … `0006-error-tracking-sentry.md` + `docs/adr/README.md`, e `docs/migration/PLAYBOOK.md` + `docs/migration/projects/{ctfinance,ctjuris,ctvitrine,cuidari,sorteiopix,spinmax,transitado-em-julgado}.md`.

---

#### 9. `specs/` — 28 arquivos (nenhum existe no boilerplate)

| Caminho | Linhas | Assunto |
|---|---|---|
| `specs/fase-1-vitrine-compartilhavel.md` | 154 | Vitrine compartilhável, branding configurável e SEO |
| `specs/fase-2-categorias-dinamicas.md` | 90 | Categorias dinâmicas |
| `specs/fase-3-metricas-reais.md` | 294 | Métricas reais da vitrine (módulo ativável por cliente) |
| `specs/fase-4-cadastro-por-foto-ia.md` | 171 | Cadastro por foto com IA (módulo ativável) |
| `specs/fase-5-cobranca-asaas.md` | 144 | Cobrança recorrente via Asaas (módulo ativável) |
| `specs/fase-6-foto-estudio-ia.md` | 150 | Fundo estúdio por IA (módulo ativável) |
| `specs/fase-7-cadastro-ia-first.md` | 126 | Cadastro IA-first (módulo "Estúdio IA") |
| `specs/fase-8-landing-page.md` | 151 | Landing page de marketing (módulo ativável, instância própria) |
| `specs/fase-9-relatorio-mensal-whatsapp.md` | 163 | Relatório mensal no WhatsApp (módulo ativável) |
| `specs/fase-10-provisioning-instancias.md` | 176 | Provisioning automatizado de instâncias (API do ploi) |
| `specs/fase-11-asaas-assinatura-api.md` | 124 | Assinatura Asaas via API (automação do runbook da Fase 5) |
| `specs/fase-12-layout-boutique.md` | 465 | Layouts de vitrine: Boutique + seletor por super usuário |
| `specs/fase-13-admin-conteudo-boutique.md` | 248 | Admin de conteúdo do Boutique |
| `specs/fase-14-metricas-inteligentes.md` | 246 | Métricas que viram decisão (insights acionáveis) |
| `specs/fase-14a-insights-decisao.md` | 295 | Insights que viram decisão: contrato + piloto + gate por plano |
| `specs/fase-14b-insights-estrategia.md` | 272 | Insights de estratégia + a decisão do mês |
| `specs/fase-15-termos-e-aceite.md` | 362 | Termo de Adesão: páginas públicas + aceite click-wrap |
| `specs/fase-16-adesao-self-service.md` | 426 | Adesão self-service pela landing |
| `specs/fase-17-envs-e-guia-tecnico.md` | 425 | Mapa de variáveis de ambiente + guia técnico de implementação |
| `specs/fase-18-tracking-meta-landing.md` | 141 | Tracking Meta (Pixel + CAPI) na instância de marketing |
| `specs/demo-oticavisao-case.md` | 175 | Novo case de demonstração (`oticavisao`) |
| `specs/fix-billing-primeira-fatura.md` | 101 | Primeira fatura vence em D+2, não no próximo `--due-day` |
| `specs/fix-landing-early-adopter.md` | 76 | Remover a oferta early adopter da landing |
| `specs/fix-landing-metricas-f14.md` | 104 | Copy de métricas da landing com a régua da F14 |
| `specs/fix-landing-tabela-comparativa.md` | 134 | Tabela comparativa de planos na landing |
| `specs/fix-landing-vocabulario-produto.md` | 143 | Vocabulário de produto e subtítulo sem nicho |
| `specs/fix-landing-whatsapp-e-origem.md` | 115 | WhatsApp comercial da landing + atribuição de origem nos CTAs |
| `specs/plano-loop.md` | 126 | Plano de execução — fila do `@code` via `/loop` |

---

#### 10. `.husky/` e arquivos de configuração de raiz

`.husky/` — **os 4 hooks têm blob idêntico ao boilerplate**:

| Caminho | O que faz |
|---|---|
| `.husky/pre-commit` | `pnpm -s exec lint-staged`; aborta se `pnpm` não existe; respeita `SKIP_GIT_HOOKS=1` |
| `.husky/prepare-commit-msg` | prefixa a 1ª linha com `[<ISSUE_ID>]: ` usando `scripts/git/get-issue-id.sh`; pula merge/squash/fixup |
| `.husky/commit-msg` | **bloqueia commit direto em `main`/`develop`**; exige ID de issue na branch e na 1ª linha |
| `.husky/pre-push` | exige `APP_KEY` (env ou `.env`), roda `composer ci:check` e `LARAVEL_BYPASS_ENV_CHECK=1 pnpm -s run ci:check` |

Ponto de atrito registrado em `CLAUDE.md` do ctvitrine: como o trabalho é dirigido por spec e não por tracker, a instrução escrita é **commitar direto na `main` com `SKIP_GIT_HOOKS=1`** — os 4 hooks são idênticos ao boilerplate, mas a política de uso os contorna por padrão.

Config de raiz — identidade medida contra `origin/main`:

| Caminho | vs. bp | O que configura / onde diverge |
|---|---|---|
| `.editorconfig` | **IDÊNTICO** | utf-8, LF, indent 4 (2 em yml/yaml), final newline; `[*.md]` sem trim |
| `.gitattributes` | **IDÊNTICO** | `* text=auto eol=lf`, `diff=` por linguagem, `export-ignore` em CHANGELOG/README |
| `.prettierrc` | **IDÊNTICO** | printWidth 150, tabWidth 4 (2 em yml), singleQuote, plugins `organize-imports` + `tailwindcss`, `tailwindFunctions: [clsx, cn]` |
| `pint.json` | **IDÊNTICO** | preset `psr12` + regras; `binary_operator_spaces` com `=` e `=>` em `align_single_space_minimal` |
| `rector.php` | **IDÊNTICO** | paths `app`, `bootstrap/app.php`, `database`, `routes`; `withPhpVersion(PHP_VERSION_ID)`, `TypedPropertyFromStrictConstructorRector`, `typeCoverageLevel: 0`, sets deadCode+codeQuality, skip `RemoveUselessReadOnlyTagRector` |
| `laradumps.yaml` | **IDÊNTICO** | e por isso carrega `project_path: /Users/***/workspace/laravel/simplify-technology/boilerplate` — caminho absoluto do **boilerplate**, versionado dentro do ctvitrine |
| `.prettierignore` | **DIFERENTE** (ctv `dc5b669c09`, bp `0fd5c6f941`) | ctv acrescenta `resources/legal/*` com justificativa: os bytes do arquivo são o contrato (sha256 gravado em `terms_acceptances.document_hash`), formatador não entra |
| `phpunit.xml` | **DIFERENTE** (`11625b550f` / `11c8b9d95b`) | ctv tem **só a testsuite `Feature`** (bp tem `Unit`, `Feature` e `Arch`); ctv acrescenta 4 `<env>` de baseline: `VITRINE_LANDING_MODE=off`, `VITRINE_TERMS_MODE=off`, `VITRINE_SIGNUP_MODE=off`, `VITRINE_REPORT_MODE=off`, cada um com comentário explicando qual `.env` de dev sequestrava a suíte |
| `tsconfig.json` | **DIFERENTE** (`5194bbbdf9` / `5a0b37d133`) | única linha: ctv tem `"baseUrl": "."`; bp removeu com comentário "Sem baseUrl (removido no TS 7)" |
| `components.json` | **DIFERENTE** (`14024c7cec` / `4a304d0e10`) | ctv: `"style": "default"` e `"tailwind.config": "tailwind.config.js"`; bp: `"style": "new-york"` e `"tailwind.config": ""` — o `tailwind.config.js` apontado **não existe** na árvore do ctvitrine |
| `eslint.config.js` | **DIFERENTE** (`ed7722b284` / `bd0a7d4f33`) | única divergência: ctv **não tem** a regra `'react/button-has-type': 'error'` que o bp adicionou (com comentário sobre `<button>` default `type="submit"`) |
| `.gitignore` | **DIFERENTE** (`d469acd9c0` / `92cfd9da95`) | ctv acrescenta `/storage/ops`, `/marketing/*.pdf`, `/resources/legal/*.pdf`, `/marketing/instagram/`, `/marketing/reels/`; e **remove a linha `identifier.sqlite`** que o bp tem |
| `package.json` | **DIFERENTE** (`4ad04b9056` / `88428e5953`) | bloco `"scripts"` e `"lint-staged"` **idênticos** (nenhum hunk de diff neles); divergem `packageManager` (`pnpm@11.5.3` × `11.19.0`) e ~45 versões de dependência (eslint 9 × 10, vitest 3 × 4, vite 7 × 8, TS 5.9 × 6, jsdom 27 × 30, lucide 0.475 × 1.31, laravel-vite-plugin 2 × 3, `@inertiajs/react` 3.4 × 3.6; `typescript` está em `dependencies` no ctv e em `devDependencies` no bp) |
| `pnpm-workspace.yaml` | **DIFERENTE** (`9700853cf0` / bp) | mesma política (`allowBuilds: esbuild`, `minimumReleaseAge: 10080` = 7 dias); só o texto do comentário difere |
| `composer.json` | **DIFERENTE** | ctv `ci:check` = `@ci:lint + @ci:rector + @ci:test`; bp acrescenta `@ci:stan`. ctv **não tem** `larastan/larastan` nem `laravel-lang/common`; tem `league/flysystem-aws-s3-v3` que o bp não tem. ctv: `pest ^4.1` / `phpunit ^12.5.12`; bp: `pest ^5.1` / `phpunit ^13.0`. `"name"` do ctv ainda é `simplify-technology/boilerplate` |
| `boost.json` | **DIFERENTE** | ver §5 |
| `.env.example` | **DIFERENTE** | ver §12 |
| `identifier.sqlite` | **só no ctvitrine** | blob `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391` = **arquivo vazio, 0 bytes**. É o marcador do Laravel Herd; está versionado porque a linha `identifier.sqlite` foi removida do `.gitignore` |

Ausentes no ctvitrine e presentes no boilerplate: `.mcp.json`, `.mise.toml`, `phpstan.neon.dist`, `README.md`, `.claude/skills/**` (31 arquivos), `.ai/rules/**` (23 arquivos), `.codex/config.toml`, `lang/**` (4 arquivos).

---

#### 11. i18n — **não existe diretório `lang/` em lugar nenhum da árvore**

`git ls-tree -r 53d7d9a --name-only | grep -ci lang` devolve **2**, e os 2 são falso-positivo: `tests/Feature/Metrics/MetricsNumbersPlanGateTest.php` e `tests/Feature/User/UserManagementPlanGateTest.php` (a substring vem de "P**lanG**ate"). Não há `lang/`, `resources/lang/` nem qualquer arquivo `.php` de tradução.

Como o pt-BR chega ao usuário, medido:

| Mecanismo | Contagem | Comando |
|---|---|---|
| `messages()` em Form Request (strings pt-BR hardcoded na classe) | **21 de 28** Form Requests | `git grep -l 'public function messages' … -- 'app/Http/Requests/*'` |
| `attributes()` em Form Request | **0** | `git grep -l 'public function attributes' … -- 'app/Http/Requests/*'` |
| `__()` em `app/` | **6 ocorrências em 4 arquivos** | `git grep -n '__(' 53d7d9a -- 'app'` |
| `__()` em `resources/views/` | **0** | `git grep -n '__(' 53d7d9a -- 'resources/views'` |
| `trans()` em `app/` | **0** | `git grep -n 'trans(' 53d7d9a -- 'app/**/*.php'` |

Os 7 Form Requests **sem** `messages()`: `app/Http/Requests/Auth/LoginRequest.php`, `app/Http/Requests/Banner/StoreBannerRequest.php`, `app/Http/Requests/Banner/UpdateBannerRequest.php`, `app/Http/Requests/Item/Studio/SaveDraftRequest.php`, `app/Http/Requests/Seller/StoreSellerRequest.php`, `app/Http/Requests/Seller/UpdateSellerRequest.php`, `app/Http/Requests/Settings/ProfileUpdateRequest.php`.

As 6 chamadas `__()` — todas em chaves que exigiriam arquivos de tradução inexistentes:

- `app/Http/Controllers/Auth/ConfirmablePasswordController.php:27` → `__('auth.password')`
- `app/Http/Controllers/Auth/NewPasswordController.php:54` → `__($status)` (chave do password broker, `passwords.*`)
- `app/Http/Controllers/Auth/NewPasswordController.php:58` → `__($status)`
- `app/Http/Controllers/Auth/PasswordResetLinkController.php:31` → `__('A reset link will be sent if the account exists.')` (string literal **em inglês**)
- `app/Http/Requests/Auth/LoginRequest.php:35` → `__('auth.failed')`
- `app/Http/Requests/Auth/LoginRequest.php:53` → `__('auth.throttle', […])`

Configuração de locale: `config/app.php:81-85` usa `env('APP_LOCALE','en')` / `env('APP_FALLBACK_LOCALE','en')` / `env('APP_FAKER_LOCALE','en_US')`; `.env.example:35-37` do ctvitrine define `APP_LOCALE=pt_BR`, **`APP_FALLBACK_LOCALE=pt_BR`**, `APP_FAKER_LOCALE=pt_BR`.

Contraste com o boilerplate: `.env.example:11-13` do bp define `APP_LOCALE=pt_BR` mas **`APP_FALLBACK_LOCALE=en`**, e o bp tem `lang/pt_BR/auth.php`, `lang/pt_BR/pagination.php`, `lang/pt_BR/passwords.php`, `lang/pt_BR/validation.php` (4 arquivos) mais `laravel-lang/common: ^6.8` em `require-dev`. O ctvitrine não tem nenhum dos cinco.

---

#### 12. `.env.example` (estrutura, sem valores)

| Métrica | ctvitrine | boilerplate |
|---|---|---|
| Linhas | 295 | 95 |
| Chaves ativas (`^CHAVE=`) | **67** | 56 |
| Chaves comentadas (`^# CHAVE=`) | **69** | 13 |
| Chaves `VITRINE_*` ativas | 14 | 0 |

Distribuição das 67 ativas por prefixo (medida): `VITRINE` 14 · `APP` 9 · `MAIL` 8 · `DB` 6 · `SESSION` 5 · `REDIS` 5 · `AWS` 5 · `LOG` 4 · `PLOI` 2 · `VITE`, `QUEUE`, `PHP`, `MEMCACHED`, `FILESYSTEM`, `CACHE`, `BROADCAST`, `BCRYPT`, `ASAAS` 1 cada.

**Mecanismo anti-apodrecimento acoplado ao `.env.example` e à doc** — 5 arquivos de teste em `tests/Feature/Env/` guardam a sincronia, apoiados em `app/Services/Env/EnvInventory.php` e `app/Console/Commands/VitrineEnvCommand.php` (`php artisan vitrine:env`):

| Caminho | Linhas | Guard |
|---|---|---|
| `tests/Feature/Env/EnvExampleGuardTest.php` | 59 | **G1** toda env de produto declarada em config tem linha (mesmo comentada) no `.env.example`; **G4** segredo no `.env.example` nunca tem valor após o `=` (nem placeholder) |
| `tests/Feature/Env/EnvDocsGuardTest.php` | 75 | **G2** toda env de produto é citada em `docs/tecnico/12-variaveis-de-ambiente.md`; **G3** toda env de `config/vitrine.php` casa com um prefixo da allowlist `EnvInventory::PRODUCT_PREFIXES`; **G5** as docs da F17 estão no índice técnico e renderizam para `super_user` |
| `tests/Feature/Env/EnvInventoryTest.php` | 105 | unitário do extrator (aspas simples/duplas, chamada multilinha, nome fora do padrão, deduplicação) |
| `tests/Feature/Env/ModeDiagnosticsTest.php` | — | diagnóstico de modo por módulo |
| `tests/Feature/Env/VitrineEnvCommandTest.php` | — | comando `vitrine:env` |

Nenhum equivalente existe no boilerplate.

---

#### 13. Observabilidade

| Ferramenta | ctvitrine `53d7d9a` | boilerplate `origin/main` |
|---|---|---|
| Sentry | **ausente** — `git grep -ciE 'sentry\|laravel/pulse\|laravel/telescope' -- composer.lock` = **0 matches** | ausente no `composer.json`/`config`/`bootstrap` (apesar de existir `docs/adr/0006-error-tracking-sentry.md`) |
| Laravel Pulse | **ausente** (mesma medição) | ausente |
| Laravel Telescope | **ausente** (mesma medição) — mas `phpunit.xml` ainda carrega `<env name="TELESCOPE_ENABLED" value="false"/>` nos dois repos | ausente (`docs/adr/0004-sem-telescope.md`) |
| Log viewer | **presente**: `opcodesio/log-viewer: ^3.24` no `composer.json`, `config/log-viewer.php` publicado, e gate em `app/Providers/AppServiceProvider.php:105` → `LogViewer::auth(fn($request) => $request->user()?->hasRole(Roles::SUPER_USER))` (chamado por `setupLogViewer()` na linha 58) | mesma dependência `opcodesio/log-viewer: ^3.24` |
| Healthcheck | **presente**: `bootstrap/app.php:24` → `health: '/up'` | `bootstrap/app.php:22` → `health: '/up'` |
| Horizon | `laravel/horizon: ^5.45` (usado no `dev` do composer e no `horizon:terminate` do deploy) | `laravel/horizon: ^5.45` |
| Pail | `laravel/pail: ^1.2.2` (dev) | idem |
| LaraDumps | `laradumps/laradumps: ^5.3` (dev) + `laradumps.yaml` com todos os observers em `false` exceto `dump`/`original_dump` | idem, arquivo idêntico |

---

#### 14. Arquivos de raiz não cobertos pelas outras frentes

`git ls-tree 53d7d9a` (raiz) devolve 45 entradas. Fora do escopo das frentes 1–7 (`app`, `artisan`, `bootstrap`, `config`, `database`, `public`, `resources`, `routes`, `storage`, `tests`, `composer.lock`, `pnpm-lock.yaml`, `vite.config.ts`) restam, e estão todos cobertos acima, exceto:

| Caminho | Bytes | Nota |
|---|---|---|
| `marketing/` (5 arquivos) | — | diretório **só do ctvitrine**, não citado no briefing: `marketing/ctvitrine-playbook.md` (15300 B, fonte de verdade de preço/posicionamento), `marketing/guia-vendedores.md` (9304 B), `marketing/instrucoes-chatgpt-instagram.md` (18120 B — instruções versionadas do projeto ChatGPT que escreve o Instagram, o segundo alvo da "regra de sincronia"), `marketing/prospects.md` (3937 B), `marketing/roteiro-video-vendas.md` (5487 B). Os PDFs derivados estão no `.gitignore` |
| `identifier.sqlite` | 0 | ver §10 (não aberto — proibido pela regra 3; o tamanho vem do `ls-tree -l`) |

---

#### Medições

Todo número acima veio de um destes comandos. `$SRC = /Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `$BP = /Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`.

```bash
# Totais das duas árvores
git -C $SRC ls-tree -r 53d7d9a --name-only | wc -l          # -> 1053
git -C $BP  ls-tree -r origin/main --name-only | wc -l      # -> 719

# Tabelas de blob e junção por caminho (base de "IDÊNTICO"/"DIFERENTE")
git -C $SRC ls-tree -r 53d7d9a     | awk '{print $3, $4}' | sort -k2 > ctv.txt
git -C $BP  ls-tree -r origin/main | awk '{print $3, $4}' | sort -k2 > bp.txt
join -1 2 -2 2 -o 0,1.1,2.1 ctv.txt bp.txt > joined.txt
wc -l < joined.txt                                          # -> 478 caminhos compartilhados
awk '$2==$3' joined.txt | wc -l                             # -> 306 blobs idênticos
awk '$2!=$3' joined.txt | wc -l                             # -> 172 blobs divergentes

# Contagens por diretório (ctvitrine)
git -C $SRC ls-tree -r 53d7d9a --name-only -- .github        | wc -l   # -> 32
git -C $SRC ls-tree -r 53d7d9a --name-only -- .cursor        | wc -l   # -> 43
git -C $SRC ls-tree -r 53d7d9a --name-only -- .cursor/rules  | wc -l   # -> 13
git -C $SRC ls-tree -r 53d7d9a --name-only -- .github/skills | wc -l   # -> 29
git -C $SRC ls-tree -r 53d7d9a --name-only -- .cursor/skills | wc -l   # -> 29
git -C $SRC ls-tree -r 53d7d9a --name-only -- .agents/skills | wc -l   # -> 29
git -C $SRC ls-tree -r 53d7d9a --name-only -- .codex/skills  | wc -l   # -> 3
git -C $SRC ls-tree -r 53d7d9a --name-only -- docs           | wc -l   # -> 18
git -C $SRC ls-tree -r 53d7d9a --name-only -- docs/tecnico   | wc -l   # -> 14
git -C $SRC ls-tree -r 53d7d9a --name-only -- docs/usuario   | wc -l   # -> 3
git -C $SRC ls-tree -r 53d7d9a --name-only -- specs          | wc -l   # -> 28
git -C $SRC ls-tree -r 53d7d9a --name-only -- scripts        | wc -l   # -> 4
git -C $SRC ls-tree -r 53d7d9a --name-only -- marketing      | wc -l   # -> 5
git -C $SRC ls-tree -r 53d7d9a --name-only -- stubs          | wc -l   # -> 56
git -C $SRC ls-tree -r 53d7d9a --name-only -- stubs/ops      | wc -l   # -> 2

# Contagens por diretório (boilerplate)
git -C $BP ls-tree -r origin/main --name-only -- stubs         | wc -l # -> 54
git -C $BP ls-tree -r origin/main --name-only -- .claude       | wc -l # -> 31
git -C $BP ls-tree -r origin/main --name-only -- .ai           | wc -l # -> 23
git -C $BP ls-tree -r origin/main --name-only -- .codex/skills | wc -l # -> 31
git -C $BP ls-tree -r origin/main --name-only -- lang          | wc -l # -> 4
git -C $BP ls-tree -r origin/main --name-only -- docs          | wc -l # -> 15
git -C $BP ls-tree -r origin/main --name-only -- scripts       | wc -l # -> 3

# Prova de que .github/.cursor/.agents skills são byte-idênticos entre si
for d in .github/skills .cursor/skills .agents/skills; do
  git -C $SRC ls-tree -r 53d7d9a -- $d | awk -v p="$d/" '{sub(p,"",$4); print $3, $4}' | sort -k2
done > mirrors.txt
wc -l < mirrors.txt          # -> 87  (3 espelhos × 29)
sort -u mirrors.txt | wc -l  # -> 29  (pares (hash, caminho) distintos)

# Stubs
awk '$1 ~ /^stubs\// && $2==$3' joined.txt | wc -l   # -> 54 idênticos
awk '$1 ~ /^stubs\// && $2!=$3' joined.txt | wc -l   # -> 0 divergentes

# Workflows: actions pinadas por SHA
git -C $SRC show 53d7d9a:.github/workflows/ci.yml | grep -cE '^\s*-?\s*uses:'                      # -> 13
git -C $SRC show 53d7d9a:.github/workflows/ci.yml | grep -E '^\s*-?\s*uses:' | grep -cE '@[0-9a-f]{40}'  # -> 13
git -C $SRC show 53d7d9a:.github/workflows/semgrep.yml | grep -cE '^\s*-?\s*uses:'                 # -> 3
git -C $SRC show 53d7d9a:.github/workflows/semgrep.yml | grep -E '^\s*-?\s*uses:' | grep -cE '@[0-9a-f]{40}'  # -> 3

# i18n
git -C $SRC ls-tree -r 53d7d9a --name-only | grep -ci lang                                  # -> 2 (ambos falso-positivo "PlanGate")
git -C $SRC ls-tree -r 53d7d9a --name-only -- app/Http/Requests | wc -l                     # -> 28
git -C $SRC grep -l 'public function messages'   53d7d9a -- 'app/Http/Requests/*' | wc -l   # -> 21
git -C $SRC grep -l 'public function attributes' 53d7d9a -- 'app/Http/Requests/*' | wc -l   # -> 0
git -C $SRC grep -l '__(' 53d7d9a -- 'app' | wc -l                                          # -> 4
git -C $SRC grep -n '__(' 53d7d9a -- 'app' | wc -l                                          # -> 6
git -C $SRC grep -n '__(' 53d7d9a -- 'resources/views' | wc -l                              # -> 0
git -C $SRC grep -n 'trans(' 53d7d9a -- 'app/**/*.php' | wc -l                              # -> 0
git -C $BP  grep -l 'public function messages' origin/main -- 'app/Http/Requests/*' | wc -l # -> 6
git -C $BP  ls-tree -r origin/main --name-only -- app/Http/Requests | wc -l                 # -> 8

# .env.example (estrutura, sem ler valores de segredo)
git -C $SRC show 53d7d9a:.env.example | wc -l                              # -> 295
git -C $SRC show 53d7d9a:.env.example | grep -cE '^[A-Z0-9_]+='            # -> 67
git -C $SRC show 53d7d9a:.env.example | grep -cE '^# *[A-Z0-9_]+='         # -> 69
git -C $SRC show 53d7d9a:.env.example | grep -cE '^VITRINE_'               # -> 14
git -C $SRC show 53d7d9a:.env.example | grep -oE '^[A-Z0-9_]+=' | sed 's/_.*//;s/=//' | sort | uniq -c | sort -rn   # distribuição por prefixo
git -C $BP  show origin/main:.env.example | wc -l                          # -> 95
git -C $BP  show origin/main:.env.example | grep -cE '^[A-Z0-9_]+='        # -> 56
git -C $BP  show origin/main:.env.example | grep -cE '^# *[A-Z0-9_]+='     # -> 13

# Observabilidade
git -C $SRC grep -ciE 'sentry|laravel/pulse|laravel/telescope' 53d7d9a -- composer.lock   # -> 0 matches
git -C $SRC grep -niE 'sentry|telescope|pulse|log-viewer|healthcheck' 53d7d9a -- composer.json composer.lock package.json config bootstrap routes
git -C $SRC grep -nE 'withRouting|health' 53d7d9a -- bootstrap/app.php    # -> linha 24: health: '/up'
git -C $BP  grep -nE 'withRouting|health' origin/main -- bootstrap/app.php # -> linha 22: health: '/up'

# Tamanhos / raiz
git -C $SRC ls-tree -l 53d7d9a           # bytes de cada arquivo de raiz (identifier.sqlite = 0)
git -C $SRC ls-tree -r -l 53d7d9a -- marketing

# Linhas de arquivos citados (padrão usado em todas as tabelas de "Linhas")
git -C $SRC show 53d7d9a:<caminho> | wc -l

# Diffs (todos por `git show` em arquivo temporário + diff -u, nunca lendo a working tree)
git -C $SRC show 53d7d9a:<caminho> > /tmp/c && git -C $BP show origin/main:<caminho> > /tmp/b && diff -u /tmp/b /tmp/c
# aplicado a: AGENTS.md, .github/copilot-instructions.md, .cursor/rules/laravel-boost.mdc,
#   .prettierignore, phpunit.xml, tsconfig.json, components.json, eslint.config.js,
#   package.json, .gitignore, pnpm-workspace.yaml, .github/workflows/ci.yml, .github/workflows/semgrep.yml,
#   e os 8 arquivos de skill divergentes (contagem via `diff … | grep -c '^[<>]'`)
```

---


---

## Crítico de completude — saída integral

### Crítico de completude — o que as 8 frentes não enumeraram

Raiz da fonte: `/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine` @ `53d7d9a` (caminhos abaixo relativos a ela). Fiz o `ls-tree` completo (1053 arquivos) e cruzei com o que o documento cobre. **Um diretório inteiro ficou de fora, e é o segundo maior do repositório em bytes.**

| Caminho | O que é | Frente que deveria ter coberto |
|---|---|---|
| `public/**` (60 arquivos, **11.669.108 B**) | Assets servidos: fontes, favicons, branding, mockups da landing, vendor do log-viewer, `index.php`, `.htaccess` | **Frente 6** (frontend) — citou 5 SVGs de passagem numa tabela de hex e nunca enumerou o diretório |
| `public/img/mock/*` (6 arq., **8.192.613 B**) | PNGs consumidos por `resources/js/pages/site/landing.tsx` | Frente 6 |
| `public/fonts/woff2/**` (24 arq., 1.069.976 B) | As fontes que os 34 `@font-face` de `resources/css/_fonts.css` carregam | Frente 6 (contou os `@font-face`, não os arquivos) |
| `public/vendor/log-viewer/**` (7 arq., 547.024 B) | Output de `vendor:publish` commitado | Frente 4 / 8 (observabilidade) |
| `storage/**` (10 arq.) + `bootstrap/cache/.gitignore` | Placeholders `.gitignore` — inventário trivial, mas fecha o `ls-tree` | Frente 1 |
| `composer.json` → `require-dev` (12 pacotes) | Frente 4 listou só o `require`; `laravel/sail ^1.41` está declarado e **não há nenhum arquivo Docker/Sail na árvore** | Frente 4 / 8 |

#### Enumeração de `public/` (o conteúdo que faltou)

**Comparação com o boilerplate** (`git -C bp ls-tree -r origin/main -- public`): fonte 60 · boilerplate 40 · **39 caminhos compartilhados, 33 com blob idêntico, 6 divergentes** (`android-chrome-192x192.png`, `android-chrome-512x512.png`, `apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico` — todos rebranding). **21 só na fonte. 1 só no boilerplate: `public/robots.txt`** — ausência necessária na fonte, porque `routes/web.php:40` serve `robots.txt` por controller (`Site\RobotsController`) e um arquivo estático o sombrearia.

| Grupo | Arquivos | Bytes | Conteúdo |
|---|---:|---:|---|
| `public/fonts/woff2/aptos/` | 11 | 824.176 | 10 pesos + **1 duplicata** (ver abaixo) |
| `public/fonts/woff2/montserrat/` | 6 | 114.340 | 300/400/600/600i/800/800i |
| `public/fonts/woff2/merriweather-sans/` | 5 | 85.216 | 400/500/500i/700/700i |
| `public/fonts/woff2/playfair-display/` | 2 | 46.452 | 600/700 — **só na fonte** (serifa do layout Boutique) |
| `public/img/mock/` | 6 | 8.192.613 | `jaqueta.png` 2.276.766 · `bolsa.png` 1.792.437 · `vestido.png` 1.527.070 · `tenis.png` 1.463.039 · `logo-loja-ana.png` 919.986 · `painel-metricas.png` 213.315 — **todos referenciados por `landing.tsx`** |
| `public/img/og-landing-v2.jpg` | 1 | 52.142 | OG image da landing (6 referências) |
| branding raiz | 10 | 1.549.239 | `logo.png` 1.060.662 · `logo-desapego.png` 272.944 · `logo-simplify.png` 116.077 · `logo.svg` 26.580 · `mark.png` 12.137 · `placeholder-logo.svg` 325 · `ctvitrine-{logo,logo-light,logo-dark,logo-inverse,icon}.svg` 29.415 |
| favicons | 8 | 308.967 | `favicon.png` 33.852 · `android-chrome-512x512.png` 214.662 · `android-chrome-192x192.png` 26.180 · `apple-touch-icon.png` 5.663 · `favicon.ico` 3.347 · `favicon-48x48.png` 1.629 · `favicon-32x32.png` 1.047 · `favicon.svg` 927 · `favicon-16x16.png` 617 |
| `public/vendor/log-viewer/` | 7 | 547.024 | `app.js` 463.466 · `app.css` 78.863 · 3 PNGs · `mix-manifest.json` · `app.js.LICENSE.txt` |
| infra | 2 | 1.289 | `public/index.php` 549 · `public/.htaccess` 740 |

**Cinco fatos que só aparecem quando se enumera `public/`:**

1. **Fonte duplicada, 79 KB mortos.** `public/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2` e `aptos-extrabold-italic.woff2` são o **mesmo blob** (`fc88540ed885152d200bf22f8f759258f78538b1`, 78.980 B cada). O nome com espaço + ` 2` é artefato de duplicação do Finder. `resources/css/_fonts.css` referencia **23 URLs distintas** contra **24 woff2 em disco** — a duplicata é a única não referenciada.
   `git -C $C ls-tree -r 53d7d9a -- 'public/fonts/woff2/aptos' | grep extrabold-italic`
2. **Quatro favicons órfãos, 277 KB.** `android-chrome-192x192.png`, `android-chrome-512x512.png`, `favicon-48x48.png` e `favicon.png` têm **zero referência** em `app resources config database routes marketing docs specs stubs`. `resources/views/app.blade.php:15-19` só linka `favicon.ico`, `favicon.svg`, `favicon-32x32.png`, `favicon-16x16.png` e `apple-touch-icon.png`. Os dois `android-chrome-*` são o par que um `site.webmanifest` referenciaria — e **não existe manifest algum na árvore** (Frente 6 afirmou a ausência do manifest, mas não ligou aos 241 KB órfãos que ela deixa).
3. **Branding legado do produto anterior ainda versionado**: `logo-desapego.png` (272.944 B) e `logo-simplify.png` (116.077 B) continuam no tree; `logo-desapego.png` tem 2 referências vivas, `logo-simplify.png` tem 1.
4. **Peso do repositório.** Árvore inteira = **29.177.220 B**. `database/seeders/data` (77 `.jpg`) = **13.050.779 B** e `public/` = **11.669.108 B**: **85% do repositório são binários de demo e marketing**. Nenhuma frente somou isso — a Frente 5 contou os 77 jpgs, a Frente 6 não abriu `public/`.
5. **Assimetria de compressão.** O projeto tem `app/Services/ImageOptimizer.php` que reduz upload de lojista a 1600px/qualidade 82 — e serve `jaqueta.png` (2,28 MB) e `bolsa.png` (1,79 MB) crus em `/assinar` e `/` da instância de marketing.

---

### Números e afirmações derrubados

| O que o documento diz | O que o disco diz | Comando que mediu |
|---|---|---|
| **Frente 3 §5**: `RoleUserUpdatedEvent` — "**Nenhum `dispatch()` desta classe existe em `app/`**" · coluna Wiring: "**não registrado**" | **Falso.** É disparado em **dois** call sites: `app/Http/Controllers/PermissionRole/AssignRoleController.php:119` e `app/Http/Controllers/PermissionRole/RevokeRoleController.php:78`, ambos `Broadcast::event(new RoleUserUpdatedEvent($user))`, sem try/catch. (A Frente 2 registrou o dispatch corretamente; a Frente 3 o negou.) | `git -C $C grep -n "RoleUserUpdatedEvent" 53d7d9a -- app` |
| **Frente 1 §8**: `config/vitrine.php`, "~**380** linhas" | **487** linhas | `git -C $C show 53d7d9a:config/vitrine.php \| wc -l` |
| **Frente 1 §8**: `signup.reserved_slugs` é "lista literal de **46** subdomínios reservados" | **45** (7+8+8+6+6+6+4). O `RESERVED_SLUGS` do comando são 43, então o superset existe — mas a margem é 2, não 3 | `git -C $C show 53d7d9a:config/vitrine.php \| awk "/'reserved_slugs'/,/^ *\],/" \| grep -oE "'[a-z0-9-]+'" \| sort -u \| wc -l` |
| **Frente 7 §1**: "**86** funções-helper locais definidas dentro dos próprios arquivos de teste (medido)", com o comando `… -- tests/Feature` | **83** com esse comando. (96 se o pathspec for `tests` inteiro, incluindo os 13 helpers de `tests/Pest.php` — nenhum dos dois é 86) | `git -C $C grep -n -E '^function [a-zA-Z]' 53d7d9a -- tests/Feature \| wc -l` → 83; `-- tests` → 96 |
| **Frente 6 §6.11**: "`detectTls` derivado de `new URL(env.APP_URL).host` **sem try/catch** — `APP_URL` sem scheme derruba o config" | **Falso na causa.** `vite.config.ts:15` é `env.APP_URL?.startsWith('https://') ? new URL(env.APP_URL).host : null` — um `APP_URL` sem scheme cai no ramo `null` e o config sobe normal. O `new URL()` só executa quando o valor já começa com `https://` | `git -C $C show 53d7d9a:vite.config.ts` |
| **Frente 7 §Medições**: o falso-positivo de `arch(` está em "`tests/Feature/Metrics/MetricsStrategyTest.php:148`" | A linha real é **305** (`array_search(...)`). O achado (zero `arch()` no projeto) está certo; a citação, não | `git -C $C grep -n "arch(" 53d7d9a -- tests` |
| **Frente 6 §6.13** diz que o boilerplate tem "**39** arquivos em `resources/js/test/`"; **Frente 7 §8/§9** diz "**37** arquivos" | Ambos medem coisas diferentes sem dizer: **39** entradas no diretório, **37** delas casam `.test.*` (as outras 2 são `setup.ts` e `vitest.d.ts`). A tabela comparativa da F7 usa 37 e a prosa da F6 usa 39 lado a lado no mesmo inventário | `git -C $B ls-tree -r origin/main --name-only -- resources/js/test \| wc -l` → 39; `\| grep -cE '\.test\.'` → 37 |
| **Frente 3 §10**: cabeçalho "Os outros **6** subdiretórios de `app/`" | A tabela abaixo dele lista **10** linhas, duas das quais (`Resolvers`, `DataTransferObjects`) já haviam sido detalhadas nas §4/§5. `app/` tem 15 subdiretórios; sobram 5 fora da frente (`Http`, `Console`, `Policies`, `Providers`, `Rules`) | `git -C $C ls-tree -r 53d7d9a --name-only -- app \| awk -F/ 'NF>=2{print $2}' \| sort -u` |

#### O que ninguém amarrou (achado qualitativo, três frentes passaram por cima)

**(A) `assign-role` e `revoke-role` chamam um broadcast que não pode funcionar — e o caminho feliz não tem teste.** Quatro fatos, cada um enumerado por uma frente diferente, nunca cruzados:

- `Broadcast::event(new RoleUserUpdatedEvent($user))` é a última instrução das duas actions, fora de try/catch (F2 registrou, F3 negou).
- **`config/broadcasting.php` não existe** — `config/` tem 15 arquivos e nenhum é broadcasting (F1 listou os 15 sem notar a ausência). `.env.example:66` define `BROADCAST_CONNECTION=reverb`, e **`laravel/reverb`/`pusher` não estão no `composer.json`** (`git grep -n "reverb\|pusher" 53d7d9a -- composer.json package.json` → zero linhas).
- `bootstrap/app.php` `withRouting()` **não declara `channels:`** (F1 registrou o fato, sem consequência).
- `RoleUserUpdatedEvent::broadcastWith()` faz `$this->user->roles->first()->name`, mas `app/Traits/Models/HasRolesAndPermissions.php` define **só** `permissions()` (l.106) e `role()` (l.123) — não existe relação `roles` —, e `AppServiceProvider::configModels()` liga `Model::shouldBeStrict()` incondicionalmente (F3 registrou os três, separados).
- **Cobertura**: `git grep -n "assign-role\|revoke-role" 53d7d9a -- tests` devolve **1 linha** — `tests/Feature/PermissionRole/AssignRoleAllowlistTest.php:35`, que faz `->assertSessionHasErrors(['role'])`, ou seja, retorna antes do broadcast. **`revoke-role` tem zero call site em teste.** Os 708 casos Pest nunca executam uma atribuição de papel bem-sucedida por rota.

**(B) `APP_FALLBACK_LOCALE=pt_BR` sem nenhum arquivo de tradução pt_BR.** A Frente 8 §11 enumerou "não existe `lang/`" e mostrou as 6 chamadas `__()`, mas apresentou a seção como "Como o pt-BR chega ao usuário" — o que fica de fora é que **as chaves não resolvem para nada**:

- `config/app.php:81/83` → `env('APP_LOCALE','en')` / `env('APP_FALLBACK_LOCALE','en')`; `.env.example:35-37` → `APP_LOCALE=pt_BR`, **`APP_FALLBACK_LOCALE=pt_BR`**, `APP_FAKER_LOCALE=pt_BR`.
- O `FileLoader` do framework é registrado com `[__DIR__.'/lang', $app['path.lang']]` (`TranslationServiceProvider::registerLoader()`), e a pasta do framework contém **só `en`**. Sem `lang/pt_BR/` e sem `laravel-lang/common` no `composer.json`, locale **e** fallback apontam para um grupo inexistente.
- Consequência medida: `__('auth.failed')` e `__('auth.throttle')` (`app/Http/Requests/Auth/LoginRequest.php:35,53`), `__('auth.password')` (`ConfirmablePasswordController.php:27`) e `__($status)` do password broker (`NewPasswordController.php:54,58`) devolvem **a chave crua**. O mesmo vale para toda regra do framework nos **7 Form Requests sem `messages()`** e nos 7 controllers com `$request->validate()` inline. O boilerplate resolve isso com `lang/pt_BR/{auth,validation,passwords,pagination}.php` e `APP_FALLBACK_LOCALE=en`.
  `git -C $B ls-tree -r origin/main --name-only -- lang` · `ls $B/vendor/laravel/framework/src/Illuminate/Translation/lang/` → só `en`

---

### Superfície confirmada como coberta

Conferi com comando próprio e **estava certo** — não vale re-investigar:

- **Contagens estruturais da fonte**: 258 arquivos / 18.969 linhas em `app/`; 15 subdiretórios e **zero** arquivo solto na raiz de `app/`; 87 controllers (86 sem a base) / 79 invokable; 28 Requests; 15 middlewares (12 `Ensure*`); 62 Services (14 subpastas + 6 na raiz); 14 Models; 9 Enums; 19 comandos (19/19 `final` + `declare(strict_types)`); 15 configs; 30 migrations; 136 arquivos em `database/`; 108 arquivos em `tests/` (106 em `Feature/`); 199 em `resources/js`; 26 em `components/ui`; 1053 na árvore.
- **Rotas**: 78 + 12 + 7 = 97; 8 `Schedule::command`; 15 `throttle:`; 4 `RateLimiter::for`; 29 `Inertia::render` + 6 `withViewData`. Os números de linha da tabela da F1 (`:34`, `:40`, `:63`, `:114`, `:137`, `:251`, `:274`, `:282`, `:296`) batem, e a atribuição de gate por rota está correta — inclusive o `#60 users/impersonate` sem `can:` e o `#78 sync-permissions` com `can:manage_users`.
- **Tabela `config/` SAME × DIFF da F1**: reproduzida por hash de blob contra `origin/main` — SAME em activitylog/auth/cache/database/horizon/inertia/log-viewer/services/session; DIFF em app/filesystems/logging/mail/queue. O diff de `queue.php` é exatamente os dois `retry_after` 90→180 + comentários.
- **`.env.example`**: 67 ativas + 69 comentadas = 136 únicas; boilerplate 69; **85 só na fonte / 18 só no boilerplate / 51 em ambos** — e a lista das 18 do boilerplate confere item a item.
- **Schema (F5)**: 24 `Schema::create`, 9 FKs com as regras exatas de `onDelete` (as duas de `permission_role` sem nenhuma), `users.role_id` sem FK e sem índice, `SoftDeletes` só em `Item`, `$hidden` só em `User`, zero `$table`/`$guarded`. As **6 migrations de base são byte-idênticas** ao `origin/main`. `ItemStatus::SOLD` e `'colors'` têm **zero** ocorrência nos 4 catálogos.
- **Negativas verificadas**: zero linha de CSP/`SecurityHeaders`/`X-Frame-Options`/HSTS; zero `alias(`/`appendToGroup`/`->api(` em `bootstrap/app.php`; zero `CastsAttributes`; zero `Observer`; `Inertia::defer|optional|merge|always` = 1 ocorrência e é comentário TS; zero `tests/{Unit,Arch,Browser,Contract}`; zero `arch()`; zero `lang/`; zero `tailwind.config.js`; `flash` ausente de `resources/js/types`; único modificador de scheduler é o `appendOutputTo` de `routes/console.php:26`.
- **Lado boilerplate (medido em `origin/main`, que hoje é `2965f8cf` — `main` local está em `8b0381b8` e `HEAD` em `7d9e928f`, então medir contra `main` seco **ainda** produziria números errados)**: 719 arquivos; 29 controllers, 8 Requests, 1 Policy, 2 Rules, 2 Resources, 4 Services, 4 Models, 2 Console, 66 testes / 336 Pest / 7 `arch()`, 254 casos Vitest, 30 `ui/`, 13 `Inertia::render`, 0 `withViewData`. A tabela arq./LOC por subdiretório de `app/` da F3 §11 reproduz **os dois lados** sem um único desvio. Existem, como afirmado: `Casts/MoneyCast.php`, `ValueObjects/Money.php`, `Support/{Br/*,Listing/*,Logging/*}`, `Models/PermissionUser.php`, `Listeners/EnforceMailAllowlist.php`, `Services/PermissionCatalogService.php`, `Rules/MoneyString.php`, `Middleware/{SecurityHeaders,SetSensitiveCacheHeaders,EnsureUserIsActive}.php`, `Requests/PermissionRole/{AssignRole,SyncPermissions}Request.php`, `lib/resolve-inertia-page.tsx` e os 5 primitivos `ui/` ausentes na fonte.
- **`package.json`**: 58 pacotes de cada lado, **0 só na fonte, 0 só no boilerplate**, 44 versões divergentes, 14 idênticos; `scripts` e `lint-staged` byte-idênticos (comparação por `JSON.stringify`).
- **CSS**: `app.css` 721 linhas / 52 `!important` / 40 tokens no `@theme` / 2 `@keyframes`; `_fonts.css` 218 linhas / 34 `@font-face`; `var(--palette-primary)` e `var(--palette-accent)` com **zero** uso; `app.blade.php:114` de fato usa `background-color: var(--palette-primary-dark)` no bloco pré-paint (o bug apontado pela F6 é real).
- **F8 tree-wide**: 1053 × 719, **478 caminhos compartilhados, 306 blobs idênticos, 172 divergentes**; os 3 espelhos de skills (`.github`/`.cursor`/`.agents`) colapsam 87 linhas em **29** pares (hash, caminho) — idênticos entre si; 54/54 stubs e 4/4 hooks do husky com blob idêntico ao boilerplate; `.codex/skills` da fonte com 3 arquivos defasados (o `.codex` do boilerplate carrega o mesmo blob `813e62f6…` dos outros três espelhos da fonte — só a cópia `.codex` da fonte está velha).
- **Testes (F7)**: 708 casos Pest + 13 métodos PHPUnit; `phpunit.xml` com testsuite única `Feature` e as 4 `<env>` de baseline `VITRINE_*=off`; 18 comandos distintos exercitados via `artisan(` e **`ai-image:usage` é o único dos 19 nunca invocado**; a soma por diretório da tabela §8 fecha em 708.
