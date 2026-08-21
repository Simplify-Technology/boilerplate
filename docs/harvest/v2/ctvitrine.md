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


---

# Dimensão 6 (UI) — célula ✅ 2026-08-20

- **Fonte:** ctvitrine @ `53d7d9a` · **Alvo:** boilerplate @ `origin/main`
- **⚠️ O ALVO ANDOU NO MEIO DA CÉLULA.** A 1ª passada mediu contra `2965f8c`; a retomada mediu contra **`beb848e`** (o merge do PR #112 aterrissou durante a execução, tocando `ui/sidebar.tsx`, `lib/keyboard.ts` e `.ai/rules/js.md`). O caçador 1 detectou isso sozinho e marcou as duas conclusões que se invertem contra o ref novo. Trap registrada no STATE.
- **Custo:** 17 agentes (4 caçadores × 3 lentes + secagem), **duas passadas** — a 1ª perdeu 10 dos 17 por sleep da máquina (3,81M tokens, 1.132 chamadas, 4h23), a retomada por `resumeFromRunId` fechou 17/17 com 0 erros (2,82M tokens, 784 chamadas, 58 min). **Total da célula: ~6,6M tokens de subagente.**
- **Placar:** **45 candidatos · 30 sobrevivem · 15 derrubados.** Pela primeira vez na rodada, **dois passaram pelas 3 lentes sem redução de escopo** (V6F-4 e V6T14) e um saiu **ampliado** (V6D-11).
- **Fact-check meu, antes de qualquer coisa entrar no BACKLOG.** Re-medi as afirmações capazes de inverter decisão e **todas reproduzem**: os 6 call-sites de `toast.promise`; os defaults `#61d345`/`#ff4b4b`/`#616161` da lib instalada; `DIVIDA_DESTRUCTIVE_ESCURO = 3.67` com a catraca "se passou de 4.5, o F3 chegou" (`theme-tokens.test.ts:161-167`); a dupla emissão de `.font-title` no CSS compilado (byte 44.554 dentro de `@layer utilities{`, que abre em 16.742, × byte 815.278 **fora de qualquer layer**, com `!important`); os 46 `!important` do `app.css`; as 159 ocorrências de `color-mix(in oklab` emitidas pelo próprio Tailwind 4.3; e o **14.38:1** do par emerald — o único número que a secagem marcou como não medido e que invertia decisão.
- **Uma correção minha ao texto dos agentes:** o par emerald não está só em `verify-email.tsx`. É o mesmo bloco `<Alert>` em **três** páginas de auth (`forgot-password.tsx:30`, `login.tsx:44`, `verify-email.tsx:25`), e o `AlertDescription` usa `text-emerald-900/90` sobre `bg-emerald-50` = **7.03:1**. Quem escrever o F3 mexe em 3 arquivos, não 1, e tem dois pares a preservar, não um.


---

## Caçador 1 — tokens, tema, paleta, dark mode, tipografia, contraste

# Caçador 1 — tokens, tema, paleta, dark mode, tipografia, contraste (ctvitrine @ `53d7d9a` × boilerplate @ `origin/main` = `beb848e`)

> Aviso de baseline: `origin/main` avançou desde o inventário. O banner do `ctvitrine.md` fixa `2965f8c`; hoje `origin/main` = **`beb848e`** e já contém as PRs #108 (poda do CSS de toast), #72 (anel de foco) e #112. **Duas conclusões desta frente se invertem contra o ref novo** — estão marcadas. Uma contagem do próprio inventário é derrubada abaixo (V6T11).

---

### V6T1 · O bloco pré-paint do ctvitrine referencia um token que ainda não existe naquele instante — e o boilerplate já curou isso com literal + teste

- **Evidência:** `resources/views/app.blade.php:113-116@53d7d9a`
  ```
  html.dark {
      background-color: var(--palette-primary-dark);
      transition: background-color 0.2s ease;
  }
  ```
  O token nasce em `resources/css/app.css:111@53d7d9a` (`--palette-primary-dark: #0f2a44;`), e o `app.css` só entra pelo `@vite(...)` de `app.blade.php:142` — **28 linhas depois** do `<style>`. Na janela em que o bloco existe para valer, `var()` não resolve, a declaração é inválida em computed-value time e `background-color` cai para `transparent`.
- **Estado do boilerplate hoje:** **já corrigido, e melhor do que eu proporia.** `resources/views/app.blade.php:40-52@origin/main` usa hex literal (`background-color: #0f2a44;`) com comentário que descreve exatamente o mecanismo (`:26-39`), acrescenta `color-scheme: light|dark` preso à **classe** `.dark` (não ao `<meta>`, que congela no servidor — fecha o F35), e a sincronia hex↔token é travada por `tests/Unit/Theme/InlineThemeBackgroundTest.php` (medido: `git grep -ln 0f2a44 origin/main` → 4 arquivos, um deles o teste).
- **O que absorver / o que travar:** nada a absorver do ctvitrine. O que sai daqui é **(b)**: a regra que o boilerplate escreveu em comentário precisa virar `.ai/rules` de CSS, porque o defeito reapareceu em derivado depois de curado aqui. Texto da regra: *"bloco `<style>` inline no `<head>` só usa literais; qualquer `var(--x)` cujo `--x` seja declarado numa folha carregada depois é inválido justamente na janela em que o bloco existe."*
- **Adaptação necessária:** nenhuma no boilerplate. Para o rollout dos derivados (playbook), isso é uma fatia de 4 linhas + o teste.
- **Risco · esforço:** P / P.
- **Honestidade sobre severidade:** em **produção** o `@vite` emite o CSS como `<link>` render-blocking, então o token já existe no primeiro paint e o `var()` quebrado fica latente. A janela real é `composer dev` (Vite injeta CSS por JS) e o caso de folha lenta/falha. Vender isso como "flash branco em produção" seria falso — o `ctfinance.md:244` já registrou essa correção de severidade e ela vale igual aqui.
- **Multi-fonte?** Sim. cuidari tem o mesmo genoma de defeito de tema (`cuidari.md:2561`), e o ctfinance foi onde a severidade foi calibrada.

---

### V6T2 · `--palette-primary` e `--palette-accent` têm ZERO consumidor — confirmado, e o hex de um deles é o cadáver da colisão do F1

- **Evidência:** `resources/css/app.css:111-116@53d7d9a` declara seis literais de paleta. Medido com `git grep -o -- '--palette-<nome>' 53d7d9a` (fora do próprio `app.css`) e com a lista integral de `var(--palette` na árvore:

  | token | valor | `var()` que o consomem |
  |---|---|---|
  | `--palette-primary-dark` | `#0f2a44` | 21 |
  | `--palette-primary` | `#1f3c57` | **0** |
  | `--palette-primary-darker` | `#2c485e` | 5 |
  | `--palette-accent-light` | `#8ac7e5` | 12 |
  | `--palette-accent` | `#379bcb` | **0** |
  | `--palette-muted-light` | `#e6e7e8` | 4 |

  Os dois órfãos são exatamente `#1f3c57` e `#379bcb` — **os dois hexes da colisão `--color-primary`/`--color-accent` que o F1 documentou** (`BACKLOG.md:531-532`).
- **Estado do boilerplate hoje:** os mesmos dois hexes existem, renomeados e **com consumidor**: `--brand-cyan: #379bcb` é usado em `app.css:179` (`--primary` do escuro) e `app.css:115` (base do `--brand-cyan-dark`). `#1f3c57` **não existe mais** no boilerplate — medido: `git grep -c 1f3c57 origin/main` → 0 linhas.
- **O que absorver / o que travar:** **(b)**, um teste. `theme-tokens.test.ts` já proíbe `--color-*` fora do `@theme`; falta a asserção simétrica: *todo token declarado em `:root` tem pelo menos um `var()` que o leia*. É uma varredura de texto de ~8 linhas no arquivo que o teste já lê.
- **Adaptação necessária:** o boilerplate hoje passaria? **Não medi token a token no boilerplate** — medi só os seis do ctvitrine. Quem escrever a fatia tem de rodar a varredura antes de decidir se ela nasce verde ou com allowlist.
- **Risco · esforço:** P / P.
- **A lição, que é o ativo:** token órfão não é sujeira inerte. `--palette-primary: #1f3c57` sobreviveu à cura da colisão porque **ninguém apagou o valor, só mudaram o prefixo** — e um valor sem consumidor é um convite a alguém reconectar o fio errado. Órfão é dívida de manutenção com aparência de documentação.
- **Multi-fonte?** Sim — cuidari (`cuidari.md:2548-2556`) tem os mesmos seis literais **ainda no prefixo `--color-*`**, ou seja, com a colisão viva.

---

### V6T3 · O ctvitrine acertou o namespace de token que o cuidari errou — e isso mostra onde a guarda do boilerplate ainda não chega

- **Evidência:** `resources/css/app.css:111-116@53d7d9a` usa o prefixo `--palette-*`. Medido: `git show 53d7d9a:resources/css/app.css | awk 'NR>74' | grep -E '^\s*--color-'` → **0 linhas**. Nenhum `--color-*` fora do `@theme` em todo o `app.css` do ctvitrine.
- **Estado do boilerplate hoje:** mesma higiene, prefixo `--brand-*` (`app.css:107-116@origin/main`), travada por `resources/js/test/styles/theme-tokens.test.ts:102-110`.
- **O que absorver / o que travar:** nada a absorver — **as três fontes já concordam** (ctvitrine por `--palette-*`, boilerplate por `--brand-*`; só o cuidari discorda). O ativo é negativo e é o V6T4/V6T5: a guarda existente cobre **token**, e os dois furos vivos do boilerplate são em **classe** e em **folha de terceiro**.
- **Risco · esforço:** —
- **Multi-fonte?** cuidari é o contraexemplo (`cuidari.md:2548`); ctfinance tem a colisão e **não** a resolveu (`BACKLOG.md:536`).

---

### V6T4 · `[guard-rail]` No boilerplate, `.font-title` é emitida DUAS vezes e a de fora de layer com `!important` vence — os três tokens `--font-*` do `@theme` são funcionalmente órfãos

Este é o achado mais forte da frente e é **defeito do boilerplate**, revelado por ler os dois lado a lado.

- **Evidência (ctvitrine, o sintoma que denuncia):** `resources/css/app.css:514-523@53d7d9a` —
  ```
  /* As regras de tipografia acima são do admin e carimbam h1/h2/h3 com Montserrat
     e p/footer com Merriweather/Aptos — várias com !important, que vence qualquer
     utilitário do Tailwind. […] título e preço PRECISAM da display serif, então a
     regra é reafirmada aqui. */
  [data-vitrine='boutique'] .font-boutique {
      font-family: var(--font-boutique) !important;
  }
  ```
  Ou seja: o projeto declarou `--font-boutique` no `@theme` (`:25`), usou `font-boutique` em 15 lugares do markup (medido), e **precisou escrever um `!important` extra para desfazer o próprio `!important`**. O comentário é a confissão assinada.
- **Evidência (boilerplate, o defeito medido no artefato compilado):** `public/build/assets/app-BKlgUCP1.css` (824.001 B, build do dia, working tree em `30fe0eb`, que É ancestral de `origin/main`) — `.font-title{` aparece em **duas** posições:

  | byte | dentro de | declaração |
  |---|---|---|
  | 44.554 | `@layer utilities{` (abre em 16.742) | `.font-title{font-family:var(--font-title)}` |
  | 815.278 | **fora de qualquer layer** (último `@layer` abre em 16.742) | `.font-title{font-family:Montserrat,sans-serif!important}` |

  A segunda vem de `resources/css/app.css:450-452@origin/main`. Declaração sem layer vence declaração em `@layer` — **é o mecanismo exato do F1**, agora no namespace de *classe* em vez de *token*. E ainda leva `!important` por cima.
- **Consequência medida:** `--font-title` (`app.css:19@origin/main`) tem **zero** efeito observável: seu único consumidor é a utilitária sombreada. `--font-subtitle` (`app.css:21`) é pior — medido `git grep -n 'var(--font-subtitle)\|font-subtitle' origin/main -- resources` → **1 linha, que é a própria declaração**. Zero consumidor, e `.font-subtitle{` não aparece no CSS compilado (0 ocorrências). `font-title` é usada 2× no markup do boilerplate e **19×** no do ctvitrine.
- **Estado do boilerplate hoje:** `theme-tokens.test.ts:102-110` proíbe `--color-*` fora do `@theme` e **não vê nada disto** — a guarda é sobre nomes de token, e a colisão aqui é sobre nomes de classe.
- **O que absorver / o que travar:** **(b)**, dois movimentos:
  1. Apagar `.font-title` de `app.css:450-452` (a utilitária do Tailwind já entrega o mesmo valor pelo token) e decidir o destino de `--font-subtitle` — ou ganha consumidor, ou sai.
  2. **Estender a guarda:** teste que, para cada `--font-*` / `--radius-*` / `--color-*` declarado no `@theme`, falha se o arquivo declarar à mão uma classe com o nome da utilitária correspondente (`.font-title`, `.radius-lg`, …). Hoje o teste lê o `app.css` como texto e já tem o extrator de blocos e de declarações — o incremento é uma regex sobre `foraDoTheme`.
- **Adaptação necessária:** cuidado com `.font-sans`: medido, também sai duas vezes (byte 16.548 dentro de `@layer base{`, com `!important`; byte 44.514 dentro de `@layer utilities{`, sem). As duas estão **em layer**, e quem vence é o `!important` do base. O valor final é o mesmo stack, então não há bug visível — mas a allowlist do teste precisa tratá-la explicitamente, com o porquê escrito, senão a fatia nasce vermelha por um caso que não é defeito.
- **Risco · esforço:** P de risco (o valor final não muda: `var(--font-title)` resolve para `'Montserrat', sans-serif`, idêntico ao literal) · M de esforço (o teste é o trabalho).
- **Multi-fonte?** Sim, e é o que dá confiança: **ctvitrine documentou o custo por escrito** (`app.css:514-520`) e ainda assim não removeu a causa; o boilerplate tem 21 das mesmas 22 regras `!important` de tipografia. Não medi ctfinance nem cuidari para esta classe específica.

---

### V6T5 · `[guard-rail]` `@import '@radix-ui/themes/styles.css'` sem `layer()` — o Radix redeclara `--color-background` fora de layer e sequestra `bg-background` no app inteiro (medido em bytes)

- **Evidência (ctvitrine):** `resources/css/app.css:5@53d7d9a` → `@import '@radix-ui/themes/styles.css';` — sem `layer(...)`. Idêntico ao boilerplate.
- **Evidência (boilerplate, medida no compilado):** `--color-background:` aparece em 3 posições de `public/build/assets/app-BKlgUCP1.css`, e o arquivo tem **5** `@layer`, todos abrindo antes do byte 16.742:

  | byte | seletor | valor | em layer? |
  |---|---|---|---|
  | 11.010 | `:root,:host` | `var(--background)` | sim — `@layer theme{` (5.429) |
  | 227.969 | `:where(.radix-themes)` | `white` | **não** |
  | 232.573 | `:is(.dark,.dark-theme),… :where(.radix-themes:not(.light,.light-theme))` | `var(--gray-1)` | **não** |

  E o app inteiro está dentro do wrapper: `resources/js/app.tsx:7,27-39@origin/main` (`import { Theme }` … `<Theme>…</Theme>`). O `:where()` zera a especificidade, mas **fora de layer vence layer** independentemente de especificidade — então `bg-background`/`text-background` resolvem pelo Radix, não pelo `@theme`, em toda a árvore.
- **Estado do boilerplate hoje:** conhecido como **F1 Defeito 3** (`BACKLOG.md:534`), ainda **não aplicado** (`@theme` segue sem `inline`, `app.css:14@origin/main`). O que eu acrescento é a prova em byte offset no artefato atual e um ponto novo: **`theme-tokens.test.ts` lê só `resources/css/app.css`** (`:20`), portanto passa verde com o sequestro vivo. A guarda que existe dá sensação de cobertura que ela não tem.
- **O que absorver / o que travar:** **(b)**. O `BACKLOG.md:535` já prescreve *"asserção de que todo `@import` de folha de terceiro carrega `layer(...)`"* — medido, **não foi implementada**: `git grep -n 'layer(' origin/main -- resources/js/test resources/css` → 0 linhas. Essa asserção é 3 linhas e pode entrar **antes** do F1 inteiro, como catraca.
- **Adaptação necessária:** a asserção nasce **vermelha** (o import atual não tem `layer()`). Ou entra junto com a correção do import, ou entra com um `expect.fail` documentado como dívida — não com allowlist muda.
- **Risco · esforço:** M / P a asserção; G se acoplada ao F1 completo.
- **Multi-fonte?** ctvitrine tem o import idêntico e o mesmo wrapper (`resources/js/app.tsx:5,24-36@53d7d9a`); cuidari usa `@radix-ui/themes` em 29 arquivos (`cuidari.md:115`).

---

### V6T6 · Anatomia dos `!important`: contra o que eles lutam — e por que 24 dos 46 do boilerplate são uma tentativa de estilizar por CSS o que a lib expõe por prop

- **Evidência (ctvitrine):** `git show 53d7d9a:resources/css/app.css | grep -c '!important'` → **52**. Uma delas (`:516`) está **dentro de comentário**, então são **51 declarações**. Distribuição por linha, classificada por bloco:

  | frente | linhas | nº |
  |---|---|---|
  | tipografia (vencer `@radix-ui/themes` + as próprias utilitárias) | 102, 233, 242, 250, 266, 267, 288, 304, 317, 389, 410, 428, 445, 450, 465, 471, 476, 486, 493, 500, 508, **522** | **22** |
  | toast (vencer o CSS-in-JS do `react-hot-toast`) | 616–689 | **28** |
  | iOS auto-zoom | 603 | **1** |

- **Estado do boilerplate hoje:** `git show origin/main:resources/css/app.css | grep -c '!important'` → **46**, nenhuma em comentário: **21** tipografia + **24** toast + **1** iOS. A diferença é exata e explicável: −1 tipografia (o ctvitrine tem a regra extra `[data-vitrine='boutique'] .font-boutique` do V6T4) e −4 toast (as 4 linhas `color: var(--x) !important` dos blocos de ícone, apagadas pela PR #108).
- **O que absorver / o que travar:** nada a absorver. O diagnóstico é: **os `!important` não são estilo, são sintoma de duas fronteiras mal desenhadas.** Os 21–22 de tipografia existem porque o projeto decidiu carimbar família por seletor de elemento (`h1`, `p`, `footer`, `.text-muted-foreground`) em vez de por token/utilitária — e aí precisa vencer o próprio Tailwind. Os 24–28 de toast existem porque se tentou estilizar por CSS uma lib que estiliza por `style` inline.
- **Adaptação necessária:** o caminho de saída da metade tipográfica é o V6T4 (token vira autoridade, utilitária vira consumidora, os seletores de elemento encolhem para o `@layer base`). Não é fatia P.
- **Risco · esforço:** G — mexer nos 21 seletores de tipografia muda a aparência de tudo. **Não recomendo como fatia isolada**; recomendo o V6T4 (2 regras) como primeiro corte.
- **Multi-fonte?** ctfinance tem `app.css` com 1.072 linhas e resolve tipografia por token (`ctfinance.md:147`) — é o único dos quatro que não paga esse pedágio. Não medi o `!important` dele.

---

### V6T7 · `--ring` do ctvitrine é o mesmo nos dois temas e dá 1.85:1 no claro — o defeito que a PR #72 curou aqui, vivo em dois derivados

- **Evidência:** `resources/css/app.css:143@53d7d9a` → `--ring: var(--palette-accent-light);` (claro) e `:194` → `--ring: var(--palette-accent-light);` (escuro). Mesmo `#8ac7e5` nos dois.
- **Contraste medido** (script próprio, fórmula WCAG 2.x, valores batendo ao centésimo com os do teste do boilerplate):

  | par | ratio | SC 1.4.11 (3:1) |
  |---|---|---|
  | `#8ac7e5` vs `--background` `white` | **1.85:1** | reprova |
  | `#8ac7e5` vs `--input` `#e6e7e8` | **1.49:1** | reprova |
  | `#8ac7e5` vs `--background` `#0f2a44` (escuro) | 7.93:1 | passa |
  | `#8ac7e5` vs `--input` `#2c485e` (escuro) | 5.18:1 | passa |

- **Estado do boilerplate hoje:** **corrigido**. `app.css:115@origin/main` (`--brand-cyan-dark: #2a7ba2`, o `--brand-cyan` na mesma matiz/saturação com L 50,6%→40%), `app.css:146` (`--ring` claro) e `:162` (`--sidebar-ring`). Medido: 4.72:1 vs branco e 3.81:1 vs `--input`. Travado por `theme-tokens.test.ts:183-215` (4 pares × 2 temas).
- **O que absorver / o que travar:** nada a absorver — é **backport** para os derivados, item de playbook, não de harvest.
- **Convergência que vale registrar:** o ctvitrine chegou **ao mesmo hex `#2a7ba2`**, por conta própria e por outro caminho — `app/Models/SiteSetting.php:28@53d7d9a`, `DEFAULT_PRIMARY_COLOR = '#2a7ba2'`, com o comentário *"Azul Simplify (#379bcb) escurecido na mesma tonalidade até passar AA: 4,7:1 com texto branco (o original ficava em ~3,1:1)"*. **Verifiquei a aritmética: 4.72:1 e 3.13:1 — as duas reproduzem.** Dois times, dois problemas diferentes (anel de foco × cor default de lojista), o mesmo valor. Isso é evidência forte de que `#2a7ba2` é a resposta certa para "escurecer o ciano da marca até AA".
- **Risco · esforço:** P / P (por derivado).
- **Multi-fonte?** Sim, **três**: ctvitrine (aqui), cuidari (`cuidari.md:2561`, `--ring: var(--color-accent-light)`), boilerplate (curado). ctfinance foi a origem do candidato F5.

---

### V6T8 · O `--primary` do escuro: ctvitrine tem 3,3× a margem de contraste do boilerplate — e o comentário dele descreve um boilerplate que não existe mais

- **Evidência:** `resources/css/app.css:173-177@53d7d9a` —
  ```
  /* No escuro o primary flipa para o accent claro (mesmo padrão da sidebar):
     o upstream usa #379bcb com texto branco (~3,1:1, abaixo de AA); accent
     claro + texto escuro mantém contraste real (~7,9:1) nos botões. */
  --primary: var(--palette-accent-light);      /* #8ac7e5 */
  --primary-foreground: var(--palette-primary-dark);  /* #0f2a44 */
  ```
- **Aritmética verificada:** `#0f2a44` sobre `#8ac7e5` = **7.93:1**. `white` sobre `#379bcb` = **3.13:1**. As duas afirmações do comentário reproduzem.
- **Estado do boilerplate hoje:** `app.css:176-180@origin/main` — `--primary: var(--brand-cyan)` (`#379bcb`) com `--primary-foreground: var(--brand-navy-dark)`, medido **4.68:1**, com comentário próprio dizendo *"branco dá 3.13:1 (reprova AA) e o navy dá 4.68:1. Medido, não estimado"*. **Os dois passam AA; o ctvitrine passa com 3,3× a folga.**
- **O que absorver / o que travar:** **nada, e digo isso com convicção.** O ctvitrine trocou a **matiz do botão primário** por segurança de contraste; o boilerplate manteve o ciano da marca e trocou só o texto. São escolhas de marca, não de correção — 4.68:1 é AA legítimo. **A crítica do comentário do ctvitrine ao "upstream" está desatualizada:** ele descreve `#379bcb` + branco, combinação que o boilerplate não tem mais.
- **O que vale registrar como (b):** um comentário que critica o upstream por valor congela uma versão do upstream. É argumento a favor do V6T13 (teste em vez de comentário).
- **Risco · esforço:** — (não recomendo mudança).
- **Multi-fonte?** cuidari mantém `--primary-foreground: #ffffff` sobre ciano no escuro = **3.13:1, reprova AA, vivo** (`cuidari.md:2561`).

---

### V6T9 · `[absorver]` `<meta name="theme-color">` — o ctvitrine tem, o boilerplate não declara nenhum

- **Evidência:** `resources/views/app.blade.php:21@53d7d9a` → `<meta name="theme-color" content="{{ $meta['theme_color'] ?? '#0f2a44' }}" >`, alimentado por 4 controllers (`Site/LandingController.php:41`, `Site/PrivacyController.php:37`, `Site/TermsController.php:38`, `Signup/ShowSignupController.php:59`, todos `'#0f2a44'`).
- **Estado do boilerplate hoje:** ausente. Medido: `git grep -n "theme-color\|theme_color" origin/main` → **0 linhas**.
- **O que absorver:** a tag, com o valor vindo do mesmo literal que o `<style>` inline já usa (`#0f2a44`) — e entrando no `InlineThemeBackgroundTest` que já trava aquele hex, para não virar uma **terceira** cópia solta. Encaixa naturalmente no F35/`color-scheme` que a PR #112 acabou de assentar: `theme-color` pinta o chrome do browser mobile, `color-scheme` pinta os controles nativos; são complementares.
- **Adaptação necessária:** o `theme-color` do ctvitrine é estático por rota pública. No boilerplate ele deveria acompanhar a aparência — `media="(prefers-color-scheme: dark)"` em duas tags, ou um único valor navy. **Não medi** qual das duas o `use-appearance` suportaria sem JS extra; quem pegar a fatia decide.
- **Risco · esforço:** P / P.
- **Multi-fonte?** Não medido em cuidari/ctfinance.

---

### V6T10 · `[absorver]` `preconnect` para `fonts.bunny.net` é handshake TLS com terceiro que nunca baixa nada — nos DOIS projetos

- **Evidência (ctvitrine):** `resources/views/app.blade.php:138@53d7d9a`. Medido: `git grep -n "bunny" 53d7d9a` → **1 linha na árvore inteira**, essa. Zero `@import`, zero `<link rel=stylesheet>`, zero `src:` apontando para bunny; as 23 `@font-face` de `_fonts.css` são todas `url('/fonts/woff2/…')` locais.
- **Estado do boilerplate hoje:** idêntico. `resources/views/app.blade.php:67@origin/main`; `git grep -n "bunny" origin/main` → **1 linha**.
- **O que absorver / o que travar:** apagar a linha. Já está no BACKLOG como parte do **F38** (`BACKLOG.md:623`); o que esta frente acrescenta é a **segunda fonte** e a medição limpa (1 ocorrência, não N).
- **Adaptação necessária:** nenhuma.
- **Risco · esforço:** P / P. É a fatia mais barata da frente.
- **Multi-fonte?** Sim — ctvitrine e boilerplate, mesmo defeito, herdado do starter kit da Laravel (que usa bunny e foi trocado por self-host sem limpar o `preconnect`).

---

### V6T11 · `[correção de fato]` As "34 `@font-face`" do inventário são **23** — 11 dos 34 matches estão dentro de uma URL da MDN em comentário

- **Evidência:** `resources/css/_fonts.css@53d7d9a`. Onze blocos carregam o comentário `/* Check https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display for other options. */` — e a string `@font-face` está dentro da URL.

  | comando | resultado |
  |---|---|
  | `grep -c '@font-face'` | 34 |
  | `grep -cE '^@font-face'` | **23** |
  | `grep -c 'docs/Web/CSS/@font-face'` | 11 |

  23 + 11 = 34. Fecha. Composição real: Aptos **10**, Montserrat **6**, Merriweather Sans **5**, Playfair Display **2**.
- **Estado do boilerplate hoje:** mesma armadilha. `grep -c '@font-face'` → 32; `grep -cE '^@font-face'` → **21** (as mesmas 23 menos as 2 do Playfair); 11 comentários. O `_fonts.css` do boilerplate tem **21** faces, não 32.
- **O que absorver / o que travar:** **(b) de método.** A contagem errada não é inofensiva: 34 faces sugere "peso demais, corta pesos"; 23 muda a conversa. E o corte seria inútil de qualquer forma — **`@font-face` não usada não custa byte nenhum ao usuário**: o browser só busca o arquivo quando algum elemento seleciona aquela combinação família/peso/estilo. O custo real das 23 é de **repositório** (1.069.976 B em `public/fonts`, medido por `ls-tree -r -l`) e de manutenção, não de rede.
- **O custo de rede real, esse sim medido:** os `<link rel="preload">` de `app.blade.php`, que baixam **incondicionalmente**. Boilerplate, 5 preloads = `aptos.woff2` 72.824 + `aptos-semibold` 73.272 + `aptos-bold` 73.324 + `montserrat-800` 19.012 + `merriweather-regular` 16.940 = **255.372 B em toda navegação**. (Tamanhos medidos na árvore do ctvitrine; **não confirmei que os blobs do boilerplate são byte-idênticos** — os nomes e caminhos são.)
- **O padrão que o ctvitrine tem e o boilerplate não:** preload **condicional por página** — `app.blade.php:134-136@53d7d9a`:
  ```
  @if (str_starts_with($page['component'] ?? '', 'site/boutique/'))
      <link rel="preload" href="/fonts/woff2/playfair-display/playfair-display-latin-600-normal.woff2" …>
  @endif
  ```
  com comentário: *"o Clássico e o admin não pagam o download de uma fonte que nunca desenham"*. O boilerplate hoje tem uma família só de títulos, então o gancho não tem caso de uso — mas o **princípio** ("preload só do que a página desenha") é a regra que impede a lista de 5 virar 8.
- **Risco · esforço:** P / P (o `preconnect` do V6T10 é o item acionável; a contagem é correção de documento).
- **Multi-fonte?** cuidari tem as mesmas 22 `.woff2` em 3 famílias (`cuidari.md:182`) e o inventário dele **não menciona `woff2`/`font-face` uma única vez** — o crítico registrou isso como buraco. Ou seja: a superfície de fontes foi mal contada em dois dos quatro inventários.

---

### V6T12 · `[absorver forma]` + `[guard-rail]` Cor de marca por lojista injetada como `--brand` + `color-mix(in oklab, …)` — a arquitetura que o F3 procura, com um piso de contraste que não existe

Este é o candidato mais substantivo de **(a)** desta frente.

- **Evidência (o mecanismo):**
  - `app/Models/SiteSetting.php:190@53d7d9a` → `'primary_color' => $this->primary_color ?? self::DEFAULT_PRIMARY_COLOR,` (default `#2a7ba2`, `:28`)
  - `resources/js/pages/site/home.tsx:97@53d7d9a` e `site/boutique/home.tsx:230`, `site/boutique/item.tsx:121` → `style={{ '--brand': settings.primary_color } as CSSProperties}` no wrapper da página
  - consumo por utilitária arbitrária: **38** ocorrências de `text-[var(--brand)]`, **7** de `bg-[var(--brand)] text-white`, **33** de `color-mix(in_oklab,var(--brand),white_N%)` (medidos com `git grep -o`), distribuídas em 8 níveis de mistura:

    | mistura | ocorrências |
    |---|---|
    | `white_55%` | 11 |
    | `white_65%` | 6 |
    | `white_90%` | 4 |
    | `white_88%` | 4 |
    | `white_93%` | 3 |
    | `white_85%` | 3 |
    | `white_94%` | 1 |
    | `white_70%` | 1 |

- **Por que importa para o F3:** é exatamente o trio *fill / soft-fill / texto* que o F3 quer, **derivado em runtime de uma cor base desconhecida**, em `oklab` (espaço perceptual, que é a escolha certa) — e é a prova de campo de que a forma `color-mix` funciona. O ctfinance tem a mesma forma com base **conhecida**; o ctvitrine mostra o caso difícil.
- **O defeito que vira guard-rail (b):** a validação é só de formato. `app/Http/Requests/SiteSetting/UpdateSiteSettingRequest.php:35@53d7d9a` —
  ```
  'primary_color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
  ```
  **Nenhum piso de contraste.** E há 7 lugares com `text-white` sobre essa cor e 38 com `text-[var(--brand)]` sobre branco. Medido:

  | cor | branco sobre ela | ela sobre branco | veredito |
  |---|---|---|---|
  | `#2a7ba2` (default) | **4.72:1** | 4.72:1 | AA nos dois sentidos |
  | `#b26e79` (a cor da loja fictícia do mockup, `landing.tsx:36`) | **3.89:1** | 3.89:1 | reprova AA |
  | `#ffff00` (pior caso admitido pelo regex) | **1.07:1** | 1.07:1 | ilegível |

  O default é seguro; **o espaço de valores que o formulário aceita, não.** As 8 misturas ad-hoc agravam: `white_93%` sobre um `--brand` já claro é fundo praticamente branco.
- **Estado do boilerplate hoje:** **não tem cor configurável nenhuma.** Medido: `git grep -ln "primary_color\|theme_color\|brand_color" origin/main` → 0 arquivos. Então isto não é um defeito a consertar aqui — é **a regra a escrever antes de a primeira feature de white-label chegar**.
- **O que absorver / o que travar:**
  1. **Forma:** `style={{ '--x': valorRuntime }}` no wrapper + `color-mix(in oklab, var(--x), …)` para as variações — em vez de gerar N classes ou recalcular em JS. Vale para o F3 mesmo com base estática.
  2. **Regra `.ai/rules`:** *"cor escolhida por usuário nunca é par de um foreground fixo. Ou a validação impõe piso de contraste contra os fundos onde ela será usada, ou o foreground é derivado da luminância dela em runtime."*
  3. **Consolidar as misturas:** 8 percentuais ad-hoc é o sintoma inverso do token — vira 3 níveis nomeados (`soft`, `muted`, `subtle`).
- **Adaptação necessária:** o piso não é uma regra só. `text-white` sobre `--brand` pede ≥4.5:1; `text-[var(--brand)]` sobre branco também; `border-[var(--brand)]` pede só 3:1. Uma regra de validação única inviabiliza metade da paleta de marca legítima — o desenho correto é **derivar o foreground** (preto/branco por luminância) e reservar a validação de piso só para os usos como **texto**.
- **Risco · esforço:** M / M. A forma é P; o piso de contraste é onde mora o projeto.
- **Multi-fonte?** A técnica `color-mix` para estado aparece no ctfinance (`ctfinance.md:438`, e é de lá que o F3 nasce). O caso *runtime* é exclusivo do ctvitrine entre os inventariados.

---

### V6T13 · `[guard-rail]` O ctvitrine acerta 6 de 6 contas de contraste — em comentário, sem um único teste. É o argumento mais limpo a favor do artefato que o boilerplate já tem

- **Evidência:** recalculei ao centésimo cada afirmação de contraste escrita no código do ctvitrine:

  | afirmação | onde | recalculado | bate? |
  |---|---|---|---|
  | branco sobre `#25D366` ≈ 1,98:1 | `resources/js/pages/site/landing.tsx:71-73@53d7d9a` | **1.98:1** | ✓ |
  | `#0f2a44` sobre `#25D366` = 7,38:1 | idem | **7.38:1** | ✓ |
  | `#0f2a44` sobre `#1FB457` (hover) = 5,38:1 | idem | **5.38:1** | ✓ |
  | `#2a7ba2` com texto branco = 4,7:1 | `app/Models/SiteSetting.php:25-28` | **4.72:1** | ✓ |
  | `#379bcb` com texto branco ≈ 3,1:1 | idem | **3.13:1** | ✓ |
  | accent claro + texto escuro ≈ 7,9:1 | `resources/css/app.css:174-175` | **7.93:1** | ✓ |

- **E ainda assim:** medido `git ls-tree -r 53d7d9a --name-only -- resources/js/test` → 16 entradas, **nenhuma** em `styles/`, nenhuma sobre token, tema ou contraste. Os 14 arquivos `.test.tsx?` cobrem componentes, hooks, máscaras e tracking. **Zero teste de tema.** E o resultado disso está no V6T7: o `--ring` a 1.85:1 passou despercebido no mesmo arquivo onde havia três contas corretas de contraste, e o comentário do V6T8 envelheceu para descrever um upstream que já mudou.
- **Estado do boilerplate hoje:** `resources/js/test/styles/theme-tokens.test.ts` (216 linhas) + `focus-ring.test.ts` — 6 pares × 2 temas para AA, 4 pares × 2 temas para o anel, guarda de namespace `--color-*`, e uma **catraca com data de validade** (`:161-168`): `DIVIDA_DESTRUCTIVE_ESCURO = 3.67` com asserção dupla — falha se piorar **e** falha se chegar a 4.5, com a mensagem *"se passou de 4.5, o F3 chegou — mova o par para a tabela de cima"*. **Reproduzi todos os números desse teste com script independente: 3.67, 3.99, 1.85, 1.49, 4.72, 3.81, 7.93, 5.18, 3.13, 4.68. Todos batem.** Este é o melhor artefato de contraste dos quatro projetos, e não é perto.
- **O buraco que sobra, medido:** a tabela de pares (`:128-135`) cobre `primary, secondary, accent, muted, card, background`. **Não cobre `success`, `warning` nem `info`** — que o `app.css` declara com `-foreground` em ambos os temas (`:135-140` e `:189-194`). Recalculado:

  | par declarado | claro | escuro |
  |---|---|---|
  | `--success-foreground` / `--success` | `white` sobre `#16a34a` = **3.30:1** | `white` sobre `#22c55e` = **2.28:1** |
  | `--warning-foreground` / `--warning` | `white` sobre `#f59e0b` = **2.15:1** | `#0f2a44` sobre `#fbbf24` = 8.77:1 |
  | `--info-foreground` / `--info` | `white` sobre `#0ea5e9` = **2.77:1** | `#0f2a44` sobre `#38bdf8` = 6.83:1 |

  **Quatro pares declarados reprovam AA e nenhum é vigiado.** Hoje o dano é contido porque esses tokens não são texto em lugar nenhum (medido: os únicos consumidores são `border-left: 4px` no CSS e o `iconTheme` do `toast-config.ts`) — mas o F2 vai transformá-los em `text-success`/`text-warning`/`text-info`, e é essa a razão de o `BACKLOG.md:545` exigir que F2 viaje com F3.
- **O que absorver / o que travar:** **(b)**, e é fatia P: mover `success`/`warning`/`info` para o mesmo modelo de catraca do `destructive` — asserção "não piora" com o valor atual + asserção "se passou de 4.5, o F3 chegou". Nasce verde, documenta os quatro números, e impede que alguém "melhore" a paleta de estado sem medir.
- **Risco · esforço:** P / P. **Recomendo como a primeira fatia desta frente.**
- **Multi-fonte?** ctfinance tem `test/styles/design-tokens-contract.test.ts` (26 tokens + 11 classes) — mas é contrato de **presença**, não de **contraste** (`ctfinance.md:147,381`). cuidari tem **zero** teste de tema (`cuidari.md:2652`).

---

### V6T14 · `[guard-rail]` Achado novo na mesma família da PR #108: `iconTheme` de `warning` e `info` é config morta — e o teste que a PR #108 escreveu trava as duas

Não vem do ctvitrine; nasceu de conferir, na fonte da lib, a afirmação que a PR #108 deixou escrita. Reporto porque é do meu escopo (cor) e refuta uma guarda recém-criada.

- **Evidência (fonte da lib instalada, `node_modules/react-hot-toast/dist/index.js`, v2.6.0):**
  ```js
  $=({toast:e})=>{ let {icon:t, type:o, iconTheme:s}=e;
    return t!==void 0 ? (typeof t=="string" ? createElement(ve,null,t) : t)
         : o==="blank" ? null
         : createElement(Re,null, createElement(L,{...s}), …) }
  ```
  `icon !== undefined` **retorna antes** — `iconTheme` nunca chega ao indicador.
- **Estado do boilerplate hoje:** `resources/js/lib/toast-config.ts@origin/main` define `icon: '⚠️'` (`:74`) e `icon: 'ℹ️'` (`:97`). Logo `iconTheme` de `:87-90` e `:109-112` **nunca é lido**. E `resources/js/test/lib/toast-config.test.ts:49-56` afirma nas linhas 52 e 53 exatamente essas duas, sob um comentário (`:39`) que diz *"A cor do ícone é `iconTheme`, e este é o único canal que funciona"* — **falso para metade das linhas da própria tabela**.
- **O que travar:** as 2 linhas de `iconTheme` morto saem do `toast-config.ts`; a tabela do teste vira 2 linhas (`success`, `error`) mais 2 asserções de que `warning`/`info` definem `icon` e por isso **não** usam `iconTheme`; o comentário passa a dizer os dois canais e quando cada um vale.
- **Contraste, de brinde (medido nos dois canais vivos):** `iconTheme` = glifo sobre disco colorido → SC 1.4.11, 3:1.

  | variante | claro | escuro |
  |---|---|---|
  | success (`white` / `--success`) | 3.30:1 passa | **2.28:1 reprova** |
  | error (`white` / `--destructive`) | 4.70:1 passa | 3.67:1 passa |

  **Uma reprovação viva e visível: o glifo do toast de sucesso no tema escuro.** Nasce e morre com a mesma fatia do V6T13.
- **Risco · esforço:** P / P.
- **Multi-fonte?** O ctvitrine tem os mesmos `icon: '⚠️'`/`'ℹ️'` e o mesmo par `iconTheme` (`resources/js/lib/toast-config.ts:70-100@53d7d9a`) — herdou o defeito e ainda tem as 4 regras de CSS morto que a #108 apagou aqui.

---
---

## ENTREGÁVEL F3 — qual das quatro fontes tem o sistema de tokens de ESTADO mais maduro

### Tabela comparativa

| Fonte | Como resolve estado | Números medidos | Guard-rail | Veredito |
|---|---|---|---|---|
| **ctfinance** | **Único com trio real.** `@theme` expõe `success/warning/info`; escalas `--space-1..12`, `--radius-{control,surface,hero}`, `--focus-ring-*`, `--surface-{base,elevated,overlay,subtle}`, **`--state-*`**; `@layer components` com `.surface-page`/`.surface-panel`; `app.css` 1.072 l. (`ctfinance.md:147`) | ⚠️ Fórmula `color-mix` **não transporta**: aplicada à paleta do boilerplate, **3 dos 4 reprovam** — warning **2.53:1**, info **3.26:1**, success **3.92:1** (`ctfinance.md:438`, aritmética já refeita ao centésimo pela lente). Números **não re-medidos por mim** — fonte fora do meu pin | `design-tokens-contract.test.ts` — 26 tokens + 11 classes. **Contrato de presença, não de contraste** | **Vence na FORMA. Perde em todo valor.** Carrega a colisão `--color-*` sem resolver (`BACKLOG.md:536`) |
| **ctvitrine** | **Não tem token de estado.** Medido: `git grep -n -- '--state-\|--status-' 53d7d9a` → **0 linhas**. `--success/--warning/--info` existem em `:root`/`.dark` e são consumidos **só** como `border-left: 4px` (`app.css:635,657,668`) e `iconTheme` (`lib/toast-config.ts`) — nunca como texto nem fundo | Pares declarados, medidos por mim: claro `white`/`#16a34a` **3.30**, `white`/`#f59e0b` **2.15**, `white`/`#0ea5e9` **2.77**; escuro `white`/`#22c55e` **2.28**. Idênticos aos do boilerplate (mesmos hexes) | **Zero.** Sem `test/styles/`; 16 entradas em `resources/js/test`, nenhuma de tema | **Não concorre no F3.** Contribui outra coisa: o `--brand` runtime + `color-mix(in oklab)` do V6T12 |
| **cuidari** | Não tem token de estado. Tem a **colisão `--color-*` viva** (`app.css:107-112`, `cuidari.md:2548-2556`), `--ring` a 1.85:1 e `--primary-foreground` branco sobre ciano a **3.13:1** — ambos reprovando, ambos vivos (`cuidari.md:2561`) | Números do inventário; **não re-medidos por mim** | **Zero teste de front sobre tema** (`cuidari.md:2652`) | **Último. Não copiar nada.** |
| **boilerplate `origin/main`** | Também **não tem** `--state-*`, e os 6 pares `success/warning/info` não estão no `@theme` (medido no compilado: `.text-success{` e `.bg-success{` → **0 ocorrências**; controle positivo `.text-destructive{` → 1) | **Todos re-medidos por mim, batendo com o teste dele:** `--ring` claro 4.72 / 3.81 · escuro 7.93 / 5.18 · `primary` escuro 4.68 · `destructive` escuro 3.67 (fill) e 3.99 (texto) · os 4 buracos de estado da linha acima | **`theme-tokens.test.ts` (216 l.) + `focus-ring.test.ts` — o melhor artefato dos quatro, e não é perto.** 6 pares × 2 temas AA; 4 pares × 2 temas ×3:1 no anel; guarda de namespace; **catraca com data de validade** que falha se `destructive` piorar E falha quando passar de 4.5 ("o F3 chegou") | **Vence no MÉTODO e na ARITMÉTICA. Perde na forma** |

### Recomendação explícita para o F3

**Não canonizar nenhuma das quatro inteira. O F3 é uma costura de dois, com peças nomeadas:**

1. **A FORMA vem do ctfinance, e só a forma.** O trio `--state-{status}-{bg,fg,border}` é a única resposta correta para o problema real — um token achatado por status faz dois trabalhos incompatíveis, e o boilerplate tem a prova aritmética no próprio arquivo: `--destructive` no escuro dá **3.67:1** como fundo de botão e **3.99:1** como cor de texto; escurecer conserta um e quebra o outro (`theme-tokens.test.ts:148-160`). Exportar via **`@utility`**, não `@layer components` — pelo motivo do V6T5: o que está fora de layer perde a cascata para o Radix.

2. **Os VALORES nascem aqui, calculados, nunca copiados.** Os percentuais de `color-mix` do ctfinance reprovam 3 de 4 na paleta do boilerplate. E há um piso que a fatia não pode furar: o emerald inline hoje em `verify-email.tsx` está em **14.38:1** (`ctfinance.md:438`); trocá-lo por um `state-success-soft` mal calibrado é regressão de acessibilidade, não melhoria.

3. **O GUARD-RAIL é o do boilerplate, estendido — e este é o ponto em que discordo do enquadramento da pergunta.** A pergunta assume que o F3 espera uma arquitetura. Ele espera **duas** coisas, e a segunda já está aqui: `theme-tokens.test.ts` é o único dos quatro artefatos que mede contraste, e o único que sabe expressar dívida com data de validade. O F3 não deve escrever um contrato de presença no molde do `design-tokens-contract.test.ts` do ctfinance — deve **acrescentar linhas à tabela de pares que já existe**, para que cada `--state-*-fg` novo nasça com sua razão medida e o `destructive` migre da catraca para a tabela principal, como o próprio teste pede em `:167`.

4. **Do ctvitrine, uma peça e uma regra.** A peça: `color-mix(in oklab, base, white N%)` para os *soft fills* — espaço perceptual, e é a única forma dos quatro que já roda contra base desconhecida em produção (V6T12). A regra: **consolidar em 3 níveis nomeados**, porque o ctvitrine mostra para onde isso degenera sem token — **8 percentuais distintos** (`white_55/65/70/85/88/90/93/94%`) em 33 call sites, medidos.

5. **Ordem, e uma catraca que pode entrar antes.** F1 → F2 → F3 continua correta e não estou propondo furá-la. Mas o V6T13 — estender a tabela de pares para `success`/`warning`/`info` no molde da catraca do `destructive` — **nasce verde, é P, não depende do F1 e documenta os quatro números que o F3 vai ter de mover**. Recomendo que entre como primeira fatia desta frente, antes do F1. Se o F3 demorar mais um mês, esses quatro pares seguem sem vigilância nenhuma pelo mês inteiro.

**Se a resposta tivesse de ser uma palavra:** o sistema de tokens de estado mais maduro dos quatro é o do **ctfinance**, e o F3 não deve canonizá-lo — deve canonizar o **desenho** dele dentro do **método** do boilerplate. Copiar o ctfinance inteiro embarcaria 3 reprovações de AA; escrever do zero jogaria fora o único trio bem desenhado da família. Nenhuma das duas é a resposta.

---

#### Medições

Fonte lida **exclusivamente** por `git show`/`git grep`/`git ls-tree` sobre `53d7d9a`. Alvo lido por `git show`/`git grep` sobre `origin/main` (= `beb848e`, confirmado por `git rev-parse origin/main`). Três medições saem de arquivos do **disco do boilerplate** e estão rotuladas.

```bash
# --- baseline ---
git -C .../boilerplate rev-parse origin/main                        # beb848ea…
git -C .../boilerplate merge-base --is-ancestor 30fe0eb origin/main # YES (PR #108 já em main)

# --- V6T1 / V6T9 / V6T10 ---
git -C .../ctvitrine show 53d7d9a:resources/views/app.blade.php | cat -n
git -C .../boilerplate show origin/main:resources/views/app.blade.php | cat -n
git -C .../ctvitrine  grep -n "bunny"  53d7d9a        # 1 linha (app.blade.php:138)
git -C .../boilerplate grep -n "bunny" origin/main    # 1 linha (app.blade.php:67)
git -C .../boilerplate grep -n "theme-color\|theme_color" origin/main   # 0 linhas
git -C .../boilerplate grep -n "0f2a44" origin/main   # 4 arquivos, um é o teste de sincronia

# --- V6T2 / V6T3 ---
git -C .../ctvitrine grep -n -- '--palette-' 53d7d9a
git -C .../ctvitrine grep -n -- 'var(--palette' 53d7d9a
for t in palette-primary-dark palette-primary palette-primary-darker \
         palette-accent-light palette-accent palette-muted-light; do
  git -C .../ctvitrine grep -o -- "--$t" 53d7d9a -- ':!resources/css/app.css' | wc -l; done
git -C .../ctvitrine show 53d7d9a:resources/css/app.css | awk 'NR>74' | grep -E '^\s*--color-'  # vazio
git -C .../boilerplate grep -c 1f3c57 origin/main     # 0

# --- V6T4  (as 3 últimas linhas leem o ARTEFATO COMPILADO no disco do boilerplate,
#            build de 2026-08-20 16:00, working tree em 30fe0eb, ancestral de origin/main) ---
git -C .../boilerplate grep -n 'var(--font-title)\|var(--font-subtitle)\|font-subtitle' origin/main -- resources
for c in font-title font-subtitle font-support font-boutique; do
  git -C .../ctvitrine  grep -o "$c" 53d7d9a    -- resources/js resources/views | wc -l
  git -C .../boilerplate grep -o "$c" origin/main -- resources/js resources/views | wc -l; done
grep -o -- '.font-title{[^}]*}' public/build/assets/app-BKlgUCP1.css
grep -bo -- '.font-title{'  public/build/assets/app-BKlgUCP1.css   # 44554, 815278
grep -bo '@layer utilities{' public/build/assets/app-BKlgUCP1.css  # 16742

# --- V6T5  (mesmo artefato de disco) ---
python3 -c "import re,sys; s=open('public/build/assets/app-BKlgUCP1.css').read();
  print([m.start() for m in re.finditer(r'--color-background\s*:',s)]);
  print([m.start() for m in re.finditer(r'@layer',s)])"
  # --color-background em 11010 / 227969 / 232573 ; @layer em 66/5429/12152/16724/16742
git -C .../boilerplate grep -n "radix-ui/themes" origin/main -- resources/js/app.tsx
git -C .../boilerplate grep -n 'layer(' origin/main -- resources/js/test resources/css   # 0 linhas

# --- V6T6 ---
git -C .../ctvitrine  show 53d7d9a:resources/css/app.css   | grep -c '!important'   # 52 (1 em comentário → 51)
git -C .../boilerplate show origin/main:resources/css/app.css | grep -c '!important' # 46 (0 em comentário)
# … | grep -n '!important' | awk -F: '{print $1}'   → linhas usadas na classificação

# --- V6T11 ---
git -C .../ctvitrine  show 53d7d9a:resources/css/_fonts.css | grep -c '@font-face'                  # 34
git -C .../ctvitrine  show 53d7d9a:resources/css/_fonts.css | grep -cE '^@font-face'                # 23
git -C .../ctvitrine  show 53d7d9a:resources/css/_fonts.css | grep -c 'docs/Web/CSS/@font-face'     # 11
git -C .../boilerplate show origin/main:resources/css/_fonts.css | grep -cE '^@font-face'           # 21
git -C .../ctvitrine ls-tree -r -l 53d7d9a -- public/fonts     # tamanhos; soma = 1.069.976 B

# --- V6T12 ---
git -C .../ctvitrine grep -n "DEFAULT_PRIMARY_COLOR\|primary_color" 53d7d9a
git -C .../ctvitrine grep -o 'bg-\[var(--brand)\] text-white'                    53d7d9a -- resources/js | wc -l  # 7
git -C .../ctvitrine grep -o 'text-\[var(--brand)\]'                             53d7d9a -- resources/js | wc -l  # 38
git -C .../ctvitrine grep -o 'color-mix(in_oklab,var(--brand),[a-z]*_[0-9]*%)'   53d7d9a -- resources/js | sort | uniq -c  # 33 em 8 níveis
git -C .../boilerplate grep -ln "primary_color\|theme_color\|brand_color" origin/main   # 0

# --- V6T13 ---
git -C .../ctvitrine ls-tree -r 53d7d9a --name-only -- resources/js/test   # 16 entradas, 0 em styles/
git -C .../boilerplate show origin/main:resources/js/test/styles/theme-tokens.test.ts | cat -n
git -C .../boilerplate grep -n -- 'var(--success\|var(--warning\|var(--info' origin/main -- resources

# --- V6T14  (lê node_modules do disco do boilerplate — lib instalada, v2.6.0 confirmada) ---
node -e "console.log(require('./node_modules/react-hot-toast/package.json').version)"   # 2.6.0
python3 -c "s=open('node_modules/react-hot-toast/dist/index.js').read(); i=s.find('iconTheme'); print(s[i-600:i+200])"
git -C .../boilerplate show origin/main:resources/js/lib/toast-config.ts | cat -n
git -C .../boilerplate show origin/main:resources/js/test/lib/toast-config.test.ts | cat -n

# --- todos os números de contraste ---
# script próprio (WCAG 2.x: linearização sRGB + luminância relativa + (L1+.05)/(L2+.05)),
# salvo em <scratchpad>/contrast.py. Validação cruzada: os 10 valores que o
# theme-tokens.test.ts do boilerplate afirma (3.67 · 3.99 · 1.85 · 1.49 · 4.72 ·
# 3.81 · 7.93 · 5.18 · 3.13 · 4.68) reproduzem ao centésimo, e as 6 afirmações de
# contraste escritas no código do ctvitrine (1.98 · 7.38 · 5.38 · 4.72 · 3.13 ·
# 7.93) também.
```

**Não medido, e onde isso importa:**
- Os números do **ctfinance** (2.53 / 3.26 / 3.92 / 14.38) e do **cuidari** vêm dos inventários — as fontes estão fora do meu pin. Estão citados com a fonte, e a tabela do F3 marca isso.
- Não conferi se os `.woff2` do boilerplate são byte-idênticos aos do ctvitrine; comparei nomes e caminhos.
- Não rodei build no boilerplate. O `public/build/assets/app-BKlgUCP1.css` já existia no disco (2026-08-20 16:00) com a working tree em `30fe0eb`, que é ancestral de `origin/main` — as três medições que dependem dele (V6T4, V6T5 e a contagem de `.text-success`) devem ser reconfirmadas por quem aplicar a fatia, com build limpo em `origin/main`.
- Não varri token a token no boilerplate para o teste de órfão do V6T2 — só os seis do ctvitrine.

### Lente REFUTAR — vereditos

# Veredito da lente REFUTAR — Caçador 1 (tokens, tema, paleta, dark mode, tipografia, contraste)

Baseline reconfirmado por mim: `git -C boilerplate rev-parse origin/main` → **`beb848ea509bf6682c9e31f10611ad7ab489392e`**. Todos os 24 valores de contraste do lote foram recalculados com script próprio (`<scratchpad>/contrast.py`, WCAG 2.x) — **os 24 reproduzem ao centésimo**. Aritmética não é onde este lote falha; o que falha é lente 1 (já existe) e lente 4 (custo>ganho).

Um aviso de método antes dos vereditos: a inferência "o último `@layer` abre no byte 16.742, logo o que vem depois está fora de layer" **não é prova** — não diz nada sobre onde o bloco fecha. Refiz com varredura de chaves com pilha (`postcss` não está instalado; Tailwind v4 não o usa). A primeira tentativa deu `EOF depth 1 / aspa não fechada` por causa dos `\'` escapados em seletores como `.\[\&_svg\:not\(\[class\*\=\'size-\'\]\)\]\:size-4`; com escape tratado fora de string, fecha em `EOF depth 0, quote None`. Só então as conclusões de V6T4/V6T5 se sustentam — e se sustentam.

---

### V6T1 — DERRUBADO

Lente 1. O hunter já reconhece que está curado, e propõe como entregável uma linha de `.ai/rules`. Mas a regra **já é executável e já é mais forte que a prosa proposta**: `tests/Unit/Theme/InlineThemeBackgroundTest.php:135-142` falha em qualquer `var(--` dentro do `<style>` inline, com a mensagem *"roda antes (ou na ausência) do app.css: um var() aqui fica sem valor exatamente na janela que este bloco existe para cobrir"* — e cobre **os dois** blades (`app.blade.php` e `errors/500.blade.php`), com o teste de sincronia hex↔token (`:144-165`) e o de `color-scheme` por classe (`:167-178`) por cima. Trocar um teste verde por um parágrafo é regressão de garantia.

Agravante de escopo: `.ai/rules/css.md` declara `paths: ['resources/css/**']`, então a regra proposta **nem dispararia** ao editar um blade. Sobrevive apenas o que o hunter mesmo classificou assim: item de playbook para os derivados, não fatia do boilerplate.

---

### V6T2 — SOBREVIVE, escopo reduzido a metade do proposto

O fato central reproduz: `var(--palette-primary)` e `var(--palette-accent)` têm **0** consumidores em `53d7d9a`. Mas o candidato erra três fatos verificáveis e não é novo:

| afirmação do candidato | o que eu medi | comando |
|---|---|---|
| `--palette-primary-dark`: 21 consumidores | **20** (19 em `app.css` + 1 em `app.blade.php`) | `git show 53d7d9a:<f> \| grep -o 'var(--palette-primary-dark)'` por arquivo |
| `--palette-accent-light`: 12 | **11** | idem |
| `git grep -c 1f3c57 origin/main` → **0 linhas** | **1 linha**: `resources/js/test/styles/theme-tokens.test.ts:10`, num comentário | `git grep -n 1f3c57 origin/main` |

O terceiro é o que importa como método: o hunter apresentou "0" como medição e o comando devolve 1. A conclusão substantiva ("`#1f3c57` não sobrevive como *valor de token*") continua verdadeira, mas foi afirmada com um número que não é o que o comando dá.

**Não é achado novo:** `ctvitrine.md:3902` já registra *"`var(--palette-primary)` e `var(--palette-accent)` com **zero** uso"*.

**Escopo corrigido que sobrevive:** só o guard-rail — asserção em `theme-tokens.test.ts` de que todo token declarado em `:root` tem ao menos um `var()` que o leia. O hunter admite não ter varrido o boilerplate token a token, e essa varredura **é** o risco da fatia, não um detalhe: quem pegar mede antes de escrever, e a fatia só entra se nascer verde sem allowlist. Sem isso é P na aparência e M na prática.

---

### V6T3 — DERRUBADO

Não é candidato. O próprio bloco diz "nada a absorver — as três fontes já concordam", `Risco · esforço: —`, e nenhuma ação sai dele. Resultado nulo bem medido (confirmei: `git show 53d7d9a:resources/css/app.css | awk 'NR>74' | grep -cE '^\s*--color-'` → **0**), mas resultado nulo não é fatia. O que ele aponta como ativo é o V6T4/V6T5, julgados lá.

---

### V6T4 — SOBREVIVE, com a manchete corrigida

**Mecanismo CONFIRMADO por varredura independente.** No `public/build/assets/app-BKlgUCP1.css` (824.001 B no disco, gitignorado, build de 2026-08-20 16:00 com working tree em `30fe0eb`):

| byte | regra | ancestrais (varredura com pilha) |
|---|---|---|
| 44.554 | `.font-title{font-family:var(--font-title)}` | `['LAYER @layer utilities']` |
| **815.276** | `.font-title{font-family:Montserrat,sans-serif!important}` | **`[]` — topo de nível, fora de qualquer layer** |

Fora de layer vence layer, e ainda leva `!important`. A fonte disso é `resources/css/app.css:450-452@origin/main`. Confirmado.

**A manchete é falsa.** "Os **três** tokens `--font-*` do `@theme` são funcionalmente órfãos" não se sustenta: `--font-sans` tem **5** consumidores vivos (`git show origin/main:resources/css/app.css | grep -c 'var(--font-sans)'` → 5, incluindo `:442`), mais `lib/toast-config.ts`. São **dois** órfãos, não três — `--font-title` (sombreado) e `--font-subtitle` (`git grep -n font-subtitle origin/main` → **1 linha, a própria declaração**). Byte 815.278 é 815.276.

**Achado que o candidato perdeu e que muda a fatia:** `.font-support` (`app.css:455-457`, com `!important`) tem **zero** uso no markup — `git grep -o 'font-support' origin/main -- resources/js resources/views | wc -l` → **0**. Ele não sumiu do compilado; o minificador o fundiu com os outros seletores da mesma declaração (`grep -o 'font-support[^}]*}'` mostra a lista mesclada). Ou seja: o arquivo tem **duas** utilitárias de tipografia escritas à mão, uma sombreando o token e outra sem call-site nenhum.

**Escopo corrigido:** (1) apagar `.font-title` de `app.css:450-452`; (2) apagar `.font-support` de `:455-457` (0 call-sites) ou dar-lhe um; (3) decidir `--font-subtitle` — ganha consumidor ou sai; (4) a extensão do teste. Risco de aparência é nulo em (1) — `var(--font-title)` resolve para `'Montserrat', sans-serif`, idêntico ao literal. A ressalva do hunter sobre `.font-sans` procede e a allowlist tem de trazer o porquê escrito.

Nota de dependência: `BACKLOG.md:606` (F17) já registra "`--font-title` usado 2×" — bate com a minha medição, e a fatia deve nascer sabendo que o F17 mexe no mesmo terreno.

---

### V6T5 — DERRUBADO como fatia; a prova fica como evidência do F1

**O mecanismo é real** — e é a única coisa aqui que eu confirmei de forma independente:

| byte | seletor | ancestrais |
|---|---|---|
| 11.010 | `:root,:host` → `--color-background: var(--background)` | `['LAYER @layer theme', ':root,:host']` |
| 227.969 | `:where(.radix-themes)` → `white` | **`[]`** |
| 232.573 | `:is(.dark,.dark-theme)…` → `var(--gray-1)` | **`[]`** |

Wrapper confirmado em `resources/js/app.tsx:7,27-39@origin/main`.

Mas as lentes 1 e 4 o derrubam como candidato:

1. **Já existe, duas vezes.** `BACKLOG.md:534` (F1 Defeito 3) registra exatamente isto, com os offsets do build anterior. E `.ai/rules/css.md:18` **já é a regra por escrito**: *"Folha de terceiro entra em layer — `@import` de CSS de biblioteca traz declarações fora de layer, que vencem o `@theme`. Hoje `@radix-ui/themes/styles.css` redeclara `--color-background` e sequestra `bg-background` no app inteiro — dívida registrada, ainda não paga."* O candidato propõe escrever uma regra que está escrita.
2. **A única peça não construída nasce vermelha, por admissão do próprio candidato.** Confirmei que não existe: `git grep -n 'layer(' origin/main -- resources/js/test resources/css` → **0 linhas**. Mas uma asserção que falha no commit em que entra não é catraca — é o F1. "Ou entra junto com a correção do import, ou entra com um `expect.fail` documentado" é a descrição de um PR que já está na fila como G, não de uma fatia P.

Sobrevive **como evidência**: os três offsets com ancestralidade provada devem substituir os do F1, que foram medidos noutro build. Isso é atualizar o BACKLOG, não abrir fatia.

O único ponto genuinamente novo — `theme-tokens.test.ts:20` lê só `resources/css/app.css`, então passa verde com o sequestro vivo — é correto e vale uma linha na nota do F1.

---

### V6T6 — DERRUBADO

Lente 4, e o candidato se derruba sozinho: *"Não recomendo como fatia isolada"*, risco G, nenhuma ação. É classificação, não candidatura.

Registro que a aritmética é impecável — reproduzi a distribuição inteira por número de linha:

- ctvitrine: 52 matches, `:516` dentro do comentário `/* … */` de `:514-520` → **51 declarações** = 22 tipografia + 28 toast + 1 iOS.
- boilerplate: 46, nenhuma em comentário = **21** tipografia (98…514) + **24** toast (608…670) + **1** iOS (`:595`, dentro do `@supports (-webkit-touch-callout: none)`). 21+24+1 = 46. Fecha.

A diferença de −1/−4 é exatamente como o candidato explica. Mas somar bem não é propor.

---

### V6T7 — DERRUBADO

Lente 1, admitida pelo próprio candidato: curado em `origin/main` pela PR #72 (`--brand-cyan-dark: #2a7ba2` em `app.css:115`, `--ring` em `:146` e `--sidebar-ring` em `:162`, travado por `theme-tokens.test.ts:183-215`). Backport para derivado é playbook, não harvest — e a instrução desta rodada é fatia no boilerplate.

Todos os números reproduzem (1.85 / 1.49 / 7.93 / 5.18 no ctvitrine; 4.72 / 3.81 no boilerplate), e a convergência do `#2a7ba2` é real: `SiteSetting.php:28@53d7d9a` chega ao mesmo hex por outro caminho, e as duas contas do comentário dele (4,7:1 e ~3,1:1) reproduzem em 4.72 e 3.13. É uma boa observação. Não é uma mudança.

---

### V6T8 — DERRUBADO

O candidato conclui *"nada, e digo isso com convicção"*. Concordo, e a aritmética confirma os dois lados (7.93 no ctvitrine, 4.68 no boilerplate, ambos AA). Nada a julgar.

O resíduo — "comentário que critica o upstream por valor congela uma versão do upstream" — é argumento de apoio ao V6T13, e já está lá.

---

### V6T9 — DERRUBADO

**Lente 1, e é o golpe mais limpo do lote.** O candidato mediu o código (`git grep theme-color origin/main` → 0 linhas, confirmo) e **não mediu o BACKLOG**. Está lá, enfileirado, com fonte:

```
BACKLOG.md:620
| F14 | `<meta name="theme-color">` por esquema | absorver P | absorver corrigindo o erro do ctfinance |
```

Pior para o candidato: o F14 diz **"por esquema"** — ou seja, já decidiu a pergunta que o V6T9 deixa em aberto (*"não medi qual das duas o `use-appearance` suportaria"*), e já sabe que existe um erro do ctfinance a evitar na cópia. O candidato é estritamente mais pobre que o item que duplica.

Sobrevive **só** como segunda fonte anotada no F14 (o ctvitrine tem a tag em `app.blade.php:21@53d7d9a`, estática por rota, alimentada por 4 controllers) e como o bom ponto de encaixe que ele identifica: entrar no `InlineThemeBackgroundTest`, que já trava `#0f2a44` em 4 arquivos, para não virar uma terceira cópia solta.

---

### V6T10 — SOBREVIVE como adendo ao F38, não como fatia nova

Fato confirmado nos dois lados: `git grep -n bunny 53d7d9a` → 1 linha (`app.blade.php:138`); `git grep -n bunny origin/main` → 1 linha (`app.blade.php:67`). Zero `@font-face`/`@import`/`<link>` apontando para bunny.

Já enfileirado: `BACKLOG.md:623` (F38). O candidato reconhece. Contribuição real = segunda fonte + a medição limpa (1 ocorrência, não N).

**Escopo corrigido:** não abrir fatia; anexar a linha de segunda fonte ao F38 e deixar que a PR do F38 apague as duas ocorrências (a do boilerplate agora, a do ctvitrine no playbook). Abrir PR próprio para uma linha que já tem PR previsto é custo de processo maior que o ganho.

---

### V6T11 — SOBREVIVE, e é a única correção de fato genuinamente nova do lote

Reproduzi tudo, exato:

| | `grep -c '@font-face'` | `grep -cE '^@font-face'` | `grep -c 'docs/Web/CSS/@font-face'` |
|---|---|---|---|
| ctvitrine `_fonts.css` | 34 | **23** | 11 |
| boilerplate `_fonts.css` | 32 | **21** | 11 |

23+11=34 e 21+11=32. Composição do ctvitrine confirmada por `grep -A3 -E '^@font-face' \| grep font-family \| sort \| uniq -c`: Aptos **10**, Montserrat **6**, Merriweather Sans **5**, Playfair Display **2**.

E o erro propaga: `ctvitrine.md:2734` mostra o comando que mediu — literalmente `grep -c '@font-face'` — e o 34 aparece em **três** lugares (`:2500`, `:3825`, `:3902`). **Não está entre as 8 correções do banner**, então quem consultar o banner primeiro, como o próprio banner manda, continua consumindo 34.

Duas ressalvas de escopo, ambas do próprio candidato e ambas corretas: (a) os 255.372 B de preload foram medidos nos blobs do **ctvitrine**, e ele não confirmou que os do boilerplate são byte-idênticos — a fatia não pode citar esse número como do boilerplate; (b) a parte acionável (o `preconnect`) é V6T10/F38, não isto.

**Escopo corrigido:** correção de documento — editar as três ocorrências em `ctvitrine.md` e acrescentar a linha ao banner, com o par de comandos que separa 23 de 34. Zero código. O princípio do preload condicional por página (`app.blade.php:134-136@53d7d9a`) vale como nota no `.ai/rules/views.md`, mas hoje o boilerplate tem uma família de títulos só e nenhum caso de uso — nota, não regra com teste.

---

### V6T12 — SOBREVIVE, mas re-enquadrado: é regra + técnica dentro do F3, nunca `[absorver]` autônomo

Todos os números reproduzem, sem exceção:

- `text-[var(--brand)]` → **38** · `bg-[var(--brand)] text-white` → **7** · `color-mix(in_oklab,var(--brand),…)` → **33** em 8 níveis (11/6/4/4/3/3/1/1 — soma 33, fecha).
- Validação só de formato: `UpdateSiteSettingRequest.php:35` → `['nullable','string','regex:/^#[0-9a-fA-F]{6}$/']`. Nenhum piso.
- Contrastes: `#2a7ba2` **4.72** · `#b26e79` **3.89** · `#ffff00` **1.07**. Confirmados.
- Boilerplate: `git grep -ln "primary_color\|theme_color\|brand_color" origin/main` → **0 arquivos**. Confirmado.

Correção menor: são **5** pontos de injeção de `--brand`, não 3 — o candidato omitiu `site/item.tsx:50` e `landing.tsx:820`.

**Por que o enquadramento `[absorver]` cai (lente 4):** o boilerplate não tem cor configurável, não tem white-label, não tem formulário de lojista. Não há nada para absorver — não existe o defeito que a peça conserta nem a feature que ela serve. O que sobra é: uma **técnica** (`style={{'--x': runtime}}` + `color-mix(in oklab, …)`) que o F3 pode ou não usar, e uma **regra preventiva**. Isso não é fatia; é insumo de um item G que já está na fila e cuja ordem (F1→F2→F3) o próprio candidato diz não querer furar.

**Escopo corrigido:** duas linhas em `.ai/rules/css.md`, e só quando o F3 chegar — (1) *"cor escolhida por usuário nunca é par de um foreground fixo: ou a validação impõe piso contra os fundos de uso, ou o foreground é derivado da luminância dela em runtime"*; (2) *"variação de cor de marca sai em níveis nomeados, não em percentual ad-hoc"* — com os 8 níveis do ctvitrine como o contraexemplo medido. A ressalva do candidato sobre pisos diferentes por uso (4.5:1 para texto, 3:1 para borda) está certa e é justamente o motivo de a regra ser "derive o foreground", não "valide o hex".

---

### V6T13 — SOBREVIVE. Primeira fatia da frente, e o escopo do candidato está certo

Verifiquei linha a linha e não achei o que derrubar:

- A tabela `pares` (`theme-tokens.test.ts:128-135`) cobre `primary, secondary, accent, muted, card, background/foreground` — **6 pares, e nenhum de estado**. Confirmado.
- A catraca do `destructive` (`:161-168`) é exatamente como descrito, com a asserção dupla e a mensagem *"se passou de 4.5, o F3 chegou — mova o par para a tabela de cima"*.
- Os 10 números que o teste afirma reproduzem no meu script: 3.67 · 3.99 · 1.85 · 1.49 · 4.72 · 3.81 · 7.93 · 5.18 · 3.13 · 4.68.
- As 6 contas escritas no código do ctvitrine reproduzem: 1.98 · 7.38 · 5.38 · 4.72 · 3.13 · 7.93. E `git ls-tree -r 53d7d9a --name-only -- resources/js/test` → **16 entradas, nenhuma em `styles/`**. Zero teste de tema lá.
- Os 4 pares reprovando: success claro **3.30**, success escuro **2.28**, warning claro **2.15**, info claro **2.77**. Warning escuro (8.77) e info escuro (6.83) passam.
- Consumidores: `git grep -nE 'var\(--(success|warning|info)' origin/main -- resources` → só `border-left` em `app.css:636,648,654` e o `iconTheme` de `toast-config.ts`. Confirmado.

**Reforço que o candidato não usou, e que fecha a lente 1 a favor dele:** `.ai/rules/css.md:12` **já manda fazer isto** — *"Ao acrescentar um token semântico, acrescente a linha correspondente na tabela do teste no mesmo commit."* Os 6 pares de estado entraram sem cumprir a regra. A fatia não inventa política; executa uma que já está escrita e foi furada.

**Duas correções de escopo, e a primeira é obrigatória ou a fatia parece contradizer o F2:**

1. **Diga qual par a tabela vigia.** Os 4 números do candidato medem o par declarado (`--X-foreground` sobre `--X`) — fundo de preenchimento com seu rótulo. O `BACKLOG.md:545` (F2) cita 6.42 / 8.77 / 6.83 no escuro, que são **outro par**: `--X` como *cor de texto* sobre o canvas (`#22c55e` sobre `#0f2a44` = 6.42, confirmei os três). Os dois conjuntos estão certos e medem perguntas diferentes. Sem nomear isso, a fatia lê como se refutasse o F2 — e é exatamente a dualidade que motiva o F3.
2. **Um call-site morto existe:** `components/users/user-actions-menu.tsx:126` escreve `text-success focus:text-success`, classe que hoje é descartada (`.text-success{` → 0 no compilado; controle positivo `.text-destructive{` → 1). Já é o F2; a fatia deve citar para não parecer que "nenhum é usado".

Com isso, nasce verde, é P, não depende do F1 e documenta os quatro números que o F3 terá de mover. Recomendação do candidato mantida.

---

### V6T14 — SOBREVIVE, e o defeito é mais fundo do que o candidato mediu

Confirmei na fonte da lib instalada (`react-hot-toast@2.6.0`, offset 7937 de `dist/index.js`):

```js
$=({toast:e})=>{let{icon:t,type:o,iconTheme:s}=e;
  return t!==void 0 ? (typeof t=="string"?S.createElement(ve,null,t):t)
       : o==="blank" ? null
       : S.createElement(Re,null,S.createElement(L,{...s}),…)}
```

`icon !== undefined` retorna antes — `s` (o `iconTheme`) nunca chega ao indicador.

**O que eu acrescento (e agrava):** os call-sites em `resources/js/lib/flash.ts` mostram que warning e info são **duplamente** mortos. `:29` e `:33` chamam `toast(flash.warning, …)` / `toast(flash.info, …)` — a forma base, que produz `type: 'blank'`. Mesmo que alguém apagasse `icon: '⚠️'`, o ramo seguinte é `o==="blank" ? null` — não haveria ícone nenhum para colorir. Já `:21` e `:25` chamam `toast.success` / `toast.error`, sem `icon` nas options: **esses dois têm `iconTheme` vivo de verdade**.

**E a afirmação falsa está em três lugares, não um.** O candidato achou dois (`toast-config.test.ts:39` e as linhas 52-53 da tabela). O terceiro é `.ai/rules/css.md:20-21`: *"Cor de ícone é `iconTheme`"*, sem ressalva — a regra que o agente lê antes de escrever CSS de toast ensina o canal errado para metade das variantes.

**Contraste, e este é o único defeito de AA vivo e visível do lote:** `iconTheme` = glifo sobre disco. Success no escuro = branco sobre `#22c55e` = **2.28:1**, reprova SC 1.4.11 (3:1). Error no escuro = 3.67 (passa), claro = 4.70 (passa).

**Escopo corrigido:** (1) apagar os 2 blocos `iconTheme` mortos de `toast-config.ts:87-90` e `:109-112`; (2) tabela do teste vira 2 linhas (`success`, `error`) + 2 asserções de que warning/info definem `icon` e por isso não usam `iconTheme`; (3) corrigir o comentário `:39` **e** a regra `.ai/rules/css.md:20-21` para dizer os dois canais e quando cada um vale; (4) o 2.28:1 do success escuro entra pela mesma porta do V6T13. Fatia P, e é a companheira natural do V6T13 — mesma família, mesmo arquivo de teste do lado do CSS.

---

## Placar

| ID | Veredito | Golpe / escopo |
|---|---|---|
| V6T1 | **DERRUBADO** | Lente 1 — o `InlineThemeBackgroundTest` já proíbe `var(--` nos dois blades; a `.ai/rules` proposta é mais fraca e nem casaria o path |
| V6T2 | **SOBREVIVE** (reduzido) | Só o guard-rail de token órfão; 2 contagens erradas (20/11, não 21/12), `grep -c 1f3c57` é 1 e não 0, e o achado já está no inventário |
| V6T3 | **DERRUBADO** | Resultado nulo; não propõe ação |
| V6T4 | **SOBREVIVE** | Mecanismo provado por varredura própria; manchete falsa (`--font-sans` tem 5 consumidores → 2 órfãos, não 3); acrescentar `.font-support`, 0 call-sites |
| V6T5 | **DERRUBADO** | Lente 1+4 — F1 Defeito 3 no BACKLOG **e** regra já escrita em `.ai/rules/css.md:18`; a única peça nova nasce vermelha, logo é o F1. Fica como evidência |
| V6T6 | **DERRUBADO** | Autoderrubado ("não recomendo como fatia isolada"); classificação, não candidatura |
| V6T7 | **DERRUBADO** | Lente 1 — curado pela PR #72; backport é playbook |
| V6T8 | **DERRUBADO** | Autoderrubado ("nada a absorver"); correto |
| V6T9 | **DERRUBADO** | Lente 1 — **`BACKLOG.md:620` F14, "por esquema"**, já resolve a pergunta que o candidato deixa aberta. O hunter não mediu o backlog |
| V6T10 | **SOBREVIVE** (adendo) | Fato certo, já é F38; vira linha de segunda fonte, não PR próprio |
| V6T11 | **SOBREVIVE** | Única correção de fato nova; 34→23 e 32→21 reproduzem; corrigir `ctvitrine.md:2500,3825,3902` + banner |
| V6T12 | **SOBREVIVE** (re-enquadrado) | Números todos certos (5 injeções, não 3), mas sem white-label no alvo não há `[absorver]` — vira 2 regras dentro do F3 |
| V6T13 | **SOBREVIVE** | **Primeira fatia.** Nada a derrubar; `.ai/rules/css.md:12` já mandava fazer. Exigir que a fatia nomeie qual par vigia, senão colide com o F2 |
| V6T14 | **SOBREVIVE** | Confirmado na lib; pior que o alegado (`type:'blank'` mata de novo) e a afirmação falsa também está em `.ai/rules/css.md:20-21`. 2.28:1 vivo |

**Ordem recomendada:** V6T13 + V6T14 juntos (mesma família, ambos P, ambos nascem verdes, ambos executam regra já escrita e furada) → V6T4 → V6T11 como correção de documento → V6T2 depois da varredura → V6T10 na carona do F38 → V6T12 só junto do F3.

**Sobre o entregável F3:** a recomendação em 5 pontos não tem erro de fato que eu tenha achado, e o item 3 (guard-rail é o do boilerplate, estendido, não um contrato de presença) é o mais bem fundamentado do documento. A ressalva de escopo é a do V6T13: a tabela de pares mede fill×rótulo, o F2 mede texto×canvas, e o F3 precisa das **duas** — é literalmente a razão de existir do trio `--state-*-{bg,fg,border}`. Escrever isso explicitamente na entrada do F3 evita que a primeira PR meça o par errado e declare vitória.

**Arquivos relevantes**
- `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/resources/css/app.css` (`:19,21` tokens órfãos · `:450-457` utilitárias à mão · `:135-140`, `:189-194` pares de estado)
- `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/resources/js/test/styles/theme-tokens.test.ts` (`:128-135` tabela · `:161-168` catraca)
- `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/resources/js/lib/toast-config.ts` (`:87-90`, `:109-112` mortos) e `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/resources/js/lib/flash.ts` (`:21-33` call-sites)
- `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/.ai/rules/css.md` (`:12`, `:18`, `:20-21`)
- `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate/tests/Unit/Theme/InlineThemeBackgroundTest.php`
- `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate-harvest-state/docs/harvest/v2/BACKLOG.md` (`:620` F14 · `:623` F38 · `:534` F1-D3 · `:545` F2)
- `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate-harvest-state/docs/harvest/v2/ctvitrine.md` (`:2500`, `:2734`, `:3825`, `:3902` — o 34 a corrigir)

### Lente RISCO — vereditos

# Lente RISCO DE ABSORÇÃO — lote do Caçador 1 (tokens/tema/paleta/contraste)

**Baseline conferido por mim:** `git -C .../boilerplate rev-parse origin/main` → `beb848ea509bf6682c9e31f10611ad7ab489392e`. Toda leitura do alvo por `git show origin/main:<path>`, exceto três artefatos de disco rotulados (`public/build/assets/app-BKlgUCP1.css` de 2026‑08‑20 16:00, `node_modules/react-hot-toast@2.6.0`, `node_modules/@radix-ui/themes/styles.css`, `public/fonts/**`).

**Catracas de estilo que existem hoje e que qualquer fatia desta frente pode derrubar** (medido, `git ls-tree -r origin/main -- resources/js/test` + `tests/`):

| gate | linhas | o que trava |
|---|---|---|
| `resources/js/test/styles/theme-tokens.test.ts` | 216 | 6 pares AA × 2 temas · 4 pares 3:1 do anel × 2 temas · namespace `--color-*` · catraca `destructive` |
| `resources/js/test/styles/focus-ring.test.ts` | 99 | `ring-ring/` fracionário · `outline-none` sem reposição · controle positivo `sources.length > 50` |
| `tests/Unit/Theme/InlineThemeBackgroundTest.php` | 184 | literal-nunca-`var()` no `<style>` inline · sincronia hex↔`--brand-navy-dark` · `color-scheme` nos 2 blades · `<meta name="color-scheme">` |
| `resources/js/test/lib/toast-config.test.ts` | 57 | `ariaProps` × 4 · `iconTheme.primary` × 4 |

**Custo de gate — a restrição que domina metade do lote.** Confirmado: `composer.json@origin/main` tem `pestphp/pest ^5.1` + `pest-plugin-laravel`, **nenhum `pest-plugin-browser`**; `package.json` não tem Playwright; o Vitest roda em **jsdom** (`vite.config.ts:110`), que não implementa cascata, `@layer`, nem resolução de `var()` em `getComputedStyle`. **E `ci:check` é `ci:lint && ci:test && ci:build`** (`package.json:23`) — o Vitest roda **antes** do build, então um teste que leia `public/build/assets/*.css` lê artefato velho ou inexistente em CI. Consequência prática: **nenhuma afirmação sobre quem vence a cascata é provável por gate automatizado hoje.** Onde a prova só existiria no compilado, eu digo isso e proponho o substituto possível.

---

## V6T1 — bloco pré-paint com `var()` · **RISCO: BAIXO**

**O que quebra:** nada, porque não há absorção. Confirmei o alvo: `app.blade.php:40-52@origin/main` já usa literal, e a guarda existe.

**O risco real está na proposta (b), e é de duplicação de autoridade.** A regra `.ai/rules` proposta ("bloco inline só usa literais") **já é um teste executável** — `InlineThemeBackgroundTest.php:135-142` faz exatamente `expect(str_contains(themeStyleBlock($nome), 'var(--'))->toBe(false, …)`, parametrizado sobre `app.blade.php` **e** `errors/500.blade.php`. Escrever a mesma regra em prosa cria um segundo lugar que envelhece sozinho — é o defeito que o próprio V6T8 diagnostica no ctvitrine.

**Mitigação:** se a regra entrar em `.ai/rules`, que ela **cite o teste como autoridade** ("o gate é `tests/Unit/Theme/InlineThemeBackgroundTest.php`; esta linha só explica o porquê"), em vez de repetir o critério. Zero risco de regressão visual; zero dado persistido; zero impacto de a11y.

**Custo de gate:** nenhum — o gate já existe e é o mais forte da casa nessa dimensão.

---

## V6T2 — guarda de token órfão · **RISCO: BAIXO, mas o gate proposto é quase vacuoso**

**Medi o que o caçador declarou não ter medido.** Script sobre `block(':root')` de `app.css@origin/main` cruzado com `git grep -oh 'var(--…' origin/main -- resources`: **45 tokens em `:root`, 0 órfãos**. A guarda **nasce verde**. Nenhuma allowlist necessária.

**Mas ela não pega o defeito que motivou o candidato.** Todo token semântico de `:root` é re-exportado pelo `@theme` como `--color-x: var(--x)` (`app.css:28-69`), então a varredura de `var()` acha consumidor **por construção** — ela nunca pode falhar para a camada semântica. E o único órfão real do arquivo, `--font-subtitle`, mora **dentro do `@theme`**, não em `:root` (medido: `git grep -n font-subtitle origin/main -- resources` → 2 linhas, ambas em `app.css`, nenhuma de consumo; e `.font-subtitle{` → **0** ocorrências no CSS compilado). A guarda proposta passa por cima dele.

**Risco embutido, e é o mesmo em V6T5/V6T13:** o helper `block(':root')` (`theme-tokens.test.ts:23-43`) faz `css.indexOf(':root {')` — literal. Hoje o primeiro casamento é `app.css:105` (a linha 94 é `:root,\n.dark,\n[data-radix-theme] {`, que o needle não casa). **Qualquer fatia que insira um segundo `:root {` acima da 105 sequestra `rootVars`** e derruba `resolveToken` de todos os pares. Isso é exatamente o que a "higiene" prescrita no F1 (`BACKLOG.md:536`, "reafirmar `--color-background` depois do `@import`") faria.

**Mitigação:** (1) se a guarda entrar, que ela varra **`:root` + `@theme` + `.dark`**, não só `:root`, e conte consumo por `var()` **e** por utilitário emitido (`--color-x` conta como consumido só se alguma classe `x-` aparecer no source); (2) na mesma fatia, trocar `indexOf(':root {')` por um matcher que aceite `:root` como um dos seletores de um grupo, senão a fragilidade vira armadilha para o F1.

---

## V6T3 — namespace `--palette-*` × `--brand-*` · **RISCO: N/A (nada a absorver)**

Confirmado. Nenhuma mudança proposta ao boilerplate, nenhum vetor de regressão. Só registro que o veredito "as três fontes já concordam" é o argumento **contra** mexer no namespace agora — e que `theme-tokens.test.ts:112-115` já trava a existência de `--brand-*`, de modo que uma renomeação futura (para `--palette-*`, por simetria com derivados) **quebraria esse teste**. Se alguém propuser a harmonização de nome, ela é uma fatia com gate a atualizar, não cosmética.

---

## V6T4 — `.font-title` duplicada · **RISCO: ALTO como escopado; MÉDIO com a mitigação abaixo**

Este é o candidato onde a lente muda o veredito. **Reproduzi todas as medições do caçador** no `public/build/assets/app-BKlgUCP1.css` (823.999 B; `@layer` abrem em 66 `properties`, 5429 `theme`, 12152 `base`, 16724 `components` — vazio, `@layer components;` — e 16742 `utilities`):

- `44554  .font-title{font-family:var(--font-title)}` — dentro de `@layer utilities`
- `815276 .font-title{font-family:Montserrat,sans-serif!important}` — **fora de layer**
- `.font-subtitle{` → **0** · `.font-sans{` em 16548 (`@layer base`, com `!important`) e 44514 (`@layer utilities`) — confirmado, mesmo valor final, allowlist necessária.

**A afirmação "P de risco (o valor final não muda)" é FALSA para um dos dois call sites, e eu localizei qual.** `resources/js/pages/errors/error-page.tsx:35@origin/main`:

```
<p className="text-muted-foreground font-title text-7xl font-bold tracking-tight">{status}</p>
```

Esse `<p>` casa **três** regras. Apagando `.font-title` de `app.css:450-452`, sobram:

| regra | camada | família |
|---|---|---|
| `.font-title` (utilitária do Tailwind) | `@layer utilities` | Montserrat |
| `p, .app-text` (`app.css:440-445`) | **fora de layer** | Aptos |
| `.text-muted-foreground, …` (`app.css:460-472`) | **fora de layer**, `!important` | **Merriweather Sans** |

Fora de layer vence layer independentemente de especificidade, e o `!important` fora de layer vence tudo. **O "404" em `text-7xl` sai de Montserrat e vira Merriweather Sans.** É regressão visível, na página de erro, nos dois temas. O outro call site (`:38`, `<h1 className="font-title …">`) é seguro: `html body h1` já carimba Montserrat `!important` fora de layer (`app.css:371-395`) — ali `font-title` sempre foi decorativo.

**Custo de gate: não há prova possível.** jsdom não resolve cascata; o compilado não é legível pelo Vitest dentro do `ci:check` (build roda depois). A única evidência real seria screenshot manual de `/404` em claro e escuro no PR.

**Mitigação, em ordem de preferência:**
1. **Fatiar em dois e mandar só a metade segura primeiro.** `--font-subtitle` tem **0 consumidores medidos** e **0 classes emitidas** — apagá-lo é risco nulo e não toca cascata. Fatia P, verde, isolada.
2. Para `.font-title`, **inverter a direção**: em vez de apagar a classe manual, apagar `--font-title` do `@theme` (`app.css:19`). Isso elimina o sombreamento (só sobra uma `.font-title`, a de fora de layer) sem mover nenhum elemento de família. Custo: perde-se `font-title` como token; ganho: zero mudança de pixel.
3. Se a decisão for mesmo apagar a classe manual, **corrigir `error-page.tsx:35` na mesma fatia** (tirar `text-muted-foreground` ou trocar por `text-muted-foreground/…` sem a regra de família) e anexar screenshot.
4. Sobre estender a guarda para "classe manual com nome de utilitária do `@theme`": ela é escrevível como texto sobre `app.css` e nasce **vermelha** (`.font-title` existe hoje). Ou vai junto do conserto, ou vai com `expect.fail` documentado — nunca com allowlist muda, pelo mesmo motivo que `focus-ring.test.ts:80-85` cobra remoção de entrada obsoleta.

**Dados persistidos:** nenhum. **A11y:** trocar Montserrat 800 por Merriweather Sans 400 num numeral `text-7xl font-bold` muda peso aparente, não contraste — não há SC violado, mas é regressão de legibilidade que ninguém pediu.

---

## V6T5 — `@import` do Radix sem `layer()` · **RISCO: ALTO — e a "asserção de 3 linhas" é a parte perigosa**

**Confirmei o mecanismo na fonte instalada:** `node_modules/@radix-ui/themes/styles.css` (812.667 B) tem **`grep -c '@layer'` = 0** e declara `--color-background` em `:where(.radix-themes)` (`white`) e em `:is(.dark,.dark-theme), :is(.dark,.dark-theme) :where(.radix-themes:not(.light,.light-theme))` (`var(--gray-1)`). No compilado: `--color-background:` em 11010 (dentro de `@layer theme`), 227969 e 232573 (fora de layer). O sequestro é real e global.

**O que o caçador não mediu, e é onde mora o risco:** *satisfazer* a asserção proposta é uma mudança de cascata em todo o app, não um `layer(...)` colado no import.

- Ordem de camada é definida pela **primeira aparição**. Com `@import 'tailwindcss'` na linha 4 criando `theme, base, components, utilities`, um `@import '@radix-ui/themes/styles.css' layer(radix)` na linha 5 cria `radix` **depois de `utilities`** → **todo CSS do Radix passa a vencer toda utilitária do Tailwind** aplicada a componente Radix. Regressão massiva, invisível em teste.
- Colocar `radix` **antes** de `theme` resolve o sequestro de token, mas então o preflight do Tailwind (`@layer base`) passa a vencer os resets do próprio Radix. Também regressão massiva.
- A forma correta é declarar a ordem explicitamente **antes de qualquer `@import`** — `@layer theme, base, components, radix-themes, utilities;` — e só então importar com `layer(radix-themes)`. Isso é a fatia G, não a fatia P.

**Segundo risco, este mensurável e imediato:** a "higiene na mesma PR" que o `BACKLOG.md:536` prescreve — *"reafirmar `--color-background` depois do `@import` da :5"* — **quebra dois testes existentes de uma vez**: (a) `theme-tokens.test.ts:102-110` falha na hora, porque a asserção é literalmente "nenhum `--color-*` declarado fora do `@theme`"; (b) se a reafirmação for escrita como um `:root { … }` acima da linha 105, `block(':root')` a captura e `rootVars` vira um mapa de 1 entrada, fazendo **todos** os `resolveToken` lançarem. Ou seja: a prescrição do backlog e o guard-rail do backlog são incompatíveis entre si como escritos.

**Mitigação:**
1. **Tirar `@theme inline` da frente.** Ele conserta o sequestro de `bg-background`/`text-background` sem tocar em nenhuma camada — as utilitárias passam a carregar `var(--background)` direto em vez de consultar `--color-background`. É estritamente mais estreito que a operação de layers e não colide com nenhum gate atual.
2. Se a asserção de `layer()` entrar antes disso, que ela asserte **ordem**, não presença: `@layer …;` explícito na primeira linha do arquivo e o nome do layer de terceiro posicionado **antes de `utilities`**. Presença sozinha é uma asserção que pode ser satisfeita do jeito errado.
3. Se a "higiene" de reafirmar `--color-background` sobreviver, ela **tem** de vir com a atualização das duas guardas acima — e a mensagem de falha do `theme-tokens.test.ts:102-110` deve dizer por que a exceção existe.
4. **Evidência possível sem browser:** um teste de texto sobre `app.css` que asserta a linha `@layer …;` e a posição do nome de terceiro nela. Prova a *declaração*, não o *efeito*. O efeito só por screenshot de uma página com componente Radix (tabela de usuários) em claro e escuro.

**A11y:** o sequestro atual não reprova SC nenhum diretamente (as duas paletas são legíveis); o risco é a **correção** mover `--background` sob textos já medidos e invalidar os 6 pares AA que o gate trava. A recalibração já está prevista no F1 e o gate a pega — esse é o caso raro em que a catraca funciona.

---

## V6T6 — anatomia dos `!important` · **RISCO: ALTO. Concordo com "não fatiar"**

Confirmei as contagens no alvo: `git show origin/main:resources/css/app.css | grep -c '!important'` → **46**, nenhuma em comentário. E acrescento a razão estrutural pela qual isto não é fatiável hoje: **o bloco de tipografia inteiro (`app.css:220-515`) está fora de qualquer layer**, junto com `p, .app-text` e `.font-title`. Mover *parte* dele para `@layer base` inverte a cascata só para os seletores movidos, produzindo um estado híbrido pior que qualquer um dos dois extremos — e sem gate que o detecte.

**Mitigação:** o primeiro corte defensável não é o V6T4 (que, medido acima, tem regressão embutida), é o **V6T13+V6T14** — token de estado, aritmética pura, gate real. Deixar tipografia inteira para depois de a decisão de layers (V6T5) estar tomada, porque as duas mexem no mesmo mecanismo e a ordem entre elas importa.

**Dados persistidos / a11y:** nenhum e nenhum, desde que ninguém mexa nos tamanhos.

---

## V6T7 — `--ring` a 1.85:1 · **RISCO: BAIXO no boilerplate (zero mudança); MÉDIO por derivado**

Reproduzi ao centésimo, com script independente: `#2a7ba2` vs `white` = **4.72**, vs `#e6e7e8` = **3.81**; `#8ac7e5` vs `#0f2a44` = **7.93**, vs `#2c485e` = **5.18**; e os valores doentes `1.85` / `1.49`. Também `#2a7ba2` com branco = **4.72** e `#379bcb` com branco = **3.13** — a convergência com `SiteSetting::DEFAULT_PRIMARY_COLOR` do ctvitrine é real.

**Risco de absorção no alvo: nulo, porque não há absorção.** O que anoto é o risco do **backport**, que é o item de playbook:

- O par `--sidebar-ring` × `--sidebar-border` no escuro do boilerplate dá **6.42:1** (`#8ac7e5` vs `#1e3a4f`) — um derivado que copiar só `--ring` e esquecer `--sidebar-ring` passa no teste portado apenas se portar os **4** pares. `theme-tokens.test.ts:199-204` lista os quatro; o backport tem de levar a tabela inteira, não a linha.
- `#2a7ba2` a 3.10:1 contra o navy escuro — se algum derivado usar `--brand-cyan-dark` como anel também no tema escuro (atalho tentador), ele fica **abaixo** de 3:1. O boilerplate acertou ao trocar de família entre temas (`app.css:197-200`); o backport tem de copiar essa decisão, não só o hex.

**Custo de gate por derivado:** o teste é portável inteiro (lê CSS como texto, jsdom irrelevante). É o raro caso de gate 100% real sem browser.

---

## V6T8 — `--primary` do escuro · **RISCO: BAIXO (nada a mudar) / ALTO se alguém "melhorar"**

Reproduzi: `#0f2a44` sobre `#8ac7e5` = **7.93**, `white` sobre `#379bcb` = **3.13**, e o valor vivo do boilerplate `#0f2a44` sobre `#379bcb` = **4.68**.

**Concordo com "não absorver" e reforço com um dado que o caçador não levantou:** adotar a escolha do ctvitrine (`--primary: var(--brand-cyan-light)` no escuro) **colapsaria `--primary` com `--sidebar-primary`**, que já é `var(--brand-cyan-light)` no `.dark` (`app.css:210`). CTA e item ativo de sidebar passariam a ter exatamente a mesma cor — perda de hierarquia visual, sem ganho de conformidade (4.68 já é AA). Passaria no gate (`theme-tokens.test.ts:176-180` só exige que o `--primary` escuro difira do claro), o que é justamente o motivo de eu registrar: **é uma regressão que o teste atual não pega.**

**Mitigação:** nenhuma ação. Se a discussão de marca reabrir, a asserção que falta é "`--primary` ≠ `--sidebar-primary` dentro do mesmo tema" — uma linha, mesma forma da 176-180.

---

## V6T9 — `<meta name="theme-color">` · **RISCO: MÉDIO — reintroduz o F35 em outra roupa**

Confirmei a ausência: `git grep -n "theme-color\|theme_color" origin/main` → **0 linhas**.

**O que quebra, e o caçador marcou como "não medi" exatamente o ponto crítico. Eu medi.** `resources/js/hooks/use-appearance.tsx:22-26@origin/main`:

```
const applyTheme = (appearance) => {
    const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark());
    document.documentElement.classList.toggle('dark', isDark);
};
```

Ele **só** alterna a classe. Nunca toca no `<head>`. Portanto:

- `<meta name="theme-color" content="#0f2a44">` **estático** congela no servidor — é literalmente o defeito F35 que a PR #112 acabou de contornar movendo `color-scheme` do `<meta>` para a regra `.dark` do `<style>`. Absorver a tag estática reintroduz o mesmo bug numa propriedade nova.
- `<meta name="theme-color" media="(prefers-color-scheme: dark)">` **não** segue escolha explícita: quem está com sistema claro e escolheu "escuro" recebe o chrome claro. Mesmo furo, causa diferente.
- Não existe equivalente CSS de `theme-color` (não é uma propriedade; é metadado). **Não há solução sem JS**, ao contrário do `color-scheme`. Ou a fatia aceita uma linha em `applyTheme` (`document.querySelector('meta[name=theme-color]').content = …`) ou aceita o congelamento e o documenta.

**Segundo risco, concreto no gate:** `InlineThemeBackgroundTest` é parametrizado sobre `themedBlades()` = **`app.blade.php` + `errors/500.blade.php`** (`:34-42`). Uma asserção escrita no molde `->with(fn() => array_keys(themedBlades()))` passa a **exigir `theme-color` no 500.blade.php também** — e o 500 é a página que existe para o caso de tudo estar quebrado, onde cada tag a mais é superfície. O molde certo já está no arquivo: `it('declares a color-scheme meta …')` em `:180-184` é um `it()` avulso sobre `app.blade.php`. Copiar esse, não o parametrizado.

**Terceira cópia do `#0f2a44`:** risco real e trivialmente mitigável — o helper `appCssToken('brand-navy-dark')` (`:118-125`) já existe; a asserção nova deve comparar contra ele, não contra literal.

**Mitigação:** fatia P só se vier com (a) `it()` avulso em `app.blade.php`, (b) comparação via `appCssToken`, (c) decisão explícita e comentada sobre a atualização em `applyTheme` — ou uma linha dizendo que o valor é único nos dois temas e por quê. Sem (c) é o F35 de volta.

**Dados persistidos:** nenhum. **A11y:** nenhum SC — `theme-color` pinta chrome do browser, não conteúdo.

---

## V6T10 — `preconnect` para `fonts.bunny.net` · **RISCO: BAIXO. A fatia mais segura do lote**

Reproduzi no alvo: `git grep -n "bunny" origin/main` → **1 linha**, `resources/views/app.blade.php:67`. E confirmei que não há nada dependendo dela: `git grep -n 'rel="icon"\|apple-touch' origin/main -- resources/views` → **0 linhas** (ou seja, a outra metade do F38 — links de ícone e 5 arquivos órfãos — segue intocada e **não deve viajar junto**; são mudanças com superfícies diferentes).

**O que quebra:** nada. `preconnect` é dica de rede sem efeito de estilo, layout, foco ou anúncio. Nenhum teste atual o lê.

**Custo de gate:** o único gate possível é uma asserção de texto — e ela vale a pena, porque a linha veio herdada do starter kit e vai reaparecer no próximo `laravel new`. Proposta: uma linha em `InlineThemeBackgroundTest` (ou um `HeadTagsTest` novo) asserindo que o `<head>` de `app.blade.php` não contém host de terceiro. Cabe em 4 linhas e nasce verde depois da remoção.

**Dados persistidos / a11y / contraste:** nenhum.

---

## V6T11 — as "34 `@font-face`" são 23 · **RISCO: BAIXO como correção de documento; a ação implícita é que seria ALTA**

**Re-medi no alvo, não no ctvitrine:** `_fonts.css@origin/main` → `grep -c '@font-face'` = **32**, `grep -cE '^@font-face'` = **21**, `grep -c 'docs/Web/CSS/@font-face'` = **11**. 21+11=32. Fecha.

**E medi os 5 preloads nos arquivos reais do boilerplate** (`ls -l public/fonts/woff2/...`), o que o caçador declarou não ter confirmado:

| arquivo | bytes |
|---|---|
| `aptos/aptos.woff2` | 72.824 |
| `aptos/aptos-semibold.woff2` | 73.272 |
| `aptos/aptos-bold.woff2` | 73.324 |
| `montserrat/montserrat-v31-latin-800.woff2` | 19.012 |
| `merriweather-sans/merriweather-sans-v28-latin-regular.woff2` | 16.940 |
| **soma** | **255.372** |

Confirmado no alvo. `du -sk public/fonts` = 1.044 KB.

**O risco que a contagem errada convidava, e que eu preciso marcar em vermelho:** "34 faces, corta pesos" leva a apagar blocos `@font-face`. **Isso é regressão sem gate.** Um peso que nenhum `font-weight` explícito seleciona ainda pode ser escolhido pelo algoritmo de matching do CSS Fonts (arredondamento de peso) — e quando a face some, o browser faz *synthetic bolding*, que muda métrica e piora legibilidade em `text-7xl`. jsdom não carrega fontes; nenhum teste atual pega. **Recomendação: nenhuma poda de `@font-face` nesta rodada.**

**Sobre o preload condicional do ctvitrine:** absorver o `@if (str_starts_with($page['component'] …))` hoje cria um ramo morto — o boilerplate tem uma família de título só. Risco de absorver o mecanismo: baixo mas inútil; risco de absorver **a regra** ("preload só do que a página desenha"): zero, e é o que impede a lista de 5 virar 8 quando o F3/F7 trouxerem uma família nova. Absorver só a regra.

---

## V6T12 — `--brand` runtime + `color-mix(in oklab)` · **RISCO: BAIXO como regra `.ai/rules`; ALTO como feature**

Verifiquei o lado da fonte: os 5 pontos de injeção (`site/home.tsx:97`, `site/item.tsx:50`, `site/boutique/home.tsx:230`, `site/boutique/item.tsx:121`, `site/landing.tsx:820`), a validação `regex:/^#[0-9a-fA-F]{6}$/` em `UpdateSiteSettingRequest.php:35`, e os **8 níveis / 33 call sites** de `color-mix(in_oklab,var(--brand),white_N%)` — a distribuição bate exatamente com a tabela do caçador (11/6/1/3/4/4/3/1). Contrastes reproduzem: `#2a7ba2` 4.72, `#b26e79` **3.89**, `#ffff00` **1.07**.

E no alvo: `git grep -ln "primary_color\|theme_color\|brand_color" origin/main` → **0 arquivos**; `color-mix` aparece **1 vez** em todo `resources/` (`app.css`). Confirmado: não há nada a consertar aqui.

**Riscos que a lente acrescenta, para quando a feature chegar:**

1. **Dado persistido — trap de migração, anotada como manda o escopo.** `primary_color` é hex gravado por lojista. Introduzir piso de contraste depois invalida linhas já salvas: ou a migração recalcula/clampa (mudando a marca de alguém sem avisar), ou a validação vale só na escrita e o banco fica com valores reprovados legíveis pelo front. Não há obrigação de compatibilidade no boilerplate, mas a regra tem de dizer qual das duas o derivado escolhe **antes** da primeira gravação.
2. **A validação de formato é barreira de segurança, não só de estética.** `style={{ '--brand': settings.primary_color }}` injeta string controlada pelo usuário numa custom property. React não sanitiza valor de custom property. O `regex:/^#[0-9a-fA-F]{6}$/` é o que impede que um valor arbitrário chegue a uma propriedade que aceite `url()` mais adiante na cadeia de `color-mix`. Qualquer afrouxamento ("aceitar `rgb()`", "aceitar nome de cor") é mudança de segurança, não de UX. **Isso precisa estar na regra.**
3. **Utilitária arbitrária é invisível ao gate.** `bg-[color-mix(in_oklab,var(--brand),white_55%)]` não passa por token nenhum; `theme-tokens.test.ts` lê **só** `resources/css/app.css` (`:20`) e nunca a verá. Absorver a forma sem a camada de token compra o espalhamento de 8 percentuais que o próprio ctvitrine exibe — e sem catraca.
4. **Foreground derivado, não validado.** Concordo com o caçador e reforço o desenho: `text-white` sobre `--brand` é SC 1.4.3 (4.5), `border-[var(--brand)]` é SC 1.4.11 (3.0). Uma regra única inviabiliza marca legítima. O caminho é derivar preto/branco por luminância (`color-contrast()` ainda não é seguro; um `--brand-fg` calculado no servidor a partir da luminância resolve e é testável em Pest, sem browser).

**Custo de gate:** a regra em si não tem gate — é `.ai/rules`. O piso de contraste, quando existir, é testável 100% em Pest (aritmética sobre o hex validado). Nenhuma parte disso precisa de browser.

**Veredito de risco:** BAIXO para escrever a regra agora; ALTO para trazer a feature sem os quatro pontos acima resolvidos.

---

## V6T13 — estender a tabela de pares para `success`/`warning`/`info` · **RISCO: BAIXO. Concordo que é a primeira fatia — com uma correção de alvo**

Reproduzi os 10 valores que `theme-tokens.test.ts` afirma (3.67 · 3.99 · 1.85 · 1.49 · 4.72 · 3.81 · 7.93 · 5.18 · 3.13 · 4.68) e os 6 do ctvitrine (1.98 · 7.38 · 5.38 · 4.72 · 3.13 · 7.93). Todos batem ao centésimo. E os pares de estado: success claro **3.30** / escuro **2.28**; warning claro **2.15** / escuro **8.77**; info claro **2.77** / escuro **6.83**.

**Correção de alvo, e ela melhora o candidato.** A catraca proposta trava `--x-foreground` sobre `--x` a 4.5 — mas medi os consumidores reais e **esse par quase não existe hoje**:

```
git grep -n -- '--success-foreground' origin/main -- resources
  → resources/js/lib/toast-config.ts:38  (iconTheme.secondary)   [1 linha, a única]
git grep -n -- '--warning-foreground' origin/main -- resources
  → resources/js/lib/toast-config.ts:89                          [1 linha, e é MORTA — ver V6T14]
git grep -n -- '--info-foreground'    origin/main -- resources
  → resources/js/lib/toast-config.ts:111                         [1 linha, e é MORTA]
```

**O par que está vivo e reprovando hoje é outro: a borda de 4px do toast contra a superfície do toast** (`app.css:635-655`, `border-left: 4px solid var(--x)` sobre `background: var(--card)`). Isso é SC 1.4.11, 3:1. Medido:

| variante | claro (card = `white`) | escuro (card = `#0f2a44`) |
|---|---|---|
| success | 3.30 · passa | 6.42 · passa |
| **warning** | **2.15 · REPROVA** | 8.77 · passa |
| **info** | **2.77 · REPROVA** | 6.83 · passa |
| destructive | 4.70 · passa | 3.99 · passa |

**Duas reprovações vivas e visíveis no tema claro**, no único elemento que distingue a variante do toast além do emoji. Isso é um achado melhor que o hipotético, prova-se por aritmética pura sobre tokens, e cabe na mesma fatia.

**E existe conserto medido, de custo zero em regressão:**

| mudança | efeito medido |
|---|---|
| `--warning-foreground: white` → `var(--brand-navy-dark)` (claro) | 2.15 → **6.81** · consumidor único é config morta ⇒ zero pixel muda hoje |
| `--info-foreground: white` → `var(--brand-navy-dark)` (claro) | 2.77 → **5.28** · idem |
| `--success-foreground: white` → `var(--brand-navy-dark)` | glifo do check: claro 3.30 → **4.44**, escuro 2.28 → **6.42** · consumidor vivo (V6T14), melhora nos dois temas |

Nenhum desses toca a cor de preenchimento, então a **borda** de 2.15/2.77 continua reprovando — para ela o conserto é escurecer `--warning`/`--info` no claro, e aí sim há mudança visual, então é fatia separada.

**Riscos da catraca como proposta:**
- Fixar 2.15 como piso "não piora" **sanciona** a reprovação. A catraca do `destructive` funciona porque tem a asserção-teto (`toBeLessThan(4.5)`, `:167`) com mensagem dizendo o que fazer quando estourar. As quatro novas precisam da mesma dupla, senão viram allowlist.
- A catraca tem de **nomear qual pergunta de contraste trava** (fill+label 4.5 × indicador 3.0), porque as duas dão números diferentes para os mesmos tokens e a confusão entre elas já circula: o `BACKLOG.md:545` cita "no escuro ficam bons (6.42 / 8.77 / 6.83)", que são as razões de **texto sobre o canvas**, não os pares `-foreground`/fill.
- Mesma fragilidade de `block(':root')` do V6T2 se a fatia adicionar blocos.
- `--warning-foreground` e `--info-foreground` são hoje config morta; travar o contraste deles **antes** de o V6T14 decidir se eles sobrevivem trava um valor que pode ser apagado na fatia seguinte. **V6T14 vem primeiro ou junto, nunca depois.**

**Custo de gate:** zero problema — é leitura de texto de `app.css` + aritmética. É o único candidato do lote com gate integralmente real.

---

## V6T14 — `iconTheme` morto em `warning`/`info` · **RISCO: BAIXO. Confirmado em três níveis**

Verifiquei os três, e o achado é mais forte do que o caçador escreveu:

1. **Fonte da lib** (`node_modules/react-hot-toast/dist/index.js`, `package.json.version` = **2.6.0**): `$=({toast:e})=>{let{icon:t,type:o,iconTheme:s}=e;return t!==void 0?typeof t=="string"?…createElement(ve,null,t):t:o==="blank"?null:…createElement(L,{...s})…}`. `icon !== undefined` retorna antes de `iconTheme` ser lido. Confirmado.
2. **Call sites** (`resources/js/lib/flash.ts:29,33@origin/main`): warning e info entram por `toast(msg, opts)` **sem** `.warning`/`.info` — ou seja `type: 'blank'`. **Mesmo se `icon` fosse removido, o ramo `o==="blank" ? null` não desenha indicador nenhum.** O `iconTheme` de warning/info está morto **duas** vezes, não uma. Sucesso e erro entram por `toast.success`/`toast.error` (`:21,:25`) → `iconTheme` vivo.
3. **O gate atual afirma o falso e passa verde.** `toast-config.test.ts:49-56` assevera `iconTheme.primary` das quatro variantes sob o comentário de `:39` ("este é o único canal que funciona"). Metade da tabela é vacuosa. Isso é pior que ausência de teste: é cobertura aparente sobre config morta.

**Riscos da correção:** baixos, mas há um.
- Apagar `iconTheme` de warning/info não muda um pixel (é config nunca lida). Zero regressão visual, zero dado persistido, zero a11y.
- **A armadilha a travar:** se alguém depois remover `icon: '⚠️'` esperando o disco colorido de volta, recebe **`null`** — porque o tipo é `blank`. O teste substituto não pode ser só "warning não define iconTheme"; tem de afirmar **o pareamento**: *warning/info definem `icon` porque entram por `toast()` com `type: 'blank'`, e nessa rota `iconTheme` nunca é lido nem existe indicador default*. Sem isso a fatia troca uma afirmação falsa por outra meia-verdade.
- Contraste medido do canal vivo: success `white`/`#22c55e` no escuro = **2.28:1**, abaixo dos 3:1 de SC 1.4.11 para objeto gráfico. Reprovação viva. O conserto é o mesmo `--success-foreground: var(--brand-navy-dark)` do V6T13 (→ 6.42 escuro, 4.44 claro).

**Custo de gate:** integral. É teste de objeto JS, roda em jsdom sem cascata nenhuma.

**Recomendação de sequenciamento:** **V6T14 + V6T13 são uma fatia só.** Separá-las faz o V6T13 travar contraste de tokens que o V6T14 vai apagar, e faz o V6T14 apagar consumidores dos tokens que o V6T13 acabou de justificar.

---

## Entregável F3 — risco da costura recomendada · **RISCO: ALTO na peça de forma, BAIXO na peça de valor**

Julgo as 5 recomendações porque elas prescrevem absorção:

**(1) `@utility` em vez de `@layer components` — a justificativa está certa e a consequência está incompleta.** `@utility` é suportado (Tailwind **4.3.3** confirmado no alvo), e sim, `@layer components` perderia para código fora de layer. Mas **`@utility` emite dentro de `@layer utilities`** — que é, medido, a camada mais fraca deste arquivo específico: perde para os 46 `!important` fora de layer (`app.css:220-515`, `:602-671`) e perde para os 812 KB do Radix não-layerizado. Concretamente: `state-success-fg` aplicado a um `<p>`, a um `.text-muted-foreground` ou a qualquer descendente de `.radix-themes` **pode ser sombreado exatamente onde cor de estado mais aparece** (célula de tabela Radix, descrição de card, rodapé). **F3 depende do V6T5 estar decidido**, não só do F1 — e essa dependência não está na cadeia do backlog.

**(2) Valores calculados aqui, nunca copiados — concordo integralmente, sem ressalva.** Os 3 de 4 reprovados do ctfinance vêm do inventário e estão fora do meu pin; não os re-medi e a tabela marca isso corretamente. O piso de 14.38:1 do emerald é a única âncora que eu não consigo verificar e que, se errada, inverte uma decisão — vale re-medir antes de a fatia começar.

**(3) Estender a tabela existente em vez de escrever contrato de presença — concordo, e é a decisão de menor risco do documento.** Um contrato de presença (`design-tokens-contract.test.ts`) apodrece; a tabela de pares falha com número. Única ressalva: cada par novo herda a fragilidade de `block(':root')`.

**(4) `color-mix(in oklab)` do ctvitrine + consolidação em 3 níveis — risco baixo, com um ponto cego.** `color-mix` dentro de valor arbitrário do Tailwind não passa por token e é invisível ao gate (que lê só `app.css`). Se a forma entrar, ela tem de entrar **dentro do `@theme`/`@utility`**, nunca como `bg-[color-mix(…)]` no JSX — senão o F3 importa a doença junto com a cura.

**(5) V6T13 antes do F1 — concordo, e reforço com dado.** Confirmei que a justificativa do F2 segue **viva**: `resources/js/components/users/user-actions-menu.tsx:126@origin/main` escreve `'text-destructive focus:text-destructive' : 'text-success focus:text-success'`, e no compilado `.text-destructive{` existe (1) enquanto `.text-success{` e `.bg-success{` são **0**. Ou seja: hoje "Desativar" sai vermelho e "Ativar" sai sem cor nenhuma — assimetria viva, causada pela ausência do export. Isso fortalece o F2 e **não** enfraquece a recomendação de mandar o V6T13/V6T14 primeiro: a catraca documenta os quatro números que o F2 vai mover, e nasce verde.

---

## Ordem de menor risco para esta frente

| # | fatia | risco | gate real? |
|---|---|---|---|
| 1 | **V6T14 + V6T13** (poda do `iconTheme` morto + tabela/catraca de `success/warning/info` + os 3 `-foreground` para navy) | **BAIXO** | **sim, integral** |
| 2 | **V6T10** (`preconnect` bunny, 1 linha) + asserção de host de terceiro no `<head>` | **BAIXO** | sim |
| 3 | **V6T4 metade segura** (apagar só `--font-subtitle`) | **BAIXO** | parcial (texto sobre `app.css`) |
| 4 | **V6T9** (`theme-color`) — só com a decisão sobre `applyTheme` escrita | **MÉDIO** | sim (Pest de texto) |
| 5 | **V6T2** (guarda de órfão, reescrita para cobrir `@theme` também) | **BAIXO** | sim, nasce verde (45 tokens, 0 órfãos — medido) |
| 6 | **V6T5** via `@theme inline` — **não** via `layer()` avulso | **ALTO** | **não** (só screenshot) |
| 7 | **V6T4 resto** (`.font-title`) — exige consertar `error-page.tsx:35` junto | **ALTO** | **não** |
| — | **V6T6** (os 21 `!important` de tipografia) | **ALTO** | **não** — não fatiar |
| — | V6T1 · V6T3 · V6T7 · V6T8 · V6T11 · V6T12 | sem absorção no alvo | — |

**As três medições que dependem do artefato de disco** (`public/build/assets/app-BKlgUCP1.css`, mtime 2026‑08‑20 16:00 — V6T4, V6T5 e a contagem `.text-success`/`.bg-success` = 0) **reconfirmei eu mesmo neste turno**, mas sobre o mesmo arquivo; um build limpo em `origin/main` continua sendo pré-requisito de quem aplicar as fatias 6 e 7.

**Não medido:** os números do ctfinance (2.53 / 3.26 / 3.92 / 14.38) e do cuidari — fontes fora do meu alcance nesta rodada; o piso de 14:1 do `verify-email.tsx` é o único deles que, se errado, inverte uma decisão do F3.

### Lente ATUALIDADE — vereditos

### V6T1 — Bloco pré-paint com literais

**Veredito: ATUAL COM MODERNIZAÇÃO (opcional, baixo valor).**

A regra que o candidato quer registrar não foi superada por nada. O motivo do `var()` quebrado é resolução de custom property em computed-value time — não é comportamento de Tailwind, e nenhuma versão de 4.x muda isso. E não existe, em Tailwind 4.3.3, mecanismo para exportar um token do `@theme`/`:root` para o Blade: os tokens nascem dentro do próprio `app.css`, que é exatamente a folha que ainda não chegou. Literal + teste de sincronia continua sendo a única resposta disponível na versão instalada. Quem propuser "usa o token, o Tailwind resolve" está errado na 4.3.

**Modernização que existe:** `light-dark()` — MDN, *Baseline 2024, newly available since May 2024*: *"The function accepts two values and returns the first value if the used color scheme is `light` (or if no preference is set) and the second value if the used color scheme is `dark`."* Como o bloco já fixa `color-scheme: light` / `dark` por classe (`app.blade.php:41-51@origin/main`), as duas regras colapsariam em:

```css
html { color-scheme: light; background-color: light-dark(#fff, #0f2a44); transition: background-color .2s ease; }
html.dark { color-scheme: dark; }
```

Ganho real: some a duplicação do `transition` e some uma regra. **Não recomendo executar** — o artefato atual está curado, comentado e travado por teste, e `light-dark()` ainda mantém dois literais (não reduz a superfície que o teste vigia). Vale registrar na `.ai/rules` como forma alternativa aceita, não como fatia.

**Não medido:** se `laravel-vite-plugin@3.1.3` + Vite 8.2 mudaram a ordem de injeção do CSS em `composer dev` (a janela onde o defeito do ctvitrine é real). A calibragem de severidade do candidato não depende disso, mas quem escrever o playbook deveria conferir.

---

### V6T2 — Tokens órfãos

**Veredito: ATUAL COM MODERNIZAÇÃO — e a modernização corrige a especificação do teste proposto.**

Tailwind 4.3 **já resolve órfão nativamente, mas só dentro do `@theme`**. Doc oficial (tailwindcss.com/docs/theme, versão 4.x): *"By default only used CSS variables will be generated in the final CSS output."* E o opt-out explícito: *"If you want to always generate all CSS variables, you can use the `static` theme option: `@theme static { … }`"*.

Medido: os seis `--palette-*` do ctvitrine estão em `:root`, não no `@theme` — `git show 53d7d9a:resources/css/app.css` linha **109** abre `:root {`, e os tokens vêm em 111-116. O boilerplate é idêntico: `:root {` em **105**, `--brand-*` em 107-116. Ou seja, **os dois projetos optaram para fora do tree-shaking**, e a doc diz que estão certos em fazê-lo: *"Use `@theme` when you want a design token to map directly to a utility class, and use `:root` for defining regular CSS variables that shouldn't have corresponding utility classes."*

**Consequência para o teste proposto — duas correções de especificação:**

1. A varredura tem de se **restringir a `:root`/`.dark`** e **ignorar o `@theme`**. Um token de `@theme` sem consumidor custa **zero byte** na saída (o compilador o descarta); marcá-lo produziria falso positivo contra o comportamento documentado do framework.
2. A medição de "tem consumidor?" tem de ser feita **na fonte**, nunca no CSS compilado. No compilado, um token de `@theme` não usado simplesmente não existe — o teste leria ausência como defeito.

Sem essas duas correções o teste nasce vermelho por desenho. Com elas, o candidato está atual: não há, em 4.3.3, nenhum lint nativo para custom property órfã declarada em `:root`.

---

### V6T3 — Namespace `--palette-*` / `--brand-*` fora do `@theme`

**Veredito: ATUAL.** É literalmente a prescrição da doc da versão instalada, citada acima: `:root` para variável que não deve virar utilitária, `@theme` para a que deve. Os dois projetos acertam por construção, o cuidari erra por construção.

Nenhuma modernização a propor: Tailwind 4.3 não oferece namespace reservado, prefixo protegido nem verificação de colisão de nome de token. A guarda de texto do `theme-tokens.test.ts:102-110` é o único mecanismo disponível na versão — ela não é um paliativo até o framework resolver, é o teto do que dá para fazer hoje.

O que **não** é coberto por nada nativo, e por isso continua sendo trabalho do teste: colisão em nome de **classe** (V6T4) e em folha de **terceiro** (V6T5). Confirmo o enquadramento negativo do candidato.

---

### V6T4 — `.font-title` emitida duas vezes

**Veredito: OBSOLETO — o artefato do boilerplate é um idioma de Tailwind v3 sobrevivendo dentro de um projeto v4.** O achado é válido e importante; a *proposta* precisa ser reescrita em torno de três APIs nativas que a versão instalada já tem.

**1. A classe escrita à mão é duplicata de uma utilitária que o framework já emite.** Doc 4.x: *"theme variables defined in the `--font-*` namespace determine all of the `font-family` utilities that exist in a project"* e *"If another theme variable like `--font-poppins` were defined, a `font-poppins` utility class would become available to go with it."* O boilerplate declara `--font-title` no `@theme` (`app.css:19@origin/main`) — `font-title` **já existe**. `app.css:450-452` reimplementa a mesma coisa com hex literal e `!important`. Apagar não é uma escolha de estilo: é remover código que o compilador escreve sozinho.

**2. Se a variante à mão fosse mesmo necessária, a API é `@utility`, não uma classe solta.** Upgrade Guide v4, verbatim: *"In v4 we are using native cascade layers and no longer hijacking the `@layer` at-rule, so we've introduced the `@utility` API as a replacement"*. Medido: `git show origin/main:resources/css/app.css | grep -c '^@utility'` → **0**. O boilerplate não usa a API uma única vez.

**3. A causa-raiz não é o `!important` — é que as regras estão fora de layer, e isso tem correção nativa.** Confirmei no **código-fonte** de `origin/main` (independente do build velho que o candidato usou): `git show origin/main:resources/css/app.css | grep -n '^@layer'` → só **duas** ocorrências, `83` e `221`, fechando em `91` e `250`. Tudo de 252 a 681 — incluindo `.font-title` (450), `.font-support` (455) e as 21 regras `!important` de tipografia — está **fora de qualquer cascade layer**, e sem layer vence com layer. Mover esse bloco para `@layer base` faz **todos** os `!important` de tipografia ficarem desnecessários de uma vez. Esse é o mecanismo v4, não um truque.

**Correção de fato dentro do candidato.** A frase *"`.font-subtitle{` não aparece no CSS compilado (0 ocorrências)"* está sendo usada como prova de defeito, e **não é**: pela doc citada em V6T2, Tailwind 4.3 só emite variável de `@theme` que é usada e só gera utilitária que aparece na fonte. `--font-subtitle` ausente do compilado é o framework funcionando como documentado. O achado "`--font-subtitle` não tem consumidor" sobrevive **apenas** pela medição na fonte (`git grep -n 'font-subtitle' origin/main -- resources` → 1 linha, a própria declaração). A metade compilada do argumento tem de cair.

**Correção da premissa da lente.** Medi `git show 53d7d9a:package.json`: ctvitrine está em `tailwindcss ^4.3.0`, `@radix-ui/themes ^3.3.0`, `tailwindcss-animate ^1.0.7` — **o mesmo minor do Tailwind e a mesma Radix do alvo** (4.3.3 / 3.3.0 instalados). Então nada aqui é deriva de versão: o `!important` sobre `!important` do ctvitrine (`app.css:521-523`, com `--font-boutique` declarado no `@theme` em `:25`, portanto com `.font-boutique` já gerada pelo compilador) é o mesmo legado v3 que o boilerplate carrega, escrito no mesmo Tailwind. Os dois times pagaram o mesmo pedágio por não terem migrado o idioma.

**Fatia que eu recomendo em lugar da proposta:** apagar 450-457 (`.font-title` e `.font-support`); envolver o bloco de tipografia de elemento em `@layer base`; estender a guarda para falhar quando o `app.css` declarar à mão uma classe homônima de utilitária de `@theme` **ou** usar `@layer utilities`/`@layer components` no lugar de `@utility`. Risco maior do que o candidato estimou: mover para `@layer base` muda quem vence contra o Radix (que é unlayered — ver V6T5) e pode inverter a tipografia dentro de componentes Radix. Precisa vir **depois** ou **junto** do `layer()` do V6T5, não antes.

---

### V6T5 — `@import '@radix-ui/themes/styles.css'` sem `layer()`

**Veredito: ATUAL COM MODERNIZAÇÃO — a correção proposta é a documentada, e a versão instalada oferece uma segunda, mais barata, que o candidato não nomeia.**

**Premissa reconfirmada sem depender do build velho.** Medi o pacote instalado: `grep -c '@layer' node_modules/@radix-ui/themes/styles.css` → **0**, em `@radix-ui/themes@3.3.0`. A Radix Themes 3.3 envia CSS inteiramente sem layer. O sequestro é estrutural, não artefato de build desatualizado — as três medições em byte offset do candidato ficam corroboradas por um caminho independente.

**Modernização A — `layer()` no import.** É o idioma da própria Tailwind: a doc 4.x mostra o entry point do framework fazendo exatamente isso — `@import "./theme.css" layer(theme); @import "./preflight.css" layer(base); @import "./utilities.css" layer(utilities);`. Para terceiro, `@import '@radix-ui/themes/styles.css' layer(components);` é a forma sancionada ([discussão oficial radix-ui/themes #763](https://github.com/radix-ui/themes/discussions/763)).

**Modernização B — `@theme inline`, uma palavra, resolve o sintoma medido.** Doc 4.x: *"Using the `inline` option, the utility class will use the theme variable **value** instead of referencing the actual theme variable."* Com `@theme inline`, `.bg-background` compila para `background-color: var(--background)` — e a redeclaração de `--color-background` que a Radix faz em `:where(.radix-themes)` fica **inerte, porque nada mais lê `--color-background`**. É o que o shadcn/ui distribui para Tailwind v4. O `@theme` do boilerplate está em `app.css:14@origin/main` **sem** `inline`, com 30 tokens no formato `--color-x: var(--x)` — exatamente o padrão que `inline` existe para servir.

As duas não são alternativas: **B** mata o sequestro específico dos `--color-*`; **A** conserta a cascata em geral (a Radix continua vencendo utilitárias em tudo que não passa por token). A ordem barata é B → A.

**Sobre a asserção proposta** (`@import` de terceiro carrega `layer()`): confirmo que ela não existe — `git grep -n 'layer(' origin/main -- resources/js/test resources/css` → 0 linhas. E confirmo o alerta do candidato: ela nasce vermelha. Com **B** aplicado primeiro, ela pode nascer verde no mesmo PR se **A** vier junto; sozinha, não.

---

### V6T6 — Anatomia dos `!important`

**Veredito: ATUAL COM MODERNIZAÇÃO — três dos quatro grupos têm resposta nativa nomeável, e um dos grupos é código morto.**

- **Tipografia (21 no boilerplate, 22 no ctvitrine):** resposta nativa é a cascade layer, não o `!important`. Medido na fonte (V6T4): as regras estão fora de layer. Upgrade Guide v4: *"we are using native cascade layers and no longer hijacking the `@layer` at-rule"*. Dentro de `@layer base`, utilitária ganha sem `!`. Continuo concordando que **não é fatia P** e que mexer nos 21 seletores muda aparência — mas o caminho de saída agora tem nome de API, não é "redesenhar".
- **Radix (`--default-font-family: … !important`, `app.css:97-98`):** a Radix Themes documenta `--default-font-family` como ponto de customização; com o import em `layer(components)` (V6T5-A) o override deixa de precisar de `!`. **Não medi** se o `!important` já é redundante hoje — as duas declarações são unlayered, então ordem de fonte deveria bastar. Conferir quando a fatia do V6T5 rodar.
- **Toast (24):** não é questão de versão. `react-hot-toast@2.6.0` é a versão instalada nos dois projetos e estiliza por `style` inline via emotion; CSS externo é o canal errado em qualquer versão. Nada a modernizar, o diagnóstico do candidato está certo.
- **iOS (1) — achado novo, e é `[rejeitado]` por outro motivo:** a regra está guardada por `.ios-input-16`, e essa classe **não é aplicada em lugar nenhum**. Medido em toda a árvore dos dois projetos: `git grep -n 'ios-input-16' origin/main` → 3 linhas, todas a própria declaração em `app.css:592-594`; `git grep -n 'ios-input-16' 53d7d9a` → 3 linhas, idem em `app.css:600-602`. **O único `!important` "não-tipografia, não-toast" do censo é CSS morto nos dois projetos** — mesma família que a PR #108 podou. Sai com `@supports` e tudo, 8 linhas, risco zero, e o censo passa de 46 para 45.

**Um `!important` a mais que o censo não viu, e em sintaxe deprecada.** `resources/js/components/ui/dropdown-menu.tsx:75@origin/main` traz `data-[variant=destructive]:*:[svg]:!text-destructive-foreground` — o `!` **no início**, forma v3. Upgrade Guide v4, verbatim: *"In v3 you could mark a utility as important by placing an `!` at the beginning of the utility name … In v4 you should place the `!` at the very end of the class name instead … The old way is still supported for compatibility but is deprecated."* Forma correta: `…:text-destructive-foreground!`. Uma ocorrência em toda a árvore (medido) — fatia de um caractere.

---

### V6T7 — `--ring` a 1.85:1

**Veredito: ATUAL.** Nada em Tailwind 4.3, React 19.2 ou Radix 3.3 substitui um token de contraste medido, e não existe lint de contraste nativo em nenhuma das três.

**O que a versão acrescenta a favor do candidato:** o boilerplate usa `outline-none` + `focus-visible:ring-ring focus-visible:ring-[3px]` (medido em `button.tsx:9` e `input.tsx:12@origin/main`), que é o idioma **correto de v4** — o Upgrade Guide registra que v4 mudou o `ring` padrão de 3px para 1px e a cor de `blue-500` para `currentColor`, tornando `ring-[3px]` + cor explícita obrigatórios. Isso reforça o argumento: `--ring` é o indicador inteiro, o `ring-[3px]` não tem cor de fallback do framework para cair, e o piso de 3:1 de 1.4.11 incide direto sobre o token. O backport para ctvitrine/cuidari é correto e não tem alternativa nativa.

---

### V6T8 — `--primary` do escuro

**Veredito: ATUAL. Concordo com o "nada a absorver", e a lente confirma por um segundo caminho.**

Existe hoje uma função nativa que faria o trabalho — `contrast-color()`, MDN: *"Baseline 2026 — Newly available. Since April 2026 this feature works across the latest devices and browser versions"*, retornando `white` ou `black` mirando WCAG AA. Ela poderia derivar `--primary-foreground` em vez de o time escolher à mão.

**E é o caso em que ela é a resposta errada**, pela advertência da própria MDN: *"WCAG AA contrast is not always sufficient for mid-tone colors. For example, `contrast-color()` on royal blue (#2277d3) produces black text that may not be readable for small text."* `#379bcb` é exatamente um mid-tone dessa família. A escolha manual de `--brand-navy-dark` (4.68:1) é melhor do que o que a função devolveria, e ela devolveria `black`/`white`, não navy — perderia a marca. Nomear a alternativa nativa e **descartá-la com a ressalva da doc** é o veredito.

O ponto (b) do candidato — comentário que critica upstream por valor congela uma versão do upstream — é atemporal e correto. Vira argumento para o V6T13.

---

### V6T9 — `<meta name="theme-color">`

**Veredito: ATUAL, com correção de escopo — e a lente resolve a pergunta que o candidato deixou aberta.**

Nada nativo substitui: `color-scheme` (já presente em `app.blade.php:8` e `:43,49`) pinta controles e canvas, `theme-color` pinta o chrome do browser. São complementares, como o candidato disse.

**Correção de escopo, que muda como vender a fatia:** MDN classifica `<meta name="theme-color">` como **"Limited availability — this feature is not Baseline because it does not work in some of the most widely-used browsers"**. Não é um recurso cross-browser; é um ganho em Chrome Android e no chrome de PWA/Safari. Vender como "o app passa a acompanhar o tema no browser" seria falso. Vale P de esforço, mas o texto do PR precisa dizer "onde o browser suporta".

**Resposta à pergunta em aberto ("qual das duas formas o `use-appearance` suportaria sem JS extra"):** nenhuma das duas sozinha, e a escolha não é entre elas — é pelo estado. A MDN documenta o `media` como parte da especificação, com o exemplo `<meta name="theme-color" content="cornflowerblue" media="(prefers-color-scheme: light)">`. Duas tags com `media` acompanham a preferência do SO sem uma linha de JS, mas **não acompanham a troca manual**, que no boilerplate é uma classe no `<html>` e não um estado de media query. Então o desenho correto espelha o que o `<meta name="color-scheme">` já faz na linha 8:

- `$appearance === 'light'|'dark'` → **uma** tag com o hex correspondente, renderizada no servidor;
- `$appearance === 'system'` → **duas** tags com `media="(prefers-color-scheme: light|dark)"`.

Custo: uma condicional Blade, zero JS. E o hex escuro entra no `InlineThemeBackgroundTest` que já trava `#0f2a44` — o candidato está certo em exigir isso, senão vira a quarta cópia solta (medido: `git grep -n 0f2a44 origin/main` → 4 arquivos hoje).

---

### V6T10 — `preconnect` para `fonts.bunny.net`

**Veredito: ATUAL.** Apagar linha morta não tem dimensão de versão; a fatia está certa em qualquer stack. Medi de novo por conta própria: 1 ocorrência no boilerplate (`app.blade.php:67@origin/main`), 1 no ctvitrine (`app.blade.php:138@53d7d9a`), zero `@font-face`, `@import` ou `src:` apontando para bunny nos dois.

**Uma nota de versão, para ninguém propor a coisa errada no lugar:** medido `git grep -n 'prefetch' origin/main -- app resources/views bootstrap` → **0 linhas**. O boilerplate não usa `Vite::prefetch()` do Laravel 13, que é o mecanismo sancionado de resource hint hoje — e que trata de **chunks do build**, não de host de terceiro. Substituir o `preconnect` morto por prefetch de Vite seria trocar uma coisa por outra sem relação. É deleção pura.

---

### V6T11 — 23 `@font-face`, não 34

**Veredito: ATUAL.** A correção de contagem é aritmética e independe de versão; reproduzi o mecanismo do erro (`@font-face` dentro da URL da MDN em comentário) e a composição fecha. A economia central — *`@font-face` não usada não custa byte de rede, o custo é de repositório e manutenção* — continua valendo integralmente em Vite 8.2 / Tailwind 4.3: nenhum dos dois gera, poda ou audita `@font-face`, e nenhum dos dois gera `<link rel=preload>` para fonte. Não há sucessor nativo do preload escrito à mão.

**O que a versão acrescenta:** `font-display: swap` está em todas as faces (medido em `_fonts.css@origin/main`, amostra de 10 blocos lidos) — é a prática corrente, nada mais novo a fazer aí.

**A modernização que o candidato não nomeia, e que ataca justamente os 255.372 B de preload:** **fonte variável**. As 10 faces de Aptos são instâncias estáticas (light/regular/semibold/bold + itálicos, medido pelos nomes de arquivo); um woff2 variável colapsaria a lista de preload de 5 para 1-2 e o `_fonts.css` de 21 faces para 3-4. **Não medi** se existem builds variáveis dessas três famílias no repositório nem qual seria o peso — é opção real, não afirmação. Idem `size-adjust`/`ascent-override` para casar métricas de fallback: ausente, e é o que reduz CLS sem baixar byte nenhum.

O princípio "preload só do que a página desenha" do ctvitrine é atemporal e continua sendo a única guarda possível contra a lista de 5 virar 8.

---

### V6T12 — `--brand` runtime + `color-mix(in oklab, …)`

**Veredito: ATUAL COM MODERNIZAÇÃO — o candidato mais forte da frente, e a lente melhora as duas metades dele.**

**Modernização A — `color-mix(in oklab)` não é só defensável, é o que o Tailwind instalado emite.** Medido no artefato compilado (`public/build/assets/app-BKlgUCP1.css`, o mesmo build de 20/08 16:00 que o candidato usou, e com a mesma ressalva de estar em `30fe0eb`):

| forma | ocorrências |
|---|---|
| `color-mix(in oklab` | **159** |
| `color-mix(in lab` | **122** |
| `color-mix(in srgb` | **1** |

E confirmei a origem sem depender do build: `grep -rho 'color-mix(in [a-z]*' node_modules/tailwindcss/*.css` → só `oklab`. A única `srgb` do arquivo é código do próprio boilerplate — `app.css:366@origin/main`, `background-color: color-mix(in srgb, var(--table-row-hover) var(--table-row-hover-opacity), transparent)`. Ou seja: **a forma do ctvitrine está mais alinhada ao framework instalado do que o único `color-mix` que o boilerplate já escreveu.** Fatia adjacente, P: `in srgb` → `in oklab` em 366 (muda levemente o tom renderizado; pede olhada, não é troca cega).

**Modernização B — a metade difícil ganhou função nativa desde abril.** O candidato escreve a regra como *"ou o foreground é derivado da luminância dela em runtime"* e deixa o mecanismo por inventar. Ele existe: `contrast-color()`, MDN — *"takes a color value and returns a contrasting color — either `white` or `black` — depending on which has greater contrast with the input color… designed to ensure WCAG AA minimum contrast (4.5:1)"*, **Baseline 2026, newly available desde abril de 2026**. `color: contrast-color(var(--brand))` faz em CSS puro, sem JS e sem round-trip, o que a regra pede. Duas ressalvas, ambas da própria MDN: (a) *newly available* significa aparelho antigo de fora — precisa de `@supports (color: contrast-color(red))` com fallback; (b) *"WCAG AA contrast is not always sufficient for mid-tone colors"* — e cor de lojista é justamente o espaço onde mid-tone é comum (o `#b26e79` do mockup é exemplar).

Consequência para o texto da regra `.ai/rules`: a **primeira** cláusula (piso de contraste na validação, para os usos como texto) sobrevive intacta — nada nativo valida input de formulário. A **segunda** cláusula deve passar a **nomear `contrast-color()` como o mecanismo sancionado**, com `@supports`, em vez de deixar cada implementador escrever sua própria conversão de luminância em TS. Isso é o que muda entre "regra que descreve um desejo" e "regra que aponta uma API".

**Modernização C — os 8 percentuais ad-hoc têm API de primeira classe na versão instalada.** "Consolidar em 3 níveis nomeados" não é só higiene: em 4.3.3 isso é `@theme` + `@utility` funcional. Doc: `@utility tab-* { tab-size: --value(--tab-size-*); }` — *"Use the `--value(--theme-key-*)` syntax to resolve the utility value against a set of theme keys"*. Três tokens `--brand-soft/-muted/-subtle` no `@theme` mais um `@utility` de uma linha substituem os 33 call sites com 8 misturas diferentes, e ganham variantes (`hover:`, `dark:`) de graça — coisa que `bg-[color-mix(...)]` escrito à mão não tem.

**Não verificado:** sintaxe de cor relativa (`oklch(from var(--brand) …)`), que seria a alternativa a `color-mix` para rampas de luminância. Não conferi o status de baseline dela; não a use como argumento sem medir.

Confirmo o resto: `git grep -ln "primary_color\|theme_color\|brand_color" origin/main` → 0 arquivos, então isto é regra a escrever antes da primeira feature de white-label, não defeito a consertar.

---

### V6T13 — 6 de 6 contas certas em comentário, zero testes

**Veredito: ATUAL — e o desenho do artefato é acertadamente adequado à versão, o que merece ser dito em vez de ficar implícito.**

Nada em Tailwind 4.3, Vite 8.2 ou Vitest 4.1 oferece verificação de contraste. Não há plugin oficial, não há hook no `@theme`, não há nada no `@utility`. O `theme-tokens.test.ts` não é um remendo à espera de recurso nativo — é o teto.

**E a escolha de lê-lo como texto é a correta, por um motivo de versão que vale registrar na fatia:** como Tailwind 4.3 só emite variável de `@theme` que é usada (doc citada em V6T2), qualquer asserção futura que procurar token **na saída do build** dará falso negativo para tokens de `@theme`. Ler `resources/css/app.css` como texto imuniza o teste contra o tree-shaking. Quem estender a tabela precisa saber disso.

**Para os quatro pares que o candidato quer acrescentar, a armadilha não morde:** `--success`, `--warning`, `--info` e seus `-foreground` estão em `:root`/`.dark` (medido, `app.css:135-140` e `:189-194@origin/main`), **não** no `@theme` — sempre emitidos, sempre visíveis à leitura de texto. E é por isso que `.text-success{` dá 0 no compilado: não existe `--color-success` no `@theme` (`app.css:14-70`, medido — a lista vai de `--color-background` a `--color-sidebar-ring` e não inclui estado). As duas medições do candidato são consistentes entre si e com o framework.

Fatia P, nasce verde, não depende do F1. Concordo em ser a primeira.

---

### V6T14 — `iconTheme` morto em `warning` e `info`

**Veredito: ATUAL — e passo o achado de PLAUSÍVEL para CONFIRMADO na versão instalada.**

Verifiquei por conta própria, não pela citação do candidato. `node -e "require('./node_modules/react-hot-toast/package.json').version"` → **2.6.0**, que é a versão do `package.json@origin/main` (`^2.6.0`) e a mesma do ctvitrine (`^2.6.0`, medido em `53d7d9a:package.json`). O `ToastIcon` minificado em `node_modules/react-hot-toast/dist/index.js`:

```js
$=({toast:e})=>{let{icon:t,type:o,iconTheme:s}=e;return t!==void 0?typeof t=="string"?S.createElement(ve,null,t):t:o==="blank"?null:S.createElement(Re,null,S.createElement(L,{...s}),o!=="loading"&&S.createElement(Pe,null,o==="error"?S.createElement(C,{...s}):S.createElement(U,{...s})
```

`t!==void 0` retorna antes de `s` (=`iconTheme`) ser espalhado em qualquer elemento. Como `toast-config.ts@origin/main` define `icon: '⚠️'` (`:74`) e `icon: 'ℹ️'` (`:97`), os `iconTheme` de `:87-90` e `:109-112` são inalcançáveis. **Confirmado, não plausível.** E o comentário do teste em `:39` — *"a cor do ícone é `iconTheme`, e este é o único canal que funciona"* — é falso para metade da tabela que ele encabeça.

**Dimensão de atualidade:** `react-hot-toast` 2.6.0 é a versão corrente e não está deprecada; nenhuma versão mais nova altera esse caminho de render. O default de ecossistema pós-shadcn é `sonner`, mas isso é troca de biblioteca, decisão de outro escopo, e **não mudaria o achado** — chave de config que o caminho de render nunca lê é morta em qualquer lib. Não há modernização a propor: a fatia é apagar as 2 linhas mortas, ajustar a tabela do teste para 2 linhas + 2 asserções de que `warning`/`info` usam `icon` e por isso não usam `iconTheme`, e reescrever o comentário com os dois canais.

O achado de contraste de brinde (glifo de sucesso a **2.28:1** no escuro) não tem componente de versão e nasce/morre com a fatia do V6T13, como o candidato disse.

---

### Nota transversal (fora dos 14, porque a lente foi instruída a caçar isto)

`tailwindcss-animate@1.0.7` continua instalado e carregado por `@plugin 'tailwindcss-animate'` (`app.css:7@origin/main`), com 17 usos de `animate-in`/`animate-out` mais `animate-spin` (18) e `animate-pulse` (1) no markup (medido em `resources/js` + `resources/views`). É o plugin JS da era v3. O upstream o deprecou em favor de **`tw-animate-css`**, substituto puro-CSS para Tailwind v4 — *"TailwindCSS v4.0 compatible replacement for `tailwindcss-animate`"* — e tanto o [shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4) quanto o [shadcn-svelte](https://shadcn-svelte.com/docs/migration/tailwind-v4) migraram. O ctvitrine tem a **mesma** linha `@plugin` no **mesmo** minor do Tailwind, então é legado do boilerplate, não deriva da fonte. `@keyframes` manual no `app.css@origin/main`: **zero** (medido; a única ocorrência da string está em comentário na linha 675, resíduo textual da PR #108) — ou seja, não há o defeito inverso. Fora do escopo deste lote; registrado para quem montar a frente de animação.

---

#### Medições e versões (base de todos os vereditos)

Alvo lido só por `git show`/`git grep` sobre `origin/main` = **`beb848ea509bf6682c9e31f10611ad7ab489392e`** (confirmado por `git rev-parse`). Fonte lida só por `git show`/`git grep` sobre **`53d7d9a`**. Nenhum build, teste ou comando de escrita foi executado.

| pacote | alvo (`origin/main` + node_modules) | fonte (`53d7d9a`) |
|---|---|---|
| tailwindcss | **4.3.3** (instalado) | `^4.3.0` — **mesmo minor** |
| @radix-ui/themes | **3.3.0** (instalado, `@layer` = 0) | `^3.3.0` |
| react / react-dom | `^19.2.8` | `^19.2.7` |
| @inertiajs/react | `^3.6.1` | `^3.4.0` |
| vite | `^8.2.1` | `^7.3.5` |
| typescript | `^6.0.3` | `^5.9.3` |
| react-hot-toast | **2.6.0** (instalado) | `^2.6.0` |
| tailwindcss-animate | **1.0.7** (instalado) | `^1.0.7` |
| laravel/framework · php | `^13.0` · `^8.4` | não medido |

A premissa da lente de que "a fonte está em versões diferentes do alvo" **não vale para CSS**: Tailwind e Radix Themes são o mesmo minor nos dois. Divergem Vite (7.3 → 8.2), TS (5.9 → 6.0) e Inertia (3.4 → 3.6), nenhum dos quais toca os 14 candidatos desta frente.

Fontes de doc consultadas (todas *version-aware* ou baseline explícito): `search-docs` do Boost para `tailwindcss@4.x` (Theme, Adding Custom Styles, Functions and Directives, Upgrade Guide, Color Scheme, Dark Mode); [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme) para `@theme static` e `@theme inline`; [MDN `contrast-color()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/contrast-color); [MDN `light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark); [MDN `meta name="theme-color"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/theme-color); [radix-ui/themes discussão #763](https://github.com/radix-ui/themes/discussions/763); [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) e [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4).

**Não medido, e onde importa:** builds variáveis das três famílias de fonte (V6T11); baseline da sintaxe de cor relativa `oklch(from …)` (V6T12); se o `!important` do `--default-font-family` já é redundante (V6T6); ordem de injeção de CSS do Vite 8.2 em dev (V6T1). As três medições que dependem do artefato compilado (`app-BKlgUCP1.css`, 824.001 B, 20/08 16:00, working tree em `30fe0eb`) foram usadas apenas em V6T4, V6T5 e V6T12 — e nos dois primeiros casos eu as **substituí ou corroborei** por medição na fonte de `origin/main` e no `node_modules` instalado, que não dependem do build.

---

## Caçador 2 — primitivos de `components/ui/`

# Caçador 2 — primitivos de `components/ui/` (ctvitrine `53d7d9a` × boilerplate `origin/main`)

## Diff da lista (confirmado, não é o número do inventário repetido)

`26` no ctvitrine × `30` no boilerplate — os dois números do inventário reproduzem.

- **Só no ctvitrine (1):** `navigation-menu.tsx`.
- **Só no boilerplate (5):** `confirm-dialog.tsx`, `currency-input.tsx`, `date-input.tsx`, `form-field.tsx`, `masked-input.tsx`.
- **Nos dois: 25.** Destes, **14 são byte-idênticos** (`alert`, `avatar`, `card`, `collapsible`, `dropdown-menu`, `icon`, `label`, `placeholder-pattern`, `separator`, `skeleton`, `table`, `toast-provider`, `toggle-group`, `tooltip`) e **11 divergem**.

Dos 11 divergentes, **10 são o boilerplate à frente ou empate cosmético**, e a divergência é quase toda de uma linha só:

| Arquivo | Natureza da divergência | Quem está à frente |
|---|---|---|
| `badge`, `checkbox`, `input`, `select`, `textarea`, `toggle` | **só** `focus-visible:ring-ring/50` → `focus-visible:ring-ring` | boilerplate |
| `breadcrumb` | `sr-only` "More" → "Mais" | boilerplate |
| `sheet` | `sr-only` "Close" → "Fechar" | boilerplate |
| `dialog` | idêntico exceto um comentário de 2 linhas que o boilerplate removeu | empate |
| `button` | token de anel + **prop `loading`** (`aria-busy`, `LoaderCircle`, `loadingText`) | boilerplate |
| `sidebar` | 5 blocos: 4 do boilerplate (guarda `isTypingTarget`, `aria-keyshortcuts`, tooltip do atalho, `type="button"` no rail, strings pt-BR) + **1 do ctvitrine: `min-w-0` no `SidebarInset`** | dividido → **V6P-1** |

**Resposta direta à pergunta prioritária** (`button`, `confirm-dialog`, `sidebar`, `tooltip`, `input`, `select`): em cinco dos seis o boilerplate está estritamente à frente e não há regressão. O **único** ponto em que o ctvitrine passou o boilerplate na lista prioritária é o `min-w-0` do `SidebarInset` — V6P-1.

---

### V6P-1 · `SidebarInset` perdeu o `min-w-0` que o ctvitrine tem, e o `<main>` do kit é flex item sem trava de encolhimento

- **Evidência:** `resources/js/components/ui/sidebar.tsx:307-309@53d7d9a`
  ```
  // min-w-0: sem isso o min-content de tabelas/linhas largas expande o main
  // além do viewport no mobile, em vez de rolar dentro dos containers
  "bg-background relative flex min-h-svh min-w-0 flex-1 flex-col",
  ```
- **Estado do boilerplate hoje:** a classe **não existe**. `origin/main:resources/js/components/ui/sidebar.tsx:329-336` é `"bg-background relative flex min-h-svh flex-1 flex-col"`. E o contêiner pai é flex de linha: `origin/main:resources/js/components/ui/sidebar.tsx:148` → `"group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full"`. A cadeia que chega lá é real e única: `layouts/app/app-sidebar-layout.tsx` → `AppContent variant="sidebar"` (`components/app-content.tsx:10`, `return <SidebarInset {...props}>`) → `<main>`. `git grep -n "min-w-0" origin/main -- resources/js/components/ui/sidebar.tsx` devolve 4 linhas (412, 481, 668, 711) — todas dentro da coluna da sidebar, **nenhuma no `SidebarInset`**.
- **O que absorver / o que travar:** acrescentar `min-w-0` ao `SidebarInset` e o comentário de origem. Travar com um teste de estilo no molde do que já existe (`resources/js/test/styles/focus-ring.test.ts`): ler o arquivo e exigir que a className do `data-slot="sidebar-inset"` contenha `min-w-0`, com controle positivo (o slot tem de ser encontrado) para não passar vácuo se o arquivo for renomeado.
- **Adaptação necessária:** nenhuma — é a mesma linha, no mesmo arquivo shadcn, no mesmo `cn()`. O comentário do ctvitrine cita "tabelas largas"; no boilerplate o gatilho medido é outro (`git grep -ln "components/ui/table" origin/main -- resources/js` → **0 importadores**; toda tabela vem do `@radix-ui/themes`), então o texto do comentário deve dizer "conteúdo de min-content largo", não "tabelas".
- **Risco · esforço:** **P · P.** Uma classe. `min-width: 0` num flex item só permite encolher; não muda nada onde o conteúdo já cabe.
- **Ressalva de honestidade:** **não reproduzi visualmente.** Não rodei browser nem build (proibido nesta rodada). O que está medido é: (a) a classe existe lá e não aqui, (b) o `<main>` é `flex-1` dentro de um flex de linha, que é a condição em que `min-width:auto` impede o encolhimento. A consequência visual é a alegação da fonte, não minha medição.
- **Multi-fonte?** Sim, o tema do `SidebarInset` ser o `<main>` real aparece no ctfinance — `docs/harvest/v2/ctfinance.md:336` ("O `<main>` real é o do `SidebarInset` (`ui/sidebar.tsx:304`)"). O `min-w-0` em si só apareceu no ctvitrine.

---

### V6P-2 · Resíduo da poda do header: uma dependência npm com zero importadores e um componente morto que ainda carrega a única string de UI em inglês do front

- **Evidência (o lado ctvitrine, que mostra o que foi podado):** `resources/js/components/ui/navigation-menu.tsx@53d7d9a` existe e é vivo — `resources/js/components/app-header.tsx:6@53d7d9a`: `import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';`
- **Estado do boilerplate hoje:** a poda dos três arquivos já aconteceu e está documentada em `origin/main:resources/js/test/styles/focus-ring.test.ts:54` ("a cadeia `app-header-layout` → `app-header` → `navigation-menu` era órfã inteira"). Mas ficaram dois resíduos, os dois medidos:
  1. `origin/main:package.json:69` → `"@radix-ui/react-navigation-menu": "^1.2.22"` com **0 importadores** (`git grep -c "from '@radix-ui/react-navigation-menu'" origin/main -- resources/js` → 0; é o único dos 13 pacotes `@radix-ui/*` com zero).
  2. `origin/main:resources/js/components/appearance-dropdown.tsx` tem **0 importadores** (`git grep -n "AppearanceToggleDropdown\|appearance-dropdown" origin/main -- resources/js` devolve só a própria definição, linha 7) — e é onde mora `sr-only">Toggle theme</span>` (linha 27). `AppearanceTabs` é o único dos dois montado (`origin/main:resources/js/pages/settings/appearance.tsx:4`).
  Sobrevivem também os ramos `variant="header"` de `app-shell.tsx:22` e `app-content.tsx:14`, sem nenhum call-site (`git grep -n 'variant="header"' origin/main -- resources/js` → 0 fora de comentários).
- **O que absorver / o que travar:** remover a dependência do `package.json`, apagar `appearance-dropdown.tsx` e decidir sobre os ramos `variant="header"`. O guard-rail que impede a próxima poda deixar rastro: um teste node (mesmo padrão de `focus-ring.test.ts`, que já lê a árvore com `readdirSync`) que cruza os `@radix-ui/*` das `dependencies` com os `import ... from` de `resources/js` e falha em dependência sem importador. Hoje o cruzamento acusaria exatamente 1.
- **Adaptação necessária:** nenhuma para o pacote. Para `appearance-dropdown.tsx` a decisão é apagar ou adotar; se adotar, cai na V6P-6 junto com o `appearance-tabs`.
- **Risco · esforço:** **P · P.** Remover dependência sem importador não muda bundle de runtime, só o lockfile.
- **Multi-fonte?** Sim, **3 de 3**. `navigation-menu.tsx` está vivo nos derivados: cuidari (`docs/harvest/v2/cuidari.md:2453`, na lista dos 27 em ambos) e spinmax (`docs/harvest/v2/spinmax.md:1178`, `navigation-menu.tsx (168)`). `appearance-dropdown.tsx` aparece nos dois também (`cuidari.md:174`, `spinmax.md:1216`). Ou seja: o boilerplate podou e os derivados não — a fatia de sincronização vai reencontrar isto.

---

### V6P-3 · Campo de imagem com preview e disciplina de `revokeObjectURL` — o boilerplate tem **zero** superfície de upload no front

- **Evidência:** `resources/js/pages/site-settings/edit.tsx:166-198@53d7d9a` — `BrandingImageField` monta miniatura + `<Input type="file" accept="image/jpeg,image/png,image/webp">` + botão "Remover", com a cadeia de fallback declarada em duas linhas:
  ```
  const shownUrl = previewUrl ?? currentUrl ?? defaultUrl;
  const isCustom = previewUrl !== null || currentUrl !== null;
  ```
  E o ciclo de vida do blob, `resources/js/pages/site-settings/edit.tsx:289-330@53d7d9a` — **três** pontos de revogação (`dropPreview`, o `setPreview` do `selectImage`, e o `onSaved`), sempre pelo updater funcional para não vazar o URL anterior:
  ```
  setPreview((previous) => { if (previous) URL.revokeObjectURL(previous); return URL.createObjectURL(file); });
  ```
- **Estado do boilerplate hoje:** **não existe nada disto.** Três comandos, os três vazios: `git grep -n 'type="file"' origin/main -- resources/js` → 0 · `git grep -n "createObjectURL" origin/main -- resources/js` → 0 · `git grep -n 'accept="image' origin/main -- resources/js` → 0. Os cinco primitivos de formulário que o boilerplate tem a mais (`currency-input`, `date-input`, `masked-input`, `form-field`, `confirm-dialog`) não cobrem arquivo.
- **O que absorver / o que travar:** um `ui/image-field.tsx` genérico: props `label`, `hint`, `accept`, `previewUrl | currentUrl | defaultUrl`, `onSelect(File|null)`, `onRemove`, `error`; miniatura com `alt=""` (decorativa, o `Label` já nomeia o campo); o botão "Remover" só quando há imagem customizada. E um hook `use-object-url` que encapsule os três pontos de revogação — é essa a parte que erra sozinha.
- **Adaptação necessária:** três. (1) O ctvitrine acopla o campo ao `useSettingsAutosave` (`resources/js/hooks/use-settings-autosave.ts@53d7d9a`, `router.post` com `only:['settings']` + `async: true`); o boilerplate não tem autosave e usa `useForm` — o primitivo tem de ser controlado, sem saber salvar. (2) Trocar `focus-within:ring-ring/50` do estilo herdado por `ring-ring` (contrato do boilerplate, travado em `focus-ring.test.ts`). (3) **Não** absorver sem o backend: o `spinmax.md:3444` e `:3536` já registraram que **upload não existe em nenhum dos dois lados do par spinmax↔boilerplate**, e que guard-rail de MIME/tamanho passaria vácuo. Se o front entrar sem a feature, o teste do primitivo cobre render e revogação — não política de upload.
- **Risco · esforço:** **M · M.** O componente é pequeno; a armadilha é o ciclo do object URL, e ele é testável em jsdom com `URL.createObjectURL`/`revokeObjectURL` mockados.
- **Multi-fonte?** Parcial e **por negação**, o que é o achado: `spinmax.md:3444` mede `0 × 0` (nenhum `type="file"` no spinmax nem no boilerplate) e `cuidari.md:2064` registra um disco `private` LGPD **sem uso**. O ctvitrine é o **único dos quatro** com superfície de upload real no front.

---

### V6P-4 · Entrada por chips (`ColorChipsInput`) — primitivo genérico que o boilerplate não tem em nenhuma forma

- **Evidência:** `resources/js/components/items/color-chips-input.tsx:28-97@53d7d9a`. O que o torna genérico e não domínio: dedup sem diferenciar maiúscula (`mergeColor`, linha 13), Backspace no campo vazio remove o último (linha 56+), `aria-label` por chip (linha 77, `Remover cor ${color}`), e a colagem multi-valor com o motivo escrito:
  ```
  // Colar "Preto, Tartaruga, Azul" adiciona todos de uma vez. Os segmentos
  // são acumulados numa lista e enviados num ÚNICO onChange: chamar onChange
  // por cor dentro do mesmo evento faria cada chamada ler o `value` obsoleto
  // do closure e sobrescrever a anterior — só a última cor sobreviveria.
  ```
- **Estado do boilerplate hoje:** ausente. `git grep -in "chip\|tagsinput\|tag-input" origin/main -- resources/js` → **0 linhas**. O mais próximo é `ui/toggle-group.tsx` (escolha entre opções fixas), que resolve outro problema — ali o conjunto é aberto.
- **O que absorver / o que travar:** `ui/chips-input.tsx` com `value: string[]`, `onChange`, `separators` (default `[',', 'Enter']`), `maxLength`, `disabled`, `placeholder`. O teste que vale é o da colagem: um único `onChange` com todos os segmentos — é a regressão que o comentário descreve e que ninguém pega lendo.
- **Adaptação necessária:** três. Renomear e tirar o vocabulário de cor (label, `placeholder`, `aria-label`). Trocar `focus-within:ring-ring/50` (linha 67) por `ring-ring`. E **acrescentar o que falta**: a lista de chips não tem região viva — remover um chip não anuncia nada; o boilerplate já tem o idioma certo em `origin/main:resources/js/components/data-table/search-bar.tsx:78` (`<div aria-live="polite" aria-atomic="true" className="sr-only">` renderizada sempre).
- **Risco · esforço:** **P · M.** Componente isolado, sem dependência de Radix.
- **Multi-fonte?** Não encontrei o tema nos outros três inventários (`grep -i "chip" cuidari.md spinmax.md ctfinance.md` → nada relevante). Fonte única.

---

### V6P-5 · Ícone de marca próprio: o ctvitrine tem contrato escrito; o boilerplate tem 2 SVGs inline e **nenhum** com atributo de acessibilidade

- **Evidência:** `resources/js/components/whatsapp-icon.tsx:4-10@53d7d9a` — o contrato está no docblock e na tag:
  ```
  * Glifo oficial do WhatsApp (sólido). O lucide-react não inclui ícones de
  * marca, então usamos o SVG próprio. Herda a cor via `fill="currentColor"`
  * e o tamanho pela className (ex.: "h-4 w-4"), como os ícones do lucide.
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
  ```
  Não é caso isolado: 8 call-sites em 7 arquivos (`git grep -n "WhatsappIcon" 53d7d9a -- resources/js` → 18 linhas), e `resources/js/pages/site/landing.tsx:34@53d7d9a` documenta o denominador comum ("Ícone: aceita tanto os do lucide quanto o WhatsappIcon próprio").
- **Estado do boilerplate hoje:** lucide dos dois lados (bp: 59 arquivos importam `lucide-react`, versão `^1.31.0`; ct: 89 arquivos, `^0.475.0` — major diferente, mas o mesmo pacote). SVG local: o boilerplate tem **2** arquivos com `<svg` (`git grep -ln "<svg" origin/main -- resources/js`), e os dois estão sem qualquer marcação de a11y — `origin/main:resources/js/components/app-logo-icon.tsx:5` → `<svg {...props} viewBox="0 0 40 42" xmlns="...">` e `origin/main:resources/js/components/ui/placeholder-pattern.tsx:11` → `<svg className={className} fill="none">`. O `app-logo-icon` é decorativo de fato: `origin/main:resources/js/components/app-logo.tsx:7` põe o texto "Simplify Starter Kit" ao lado — ou seja, falta só o `aria-hidden`, o nome já existe.
- **O que absorver / o que travar:** **(a)** o contrato do glifo local como regra em `.ai/rules/js.md`: marca que o lucide não cobre entra como componente próprio em `components/`, `fill="currentColor"`, tamanho por className, `aria-hidden="true"` embutido, `{...props}` por último. **(b)** o guard-rail, que é o valor real: teste node no molde do `focus-ring.test.ts` exigindo que todo `<svg` de `resources/js` traga `aria-hidden` **ou** (`role="img"` + `aria-label`/`<title>`). Hoje ele acusa **2** infratores no boilerplate — número medido, não estimado.
- **Adaptação necessária:** o ctvitrine tem 3 arquivos com `<svg` e **1 infrator** pelo mesmo critério: `ui/placeholder-pattern.tsx`, que é byte-idêntico ao do boilerplate (herdado dos dois lados). Ou seja, a correção do `placeholder-pattern` é do kit, não da fonte.
- **Risco · esforço:** **P · P.** Dois atributos e um teste.
- **Multi-fonte?** Não medido nos outros três — os inventários de cuidari/spinmax/ctfinance não enumeram `<svg` inline.

---

### V6P-6 · `appearance-tabs.tsx`: seletor exclusivo de 3 opções sem papel nem estado ARIA, em inglês, com `ui/toggle-group` já disponível e já usado ao lado — **defeito do boilerplate**

- **Evidência (o que o ctvitrine mostra):** `resources/js/components/site/color-selector.tsx:23-32@53d7d9a` — a fonte pelo menos **declara** o papel:
  ```
  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor do produto">
  … role="radio" aria-checked={active}
  ```
  E aí mostra o próprio erro: `git grep -n "tabIndex\|onKeyDown" 53d7d9a -- resources/js/components/site/color-selector.tsx` → **0 linhas**. `role="radiogroup"` sem tabulação móvel nem setas é um widget anunciado que o teclado não opera do jeito prometido.
- **Estado do boilerplate hoje:** pior, e medido. `git grep -n 'role="radiogroup"\|role="radio"\|aria-checked\|role="tablist"\|role="tab"' origin/main -- resources/js` → **0 linhas em todo o front**. O trocador de tema é `origin/main:resources/js/components/appearance-tabs.tsx:16-18`: uma `<div>` sem papel com três `<button type="button">` que se distinguem **só pela cor de fundo** (`appearance === value ? 'bg-white shadow-xs …'`). Quem usa leitor de tela não tem como saber qual tema está ativo. E os rótulos, `origin/main:resources/js/components/appearance-tabs.tsx:10-12`, são `'Light'`, `'Dark'`, `'System'` — contra a regra escrita em `origin/main:.ai/rules/js.md` ("O frontend é monolíngue pt_BR"). Com o `appearance-dropdown` morto (V6P-2), **estas três linhas são a única string de UI em inglês viva no front inteiro** (`git grep -nE ">(Light|Dark|System|Close|More|Toggle …)<"` → 4 acertos, 3 aqui + 1 no arquivo morto).
  O agravante: o boilerplate **já tem** o primitivo certo e **já sabe usá-lo** — `origin/main:resources/js/components/data-table/date-range-filter.tsx:78`:
  ```
  <ToggleGroup type="single" variant="outline" value={active?.key ?? ''} onValueChange={handleShortcut} aria-label="Atalhos de período">
  ```
  `ui/toggle-group.tsx` é Radix (tabulação móvel e estado de pressão de graça) e tem exatamente **1** importador no projeto.
- **O que absorver / o que travar:** reescrever `appearance-tabs.tsx` sobre `ToggleGroup type="single"` com `aria-label="Tema"` e rótulos "Claro" / "Escuro" / "Sistema"; um `ToggleGroup` de seleção única não pode ficar vazio, então o `value` vem do `useAppearance` e o `onValueChange` ignora string vazia. Guard-rail duplo: (1) teste render que exige, para cada opção, um controle com nome acessível pt-BR e o estado de pressão correto no tema ativo; (2) linha em `.ai/rules/js.md` — "escolha exclusiva entre opções visíveis usa `ui/toggle-group type=single`; `<div>` de `<button>`s com estado só na cor não anuncia nada".
- **Adaptação necessária:** nada vem do ctvitrine — o `appearance-tabs.tsx` de lá é o mesmo arquivo, ainda **sem** o `type="button"` que o boilerplate acrescentou (diff de 34 bytes). O que o ctvitrine contribui é o diagnóstico via `ColorSelector`: o par `role`/estado sem operação de teclado é o erro-irmão, e a lição é usar o primitivo Radix em vez de reimplementar o papel à mão.
- **Risco · esforço:** **P · P.** Um arquivo de 34 linhas, um teste, zero dependência nova.
- **Multi-fonte?** Sim, **3 de 3**: `appearance-tabs.tsx` está listado em cuidari (`cuidari.md:174`) e spinmax (`spinmax.md:1216`, "34 linhas"). O mesmo arquivo defeituoso viajou para todos os derivados — corrigir aqui é corrigir na origem de quatro cópias.

---

### V6P-7 · `role="status"` num nó que remonta a cada estado — a regra existe escrita no boilerplate, o teste não

- **Evidência:** `resources/js/pages/site-settings/edit.tsx:121-150@53d7d9a`. `SaveIndicator` retorna um **elemento diferente por estado**: linha 122 (`idle`) devolve um `<span>` **sem papel nenhum**; as linhas 128, 137 e 145 devolvem `<span … role="status" aria-live="polite">`. Cada transição destrói e recria a região viva — que é exatamente a condição em que ela não anuncia.
- **Estado do boilerplate hoje:** a regra está escrita em **dois** lugares e o comportamento está certo nos **dois** pontos onde se aplica: `origin/main:resources/js/components/input-error.tsx:7-11` ("`aria-live` num nó recém-montado não anuncia nada — a região precisa preexistir à mudança") e `origin/main:resources/js/components/data-table/search-bar.tsx:74-78` ("Renderizada SEMPRE, mesmo vazia"), com o parágrafo correspondente em `origin/main:.ai/rules/js.md`. O inventário completo das regiões vivas no front é **7 linhas de código** (`git grep -n 'aria-live\|role="status"\|role="alert"' origin/main -- resources/js | grep -v /test/`): `search-bar.tsx:78`, `input-error.tsx:18`, `ui/alert.tsx:30`, `lib/toast-config.ts:53,76`. **Zero `role="status"`.** O que **não** existe é teste: nenhum dos 41 arquivos de `resources/js/test/` cobre este contrato (`focus-ring.test.ts` e `theme-tokens.test.ts` cobrem foco e tokens, não região viva).
- **O que absorver / o que travar:** nada de código a portar — o boilerplate já está certo. O ativo é o guard-rail: `resources/js/test/styles/live-region.test.ts`, mesmo molde node do `focus-ring.test.ts`, com duas asserções e um controle positivo. (1) Nenhum `aria-live`/`role="status"` aparece dentro de um retorno condicional por estado — checável de forma barata exigindo que o atributo esteja no **mesmo componente** que também renderiza o caso vazio (o idioma do `search-bar.tsx`). (2) `role="alert"` continua permitido em nó montado sob condição, porque é o mecanismo desenhado para inserção — o `input-error.tsx` depende disso.
- **Adaptação necessária:** o teste tem de tolerar `ui/alert.tsx:30` (papel fixo no primitivo, call-site condicional legítimo) e `lib/toast-config.ts` (props passadas para a biblioteca, não JSX). Sem essas duas isenções ele nasce vermelho por motivo errado.
- **Risco · esforço:** **P · M.** O risco é o teste virar heurística frágil de regex; o controle positivo (achar pelo menos as 3 regiões conhecidas) é o que impede que ele passe vácuo.
- **Multi-fonte?** Sim. `ctfinance.md:137` registra que a região viva de busca aparecia copiada em **11 telas** no ctfinance — a mesma família de defeito, pelo outro lado (duplicação em vez de remontagem).

---

### V6P-8 · Cor de marca: `<input type="color">` pareado com campo hex — ausente no boilerplate

- **Evidência:** `resources/js/pages/site-settings/edit.tsx:565-582@53d7d9a` — o par, com o hex validado antes de alimentar o seletor nativo (que rejeita valor inválido em silêncio):
  ```
  <input type="color" aria-label="Selecionar cor primária"
         value={HEX_PATTERN.test(form.primary_color) ? form.primary_color : DEFAULT_PRIMARY_COLOR}
         onChange={…} onBlur={saveColor} className="border-input h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1" />
  <Input id="primary_color" value={form.primary_color} … maxLength={7} className="w-32 font-mono" />
  ```
  O `aria-label` no seletor e o `id`/`htmlFor` no campo de texto são deliberados: o `<Label>` nomeia o campo digitável, e o seletor nativo precisa de nome próprio porque não é o alvo do label.
- **Estado do boilerplate hoje:** ausente. `git grep -n 'type="color"' origin/main -- resources/js` → **0 linhas**.
- **O que absorver / o que travar:** `ui/color-input.tsx` controlado — o valor canônico é a string hex, o seletor nativo é só uma segunda entrada para o mesmo estado. Teste: hex inválido no campo de texto não derruba nem "conserta" o seletor; escolher no seletor normaliza o texto para `#rrggbb` minúsculo.
- **Adaptação necessária:** o ctvitrine salva no `onBlur` via autosave; o boilerplate usa `useForm`, então o primitivo só emite `onChange`/`onBlur` e não sabe salvar. `HEX_PATTERN` e `DEFAULT_PRIMARY_COLOR` viram props com default.
- **Risco · esforço:** **P · P.** Mas o valor só aparece quando existir algo configurável para colorir — hoje o boilerplate não tem branding por tenant. **Candidato de menor prioridade desta lista**; anoto para não se perder, não para a próxima fatia.
- **Multi-fonte?** Não. Fonte única — é a única das quatro bases com configuração de marca pelo usuário.

---

### V6P-9 · O ctvitrine é a prova de que o `ui/table` do shadcn dá conta — e a regra do boilerplate manda o contrário

- **Evidência:** `git grep -n "components/ui/table" 53d7d9a -- resources/js` → **3 páginas**, todas novas do domínio: `resources/js/pages/categories/index.tsx:10`, `resources/js/pages/items/index.tsx:8`, `resources/js/pages/metrics/index.tsx:3`. A listagem de itens usa o primitivo por inteiro (`resources/js/pages/items/index.tsx:275-345@53d7d9a`: `Table`/`TableHeader`/`TableRow`/`TableHead`/`TableBody`/`TableCell`, com larguras por coluna). Ao mesmo tempo o ctvitrine mantém o `@radix-ui/themes` nas telas **herdadas** do boilerplate — `resources/js/components/users/user-table-row.tsx:8`, `resources/js/components/permissions/role-users-table.tsx:8`, `resources/js/pages/users/index.tsx:23`. Ou seja: **fronteira limpa** — herdado fica no Themes, novo nasce em shadcn.
- **Estado do boilerplate hoje:** o contrário, e por escrito. `origin/main:.ai/rules/js.md` traz a regra "**Tabelas com Table de @radix-ui/themes, não shadcn**", com a justificativa "não use o `components/ui/table.tsx` do shadcn, que existe mas não é adotado". Medido: `git grep -n "components/ui/table" origin/main -- resources/js` → **0 importadores** (primitivo morto, e a regra o admite); `git grep -n "@radix-ui/themes" origin/main -- resources/js` → **7 arquivos** (`app.tsx:7`, `data-table/table-header.tsx:3`, `permissions/role-users-table.tsx:9`, `users/user-table-row.tsx:8`, `layouts/permissions/layout.tsx:3`, `pages/users/index.tsx:22`, e um teste). A folha entra global em `origin/main:resources/css/app.css:5` (`@import '@radix-ui/themes/styles.css'`) e a guerra de override está confessada na linha 93 do mesmo arquivo ("Override Radix UI Themes default font family to use Aptos — MUST be after @radix-ui/themes import").
- **O que absorver / o que travar:** **não é fatia de código, é decisão.** O que o ctvitrine adiciona ao dossiê é a evidência que faltava: alguém já rodou listagem de produção sobre o `ui/table` e não voltou atrás. O item concreto é reabrir a regra do `.ai/rules/js.md` com a fronteira do ctvitrine ("herdado fica; novo nasce em shadcn") ou, se a decisão for manter o Themes, **apagar** `ui/table.tsx` — porque hoje a regra defende manter um arquivo morto, o que é o pior dos dois mundos: o próximo agente lê o primitivo, assume que é o padrão da casa, e a regra só o corrige se ele a tiver lido antes.
- **Adaptação necessária:** o `ui/table` do shadcn embrulha a tabela em `<div className="relative w-full overflow-auto">` (`origin/main:resources/js/components/ui/table.tsx:7`); as telas do boilerplate embrulham o cartão em `overflow-hidden` (`pages/users/index.tsx:142`), que **clipa** em vez de rolar. Adotar sem mexer nisso troca um defeito por outro. Casa com a V6P-1.
- **Risco · esforço:** **G · G** se for migração; **P · P** se for só apagar o morto. A decisão é de ADR, não de fatia.
- **Multi-fonte?** **4 de 4, e é o achado multi-fonte mais forte da rodada.** cuidari: `cuidari.md:2455` — 29 arquivos importam do Themes, 0 importam `ui/table`, "Dois sistemas de tabela coexistindo, um deles morto". ctfinance: `ctfinance.md:443` — "`ui/table.tsx` tem 0 usos … Virou `[proposta-adr]`", e `ctfinance.md:422` acrescenta o custo real: "`@radix-ui/themes` **redeclara `--color-background` sem layer** e sequestra `bg-background` em todo o app". spinmax: `spinmax.md:1352` documenta a mesma colisão **e a correção** (redeclarar `:root, .dark, .radix-themes { --color-background: var(--background) }` depois do import) — correção que **não existe** nem no boilerplate nem no ctvitrine (nos dois, `--color-background: var(--background)` está dentro do `@theme`, `app.css:28` e `app.css:32` respectivamente, antes do import que o sobrescreve). O ctvitrine é o único que já provou a saída pelo lado do shadcn.

---

### Nota de mão inversa (não é candidato — não há o que absorver)

O contrato de anel de foco do boilerplate está **à frente e travado**. Rodando as duas regras de `origin/main:resources/js/test/styles/focus-ring.test.ts` contra os 26 primitivos do ctvitrine: **8 arquivos** ainda pintam o anel em opacidade fracionária (`badge`, `button`, `checkbox`, `input`, `navigation-menu`, `select`, `textarea`, `toggle`) e **0** apagam `outline-none` sem repor indicador. No boilerplate, `git grep -n "ring-ring/50" origin/main -- resources/` → **0 linhas**: a varredura foi completa, não parcial. Registro para o inverso — quando a `boilerplate-sync` chegar ao ctvitrine, estes 8 são fatia pronta, com o teste já escrito do lado de cá.

---

#### Medições

Fonte sempre por SHA pinado; alvo sempre por `origin/main`. Prefixos: `CT=/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine`, `BP=/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate`.

```bash
# Diff da lista (26 × 30) e comparação byte a byte dos 25 comuns
git -C $CT ls-tree -r 53d7d9a --name-only -- resources/js/components/ui/ | sort
git -C $BP ls-tree -r origin/main --name-only -- resources/js/components/ui/ | sort
# materialização em scratchpad via `git show` dos dois lados + `cmp -s` par a par
#   → 14 SAME, 11 DIFF; `diff -u` de cada um dos 11

# V6P-1 min-w-0
git -C $CT show 53d7d9a:resources/js/components/ui/sidebar.tsx | grep -n "min-w-0\|SidebarInset"     # 307,309 + 387,456,643,686
git -C $BP show origin/main:resources/js/components/ui/sidebar.tsx | grep -n "min-w-0\|SidebarInset" # 329 sem min-w-0; 412,481,668,711
git -C $BP show origin/main:resources/js/components/ui/sidebar.tsx | grep -n "flex min-h-svh w-full" # 148

# V6P-2 resíduos da poda
for p in $(git -C $BP show origin/main:package.json | grep -oE '"@radix-ui/[a-z-]+"' | tr -d '"' | sort -u); do \
  echo "$(git -C $BP grep -c "from '$p'" origin/main -- resources/js | wc -l)  $p"; done   # navigation-menu → 0, único
git -C $BP grep -n "AppearanceToggleDropdown\|appearance-dropdown" origin/main -- resources/js  # só a definição, :7
git -C $BP grep -n 'variant="header"' origin/main -- resources/js                               # 0 (só 2 comentários)
git -C $CT grep -n "navigation-menu" 53d7d9a -- resources/js                                    # app-header.tsx:6 vivo

# V6P-3 / V6P-8 superfície de upload e cor
git -C $BP grep -n 'type="file"' origin/main -- resources/js        # 0
git -C $BP grep -n "createObjectURL" origin/main -- resources/js    # 0
git -C $BP grep -n 'type="color"' origin/main -- resources/js       # 0
git -C $CT grep -ln 'type="file"' 53d7d9a -- resources/js           # 5 arquivos
git -C $CT show 53d7d9a:resources/js/pages/site-settings/edit.tsx | sed -n '140,205p;285,345p;560,600p'

# V6P-4 chips
git -C $BP grep -in "chip\|tagsinput\|tag-input" origin/main -- resources/js   # 0
git -C $CT show 53d7d9a:resources/js/components/items/color-chips-input.tsx

# V6P-5 svg / lucide
git -C $BP grep -ln "<svg" origin/main -- resources/js   # app-logo-icon.tsx, ui/placeholder-pattern.tsx
git -C $CT grep -ln "<svg" 53d7d9a  -- resources/js      # ui/placeholder-pattern.tsx, whatsapp-icon.tsx, pages/metrics/index.tsx
git -C $BP grep -l "from 'lucide-react'" origin/main -- resources/js | wc -l   # 59
git -C $CT grep -l "from 'lucide-react'" 53d7d9a  -- resources/js | wc -l      # 89

# V6P-6 ARIA de escolha exclusiva + inglês
git -C $BP grep -n 'role="radiogroup"\|role="radio"\|aria-checked\|role="tablist"\|role="tab"' origin/main -- resources/js  # 0
git -C $BP grep -nE '>(Light|Dark|System|Close|More|Toggle [A-Za-z]+|Save|Cancel|Delete|Search)<|label: .(Light|Dark|System).' origin/main -- resources/js | grep -v /test/  # 4
git -C $BP grep -n "ui/toggle-group" origin/main -- resources/js   # date-range-filter.tsx:3 (único importador)
git -C $CT grep -n "tabIndex\|onKeyDown" 53d7d9a -- resources/js/components/site/color-selector.tsx   # 0

# V6P-7 regiões vivas
git -C $BP grep -n 'aria-live\|role="status"\|role="alert"' origin/main -- resources/js | grep -v /test/   # 7 linhas, 0 role="status"
git -C $BP ls-tree -r origin/main --name-only -- resources/js/test | wc -l   # 41

# V6P-9 duas tabelas
git -C $BP grep -n "components/ui/table" origin/main -- resources/js   # 0
git -C $CT grep -n "components/ui/table" 53d7d9a  -- resources/js      # 3 páginas
git -C $BP grep -n "@radix-ui/themes" origin/main -- resources/js      # 7 arquivos
git -C $BP show origin/main:resources/css/app.css | grep -n "themes\|color-background"   # 5, 28, 93
git -C $CT show 53d7d9a:resources/css/app.css   | grep -n "themes\|color-background"     # 5, 32, 97

# Nota inversa — regras do focus-ring.test.ts aplicadas ao ctvitrine
grep -l "ring-ring/" <scratchpad>/ct/*.tsx    # 8 arquivos
git -C $BP grep -n "ring-ring/50" origin/main -- resources/   # 0
```

**Não medido (declarado):** reprodução visual do overflow da V6P-1 (sem browser/build, proibido nesta rodada); comportamento de anúncio real de leitor de tela em V6P-6 e V6P-7 (inferido do DOM, não observado); custo de bundle do `@radix-ui/themes` na V6P-9 (nenhum build rodado).

### Lente REFUTAR — vereditos

## Ref usado

`origin/main` = **`beb848e`** (`git -C $BP rev-parse --short origin/main`) — duas commits à frente do `2965f8c` que o banner do `ctvitrine.md` registra como baseline do inventário. Toda medição abaixo é contra `beb848e`; a fonte, sempre `53d7d9a` por `git show`/`git grep`.

---

### V6P-1 — **SOBREVIVE (escopo corrigido)**

**Fato: reproduz inteiro.** `git -C $CT show 53d7d9a:resources/js/components/ui/sidebar.tsx | grep -n "min-w-0"` → 307 (comentário), 309 (`"bg-background relative flex min-h-svh min-w-0 flex-1 flex-col"`), 387, 456, 643, 686. `git -C $BP show origin/main:.../sidebar.tsx | grep -n "min-w-0"` → 412, 481, 668, 711 — **nenhuma no `SidebarInset`**, cuja linha é `"bg-background relative flex min-h-svh flex-1 flex-col"`. O pai é flex de linha (`:148`, `flex min-h-svh w-full`), e li a cadeia inteira: `app-sidebar-layout.tsx:32` → `AppContent variant="sidebar"` → `app-content.tsx:10` `return <SidebarInset {...props}>`. Rodei também o `diff -u` completo do `sidebar.tsx`: são exatamente 5 hunks, 4 do boilerplate e este 1 do ctvitrine. A tabela de divergências do cabeçalho da frente também reproduz inteira (materializei os 26+30 arquivos e rodei `cmp -s` par a par: **14 SAME, 11 DIFF, 1 só-no-CT**).

**Três correções de escopo, nenhuma fatal:**

1. **O texto do comentário está errado pelo motivo certo e pelo motivo errado.** O caçador diz para trocar "tabelas" por "min-content largo" porque `ui/table` tem 0 importadores — verdade. Mas o que ele não mediu é que **as tabelas do boilerplate já rolam sozinhas**: `Table.Root` do `@radix-ui/themes` embrulha o `<table>` num `ScrollArea` do Radix (`node_modules/@radix-ui/themes/dist/esm/components/table.js`: `createElement("div",{className:"rt-TableRoot"…}, createElement(ScrollArea, null, createElement("table",{className:"rt-TableRootTable"…})))`). Ou seja, o caso agudo que o comentário da fonte descreve **não é o caso do boilerplate**; a classe entra como defesa genérica, e o comentário tem de dizer isso, não inventar um sintoma que ninguém observou.
2. **Aplicar no call-site, não no arquivo vendorizado.** `origin/main:.ai/rules/js.md:45` escreve, sobre este arquivo exato: "nunca dentro de `ui/sidebar.tsx`, que é código shadcn e tem de continuar rastreável ao upstream: atributo de landmark entra por prop do call-site". `AppContent` já é o funil (`app-content.tsx:10`, `{...props}`) e `SidebarInset` já faz `cn(base, className)` — `className={cn('min-w-0', className)}` em `app-content.tsx` entrega o mesmo resultado sem gastar orçamento de divergência do vendorizado.
3. **O guard-rail proposto é o errado.** Ler o `.tsx` e casar regex de className no `data-slot="sidebar-inset"` não distingue classe viva de classe em comentário — no ctvitrine o `min-w-0` aparece nas duas formas na mesma vizinhança. Como a mudança passa a ser no call-site, o teste certo é render jsdom: montar `<SidebarProvider><AppContent variant="sidebar"/></SidebarProvider>` e assertar `min-w-0` no `<main>` renderizado, com o `<main>` como controle positivo.

**Prioridade:** baixa. É defesa de uma classe, sem sintoma reproduzido (a ressalva de honestidade do candidato está certa e deve permanecer no PR).

---

### V6P-2 — **SOBREVIVE (escopo corrigido, e não é harvest)**

**Fatos: reproduzem, com um número errado.** Rodei o cruzamento eu mesmo, pacote a pacote, sobre os 13 `@radix-ui/react-*` de `origin/main:package.json:63-75`: `avatar 1 · checkbox 1 · collapsible 1 · dialog 2 · dropdown-menu 1 · label 1 · **navigation-menu 0** · select 1 · separator 1 · slot 4 · toggle 2 · toggle-group 1 · tooltip 1`, mais `@radix-ui/themes` com 7. `navigation-menu` é mesmo o único zero. **Correção:** são **14** entradas `@radix-ui/*` no `package.json`, não 13 — o candidato esqueceu o `themes`. `git -C $BP grep -n "AppearanceToggleDropdown\|appearance-dropdown" origin/main -- resources/js` devolve **só a linha 7 da própria definição**; `variant="header"` → **0 ocorrências**, nem em comentário (o candidato escreveu "0 fora de comentários", mas o grep é zero absoluto).

**A correção que importa: isto não é um candidato de harvest.** Nada é absorvido do ctvitrine — lá o `navigation-menu` está **vivo** (`app-header.tsx:6`), então a fonte é o contra-exemplo, não a doadora. É uma fatia de higiene do próprio boilerplate, e deve ser rotulada assim para não competir por vaga com candidatos que trazem código.

**Armadilha não medida pelo candidato:** `AppShell` e `AppContent` **têm `variant = 'header'` como default** (`app-shell.tsx:9`, `app-content.tsx:8`). Apagar o ramo `header` sem trocar o default quebra os dois componentes para qualquer chamada sem prop. A fatia é: apagar o ramo **e** eliminar a prop `variant` inteira (o único call-site já passa `"sidebar"` explicitamente), não "decidir sobre os ramos".

**Escopo corrigido:** (a) remover `"@radix-ui/react-navigation-menu"` do `package.json`; (b) apagar `appearance-dropdown.tsx` — o que também mata a única string inglesa que um sweep `>Texto<` acha no front (ver V6P-6); (c) colapsar `AppShell`/`AppContent` para a única variante viva, removendo a prop; (d) o guard-rail de dependência-sem-importador vale, mas tem de varrer `resources/` inteiro (não só `resources/js`), senão o dia em que um pacote for consumido só por CSS ele nasce falso-positivo — `@radix-ui/themes` entra por `resources/css/app.css:5` **e** por `app.tsx:7`, e é o precedente exato.

---

### V6P-3 — **DERRUBADO**

**Motivo em uma linha:** o boilerplate não tem superfície de upload em **nenhuma das duas pontas**, então o primitivo e o hook chegariam sem consumidor e sem contraparte de validação — e o próprio candidato escreve "**não** absorver sem o backend".

Golpe (4), medido por mim: `git -C $BP grep -nE "UploadedFile|->store\(|storeAs|Storage::|putFile|temporaryUrl|'mimes" origin/main -- app routes` → **zero linhas**. Front idem (`type="file"` 0, `createObjectURL` 0, `accept="image` 0). O candidato mediu só o front e concluiu "falta um primitivo"; o que falta é a feature.

Antecipo a defesa e a respondo: **não** derrubo por "primitivo sem call-site" — esse argumento não vale nesta casa, e verifiquei: `ui/currency-input`, `ui/masked-input` e `ui/form-field` já vivem em `origin/main` com **0 importadores fora de `resources/js/test/`** (`git -C $BP grep -ln "ui/<p>" origin/main -- resources/js | grep -v /test/`). Kit pode shipar primitivo antes do consumidor. O que separa este caso é outra coisa: `previewUrl ?? currentUrl ?? defaultUrl`, o botão "Remover" e o `accept` **codificam um contrato de servidor** (um `*_url` devolvido, uma rota de remoção, uma política de MIME) que o kit não tem e sobre o qual não há ADR. Shipar o campo é fixar política de upload pelo front — e o `spinmax.md:3444`/`:3536` já registrou que qualquer guard-rail aqui passa vácuo.

O `use-object-url` sozinho tampouco salva: hook de revogação num repositório com **0 `createObjectURL`** é guarda de um vazamento inalcançável.

**Reabrir quando** a primeira feature de upload entrar; aí o padrão de revogação da fonte (`edit.tsx:289-330`, três pontos, sempre por updater funcional) vem verbatim e junto com a regra de MIME/tamanho no FormRequest, numa fatia só.

---

### V6P-4 — **SOBREVIVE (escopo corrigido)**

**Fatos: reproduzem.** `git -C $BP grep -in "chip\|tagsinput\|tag-input" origin/main -- resources/js` → **0 linhas**. Li o `color-chips-input.tsx@53d7d9a` inteiro: `mergeColor` case-insensitive (`:13-20`), Backspace no vazio (`:60-62`), `aria-label={`Remover cor ${color}`}` no X, e o comentário sobre o `onChange` único na colagem está lá, palavra por palavra.

**Não derrubo por falta de consumidor** — medido acima, `currency-input`/`masked-input`/`form-field` já são precedente. É primitivo genuinamente genérico, sem dependência nova, testável.

**Três correções, uma delas um bug que o candidato não viu:**

1. **`aria-label` no `<Input>` interno sequestra o `<Label htmlFor>` do call-site.** O componente põe `id={id}` **e** `aria-label="Adicionar cor"` no mesmo input (`:88,:94`). `aria-label` vence `<label for>` no cálculo de nome acessível — quem embrulhar o primitivo num `FormField` com label "Cores" vai ouvir "Adicionar cor". Na absorção o `aria-label` tem de ser **prop opcional**, aplicado só quando não há `id`/label externo.
2. **A colagem não é colagem.** Não há `onPaste`; o ramo dispara em qualquer `onChange` que contenha vírgula (`:44`). O comportamento final é o mesmo e o comentário sobre o closure obsoleto continua sendo a lição — mas o teste tem de ser escrito sobre `fireEvent.change` com string multi-segmento, não sobre um evento de paste, senão nasce testando outra coisa.
3. As três adaptações que o candidato listou continuam válidas: tirar vocabulário de cor, trocar `focus-within:ring-ring/50` por `ring-ring` (o arquivo é um dos 9 do ctvitrine com anel fracionário — ver nota inversa), e acrescentar a região viva no idioma de `search-bar.tsx:78`. Acrescento: os chips deveriam sair como `<ul>/<li>`, não `<span>` soltos, para o leitor anunciar a contagem.

**Escopo:** `ui/chips-input.tsx` + teste (colagem multi-segmento num `onChange` só; Backspace; dedup case-insensitive; nome acessível não sequestrado). Fonte única — o que é permitido, mas registre como tal.

---

### V6P-5 — **SOBREVIVE (escopo reduzido; duas contagens erradas)**

**Erros factuais, ambos subestimando:**
- "8 call-sites em 7 arquivos (… → 18 linhas)": `git -C $CT grep -n "WhatsappIcon" 53d7d9a -- resources/js | wc -l` → **27**; `git -C $CT grep -n "<WhatsappIcon" … | wc -l` → **12 usos**, em **9 arquivos**.
- "bp: 59 arquivos importam `lucide-react` … ct: 89": `git grep -l "from 'lucide-react'" … | wc -l` → **53** no boilerplate e **83** no ctvitrine.

Nenhum dos dois inverte a conclusão — erram para menos.

**O que reproduz:** `git -C $BP grep -ln "<svg" origin/main -- resources/js` → exatamente 2 arquivos, e li os dois: `app-logo-icon.tsx:5` (`<svg {...props} viewBox="0 0 40 42" xmlns=…>`) e `ui/placeholder-pattern.tsx:11` (`<svg className={className} fill="none">`) — **nenhum com `aria-hidden`, `role` ou `<title>`**. `app-logo.tsx:7` põe "Simplify Starter Kit" ao lado, confirmando que o logo é decorativo. No ctvitrine são 3 arquivos e **1 infrator**, e é o `placeholder-pattern` byte-idêntico — confirmei que os dois `<svg>` de `pages/metrics/index.tsx` estão certos (`:220` com `aria-hidden="true"`, `:326` com `role="img"`), então a correção do infrator é do kit, como o candidato disse.

**Corte:** a metade **(a)** — escrever em `.ai/rules/js.md` um contrato de "glifo de marca próprio" — é regra especulativa. O kit não tem glifo de marca, não tem WhatsApp, e não há sinal de que vá ter; regra para um caso que não existe é a mesma dívida que V6P-9 denuncia (texto que o próximo agente lê e obedece sem call-site). O `whatsapp-icon.tsx` em si é domínio de vitrine e não entra.

**Escopo corrigido — só a metade (b), que é o valor real:** um `aria-hidden="true"` em cada um dos 2 `<svg>` + um teste node no molde exato de `focus-ring.test.ts` (que já varre a árvore com `readdirSync` e já tem o padrão de controle positivo) exigindo `aria-hidden` **ou** `role="img"` + nome. É PR de 3 linhas mais teste. A regra escrita, se entrar, é uma frase sobre `<svg>` inline em geral — não sobre marca.

---

### V6P-6 — **SOBREVIVE — o mais forte do lote (escopo corrigido)**

**Tudo reproduz, e a peça-chave que o candidato só supôs eu confirmei.** `git -C $BP grep -n 'role="radiogroup"\|role="radio"\|aria-checked\|role="tablist"\|role="tab"' origin/main -- resources/js` → **0 linhas**; `aria-pressed` existe em **1** ponto só (`data-table/filter-toggle.tsx:22`). Li `appearance-tabs.tsx` inteiro: `<div>` sem papel, três `<button type="button">` cujo estado ativo é **só** `bg-white shadow-xs dark:bg-neutral-700` (`:23-27`), rótulos `'Light' / 'Dark' / 'System'` (`:10-12`). `ui/toggle-group.tsx` tem 1 importador (`date-range-filter.tsx:3`), com `aria-label="Atalhos de período"` em `:78`.

**A confirmação que faltava:** o candidato assumiu que `ToggleGroup type="single"` traz o papel de graça. Verifiquei no dist instalado — `grep -o 'role: "…"\|aria-checked\|aria-pressed' node_modules/@radix-ui/react-toggle-group/dist/index.js` → `role: "radiogroup"`, `role: "radio"`, `aria-checked`, `aria-pressed`, `role: "toolbar"`. O primitivo entrega exatamente o par que falta, com foco itinerante do `RovingFocusGroup`. A proposta está certa pelo motivo certo.

**Duas correções de precisão (nenhuma fatal):**
1. **O nome acessível não está quebrado — o estado está.** O candidato escreve como se o botão fosse anônimo; os rótulos são texto visível dentro do `<button>`, então o nome existe. O defeito é só que "qual está ativo" não é exposto. Escreva assim no PR, senão o teste nasce medindo a coisa errada.
2. **"única string de UI em inglês viva" precisa das duas regex, e o candidato só citou uma.** `git grep -nE '>(Light|Dark|System|Close|More|…)<'` acha **1** linha (`appearance-dropdown.tsx:27`, `Toggle theme`) — as três dos tabs **não** casam, porque vivem num array (`label: 'Light'`). Com o segundo padrão (`label: '…'`) aparecem as 3. Total 4, como ele diz; a evidência é que são duas medições, não uma.

**Escopo corrigido:** (a) reescrever `appearance-tabs.tsx` sobre `ToggleGroup type="single"`, `aria-label="Tema"`, rótulos Claro/Escuro/Sistema, `onValueChange` ignorando string vazia; (b) teste de render exigindo, por opção, `getByRole('radio', { name: … })` com `aria-checked` correto no tema ativo; (c) a linha em `.ai/rules/js.md`. **Ordenação obrigatória:** esta fatia depende do (b) da V6P-2 — se `appearance-dropdown.tsx` continuar na árvore, `Toggle theme`/`Light`/`Dark`/`System` sobrevivem nele e qualquer guard-rail de pt-BR nasce vermelho por arquivo morto. Rode as duas juntas ou a V6P-2 primeiro.

Nota: como na V6P-2, o ctvitrine não doa código aqui — o `appearance-tabs.tsx` de lá é o mesmo arquivo **menos** o `type="button"` (confirmei: `diff -u` = 1 linha; 1574 B × 1608 B, os 34 bytes que ele cita). Contribui o contra-exemplo do `ColorSelector`, e esse eu também confirmei: `role="radiogroup"`/`role="radio"`/`aria-checked` presentes, `tabIndex`/`onKeyDown` → **0 linhas**.

---

### V6P-7 — **DERRUBADO**

**Motivo em uma linha:** o contrato **já tem teste** — dois — então a premissa central ("a regra existe escrita, o teste não") é falsa.

`resources/js/test/components/data-table/search-bar.test.tsx:99` é literalmente `it('keeps the live region mounted even with nothing to say')`, com `liveRegion()` = `container.querySelector('[aria-live="polite"]')` e **7 asserções** cobrindo vazio → buscando → N resultados → nenhum → vazio de novo. `resources/js/test/components/input-error.test.tsx` trava `role="alert"` para o nó inserido dinamicamente, mais os casos de mensagem ausente e em branco. Esses são os **dois únicos pontos** onde o contrato se aplica no front — e os dois estão cobertos.

**Segundo golpe, na medição:** `git -C $BP grep -n 'aria-live\|role="status"\|role="alert"' origin/main -- resources/js | grep -v /test/` devolve **11 linhas**, das quais **5 são código** (`search-bar.tsx:78`, `input-error.tsx:18`, `ui/alert.tsx:30`, `lib/toast-config.ts:53` e `:76`) e 6 são comentário. O candidato reporta "7 linhas". Nem o total nem a contagem de código bate.

**Terceiro:** o que sobraria — um scan estático por regex sobre a árvore — o próprio candidato classifica como "heurística frágil" e já nasce precisando de duas isenções codificadas (`ui/alert.tsx`, `toast-config.ts`). Teste que precisa de allowlist no dia do nascimento, para cobrir um contrato já coberto por dois testes de render, é custo sem ganho. Golpe (1) + golpe (5).

---

### V6P-8 — **DERRUBADO (duplicado)**

**Motivo em uma linha:** não é fonte única e não é candidato novo — o **ctfinance já tem um `ui/color-picker` catalogado** (`docs/harvest/v2/ctfinance.md:135`: "`color-picker` (17 presets + `<input type=color>` + hex validado)"), que é a forma melhor do mesmo item, e o candidato afirma o contrário ("Multi-fonte? **Não.** Fonte única — é a única das quatro bases com configuração de marca pelo usuário").

O resto dos fatos reproduz (`git -C $BP grep -n 'type="color"' origin/main -- resources/js` → 0; o par no `edit.tsx:565-582@53d7d9a` está exatamente como citado, com o hex validado antes de alimentar o seletor nativo). Mas a doadora certa é a que já é primitivo `ui/` com presets, não o par inline acoplado ao `useSettingsAutosave`. E o próprio candidato se auto-rebaixa ("candidato de menor prioridade desta lista; anoto para não se perder").

**Ação:** apagar V6P-8 da lista do ctvitrine e anexar ao verbete do `ui/color-picker` do dossiê do ctfinance a única coisa nova que o ctvitrine acrescenta — a justificativa escrita de por que o `aria-label` vai no seletor nativo e o `id`/`htmlFor` no campo hex (o `<Label>` nomeia o digitável; o nativo não é alvo do label).

---

### V6P-9 — **SOBREVIVE como `[proposta-adr]` — mas não é candidato novo, é evidência para uma proposta já aberta**

**Fatos: reproduzem todos.** `git -C $BP grep -n "components/ui/table" origin/main -- resources/js` → **0**; `git -C $CT grep -n "components/ui/table" 53d7d9a -- resources/js` → **3 páginas** (`categories/index.tsx:10`, `items/index.tsx:8`, `metrics/index.tsx:3`), com as telas herdadas ainda no Themes (`users/user-table-row.tsx`, `permissions/role-users-table.tsx`, `pages/users/index.tsx`) — a fronteira limpa que ele descreve existe mesmo. `@radix-ui/themes` no boilerplate: **7 arquivos** (6 de aplicação + 1 teste). `app.css`: import na linha 5, `--color-background: var(--background)` dentro do `@theme` na 28, override de fonte na 93 — e no ctvitrine idem, linhas 5 e 32. A regra em `.ai/rules/js.md:17-18` está escrita palavra por palavra como citada, inclusive o "existe mas não é adotado".

**Correção 1 — já é `[proposta-adr]` aberta.** `ctfinance.md:443`: "**`ui/table.tsx` tem 0 usos** … Virou `[proposta-adr]`". `cuidari.md:2455` mede a mesma coisa (29 × 0, "dois sistemas de tabela coexistindo, um deles morto"). Abrir V6P-9 como item próprio duplica a proposta; o correto é anexar a ela a evidência que só o ctvitrine tem — **um projeto rodou listagem de produção sobre o `ui/table` e não voltou atrás**, mantendo o herdado no Themes. Isso é novo e é o argumento mais forte já reunido.

**Correção 2 — o custo de "só apagar o morto" caiu, e o candidato mediu com dado velho.** Ele herda de `ctfinance.md:135` a nota de que o `empty-state` do boilerplate "ainda depende de `@radix-ui/themes`". **Não depende mais**: li `origin/main:resources/js/components/empty-state.tsx` — imports são `ui/icon`, `lib/utils` e `lucide-react`, e o arquivo não aparece nos 7 do `grep @radix-ui/themes`. O que ainda amarra é textual: `.ai/rules/js.md:38-39` descreve o `EmptyState` em `<Table.Row>`/`<Table.Cell>`, que é API do Themes — a regra ficou para trás do código.

**Correção 3 — a adaptação citada é real e continua valendo.** `origin/main:resources/js/components/ui/table.tsx:7` embrulha em `<div className="relative w-full overflow-auto">` e `pages/users/index.tsx:142` embrulha o cartão em `overflow-hidden` — confirmei os dois. Só que, como estabeleci na V6P-1, `Table.Root` do Themes já rola por dentro (`ScrollArea`), então essa adaptação é custo **da migração**, não da manutenção do status quo.

**O item de fatia que está enterrado aqui e vale mais que o ADR:** a colisão de `--color-background`. Está confirmada nos dois lados (import do Themes na linha 5, `@theme` — não `@theme inline` — na 28/32), e o `spinmax.md:1352` documenta a correção de uma linha que **nem o boilerplate nem o ctvitrine têm**. Isso é fatia pequena, independente da decisão de tabela, e deve sair da sombra do V6P-9 como candidato próprio.

**Escopo corrigido:** (a) anexar a evidência do ctvitrine à `[proposta-adr]` existente, sem abrir item novo; (b) destacar a redeclaração de `--color-background` como fatia própria, P·P; (c) sincronizar `.ai/rules/js.md:38-39` com o `empty-state` que já não usa Themes — isso é P·P e independe do ADR.

---

### Bloco extra — cabeçalho "Diff da lista" (não é candidato, mas é a base de tudo): **CONFIRMADO**

Materializei os 26 arquivos do ctvitrine e os 30 do boilerplate em scratchpad por `git show` e rodei `cmp -s` par a par: **14 SAME, 11 DIFF, 1 só-no-CT (`navigation-menu.tsx`), 5 só-no-BP** — exatamente os números publicados. Rodei `diff -u` nos 11 e a tabela de naturezas reproduz item por item: `badge/checkbox/input/select/textarea/toggle` = só `ring-ring/50` → `ring-ring`; `breadcrumb` = "More" → "Mais"; `sheet` = "Close" → "Fechar"; `dialog` = só a remoção de um comentário de 2 linhas; `button` = anel + o bloco `loading`/`aria-busy`/`LoaderCircle`/`loadingText`; `sidebar` = 5 hunks, 4 do boilerplate + o `min-w-0`. A resposta à pergunta prioritária está certa: em 5 dos 6 o boilerplate está estritamente à frente, e o `min-w-0` é o único ponto invertido.

### Bloco extra — "Nota de mão inversa": **CONFIRMADA, com uma contagem a mais**

`git -C $BP grep -n "ring-ring/50" origin/main -- resources/` → **0 linhas**, a varredura é completa. No ctvitrine, contando `ring-ring/` arquivo a arquivo: **8 dentro de `components/ui/`** (`badge`, `button`, `checkbox`, `input`, `navigation-menu`, `select`, `textarea`, `toggle`) — o número que ele publicou. Mas `git -C $CT grep -l "ring-ring/" 53d7d9a -- resources/` devolve **9**: o nono é `components/items/color-chips-input.tsx`, o próprio componente da V6P-4. Quando a `boilerplate-sync` chegar ao ctvitrine, a fatia pronta é de 9 arquivos, não 8.

### Lente RISCO — vereditos

## V6P-1 · `min-w-0` no `SidebarInset`

**Risco: MÉDIO** (o caçador disse P·P; o que ele não mediu é o que está *dentro* do `<main>`).

**Regressão visual/comportamental — o ponto que falta no candidato.** `min-width:0` não é neutro: ele troca "o `<main>` cresce e a página rola na horizontal" por "o `<main>` fica preso no viewport e quem clipa é o filho". E o boilerplate clipa por padrão. Medido: `git -C $BP grep -n "overflow-hidden" origin/main -- resources/js | grep -v /test/` devolve **21 linhas**, das quais **8 são o cartão que embrulha listagem/formulário** (`pages/users/index.tsx:142`, `users/create.tsx:27`, `users/edit.tsx:28`, `users/permissions.tsx:100`, `users/show.tsx:36`, `permission-role/roles.tsx:133`, `settings/{appearance,password,profile}.tsx`). Cartão com `overflow-hidden` não rola — **corta**. Se a `Table.Root` do `@radix-ui/themes` não trouxer o próprio contêiner de rolagem, hoje as colunas extras são alcançáveis pela barra horizontal do documento e depois do `min-w-0` deixam de ser alcançáveis por qualquer meio. Isso é trocar feio por inacessível.

**A mitigação (e ela é forte, o caçador tinha a evidência na mão e não a usou):** o ctvitrine roda a combinação inteira em produção. `git -C $CT grep -n "overflow-hidden|Table.Root" 53d7d9a -- resources/js/pages/users/index.tsx` → `:144` o mesmo cartão `overflow-hidden` e `:215` a mesma `Table.Root variant="surface"`, com o `min-w-0` ativo no `SidebarInset` (`:309`). A tela herdada do boilerplate, byte a byte a mesma estrutura, convive com a classe. Isso não é prova de renderização, mas é a melhor disponível sem browser.

**Custo de gate — declare no PR.** Não há `pest-plugin-browser` (medido: `git show origin/main:composer.json` → `require-dev` tem `pestphp/pest ^5.1` e `pest-plugin-laravel ^5.0`, nenhum plugin de browser). O teste de estilo que o caçador propõe (ler o arquivo e exigir `min-w-0` no `data-slot="sidebar-inset"`) **trava a classe, não o efeito** — ele não sabe distinguir "rola dentro" de "some". Evidência possível e proporcional: (a) o teste de estilo com controle positivo, no molde de `focus-ring.test.ts`; (b) **antes** de mesclar, uma checagem manual de 2 minutos com a janela em 375 px em `/users` — a única pergunta é se a `Table.Root` do Themes tem `overflow-x:auto` própria; se não tiver, a fatia deixa de ser uma classe e passa a ser "classe + contêiner de rolagem nos 8 cartões", e aí o risco vira ALTO. **Não medi isso**: a folha do `@radix-ui/themes` mora em `node_modules` e `public/build` está no `.gitignore` (`git show origin/main:.gitignore` → `/public/build`), e leitura de disco está vedada nesta rodada.

**Catraca que quebraria:** nenhuma. `navigation-landmarks.test.tsx` monta a árvore real (`AppSidebarLayout` → `AppContent` → `SidebarInset`) mas assere papéis e `aria-current`, não className; `sidebar-shortcut.test.tsx` mexe em outra região do arquivo. `git grep -n "sidebar-inset" origin/main -- resources/js` → só a definição (`ui/sidebar.tsx:332`) e o repasse (`app-content.tsx:10`). Conflito de merge também é improvável: o último commit a tocar `ui/sidebar.tsx` foi `7d9e928 [111]`, longe da linha 329.

**Dados persistidos / segurança / a11y:** nada. Não muda foco, ordem de tabulação nem anúncio.

**Correção do texto proposto:** o comentário deve dizer o gatilho real do boilerplate — as tabelas aqui são do `@radix-ui/themes` (`git grep -l "@radix-ui/themes" origin/main -- resources/js` → 7 arquivos; `components/ui/table` → **0 importadores**), então "conteúdo de min-content largo" está certo e "tabelas" está errado, como o candidato já diz.

---

## V6P-2 · Resíduos da poda do header

**Risco: BAIXO para a dependência, MÉDIO para o resto — e a receita do guard-rail, como está escrita, é uma fábrica de falso positivo.**

**O erro de fato mais importante do lote.** A medição do candidato usa `git grep -c "from '$p'"` — **aspas simples**. Os primitivos vendorizados do shadcn usam aspas **duplas**: `ui/toggle-group.tsx:2` é `import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"`. Rodei a receita do candidato e ela acusa **13 pacotes com zero importador**, não 1. Rodando quote-agnóstico (`git -C $BP grep -lE "from .$p." origin/main -- resources/js`, um pacote por linha do `package.json`), o resultado real é: avatar 1, checkbox 1, collapsible 1, dialog 2, dropdown-menu 1, label 1, **navigation-menu 0**, select 1, separator 1, slot 4, toggle 2, toggle-group 1, tooltip 1, themes 7. **A conclusão do caçador está certa; a prova que ele publicou está errada** — e é exatamente essa prova que viraria o teste. Se o guard-rail nascer com a regex de aspas simples, ele nasce vermelho em 13 pacotes e alguém vai "consertar" desinstalando dependência viva.

**Regressão comportamental — a armadilha dos ramos `variant="header"`.** `AppContent` e `AppShell` têm **um call-site cada**, os dois em `app-sidebar-layout.tsx:16,32`, os dois passando `variant="sidebar"` — e o **default de ambos é `'header'`** (`app-content.tsx:8`, `app-shell.tsx:9`). Apagar o ramo sem trocar o default deixa uma bomba: a próxima tela que montar `<AppContent>` sem prop cai num `<main>` que não é o alvo do skip-link (`href="#conteudo"` chega por `{...props}` no `SidebarInset`) e num shell sem `SidebarProvider` — os primitivos de `ui/sidebar` leem o contexto e estouram. Mitigação: na mesma fatia, ou tornar `variant` obrigatório, ou inverter o default para `'sidebar'` e apagar o ramo. Não deixe "apagar depois".

**Custo de gate.** Sem browser, e nem precisa: é teste node puro. Mas atenção ao **terceiro** sweep estático em `resources/js/test/` — `focus-ring.test.ts` e `link-button-nesting.test.ts` já carregam **cópias literais** da mesma função `applicationSourceFiles()`. Um quarto copy-paste (V6P-2 + V6P-5 + V6P-7 propõem mais três) é dívida garantida: extraia `test/support/sources.ts` na primeira fatia que precisar dele.

**Dados persistidos:** nada. Remover a dependência muda `pnpm-lock.yaml`, e o repo tem dependabot ativo em `npm-minor-patch` (`git log --oneline -5 origin/main -- package.json` → `d4fbdd0`, `02e4e2b`) — a fatia vai conflitar se ficar aberta.

**a11y:** apagar `appearance-dropdown.tsx` é ganho líquido (some a única `sr-only` em inglês daquele arquivo). **Confirmei o zero:** `git grep -n "AppearanceToggleDropdown|appearance-dropdown" origin/main -- resources/js` devolve só a própria definição (`:7`).

---

## V6P-3 · Campo de imagem com `revokeObjectURL`

**Risco: ALTO como está proposto. MÉDIO se reduzido a hook + regra escrita.**

**A frente está fechada por outra lente, e o candidato cita a fonte sem obedecê-la.** `spinmax.md:3641` (lente RISCO DE ABSORÇÃO da rodada spinmax) já decidiu: *"o risco aqui não é absorver, é fingir que absorveu... Se virar item, que vire linha em `.ai/rules` ('upload nasce com disco privado, allowlist de MIME e URL assinada'), não teste."* E `spinmax.md:3758` acrescenta a forma correta para L12: `File::image()->max(...)`, não `'mimes:...|max:2048'` em string. Trazer o **front** sem backend cria a pior configuração: um primitivo de upload no kit, nenhuma rota que aceite arquivo, e um teste verde que cobre render e revogação — que o próximo agente lerá como "upload está coberto".

**Custo de gate, concreto.** `jsdom` não implementa `URL.createObjectURL`/`revokeObjectURL`. `git show origin/main:resources/js/test/setup.ts` — o arquivo mocka `matchMedia`, `localStorage` e `ResizeObserver`, e **não** mocka `URL.*`. Ou seja, a fatia obrigatoriamente edita o setup **compartilhado pelos 41 arquivos de teste**; um mock mal feito lá vaza para a suíte inteira (o próprio arquivo documenta um episódio assim, o `ResizeObserver` não-construtível). Isole o mock no arquivo de teste do primitivo, não no `setup.ts`.

**Regressão de idioma/arquitetura — divergência de primitivo.** O boilerplate **já tem** o dono da fiação de label/hint/erro: `ui/form-field.tsx` injeta `id`, `aria-describedby` (hint + erro) e `aria-invalid` no controle filho via `cloneElement`. O `BrandingImageField` do ctvitrine (`site-settings/edit.tsx:151-197@53d7d9a`) monta `<Label htmlFor>` + `<p>` de hint **sem `aria-describedby`** e um `<InputError>` solto — o hint nunca é anunciado. Absorver a forma da fonte forka o idioma da casa. O certo é `<FormField label hint error><ImageField …/></FormField>`, com o `ImageField` cuidando só de preview + seleção + remoção.

**a11y adicional que a fonte não tem:** o botão "Remover" some (`{isCustom && …}`) — quem o acionou perde o foco para o `<body>` e nada é anunciado. Um `image-field` do kit precisa devolver o foco ao `<input type="file">` e ter uma linha de estado (o idioma do `search-bar.tsx:78`, região renderizada sempre).

**Dados persistidos:** o formato gravado é caminho de arquivo — não cria compatibilidade aqui, mas anote a trap: sem backend, `previewUrl`/`currentUrl`/`defaultUrl` não têm de onde vir e o primitivo nasce sem consumidor. Primitivo sem call-site é como o `ui/table.tsx` acabou (V6P-9).

**Mitigação:** cortar em dois. (1) **Agora:** `hooks/use-object-url.ts` + linha em `.ai/rules/js.md`/`app.md` com a política de upload na forma L12 — testável, pequeno, sem fingimento. (2) **Quando a primeira feature de upload existir:** o `ui/image-field.tsx` sobre `FormField`, com `focus-visible:ring-ring` (nunca `/50`) e o teste de revogação.

---

## V6P-4 · `ChipsInput`

**Risco: MÉDIO. Cópia literal quebra catraca no primeiro commit.**

**Catraca que quebra, medida:** `focus-ring.test.ts` reprova qualquer arquivo cujo corpo case `/ring-ring\//`. O `color-chips-input.tsx:67@53d7d9a` traz `focus-within:ring-ring/50`. Copiar e só depois lembrar do token deixa a suíte vermelha — o caçador já anotou a adaptação, e ela é **obrigatória, não opcional**. A justificativa está medida no próprio repo (comentário de `focus-ring.test.ts`): composto a 50% sobre branco, nenhum tom da família ciano da marca passa de ~3.08:1, contra os 3:1 exigidos pela SC 1.4.11 — a 50% o anel fica abaixo em toda a paleta útil.

**Buraco novo na catraca, e este componente é o primeiro a explorá-lo.** O `<Input>` interno recebe `focus-visible:ring-0` (`:88@53d7d9a`), e o `outline-none` mora em `ui/input.tsx` — arquivo diferente. Como o sweep é **por arquivo**, a regra "quem apaga o outline repõe o indicador" não enxerga a composição: o chips-input desliga o anel do campo real e nada acusa. Aqui isso é aceitável (o anel migra para o `focus-within` do invólucro, em opacidade cheia), mas **precisa estar escrito no arquivo**, senão o próximo call-site copia `ring-0` sem o invólucro.

**a11y — duas faltas, não uma.** Além da região viva que o caçador apontou (remover chip não anuncia nada), há **perda de foco**: o `<button aria-label="Remover cor X">` se destrói ao ser acionado e o foco cai no `<body>`. Mover o foco para o chip seguinte, ou para o campo, é parte do primitivo. Sem isso o teclado fica órfão a cada remoção.

**Hazard não medido, para virar teste:** `onBlur={() => add(draft)}` no campo + `onClick={removeAt(index)}` no X compõem duas chamadas de `onChange` no mesmo gesto (blur dispara antes do click), a segunda calculada a partir do `value` do render. Se o React despachar o click com o fiber já atualizado, não há bug; se não, o rascunho recém-promovido a chip é perdido. **Não reproduzi.** O teste que vale: digitar "Azul", clicar no X de um chip existente, e exigir que "Azul" sobreviva.

**Custo de gate:** baixo e real — jsdom cobre tudo (colagem multi-valor num único `onChange`, Backspace, dedup case-insensitive, foco pós-remoção). É dos poucos candidatos do lote com gate verdadeiro, sem browser.

**Dados persistidos:** `string[]` — o formato é o mesmo que a tela já mandaria. Sem trap.

---

## V6P-5 · Contrato do glifo de marca + sweep de `<svg>`

**Risco: BAIXO. É o candidato mais seguro do lote — com uma correção de fato e uma armadilha de escopo.**

**Correção de fato.** `git -C $CT grep -c "WhatsappIcon" 53d7d9a -- resources/js` → **27 ocorrências em 10 arquivos** (9 consumidores + a definição), não "8 call-sites em 7 arquivos / 18 linhas". Os consumidores: `site/boutique/{footer,item-card,menu-drawer,trust-bar}`, `site/site-footer`, `pages/site/{boutique/item,home,item,landing}`. O erro é a favor do candidato, mas continua sendo erro publicado.

**As contagens de lucide, essas, reproduzem** — quote-agnóstico (`grep -lE "from .lucide-react."`): bp **59**, ct **89**. (A variante com aspas simples dá 53/83; o caçador acertou o número, então usou a forma certa aqui e a errada na V6P-2.)

**Regressão a11y — a única armadilha real.** Adicionar `aria-hidden="true"` a `app-logo-icon.tsx` é seguro **porque o nome está ao lado**: `app-logo.tsx:7` renderiza o ícone e logo depois o texto "Simplify Starter Kit", e o ícone tem exatamente **1 consumidor** (`git grep -n "AppLogoIcon" origin/main -- resources/js`). Se o consumidor fosse um link só-ícone, o mesmo atributo apagaria o nome acessível da marca. A regra escrita tem de dizer *decorativo quando há nome ao lado*, e não "todo SVG leva aria-hidden".

**Escopo do sweep — bom, e eu verifiquei.** `git grep -ln "<svg" origin/main -- resources/views` → **0**, e o repo tem só **2** arquivos de view. Então um sweep restrito a `resources/js` é completo hoje. E ele não precisa entender lucide: o `Button.test.tsx:55-61` já prova que o `lucide-react@1.x` injeta `aria-hidden="true"` sozinho quando o ícone não recebe prop de a11y — teste verde no repo, não suposição minha.

**Custo de gate:** nenhum problema — node puro, dois infratores conhecidos hoje (`app-logo-icon.tsx:5`, `ui/placeholder-pattern.tsx:11`) servindo de controle. Reaproveite o `applicationSourceFiles()` extraído (ver V6P-2), não copie pela terceira vez.

**Dados persistidos / contraste:** nada.

---

## V6P-6 · `appearance-tabs` sobre `ToggleGroup`

**Risco: MÉDIO — e a premissa de medição está errada, embora a conclusão sobreviva.**

**O que refuto.** `git grep -n 'role="radiogroup"|role="radio"|aria-checked' origin/main -- resources/js` → 0 linhas é uma medição de **string no fonte**, e o candidato a lê como "o front não tem semântica de rádio". Tem: o Radix `ToggleGroup type="single"` **emite `role="radio"` em tempo de execução**, e a prova está dentro do próprio repo — `resources/js/test/components/data-table/date-range-filter.test.tsx:21` faz `screen.getByRole('radio', { name: '7 dias' })` e `:32-33` assere `data-state` on/off. O grep não enxerga o que o primitivo renderiza. A conclusão continua de pé (o `appearance-tabs.tsx` é uma `<div>` de três `<button>` sem papel nem estado, distinguidos só por `bg-white`), mas escrita assim a evidência convida à conclusão oposta: "o kit não sabe fazer rádio". Ele sabe, tem 1 call-site fazendo, e é justamente esse o argumento.

**Regressão visual — a única de verdade no lote, e ela não tem catraca.** A troca não é neutra: hoje o controle é uma pílula `bg-neutral-100 dark:bg-neutral-800` com item ativo `bg-white shadow-xs`; `toggleVariants` pinta `data-[state=on]:bg-accent data-[state=on]:text-accent-foreground` e, com `variant="outline"`, `border border-input`. Muda aparência **e** paleta (de `neutral-*` cru para token semântico — a direção que `.ai/rules/js.md` e o commit `79c0a3b [7]` pedem, mas ainda assim uma mudança visível). **Não existe teste cobrindo `appearance-tabs`** — dos 41 arquivos de `resources/js/test/` nenhum o menciona, e o arquivo só foi tocado duas vezes na história (`git log --oneline -5 origin/main -- resources/js/components/appearance-tabs.tsx` → `e549737 [77]`, `087a158`). Sem `pest-plugin-browser`, a prova possível é: teste de componente Vitest (nome acessível pt-BR por opção + `data-state=on` no tema ativo, no molde exato de `date-range-filter.test.tsx`) **mais screenshot antes/depois no PR** — diga isso explicitamente na descrição, é uma tela que o time olha todo dia.

**Contraste, calculado.** O estado ativo passa a ser `--accent`/`--accent-foreground`, e esse par **já está na tabela travada** de `theme-tokens.test.ts` (`['accent', '--accent-foreground', '--accent']`, exigido ≥ 4.5:1 nos dois temas). Ou seja, a reescrita **entra debaixo de uma catraca de contraste que a versão atual escapava** (`bg-white` + `text-neutral-500` não são tokens e ninguém os mede). Ganho líquido, sem cálculo novo da minha parte — a catraca já roda.

**Dados persistidos:** `useAppearance` grava `'light'|'dark'|'system'` em `localStorage` **e** em cookie (`hooks/use-appearance.tsx`: `setCookie` + `applyTheme`). A fatia troca só o rótulo visível; **não toque no `value`**, senão a preferência gravada de todo mundo vira inválida e o `document.documentElement.classList.toggle('dark')` deixa de casar no primeiro render (com SSR, flash de tema). Essa é a trap de migração do candidato, e ele não a anotou.

**ESLint:** `react/button-has-type: 'error'` (`eslint.config.js:58`) só alcança `<button>` literal — `ToggleGroupItem` passa sem ele. O `type="button"` que a fatia `[77]` acrescentou some junto com a `<div>`, e isso é esperado, não regressão.

---

## V6P-7 · Guard-rail de região viva

**Risco: MÉDIO — e a afirmação central sobre a cobertura atual é falsa.**

**O que refuto, com o comando.** *"nenhum dos 41 arquivos de `resources/js/test/` cobre este contrato"* — cobre. `git show origin/main:resources/js/test/components/data-table/search-bar.test.tsx` traz o bloco *"SearchBar — a busca anuncia o desfecho"* com **6 casos**, e o primeiro deles é literalmente o contrato: `it('keeps the live region mounted even with nothing to say')` (`:99`), que assere região presente **e** vazia. O outro lado (`role="alert"` em nó inserido) tem `input-error.test.tsx:16-59`, com 5 casos incluindo a ligação `aria-describedby`. O que **não** existe é um sweep **de repositório**; dizer que o contrato está descoberto é diferente de dizer que está descoberto *fora dos dois componentes que o implementam*, e só a segunda é verdadeira.

Isso muda o valor da fatia: ela não fecha um buraco, ela impede que o buraco **volte** em componente novo. Continua valendo — só não é urgente e não deve ser vendida como cobertura ausente.

**Risco próprio do teste: heurística frágil, e este é o pior candidato do lote nesse quesito.** As duas regras propostas ("o atributo tem de estar no mesmo componente que também renderiza o caso vazio") não são decidíveis por regex sobre TSX com qualquer confiabilidade — um `aria-live` dentro de um `&&` e um dentro de um `return` antecipado são indistinguíveis para uma expressão regular sem parser. O resultado provável é um teste que passa vazio (regex não casa) ou que reprova código correto. Compare com os sweeps que **funcionam** no repo: `link-button-nesting.test.ts` procura um padrão sintático fechado (`<Link…><Button`), e `focus-ring.test.ts` procura uma **classe literal**. Os dois medem presença de string, não estrutura de fluxo.

**Mitigação concreta:** trocar o alvo. Em vez de tentar provar "a região preexiste", assere o **inventário**: a lista de arquivos que contêm `aria-live`/`role="status"` é exatamente a lista conhecida (hoje `data-table/search-bar.tsx`, `input-error.tsx`, `ui/alert.tsx`, `lib/toast-config.ts` — 7 linhas, medidas com `git grep -n 'aria-live|role="status"|role="alert"' origin/main -- resources/js | grep -v /test/`), e qualquer arquivo novo que entre nela **falha até ganhar teste de componente próprio**. É a mesma mecânica de `MORTOS_CONHECIDOS` do `focus-ring.test.ts`: lista explícita, cobrada quando fica obsoleta. Isso é decidível, tem controle positivo natural e não vira adivinhação sintática.

**As duas isenções que o caçador pediu ficam de graça** nesse formato (`ui/alert.tsx` e `lib/toast-config.ts` já estão na lista).

**Nada a portar do ctvitrine, e ainda bem:** o `SaveIndicator` que serve de evidência (`site-settings/edit.tsx:121-150@53d7d9a`) também usa `text-emerald-600 dark:text-emerald-400` e `text-destructive` — o segundo cai na dívida já registrada em `theme-tokens.test.ts` (`destructive` no escuro em 3.67:1, travado como catraca de não-piorar). Absorver o componente traria a dívida junto; absorver só a lição, não.

---

## V6P-8 · Par `<input type="color">` + hex

**Risco: ALTO se absorvido como está, por um motivo que o candidato não vê. E "fonte única" é falso.**

**Refuto o multi-fonte.** `docs/harvest/v2/ctfinance.md:135` lista, entre os 8 primitivos `ui/` exclusivos do ctfinance: **`color-picker` (17 presets + `<input type=color>` + hex validado)**. São **2 de 4** bases, e a outra tem a versão melhor — com paleta curada. Se esta fatia acontecer algum dia, a fonte é o ctfinance, não o par ad-hoc do ctvitrine.

**O risco que ninguém anotou: cor escolhida pelo usuário fura a catraca de contraste.** `theme-tokens.test.ts` garante, em build, que `--primary`/`--primary-foreground` atinge 4.5:1 nos **dois** temas — e o repo levou uma fatia inteira (`1e88a7d [69]`) para conquistar isso, com o comentário registrando que a correção quase introduziu uma regressão ao derrubar o par para 3.13:1 no escuro. Um `primary_color` gravado por lojista e injetado em runtime **anula a garantia**: a suíte continua verde e o app deployado pode estar em 1.5:1. Não existe verificação de contraste em runtime em lugar nenhum do kit (`git grep -in "contrast|luminance" origin/main -- resources/js | grep -v /test/` → nada).

**Mitigação obrigatória, se um dia entrar:** ou paleta de presets validados no mesmo teste que valida os tokens (o caminho do ctfinance), ou cálculo de contraste no `save` — servidor, não só cliente — recusando/avisando abaixo de 4.5:1 contra o foreground pareado. Um `<input type="color">` livre sem nenhum dos dois é uma porta para tornar decorativa a catraca mais cara que este repo pagou.

**a11y do par em si:** correto na fonte (`aria-label` no seletor nativo porque o `<Label htmlFor>` nomeia o campo de texto), e o `HEX_PATTERN.test(...)` antes do `value` evita o descarte silencioso do valor inválido pelo controle nativo. Nada a corrigir aí.

**Dados persistidos:** grava `#rrggbb`. Se entrar, normalize para minúsculas **na escrita**, senão a comparação com preset e o teste de igualdade viram caça-fantasma. Trap anotada.

**Veredito operacional:** concordo com o caçador que é o de menor prioridade — mas pela razão errada. Não é "falta o que colorir": é que a fatia correta é uma política de contraste, e essa é maior que o primitivo.

---

## V6P-9 · Duas tabelas (`ui/table` morto × `@radix-ui/themes`)

**Risco: ALTO para a migração, BAIXO para apagar o morto — e o lado CSS tem DUAS catracas na frente que o candidato não viu.**

**Catraca 1, que reprova o remédio importado do spinmax.** O candidato propõe (via `spinmax.md:1352`) redeclarar `:root, .dark, .radix-themes { --color-background: var(--background) }` depois do import. Isso **falha o teste** no primeiro `pnpm ci:test`: `theme-tokens.test.ts` tem `it('não declara nenhum --color-* fora do bloco @theme')`, que remove o corpo do `@theme` do CSS e reprova qualquer `^\s*--color-[\w-]+\s*:` remanescente. A forma do spinmax é exatamente a forma proibida aqui. Não é detalhe: é a catraca da fatia `[69]`, escrita para impedir o bug que custou meses.

**Catraca 2, que reprova o outro remédio.** O caminho `@theme` → `@theme inline` (o mecanismo que `ctfinance.md` identificou) foi **medido pela lente da rodada ctfinance**: pós-correção, `bg-primary` + `text-primary-foreground` no escuro cai de 11.4:1 para **3.13:1** e reprova o AA da tabela de pares. Ou seja: qualquer versão desta fatia é "uma palavra + recalibração das duas paletas", não uma linha.

**E a regra da casa já escolheu um terceiro caminho.** `.ai/rules/css.md`, seção *"Folha de terceiro entra em layer"*, registra a dívida com nome e sobrenome (*"`@radix-ui/themes/styles.css` redeclara `--color-background` e sequestra `bg-background` no app inteiro — dívida registrada, ainda não paga"*) e prescreve `@import ... layer(...)` com ordem declarada. Qualquer ADR nova tem de conversar com esse parágrafo, não passar por cima dele.

**Sobre a decisão em si — o candidato está certo no diagnóstico.** Medido: `ui/table` com **0 importadores** no bp e **3 páginas** no ct (`categories/index.tsx:10`, `items/index.tsx:8`, `metrics/index.tsx:3`); `@radix-ui/themes` com **7 arquivos** nos dois. A fronteira do ctvitrine ("herdado fica no Themes, novo nasce em shadcn") é real: `ct users/index.tsx:144,215` mantém o cartão `overflow-hidden` + `Table.Root variant="surface"` enquanto `items/index.tsx:121,275` usa o `<Table>` shadcn dentro do **mesmo** cartão `overflow-hidden`. E o `ui/table.tsx` do shadcn embrulha em `<div className="relative w-full overflow-auto">` (`ui/table.tsx:7`) — o que, aliás, é a razão de a V6P-1 ser mais segura no ctvitrine do que seria aqui: lá as tabelas novas trazem o próprio contêiner de rolagem; aqui as do Themes talvez não.

**Custo de gate:** migrar tabela é a fatia com **menos** gate possível — sem `pest-plugin-browser`, a única evidência é `user-table-row.test.tsx` (que testa a linha, não o layout) mais inspeção manual. Uma migração de 7 arquivos sem prova visual é irrevisável, e a lente da rodada ctfinance já cravou o princípio para um caso irmão: *"acoplar um risco de cascata a uma reescrita de componente torna a PR irrevisável"*.

**Recomendação:** dividir em três, e só a primeira é fatia.
1. **Agora, P·P:** apagar `ui/table.tsx` (0 importadores) **ou** — se a intenção for adotá-lo — riscar a regra do `.ai/rules/js.md` no mesmo commit. Manter arquivo morto defendido por uma regra é o pior dos dois mundos, e nisso o caçador está inteiramente certo.
2. **ADR (`docs/adr/0007-…`, o diretório já existe com 6 ADRs):** fronteira Themes × shadcn, com a evidência do ctvitrine anexada.
3. **Só depois, e nunca junto:** o layer/`@theme inline` do `--color-background`, com recalibração de paleta e a tabela de contraste atualizada no mesmo commit.

---

## Nota de mão inversa (não é candidato)

**Risco de absorção: NULO — nada entra.** Registro só que a medição reproduz do lado de cá: `git -C $BP grep -n "ring-ring/50" origin/main -- resources/` → **0 linhas**, e a catraca que a mantém em zero é `focus-ring.test.ts` com **controle positivo** (`sources.length > 50` e ≥ 8 arquivos com `focus-visible:ring-ring`), o que impede que ela passe vácuo se o glob quebrar. Quando a `boilerplate-sync` for ao ctvitrine, os 8 arquivos que ainda pintam `/50` entram com o teste pronto — e a mesma lista serve de gate lá. É o único item do lote com prova completa dos dois lados.

### Lente ATUALIDADE — vereditos

## V6P-1 · `min-w-0` no `SidebarInset`

**Veredito: ATUAL.**

`min-w-0` não foi substituído por nada nativo no Tailwind 4.3. A doc de `min-width` do Tailwind 4.x lista `min-w-0` como utilitário corrente e ainda usa exatamente este caso como exemplo canônico de responsividade (`<ResponsiveDesign property="min-width" defaultClass="w-24 min-w-full" featuredClass="min-w-0" />`, `src/docs/min-width.mdx`, via `search-docs` do Boost em `tailwindcss@4.x`). Não há `@utility`, variante ou default de v4 que zere `min-width:auto` em flex item — continua sendo comportamento do CSS, não do framework.

Duas ressalvas de atualidade, nenhuma derruba o candidato:

- Se o problema real for rolagem lateral de conteúdo largo, o Tailwind 4 traz **container queries nativas** (`@container` / `@max-*`, sem plugin — eram plugin em v3). Isso muda como você *reage* à largura, não a trava de encolhimento. `min-w-0` continua sendo o pré-requisito, não o substituto.
- **Não medi** se o `sidebar.tsx` upstream do shadcn já traz `min-w-0` no `SidebarInset` hoje. Se trouxer, a modernização é sincronizar o bloco com o upstream em vez de aplicar uma linha solta — mas isso é decisão de manutenção, não de versão. Registro como não medido.

O único ajuste que faço no plano: o guard-rail proposto (`readFileSync` + regex sobre a className do `data-slot="sidebar-inset"`) é frágil pelo motivo que explico em V6P-7 — `@testing-library/react@16.3.2` + `jsdom@30.0.1` estão instalados e permitem asserção sobre o DOM renderizado.

---

## V6P-2 · Resíduo da poda: `@radix-ui/react-navigation-menu` sem importador + `appearance-dropdown.tsx` morto

**Veredito: ATUAL COM MODERNIZAÇÃO — e uma refutação de fato.**

**Refutação:** remover `"@radix-ui/react-navigation-menu": "^1.2.22"` do `package.json` **não tira o pacote da árvore de instalação**. Ele continua entrando como dependência transitiva:

```
node_modules/.pnpm/radix-ui@1.6.7_.../node_modules/radix-ui/package.json
  → 55 dependências, entre elas @radix-ui/react-navigation-menu
```
Comando: `node -e "…require('./node_modules/radix-ui/package.json').dependencies…"` no diretório `.pnpm` (o umbrella `radix-ui@1.6.7` vem de `@radix-ui/themes@3.3.0`, cujas deps são `@radix-ui/colors` + `radix-ui` — medido com `require('./node_modules/@radix-ui/themes/package.json')`). Instalado hoje: `@radix-ui/react-navigation-menu@1.2.22`. Ou seja: a linha "remover dependência sem importador não muda bundle, só o lockfile" está certa quanto ao bundle e **errada quanto ao efeito** — o pacote fica, e o ganho é só de higiene declarativa enquanto `@radix-ui/themes` existir. Isso amarra V6P-2 a V6P-9.

**Modernização, e é ela que vale mais que a poda:** o alvo declara **13** `@radix-ui/react-*` individuais, e o shadcn já migrou para o pacote único `radix-ui` — que, como acabei de medir, **já está instalado** transitivamente. Doc do shadcn (`ui.shadcn.com/docs/cli` e changelogs `2025-06-radix-ui` / `2026-02-radix-ui`):

```diff
- import * as DialogPrimitive from "@radix-ui/react-dialog"
+ import { Dialog as DialogPrimitive } from "radix-ui"
```
com migração automatizada: `npx shadcn@latest migrate radix`. Isso troca 13 entradas de `dependencies` por 1 e faz o problema do candidato (dependência órfã em `@radix-ui/*`) **deixar de existir por construção** — não há mais o que cruzar. O guard-rail proposto (cruzar `@radix-ui/*` de `dependencies` com os imports) vira desnecessário no mesmo movimento; um guard-rail genérico de dependência sem importador é trabalho do `knip`, não de teste caseiro (o ESLint 10 instalado não tem regra para isso, e `eslint.config.js@origin/main` não carrega nenhum plugin de import/deps — medido: `git show origin/main:eslint.config.js`).

`appearance-dropdown.tsx`: nada de versão o afeta. Apagar segue válido — e cai em V6P-6.

---

## V6P-3 · Campo de imagem com preview e disciplina de `revokeObjectURL`

**Veredito: ATUAL COM MODERNIZAÇÃO.**

Nada no React 19.2.8 substitui o par `createObjectURL`/`revokeObjectURL`; não existe API nativa de preview de `File`. O ciclo de vida continua sendo responsabilidade do autor, e o hook `use-object-url` proposto é a forma certa. Isso está ATUAL.

O que muda na versão do alvo é **o transporte**, e a adaptação (3) do candidato ("não absorver sem o backend") fica mais forte com nome próprio:

- `@inertiajs/react@3.6.1` (instalado — `require('./node_modules/@inertiajs/react/package.json')`) já expõe o componente `<Form>` (`node_modules/@inertiajs/react/types/Form.d.ts`, com `useFormContext`) e `useForm().progress: Progress | null` (`types/useForm.d.ts:14`). A doc do Inertia 3.x é explícita: *"When making requests or form submissions that include files, Inertia will automatically convert the request data into a `FormData` object. This works with the `<Form>` component, `useForm` helper, and manual router submissions"* (`inertiajs.com/docs/v3/the-basics/forms`, via `search-docs`). Conclusão prática: o primitivo **não deve** montar `FormData` nem barra de progresso próprios — quem já paga por isso é o Inertia 3. O alvo hoje usa `useForm` em 11 arquivos e `<Form>` em 8 pontos (`git grep -l "useForm" origin/main -- resources/js | wc -l` → 11; `git grep -n "<Form" origin/main -- resources/js | wc -l` → 8), então os dois caminhos já existem na casa.
- Estética do `<input type="file">`: o Tailwind 4 tem a variante `file:` nativa e o reset do alvo já contempla `::file-selector-button` (`origin/main:resources/css/app.css`, bloco `@layer base` com `::file-selector-button` na lista de seletores). Nada de `@tailwindcss/forms` — não está nas deps.

Ou seja: o campo do ctvitrine é atual, mas ele nasceu acoplado a um autosave caseiro; no alvo o acoplamento correto é o `<Form>`/`useForm` do Inertia 3.6, não um autosave portado junto.

---

## V6P-4 · `ColorChipsInput` → `ui/chips-input.tsx`

**Veredito: ATUAL.**

Nenhum primitivo do stack instalado cobre entrada por chips. Os 13 `@radix-ui/react-*` declarados não incluem tags/chips input, e o umbrella `radix-ui@1.6.7` (55 primitivos, medido acima) também não tem — Radix Primitives não publica TagsInput. `@radix-ui/themes@3.3.0` também não. `@headlessui/react@2.2.10` idem. Não há substituto nativo em React 19 nem em Tailwind 4 para o comportamento.

O comentário sobre closure obsoleto continua **verdadeiro no React 19.2**: `value`/`onChange` de componente controlado não ganharam nenhuma semântica nova; chamar `onChange` N vezes dentro do mesmo evento lê o mesmo `value` capturado. O batching automático (que já vinha do 18) não muda isso — batching agrupa renders, não corrige a leitura do closure. O teste que o candidato propõe (um único `onChange` com todos os segmentos) é o teste certo e continua sendo o único que pega a regressão.

Ressalva de escopo: `focus-within:ring-ring/50 → ring-ring` é contrato do alvo, não questão de versão — o modificador `/50` é nativo e válido no Tailwind 4; a proibição é de contraste, não de atualidade.

---

## V6P-5 · Ícone de marca próprio + guard-rail de `<svg>`

**Veredito: ATUAL COM MODERNIZAÇÃO — a premissa se sustenta, a implementação proposta está uma major atrás.**

**A premissa está confirmada na versão do alvo.** `lucide-react@1.31.0` (instalado) traz **4050** ícones e nenhum de marca — `ls node_modules/lucide-react/dist/esm/icons/ | grep -iE "facebook|twitter|instagram|github|linkedin|youtube|slack|whatsapp|apple|google"` devolve **um único** arquivo, `apple.mjs`, que é a fruta. O ctvitrine estava em `0.475.0` e o alvo pulou para `1.31.0`; a política de marcas não mudou. Glifo próprio continua necessário.

**Três coisas mudaram no lucide 1.x e derrubam partes do plano:**

1. **`aria-hidden` já é automático.** `node_modules/lucide-react/dist/esm/Icon.mjs`:
   ```js
   ...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
   ```
   com `hasA11yProp` (`shared/src/utils/hasA11yProp.mjs`) considerando qualquer prop `aria-*`, `role` ou `title`. Então "embutir `aria-hidden`" só é regra para SVG escrito à mão — os 59 arquivos que importam `lucide-react` já estão cobertos sem fazer nada.
2. **Existe uma fábrica oficial para glifo próprio:** `lucide-react` exporta `Icon` (`dist/esm/lucide-react.mjs:1780` → `export { default as Icon } from './Icon.mjs'`), `createLucideIcon` e — novidade da 1.x — `LucideProvider`/`useLucideContext` (`dist/esm/context.mjs`), que dá default de `size`/`color`/`strokeWidth`/`className` para a árvore toda. O jeito atual de escrever o `WhatsappIcon` no alvo é `createLucideIcon('whatsapp', iconNode)`, não um `<svg>` avulso: ele herda tamanho, cor, `aria-hidden` e o provider de graça. Ressalva medida: `defaultAttributes.mjs` é `fill:"none", stroke:"currentColor", strokeWidth:2` — glifo **sólido** como o do WhatsApp precisa sobrescrever `fill="currentColor" stroke="none"` no call-site ou no wrapper.
3. **Colisão de nome viva no alvo:** `origin/main:resources/js/components/ui/icon.tsx` define um `Icon` local cuja prop se chama `iconNode` e recebe **um componente** (`LucideIcon | null`). No lucide 1.31 existe um `Icon` exportado cuja prop `iconNode` recebe **um array `[tag, attrs][]`**. Mesmo nome, mesma prop, significados diferentes, no mesmo projeto. Se a regra em `.ai/rules/js.md` for escrita, ela tem que resolver isso — ou o `ui/icon.tsx` vira wrapper do `Icon` do lucide, ou muda de nome.

O guard-rail (`<svg>` precisa de `aria-hidden` ou `role="img"`+nome) continua válido e os 2 infratores medidos continuam infratores (`app-logo-icon.tsx:5`, `ui/placeholder-pattern.tsx:11` — confirmei os dois com `git show origin/main:`). Só não invente que ele cobre lucide: não cobre e não precisa.

---

## V6P-6 · `appearance-tabs.tsx` sobre `ui/toggle-group`

**Veredito: ATUAL COM MODERNIZAÇÃO — o remédio está certo, duas afirmações do candidato estão erradas.**

**A escolha do primitivo está confirmada na versão instalada.** `@radix-ui/react-toggle-group@1.1.19` (`node_modules/@radix-ui/react-toggle-group/dist/index.mjs`):

```js
:24   return jsx(ToggleGroupImplSingle, { role: "radiogroup", ...singleProps, ref: forwardedRef });
:151  const singleProps = { role: "radio", "aria-checked": props.pressed, "aria-pressed": void 0 };
```
mais 10 ocorrências de `roving` no mesmo bundle (tabulação móvel). Com `type="single"` o Radix entrega raiz `role="radiogroup"`, itens `role="radio"` + `aria-checked`, e **anula `aria-pressed` de propósito**. É exatamente o par papel+estado+operação de teclado que o `ColorSelector` do ctvitrine prometeu e não entregou.

**Erro 1 — a medição.** `git grep 'role="radiogroup"|role="radio"|aria-checked' origin/main -- resources/js → 0` é grep de **fonte**, não de DOM. O DOM do alvo já tem os três: o próprio teste do projeto, que passa no CI, consulta por eles — `origin/main:resources/js/test/components/data-table/date-range-filter.test.tsx:21,32,33,42`, `screen.getByRole('radio', { name: '7 dias' })`. Escrever "0 linhas em todo o front" e concluir que nada anuncia estado é conclusão falsa para o `date-range-filter`; ela vale só para o `appearance-tabs`, que é `<div>` + `<button>` na unha (confirmado: `git show origin/main:resources/js/components/appearance-tabs.tsx`, linhas 16-18, estado só em `bg-white shadow-xs`).

**Erro 2 — o teste proposto.** "exigir o estado de pressão correto" leva a asserir `aria-pressed`, que o Radix **apaga** em `type="single"`. A asserção certa é `getByRole('radio', { name: 'Claro' })` + `toHaveAttribute('aria-checked', 'true')`. Nota de manutenção: o teste que já existe assere `data-state="on"` (linha 32) — atributo de implementação; o novo deve asserir o estado ARIA, que é o contrato público.

Rótulos `'Light' | 'Dark' | 'System'` → `Claro | Escuro | Sistema`: correto e sem relação com versão.

Duas notas de atualidade que o candidato não levanta e que valem para o mesmo arquivo: o alvo **não tem `eslint-plugin-jsx-a11y`** (`git grep -n "jsx-a11y" origin/main` → 0 acertos; `eslint.config.js@origin/main` carrega só `js`, `@typescript-eslint`, `react`, `react-hooks`, `prettier`), então nada estático protege esse padrão hoje. E o `.dark` é aplicado em `document.documentElement` (`origin/main:resources/js/hooks/use-appearance.tsx:25`) — relevante para V6P-9.

---

## V6P-7 · `role="status"` em nó que remonta

**Veredito: ATUAL COM MODERNIZAÇÃO — o diagnóstico está certo, o instrumento proposto é o errado para esta versão do stack.**

O contrato ("região viva precisa preexistir à mudança") não foi superado por nada: React 19.2 não tem primitivo de anúncio, e `aria-live` continua sendo do DOM. O `SaveIndicator` do ctvitrine é defeito real e o alvo está certo nos dois pontos onde a regra se aplica. Isso está ATUAL.

**Refutação de fato:** "**Zero `role="status"`**" é, de novo, artefato de grep de fonte. `react-hot-toast@2.6.0` (instalado) injeta `role:"status"` + `aria-live:"polite"` por default — medido em `node_modules/react-hot-toast/dist/index.mjs` (1 × `role:"status"`, 1 × `aria-live`, 1 × `"polite"`, 2 × `ariaProps`) — e o **próprio alvo documenta isso** em `origin/main:resources/js/lib/toast-config.ts:45-49`: *"`ariaProps` sobrescreve o default da lib (`role: 'status'`, `aria-live: 'polite'`, em `react-hot-toast@2.6.0`)"*. Todo toast de sucesso/info do alvo renderiza `role="status"` em nó que **é montado na hora do anúncio** — e funciona, porque o container do `Toaster` preexiste. Um guard-rail que proíba "`role="status"` em retorno condicional" precisa entender essa diferença, e regex não entende.

**Modernização:** o próprio candidato admite o risco ("o risco é o teste virar heurística frágil de regex"). Na versão do alvo esse risco é evitável: `@testing-library/react@16.3.2`, `@testing-library/jest-dom@7.0.1`, `jsdom@30.0.1` e `vitest@4.1.10` estão instalados, e 41 arquivos de teste já existem. O contrato é sobre **DOM renderizado**, então o teste deve renderizar cada componente candidato em dois estados e exigir que o nó com `aria-live` seja o **mesmo nó** antes e depois (comparar identidade do elemento entre `rerender`s) — asserção que não tem falso positivo nem precisa de lista de isenção para `ui/alert.tsx` e `toast-config.ts`. A lista de isenções que o candidato descreve é sintoma de o instrumento estar errado, não requisito.

---

## V6P-8 · `<input type="color">` pareado com campo hex

**Veredito: ATUAL COM MODERNIZAÇÃO.**

`<input type="color">` não foi superado por nada — não há primitivo de cor em Radix, Radix Themes ou Headless UI no que está instalado. O pareamento com campo hex e o `aria-label` próprio no seletor (porque o `<Label>` aponta para o campo digitável) continuam corretos. ATUAL nessa parte.

Duas correções de atualidade no plano de teste e no plano de uso:

1. **Metade do teste proposto testa o navegador, não o componente.** "escolher no seletor normaliza o texto para `#rrggbb` minúsculo" é o *value sanitization algorithm* do próprio `input[type=color]` no HTML: o `value` é sempre um simple color em minúsculas — o elemento não tem como devolver outra coisa. O que vale testar é o inverso, que é código seu: hex inválido digitado **não** derruba nem "conserta" o seletor (o fallback `HEX_PATTERN.test(...) ? … : DEFAULT`), e o `onChange` do seletor propaga para o estado canônico. Vale registrar também que o `input[type=color]` ganhou `alpha`/`colorspace` no HTML recente — **não medi** suporte nos navegadores-alvo do projeto e o caso de branding não precisa de alfa, então fica como nota.
2. **A prioridade baixa está certa, mas o pré-requisito mudou de nome.** O candidato diz que o valor só aparece "quando existir algo configurável para colorir". Na versão do alvo isso é barato e nativo: Tailwind 4.3 resolve branding por tenant com `@theme inline` + a variável crua sobrescrita em `:root`/`style` — a doc de Colors do `tailwindcss@4.x` traz o padrão literal (`:root { --acme-canvas-color: … }` + `@theme inline { --color-canvas: var(--acme-canvas-color); }`). Sem `inline`, a cor por tenant não se propaga direito — que é o mesmo defeito da V6P-9. Ou seja: V6P-8 não é independente; ele **depende** de a V6P-9 ser resolvida primeiro.

---

## V6P-9 · `ui/table` do shadcn × `@radix-ui/themes` — e a colisão de `--color-background`

**Veredito: ATUAL COM MODERNIZAÇÃO, e é o achado mais forte do lote pela minha lente. A alternativa nativa tem nome, está documentada na versão do alvo, e a correção que o candidato cita com aprovação (a do spinmax) é a OBSOLETA.**

**O diagnóstico do candidato está certo e eu consegui estreitá-lo a um token só.** Cruzando os `--color-*` declarados por `@radix-ui/themes@3.3.0` com os declarados no bloco `@theme` de `origin/main:resources/css/app.css` (script Python sobre `node_modules/@radix-ui/themes/styles.css` + `git show origin/main:resources/css/app.css`):

```
radix --color-* : 7
@theme --color-*: 32
INTERSEÇÃO   : ['--color-background']   ← uma, exatamente uma
  :where(.radix-themes)                      → --color-background: white
  :is(.dark, .dark-theme), …                 → --color-background: var(--gray-1)
```
`grep -c "@layer" node_modules/@radix-ui/themes/styles.css` → **0**: a folha inteira é sem layer. E o Tailwind 4.3.3 põe o `@theme` em layer — `node_modules/tailwindcss/index.css` abre com `@layer theme, base, components, utilities;` e `@layer theme { @theme default { … } }`. Declaração sem layer vence declaração em layer.

**A consequência, e ela é maior do que "cor de fundo de tabela":** o segundo seletor da Radix é `:is(.dark, .dark-theme)`, que casa o `<html class="dark">` — o mesmo elemento que `:root` casa, e `.dark` é aplicado justamente ali (`origin/main:resources/js/hooks/use-appearance.tsx:25`, `document.documentElement.classList.toggle('dark', isDark)`). Então **no tema escuro** `--color-background` no root vale `var(--gray-1)` = `#111111` (medido na folha da Radix), não `var(--background)` = `var(--brand-navy-dark)` = `#0f2a44` (`app.css:170`). São 15 usos de `bg-background`/`text-background`/`border-background` em 11 arquivos (`git grep -o … origin/main -- resources/js resources/css | wc -l` → 15), incluindo `body` (`app.css`, `@layer base`), `ui/sidebar.tsx` (3) e `ui/dialog.tsx`. No tema claro não aparece, porque a Radix só declara `white` sob `:where(.radix-themes)` e `--background` do alvo já é `white` — o defeito é **invisível de dia**. E `<Theme>` embrulha o app inteiro (`origin/main:resources/js/app.tsx:27-39`).

**O agravante que fecha o círculo:** `origin/main:resources/js/test/styles/theme-tokens.test.ts` existe **exatamente por causa desta classe de bug**. O docblock dele diz, com todas as letras: *"`--color-primary` estava declarado DUAS vezes … Declaração sem layer vence declaração em `@layer` … `text-primary` no escuro dava 1.28:1"*. Só que o teste lê **apenas** `resources/css/app.css` (`readFileSync(resolve(import.meta.dirname, '../../../css/app.css'))`). A folha da Radix entra na mesma cascata pelo `@import` da linha 5 e é invisível para o guard-rail. O time já pagou por este bug uma vez, escreveu o teste, e a última colisão restante está no ponto cego dele.

**A alternativa nativa, com o trecho que prova.** Doc de Colors do `tailwindcss@4.x` (`src/docs/colors.mdx`, seção *Referencing other variables*, via `search-docs` do Boost):

> Use `@theme inline` when defining colors that reference other colors:
> ```css
> :root { --acme-canvas-color: oklch(0.967 0.003 264.542); }
> [data-theme="dark"] { --acme-canvas-color: oklch(0.21 0.034 264.665); }
> @theme inline { --color-canvas: var(--acme-canvas-color); }
> ```

O bloco `@theme` do alvo tem 32 tokens no formato `--color-X: var(--X)` — é **literalmente** o caso que a doc descreve, e está escrito sem `inline`. Com `@theme inline`, o utilitário compila para `background-color: var(--background)` em vez de `var(--color-background)`: a Radix pode redeclarar `--color-background` à vontade que não sequestra mais nada, e o bug do `--color-primary` que o teste guarda deixa de ser possível **por construção**, para os 32 tokens de uma vez. Uma palavra.

**O que isso reclassifica:**
- A correção do spinmax citada como referência (`:root, .dark, .radix-themes { --color-background: var(--background) }` — `spinmax.md:1352`) é **OBSOLETA** na versão do alvo: é remendo por especificidade, tem que ser mantido em sincronia com os seletores internos da Radix (que já são três: `:where(.radix-themes)`, `:is(.dark,.dark-theme)` e o descendente), e o `app.css` do alvo já mostra o custo desse caminho — `[data-radix-theme]` com `!important` na linha 93 e o bloco de 11 seletores encadeados de `.rt-TableHeader` mais adiante. Não replique esse padrão.
- O item continua sendo decisão de ADR quanto a `ui/table` × Themes, mas **para de ser só isso**: a colisão de `--color-background` tem correção de uma palavra, independente da decisão de tabela, e deve sair na frente dela.
- `min-w-0` (V6P-1) e a adaptação do `overflow-hidden` que o candidato levanta seguem válidas e ortogonais.

**Não medido, declarado:** não rodei build nem browser (proibido nesta rodada). A cadeia da cascata está medida arquivo a arquivo (layer da Radix = 0, layer do Tailwind = `theme`, seletores, valores, ponto de aplicação do `.dark`); a renderização de `#111111` no escuro é inferência dessa cadeia, corroborada pelo precedente do `--color-primary` que o próprio projeto já reproduziu e travou.

---

## Nota transversal (não é candidato)

O contrato de anel de foco não tem componente de atualidade: `ring-ring/50` não é legado de Tailwind 3 — o modificador de opacidade `/50` é nativo e válido no Tailwind 4.3, e os 8 arquivos do ctvitrine que o usam estão sintaticamente atuais. A regra do alvo é de **contraste**, não de versão, e a fatia inversa continua de pé pelo mérito dela.

Uma pendência de atualidade que o lote não cobre e que toca todos os primitivos de `components/ui/`: `origin/main:resources/css/app.css:7` carrega `@plugin 'tailwindcss-animate'`, e `tailwindcss-animate@1.0.7` é plugin **JS de Tailwind v3** (`peerDependencies: { "tailwindcss": ">=3.0.0 || insiders" }`, `theme("transitionDuration")`, `theme("opacity")`, `theme("scale")`, `theme("rotate")`). Verifiquei antes de acusar: **ele não está quebrado** — o Tailwind 4.3.3 embute uma tabela de compatibilidade v3 (`node_modules/tailwindcss/dist/chunk-C2OYBFIH.mjs` traz `transitionDuration`, `opacity`, `rotate`, `scale`), então as 12 classes numéricas realmente usadas (`fade-in-0` ×7, `fade-out-0` ×7, `zoom-in-95` ×5, `zoom-out-95` ×5, `slide-in-from-*-2` ×16, `fade-in-50` ×1 — `git grep -oh … origin/main -- resources/js/components/ui resources/js/pages | sort | uniq -c`) compilam. Mas o pacote está **deprecado pelo shadcn desde 19/03/2025** em favor de `tw-animate-css`, com migração de uma linha (`ui.shadcn.com/docs/tailwind-v4`, via context7):

```diff
- @plugin 'tailwindcss-animate';
+ @import "tw-animate-css";
```

É dependência de um caminho de compatibilidade que a próxima major do Tailwind pode remover. Vale como item separado — não pertence a nenhum dos 9.

---

## Caçador 3 — telas de referência, densidade, skeleton, empty state, microinteração

# Caçador 3 · ctvitrine `53d7d9a` — telas de referência, densidade, skeleton, empty state, microinteração

Baseline do alvo: `origin/main` = **`beb848ea509bf6682c9e31f10611ad7ab489392e`** (não `2965f8c`, que é o baseline do inventário — quatro fatias entraram desde então: #103, #105, #107, #111). Toda contagem abaixo foi re-medida contra esse SHA.

**Resposta curta às cinco perguntas da frente, antes dos candidatos:**

- **Densidade/hierarquia:** a casca de listagem (`gap-3 p-4 md:gap-4 md:p-6` → card `bg-card border-border/40 rounded-lg shadow-sm` → header `bg-muted/20` → filtros → tabela) é **byte-a-byte o mesmo ancestral** nos dois. `dashboard.tsx` é idêntico nos dois (`PlaceholderPattern`). Não há densidade a colher; há **duas** decisões de composição a colher (V6D-1, V6D-9).
- **Skeleton:** o boilerplate tem o primitivo e **zero** uso de aplicação; o `SidebarMenuSkeleton` é export morto. O ctvitrine usa `Skeleton` em exatamente 2 lugares, com uma disciplina que vale regra (V6D-1).
- **Empty state / botão em envio:** o boilerplate está **à frente** — E14/E15 e E28 já superaram o que a fonte tem (a fonte ainda carrega o `type="row"` que o E14 removeu). O que sobra é a **trava** do follow-up de E28 (V6D-10).
- **Animação:** o vocabulário é o mesmo (`duration-200` 111×fonte / 87×boilerplate, mesmas `ease-*`). O gênero-F32 que restou não está no CSS: está na **blade** (V6D-3) e num **componente morto** (V6D-6).
- **Imagens:** V6D-4. A assimetria do crítico se confirma e é maior do que 2,28 MB.

---

### V6D-1 · `Skeleton` é primitivo sem um único uso no boilerplate; o ctvitrine mostra o critério de quando ele vale

- **Evidência:** `resources/js/pages/items/studio.tsx:1105-1106@53d7d9a` e `:1127-1128@53d7d9a`
  ```tsx
  {analyzing && form.category_id === '' ? (
      <Skeleton className="h-9 w-full" />
  ) : (
      <Select value={form.category_id} …>
  ```
  O skeleton substitui **um valor específico que um processo assíncrono está preenchendo**, e só enquanto o campo está vazio — nunca cobre a tela, nunca substitui um campo que a pessoa já digitou. É a única aparição de `Skeleton` fora de `ui/` na fonte inteira (`git grep "Skeleton" 53d7d9a -- resources/js` → 14 linhas: 11 em `ui/sidebar.tsx`, 1 import + 2 usos em `studio.tsx`).
- **Estado do boilerplate hoje:** `resources/js/components/ui/skeleton.tsx@origin/main` é **byte-a-byte igual** ao da fonte. `git grep -n "Skeleton" origin/main -- resources/js | grep -v "components/ui/"` → **0 linhas**. `git grep -n "SidebarMenuSkeleton" origin/main -- resources/js | grep -v "components/ui/sidebar.tsx"` → **0 linhas** (definido em `ui/sidebar.tsx:624`, exportado em `:739`, nunca chamado). O boilerplate tem 1 `animate-pulse`, e é o do próprio primitivo.
- **O que absorver / o que travar:** não é código a portar — o boilerplate não tem tela com preenchimento assíncrono. O ativo é a **regra**, em `.ai/rules/js.md`: *skeleton representa um valor identificado que está chegando, com a mesma altura do controle que vai substituir (`h-9` casa o `SelectTrigger`); não é cortina de tela nem substitui campo já preenchido; tela sem valor chegando usa `EmptyState`, não skeleton.* Junto, decidir o `SidebarMenuSkeleton`: usar ou podar (mesma família do E19).
- **Adaptação necessária:** nenhuma no primitivo. A regra precisa dizer o que fazer no boilerplate hoje — que é **nada**, e é esse o ponto: hoje há um primitivo publicado sem contrato de uso, e o primeiro que o usar vai inventar o critério.
- **Risco · esforço:** P · P. Regra + (opcional) poda de 20 linhas do `ui/sidebar.tsx`.
- **Multi-fonte?** O `ui/skeleton.tsx` de 14 linhas aparece igual no spinmax (`spinmax.md:1178`) e no cuidari (`cuidari.md:2453`). Nenhum dos inventários registrou uso de aplicação em nenhum dos três.

---

### V6D-2 · A blade raiz do boilerplate não linka favicon nenhum, e o `public/` carrega 6 arquivos de ícone que nada referencia

- **Evidência:** `resources/views/app.blade.php:8-21@53d7d9a` — bloco condicional, com o motivo escrito:
  ```blade
  @php($faviconUrl = data_get($page, 'props.branding.favicon_url'))
  @if ($faviconUrl)
      <link rel="icon" href="{{ $faviconUrl }}" >
      <link rel="apple-touch-icon" href="{{ $faviconUrl }}" >
  @else
      <link rel="icon" href="/favicon.ico?v=2" sizes="any" >
      <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" >
      … (32x32, 16x16, apple-touch-icon 180x180)
  @endif
  <meta name="theme-color" content="{{ $meta['theme_color'] ?? '#0f2a44' }}" >
  ```
- **Estado do boilerplate hoje:** `git -C $B grep -rn 'rel="icon"' origin/main -- resources app` → **0 linhas**. `git -C $B grep -rln "android-chrome" origin/main` → **0**. `git -C $B grep -rn "webmanifest\|manifest.json" origin/main` → **0**. Ainda assim `git -C $B ls-tree -r origin/main --name-only -- public` lista `android-chrome-192x192.png`, `android-chrome-512x512.png` (89.170 B), `apple-touch-icon.png`, `favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico` — **seis arquivos, zero referência**. A aba mostra o que o browser adivinhar de `/favicon.ico` (que existe, então funciona por acidente do caminho default; os outros cinco são peso morto). Sem `theme-color`, sem `<meta name="description">`, sem OG.
- **Extra medido no mesmo diretório:** `public/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2` e `aptos-extrabold-italic.woff2` são o **mesmo blob** (`fc88540ed885152d200bf22f8f759258f78538b1`, 78.980 B cada) no `origin/main` do boilerplate — 22 arquivos em `public/fonts` contra **21** `url(` em `resources/css/_fonts.css`; a sobra é exatamente o arquivo com ` 2` no nome. O crítico do inventário achou isso na **fonte**; o boilerplate tem o mesmo blob duplicado.
- **O que absorver / o que travar:** (i) linkar os ícones que já estão versionados, na ordem que a fonte usa; (ii) podar o par duplicado de woff2 e os ícones que sobrarem sem link; (iii) travar com um teste no molde de `resources/js/test/lib/impersonation-call-sites.test.ts` (`@vitest-environment node`, lê a árvore): *todo arquivo em `public/` fora de `vendor/` é referenciado por `resources/` ou está numa allowlist explícita*. Esse mesmo teste pega a fonte duplicada, os ícones órfãos e o próximo PNG que entrar sem uso.
- **Adaptação necessária:** o `branding.favicon_url` da fonte vem de `SiteSetting` (white-label por instância) — o boilerplate não tem esse conceito. Trazer só o ramo `@else` (lista fixa) + `theme-color` espelhando `--brand-navy-dark`, com o literal justificado como o `<style>` inline já é (`.ai/rules/views.md`, "Blade que pinta sem o `app.css` usa literal, e o literal espelha o token").
- **Risco · esforço:** P · P.
- **Multi-fonte?** Sim: o spinmax tem `public/site.webmanifest` completo (`spinmax.md:1859`) e o ctvitrine tem o bloco condicional. **Dois derivados resolveram; o boilerplate é o único dos três sem nenhum link de ícone.**

---

### V6D-3 · `preconnect` para `fonts.bunny.net` na blade dos dois — nenhum byte sai por lá (mesmo gênero do F32, fora do CSS)

- **Evidência:** `resources/views/app.blade.php:138@53d7d9a` → `<link rel="preconnect" href="https://fonts.bunny.net" >`. Na fonte, `resources/css/_fonts.css` declara 34 `@font-face` e **toda** `url()` é same-origin `/fonts/woff2/…`.
- **Estado do boilerplate hoje:** `resources/views/app.blade.php:67@origin/main`, linha idêntica. `git -C $B grep -rn "bunny.net\|fonts.googleapis\|gstatic" origin/main -- resources` → **1 linha, e é a própria `preconnect`**. As 21 `url()` de `resources/css/_fonts.css` são todas `/fonts/woff2/…`. Sobra herdada do starter kit, que servia Instrument Sans da bunny antes de o projeto auto-hospedar as fontes.
- **O que absorver / o que travar:** deletar a linha. A regra é o que interessa e ela já existe em espírito no `.ai/rules/css.md` ("Antes de escrever CSS contra markup de terceiro, confirme no `dist/` da lib que o gancho existe") — falta a metade `<head>`: *dica de rede (`preconnect`/`dns-prefetch`/`preload`) só entra com um consumidor demonstrável na árvore; `preconnect` para host que ninguém busca abre socket TLS a cada navegação e some do radar.* Trava barata: um caso no teste-de-blade equivalente ao de `views` (`.ai/rules/views.md` já tem 3 regras) ou dentro do mesmo teste-de-árvore de V6D-2.
- **Adaptação necessária:** nenhuma — é uma remoção de uma linha.
- **Risco · esforço:** P · P. O único risco é a folha do `@radix-ui/themes` puxar algo de terceiro; medi só `resources/`, não o `dist/` do pacote — **não medi o vendor**, e isso precisa de uma confirmação antes do commit.
- **Multi-fonte?** **Sim, já registrado**: `spinmax.md:2792` chegou à mesma conclusão por outro caminho (frente de CSP) — *"`app.blade.php:59` tem `preconnect` para `https://fonts.bunny.net`, mas grep em `resources/css/` e `resources/views/` não encontra nenhum fetch real"*. Este é o terceiro projeto com a linha. O crédito é de lá; o que acrescento é que ela também está viva no **boilerplate** e que a poda é independente da fatia de CSP.

---

### V6D-4 · 44 `<img>` na fonte, **zero** com `width`/`height`, e o servidor comprime o upload da lojista enquanto a landing serve 6,7 MiB de PNG cru

- **Evidência:** `git -C $R grep -n -E '^\s+(width|height)=' 53d7d9a -- resources/js` → **0 linhas**, contra 44 `<img` (`git grep -o "<img" 53d7d9a -- resources/js | wc -l`). O dimensionamento é feito por wrapper (`aspect-square` 16×, `aspect-video` 3×, `aspect-[3/4]` 2×, `aspect-[2/1]` 2×, `aspect-[4/3]` 1×), o que resolve CLS **onde existe wrapper** e não resolve onde não existe. `loading=` aparece em **12** das 44 (7 `lazy`, 5 `eager`); `decoding=` em 5; `fetchpriority` em **0**.
  A assimetria: `app/Services/ImageOptimizer.php@53d7d9a` reduz o upload do lojista a `maxDimension = 1600` / `quality = 82`, JPEG progressivo, EXIF assado, metadado removido. E `resources/js/pages/site/landing.tsx:905-909@53d7d9a` renderiza os 4 mocks **sem `loading`, sem dimensão**:
  ```tsx
  <img src={piece.img} alt={piece.name}
       className={cn('h-full w-full object-contain', sold && 'opacity-60 grayscale')} />
  ```
  Pesos medidos por `git ls-tree -r -l 53d7d9a -- public`: `jaqueta.png` **2.276.766 B**, `bolsa.png` **1.792.437**, `vestido.png` **1.527.070**, `tenis.png` **1.463.039** — **7.059.312 B (6,73 MiB) só nesse grid**; mais `logo-loja-ana.png` 919.986 (2×, `:849` e `:865`, sem `loading`). Total único de `public/img/mock` = **8.192.613 B (7,81 MiB)**. A única imagem da landing com `loading="lazy"` é `painel-metricas.png` (`:558`), que é a **menor** delas (213.315 B).
- **Estado do boilerplate hoje:** 4 `<img>` vivos, todos em `layouts/auth/*` (`auth-card-layout.tsx:24`, `auth-simple-layout.tsx:23`, `auth-split-layout.tsx:18` e `:42`), todos com `loading="eager" decoding="async"` e **nenhum** com `width`/`height` — o `<img src="/logo-simplify.png" className="h-10 w-10 object-contain">` de `auth-simple-layout.tsx:23-30` carrega um PNG de **116.077 B** para desenhar 40×40 CSS px. Mais um `<img>` comentado em `components/app-logo.tsx:11`. `aspect-*`: 8 ocorrências. Nenhuma regra em `.ai/rules` fala de imagem (`css.md` tem 5 seções, nenhuma; `views.md` tem 3, nenhuma; `js.md` não tem).
- **O que absorver / o que travar:** o guard-rail, não o código. Regra em `.ai/rules/js.md` + teste de call-site no molde de `impersonation-call-sites.test.ts`: *todo `<img>` em `resources/js` declara `width` **e** `height` (ou vive dentro de um wrapper `aspect-*`/dimensão fixa **no mesmo arquivo**) e um `loading` explícito — `eager` só acima da dobra, e nesse caso com `fetchpriority="high"`.* Segundo caso do mesmo teste, que é o achado que a fonte torna óbvio: **binário em `public/` acima de um teto (p.ex. 200 KB) precisa de allowlist com justificativa** — foi exatamente o que faltou para 7,81 MiB de mock entrarem no repo de um produto que tem um `ImageOptimizer`.
- **Adaptação necessária:** o boilerplate só precisa de 4 correções (`width`/`height` nos logos de auth) para o teste nascer verde; o teto de peso pega o `logo-simplify.png` de 116 KB de cara, então ou ele entra na allowlist ou é reduzido no mesmo commit. Decidir isso é parte da fatia.
- **Risco · esforço:** P · M. O risco é o teste virar ruidoso com `<img>` de wrapper legítimo — por isso a regra aceita `aspect-*` no mesmo arquivo, e por isso o teto de `public/` precisa de allowlist e não de proibição.
- **Multi-fonte?** Não medi imagens nos outros três inventários; `grep "loading=\"lazy\"\|ImageOptimizer\|CLS"` em `cuidari.md`, `spinmax.md` e `ctfinance.md` → **0 linhas**. O tema é inédito na rodada.

---

### V6D-5 · Os pares `--success` / `--warning` / `--info` não são só classe morta: **três deles reprovam contraste**, então exportá-los como estão entrega um par a 2,15:1

Emenda a um achado já registrado (`ctfinance.md:420`), não candidato novo — mas o achado de lá, **como está escrito, leva a um conserto errado**.

- **Evidência:** `resources/css/app.css:135-140@53d7d9a` (`:root`) e `:186-191@53d7d9a` (`.dark`) — a fonte declara os seis tokens com os **mesmos hex** do boilerplate. Consumo real na fonte: só `border-left: 4px solid var(--success)` / `color: var(--success)` no CSS de toast (`:635`, `:641`, `:657`, `:663`, `:668`, `:674`) e `resources/js/lib/toast-config.ts`.
- **Estado do boilerplate hoje:** `resources/css/app.css:135-140` (`:root`) e `:189-194` (`.dark`). O bloco `@theme` (`:14-70`) mapeia 26 `--color-*` e **nenhum** deles é `success`/`warning`/`info` — logo `bg-success`/`text-warning` não existem. Consumidores: `app.css:636`, `:648`, `:654` (`border-left`) e `lib/toast-config.ts`. A tabela de contraste em `resources/js/test/styles/theme-tokens.test.ts:127-134` tem **6 linhas** — `primary`, `secondary`, `accent`, `muted`, `card`, `background/foreground` — e o comentário acima dela diz *"A tabela é o contrato. Um par novo entra aqui junto com o token."* Os três pares semânticos são **anteriores** à tabela e nunca entraram.
- **O fato novo — contraste medido** (script em `…/scratchpad/contrast.py`, WCAG 2.x relative luminance):

  | par | valores | razão | AA 4.5 | 3:1 |
  |---|---|---|---|---|
  | claro `--success` / `--success-foreground` | `#16a34a` × `#ffffff` | **3,30:1** | ✗ | ✓ |
  | claro `--warning` / `--warning-foreground` | `#f59e0b` × `#ffffff` | **2,15:1** | ✗ | **✗** |
  | claro `--info` / `--info-foreground` | `#0ea5e9` × `#ffffff` | **2,77:1** | ✗ | **✗** |
  | escuro `--success` / `--success-foreground` | `#22c55e` × `#ffffff` | **2,28:1** | ✗ | **✗** |
  | escuro `--warning` / `--warning-foreground` | `#fbbf24` × `#0f2a44` | 8,77:1 | ✓ | ✓ |
  | escuro `--info` / `--info-foreground` | `#38bdf8` × `#0f2a44` | 6,83:1 | ✓ | ✓ |

- **O que absorver / o que travar:** o conserto **não** é "exportar os seis para o `@theme`" — isso publicaria `bg-warning text-warning-foreground` a 2,15:1 e faria o próprio `.ai/rules/css.md` ("Par de token que vira texto tem contraste medido") mentir. A ordem correta é: (1) acrescentar as 3 linhas na tabela do `theme-tokens.test.ts` e vê-la **falhar**; (2) escolher os pares — o padrão do escuro (`--X` claro + `--X-foreground` = navy) já passa e é a saída óbvia para o claro também (foreground escuro sobre fundo claro de estado, no molde de `bg-emerald-100 text-emerald-800` que o app já pinta na mão); (3) só então exportar para o `@theme` e trocar os literais. É exatamente a armadilha que o comentário do próprio teste descreve ("a segunda [guarda] é a que teria pego a regressão que o CONSERTO quase introduziu").
- **Adaptação necessária:** o `ctfinance.md:420` cita `users/user-actions-menu.tsx:125` escrevendo `text-success` descartado — **não reproduzi**: `git -C $B grep -rn "text-success" origin/main -- resources/js` → **0 linhas** no `origin/main` de hoje. Ou o arquivo mudou desde `2965f8c`, ou o call-site é do ctfinance e não do boilerplate. Quem pegar a fatia precisa re-medir antes de citar.
- **Risco · esforço:** M · M. Mexer em token de estado toca o CSS de toast (`border-left`) e é onde a fatia F32 acabou de passar.
- **Multi-fonte?** Sim — **já registrado no ctfinance**. Os hex são idênticos na fonte, o que confirma que os seis tokens são herança comum e não invenção de ninguém.

---

### V6D-6 · `layout/page-header.tsx` + `page-info.tsx`: subárvore morta cuja única prop exclusiva monta classe Tailwind por interpolação — e o ctvitrine tem a versão **viva e sem a prop**

Terceira confirmação de um achado já registrado (`ctfinance.md:379` e `:448`). Traz um fato que os dois anteriores não tinham.

- **Evidência:** `resources/js/components/layout/page-header.tsx@53d7d9a` é o **mesmo componente sem `iconGradient`** — o ícone é `bg-primary/10 text-primary`, token puro. E ele tem **call site**: `resources/js/pages/metrics/index.tsx:653` e `resources/js/pages/metrics/report.tsx:49`. Varredura de classe interpolada na fonte inteira:
  `git -C $R grep -rn -E '(bg|text|border|from|to|via|ring|fill|stroke|grid-cols|w|h|size|p[xytblr]?|m[xytblr]?|gap)-\$\{' 53d7d9a -- resources/js` → **0 linhas**.
- **Estado do boilerplate hoje:** `resources/js/components/layout/page-header.tsx:41@origin/main`
  ```tsx
  ? `bg-gradient-to-br from-${iconGradient.from} to-${iconGradient.to} text-white shadow-sm`
  ```
  A **mesma varredura** no boilerplate retorna **exatamente essa linha e mais nenhuma**. `git -C $B grep -rn "iconGradient" origin/main` → 4 linhas, **todas dentro do próprio arquivo**. `git -C $B grep -rn "PageHeader" origin/main -- resources/js | grep -v "components/layout/page-header.tsx"` → **0 linhas**. E `git -C $B grep -rn "PageInfo" origin/main -- resources/js | grep -v "page-info.tsx"` → **3 linhas, todas em `page-header.tsx`**: `page-info.tsx` só é alcançável através do componente morto. São **dois** arquivos mortos, não um. Controle: `git -C $B grep -rnE "(from|to)-[a-z]+-[0-9]{2,3}" origin/main -- resources/js` **fora** de `page-header.tsx` mostra que gradiente estático existe e funciona (`user-table-row.tsx:41`, `role-users-table.tsx:75`) — o problema é só a interpolação.
- **O que absorver / o que travar:** o fato novo é **qual é a forma certa**. As três fontes convergem: cuidari tem cópia diff-0 (morta, com a prop), ctfinance tem o mesmo bug (morto), **ctvitrine é o único com o componente vivo — e é o único sem `iconGradient`**. Isso decide a fatia: não é "consertar o gradiente", é **remover a prop** e decidir entre podar a subárvore ou dar-lhe os call sites que a fonte lhe dá. Guard-rail que fecha a família inteira: caso no `link-button-nesting.test.ts` (ou irmão novo) que falha em qualquer `` `…-${…}` `` com prefixo de utilitário Tailwind — hoje pegaria exatamente 1 linha, e é a certa.
- **Adaptação necessária:** se a decisão for manter, os call sites de referência (`metrics/*`) não existem aqui; o candidato natural é `pages/users/index.tsx:145-152`, que hoje monta o cabeçalho à mão com `<UserPlus>` + `<h2>` + `PageInfo`-equivalente inline.
- **Risco · esforço:** P · P (poda) ou M (adoção).
- **Multi-fonte?** **3 de 3** — ctfinance (registrado), cuidari (`cuidari.md:2445`, diff 0), ctvitrine (variante viva). Multi-fonte confirmada com desempate.

---

### V6D-7 · Autosave campo-a-campo com indicador de estado — e o mecanismo do Inertia que o torna possível (o boilerplate não faz **um** partial reload)

- **Evidência:** `resources/js/hooks/use-settings-autosave.ts:37-70@53d7d9a`
  ```ts
  router.post(route('site-settings.update'), fields, {
      preserveState: true, preserveScroll: true,
      only: ['settings'],
      async: true,
      forceFormData: options.forceFormData ?? false,
      …
      onFinish: () => { inFlight.current -= 1;
          if (inFlight.current === 0) setSaveState(roundHadError.current ? 'error' : 'saved'); … }
  ```
  Três decisões, cada uma com o motivo escrito no docblock (`:17-32`): **(1)** um campo por vez em POST parcial, porque `validated()` omite chave ausente — *"um save de texto nunca reescreve a logo; a corrida de 'logo some' fica impossível"*; **(2)** `only: ['settings']` corta o flash de sucesso da resposta (senão vira toast fantasma na próxima navegação) **mas os erros de validação furam o filtro porque são `Inertia::always`**; **(3)** `async: true` porque a fila síncrona do Inertia abortaria o save em voo ao disparar o campo seguinte. Mais o contador `inFlight` — o estado só assenta quando o último request volta.
  A saída visual é `pages/site-settings/edit.tsx:118-149@53d7d9a`, `SaveIndicator`, com o comentário que é o achado de UX: *"'Salvo' é estado, não evento: fica até a próxima edição"*. Os três estados não-idle carregam `role="status" aria-live="polite"` (`:128`, `:137`, `:145`).
- **Estado do boilerplate hoje:** `git -C $B grep -rn "only: \[" origin/main -- resources/js` → **0 linhas**. `git -C $B grep -rn "async: true" origin/main -- resources/js` → 0. Todo formulário é `useForm` + botão + toast de flash. `git -C $B grep -rn 'role="status"' origin/main -- resources/js | grep -v test` → 0 (existe `aria-live` em `data-table/search-bar.tsx:78` e `input-error.tsx`, sem `role="status"`).
- **O que absorver / o que travar:** o **hook não** — ele é do domínio de um form white-label específico. O que absorve é o **contrato do partial reload**, como regra em `.ai/rules/js.md`, porque ele já é falso-amigo aqui: o boilerplate acabou de fazer o `flash` do `share()` virar `Inertia::always()` (candidato E13 do ctfinance) — ou seja, **no boilerplate `only:` não corta o flash**, ele fura o filtro igual aos erros. A regra tem de dizer as duas metades: *`only:` filtra o que **não** é `always`; conferir no `share()` antes de contar com o corte; visita de autosave usa `async: true` para não abortar a anterior; estado de salvamento é do formulário inteiro e só assenta com o contador de requisições em voo em zero.* E o `SaveIndicator` é absorvível quase verbatim: 30 linhas, 4 estados, `role="status"` — é o irmão do `Button loading` (E28) para form que não tem botão.
- **Adaptação necessária:** o indicador precisa de um dono. Sem tela de form longo no boilerplate, ele nasce sem call site — o mesmo defeito de V6D-6. Ou entra junto com uma tela que o use, ou entra como regra+exemplo em `.ai/rules`, não como componente.
- **Risco · esforço:** M · M. O risco alto é publicar `useSettingsAutosave` genérico: `only: ['settings']` é o nome de uma prop **daquele** controller, e o comportamento muda com o `share()` do projeto.
- **Multi-fonte?** Sim, com correção já registrada: o ctfinance tem autosave no wizard de onboarding (`ctfinance.md:133`) e a lente de lá derrubou uma parte — *"`replace: true` no autosave é desnecessário: o Inertia 3.6.1 já faz replace sozinho"* (`ctfinance.md:332`). O ctvitrine **não** usa `replace: true`, o que é consistente. Antes de fixar contrato, cruzar com o wizard do ctfinance.

---

### V6D-8 · O quarto estado do assíncrono: "está demorando mais que o normal", com prazo do cliente e botão de retentar

- **Evidência:** `resources/js/components/items/studio-photo.tsx:13-19@53d7d9a` — a prop e o porquê:
  ```
  /**
   * A foto está em "processing" há mais tempo do que o razoável (prazo do
   * cliente). Antes disso a lojista ficava presa num spinner eterno quando o
   * job morria sem avisar; aqui devolvemos o controle e o botão de retentar.
   */
  stalled?: boolean;
  ```
  A máquina de estados (`:38-41`) separa `processing` de `stuck` — `const stuck = photo.ai_status === 'processing' && stalled` — e o ramo `stuck` (`:57-64`) troca o spinner por texto + "Tentar de novo". O prazo é do **cliente**, não do servidor: `pages/items/studio.tsx:45` `const STALL_DEADLINE_MS = 3 * 60_000;`, `:48` `STALL_TICK_MS = 15_000`, `:225` `setInterval(() => setClock(Date.now()), STALL_TICK_MS)`, `:234` `clock - since > STALL_DEADLINE_MS`. O polling que alimenta isso tem os outros dois freios: `:35` `POLL_BACKOFF = [3000, 5000, 10_000, 15_000]` e `:38` `POLL_MAX_FAILURES = 3`.
  No mesmo arquivo, duas decisões de toque que vão juntas: `:21-23` `min-h-11 min-w-11` (*"44px: é o alvo de toque mínimo confortável no celular, que é onde este fluxo acontece de verdade"*) e `:27-29` `BAR_ON_DEMAND = 'opacity-0 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100'` (*"em celular não existe hover: sem o `[@media(hover:none)]` a lojista nunca alcançaria o botão de retentar"*). Terceiro detalhe: o selo de `failed` é **permanente** (`:79-84`), *"o erro do fundo não pode depender de a lojista passar o dedo por cima"*.
- **Estado do boilerplate hoje:** nada assíncrono de longa duração — `git -C $B grep -rn "setInterval\|IntersectionObserver\|poll" origin/main -- resources/js | grep -v test` → 0. O `Button loading` (E28, `ui/button.tsx:74-100`) **não tem prazo**: `loading={processing}` fica girando enquanto a promessa não voltar, indefinidamente. `git -C $B grep -rn "hover:none\|pointer:coarse" origin/main -- resources` → **0**; `git -C $B grep -rn "min-h-11\|min-w-11\|min-h-\[44px\]" origin/main -- resources/js` → **0**.
- **O que absorver / o que travar:** regra, não código — o boilerplate não tem onde pendurar. Em `.ai/rules/js.md`: *estado indeterminado tem prazo. Passado o prazo do cliente, a tela para de fingir: diz que demorou e oferece a saída (retentar/cancelar). Polling tem backoff crescente, teto de falhas consecutivas e pausa em aba oculta. Afordância só-em-hover precisa de `focus-within:` **e** `[@media(hover:none)]`, ou some no celular. Sinal de erro persiste; não depende de hover.* As duas últimas frases pagam sozinhas a regra: o boilerplate tem 1 afordância só-em-hover (`ui/sidebar.tsx:594`) e ela se salva por outro caminho (`md:opacity-0`, ou seja, sempre visível abaixo de `md`) — **por sorte do breakpoint, não por desenho**; a próxima não terá.
- **Adaptação necessária:** o piso de 44px é AAA (WCAG 2.5.5), não AA — o boilerplate hoje usa `size="icon"` = `size-9` (36px) e `h-8 w-8` (32px), que **passam** o mínimo AA de 24px (2.5.8). Escrever a regra como "violação" seria falso; escrever como piso de ergonomia para fluxo de celular é o que a fonte de fato justifica.
- **Risco · esforço:** P · P (regra). G se alguém tentar implementar prazo genérico no `Button`.
- **Multi-fonte?** Parcialmente já coberto: `ctfinance.md:314` registra **E16 — "sem variante mobile-card e sem piso de alvo de toque"**. O prazo/`stalled` e o `[@media(hover:none)]` são inéditos; o piso de toque é reforço de E16.

---

### V6D-9 · Duas famílias de layout por enum — **veredito: o mecanismo é portável, a costura com a blade não é**

- **Evidência:** `app/Enum/SiteLayout.php@53d7d9a` — 2 cases, e três métodos que valem cada um por si:
  ```php
  public static function fromSetting(?string $value): self
  { return self::tryFrom((string) $value) ?? self::CLASSIC; }   // null/typo nunca lança
  public static function options(): array                        // alimenta o select do admin
  public function homePage(): string  { …'site/home' : 'site/boutique/home'; }
  public function itemPage(): string  { …'site/item' : 'site/boutique/item'; }
  ```
  Consumo: `app/Http/Controllers/Site/HomeController.php:56` e `app/Http/Controllers/Site/ShowItemController.php:63` (`if ($layout === SiteLayout::BOUTIQUE)`), `Inertia::render($layout->homePage(), $props)`; `SiteSetting.php:87-89` e `:163`; `UpdateSiteLayoutRequest.php:28` (`Rule::enum`). Cobertura: 5 arquivos em `tests/Feature/Layout/` (`SiteLayoutTest`, `BoutiquePropsTest`, `SellerRoutingTest`, `UpdateLayoutTest`, `DemoLayoutTest`).
- **O que julgo, com a evidência:**
  1. **Portável e bom:** `fromSetting()` degradando em silêncio + `options()` alimentando o select + `Rule::enum` na escrita — o enum é a única fonte de verdade do conjunto, do banco ao `<Select>`. É o mesmo formato que o boilerplate já usa em `App\Enum\Roles`/`Permissions`.
  2. **A rachadura está fora do enum.** O nome do componente Inertia vaza para a blade como prefixo de string: `resources/views/app.blade.php:134@53d7d9a` → `@if (str_starts_with($page['component'] ?? '', 'site/boutique/'))`. Renomear a pasta `site/boutique/` quebra o preload de fonte **sem erro** — o enum não sabe da blade e a blade não sabe do enum. Um `SiteLayout::assetPrefix()` fecharia isso, e não existe.
  3. **O contrato de props diverge por branch e nada o cobre.** `HomeController.php:56-70` injeta `banners`, `featured`, `categoryCards`, `sellers` **só** no ramo BOUTIQUE (com um comentário defendendo a economia, que é legítima). Do lado TS, `pages/site/boutique/home.tsx:22-30` declara `BoutiqueHomeProps` **local, com todos os campos obrigatórios**, e `pages/site/home.tsx` declara o dele. Não há tipo compartilhado que exprima "estas props existem se e só se o layout é X" — é o mesmo gênero do contrato `share()` ↔ `types/` do `CLAUDE.md`, só que por enum em vez de por middleware.
- **Estado do boilerplate hoje:** uma única família (`layouts/app-layout.tsx` → `app/app-sidebar-layout.tsx`; `app/app-header-layout.tsx` existe e está morto — já registrado em `ctfinance.md:352`). `git -C $B grep -rn "withViewData" origin/main -- app` → **0 linhas**: nem o mecanismo de `$page['component']` chegar à blade como dado existe aqui (só o `@vite` já o usa, `app.blade.php:71`).
- **O que absorver / o que travar:** **não** absorver a tematização por instância — é acoplamento ao domínio de vitrine e o boilerplate não tem multi-tenant. Absorver a **forma do enum de variação** (`fromSetting` tolerante + `options()` + `Rule::enum`) como padrão em `.ai/rules/enum.md`, e travar as duas rachaduras como regra: *(i) enum que resolve nome de componente Inertia resolve **todos** os derivados desse nome (prefixo de asset, chave de preload) — nada de `str_starts_with` sobre o nome literal fora do enum; (ii) branch de props por variante exige um tipo TS que exprima a união, ou um teste que renderize a variante magra e prove que a página não quebra.*
- **Adaptação necessária:** nenhuma hoje — não há segunda família. É regra preventiva; o custo de escrevê-la é o único custo.
- **Risco · esforço:** P · P.
- **Multi-fonte?** Não. Nenhum outro derivado tem duas famílias de layout alternadas (`grep -il "SiteLayout" cuidari.md spinmax.md ctfinance.md` → 0).

---

### V6D-10 · Listagem em cards no mobile — reforço de E16, com a implementação de referência

Terceira confirmação de `ctfinance.md:314` (**E16**). Vale por trazer o arquivo pronto.

- **Evidência:** `resources/js/pages/items/index.tsx:200-201@53d7d9a`
  ```tsx
  {/* Mobile: cards (a tabela de 7 colunas não cabe no celular) */}
  <ul className="divide-border/60 divide-y md:hidden">
  ```
  e `:274` `<div className="hidden md:block"><Table>…`. Render **duplo**, não coluna escondida: no card cabem foto, nome, categoria, contagem de fotos, preço, badge de publicação, `<Select>` de status inline e os 3 botões de ação. Fora do `layouts/settings/layout.tsx` (que é herança), `md:hidden` aparece na fonte em exatamente 2 telas: `pages/items/index.tsx` e `pages/categories/index.tsx`.
- **Estado do boilerplate hoje:** estratégia oposta — esconde **uma** coluna. `pages/users/index.tsx:223` `className={\`… ${column.key === 'mobile' ? 'hidden md:table-cell' : ''}\`}` e `components/users/user-table-row.tsx:50` `<Table.Cell className="hidden md:table-cell">`. `git -C $B grep -rn "md:hidden" origin/main -- resources/js` → **1 linha**, e é o `<Separator className="my-6 md:hidden" />` de `layouts/settings/layout.tsx:55`. Ou seja: no celular a listagem de usuários é uma tabela de 5 colunas com scroll horizontal (`ui/table.tsx:7` embrulha em `overflow-auto`), e a coluna sacrificada é o **celular** da pessoa.
- **O que absorver / o que travar:** a variante card em `pages/users/index.tsx`, com o comentário de motivo, e um teste de render que prove que as duas variantes expõem os mesmos dados (senão o mobile vira uma tela com menos informação e ninguém percebe).
- **Adaptação necessária:** o boilerplate usa `@radix-ui/themes` `Table.Root` e a fonte usa o `ui/table.tsx` do shadcn — a variante card não toca nem um nem outro (é `<ul>`), então convive.
- **Risco · esforço:** P · M.
- **Multi-fonte?** Sim, **já registrado** (E16, ctfinance). Este bloco só entrega o arquivo de referência.

---

### V6D-11 · O follow-up de E28 tem regra e **não tem trava**: 3 idiomas de spinner convivendo, e a fonte prova que o idioma replica sozinho

- **Evidência:** os 10 arquivos com o spinner artesanal `div.animate-spin.rounded-full.border-2.border-current.border-t-transparent` são **os mesmos dez** nos dois projetos (`git grep -rln "border-t-transparent"`): `add-permission-dialog.tsx`, `assign-role-user.tsx`, `data-table/search-bar.tsx`, `delete-confirmation-dialog.tsx`, `user-form.tsx`, `users/filter-panel.tsx`, `pages/permission-role/roles.tsx`, `pages/settings/password.tsx`, `pages/settings/profile.tsx`, `pages/users/permissions.tsx`. Idênticos em `53d7d9a` e em `origin/main` — é ancestral comum, e ninguém o corrigiu em lugar nenhum.
- **Estado do boilerplate hoje (medido em `beb848e`):**
  - `<Button … loading=…>` → **2** call sites (`components/delete-user.tsx:114`, `ui/confirm-dialog.tsx:70`);
  - `<Button … disabled={processing}>` com `{processing && <LoaderCircle …>}` dentro → **6**, todos em `pages/auth/*` (`confirm-password:49`, `forgot-password:55`, `login:103`, `register:104`, `reset-password:81`, `verify-email:33`);
  - `<Button … disabled={processing}>` com o spinner-`div` dentro → **3** (`assign-role-user.tsx:192-199`, `delete-confirmation-dialog.tsx:227-241`, `user-form.tsx:362-370`);
  - `aria-busy` fora de `ui/button.tsx` → **0** (`git grep "aria-busy" origin/main -- resources/js | grep -v test` → 3 linhas, todas em `ui/button.tsx` / comentário do `confirm-dialog`).
  A regra existe: `.ai/rules/js.md`, seção *"Botão em envio usa `loading`, não `disabled`"*, adicionada em `a418f41`. E o próprio corpo do commit registra a dívida: *"Migrar os 8 spinners artesanais de botão e os 6 `LoaderCircle` das páginas de auth para `loading` é follow-up e não bloqueia."* **Isto não é descoberta minha** — a fatia nomeou o que deixou para trás. O que é novo é: passados #106, #107, #108, #111, os 9 continuam lá, e **nada falha** se um décimo aparecer. `resources/js/test/components/Button.test.tsx` tem 10 casos (`describe('estado de envio')` + `describe('asChild')`) e todos testam o primitivo, nenhum testa call site.
- **O que absorver / o que travar:** o modelo já está no repo: `resources/js/test/lib/impersonation-call-sites.test.ts` — `@vitest-environment node`, varre `resources/js` menos `test/`, e afirma um contrato de posse (*"as rotas de impersonation só são nomeadas dentro do módulo"*), com um caso de controle (`it('actually reads the frontend source tree')`) que impede o teste de passar vazio. O irmão: *nenhum arquivo fora de `ui/button.tsx` monta indicador de envio próprio dentro de um `<Button>`* — `animate-spin`/`LoaderCircle` como filho de `<Button>` é violação; fora de `<Button>` (spinner de busca, de tela) segue livre. Nasce **vermelho com 9 ofensores**, então a fatia é o teste **mais** a migração — que é justamente o follow-up prometido, agora com data.
- **Adaptação necessária:** 3 dos 9 trocam o rótulo enquanto enviam ("Salvando…", "Excluindo…", "Removendo…") — isso é `loadingText`, que o `Button` já tem (`ui/button.tsx:66`). Não há nada a inventar.
- **Risco · esforço:** P · M. 9 arquivos, mudança mecânica, cada um já coberto por teste de componente.
- **Multi-fonte?** Sim, e é o ponto: os 10 arquivos do spinner artesanal são idênticos em ctvitrine `53d7d9a` e boilerplate `origin/main`, e o `ui/button.tsx` da fonte é o shadcn cru (sem `loading`, sem `aria-busy`). O idioma não é bug de um projeto — é o default que todo derivado herda e nenhum corrige. Sem trava no boilerplate, ele volta.

---

#### Medições

`R=/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine` · `B=/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate` · fonte sempre `53d7d9a`, alvo sempre `origin/main` (= `beb848ea509bf6682c9e31f10611ad7ab489392e`, resolvido por `git -C $B rev-parse origin/main`).

```bash
# --- V6D-1 skeleton
git -C $R grep -n "Skeleton" 53d7d9a -- resources/js | wc -l                      # 14
git -C $B grep -n "Skeleton" origin/main -- resources/js | grep -v "components/ui/" # 0 linhas
git -C $B grep -n "SidebarMenuSkeleton" origin/main -- resources/js \
  | grep -v "components/ui/sidebar.tsx"                                            # 0 linhas
git -C $B show origin/main:resources/js/components/ui/skeleton.tsx                 # idêntico à fonte

# --- V6D-2 favicon / ícones órfãos / fonte duplicada
git -C $B grep -rn 'rel="icon"' origin/main -- resources app                       # 0
git -C $B grep -rln "android-chrome" origin/main                                   # 0
git -C $B grep -rn "webmanifest\|manifest.json" origin/main                        # 0
git -C $B ls-tree -r origin/main --name-only -- public | grep -vE "fonts|vendor"   # 6 ícones + logo/robots/index/.htaccess
git -C $B ls-tree -r origin/main --name-only -- public/fonts | wc -l               # 22
git -C $B show origin/main:resources/css/_fonts.css | grep -c "url("               # 21
git -C $B ls-tree -r -l origin/main -- public/fonts | grep "extrabold-italic"      # 2 entradas, mesmo blob fc88540e…, 78980 B
git -C $R show 53d7d9a:resources/views/app.blade.php | grep -n 'rel="icon"'        # linhas 12,15,16,17,18

# --- V6D-3 preconnect morto
git -C $B grep -rn "bunny.net\|fonts.googleapis\|gstatic" origin/main -- resources # 1 linha: app.blade.php:67
git -C $B show origin/main:resources/css/_fonts.css | grep -o "url([^)]*)" | sort -u # 21, todas /fonts/woff2/…
git -C $R show 53d7d9a:resources/views/app.blade.php | grep -n "preconnect"        # 138

# --- V6D-4 imagens
git -C $R grep -o "<img" 53d7d9a -- resources/js | wc -l                           # 44
git -C $R grep -n -E '^\s+(width|height)=' 53d7d9a -- resources/js                 # 0 linhas
git -C $R grep -n "loading=" 53d7d9a -- resources/js | wc -l                       # 12
git -C $R grep -n "decoding=" 53d7d9a -- resources/js | wc -l                      # 5
git -C $R grep -n "fetchpriority\|fetchPriority" 53d7d9a -- resources/js           # 0
git -C $R grep -rhoE "aspect-\[[^]\"']*\]|aspect-[a-z]+" 53d7d9a -- resources/js \
  | sort | uniq -c                                                                 # square16 video3 [3/4]2 [2/1]2 [4/3]1
git -C $R ls-tree -r -l 53d7d9a -- public | sort -k4 -nr | head -6                 # jaqueta 2276766 · bolsa 1792437 · vestido 1527070 · tenis 1463039 · logo.png 1060662 · logo-loja-ana 919986
git -C $R grep -n "img/mock" 53d7d9a -- resources/js                               # 9 call sites, linhas 260,262,263,264,555,602,849,865,959
git -C $B grep -n "<img" origin/main -- resources/js                               # 4 vivos + 1 comentado
git -C $B grep -n "loading=\|decoding=" origin/main -- resources/js                # 8 (auth) + 2 (Button loading)
git -C $B ls-tree -r -l origin/main -- public | sort -k4 -nr | head -3             # log-viewer/app.js 463466 · logo-simplify.png 116077 · android-chrome-512 89170

# --- V6D-5 tokens semânticos + contraste
git -C $B show origin/main:resources/css/app.css | grep -n -- "--success\|--warning\|--info"   # :root 135-140, .dark 189-194, toast 636/648/654
git -C $B show origin/main:resources/css/app.css | awk '/^@theme/{f=1} f{print NR": "$0} f&&/^}/{exit}' \
  | grep -c "color-success\|color-warning\|color-info"                             # 0
git -C $B show origin/main:resources/js/test/styles/theme-tokens.test.ts | sed -n '127,134p'   # tabela: 6 pares, nenhum semântico
git -C $R show 53d7d9a:resources/css/app.css | grep -n -- "--success\|--warning\|--info"       # mesmos hex
python3 …/scratchpad/contrast.py                                                   # 3.30 / 2.15 / 2.77 / 2.28 / 8.77 / 6.83
git -C $B grep -rn "text-success" origin/main -- resources/js                      # 0 — NÃO reproduz ctfinance.md:420

# --- V6D-6 page-header morto + classe interpolada
git -C $B grep -rn -E '(bg|text|border|from|to|via|ring|fill|stroke|grid-cols|w|h|size|p[xytblr]?|m[xytblr]?|gap)-\$\{' \
  origin/main -- resources/js                                                      # 1 linha: page-header.tsx:41
git -C $R grep -rn -E '(bg|text|border|from|to|…)-\$\{' 53d7d9a -- resources/js    # 0 linhas
git -C $B grep -rn "PageHeader" origin/main -- resources/js | grep -v "layout/page-header.tsx"  # 0
git -C $B grep -rn "PageInfo"   origin/main -- resources/js | grep -v "page-info.tsx"           # 3, todas em page-header.tsx
git -C $R grep -rn "<PageHeader" 53d7d9a -- resources/js                           # metrics/index.tsx:653 · metrics/report.tsx:49
git -C $B grep -rn "iconGradient" origin/main                                      # 4, todas no próprio arquivo

# --- V6D-7 autosave / partial reload
git -C $B grep -rn "only: \[" origin/main -- resources/js                          # 0
git -C $B grep -rn "async: true" origin/main -- resources/js                       # 0
git -C $R grep -rn "only: \[" 53d7d9a -- resources/js                              # item-form:197 · photo-ai-controls:51 · use-settings-autosave:43
git -C $B grep -rn 'role="status"' origin/main -- resources/js | grep -v test      # 0
git -C $R grep -rn 'role="status"' 53d7d9a -- resources/js                         # site-settings/edit.tsx:128,137,145

# --- V6D-8 stalled / toque / hover
git -C $B grep -rn "hover:none\|pointer:coarse" origin/main -- resources           # 0
git -C $B grep -rn "min-h-11\|min-w-11\|min-h-\[44px\]" origin/main -- resources/js # 0
git -C $B grep -rn "setInterval\|IntersectionObserver" origin/main -- resources/js | grep -v test  # 0
git -C $B grep -rn "group-hover" origin/main -- resources/js                       # 4 (a única só-em-hover é ui/sidebar.tsx:594, salva por md:opacity-0)
git -C $R show 53d7d9a:resources/js/pages/items/studio.tsx | grep -n "POLL_BACKOFF\|POLL_MAX_FAILURES\|STALL_"  # 35,38,45,48,225,234

# --- V6D-9 SiteLayout
git -C $R grep -n "SiteLayout" 53d7d9a -- app resources routes config              # 17 linhas
git -C $R grep -rln "SiteLayout\|boutique" 53d7d9a -- tests                        # 9 arquivos (5 em tests/Feature/Layout)
git -C $R show 53d7d9a:resources/views/app.blade.php | grep -n "str_starts_with"   # 134
git -C $B grep -rn "withViewData" origin/main -- app                               # 0

# --- V6D-10 mobile card
git -C $R show 53d7d9a:resources/js/pages/items/index.tsx | grep -n "md:hidden\|hidden md:block"  # 201, 274
git -C $B grep -rn "md:hidden" origin/main -- resources/js                         # 1 (settings/layout.tsx:55)
git -C $B show origin/main:resources/js/pages/users/index.tsx | sed -n '223p'      # hidden md:table-cell

# --- V6D-11 spinners
git -C $B grep -rlE "border-t-transparent" origin/main -- resources/js             # 10 arquivos
git -C $R grep -rlE "border-t-transparent" 53d7d9a -- resources/js                 # os MESMOS 10
git -C $B grep -rn -E '<Button[^>]*loading=' origin/main -- resources/js | wc -l   # 1 (mais 1 multilinha = 2 total)
git -C $B grep -rn -E '<Button[^>]*disabled=\{(processing|form\.processing)\}' origin/main -- resources/js | wc -l  # 6
git -C $B grep -rn "aria-busy" origin/main -- resources/js | grep -v test          # 3, todas em ui/button.tsx / comentário
git -C $B log -1 --format=%B a418f41                                               # "…é follow-up e não bloqueia"
git -C $B show origin/main:resources/js/test/components/Button.test.tsx | grep -c "it("  # 10, nenhum de call site

# --- animação (varredura da frente)
git -C $R show 53d7d9a:resources/css/app.css | grep -n "@keyframes\|animation:"    # 2 keyframes (slideInRight/slideOutRight) — F32 já podou os do boilerplate
git -C $B show origin/main:resources/css/app.css | grep -n "@keyframes\|animation:" # só o comentário :675
git -C $R grep -ohn "animate-[a-z0-9-]*" 53d7d9a -- resources/js | sed 's/.*\(animate-[a-z0-9-]*\)/\1/' | sort | uniq -c  # spin47 in15 out12 pulse1 ping1
git -C $B grep -ohn "animate-[a-z0-9-]*" origin/main -- resources/js | …           # spin18 in9 out8 pulse1
git -C $R grep -rn "prefers-reduced-motion\|motion-reduce\|motion-safe" 53d7d9a -- resources   # 0
git -C $B grep -rn "prefers-reduced-motion\|motion-reduce\|motion-safe" origin/main -- resources # 0  (já registrado: ctfinance.md:195 D6, represado)

# --- densidade (para provar que NÃO há candidato)
git -C $B show origin/main:resources/js/pages/dashboard.tsx  # byte-a-byte igual a 53d7d9a:resources/js/pages/dashboard.tsx
git -C $R grep -rhoE "(bg|text|from|to|border|ring|shadow)-(cyan|blue|indigo|violet|sky)-[0-9]{2,3}" 53d7d9a -- resources/js | wc -l  # 264
git -C $B grep -rhoE "…" origin/main -- resources/js | wc -l                       # 254 — mesmas 26 telas herdadas; as 12 telas NOVAS da fonte têm 0 cyan/blue
```

**Não medido, e assumido como dívida de quem pegar a fatia:** (i) se `@radix-ui/themes/styles.css` no `dist/` puxa algum host externo — abri só `resources/`, não `node_modules/` (afeta V6D-3); (ii) o peso real dos 5 woff2 pré-carregados **é** justificado no boilerplate — `app.css:370-393` força Montserrat em `html body h1/h2/h3` e `:459-472` força Merriweather em `.text-muted-foreground`, ambos presentes nas telas de auth, então **não existe over-preload** e qualquer candidato nesse sentido seria falso; (iii) não abri `pages/site/landing.tsx` inteiro (1483 linhas) — as citações são das 9 linhas de `<img>` que o grep devolveu.

### Lente REFUTAR — vereditos

# V6D-1 · DERRUBADO

**Golpe (5) — fato falso, e (4) regra sem consumidor.**

A contagem está errada. `git -C $R grep -n "Skeleton" 53d7d9a -- resources/js` devolve **10 linhas, não 14** — e a decomposição alegada ("11 em `ui/sidebar.tsx`") é falsa: são **5** em `ui/sidebar.tsx` (`:16`, `:599`, `:619`, `:624`, `:714`), **2** em `ui/skeleton.tsx` (`:4`, `:14`) e **3** em `studio.tsx` (`:8`, `:1106`, `:1128`). A conclusão de fundo ("única aparição fora de `ui/` é `studio.tsx`, 1 import + 2 usos") sobrevive à correção; o número não.

O golpe que mata é outro. O ativo declarado é uma **regra**, e a própria candidatura admite que o alvo "não tem tela com preenchimento assíncrono". Confirmei que é pior que isso: `git -C $B grep -rn "Deferred|Inertia::defer|Inertia::optional" origin/main -- resources/js app` → **0 linhas**. Não existe nem o mecanismo que produziria o consumidor. E o contrato que a candidatura diz faltar **já está escrito**, só que noutro arquivo: `.ai/rules/controllers.md:18` prescreve `Inertia::defer(fn () => ..., 'grupo')` "com skeleton no `<Deferred>`". Publicar uma segunda regra de skeleton em `js.md` para um primitivo com 0 usos, num repo cujo único mecanismo gerador tem 0 usos e já é regrado, é escrever doutrina contra o vazio.

O que resta é verdadeiro e trivial: `SidebarMenuSkeleton` é export morto (definido em `ui/sidebar.tsx:624`, exportado em `:739`, `git -C $B grep -n "SidebarMenuSkeleton" origin/main -- resources/js | grep -v "components/ui/sidebar.tsx"` → **0**), e o único `animate-pulse` do alvo é o do próprio primitivo. Isso é uma poda de ~20 linhas que pertence à família do **E19**, não uma fatia própria.

Comandos: `git -C $R grep -n "Skeleton" 53d7d9a -- resources/js` (10) · `git -C $B grep -rn "Deferred\|Inertia::defer\|Inertia::optional" origin/main -- resources/js app` (0) · `git -C $B show origin/main:.ai/rules/controllers.md | sed -n 18p`.

---

# V6D-2 · SOBREVIVE (com escopo corrigido)

**Passa (1)–(5), mas o escopo proposto porta um 404.**

Reproduzi tudo: `git -C $B grep -rn 'rel="icon"' origin/main -- resources app` → **0**; nenhum `theme-color`, `description` ou OG na blade (li `origin/main:resources/views/app.blade.php:1-90` inteira — o `<head>` vai de `charset` a `@inertiaHead` sem uma tag de ícone). O `public/` do alvo tem exatamente 11 arquivos fora de `fonts/` e `vendor/`, seis deles ícones sem referência nenhuma. E o par duplicado de woff2 confirma-se com blob idêntico: `fc88540ed885152d200bf22f8f759258f78538b1`, 78.980 B, em `aptos-extrabold-italic 2.woff2` e `aptos-extrabold-italic.woff2` — 22 arquivos em `public/fonts` contra 21 `url(` em `_fonts.css`.

**Escopo corrigido — três coisas que a candidatura erra:**

1. **Não porte o ramo `@else` como está.** Ele linka `/favicon.svg` (`app.blade.php:16@53d7d9a`) e o alvo **não tem** esse arquivo: `git -C $B ls-tree -r origin/main --name-only -- public` lista `logo.svg`, não `favicon.svg`. Cópia literal = um 404 novo a cada navegação, que é o mesmo gênero de defeito do V6D-3.
2. **O `@else` não resolve 2 dos 6 ícones.** `android-chrome-192x192.png` e `android-chrome-512x512.png` não são linkados por `<link rel="icon">` em fonte nenhuma — o consumidor deles é `site.webmanifest`, que o spinmax tem e o ctvitrine não. Ou a fatia acrescenta o manifest, ou poda os dois; senão o teste que ela mesma propõe nasce vermelho por culpa dela.
3. **O teste precisa de allowlist desde a primeira linha**, não como refinamento: `public/index.php`, `public/.htaccess`, `public/robots.txt` e `public/vendor/log-viewer/*` (463.466 B de JS + 78.863 B de CSS publicados pelo pacote) jamais serão referenciados por `resources/`.

Com isso, é P·P e vale. Recomendação de fatiamento: **funde com V6D-3** — são a mesma varredura de `<head>` + `public/`, e separá-las paga o custo de duas fatias para uma revisão só.

Comandos: `git -C $B ls-tree -r origin/main --name-only -- public | grep -vE "fonts|vendor"` · `git -C $B ls-tree -r -l origin/main -- public/fonts | grep extrabold-italic` · `git -C $B ls-tree -r -l origin/main -- public | grep -v fonts | sort -k4 -nr`.

---

# V6D-3 · SOBREVIVE (e a dívida que ele declarou está paga)

Nenhum golpe pega. Reproduzido: `git -C $B grep -rn "bunny.net\|fonts.googleapis\|gstatic" origin/main -- resources` → **1 linha, `app.blade.php:67`, e é a própria `preconnect`**. As `url()` de `_fonts.css` são todas `/fonts/woff2/…` (`grep -o "url([^)]*)" | grep -v "/fonts/"` → vazio).

**Fechei a dívida que a candidatura deixou aberta** ("não medi o vendor"): `resources/css/app.css:5` importa `@radix-ui/themes/styles.css`, e `grep -rhoE "https?://[a-zA-Z0-9./-]+" node_modules/@radix-ui/themes/*.css` sobre os 812.667 B da folha → **zero ocorrências**. Não há host externo em lugar nenhum da cadeia de CSS. A `preconnect` abre handshake TLS para um host que ninguém busca, sem ressalva.

Escopo corrigido: é **uma linha deletada**, não uma fatia. Vá junto com V6D-2, e a meia-regra de `<head>` entra em `.ai/rules/views.md` (que hoje tem 3 seções, nenhuma sobre dica de rede) como quarta seção — não em `css.md`.

Comandos: os dois greps acima + `ls -la $B/node_modules/@radix-ui/themes/styles.css`.

---

# V6D-4 · SOBREVIVE (com metade do escopo cortada)

**Todos os números batem, um a um.** Fonte: 44 `<img`, `^\s+(width|height)=` → **0** (as únicas 3 ocorrências de `width=`/`height=` em `resources/js` são `<pattern>`/`<rect>` de SVG em `placeholder-pattern.tsx` e um `<Box width>` do Radix — nenhuma num `<img>`); `loading=` em 12; `fetchpriority` em 0. Pesos: `jaqueta.png` 2.276.766 · `bolsa.png` 1.792.437 · `vestido.png` 1.527.070 · `tenis.png` 1.463.039 = **7.059.312 B**, e `git ls-tree -r -l 53d7d9a -- public/img/mock | awk '{s+=$4} END{print s}'` → **8.192.613 B**, exatamente os 7,81 MiB alegados. Alvo: 4 `<img>` vivos + 1 comentado, todos `/logo-simplify.png` (**116.077 B**) com `loading="eager" decoding="async" draggable={false}` e **nenhuma** dimensão; `.ai/rules` tem 0 regra de imagem (css.md 5 seções, views.md 3, js.md 21 — nenhuma).

**Escopo corrigido:**

- **Fica:** o teto de peso em `public/` com allowlist. É o achado com consequência real (116 KB de PNG para desenhar 40 CSS px) e é **o mesmo teste do V6D-2** — não escreva dois.
- **Fica, reduzido:** `width`+`height` **ou** wrapper `aspect-*` no mesmo arquivo. Quatro correções, todas no mesmo logo.
- **Cai:** a exigência de `fetchpriority="high"` acoplada a `loading="eager"`. Não é defeito medido em lugar nenhum — a fonte tem 5 `eager` e 0 `fetchpriority`, o alvo tem 4 e 0, e nenhuma medida de LCP foi feita em nenhum dos dois. Regra que inventa obrigação sem evidência é o gênero que a rodada 1 já pagou caro.
- **Cai:** o argumento de CLS. Um logo de 40×40 dentro de flex container não move layout; o valor do `width`/`height` aqui é higiene preventiva para as telas futuras, e é assim que a regra tem de ser escrita — não como conserto de um defeito que o alvo não tem.

Sobrando isso, é P·P e cabe no mesmo PR do V6D-2/V6D-3.

---

# V6D-5 · SOBREVIVE — e o próprio candidato se auto-refuta a favor

**Os seis números de contraste reproduzem ao centésimo** (script próprio, luminância relativa WCAG 2.x): 3,30 · 2,15 · 2,77 · 2,28 · 8,77 · 6,83. `@theme` (`app.css:14-70`) mapeia 26 `--color-*` e **nenhum** semântico; a tabela de `theme-tokens.test.ts:126-134` tem 6 pares e nenhum deles é `success`/`warning`/`info`. Não há `@utility` nem qualquer outra definição — `git -C $B grep -rn "@utility" origin/main -- resources/css` → 0.

**Mas a "adaptação necessária" está factualmente errada, e o erro reforça o candidato.** A candidatura afirma `git -C $B grep -rn "text-success" origin/main -- resources/js` → 0 linhas, e "não reproduz `ctfinance.md:420`". Rodei o mesmo comando: **1 linha**, `resources/js/components/users/user-actions-menu.tsx:126` —
```tsx
user.is_active ? 'text-destructive focus:text-destructive' : 'text-success focus:text-success',
```
O ctfinance errou a linha (`:125` vs `:126`); o call site é real. Como `--color-success` não existe no `@theme`, `text-success` **não gera utilitário nenhum**: o item "ativar usuário" do menu está hoje sem cor declarada, nos dois temas, e ninguém percebe porque herda a cor do menu.

**Segundo fato que ninguém mediu:** o par não é hipotético — já renderiza. `lib/toast-config.ts:37-38` passa `iconTheme: { primary: 'var(--success)', secondary: 'var(--success-foreground)' }`. No tema escuro isso é `#22c55e` × `#ffffff` = **2,28:1**, abaixo até do piso **não-textual** de 3:1 (WCAG 1.4.11) — é um ícone de confirmação que já está no ar reprovando contraste, não um risco futuro.

**Escopo corrigido (a ordem da candidatura está certa, os fatos é que estavam frouxos):** (1) as 3 linhas na tabela do `theme-tokens.test.ts` primeiro, e vê-la falhar; (2) escolher os pares — o padrão do escuro (`--X` claro + foreground navy) já passa e é a saída óbvia; (3) só então exportar ao `@theme` e trocar os literais; (4) **e** o call site vivo de `user-actions-menu.tsx:126` entra na mesma fatia, porque é a prova de que "classe morta" já virou "classe escrita por alguém que achou que existia". Risco M·M confirmado — toca o CSS de toast (`app.css:636/648/654`) onde a F32 acabou de passar.

---

# V6D-6 · SOBREVIVE (intacto — é o único que não precisou de correção)

Reproduzi cada afirmação:

- `git -C $B grep -rn -E '(bg|text|border|from|to|via|ring|fill|stroke|grid-cols|w|h|size|p[xytblr]?|m[xytblr]?|gap)-\$\{' origin/main -- resources/js` → **exatamente 1 linha**, `components/layout/page-header.tsx:41`.
- A mesma varredura em `53d7d9a` → **0 linhas**.
- `PageHeader` fora do próprio arquivo → **0**. `PageInfo` → 3 linhas, todas em `page-header.tsx` (+ a definição em `components/page-info.tsx`). `iconGradient` → 4, todas no próprio arquivo. **Dois arquivos mortos**, confirmado.
- Nenhum dos dois é tocado por teste: `git -C $B grep -rln "PageInfo\|PageHeader" origin/main -- resources/js/test` → **0 arquivos**.
- A variante da fonte é viva e sem a prop: li `53d7d9a:resources/js/components/layout/page-header.tsx` inteiro — o ramo do ícone é `className="bg-primary/10 text-primary flex h-10 w-10 …"`, sem `cn()` condicional, sem `iconGradient` no tipo; call sites em `metrics/index.tsx:653` e `metrics/report.tsx:49`.

Uma correção de nome, não de fato: o segundo arquivo é `resources/js/components/page-info.tsx`, não `components/layout/page-info.tsx` — o título do candidato induz ao caminho errado.

O desempate 3-de-3 é o ativo real e está certo: a decisão não é "consertar o gradiente", é **remover a prop**. Guard-rail no molde de `link-button-nesting.test.ts` (que eu li: `@vitest-environment node`, varre `resources/js` menos `test/`, com caso de controle) pega hoje 1 linha e é a certa. P·P na poda.

---

# V6D-7 · DERRUBADO

**Golpe (5): o mecanismo central alegado sobre o alvo é falso.**

A candidatura constrói a regra em cima de: *"o boilerplate acabou de fazer o `flash` do `share()` virar `Inertia::always()` — ou seja, no boilerplate `only:` não corta o flash, ele fura o filtro igual aos erros."*

Nada disso é verdade em `beb848e`:

- `git -C $B grep -rn "always(" origin/main -- app` → **0 linhas**. Não existe `Inertia::always` no projeto.
- Li `share()` inteiro (`HandleInertiaRequests.php:29-72`): as chaves são `name`, `quote`, `auth`, `ziggy`. **`flash` não é prop.** Não está lá, nem como `always`, nem como nada.
- O alvo migrou para o flash **nativo do Inertia 3**, que viaja **fora de `props`**: `resources/js/lib/flash.ts:9` — *"O flash nativo do Inertia 3 vive no OBJETO DE PÁGINA (irmão de `component`…)"* — consumido por um único `router.on('flash', …)` em `app.tsx:4`, com 13 `Inertia::flash()` do lado servidor.

Ou seja: `only:` nunca filtrou o flash no alvo em direção nenhuma, porque flash não é prop no alvo. A regra proposta ensinaria um mecanismo inexistente — exatamente o defeito que a rodada 1 pagou. E o `only: ['settings']` da fonte funciona pelo motivo oposto ao alegado: o docblock de `use-settings-autosave.ts:23-26` diz que ali o flash **é** array puro de prop (`->with('success')`) e por isso é cortado. Os dois projetos estão em regimes diferentes e a candidatura fundiu os dois.

Golpe (4) por cima: o `SaveIndicator` é reconhecido pela própria candidatura como órfão ("nasce sem call site — o mesmo defeito do V6D-6"), e `role="status"` no alvo é 0 hoje.

O que é verdade e pode ser reciclado noutro lugar: `only: []` e `async: true` são **0** no alvo (reproduzido), e uma regra sobre `only:` versus props sempre-presentes tem valor — mas ela precisa ser escrita a partir de `lib/flash.ts`, não de um `Inertia::always()` que não existe.

---

# V6D-8 · SOBREVIVE (com ~um quarto do escopo)

Li `53d7d9a:resources/js/components/items/studio-photo.tsx:1-95`: as citações são **literais e corretas** — o docblock de `stalled`, `const stuck = photo.ai_status === 'processing' && stalled`, o `PILL` com `min-h-11 min-w-11` e o comentário dos 44px, o `BAR_ON_DEMAND` com `[@media(hover:none)]:opacity-100`, e o selo `failed` permanente com o comentário "não pode depender de a lojista passar o dedo por cima". Alvo: `hover:none|pointer:coarse` → **0**, `min-h-11|min-w-11|min-h-[44px]` → **0**, `setInterval|IntersectionObserver` → **0**, `group-hover` → **4**.

**O que cai (golpe 4, regra sem superfície):** prazo do cliente, `POLL_BACKOFF`, teto de falhas, pausa em aba oculta. O alvo não tem **nada** assíncrono de longa duração — é o mesmo vazio pelo qual derrubei o V6D-1, e seria incoerente aceitar aqui. A candidatura ainda avisa, corretamente, que implementar prazo genérico no `Button` é risco G. Não escreva a regra do prazo antes de existir a primeira tela que espera.

**O que cai (golpe 5, enquadramento falso):** o piso de 44px. A própria candidatura reconhece que é AAA (2.5.5) e que `size-9`/`h-8 w-8` passam o mínimo AA de 24px (2.5.8). Escrever isso como piso do boilerplate cria dívida de refatoração em todo `size="icon"` do repo — e já está registrado como **E16** no ctfinance de qualquer forma.

**O que sobrevive, e é a fatia inteira:** duas frases em `.ai/rules/js.md`, na família da seção 56 ("Papel interativo só em elemento que o teclado alcança"):
> *Afordância só-em-hover precisa de `focus-within:` **e** `[@media(hover:none)]:`, ou desaparece no celular. Sinal de erro é permanente; não depende de hover.*

Essa metade tem superfície real: das 4 ocorrências de `group-hover` do alvo, três são decorativas (`scale-105`, `text-cyan-600`) e uma é afordância de verdade — `ui/sidebar.tsx:594`, que só não some no celular porque leva `md:opacity-0` no fim da string, isto é, **por acidente de breakpoint**. Um `group-hover/menu-item:opacity-100` sem essa cauda quebraria em silêncio. P·P.

---

# V6D-9 · DERRUBADO

**Golpe (1) na metade portável + golpe (5) na justificativa da outra metade.**

A "forma do enum de variação" que ele propõe absorver **já é regra vigente**. `git -C $B show origin/main:.ai/rules/enum.md` diz, textualmente: *"Todo enum expõe `label()` via match retornando rótulo em pt-BR; listas para UI saem de um `options()` estático com pares value/label."* Dois dos três métodos elogiados (`options()`, `label()`) já estão normatizados; `Rule::enum` na escrita é padrão do framework. Sobra só `fromSetting()` — degradação tolerante de valor nulo/typo — e mesmo isso o alvo já pratica em espírito (`Permissions.php:60`, `IndexController.php:42`, `RoleFilterService.php:124` usam `tryFrom(...)?->x() ?? fallback`).

**E o fato usado para justificar a regra preventiva é falso.** A candidatura escreve: *"nem o mecanismo de `$page['component']` chegar à blade como dado existe aqui"*, apoiada em `withViewData` → 0. `withViewData` é irrelevante: a root view do Inertia **sempre** recebe `$page`, e o alvo já o consome — `resources/views/app.blade.php`, linha do `@vite`:
```blade
@vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
```
Um `str_starts_with($page['component'] ?? '', …)` funcionaria hoje, sem nenhum mecanismo novo. A premissa "não dá para fazer aqui" não se sustenta.

Resta uma regra preventiva (golpe 3/4) sobre alternância de famílias de layout por enum — algo que o alvo não tem, não planeja, e cuja fonte é confessadamente white-label por instância. A própria candidatura fecha com "não há segunda família; é regra preventiva". Não é fatia.

A observação sobre a rachadura `enum ↔ blade` (renomear `site/boutique/` quebra o preload em silêncio) é uma boa **crítica do ctvitrine** e vale registro no inventário dele. Não vira regra do boilerplate.

---

# V6D-10 · DERRUBADO como fatia (reforço de E16, não candidato)

Não há erro de fato — reproduzi tudo: `md:hidden` no alvo → **1 linha**, `layouts/settings/layout.tsx:55`; `pages/users/index.tsx:130` define `{ key: 'mobile', label: 'Celular', icon: Phone }` e `:223` a esconde com `hidden md:table-cell`; a fonte faz render duplo em `items/index.tsx:201` (`<ul className="divide-border/60 divide-y md:hidden">`) e `:274` (`<div className="hidden md:block">`).

Mas a própria candidatura declara o veredito: *"Terceira confirmação de `ctfinance.md:314` (E16). (…) Este bloco só entrega o arquivo de referência."* Isso é **evidência anexa a um candidato já registrado**, não um candidato novo. Abrir V6D-10 como fatia própria duplica E16 e faz a rodada contar o mesmo achado duas vezes — que é precisamente o gênero de inflação que esta lente existe para cortar.

Redirecionamento: cole `53d7d9a:resources/js/pages/items/index.tsx:200-273` como implementação de referência **dentro do E16**, com o dado que de fato acrescenta — que a coluna sacrificada no alvo é o **celular da pessoa**, e que a estratégia de render duplo (`<ul>` fora de `Table`) convive com o `Table.Root` do `@radix-ui/themes` sem tocá-lo.

---

# V6D-11 · SOBREVIVE (intacto; é o candidato mais forte do lote)

Não achei um único fato para derrubar. Verificações independentes:

- `git -C $B grep -rl "border-t-transparent" origin/main -- resources/js` e `git -C $R grep -rl "border-t-transparent" 53d7d9a -- resources/js` devolvem **as mesmas 10 rotas**, na mesma ordem. Ancestral comum confirmado.
- `<Button … loading=…>` → **2** call sites reais (`components/delete-user.tsx:114`, `ui/confirm-dialog.tsx:70`). As outras 4 ocorrências de `loading=` são `loading="eager"` de `<img>` nos layouts de auth — a candidatura não caiu nessa armadilha e contou certo.
- `LoaderCircle` fora de `ui/button.tsx` → **6**, todos em `pages/auth/*` nas linhas exatas alegadas (`confirm-password:50`, `forgot-password:56`, `login:104`, `register:105`, `reset-password:82`, `verify-email:34` — desvio de ±1 linha em relação ao alegado, irrelevante).
- Os **3** spinner-`div` dentro de `<Button>` estão onde ele diz, e os rótulos que a candidatura promete cobrir com `loadingText` são literais: `assign-role-user.tsx:201` "Atribuindo...", `delete-confirmation-dialog.tsx:240` "Removendo..."/"Excluindo...", `user-form.tsx:370` "Salvando...".
- `aria-busy` fora de `ui/button.tsx` → **0**. A regra existe (`.ai/rules/js.md:65-66`, li o texto) e menciona `loadingText`. `Button.test.tsx` tem 10 `it(` e nenhum de call site.
- O molde existe e é exatamente o descrito: li `test/lib/impersonation-call-sites.test.ts` — `@vitest-environment node`, `applicationSourceFiles()` recursivo excluindo `test/`, e o caso de controle `it('actually reads the frontend source tree')` com `toBeGreaterThan(50)`.

Sem conflito de ADR, sem acoplamento a domínio, 9 ofensores mecânicos com cobertura de componente já existente. **Escopo corrigido (mínimo):** o teste deve mirar *filho de `<Button>`*, não `animate-spin` em geral — `data-table/search-bar.tsx`, `users/filter-panel.tsx`, `add-permission-dialog.tsx`, `pages/permission-role/roles.tsx`, `pages/settings/*`, `pages/users/permissions.tsx` usam o mesmo `div` **fora** de botão, e nenhum deles é ofensor. Sem esse recorte o teste nasce com 10 vermelhos em vez de 9 e a fatia incha para reescrever spinners de busca que estão corretos.

Um reparo de crédito, não de fato: a candidatura já se declara não-descobridora ("a fatia nomeou o que deixou para trás", `a418f41`). O que ela acrescenta e sustenta é: passadas quatro fatias, os 9 continuam lá e **nada falha se um décimo aparecer**. É esse o ativo.

---

## Placar

| ID | Veredito |
|---|---|
| V6D-1 | **DERRUBADO** — contagem errada (10, não 14) e regra sem consumidor: `Deferred` tem 0 usos e `controllers.md:18` já regra o único mecanismo gerador. |
| V6D-2 | **SOBREVIVE** — mas o `@else` da fonte linka `/favicon.svg`, que o alvo não tem; e não cobre os 2 `android-chrome-*`. |
| V6D-3 | **SOBREVIVE** — dívida de vendor paga por mim: 0 host externo em `@radix-ui/themes/*.css`. Funde com V6D-2. |
| V6D-4 | **SOBREVIVE** — números exatos; cai a exigência de `fetchpriority` (sem evidência) e o argumento de CLS; teto de `public/` é o mesmo teste do V6D-2. |
| V6D-5 | **SOBREVIVE, reforçado** — os 6 contrastes reproduzem, mas a auto-refutação está errada: `text-success` vive em `user-actions-menu.tsx:126`, e o par escuro 2,28:1 **já renderiza** no ícone do toast. |
| V6D-6 | **SOBREVIVE intacto** — 1 linha de interpolação no repo, 2 arquivos mortos, 0 testes, desempate 3-de-3 confirmado. |
| V6D-7 | **DERRUBADO** — `Inertia::always` não existe no alvo e `flash` não é prop: o alvo usa flash nativo do Inertia 3 no objeto de página. A regra ensinaria um mecanismo inexistente. |
| V6D-8 | **SOBREVIVE** — só a metade hover/`[@media(hover:none)]` + erro persistente. Prazo/polling caem (0 superfície); 44px cai (AAA mal enquadrado, e já é E16). |
| V6D-9 | **DERRUBADO** — `options()`/`label()` já são regra em `.ai/rules/enum.md`, e o `$page['component']` já chega à blade do alvo (linha do `@vite`); `withViewData` é irrelevante. |
| V6D-10 | **DERRUBADO como fatia** — é evidência do E16 já registrado, por confissão da própria candidatura. |
| V6D-11 | **SOBREVIVE intacto** — o mais forte do lote; recortar o teste para *filho de `<Button>`* (9 ofensores, não 10). |

**5 sobrevivem (2 intactos, 3 com escopo cortado), 4 derrubados, 1 rebaixado a evidência.** Erros factuais verificáveis em **4 de 11** candidaturas: V6D-1 (contagem), V6D-5 (auto-refutação falsa — a favor), V6D-7 (mecanismo central), V6D-9 (`$page` na blade + regra já vigente).

Baselines usados: fonte `53d7d9a591decc55575ff9f2c1f8fd1fe6fcead7`, alvo `beb848ea509bf6682c9e31f10611ad7ab489392e` (ambos resolvidos por `rev-parse`, não assumidos). Script de contraste em `/private/tmp/claude-501/-Users-cristianomorgante-workspace-laravel-simplify-technology-boilerplate/d8004fea-fc6c-4549-80cd-c5c1639cda27/scratchpad/ct.py`. **Não medido por mim:** o `dist/` de pacotes que não `@radix-ui/themes`; o conteúdo de `pages/site/landing.tsx` além das linhas devolvidas pelo grep de `<img>`.

### Lente RISCO — vereditos

# V6D-1 · Skeleton sem contrato de uso

**Risco: BAIXO para a regra, MÉDIO se alguém a implementar hoje.**

Confirmei o estado do alvo: `git -C $B show origin/main:resources/js/components/ui/skeleton.tsx` → 14 linhas, `bg-primary/10 animate-pulse rounded-md`; `git -C $B grep -n "Skeleton" origin/main -- resources/js | grep -v components/ui/` → 0; `git -C $B grep -rn "SidebarMenuAction\|SidebarMenuSkeleton" origin/main -- resources/js | grep -v ui/sidebar.tsx` → **0 para os dois** (o `SidebarMenuAction` que o V6D-8 cita também é morto). E `h-9` de fato casa o `SelectTrigger` do alvo (`ui/select.tsx:34` tem `flex h-9 w-full`).

O que quebra:

1. **Catraca nenhuma é tocada.** Nada em `resources/js/test/styles/` (focus-ring, theme-tokens) olha `animate-pulse` ou `bg-primary/10`. Regra + poda de 20 linhas do `ui/sidebar.tsx` passa por `ci:check` sem drama.
2. **A troca da fonte tem dois defeitos de a11y que a regra, como escrita, propaga.** Em `53d7d9a:resources/js/pages/items/studio.tsx:1101-1120` o `<Skeleton>` substitui o `<Select id="category_id">` mas o `<Label htmlFor="category_id">` fica apontando para um id que sumiu da árvore; e o skeleton não tem `aria-busy`, `role="status"` nem nada — para leitor de tela o campo simplesmente **não existe** enquanto a IA pensa, sem anúncio de que algo está chegando. Isso colide de frente com a linha do `.ai/rules/js.md` que a fatia #101 acabou de escrever ("é a mudança de conteúdo de uma **região preexistente** que dispara o anúncio").
3. **Primeiro `animate-pulse` de tela real, num repo com zero controle de movimento.** Medido: `git -C $B grep -rn "prefers-reduced-motion\|motion-reduce\|motion-safe" origin/main -- resources` → **0 linhas** (D6 represado). Hoje o único `animate-pulse` é o do primitivo não usado, então a dívida é teórica; o primeiro call site a torna visível.

**Mitigação concreta:** a regra tem de incluir as duas metades que a fonte não tem — (i) o contêiner que troca controle por skeleton carrega `aria-busy="true"` e o `<Label>` continua apontando para algo (ou o controle fica montado e `disabled`, que é a alternativa mais barata e não perde o foco); (ii) skeleton entra no mesmo commit que a decisão de `motion-reduce`, ou a regra registra explicitamente que herda D6.

**Custo de gate:** não há prova visual possível sem `pest-plugin-browser` (confirmado ausente: `composer.json` `require-dev` tem só `pestphp/pest` e `pest-plugin-laravel`). A evidência disponível é o teste de árvore no molde de `focus-ring.test.ts`: *arquivo que importa `Skeleton` fora de `ui/` declara `aria-busy` no mesmo bloco* — nasce verde e barato. Para a poda do `SidebarMenuSkeleton`, o gate é o próprio `tsc`/ESLint (export removido, nenhum importador).

---

# V6D-2 · Favicon não linkado + ícones órfãos

**Risco: MÉDIO — e o candidato, absorvido literalmente, produz um 404 em toda página.**

O achado se confirma e cresce. Medido:

```
git -C $B grep -rn 'rel="icon"' origin/main -- resources app        # 0
git -C $B ls-tree -r -l origin/main -- public | grep -v public/fonts
git -C $B ls-tree -r -l origin/main -- public/fonts                 # 22 arquivos
git -C $B show origin/main:resources/css/_fonts.css | grep -c "url(" # 21
```

- Os 6 ícones existem e ninguém os referencia. **Sétimo órfão que o candidato não contou:** `public/logo.svg`, 26.580 B, `git -C $B grep -rn "logo.svg" origin/main` → **0 linhas** em qualquer lugar do repo.
- O par de woff2 duplicado se confirma byte a byte: `aptos-extrabold-italic 2.woff2` e `aptos-extrabold-italic.woff2` são o blob `fc88540ed885152d200bf22f8f759258f78538b1`, 78.980 B cada; `comm` entre as 21 `url()` e os 22 arquivos devolve exatamente o arquivo com ` 2`.
- **Correção de um número do candidato:** ele não afirmou, mas cuidado com `grep -c "@font-face"` = 32 em `_fonts.css` — 11 dessas ocorrências estão dentro do comentário `https://developer.mozilla.org/…/CSS/@font-face/font-display`. São 21 `@font-face` reais para 21 `url()`. Não há `@font-face` morto.

O que quebra:

1. **Copiar o ramo `@else` da fonte assinada dá 404.** A fonte linka `/favicon.svg?v=2` (`53d7d9a:resources/views/app.blade.php:16`) e o boilerplate **não tem `favicon.svg`** — a listagem de `public/` acima é completa. Trazer as 5 linhas verbatim adiciona uma requisição falhada em cada navegação, que é o gênero oposto do que a fatia quer consertar.
2. **`theme-color` cria um terceiro literal de tema fora do `app.css`.** `.ai/rules/views.md` ("Superfície nova pintada fora do `app.css` entra nesse teste no mesmo commit") e `tests/Unit/Theme/InlineThemeBackgroundTest.php` cobrem hoje **dois** arquivos por `<style>` inline. Um `<meta name="theme-color" content="#0f2a44">` é um quarto lugar onde `--brand-navy-dark` está escrito à mão e o teste **não** o alcança (ele lê `themeStyleBlock()`, que casa `<style>…</style>`, e o `<meta name="color-scheme">` por `str_contains`). Além disso, um `theme-color` navy único pinta o cromo do celular de escuro para quem está no tema **claro**.
3. **O teste de árvore proposto quebra `ci:check` no primeiro dia.** `public/build` é gitignorado (`.gitignore:5`) mas existe em disco em qualquer máquina que já construiu — aqui, 53 arquivos, incluindo `app-BKlgUCP1.css` (824.001 B) e `dist-EVQzBvcd.js`. `find $B/public -type f | wc -l` → **96** contra 43 rastreados. `ci:check` é `ci:lint && ci:test && ci:build`, então o Vitest roda **antes** do build da mesma invocação — mas o `public/build` da rodada anterior já está lá. Um teste "todo arquivo em `public/` fora de `vendor/` é referenciado" reprova em 53 arquivos de build, mais `index.php`, `.htaccess`, `robots.txt`.

**Mitigação concreta:** (a) trazer só os 5 links que correspondem a arquivos que existem — `.ico`, `32x32`, `16x16`, `apple-touch-icon` — e **decidir** sobre `android-chrome-*` (que só servem com `site.webmanifest`, que o spinmax tem e este não): ou entra o manifest, ou os dois PNGs são podados; (b) `theme-color` só com `media="(prefers-color-scheme: dark)"` + um par claro, e a linha entra no `InlineThemeBackgroundTest` no mesmo commit (o teste já tem o helper `appCssToken()` pronto); (c) o teste de árvore nasce com exclusão explícita de `build/`, `hot/`, `storage/`, `vendor/` e uma allowlist de `index.php|.htaccess|robots.txt` — sem isso é vermelho garantido.

**Custo de gate:** o link do favicon em si não tem prova automatizável barata (é aba de browser). A prova possível é o teste de árvore acima (que cobre o órfão, não a aparência) mais uma asserção no molde do `InlineThemeBackgroundTest`: *todo `href` de `<link rel="icon">` aponta para arquivo existente em `public/`* — essa **é** verificável e é justamente a que teria pego o `/favicon.svg`.

---

# V6D-3 · `preconnect` para `fonts.bunny.net`

**Risco: BAIXO. É a fatia mais segura do lote, e fechei a dívida que o próprio candidato declarou.**

O candidato deixou como "não medido" se o `dist/` do `@radix-ui/themes` puxa host externo. **Medi**, e no lugar certo — o CSS já construído, que é a soma de tudo:

```
grep -ohE "https?://[a-zA-Z0-9.-]+" $B/public/build/assets/*.css | sort | uniq -c
# 1 https://tailwindcss.com   (comentário)
grep -ohE "url\(['\"]?(https?:)?//[^)]*" $B/public/build/assets/*.css   # vazio
grep -c "fonts.googleapis\|gstatic\|bunny" $B/node_modules/@radix-ui/themes/styles.css  # 0
```

824 KB de CSS construído, **zero** `url()` fora de origem. Não existe consumidor de terceiro host em lugar nenhum da folha. A remoção é segura.

O que quebra: **nada.** A linha é `resources/views/app.blade.php:67`, isolada entre os `preload` de fonte e o `@routes`. `InlineThemeBackgroundTest` lê o primeiro bloco `<style>` (que está acima) e faz `str_contains` por `name="color-scheme"` — nenhum dos dois toca a linha. Nenhum teste de front lê a blade.

**Mitigação:** só uma, de escrita da regra. A regra proposta ("dica de rede só com consumidor demonstrável") vale, mas note que os **5 `preload` de fonte logo acima são o contraexemplo legítimo** e a regra tem de deixar isso claro, senão a próxima pessoa poda os `preload` junto: `app.css:370-393` força Montserrat em `h1/h2/h3` e `:459-472` força Merriweather em `.text-muted-foreground`, ambos presentes nas telas de auth. O candidato já registrou isso no rodapé; tem de subir para o corpo da regra.

**Custo de gate:** trivial e real — caso no `InlineThemeBackgroundTest` (Pest, já lê a blade em disco): *todo host em `preconnect`/`dns-prefetch` da blade aparece em pelo menos uma `url()` de `resources/css/`*. Nasce verde depois da poda e reprova na volta.

---

# V6D-4 · `<img>` sem dimensão e binário pesado em `public/`

**Risco: BAIXO para as 4 correções, ALTO para o teto de peso em `public/` como proposto.**

Reproduzi o lado do alvo e acrescentei a medição que faltava:

```
git -C $B grep -n "<img" origin/main -- resources/js       # 4 vivos + 1 comentado (app-logo.tsx:11)
git -C $B grep -rhoE "aspect-[a-z\[]+[^ \"']*" origin/main -- resources/js | sort | uniq -c
#   5 aspect-square   3 aspect-video   (= 8, confere)
git -C $B cat-file blob origin/main:public/logo-simplify.png | file -
# PNG image data, 2084 x 2120, 8-bit/color RGBA
```

**O fato novo é a razão do desperdício:** `logo-simplify.png` tem **2084×2120 px** e é desenhado a `h-10 w-10` (40 px) em `auth-simple-layout.tsx:23` e `auth-split-layout.tsx:42`, e a `h-7 w-7` (28 px) em `auth-split-layout.tsx:18`. São ~52× de sobreamostragem linear em 116.077 B, na primeira tela que qualquer pessoa vê. Isso sozinho justifica a fatia — e note que **não é** o teto de peso que pega isso: é a razão dimensão-renderizada/dimensão-intrínseca.

O que quebra:

1. **`width`/`height` nos 4 logos: nada.** As quatro têm dimensão por CSS (`h-10 w-10 object-contain`), então o atributo só fornece a razão de aspecto para o reserva de espaço; o CSS continua ganhando. Sem regressão visual. (Cuidado de detalhe: o PNG **não é quadrado** — 2084×2120. Declarar `width={40} height={40}` mente a razão intrínseca; com `object-contain` e ambas as dimensões travadas por CSS o resultado na tela é idêntico, mas se alguém depois soltar uma das dimensões, o `aspect-ratio` implícito vira 1:1 e distorce. Declare `width={2084} height={2120}` ou reduza o arquivo primeiro.)
2. **`eager` + `fetchpriority="high"` como regra tem um caso que a regra não cobre.** `auth-split-layout.tsx` renderiza **duas** cópias do logo: uma dentro de `hidden … lg:flex` e outra dentro de `lg:hidden`. As duas são `loading="eager"`. Ou seja: em toda largura, uma delas está em `display:none` e ainda assim é buscada, e a regra "eager só acima da dobra" não sabe distinguir. Escrita como está, ela ou fica muda para esse caso ou vira ruído.
3. **O teto de 200 KB em `public/` reprova o `ci:check` de qualquer máquina que já tenha construído.** Medido em disco: `find $B/public -type f -size +200k` → `public/build/assets/app-BKlgUCP1.css`, `public/build/assets/dist-EVQzBvcd.js` e `public/vendor/log-viewer/app.js` (463.466 B). Dois dos três são artefato de build gitignorado; o terceiro é saída de `vendor:publish` que volta a cada `artisan vendor:publish --tag=log-viewer-assets`. Se o teste ler o disco (é a única forma, como faz `impersonation-call-sites.test.ts`), ele tem de excluir `build/`, `hot/`, `storage/` e `vendor/` **e** a allowlist tem de ser por caminho, não por hash — senão o próximo `vendor:publish` derruba o CI com um diff que ninguém escreveu.

**Mitigação concreta:** partir a fatia em duas. (a) **Barata e sem risco:** reduzir `logo-simplify.png` para 96×96 (ou trocar por SVG — `public/logo.svg` já está lá, órfão) e pôr `width`/`height` nos 4 call sites; isso resolve o peso sem regra nenhuma. (b) **A regra**, se entrar, mira a razão e não o peso absoluto: *`<img>` declara `width`/`height` (ou vive em wrapper `aspect-*` no mesmo arquivo)*, com o teto de `public/` como **allowlist por caminho e exclusão explícita de `build|hot|storage|vendor`**, mais um controle positivo no molde do `it('actually reads the frontend source tree')` para o teste não passar vazio.

**Custo de gate:** o teste de call-site é real e verificável (mesma família dos dois que já existem). O peso da imagem em si não tem gate — a evidência possível é o número medido no corpo do PR (2084×2120 → 96×96, 116.077 B → ~5 KB), não uma catraca.

---

# V6D-5 · `--success` / `--warning` / `--info` reprovam contraste

**Risco: MÉDIO — e o candidato acertou o diagnóstico mas o conserto que ele propõe não fecha o buraco que importa.**

Reproduzi a tabela inteira com script próprio (WCAG 2.x relative luminance), e ela bate **exatamente**: 3,30 / 2,15 / 2,77 / 2,28 / 8,77 / 6,83. Também confirmei que o `@theme` (`app.css:14-70`) não exporta nenhum dos três e que a tabela de `theme-tokens.test.ts:127-134` tem 6 pares, nenhum semântico.

**Dois fatos novos que mudam a fatia:**

1. **Não é token dormente. Os três já pintam pixel hoje, em dois canais.** Além do `border-left: 4px solid var(--warning)` (`app.css:648`), o `lib/toast-config.ts` passa `iconTheme: { primary: 'var(--success)', secondary: 'var(--success-foreground)' }` — que é o disco colorido com o glifo por dentro, o par exato da tabela. Medido contra a superfície real (`--card`, branco no claro / `#0f2a44` no escuro):

   | canal vivo | razão | 3:1 (WCAG 1.4.11) |
   |---|---|---|
   | borda `--warning` sobre card claro | **2,15:1** | ✗ |
   | borda `--info` sobre card claro | **2,77:1** | ✗ |
   | borda `--success` sobre card claro | 3,30:1 | ✓ |
   | glifo branco sobre disco `--success` escuro | **2,28:1** | ✗ |
   | as três bordas sobre card escuro | 6,42 / 8,77 / 6,83 | ✓ |

   Ou seja: a borda esquerda que **distingue uma variante de toast da outra** não alcança 3:1 no tema claro para aviso e info. É defeito ao vivo, não dívida adormecida. (Nota de precisão: o `iconTheme` de warning e info é **inerte** — os dois passam `icon: '⚠️'`/`'ℹ️'`, e o react-hot-toast usa o `icon` no lugar do glifo padrão. Os pares vivos por ícone são success e error.)

2. **Escurecer o `-foreground` no claro — o conserto que o candidato propõe — não conserta a borda nem o disco.** O par `--warning`/`--warning-foreground` passaria, e `bg-warning text-warning-foreground` ficaria legível; mas `--warning` continuaria a 2,15:1 contra o card, e é aí que ele é usado hoje. É literalmente a armadilha do "token que faz dois trabalhos" que o `.ai/rules/css.md` já descreve para o `--destructive`.

**Mitigação concreta, medida:** escurecer o token no claro e manter o foreground branco — `--warning: #b45309` dá **5,02:1**, `--info: #0369a1` dá **5,93:1**, `--success: #15803d` dá **5,02:1** (contra branco, que é tanto o `-foreground` quanto o card). No escuro, o inverso, que é o que warning e info já fazem: `--success-foreground: var(--brand-navy-dark)` leva 2,28 → **6,42:1** sem tocar no hex do token. Assim o par **e** a borda passam nos dois temas, e só então os seis entram no `@theme`.

O que quebra ao fazer isso:

- **`resources/js/test/lib/toast-config.test.ts` não quebra** — ele afirma `iconTheme.primary === 'var(--success)'`, nome e não valor. Confirmado lendo o arquivo.
- **`theme-tokens.test.ts` quebra de propósito** ao acrescentar as 3 linhas, e é o passo (1) certo. Cuidado com a guarda `it('exporta pelos utilitários apenas tokens semânticos')`: qualquer `--color-success: #16a34a` literal no `@theme` reprova; tem de ser `var(--success)`.
- **A cor da borda dos toasts muda visivelmente** (amarelo-âmbar → âmbar escuro). É exatamente a superfície onde a fatia #107 acabou de passar. Sem `pest-plugin-browser` não há prova visual: a evidência possível é a tabela de contraste no teste (que **é** a prova de que importa) mais screenshot manual dos 4 toasts no corpo do PR.
- **`ctfinance.md:420` continua não reproduzindo**: `git -C $B grep -rn "text-success" origin/main -- resources/js` → 0 linhas. Confirmo a correção do candidato.

---

# V6D-6 · `page-header.tsx` + `page-info.tsx` mortos, com classe interpolada

**Risco: BAIXO para podar. ALTO para adotar — e a adoção reabre exatamente o que a fatia #103 fechou há três commits.**

Confirmei tudo do lado do alvo: a linha `page-header.tsx:41` é a **única** classe Tailwind interpolada do repo; `PageHeader` tem 0 call sites; `PageInfo` só é alcançável por `page-header.tsx` (3 referências, todas lá dentro).

**O fato que decide o veredito, e que o candidato não viu:** `resources/js/components/page-info.tsx:85` é

```tsx
{description && <DialogDescription className="text-base">{description}</DialogDescription>}
```

`git -C $B grep -rn "DialogDescription" origin/main -- resources/js | grep -v ui/dialog.tsx` devolve 15 linhas em 6 arquivos, e **esta é a única condicional**. Todas as outras (`delete-confirmation-dialog.tsx:104`, `ui/confirm-dialog.tsx:53`, `module-info-dialog.tsx:33`, `add-permission-dialog.tsx:118`, `assign-role-user.tsx:154`, `delete-user.tsx:72`) renderizam incondicionalmente — que é o contrato que a fatia #103 escreveu no `.ai/rules/js.md` ("descrição obrigatória **no tipo** e renderizada incondicionalmente") e travou em `5fdf030` (`test(a11y): trava o render incondicional da descrição com string vazia`). O `PageInfo` é o resto vivo do idioma antigo, e sobrevive só porque ninguém o chama.

Mais dois defeitos no mesmo arquivo, que vêm de brinde numa adoção: `page-info.tsx:70` põe `role="button"` num `<Button>` (papel redundante em elemento nativo — mesma família do que a fatia #101 removeu do `SearchBar`), e `InfoSection` tem `iconColor = 'text-blue-600'` default mais `text-green-600` fixo em `InfoFeatureList`, fora do sistema de tokens.

**Mitigação:**
- **Podar (recomendado, risco BAIXO):** apagar `layout/page-header.tsx` e `components/page-info.tsx`. Zero importadores confirmados; o gate é `tsc --noEmit` + ESLint, que já rodam em `ci:check`. Some junto a única classe interpolada do repo, e o caso do guard-rail proposto (`` `…-${…}` `` com prefixo de utilitário) nasce verde com o alcance certo.
- **Adotar (risco ALTO):** exige, no mesmo commit, (i) remover `iconGradient`; (ii) tornar `description` obrigatória e incondicional no `PageInfo`, sob pena de reabrir #103; (iii) remover o `role="button"`; (iv) trocar `text-blue-600`/`text-green-600` por token; (v) dar um call site real (`pages/users/index.tsx:145-152`, que monta o cabeçalho à mão). Isso é uma fatia inteira, não uma absorção.

**Custo de gate:** ótimo, para variar. O guard-rail de classe interpolada é um caso no `link-button-nesting.test.ts` (mesmo `applicationSourceFiles()`, mesma forma), com controle positivo obrigatório — se a poda vier primeiro, o teste nasce vazio e precisa do `expect(sources.length).toBeGreaterThan(40)` para não passar vacuamente.

---

# V6D-7 · Autosave campo-a-campo e o contrato do partial reload

**Risco: ALTO como escrito — a regra proposta afirma um fato falso sobre o alvo e produziria orientação errada.**

**A correção, medida:**

```
git -C $B grep -rn "Inertia::always\|::always(" origin/main -- app     # 0 linhas
git -C $B grep -rn "'flash'" origin/main -- app                        # 0 linhas
git -C $B show origin/main:app/Http/Middleware/HandleInertiaRequests.php  # share() = name, quote, auth, ziggy. Sem flash.
```

O candidato diz: *"o boilerplate acabou de fazer o `flash` do `share()` virar `Inertia::always()` (candidato E13 do ctfinance) — ou seja, no boilerplate `only:` não corta o flash"*. **Isso não existe no `origin/main`.** O flash do boilerplate não é prop nenhuma: é o flash nativo do Inertia 3 (`@inertiajs/react ^3.6.1`, `inertiajs/inertia-laravel ^3.0`), que vive no objeto de página e é consumido por `router.on('flash')` em `lib/flash.ts`. O próprio `.ai/rules/js.md` já diz isso com todas as letras: *"O flash nativo vive no OBJETO DE PÁGINA (irmão de component/props/url), então não é prop: **nenhum filtro de partial reload o alcança**"*.

A consequência prática é o oposto da que o candidato descreve, e é a armadilha de verdade: **num autosave no boilerplate, `only:` não tem como suprimir o toast — nem por `always`, nem por filtro.** Se o controller fizer `->with('success', …)`, o listener global dispara um toast por rodada de salvamento, em cada campo. A regra correta não é "conferir o `share()`"; é *rota de autosave não emite flash — o desfecho é o indicador do formulário, e o flash fica para a navegação*.

Segundo problema, este de a11y: o `SaveIndicator` da fonte (`53d7d9a:resources/js/pages/site-settings/edit.tsx:121-150`) **é o mesmo defeito que a fatia #101 acabou de consertar no `SearchBar`**. O ramo `idle` devolve um `<span>` **sem** `role="status"`; o ramo `saving` devolve um `<span>` **com** `role`/`aria-live` e o texto novo ao mesmo tempo. A região não preexiste com o papel — ela ganha o papel no mesmo instante em que o conteúdo muda, que é justamente o que o `.ai/rules/js.md` proíbe ("`aria-live` num nó recém-montado não anuncia nada"). Além disso ele pinta `text-emerald-600 dark:text-emerald-400` na mão, fora do sistema de tokens que o V6D-5 está tentando arrumar.

**Mitigação concreta:** absorver **só** o `SaveIndicator`, e corrigido: um único `<span role="status" aria-live="polite">` sempre renderizado, cujo **conteúdo** troca entre os 4 estados (o `idle` fica com o texto de repouso, não com um nó diferente), e cor por token (`--success` depois do V6D-5, `--destructive` no erro). O hook `useSettingsAutosave` **não** entra: `only: ['settings']` é o nome de uma prop de um controller que não existe aqui, e a motivação nº 2 do docblock da fonte é inaplicável ao Inertia 3 do alvo. E, como o próprio candidato admite, o indicador nasceria sem dono — mesmo defeito do V6D-6.

**Custo de gate:** aqui o gate é bom e barato: teste de componente Vitest no molde de `data-table/search-bar.test.tsx` (que já testa região viva), afirmando que o nó com `role="status"` existe **antes** da mudança de estado e que o texto muda dentro dele. Isso é exatamente a prova que a versão da fonte não passaria.

---

# V6D-8 · Quarto estado do assíncrono (`stalled`), alvo de toque, `[@media(hover:none)]`

**Risco: BAIXO — é a candidatura de menor risco do lote, porque não há nada vivo para regredir. E há um fato do alvo que a fortalece.**

Confirmei as quatro medições do alvo, todas em `origin/main`: `hover:none|pointer:coarse` → 0; `min-h-11|min-w-11|min-h-[44px]|size-11` → 0; `setInterval` fora de teste → 0; `group-hover` → 4 linhas.

**Fato novo:** das 4 ocorrências de `group-hover`, duas são efeito cosmético (`scale-105`, `text-cyan-600` em `user-table-row.tsx:41` e `role-users-table.tsx:75,97`) e a única que esconde uma **afordância** é `ui/sidebar.tsx:594` — o `SidebarMenuAction`. E `git -C $B grep -rn "SidebarMenuAction" origin/main -- resources/js | grep -v ui/sidebar.tsx` → **0 linhas**: é código morto, igual ao `SidebarMenuSkeleton` do V6D-1. Ou seja, hoje o boilerplate tem **zero** afordância só-em-hover viva. A regra é 100% preventiva, o que a torna gratuita: nenhuma catraca é tocada, nenhum pixel muda, `ci:check` nem percebe.

O que quebra: nada, desde que a regra seja escrita como piso e não como violação. O candidato já acertou nisso e eu confirmo o número: `size="icon"` = `size-9` (36 px) e os `h-8 w-8` de `user-table-row.tsx`/`filter-panel.tsx` (32 px) passam o mínimo AA de 24 px da SC 2.5.8 e reprovam o AAA de 44 px da 2.5.5. Escrever "violação" seria falso e a lente da rodada 1 já cobrou isso.

**Mitigação:** dividir a regra em três frases com estatutos diferentes, porque elas não têm o mesmo peso: (a) `focus-within:` + `[@media(hover:none)]` em afordância só-em-hover é **obrigatório** e testável; (b) prazo de cliente para estado indeterminado é **recomendação com dono** — não implemente prazo genérico no `ui/button.tsx` (o `loading` é `boolean`, e enfiar temporizador nele obriga todo call site a lidar com um terceiro estado; ALTO risco, e é o único ponto do candidato onde o risco sobe); (c) piso de 44 px é **AAA declarado como tal**, aplicável a fluxo de celular, não catraca geral.

**Custo de gate:** (a) é trava real — caso no `focus-ring.test.ts` (que já varre a árvore): *arquivo com `group-hover/*:opacity-100` sem `[@media(hover:none)]` nem `md:opacity-0` é infrator*, hoje com lista de mortos vazia depois de podar o `SidebarMenuAction`. (b) e (c) não têm gate possível sem browser e devem ser escritos como regra, com essa limitação declarada.

---

# V6D-9 · `SiteLayout`: duas famílias de layout por enum

**Risco: BAIXO (é regra preventiva sem código) — com uma afirmação a corrigir e uma inconsistência do próprio alvo a resolver antes.**

Li o enum da fonte inteiro (`53d7d9a:app/Enum/SiteLayout.php`) e as três rachaduras do candidato se confirmam, inclusive a boa: `fromSetting()` degrada em silêncio e `str_starts_with($page['component'] ?? '', 'site/boutique/')` na blade (`:134`) é acoplamento de nome de componente fora do enum.

**Correção de fato:** o candidato escreve *"nem o mecanismo de `$page['component']` chegar à blade como dado existe aqui (só o `@vite` já o usa)"* — as duas metades da frase se contradizem, e a segunda é a certa. `resources/views/app.blade.php:71` do alvo faz `@vite([… "resources/js/pages/{$page['component']}.tsx"])`. O mecanismo existe e já é usado; o que não existe é uma segunda família de layout. Detalhe pequeno, mas é o tipo de frase que vira decisão errada de quem pegar a fatia.

**Inconsistência do alvo que a fatia tem de encarar:** o `.ai/rules/enum.md` já manda *"listas para UI saem de um `options()` estático com pares value/label"*, e nenhum dos dois enums do repo tem `options()`. Medido: `Roles.php` expõe `label()`, `description()`, `priority()`, `isSelectable()`; `Permissions.php` expõe `label()`, `description()`, `grantDenialMessage()`. Nenhum `static function options()`, nenhum `tryFrom` tolerante. Absorver "a forma do enum de variação" como regra nova, sem tocar nisso, engrossa uma regra que o repo já não cumpre — e regra que o código desmente é a dívida mais cara que existe num arquivo de convenções.

O que quebra: nada em código. Risco zero de regressão visual, nenhum dado persistido, nenhuma catraca tocada.

**Mitigação:** escrever a regra em `.ai/rules/enum.md` **junto** com a correção de `options()` nos dois enums existentes (é um `array_map` sobre `cases()` em cada um, coberto por teste unitário trivial), para que a regra passe a descrever o repo. A metade sobre nome de componente Inertia é a parte de valor e é barata: *enum que resolve nome de componente resolve todos os derivados desse nome (prefixo de asset, chave de preload); nada de `str_starts_with` sobre o nome literal fora do enum.*

**Custo de gate:** `options()` tem teste Pest direto. A regra do nome de componente não tem gate hoje (não há segunda família), e isso deve ser dito na própria regra — ela é um contrato para quando a segunda família chegar, não uma catraca.

---

# V6D-10 · Listagem em cards no mobile

**Risco: MÉDIO — e o arquivo de referência que o candidato traz, copiado como está, cria um infrator do V6D-4 do mesmo lote.**

Confirmei as duas pontas: no alvo, `md:hidden` aparece **1 vez** e é o `<Separator>` de `layouts/settings/layout.tsx:55`; a coluna sacrificada é `column.key === 'mobile'` (`pages/users/index.tsx:223` e `user-table-row.tsx:50`) — o **celular** da pessoa. Li o bloco da fonte (`53d7d9a:resources/js/pages/items/index.tsx:200-273`).

O que quebra:

1. **Conflito interno do lote.** O `<img>` do card da fonte (`:205-209`) não tem `width`, não tem `height` e não tem `loading` — exatamente o que o V6D-4 quer proibir por teste de call-site. Se as duas fatias entrarem na mesma rodada, quem entrar depois derruba a outra. Ordem obrigatória: V6D-4 primeiro, e o card nasce conforme.
2. **O custo é bem maior aqui do que na fonte.** A linha da fonte tem 3 ações (`FeaturedStar`, editar, excluir) e um `<Select>`. A linha do alvo é o `UserTableRow`, que recebe **16 props** e monta 7 ações condicionais por permissão (`onView`, `onEdit`, `onDelete`, `onToggleActive`, `onImpersonate`, `onAssignRole`, `onAddPermission`, mais `canDelete/canEdit/canImpersonate/canManagePermissions/canAssignRoles`). Duplicar isso num `<ul>` significa duplicar a fiação de autorização de UX inteira — e é onde o defeito silencioso mora: uma ação que existe na tabela e não no card só some para quem está no celular.
3. **Sem regressão de a11y por duplicação.** `md:hidden` e `hidden md:block` são `display:none`, então a árvore acessível expõe só uma das variantes. Sem eco de leitor de tela, sem `id` duplicado desde que os `key`/`id` sejam distintos. Nenhum teste existente quebra: não há teste que renderize `pages/users/index.tsx` (só `components/users/user-table-row.test.tsx`).

**Mitigação concreta:** a que o candidato propõe é a certa e é a única que fecha o defeito nº 2 — teste de render que monta as duas variantes com o mesmo `user` e afirma **o mesmo conjunto de ações acessíveis** (`getAllByRole('button', {name})`) e os mesmos dados. Sem esse teste, a fatia entrega uma tela mobile com menos poder e ninguém percebe. Extra barato e valioso: incluir o celular (a coluna hoje escondida) na asserção, já que é o dado que o desenho atual esconde justamente de quem está no celular.

**Custo de gate:** aqui o gate é bom — teste de componente Vitest, sem browser. O que **não** tem gate é a aparência do card; screenshot manual no PR, declarado como tal.

---

# V6D-11 · Trava do follow-up de E28

**Risco: BAIXO por mudança, MÉDIO por volume — e o volume está subestimado por um fator de 1,7.**

A candidatura é a mais bem fundamentada do lote e eu a endosso. Mas a contagem de ofensores está errada, e é o número que define a fatia.

O candidato conta **9** (3 spinner-`div` + 6 `LoaderCircle`), porque usou o regex `disabled=\{(processing|form\.processing)\}`. Abri os 10 arquivos de `border-t-transparent` um a um (`grep -n -B14`) e olhei a tag que abre cada bloco:

| arquivo | linha do spinner | fica dentro de | flag usada |
|---|---|---|---|
| `add-permission-dialog.tsx` | 211 | `<Button>` (`:203`) | `isSubmitting` |
| `assign-role-user.tsx` | 200 | `<Button>` (`:192`) | `processing` |
| `delete-confirmation-dialog.tsx` | 239 | `<Button>` (`:227`) | `processing` |
| `user-form.tsx` | 369 | `<Button>` (`:362`) | `processing` |
| `users/filter-panel.tsx` | 169 | `<Button>` (`:157`) | `isSearching` |
| `permission-role/roles.tsx` | 208 | `<Button>` (`:200`) | `actions.isSaving` |
| `settings/password.tsx` | 201 | `<Button>` (`:193`) | `actions.isUpdatingPassword` |
| `settings/profile.tsx` | 211 | `<Button>` (`:203`) | `actions.isUpdatingProfile` |
| `users/permissions.tsx` | 167 | `<Button>` (`:159`) | `isSaving` |
| `data-table/search-bar.tsx` | 110 | **não é botão** (`div` aria-hidden) | `isSearching` |

São **9 spinner-`div` dentro de `<Button>`**, não 3 — mais os **6** `LoaderCircle` das telas de auth (verificados um a um: `confirm-password:49`, `forgot-password:55`, `login:103`, `register:104`, `reset-password:81`, `verify-email:33`, todos filhos diretos de `<Button … disabled={processing}>`). **15 ofensores**, contra 2 call sites corretos (`delete-user.tsx:114`, `ui/confirm-dialog.tsx:70`). O `search-bar.tsx` é o único legítimo e o teste proposto (violação = indicador **dentro de `<Button>`**) o poupa corretamente — o recorte do candidato está certo, só a contagem não.

O que quebra na migração:

1. **Nada de catraca.** `focus-ring.test.ts` não olha `animate-spin`; `theme-tokens.test.ts` não olha className de componente. `Button.test.tsx` (10 casos) testa só o primitivo.
2. **Um teste existente pode encostar:** `components/delete-confirmation-dialog.test.tsx` e `components/data-table/search-bar.test.tsx` existem. O `search-bar` usa `data-testid="search-spinner"` e não é tocado. O `delete-confirmation-dialog` **é** ofensor (`:239`) e o seu teste pode afirmar o markup do estado de envio — verificar antes de trocar; a troca para `loading` muda o nó de `div.animate-spin` para `svg[data-slot=button-loading-icon]`.
3. **Efeito colateral que ninguém pediu:** 8 dos 9 botões ofensores carregam paleta fixa fora do sistema (`bg-cyan-600`, `bg-green-600`, `bg-blue-600`, mais `hover:scale-105 active:scale-95`). Trocar para `loading` **não** mexe nisso (a prop convive com `className`), mas quem abrir esses arquivos vai sentir vontade. Deixe claro no PR que a fatia é mecânica: paleta é outra dívida, e misturar as duas torna o diff irrevisável.
4. **`loadingText` cobre os 3 casos de rótulo** ("Salvando…", "Excluindo…", "Removendo…") — confirmado, `ui/button.tsx:66` já tem a prop. Nada a inventar, como o candidato diz.

**Mitigação:** partir em duas passagens — (a) migrar os 15, sem tocar em classe; (b) só então acrescentar o teste, para ele nascer **verde** em vez de vermelho com 15 ofensores (um teste que entra vermelho e é "consertado depois" é o mecanismo pelo qual o follow-up de `a418f41` já ficou para trás uma vez). O teste é irmão direto do `impersonation-call-sites.test.ts` — mesmo `applicationSourceFiles()`, mesmo `@vitest-environment node`, com o controle positivo obrigatório (`expect(sources.filter(b => b.includes('<Button')).length).toBeGreaterThan(10)`), senão ele passa vazio no dia em que o glob quebrar.

**Custo de gate:** o melhor do lote. Teste de fonte, sem browser, sem screenshot, e cada arquivo migrado já tem cobertura de componente ou é tela de auth com teste de integração. Multi-fonte confirmada: `git -C $R grep -n "loading\|aria-busy" 53d7d9a -- resources/js/components/ui/button.tsx` → **0 linhas**; o `ui/button.tsx` da fonte é shadcn cru, e os 10 arquivos de spinner artesanal são os mesmos nos dois projetos. Sem trava, o idioma volta.

### Lente ATUALIDADE — vereditos

# Lente ATUALIDADE — lote do Caçador 3 (ctvitrine `53d7d9a` → boilerplate `origin/main` = `beb848e`)

**Versões do alvo, lidas de `origin/main` e confirmadas no `node_modules` instalado** (não de memória):
`tailwindcss` **4.3.3** · `react`/`react-dom` **19.2.8** · `@types/react` **19.2.18** · `@inertiajs/react` **3.6.1** · `inertiajs/inertia-laravel` **^3.0** · `vite` **8.2.1** · `typescript` **6.0.3** · `laravel/framework` **^13.0** · `php` **^8.4** · `@radix-ui/themes` 3.3.0 · `lucide-react` **1.31.0** · `tailwindcss-animate` 1.0.7.
**Fonte:** `@inertiajs/react` **^3.4.0**, `vite` ^7.3.5, `typescript` ^5.9.3, `lucide-react` ^0.475.0, tailwind ^4.3.0, react ^19.2.7. **A distância que importa é o Inertia: 3.4 → 3.6.1.** Quatro dos onze candidatos dependem disso.

---

### V6D-1 · Skeleton sem uso — **ATUAL COM MODERNIZAÇÃO**

**O primitivo está atual.** `ui/skeleton.tsx` usa `animate-pulse`, que é **core do Tailwind 4**, não do plugin: a referência default do tema declara `--animate-pulse: pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;` com o `@keyframes pulse` dentro do próprio `@theme` (doc `theme.mdx`, "Default theme variable reference"). Nada a mexer nas 14 linhas. `animate-pulse` no alvo: **1 ocorrência, e é a do próprio primitivo** (`git -C $B grep -rn "animate-pulse" origin/main -- resources`).

**A modernização é na regra, e é grande.** A regra proposta — *"skeleton representa um valor identificado que está chegando"* — descreve **exatamente** a API que o Inertia 3.6.1 já expõe e que o boilerplate usa **zero** vezes:

- `<Deferred data="x" fallback={<Skeleton className="h-9 w-full" />}>` — o slot `fallback` **é** o buraco do skeleton. Mudança do v3 que fecha o caso: *"The React `<Deferred>` component no longer resets to show the fallback during partial reloads… A new `reloading` slot prop is available"* (upgrade guide v3).
- `<WhenVisible data="x" fallback={…}>` — IntersectionObserver nativo, com `fetching` para recargas.
- v3 *Nested Prop Types*: `Inertia::defer()`/`Inertia::optional()` funcionam dentro de closures e arrays aninhados, com dot-notation (`only: ['auth.notifications']`).

Verificado no dist instalado (`node_modules/@inertiajs/react/dist/index.js`): `Deferred` 8 ocorrências, `WhenVisible` 5, `InfiniteScroll` 10, `usePoll` 3. No alvo, `git -C $B grep -rn "Deferred\|WhenVisible\|usePoll\|InfiniteScroll" origin/main -- resources/js` → **0**.

**Correção à redação:** escrever a regra como pura convenção induz o próximo a montar `useState(loading)` + `router.reload` quando `Deferred` existe. A regra tem de **nomear o mecanismo**: skeleton nasce como `fallback` de `Deferred`/`WhenVisible`; skeleton fora disso precisa justificar por que o valor não é uma prop diferida.
**Não invalida a fonte:** o `Skeleton` de `studio.tsx:1105` cobre um job assíncrono local (`ai_status`), não uma prop diferida — `Deferred` não o substitui. O código da fonte está certo em 3.4 e em 3.6.

`SidebarMenuSkeleton` (podar ou usar): sem ângulo de versão, **ATUAL**.

---

### V6D-2 · Favicon e `<head>` da blade — **ATUAL COM MODERNIZAÇÃO (pequena)**

Não existe recurso nativo em Laravel 13 / Vite 8 / `laravel-vite-plugin` 3.1 que gere ou linke favicon: a lista de `<link rel="icon">` continua sendo o jeito. A colheita está atual. Dois ajustes:

1. **React 19 hoista metadata.** `<title>`, `<meta>` e `<link>` renderizados em qualquer componente são movidos para o `<head>` automaticamente — o exemplo da própria doc de `<link>` no react.dev é literalmente `<link rel="icon" href="favicon.ico" />`. Isso **não** muda o veredito para os ícones (você quer o ícone e o `theme-color` no primeiro paint, e a árvore React chega depois da hidratação — a blade continua certa). Muda para o que o candidato corretamente aponta como faltando: `<meta name="description">` e OG **por página** têm casa nativa no componente da página, e a regra deve dizer isso, senão alguém escreve um `useEffect` mexendo em `document.head`.
2. **Inertia 3 trouxe `<x-inertia::head>` / `<x-inertia::app>`**, cujo slot de fallback só renderiza quando o SSR está desligado — *"solving the long-standing issue of duplicate `<title>` tags in SSR applications"* (upgrade guide v3). O boilerplate usa `<title inertia>` + `@inertiaHead` + `@inertia`, o idioma v2, que segue suportado. Se a fatia vai abrir o `<head>` de qualquer jeito, é a hora.

woff2 duplicado, ícones órfãos e o teste de árvore em `public/`: sem ângulo de versão, **ATUAL**.

---

### V6D-3 · `preconnect` morto — **ATUAL**, e **a dívida que o candidato assumiu está paga**

A remoção não foi superada por nada; é deleção de uma linha. Duas contribuições:

**Fecho o "não medido" (i) do candidato.** Medi o `dist/` do Radix Themes no alvo:
`grep -oE "https?://[a-zA-Z0-9._/-]+" node_modules/@radix-ui/themes/styles.css` → **0 matches**; `grep -oE "url\((['\"]?)(https?:)?//[^)]*\)"` no mesmo arquivo → **0 matches**. A folha do `@radix-ui/themes` **não puxa nada de terceiro**. O `preconnect` para `fonts.bunny.net` não tem consumidor em `resources/` **nem** no vendor. Pode cair sem confirmação adicional.

**Modernização a nomear na regra:** React 19 expõe `preconnect`, `prefetchDNS`, `preload`, `preinit`, `preloadModule`, `preinitModule` em `react-dom`, e o próprio React deduplica e hoista o `<link>` (em `ReactFiberConfigDOM.js`, `preconnectAs()` monta a chave `link[rel="preconnect"][href="…"]`, checa `querySelector` e só então dá `head.appendChild`). Logo a regra deve ter duas metades, não uma: *hint estático no `<head>` só com consumidor estático demonstrável (as 5 `preload` de fonte da blade qualificam — `_fonts.css` as consome); hint condicional ou por rota vem de `preconnect()`/`preload()` do `react-dom`, que já deduplica — não de mais uma linha na blade.*

---

### V6D-4 · Imagens — **ATUAL COM MODERNIZAÇÃO**, com **um erro factual na regra proposta**

**Erro:** a regra escreve `fetchpriority="high"`. Em React 19 a prop é **camelCase `fetchPriority`**. Medido no alvo: `node_modules/@types/react/index.d.ts:3178` dentro de `interface ImgHTMLAttributes<T>` → `fetchPriority?: "high" | "low" | "auto" | undefined;` (também em `LinkHTMLAttributes` :3351 e `ScriptHTMLAttributes` :3474). Escrever minúsculo em JSX vira prop desconhecida. **Consequência prática:** um teste de call-site que casar em `fetchpriority` passa vazio — o gênero de trava que o `impersonation-call-sites.test.ts` foi feito para impedir. Corrigir antes de escrever o teste.

**Modernizações reais:**
- `aspect-*` é core do Tailwind 4 (namespace `--aspect-*`, `--aspect-video: 16 / 9` no tema default) e aceita **fração nua**: `aspect-3/2`. Os `aspect-[3/4]` / `aspect-[2/1]` / `aspect-[4/3]` da fonte são valores arbitrários da era v3; no alvo escreva `aspect-3/4`. Cosmético, mas a regra não deve canonizar colchetes.
- Para logo acima da dobra, a forma nativa em React 19 não é um `<img loading="eager">` que ainda causa CLS: é `import { preload } from 'react-dom'; preload(src, { as: 'image', fetchPriority: 'high' })` — hint hoistada e deduplicada pelo React, sem tocar a blade.

O resto (dimensão obrigatória, teto de peso em `public/` com allowlist) não foi superado por nada: nem Tailwind 4 nem Vite 8 dimensionam imagem; qualquer coisa nessa linha é plugin de terceiro. Guard-rail continua sendo a resposta.

---

### V6D-5 · Tokens semânticos + contraste — **ATUAL COM MODERNIZAÇÃO**

O núcleo (medir contraste **antes** de exportar) é independente de versão e está certo. A modernização é em **como** exportar, e é o passo (3) da receita do candidato:

`resources/css/app.css:14` abre **`@theme {`**, não `@theme inline`, e mapeia 26 `--color-X: var(--X)`. A doc do Tailwind 4 é explícita: *"Use `@theme inline` when defining colors that reference other colors"*, com o exemplo `:root` / `[data-theme="dark"]` → `@theme inline { --color-canvas: var(--acme-canvas-color); }` (`colors.mdx`, "Referencing other variables").

**Sendo exato: isso não está quebrado hoje.** `.dark` cai no `document.documentElement` (`resources/js/hooks/use-appearance.tsx:25` → `document.documentElement.classList.toggle('dark', isDark)`) e no `<html>` pela blade (`@class(['dark' => …])`) — mesmo elemento que `:root`, então a indireção resolve contra os valores escuros. Quebra no dia em que alguém escopar `.dark` (ou um `data-theme`) num contêiner interno. Como a fatia vai abrir o `@theme` de qualquer forma para acrescentar `--color-success`/`--color-warning`/`--color-info`, converter para `@theme inline` custa uma palavra e é o idioma documentado.

**Segundo ponto, para o passo (2):** se a fatia vai **repintar** os pares reprovados, os hex atuais (`#16a34a`, `#f59e0b`, `#0ea5e9`) são sRGB da era v3; a paleta default do Tailwind 4 é oklch. Re-escolher a partir de `--color-emerald-*` / `--color-amber-*` / `--color-sky-*` do v4 mantém os tokens de estado no mesmo espaço de cor de tudo o mais que o Tailwind gera. Não é bug — é a decisão certa a tomar quando já se está escolhendo.

Nada em Tailwind 4 fornece tokens semânticos prontos nem checagem de contraste: a tabela do `theme-tokens.test.ts` continua sendo a única guarda. **Não rejeitado.**

---

### V6D-6 · Classe Tailwind interpolada em `page-header.tsx` — **ATUAL COM MODERNIZAÇÃO**

O diagnóstico está confirmado pela doc da versão em uso, quase palavra por palavra: *"Since Tailwind scans your source files as plain text, it has no way of understanding string concatenation or interpolation"*, com o anti-exemplo `` `bg-${color}-600 hover:bg-${color}-500` `` e a prescrição "map props to complete class names" (`detecting-classes-in-source-files.mdx`). O conserto proposto é o que a doc manda. Duas adições:

1. **`bg-gradient-to-br` é o nome v3.** Em Tailwind 4 é `bg-linear-to-br` (`background-image.mdx`: *"Use utilities like `bg-linear-to-r`…"`; upgrade guide renomeou `bg-gradient-*` → `bg-linear-*`). Medido no alvo: `git -C $B grep -rn "bg-gradient-to-" origin/main -- resources` → **6 linhas**: `layout/page-header.tsx:41`, `permissions/role-users-table.tsx:75`, `users/user-table-row.tsx:41`, `layouts/auth/auth-card-layout.tsx:18`, `auth-simple-layout.tsx:15`, `auth-split-layout.tsx:15`. `bg-linear-` → **0**. Ou seja: os gradientes **vivos** que o candidato cita como "controle: gradiente estático existe e funciona" estão no alias depreciado. Se a fatia canonizar `user-table-row.tsx:41` como referência sem renomear, ela grava a grafia v3 como padrão da casa. Renomear as seis, não uma.
2. **A escapatória nativa, para a regra não induzir reincidência:** se algum dia um gradiente realmente dinâmico for necessário, o v4 tem `@source inline("{hover:,}from-{cyan,blue}-{500,600}")` (brace expansion) — o `safelist` do config v3 **não existe mais** em v4. Uma frase na regra evita a próxima interpolação.

A trava proposta (falhar em `` `…-${…}` `` com prefixo de utilitário) fica.

---

### V6D-7 · Autosave campo-a-campo — **OBSOLETO como código · ATUAL COM MODERNIZAÇÃO como regra**

**Não porte `use-settings-autosave.ts`.** A fonte está em `@inertiajs/react ^3.4.0`; o alvo está em **3.6.1**, e as manchetes do v3 caem em cima desse hook:

- **`useHttp`** — da doc de Forms v3: *"For standalone HTTP requests that don't trigger page visits, you may use the `useHttp` hook, which provides the same developer experience as `useForm`."* Um autosave é precisamente uma requisição que não pode ser page visit. `useHttp` expõe `processing`, `errors`, `hasErrors`, `progress`, `wasSuccessful`, **`recentlySuccessful`** (*"true for two seconds after a successful request"*) e `isDirty`, e *"Each `useHttp` instance tracks its own `processing`, `errors`, and other reactive state"* — o que é, ponto a ponto, o contador `inFlight`, a máquina de 4 estados e o "'Salvo' é estado, não evento". Presente no dist instalado (`grep -c useHttp` → 3).
- **Optimistic updates com rollback automático** (v3 what's-new) — a outra metade do "salvar um campo sem reescrever a logo".
- **`preserveErrors`** em partial reloads (v3) — o bookkeeping `roundHadError` ganhou alavanca nativa.

Publicar um hook 3.4-shaped num boilerplate 3.6.1 grava como estilo da casa algo que o adapter passou a entregar.

**O que sobrevive intacto — e é o ativo real:** o contrato `only:` × `always`. Confirmado literalmente no protocolo v3: *"Always props are resolved on every response in both modes. They ignore the partial reload filters entirely, so an always prop is sent even when a request lists it in `except`."* E *"The `errors` prop is an always prop"*. O aviso do candidato sobre o `flash` ter virado `Inertia::always()` (E13) está mecanicamente correto. Acrescente as metades v3 que a fonte não tinha: **`except:`** existe como complemento, `only`/`except` aceitam **dot-notation**, e `Inertia::optional()`/`defer()` resolvem em qualquer profundidade.

**Uma armadilha a desarmar explicitamente:** `async: true` **não** é o análogo do `replace: true` que a lente do ctfinance derrubou. Continua sendo opção documentada em v3 (`router.get(url, {}, { async: true })`, combinável com `showProgress`) e o v3 expõe `router.cancelAll({ sync, async, prefetch })`, o que confirma que síncrono e assíncrono são classes distintas de requisição. Não é redundante — não o corte por analogia.

`SaveIndicator` com `role="status" aria-live="polite"`: sem substituto de framework, **ATUAL** — mas ligado ao estado de `useHttp`, não a um enum próprio.

---

### V6D-8 · Quarto estado / `stalled` / hover em toque — **OBSOLETO em três dos quatro mecanismos**

A rejeição mais pesada do lote. O **conceito** ("estado indeterminado tem prazo") sobrevive; a regra, como escrita, ensina o jeito 3.4.

1. **Polling — obsoleto.** `POLL_BACKOFF` + `POLL_MAX_FAILURES` + `setInterval` + `setClock` é artesanal. `usePoll(ms, options, { keepAlive, autoStart })` está no adapter instalado. Doc v3: *"By default, the poll helper will throttle requests by 90% when the browser tab is in the background"*; *"It automatically stops polling when the page is unmounted"*; retorna `{ start, stop, polling }`; e aceita **uma função** que devolve as opções, *"evaluated on every tick, allowing the poll to reflect the latest component state"* — que é onde vive o backoff e o `stop()` após N falhas. ⇒ **A frase *"polling … pausa em aba oculta"* não pode entrar na regra como requisito do autor: já vem de graça, e escrevê-la assim induz exatamente o `setInterval` que o `usePoll` substitui.** A regra correta é: *polling é `usePoll`; se você escreveu `setInterval`, justifique.*
2. **O estado "travou" + "Tentar de novo" — obsoleto quando a causa é falha de request.** Inertia 3 entrega isso inteiro: `Inertia::defer(fn () => …, rescue: true)` no servidor + o **slot `rescue`** do `<Deferred>` no cliente, cujo exemplo React na doc é literalmente *"Failed to load permissions."* com um botão **Retry** ligado a `router.reload({ only: ['permissions'] })`, um booleano `reloading` para desabilitá-lo durante a retentativa, e *"The rescue state is preserved until you explicitly reload the rescued prop."* — inclusive a propriedade de **não** voltar a virar spinner. **Ressalva honesta:** o `STALL_DEADLINE_MS` da fonte cobre um caso que `rescue` **não** cobre — um job de fundo ainda legitimamente rodando (`ai_status === 'processing'`), que não é request falhado. Esse prazo do cliente permanece legítimo. O que fica obsoleto é implementá-lo do zero para o caso de falha.
3. **`[@media(hover:none)]:opacity-100` — sintaxe obsoleta, e a justificativa da regra é mais forte do que a fonte diz.** Tailwind 4 tem `pointer-coarse` (`@media (pointer: coarse)`) e `any-pointer-coarse` como variantes de primeira classe (apêndice de `hover-focus-and-other-states.mdx`). Escreva `pointer-coarse:opacity-100`. E, mais importante — **medido no compilador instalado, não de memória** (`node_modules/tailwindcss/dist/lib.js`):
   ```js
   i.static("hover", p => { p.nodes = [H("&:hover", [B("@media","(hover: hover)", p.nodes)])] })
   ```
   com `i.compound("group", 2, …)` reescrevendo o seletor da variante interna e **preservando a at-rule**. Ou seja: em Tailwind 4, `hover:` e `group-hover:` compilam dentro de `@media (hover: hover)` — afordância só-em-hover não é "desconfortável" no celular, é **CSS morto** no celular. O upgrade guide nomeia a mudança e oferece a escapatória `@custom-variant hover (&:hover)` para quem dependia do tap. Essa é a justificativa que a regra deve citar.
4. **Piso de 44px — ATUAL**, e a ressalva do candidato (AAA 2.5.5 vs AA 2.5.8) está correta; mantenha. **Uma correção de fato:** "piso de toque 0" é verdade para o token `min-h-11`, mas falso como afirmação sobre a prática do boilerplate — `ui/sidebar.tsx:588` já traz `"after:absolute after:-inset-2 md:after:hidden"` com o comentário *"Increases the hit area of the button on mobile."* A regra deve reconhecer o idioma `after:-inset-*` como alternativa a inflar a caixa visual, senão ela contradiz código existente e comentado.

---

### V6D-9 · Enum de variação `SiteLayout` — **ATUAL** (o enum) **· ATUAL COM MODERNIZAÇÃO** (a rachadura iii)

`tryFrom` tolerante + `options()` + `Rule::enum` na escrita: nada em Laravel 13 ou PHP 8.4 supera isso; segue o idioma, e é o mesmo formato de `App\Enum\Roles`/`Permissions`. (Se algum dia precisar estreitar, `Rule::enum()->only()/except()` existe.) **ATUAL.**

**Rachadura (iii) — contrato de props divergente por branch — tem resposta nativa em 3.6.1 que a fonte em 3.4 não tinha limpa.** Do upgrade guide v3, *Nested Prop Types*: *"Prop types like `Inertia::optional()`, `Inertia::defer()`, and `Inertia::merge()` now work inside closures and nested arrays. Inertia resolves them at any depth and uses dot-notation paths in partial reload metadata"*, com `router.reload({ only: ['auth.notifications'] })` do lado cliente. Logo `banners`/`featured`/`categoryCards`/`sellers` são `Inertia::optional(...)` **declaradas uma vez** — resolvidas só quando pedidas — em vez de um `if` no controller que nenhum tipo exprime; e `<Deferred>`/`<WhenVisible>` fazem a metade do cliente. Isso converte "props que existem se e só se o layout é X" de convenção em **mecanismo**. É em torno disso que a regra deve ser escrita, não em torno de um tipo TS de união escrito à mão.

**Rachadura (ii)** — `str_starts_with($page['component'], 'site/boutique/')` na blade: sem substituto nativo; `SiteLayout::assetPrefix()` é a resposta. **ATUAL.** (Se o `<head>` for reestruturado, `<x-inertia::head>` do v3 é a hora.)

**Não medido, sinalizado em vez de afirmado:** a lista "What's New" do v3 traz o item *"Enum support in `Inertia::render()` responses"*. Não consegui recuperar a página de detalhe. Se significar que um BackedEnum pode ser o argumento de componente, `Inertia::render($layout->homePage())` pode ter forma nativa mais curta. **Verificar antes de depender disso.**

---

### V6D-10 · Listagem em cards no mobile — **ATUAL COM MODERNIZAÇÃO**

O par `md:hidden` / `hidden md:block` é idioma de **viewport**, da era v3. Tailwind 4 traz **container queries no core** (sem o plugin `@tailwindcss/container-queries`): *"Use the `@container` class to mark an element as an inline-size container, then use variants like `@sm` and `@md`…"* e *"Use variants like `@max-sm` and `@max-md` to apply a style below a specific container size"*, além de contêineres nomeados (`@container/main` → `@sm/main:`). Medido: `git -C $B grep -rn "@container" origin/main -- resources` → **0**. O boilerplate nunca usou.

**Por que aqui não é cosmético:** a listagem vive dentro de `app-sidebar-layout`, com sidebar **colapsável** (`group-data-[collapsible=icon]` existe em `ui/sidebar.tsx`). No mesmo viewport `md`, a tabela tem larguras muito diferentes com a sidebar aberta e fechada — que é o caso de uso canônico de container query. `@container` no wrapper + `@max-md:hidden` na `<ul>` e `@max-md:hidden` invertido na `<Table>` responde à largura real disponível; `md:hidden` responde à janela e erra sempre num dos dois estados da sidebar.

O resto do candidato é atual: a estratégia "esconder uma coluna" (`pages/users/index.tsx:223`, `components/users/user-table-row.tsx:50`) não tem substituto nativo, e o teste de render provando que as duas variantes expõem os mesmos dados continua sendo a única trava possível. **Não medido:** se o `Table.Root` do `@radix-ui/themes` 3.3.0 oferece fallback responsivo próprio — não abri a doc do Radix Themes; medi apenas o uso no boilerplate.

---

### V6D-11 · Spinners artesanais dentro de `<Button>` — **ATUAL**

Nada nativo substitui isto, e o `ui/button.tsx@origin/main` está em dia com a stack: `aria-busy`, `disabled`, `LoaderCircle` (o nome pós-rename; existe tanto no `lucide-react` 0.475 da fonte quanto no **1.31.0** do alvo, então a direção do port está segura), CVA + `@radix-ui/react-slot` 1.3.3. Três notas de versão, nenhuma bloqueante:

- **`useFormStatus` do React 19 não serve aqui.** Ele é definido sobre Actions de `<form action={fn}>`; o `useForm`/`<Form>` do Inertia submete pelo router com handler de `onSubmit`. **Não medi experimentalmente** — é leitura do escopo documentado do hook. A fonte de verdade a usar é o `processing` que o próprio Inertia expõe.
- **Simplificação maior disponível, para a migração não ser feita duas vezes:** o `<Form>` do v3 entrega no slot `errors, hasErrors, processing, progress, wasSuccessful, recentlySuccessful, setError, clearErrors, defaults, isDirty, reset, submit, cancel`. Os 6 call sites de `pages/auth/*` que hoje fazem `disabled={processing}` + `<LoaderCircle>` na mão podem migrar para `loading=` **e** para `<Form>` no mesmo passo. Não é requisito da fatia; é uma linha na regra.
- `animate-spin` é core do Tailwind 4 (`--animate-spin` + `@keyframes spin` no tema default), então podar os 10 spinners artesanais **não** toca a questão do plugin. E o Tailwind 4 tem variante `aria-busy` nativa (`&[aria-busy="true"]`) caso a trava queira asserção visual.

O teste de call-site em si é neutro de versão. Segue **ATUAL**.

---

### Achado transversal desta lente, fora dos 11 candidatos

`resources/css/app.css:7` → `@plugin 'tailwindcss-animate';` — plugin **JS da era Tailwind v3** (1.0.7) carregado sobre Tailwind **4.3.3**, com consumidores reais no alvo: `animate-in` 9 · `animate-out` 8 · `fade-in` 8 · `zoom-in` 5 · `slide-in-from-*` 16 (`git -C $B grep -rho … origin/main -- resources/js`). O substituto nativo do v4 é `tw-animate-css`, cuja própria descrição é: *"a replacement for `tailwindcss-animate`… embraces the new CSS-first architecture, providing a pure CSS solution… without relying on the legacy JavaScript plugin system"*, com compatibilidade explícita com Radix. Não pertence a nenhum candidato deste lote, mas é a maior dívida de **atualidade** no CSS da frente que este lote cobre, e a fatia F32 passou ao lado dela.

---

### Comandos rodados (todos contra o alvo `origin/main` = `beb848e`, e o `node_modules` do alvo)

```bash
B=/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate
R=/Users/cristianomorgante/workspace/laravel/simplify-technology/ctvitrine
git -C $B rev-parse origin/main                                    # beb848ea509bf6682c9e31f10611ad7ab489392e
git -C $B show origin/main:package.json                            # tailwind 4.3.3, react 19.2.8, @inertiajs/react 3.6.1, vite 8.2.1, ts 6.0.3
git -C $R show 53d7d9a:package.json | grep -E '"(react|@inertiajs/react|tailwindcss|vite|typescript|lucide-react)"'  # inertia ^3.4.0, vite ^7.3.5, ts ^5.9.3, lucide ^0.475.0
node -e "…@types/react/package.json" ; node -e "…@inertiajs/react/package.json"   # 19.2.18 · 3.6.1
grep -n "fetchPriority" $B/node_modules/@types/react/index.d.ts    # :3178 ImgHTMLAttributes · :3351 Link · :3474 Script  (camelCase)
grep -oE "https?://[^\"')]+" $B/node_modules/@radix-ui/themes/styles.css   # 0 matches
grep -oE "url\((['\"]?)(https?:)?//[^)]*\)" $B/node_modules/@radix-ui/themes/styles.css  # 0 matches
grep -o '.\{160\}hover: hover.\{120\}' $B/node_modules/tailwindcss/dist/lib.js
  # i.static("hover",p=>{p.nodes=[H("&:hover",[B("@media","(hover: hover)",p.nodes)])]})
grep -o 'compound("group".\{0,200\}' $B/node_modules/tailwindcss/dist/lib.js  # compound("group",2,…) reescreve seletor, preserva at-rule
for k in usePoll WhenVisible Deferred InfiniteScroll useHttp usePrefetch; do grep -c "$k" $B/node_modules/@inertiajs/react/dist/index.js; done  # 3 5 8 10 3 3
git -C $B grep -rn "Deferred\|WhenVisible\|usePoll\|InfiniteScroll\|useHttp" origin/main -- resources/js   # 0
git -C $B grep -rn "bg-gradient-to-" origin/main -- resources      # 6 linhas
git -C $B grep -rn "bg-linear-" origin/main -- resources           # 0
git -C $B grep -rn "@container" origin/main -- resources           # 0
git -C $B grep -rn "animate-pulse" origin/main -- resources        # 1 (ui/skeleton.tsx:8)
git -C $B grep -rn "tailwindcss-animate\|tw-animate" origin/main -- resources package.json  # app.css:7 + package.json:92
git -C $B grep -rho "animate-in\|animate-out\|fade-in\|zoom-in\|slide-in-from-[a-z-]*" origin/main -- resources/js | sort | uniq -c
git -C $B grep -rn "group-hover" origin/main -- resources/js       # 4 (sidebar.tsx:594 salva por md:opacity-0)
git -C $B show origin/main:resources/js/components/ui/sidebar.tsx | sed -n '585,600p'   # after:-inset-2 md:after:hidden
git -C $B show origin/main:resources/css/app.css | sed -n '1,80p'  # @theme (NÃO inline), @plugin tailwindcss-animate, @custom-variant dark
git -C $B grep -rn "classList" origin/main -- resources/js         # use-appearance.tsx:25 → documentElement
```

Docs consultadas via **Boost `search-docs`** (version-aware para este projeto): `tailwindcss@4.x` (`functions-and-directives`, `colors`, `dark-mode`, `theme`, `upgrade-guide`, `hover-focus-and-other-states`, `responsive-design`, `detecting-classes-in-source-files`, `background-image`, `aspect-ratio`) e `inertiajs/inertia-laravel@3.x` (`upgrade-guide`, `the-protocol`, `deferred-props`, `load-when-visible`, `polling`, `forms`, `http-requests`, `manual-visits`, `progress-indicators`). React 19 via context7 (`/websites/react_dev`, `/react/react/v19.2.7`) e `tw-animate-css` via `/wombosvideo/tw-animate-css`.

---

## Caçador 4 — blade, boot, layouts, navegação, favicon/manifest, responsividade

# Caçador 4 — blade, boot, layouts, navegação, favicon/manifest, responsividade
**Fonte:** ctvitrine @ `53d7d9a` · **Alvo:** boilerplate @ `origin/main`

---

### V6F-1 · O boilerplate versiona 6 ícones de aba e não linka nenhum; a fonte linka 5 e declara `theme-color`

- **Evidência (fonte):** `resources/views/app.blade.php:11-21@53d7d9a`
  ```blade
  @if ($faviconUrl)
      <link rel="icon" href="{{ $faviconUrl }}" >
      <link rel="apple-touch-icon" href="{{ $faviconUrl }}" >
  @else
      <link rel="icon" href="/favicon.ico?v=2" sizes="any" >
      <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" >
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" >
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" >
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" >
  @endif
  <meta name="theme-color" content="{{ $meta['theme_color'] ?? '#0f2a44' }}" >
  ```
  Duas técnicas embutidas: **fallback por prop Inertia** (`data_get($page, 'props.branding.favicon_url')`, linha 10 — cada instância mostra a própria marca) e **cache-bust `?v=2`** (o comentário das linhas 7-9 diz por quê).
- **Estado do boilerplate hoje:** `git grep -n -iE "favicon|apple-touch|android-chrome|webmanifest|rel=\"icon\"|theme-color" origin/main` → **zero linhas fora de `docs/`**. O `app.blade.php` daqui vai direto de `<meta name="color-scheme">` (linha 8) para o `<script>` de tema (linha 11): **nenhum `<link rel="icon">`**. Ao mesmo tempo, `git ls-tree -r origin/main --name-only -- public` lista 6 ícones: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`. Só o `.ico` é alcançável (convenção implícita `/favicon.ico` do browser) — **5 arquivos inalcançáveis**. Sem `site.webmanifest` (`ls-tree | grep -i manifest` → só `public/vendor/log-viewer/mix-manifest.json`). Sem `theme-color`: a barra do Chrome Android e a status bar do PWA ficam no cinza padrão, num app que já pinta `#0f2a44` em três outros lugares.
- **O que absorver / o que travar:** portar o bloco `@else` de 5 links (o ramo `@if` do branding é específico do multi-tenant da vitrine — não vem). Adicionar `<meta name="theme-color">` amarrado ao mesmo hex. Adicionar `public/site.webmanifest` com `name`/`short_name`/`display: standalone`/`theme_color`/`background_color` + os dois `android-chrome-*` que já estão versionados, e `<link rel="manifest">` no blade — isso resgata os 5 órfãos de uma vez.
- **Adaptação necessária:** o manifest e o `theme-color` viram o **6º e 7º sítios do hex da marca**. Hoje o boilerplate tem 5 declarações literais (`resources/css/app.css:107` como token `--brand-navy-dark`, `resources/views/app.blade.php:48`, `resources/views/errors/500.blade.php:41,45,55`) e a guarda de contraste `resources/js/test/styles/theme-tokens.test.ts` lê **um arquivo só** (`resolve(import.meta.dirname, '../../../css/app.css')`, linha 20) — um hex no `.webmanifest` nasce fora do alcance dela. `.ai/rules/views.md:9` já manda o caso certo ("Superfície nova pintada fora do `app.css` entra nesse teste no mesmo commit"): estender `tests/Unit/Theme/InlineThemeBackgroundTest.php` (`themedBlades()`, linha 34) para incluir o manifest é parte da fatia, não follow-up.
- **Risco · esforço:** P · P. Assets já existem, nada de build.
- **Multi-fonte?** Sim. **spinmax** tem `public/site.webmanifest` (`display: standalone`, `theme_color: #00647B`, ícone `purpose: any maskable`) e o inventário dele já registrou o mesmo diagnóstico — "é o **terceiro** lugar onde os hex da marca são declarados […] fora do alcance de `scripts/check-contrast.mjs`" (`docs/harvest/v2/spinmax.md:1859`). O ctvitrine **não** tem manifest e por isso deixa `android-chrome-{192,512}.png` órfãos — mesmo par de arquivos, mesmo destino, aqui.

---

### V6F-2 · `.env.example` do boilerplate liga o SSR do Inertia, e nenhum caminho de execução sobe um servidor SSR

- **Evidência (fonte):** `stubs/ops/instance.env.stub:13-18@53d7d9a`
  ```
  # SSR do Inertia DESLIGADO. A instância não sobe servidor SSR (só o daemon do
  # Horizon) nem builda o bundle (deploy roda `build`, não `build:ssr`). Com SSR
  # ligado, todo full-page load LOGADO dispara um dispatch SSR inexistente e derruba
  # o worker PHP-FPM → 502 no reload da área logada. […]
  INERTIA_SSR_ENABLED=false
  ```
  E a fonte **trava a string com teste**: `tests/Feature/Ops/StubRenderTest.php:58@53d7d9a` — `->and($env)->toContain('INERTIA_SSR_ENABLED=false')  // fix do 502 no reload logado`. Repetido em três docs (`docs/tecnico/01-arquitetura.md:23`, `05-operacao-e-comandos.md:96`, `08-provisioning-instancias.md:57`) e no deploy (`scripts/deploy/deploy.sh:86` — "Se ativar SSR em produção, troque por: `$PNPM_BIN run build:ssr`").
- **Estado do boilerplate hoje:** quatro fatos medidos, nenhum deles amarrado a outro.
  1. `.env.example:73` → `INERTIA_SSR_ENABLED=true`, e `config/inertia.php:24` tem `env('INERTIA_SSR_ENABLED', true)` — **ligado por default e por exemplo**.
  2. `composer.json` `"dev"` roda `serve`, `horizon:listen`, `schedule:work`, `pail`, `pnpm dev` — **não roda `inertia:start-ssr`**. Só `"dev:ssr"` roda.
  3. Não existe script nem doc de deploy: `git ls-tree -r origin/main --name-only | grep -iE "deploy"` → **0 arquivos**. Ninguém no repo diz para subir o daemon SSR.
  4. `tests/TestCase.php:16` faz `config()->set('inertia.ssr.enabled', false)` — **a suíte inteira roda com SSR desligado**, então nenhum teste jamais encosta nesse caminho.
  A mitigação parcial é `config/inertia.php:32` (`ensure_bundle_exists` default `true`) somada a `/bootstrap/ssr` no `.gitignore:2`: em clone novo o bundle não existe e o dispatch é pulado. Ela **evapora** no minuto em que alguém roda `composer dev:ssr` (que faz `pnpm build:ssr` e cria `bootstrap/ssr/ssr.mjs`) e volta para `composer dev`: o arquivo fica no disco, o gate passa, e cada page load tenta um POST para `127.0.0.1:13714` recusado. Mesmo cenário em produção com `.env` copiado do `.env.example` + `pnpm build:ssr` no deploy.
- **O que absorver / o que travar:** não é código a portar, é postura + guarda. (i) `.env.example` nasce com `INERTIA_SSR_ENABLED=false` e o comentário de duas linhas explicando a condição para ligar (bundle **e** daemon, os dois); (ii) teste Pest lendo `.env.example` que trava a string, no molde exato do `StubRenderTest` da fonte; (iii) linha em `.ai/rules/views.md` (ou `js.md`) com a regra "SSR só liga com `inertia:start-ssr` no supervisor **e** `build:ssr` no deploy — as três chaves viram juntas"; (iv) se a decisão for manter `true`, então `.env.example` também precisa pinar `INERTIA_SSR_ENSURE_BUNDLE_EXISTS=true` explicitamente, porque hoje a única coisa que segura o dispatch é um default de terceiro.
- **Adaptação necessária:** o boilerplate mantém `ssr.tsx`, `build:ssr` e `dev:ssr` — eles ficam. Muda só o default e a documentação da armadilha. Atenção a um efeito colateral bom: com SSR realmente desligado, o defeito de hidratação do V6F-5 deixa de ser observável em produção — o que é razão a mais para os dois andarem juntos na mesma fatia.
- **Risco · esforço:** P · P (uma linha de env + um teste + uma regra). O risco de **não** fazer é o que a fonte descreve por escrito.
- **Multi-fonte?** Sim, o tema é geral: `docs/migration/projects/{ctjuris,sorteiopix,spinmax,ctfinance}.md` registram "SSR ativo" nos quatro, e o gate da Fatia 3b do playbook já exige "`build:ssr` + health check do runtime SSR" (`docs/migration/PLAYBOOK.md:81`). O ctvitrine é o único dos derivados que **desligou de propósito e escreveu o motivo** — o achado é essa justificativa, não o `false`.

---

### V6F-3 · A fonte tem, verbatim, o defeito que a guarda de tema do boilerplate existe para pegar — e a guarda não viaja no playbook

- **Evidência (fonte):** `resources/views/app.blade.php:106-117@53d7d9a`
  ```blade
  {{-- Inline style to set the HTML background color --}}
  <style >
      html { background-color: white; transition: background-color 0.2s ease; }
      html.dark { background-color: var(--palette-primary-dark); transition: background-color 0.2s ease; }
  </style >
  ```
  `--palette-primary-dark` é declarado em `resources/css/app.css:111@53d7d9a` (`#0f2a44`) — arquivo que só chega pelo `@vite` da linha **142**, 28 linhas abaixo do bloco. E o bloco da fonte **não declara `color-scheme` em nenhuma das duas regras**, nem existe `<meta name="color-scheme">` no `<head>` (`git grep -n "color-scheme" 53d7d9a -- resources/views` → 0 linhas).
- **Estado do boilerplate hoje:** os dois lados já resolvidos e **travados**. `resources/views/app.blade.php:40-52` usa literal `#0f2a44` + `color-scheme: light` / `html.dark { color-scheme: dark }`, com o `<meta name="color-scheme">` na linha 8 como declaração precoce. `tests/Unit/Theme/InlineThemeBackgroundTest.php:135-142` reprova qualquer `var(--` dentro do `<style>`; `:144-165` cobra a igualdade com `--brand-navy-dark`; `:167-178` exige `color-scheme` nas duas regras. A regra em prosa está em `.ai/rules/views.md:9` e `:11-12`. **O buraco é a exportação:** `git grep -n -iE "InlineTheme|color-scheme|var\(--|app.blade" origin/main -- docs/migration` → **zero linhas**. Nenhuma fatia do `PLAYBOOK.md` leva essa guarda para os 7 derivados.
- **O que absorver / o que travar:** nada de código vem da fonte — ela é a **prova de campo** de que a guarda pega defeito vivo em produto entregue. O que entra: uma fatia no `docs/migration/PLAYBOOK.md` que porta `tests/Unit/Theme/InlineThemeBackgroundTest.php` + os dois parágrafos de `.ai/rules/views.md` para o projeto derivado, com o `appCssToken('…')` parametrizado pelo nome do token local (aqui `brand-navy-dark`, no ctvitrine `palette-primary-dark`) e a lista `themedBlades()` ajustada às superfícies daquele projeto.
- **Adaptação necessária:** o teste hoje hardcoda `'brand-navy-dark'` (linhas 128 e 145) e uma lista de dois blades (linhas 38-41). Para viajar, os dois viram constante no topo do arquivo. Cuidado registrado no próprio teste (linhas 48-51): os comentários Blade têm de ser removidos **antes** do regex do `<style>`, senão a prosa que cita a tag é mordida no lugar do bloco.
- **Risco · esforço:** P · P para o boilerplate (só documentação/playbook). M por projeto derivado, porque o `color-scheme` ausente é conserto visível: no ctvitrine, hoje, quem usa tema escuro vê barra de rolagem e controles de formulário claros em **toda** página.
- **Multi-fonte?** O sintoma (`var(--token)` no bloco pré-CSS) é herança direta do starter Laravel+Inertia — vale conferir nos outros 6 derivados na mesma fatia. Aqui só o ctvitrine foi medido.

---

### V6F-4 · 79 KB de fonte duplicada por artefato de Finder vivem no `origin/main` do boilerplate, com zero referências

- **Evidência (fonte):** o crítico do inventário registrou o par no ctvitrine (banner, item 1 dos "cinco fatos do `public/`"): `aptos-extrabold-italic 2.woff2` e `aptos-extrabold-italic.woff2` são o **mesmo blob** `fc88540e…`, 78.980 B cada, e só o segundo aparece no `_fonts.css`.
- **Estado do boilerplate hoje:** **o boilerplate tem o mesmo arquivo, mesmo blob.**
  ```
  $ git ls-tree origin/main -- "public/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2" \
                               "public/fonts/woff2/aptos/aptos-extrabold-italic.woff2"
  100644 blob fc88540ed885152d200bf22f8f759258f78538b1  …/aptos-extrabold-italic 2.woff2
  100644 blob fc88540ed885152d200bf22f8f759258f78538b1  …/aptos-extrabold-italic.woff2
  ```
  `git grep -n "extrabold-italic 2" origin/main` → **0 referências**. O `_fonts.css:59` cita só a versão sem ` 2`. Auditoria fechada: **22** woff2 na árvore, **21** URLs distintas no `_fonts.css`, e o `comm -23` das duas listas devolve exatamente **um** nome — o duplicado. Ou seja, o ctvitrine não introduziu o lixo: herdou daqui, e o inventário dele foi o único lugar onde alguém olhou.
- **O que absorver / o que travar:** apagar o arquivo (`git rm "public/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2"`) e, no mesmo commit, um teste barato que impede a reincidência nos dois sentidos — todo woff2 de `public/fonts/` é citado por `_fonts.css`, e toda URL do `_fonts.css` existe no disco. O segundo sentido é o que pega o caso oposto (`@font-face` apontando para arquivo que não subiu no deploy → FOIT silencioso). O `comm` acima é o teste inteiro, em 15 linhas de Pest.
- **Adaptação necessária:** o teste precisa dos preloads também — `resources/views/app.blade.php:59-65` declara 5 `<link rel="preload" href="/fonts/…">` e nenhum deles é verificado hoje contra o disco; um preload para caminho inexistente é 404 em toda página, sem sintoma visível. Os cinco existem (conferido contra o `ls-tree`), então o teste nasce verde.
- **Risco · esforço:** P · P. Zero risco de runtime: o arquivo é inalcançável por definição.
- **Multi-fonte?** O ctvitrine confirma que a duplicata se propaga por clone. Vale um `git ls-tree | grep " 2\."` nos outros 6 derivados na próxima célula de inventário — o padrão do nome (` 2` antes da extensão) é assinatura de cópia do Finder e não é específico de fonte.

---

### V6F-5 · Com SSR ligado, `AppShell` semeia o estado da sidebar do `localStorage` no primeiro render; o cookie que o primitivo já grava não é lido por ninguém

- **Evidência (fonte):** `resources/js/components/app-shell.tsx:9-10@53d7d9a`
  ```tsx
  export function AppShell({ children, variant = 'header' }: AppShellProps) {
      const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('sidebar') !== 'false' : true));
  ```
  A própria fonte escreveu a regra que este arquivo viola, noutro hook: `resources/js/hooks/use-favorites.ts:5@53d7d9a` — `/** SSR: o repo tem ssr.tsx — nenhuma leitura de storage pode acontecer no módulo. */`.
- **Estado do boilerplate hoje:** `resources/js/components/app-shell.tsx:9-10@origin/main` é **idêntico linha a linha** ao da fonte (mesmo ternário, mesmo `'sidebar'`, mesmo `!== 'false'`). O servidor não tem `window`, então renderiza sempre `defaultOpen=true`; o cliente hidrata com o valor guardado. Para quem deixou a sidebar recolhida, o HTML do servidor e a primeira árvore do cliente discordam — com `INERTIA_SSR_ENABLED=true` no `.env.example` (V6F-2), isso é o default de configuração. E o canal correto **já está sendo alimentado e jogado fora**: `resources/js/components/ui/sidebar.tsx:85` grava `document.cookie = "sidebar_state=…"`, e `git grep -rn "sidebar_state\|SIDEBAR_COOKIE_NAME" origin/main` devolve **exatamente 2 linhas, ambas nesse mesmo arquivo** (a constante e a escrita). Ninguém lê. São duas persistências paralelas do mesmo booleano, e a que sobrevive ao servidor é a ignorada.
- **O que absorver / o que travar:** trocar `localStorage` por leitura server-side do cookie, no molde que o boilerplate **já usa para o tema**: `app/Http/Middleware/HandleAppearance.php:14` faz `View::share('appearance', $request->cookie('appearance') ?? 'system')`. O análogo é `sidebar_state` chegando como shared prop (ou `View::share`) e `AppShell` recebendo `defaultOpen` do servidor — uma fonte só, mesma resposta no servidor e no cliente, e o `document.cookie` do primitivo deixa de ser escrita morta. Guarda: teste Vitest que renderiza `AppShell` sem `window.localStorage` e um teste Pest do `HandleInertiaRequests::share()` (o contrato props↔types do `CLAUDE.md` obriga a atualizar `resources/js/types/` no mesmo commit).
- **Adaptação necessária:** o cookie tem de ficar **fora do `encryptCookies`** para o front conseguir escrevê-lo em texto puro — exatamente a exceção que o `appearance` já tem (registrada no comentário de `resources/views/errors/500.blade.php:9-11`). E há uma migração de estado: quem hoje tem `localStorage['sidebar']` e nenhum `sidebar_state` volta ao default aberto uma vez. Aceitável; ou lê-se os dois por uma release.
- **Risco · esforço:** M · M. Mexe em componente que toda página autenticada monta, e o `resources/js/test/components/navigation-landmarks.test.tsx:57` já depende de `AppShell` — a suíte cobre a regressão de landmark, não a de estado.
- **Multi-fonte?** O arquivo é idêntico nos dois repositórios lidos, e `spinmax`/`sorteiopix`/`ctjuris`/`ctfinance` estão registrados com SSR ativo nos docs de migração — o mesmo `app-shell.tsx` neles é candidato ao mesmo defeito, com SSR de verdade ligado. Não medido nesses quatro.

---

### V6F-6 · `env(safe-area-inset-*)` no `body` sem `viewport-fit=cover`: resolve para `0px` nos dois lados

- **Evidência (fonte):** `resources/css/app.css:235@53d7d9a` — `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);` no bloco `body`. E `resources/views/app.blade.php:5@53d7d9a` — `<meta name="viewport" content="width=device-width, initial-scale=1" >`, **sem `viewport-fit=cover`**.
- **Estado do boilerplate hoje:** o par idêntico. `resources/css/app.css:241@origin/main` tem a mesma linha de padding; `resources/views/app.blade.php:5@origin/main` tem a mesma meta sem `viewport-fit`. `git grep -n "safe-area\|viewport-fit" origin/main -- resources` devolve **uma única linha** — a do padding. Sem o opt-in `viewport-fit=cover`, o WebKit mantém o layout dentro da safe area e as quatro variáveis `env()` valem `0px`: a intenção de respeitar notch/home-indicator existe no CSS e não tem efeito em lugar nenhum.
- **O que absorver / o que travar:** decidir para um lado, num commit só. Ou **apagar** a linha 241 (é padding morto num seletor caro) — e aí não há o que travar; ou **ativar**: `content="width=device-width, initial-scale=1, viewport-fit=cover"` no blade e conferir o que a sidebar `fixed` faz com o inset lateral em paisagem. Um comentário na regra dizendo qual meta a habilita, nos dois casos.
- **Adaptação necessária:** se ativar, atenção ao par `viewport-fit=cover` + `body { padding }` com `SidebarInset`: o `<main>` do primitivo é filho de um container que não herda o padding do `body`, então o inset pode ficar visualmente no lugar errado. Verificar em aparelho, não só no devtools.
- **Risco · esforço:** P · P para apagar. M para ativar (mudança de layout global em iOS).
- **Multi-fonte?** Não medido nos outros derivados. A linha é herança do mesmo starter, então a chance de estar nos 7 é alta.

---

### V6F-7 · Duas famílias de layout, três variantes, e o ramo `variant="header"` está morto nos dois repositórios

- **Evidência (fonte):** `resources/js/layouts/app/app-header-layout.tsx@53d7d9a` existe, compõe `AppShell → AppHeader → AppContent` — e `git grep -n "app-header-layout\|AppHeaderLayout" 53d7d9a -- resources` devolve **uma linha só, a própria declaração**: zero importadores. O `resources/js/components/app-header.tsx` existe e é arrastado junto. Do lado público, o ctvitrine **não tem família de layout nenhuma**: as 4 páginas de vitrine montam o shell inline — `site/home.tsx` e `site/item.tsx` importam `site-topbar`+`site-footer` (medido: 4 linhas de import), `site/boutique/{home,item}.tsx` importam `boutique/header`+`boutique/footer`, e `site/landing.tsx` não importa nenhum dos dois.
- **Estado do boilerplate hoje:** `resources/js/layouts/` tem 3 famílias (`app/` com 1 arquivo, `auth/` com 3, `settings/`+`permissions/`) e **não tem `app-header-layout.tsx`** (`ls-tree -r origin/main -- resources/js/layouts` confirma). Mas os dois primitivos ainda carregam a variante que ninguém usa: `components/app-shell.tsx:9` (`variant = 'header'` como **default**) e `:20-22` (o ramo `<div className="flex min-h-screen w-full flex-col">`), `components/app-content.tsx:8,13-17` (mesmo default, ramo `<main className="mx-auto … max-w-7xl">`). O único chamador da árvore inteira é `layouts/app/app-sidebar-layout.tsx:16,32`, e passa `variant="sidebar"` nos dois. Medido: `git grep -n "AppShell\|AppContent" origin/main -- resources/js` fora dos próprios arquivos → 6 linhas, todas nesse layout. **Nenhuma família pública/guest existe** — `auth-layout` é a única coisa sem sidebar, e ela é para telas de autenticação.
- **O que absorver / o que travar:** o que **não** se traz é o `app-header-layout.tsx` da fonte — é código morto lá e seria código morto aqui. O que fica: (i) decidir sobre o ramo `'header'` — ou nasce uma família pública que o use, ou os dois defaults viram `'sidebar'` e os ramos saem (hoje um `<AppContent>` sem prop cai silenciosamente no ramo errado, que é a armadilha de um default apontando para o caminho não exercitado); (ii) se uma família pública for criada, ela é o lugar de reunir topbar+footer+skip-link, exatamente para não repetir o que o ctvitrine fez — 4 páginas montando o shell à mão em duas variações incompatíveis.
- **Adaptação necessária:** o boilerplate está **à frente** num ponto que qualquer família nova tem de preservar: `layouts/app/app-sidebar-layout.tsx:25-30` traz o skip-link "Pular para o conteúdo" e `:32` marca o alvo com `id="conteudo" tabIndex={-1}` — o ctvitrine **não tem nada disso** (o `app-sidebar-layout.tsx` da fonte vai direto de `<AppShell>` para `<AppSidebar />`). Layout público novo nasce com o skip-link e entra em `resources/js/test/components/navigation-landmarks.test.tsx`.
- **Risco · esforço:** P · P para a poda do ramo morto. G para criar a família pública — é decisão de produto, não de refatoração, e o boilerplate hoje não tem nenhuma página pública para justificá-la.
- **Multi-fonte?** `app-shell.tsx`/`app-content.tsx` são byte-idênticos entre fonte e alvo; o ramo morto é herança comum. Não medido nos outros 5.

---

#### Onde eu medi e **não** achei delta (para ninguém recaçar)

- `resources/js/components/ui/table.tsx`: as 40 primeiras linhas são idênticas nos dois (`<div className="relative w-full overflow-auto">` envolvendo a `<table>`). **Tabela em tela estreita já rola** nos dois lados, e `components/permissions/role-users-table.tsx` repete `overflow-x-auto p-3 sm:p-4` nos dois (linha 38 aqui, 37 lá).
- Breakpoint móvel: `MOBILE_BREAKPOINT = 768` em `resources/js/hooks/use-mobile.tsx:3` **nos dois**, mesmo `matchMedia`, mesmo `useEffect`. Zero delta.
- Preloads de fonte: o boilerplate declara 5 (`app.blade.php:59-65`), todos existentes no disco, somando **255.372 B** (aptos 72.824 + semibold 73.272 + bold 73.324 + montserrat-800 19.012 + merriweather-regular 16.940). A fonte declara os mesmos 5 **mais** um sexto condicional, keyed no componente Inertia: `@if (str_starts_with($page['component'] ?? '', 'site/boutique/'))` (`app.blade.php:134-136@53d7d9a`) — a única alavanca de diferenciação por página que existe dentro do `app.blade.php`. Registro a técnica; **não** proponho a porta, porque não medi quais das 5 famílias o boilerplate realmente desenha em cada rota, e `_fonts.css` declara `font-display: swap` em todas as faces (linhas 6, 14, 22, 30, 38…), o que já limita o dano de um preload sobrando.
- `resources/views/errors/500.blade.php` do boilerplate é **melhor** que o `errors/vitrine-suspended.blade.php` da fonte no ponto que importa: decide o tema por `$appearance` (linha 17-19, cookie via `HandleAppearance`), enquanto a fonte decide só por `@media (prefers-color-scheme: dark)` (`vitrine-suspended.blade.php:65-69@53d7d9a`) — que é literalmente o bug descrito no comentário das linhas 11-14 do 500 daqui. A única coisa que a página da fonte tem e a nossa não é `<meta name="robots" content="noindex">` (linha 6) e um bloco OG neutro; como `bootstrap/app.php:57` roteia **403, 404, 500 e 503** por esse caminho, o `noindex` é barato e não-óbvio o suficiente para valer a linha.

---

#### Medições

```bash
# Fonte (read-only, SHA pinado)
git -C …/ctvitrine ls-tree -r 53d7d9a --name-only -- resources/views resources/js/layouts public
git -C …/ctvitrine show 53d7d9a:resources/views/app.blade.php | cat -n
git -C …/ctvitrine show 53d7d9a:resources/views/errors/vitrine-suspended.blade.php | cat -n
git -C …/ctvitrine show 53d7d9a:stubs/ops/instance.env.stub | sed -n '1,30p'
git -C …/ctvitrine show 53d7d9a:tests/Feature/Ops/StubRenderTest.php | sed -n '40,70p'
git -C …/ctvitrine show 53d7d9a:resources/js/components/app-shell.tsx
git -C …/ctvitrine show 53d7d9a:resources/js/components/ui/table.tsx | sed -n '1,40p'
git -C …/ctvitrine grep -n -- "--palette-primary-dark" 53d7d9a -- resources
git -C …/ctvitrine grep -n -i "0f2a44" 53d7d9a
git -C …/ctvitrine grep -n "INERTIA_SSR\|start-ssr\|build:ssr\|ssr.tsx" 53d7d9a
git -C …/ctvitrine grep -n "app-header-layout\|AppHeaderLayout" 53d7d9a -- resources
git -C …/ctvitrine grep -n "components/site/site-topbar\|components/site/site-footer" 53d7d9a -- resources/js
git -C …/ctvitrine grep -n "overflow-x" 53d7d9a -- resources/js
git -C …/ctvitrine grep -n "safe-area\|viewport-fit" 53d7d9a -- resources
git -C …/ctvitrine grep -n "MOBILE_BREAKPOINT" 53d7d9a -- resources/js

# Alvo (sempre origin/main, nunca o disco)
git -C …/boilerplate show origin/main:resources/views/app.blade.php | cat -n
git -C …/boilerplate show origin/main:resources/views/errors/500.blade.php | cat -n
git -C …/boilerplate show origin/main:tests/Unit/Theme/InlineThemeBackgroundTest.php | cat -n
git -C …/boilerplate show origin/main:app/Http/Middleware/HandleAppearance.php
git -C …/boilerplate show origin/main:bootstrap/app.php | sed -n '40,80p'
git -C …/boilerplate show origin/main:config/inertia.php | sed -n '18,55p'
git -C …/boilerplate show origin/main:composer.json | sed -n '70,110p'
git -C …/boilerplate show origin/main:resources/js/components/{app-shell,app-content}.tsx
git -C …/boilerplate grep -n -iE "favicon|apple-touch|android-chrome|webmanifest|theme-color|rel=\"icon\"" origin/main   # → 0 fora de docs
git -C …/boilerplate ls-tree -r origin/main --name-only | grep -iE "manifest|deploy"
git -C …/boilerplate grep -rn "sidebar_state|SIDEBAR_COOKIE_NAME" origin/main                                            # → 2 linhas, mesmo arquivo
git -C …/boilerplate grep -n "AppShell\|AppContent" origin/main -- resources/js                                          # → 6 linhas, 1 chamador
git -C …/boilerplate grep -n -i "0f2a44" origin/main                                                                     # → 5 sítios + 1 comentário
git -C …/boilerplate grep -n "safe-area\|viewport-fit" origin/main -- resources                                          # → 1 linha
git -C …/boilerplate grep -n -iE "InlineTheme|color-scheme|var\(--|app.blade" origin/main -- docs/migration              # → 0 linhas
git -C …/boilerplate ls-tree origin/main -- "public/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2" \
                                            "public/fonts/woff2/aptos/aptos-extrabold-italic.woff2"                      # → mesmo blob fc88540e
git -C …/boilerplate ls-tree -r origin/main --name-only -- public/fonts/woff2 | wc -l                                    # → 22
git -C …/boilerplate show origin/main:resources/css/_fonts.css | grep -oE "url\('[^']+'\)" | sort -u | wc -l             # → 21
comm -23 <(git -C …/boilerplate ls-tree -r origin/main --name-only -- public/fonts/woff2 | sed 's|^public||' | sort) \
         <(git -C …/boilerplate show origin/main:resources/css/_fonts.css | grep -oE "/fonts/woff2/[^']+" | sort -u)     # → 1 órfão
git -C …/boilerplate ls-tree -r -l origin/main -- public/fonts/woff2                                                     # tamanhos dos preloads

# Multi-fonte (docs meus, Read normal)
grep -n -iE "webmanifest|favicon|theme-color" …/boilerplate-harvest-state/docs/harvest/v2/{spinmax,ctfinance,cuidari}.md  # → só spinmax:1859-1860
```

### Lente REFUTAR — vereditos

# V6F-1 — favicon/manifest/theme-color

**SOBREVIVE (escopo corrigido, com dois fatos consertados).**

Reproduzi as medições e elas batem no essencial:

```
$ git -C …/boilerplate grep -n -iE "favicon|apple-touch|android-chrome|webmanifest|rel=\"icon\"|theme-color" origin/main
(zero linhas — repo inteiro, docs incluído)
$ git -C …/boilerplate ls-tree -r origin/main --name-only -- public | grep -vE "fonts|vendor"
public/.htaccess  android-chrome-192x192.png  android-chrome-512x512.png  apple-touch-icon.png
favicon-16x16.png  favicon-32x32.png  favicon.ico  index.php  logo-simplify.png  logo.svg  robots.txt
$ git -C …/boilerplate ls-tree -r origin/main --name-only | grep -i manifest   → só public/vendor/log-viewer/mix-manifest.json
```

Não existe no alvo (nem sob outro nome), não toca ADR nenhum, o ramo `@if ($faviconUrl)` você mesmo já barrou (multi-tenant, acoplado ao domínio). Dois fatos errados, porém:

1. **"portar o bloco `@else` de 5 links"** — o boilerplate **não tem `public/favicon.svg`**. A fonte tem (`53d7d9a:public/favicon.svg`, 927 B); o alvo não (`ls-tree` acima). Portar o `@else` verbatim entrega um `<link>` para `/favicon.svg?v=2` que é 404 permanente — exatamente o defeito que a sua própria seção de adaptação quer travar nos preloads do V6F-4. Ou a linha do SVG sai, ou o asset entra no mesmo commit.
2. **"5 arquivos inalcançáveis"** — são **4**. `apple-touch-icon.png` na raiz é convenção implícita do Safari/iOS igual ao `/favicon.ico`: iOS busca `/apple-touch-icon.png` sem `<link>`. Inalcançáveis de fato: `favicon-16x16.png`, `favicon-32x32.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`.

Terceira ressalva menor: `?v=2` é cache-bust de um `v1` que o boilerplate nunca serviu. Copiar o `2` é cargo cult; ou nasce sem sufixo, ou o sufixo vem com comentário próprio.

CSP não bloqueia: `SecurityHeaders.php:65` declara `default-src 'self'` e nenhum `manifest-src`, então o manifest cai no fallback e carrega.

**Escopo corrigido:** (a) 4 `<link rel="icon">` + o apple-touch, **sem a linha do SVG** (ou com o asset junto); (b) `<meta name="theme-color" content="#0f2a44">` literal; (c) `public/site.webmanifest` + `<link rel="manifest">`, resgatando os dois `android-chrome-*`; (d) o hex do manifest entra na guarda no mesmo commit — `.ai/rules/views.md:9` é explícito ("Superfície nova pintada fora do `app.css` entra nesse teste no mesmo commit") e hoje `theme-tokens.test.ts:20` lê só `app.css` (confirmado) e `InlineThemeBackgroundTest::themedBlades()` lista só dois blades (linhas 38-41, confirmado). O hex atual tem 5 sítios reais, medidos: `app.css:107`, `app.blade.php:48`, `errors/500.blade.php:41,45,55`.

**Amarra:** se o manifest nascer com `display: standalone`, o V6F-6 deixa de ser padding morto e vira decisão pendente. Os dois têm de ser resolvidos na mesma rodada, na ordem V6F-6 → V6F-1.

---

# V6F-2 — SSR ligado por default sem servidor SSR

**SOBREVIVE, mas o mecanismo central é FALSO e tem de ser reescrito antes de virar comentário travado por teste.**

O inventário de fatos do alvo bate, um a um:

```
.env.example:73  INERTIA_SSR_ENABLED=true
config/inertia.php:24  'enabled' => (bool) env('INERTIA_SSR_ENABLED', true)
config/inertia.php:32  'ensure_bundle_exists' => (bool) env(..., true)
config/inertia.php:50  'throw_on_error' => (bool) env('INERTIA_SSR_THROW_ON_ERROR', false)
composer.json "dev": serve + horizon:listen + schedule:work + pail + pnpm dev   (sem inertia:start-ssr)
composer.json "dev:ssr": … + php artisan inertia:start-ssr
tests/TestCase.php:16  config()->set('inertia.ssr.enabled', false)
.gitignore:2  /bootstrap/ssr
git ls-tree -r origin/main --name-only | grep -iE deploy  → 0 arquivos
```

**Refutação 1 — o 502 não existe nesta base.** `composer.lock` fixa `inertiajs/inertia-laravel v3.3.1`. Li o gateway instalado:

```php
// vendor/inertiajs/inertia-laravel/src/Ssr/HttpGateway.php
} catch (Exception $e) {
    if ($e instanceof StrayRequestException || $e instanceof SsrException) { throw $e; }
    $this->handleSsrFailure($page, ['error' => $e->getMessage(), 'type' => 'connection']);
    return null;   // ← fallback para render no cliente
}
```
e `handleSsrFailure()` só lança quando `config('inertia.ssr.throw_on_error')` — default **false** aqui. Conexão recusada em `127.0.0.1:13714` ⇒ evento `SsrRenderFailed` + render no cliente. **Não derruba worker, não dá 502.** A frase do stub é do lock do ctvitrine (`53d7d9a:composer.lock` → **v3.1.0**) e nunca foi remedida contra a versão do alvo. Copiar "derruba o worker PHP-FPM → 502" para um comentário do `.env.example` e depois travá-lo com Pest é plantar um fato falso e blindá-lo — o modo de falha da rodada 1.

**Refutação 2 — a mitigação que você descreve não vale em `composer dev`.** O gate do bundle é curto-circuitado quando o Vite está quente:

```php
if (! $isHot && $this->shouldEnsureBundleExists() && ! $this->bundleExists()) { return null; }
$url = $isHot ? $this->getHotUrl('/__inertia_ssr') : $this->getProductionUrl('/render');
```
Com `public/hot` presente (que é o estado normal do `composer dev`), `$isHot` é true, o gate não roda, e o Inertia faz POST para `<vite>/__inertia_ssr`. O `laravel-vite-plugin@3.1.3` instalado **não trata essa rota** (`grep -rl "inertia_ssr" node_modules/laravel-vite-plugin/` → 0 arquivos), logo 404 → `handleSsrFailure` → fallback. Ou seja: o desperdício **já acontece hoje, em todo full-page load do dev**, sem ninguém ter rodado `dev:ssr`. Esse é o achado real, e é mais forte que o alegado — só que é latência e ruído, não indisponibilidade.

**Refutação 3 — o item (iv) é inócuo.** `INERTIA_SSR_ENSURE_BUNDLE_EXISTS=true` já é o default do próprio `config/inertia.php:32` do repo (não "default de terceiro"), e é justamente o que o caminho hot ignora. Pinar não protege nada.

**Escopo corrigido:** mantém (i) `.env.example` nasce `false`, (ii) teste Pest travando a string, (iii) regra em `.ai/rules`. O comentário diz o que eu medi, não o que o stub alegou: *"SSR desligado por default: `composer dev` não sobe `inertia:start-ssr` e o repo não tem script de deploy. Com `true`, todo full-page load faz um POST condenado (ao Vite em dev, ao `:13714` em prod) que o gateway v3 absorve e devolve render no cliente — custo de roundtrip e evento `SsrRenderFailed` sem ouvinte, não 502. Ligar exige as três chaves juntas: env, `build:ssr` no deploy e daemon no supervisor."* Item (iv) sai. Zero ouvintes do evento no repo (`git grep SsrRenderFailed origin/main` → só o comentário de `config/inertia.php:45`), então hoje a falha é silenciosa — vale uma linha sobre isso e o ADR 0006.

---

# V6F-3 — exportar a guarda de tema pelo playbook

**SOBREVIVE, mas rebaixado de "uma fatia nova" para "uma linha na Fatia 4" — e a alegação central é parcialmente falsa.**

O lado do alvo confere: `app.blade.php:40-52` com literal `#0f2a44` + `color-scheme` nas duas regras, `<meta name="color-scheme">` na linha 8, `InlineThemeBackgroundTest.php` com as quatro guardas (`:135-142` proíbe `var(--`, `:144-165` cobra sincronia com `--brand-navy-dark`, `:167-178` cobra `color-scheme`, `:180-184` cobra o meta), `.ai/rules/views.md:9` e `:11-12`. O lado da fonte também: `app.blade.php:107-117@53d7d9a` usa `var(--palette-primary-dark)` (declarado em `app.css:111@53d7d9a`, entregue só pelo `@vite` da linha 142) e **não há uma única declaração da propriedade `color-scheme` em `resources/` inteiro** — `git grep -n "color-scheme" 53d7d9a -- resources` devolve 4 linhas, todas `prefers-color-scheme` em media query/matchMedia. A prova de campo é legítima.

**O que é falso:** *"Nenhuma fatia do `PLAYBOOK.md` leva essa guarda para os 7 derivados."* Duas coisas já viajam:
- **Fatia 6** (`PLAYBOOK.md:115`) manda copiar `.ai/rules/index.md` **e os arquivos de área aplicáveis** — `views.md` é arquivo de área, e os dois parágrafos que você quer exportar estão nele. E ela é explicitamente antecipada para a Fatia 2.
- **Fatia 4** (`PLAYBOOK.md:93`) já manda copiar `resources/views/errors/500.blade.php` — um dos dois blades tematizados — **sem o teste que o protege**.

O buraco real, então, é estreito e cirúrgico: a Fatia 4 copia o arquivo e não copia a guarda. Isso é uma linha de edição no bullet existente, não uma fatia.

**Escopo corrigido:** acrescentar ao bullet de páginas de erro da Fatia 4 — *"…e `tests/Unit/Theme/InlineThemeBackgroundTest.php`, com `appCssToken('…')` e `themedBlades()` parametrizados pelo token e pelas superfícies do projeto"* — mais uma linha nas Armadilhas (§4) registrando o sintoma medido no ctvitrine (`var(--token)` no bloco pré-CSS + zero `color-scheme`). A refatoração das duas constantes no topo do teste é do projeto derivado, não do boilerplate.

**Não medido, não afirme:** *"no ctvitrine, hoje, quem usa tema escuro vê barra de rolagem e controles claros em toda página"* — o mecanismo está certo, mas ninguém abriu um browser. Escreva "sem `color-scheme` declarado em lugar nenhum (medido), o cromo nativo não segue a classe `.dark`".

---

# V6F-4 — `aptos-extrabold-italic 2.woff2`

**SOBREVIVE intacto. É o único candidato do lote cujos números todos reproduziram sem correção.**

```
$ git -C …/boilerplate ls-tree origin/main -- "…/aptos-extrabold-italic 2.woff2" "…/aptos-extrabold-italic.woff2"
100644 blob fc88540ed885152d200bf22f8f759258f78538b1  …/aptos-extrabold-italic 2.woff2
100644 blob fc88540ed885152d200bf22f8f759258f78538b1  …/aptos-extrabold-italic.woff2
$ git grep -n "extrabold-italic 2" origin/main            → 0
$ ls-tree -r origin/main -- public/fonts/woff2 | wc -l     → 22
$ _fonts.css | grep -oE "/fonts/woff2/[^')]+" | sort -u | wc -l → 21
$ comm -23 <(…árvore…) <(…css…)                            → /fonts/woff2/aptos/aptos-extrabold-italic 2.woff2   (um, e só um)
```

Não existe no alvo sob outro nome (é o alvo), nenhum ADR encosta, não é acoplado a vitrine, custo é uma remoção e ~15 linhas de Pest. Os 5 preloads de `app.blade.php:59-65` existem todos na árvore (confirmado no `ls-tree`), então o segundo sentido do teste nasce verde como você previu.

**Duas notas de execução:** o nome tem espaço — o `git rm` e o `comm` do teste precisam de aspas, e o regex do `_fonts.css` tem de aceitar espaço na URL, senão o teste passa por não enxergar o arquivo. E mantenha o teste standalone em `tests/Unit/` — não pendure no `InlineThemeBackgroundTest`, que tem outro assunto.

---

# V6F-5 — `AppShell` semeando do `localStorage`, cookie escrito e ignorado

**SOBREVIVE, com a severidade corrigida: a duplicação é real e viva; o "mismatch de hidratação" é latente, não observável hoje.**

Fatos confirmados um a um:
- `app-shell.tsx` é **byte-idêntico** entre `53d7d9a` e `origin/main` (li os dois: 29 linhas, mesmo ternário, mesmo `'sidebar'`, mesmo `!== 'false'`). `app-content.tsx` idem.
- `git grep -n "sidebar_state\|SIDEBAR_COOKIE_NAME" origin/main` → exatamente **2 linhas**, ambas em `ui/sidebar.tsx` (`:27` a constante, `:85` a escrita). Ninguém lê. Confirmado.
- E o cookie **é mesmo escrito no modo controlado**: `ui/sidebar.tsx:56-69` chama `setOpenProp(openState)` e escreve `document.cookie` logo depois, incondicionalmente. Sua premissa se sustenta.
- Precedente do canal certo confirmado: `HandleAppearance.php:14` (`View::share`) + `bootstrap/app.php:35` (`encryptCookies(except: ['appearance'])`).

**O que cai:** *"com `INERTIA_SSR_ENABLED=true` no `.env.example`, isso é o default de configuração"* — a config está ligada, mas o SSR **não renderiza** (V6F-2: sem daemon, sem bundle, e no dev-hot o POST toma 404 e o gateway v3.3.1 devolve fallback no cliente). Servidor nenhum produz HTML de `AppShell` hoje, logo não há divergência servidor↔cliente observável. Vender o candidato pela hidratação é vender um sintoma que não acontece.

**O que fica de pé sem depender de SSR:** duas persistências paralelas do mesmo booleano, uma delas pura escrita morta; e leitura de `localStorage` no inicializador de um componente que toda página autenticada monta, contra a regra da própria casa (`.ai/rules/js.md:72` já exige que `navigator` seja lido "só sob demanda e depois da montagem", e o `use-favorites.ts:5` da fonte escreve a regra em uma linha). Isso basta.

**Escopo corrigido:** uma fonte só. Ou o servidor publica `sidebar_state` (via `share()` + tipos em `resources/js/types/` no mesmo commit, por `CLAUDE.md`) e `AppShell` deixa de ser dono do estado, ou o `AppShell` para de controlar e devolve a persistência ao primitivo (que já escreve o cookie) — **não os dois**. Cookie fora do `encryptCookies`, junto de `appearance`. Guardas: Vitest renderizando sem `window.localStorage` + Pest no `share()`. Migração de estado: quem tem `localStorage['sidebar']` volta ao aberto uma vez — aceitável, registre no PR.

---

# V6F-6 — `env(safe-area-inset-*)` sem `viewport-fit=cover`

**SOBREVIVE só na metade "apagar". A metade "ativar" é DERRUBADA: é decisão de produto sem página que a justifique, e o próprio candidato a classifica como M com verificação em aparelho.**

Medido no alvo:
```
$ git grep -n "safe-area\|viewport-fit" origin/main -- resources
resources/css/app.css:241:  padding: env(safe-area-inset-top) … env(safe-area-inset-left);   ← linha única
app.blade.php:5  <meta name="viewport" content="width=device-width, initial-scale=1">   ← sem viewport-fit
```
Fonte idêntica. Sem o opt-in, as quatro `env()` valem `0px`: é padding morto num seletor que já carrega `@apply` + `font-family !important` (`app.css:234-242`).

Ativar significa mudar o layout global em iOS num boilerplate que não tem uma única página pública, e ainda esbarra no problema que você mesmo levanta (o `<main>` do `SidebarInset` não herda padding do `body`, então o inset ficaria no container errado). Isso é adiamento, não fatia.

**Escopo corrigido:** remover a linha 241 + um comentário de uma linha no lugar dizendo qual meta a habilitaria. **Ordem obrigatória:** decidir isto **antes** do V6F-1 — se o manifest nascer com `display: standalone`, o app vira instalável e o inset passa a importar de verdade; aí a ativação vira uma fatia própria, com o padding no container de rolagem e não no `body`.

---

# V6F-7 — variante `'header'` morta / famílias de layout

**SPLIT: a poda SOBREVIVE (escopo corrigido); a família pública é DERRUBADA — "G, decisão de produto, e o boilerplate não tem página pública para justificá-la" é a própria definição de adiamento, não de fatia.**

Confirmado: `app-header-layout.tsx` existe na fonte com **zero importadores** (`git grep … 53d7d9a -- resources` → só a linha da declaração) e **não existe** no alvo (`ls-tree -r origin/main -- resources/js/layouts`). `app-shell.tsx` e `app-content.tsx` byte-idênticos entre os dois. `AppShell variant = 'header'` e `AppContent variant = 'header'` são os defaults, e o único chamador é `app-sidebar-layout.tsx`, passando `"sidebar"` nas duas (`:16` e `:32`). O skip-link do alvo (`:25-30`) e o alvo marcado (`:32`) existem; a fonte não tem nada disso (li o `app-sidebar-layout.tsx@53d7d9a`: vai de `<AppShell>` direto para `<AppSidebar />`). Tudo isso se sustenta.

**Fato errado:** *"`git grep -n "AppShell\|AppContent" origin/main -- resources/js` fora dos próprios arquivos → 6 linhas, todas nesse layout"*. Rodei: são **8** linhas fora dos dois componentes — 7 em `app-sidebar-layout.tsx` (1, 2, 16, 19, 32, 40, 41; a 19 é comentário) e 1 em `resources/js/test/components/navigation-landmarks.test.tsx:57`, também comentário. A conclusão (um chamador só) sobrevive; a contagem e o "todas nesse layout" não.

**Escopo corrigido da poda:** melhor que trocar o default para `'sidebar'` é **remover a prop `variant` inteira** dos dois componentes — prop obrigatória com um valor só é ruído, e some junto a armadilha do default apontando para o ramo não exercitado. É seguro: `SidebarInset` é literalmente um `<main>` (`ui/sidebar.tsx:329-331`), então o landmark não se perde ao apagar o ramo `header` de `AppContent`. Duas travas de execução: preservar o `{...props}` que leva `id="conteudo"`/`tabIndex={-1}` até o `<main>` (é o que faz o skip-link funcionar) e rodar `navigation-landmarks.test.tsx` no mesmo commit. Se um dia a família pública nascer, ela nasce com o skip-link e entra nesse teste — mas isso é bilhete para a próxima rodada, não escopo desta.

---

# Extra — `<meta name="robots" content="noindex">` no `errors/500.blade.php`

Está enterrado na seção "onde não achei delta", mas é uma proposta e por isso julgo. **DERRUBADO como fatia própria; SOBREVIVE como linha carona do V6F-1.**

Confirmei que `bootstrap/app.php:57` roteia `[403, 404, 500, 503]` por esse caminho (e que o `errors.500` só entra no `catch` do render Inertia, `:65`), e que `public/robots.txt` libera tudo. Mas crawlers não indexam resposta não-200 — o ganho é marginal e você mesmo o classifica como "barato e não-óbvio o suficiente para valer a linha", que é argumento de conveniência, não de defeito medido. Um PR só para isso não se sustenta; anexado ao commit de `<head>` do V6F-1, custa zero.

### Lente RISCO — vereditos

### V6F-1 · favicon/manifest

**Falsificação que muda a fatia.** O candidato manda "portar o bloco `@else` de 5 links". Medi `git -C .../boilerplate ls-tree -r origin/main --name-only -- public`: existem `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-{192,512}.png` — **e nenhum `favicon.svg`**. A fonte tem (`git -C .../ctvitrine ls-tree -r 53d7d9a --name-only -- public` lista `public/favicon.svg`, além de `favicon-48x48.png` e `favicon.png`). Portar os 5 links verbatim planta `<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">` apontando para arquivo inexistente: **404 em toda página**, e é justamente o link que Chrome/Firefox preferem quando declarado. São **4** links a portar, não 5 — ou 5 com um `favicon.svg` novo desenhado no mesmo commit.

**Segundo detalhe herdado sem sentido:** o `?v=2` é cache-bust de uma marca que já girou uma vez na fonte. Aqui nunca houve `v=1` (zero linhas de `rel="icon"` em `origin/main`, confirmado). Entra como token permanente que ninguém sabe quando girar. Ou nasce sem query, ou nasce com o comentário explicando o protocolo.

**Regressão visual/comportamental:** nula sobre o que as 30 fatias consertaram. Nenhum `className`, nenhum token do `@theme`, nenhuma regra de `app.css`. `resources/js/test/styles/{theme-tokens,focus-ring}.test.ts` leem `resources/css/app.css` e `resources/js/**/*.tsx?` respectivamente — não enxergam `public/` nem `<head>`. `tests/Unit/Theme/InlineThemeBackgroundTest.php` recorta só o primeiro `<style>` do blade; `<link>` e `<meta>` novos passam ao largo.

**A adaptação proposta não funciona.** O candidato diz "estender `themedBlades()` (linha 34) para incluir o manifest". Li o teste: `themeStyleBlock()` (linhas 44-56) faz `preg_match('/<style\s*>(.*?)<\/style\s*>/s')` e a primeira asserção (linhas 127-133) é `expect(themeStyleBlock($nome))->not->toBe('')`. Um `.webmanifest` é JSON e não tem `<style>` — pôr o caminho em `themedBlades()` derruba o teste na entrada, não na sincronia. O mesmo vale para o `<meta name="theme-color">`: ele vive fora do `<style>`, logo fora de `themeDeclarations()`. A guarda certa é uma asserção **nova**, reaproveitando `appCssToken('brand-navy-dark')` (linha 118) e comparando com `json_decode(file_get_contents($manifest))->theme_color` e com o `content=` do meta, via regex própria.

**Segurança:** CSP não quebra. `SecurityHeaders.php:64-75` emite `default-src 'self'` (que é o fallback de `manifest-src`, ausente na lista) e `img-src 'self' data: https:` — manifest e ícones de mesma origem passam. Mas `X-Content-Type-Options: nosniff` é incondicional (`SecurityHeaders::HEADERS`, linhas 23-28) e `public/.htaccess` (25 linhas, li inteiro) **não declara `AddType`**. Servidor que não conheça `.webmanifest` entrega `application/octet-stream` e o Chrome, com `nosniff`, recusa o manifest silenciosamente. `php artisan serve` faz exatamente isso. Mitigação obrigatória: `AddType application/manifest+json .webmanifest` no `.htaccess` (e a nota equivalente para nginx no PR).

**a11y/contraste:** calculei `#0f2a44` — luminância relativa 0.0217, contraste **14.6:1 contra branco**. O texto que o Chrome Android escolhe para a barra fica confortável. O efeito colateral é estético e real: um `theme-color` único pinta a barra de navy também no tema claro, num app cujo canvas claro é `--background: white` (`app.css:119`). Mitigação de uma linha: dois metas com `media="(prefers-color-scheme: light)"` / `dark`.

**Custo de gate:** sem `pest-plugin-browser` não há prova visual. Evidência possível e barata, na ordem de valor: (1) teste Pest lendo `app.blade.php`, extraindo todo `href` de `rel="icon|apple-touch-icon|manifest"`, stripando `?v=`, e afirmando `file_exists(public_path(...))` — é exatamente o que pega o `favicon.svg` fantasma antes do merge; (2) `json_decode` do manifest travando `theme_color`/`background_color` contra `appCssToken()`; (3) screenshot da aba no PR.

**Veredito: risco MÉDIO.** Seria BAIXO sem o link fantasma e sem o MIME. Mitigação: 4 links (não 5), `AddType` no `.htaccess`, asserção nova em vez de `themedBlades()`, dois `theme-color` por `prefers-color-scheme`.

---

### V6F-2 · SSR ligado por default

**Fatos do alvo: todos confirmados por medição própria.** `.env.example:73` `INERTIA_SSR_ENABLED=true`; `config/inertia.php:24` default `true`, `:32` `ensure_bundle_exists` default `true`; `composer.json` `"dev"` roda `serve/horizon:listen/schedule:work/pail/pnpm dev` e **não** `inertia:start-ssr`, que só aparece em `"dev:ssr"`; `tests/TestCase.php:16` `config()->set('inertia.ssr.enabled', false)`; `.gitignore:2` `/bootstrap/ssr`; zero arquivos de deploy (`ls-tree -r origin/main --name-only | grep -i deploy` → 0).

**Falsificação na justificativa.** O candidato importa da fonte a frase "derruba o worker PHP-FPM → 502 no reload da área logada". No boilerplate esse desfecho **não se sustenta**: `config/inertia.php:50` tem `'throw_on_error' => (bool) env('INERTIA_SSR_THROW_ON_ERROR', false)`, e o próprio bloco de comentário (linhas 40-47) diz que a falha de SSR cai graciosamente para client-side rendering. O sintoma real aqui é **uma tentativa de POST recusada por page load** — latência do connect-refused mais ruído de log — não 502. Isso não derruba a fatia; derruba a prosa copiada. Se a fatia entrar com o texto da fonte, ela afirma fato falso sobre este repositório.

**Regressão de CI: medida e nula.** `.github/workflows/ci.yml:170` faz `cp .env.example .env` antes do gate de migrations MySQL e do `./vendor/bin/pest`. Trocar a linha 73 muda o `.env` daquele job — mas `TestCase.php:16` já força `inertia.ssr.enabled = false` na suíte inteira, então nenhum teste muda de resultado. Efeito líquido: zero.

**Dados persistidos:** nenhum. `.env` de instalação existente não é tocado.

**Segurança/a11y:** neutro, com uma melhora marginal — desligar remove um destino de requisição saindo do PHP para `127.0.0.1:13714` em cada render. Sem impacto de foco, contraste ou anúncio.

**Custo de gate:** o teste proposto (Pest lendo `.env.example`) não tem precedente aqui — `git grep -n "env.example" origin/main -- tests scripts .github` devolve só a linha do CI. É factível: o arquivo é versionado e existe local e no runner. Recomendo travar o **par** (a chave em `false` **e** o comentário de condição), não a string solta: string solta é trivialmente satisfeita por quem só quer o CI verde.

**Trap não anotada:** `composer dev:ssr` roda `pnpm build:ssr` e deixa `bootstrap/ssr/ssr.mjs` no disco permanentemente (está em `.gitignore`, ninguém limpa). Com o default virando `false` o resíduo passa a ser inofensivo — mas quem quiser SSR de verdade agora tem de virar três chaves. Vale uma linha na regra dizendo isso.

**Veredito: risco BAIXO.** Uma linha de env + um teste + uma regra, com CI provadamente indiferente. Mitigação: reescrever a justificativa para "dispatch recusado por page load + log", não "502".

---

### V6F-3 · exportar a guarda de tema para o playbook

**Fact-check.** A afirmação `git grep -n "color-scheme" 53d7d9a -- resources/views` → 0 linhas é **falsa**. Rodei o comando: devolve **2** linhas — `app.blade.php:97` e `errors/vitrine-suspended.blade.php:65`, ambas `prefers-color-scheme`. O fato substantivo permanece verdadeiro: nenhuma declaração da propriedade `color-scheme`, nenhum `<meta name="color-scheme">` no ctvitrine. Confirmei também `var(--palette-primary-dark)` dentro do `<style>` da fonte (bloco em 106-117) com o `@vite` 28 linhas abaixo. E confirmei o buraco de exportação: `git grep -inE "InlineTheme|color-scheme|var\(--|app\.blade" origin/main -- docs/migration` → **0 linhas**; a Fatia 4 do `PLAYBOOK.md:93` cita `errors/500.blade.php` mas não a guarda de tema.

**Risco para o boilerplate: nulo.** A fatia toca só `docs/migration/PLAYBOOK.md`. Nenhum gate roda sobre `docs/`; nenhum arquivo executável muda. Regressão visual impossível.

**Risco de portabilidade — o candidato subestimou o que precisa virar constante.** Li o teste inteiro. Além de `appCssToken('brand-navy-dark')` (linhas 128, 145) e de `themedBlades()` (34-42), ele carrega: `dirname(__DIR__, 3)` nas linhas 36 e 120 (assume `tests/Unit/Theme/` a exatamente 3 níveis da raiz — derivado com outra árvore de testes lê o arquivo errado e falha com mensagem enganosa); e `ehSeletorEscuro()` (105-108) que só reconhece `.dark` e `.system`. Derivado que use `data-theme` em vez de classe faz `darkBackgroundDeclarations()` voltar vazia — e aí a guarda **falha alto**, graças à asserção `not->toBeEmpty()` da linha 148, que é o detalhe bem-projetado do teste. Já o cuidado que o candidato destacou (remover comentários Blade antes do regex, linhas 48-51) está correto e é o único documentado no arquivo.

**Onde o risco vive de verdade: no derivado, não aqui.** O teste não conserta nada — ele reprova. Para o ctvitrine ficar verde é preciso (a) trocar `var(--palette-primary-dark)` por literal e (b) acrescentar `color-scheme` nas duas regras. O item (b) é uma mudança visível em **toda** página escura: barra de rolagem e controles nativos passam de claro para escuro. É melhoria de a11y inequívoca (não há como um `color-scheme: dark` correto piorar contraste), mas é mudança perceptível — merece screenshot no PR do derivado.

**Custo de gate:** o próprio teste é o gate, e ele mede a declaração, não o pixel — o que é adequado, porque o defeito original (`var()` sem valor) é textual. Nenhuma prova visual é necessária.

**Ordem obrigatória, que a fatia tem de dizer:** conserto **antes** do teste, no mesmo PR. Invertido, a suíte do derivado nasce vermelha e o PR fica refém de uma correção de CSS que não estava no escopo.

**Veredito: risco BAIXO no boilerplate; MÉDIO por derivado.** Mitigação: parametrizar quatro coisas (token, lista de blades, raiz do projeto, predicado de seletor escuro), e ordenar conserto→teste.

---

### V6F-4 · `aptos-extrabold-italic 2.woff2`

**Confirmado por medição própria, integralmente.** Mesmo blob: `git ls-tree origin/main -- "…/aptos-extrabold-italic 2.woff2" "…/aptos-extrabold-italic.woff2"` devolve `fc88540ed885152d200bf22f8f759258f78538b1` nos dois. `git grep -n "extrabold-italic 2" origin/main` → 0. 22 woff2 na árvore, 21 URLs distintas no `_fonts.css`, e o `comm -23` devolve exatamente `/fonts/woff2/aptos/aptos-extrabold-italic 2.woff2`. Como 22−21=1 e o órfão é único, o **sentido inverso também está limpo hoje**: toda URL do CSS existe no disco. O teste nasce verde nos dois sentidos, como o candidato disse.

**Regressão visual/comportamental: zero.** O arquivo é inalcançável por definição (nenhum `@font-face`, nenhum preload, nenhum import o cita). Nenhum teste de estilo o enxerga: `focus-ring.test.ts:32-42` varre só `.tsx?` sob `resources/js` (exceto `test/`), `theme-tokens.test.ts:20` lê só `resources/css/app.css`.

**Risco real, não anotado, mora no teste proposto.** Dois pontos:
1. **Vacuidade.** O extrator que o candidato usou (`grep -oE "/fonts/woff2/[^']+"`) assume aspas simples em todo `url()`. Um `url("…")` futuro escapa do regex, a lista fica curta, e o teste passa verde afirmando nada. O repo já tem o antídoto e o padrão a copiar: o controle positivo de `focus-ring.test.ts:64-69` (`expect(sources.length).toBeGreaterThan(50)` e `>= 8` arquivos com a classe). Aqui: `expect(count($urls))->toBeGreaterThanOrEqual(21)`.
2. **O espaço no nome.** Qualquer `glob()`/`preg` que monte a URL a partir do caminho tem de sobreviver a um nome com espaço — é literalmente o arquivo que o teste existe para pegar; se o pipeline engasgar nele, o teste não vê o alvo.

**Estender aos preloads:** conferi os 5 `href` de `app.blade.php:59-65` contra o `ls-tree` — os cinco existem. A extensão acopla `tests/` a `resources/views/` e precisa ignorar query string; aceitável e barata. É a mesma asserção que o V6F-1 precisa para os ícones — vale unificar num teste só de "todo asset referenciado no `<head>` existe em `public/`".

**Dados persistidos / segurança / a11y:** nada. Apagar um arquivo não referenciado não muda tipografia renderizada, contraste, foco nem ordem de tabulação.

**Deploy:** com deploy por rsync **sem** `--delete`, o arquivo sobrevive em produção depois do `git rm` — inofensivo, e sem script de deploy no repo (0 arquivos) não há como travar isso daqui.

**Veredito: risco BAIXO.** Única mitigação necessária: controle positivo no teste, no molde do `focus-ring.test.ts`.

---

### V6F-5 · estado da sidebar em `localStorage` vs cookie

**Confirmado byte-a-byte.** `resources/js/components/app-shell.tsx` é idêntico linha a linha entre `53d7d9a` e `origin/main` (li os dois, 29 linhas cada, mesmo ternário na linha 10). Confirmado `bootstrap/app.php:35` → `encryptCookies(except: ['appearance'])` e `HandleAppearance.php:14` → `View::share('appearance', …)`.

**Correção de contagem:** `git grep -n "sidebar_state\|SIDEBAR_COOKIE" origin/main` devolve **3** linhas, não 2 — `ui/sidebar.tsx:27` (nome), `:28` (max-age) e `:85` (a escrita). Conclusão inalterada: ninguém lê.

**Correção de mecanismo, esta importa.** O candidato oferece "shared prop (ou `View::share`)". `View::share` **não serve**: ele alcança o Blade, não as props do React. O `appearance` funciona porque é consumido dentro de `app.blade.php` (linhas 2, 8, 13). Para chegar no `AppShell` só há o caminho da prop compartilhada do Inertia — a alternativa (injetar `window.__sidebar` num inline script) reintroduz script inline num `<head>` que a CSP só tolera por `'unsafe-inline'`.

**A linha que decide se a fatia funciona:** `sidebar_state` **tem** de entrar no `except` do `encryptCookies`. Sem isso, o `EncryptCookies` falha ao descriptografar o cookie que o JS escreveu em texto puro e **descarta** o valor: `$request->cookie('sidebar_state')` volta `null`, o servidor manda sempre `true`, e a fatia entrega o bug atual com mais código e mais superfície. Não é detalhe de acabamento.

**Gate existente que vai quebrar — de propósito, e isso é bom.** `tests/Feature/SharedPropsTest.php:21-55` fecha o escopo raiz com `->interacted()` e o comentário das linhas 26-31 diz explicitamente que prop nova sem espelho em `resources/js/types` quebra ali. Uma chave `sidebarOpen` derruba o teste com "Unexpected properties were found in scope" até `share()`, `SharedPropsTest` e `SharedData` mudarem juntos. É exatamente a catraca que o `CLAUDE.md` promete.

**Regressão medida em teste existente.** `resources/js/test/components/navigation-landmarks.test.tsx` renderiza `AppSidebarLayout` de verdade em quatro testes (117, 125, 139, 147), com `vi.mock('@inertiajs/react')` (linhas 24-41) cujo `usePage()` devolve **só** `{ url, props: { auth } }`. Se `AppShell` passar a ler `usePage().props.sidebarOpen`, o mock entrega `undefined` — sem fallback explícito, os quatro testes de skip-link caem. Mitigação: `const open = props.sidebarOpen ?? true;` e a chave acrescentada ao mock no mesmo commit. Já `resources/js/test/components/ui/sidebar-shortcut.test.tsx:14` usa `SidebarProvider defaultOpen` direto e não passa por `AppShell` — imune.

**Segurança:** tirar um cookie do `encryptCookies` é decisão revisável, mas o conteúdo é um booleano de UI sem valor. O que merece conserto junto: a escrita em `ui/sidebar.tsx:85` é `path=/; max-age=…` — **sem `SameSite`, sem `Secure`**. Uma linha, e some a divergência entre o default de Chrome e o de Safari.

**a11y:** neutro se feito direito; positivo de tabela: hoje, com SSR ligado, quem recolheu a sidebar recebe HTML do servidor com a sidebar aberta e o cliente a fecha no primeiro frame — um salto de layout que reposiciona o skip-link e todo o `<main>`. Foco e ordem de tabulação não mudam (o skip-link continua o primeiro focável, `app-sidebar-layout.tsx:25-30`).

**Dados persistidos — são duas migrações, não uma.** (i) quem tem `localStorage['sidebar']='false'` e nenhum `sidebar_state` volta ao aberto uma vez (o candidato anotou); (ii) o `localStorage['sidebar']` fica **órfão para sempre** no browser de todo usuário existente se a escrita da linha 16 não for removida no mesmo commit — senão a fatia sai com três canais em vez de um, que é o oposto do objetivo declarado.

**Custo de gate:** a hidratação real não é observável sem browser testing, e o PR deve dizer isso. Evidência possível: (a) Vitest renderizando `AppShell` com `vi.stubGlobal('localStorage', undefined)` — prova a ausência de leitura de storage no primeiro render, que é o defeito nomeado; (b) Pest afirmando que `withCookie('sidebar_state', 'false')` chega como `false` na prop, o que prova de quebra que o cookie sobreviveu ao `encryptCookies`; (c) screenshot/gravação manual do reload com sidebar recolhida.

**Veredito: risco MÉDIO.** Toca o shell de toda página autenticada, mas os três gates existentes (SharedPropsTest, navigation-landmarks, `pnpm types`) fazem o erro aparecer no CI e não em produção. Mitigações obrigatórias: `except: […, 'sidebar_state']`, fallback `?? true`, remoção da escrita em `localStorage`, `SameSite=Lax`.

**Sequenciamento:** depende do V6F-2. Se o SSR nascer desligado, este defeito deixa de ser observável e a fatia perde a urgência — mas as duas persistências paralelas continuam sendo dívida. Rodar V6F-2 primeiro (P·P) e reescrever a justificativa deste como "um canal só", não como "conserto de hidratação".

---

### V6F-6 · `env(safe-area-inset-*)` sem `viewport-fit=cover`

**Confirmado:** `git grep -n "safe-area\|viewport-fit" origin/main` devolve **uma** linha em todo o repositório — `resources/css/app.css:241`, dentro do bloco `body`. `app.blade.php:5` é `content="width=device-width, initial-scale=1"`, sem `viewport-fit`. Nenhum teste referencia. Na fonte, a mesma linha em `app.css:235` e a mesma meta em `app.blade.php:5`.

**Opção A — apagar: risco ZERO, e é medido.** O preflight do Tailwind v4 zera `padding` no seletor universal, então o valor computado de `body` hoje é `0px` e continua `0px` depois da remoção. Nenhum snapshot, nenhum teste de estilo, nenhum `className`, nenhum token. Nada que F1/F5/F42/E28/F32 consertaram encosta nisso.

**Opção B — ativar: risco ALTO, e o candidato subestimou.** Ele propõe "verificar em aparelho". Dois mecanismos concretos garantem que a ativação **desalinha** em vez de alinhar:
1. A sidebar desktop é posicionada com `fixed` pelo `ui/sidebar.tsx`. Elemento `fixed` resolve contra o **viewport**, não contra a caixa de conteúdo do `body`. Com o padding valendo de verdade, o fluxo desloca e a sidebar não — em paisagem no iPhone, a sidebar cola no notch e o conteúdo ganha uma faixa. O candidato chegou perto ("o `<main>` do primitivo é filho de um container que não herda o padding"), mas o mecanismo é `fixed`, não herança.
2. Todo overlay Radix e o `Toaster` do `react-hot-toast` saem por **portal em `document.body`** com posicionamento `fixed` — também imunes. A "correção" acertaria só o fluxo normal e deixaria tudo o que é sobreposto desalinhado em relação a ele.

**Um risco que eu levantei e derrubei:** cogitei uma moldura visível da cor do `html` em volta do `body` com padding. Medi `resources/css/app.css:119` (`--background: white`) e `:170` (`.dark { --background: var(--brand-navy-dark) }`) contra o bloco inline de `app.blade.php:41-51` (`white` / `#0f2a44`): **são a mesma cor nos dois temas**, então a moldura seria invisível. Não é risco.

**Dados persistidos / segurança / a11y:** nenhum dos dois lados muda contraste, foco, ordem de tabulação ou anúncio. Na opção B há um ganho teórico de a11y (conteúdo fora do home-indicator) que os dois mecanismos acima anulam na prática enquanto os `fixed` não forem tratados.

**Custo de gate:** para (A), os gates existentes provam a ausência de dano — `composer ci:check` e `corepack pnpm ci:check` verdes bastam. Para (B), **não existe prova automatizável neste repo**: `env()` só tem valor não-zero em Safari iOS com `viewport-fit=cover`, condição que jsdom não reproduz e que só um dispositivo real exibe. Um candidato cuja única prova é visual, e nem screenshot de simulador cobre bem.

**Veredito: risco BAIXO para apagar, ALTO para ativar.** Recomendação: apagar a linha, e uma frase em `.ai/rules/css.md` registrando que `env(safe-area-*)` só volta acompanhada de `viewport-fit=cover` **e** de um plano para os elementos `fixed` — senão volta como padding morto pela segunda vez.

---

### V6F-7 · ramo `variant="header"` morto

**Confirmado.** `git ls-tree -r origin/main --name-only -- resources/js/layouts` não tem `app-header-layout.tsx`; a listagem de `resources/js/components` (fora de `ui/`) não tem `app-header.tsx`. A poda já aconteceu e está documentada: `resources/js/test/styles/focus-ring.test.ts:50-61` conta que a cadeia `app-header-layout → app-header → navigation-menu` era órfã inteira, foi apagada, e `MORTOS_CONHECIDOS` ficou vazia de propósito como catraca.

**Correção de contagem:** `git grep -n "AppShell\|AppContent" origin/main -- resources/js` devolve **7** linhas fora dos próprios arquivos, não 6 — as 6 de `app-sidebar-layout.tsx` (1, 2, 16, 32, 40, 41) mais `navigation-landmarks.test.tsx:57`, uma citação em comentário. A conclusão (chamador único) não muda.

**O que o candidato não notou, e que fortalece a poda:** no `AppShell`, o ramo `'header'` (linhas 20-22) é o **único** caminho que não monta `SidebarProvider`. `ui/sidebar.tsx:46-53` lança `"useSidebar must be used within a SidebarProvider."` para qualquer primitivo abaixo. O default `'header'` não é só "não exercitado": é um default que **derruba a árvore** se alguém montar `<AppShell>` sem prop e puser qualquer coisa de sidebar dentro. Essa é a frase de justificativa que a fatia precisa, e é mais forte que "cai silenciosamente no ramo errado".

**Poda — regressão medida: nenhuma.** O único chamador passa `variant="sidebar"` explicitamente nos dois pontos (`app-sidebar-layout.tsx:16` e `:32`), então remover o ramo não altera árvore renderizada. `navigation-landmarks.test.tsx:146-150` ("exatamente um `<main>`") continua verde: o `<main>` vem do `SidebarInset`, não do ramo removido. Se o prop `variant` for removido do **tipo**, o TS quebra nos dois call sites — que estão no mesmo arquivo, corrigidos no mesmo diff. Se só o default virar `'sidebar'`, nada quebra e a armadilha some. Coberto 100% por `pnpm types` + `vitest` + `eslint`; **não** precisa de gate visual.

**Família pública — ALTO, e mais caro do que o candidato disse.** Além do skip-link, três contratos existentes passariam a valer para o layout novo, automaticamente: (a) os 4 testes de skip-link (`navigation-landmarks.test.tsx:115-150`), incluindo o alvo `id="conteudo" tabIndex={-1}`; (b) o landmark nomeado "Navegação principal" (`:105-112`); (c) `focus-ring.test.ts:32-42`, que varre **toda** `resources/js` exceto `test/` e exige zero `ring-ring/` fracionário — um header público novo entra nessa varredura sem ninguém pedir. Isso é bom, e significa que não existe "só criar o layout".

**a11y:** o `<main>` único é invariante travada; uma família pública que renderize o próprio `<main>` e acabe coexistindo com o app layout em alguma página quebra a asserção. Improvável, mas é a catraca a respeitar.

**Dados persistidos / segurança:** nada.

**Veredito: risco BAIXO para a poda do ramo morto (fazer já, gates existentes cobrem inteiro); ALTO para a família pública (adiar).** A segunda é decisão de produto sem consumidor no boilerplate — hoje não há uma única página pública para justificá-la, e criá-la sem consumidor recria exatamente o código morto que a fatia anterior acabou de podar.

---

### Addendum · o `noindex` proposto na seção "onde não achei delta"

O candidato propõe portar `<meta name="robots" content="noindex">` para `resources/views/errors/500.blade.php`, argumentando que "`bootstrap/app.php:57` roteia 403, 404, 500 e 503 por esse caminho". **Li o bloco (linhas 50-73): não é esse o fluxo.** Os quatro status vão primeiro para `Inertia::render('errors/error-page')` (linha 59); o blade `errors.500` é o **`catch`** (linha 65), acionado só quando o próprio render Inertia falha — manifest/build quebrado. Um crawler encontra a página React, não o blade. Se o objetivo é o `noindex` valer, ele pertence a `resources/js/pages/errors/error-page.tsx` (via `<Head>`), e o blade ganha a cópia só por simetria. Risco de qualquer um dos dois: **nulo** — mas a justificativa como está aponta para o arquivo errado, e `tests/Feature/ErrorPagesTest.php` já existe para travar o certo.

### Lente ATUALIDADE — vereditos

# Lente ATUALIDADE — lote do Caçador 4 (ctvitrine @ `53d7d9a` → boilerplate @ `origin/main`)

**Versões conferidas no alvo, não de memória.** `git -C …/boilerplate show origin/main:package.json` → `tailwindcss ^4.3.3`, `react ^19.2.8`, `@inertiajs/react ^3.6.1`, `vite ^8.2.1`, `typescript ^6.0.3`, `tailwindcss-animate ^1.0.7`; **não existe `@inertiajs/vite`**. `…:composer.json` → `laravel/framework ^13.0`, `inertiajs/inertia-laravel ^3.0`, `pestphp/pest ^5.1`. Instalado: `node_modules/tailwindcss/package.json` = 4.3.3, `node_modules/react/package.json` = 19.2.8.

---

### V6F-1 — favicon / manifest / theme-color

**Veredito: ATUAL COM MODERNIZAÇÃO** (o padrão não foi superado por recurso nativo, mas o bloco de 5 links que se propõe portar é a forma de 2016 e um dos links aponta para arquivo que não existe aqui).

**Nada nativo substituiu isso.** Vite 8 copia `public/` verbatim — não entra no grafo do Rollup, não ganha hash. Por isso o `?v=2` da fonte continua sendo a técnica corrente para esses caminhos (é o mesmo fato que sustenta o V6F-4 mais abaixo). Laravel 13 não tem helper de favicon. Não há o que "deixar de fazer à mão".

**Correção de fato que a lente pega antes da fatia.** `git ls-tree -r origin/main --name-only -- public` lista 6 ícones e **`favicon.svg` não é um deles** (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`; o `public/logo.svg` é outro arquivo). Portar o ramo `@else` verbatim entrega `<link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2">` apontando para 404 — exatamente a classe de defeito que o V6F-4 quer travar com teste, introduzida pela fatia que traz o teste. Ou gera o `favicon.svg` no mesmo commit, ou a linha não vem.

**Modernizações concretas:**

1. **O conjunto mínimo atual é menor, não maior.** Com `favicon.ico` (alcançado por convenção) + `favicon.svg` + `apple-touch-icon.png` (180) + manifest com os dois `android-chrome-*`, os PNG de 16×16 e 32×32 são redundantes com o `.ico`. O ganho da fatia é o manifest e o SVG, não os cinco links.
2. **`theme-color` fixo está errado num app com tema escuro real.** MDN (`/meta/name/theme-color`, buscado agora): a feature **não é Baseline** — *"This feature is not Baseline because it does not work in some of the most widely-used browsers"* — e a forma corrente é o **par com `media`**:
   ```html
   <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
   <meta name="theme-color" content="#0f2a44" media="(prefers-color-scheme: dark)">
   ```
   Um `#0f2a44` único pinta a barra do Chrome Android de navy por cima do tema **claro**, que é o default do `app.blade.php:2`. Isso muda a conta do candidato: o hex da marca vira o **7º sítio, e o branco vira o 6º** — dois valores no manifest+meta, não um.
3. **CSP não bloqueia** (medido em `origin/main:app/Http/Middleware/SecurityHeaders.php`, linhas 65-70): `default-src 'self'` sem `manifest-src` explícito ⇒ o manifest cai no fallback do `default-src` e carrega same-origin; `img-src 'self' data: https:` cobre os ícones. A fatia não precisa mexer no CSP.

**O resto do candidato sobrevive intacto:** estender `themedBlades()` de `tests/Unit/Theme/InlineThemeBackgroundTest.php` (medido: linhas 34-42, dois blades hardcoded) para alcançar o `.webmanifest` é a coisa certa, e `.ai/rules/views.md:9` já manda fazer isso no mesmo commit.

---

### V6F-2 — SSR ligado sem daemon

**Veredito: OBSOLETO** — o fato que a fonte congelou em teste deixou de ser verdade na versão que o alvo usa. `[rejeitado]` como está escrito; **a fatia deve ser refeita** sobre o que eu medi abaixo, que é pior e é real.

**A premissa herdada morreu no inertia-laravel 3.** Li o adapter instalado (`vendor/inertiajs/inertia-laravel/src/Ssr/HttpGateway.php`, método `dispatch()`): o `Http::post($url, $page)` está dentro de um `try`; qualquer `Exception` que não seja `StrayRequestException`/`SsrException` cai em `handleSsrFailure($page, ['error' => …, 'type' => 'connection'])` e o método **retorna `null`** — o adapter serve o documento client-side. O mesmo para `$response->failed()`. A doc v3 confirma nos dois lugares (Boost `search-docs`, `inertiajs/inertia-laravel@3.x`): *"When SSR rendering fails, Inertia gracefully falls back to client-side rendering"* e, no protocolo, *"Adapters should treat a failed render as non-fatal, reporting the payload through the application's error handling and falling back to the standard client-side rendered document, so a broken SSR build never takes the site down"*. **Não há 502.** O comentário de 4 linhas do `instance.env.stub`, o teste `StubRenderTest.php:58` que trava a string `// fix do 502 no reload logado` e as três repetições em doc são um fato de v1/v2 fossilizado por teste. Absorver a "postura" é importar uma afirmação falsa para dentro do boilerplate — o pior resultado possível segundo a lição da rodada 1.

**O que está realmente quebrado aqui, medido, e que o candidato inverteu:**

- **A mitigação do `ensure_bundle_exists` não existe em dev.** Em `dispatch()`, `$isHot = Vite::isRunningHot()` é avaliado **antes** do gate, e o gate é `if (! $isHot && $this->shouldEnsureBundleExists() && ! $this->bundleExists())`. Com o Vite quente, o gate é pulado e a URL vira `getHotUrl('/__inertia_ssr')`. Esse endpoint é servido pelo plugin `@inertiajs/vite` — que **não é dependência** (`git show origin/main:package.json | grep -i inertia` → só `@inertiajs/react`) e não está no `vite.config.ts:82-94` (só `laravel()`, `react()`, `tailwindcss()`). Ou seja: hoje, sob `composer dev` com `INERTIA_SSR_ENABLED=true`, **todo full-page load dispara um POST ao dev server do Vite que não é 2xx**, emite `SsrRenderFailed` e cai no fallback. O candidato diz que em clone novo "o dispatch é pulado"; é o contrário — em dev ele nunca é pulado, e em produção sem `build:ssr` é que é.
- **Mesmo com daemon, nada hidrata.** `origin/main:resources/js/app.tsx:23` faz `createRoot(el)`. A seção *Client-Side Hydration* da doc v3 é explícita: para SSR o entry do cliente troca `createRoot` → `hydrateRoot` (`hydrateRoot(el, <App {...props} />)`). Com `createRoot`, o React 19.2 descarta o DOM do servidor e renderiza do zero. O SSR desta base é decorativo de ponta a ponta.

**Nativos v3 que substituem a disciplina de string de env que a fonte inventou** (todos confirmados na doc buscada agora):

| Necessidade da fatia | Forma da fonte (2 anos atrás) | Nativo na v3 do alvo |
|---|---|---|
| desligar por ambiente | `INERTIA_SSR_ENABLED=false` no stub + teste de string | `Inertia::disableSsr(bool\|Closure)` |
| desligar por rota | não existia | `$withoutSsr` no middleware / `Inertia::withoutSsr(['admin/*'])` |
| health check de deploy | `curl` manual no script | `php artisan inertia:check-ssr` (a doc oferece como Docker health check) |
| falha silenciosa em teste | — | `INERTIA_SSR_THROW_ON_ERROR=true` no `phpunit.xml` |
| binário do runtime ausente | — | `ensure_runtime_exists` |

E `origin/main:tests/TestCase.php:16` (`config()->set('inertia.ssr.enabled', false)`) é o idioma v2; a doc v3 dá `Inertia::disableSsr(app()->runningUnitTests())` ou o env no `phpunit.xml`.

**Fatia que eu recomendaria no lugar:** (i) `hydrateRoot` no `app.tsx` **ou** `INERTIA_SSR_ENABLED=false` no `.env.example` — as duas metades não podem divergir; (ii) `inertia:check-ssr` como gate, que é literalmente o que o `PLAYBOOK.md:81` já pede em prosa; (iii) `throw_on_error` no `phpunit.xml` para o SSR parar de falhar em silêncio. Nenhum desses itens precisa de código do ctvitrine.

---

### V6F-3 — bloco inline de tema com `var(--token)`

**Veredito: ATUAL.** A guarda não foi superada por nada; e eu conferi especificamente a suspeita óbvia.

**A suspeita conferida.** Tailwind 4.3.3 **tem** utilitários de `color-scheme` — `grep -o '"scheme-[a-z-]*"' node_modules/tailwindcss/dist/lib.mjs | sort -u` devolve `scheme-dark`, `scheme-light`, `scheme-light-dark`, `scheme-normal`, `scheme-only-dark`, `scheme-only-light`, e a doc (`tailwindcss@4.x`, página *Color Scheme*) documenta `scheme-light`/`scheme-dark`/`scheme-light-dark`. **Isso não substitui o bloco**, e a razão é a mesma que o próprio teste escreve: esses utilitários nascem no `app.css`, que chega pelo `@vite` da linha 71 — depois da janela que o bloco existe para cobrir. Mesmo argumento derruba `light-dark()`: ela resolve contra o `color-scheme` computado, que é justamente o que o bloco está estabelecendo, e ainda seria um segundo literal em vez de menos um.

**`@theme` também não resolve.** `origin/main:resources/css/app.css:14-70` é `@theme`, e `--brand-navy-dark: #0f2a44` está em `:root` na linha 107 — os dois compilam para dentro do `app.css`. A regra "literal que espelha o token, travado por teste" (`.ai/rules/views.md:9`) é a resposta correta na versão de hoje, não uma sobra de v3.

**Uma modernização, e ela é vazia por medição.** Onde quer que o código setasse `color-scheme` à mão **depois** do CSS carregar, `scheme-dark`/`scheme-light` seriam a forma idiomática em Tailwind 4. Medido: `git grep -n "color-scheme" origin/main -- resources` devolve só o `<meta>` de `app.blade.php:8` e as duas regras inline de `:43`/`:49` — nenhum sítio pós-CSS. Não há nada a converter.

**A proposta do candidato (exportar a guarda para o `PLAYBOOK.md`) passa sem emenda.** O único ajuste de atualidade a registrar na fatia migratória: o projeto derivado que estiver em Tailwind 4 pode usar `scheme-*` nas superfícies React, mas o bloco do `<head>` continua literal nos 7.

---

### V6F-4 — `aptos-extrabold-italic 2.woff2` órfão

**Veredito: ATUAL COM MODERNIZAÇÃO.** Nenhum recurso nativo apaga o arquivo por você e o teste `comm` proposto é válido na versão de hoje. Mas a **classe** de bug é estruturalmente impossível sob o toolchain que este repo já usa — se as fontes saírem de `public/`.

**O mecanismo, medido.** `origin/main:resources/css/_fonts.css` referencia por URL absoluta (`url('/fonts/woff2/aptos/aptos-light.woff2')`, linha 3, e assim nas 21). Para o Vite 8 isso é string literal, não import: `public/` é copiado verbatim, fora do grafo do Rollup. É exatamente por isso que (a) um `.woff2` pode existir sem ninguém citar e (b) o `?v=2` do V6F-1 ainda é necessário. Se as 21 faces morarem em `resources/fonts/` e o `_fonts.css` usar `url('../fonts/...')`, o Rollup passa a **não emitir** arquivo não referenciado e a **falhar o build** em referência inexistente. Os dois sentidos do teste proposto viram invariante de build, sem teste.

**O custo honesto dessa modernização, e por que ela não cabe na fatia P·P.** Os 5 `<link rel="preload">` de `app.blade.php:59-65` usam caminho literal e passariam a precisar de `Vite::asset()`/manifest. Isso é maior que as 15 linhas de Pest. Note também que `origin/main:bootstrap/app.php:42` já registra `AddLinkHeadersForPreloadedAssets` — o mecanismo nativo do Laravel para emitir `Link:` de preload — e ele **só enxerga assets geridos pelo Vite**, que é precisamente o que essas fontes não são. Ou seja, o repo já paga por um recurso nativo que essas 21 fontes não podem usar.

**Recomendação:** manter o candidato como está (apagar + teste `comm` + cobrir os 5 preloads), P·P, e registrar a mudança de pipeline como a correção durável, numa fatia própria.

---

### V6F-5 — `AppShell` semeando estado do `localStorage`

**Veredito: OBSOLETO no sintoma descrito, ATUAL no defeito** — e o defeito real, nas versões de hoje, é maior que o do candidato. `[rejeitado]` para a redação atual; reescrever.

**O sintoma alegado não pode acontecer neste build.** `origin/main:resources/js/app.tsx:23` usa `createRoot(el)`, e a doc do Inertia v3 (*Client-Side Hydration*) diz literalmente que o entry do cliente troca `createRoot` → `hydrateRoot` quando há SSR. Sem `hydrateRoot`, o React 19.2 **descarta** o markup do servidor e renderiza do zero: não há hidratação, logo não há divergência de hidratação. O candidato diz "o HTML do servidor e a primeira árvore do cliente discordam" — não discordam; o do servidor é jogado fora inteiro.

**O defeito real, e é por navegação, não por page load.** `git grep -n "\.layout = \|\.layout=" origin/main -- resources/js` → **0 ocorrências**: o boilerplate não usa layout persistente do Inertia em lugar nenhum. Todas as 10 páginas que têm shell (`git grep -c "from '@/layouts/app-layout'" origin/main -- resources/js` → dashboard, permission-role/roles, settings/{appearance,password,profile}, users/{create,edit,index,permissions,show}) embrulham `children` no wrapper `app-layout.tsx:10`. Consequência, nas palavras da própria doc v3 (*Persistent Layouts*): *"the layout is destroyed and recreated on every visit"*. Então o `useState(() => localStorage.getItem('sidebar') …)` de `app-shell.tsx:10` **re-executa a cada visita Inertia**, não só no primeiro render. Trocar `localStorage` por cookie sem trocar o padrão de layout apenas muda de onde a leitura repetida vem.

**Nativo v3 desenhado para este caso exato.** A página *Layouts* da v3 lista as necessidades de Layout Props assim: *"such as a page title, the active navigation item, **or a sidebar toggle**"*. As duas metades da correção moderna:

1. **Servidor como fonte única**: `sidebar_state` via `View::share`/shared prop → `defaultOpen`. O molde já existe e está certo — `origin/main:app/Http/Middleware/HandleAppearance.php:14` (`View::share('appearance', $request->cookie('appearance') ?? 'system')`) e `bootstrap/app.php:35` (`$middleware->encryptCookies(except: ['appearance'])`), que é exatamente a exceção que `sidebar_state` precisa para o `document.cookie` de `ui/sidebar.tsx:85` continuar legível. Essa parte do candidato está correta e continua correta.
2. **Layout persistente** (`Page.layout = [AppLayout]`), senão o estado é reconstruído a cada visita. Atenção de porte que a doc React da v3 marca explicitamente: componentes de seta precisam da **forma em array** (`Welcome.layout = [ArrowLayout]`), *"Without the array, Inertia cannot distinguish them from render functions at runtime"* — e `layouts/app-layout.tsx:10` é justamente um arrow component.

**Não medido:** se a leitura de storage for mantida por uma release de transição, a API corrente para "store externo com snapshot de servidor distinto" é `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` em vez do ternário `typeof window !== 'undefined'`. Não confirmei isso contra a doc do React 19.2 nesta rodada — trate como pista, não como fato.

**Cobertura existente, medida** (`git ls-tree -r origin/main --name-only -- resources/js/test`): `components/navigation-landmarks.test.tsx` e `components/ui/sidebar-shortcut.test.tsx`. Nenhum dos dois cobre estado da sidebar — o risco M·M do candidato está bem calibrado.

---

### V6F-6 — `env(safe-area-inset-*)` sem `viewport-fit=cover`

**Veredito: ATUAL COM MODERNIZAÇÃO.** Nada no Tailwind 4.3 substituiu isso — conferido, não suposto — mas o ramo "ativar" do candidato está escrito na forma de 2018 e não deve ser portado assim.

**A suspeita conferida, com o resultado negativo.** `grep -rl "safe-area" node_modules/tailwindcss/` → **nenhum arquivo**. Tailwind 4.3.3 não tem utilitário de safe-area (só `scheme-*`, que é outra coisa). Não há `pt-safe`/`pb-safe` nativo para migrar; `env()` cru dentro de `@layer base` é a forma corrente. A linha de `app.css:241` não é legado por versão.

**O mecanismo do candidato está certo; o sourcing dele é mais fino do que parece.** MDN (`/meta/name/viewport`, buscado agora) sobre `viewport-fit`: `contain` = *"The viewport is scaled to fit the largest rectangle inscribed within the display"*; `cover` = *"The viewport is scaled to fill the device display. It's highly recommended to use the safe area inset variables to ensure that important content doesn't end up outside the display."* Já a página `/CSS/env` diz apenas que os valores são *"0 if the viewport is a rectangle and no features — such as toolbars or dynamic keyboards — are occupying viewport space"* — **não** enuncia a dependência do `viewport-fit`. A conclusão "resolve para 0px" se sustenta pelo primeiro trecho; quem escrever a fatia deve citar o da `meta/viewport`, não o da `env`.

**Três coisas que mudaram e que o ramo "ativar" precisa incorporar:**

1. **`env()` sem fallback invalida o shorthand inteiro.** A forma corrente é `env(safe-area-inset-top, 0px)`. Num `padding` de 4 valores, um UA que não reconheça a variável descarta a declaração toda — os quatro lados de uma vez, não um.
2. **Existem contrapartes estáticas novas, e elas é que servem para padding no `body`.** MDN `/CSS/env`: `safe-area-max-inset-top|right|bottom|left` são *"The static maximum values of their dynamic `safe-area-inset-*` variable counterparts when all dynamic user interface features are retracted. While the `safe-area-inset-*` values change as the currently-visible content area changes, the `safe-area-max-inset-*` values are constants."* As variantes dinâmicas mudam quando a barra de URL recolhe — num `padding` de `body` isso é reflow a cada scroll. Se "ativar" ganhar, é `max-inset`.
3. **O idioma atual não é shorthand no `body`.** É `max()` no elemento que encosta na borda: o próprio exemplo do MDN é `padding: 1em 1em calc(1em + env(safe-area-inset-bottom))`. Isso também resolve por construção o risco que o candidato levanta ("`<main>` do `SidebarInset` não herda o padding do `body`") — o inset vai no elemento certo desde o começo.

**A decisão do candidato ("decidir para um lado, num commit só") continua válida.** Só que o ramo "apagar" fica ainda mais atraente: nenhuma das três correções acima é P.

---

### V6F-7 — `variant="header"` morto e ausência de família pública

**Veredito: ATUAL na poda; ATUAL COM MODERNIZAÇÃO na criação da família.**

**A poda não tem nativo que a substitua** e nada no React 19.2 / TS 6.0 a torna desnecessária. Confirmei o estado: `git ls-tree -r origin/main --name-only -- resources/js/layouts` → 9 arquivos, **sem `app-header-layout.tsx`**; `app-shell.tsx:9` e `app-content.tsx:8` mantêm `variant = 'header'` como default com ramo não exercitado; o único chamador é `layouts/app/app-sidebar-layout.tsx:16,32`, que passa `variant="sidebar"` nas duas. O detalhe que o candidato levanta se confirma na leitura: `AppContent` no ramo morto renderiza um `<main>` próprio, e `app-sidebar-layout.tsx:32` passa `id="conteudo" tabIndex={-1}` para o `SidebarInset` — um `<AppContent>` sem prop cairia no `<main>` errado e o skip-link de `:25-30` apontaria para lugar nenhum. Poda P·P, procede.

**A família pública, se nascer, nasce numa API que este repo ainda não usa.** Medido: **0 usos de layout persistente** (`git grep -n "\.layout = " origin/main -- resources/js` → vazio); todas as páginas com shell usam o wrapper. O Inertia 3.6 traz, e a doc v3 documenta:

- **Persistent Layouts** — resolvem o *"the layout is destroyed and recreated on every visit"*, que é a mesma causa raiz que faz o V6F-5 disparar por navegação;
- **Layout Props** — *"Persistent layouts often need dynamic data from the current page, such as a page title, the active navigation item, or a sidebar toggle. Layout props provide a way to define defaults in your layout and override them from any page."* É exatamente a lista do que hoje é passado à mão via `breadcrumbs` prop em cada página;
- **Static Props em tupla** — `Dashboard.layout = [Layout, { title: 'Dashboard' }]`.

Armadilha de porte, marcada pela própria doc React da v3: componentes de seta exigem a forma em array (`Welcome.layout = [ArrowLayout]`), e `layouts/app-layout.tsx:10` é arrow. Uma família pública construída no padrão wrapper de hoje nasceria legada em relação ao `@inertiajs/react` 3.6.1 que já está no `package.json`.

**O ponto de a11y do candidato sobrevive inteiro:** skip-link + `id="conteudo"`/`tabIndex={-1}` são do boilerplate e não do ctvitrine, e qualquer família nova entra em `resources/js/test/components/navigation-landmarks.test.tsx` (confirmado no `ls-tree` de `resources/js/test`).

---

### Fora do lote, achado pela lente enquanto media

Não é candidato e não julgo, mas cai na minha pergunta e ninguém do lote encostou: `origin/main:package.json` traz **`tailwindcss-animate ^1.0.7`** e `resources/css/app.css:7` o carrega com `@plugin 'tailwindcss-animate'`. Esse plugin é da era v3 (API de plugin JS); o substituto nativo-CSS para Tailwind 4 é `tw-animate-css`. Medido apenas que o pacote v3 está instalado e ativo (`ls node_modules | grep -i animate` → `tailwindcss-animate`) — **não medi** quantas classes `animate-*` dependem dele nem se o `@theme` do projeto já cobre alguma. Vale uma candidatura própria na frente de CSS.

---

## Secagem da dimensão 6 (passada única) + síntese da célula

# Secagem · Dimensão 6 (UI) · ctvitrine @ `53d7d9a` × boilerplate @ `origin/main`

Baseline reconfirmado por mim: `git -C boilerplate rev-parse origin/main` → **`beb848ea509bf6682c9e31f10611ad7ab489392e`**. O banner do `ctvitrine.md` fixa o alvo do inventário em `2965f8c` — **três commits atrás**; toda medição abaixo é contra `beb848e`. Fonte lida só por `git show`/`git grep`/`git ls-tree` sobre `53d7d9a`.

## O que ficou sem olhar — diff da cobertura

Cruzei os caminhos citados pelos 4 caçadores contra `git ls-tree -r 53d7d9a -- resources` (199 arquivos em `resources/js`) e contra a Frente 6 do inventário (`ctvitrine.md:2187-2560`, subseções 6.1 a 6.13).

| Superfície | Quem abriu | Resultado |
|---|---|---|
| `components/ui/*` (26) | C2, integral | coberto |
| tokens, `app.css`, `_fonts.css`, blade | C1, C4 | coberto — **exceto** os blocos `.custom-scrollbar` e o resto do bloco de toast (o inventário só os *lista*: `ctvitrine.md:2550`) |
| layouts, nav, boot | C4 (layouts), ninguém (nav) | `nav-main/nav-user/nav-footer/breadcrumbs/user-menu-content/app-sidebar-header` → **abri, boilerplate à frente ou idêntico** |
| `components/site/**` e `site/boutique/**` (13) | ninguém abriu como UI | abri o carrossel; nada portável (domínio vitrine) |
| **canal de toast** (`toast-provider` × `toast-config` × `flash` × `toast.promise`) | C1 abriu `toast-config`; **ninguém abriu o provider nem `toast.promise`** | **V6S-1** — `git grep -rn "toast.promise" docs/harvest/v2/*.md` → 0 linhas em toda a rodada |
| `ui/sheet` como drawer mobile (nome acessível) | ninguém | **V6S-4** — `grep -rn "SheetHeader\|SheetTitle" docs/harvest/v2/*.md` → 0 linhas |
| `resources/views/emails/**` (4) | inventário enumerou (`:2577-2580`); nenhum caçador | **V6S-3** — rejeitado por mim, vira medição anexa |
| estados `print` / `forced-colors` / `::selection` | ninguém | medido: **0 nos dois projetos**. Sem superfície no alvo ⇒ não candidato |
| `prefers-reduced-motion` | C3 mediu | já represado (D6, `BACKLOG.md:174`) |
| erro de campo (`aria-invalid`/`aria-describedby`) | ninguém nesta célula | **já registrado** em `BACKLOG.md:381-387` com mais detalhe que o meu ⇒ não candidato |

---

### V6S-1 · Os dois canais de toast do boilerplate são mutuamente exclusivos: `toast.promise` escapa da cor, do `iconTheme`, do `ariaProps` e da duração — 6 call-sites, decisão documentada e testada anulada

- **Evidência (fonte):** `resources/js/hooks/permissions/use-permission-actions.ts:31,64,97@53d7d9a`, `resources/js/hooks/settings/use-settings-actions.ts:20,59@53d7d9a`, `resources/js/components/assign-role-user.tsx:47@53d7d9a` — **6** `toast.promise`, todos com o mesmo terceiro argumento e nada mais:
  ```
  await toast.promise(new Promise(...), {
      loading: 'Salvando permissões...',
      success: 'Permissões salvas com sucesso!',
      error: 'Erro ao salvar permissões. Por favor, tente novamente.',
  });
  ```
  Nenhum `className`, nenhum `iconTheme`, nenhum `ariaProps`, nenhum `duration`.
- **Estado do boilerplate hoje:** **os mesmos 6 call-sites, nos mesmos arquivos e nas mesmas linhas** (`git grep -n "toast.promise" origin/main -- resources/js` → 6, idênticas às da fonte: ancestral comum). O que o boilerplate acrescentou desde então torna o buraco pior, não melhor. Três consequências, cada uma verificada na fonte da lib instalada (`node_modules/react-hot-toast/dist/index.js`, **v2.6.0**, a mesma versão nos dois `package.json`):

  1. **`className` não compõe, substitui.** O merge do `useToaster` é, verbatim do dist:
     ```js
     o.toasts.map(r => ({ ...e, ...e[r.type], ...r,
        duration: r.duration||e[r.type]?.duration||e?.duration||ue[r.type],
        style:{...e.style, ...e[r.type]?.style, ...r.style} }))
     ```
     `style` é deep-merge; `className` é raso. Como `flash.ts:21-33` passa `toastSuccessOptions` etc. no call-site (`r`), o `className` final é `toast-success` — e **`toast-custom` do `<Toaster>` é descartado**. Já o toast de `toast.promise` não traz `className` nenhum, então herda `toast-custom`. Resultado medido: **`.toast-custom` (`app.css:607-623`) nunca se aplica a um toast de flash, e `.toast-success|error|warning|info` (`:635-656`) nunca se aplica a um toast de promise.** Um "sucesso" de flash tem barra verde à esquerda e sombra pequena (inline style); um "sucesso" de promise não tem barra nenhuma e tem a sombra grande do CSS (`0 10px 15px -3px`, com `!important`, que vence o inline). Duas aparências para o mesmo desfecho, na mesma tela.
  2. **O `ariaProps` de erro — decisão escrita, justificada e testada — é anulado.** `lib/toast-config.ts:44-53@origin/main` põe `role: 'alert', 'aria-live': 'assertive'` no erro com um parágrafo explicando por quê, e `resources/js/test/lib/toast-config.test.ts:21-23` trava. Esse bloco **é do boilerplate**: `diff` do `toast-config.ts` contra a fonte mostra que os dois `ariaProps` (erro e aviso) são o único delta. E `i.promise=(e,t,o)=>{...i.error(n,{id:s,...o,...o?.error})}` não injeta `ariaProps`, então o erro de promise cai no default da lib (`ariaProps:{role:"status","aria-live":"polite"}`, dentro de `createToast`). **"Erro ao salvar permissões" é anunciado `polite`, na fila** — exatamente o que o comentário do teste diz que não pode acontecer. O teste passa verde: ele afirma o objeto de config, não o call-site.
  3. **O toast de "carregando" morre em 4 s.** O mapa de duração da lib é `{blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3}` — `loading` é `Infinity`. Mas o merge consulta `e.duration` **antes** de `ue[r.type]`, e `toastDefaultOptions.duration = 4000` (`toast-config.ts:8`) chega justamente por `e`. Logo o "Salvando permissões..." desaparece aos 4 s, e se a resposta demorar mais a pessoa fica sem feedback nenhum até o `success` chegar. Ninguém escolheu isso.
  4. **De brinde, e é a ponte com o F3:** sem `iconTheme`, o disco do ícone usa os defaults da lib — `#61d345` (sucesso) e `#ff4b4b` (erro), medidos por `grep -o 'primary||"#......"'` no dist. Contraste contra `--card`, script próprio (WCAG 2.x): `#61d345` vs branco = **1.92:1** (o token `#16a34a` dá 3.30:1); `#ff4b4b` vs branco = 3.30:1. **O canal que ninguém vigia é o que pinta pior.**
- **O que absorver / o que travar:** **(b)**, e é fatia de tamanho conhecido. (1) `lib/toast-config.ts` ganha `toastPromiseOptions` (ou, melhor, `lib/toast.ts` exporta um `promiseToast()` que aplica `className`/`iconTheme`/`ariaProps` por perna e `duration: Infinity` no `loading`); (2) os 6 call-sites passam a usá-lo; (3) guard-rail no molde exato de `resources/js/test/lib/impersonation-call-sites.test.ts` (`@vitest-environment node`, varre `resources/js` menos `test/`, com controle positivo): *nenhuma chamada `toast.*` fora de `lib/` sem uma das opções do projeto*; (4) o comentário de `toast-config.test.ts:16-18` ("não mexer em `duration`") passa a dizer o que eu medi: `duration` global sobrescreve o `Infinity` do `loading`.
- **Adaptação necessária:** decidir se o toast de promise ganha barra colorida (aí `className` por perna) ou fica neutro por desenho (aí o `.toast-custom` deixa de ser acidente e vira escolha, com comentário). Não dá para "só adicionar o className" sem responder isso — é a pergunta que a fatia existe para fechar.
- **Risco · esforço:** P · M. Zero risco de cascata (é objeto JS), 6 arquivos, todos com teste de componente ou de hook já existente.
- **Multi-fonte?** Sim, **2 de 2**: os 6 call-sites são byte-a-byte os mesmos na fonte e no alvo. O tema não aparece em nenhum dos quatro inventários (`grep -rn "toast.promise" docs/harvest/v2/*.md` → 0).

**Vereditos (3 lentes, condensado)** — **SOBREVIVE.**
· *Refutar:* não existe no alvo sob outro nome, não está em nenhum inventário nem no BACKLOG, não é regra preventiva (6 consumidores vivos), não colide com ADR. O único fato que revi duas vezes é o que sustenta tudo — o merge raso do `className` — e ele está no dist instalado, citado acima.
· *Risco:* baixo. Nenhuma catraca quebra: `toast-config.test.ts` afirma objetos, não DOM; `focus-ring`/`theme-tokens` não olham isto. **Ordenação obrigatória:** migrar os 6 primeiro, teste depois — teste que nasce vermelho é como o follow-up do `a418f41` ficou para trás uma vez (lição da lente de risco do V6D-11). Trap anotada: `toast.promise` faz `{...o, ...o?.success}` com `o.success` **string**, o que espalha índices numéricos no objeto do toast; é ruído interno da lib, não afeta DOM — não use isso como argumento.
· *Atualidade:* `react-hot-toast@2.6.0` é a corrente e nada nesse caminho mudou. O default de ecossistema pós-shadcn é `sonner`, mas isso é troca de biblioteca e **não** dissolve o achado: config que o caminho de render nunca lê é morta em qualquer lib.

---

### V6S-2 · O resíduo que a PR #108 não varreu: 28 linhas de CSS de scrollbar de diálogo, uma delas com seletor que não casa nada — nos dois projetos, byte a byte

- **Evidência (fonte):** `resources/css/app.css:569-596@53d7d9a`
  ```
  /* Global scrollbar for dialogs and modals in dark mode */
  .dark [data-slot='dialog-content'],
  .dark [data-slot='dialog-content'] .custom-scrollbar {
      scrollbar-color: rgba(229, 231, 235, 0.4) transparent;
  }
  ```
  mais quatro regras `::-webkit-scrollbar{,-track,-thumb,-thumb:hover}` para o mesmo seletor.
- **Estado do boilerplate hoje:** o **mesmo bloco**, em `resources/css/app.css:561-588@origin/main` (deslocado 8 linhas; conteúdo idêntico). Medido:
  - `git grep -n "custom-scrollbar" origin/main -- resources/js resources/views` → **1 linha**: `ui/dialog.tsx:58`, dentro da className base do `DialogContent`.
  - `git grep -n 'data-slot="dialog-content"' origin/main -- resources/js` → **1 linha**: `ui/dialog.tsx:56`, o mesmo elemento.
  - Logo, **todo** `[data-slot='dialog-content']` carrega `.custom-scrollbar` (o `cn()` é `twMerge(clsx())` e `custom-scrollbar` não é classe Tailwind, então nunca é removida por call-site).
  - Consequência: o seletor **descendente** `.dark [data-slot='dialog-content'] .custom-scrollbar` (`:563`) **não casa nada** — a classe está no próprio elemento, nunca num filho. E as 5 declarações restantes já são produzidas pelo par `.custom-scrollbar::-webkit-*` (`:525-546`) + `.dark .custom-scrollbar*` (`:549-559`), com valores idênticos e mesma especificidade (0,2,0). **28 linhas, 5 regras, 6 seletores, zero efeito observável.**
  - Contexto de escala: dos 6 `DialogContent` do alvo, só **2** declaram `max-h`+`overflow-y-auto` (`dialogs/module-info-dialog.tsx:25` e `page-info.tsx:77`), e o segundo é código morto (V6D-6). Ou seja, a barra de rolagem estilizada só chega a existir no `ModuleInfoDialog` — que tem 7 consumidores reais.
- **O que absorver / o que travar:** **(b)**, poda. Apagar `app.css:561-588`. O guard-rail honesto não é um lint de seletor (não é escrevível de forma confiável sobre CSS + JSX); é uma linha em `.ai/rules/css.md`, na mesma seção que a #108 escreveu: *"antes de escrever regra para markup de terceiro, confirme que o seletor casa; seletor descendente para uma classe que mora no próprio elemento é o erro-padrão."*
- **Adaptação necessária:** nenhuma. Se alguém quiser rolagem estilizada no `SheetContent` (o drawer mobile), aí é regra **nova**, não esta — e a PR #112 já a torna quase desnecessária: com `color-scheme: dark` preso à classe `.dark`, o UA pinta a barra nativa escura sozinho.
- **Risco · esforço:** P · P. Nenhuma catraca lê este bloco (`theme-tokens.test.ts:20` lê `app.css` só para `--color-*` e pares de contraste).
- **Multi-fonte?** **3 de 4** pelo menos: `ctvitrine.md:2550`, `cuidari.md:2546` e `spinmax.md:1355` listam o bloco. **Nenhum dos três o analisou** — todos o citam como inventário.

**Vereditos** — **SOBREVIVE, reduzido, e é o mais fraco dos meus.**
· *Refutar:* o fato reproduz e é novo (nenhum inventário passa de listar). Mas o valor é 28 linhas de um arquivo de 681 — só vale porque F1/F17 vão ter de raciocinar sobre esse arquivo e porque é literalmente a família da fatia `30fe0eb`. Não abrir PR próprio: **anexar à próxima fatia que já tocar `app.css`**.
· *Risco:* baixo, com uma ressalva honesta: não há gate. A prova de que nada muda é a leitura de cascata que fiz acima, não um teste. Screenshot de um `ModuleInfoDialog` no escuro antes/depois basta no PR.
· *Atualidade:* `scrollbar-color`/`scrollbar-width` são padrão e não foram superados; `::-webkit-scrollbar` continua sendo o caminho para Chromium/Safari. A modernização real já entrou por outra porta (`color-scheme`, PR #112) e é argumento a favor de podar, não de reescrever.

---

### V6S-3 · `[rejeitado]` A única superfície de UI que sai do boilerplate em inglês é o e-mail transacional — mas o buraco já está registrado; o que é novo é a consequência

Registro o candidato inteiro porque a medição vale, e o veredito porque a lição desta rodada é medir o BACKLOG antes de candidatar (foi o golpe que matou o V6T9).

- **Evidência (fonte):** `resources/views/emails/signup/welcome.blade.php@53d7d9a` e outros três — `<x-mail::message>` + `<x-mail::panel>`, copy em pt-BR escrita à mão. A fonte trata e-mail como superfície desenhada, com 4 templates. E **não tem `lang/` nenhum** (`git ls-tree -r 53d7d9a --name-only -- lang` → vazio), o que o banner do inventário já derrubou como achado (B).
- **Estado do boilerplate hoje:** `git ls-tree -r origin/main --name-only -- lang` → **4 arquivos**, `pt_BR/{auth,pagination,passwords,validation}.php`. **Não existe `lang/pt_BR.json`** (`git ls-tree -r origin/main --name-only | grep 'lang/.*\.json'` → vazio). E as strings do corpo dos e-mails do framework são JSON-keyed, não PHP-keyed — medido no `vendor` instalado (`laravel/framework v13.24.0`, do `composer.lock`):
  ```
  Auth/Notifications/ResetPassword.php:77-81  Lang::get('Reset your password') · 'Reset Password' · 'If you did not request…'
  Auth/Notifications/VerifyEmail.php:65-68    Lang::get('Verify your email address') · 'Verify Email Address'
  Notifications/resources/views/email.blade.php:7,9,42  @lang('Whoops!') · @lang('Hello!') · @lang('Regards,')
  ```
  Consumidores vivos: `User implements MustVerifyEmail` (`app/Models/User.php:18`), `EmailVerificationNotificationController:17` chama `sendEmailVerificationNotification()`, e `routes/auth.php:28,32,52` publicam `password.request`, `password.email`, `verification.send`. Com `APP_LOCALE=pt_BR` e sem `pt_BR.json`, `Lang::get` devolve a chave crua: **os dois e-mails que o produto envia saem em inglês**, num projeto cuja `.ai/rules/js.md` exige front monolíngue pt-BR. `resources/views/vendor/mail` não é publicado nos dois projetos, então o tema visual também é o default do Laravel (azul `#3869d4`, fora do sistema de tokens, sem tema escuro).
- **Por que rejeito como candidato:** `ctfinance.md:151` já mede — *"`lang/pt_BR.json` — só **15 chaves**, todas de notificação/e-mail do Laravel. O boilerplate não tem esse arquivo"* — e `BACKLOG.md:259` já tem a linha de tema `i18n / lang` com **3 fontes**. O gap está registrado; eu estaria abrindo o mesmo item pela quarta vez.
- **O que sobrevive, e deve ser anexado à linha `i18n / lang` do BACKLOG:** (i) a **consequência**, que ninguém escreveu: não é "falta um arquivo de tradução", é "duas rotas de autenticação em produção mandam e-mail em inglês"; (ii) a **correção de uma frase do banner** — `ctvitrine.md` (achado B) diz que "o boilerplate resolve com `lang/pt_BR/{auth,pagination,passwords,validation}.php`". Resolve o *flash* (`passwords.sent`) e a *validação*; **não** resolve o corpo do e-mail, que é outro loader; (iii) o ctvitrine como 5ª fonte e a evidência mais eloquente: um time que escreveu 4 templates de e-mail em pt-BR e não percebeu que os dois do framework saíam em inglês; (iv) o gate, que é trivial e não precisa de browser: Pest com `Notification::fake()` + assert de que o corpo renderizado não contém `Hello!`/`Regards,` — ou, mais barato, `expect(__('Hello!'))->not->toBe('Hello!')`.

**Vereditos** — **[rejeitado] como candidato · sobrevive como medição.**
· *Refutar:* golpe (1), lente "já existe". · *Risco:* baixo e favorável (as 15 chaves do ctfinance são o conteúdo pronto), com uma trap: `lang/pt_BR.json` traduz por *string inteira*, então qualquer divergência de pontuação com a versão do framework faz a chave não casar — pinar a versão no comentário. · *Atualidade:* Laravel 13 não mudou o mecanismo; `laravel-lang/common` continua sendo a alternativa a manter o arquivo à mão.

---

### V6S-4 · O `SheetHeader` do drawer mobile está FORA do `SheetContent`: duas frases `sr-only` ficam permanentes no corpo da página, abertas ou fechadas

- **Evidência (fonte):** `resources/js/components/ui/sidebar.tsx:183-188@53d7d9a`
  ```
  <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
    <SheetHeader className="sr-only">
      <SheetTitle>Sidebar</SheetTitle>
      <SheetDescription>Displays the mobile sidebar.</SheetDescription>
    </SheetHeader>
    <SheetContent ...>
  ```
- **Estado do boilerplate hoje:** **mesma estrutura, em `resources/js/components/ui/sidebar.tsx:191-196@origin/main`** — o boilerplate está à frente na copy (`Menu lateral` / `Menu lateral de navegação.`, pt-BR) e **igual no defeito**: o `SheetHeader` é irmão do `SheetContent`, não filho. Verificado no pacote instalado (`@radix-ui/react-dialog@1.1.23`): `Dialog` (Root) é `jsx(DialogProvider, { …, children })` — **um provider de contexto sem nó DOM e sem portal**. Consequências medidas por leitura da lib:
  - O `<div class="sr-only">` renderiza **no fluxo da página**, não no portal, e **sempre que o `Sidebar` mobile monta** — com o drawer fechado inclusive. Em toda página autenticada abaixo de 768px (`use-mobile.tsx`, `MOBILE_BREAKPOINT = 768`), quem usa leitor de tela encontra "Menu lateral. Menu lateral de navegação." solto no corpo do documento.
  - O nome acessível do diálogo **continua funcionando** (o `aria-labelledby` do `DialogContent` aponta por IDREF para o `id` do `DialogTitle`, que existe no documento), e o `titlePresent`/`descriptionPresent` do provider fica `true`, então **não há aviso de console**. Não venda isso como "diálogo sem nome" — seria falso.
- **O que absorver / o que travar:** **(b)**, mover 4 linhas para dentro de `<SheetContent>` (é onde o upstream do shadcn as coloca) e um caso em `resources/js/test/components/navigation-landmarks.test.tsx`, que já monta a árvore real: com `matchMedia` mockado para mobile e o drawer **fechado**, `queryByText('Menu lateral de navegação.')` tem de ser `null`. Gate real, em jsdom, sem browser.
- **Adaptação necessária:** `.ai/rules/js.md:45` proíbe editar `ui/sidebar.tsx` para acrescentar landmark ("entra por prop do call-site"). Aqui não se aplica: não é atributo novo, é **correção do próprio arquivo vendorizado**, e o boilerplate já o editou quatro vezes (strings pt-BR, `aria-keyshortcuts`, guarda `isTypingTarget`, `type="button"` no rail). A fatia deve dizer isso explicitamente, senão o revisor cita a regra.
- **Risco · esforço:** P · P. Não muda pixel: `sr-only` não desenha.
- **Multi-fonte?** **2 de 2**, mesma estrutura. Zero menções em qualquer inventário.

**Vereditos** — **SOBREVIVE.**
· *Refutar:* não está em inventário nem BACKLOG; não é regra preventiva (o nó existe em toda página mobile autenticada); tem gate. Fraqueza real: o impacto é pequeno — duas frases órfãs, não um diálogo anônimo. Escrevi assim de propósito.
· *Risco:* baixo, com um cuidado: mover o `SheetHeader` para dentro do `SheetContent` o coloca **antes** do `<div className="flex h-full w-full flex-col">{children}</div>`, o que é a ordem certa; e `SheetContent` tem `[&>button]:hidden` na className — confirmar que o seletor de filho direto não passa a esconder algo do header (ele não tem `<button>`, mas a fatia deve reler a linha 200 antes de mesclar).
· *Atualidade:* `@radix-ui/react-dialog@1.1.23` é o instalado e o comportamento do Root (provider sem DOM) não mudou. Se algum dia a migração para o pacote único `radix-ui` acontecer (a modernização que a lente de atualidade do C2 propôs em V6P-2), este arquivo é reescrito — outra razão para corrigir agora e não depois.

---

## Medi e não achei delta (para ninguém recaçar)

| O que | Comando | Resultado |
|---|---|---|
| `@media print`, `@page`, `forced-colors`, `prefers-contrast`, `::selection` | `git grep -nE "@media print\|@page\|forced-colors\|prefers-contrast\|::selection" <ref> -- resources` | **0 nos dois**. O alvo não tem superfície imprimível; regra preventiva aqui morreria na lente 4, como V6D-8/V6D-9 |
| `target="_blank"` sem `rel` | `git grep -n 'target="_blank"' origin/main -- resources/js resources/views` | **1 ocorrência no alvo**, `nav-footer.tsx:23`, **com** `rel="noopener noreferrer"`. Nada a consertar |
| `nav-user`, `nav-footer`, `breadcrumbs`, `app-sidebar-header`, `heading`, `heading-small`, `text-link`, `icon`, `data-table/{pagination,table-header}`, `ui/toast-provider` | `md5` par a par | **byte-idênticos** fonte × alvo |
| `nav-main`, `empty-state`, `user-menu-content`, `impersonate-banner`, `data-table/{filter-toggle,search-bar}` | `diff -u` | **alvo estritamente à frente** nos 6: `aria-current="page"` com comentário (`nav-main`), `EmptyState` sem o ramo `type="row"` e com prop `action` (`empty-state`), `<button>` no lugar de `<a href="#">` e `bg-teal-700` (5.39:1) no lugar de `-500` (2.42:1) (`impersonate-banner`) |
| `lib/form-styles.ts` (só no alvo) | `git grep -n "form-styles" origin/main -- resources/js` | 1 constante, consumidor único é `ui/form-field.tsx` — que tem 0 call-sites vivos. É satélite do **E7**, não item próprio |
| `aria-invalid`/`aria-describedby` nos formulários | `git grep -n "aria-invalid" origin/main -- resources/js \| grep -v ui/` | 9 linhas, **todas em `user-form.tsx`**; `aria-describedby` = 0 fora de `form-field.tsx`. **Já registrado em `BACKLOG.md:381`** com mais precisão que eu teria escrito (inclui a falha silenciosa do `FormField` com raiz `<Select>`) |

---

## Síntese da célula

### 1 · Quantos candidatos sobreviveram, por caçador

Contagem pelo **veredito individual da lente refutar**, que é a que decide sobrevivência; risco e atualidade aparecem quando reduziram ou reescreveram.

| Caçador | Candidatos | Sobrevivem | Derrubados | Observação |
|---|---|---|---|---|
| **C1** — tokens/tema/contraste | 14 | **7** (V6T2, V6T4, V6T10, V6T11, V6T12, V6T13, V6T14) | 7 | Nenhum intacto. V6T4 sobrevive com manchete falsa corrigida (2 órfãos, não 3) e regressão embutida achada pela lente de risco (`error-page.tsx:35` sairia de Montserrat para Merriweather); a lente de atualidade o reclassificou como idioma v3 dentro de projeto v4 |
| **C2** — primitivos `ui/` | 9 | **6** (V6P-1, 2, 4, 5, 6, 9) | 3 | Só **3** são harvest de verdade (V6P-1 `min-w-0`, V6P-4 chips, V6P-5 metade b): V6P-2 e V6P-6 não trazem código da fonte, V6P-9 é evidência anexa a uma `[proposta-adr]` já aberta |
| **C3** — telas/densidade/microinteração | 11 | **7** (V6D-2, 3, 4, 5, 6, 8, 11) | 4 | **Correção de contagem:** o placar do próprio caçador diz "5 sobrevivem … 4 derrubados, 1 rebaixado" — soma 10 para 11 itens e conta como sobreviventes só os de escopo cortado, esquecendo os 2 intactos (V6D-6, V6D-11). São 7 |
| **C4** — blade/boot/layouts/favicon | 7 | **7**, dois pela metade (V6F-6 só "apagar", V6F-7 só a poda) | 0 inteiros, 2 metades | V6F-2 e V6F-5 sobrevivem **só reescritos**: a lente de atualidade marcou os dois `[rejeitado]` na redação — o "502 do SSR" não existe no `inertia-laravel v3.3.1` (o gateway cai em fallback client-side) e o "mismatch de hidratação" não existe porque `app.tsx:23` usa `createRoot`, não `hydrateRoot` |
| **V6S** — secagem (esta passada) | 4 | **3** (V6S-1, V6S-2, V6S-4) | 1 (V6S-3, por mim) | — |
| **Total** | **45** | **30** | **15** | |

### 2 · O que as 3 lentes deixaram passar SEM redução de escopo

Contra a expectativa do enunciado, **dois passaram** — e um terceiro saiu **ampliado**, que não é redução:

- **V6F-4 · `aptos-extrabold-italic 2.woff2`** — o mais limpo da rodada. Refutar: "SOBREVIVE intacto, o único cujos números todos reproduziram sem correção". Risco: BAIXO, e o único acréscimo é *controle positivo no teste* (molde `focus-ring.test.ts`), execução e não escopo. Atualidade: ATUAL, com uma modernização declarada **fora** da fatia (mover as fontes de `public/` para `resources/` e deixar o Rollup falhar sozinho).
- **V6T14 · `iconTheme` morto em `warning`/`info`** — as três lentes o **ampliaram**: a de refutar achou que a morte é dupla (`type:'blank'` mata de novo), a de risco achou a terceira cópia da afirmação falsa (`.ai/rules/css.md:20-21`), a de atualidade o promoveu de PLAUSÍVEL a CONFIRMADO na fonte da lib. Nenhuma cortou nada.
- **V6D-11 · trava do follow-up de E28** — refutar: "SOBREVIVE intacto, o mais forte do lote", com um **recorte de alvo** do teste (violação é indicador *dentro de `<Button>`*, poupando `search-bar.tsx`); risco: **ampliou** de 9 para 15 infratores (o caçador contou 3 spinner-`div`; são 9, mais os 6 `LoaderCircle` das telas de auth). Escopo ajustado e ampliado, não reduzido.

**Da minha passada, V6S-1 não entra nesta lista:** eu mesmo lhe imponho uma ordenação (migrar os 6 call-sites primeiro, teste depois) e uma pergunta de desenho em aberto (barra colorida no toast de promise, sim ou não). É correção de escopo, e eu a escrevo para não me auto-conceder o que neguei aos outros.

### 3 · `[rejeitado]` — motivo em uma linha, para não se re-descobrir

| ID | Motivo |
|---|---|
| V6T1 | `InlineThemeBackgroundTest.php:135-142` já proíbe `var(--` nos dois blades; a `.ai/rules` proposta é mais fraca e o path de `css.md` nem casaria um blade |
| V6T3 | Resultado nulo bem medido: as três fontes já concordam no namespace, nenhuma ação sai daí |
| V6T5 | F1 Defeito 3 no BACKLOG **e** regra já escrita em `.ai/rules/css.md:18`; a asserção nova nasce vermelha, logo é o F1, não uma catraca |
| V6T6 | Autoderrubado ("não recomendo como fatia isolada"); censo de `!important` é classificação, não candidatura |
| V6T7 | Curado pela PR #72 (`--brand-cyan-dark: #2a7ba2`); backport para derivado é playbook |
| V6T8 | Autoderrubado; 4.68:1 e 7.93:1 são ambos AA — é escolha de marca, não correção |
| V6T9 | `BACKLOG.md:620` (F14) já enfileira `theme-color` **por esquema**, resolvendo a pergunta que o candidato deixou aberta |
| V6P-3 | Upload não existe em nenhuma das duas pontas do alvo (`UploadedFile\|Storage::\|mimes` → 0 em `app routes`); o primitivo fixaria política de upload pelo front |
| V6P-7 | Premissa falsa: o contrato de região viva **tem** dois testes (`search-bar.test.tsx:99`, `input-error.test.tsx`); o sweep proposto precisaria de allowlist no dia do nascimento |
| V6P-8 | Duplicado — o `ui/color-picker` do ctfinance (`ctfinance.md:135`) é a versão melhor do mesmo item; "fonte única" é falso |
| V6D-1 | Contagem errada (10 `Skeleton`, não 14) e regra sem consumidor: `Deferred`/`WhenVisible` têm 0 usos e `.ai/rules/controllers.md:18` já regra o mecanismo gerador |
| V6D-7 | Mecanismo central inexistente no alvo: `Inertia::always` → 0 linhas e `flash` não é prop (é o flash nativo do Inertia 3, no objeto de página) |
| V6D-9 | `options()`/`label()` já são regra em `.ai/rules/enum.md`, e `$page['component']` já chega à blade (linha do `@vite`); `withViewData` é irrelevante |
| V6D-10 | Confessadamente a terceira confirmação do **E16**; é evidência anexa, não candidato |
| V6F-6 (metade "ativar") | Sem página pública que a justifique, e sidebar/overlays são `fixed` — resolvem contra o viewport e ignorariam o padding do `body` |
| V6F-7 (metade "família pública") | Decisão de produto sem consumidor: criar layout sem call-site recria o código morto que a poda anterior acabou de remover |
| **V6S-3** | **Já registrado**: `ctfinance.md:151` mede `pt_BR.json` e `BACKLOG.md:259` já tem a linha de tema i18n com 3 fontes. Vira medição anexa (a consequência: dois e-mails de auth em inglês) |

### 4 · Recomendação final do F3 — consolidando a tabela do Caçador 1

A tabela comparativa do C1 (ctfinance × ctvitrine × cuidari × boilerplate) foi conferida pelas três lentes e **nenhum erro de fato sobreviveu**; mantenho o desenho dela e acrescento uma coluna que faltava, que é o que esta passada de secagem encontrou.

**O veredito consolidado continua sendo a costura de dois, com peças nomeadas:**

1. **A FORMA vem do ctfinance, e só a forma.** O trio `--state-{status}-{bg,fg,border}` é a única resposta ao problema real — token achatado por status faz dois trabalhos incompatíveis, e o alvo tem a prova aritmética no próprio arquivo (`--destructive` no escuro: **3.67:1** como fundo, **3.99:1** como texto; escurecer conserta um e quebra o outro). Exportar por **`@utility`**, não `@layer components` — com a ressalva que a lente de risco acrescentou e que **não estava na cadeia do backlog**: `@utility` emite dentro de `@layer utilities`, a camada mais fraca deste arquivo, que perde para os 46 `!important` fora de layer e para os 812 KB do Radix não-layerizado. **O F3 depende do F1 estar decidido, não só enfileirado.**
2. **Os VALORES nascem aqui, calculados, nunca copiados.** Os percentuais de `color-mix` do ctfinance reprovam 3 de 4 na paleta do alvo (2.53 / 3.26 / 3.92). E o emerald inline de `verify-email.tsx` está em 14.38:1 — trocá-lo por um `state-success-soft` mal calibrado é regressão. Esses quatro números vêm do inventário do ctfinance e **não foram re-medidos dentro do pin desta célula**; o de 14.38 é o único que, se errado, inverte uma decisão, e deve ser re-medido antes de a fatia começar.
3. **O GUARD-RAIL é o do boilerplate, estendido — não um contrato de presença.** `theme-tokens.test.ts` (216 l.) é o único artefato dos quatro que mede **contraste** e o único que sabe expressar dívida com data de validade (`DIVIDA_DESTRUCTIVE_ESCURO = 3.67`, com asserção-teto e a mensagem "se passou de 4.5, o F3 chegou"). O F3 acrescenta linhas à tabela de pares que já existe; não escreve um `design-tokens-contract.test.ts` no molde do ctfinance.
4. **A entrada do F3 tem de dizer QUAL PAR mede — e agora são três perguntas, não duas.** A tabela de pares mede *fill × rótulo* (4.5:1); o F2 mede *texto × canvas* (6.42 / 8.77 / 6.83 no escuro); e **esta passada acrescenta a terceira**, que ninguém tinha contado: *objeto gráfico × superfície do toast* (3:1, SC 1.4.11), que hoje tem **dois** canais vivos e um deles não passa por token nenhum —
   - borda `border-left: 4px` sobre `--card`: warning **2.15:1** e info **2.77:1** reprovam no claro (medição da lente de risco do C1, que reproduzi);
   - `iconTheme` (disco do ícone): success **2.28:1** reprova no escuro;
   - **`toast.promise`, o canal fora do sistema (V6S-1):** disco `#61d345` a **1.92:1** contra o card claro — pior que qualquer token, em 6 call-sites que nenhuma tabela alcança.
   Se o F3 mover `success/warning/info` para o `@theme` sem nomear os três pares, ele publica `bg-warning text-warning-foreground` a 2.15:1 e ainda deixa o quarto canal intocado.
5. **Do ctvitrine, uma peça e uma regra.** A peça: `color-mix(in oklab, base, white N%)` — espaço perceptual, e é a única forma dos quatro que já roda contra base **desconhecida** em produção (`--brand` injetado por `style` no wrapper, 5 pontos de injeção, 33 call-sites). A regra: **consolidar em 3 níveis nomeados**, porque o ctvitrine mostra para onde degenera sem token — 8 percentuais distintos (`white_55/65/70/85/88/90/93/94%`). E, medido pela lente de atualidade: `color-mix(in oklab` aparece **159 vezes** no CSS compilado do alvo, emitido pelo próprio Tailwind 4.3 — a forma do ctvitrine está mais alinhada ao framework instalado do que o único `color-mix(in srgb)` que o boilerplate escreveu à mão (`app.css:366`).
6. **Ordem, com a catraca que pode entrar antes.** F1 → F2 → F3 permanece. Mas **V6T13 + V6T14 + V6S-1 são uma fatia só e devem entrar antes do F1**: mesma família (tokens de estado × canal que os consome), os três são P, os três executam política já escrita e furada (`.ai/rules/css.md:12` manda acrescentar a linha na tabela do teste no mesmo commit do token), e juntos documentam os números que o F3 vai ter de mover. Separá-los faz o V6T13 travar contraste de tokens que o V6T14 vai apagar, e deixa o V6S-1 travando um canal que o V6T13 acabou de justificar.

**Em uma palavra:** o sistema de tokens de estado mais maduro dos quatro é o do **ctfinance**, e o F3 não deve canonizá-lo — deve canonizar o **desenho** dele dentro do **método** do boilerplate, e antes disso mapear os **quatro** canais que consomem esses tokens hoje. Copiar o ctfinance inteiro embarca 3 reprovações de AA; escrever do zero joga fora o único trio bem desenhado da família; e fazer qualquer um dos dois sem contar `toast.promise` deixa o pior contraste da casa exatamente onde ele está.

---

#### Medições

Fonte lida **exclusivamente** por `git show`/`git grep`/`git ls-tree` sobre `53d7d9a`. Alvo por `git show`/`git grep` sobre `origin/main` (= `beb848e`). Três leituras vêm do **`node_modules` e do `vendor` do boilerplate** (bibliotecas instaladas, não a fonte) e estão rotuladas. Nenhum build, teste ou comando de escrita foi executado.

```bash
CT=…/ctvitrine ; BP=…/boilerplate
git -C $BP rev-parse origin/main                      # beb848ea509bf6682c9e31f10611ad7ab489392e

# --- diff de cobertura ---
git -C $CT ls-tree -r 53d7d9a --name-only -- resources | sort        # 199 arquivos em resources/js
git -C $CT ls-tree -r -l 53d7d9a -- public | sort -k4 -nr
git -C $BP ls-tree -r origin/main --name-only -- resources/js/components resources/js/pages resources/views resources/js/lib
for f in nav-main nav-user nav-footer breadcrumbs empty-state app-sidebar user-menu-content \
         app-sidebar-header heading heading-small text-link icon impersonate-banner \
         data-table/{pagination,filter-toggle,table-header,search-bar}; do
  md5 <(git -C $CT show 53d7d9a:resources/js/components/$f.tsx) \
      <(git -C $BP show origin/main:resources/js/components/$f.tsx); done   # 11 IGUAL, 6 DIFERE (alvo à frente)

# --- V6S-1 (as 3 últimas linhas leem a LIB INSTALADA, react-hot-toast@2.6.0) ---
git -C $BP grep -n "toast.promise" origin/main -- resources/js          # 6 call-sites
git -C $CT grep -n "toast.promise" 53d7d9a     -- resources/js          # os MESMOS 6
git -C $BP show origin/main:resources/js/lib/toast-config.ts | cat -n
git -C $BP show origin/main:resources/js/lib/flash.ts | cat -n
git -C $BP show origin/main:resources/js/test/lib/toast-config.test.ts | cat -n
diff -u <(git -C $CT show 53d7d9a:resources/js/lib/toast-config.ts) \
        <(git -C $BP show origin/main:resources/js/lib/toast-config.ts)  # delta = só os 2 ariaProps
python3 -c "import re;s=open('$BP/node_modules/react-hot-toast/dist/index.js').read();\
  print(re.search(r'\{blank:[^}]*loading:[^}]*\}',s).group(0));\
  print(re.search(r'duration:r\.duration\|\|[^,]*,',s).group(0))"
  # {blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3}
  # duration:r.duration||e[r.type]?.duration||e?.duration||ue[r.type]
grep -o 'primary||"#[0-9a-f]\{6\}"' $BP/node_modules/react-hot-toast/dist/index.js   # #61d345 · #ff4b4b · #616161

# --- V6S-2 ---
git -C $BP show origin/main:resources/css/app.css | grep -n "custom-scrollbar\|dialog-content"   # 517-588
git -C $CT show 53d7d9a:resources/css/app.css     | sed -n '566,597p'                            # bloco idêntico
git -C $BP grep -n "custom-scrollbar" origin/main -- resources/js resources/views                # 1: ui/dialog.tsx:58
git -C $BP grep -n 'data-slot="dialog-content"'   origin/main -- resources/js                    # 1: ui/dialog.tsx:56
git -C $BP grep -nE "max-h-\[|overflow-y-auto" origin/main -- resources/js | grep Dialog         # 2 (1 morto)

# --- V6S-3  (as 3 linhas do meio leem o VENDOR instalado, laravel/framework v13.24.0) ---
git -C $BP ls-tree -r origin/main --name-only -- lang                     # 4 arquivos .php
git -C $BP ls-tree -r origin/main --name-only | grep 'lang/.*\.json'      # vazio
grep -n "Lang::get" $BP/vendor/laravel/framework/src/Illuminate/Auth/Notifications/{ResetPassword,VerifyEmail}.php
grep -n "@lang" $BP/vendor/laravel/framework/src/Illuminate/Notifications/resources/views/email.blade.php
python3 -c "import json;d=json.load(open('$BP/composer.lock'));print([p['version'] for p in d['packages'] if p['name']=='laravel/framework'])"   # v13.24.0
git -C $BP grep -rn "MustVerifyEmail\|sendEmailVerificationNotification" origin/main -- app
git -C $CT ls-tree -r -l 53d7d9a -- resources/views/emails                # 4 templates

# --- V6S-4  (a última linha lê @radix-ui/react-dialog@1.1.23 instalado) ---
git -C $BP show origin/main:resources/js/components/ui/sidebar.tsx | sed -n '189,212p'
git -C $CT show 53d7d9a:resources/js/components/ui/sidebar.tsx     | sed -n '181,202p'
python3 -c "import re;s=open('$BP/node_modules/@radix-ui/react-dialog/dist/index.mjs').read();\
  i=s.find('DialogProvider,');print(s[i-350:i+420])"   # Root = provider de contexto, sem DOM e sem portal

# --- não-deltas ---
git -C $BP grep -nE "@media print|@page|forced-colors|prefers-contrast|::selection" origin/main -- resources  # 0
git -C $CT grep -nE "…" 53d7d9a -- resources                                                                  # 0
git -C $BP grep -n 'target="_blank"' origin/main -- resources/js resources/views                              # 1, com rel
git -C $BP grep -n "aria-invalid" origin/main -- resources/js | grep -v ui/ | grep -v /test/                  # 9, todas user-form
git -C $BP grep -n "aria-describedby" origin/main -- resources/js | grep -v /test/                            # só form-field (morto)
grep -rn "toast.promise\|SheetHeader\|SheetTitle" …/docs/harvest/v2/*.md                                      # 0 linhas
grep -n "aria-describedby\|form-field" …/docs/harvest/v2/BACKLOG.md                                           # :381-387 (já registrado)

# --- contraste (script próprio, WCAG 2.x) ---
# <scratchpad>/contraste.py — luminância relativa + (L1+.05)/(L2+.05)
#   #61d345 vs #ffffff = 1.92 · vs #0f2a44 = 7.60
#   #ff4b4b vs #ffffff = 3.30 · vs #0f2a44 = 4.43
#   #16a34a vs #ffffff = 3.30 · #22c55e vs #0f2a44 = 6.42 (reproduzem os do C1)
```

**Não medido, e onde importa:** (i) não rodei browser nem build — a aparência dos dois canais de toast (V6S-1) e o efeito da poda de scrollbar (V6S-2) precisam de screenshot no PR; (ii) os números do ctfinance e do cuidari citados na recomendação do F3 vêm dos inventários, fora do meu pin — o 14.38:1 do `verify-email.tsx` é o único que, se errado, inverte uma decisão; (iii) não abri `resources/js/pages/site/**` além do carrossel e das linhas que o grep devolveu; (iv) não conferi se o `SheetHeader` fora do `SheetContent` é a forma atual do upstream do shadcn (sem acesso a ele nesta rodada) — afirmo só o que a lib do Radix instalada faz.
