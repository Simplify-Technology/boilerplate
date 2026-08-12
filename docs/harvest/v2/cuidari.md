# cuidari — harvest v2

**Projeto-fonte:** `/Users/cristianomorgante/workspace/laravel/simplify-technology/cuidari` · **SHA pinado da rodada:** `a7a1170` (working tree limpa na Fase 0 e na varredura, então ler o disco é ler o SHA) · **Célula 0 (Inventário) concluída em 2026-08-12.**

Laravel 13 + Inertia 3, multi-tenant para clínicas e óticas, em desenvolvimento diário. É o projeto derivado com a maior superfície de domínio da rodada.

## Como esta célula foi produzida

Workflow de **9 agentes** — 8 frentes paralelas + crítico de completude — em **duas passadas** (2.05M tokens de subagente, 808 chamadas de ferramenta, ~53 min somados). Read-only integral: nenhum comando de escrita ou execução tocou o cuidari, e nenhum `.env` foi aberto (só `.env.example`). Varredura por segredo e PII antes do commit: zero CPF, CNPJ, telefone, e-mail real, chave ou token.

O protocolo permite até 2 execuções do crítico quando a primeira acha algo. Achou — a frente 3 inteira faltando —, então rodou duas vezes.

## ⚠️ ANTES DE CONSUMIR: o banner do crítico está ERRADO, e o erro dele é instrutivo

O crítico acusou as frentes de medirem o boilerplate contra a branch de fatia em vez de `main`, e "corrigiu" 12 números. **Onze dessas doze correções estão erradas.** Ele mediu contra `main` **local**, que estava 40 arquivos / +1.794 linhas atrás de `origin/main`. As frentes leram o disco de uma branch de fatia que **nasceu de `origin/main`** — então, para tudo que já estava mesclado, elas estavam certas e ele não.

Existem **três** baselines nesta célula, e confundir dois quaisquer produz conclusão invertida:

| Baseline | SHA | O que é |
| -------- | --- | ------- |
| Disco do worktree | `bc795db` | `origin/main` + a fatia #102, ainda não mesclada — **o que as frentes leram** |
| `main` local | `8b0381b` | ponteiro local desatualizado — **o que o crítico usou** |
| `origin/main` | `9650ea5` | o boilerplate de verdade, hoje — **a única referência válida** |

### Banner REAL de correções (medido contra `origin/main` = `9650ea5`)

| Métrica | Frentes | Crítico | **Real em `origin/main`** | Quem estava certo |
| ------- | ------- | ------- | ------------------------- | ----------------- |
| `.ai/rules/*.md` | 23 | 22 | **23** | frentes |
| Arquivos `.php` em `tests/` | 66 | 63 | **66** | frentes |
| `RateLimiter::for` nomeados | 4 | 3 | **4** | frentes |
| `throttle` em `routes/auth.php` | 6 | 5 | **6** | frentes |
| `HasRolesAndPermissions.php` LOC | 260 | 234 | **260** | frentes |
| `permissionsBeyondOwn()` | presente | "só na branch" | **presente** | frentes |
| Arquivos de teste de front | 34 | 30 | **33** | ⚠️ nenhum dos dois |
| Casos de teste de front | 217 | 184 | **204** | ⚠️ nenhum dos dois |

Comandos: `git -C <boilerplate> ls-tree -r origin/main --name-only` e `git -C <boilerplate> show origin/main:<caminho>`.

**As duas únicas inflações reais são as de teste de front, e a causa é medível ao arquivo:** a branch em checkout adiciona exatamente `resources/js/test/lib/toast-config.test.ts` (1 arquivo) e 13 casos — 33 + 1 = 34 e 204 + 13 = 217, que é a fatia #102 inteira. Nenhuma outra métrica foi contaminada.

**Consequência prática:** onde esta célula disser "o boilerplate já tem X" ou "o cuidari está atrás em Y", o número das **frentes** é o confiável e o do **crítico** não é. A seção `## Crítico de completude` fica preservada abaixo pelo valor da parte (b) — a superfície não enumerada, que é excelente e independente do baseline —, mas **o banner numérico dela está revogado por esta tabela**.

### O que o crítico acertou, e vale mais que os números

A parte (b) do trabalho dele — "que superfície ninguém enumerou?" — não depende de baseline nenhum e é o ativo real desta passada. Ele achou, entre outros: 56 dos 99 arquivos de teste nunca nomeados (incluindo 5 dos 6 `*TenantIsolationTest.php`, que são a evidência do argumento central do inventário), 32 das 43 migrations, 17 das 22 specs de `docs/specs` (sem as quais o leitor conclui "enum de módulos inflado" onde o desenho é deliberado), o diretório `stubs/` inteiro (54 arquivos), o pipeline de fontes self-hosted (22 `.woff2` + `@font-face`), e — o achado de segurança mais concreto — **`Password::defaults()` chamado em 5 lugares sem nenhuma definição em lugar nenhum**, ou seja política de senha no default do Laravel (`min:8`, sem `uncompromised`) num app com CPF, RG e prontuário. Isso vale igual para o boilerplate.

E ele confirmou o que importa sobre a qualidade da varredura: das 48 contagens re-executadas na 1ª passada, **43 bateram**, e as 14 afirmações fortes do tipo "zero X" testadas se sustentaram todas. O lado **cuidari** desta célula — que é o objeto do inventário — não teve nenhum erro numérico apanhado.

### A frente 3 morreu na 1ª passada e foi refeita

A camada de domínio (`app/Services` 38 arquivos, `app/DataTransferObjects` 25, `app/Http/Resources` 30, `app/Rules` 3, mais as abilities das 16 policies — ~8.700 LOC) ficou sem inventário quando a frente 3 caiu por erro de conexão da API. O crítico apanhou a ausência sozinho, mediu o buraco, e a frente foi refeita com escopo endurecido antes da 2ª passada. **Ela está completa nesta versão do documento.**

## Crítico de completude

**2ª passada.** Fonte auditada: `cuidari` @ `a7a1170` (working tree limpa — leitura de disco = leitura do SHA).
Baseline de comparação: `boilerplate` **`main` = `8b0381b`**, lido exclusivamente por `git ls-tree -r main` / `git show main:<path>`.

Escopo desta passada: (a) re-executar do disco as contagens afirmadas pelas 8 frentes; (b) varrer o disco de forma independente atrás de superfície que nenhuma seção enumerou; (c) verificar se o buraco da frente 3 (camada de domínio) foi realmente fechado.

---

### 1. Banner de correções — números derrubados

**11 contagens caem. Todas as 11 são do lado boilerplate. Zero contagens do lado cuidari caíram** — re-executei 63 delas e todas bateram exatamente.

#### 1.1 Causa raiz única: o worktree do boilerplate ainda não é `main`

```
git -C .../boilerplate branch --show-current  →  101-harvest-v2-busca-anunciada
git -C .../boilerplate rev-parse HEAD          →  bc795db
git -C .../boilerplate rev-parse main          →  8b0381b
git -C .../boilerplate diff --stat main..HEAD  →  45 arquivos, +1988 / -158
```

A branch em checkout adiciona **7 arquivos de teste, 1 regra `.ai`, 1 rate limiter, 1 throttle de rota e 26 linhas em `HasRolesAndPermissions`**. Toda frente que leu o disco do boilerplate mediu contra ela. As frentes 2, 5 e 7 chegam a **rotular a leitura como `main` no cabeçalho**, o que torna o erro invisível para quem consome.

> ⚠️ Regra para as 8 dimensões que vêm a seguir: **nenhum número de boilerplate deste inventário é confiável a menos que a linha cite `git show main:` ou `git ls-tree -r main`.** A seção `3-http-dominio.md` é a única que declara esse protocolo explicitamente (linha 4) e os números dela bateram 100%.

#### 1.2 A tabela

| # | Métrica (lado boilerplate) | Afirmado | Real em `main` | Comando de verificação | Onde |
|---:|---|---:|---:|---|---|
| 1 | `RateLimiter::for` nomeados | **4** | **3** (`auth`, `impersonate`, `verification`, linhas 95/100/105) | `git show main:app/Providers/AppServiceProvider.php \| grep -c 'RateLimiter::for'` → `3`; o 4º (`login-lockout`, L122) é branch-only | frente 1 (⚠️ throttle) |
| 2 | `throttle` em `routes/auth.php` | 6 (inclui `confirm-password`) | **5** — `confirm-password` **não** tem throttle em `main` | `git show main:routes/auth.php \| grep -c throttle` → `5`; `throttle:password-confirmation` só existe em `bc795db` | frente 1 (⚠️ throttle) |
| 3 | `HasRolesAndPermissions.php` LOC | **260** | **234** (cuidari 203 → gap real de 31L, não 57L) | `git show main:app/Traits/Models/HasRolesAndPermissions.php \| wc -l` → `234` | frente 2 (RBAC) |
| 4 | `permissionsBeyondOwn()` "presente em `main`" | presente | **ausente em `main`** — branch-only | `git show main:...HasRolesAndPermissions.php \| grep -c permissionsBeyondOwn` → `0`; no disco (`bc795db`) → `1`. `permissionCacheKey` (:49), `PermissionUser.php` e `unsetRelation` (2×) **existem** em `main` — essas três partes da afirmação se sustentam | frente 2 (RBAC) |
| 5 | arquivos `.php` em `tests/` | **66** | **63** | `git ls-tree -r main --name-only \| grep -c '^tests/.*\.php$'` → `63` | frente 7 |
| 6 | casos declarados (`it\|test\|arch`) | **341** | **296** (291 `it/test` + 7 `arch` + 13 PHPUnit clássicos) | mesma regex da frente sobre `git show main:$f` de cada arquivo → `296`; no disco → `341` | frente 7 |
| 7 | LOC de `tests/` | **5.916** | **4.936** | soma de `git show main:$f \| wc -l` sobre os 63 arquivos → `4936` | frente 7 |
| 8 | arquivos de teste de front | **34** | **30** | `git ls-tree -r main --name-only \| grep -cE '^resources/js/.*\.test\.(ts\|tsx)$'` → `30` | frentes 6 **e** 7 |
| 9 | casos de teste de front | **217** | **184** | `grep -cE "^\s*(it\|test)\("` sobre `git show main:$f` → `184` | frente 7 |
| 10 | LOC de testes de front | **2.796** | **2.409** | soma de `git show main:$f` em `resources/js/test/**` → `2409` | frente 7 |
| 11 | `.ai/rules/*.md` | **23** | **22** (a branch adiciona `.ai/rules/views.md`) | `git ls-tree -r main --name-only \| grep -c '^\.ai/rules/.*\.md$'` → `22` | frente 8 |

**Placar de teste corrigido** (o número mais citado do inventário): backend **650 casos / 14.335 LOC (cuidari)** × **296 casos / 4.936 LOC (boilerplate `main`)**; frontend **26 casos / 5 arquivos (cuidari)** × **184 casos / 30 arquivos (boilerplate `main`)**. A direção não muda em nenhum dos dois eixos — a magnitude sim: o cuidari está **2,2× à frente** em casos de backend (não 1,9×) e **7,1× atrás** em casos de front (não 8,3×).

#### 1.3 Ambiguidade não-erro que precisa de nota

| Item | Frente 5 | Frente 6 | Fato |
|---|---|---|---|
| deps npm diretas | **58** (35 dep + 20 dev + 3 optional) | **55** em cada projeto, conjunto idêntico | Ambos certos, denominadores diferentes: 58 inclui `optionalDependencies`. **Mas o "conjunto idêntico" esconde uma divergência real:** `typescript` está em `dependencies` no cuidari e em `devDependencies` no `main` (`python3` set-diff por bloco). Um pacote de build no bundle de produção. |

#### 1.4 O que foi re-verificado e **bateu** (63 contagens, todas do lado cuidari)

Registro para ninguém refazer. Todos os comandos rodados na raiz do cuidari, saída conferida um a um.

| Bloco | Conferidos e corretos |
|---|---|
| Rotas | `routes/` **4**; declarações get/post/put/patch/delete **129**; escrita **83** = 73 web + 7 auth + 3 settings; `Route::redirect` **3**; `->name()` **132**; rotas com `{param}` **68**; `whereNumber` **28**; `RateLimiter::for` **0**; `#[Authorize]` **0**; middlewares **4**; os **115** nomes de rota de `web.php` aparecem todos no inventário |
| RBAC | `Permissions::case` **69**; `Roles::case` **18**; policies **16**; métodos públicos de policy **100**; `before()` em policy **0**; `Gate::policy` **16** |
| Domínio | Services **38**; DTOs **25**; Resources **30**; Rules **3**; Controllers **107** (94 invokable, 92 `final class`, 62 com `$this->authorize(`, 6 com `Gate::`); Requests **53** (43 com `authorize()`, 8 com `prepareForValidation`, 15 com `to*()`, 19 importando `App\Rules`, 19 arquivos / **40** ocorrências de `where('clinic_id'`); `app/` total **379 arquivos / 27.478 LOC** |
| Models/schema | models **38**; migrations **43**; enums **42**; casts **3**; VOs **3**; `BelongsToClinic` **32**; `SoftDeletes` **14**; `LogsActivity` **16**; `strict_types` 36/38 models e 23/43 migrations; `$guarded` **0**; `booted()` **5**; `scope*` **17**; `constrained(` **95**; variantes de `onDelete` **9**; `->unique(` **31**; `->index(` **33**; `nullableMorphs(` **6**; `->json(` **13**; `MoneyCast` em **12** models; enums com `label()` **42/42**, `values()` **36/42**, `options()` **31/42** |
| Async | jobs **5**; commands **2**; events **3**; listeners **2**; `Schedule::` **6**; `onQueue(` **0**; `Queue::fake\|Bus::fake` em tests **0**; providers **2** (`AppServiceProvider` + `HorizonServiceProvider`) |
| Front | `resources/js` **201** arquivos; pages **41**; components **101**; `ui/` **27**; testes de front **5** / **26** casos; `prefetch` **6**; `only: [` **5**; `Deferred`/`WhenVisible`/`usePoll`/`useHttp`/`setLayoutProps` **0** cada; importadores de `components/ui/table` **0** (o arquivo existe → primitivo morto **confirmado**); `@radix-ui/themes` em **29** arquivos; `--color-*` **38** no `app.css` (32 dentro do `@theme` + 6 fora) |
| Testes | `*Test.php` **95**; `.php` em `tests/` **99**; casos Pest **634**; PHPUnit clássicos **13**; `arch(` **0**; LOC **14.335**; factories **36**; seeders **11** (com **0** `fake()`); helpers em `Pest.php` **20**; `preventStrayRequests` **0**; `assertDatabaseHas` **0**; `*TenantIsolationTest.php` **6** |
| Config/CI | `config/` **18**; chaves `.env.example` **49** (0 exclusivas do cuidari, 7 exclusivas do boilerplate: `ACTIVITYLOG_BUFFER_ENABLED`, `ACTIVITYLOG_ENABLED`, `HORIZON_PATH`, `INERTIA_SSR_ENABLED`, `INERTIA_SSR_URL`, `LOG_VIEWER_API_ONLY`, `LOG_VIEWER_ENABLED`); `uses:` **16**, SHA-pinned **0**; composer só-cuidari `barryvdh/laravel-dompdf`, só-boilerplate `larastan/larastan` + `laravel-lang/common`; `config/horizon.php` difere em **1 linha** de `main`; `lang/` **inexistente**; `phpstan*` **0**; `.ai/` **inexistente**; `.cursor/rules/*.mdc` **13** (main também 13); SKILL.md **9** (main **30**); `docs/*.md` **29** (main **15**); commits **84**; `db_cuidari` e `identifier.sqlite` **tracked** |

**Afirmações qualitativas fortes testadas — 21, todas se sustentaram:** `RateLimiter::for` 0, `#[Authorize]` 0, `->enum(` 0, `->float/double(` 0, `arch(` 0, `observe(` 0 (e `app/Observers` inexistente), `preventStrayRequests` 0, `$guarded` 0, `attributes()` em FormRequest 0, `before()` em policy 0, `assertDatabaseHas` 0, `Queue::fake`/`Bus::fake` 0, `onQueue(` 0, `fake()` em seeder 0, `Deferred`/`WhenVisible`/`usePoll`/`useHttp`/`setLayoutProps` 0, importadores de `ui/table` 0, `app/Mail`/`app/Notifications`/`lang/`/`.ai/` inexistentes, `SecurityHeaders` ausente no cuidari.

**Afirmações "o boilerplate já tem X" testadas contra `main` — 13, todas verdadeiras:** `EnsureUserIsActive.php`, `EnforceMailAllowlist.php` (124L), `lib/impersonation.ts`, `Support/Logging/PiiScrubber.php`, `resources/js/pages/errors/`, `resources/views/errors/`, `AssignRoleRequest.php`, `SyncPermissionsRequest.php`, `tests/Arch/ArchTest.php` (7 regras), `phpstan.neon.dist`, `.github/dependabot.yml`, `UserPolicy::mutatePermissions` (:108) e `::assignRole` (:124), `withExceptions` com Inertia + fallback Blade + `SecurityHeaders::stamp` (bootstrap/app.php:46), `LoginRequest` com `is_active` (:36), `app.tsx` com `registerFlashListener` (:4), `Model::shouldBeStrict()` (AppServiceProvider:64), `Gate::define('viewHorizon')` (:27).

---

### 2. O buraco da frente 3 está fechado

`3-http-dominio.md` existe (**632 linhas**, o maior arquivo do inventário) e cobre tudo o que a 1ª passada exigiu:

| Exigência | Status | Evidência |
|---|---|---|
| `app/Services` (38) | ✅ **38/38 nomeados**, com LOC e uma linha de descrição cada; os 5 maiores abertos em detalhe (locks, transações, 3 mecanismos de idempotência) | sweep por nome de classe contra o `.md`: 0 ausentes |
| `app/DataTransferObjects` (25) | ✅ **25/25 nomeados** com LOC; `InstallmentPlan` e `SettlementData` abertos | idem, 0 ausentes |
| `app/Http/Resources` (30) | ✅ **30/30 nomeados**; os 16 com `whenLoaded` e os 7 com bloco `'can'` listados nominalmente | idem, 0 ausentes |
| `app/Rules` (3) | ✅ os 3, com diff contra `main` (`CpfCnpj` main à frente, `MoneyString` idêntico, `DecimalString` só no cuidari) | idem |
| Abilities das 16 policies **por nome** | ✅ tabela com as **100** abilities e a linha de cada uma | recontei: 16 arquivos, 100 `public function` |
| Baseline lido de `main` | ✅ **única seção que declara o protocolo** e a única cujos números de boilerplate bateram 100% (29/8/1/4/0/2/2) | `git ls-tree -r main` |

Além disso a seção 3 cobriu, por conta própria, `app/Exceptions` (inexistente nos dois), o mapa completo de multi-tenant em 5 anéis e a comparação linha a linha com `main`. **Nada do escopo dela ficou de fora.**

---

### 3. Superfície não enumerada

O inventário cobre **100% de**: models (38), controllers (107, via a tabela de rotas da frente 1 na forma `Ns\Controller`), services (38), DTOs (25), Resources (30), policies (16), rules (3), casts (3), VOs (3), traits (2), jobs (5), commands (2), events (3), listeners (2), middlewares (4), providers (2), resolvers (1), seeders (11), factories (36), configs (18), hooks (16), layouts (10), páginas (41), nomes de rota de `web.php` (115), templates Blade de PDF (3). Os buracos restantes são estes:

#### 3.1 ⚠️ Testes — 56 dos 99 arquivos nunca são nomeados

`for f in $(find tests -name '*.php'); do grep -qF $(basename $f) <inventário> || echo $f; done` → **56**. A frente 7 deu agregados por diretório (Finance 133, Inventory 92, OpticalOrders 80, Patients 80…) e abriu ~15 arquivos-exemplar; os outros 56 existem só como número. Isso importa porque **a dimensão de teste vai classificar a suíte sem saber o que ela testa**. Os mais consequentes:

| Arquivo | Por que a ausência custa |
|---|---|
| `tests/Feature/HorizonAccessTest.php` | ⭐ **trava o gate `viewHorizon`**: `Gate::forUser($superUser)->allows('viewHorizon')` true, guest e ADMIN false, **e** assere `schedule:list` contendo `*/5 * * * *` + `horizon:snapshot`. Nenhuma frente menciona que o cuidari tem `app/Providers/HorizonServiceProvider.php` (29L) definindo esse gate por `Roles::SUPER_USER` |
| `tests/Feature/Laravel13ConfigurationDefaultsTest.php` | ⭐ 2 casos travando defaults de cache/session do Laravel 13 e o comportamento de override — teste de contrato de framework, gênero raro e diretamente colhível |
| `tests/Feature/HorizonDevelopmentScriptsTest.php` | ⭐ assere os scripts `dev`/`horizon:terminate` do `composer.json` |
| `FinanceTenantIsolationTest`, `InventoryTenantIsolationTest`, `OpticalOrderTenantIsolationTest`, `ProfessionalTenantIsolationTest`, `RetailSaleTenantIsolationTest` | 5 dos 6 arquivos `*TenantIsolationTest.php` — a frente contou 6 arquivos / 34 casos e não nomeou nenhum. É a evidência que sustenta o argumento central do inventário (multi-tenant) |
| Bloco Patients inteiro (11 arquivos) | `PatientAlertTest`, `PatientConsentTest`, `PatientContactPreferenceTest`, `PatientCpfTest`, `PatientCrudTest`, `PatientDuplicateCheckTest`, `PatientMinorGuardianTest`, `PatientProfessionalScopeTest`, `PatientRecordNumberTest`, `PatientRecordTabsTest`, `PatientSearchTest` — 80 casos sem um nome |
| Bloco Finance (12), Inventory (6), OpticalOrders (7), RetailSales (6), Auth (5), Professionals (3), PermissionRole (2) | idem |

#### 3.2 ⚠️ Migrations — 32 das 43 nunca são nomeadas (buraco **não corrigido** desde a 1ª passada)

A frente 2 abriu ~11 (receivables, payments, clinic_sequences, as 6 base, stock_movements). Continuam sem nome, entre outras: todo o bloco de paciente (`create_patients_table`, `patient_sources`, `patient_groups`, `patient_tags`, `patient_alerts`, `patient_guardians`, `patient_consents`, `patient_contact_preferences`), todo o de plataforma (`create_clinics_table`, `platform_plans`, `clinic_subscriptions`, `add_clinic_id_to_users_table`), e `suppliers`, `financial_accounts`, `financial_categories`, `credit_cards`, `card_fee_tiers`, `cash_register_sessions`, `cash_movements`, `financial_ledger_entries`, `products`, `product_batches`, `inventory_counts`, `retail_sales`, `optical_orders`, `professionals`, `create_activity_log_table`.

Consequência de nível de tabela: **das 49 tabelas criadas por `Schema::create`, 11 nunca aparecem no inventário** — `cache_locks`, `failed_jobs`, `password_reset_tokens`, `permission_role`, `permission_user`, `platform_plans`, `patient_alerts`, `patient_consents`, `patient_guardians`, `patient_sources`, `patient_tags`. Duas delas (`permission_role`, `permission_user`) são as pivôs do RBAC que o boilerplate também tem.

#### 3.3 ⚠️ Frontend — 53 dos 101 `.tsx` nunca são nomeados

Sweep por basename. **19 são primitivos `ui/`** (`alert`, `avatar`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `dropdown-menu`, `icon`, `label`, `navigation-menu`, `placeholder-pattern`, `select`, `separator`, `sheet`, `skeleton`, `textarea`, `toggle-group`, `tooltip`) — perda pequena, são herdados. **34 são componentes de aplicação**, e aí a perda é real:

| Grupo não enumerado | Arquivos |
|---|---|
| ⭐ Padrão "diálogo informativo" (5+1) | `components/settings/{appearance,delete-account,password,profile}-info-dialog.tsx`, `components/dialogs/module-info-dialog.tsx`, `components/permissions/role-info-dialog.tsx`, `components/users/user-info-dialog.tsx`, `components/users/user-show-info-dialog.tsx`, `components/page-info.tsx` — **9 arquivos com o mesmo padrão repetido**, exatamente o tipo de coisa que vira componente único no boilerplate. Nenhuma frente notou o padrão |
| RBAC do front | `permissions/permission-card.tsx`, `permissions/roles-sidebar.tsx`, `add-permission-dialog.tsx`, `assign-role-user.tsx` |
| Usuários | `users/filter-panel.tsx`, `users/user-actions-menu.tsx`, `user-details-dialog.tsx`, `user-form.tsx`, `user-info.tsx`, `delete-user.tsx` |
| Shell/layout | `app-content.tsx`, `app-shell.tsx`, `app-sidebar-header.tsx`, `nav-footer.tsx`, `nav-user.tsx`, `breadcrumbs.tsx`, `heading.tsx`, `heading-small.tsx`, `icon.tsx`, `text-link.tsx`, `input-error.tsx`, `app-logo.tsx`, `app-logo-icon.tsx`, `appearance-dropdown.tsx`, `appearance-tabs.tsx` |

#### 3.4 ⚠️ `stubs/` — 54 arquivos, **zero menções** em todas as 8 seções

`grep -cF "stubs" <inventário>` → `0`. `git ls-files stubs | wc -l` → **54** no cuidari e **54** em `main`; `diff -rq stubs ../boilerplate/stubs` → **sem saída, byte-idênticos**. Não é candidato de harvest, mas é 54 arquivos versionados que nenhuma frente sequer registrou como existentes — e é o tipo de diretório que, se divergisse, ninguém notaria.

#### 3.5 ⚠️ Pipeline de fontes self-hosted — **zero menções**

`git ls-files public/fonts | wc -l` → **22** arquivos `.woff2` em 3 famílias (`aptos` 11, `merriweather-sans` 5, `montserrat` 6), declaradas em `resources/css/app.css` via `@font-face` (`font-family: 'Aptos' | 'Merriweather Sans' | 'Montserrat'`). O boilerplate `main` tem os mesmos 22. `grep -c "woff2\|font-face\|public/fonts"` no inventário → **0**, apesar de a frente 6 ter diffado o `app.css` linha a linha (172 linhas de diff) e contado tokens `--color-*` dentro dele. Também sem menção de path: `public/vendor/log-viewer/` (7 arquivos publicados).

#### 3.6 ⚠️ `Password::defaults()` usado 5× e **configurado 0×** — zero menções

```
app/Http/Requests/User/StoreUserRequest.php:39
app/Http/Requests/User/UpdateUserRequest.php:43
app/Http/Controllers/Settings/PasswordController.php:28
app/Http/Controllers/Auth/NewPasswordController.php:32
app/Http/Controllers/Auth/RegisteredUserController.php:28
```

`grep -rn "Password::defaults" app bootstrap config routes` mostra as 5 **chamadas** e **nenhuma definição** (`Password::defaults(fn () => ...)` não existe). Mesmo estado em `main` (`git show main:app/Providers/AppServiceProvider.php | grep -c 'Password::defaults'` → `0`). Ou seja: a política de senha dos dois projetos é o default do Laravel (`min:8`, sem `uncompromised()`, sem `mixedCase()`) — num app que guarda CPF, RG e prontuário. **Nenhuma das 8 seções cita a string.** Guard-rail óbvio e barato para o boilerplate; ninguém o viu porque `Password::defaults()` "parece" configuração e não é.

#### 3.7 ⚠️ `docs/specs/` — 17 dos 22 arquivos nunca nomeados

A frente 8 abriu `90-fase1-execution-plan.md`, `99-cross-spec-risk-review.md`, `00-foundation-multitenant-modules.md`, `17-*` e `03-conventions.md`. Ficaram fora: `01-tenancy-onboarding`, `02-rbac-staff`, `03-patients`, `04-agenda-scheduling`, `05-clinical-record`, `06-odontogram-procedures`, `07-budgets-quotes`, `08-finance`, `09-memberships-billing`, `10-messaging-marketing`, `11-reports-dashboard`, `12-ai-copilot`, `13-platform-subscriptions`, `13a-asaas-platform-billing`, `14-session-packages`, `15-inventory`, `16-online-booking-patient-portal`.

Isso importa para o leitor: **`app/Enum/Module.php` declara 18 módulos e só 4 têm código** (`finance`, `inventory`, `retail_sales`, `optical_lab` — os 4 usados em `EnsureModuleEnabled`). As 17 specs não lidas são o mapa de por que os outros 14 existem no enum sem implementação. Quem consumir o inventário pode concluir "enum inflado" quando o desenho é deliberado e documentado.

#### 3.8 Enumerações parciais menores

| Superfície | Não enumerado | Detalhe |
|---|---|---|
| Enums | **7 de 42** | `FrameFormat`, `FrameType`, `OpticalOrderType`, `PatientConsentKind`, `PatientConsentSource`, `PatientConsentStatus`, `RetailSaleKind` — o bloco de consentimento LGPD inteiro (3 enums) e a modelagem de armação (2) |
| Form Requests | **14 de 53** | `Inventory/InventoryCountRequest`, `OpticalOrder/{Cancel,Store,Update}OpticalOrderRequest`, `Patient/{StorePatientConsent,StorePatientContactPreference,StorePatientGuardian,UpdatePatientAlert,UpdatePatientContactPreference,UpdatePatient}Request`, `Professional/UpdateProfessionalRequest`, `RetailSale/{CancelSale,CompleteSale,ReturnSale}Request`, `Settings/ProfileUpdateRequest` — inclui `CompleteSaleRequest`, que é o consumidor de `toCompletion()` que a própria seção 3 usa como exemplar |
| `.cursor/skills/` e `.codex/skills/` | dirs sem menção de path | 3 SKILL.md cada; entram no total 9 da frente 8, mas o fato de existirem **três cópias** do mesmo trio de skills (`.github/skills`, `.codex/skills`, `.cursor/skills`) não é registrado por ninguém |
| `storage/` tracked | 10 `.gitignore` | irrelevante, registrado por completude |

---

### 4. Leitura final para quem consome o inventário

**O que confiar sem reservas:** todo número do lado cuidari. Re-executei 63 contagens e 21 afirmações do tipo "zero X" — **nenhuma caiu**. A seção 3, que na 1ª passada não existia, hoje é a mais rigorosa do conjunto e é a única que declara e cumpre o protocolo de ler o boilerplate por `git show main:`.

**O que corrigir antes de usar:** os 11 números da tabela §1.2, todos do lado boilerplate, todos pela mesma causa — o worktree de comparação está numa branch de fatia +1988 linhas à frente de `main`. O efeito é sistematicamente **a favor do boilerplate**: ele parece ter mais teste, mais regra `.ai`, mais rate limiter e um trait de RBAC mais completo do que `main` de fato tem. Duas frentes chegam a citar como "gap do cuidari" uma peça (`permissionsBeyondOwn()`, throttle em `confirm-password`) que **`main` também não tem** — se essas viram tarefa de sincronização, a fatia sincroniza contra código não mesclado.

**O que ainda falta olhar antes de classificar:** a suíte de teste (56 de 99 arquivos são só um número, incluindo os 5 `*TenantIsolationTest` que sustentam o argumento de multi-tenant e o `HorizonAccessTest`/`Laravel13ConfigurationDefaultsTest`, que são candidatos de harvest por si), as 32 migrations sem nome, e três surfaces com **zero** menção em 3.218 linhas de inventário: `stubs/` (54), o pipeline de fontes self-hosted (22 woff2 + `@font-face`) e `Password::defaults()` (5 usos, 0 definições, nos dois repos).
## Rotas, middlewares, providers e bootstrap

Projeto-fonte: `cuidari` @ `a7a1170` (working tree limpa; leitura direta do disco). Todos os paths abaixo são relativos a `/Users/cristianomorgante/workspace/laravel/simplify-technology/cuidari`. Boilerplate de comparação: `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate` (branch `101-harvest-v2-busca-anunciada`).

### 0. Contagens verificadas por comando

| Métrica | Valor | Comando |
| --- | --- | --- |
| Arquivos em `routes/` | 4 (`auth.php`, `console.php`, `settings.php`, `web.php`) | `ls -la routes/` |
| Linhas `routes/web.php` | 299 | `wc -l routes/*.php` |
| Declarações `Route::{get,post,put,patch,delete}` (web+auth+settings) | 129 | `grep -hE "Route::(get\|post\|put\|patch\|delete)\(" routes/web.php routes/auth.php routes/settings.php \| wc -l` |
| Declarações de ESCRITA (post/put/patch/delete) | 83 | `grep -hE "Route::(post\|put\|patch\|delete)\(" … \| wc -l` |
| Escrita em `routes/web.php` | 73 | `grep -cE "Route::(post\|put\|patch\|delete)\(" routes/web.php` |
| Escrita em `routes/auth.php` | 7 | idem |
| Escrita em `routes/settings.php` | 3 | idem |
| `Route::redirect` | 3 | `grep -hE "Route::redirect\(" … \| wc -l` |
| Ocorrências de `->name()` | 132 (127 rotas nomeadas + 5 prefixos de grupo) | `python3` sobre os 3 arquivos |
| `->whereNumber(` em `routes/web.php` | 28 (boilerplate: 0 em todos os `routes/*.php`) | `grep -c "whereNumber" routes/web.php` |
| Rotas com parâmetro `{…}` na URI | 68 (65 em `web.php`) | `grep -hE "Route::(get\|post\|put\|patch\|delete)\(" routes/*.php \| grep -cF '{'` |
| Controllers em `app/Http/Controllers/` | 107 | `find app/Http/Controllers -name "*.php" \| wc -l` |
| FormRequests / com `authorize()` declarado | 53 / 43 | `find app/Http/Requests -name "*.php" \| wc -l`; `grep -rl "function authorize" app/Http/Requests \| wc -l` |
| Middlewares em `app/Http/Middleware/` | 4 | `find app/Http/Middleware -name "*.php" \| wc -l` |
| Providers em `app/Providers/` | 2 | `ls -la app/Providers/` |
| `RateLimiter::for(` no projeto | **0** | `grep -rn "RateLimiter::for" app bootstrap config routes` |
| `routes/channels.php` | **não existe** | `ls routes/channels.php` |
| `routes/api.php` | **não existe** | `ls -la routes/` + `bootstrap/app.php:15-19` |
| `Gate::policy(` em `AppServiceProvider` | 16 | `grep -c "Gate::policy(" app/Providers/AppServiceProvider.php` |
| Arquivos em `app/Policies/` | 16 | `find app/Policies -name "*.php" \| wc -l` |
| `case` em `app/Enum/Permissions.php` | 69 | `grep -c "case " app/Enum/Permissions.php` |
| `case` em `app/Enum/Roles.php` | 18 | `grep -c "^    case " app/Enum/Roles.php` |
| Models com `BelongsToClinic` | 32 | `grep -rl "BelongsToClinic" app/Models \| wc -l` |
| Jobs em `app/Jobs/` | 5 | `find app/Jobs -name "*.php" \| wc -l` |
| Commands em `app/Console/` | 2 | `find app/Console -name "*.php" \| wc -l` |

---

### 1. `routes/web.php` — grupos e middleware herdado

Todo o arquivo (exceto o redirect raiz) vive dentro de um único grupo:

```
routes/web.php:18   Route::middleware(['auth', 'verified', 'clinic'])->group(…)   // fecha em :295
```

`clinic` = alias de `EnsureClinicContext` (`bootstrap/app.php:30`). ⭐ O boilerplate usa só `['auth','verified']` (`boilerplate/routes/web.php:12`).

Grupos aninhados (`grep -n "Route::middleware\|->middleware(" routes/web.php`):

| Linha | Escopo | Middleware adicionado | Prefixo URI | Prefixo de nome |
| --- | --- | --- | --- | --- |
| `routes/web.php:28` | Users | `can:manage_users` | — | — |
| `routes/web.php:46` | rota única (impersonate start) | `throttle:10,1` + `can:impersonate_users` | — | — |
| `routes/web.php:91` | Finance (2 subgrupos) | `module:finance` | — | — |
| `routes/web.php:92` | Finance operacional | (herda) | `finance` | `finance.` |
| `routes/web.php:130` | Finance cadastros | (herda) | `settings` | `settings.` |
| `routes/web.php:169` | Inventory | `module:inventory` | `inventory` | `inventory.` |
| `routes/web.php:204` | Retail sales | `module:retail_sales` | `retail-sales` | `retail-sales.` |
| `routes/web.php:237` | Optical orders | `module:optical_lab` | `optical-orders` | `optical-orders.` |
| `routes/web.php:275` | Roles | `can:manage_roles` | — | — |
| `routes/web.php:287` | Assign role | `can:assign_roles` | — | — |
| `routes/web.php:292` | rota única (sync-permissions) | `can:manage_users` | — | — |

⚠️ O grupo de cadastros financeiros (`routes/web.php:130`) usa prefixo de URI `settings` **e** prefixo de nome `settings.`, ocupando o mesmo namespace de URL de `routes/settings.php` (perfil/senha/aparência). Não há colisão de nome (`settings.financial-accounts.index` vs `profile.edit`), mas `/settings/financial-accounts` fica sob `module:finance` enquanto `/settings/profile` fica só sob `auth` — dois regimes de autorização debaixo do mesmo prefixo visível.

⭐ `->whereNumber()` aplicado em 28 rotas com `{id}` numérico (`routes/web.php:66,98,101,104,108,114,117,123,126,173,176,179,191,194,210,213,216,220,223,226,231,246,251,254,257,261,264,267`) — o boilerplate não usa `whereNumber` em nenhuma rota (`grep -c whereNumber boilerplate/routes/*.php` = 0). Isso é o que impede `POST /retail-sales/create` de bater na rota `{sale}`.

#### 1.1 Rotas de `routes/web.php` (fora de grupos de módulo)

| Verbo | URI | Controller / ação | Middleware efetivo | Nome | Linha |
| --- | --- | --- | --- | --- | --- |
| GET | `/` → `/dashboard` | `Route::redirect` | (nenhum) | `home` | 16 |
| GET | `dashboard` | closure `Inertia::render('dashboard')` | auth, verified, clinic | `dashboard` | 19 |
| DELETE | `users/impersonate` | `User\StopImpersonateController` | auth, verified, clinic | `users.impersonate.stop` | 24 |
| GET | `users` | `User\IndexController` | + `can:manage_users` | `users.index` | 29 |
| GET | `users/create` | `User\CreateController` | + `can:manage_users` | `users.create` | 30 |
| POST | `users` | `User\StoreController` | + `can:manage_users` | `users.store` | 31 |
| GET | `users/{user}` | `User\ShowController` | + `can:manage_users` | `users.show` | 32 |
| GET | `users/{user}/edit` | `User\EditController` | + `can:manage_users` | `users.edit` | 33 |
| PUT | `users/{user}` | `User\UpdateController` | + `can:manage_users` | `users.update` | 34 |
| DELETE | `users/{user}` | `User\DestroyController` | + `can:manage_users` | `users.destroy` | 35 |
| PATCH | `users/{user}/toggle-active` | `User\ToggleActiveController` | + `can:manage_users` | `users.toggle-active` | 36 |
| GET | `users/{user}/permissions` | `User\ShowUserPermissionsController` | + `can:manage_users` | `users.permissions.show` | 39 |
| POST | `users/{user}/permissions/grant` | `User\GrantPermissionController` | + `can:manage_users` | `users.permissions.grant` | 40 |
| DELETE | `users/{user}/permissions/{permission}` | `User\RevokePermissionController` | + `can:manage_users` | `users.permissions.revoke` | 41 |
| POST | `users/{user}/impersonate` | `User\StartImpersonateController` | + `throttle:10,1`, `can:impersonate_users` | `users.impersonate` | 45 |
| GET | `professionals` | `Professional\IndexController` | auth, verified, clinic | `professionals.index` | 52 |
| GET | `professionals/create` | `Professional\CreateController` | idem | `professionals.create` | 53 |
| POST | `professionals` | `Professional\StoreController` | idem | `professionals.store` | 54 |
| GET | `professionals/{professional}/edit` | `Professional\EditController` | idem | `professionals.edit` | 55 |
| PUT | `professionals/{professional}` | `Professional\UpdateController` | idem | `professionals.update` | 56 |
| DELETE | `professionals/{professional}` | `Professional\DestroyController` | idem | `professionals.destroy` | 57 |
| GET | `patients` | `Patient\IndexController` | idem | `patients.index` | 61 |
| GET | `patients/create` | `Patient\CreateController` | idem | `patients.create` | 62 |
| POST | `patients` | `Patient\StoreController` | idem | `patients.store` | 63 |
| POST | `patients/check-duplicates` | `Patient\CheckDuplicatesController` | idem | `patients.check-duplicates` | 64 |
| POST | `patients/{patient}/restore` | `Patient\RestoreController` (`whereNumber`) | idem | `patients.restore` | 65 |
| GET | `patients/{patient}` | `Patient\ShowController` | idem | `patients.show` | 68 |
| PUT | `patients/{patient}` | `Patient\UpdateController` | idem | `patients.update` | 69 |
| DELETE | `patients/{patient}` | `Patient\DestroyController` | idem | `patients.destroy` | 70 |
| POST | `patients/{patient}/guardians` | `Patient\Guardian\StoreController` | idem | `patients.guardians.store` | 72 |
| PUT | `patients/{patient}/guardians/{guardian}` | `Patient\Guardian\UpdateController` | idem | `patients.guardians.update` | 73 |
| DELETE | `patients/{patient}/guardians/{guardian}` | `Patient\Guardian\DestroyController` | idem | `patients.guardians.destroy` | 74 |
| POST | `patients/{patient}/consents` | `Patient\Consent\StoreController` | idem | `patients.consents.store` | 76 |
| POST | `patients/{patient}/alerts` | `Patient\Alert\StoreController` | idem | `patients.alerts.store` | 78 |
| PUT | `patients/{patient}/alerts/{alert}` | `Patient\Alert\UpdateController` | idem | `patients.alerts.update` | 79 |
| DELETE | `patients/{patient}/alerts/{alert}` | `Patient\Alert\DestroyController` | idem | `patients.alerts.destroy` | 80 |
| POST | `patients/{patient}/contact-preferences` | `Patient\ContactPreference\StoreController` | idem | `patients.contact-preferences.store` | 82 |
| PUT | `patients/{patient}/contact-preferences/{preference}` | `Patient\ContactPreference\UpdateController` | idem | `patients.contact-preferences.update` | 84 |
| DELETE | `patients/{patient}/contact-preferences/{preference}` | `Patient\ContactPreference\DestroyController` | idem | `patients.contact-preferences.destroy` | 86 |
| GET | `/permissions` → `/permissions/roles` | `Route::redirect` | + `can:manage_roles` | (sem nome) | 276 |
| GET | `/permissions/roles` | `PermissionRole\IndexController` | + `can:manage_roles` | `role-permissions` | 277 |
| PUT | `/permissions/roles/{role}` | `PermissionRole\UpdateController` | + `can:manage_roles` | `roles-permissions.update` | 281 |
| POST | `/users/{user}/assign-role` | `PermissionRole\AssignRoleController` | + `can:assign_roles` | `user.assign-role` | 288 |
| DELETE | `/users/{user}/revoke-role` | `PermissionRole\RevokeRoleController` | + `can:assign_roles` | `user.revoke-role` | 289 |
| POST | `/users/{user}/sync-permissions` | `PermissionRole\SyncPermissionsController` | + `can:manage_users` | `user.sync-permissions` | 291 |

#### 1.2 Grupo `module:finance` (`routes/web.php:91-165`)

Todas com middleware efetivo `auth, verified, clinic, module:finance`.

| Verbo | URI | Controller / ação | Nome | Linha |
| --- | --- | --- | --- | --- |
| GET | `finance/receivables` | `Finance\Receivable\IndexController` | `finance.receivables.index` | 93 |
| POST | `finance/receivables` | `Finance\Receivable\StoreController` | `finance.receivables.store` | 94 |
| POST | `finance/receivables/renegotiate` | `Finance\Receivable\RenegotiateController` | `finance.receivables.renegotiate` | 95 |
| POST | `finance/receivables/{receivable}/settle` | `Finance\Receivable\SettleController` | `finance.receivables.settle` | 97 |
| POST | `finance/receivables/{receivable}/cancel` | `Finance\Receivable\CancelController` | `finance.receivables.cancel` | 100 |
| POST | `finance/receivables/{receivable}/recalculate-charges` | `Finance\Receivable\RecalculateChargesController` | `finance.receivables.recalculate-charges` | 103 |
| POST | `finance/payments/{payment}/reverse` | `Finance\Payment\ReverseController` | `finance.payments.reverse` | 107 |
| GET | `finance/payables` | `Finance\Payable\IndexController` | `finance.payables.index` | 111 |
| POST | `finance/payables` | `Finance\Payable\StoreController` | `finance.payables.store` | 112 |
| POST | `finance/payables/{payable}/settle` | `Finance\Payable\SettleController` | `finance.payables.settle` | 113 |
| POST | `finance/payables/{payable}/cancel` | `Finance\Payable\CancelController` | `finance.payables.cancel` | 116 |
| GET | `finance/cash-registers` | `Finance\CashRegister\IndexController` | `finance.cash-registers.index` | 120 |
| POST | `finance/cash-registers/open` | `Finance\CashRegister\OpenController` | `finance.cash-registers.open` | 121 |
| POST | `finance/cash-registers/{session}/move` | `Finance\CashRegister\MoveController` | `finance.cash-registers.move` | 122 |
| POST | `finance/cash-registers/{session}/close` | `Finance\CashRegister\CloseController` | `finance.cash-registers.close` | 125 |
| GET | `settings/financial-accounts` | `Finance\Settings\FinancialAccountController@index` | `settings.financial-accounts.index` | 131 |
| POST | `settings/financial-accounts` | `…FinancialAccountController@store` | `settings.financial-accounts.store` | 133 |
| PUT | `settings/financial-accounts/{account}` | `…FinancialAccountController@update` | `settings.financial-accounts.update` | 135 |
| DELETE | `settings/financial-accounts/{account}` | `…FinancialAccountController@destroy` | `settings.financial-accounts.destroy` | 137 |
| GET | `settings/financial-categories` | `…FinancialCategoryController@index` | `settings.financial-categories.index` | 140 |
| POST | `settings/financial-categories` | `…FinancialCategoryController@store` | `settings.financial-categories.store` | 142 |
| PUT | `settings/financial-categories/{category}` | `…FinancialCategoryController@update` | `settings.financial-categories.update` | 144 |
| DELETE | `settings/financial-categories/{category}` | `…FinancialCategoryController@destroy` | `settings.financial-categories.destroy` | 146 |
| GET | `settings/credit-cards` | `…CreditCardController@index` | `settings.credit-cards.index` | 149 |
| POST | `settings/credit-cards` | `…CreditCardController@store` | `settings.credit-cards.store` | 151 |
| PUT | `settings/credit-cards/{credit_card}` | `…CreditCardController@update` | `settings.credit-cards.update` | 153 |
| DELETE | `settings/credit-cards/{credit_card}` | `…CreditCardController@destroy` | `settings.credit-cards.destroy` | 155 |
| GET | `settings/suppliers` | `…SupplierController@index` | `settings.suppliers.index` | 158 |
| POST | `settings/suppliers` | `…SupplierController@store` | `settings.suppliers.store` | 159 |
| PUT | `settings/suppliers/{supplier}` | `…SupplierController@update` | `settings.suppliers.update` | 160 |
| DELETE | `settings/suppliers/{supplier}` | `…SupplierController@destroy` | `settings.suppliers.destroy` | 162 |

⚠️ Os 4 controllers de `Finance\Settings\` são **multi-ação** (`index/store/update/destroy` no mesmo arquivo), contrariando a regra "single-action, um arquivo por verbo" do `CLAUDE.md` do boilerplate. São os únicos 4 dos 107 controllers do cuidari nesse formato (`find app/Http/Controllers -name "*.php" | wc -l` = 107).

#### 1.3 Grupo `module:inventory` (`routes/web.php:169-200`)

Middleware efetivo: `auth, verified, clinic, module:inventory`. Prefixo `inventory`, nome `inventory.`.

| Verbo | URI | Controller | Nome | Linha |
| --- | --- | --- | --- | --- |
| GET | `inventory/products` | `Inventory\Product\IndexController` | `inventory.products.index` | 170 |
| POST | `inventory/products` | `Inventory\Product\StoreController` | `inventory.products.store` | 171 |
| GET | `inventory/products/{product}` | `Inventory\Product\ShowController` | `inventory.products.show` | 172 |
| PUT | `inventory/products/{product}` | `Inventory\Product\UpdateController` | `inventory.products.update` | 175 |
| DELETE | `inventory/products/{product}` | `Inventory\Product\DestroyController` | `inventory.products.destroy` | 178 |
| GET | `inventory/movements` | `Inventory\Movement\IndexController` | `inventory.movements.index` | 184 |
| POST | `inventory/entries` | `Inventory\Entry\StoreController` | `inventory.entries.store` | 185 |
| POST | `inventory/consumptions` | `Inventory\Consumption\StoreController` | `inventory.consumptions.store` | 186 |
| GET | `inventory/counts` | `Inventory\Count\IndexController` | `inventory.counts.index` | 188 |
| POST | `inventory/counts` | `Inventory\Count\StoreController` | `inventory.counts.store` | 189 |
| PUT | `inventory/counts/{count}/items/{item}` | `Inventory\Count\ItemController` | `inventory.counts.items.update` | 190 |
| POST | `inventory/counts/{count}/close` | `Inventory\Count\CloseController` | `inventory.counts.close` | 193 |
| GET | `inventory/alerts` | `Inventory\AlertController` | `inventory.alerts` | 197 |
| GET | `inventory/purchase-suggestions` | `Inventory\PurchaseSuggestionController` | `inventory.purchase-suggestions` | 198 |

⭐ Ausência deliberada de rota documentada em comentário: `routes/web.php:182-183` explica que movimento de estoque não tem `update`/`destroy` porque é imutável por contrato — a rota simplesmente não existe. Padrão de "guard-rail por ausência" com justificativa no próprio arquivo de rotas.

#### 1.4 Grupo `module:retail_sales` (`routes/web.php:204-233`)

| Verbo | URI | Controller | Nome | Linha |
| --- | --- | --- | --- | --- |
| GET | `retail-sales` | `RetailSale\IndexController` | `retail-sales.index` | 206 |
| GET | `retail-sales/create` | `RetailSale\CreateController` | `retail-sales.create` | 207 |
| POST | `retail-sales` | `RetailSale\StoreController` | `retail-sales.store` | 208 |
| GET | `retail-sales/{sale}` | `RetailSale\ShowController` | `retail-sales.show` | 209 |
| PUT | `retail-sales/{sale}` | `RetailSale\UpdateController` | `retail-sales.update` | 212 |
| DELETE | `retail-sales/{sale}` | `RetailSale\DestroyController` | `retail-sales.destroy` | 215 |
| POST | `retail-sales/{sale}/convert` | `RetailSale\ConvertController` | `retail-sales.convert` | 219 |
| POST | `retail-sales/{sale}/complete` | `RetailSale\CompleteController` | `retail-sales.complete` | 222 |
| POST | `retail-sales/{sale}/return` | `RetailSale\ReturnController` | `retail-sales.return` | 225 |
| GET | `retail-sales/{sale}/carnet` | `RetailSale\CarnetController` | `retail-sales.carnet` | 230 |

#### 1.5 Grupo `module:optical_lab` (`routes/web.php:237-272`)

| Verbo | URI | Controller | Nome | Linha |
| --- | --- | --- | --- | --- |
| GET | `optical-orders` | `OpticalOrder\IndexController` | `optical-orders.index` | 239 |
| GET | `optical-orders/board` | `OpticalOrder\BoardController` | `optical-orders.board` | 242 |
| GET | `optical-orders/create` | `OpticalOrder\CreateController` | `optical-orders.create` | 243 |
| POST | `optical-orders` | `OpticalOrder\StoreController` | `optical-orders.store` | 244 |
| GET | `optical-orders/{order}` | `OpticalOrder\ShowController` | `optical-orders.show` | 245 |
| GET | `optical-orders/{order}/pdf` | `OpticalOrder\PdfController` | `optical-orders.pdf` | 250 |
| GET | `optical-orders/{order}/edit` | `OpticalOrder\EditController` | `optical-orders.edit` | 253 |
| PUT | `optical-orders/{order}` | `OpticalOrder\UpdateController` | `optical-orders.update` | 256 |
| POST | `optical-orders/{order}/transition` | `OpticalOrder\TransitionController` | `optical-orders.transition` | 260 |
| POST | `optical-orders/{order}/cancel` | `OpticalOrder\CancelController` | `optical-orders.cancel` | 263 |
| POST | `optical-orders/{order}/duplicate` | `OpticalOrder\DuplicateController` | `optical-orders.duplicate` | 266 |

⭐ `routes/web.php:270-271` documenta a ausência de `destroy` ("O.S. não se apaga — cancela com motivo"). Mesmo padrão de 1.3.

---

### 2. `routes/auth.php` (58 linhas)

Estruturalmente idêntico ao boilerplate **exceto pelos throttles**. `diff boilerplate/routes/auth.php cuidari/routes/auth.php` mostra 6 divergências, todas de rate limiting.

| Verbo | URI | Controller@ação | Middleware | Nome | Linha |
| --- | --- | --- | --- | --- | --- |
| GET | `register` | `Auth\RegisteredUserController@create` | `guest` | `register` | 16 |
| POST | `register` | `Auth\RegisteredUserController@store` | `guest` | (sem nome) | 19 |
| GET | `login` | `Auth\AuthenticatedSessionController@create` | `guest` | `login` | 21 |
| POST | `login` | `Auth\AuthenticatedSessionController@store` | `guest` | (sem nome) | 24 |
| GET | `forgot-password` | `Auth\PasswordResetLinkController@create` | `guest` | `password.request` | 26 |
| POST | `forgot-password` | `Auth\PasswordResetLinkController@store` | `guest` | `password.email` | 29 |
| GET | `reset-password/{token}` | `Auth\NewPasswordController@create` | `guest` | `password.reset` | 32 |
| POST | `reset-password` | `Auth\NewPasswordController@store` | `guest` | `password.store` | 35 |
| GET | `verify-email` | `Auth\EmailVerificationPromptController` | `auth` | `verification.notice` | 40 |
| GET | `verify-email/{id}/{hash}` | `Auth\VerifyEmailController` | `auth`,`signed`,`throttle:6,1` | `verification.verify` | 43 |
| POST | `email/verification-notification` | `Auth\EmailVerificationNotificationController@store` | `auth`,`throttle:6,1` | `verification.send` | 47 |
| GET | `confirm-password` | `Auth\ConfirmablePasswordController@show` | `auth` | `password.confirm` | 51 |
| POST | `confirm-password` | `Auth\ConfirmablePasswordController@store` | `auth` | (sem nome) | 54 |
| POST | `logout` | `Auth\AuthenticatedSessionController@destroy` | `auth` | `logout` | 56 |

⚠️ **Regressões de rate limiting vs. boilerplate** (o boilerplate já corrigiu, o cuidari ainda não absorveu):

| Rota | Cuidari | Boilerplate |
| --- | --- | --- |
| `POST register` (`routes/auth.php:19`) | **sem throttle** | `throttle:auth` (10/min por IP) |
| `POST forgot-password` (`routes/auth.php:29`) | **sem throttle** | `throttle:auth` |
| `POST reset-password` (`routes/auth.php:35`) | **sem throttle** | `throttle:auth` |
| `POST confirm-password` (`routes/auth.php:54`) | **sem throttle** | `throttle:password-confirmation` (6/min por usuário) |
| `verify-email/{id}/{hash}` (`routes/auth.php:44`) | `throttle:6,1` (por IP) | `throttle:verification` (por usuário) |
| `email/verification-notification` (`routes/auth.php:48`) | `throttle:6,1` (por IP) | `throttle:verification` (por usuário) |
| `POST users/{user}/impersonate` (`routes/web.php:46`) | `throttle:10,1` (por IP) | `throttle:impersonate` (por usuário) |

⚠️ `POST login` só tem o limitador manual dentro de `app/Http/Requests/Auth/LoginRequest.php:44` (`RateLimiter::tooManyAttempts($this->throttleKey(), 5)`) — nenhum middleware `throttle` na rota (`routes/auth.php:24`).

⚠️ `app/Http/Requests/Auth/LoginRequest.php:31` faz `Auth::attempt($this->only('email','password'), …)` — **sem** `is_active`. O boilerplate injeta `'is_active' => true` nas credenciais (`boilerplate/app/Http/Requests/Auth/LoginRequest.php:36`). Isto é: no cuidari, `PATCH users/{user}/toggle-active` (`routes/web.php:36`) desativa a conta mas o usuário continua conseguindo logar.

---

### 3. `routes/settings.php` (23 linhas)

`diff boilerplate/routes/settings.php cuidari/routes/settings.php` → **byte-idêntico**.

| Verbo | URI | Controller@ação | Middleware | Nome | Linha |
| --- | --- | --- | --- | --- | --- |
| GET | `settings` → `settings/profile` | `Route::redirect` | `auth` | (sem nome) | 11 |
| GET | `settings/profile` | `Settings\ProfileController@edit` | `auth` | `profile.edit` | 13 |
| PATCH | `settings/profile` | `Settings\ProfileController@update` | `auth` | `profile.update` | 14 |
| DELETE | `settings/profile` | `Settings\ProfileController@destroy` | `auth` | `profile.destroy` | 15 |
| GET | `settings/password` | `Settings\PasswordController@edit` | `auth` | `password.edit` | 17 |
| PUT | `settings/password` | `Settings\PasswordController@update` | `auth` | `password.update` | 18 |
| GET | `settings/appearance` | closure `Inertia::render('settings/appearance')` | `auth` | `appearance` | 20 |

⚠️ Este grupo usa só `auth` — **sem `verified` e sem `clinic`**. Um usuário sem `email_verified_at` e sem clínica vinculada alcança `/settings/*` e pode `DELETE settings/profile`.

---

### 4. `routes/console.php` (33 linhas) — scheduler

⭐ O boilerplate tem 11 linhas com apenas `horizon:snapshot` + `inspire`. O cuidari agenda 5 jobs de domínio:

| Linha | Agendamento | Job | Observação |
| --- | --- | --- | --- |
| 12 | `Schedule::command('horizon:snapshot')->everyFiveMinutes()` | — | idêntico ao boilerplate |
| 17 | `dailyAt('03:10')` | `App\Jobs\MarkOverdueReceivables` | job itera clínica a clínica e resolve "hoje" no fuso de cada uma |
| 18 | `dailyAt('03:20')` | `App\Jobs\GenerateRecurringPayables` | idem |
| 23 | `dailyAt('03:15')` | `App\Jobs\RecalculateOverdueCharges` | ⭐ **condicional**: `if (RecalculateOverdueCharges::enabled())` (`routes/console.php:22`), lendo `config('finance.recalculate_overdue_charges')` (`app/Jobs/RecalculateOverdueCharges.php:43`). Feature-flag no nível do agendamento, não dentro do job |
| 28 | `dailyAt('03:30')` | `App\Jobs\ScanExpiringBatches` | estoque |
| 29 | `monthlyOn(1, '03:40')` | `App\Jobs\ComputeAbcCurve` | curva ABC mensal |
| 31 | `Artisan::command('inspire', …)` | — | idêntico ao boilerplate |

Todos os 5 jobs existem em disco (`ls app/Jobs/<Job>.php` para cada um → 0 MISSING). ⚠️ `routes/console.php` é o único dos 4 arquivos de `routes/` **sem** `declare(strict_types = 1)` (`head -3 routes/console.php`).

Commands próprios (`find app/Console -name "*.php"` = 2):
- `app/Console/Commands/OnboardClinicCommand.php`
- `app/Console/Commands/SyncPermissionsCommand.php`

---

### 5. `bootstrap/app.php` (43 linhas) — íntegra

```php
Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: routes/web.php, commands: routes/console.php, health: '/up')   // :15-19
```
Sem `api:` e sem `channels:` — logo, não há `routes/api.php` nem `routes/channels.php` (confirmado por `ls`).

**`withMiddleware` (`bootstrap/app.php:20-40`):**

| Item | Valor | Linha |
| --- | --- | --- |
| `encryptCookies(except:)` | `['appearance']` | 21 |
| `web(append:)` | `HandleAppearance`, `HandleInertiaRequests`, `AddLinkHeadersForPreloadedAssets` | 23-27 |
| `alias()` | `'clinic' => EnsureClinicContext`, `'module' => EnsureModuleEnabled` | 29-32 |
| `prependToPriorityList()` | `SubstituteBindings` ← `EnsureClinicContext` | 36-39 |

⭐ **`prependToPriorityList(SubstituteBindings::class, EnsureClinicContext::class)`** (`bootstrap/app.php:36-39`) é a peça central do multi-tenant e não existe no boilerplate. O comentário no código explica: o contexto de tenant precisa existir **antes** do route model binding para que o global scope `clinic` filtre os parâmetros de rota — sem isso, `GET /patients/{patient}` de outro tenant resolveria o model e só depois seria barrado. Com isso, vira 404 no binding. É o que faz `->whereNumber()` + global scope produzirem isolamento cross-tenant "de graça" nas **68** rotas com parâmetro de URI (65 delas em `routes/web.php`; `grep -hE "Route::(get|post|put|patch|delete)\(" routes/*.php | grep -cF '{'`).

O scope propriamente dito está em `app/Traits/Models/BelongsToClinic.php:20-38` (usado por 32 models): `bootBelongsToClinic()` registra `creating` (preenche `clinic_id` a partir de `CurrentClinic`) e `addGlobalScope('clinic', …)`. O bypass é explícito: `Model::withoutGlobalScope('clinic')`.

**`withExceptions` (`bootstrap/app.php:41-43`): VAZIO** (`//`).

⚠️ Regressão dura vs. boilerplate: `boilerplate/bootstrap/app.php:45-72` tem `$exceptions->respond(…)` que (a) renderiza `errors/error-page` Inertia para 403/404/500/503 fora de local/testing, com fallback Blade `errors.500` quando o próprio render falha, (b) trata 419 com `Inertia::flash('error', 'Sua sessão expirou…')` + `back()`, (c) recarimba headers de segurança via `SecurityHeaders::stamp($response)`. O cuidari não tem nada disso — e nem as páginas: `ls resources/views/errors` e `ls resources/js/pages/errors` retornam "não existe".

⚠️ O cuidari também não tem o bloco `trustProxies` do boilerplate (`boilerplate/bootstrap/app.php:28-34`, lendo `TRUSTED_PROXIES`).

---

### 6. Middlewares (`app/Http/Middleware/`, 4 arquivos)

| Arquivo | Linhas | O que faz | Onde é registrado |
| --- | --- | --- | --- |
| `EnsureClinicContext.php` | 44 | ⭐ Resolve o tenant da request: `$user->loadMissing('clinic')`; se há clínica, `CurrentClinic::set()` e segue (`:32-36`); se não há mas o usuário tem `Roles::SUPER_USER`, segue **sem contexto** (`:38-40`); caso contrário `abort(403, 'Usuário autenticado sem clínica vinculada.')` (`:42`). Convidado (`!$user instanceof User`) passa direto (`:25-27`) | alias `clinic` (`bootstrap/app.php:30`) + `prependToPriorityList` (`:36-39`). Aplicado em `routes/web.php:18` |
| `EnsureModuleEnabled.php` | 37 | ⭐ Middleware **parametrizado**: `handle($request, $next, string $module)`. `Module::tryFrom($module)`; se o slug não existe no enum, lança `InvalidArgumentException` com o slug no texto (`:26`) — erro de programador vira exceção, não 403 silencioso. Depois `abort(403, 'Módulo não habilitado para esta clínica.')` se `!$clinic->hasModule($moduleEnum)` (`:31-33`) | alias `module` (`bootstrap/app.php:31`). Usado 4× em `routes/web.php:91,169,204,237` |
| `HandleAppearance.php` | 18 | `View::share('appearance', $request->cookie('appearance') ?? 'system')` | `web(append:)` (`bootstrap/app.php:24`) |
| `HandleInertiaRequests.php` | 79 | Shared props: `name`, `quote`, `auth` (user/permissions/roles/impersonating), ⭐ `clinic` (closure), `flash` (success/error/warning/info), `ziggy` | `web(append:)` (`bootstrap/app.php:25`) |

**Sobre `HandleInertiaRequests`** — `diff` contra o boilerplate:

- ⭐ Prop `clinic` como **closure** (`app/Http/Middleware/HandleInertiaRequests.php:57-66`), com comentário explicando o porquê: o contexto é setado pelo middleware de rota `clinic`, que roda **depois** do `share()` eager do Inertia. Expõe `id`, `name`, `segment`, `enabled_modules`. Não existe no boilerplate.
- ⚠️ `'user' => $user` (`:44`) publica o **model inteiro** em toda navegação. O boilerplate já corrigiu isso: `Arr::only($user->toArray(), self::SHARED_USER_FIELDS)` com `SHARED_USER_FIELDS = ['id','name','email','email_verified_at']` (`boilerplate/app/Http/Middleware/HandleInertiaRequests.php:14-21,51-56`), justamente porque `$hidden` só esconde password/remember_token — o resto (cpf_cnpj, phone, mobile, user_notes) vazava em toda página. No cuidari o vazamento continua **e o model de usuário é maior** (contexto clínico).
- `flash` e `ziggy` idênticos ao boilerplate.
- `app(ImpersonationService::class)` resolvido dentro de `share()` (`:25`) em vez de injeção — igual ao boilerplate.

#### 6.1 Diff de middlewares cuidari × boilerplate

| Middleware | Cuidari | Boilerplate |
| --- | --- | --- |
| `EnsureClinicContext` | ⭐ **só no cuidari** | — |
| `EnsureModuleEnabled` | ⭐ **só no cuidari** | — |
| `HandleAppearance` | ✔ (idêntico) | ✔ |
| `HandleInertiaRequests` | ✔ (divergente, ver acima) | ✔ |
| `EnsureUserIsActive` | ⚠️ **ausente** | ✔ `boilerplate/app/Http/Middleware/EnsureUserIsActive.php` (desloga sessão aberta quando a conta é desativada) |
| `SecurityHeaders` | ⚠️ **ausente** | ✔ `boilerplate/app/Http/Middleware/SecurityHeaders.php` (HSTS/CSP; `grep -rn "SecurityHeaders\|Content-Security-Policy" app bootstrap config` no cuidari → 0 hits) |
| `SetSensitiveCacheHeaders` | ⚠️ **ausente** | ✔ `boilerplate/app/Http/Middleware/SetSensitiveCacheHeaders.php` |

Exclusivos do cuidari: **2** (`EnsureClinicContext`, `EnsureModuleEnabled`). Ausentes no cuidari: **3**.

#### 6.2 Cobertura de teste dos middlewares próprios

| Teste | Linhas |
| --- | --- |
| `tests/Feature/Foundation/EnsureClinicContextTest.php` | 71 |
| `tests/Feature/Foundation/EnsureModuleEnabledTest.php` | 61 |
| `tests/Feature/Foundation/InertiaClinicSharedPropsTest.php` | 64 |
| `tests/Feature/Foundation/BelongsToClinicTest.php` | (existe) |

---

### 7. Providers (`bootstrap/providers.php` — 2 entradas, idêntico ao boilerplate)

#### 7.1 `app/Providers/AppServiceProvider.php` (183 linhas)

`register()` (`:61-64`): ⭐ **uma única linha** — `$this->app->scoped(CurrentClinic::class)`. `app/Services/CurrentClinic.php` é um holder mutável (`set/get/id`) com docblock explicando que o worker de fila chama `forgetScopedInstances()` entre jobs, então **cada job precisa setar o próprio contexto** — o scope de `BelongsToClinic` vale igualmente em HTTP, console, Horizon e scheduler.

`boot()` (`:66-80`) chama 10 métodos privados + `getComposer()`:

| Método | Linha | O que faz |
| --- | --- | --- |
| `setupLogViewer()` | 82 | `LogViewer::auth(fn($r) => $r->user()?->hasRole(Roles::SUPER_USER))` |
| `configModels()` | 87 | `Model::shouldBeStrict()` |
| `configCommands()` | 92 | `DB::prohibitDestructiveCommands(app()->isProduction())` |
| `configUrls()` | 99 | `URL::forceHttps()` em produção |
| `configDate()` | 106 | `Date::use(CarbonImmutable::class)` |
| `configActivitylog()` | 111 | ⭐ `CauserResolver::resolveUsing(fn() => ActivityCauserResolver::resolve())` — resolve o causer do activitylog por classe própria (`app/Resolvers/ActivityCauserResolver.php`), relevante sob impersonação |
| `configGates()` | 118 | Auto-registro: `foreach (Permissions::cases())` → `Gate::define($p->value, …)`. **69 gates** |
| `configPolicies()` | 134 | 16 `Gate::policy(...)` explícitos |
| `configResources()` | 157 | `JsonResource::withoutWrapping()` |
| `configEvents()` | 162 | ⭐ `Event::listen(ImpersonateStarted → LogImpersonateStarted)` e `ImpersonateStopped → LogImpersonateStopped` |
| `getComposer()` | 168 | `View::composer('*', …)` compartilhando `auth.user/role/permissions` para as views Blade |

⚠️ `getComposer()` (`:168-182`) é um **segundo canal** de props de auth, com shape diferente do `HandleInertiaRequests::share()` (`role` string vs `roles` array). Presente também no boilerplate (`boilerplate/app/Providers/AppServiceProvider.php:180`), então é herança comum, não invenção do cuidari — mas o `CLAUDE.md` do boilerplate proíbe exatamente isso ("Não crie um segundo canal … com shape diferente para os mesmos dados").

⚠️ **`configRateLimiting()` não existe no cuidari.** O boilerplate tem esse método (`boilerplate/app/Providers/AppServiceProvider.php:93-127`) com 4 `RateLimiter::for`: `auth` (10/min por IP), `impersonate` (10/min por usuário), `verification` (6/min por usuário), `password-confirmation` (6/min por usuário, com comentário longo explicando por que chavear por usuário e não por IP).

**Policies registradas (16, `app/Providers/AppServiceProvider.php:136-154`):** `User`, `Professional`, `Patient`, `Receivable`, `Payable`, `Payment`, `CashRegisterSession`, `FinancialAccount`, `FinancialCategory`, `CreditCard`, `Supplier`, `Product`, `StockMovement`, `InventoryCount`, `RetailSale`, `OpticalOrder`. O boilerplate registra **1** (`grep -c "Gate::policy(" boilerplate/app/Providers/AppServiceProvider.php` = 1).

⚠️ Registro **manual** de policies (16 chamadas explícitas) em vez de auto-discovery — cada novo model exige lembrar de editar o provider. Não há teste que verifique "toda policy em `app/Policies/` está registrada" (`find app/Policies` = 16 e `grep -c Gate::policy` = 16 batem hoje, mas por disciplina, não por gate automatizado).

#### 7.2 `app/Providers/HorizonServiceProvider.php` (29 linhas)

Estende `HorizonApplicationServiceProvider`. `gate()` (`:25-28`): `Gate::define('viewHorizon', fn(?User $u) => $u?->hasRole(Roles::SUPER_USER) ?? false)`. `boot()` só chama `parent::boot()`.

Rotas de pacote (não em `routes/`): Horizon em `/horizon` com middleware `['web']` (`config/horizon.php:44,86`); Log Viewer em `/logs` (`config/log-viewer.php:38`) com `AuthorizeLogViewer` (`config/log-viewer.php:74-77`) + `EnsureFrontendRequestsAreStateful` na API (`config/log-viewer.php:88-90`); health check em `/up` (`bootstrap/app.php:18`).

⚠️ `config/horizon.php:86` — middleware `['web']` apenas, sem `auth`. A proteção depende exclusivamente do gate `viewHorizon`. Mesmo padrão do boilerplate.

---

### 8. Rate limiters nomeados

**Nenhum.** `grep -rn "RateLimiter::for" app bootstrap config routes` → 0 ocorrências. Todo rate limiting no cuidari é:

1. `throttle:N,M` inline em 3 rotas: `routes/auth.php:44` (`6,1`), `routes/auth.php:48` (`6,1`), `routes/web.php:46` (`10,1`).
2. Manual dentro de `app/Http/Requests/Auth/LoginRequest.php:32,39,44,50` (`RateLimiter::hit/clear/tooManyAttempts/availableIn`, teto de 5).

⚠️ Todos os `throttle:N,M` inline chaveiam por IP (default do Laravel para rotas sem usuário resolvido de forma explícita), não por usuário — o boilerplate já migrou para limitadores nomeados chaveados por `$request->user()->id ?? $request->ip()`.

---

### 9. Rotas de ESCRITA autenticadas sem `can:` nem `#[Authorize]`

`#[Authorize]` **não é usado em lugar nenhum**: `grep -rn "Authorize" app/Http/Controllers` só encontra `use Illuminate\Foundation\Auth\Access\AuthorizesRequests` em `app/Http/Controllers/Controller.php:7,11`.

**Contagens (script Python sobre `routes/web.php`, resolvendo grupos de `can:` por faixa de linha):**

| Métrica | Valor |
| --- | --- |
| Rotas de escrita em `routes/web.php` | **73** |
| …**com** `can:` (inline ou por grupo) | **11** |
| …**sem** `can:` | **62** |
| Rotas de escrita em `routes/settings.php` (todas sob `auth`, nenhuma com `can:`) | **3** |
| Rotas de escrita em `routes/auth.php` sob `auth` (verification.send, confirm-password, logout) | **3** |
| **Total de rotas de escrita autenticadas sem `can:` nem `#[Authorize]`** | **68** (62 + 3 + 3) |
| Idem, considerando só rotas de domínio (`routes/web.php`) | **62** |

As 11 com `can:` são: `routes/web.php:31,34,35,36,40,41` (grupo `can:manage_users` de `:28`), `:45` (`can:impersonate_users` inline), `:281` (grupo `can:manage_roles` de `:275`), `:288,289` (grupo `can:assign_roles` de `:287`), `:291` (`can:manage_users` inline).

**Onde as 62 sem `can:` realmente autorizam** (script verificando `$this->authorize(` / `Gate::authorize(` no controller e `authorize()` com `->can(` no FormRequest):

| Mecanismo | Rotas |
| --- | --- |
| `$this->authorize(…)` dentro do controller | **37** |
| Só `FormRequest::authorize()` com `->can(…)` | **24** |
| **Nenhuma autorização encontrada** | **1** |

⭐ Padrão consciente e documentado: `routes/web.php:50-51` explica que professionals não usa `can:` porque "o próprio profissional pode editar o perfil básico sem `manage_professionals`"; `:59-60` explica que patients usa policy porque "o escopo do PROFESSIONAL é por vínculo"; `:89-90`, `:167-168`, `:202-203`, `:235-236` explicam que os grupos de módulo deixam a autorização fina nas policies. O `can:` seria grosso demais para o modelo de permissão real.

⚠️ A **única** rota de escrita sem nenhuma autorização em nenhuma camada:

| Rota | Controller | Guarda existente |
| --- | --- | --- |
| `DELETE users/impersonate` (`routes/web.php:24`, nome `users.impersonate.stop`) | `app/Http/Controllers/User/StopImpersonateController.php` | Só `if (!$this->impersonationService->isImpersonating()) abort(403)` (`:22-24`). Sem `can:`, sem `$this->authorize`, sem FormRequest |

Essa é herança direta do boilerplate (`boilerplate/routes/web.php:18-19`, mesmo controller) e é defensável — quem está impersonando precisa poder sair. Vale como observação, não como bug do cuidari.

⚠️ **Guard-rail sugerido:** 24 rotas de escrita dependem **exclusivamente** do `authorize()` do FormRequest. Se alguém trocar o type-hint do `__invoke` de `StoreReceivableRequest` por `Request` num refactor, a autorização some sem quebrar nenhum teste de rota. Ex.: `app/Http/Controllers/Finance/Receivable/StoreController.php` não tem `$this->authorize` — a defesa inteira está em `app/Http/Requests/Finance/StoreReceivableRequest.php:17-20` (`return $this->user()?->can('create', Receivable::class) ?? false`). Um teste de arquitetura ("todo controller de escrita ou chama `authorize` ou recebe um FormRequest cujo `authorize()` não retorne `true` literal") fecharia isso.

⚠️ 3 FormRequests de escrita **não declaram `authorize()`** (herdam `true` da base) e dependem 100% do `$this->authorize` do controller: `app/Http/Requests/Patient/UpdatePatientGuardianRequest.php`, `…/UpdatePatientAlertRequest.php`, `…/UpdatePatientContactPreferenceRequest.php`. Os controllers correspondentes de fato autorizam (ex.: `app/Http/Controllers/Patient/Guardian/UpdateController.php:19` → `$this->authorize('manageGuardians', $patient)`), mas a assimetria com os outros 40 requests é uma armadilha de manutenção.

Único `authorize(): bool { return true; }` do projeto: `app/Http/Requests/Auth/LoginRequest.php:14-16` (correto — rota `guest`). Verificado por `grep -rn -A3 "function authorize" app/Http/Requests | grep -B2 "return true"` → 1 ocorrência. Dos 53 FormRequests, 43 declaram `authorize()`.

---

### 10. Resumo do delta cuidari → boilerplate

| Item | Status | Path |
| --- | --- | --- |
| ⭐ `prependToPriorityList(SubstituteBindings, EnsureClinicContext)` | boilerplate não tem | `bootstrap/app.php:36-39` |
| ⭐ `EnsureClinicContext` (tenant + escape hatch para SUPER_USER) | boilerplate não tem | `app/Http/Middleware/EnsureClinicContext.php` |
| ⭐ `EnsureModuleEnabled` (middleware parametrizado + `InvalidArgumentException` para slug desconhecido) | boilerplate não tem | `app/Http/Middleware/EnsureModuleEnabled.php:23-27` |
| ⭐ `CurrentClinic` como `scoped()` + docblock sobre `forgetScopedInstances()` | boilerplate não tem | `app/Providers/AppServiceProvider.php:63`, `app/Services/CurrentClinic.php` |
| ⭐ Prop Inertia lazy por closure para dado setado por middleware de rota | boilerplate não tem | `app/Http/Middleware/HandleInertiaRequests.php:57-66` |
| ⭐ `->whereNumber()` em 28 rotas (desambigua `create`/`board` de `{id}`) | boilerplate não usa | `routes/web.php` (28 ocorrências) |
| ⭐ Agendamento condicional por feature-flag no `console.php` | boilerplate não tem | `routes/console.php:22-24` |
| ⭐ Ausência de rota documentada em comentário (movimento imutável, O.S. não apaga) | boilerplate não tem | `routes/web.php:182-183`, `:270-271` |
| ⭐ Comentário no arquivo de rotas justificando *por que* não há `can:` | boilerplate não tem | `routes/web.php:50-51,59-60,89-90` |
| ⭐ 16 policies + 69 gates auto-registrados | boilerplate tem 1 policy / 5 gates | `app/Providers/AppServiceProvider.php:118-155` |
| ⭐ `Event::listen` de impersonação → listeners de log | boilerplate não tem | `app/Providers/AppServiceProvider.php:162-166` |
| ⭐ `ActivityCauserResolver` custom | boilerplate não tem | `app/Providers/AppServiceProvider.php:111-116` |
| ⚠️ `withExceptions` vazio (sem error pages, sem 419, sem re-stamp de headers) | boilerplate tem | `bootstrap/app.php:41-43` vs `boilerplate/bootstrap/app.php:45-72` |
| ⚠️ Sem `SecurityHeaders` / `SetSensitiveCacheHeaders` / `trustProxies` | boilerplate tem | `bootstrap/app.php:20-40` |
| ⚠️ Sem `EnsureUserIsActive`; login sem filtro `is_active` | boilerplate tem | `app/Http/Requests/Auth/LoginRequest.php:31` |
| ⚠️ Zero `RateLimiter::for`; 4 rotas de auth sem throttle nenhum | boilerplate tem 4 limitadores nomeados | `routes/auth.php:19,29,35,54` |
| ⚠️ `'user' => $user` inteiro nas shared props | boilerplate já restringe a 4 campos | `app/Http/Middleware/HandleInertiaRequests.php:44` |
| ⚠️ `routes/settings.php` só sob `auth` (sem `verified`, sem `clinic`) | idêntico no boilerplate | `routes/settings.php:10` |
| ⚠️ 4 controllers multi-ação em `Finance\Settings\` | viola `CLAUDE.md` do boilerplate | `routes/web.php:131-163` |
| ⚠️ 24 rotas de escrita autorizadas só pelo `authorize()` do FormRequest | sem teste de arquitetura que garanta | ver §9 |
| ⚠️ `routes/console.php` sem `declare(strict_types = 1)` | idem no boilerplate | `routes/console.php:1` |
## Models, migrations, casts, enums, observers

Fonte: `cuidari` @ `a7a1170` (working tree limpa; leitura do disco = leitura do SHA).
Comparação: `boilerplate` branch `main`.
Todos os paths abaixo são relativos à raiz do projeto citado.

### 0. Contagens verificadas

| O quê | Cuidari | Boilerplate | Comando |
|---|---|---|---|
| Models em `app/Models/` | **38** | 4 | `find app/Models -name '*.php' \| wc -l` |
| Migrations em `database/migrations/` | **43** | 6 | `find database/migrations -name '*.php' \| wc -l` |
| Enums em `app/Enum/` | **42** | 2 | `find app/Enum -name '*.php' \| wc -l` |
| Casts em `app/Casts/` | **3** | 1 | `find app/Casts -name '*.php' \| wc -l` |
| Value Objects em `app/ValueObjects/` | **3** | 1 | `find app/ValueObjects -name '*.php' \| wc -l` |
| Traits em `app/Traits/Models/` | **2** | 1 | `find app/Traits/Models -name '*.php' \| wc -l` |
| Observers (`app/Observers/`) | **0 — diretório não existe** | 0 | `ls app/Observers` → `(nao existe)` |
| Chamadas a `observe(` em `app/` | **0** | — | `grep -rn 'observe(' app/ \| wc -l` |
| `#[ObservedBy]` / `#[ScopedBy]` / `dispatchesEvents` | **0** | — | `grep -rn 'dispatchesEvents\|ObservedBy\|ScopedBy' app/` |

**`app/Observers/` não existe.** Todo hook de ciclo de vida está inline em `booted()` dentro do model (5 models) ou no `bootBelongsToClinic()` do trait. Ver §6.

### 1. `app/Models/` — 38 models

#### 1.1 Traits e convenções (contadas)

| Característica | Contagem | Comando |
|---|---|---|
| `use BelongsToClinic;` | **32 / 38** | `grep -rlE '^\s+use BelongsToClinic;' app/Models/ \| wc -l` |
| `use SoftDeletes;` | **14 / 38** | `grep -rlE '^\s+use SoftDeletes;' app/Models/ \| wc -l` |
| `use LogsActivity` (spatie) | **16 / 38** | `grep -rlE '^\s+use LogsActivity' app/Models/ \| wc -l` |
| `use HasFactory;` | **36 / 38** | `grep -rlE '^\s+use HasFactory;' app/Models/ \| wc -l` |
| `declare(strict_types = 1)` | **36 / 38** | `grep -rl 'declare(strict_types' app/Models/ \| wc -l` |
| `protected $guarded` | **0 / 38** — 100% usa `$fillable` | `grep -rl 'protected \$guarded' app/Models/ \| wc -l` |
| `protected static function booted()` | **5 / 38** | `grep -rl 'protected static function booted' app/Models/ \| wc -l` |
| Models com scope local | **12 / 38** (17 métodos `scope*`) | `grep -rho 'public function scope[A-Za-z]*' app/Models/ \| wc -l` |
| Models com accessor `Attribute` | **2 / 38** (4 métodos) | `grep -rl 'Eloquent.Casts.Attribute' app/Models/ \| wc -l` |

Os **6 models sem `BelongsToClinic`** (`grep -rLE '^\s+use BelongsToClinic;' app/Models/`) são exatamente a camada de plataforma + RBAC, e a exclusão é correta:
`app/Models/Clinic.php`, `app/Models/ClinicSubscription.php`, `app/Models/PlatformPlan.php`, `app/Models/User.php`, `app/Models/Permission.php`, `app/Models/Role.php`.

⚠️ Os **2 models sem `declare(strict_types = 1)`** são justamente os herdados do boilerplate e nunca reformatados: `app/Models/User.php:1` e `app/Models/Permission.php:1`. Ambos já têm `declare` no boilerplate — é regressão local do cuidari, não candidato a colheita.

#### 1.2 Inventário model a model

| Model (`app/Models/`) | L | Traits | Casts notáveis | Relações | Scopes / hooks |
|---|---|---|---|---|---|
| `CardFeeTier.php` | 40 | BelongsToClinic, HasFactory | `fee_percent` decimal:2 | `creditCard()` BelongsTo | — |
| `CashMovement.php` | 47 | BelongsToClinic, HasFactory | `CashMovementKind`, MoneyCast | `session()`, `creator()` | — |
| `CashRegisterSession.php` | 112 | BelongsToClinic, HasFactory, LogsActivity | 4× MoneyCast, `CashRegisterSessionStatus`, 2× immutable_datetime | `account()`, `openedBy()`, `closedBy()`, `movements()`, `payments()` | `scopeOpen` (:85), `isOpen()` (:80) |
| `Clinic.php` | 79 | HasFactory, LogsActivity, SoftDeletes | `ClinicSegment`, `enabled_modules` array, `settings` array | `users()`, `subscription()` | `hasModule()` (:53) |
| `ClinicSequence.php` | 35 | BelongsToClinic, HasFactory | `value` integer | — | — ⭐ contador genérico, ver §3.4 |
| `ClinicSubscription.php` | 92 | HasFactory, LogsActivity | 3 enums de plataforma, 8× `'datetime'`, 2× array | `clinic()`, `platformPlan()` | — |
| `CreditCard.php` | 43 | BelongsToClinic, HasFactory, SoftDeletes | `debit_fee_percent` decimal:2 | `feeTiers()` | — |
| `FinancialAccount.php` | 60 | BelongsToClinic, HasFactory, SoftDeletes | `FinancialAccountKind`, MoneyCast | `payments()`, `cashRegisterSessions()`, `openCashRegisterSession()` HasOne filtrada (:55) | — |
| `FinancialCategory.php` | 59 | BelongsToClinic, HasFactory, SoftDeletes | `FinancialCategoryKind` | `parent()`/`children()` (auto-relação), `receivables()`, `payables()` | — |
| `FinancialLedgerEntry.php` | 78 | BelongsToClinic, HasFactory | `LedgerEntryType`, `LedgerDirection`, MoneyCast, immutable_date, metadata array | `account()`, `source()` MorphTo, `creator()` | ⭐ `booted()` :42 — **imutável por hook** |
| `InventoryCount.php` | 84 | BelongsToClinic, HasFactory, LogsActivity | `InventoryCountStatus`, 2× immutable_datetime | `items()`, `starter()`, `closer()` | `scopeOpen` (:69) |
| `InventoryCountItem.php` | 59 | BelongsToClinic, HasFactory | 3× QuantityCast (`expected`, `counted`, `difference`) | `count()`, `product()`, `batch()` | — |
| `OpticalOrder.php` | 321 | BelongsToClinic, HasFactory, LogsActivity, SoftDeletes | 6 enums, 9× decimal:2, 2× immutable_date, 4× immutable_datetime | `patient()`, `sale()`, `eyes()` ⭐ ordenada por CASE, `items()`, `photos()` | ⭐ `booted()` :90 — entregue é imutável; `scopeOpen` (:288); `isLate()` (:239) |
| `OpticalOrderEye.php` | 109 | BelongsToClinic, HasFactory | `Eye`, `LensCategory`, 6× decimal:2, `axis` integer | `order()`, `lensProduct()` | `PRISM_BASES` const (:34) ⭐ mini-enum sem enum |
| `OpticalOrderItem.php` | 71 | BelongsToClinic, HasFactory | `OpticalItemKind`, QuantityCast, 2× MoneyCast | `order()`, `product()` | — |
| `OpticalOrderPhoto.php` | 53 | BelongsToClinic, HasFactory | `size_kb` integer | `order()`, `uploader()` | — (tabela nasce vazia por design) |
| `Patient.php` | 259 | BelongsToClinic, HasFactory, LogsActivity **com alias**, SoftDeletes | `Sex`, `birth_date` date, `is_minor` boolean | 11 relações incl. `referrer()`/`referrals()` auto-relação, `tags()` BelongsToMany | ⭐⭐ `buildChanges()` :237 mascara CPF/RG no ActivityLog; `scopeSearch` (:155), `scopeVisibleTo` (:188); accessors `age`, `maskedCpf`, `formattedCpf` |
| `PatientAlert.php` | 90 | BelongsToClinic, HasFactory, LogsActivity | `PatientAlertKind`, `PatientAlertSeverity` | `patient()`, `creator()`, `source()` MorphTo | `scopeActive` (:67) |
| `PatientConsent.php` | 92 | BelongsToClinic, HasFactory, LogsActivity | 3 enums de consentimento, `metadata` array | `patient()`, `recorder()` | — |
| `PatientContactPreference.php` | 52 | BelongsToClinic, HasFactory | 2× `'datetime'`, `ContactChannel` | `patient()` | — |
| `PatientGroup.php` | 32 | BelongsToClinic, HasFactory, SoftDeletes | — (sem `casts()`) | `patients()` | — |
| `PatientGuardian.php` | 102 | BelongsToClinic, HasFactory, LogsActivity **com alias**, SoftDeletes | `GuardianRelationship`, booleans | `patient()` | mascaramento de CPF no log (mesmo padrão do Patient) |
| `PatientSource.php` | 52 | BelongsToClinic, HasFactory | `active` boolean | `patients()` | `DEFAULTS` const (:24) — 8 origens semeadas |
| `PatientTag.php` | 29 | BelongsToClinic, HasFactory | — | `patients()` BelongsToMany | — |
| `Payable.php` | 125 | BelongsToClinic, HasFactory, LogsActivity, SoftDeletes | `PayableStatus`, 2× MoneyCast, `recurrence` array | `supplier()`, `category()`, `payments()` | `scopeSettleable` (:94), `outstanding()`, `settledAmount()`, `isRecurring()` |
| `Payment.php` | 158 | BelongsToClinic, HasFactory, LogsActivity | `PaymentMethod`, `PaymentStatus`, **5× MoneyCast** | `receivable()`, `payable()`, `account()`, `cashRegisterSession()`, `creditCard()`, `registeredBy()`, `reversedPayment()`/`reversal()` auto-relação | `scopeConfirmed` (:120), `scopeReversals` (:125), `isReversal()` |
| `Permission.php` | 21 | — | — | `roles()` | ⚠️ sem `declare(strict_types)` |
| `PlatformPlan.php` | 42 | HasFactory | 2× MoneyCast, 2× array | `subscriptions()` | — |
| `Product.php` | 144 | BelongsToClinic, HasFactory, LogsActivity, SoftDeletes | `ProductUnit`, `AbcCurve`, **3× QuantityCast + 1× UnitCostCast + 1× MoneyCast** | `batches()`, `movements()` | `scopeActive` (:107), ⭐ `scopeBelowMinimum` (:116) com `whereColumn`; `stockFromMovements()`, `stockValue()` |
| `ProductBatch.php` | 88 | BelongsToClinic, HasFactory | QuantityCast, immutable_date | `product()`, `movements()` | ⭐ `scopeFefo` (:76) — first-expire-first-out com nulos por último; `scopeWithBalance` (:84) |
| `Professional.php` | 77 | BelongsToClinic, HasFactory, LogsActivity, SoftDeletes | `commission_percent` decimal:2 | `user()` | — |
| `Receivable.php` | 164 | BelongsToClinic, HasFactory, LogsActivity, SoftDeletes | `ReceivableStatus`, `PaymentMethod`, **4× MoneyCast**, 3× decimal:2 | `patient()`, `category()`, `creditCard()`, `origin()` MorphTo, `payments()` | `scopeSettleable` (:126), `totalDue()`, `outstanding()`, `settledAmount()` |
| `RetailSale.php` | 327 | BelongsToClinic, HasFactory, LogsActivity, SoftDeletes | 2 enums, 3× MoneyCast, `payment_terms` array | `patient()`, `seller()`, `items()`, `receivables()` MorphMany, `movements()` MorphMany, ⭐ `payments()` HasManyThrough sobre morph (:144) | ⭐⭐ `booted()` :68 — concluída é imutável, com whitelist de colunas de devolução; `scopeCompleted` (:298); `satisfiesTotalsInvariant()` (:176); `stockShortages()` (:217) |
| `RetailSaleItem.php` | 133 | BelongsToClinic, HasFactory | QuantityCast, 3× MoneyCast, UnitCostCast | `sale()`, `product()` | ⭐ `booted()` :46 — create/update/delete exigem venda em rascunho (`assertSaleIsEditable()` :121) |
| `Role.php` | 53 | — | — | `permissions()`, `users()` | ⚠️ `app/Models/Role.php:21` — `public function users(): hasMany` (minúsculo) |
| `StockMovement.php` | 123 | BelongsToClinic, HasFactory | `StockMovementDirection`, `StockMovementReason`, QuantityCast, UnitCostCast | `product()`, `batch()`, `supplier()`, `source()` MorphTo, `creator()` | ⭐ `booted()` :50 — **imutável por hook**; `scopeInbound`/`scopeOutbound`; `signedQuantity()` (:99) |
| `Supplier.php` | 44 | BelongsToClinic, HasFactory, SoftDeletes | — | `payables()` | — |
| `User.php` | 86 | HasFactory, Notifiable, HasRolesAndPermissions, LogsActivity | `password` hashed, `is_active` boolean | `clinic()`, `professional()` HasOne | ⚠️ sem `declare(strict_types)`; `$fillable` = boilerplate **+ `clinic_id`** |

---

### 2. `app/ValueObjects/` + `app/Casts/` — a escala inteira do dinheiro e do estoque

Contagem de adoção (`grep -rl '<Cast>::class' app/Models/ | wc -l`):

| Cast | Models que usam | Ocorrências em `casts()` | Escala | Coluna |
|---|---|---|---|---|
| `MoneyCast` | **12** | **29** | centavos (`int`, 10⁻²) | `decimal(12,2)` |
| `QuantityCast` | **6** | **10** | milésimos (`int`, 10⁻³) | `decimal(12,3)` |
| `UnitCostCast` | **3** | **3** | décimos de milésimo (`int`, 10⁻⁴) | `decimal(12,4)` |

Zero `float`/`double` no schema inteiro (`grep -rnE -e '->(float\|double\|unsignedFloat\|unsignedDouble)\(' database/migrations/ | wc -l` → **0**).

#### 2.1 `Money` / `MoneyCast` — **já colhido, boilerplate está à frente**

`diff -u boilerplate/app/ValueObjects/Money.php cuidari/app/ValueObjects/Money.php` retorna **apenas 2 hunks de comentário** (linhas 88-92 e 122-126). São o **mesmo arquivo**.
`diff` do `MoneyCast` mostra o boilerplate **à frente**: `@implements CastsAttributes<Money, Money|string>` (cuidari: `<Money, string>`) + comentário `@phpstan-ignore deadCode.unreachable` justificando a guarda defensiva.

→ Nada a colher aqui. Registrado para a rodada não re-propor `Money` como candidato.

#### 2.2 ⭐⭐ `Quantity` — `app/ValueObjects/Quantity.php` (203 L) — **o boilerplate não tem**

Milésimos inteiros, `private const SCALE = 1000`. API: `fromThousandths`, `fromDecimal` (regex `/^(-?)(\d+)(?:\.(\d{1,3}))?$/`), `zero`, `sum(...)` variádico, `thousandths()`, `toDecimal()`, `add`, `subtract`, `multiply(self)` ⭐ (produto de duas quantidades com half-up, converte embalagem→unidade-base), `multiplyBy(int)`, `divideBy(int)`, `negate`, `absolute`, `equals`, `compareTo`, `isGreaterThan`, `isLessThan`, `isZero`, `isPositive`, `isNegative`, `min(self)` ⭐ (baixa parcial FEFO), `format()` ⭐ (`10.500` → `10,5`, corta cauda de zeros), `jsonSerialize`, `__toString`. Implementa `JsonSerializable, Stringable`.

Arredondamento half-up sem float em `multiply` (:100) e `divideBy` (:127): `intdiv(2*abs + scale, 2*scale)`.

#### 2.3 ⭐⭐ `UnitCost` — `app/ValueObjects/UnitCost.php` (154 L) — **o boilerplate não tem**

Duas constantes de escala: `SCALE = 10_000` (o 4 do `decimal(12,4)`) e `TO_CENTS = 100_000` (ponte 10⁻⁴ × 10⁻³ → 10⁻²).

Métodos que são a razão de existir:
- `fromTotal(Money $total, Quantity $quantity): self` (:53) — nasce da entrada de compra ("R$ 120,00 por 10 frascos de 10 ml"); lança se quantidade não for positiva.
- `totalFor(Quantity): Money` (:86) — ⭐ **a ponte entre estoque e financeiro**, arredondando para o centavo.
- `movingAverage(Quantity $currentStock, Quantity $incoming, self $incomingCost): self` (:98) — ⭐ custo médio móvel ponderado; estoque zerado/negativo adota o custo da entrada.
- `divideHalfUp(int, int): int` privado (:141) — half-up preservando sinal, com guarda de divisão por zero.

#### 2.4 Os três casts são o mesmo molde

`app/Casts/MoneyCast.php` (44 L), `app/Casts/QuantityCast.php` (44 L), `app/Casts/UnitCostCast.php` (44 L) são **estruturalmente idênticos**: `get()` retorna `null` ou `VO::fromDecimal((string) $value)`; `set()` aceita `null`, o VO, ou string decimal, e lança `InvalidArgumentException` nomeando o atributo em qualquer outro caso (⭐ rejeita `float` explicitamente — é o que impede perda de centavo via `create(['amount' => 10.1])`).

---

### 3. `database/migrations/` — 43 migrations, schema real

#### 3.1 Contagens de schema (verificadas)

| Métrica | Valor | Comando |
|---|---|---|
| `->decimal(x, 12, 2)` (dinheiro) | **29** | `grep -rhoE "decimal\('[a-z_]+', *[0-9]+, *[0-9]+\)" ... \| sort \| uniq -c` |
| `->decimal(x, 5, 2)` (percentual) | **13** | idem |
| `->decimal(x, 6, 2)` (medidas ópticas) | **9** | idem |
| `->decimal(x, 12, 3)` (quantidade) | **9** | idem |
| `->decimal(x, 12, 4)` (custo unitário) | **3** | idem |
| `->decimal(x, 4, 2)` (adição de lente) | **1** | idem |
| `->decimal(x, 10, 3)` (`content_per_package`) | **1** | idem |
| `->float(` / `->double(` | **0** | `grep -rnE -e '->(float\|double\|...)\(' \| wc -l` |
| `->enum(` no schema | **0** | `grep -rn '\->enum(' \| wc -l` |
| `->unique(` | **31** | `grep -rho '\->unique(' \| wc -l` |
| `->index(` | **33** | `grep -rho '\->index(' \| wc -l` |
| `->json(` | **13** | `grep -rho '\->json(' \| wc -l` |
| `nullableMorphs(` | **6** | `grep -rho 'nullableMorphs(' \| wc -l` |
| `morphs(` (not-null) | **0** | `grep -rhoE '\->morphs\(' \| wc -l` |
| `softDeletes()` | **14** | `grep -rc 'softDeletes()' \| awk` |
| `constrained(` (FKs) | **95** | `grep -rhoE -e 'constrained\(' \| wc -l` |
| FKs **com** `onDelete`/`cascadeOnDelete` | **9** | `grep -rnE -e 'cascadeOnDelete\|onDelete'` |
| FKs **sem** qualquer `onDelete` | **86** | `grep -rnE -e 'constrained\(' \| grep -cvE 'cascadeOnDelete\|onDelete\|...'` |
| Migrations com `declare(strict_types)` | **23 / 43** | `grep -rl 'declare(strict_types' \| wc -l` |
| `->char(` | **1** (`products.curve`) | `grep -rnE -e '->char\('` |

⭐ **Zero `->enum()` no schema.** Toda coluna de status/tipo é `string(N)` com `default`, e o enum PHP faz o cast no model. Consequência prática: adicionar um case novo é migration-free.

⭐ **Zero `float`/`double`.** Dinheiro, quantidade e custo são sempre `decimal` + VO.

#### 3.2 As 9 únicas FKs com `onDelete` explícito

```
0001_01_01_000003_create_permissions_roles_tables.php:32  user_id       -> onDelete('cascade')   [herdado do boilerplate]
0001_01_01_000003_create_permissions_roles_tables.php:33  permission_id -> onDelete('cascade')   [herdado do boilerplate]
2026_07_25_100050_create_patient_patient_tag_table.php:11  patient_id     -> cascadeOnDelete()
2026_07_25_100050_create_patient_patient_tag_table.php:12  patient_tag_id -> cascadeOnDelete()
2026_08_03_100040_create_inventory_count_items_table.php:15 inventory_count_id -> cascadeOnDelete()
2026_08_03_200030_create_retail_sale_items_table.php:18    retail_sale_id     -> cascadeOnDelete()
2026_08_03_210020_create_optical_order_eyes_table.php:19   optical_order_id   -> cascadeOnDelete()
2026_08_03_210030_create_optical_order_items_table.php:18  optical_order_id   -> cascadeOnDelete()
2026_08_03_210040_create_optical_order_photos_table.php:22 optical_order_id   -> cascadeOnDelete()
```

O padrão é consistente e legível: **cascade só de agregado→parte** (itens, olhos, fotos, pivot). ⭐ As outras **86** ficam no default do Laravel (sem cláusula `ON DELETE` = RESTRICT), o que protege o financeiro — não dá para apagar `financial_account` com `payments` pendurados.

⚠️ Mas o default é **implícito**: nada no schema diz "isto é RESTRICT de propósito". Um leitor não distingue "decidi RESTRICT" de "esqueci de escrever". Guard-rail candidato: exigir `onDelete` explícito (`restrictOnDelete()`) em toda FK.

#### 3.3 ⭐ Módulo financeiro — schema exato

**`receivables`** (`2026_07_27_100080_create_receivables_table.php`)

| Coluna | Tipo | Nota |
|---|---|---|
| `clinic_id` | FK constrained (restrict) | |
| `patient_id` | FK nullable | |
| `origin_type` / `origin_id` | `nullableMorphs('origin')` :16 | polimórfico — `RetailSale`, orçamento… |
| `budget_payment_term_id` | `unsignedBigInteger` nullable :18 | ⚠️ **FK ausente de propósito** — tabela `budget_payment_terms` ainda não existe (comentário :17) |
| `financial_category_id` | FK nullable | |
| `description` | `string` | |
| `installment_number` / `installment_total` | `unsignedSmallInteger` nullable | |
| `amount` | **`decimal(12,2)`** | MoneyCast |
| `paid_amount` | **`decimal(12,2)` default 0** | MoneyCast |
| `due_date` | `date` | `immutable_date` |
| `status` | **`string(20)` default `'open'`** | `ReceivableStatus` (6 cases) |
| `expected_method` | `string(30)` nullable | `PaymentMethod` (9 cases) |
| `credit_card_id` | FK nullable | |
| `negotiated_fee_percent` | `decimal(5,2)` nullable | |
| `interest_percent` / `penalty_percent` | `decimal(5,2)` nullable | encargos de atraso |
| `interest_amount` / `penalty_amount` | **`decimal(12,2)` default 0** | MoneyCast |
| `canceled_at` | `timestamp` nullable | |
| `cancellation_reason` | `string` nullable | |

Índices: `['clinic_id','status','due_date']`, `['clinic_id','patient_id','status']`.
⭐ Unique nomeado `receivables_origin_installment_unique` sobre `['clinic_id','origin_type','origin_id','installment_number']` (:46) — **idempotência da geração de parcelas por origem**. Comentário :45 explica o nome explícito: o auto-gerado passa de 64 chars no MySQL.

⚠️ `installment_number` é **nullable** e participa do unique. Em MySQL/Postgres NULLs não colidem em índice único — logo a idempotência **não vale para recebível sem parcelamento**: duas chamadas geram duas linhas para a mesma origem. Guard-rail candidato.

**`payables`** (`2026_07_27_100090_create_payables_table.php`) — `clinic_id`, `supplier_id` nullable, `financial_category_id` **not-null**, `description`, `amount` `decimal(12,2)`, `paid_amount` `decimal(12,2)` default 0, `due_date` date, `status` `string(20)` default `'open'`, `document_ref` nullable, `recurrence` **json** nullable, `canceled_at`, `cancellation_reason`, timestamps, softDeletes. Índice: `['clinic_id','status','due_date']`.

⚠️ **Assimetria Receivable↔Payable**: `payables` **não tem** `interest_*`/`penalty_*`, e `Payable::totalDue()` (`app/Models/Payable.php:72`) retorna `$this->amount` cru enquanto `Receivable::totalDue()` (`app/Models/Receivable.php:104`) soma principal + juros + multa. Também não há unique de idempotência em `payables` (não há coluna de origem). Assimetria deliberada pela spec, mas é armadilha para quem generaliza.

**`payments`** (`2026_07_27_100100_create_payments_table.php`) — o coração do estorno

| Coluna | Tipo |
|---|---|
| `receivable_id` / `payable_id` | FK **ambas nullable** |
| `financial_account_id` | FK not-null |
| `cash_register_session_id` | FK nullable |
| `method` | `string(30)` |
| `credit_card_id` | FK nullable |
| `card_installments` | `unsignedSmallInteger` nullable |
| `gross_amount` | `decimal(12,2)` |
| `fee_amount` | `decimal(12,2)` default 0 |
| `net_amount` | `decimal(12,2)` |
| `interest_amount` / `penalty_amount` | `decimal(12,2)` default 0 |
| `paid_on` | `date` |
| `registered_by` | FK `users` nullable |
| `status` | `string(20)` default `'confirmed'` |
| `reversed_by_payment_id` | FK auto-referente `payments` nullable |
| `notes` | `text` nullable |

Índice `['clinic_id','paid_on']`. ⭐ **`unique('reversed_by_payment_id')` (:37)** — garante no banco que um pagamento é estornado **no máximo uma vez**. Estorno é linha nova com valores negativos + `status = reversed` (docblock `app/Models/Payment.php:19-23`), original nunca editado.

⚠️ Nada no schema impede `receivable_id` e `payable_id` **ambos preenchidos** ou **ambos nulos**. Um CHECK (`num_nonnulls(receivable_id, payable_id) = 1`) seria o guard-rail; hoje a invariante vive só no service.
⚠️ `payments` **não tem** `softDeletes` — correto (é trilha), mas também não tem hook `booted()` bloqueando `update`/`delete`, ao contrário de `FinancialLedgerEntry` e `StockMovement`. A imutabilidade do pagamento é convenção, não trava.

**`financial_ledger_entries`** (`2026_07_27_100110_...`) — `clinic_id`, `entry_date` date, `type` `string(30)`, `direction` `string(10)`, `amount` `decimal(12,2)`, `financial_account_id` FK nullable, `nullableMorphs('source')`, `description`, `created_by` FK users nullable, `metadata` json nullable, timestamps. Índices `['clinic_id','entry_date']` e `['clinic_id','type']`. Sem softDeletes (proposital).

⭐⭐ A imutabilidade é aplicada em `app/Models/FinancialLedgerEntry.php:42-51`:
```php
static::updating(function(): never {
    throw new RuntimeException('Lançamento do ledger é imutável: registre um lançamento reverso.');
});
static::deleting(function(): never { /* idem */ });
```
Retorno `never` no closure — o tipo já diz que não há saída. Mesmo molde em `app/Models/StockMovement.php:50-59`.

**Suporte financeiro:**

| Tabela | Colunas-chave | Unique / índice |
|---|---|---|
| `financial_accounts` | `name`, `kind` string(20), `initial_balance` decimal(12,2), `requires_cash_session` bool, `active` bool, softDeletes | `unique(['clinic_id','name'])` |
| `financial_categories` | `name`, `kind` string(20), `parent_id` FK auto-referente, `active`, softDeletes | `unique(['clinic_id','name','kind'])` |
| `credit_cards` | `brand`, `debit_fee_percent` decimal(5,2), `settlement_days` unsignedSmallInteger default 1, `active`, softDeletes | `unique(['clinic_id','brand'])` |
| `card_fee_tiers` | `installments_from`/`installments_to` unsignedSmallInteger, `fee_percent` decimal(5,2) | apenas `index(['clinic_id','credit_card_id'])` |
| `cash_register_sessions` | `opened_by`/`closed_by` FK users, `opened_at`/`closed_at` timestamp, `opening_balance`/`expected_closing_balance`/`counted_closing_balance`/`difference` decimal(12,2), `status` string(20) default `'open'` | ⭐ índice nomeado `cash_sessions_clinic_account_status_index` |
| `cash_movements` | `kind` string(20), `amount` decimal(12,2), `reason` string, `created_by` FK users **not-null** | nenhum índice |

⚠️ `card_fee_tiers` não tem unique nem check impedindo **faixas sobrepostas** (`installments_from`/`to`): duas faixas cobrindo 1–6 e 4–12 convivem, e a taxa aplicada vira ordem de leitura.
⚠️ `cash_register_sessions` não tem unique parcial garantindo **uma sessão aberta por conta**. O `FinancialAccount::openCashRegisterSession()` (`app/Models/FinancialAccount.php:55`) é `HasOne` filtrada por status — se duas abrirem, ele silenciosamente pega uma. Invariante mora só no service.
⚠️ `cash_movements` sem índice nenhum além do PK; a listagem por sessão vai a table scan quando a tabela crescer.

#### 3.4 Estoque (Spec 15)

**`products`** — `name`, `sku` string(40) nullable, `category` nullable, `unit` string, `content_per_package` **`decimal(10,3)` default 1**, `stock` **`decimal(12,3)` default 0**, `min_stock` `decimal(12,3)` default 0, `average_cost` **`decimal(12,4)` default 0**, `sale_price` `decimal(12,2)` nullable, `requires_batch` bool default false, `active` bool default true, `barcode` string(64) nullable, `brand`, `model`, `curve` **`char(1)`** nullable, timestamps, softDeletes.
Uniques: `['clinic_id','name']`, `['clinic_id','sku']`, `['clinic_id','barcode']`. Índice `['clinic_id','active']`.

⭐ `stock` e `average_cost` são **projeções** declaradas como tal no docblock (`app/Models/Product.php:23-28`); a verdade são os `stock_movements`, e `Product::stockFromMovements()` (:87) recomputa para o teste da invariante.

**`product_batches`** — `batch_number` string(60), `expires_on` date nullable, `remaining` `decimal(12,3)` default 0. `unique(['product_id','batch_number'])`, `index(['clinic_id','expires_on'])`.
⚠️ O unique é `['product_id','batch_number']` **sem `clinic_id`** — funciona (product já é do tenant) mas quebra o padrão de todas as outras tabelas e depende do FK para o isolamento.

**`stock_movements`** — `product_id` not-null, `product_batch_id` nullable, `direction` string(10), `reason` string(30), `quantity` **`decimal(12,3)` sempre positiva** (a direção dá o sinal, comentário :21), `unit_cost` `decimal(12,4)` nullable, `supplier_id` nullable, `document_ref` nullable, `nullableMorphs('source')`, `created_by` FK users nullable (comentário `// null p/ jobs`), `notes`, timestamps. **Sem `deleted_at` e sem rota de update** (comentário :12-13). Índices `['clinic_id','product_id','created_at']`, `['clinic_id','reason']`.

**`inventory_counts`** / **`inventory_count_items`** — a contagem congela `expected` (`decimal(12,3)` default 0) na abertura; `counted` nullable (`null` = não contado ainda); `difference` nullable derivada. ⭐ Unique nomeado `inv_count_items_count_product_batch_unique` sobre `['inventory_count_id','product_id','product_batch_id']`.
⚠️ `product_batch_id` é nullable dentro desse unique — mesmo problema de NULL-não-colide do `receivables`: um produto sem lote pode entrar duas vezes na mesma contagem.

#### 3.5 Varejo e O.S. óptica

**`clinic_sequences`** ⭐ — `name` string(60), `value` unsignedInteger default 0, `unique(['clinic_id','name'])`. Contador **genérico** por clínica, lido com `lockForUpdate` (docblock `app/Models/ClinicSequence.php:11-15`). Serve `retail_sale` e `optical_orders` na mesma tabela e no mesmo lock. Padrão altamente reaproveitável — o boilerplate não tem nada equivalente.

**`retail_sales`** — `number` unsignedInteger, `kind` string(10) default `'quote'`, `status` string(12) default `'draft'`, `patient_id` nullable (`// null = balcão anônimo`), `seller_id` FK users not-null, `items_total`/`discount_amount`/`total` `decimal(12,2)` default 0, `discount_percent` `decimal(5,2)` nullable, `payment_terms` json nullable, `completed_at`/`canceled_at` timestamp, `cancellation_reason`, `notes` text, timestamps, softDeletes.
`unique(['clinic_id','number'])` + 3 índices.

⭐⭐ **Imutabilidade com whitelist** — `app/Models/RetailSale.php:48` + `:68-90`:
```php
private const RETURN_COLUMNS = ['status', 'canceled_at', 'cancellation_reason', 'updated_at'];
```
O hook lê `getRawOriginal('status')` (não o atributo mutado) e só libera o update quando **todas** as colunas sujas estão na whitelist **e** o destino é `Returned`. `deleting` só passa em `Draft`. É o mecanismo mais elaborado dessa família e o mais generalizável.

**`retail_sale_items`** — `product_id` nullable (`// null = item livre/serviço`), `description` **snapshot**, `quantity` `decimal(12,3)` default 1, `unit_price` `decimal(12,2)`, `unit_cost` `decimal(12,4)` nullable (custo médio na conclusão), `discount_amount` `decimal(12,2)` default 0, `discount_percent` `decimal(5,2)` nullable, `subtotal` `decimal(12,2)`, `position` unsignedSmallInteger default 0. `cascadeOnDelete` no `retail_sale_id`.

**`optical_orders`** (80 L, a maior migration) — cabeçalho + prescritor + armação + Visioffice + ciclo. Medidas do aro (`frame_bridge`, `frame_horizontal`, `frame_diagonal`, `frame_vertical`) e Visioffice (`vo_cro_right`, `vo_cro_left`, `vo_pantoscopic_angle`, `vo_panoramic_angle`, `vo_cvp`) são todas **`decimal(6,2)`** — 9 colunas. `patient_id` **not-null** (ao contrário da venda). `unique(['clinic_id','number'])`.
⚠️ Duas colunas nascem **mortas por design, documentado**: `external_reference` (:32, comentário :29-31 "NADA a consome") e `is_warranty` (:65, "nada escreve nem lê nesta versão").

**`optical_order_eyes`** — `eye` string(5), `lens_category` nullable, `lens_product_id` FK `products` nullable, `lens_description` **snapshot** nullable, `spherical`/`cylindrical` `decimal(5,2)`, `axis` unsignedSmallInteger (0–180), `addition` **`decimal(4,2)`**, `dnp`/`height` `decimal(5,2)`, `has_prism` bool, `prism_value` `decimal(5,2)`, `prism_base` string(10). `unique(['optical_order_id','eye'])`.
⚠️ Faixas do grau (`spherical` −30…+30, `axis` 0–180, `addition` 0.25…4.00) estão só em **comentário** e na validação — nenhum CHECK no banco.

#### 3.6 Tenancy e paciente

`clinics` — `slug` unique, `segment` string, `enabled_modules` json, `settings` json, `timezone` default `'America/Sao_Paulo'`, softDeletes.
`users` recebe `clinic_id` FK **nullable** + `index(['clinic_id','email'])` (`2026_07_24_222456_...`).
⚠️ `users.clinic_id` nullable é necessário (super-user de plataforma), mas o `email` **não** é unique por clínica — o unique global de `users.email` vem do boilerplate e permanece. Duas clínicas não podem ter o mesmo e-mail.

`clinic_subscriptions` — `clinic_id` **unique** (1:1), `plan_snapshot` json, 8 colunas `dateTime` de ciclo de vida, `unique(['payment_provider','external_subscription_id'])` nomeado.
`patients` — 30 colunas; `cpf` string(14), `rg` string(30), `record_number` unsignedInteger nullable. `unique(['clinic_id','cpf'])`, `unique(['clinic_id','record_number'])` + 3 índices. `sex` string(20) nullable.
`patient_contact_preferences` — ⭐ `unique(['patient_id','channel','normalized_value'])` nomeado `patient_contact_prefs_value_unique` — dedupe por valor **normalizado**, não pelo digitado.

⚠️ **Soft-delete × unique — 12 tabelas afetadas.** Toda tabela com `softDeletes()` **e** unique de negócio guarda a linha apagada ocupando a chave. Verificado por varredura (`for f in database/migrations/*.php; grep softDeletes && grep unique`): `clinics`, `professionals` (`['clinic_id','name']`), `patient_groups`, `patients` (`['clinic_id','cpf']`, `['clinic_id','record_number']`), `suppliers`, `financial_accounts`, `financial_categories`, `credit_cards`, `receivables`, `products` (3 uniques), `retail_sales`, `optical_orders`. Sintoma: apagar um paciente e recadastrar o mesmo CPF dá violação de unique, não "já existe". Nenhuma usa índice parcial `WHERE deleted_at IS NULL`. Guard-rail forte para o boilerplate.

---

### 4. `app/Enum/` — 42 enums

Todos são **backed enums de `string`**. **Nenhum implementa interface** (`grep -oE 'implements ...'` → nenhum resultado em 42 arquivos).

| Método | Enums que têm | Comando |
|---|---|---|
| `label(): string` | **42 / 42** | `grep -rl 'public function label' app/Enum/ \| wc -l` |
| `values(): array` (static) | **36 / 42** | `grep -rl 'public static function values' app/Enum/ \| wc -l` |
| `options(): array` (static) | **31 / 42** | `grep -rl 'public static function options' app/Enum/ \| wc -l` |

⚠️ Os 6 sem `values()` (`grep -rL 'public static function values' app/Enum/`): `ClinicSegment`, `Permissions`, `PlatformBillingCycle`, `PlatformPaymentProvider`, `PlatformSubscriptionStatus`, `Roles`. `label()` é universal, `values()`/`options()` não — o contrato existe de fato mas não é imposto por nada. **Uma interface `HasLabel`/`HasOptions` seria o guard-rail óbvio**, e a ausência dela é o principal defeito estrutural desta camada.

#### 4.1 Enums com lógica de domínio (não só `label`) — ⭐

| Enum | Cases | Métodos além de label/values/options |
|---|---|---|
| `OpticalOrderStatus` | 5 | ⭐⭐ `isEditable`, `isTerminal`, **`next(): ?self`**, **`canTransitionTo(self)`** (= `$this->next() === $to`), `isCancelable`, **`timestampColumn(): ?string`**, `transitionValues()` — máquina de estados linear inteira dentro do enum |
| `StockMovementReason` | 11 | ⭐ `direction(): ?StockMovementDirection` (o motivo define o sentido; `CountAdjustment` é o único bidirecional → `null`), `requiresNote()`, `isManual()`, `manualValues()`, `manualOptions()` (que carrega `requires_note` no payload) |
| `RetailSaleStatus` | 4 | `isEditable`, `countsAsRevenue` |
| `PaymentMethod` | 9 | `usesCard()` (débito/crédito descontam taxa), `isImmediate()` (dinheiro/PIX/débito/crédito) |
| `ReceivableStatus` / `PayableStatus` | 6 / 5 | `isSettleable()` |
| `LedgerDirection` | 2 | `signal()`, `opposite()` |
| `CashMovementKind` | 2 | `signal()` |
| `StockMovementDirection` | 2 | `signal()` |
| `AbcCurve` | 3 | `cumulativeFloor()`, `fromPrecedingShare()` |
| `EyesScope` | 3 | `eyes()`, `covers()` |
| `LensCategory` | 4 | `acceptsAddition()` |
| `RecurrenceFrequency` | 4 | `advance()` |
| `ClinicSegment` | 7 | `defaultModules()`, `defaultModuleValues()` |
| `FinancialCategoryKind` | 2 | `defaultNames()` |
| `ContactChannel` | 4 | `isPhoneBased()` |
| `CarnetFormat` | 2 | `view()`, `paper()`, `orientation()` |
| `Eye` / `ProductUnit` | 2 / 5 | `abbreviation()` |
| `Module` | 18 | só `label`/`values` — usado por `Clinic::hasModule()` |

#### 4.2 RBAC — comparação direta com o boilerplate

| | Cuidari | Boilerplate | Comando |
|---|---|---|---|
| `Permissions` cases | **69** | **5** | `grep -c '^\s*case ' app/Enum/Permissions.php` |
| `Roles` cases | **18** | **5** | `grep -c '^\s*case ' app/Enum/Roles.php` |

⭐ **Breadth do cuidari**: 18 papéis em 5 camadas nomeadas (administrativo, gerencial, operacional-clínica, operacional-financeiro, consultivo) com `priority()` numérica granular (100→5) e **4 predicados de agrupamento** — `isFinancialRole()`, `isFinancialTeamRole()`, `isClinicalRole()`, `isClinicalTeamRole()` (`app/Enum/Roles.php`). São eles que permitem "gerente financeiro administra a equipe financeira, e só ela" sem enumerar papéis à mão em cada policy. As 69 permissões estão agrupadas por comentário de bloco em ~15 domínios.

⚠️ **Depth: o boilerplate está à frente e o cuidari regrediu.** O `diff` mostra que ao expandir os enums o cuidari **apagou** métodos que o boilerplate tem:

| Perdido no cuidari | Onde vive no boilerplate |
|---|---|
| `Roles::description()` | `boilerplate/app/Enum/Roles.php` — uma frase por papel dizendo a quem atribuir |
| `Roles::isSelectable()` | idem — esconde `VISITOR` do seletor sem removê-lo da checagem de segurança |
| `Permissions::description()` | `boilerplate/app/Enum/Permissions.php` — a consequência de cada permissão |
| `Permissions::grantDenialMessage(array)` | idem — recusa de "você não dá o que você não tem", nomeando o que travou |

Ou seja: **69 permissões e 18 papéis sem uma linha de descrição**. Quem monta um cargo no painel do cuidari decide por 69 labels de 2 palavras. A colheita aqui é de mão dupla — o boilerplate ganha a taxonomia, o cuidari precisa da profundidade de volta.

---

### 5. `app/Traits/Models/` — 2 traits

#### 5.1 ⭐⭐ `BelongsToClinic` — `app/Traits/Models/BelongsToClinic.php` (43 L) — **o boilerplate não tem**

O trait inteiro:
- `bootBelongsToClinic()` (:20) registra **dois** hooks:
  - `creating` (:22) — preenche `clinic_id` a partir de `app(CurrentClinic::class)->id()` quando ainda vazio.
  - `addGlobalScope('clinic', ...)` (:30) — filtra por `{$table}.clinic_id` **qualificando a tabela** ⭐ (sem isso, join com outra tabela com `clinic_id` dá "ambiguous column").
- `clinic(): BelongsTo` (:39).

⭐ Escape hatch nomeado e único: `Model::withoutGlobalScope('clinic')` (usado em `app/Models/RetailSaleItem.php:125`).
⭐ O scope depende **só** de `CurrentClinic`, não do request — o docblock (:14-16) afirma que vale igualmente em HTTP, console, Horizon e scheduler.

⚠️ Quando `CurrentClinic::id()` retorna `null`, o scope **não aplica filtro nenhum** (`if ($clinicId !== null)`) e o `creating` deixa `clinic_id` nulo. É fail-open: um contexto sem tenant resolvido enxerga **todas** as clínicas em vez de nenhuma. Para 32 dos 38 models. Este é o achado mais sério da frente e o guard-rail mais importante a levar (fail-closed, ou exceção explícita).

#### 5.2 `HasRolesAndPermissions` — cuidari **203 L** vs boilerplate **260 L**

`diff -u boilerplate/... cuidari/...` — o boilerplate está à frente em tudo que importa:

| No boilerplate, ausente no cuidari | Consequência |
|---|---|
| `permissionCacheKey(int): string` static | cuidari monta `"user:$this->id:permissions"` à mão em `getPermissionCacheKey()` |
| `permissionsBeyondOwn(array): array` | o teto "você não dá o que você não tem" não existe no cuidari |
| `using(PermissionUser::class)` no `permissions()` | cuidari não tem `app/Models/PermissionUser.php` (`ls` → No such file) |
| `unsetRelation('permissions')` dentro de `refreshPermissionsCache()` | ⚠️ cuidari só faz `unsetRelation('role')`, e **fora** do método (em `assignRole`/`removeRole`) — o caminho `givePermissionTo` recomputa o cache com a relação `permissions` memoizada e grava `rememberForever` o estado antigo |
| Docblocks genéricos (`@return BelongsToMany<Permission, $this, PermissionUser>`, `@param list<string>`) | ~8 docblocks removidos no cuidari |

Mesmo padrão nos models: `app/Models/Role.php` e `app/Models/Permission.php` do cuidari são a versão **antiga**, sem os docblocks `@property`/`@return` que o boilerplate tem. E ⚠️ **`app/Models/Role.php:21`**: `public function users(): hasMany` — `hasMany` minúsculo. PHP resolve nome de classe case-insensitive, então funciona, mas passa por qualquer leitura e o boilerplate já corrigiu para `HasMany`.

→ Nada a colher de RBAC-mecânica do cuidari. O que se colhe é a **taxonomia** (§4.2).

---

### 6. "Observers" — o padrão real

Não há `app/Observers/`, nenhum `observe(`, nenhum `#[ObservedBy]`. Todo hook está inline. Inventário completo (`grep -rn 'static::(creating|updating|deleting|...)' app/Models/ app/Traits/`):

| Local | Hooks | Efeito |
|---|---|---|
| `app/Traits/Models/BelongsToClinic.php:22` | `creating` | preenche `clinic_id` |
| `app/Models/FinancialLedgerEntry.php:44,48` | `updating`, `deleting` → `never` | imutável absoluto |
| `app/Models/StockMovement.php:52,56` | `updating`, `deleting` → `never` | imutável absoluto |
| `app/Models/RetailSale.php:70,83` | `updating`, `deleting` | imutável **condicional** (whitelist de devolução; delete só em `Draft`) |
| `app/Models/OpticalOrder.php:92,100` | `updating`, `deleting` | imutável após `Delivered` |
| `app/Models/RetailSaleItem.php:48,52,56` | `creating`, `updating`, `deleting` | ⭐ o filho valida o **pai** (`assertSaleIsEditable()`) |

⭐ **Há três graus de imutabilidade, e a distinção é deliberada**: absoluta (ledger, movimento), pós-estado com whitelist (venda), pós-estado total (O.S. entregue). O padrão é consistente o suficiente para virar um trait no boilerplate (`ImmutableAfter`, `AppendOnly`) — hoje é copy-paste em 5 models.

⚠️ A imutabilidade é **só de aplicação**: `DB::table('stock_movements')->update(...)` passa por cima. Nenhum trigger, nenhum privilégio revogado.
⚠️ `Payment` **não** tem esse hook, apesar de o docblock (`app/Models/Payment.php:19-23`) dizer que o original "nunca é editado". A regra existe na prosa, não no código.

---

### 7. Resumo do delta contra o boilerplate

**O boilerplate não tem (⭐ candidatos):**

| Item | Path no cuidari |
|---|---|
| `Quantity` VO + `QuantityCast` | `app/ValueObjects/Quantity.php`, `app/Casts/QuantityCast.php` |
| `UnitCost` VO + `UnitCostCast` (com `movingAverage`, `fromTotal`, `totalFor`) | `app/ValueObjects/UnitCost.php`, `app/Casts/UnitCostCast.php` |
| Trait de tenant com global scope + auto-fill | `app/Traits/Models/BelongsToClinic.php` |
| Padrão de imutabilidade por `booted()` (3 graus) | `FinancialLedgerEntry.php:42`, `StockMovement.php:50`, `RetailSale.php:68`, `OpticalOrder.php:90`, `RetailSaleItem.php:46` |
| Contador sequencial genérico por tenant | `database/migrations/2026_08_03_200010_create_clinic_sequences_table.php`, `app/Models/ClinicSequence.php` |
| Mascaramento de PII no ActivityLog via `buildChanges()` | `app/Models/Patient.php:237` (+ alias de trait :28-30) |
| Taxonomia RBAC de 18 papéis / 69 permissões com predicados de grupo | `app/Enum/Roles.php`, `app/Enum/Permissions.php` |
| Convenção "status é `string(N)` + enum PHP, nunca `->enum()`" | 0 ocorrências de `->enum(` em 43 migrations |
| Convenção "zero float/double; dinheiro/quantidade/custo sempre decimal + VO" | 0 ocorrências de `->float(`/`->double(` |
| Idempotência de parcelas por unique nomeado sobre morph | `create_receivables_table.php:46` |
| Unique auto-referente para estorno único | `create_payments_table.php:37` |

**O boilerplate já tem, igual ou melhor (não recolher):** `Money` + `MoneyCast` (diff = 2 hunks de comentário; boilerplate à frente no `@implements`), `HasRolesAndPermissions` (boilerplate +57 L com `permissionsBeyondOwn`, `permissionCacheKey`, `PermissionUser`), `Role`/`Permission` models, `Roles::description()`/`isSelectable()`, `Permissions::description()`/`grantDenialMessage()`, e as 6 migrations base — `users`, `permissions_roles`, `activity_log` são **byte-idênticas** (`diff` vazio nos três).

**Guard-rails candidatos (⚠️):**

1. `BelongsToClinic` é **fail-open** com tenant nulo — afeta 32 models (`app/Traits/Models/BelongsToClinic.php:33`).
2. **12 tabelas** com `softDeletes()` + unique de negócio sem índice parcial `WHERE deleted_at IS NULL`.
3. **86 de 95** FKs sem `onDelete` explícito — RESTRICT implícito indistinguível de esquecimento.
4. Unique com coluna **nullable** não garante idempotência (`receivables.installment_number`, `inventory_count_items.product_batch_id`).
5. `payments`: sem CHECK de "exatamente um de `receivable_id`/`payable_id`"; sem hook de imutabilidade apesar do docblock.
6. `cash_register_sessions`: sem unique parcial de "uma sessão aberta por conta".
7. `card_fee_tiers`: sem guarda contra faixas de parcelas sobrepostas.
8. Imutabilidade só na camada de aplicação — `DB::table()->update()` fura tudo.
9. Enums sem interface: `label()` em 42/42, mas `values()` em 36/42 e `options()` em 31/42 — contrato de fato, não imposto.
10. Regressões locais herdadas: `app/Models/User.php` e `app/Models/Permission.php` sem `declare(strict_types = 1)`; `app/Models/Role.php:21` com `hasMany` minúsculo; 20 de 43 migrations sem `declare`.
## Controllers, Form Requests, policies, services, DTOs

**Fonte:** cuidari @ `a7a1170` (working tree limpa, leitura de disco = leitura do SHA).
**Baseline de comparação:** boilerplate **`main`**, lido exclusivamente via `git -C .../boilerplate show main:<path>` e `git ls-tree -r main`. O worktree do boilerplate está com `101-harvest-v2-busca-anunciada` em checkout — nenhum `Read`/`cat` de disco do boilerplate foi usado nesta seção.

### 0. Massa da camada — números do disco

| Diretório | Arquivos | LOC | Comando |
|---|---:|---:|---|
| `app/` (total) | 379 | 27.478 | `find app -name '*.php' \| wc -l` / `-exec cat {} + \| wc -l` |
| `app/Http/Controllers/` | 107 | 5.468 | idem, escopado |
| `app/Http/Requests/` | 53 | 4.071 | idem |
| `app/Policies/` | 16 | 889 | idem |
| `app/Services/` | 38 | 6.101 | idem |
| `app/DataTransferObjects/` | 25 | 1.195 | idem |
| `app/Http/Resources/` | 30 | 1.254 | idem |
| `app/Rules/` | 3 | 175 | idem |
| **Soma da frente** | **272** | **19.153** | `find app/Http/Controllers app/Http/Requests app/Policies app/Services app/DataTransferObjects app/Http/Resources app/Rules -name '*.php' -exec cat {} + \| wc -l` |
| `app/Enum/` | 42 | não contado | `find app/Enum -name '*.php' \| wc -l` |
| `app/Jobs/` | 5 | não contado | `find app/Jobs -name '*.php' \| sort` |
| `app/ValueObjects/` | 3 | não contado | `Money.php`, `Quantity.php`, `UnitCost.php` |

Baseline `main` do boilerplate, pelo mesmo critério: **29** controllers (`git ls-tree -r main --name-only \| grep -c '^app/Http/Controllers/.*\.php$'`), **8** Form Requests, **1** policy, **4** services, **0** DTOs, **2** Resources, **2** Rules. Não existe `app/Exceptions/` em nenhum dos dois.

---

### 1. `app/Http/Controllers/` — 107 arquivos

**Contagem verificada:** 107 total; **94 invokable** (`grep -rl 'function __invoke' app/Http/Controllers --include='*.php' | wc -l`); **13 sem `__invoke`** (`grep -rL`). Dos 13, **1 é a classe-base abstrata** e **6 são scaffolding de auth do Breeze** (herdado do boilerplate, multi-método por natureza), sobrando **6 resource controllers de verdade**. **92 dos 107 são `final class`** (`grep -rc '^final class' ... | grep -c ':1'`).

Baseline `main`: 29 controllers, **20 invokable** (loop `git show main:$f | grep -q 'function __invoke'`) — os 9 restantes são exatamente o mesmo scaffolding de auth + settings + `Controller.php`. **O padrão single-action é herdado do boilerplate e o cuidari o escalou 3,7× sem afrouxar.**

Distribuição por módulo (`find ... | sed 's|app/Http/Controllers/||; s|/.*||' | sort | uniq -c`):

| Módulo | Controllers | Módulo | Controllers |
|---|---:|---|---:|
| `Finance/` | 19 | `User/` | 13 |
| `Patient/` | 18 | `OpticalOrder/` | 11 |
| `Inventory/` | 14 | `RetailSale/` | 10 |
| `Auth/` | 8 | `Professional/` | 6 |
| `PermissionRole/` | 5 | `Settings/` | 2 |
| `Controller.php` (raiz) | 1 | | |

#### Os 13 sem `__invoke`, nominalmente

| Path | Natureza |
|---|---|
| `app/Http/Controllers/Controller.php` | classe-base abstrata; só `use AuthorizesRequests` (11 LOC) |
| `app/Http/Controllers/Auth/AuthenticatedSessionController.php` | Breeze — idem `main` |
| `app/Http/Controllers/Auth/ConfirmablePasswordController.php` | Breeze |
| `app/Http/Controllers/Auth/EmailVerificationNotificationController.php` | Breeze |
| `app/Http/Controllers/Auth/NewPasswordController.php` | Breeze |
| `app/Http/Controllers/Auth/PasswordResetLinkController.php` | Breeze |
| `app/Http/Controllers/Auth/RegisteredUserController.php` | Breeze |
| `app/Http/Controllers/Settings/PasswordController.php` | herdado do boilerplate |
| `app/Http/Controllers/Settings/ProfileController.php` | herdado do boilerplate |
| `app/Http/Controllers/Finance/Settings/CreditCardController.php` | ⚠️ resource novo (index/store/update/destroy) |
| `app/Http/Controllers/Finance/Settings/FinancialAccountController.php` | ⚠️ resource novo |
| `app/Http/Controllers/Finance/Settings/FinancialCategoryController.php` | ⚠️ resource novo |
| `app/Http/Controllers/Finance/Settings/SupplierController.php` | ⚠️ resource novo |

⚠️ **Os 4 `Finance/Settings/*Controller` são a única quebra deliberada do padrão single-action** — CRUD de cadastro auxiliar (conta, categoria, cartão, fornecedor) resolvido em 4 métodos num arquivo. `app/Http/Controllers/Finance/Settings/SupplierController.php` mostra o efeito colateral: `index()` e `destroy()` chamam `$this->authorize(...)`, mas `store()` e `update()` delegam ao `SupplierRequest::authorize()` — **duas convenções de autorização no mesmo arquivo**, contra uma só quando cada verbo tem seu controller.

#### Ordem interna authorize → validate → service → response

**Contagem verificada:** 62 controllers chamam `$this->authorize(` (`grep -rl 'this->authorize(' app/Http/Controllers | wc -l`), 6 usam `Gate::` (`grep -rl 'Gate::'`), 88 tipam um `*Request` no `__invoke` (`grep -rlE '__invoke\(.*Request \$'`). **31 controllers com `__invoke` não têm nem `$this->authorize` nem `Gate::`** (loop verificado).

O padrão do cuidari **empurra o `authorize` para dentro do Form Request** nesses 31 — não é ausência de autorização, é inversão de responsabilidade. Verificado caso a caso em `Finance/CashRegister/CloseController.php:20` (`CloseCashRegisterRequest` → `can('close', $this->session())`), `PermissionRole/UpdateController.php:15` (`UpdateRolePermissionsRequest` → `can('manage_roles')`), `Patient/CheckDuplicatesController.php:23` (`CheckPatientDuplicatesRequest`). O `authorize()` do FormRequest roda **antes** do `rules()` no Laravel, então a ordem efetiva é preservada.

⚠️ **Duas exceções reais, sem cobertura de nenhum dos dois lados:**
- `app/Http/Controllers/User/StopImpersonateController.php:19` — tipa `Illuminate\Http\Request` cru, sem `authorize`, sem FormRequest.
- `app/Http/Controllers/PermissionRole/AssignRoleController.php:29` e `RevokeRoleController.php:29` — `Request` cru + `$request->validate([...])` inline + uma cascata de `if`/`redirect()->withErrors()`; ver §10.

**Exemplar do padrão bom** — `app/Http/Controllers/RetailSale/CompleteController.php` (constructor promotion do `RetailSaleService`, FormRequest autoriza, `$request->toCompletion($user)` monta o DTO, controller não conhece regra):

```php
public function __invoke(CompleteSaleRequest $request, RetailSale $sale): RedirectResponse
{
    $completed = $this->sales->complete($sale, $request->toCompletion($user));
    $warning   = $completed->stockShortageWarning();
    $response = back()->with('success', "Venda #{$completed->number} concluída: {$completed->total->format()}.");
    return $warning === null ? $response : $response->with('warning', $warning);
}
```

⭐ `app/Http/Controllers/Finance/Receivable/SettleController.php:19-23` documenta em comentário **por que** o model fica no parâmetro mesmo sem ser usado no corpo ("sem ele o `SettleReceivableRequest` receberia só o id cru") — o tipo de armadilha que um guard-rail de boilerplate deveria carregar escrita.

⚠️ `app/Http/Controllers/User/IndexController.php` (150 LOC) é o **oposto** do padrão: filtro, busca, ordenação, paginação, montagem de `assignableRoles` com `Role::find()` dentro de `foreach` (N+1 explícito, linha 90) e montagem do array `filters` — tudo no controller, sem service. É o arquivo herdado do boilerplate que o cuidari não refatorou.

---

### 2. `app/Http/Requests/` — 53 arquivos

**Contagem verificada:** 53 total; **43 declaram `authorize()`** (`grep -rl 'function authorize' app/Http/Requests | wc -l`); **10 não declaram** — 6 são bases abstratas e 4 herdam de uma base.

**Zero requests retornam `true` cru.** Verificado com `grep -rn -A2 'function authorize' app/Http/Requests | grep -B1 'return true;'` — o único resultado é `app/Http/Requests/Auth/LoginRequest.php:14-17`, que é o request de login (herdado do boilerplate, onde `true` é correto: ainda não há usuário). ⭐ **Isso é notavelmente melhor que a média:** 42 dos 43 fazem gate ou policy real.

Mecanismos usados dentro dos 43 `authorize()`. **São contagens de ocorrência, não uma partição** — vários requests combinam dois mecanismos (ex.: policy de classe **+** guarda de tenant), então a soma passa de 43 de propósito. Comandos: `grep -rn -A4/-A5 'function authorize' app/Http/Requests --include='*.php' | grep -cE '<padrão>'`.

| Mecanismo | Ocorrências | Exemplos (path:linha) |
|---|---:|---|
| **Policy sobre instância** — `can('verbo', $this->x())` | **17** | `RetailSale/CarnetRequest.php:20`, `Finance/SettleReceivableRequest.php:21`, `OpticalOrder/TransitionOpticalOrderRequest.php:21`, `Patient/StorePatientAlertRequest.php:17` (`manageAlerts`), `Finance/CloseCashRegisterRequest.php:16` |
| **Policy sobre classe** — `can('verbo', Foo::class)` | **13** | `RetailSale/StoreRetailSaleRequest.php:23`, `Inventory/StoreProductRequest.php:13`, `Finance/StorePayableRequest.php:19`, `Finance/OpenCashRegisterRequest.php:18`, `Patient/CheckPatientDuplicatesRequest.php:19-20` (duas) |
| **Gate de permission** — `can('snake_case')` sem 2º arg | **4** | `User/StoreUserRequest.php:16`, `User/UpdateUserRequest.php:16`, `PermissionRole/UpdateRolePermissionsRequest.php:12`, `Professional/StoreProfessionalRequest.php:15` |
| **Guarda `instanceof` antes da policy** | **6** blocos | `Inventory/UpdateProductRequest.php:15`, `Inventory/InventoryCountItemRequest.php:25`, `Finance/CreditCardRequest.php:16`, `Finance/FinancialAccountRequest.php:18`, `Finance/FinancialCategoryRequest.php:15`, `Finance/SupplierRequest.php:15` |
| **Role direto** | 1 | `GrantPermissionRequest.php:15` — `hasRole(Roles::SUPER_USER)`; idêntico ao de `main` |
| **⭐ Combinado com contexto de tenant** | 2 | `Professional/StoreProfessionalRequest.php:15-16` (`can('manage_professionals') && app(CurrentClinic::class)->id() !== null`), `Patient/StorePatientRequest.php:13-14` (`can('create', Patient::class) && $this->clinicId() !== null`) |
| **⚠️ Só autenticação** | 1 | `Finance/ReasonRequest.php:16` — `return $this->user() !== null;`. É o request genérico de "motivo"; a autorização real fica no controller que o consome. |
| **`true` cru** | 1 | `Auth/LoginRequest.php:16` (herdado, correto) |

#### Hierarquia de bases abstratas — ⭐ padrão que o boilerplate não tem

6 classes `abstract` (`grep -rn 'abstract class' app/Http/Requests`):

| Base | Linha | Papel |
|---|---|---|
| `Finance/FinanceRequest.php` | :18 | `clinicId()`, normalização monetária compartilhada |
| `Inventory/InventoryRequest.php` | :19 | `clinicId()` + base do estoque |
| `Inventory/ProductRequest.php` | :20 | `extends InventoryRequest`; expõe `toAttributes(): array` |
| `OpticalOrder/OpticalOrderRequest.php` | :44 | camada **hard** da validação de grau + `toOrderData()` |
| `Patient/PatientRequest.php` | :26 | regras de paciente + `clinicId()` |
| `RetailSale/RetailSaleRequest.php` | :30 | `itemRules()`, `paymentRules($prefix)`, `toItems()`, `toCompletion()` |

⭐ **`prepareForValidation()` como normalizador de máscara brasileira**, em 8 requests (`grep -rl 'prepareForValidation' | wc -l` → 8). `RetailSale/RetailSaleRequest.php:33-58` declara `HEADER_DECIMALS` e `ITEM_DECIMALS` como constantes e normaliza **inclusive dentro da grade de itens** (`array_map` sobre `items`), antes de qualquer regra rodar. `OpticalOrder/OpticalOrderRequest.php:47-56` faz o mesmo com três listas (`HEADER_DECIMALS`, `EYE_DECIMALS`, `ITEM_DECIMALS`).

⭐ **`withValidator`/`after` em 5 requests** para invariantes que `rules()` não expressa: `Finance/CreditCardRequest.php`, `Inventory/StockEntryRequest.php`, `OpticalOrder/OpticalOrderRequest.php`, `Patient/PatientRequest.php`, `RetailSale/RetailSaleRequest.php`.

⭐⭐ **Request como fábrica de DTO — 15 métodos `to*()`** (`grep -rn 'public function to[A-Z]' app/Http/Requests | wc -l` → 15). É o elo que mantém o controller com 3 linhas de corpo:

| Path:linha | Assinatura |
|---|---|
| `Finance/SettleReceivableRequest.php:64` | `toSettlement(): SettlementData` |
| `Finance/SettlePayableRequest.php:56` | `toSettlement(): SettlementData` |
| `Finance/StoreReceivableRequest.php:68` | `toPlan(): InstallmentPlan` |
| `Finance/StorePayableRequest.php:67` | `toData(): PayableData` |
| `Finance/CashMovementRequest.php:46` | `toData(): CashMovementData` |
| `Finance/RenegotiateReceivablesRequest.php:58` | `toRenegotiation(): RenegotiationData` |
| `Inventory/StockEntryRequest.php:115` | `toData(User $by): StockEntryData` |
| `Inventory/StockConsumptionRequest.php:73` | `toData(User $by): StockConsumptionData` |
| `Inventory/ProductRequest.php:79` | `toAttributes(): array` |
| `OpticalOrder/OpticalOrderRequest.php:213` | `toOrderData(): OpticalOrderData` |
| `RetailSale/RetailSaleRequest.php:172` | `toItems(): ItemCollectionData` |
| `RetailSale/RetailSaleRequest.php:197` | `toCompletion(User $by, ?array $payload = null): CompleteSaleData` |
| `RetailSale/StoreRetailSaleRequest.php:52` | `toSaleData(User $seller): RetailSaleData` |
| `RetailSale/StoreRetailSaleRequest.php:71` | `toCompletionData(User $by): CompleteSaleData` |
| `RetailSale/SyncSaleItemsRequest.php:33` | `toSaleData(User $seller): RetailSaleData` |

#### Regras custom e escopo de tenant nas regras

**19 requests importam `App\Rules\`** (`grep -rl 'App\\Rules\\' app/Http/Requests | wc -l`). Uso típico: `RetailSale/RetailSaleRequest.php:78-80` — `'items.*.quantity' => ['required', new DecimalString(3), 'not_in:0,0.0,0.00,0.000']`, `'items.*.unit_price' => ['required', new MoneyString()]`.

⭐⭐ **`Rule::exists` escopado por `clinic_id` — 19 requests, 40 ocorrências** (`grep -rc "where('clinic_id'" app/Http/Requests --include='*.php' | grep -v ':0'`). Isso é o *segundo* anel do multi-tenant: além do global scope, a validação recusa id de outro tenant antes de chegar no banco. Exemplo em `RetailSale/RetailSaleRequest.php:72-78`:

```php
Rule::exists('products', 'id')
    ->where('clinic_id', $clinicId)
    ->where('active', true)
    ->whereNotNull('sale_price')   // insumo puro não vai ao balcão
    ->whereNull('deleted_at'),
```

Concentração: `RetailSaleRequest` (5), `Patient/PatientRequest` (4), `Finance/StoreReceivableRequest` (3), `Inventory/ProductRequest` (3), `OpticalOrder/OpticalOrderRequest` (3).

⚠️ **`main` do boilerplate não tem nenhum dos 3 mecanismos acima** (base abstrata, `to*()` DTO factory, `Rule::exists` escopado) — os 8 requests de `main` são planos.

---

### 3. `app/Policies/` — 16 policies, 100 métodos públicos

**Contagem verificada:** 16 arquivos, **100 métodos públicos** (`grep -rh 'public function' app/Policies/*.php | wc -l`), 889 LOC. Baseline `main`: **1 policy** (`UserPolicy`), 10 métodos.

**`before()`: ZERO policies têm** (`grep -rl 'function before' app/Policies | wc -l` → 0). Não existe bypass de super-admin por policy no cuidari. Consequência verificada em `app/Traits/Models/HasRolesAndPermissions.php:28-40`: `hasPermissionTo()` também **não** tem atalho de role — resolve sempre pela lista materializada de permissions (`Cache::rememberForever("user:{$id}:permissions")`). ⭐ Modelo consistente: super-user vira super-user por **ter todas as permissions**, não por escapar da checagem. ⚠️ Custo: um super-user cujo cache de permissions esteja desatualizado perde acesso silenciosamente, e não há rede de segurança.

#### Enumeração por nome, com abilities

| # | Policy | LOC | Abilities (nome:linha) |
|---:|---|---:|---|
| 1 | `PatientPolicy.php` | 106 | `viewAny`:20, `view`:25, `create`:31, `update`:36, `delete`:42, `restore`:48, `forceDelete`:54, `export`:59, ⭐`viewSensitive`:67, `manageAlerts`:73, `manageConsents`:78, `manageGuardians`:83, `manageContactPreferences`:88 — **13** |
| 2 | `UserPolicy.php` | 99 | `viewAny`:11, `view`:16, `create`:21, `update`:26, `delete`:50, `toggleActive`:70, `impersonate`:90, `managePermissions`:95 — **8** |
| 3 | `RetailSalePolicy.php` | 80 | `viewAny`:20, `view`:26, `create`:31, `update`:39, `delete`:48, `convert`:53, `complete`:58, `return`:66, ⭐`viewCosts`:76 — **9** |
| 4 | `ProductPolicy.php` | 69 | `viewAny`:19, `view`:25, `create`:30, `update`:35, ⭐`delete`:48 (**retorna `Response`**), `move`:65 — **6** |
| 5 | `ReceivablePolicy.php` | 67 | `viewAny`:17, `view`:22, `create`:27, `cancel`:32, `renegotiate`:38, `recalculateCharges`:52, `settle`:57, `export`:63 — **8** |
| 6 | `OpticalOrderPolicy.php` | 65 | `viewAny`:20, `view`:26, `create`:31, `update`:39, `transition`:47, `cancel`:52, `duplicate`:61 — **7** |
| 7 | `ProfessionalPolicy.php` | 58 | `viewAny`:13, `view`:18, `create`:24, `update`:33, `delete`:39, `restore`:44, `forceDelete`:49 — **7** |
| 8 | `InventoryCountPolicy.php` | 42 | `viewAny`:17, `view`:23, `create`:28, `update`:33, `close`:38 — **5** |
| 9 | `FinancialCategoryPolicy.php` | 41 | `viewAny`:13, `view`:19, `create`:24, `update`:29, `delete`:37 — **5** |
| 10 | `PayablePolicy.php` | 40 | `viewAny`:14, `view`:19, `create`:24, `cancel`:29, `settle`:35 — **5** |
| 11 | `SupplierPolicy.php` | 38 | `viewAny`:13, `view`:19, `create`:24, `update`:29, `delete`:34 — **5** |
| 12 | `FinancialAccountPolicy.php` | 38 | `viewAny`:13, `view`:19, `create`:24, `update`:29, `delete`:34 — **5** |
| 13 | `CreditCardPolicy.php` | 38 | `viewAny`:13, `view`:19, `create`:24, `update`:29, `delete`:34 — **5** |
| 14 | `CashRegisterSessionPolicy.php` | 38 | `viewAny`:13, `view`:19, `open`:24, `move`:29, `close`:34 — **5** |
| 15 | `PaymentPolicy.php` | 37 | `viewAny`:14, `view`:19, `create`:24, `reverse`:32 — **4** |
| 16 | `StockMovementPolicy.php` | 33 | `viewAny`:18, `view`:24, `create`:29 — **3** |

#### Registro: `Gate::policy` manual, 16 de 16 registradas

`app/Providers/AppServiceProvider.php:132-156`, método privado `configPolicies()`, chamado no `boot()` (linha 73). **Sem auto-discovery, sem atributo `#[UsePolicy]`** (`grep -rn 'UsePolicy' app/Models/*.php` → 0 resultados). **16 chamadas `Gate::policy`** (`grep -c 'Gate::policy' app/Providers/AppServiceProvider.php` → 16), linhas 136-154, agrupadas em blocos por módulo (RBAC, financeiro, estoque, vendas).

**Nenhuma policy fica de fora do registro** — as 16 do diretório aparecem nas 16 linhas. ⚠️ Mas o inverso vale: o registro é uma lista à mão, e a lista **não é validada por teste nem por convenção** — criar `app/Policies/XPolicy.php` e esquecer a linha faz `Gate::denies` silenciar em vez de estourar. Guard-rail óbvio para o boilerplate: um teste de arquitetura que exija 1:1 entre `app/Policies/*Policy.php` e as entradas de `configPolicies()`, ou a migração para `#[UsePolicy]` no model (Laravel 11+), que torna o esquecimento impossível.

`configGates()` (`AppServiceProvider.php:118-130`) registra um `Gate::define` por case de `App\Enum\Permissions` — **idêntico ao contrato do boilerplate**.

#### O que as policies fazem que a `UserPolicy` de `main` não faz

- ⭐ **Guarda de estado dentro da ability.** `RetailSalePolicy::update()` (`:39`) → `$this->create($user) && $sale->isEditable()`; `ReceivablePolicy::settle()` (`:57`) → `... && $receivable->status->isSettleable()`; `OpticalOrderPolicy::transition()` (`:47`) → `... && $order->status->next() !== null`; `cancel()` (`:52`) → `... && $order->status->isCancelable()`. Máquina de estados e autorização no mesmo ponto — a UI não precisa duplicar a regra para desabilitar o botão (e não duplica: os Resources leem a policy, §6).
- ⭐ **`Response::deny()` com mensagem de negócio.** `ProductPolicy::delete()` (`app/Policies/ProductPolicy.php:48-63`) é a única com retorno `Response` (`grep -rln ': Response' app/Policies` → 1 arquivo) e devolve texto acionável: *"O produto [X] já tem movimento de estoque e não pode ser excluído: desmarque 'Ativo' para tirá-lo do catálogo sem perder o extrato."* O docblock explica a razão estrutural (o `unique(clinic_id, barcode)` sobrevive ao soft delete e não há rota de restore).
- ⭐ **Escopo por vínculo, não só por permission.** `PatientPolicy::withinScope()` (`:92-99`) + `hasBond()` (`:101-104`): o papel `PROFESSIONAL` só enxerga paciente com vínculo (`created_by === $user->id`); os demais papéis veem todos os da clínica. `view`/`update`/`delete`/`restore`/`viewSensitive` passam por ele.
- ⭐ **Ability dedicada a dado sensível.** `PatientPolicy::viewSensitive()` (`:67`) governa CPF/RG sem máscara (LGPD); `RetailSalePolicy::viewCosts()` (`:76`) governa custo/margem por `VIEW_FINANCIAL`.
- ⭐ **Permission separada para dado de saúde.** `OpticalOrderPolicy` usa `VIEW_OPTICAL_ORDERS` e não `VIEW_SALES`, com a razão no docblock: *"receita é dado de saúde: quem confere dinheiro não precisa ver o grau de ninguém."*
- ⭐ **Permission elevada em operação de estorno.** `RetailSalePolicy::return()` (`:66-72`) exige `MANAGE_SALES` **e** `APPROVE_TRANSACTIONS` **e** status `Completed`.
- **Docblocks como registro de decisão.** `ReceivablePolicy::recalculateCharges()` (`:41-51`) argumenta por que a barra é `CREATE_TRANSACTIONS` e não `MANAGE_RECEIVABLES`; `PatientPolicy` cita a spec e o que entra em `hasBond()` depois.

⚠️ **`forceDelete` sempre `false`.** `PatientPolicy::forceDelete()` (`:54-57`) retorna `false` incondicional; `ProfessionalPolicy::forceDelete()` (`:49`) existe também. É um piso seguro, mas nenhuma rota exercita a ability — é código de reserva.

#### ⚠️ Regressão de segurança: `UserPolicy` do cuidari está ATRÁS de `main`

`git -C .../boilerplate show main:app/Policies/UserPolicy.php | grep -n 'public function'` → **10 abilities**. Cuidari → **8**. Faltam, nominalmente:

| Ability presente em `main:app/Policies/UserPolicy.php` | Linha em `main` | No cuidari |
|---|---|---|
| `mutatePermissions(User $user, User $model)` | :108 | **ausente** |
| `assignRole(User $user, User $model)` | :124 | **ausente** |

Essas duas são exatamente as guardas de escalada de privilégio adicionadas ao boilerplate (teto sobre o **cargo atual do alvo**, não só sobre o cargo novo). O impacto está no §10.

---

### 4. `app/Services/` — 38 arquivos, 6.101 LOC

**Contagem verificada:** 38 (`find app/Services -name '*.php' | wc -l`), 6.101 LOC. Baseline `main`: 4 services (`ImpersonationService`, `PermissionCatalogService`, `PermissionManagementService`, `RoleFilterService`).

Todos os 38, do maior ao menor (LOC de `find app/Services -name '*.php' -exec wc -l {} + | sort -rn`). Descrição de uma linha extraída do docblock de classe de cada arquivo.

| # | Arquivo | LOC | O que faz |
|---:|---|---:|---|
| 1 | `RetailSaleService.php` | 518 | Ciclo de vida da venda de balcão; **orquestra** recebível, baixa, caixa, ledger e estoque numa transação só |
| 2 | `StockService.php` | 448 | Entradas, baixas e ajustes de estoque; todo movimento nasce com a linha do produto travada |
| 3 | `PaymentService.php` | 440 | Baixas e estornos; registro baixado é imutável — estorno é lançamento novo, negativo e vinculado |
| 4 | `OpticalOrderService.php` | 345 | Ciclo de vida da O.S. óptica; **não** gera recebível, **não** baixa estoque, **não** encosta em pagamento |
| 5 | `PatientService.php` | 299 | Cadastro de pacientes: numeração por clínica, bloqueio de duplicado por CPF, flag de menoridade, coleções filhas em transação |
| 6 | `PrescriptionTimelineService.php` | 296 | ⭐ Linha do tempo de grau com Δ automático vs. a O.S. anterior; payload **próprio**, não o Resource, para não vazar custo de lente em tela clínica; aritmética em centésimos inteiros |
| 7 | `OpticalOrderPdfService.php` | 278 | PDF da O.S. (A4) que acompanha o pedido ao laboratório; função pura da O.S., sem arquivo em disco, sem R2, sem job |
| 8 | `ReceivableService.php` | 262 | Ciclo do recebível: criação manual, parcelamento **idempotente por origem**, cancelamento com motivo, renegociação em transação |
| 9 | `RoleFilterService.php` | 246 | Roles visíveis/atribuíveis por prioridade — **herdado do boilerplate** |
| 10 | `CashRegisterService.php` | 201 | Caixa diário com abertura/fechamento bloqueante; sessão fechada não reabre — correção é movimento na sessão seguinte |
| 11 | `PayableService.php` | 200 | Contas a pagar + despesa recorrente; `recurrence.last_generated_on` torna `GenerateRecurringPayables` idempotente sem coluna nova |
| 12 | `PrescriptionWarnings.php` | 192 | ⭐ Camada **soft** da validação de grau: devolve avisos amarelos, nunca bloqueia (a hard vive no FormRequest) |
| 13 | `OnboardClinicService.php` | 179 | Onboarding: `Clinic` + owner + `ClinicSubscription` em transação única; módulos = preset do segmento |
| 14 | `RetailSalesOptionsProvider.php` | 170 | ⭐ Combos do balcão (ver padrão abaixo) |
| 15 | `PurchaseSuggestionService.php` | 153 | Sugestão de compra: consumo médio diário × lead time + mínimo − saldo; sem cotação nem aprovação |
| 16 | `CarnetPdfService.php` | 150 | Carnê do crediário próprio (capa + bloco por parcela); controle interno — sem código de barras, boleto ou gateway |
| 17 | `PatientDuplicateFinder.php` | 146 | Duplicados no cadastro: CPF igual **bloqueia**; celular normalizado ou nome+nascimento apenas **avisam**; devolve o achado com nome mascarado |
| 18 | `InventoryCountService.php` | 138 | Contagem de inventário: abrir congela o esperado, contar preenche, fechar gera ajustes; uma aberta por vez |
| 19 | `ReceivableChargesService.php` | 137 | Encargos de atraso: multa fixa (uma vez) + juros pro-rata die; **idempotente por data-base** |
| 20 | `FinanceOptionsProvider.php` | 120 | ⭐ Combos do financeiro (ver padrão abaixo) |
| 21 | `PatientPurchaseSummary.php` | 112 | ⭐ Aba "Compras" da ficha 360; payload próprio para **não** vazar custo/margem a quem tem `view_financial` |
| 22 | `CpfFormatter.php` | 100 | Normaliza CPF (só dígitos ao persistir) e mascara `***.***.***-12` para quem não tem permissão |
| 23 | `PatientConsentService.php` | 99 | Consentimentos LGPD **versionados**: conceder/revogar sempre cria linha nova com snapshot do texto; nada é editado |
| 24 | `SaleNumberService.php` | 91 | ⭐ Numeração sequencial por clínica via linha única com `lockForUpdate`; nome de sequência livre para a O.S. reusar |
| 25 | `OpticalOrderOptionsProvider.php` | 82 | ⭐ Combos da O.S. — **reusa** o provider do balcão para lente e cliente |
| 26 | `PatientTabResolver.php` | 78 | Abas da ficha 360: aba só vai ao front se o módulo está habilitado **E** o usuário tem a permission; `ready:false` marca aba futura |
| 27 | `InventoryOptionsProvider.php` | 78 | ⭐ Combos do estoque (ver padrão abaixo) |
| 28 | `PatientFinanceSummary.php` | 77 | Aba Financeiro da ficha 360: recebíveis, saldo devedor, encargos acumulados |
| 29 | `ProfessionalService.php` | 73 | Cadastro de profissionais; vínculo login↔profissional com fonte única em `professionals.user_id` (1:1) |
| 30 | `ImpersonationService.php` | 68 | Impersonation — **herdado do boilerplate** (sem docblock de classe) |
| 31 | `PhoneNormalizer.php` | 56 | Telefone → E.164; máscara de exibição é da UI |
| 32 | `StockAlertService.php` | 51 | Alertas de mínimo e vencimento; **só lê** — vencido *sugere* baixa, a ação é manual |
| 33 | `CardFeeCalculator.php` | 45 | Taxa da adquirente por bandeira/parcela; `net = gross − fee`; sem tier configurado a taxa é zero |
| 34 | `LedgerService.php` | 44 | ⭐ **Único ponto de escrita** da trilha contábil; o model bloqueia update/delete — correção é lançamento novo |
| 35 | `ClinicClock.php` | 42 | ⭐ Datas financeiras no fuso da **clínica**, não do servidor ("hoje" 21h em SP já é amanhã em UTC) |
| 36 | `CurrentClinic.php` | 34 | ⭐ Contexto de tenant (scoped no container) — ver §9 |
| 37 | `ContactPreferenceNormalizer.php` | 27 | Valor normalizado da preferência: E.164 nos canais de telefone, e-mail minúsculo nos demais |
| 38 | `PermissionManagementService.php` | 26 | Conceder/revogar permission individual — **idêntico em LOC ao de `main`** (26) |

#### Os 5 maiores, abertos: transações, locks, idempotência

**`app/Services/RetailSaleService.php` (518 LOC)** — 6 métodos públicos, **todos** abrindo `DB::transaction`: `createDraft`, `updateDraft`, `syncItems`, `convertQuote`, `complete`, `cancel`, `return`.
- **Lock:** `lockedSaleQuery(int $saleId)` (`:~490`) → `RetailSale::query()->whereKey($saleId)->lockForUpdate()`. Chamado no primeiro statement de `updateDraft`, `convertQuote`, `complete`, `cancel`, `return` — a venda é relida **travada** antes de qualquer leitura de estado. ⭐ O docblock explica que o método é privado mas *"exposto para o teste conferir a cláusula de lock recompilando com a gramática do MySQL (o sqlite da suíte a apaga)"*.
- **Idempotência (3 mecanismos distintos):**
  1. `writeOffStock()` — *"se a venda já movimentou, um retry não movimenta de novo"*: `if ($sale->movements()->exists()) return;`
  2. `restoreStock()` — guarda por razão: `if ($sale->movements()->where('reason', StockMovementReason::SaleReturn->value)->exists()) return;`
  3. `receivables->createInstallments()` recebe `origin: $locked` — parcelamento idempotente **por origem** (documentado no docblock de `ReceivableService`).
- **Invariante recalculada, não confiada:** `assertTotals()` soma os subtotais **das linhas gravadas** e confere contra o cabeçalho; roda na edição *e de novo* na conclusão. `refreshTotals()` limita o desconto ao `items_total`, garantindo `total ≥ 0`.
- ⭐ **Falha parcial deliberada e documentada:** `writeOffStock()` engole `ValidationException` do `StockService` — *"a mercadoria já saiu da loja na mão do cliente; o sistema baixa o que existe e avisa"*. O aviso volta pelo `stockShortageWarning()` e o controller manda `success` **e** `warning` juntos.
- ⭐ **Auditoria com autor redundante:** `audit()` grava `$by->id` **nas properties** além do `causedBy()`, porque o `CauserResolver` sobrescrito no `AppServiceProvider` descarta o causer e resolve pelo guard — fora de request autenticada (seeder, job, command) o `causer_id` sairia nulo.

**`app/Services/StockService.php` (448 LOC)** — 3 públicos (`enter`, `consume`, `adjustFromCount`), todos em `DB::transaction`, mais `adjustItem()` privado que abre a sua própria.
- **Locks (4 pontos):** `lockedProductQuery()` (`:210`), `lockedBatchQuery()` (`:218`), `eligibleBatches()` com `->lockForUpdate()` (`:343`), `resolveEntryBatch()` com `->lockForUpdate()` (`:405`). Docblock de classe: *"`products.stock` e `product_batches.remaining` são projeções e só podem ser recalculadas a partir de um saldo que ninguém mais está mexendo."*
- **Alocação FEFO** (`allocate()`, `:293`): lote escolhido à mão primeiro, resto em FEFO; lote vencido excluído a menos que a baixa seja por vencimento ou o operador confirme.
- **Reaproveitamento de lote:** `resolveEntryBatch()` — entrar duas vezes o lote `L1` **soma saldo**, não cria lote duplicado.
- **Custo médio móvel:** `baseUnitCost()` (`:436`) rateia pelo total pago, para que entrada por caixa e entrada fracionada produzam a mesma média.
- **13 `ValidationException::withMessages`** — o maior número do projeto (`grep -rc` por arquivo).

**`app/Services/PaymentService.php` (440 LOC)** — `settle()` e `reverse()`, ambos em `DB::transaction`.
- **Lock:** `lockTarget()` (`:233`) com docblock *"`lockForUpdate` na linha do título: duas baixas simultâneas serializam"*; `lockedReceivableQuery()` (`:258`), `lockedPayableQuery()` (`:266`), `lockTargetOf()` (`:242`); em `reverse()`, `Payment::query()->whereKey(...)->lockForUpdate()->firstOrFail()` (`:108`) — *"dois estornos simultâneos do mesmo lançamento serializam aqui, antes de bater no índice único"*.
- **Idempotência do estorno:** `if ($payment->reversal()->exists())` (`:116`) → `ValidationException` "Este pagamento já foi estornado"; mais status `Confirmed` obrigatório e motivo não-vazio.
- **Invariante de valor:** baixa maior que o saldo devedor é recusada com mensagem de domínio — *"Troco é operação de caixa, não baixa."*
- **Ordem no `settle`:** trava alvo → resolve conta → assert settleable → assert positivo → **recalcula encargos** (`charges->recalculate`) e `refresh()` → confere saldo → resolve sessão de caixa → calcula taxa de cartão → rateia juros/multa (`chargeShares`) → cria `Payment` → grava ledger → `syncSettlement` (deriva o status do título).
- **Imutabilidade:** o `Payment` original nunca é editado; o estorno é uma linha nova com `reversed_by_payment_id`.

**`app/Services/OpticalOrderService.php` (345 LOC)** — 6 públicos (`create`, `createFromSale`, `update`, `transition`, `cancel`, `duplicate`), **todos** em `DB::transaction`; `lockedOrderQuery()` (`:330`) com `lockForUpdate`.
- ⭐ **Fronteira de domínio explícita no docblock:** *"não gera recebível, não baixa estoque e não encosta em pagamento (regra 9). O dinheiro do óculos é da venda (Spec 17); a O.S. é o documento técnico."* — separação que o `RetailSaleService` respeita do outro lado.
- `duplicate()` é o caminho de correção de uma O.S. já enviada ao laboratório (a policy permite em qualquer estado); `syncChildren()`/`persistEye()`/`persistItem()` regravam olhos e itens.

**`app/Services/PatientService.php` (299 LOC)** — `create`, `update`, `softDelete`, `restore`, `nextRecordNumber`; `create`/`update` em `DB::transaction`.
- ⭐ **Lock no tenant, não no registro:** `lockClinic()` (`:117-120`) → `Clinic::query()->whereKey($clinic->id)->lockForUpdate()->first()`. É o que serializa `nextRecordNumber()` (`:91`) — dois cadastros simultâneos na mesma clínica não tiram o mesmo número de prontuário.
- `assertNoBlockingDuplicate()` (`:145`) — CPF igual bloqueia; `assertRestorableUniques()` (`:165`) — restore só se os únicos ainda estiverem livres.
- `withMinorFlag()` (`:127`) sincroniza o flag de menoridade a partir da data de nascimento; `syncGuardians`/`syncContactPreferences`/`syncTags` persistem as coleções filhas dentro da mesma transação.

#### ⭐ O padrão `*OptionsProvider` — 4 classes

`ls app/Services | grep -c OptionsProvider` → **4**: `FinanceOptionsProvider.php` (120), `InventoryOptionsProvider.php` (78), `OpticalOrderOptionsProvider.php` (82), `RetailSalesOptionsProvider.php` (170).

**O problema que resolve.** Numa app Inertia sem endpoints JSON, todo `Inertia::render` de tela de formulário precisa carregar os mesmos combos: contas ativas, categorias por tipo, cartões com tiers, métodos de pagamento, status, fornecedores. Sem um dono, isso vira query duplicada em N controllers — e as duplicatas divergem: uma tela filtra `active = true`, a irmã esquece; uma ordena por nome, a outra não; uma manda o cartão com `feeTiers`, a outra sem, e o cálculo de taxa quebra só naquela tela.

**A forma.** Uma classe `final` por módulo, com um método público **por tela** (`forReceivables`, `forPayables`, `forCashRegister`, `forSettings` em `FinanceOptionsProvider.php:32/47/66/76`) e métodos privados por *entidade* (`accounts()`, `categories()`, `cards()` — `:85/103/118`), cada um devolvendo já **passado pelo Resource** (`FinancialAccountResource::collection(...)->toArray($request)`). Os enums entram pelo próprio `::options()` (`PaymentMethod::options()`, `ReceivableStatus::options()`), então o rótulo do combo tem uma fonte só, que é o enum.

**O que isso compra, verificado nos docblocks:**
- *"Concentrado num único ponto para que recebíveis, pagáveis e caixa mostrem exatamente as mesmas opções"* (`FinanceOptionsProvider.php:25-27`).
- ⭐ **Reuso entre módulos:** `OpticalOrderOptionsProvider` *"reusa o provider do balcão"* para busca de lente e de cliente — *"são as mesmas listas (produto vendável, paciente da clínica com CPF mascarado), voltam pela mesma recarga parcial do Inertia e não merecem uma segunda fonte de verdade."*
- ⭐ **Substitui endpoint JSON paralelo:** `RetailSalesOptionsProvider` — *"a busca de produto e a de cliente do POS voltam por aqui em recarga parcial do Inertia (`only: ['products']`), e não por um endpoint JSON paralelo: uma fonte só de verdade para o que o balcão pode vender."* Isso é o padrão que impede o segundo canal que o `CLAUDE.md` do boilerplate proíbe.
- **Regra de negócio embutida no combo:** `InventoryOptionsProvider::forProducts()` limita `entryReasons` a `Purchase` e `InitialBalance` com o porquê no comentário — *"devolução de venda entra pelo POS, que é quem conhece a venda de origem"*.
- `InventoryOptionsProvider::categories()` (`:57-68`) é autocomplete e não domínio fechado: `Product::distinct()->pluck('category')`, com o motivo escrito (*"o campo é texto livre"*).

⚠️ **Limitação:** os providers filtram por `active` e ordenam, mas **não paginam nem limitam**. `RetailSalesOptionsProvider` (170 LOC, o maior) carrega catálogo de produto e lista de paciente numa clínica; em tenant grande isso vira payload de tela. Não há `->limit()` visível nos métodos de `FinanceOptionsProvider`/`InventoryOptionsProvider`.

---

### 5. `app/DataTransferObjects/` — 25 arquivos, 1.195 LOC

**Contagem verificada:** 25 (`find app/DataTransferObjects -name '*.php' | wc -l`). Baseline `main`: o diretório **não existe** (`git ls-tree -r main` não retorna nada sob `app/DataTransferObjects`). ⭐ Camada inteiramente nova.

**Modificadores — contagem exata:**
- `readonly class` (sem `final`): **22** (`grep -rc '^readonly class' app/DataTransferObjects/*.php | grep -c ':1'`)
- `final class` (sem `readonly`): **3** — `ConsentContext.php:12`, `PatientData.php:18`, `PatientDuplicateProbe.php:13`
- ⚠️ **`final readonly`: ZERO** (`grep -rn 'final readonly' app/DataTransferObjects/*.php | wc -l` → 0)

⚠️ **Guard-rail para o boilerplate:** a convenção é `readonly class`, não `final readonly class`. Nenhum DTO é ao mesmo tempo imutável e fechado à herança. Como 22 são `readonly`, herdar já é quase inútil (a subclasse herda a imutabilidade), mas a inconsistência é real e um Rector rule (`FinalizeClassesWithoutChildrenRector`) fecharia de graça.

**Como nascem — `fromRequest()` não existe** (`grep -rln 'function fromRequest' app/DataTransferObjects | wc -l` → **0**). O DTO **não conhece o Request**: quem monta é o Form Request, pelos 15 métodos `to*()` do §2. A direção é `Request → DTO`, nunca `DTO ← Request`. ⭐ Isso mantém o DTO puro (testável sem HTTP) e concentra a tradução num lugar só.

Os **5 named constructors** que existem (`grep -rn 'public static function' app/DataTransferObjects/*.php`) são semânticos, não de transporte:

| Path:linha | Assinatura | Papel |
|---|---|---|
| `PatientData.php:37` | `fromValidated(array $validated): self` | do array já validado, não do Request |
| `PatientDuplicateProbe.php:26` | `fromArray(array $data): self` | sonda de duplicado |
| `PermissionMetaDTO.php:18` | `fromPermission(Permission $permission): self` | do model |
| `SettlementData.php:37` | `forReceivable(...)` | ⭐ variante nomeada |
| `SettlementData.php:62` | `forPayable(...)` | ⭐ variante nomeada |

**Os 25, com LOC:** `PatientData` 139, `SettlementData` 82, `OpticalOrderData` 79, `OpticalEyeData` 75, `CompleteSaleData` 69, `ItemCollectionData` 59, `VisiofficeData` 58, `SaleItemData` 56, `StockAlerts` 51, `OpticalFrameData` 46, `PurchaseSuggestion` 45, `PayableData` 42, `StockEntryData` 40, `PermissionMetaDTO` 35, `PatientDuplicateProbe` 35, `InstallmentPlan` 35, `StockConsumptionData` 34, `ReceivableData` 30, `OpticalItemData` 30, `LedgerEntryData` 30, `OnboardClinicData` 29, `RenegotiationData` 27, `ConsentContext` 25, `RetailSaleData` 24, `CashMovementData` 20.

**Consumidores:** `RetailSaleService.php:7-14` importa 7 DTOs de uma vez (`CompleteSaleData`, `InstallmentPlan`, `ItemCollectionData`, `RetailSaleData`, `SaleItemData`, `SettlementData`, `StockConsumptionData`, `StockEntryData`) — o DTO é a **única** forma de entrada dos services de domínio; nenhum service público recebe `array` cru ou `Request`.

#### ⭐ `InstallmentPlan` (`app/DataTransferObjects/InstallmentPlan.php`, 35 LOC)

13 propriedades promovidas, 9 com default — `readonly class` com um construtor só. Descreve **um parcelamento** de forma completamente desacoplada de quem o originou: `description`, `total: Money`, `installments: int`, `firstDueDate: CarbonImmutable`, `patientId`, `financialCategoryId`, `expectedMethod: ?PaymentMethod`, `creditCardId`, `negotiatedFeePercent`, **`origin: ?Model`**, `frequency: RecurrenceFrequency` (default `Monthly`), `interestPercent`, `penaltyPercent`.

Dois pontos que fazem dele o DTO mais reusado do sistema:
- **`origin: ?Model` polimórfico** é o que dá a idempotência do §4: `ReceivableService::createInstallments()` é *"idempotente por origem"* — a venda passa `origin: $locked`, e um retry não gera segunda leva de parcelas.
- **Docblock declara a invariante aritmética:** *"O rateio é feito em centavos pelo `Money::allocate()` — a soma das parcelas é sempre igual ao total."* O DTO não faz a conta, mas documenta quem faz e qual é o contrato.

Consumido por `RetailSaleService::complete()` (montado inline) e por `Finance/StoreReceivableRequest.php:68` (`toPlan(): InstallmentPlan`) — duas origens, um formato.

#### ⭐ `SettlementData` (`app/DataTransferObjects/SettlementData.php`, 82 LOC)

**Validação de invariante no construtor** — o único DTO do projeto que se recusa a existir mal formado:

```php
if (($this->receivable instanceof Receivable) === ($this->payable instanceof Payable)) {
    throw new InvalidArgumentException('A baixa exige exatamente um título: recebível ou pagável.');
}
```

XOR estrito: nem os dois, nem nenhum. Os dois named constructors (`forReceivable` `:37`, `forPayable` `:62`) tornam o caminho feliz impossível de errar — `forPayable` sequer aceita `creditCardId`/`cardInstallments`, porque pagável não passa em maquininha. ⭐ É o padrão "make illegal states unrepresentable" aplicado num DTO PHP, e é o que permite ao `PaymentService::settle()` fazer `Receivable|Payable` union types sem checar nulos.

Consumido por `PaymentService::settle()`, `RetailSaleService::settle()` (via `SettlementData::forReceivable`), `Finance/SettleReceivableRequest.php:64` e `Finance/SettlePayableRequest.php:56`.

---

### 6. `app/Http/Resources/` — 30 arquivos, 1.254 LOC

**Contagem verificada:** 30 (`find app/Http/Resources -name '*.php' | wc -l`). Baseline `main`: **2** (`RoleResource.php`, `UserResource.php`).

**`whenLoaded`: 16 dos 30** (`grep -rl 'whenLoaded' app/Http/Resources | wc -l` → 16). São, nominalmente: `CashRegisterSessionResource`, `CreditCardResource`, `InventoryCountItemResource`, `InventoryCountResource`, `OpticalOrderResource`, `PatientResource`, `PayableResource`, `PaymentResource`, `ProductBatchResource`, `ProductResource`, `ProfessionalResource`, `ReceivableResource`, `RetailSaleResource`, `RoleResource`, `StockMovementResource`, `UserResource`.

Os 14 sem `whenLoaded` são resources de entidade folha, sem relação a expor: `FinancialAccountResource`, `FinancialCategoryResource`, `SupplierResource`, `PatientGroupResource`, `PatientSourceResource`, `PatientTagResource`, `PatientAlertResource`, `PatientConsentResource`, `PatientContactPreferenceResource`, `PatientGuardianResource`, `OpticalOrderEyeResource`, `OpticalOrderItemResource`, `RetailSaleItemResource`, `PurchaseSuggestionResource`.

#### ⭐⭐ Resource que carrega as permissions da linha — padrão ausente do boilerplate

**7 resources projetam o resultado da policy num bloco `'can' => [...]`** (`grep -rl "'can' *=> *\[" app/Http/Resources | wc -l` → 7), para a UI desabilitar o botão sem duplicar a regra:

| Resource:linha | Abilities projetadas |
|---|---|
| `RetailSaleResource.php:56-60` | `update`, `convert`, `complete`, `cancel` (→`delete`), `return` |
| `OpticalOrderResource.php:82-85` | `update`, `transition`, `cancel`, `duplicate` |
| `ReceivableResource.php:51-53` | `settle`, `cancel`, `recalculate` (→`recalculateCharges`) |
| `ProductResource.php:45-47` | `update`, `delete`, `move` |
| `PayableResource.php:39-40` | `settle`, `cancel` |
| `InventoryCountResource.php:32-33` | `update`, `close` |
| `PaymentResource.php:40` | `reverse` |

Fora do bloco `can`, `UserResource.php` expõe a mesma ideia numa chave plana (`can_impersonate`, via `canImpersonate()`) — herdada de `main`.

⭐ **Redação de campo sensível guiada por policy** — 3 resources:
- `PatientResource.php:21` — `$canViewSensitive = $request->user()?->can('viewSensitive', $this->resource) ?? false;` governa CPF/RG sem máscara.
- `PatientGuardianResource.php:24` — `$canViewSensitive = $request->user()?->can(Permissions::EDIT_CLIENTS->value) ?? false;`
- `RetailSaleResource.php:24` + `RetailSaleItemResource.php:21` — `$showsCosts = $request->user()?->can('viewCosts', RetailSale::class) ?? false;` esconde custo unitário e margem da venda.
- `OpticalOrderResource.php:77` usa `$this->when(...)` para `items_total`.

#### Teto de exposição do `UserResource` — cuidari vs `main`

`diff` conceitual entre `app/Http/Resources/UserResource.php` (cuidari) e `git show main:app/Http/Resources/UserResource.php`: **o payload é campo a campo idêntico**. As únicas diferenças são de tipagem/robustez, e **`main` está à frente nas três**:

| Aspecto | cuidari | `main` |
|---|---|---|
| `@mixin User` no docblock | ausente | presente |
| `@return array<string, mixed>` | ausente | presente |
| `permissions` | `$this->permissions?->map(...) ?? []` (null-safe defensivo) | `$this->permissions->map(...)` |
| `role->permissions` | `relationLoaded('permissions') && $this->role->permissions` | `relationLoaded('permissions')` |

**Teto de exposição (idêntico nos dois):** para **qualquer usuário autenticado** que consiga renderizar o resource, saem em claro:

`id`, `name`, `email`, **`cpf_cnpj`**, **`phone`**, **`mobile`**, `is_active`, **`user_notes`**, `role{id,name,label,permissions[]}`, `permissions[]`, `custom_permissions_count`, `custom_permissions_list`, `can_impersonate`, `created_at`, `updated_at`.

⚠️ **Nenhum desses campos é gated por policy.** `$hidden` do model cobre só `password` e `remember_token` (`app/Models/User.php:38-41`, idêntico a `main:app/Models/User.php:42-45`). Ou seja: **CPF, telefone, celular e anotações internas de todo usuário listado vão para quem abrir `/users`**, cuja porta é só `viewAny` (`UserPolicy::viewAny`, `:11`). O cuidari **sabe** resolver isso — `PatientResource.php:21` faz exatamente o gating certo com `viewSensitive` — mas não aplicou o próprio padrão ao `UserResource`. **Este é o candidato mais direto de harvest cruzada: levar a técnica do `PatientResource` para o `UserResource` do boilerplate.**

#### ⚠️ `JsonResource::withoutWrapping()`

`app/Providers/AppServiceProvider.php:158-161` (`configResources()`). Some com o envelope `data`. Consequência visível nos controllers: quase todo uso é `Resource::collection($x)->toArray($request)` (ex.: `Finance/Settings/SupplierController.php:28-30`), o que **materializa a coleção inteira em array na hora** — perde-se o lazy do `ResourceCollection` e a paginação tem de ser remontada à mão (`User/IndexController.php:143-148` monta `pagination` campo a campo).

---

### 7. `app/Rules/` — 3 regras, diff contra `main`

**Contagem verificada:** 3 (`find app/Rules -name '*.php'`), 175 LOC. Baseline `main`: 2 (`CpfCnpj.php`, `MoneyString.php`).

Uso contado com `grep -rl 'App\\Rules\\<Rule>' app/Http/Requests`.

| Rule | LOC | O que valida | Requests que a importam | Quem está à frente |
|---|---:|---|---:|---|
| `CpfCnpj.php` | 101 | CPF (11 díg.) ou CNPJ (14 díg.) com dígito verificador; rejeita repetição | **5** — `User/StoreUserRequest`, `User/UpdateUserRequest`, `Patient/PatientRequest`, `Patient/StorePatientGuardianRequest`, `Finance/SupplierRequest` | ⚠️ **`main` à frente** |
| `MoneyString.php` | 35 | String monetária em decimal fixo, sem notação científica nem vírgula | **11** | **empate — byte a byte igual** |
| `DecimalString.php` | 39 | ⭐ Decimal de escala **parametrizável** (`__construct(int $scale = 3, bool $allowNegative = false)`); bloqueia notação científica, vírgula e casas a mais | **6** — `RetailSale/RetailSaleRequest`, `OpticalOrder/OpticalOrderRequest`, `Inventory/ProductRequest`, `Inventory/StockEntryRequest`, `Inventory/StockConsumptionRequest`, `Inventory/InventoryCountItemRequest` | ⭐ **só existe no cuidari** (`git show main:app/Rules/DecimalString.php` → `fatal: path ... does not exist in 'main'`) |

**`CpfCnpj` — o diff exato (3 hunks, todos no mesmo sentido):**

```diff
-                $d += (int) $cpf[$c] * (($t + 1) - $c);      # main
+                $d += $cpf[$c] * (($t + 1) - $c);            # cuidari
-                $sum += (int) $numbers[$length - $i] * $pos--;  # main (2×)
+                $sum += $numbers[$length - $i] * $pos--;       # cuidari (2×)
```

`main` adicionou os casts `(int)` sobre o acesso a caractere de string; o cuidari ficou na versão anterior. **`main` está à frente** — a aritmética funciona nos dois por coerção implícita, mas o cast explícito é o que sobrevive a um `strict_types` mais agressivo e ao Larastan. **Fluxo de harvest: boilerplate → cuidari, não o contrário.**

**`MoneyString` — `diff -u` não produziu saída.** Idêntico. Nada a colher em nenhuma direção.

⭐ **`DecimalString` é o candidato limpo de harvest para o boilerplate.** É o par natural de `MoneyString` (o próprio docblock diz: *"do mesmo jeito que a MoneyString faz com dinheiro"*), é genérico (escala e sinal parametrizáveis, zero dependência de domínio de clínica/ótica), tem 39 LOC e resolve o problema que qualquer app com quantidade fracionada tem. Assinatura:

```php
public function __construct(private readonly int $scale = 3, private readonly bool $allowNegative = false)
// pattern: /^%s\d{1,10}(\.\d{1,%d})?$/  — $s = '-?' se allowNegative
```

---

### 8. `app/Exceptions/` — não existe

`find app/Exceptions` → `No such file or directory`. Idem em `main` (`git ls-tree -r main --name-only | grep '^app/Exceptions'` → vazio). **Nenhum dos dois tem diretório de exceptions.**

**Zero exceptions de domínio nomeadas** (`grep -rln 'extends \(Exception\|RuntimeException\|DomainException\|InvalidArgumentException\)' app` → nenhum resultado).

O que o cuidari usa em vez disso (`grep -rhn 'throw new ' app/Services app/Models app/Traits | sed ... | sort | uniq -c`):

| Mecanismo | Ocorrências | Semântica |
|---|---:|---|
| `ValidationException::withMessages([...])` | **66** (`grep -rh 'ValidationException::withMessages' app --include='*.php' \| wc -l`) | **erro de negócio esperado** → volta como 422 com a chave do campo, aproveitando o pipeline do Inertia |
| `throw new RuntimeException` | **22** (`grep -rh 'throw new RuntimeException' app --include='*.php' \| wc -l`) | **invariante quebrada** → 500, não deveria acontecer |
| `InvalidArgumentException` | 1 (`SettlementData.php:33`) | DTO mal construído por código |
| `abort(403, '...')` | `EnsureClinicContext.php:41`, `EnsureModuleEnabled.php:33` | contexto ausente/módulo desligado |

⭐ **A separação é disciplinada e legível:** `RetailSaleService::assertTotals()` usa `RuntimeException` (invariante contábil violada — bug), enquanto `assertCompletable()` usa `ValidationException` (o operador fez algo inválido — mensagem na tela). `StockService` lidera com 13 `ValidationException`, todas com chave de campo (`'items'`, `'status'`, `'amount'`, `'quantity'`).

⚠️ **Guard-rail para o boilerplate:** 66 `ValidationException::withMessages` inline nos services significam mensagens de negócio **espalhadas por 15 arquivos**, sem catálogo, sem i18n e sem tipo. Uma hierarquia mínima (`DomainException` base + subclasse por módulo, com `render()` traduzindo para 422) daria o mesmo resultado HTTP com testabilidade por tipo em vez de por string. Hoje um teste que queira afirmar "recusou por saldo insuficiente" precisa casar texto em português.

---

### 9. Multi-tenant, de ponta a ponta

Não existe `TenantContext`; o equivalente é **`App\Services\CurrentClinic`**. A malha tem 5 anéis, e todos foram lidos.

#### Anel 1 — o contexto: `app/Services/CurrentClinic.php` (34 LOC)

`final class` com 3 métodos: `set(?Clinic)`, `get(): ?Clinic`, `id(): ?int`. Registrado em `app/Providers/AppServiceProvider.php:61` — **`$this->app->scoped(CurrentClinic::class)`** (`register()`, não `boot()`).

⭐ **O docblock registra a armadilha do worker:** *"Registrado como scoped no container: o worker de fila chama `forgetScopedInstances()` entre jobs, então cada job precisa setar o próprio contexto explicitamente antes de consultar models tenant-aware."* Isso é exatamente o bug clássico de multi-tenant em fila (job herda o tenant do job anterior) documentado **antes** de acontecer.

#### Anel 2 — o middleware de pin: `app/Http/Middleware/EnsureClinicContext.php`

```php
$user = $request->user();
if (!$user instanceof User)          { return $next($request); }   // guest passa
$user->loadMissing('clinic');
if ($clinic instanceof Clinic)       { $this->currentClinic->set($clinic); return $next($request); }
if ($user->hasRole(Roles::SUPER_USER)) { return $next($request); }  // sem set()
abort(403, 'Usuário autenticado sem clínica vinculada.');
```

**O que acontece com usuário sem tenant:** depende do papel.
- **Guest:** passa sem contexto (rota pública).
- **Usuário comum sem `clinic_id`:** **403** com mensagem explícita. ⭐ Falha fechada.
- ⚠️ **`SUPER_USER` sem clínica: passa com `CurrentClinic` NULO.** Combinado com o anel 3 (o global scope é no-op quando `id()` é `null`), isso significa que **o super-user enxerga e escreve sobre TODOS os tenants ao mesmo tempo** — a listagem de pacientes traz a base inteira, `creating` não injeta `clinic_id`. É claramente intencional (é o modo de suporte), mas é um estado sem sinal visual no backend e sem guarda contra escrita acidental cross-tenant. **Guard-rail candidato:** exigir pin explícito de clínica para super-user em qualquer rota de escrita.

#### Anel 3 — o global scope: `app/Traits/Models/BelongsToClinic.php`

`bootBelongsToClinic()` faz duas coisas:
1. **`static::creating`** — injeta `clinic_id` do contexto se o model ainda não tem (`if (!$model->clinic_id && $clinicId !== null)`).
2. **`static::addGlobalScope('clinic', ...)`** — `where("{$table}.clinic_id", $clinicId)`, **qualificado pela tabela** (⭐ correto: sem o prefixo, um `join` com outra tabela tenant-aware gera `ambiguous column`).

⭐ Docblock: *"O scope depende apenas de `CurrentClinic` — vale igualmente em HTTP, console, Horizon e scheduler. Bypass somente explícito via `Model::withoutGlobalScope('clinic')`."*

**Cobertura: 32 dos 38 models** (`grep -rl 'use BelongsToClinic;' app/Models | wc -l` → 32). Os **6 que não usam**, com veredicto:

| Model sem `BelongsToClinic` | Justificativa |
|---|---|
| `Clinic.php` | é o próprio tenant |
| `PlatformPlan.php` | catálogo global da plataforma |
| `Permission.php` | catálogo global de RBAC |
| `Role.php` | catálogo global de RBAC |
| `ClinicSubscription.php` | tem `clinic_id` (`:22`) mas é dado de plataforma, não de operação |
| ⚠️ **`User.php`** | **tem `clinic_id` no `$fillable` (`app/Models/User.php:28`) mas NÃO é escopado** |

⚠️⚠️ **`User` é o furo do anel.** `app/Models/User.php:17-20` usa `HasFactory`, `Notifiable`, `HasRolesAndPermissions`, `LogsActivity` — **não** `BelongsToClinic`. Efeito verificado em `app/Http/Controllers/User/IndexController.php:26`:

```php
$query = User::query()->with(['role', 'permissions']);   // sem filtro de clinic_id
```

Nenhum `where('clinic_id', ...)` aparece nos 150 LOC do controller. **A tela de usuários lista os usuários de todas as clínicas para qualquer usuário com `manage_users`** — e o `UserResource` (§6) entrega `cpf_cnpj`, `phone`, `mobile` e `user_notes` de cada um. Este é o achado de maior severidade da frente, e ele nasce exatamente do arquivo herdado do boilerplate que nunca foi tenant-izado.

#### Anel 4 — a prioridade de middleware: `bootstrap/app.php:36-40`

```php
// O contexto de tenant precisa existir ANTES do route model binding,
// para o global scope 'clinic' filtrar os parâmetros de rota (404 cross-tenant).
$middleware->prependToPriorityList(
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
    EnsureClinicContext::class,
);
```

⭐⭐ **Esta é a peça mais transferível de toda a frente.** Sem ela, `Route::get('/patients/{patient}')` resolveria o `Patient` **antes** do contexto existir → o global scope não filtraria → id de outro tenant retornaria 200 em vez de 404. Com ela, o binding já nasce escopado. É uma linha de `bootstrap/app.php` que fecha uma classe inteira de IDOR, e o comentário explica exatamente por quê.

Aliases registrados em `bootstrap/app.php:31-34`: `'clinic' => EnsureClinicContext::class`, `'module' => EnsureModuleEnabled::class`. Uso em `routes/web.php` (299 LOC): 5 ocorrências de `clinic`/`module:` (`grep -c`).

#### Anel 5 — validação escopada e feature-flag por tenant

- **`Rule::exists(...)->where('clinic_id', $clinicId)`** em 19 requests / 40 ocorrências (§2) — recusa id alheio na validação, antes do banco.
- **`app/Http/Middleware/EnsureModuleEnabled.php`** — `module:<nome>` na rota; resolve `Module::tryFrom($module)` (⭐ `InvalidArgumentException` se o nome do módulo não existe — erro de programação estoura em vez de liberar) e `abort(403, 'Módulo não habilitado para esta clínica.')` se `!$clinic->hasModule($moduleEnum)`.
- **`app/Services/PatientTabResolver.php`** — a aba da ficha 360 só vai ao front se o módulo está habilitado **E** o usuário tem a permission.
- **`app/Services/ClinicClock.php`** — ⭐ datas financeiras no fuso da clínica, não do servidor.
- **`app/Services/SaleNumberService.php`** — numeração sequencial **por clínica**, com `lockForUpdate` numa linha de contador (`ClinicSequence`).
- **`PatientService::lockClinic()`** — prontuário sequencial por clínica serializado no lock da própria `Clinic`.

#### Propagação para o front

`app/Http/Middleware/HandleInertiaRequests.php:57-66` — prop `clinic` como **closure**, com o motivo escrito: *"o contexto é setado pelo middleware de rota `clinic`, que roda depois do `share()` eager do Inertia"*. Devolve `id`, `name`, `segment`, `enabled_modules`.

---

### 10. Comparação direta do padrão com `main` do boilerplate

`git -C .../boilerplate ls-tree -r main --name-only | grep Controllers` retorna **29** arquivos. Os **29 existem no cuidari com o mesmo path** — `Auth/` (8), `Controller.php`, `PermissionRole/` (5), `Settings/` (2), `User/` (13). O cuidari **acrescentou 78** e não removeu nenhum.

| Dimensão | `main` | cuidari | Direção |
|---|---|---|---|
| Single-action por verbo | 20/29 invokable | 94/107 invokable | ⭐ mesmo padrão, escala 3,7× |
| `final class` no controller | padrão | 92/107 | mantido |
| authorize no controller vs. no FormRequest | no controller | **31 delegam ao FormRequest** | ⭐ evolução do cuidari |
| FormRequest como fábrica de DTO | inexistente | **15 métodos `to*()`** | ⭐ só no cuidari |
| FormRequest base abstrata | inexistente | **6 bases** | ⭐ só no cuidari |
| `prepareForValidation` (máscara BR) | inexistente | **8 requests** | ⭐ só no cuidari |
| `Rule::exists` escopado por tenant | inexistente | **19 requests / 40 ocorrências** | ⭐ só no cuidari |
| Policies | 1 (10 abilities) | 16 (100 métodos) | ⭐ cuidari |
| `Response::deny()` com mensagem | inexistente | `ProductPolicy::delete` | ⭐ só no cuidari |
| Bloco `'can' => [...]` no Resource | inexistente | **7 resources** | ⭐ só no cuidari |
| Gating de PII no Resource | inexistente | `PatientResource`, `PatientGuardianResource`, `RetailSaleItemResource` | ⭐ só no cuidari |
| DTOs | 0 | 25 | ⭐ só no cuidari |
| `*OptionsProvider` | inexistente | 4 | ⭐ só no cuidari |
| `DecimalString` | inexistente | 39 LOC | ⭐ só no cuidari |
| Prioridade `EnsureClinicContext` antes de `SubstituteBindings` | inexistente | `bootstrap/app.php:36-40` | ⭐ só no cuidari |
| `CpfCnpj` com casts `(int)` | **presente** | ausente | ⚠️ cuidari atrás |
| `UserPolicy::assignRole` / `::mutatePermissions` | **presente** (`:124`, `:108`) | **ausentes** | ⚠️ cuidari atrás |
| `AssignRoleRequest`, `SyncPermissionsRequest` | **presentes** | **ausentes** | ⚠️ cuidari atrás |
| Guarda `Gate::denies('assignRole', $user)` | **presente** | **ausente** | ⚠️ cuidari atrás |
| `Arr::only(..., SHARED_USER_FIELDS)` no share | **presente** | ausente (manda o model inteiro) | ⚠️ cuidari atrás |
| `User::permissionCacheKey($id)` | **presente** | string literal `"user:$id:permissions"` | ⚠️ cuidari atrás |
| `Inertia::flash()` | **presente** | `->with('success', ...)` | cuidari atrás |
| View composer duplicando `auth` | **presente** (1 ocorrência) | **presente** (`AppServiceProvider::getComposer`) | ⚠️ **defeito compartilhado** |

#### ⚠️ Regressões de segurança do cuidari vs. `main` — detalhamento

**(a) `AssignRoleController` sem o teto sobre o cargo atual do alvo.** `main:app/Http/Controllers/PermissionRole/AssignRoleController.php` tem, com comentário de 5 linhas explicando o cenário:

```php
if (Gate::denies('assignRole', $user)) {
    Log::warning('User attempted to change the role of a user at or above their own priority', [...]);
    return redirect()->back()->withErrors(['error' => 'Você não pode alterar o cargo deste usuário!']);
}
```

O comentário de `main` descreve o bug exato: *"As validações abaixo só olham o cargo NOVO, então sem esta guarda um gerente (70) rebaixava um administrador (90) para `viewer` — cargo que ele pode atribuir, sobre alguém em quem não deveria tocar."* **`app/Http/Controllers/PermissionRole/AssignRoleController.php` do cuidari não tem esse bloco** — a escalada está viva. Idem `RevokeRoleController.php`, que só checa se pode atribuir `VISITOR`, sem olhar o cargo atual do alvo.

**(b) Form Requests de RBAC ausentes.** `main` tem `app/Http/Requests/PermissionRole/AssignRoleRequest.php` e `SyncPermissionsRequest.php`; o cuidari tem só `UpdateRolePermissionsRequest.php`. Consequência: `AssignRoleController.php:31-36` e `SyncPermissionsController.php:18-21` validam inline com `$request->validate([...])`, e `AssignRoleController` tipa `Illuminate\Http\Request` cru.

**(c) Chave de cache literal.** `AssignRoleController` e `RevokeRoleController` do cuidari fazem `Cache::forget("user:$user->id:roles")` **e** `Cache::forget("user:$user->id:permissions")`; `main` usa `Cache::forget(User::permissionCacheKey($user->id))`. A chave `user:{id}:roles` **não é lida por ninguém** — `HasRolesAndPermissions.php:42-45` só produz `user:{id}:permissions`. É um `forget` morto que dá falsa sensação de invalidação.

**(d) PII em toda navegação.** `main:app/Http/Middleware/HandleInertiaRequests.php:56` já usa `Arr::only($user->toArray(), self::SHARED_USER_FIELDS)`, com comentário: *"`$hidden` do model esconde apenas password e remember_token, então compartilhar o model inteiro mandava `cpf_cnpj`, `phone`, `mobile` e `user_notes` em TODA navegação do painel."* **`app/Http/Middleware/HandleInertiaRequests.php:43` do cuidari é `'user' => $user`** — o model inteiro. A regressão está exatamente onde `main` a corrigiu.

**(e) ⚠️ Defeito compartilhado — segundo canal para os mesmos dados.** `app/Providers/AppServiceProvider.php:165-180` (`getComposer()`) registra `View::composer('*', ...)` que monta um array `auth` com `user`/`role`/`permissions` **em shape diferente** do `share()` do Inertia (`user` como model, `role` como string, `permissions` como Collection de nomes). Isso contraria a regra explícita do `CLAUDE.md` do boilerplate (*"Não crie um segundo canal (View Composer, endpoint) com shape diferente para os mesmos dados"*) — **e `main` tem o mesmo composer** (`grep -c 'View::composer'` em `main:app/Providers/AppServiceProvider.php` → 1). É defeito do boilerplate propagado, não do cuidari. Bônus ruim: ele roda `Auth::user()->load(['permissions','role'])` + `getAllPermissions()` em **toda** renderização de view, sem cache.

---

### Lacunas desta seção

- **Não abri os 33 services fora do top-5** linha a linha; a descrição de uma linha vem do docblock de classe de cada arquivo (extraído por `awk`), não de leitura integral. `ImpersonationService.php`, `RoleFilterService.php` e `PermissionManagementService.php` não têm docblock de classe (são herdados do boilerplate) e foram descritos pelo nome/LOC.
- **Não contei LOC de `app/Enum/` nem de `app/Jobs/`** — só o número de arquivos (42 e 5).
- **Não conferi cobertura de teste** de nenhuma policy/service; a frente é de inventário e `vendor/bin/pest` é proibido nesta rodada.
- **Não enumerei as regras (`rules()`) completas dos 53 Form Requests** — só os mecanismos de `authorize()` (43, um a um) e as regras principais das bases abstratas.
- **Não li `routes/web.php` linha a linha** para mapear qual rota tem `clinic`/`module` — só a contagem (5 ocorrências) e os aliases.
## Jobs, commands, scheduler, events, listeners, mails, notifications

Fonte: cuidari @ `a7a1170` (working tree limpa). Comparação: boilerplate @ `bc795db`.
Todas as contagens abaixo vieram de comando no disco (ver `### Contagens verificadas`).

### Panorama numérico

| Artefato | cuidari | boilerplate | comando |
|---|---|---|---|
| Jobs (`app/Jobs/`) | **5** | **0** (diretório não existe) | `find app/Jobs -type f -name '*.php' \| wc -l` / `bfs: No such file or directory` |
| Jobs `implements ShouldQueue` | 5 de 5 | — | `grep -rn 'implements ShouldQueue' app/Jobs/` |
| Commands (`app/Console/Commands/`) | **2** | **2** (nomes diferentes) | `find app/Console/Commands -type f -name '*.php' \| wc -l` |
| Tarefas agendadas (`Schedule::` em `routes/console.php`) | **6** (5 incondicionais + 1 sob feature flag) | **1** | `grep -c 'Schedule::' routes/console.php` |
| Tarefas com `onOneServer` | **0** | **0** | `grep -rn 'onOneServer' app/ routes/ bootstrap/ config/ \| wc -l` → `0` |
| Events (`app/Events/`) | **3** | **3** | `find app/Events -type f -name '*.php' \| wc -l` |
| Listeners (`app/Listeners/`) | **2** | **3** | `find app/Listeners -type f -name '*.php'` |
| Mailables (`app/Mail/`) | **0** — diretório não existe | 0 | `ls app/Mail` → `No such file or directory` |
| Notifications (`app/Notifications/`) | **0** — diretório não existe | 0 | `ls app/Notifications` → `No such file or directory` |
| Broadcast configurado | **não** (`config/broadcasting.php` ausente, `routes/channels.php` ausente) | idem | `ls config/broadcasting.php` / `ls routes/channels.php` |

Total de LOC do inventário assíncrono do cuidari: 815 linhas (`wc -l app/Jobs/*.php app/Console/Commands/*.php app/Events/*.php app/Listeners/*.php`).

---

### Jobs — `app/Jobs/` (5 arquivos)

Nenhum dos 5 declara `$tries`, `$backoff`, `$timeout`, `retryUntil()`, `$maxExceptions`,
`ShouldBeUnique`, `WithoutOverlapping`, `tags()`, `onQueue()`, `middleware()`, `failed()`,
`Batchable`, `InteractsWithQueue`, `SerializesModels`, `ShouldQueueAfterCommit` nem `afterCommit`.
Verificado com `grep -rn 'tries|backoff|timeout|retryUntil|ShouldBeUnique|WithoutOverlapping|onQueue|maxExceptions' app/Jobs/` → **zero ocorrências**; cada padrão individual conferido com `grep -rn <pat> app/Jobs/ | wc -l` → 0.

Todos usam só `Dispatchable` + `Queueable` (o trait consolidado do Laravel 11+), fila implícita
`default` na connection default.

| Job | Path | LOC | Assinatura | Dependências injetadas no `handle()` | Idempotência | Escopo |
|---|---|---|---|---|---|---|
| `MarkOverdueReceivables` | `app/Jobs/MarkOverdueReceivables.php:25` | 75 | `__construct(?int $clinicId = null)` | `CurrentClinic`, `ClinicClock`, `ReceivableChargesService` | por estado (`status !== Overdue` antes de gravar), `:50` | clínicas com `Module::Finance`, `:72` |
| `GenerateRecurringPayables` | `app/Jobs/GenerateRecurringPayables.php:23` | 65 | `__construct(?int $clinicId = null)` | `CurrentClinic`, `ClinicClock`, `PayableService` | `recurrence.last_generated_on` no molde (docblock `:18-22`) | `Module::Finance`, `:62` |
| `RecalculateOverdueCharges` | `app/Jobs/RecalculateOverdueCharges.php:28` | 84 | `__construct(?int $clinicId = null)` + `public static function enabled(): bool` `:41` | `CurrentClinic`, `ClinicClock`, `ReceivableChargesService` | idempotente por data-base (delegado ao service) | `Module::Finance`, `:81` |
| `ScanExpiringBatches` | `app/Jobs/ScanExpiringBatches.php:29` | 107 | `__construct(?int $clinicId = null)` + consts `LOG_NAME='inventory'` `:34`, `EVENT='inventory_alerts_scanned'` `:36` | `CurrentClinic`, `ClinicClock`, `StockAlertService` | **guard explícito** `alreadyScanned()` `:82` consultando `Activity` por `properties->scan_date` | `Module::Inventory`, `:104` |
| `ComputeAbcCurve` | `app/Jobs/ComputeAbcCurve.php:31` | 157 | `__construct(?int $clinicId = null)` | `CurrentClinic`, `ClinicClock` (services resolvidos inline) | recomputa do zero a janela (limpa `curve` de quem saiu, `:67-70`) | `Module::Inventory`, `:154` |

#### Padrões recorrentes que só existem no cuidari

| # | Padrão | Evidência | |
|---|---|---|---|
| 1 | **Job tenant-aware por construção**: todo job recebe `?int $clinicId` opcional; `null` = varre todas as clínicas, id = roda só uma (útil em teste e em reprocessamento manual). Implementado idêntico nos 5 via `private function clinics(): iterable`. | `app/Jobs/MarkOverdueReceivables.php:64-74`, `GenerateRecurringPayables.php:54-64`, `RecalculateOverdueCharges.php:73-83`, `ScanExpiringBatches.php:96-106`, `ComputeAbcCurve.php:146-156` | ⭐ |
| 2 | **`CurrentClinic->set($clinic)` no laço + `set(null)` no fim** — o job seta o contexto de tenant explicitamente porque o worker chama `forgetScopedInstances()` entre jobs. O `set(null)` de saída evita vazar contexto para o próximo job do mesmo processo. | `app/Services/CurrentClinic.php:9-13` (docblock explica), e `set(null)` em `MarkOverdueReceivables.php:58`, `GenerateRecurringPayables.php:48`, `RecalculateOverdueCharges.php:67`, `ScanExpiringBatches.php:79`, `ComputeAbcCurve.php:50` | ⭐ |
| 3 | **"Hoje" resolvido no fuso da clínica, não do servidor** — `ClinicClock::today($clinic)`. O horário do scheduler vira só gatilho; a data correta é calculada dentro do job. Motivação documentada: às 21h em São Paulo o servidor UTC já virou o dia, e marcar vencido um título que vence hoje é juro cobrado indevidamente. | `app/Services/ClinicClock.php:16-41`; docblocks em `MarkOverdueReceivables.php:18-24` e `RecalculateOverdueCharges.php:17-27`; comentário no scheduler em `routes/console.php:14-16` | ⭐ |
| 4 | **Filtro por módulo habilitado antes de processar** — `->filter(fn(Clinic $c) => $c->hasModule(Module::Finance\|Inventory))`. Clínica sem o módulo nunca entra no laço. | 5/5 jobs (`grep -n 'hasModule(Module::' app/Jobs/*.php`) | ⭐ |
| 5 | **`eachById()` (chunk por chave) em vez de chunk por offset**, com o porquê no comentário: marcar o registro o tira do filtro e um chunk por offset pularia títulos. Aplicado inclusive onde não é estritamente necessário, "porque o padrão da casa é esse". | `MarkOverdueReceivables.php:44-49`, `RecalculateOverdueCharges.php:56-62`, `GenerateRecurringPayables.php:42-45`, `ComputeAbcCurve.php:67-70` | ⭐ |
| 6 | **Feature flag que impede o agendamento, não só a execução** — `RecalculateOverdueCharges::enabled()` é `static` justamente para o `routes/console.php` perguntar antes de registrar; com a chave OFF o job não aparece no `schedule:list`. | `app/Jobs/RecalculateOverdueCharges.php:37-44` + `routes/console.php:22-24` + `config/finance.php:22` | ⭐ |
| 7 | **Idempotência por marca de auditoria** — `ScanExpiringBatches` grava a consolidação no `activity_log` e consulta `properties->scan_date` para não repetir no mesmo dia; é a mesma marca que serve de "sem spam" da spec e de guarda de retry. | `app/Jobs/ScanExpiringBatches.php:52-54` e `:82-91` | ⭐ |
| 8 | **Job de leitura pura** — o scan de vencidos não baixa estoque; só sugere. Explicitado no docblock. | `app/Jobs/ScanExpiringBatches.php:24-27` | ⭐ |

#### Limitações / guard-rails candidatos

| # | Achado | Evidência | |
|---|---|---|---|
| A | **Nenhum job declara `$tries`/`$backoff`/`$timeout`**. Herdam do supervisor do Horizon: `tries => 1`, `timeout => 60`. Ou seja, **todo job diário é one-shot sem retry, com teto de 60s**, varrendo *todas* as clínicas num único job. Um `ComputeAbcCurve` mensal sobre carteira grande estoura os 60s e não é reexecutado. | `config/horizon.php:209` (`'tries' => 1`), `config/horizon.php:210` (`'timeout' => 60`); zero ocorrências de `$tries`/`$timeout` em `app/Jobs/` | ⚠️ |
| B | **Nenhuma tarefa agendada declara `onOneServer`, `withoutOverlapping`, `runInBackground` ou `->timezone()`** (0 ocorrências em `routes/console.php` e `bootstrap/app.php`). Com dois servidores de app rodando `schedule:run`, os 6 jobs são despachados em duplicata. `MarkOverdueReceivables` e `GenerateRecurringPayables` não têm lock próprio — só `ScanExpiringBatches` sobrevive à duplicata (guard `alreadyScanned`). | `grep -rn 'onOneServer\|withoutOverlapping\|runInBackground\|->timezone(' routes/console.php bootstrap/app.php` → `(none)` | ⚠️ |
| C | **Nenhum job usa `ShouldBeUnique`/`WithoutOverlapping`** — a proteção contra sobreposição é zero mesmo em servidor único, se um `ComputeAbcCurve` do mês passado ainda estiver na fila. | zero ocorrências em `app/Jobs/` | ⚠️ |
| D | **Nenhum job implementa `tags()`** — no dashboard do Horizon os 5 jobs aparecem só pelo nome da classe, sem `clinic:{id}`. Combinado com o design "um job varre todas as clínicas", perde-se rastreabilidade por tenant. | zero ocorrências de `function tags` em `app/Jobs/` | ⚠️ |
| E | **`config/horizon.php:202` declara 6 filas (`default, messaging, billing, reports, ai, media`) e nenhum job usa `onQueue()`** — tudo cai em `default`. As filas foram provisionadas pela Spec 00 (`docs/specs/00-foundation-multitenant-modules.md:175-182`, `docs/01-architecture.md:49-53`) antes dos jobs existirem. Único delta real de `config/horizon.php` vs. boilerplate (diff = 1 linha). | `diff -u <boilerplate>/config/horizon.php config/horizon.php` mostra só a linha 202 | ⚠️ (nota: o *registro documentado das filas* é ⭐, o não-uso é ⚠️) |
| F | **`config/horizon.php:134-140`: `silenced` e `silenced_tags` vazios** (só comentários stub do Horizon), apesar de 5 jobs diários que rodam limpos na maioria dos dias. | `sed -n '125,145p' config/horizon.php` | ⚠️ |
| G | **`ComputeAbcCurve.php:83-87` faz `Product::query()->whereKey($id)->first()?->forceFill(...)->save()` dentro do laço** — 1 SELECT + 1 UPDATE por produto com receita, sem batch. Mesmo padrão em `:67-70`. | `app/Jobs/ComputeAbcCurve.php:78-90` | ⚠️ |
| H | **Descasamento de connection**: `config/queue.php:16` default `database`, `config/horizon.php:201` supervisor em `redis`. `.env.example:38` põe `QUEUE_CONNECTION=redis`, então em dev funciona; mas quem subir sem essa env fica com Horizon vazio e jobs presos na tabela `jobs`. (Arquivo `config/queue.php` é **byte-idêntico** ao do boilerplate — `diff` vazio.) | `config/queue.php:16`, `config/horizon.php:201`, `.env.example:38` | ⚠️ |

---

### Commands — `app/Console/Commands/` (2 arquivos)

| Command | Path | Signature | Descrição | Testes |
|---|---|---|---|---|
| `OnboardClinicCommand` | `app/Console/Commands/OnboardClinicCommand.php:19` | `cuidari:onboard-clinic` com 11 opções (`--name`, `--segment`, `--plan`, `--owner-name`, `--owner-email`, `--owner-password`, `--status=trialing`, `--trial-days`, `--document`, `--phone`, `--timezone=America/Sao_Paulo`) `:21-32` | Cria Clinic + owner + ClinicSubscription (fase 1) | `tests/Feature/Foundation/OnboardClinicCommandTest.php` — 3 testes |
| `SyncPermissionsCommand` | `app/Console/Commands/SyncPermissionsCommand.php:18` | `cuidari:sync-permissions` (sem opções) `:20` | Roda `PermissionRoleSeeder` + invalida cache de roles e users | `tests/Feature/Permissions/SyncPermissionsCommandTest.php` — 3 testes |

| # | Achado | Evidência | |
|---|---|---|---|
| I | **`OnboardClinicCommand` mistura flags e Laravel Prompts no mesmo fluxo**: `$this->option('x') ?? text(...)`/`select(...)`/`password(...)` — roda 100% não-interativo em CI e cai em wizard interativo quando falta a flag. Os `select()` são alimentados dos enums/tabela (`ClinicSegment::cases()` `:42`, `PlatformPlan` ativos `:65`), não de lista hardcoded. Falha com mensagem acionável quando não há plano cadastrado (`:58` aponta o seeder a rodar). Fecha com `$this->table()` de resumo (`:114-122`). | `app/Console/Commands/OnboardClinicCommand.php:38-78`, `:113-122` | ⭐ |
| J | **`?? ` em vez de `?: ` nos prompts**: `$this->option('name') ?? text(...)`. `option()` de flag ausente devolve `null` (ok), mas flag passada vazia (`--name=`) devolve `''`, que **não** dispara o prompt — segue com nome vazio até a validação do service. | `app/Console/Commands/OnboardClinicCommand.php:38`, `:76-78` | ⚠️ |
| K | **`SyncPermissionsCommand` do cuidari é a versão ANTIGA** (52 LOC, `class` não-`final`, sem `declare(strict_types)`). O boilerplate já evoluiu a sua para 178+ LOC com `--dry-run`, `--force`/`ConfirmableTrait`, remoção de roles/permissions órfãos, remanejamento de usuários órfãos para `visitor` e `DB::transaction`. **Fluxo reverso** (boilerplate → cuidari), não harvest. Também difere o nome do comando: `cuidari:sync-permissions` vs. `permissions:sync`. | `diff -u <boilerplate>/app/Console/Commands/SyncPermissionsCommand.php app/Console/Commands/SyncPermissionsCommand.php` | ⚠️ |
| L | Cuidari **não tem** `CreateSuperUserCommand` (existe no boilerplate em `app/Console/Commands/CreateSuperUserCommand.php`) — o onboarding de clínica ocupou esse espaço. | `find <boilerplate>/app/Console -type f` | — |

---

### Scheduler — `routes/console.php` (6 tarefas, 0 com `onOneServer`)

`bootstrap/app.php` **não** usa `withSchedule` — o agendamento vive inteiro em
`routes/console.php`, registrado via `withRouting(commands: routes/console.php)` (`bootstrap/app.php:17`).

| # | Linha | Tarefa | Cadência | `onOneServer` | `withoutOverlapping` | `runInBackground` | timezone |
|---|---|---|---|---|---|---|---|
| 1 | `routes/console.php:12` | `Schedule::command('horizon:snapshot')` | `everyFiveMinutes()` | não | não | não | default do app |
| 2 | `routes/console.php:17` | `Schedule::job(new MarkOverdueReceivables())` | `dailyAt('03:10')` | não | não | não | resolvido *dentro* do job, por clínica |
| 3 | `routes/console.php:23` | `Schedule::job(new RecalculateOverdueCharges())` — **condicional**, só registra se `RecalculateOverdueCharges::enabled()` | `dailyAt('03:15')` | não | não | não | idem |
| 4 | `routes/console.php:18` | `Schedule::job(new GenerateRecurringPayables())` | `dailyAt('03:20')` | não | não | não | idem |
| 5 | `routes/console.php:28` | `Schedule::job(new ScanExpiringBatches())` | `dailyAt('03:30')` | não | não | não | idem |
| 6 | `routes/console.php:29` | `Schedule::job(new ComputeAbcCurve())` | `monthlyOn(1, '03:40')` | não | não | não | idem |

Também em `routes/console.php:31-33`: `Artisan::command('inspire', ...)` (stub do framework, herdado do boilerplate).

| # | Achado | Evidência | |
|---|---|---|---|
| M | **Janela escalonada de 10 em 10 minutos** (03:10 / 03:15 / 03:20 / 03:30 / 03:40) em vez de tudo em `daily()` — evita 5 jobs concorrentes na mesma varredura de todas as clínicas. | `routes/console.php:17-29` | ⭐ |
| N | **Comentário no scheduler explicando por que o horário do cron é irrelevante** ("o horário do scheduler é só o gatilho — a correção da data está dentro do job"). É a documentação do contrato timezone↔job no ponto onde alguém iria mexer. | `routes/console.php:14-16` e `:26-27` | ⭐ |
| O | **Agendamento sob feature flag no nível do `Schedule::`** (item 3): `if (RecalculateOverdueCharges::enabled())`. Padrão raro e limpo — a tarefa desligada some do `schedule:list` em vez de rodar e retornar cedo. | `routes/console.php:22-24` | ⭐ |
| P | Boilerplate tem **1** tarefa (`horizon:snapshot`, `routes/console.php:7`); cuidari tem 6 — as 5 de domínio são delta puro. | `cat <boilerplate>/routes/console.php` | ⭐ |

---

### Events e Listeners

| Artefato | Path | Registro | Broadcast |
|---|---|---|---|
| `ImpersonateStarted` | `app/Events/ImpersonateStarted.php:11` (`Dispatchable` + `SerializesModels`, props `User $impersonator`, `User $targetUser`) | `Event::listen()` explícito em `app/Providers/AppServiceProvider.php:164` | não |
| `ImpersonateStopped` | `app/Events/ImpersonateStopped.php:11` (props `User $originalUser`, `User $impersonatedUser`) | `app/Providers/AppServiceProvider.php:165` | não |
| `RoleUserUpdatedEvent` | `app/Events/RoleUserUpdatedEvent.php:11` (`InteractsWithSockets`, `broadcastOn(): Channel('users.roles')` `:22`, `broadcastWith()` `:27`) | nenhum listener | `Broadcast::event(...)` explícito nos controllers |
| `LogImpersonateStarted` | `app/Listeners/LogImpersonateStarted.php:9` | via `Event::listen` acima | — |
| `LogImpersonateStopped` | `app/Listeners/LogImpersonateStopped.php:9` | via `Event::listen` acima | — |

Pontos de disparo (`grep -rn` em `app/`, `routes/`):
- `app/Services/ImpersonationService.php:26` → `event(new ImpersonateStarted(...))`
- `app/Services/ImpersonationService.php:39` → `event(new ImpersonateStopped(...))`
- `app/Http/Controllers/PermissionRole/AssignRoleController.php:119` → `Broadcast::event(new RoleUserUpdatedEvent($user))`
- `app/Http/Controllers/PermissionRole/RevokeRoleController.php:78` → idem

Ambos os listeners são **síncronos** (não implementam `ShouldQueue`) e gravam no
`activity_log` do Spatie com `log_name='security'`, payload estruturado
(`type`, `scope`, `request.url/ip_address/user_agent`, `impersonation.impersonator/target_user`)
— `app/Listeners/LogImpersonateStarted.php:13-36` e `LogImpersonateStopped.php:13-36`.

| # | Achado | Evidência | |
|---|---|---|---|
| Q | `ImpersonateStarted`/`Stopped` e os dois listeners são **byte-idênticos** ao boilerplate (`diff -q` → idêntico nos 4 arquivos). Nada a colher. | `diff -q <boilerplate>/app/Events/ImpersonateStarted.php app/Events/ImpersonateStarted.php` etc. | — |
| R | **`RoleUserUpdatedEvent::broadcastWith()` do cuidari está com bug já corrigido no boilerplate**: `$this->user->roles->first()->name` (`app/Events/RoleUserUpdatedEvent.php:29`) — o `User` do cuidari só tem a relação **`role()`** singular (`app/Traits/Models/HasRolesAndPermissions.php:129`), não existe `roles()`. Boilerplate já usa `$this->user->role?->name` e tem `declare(strict_types = 1)`. Fluxo reverso; hoje não explode só porque o broadcast é no-op (ver S). | `diff -u <boilerplate>/app/Events/RoleUserUpdatedEvent.php app/Events/RoleUserUpdatedEvent.php` | ⚠️ |
| S | **`Broadcast::event()` chamado sem broadcasting configurado**: não existe `config/broadcasting.php` nem `routes/channels.php`; `laravel/reverb` e `pusher/pusher-php-server` **não estão em `composer.json`/`composer.lock`** (a única ocorrência de pusher no lock é a linha `suggest` do framework, `composer.lock:1530`). Ainda assim `.env.example:36` declara `BROADCAST_CONNECTION=reverb` — env que aponta para driver não instalado. `docs/01-architecture.md:78` confirma: "broadcasting (Reverb) é backlog — o boilerplate ainda não tem broadcasting configurado". | `ls config/broadcasting.php` → not found; `ls routes/channels.php` → not found; `grep '"laravel/reverb"' composer.json composer.lock` → 0 | ⚠️ |
| T | Nenhum `$listen`, `shouldDiscoverEvents()` ou `Event::subscribe` — o registro é 100% explícito nos 2 `Event::listen` do `AppServiceProvider` (método dedicado `configEvents()`, `:162-166`). Nota: **o boilerplate não tem esses `Event::listen`** (`grep 'Event::listen' <boilerplate>/app/Providers/AppServiceProvider.php` → 0) e depende da descoberta automática — divergência de estratégia entre os dois. | `grep -rn 'Event::listen\|\$listen\|shouldDiscoverEvents\|Event::subscribe' app/ bootstrap/` | ⚠️ |

---

### Mails e Notifications

- **`app/Mail/` não existe** e **`app/Notifications/` não existe** (`ls` → `No such file or directory`).
- Em todo `app/` + `routes/` há **2 ocorrências** de qualquer coisa de mail/notification
  (`grep -rn 'Notifiable|->notify(|Notification::|MailMessage|Mailable|Mail::' app/ routes/ | wc -l` → 2),
  e ambas são a mesma coisa: `use Illuminate\Notifications\Notifiable;` (`app/Models/User.php:11`)
  e `use Notifiable;` (`app/Models/User.php:18`) — o trait padrão do skeleton, sem nenhuma
  notificação de aplicação usando-o.
- **Zero views de e-mail**: `resources/views/` tem 4 arquivos e nenhum é mail
  (`app.blade.php`, `carnet/a4.blade.php`, `carnet/coil80.blade.php`, `optical-orders/a4.blade.php`);
  `find resources -type d -name 'mail*'` → vazio.
- `config/mail.php:17` default `env('MAIL_MAILER', 'log')`; `.env.example:50-57` aponta para
  SMTP local na porta 1025 (Mailpit/Mailhog), com `MAIL_FROM_ADDRESS` apontando para um
  endereço `***` de domínio `.test`.
  `phpunit.xml:27` força `MAIL_MAILER=array` em teste.

| # | Achado | Evidência | |
|---|---|---|---|
| U | **Cuidari não tem a trava de staging de e-mail do boilerplate.** O boilerplate tem `app/Listeners/EnforceMailAllowlist.php` (124 LOC) que, fora de produção, redireciona destinatário fora de `config('mail.allowlist')` para `config('mail.test_inbox')` ou cancela o envio; suporta match exato e por domínio. No cuidari: `grep -rn 'MessageSending\|allowlist' app/ config/` → nenhuma ocorrência relevante (o único hit é um comentário sobre módulos em `config/cuidari.php:40`). **Fluxo reverso**, e relevante porque o cuidari tem PII de paciente. | `cat <boilerplate>/app/Listeners/EnforceMailAllowlist.php`; `grep -rn 'MessageSending' app/ config/` | ⚠️ |
| V | Módulo `messaging` (SMS/WhatsApp/campanhas) está previsto na arquitetura e tem fila reservada, mas **nenhum código de envio existe** — a fila `messaging` em `config/horizon.php:202` é reserva de nome. | `docs/01-architecture.md:51-53`; zero mailables/notifications | — |

---

### Cobertura de teste do assíncrono

| Alvo | Arquivo de teste | Nº de testes (`grep -cE "^(it\|test)\("`) |
|---|---|---|
| `ComputeAbcCurve` | `tests/Feature/Inventory/ComputeAbcCurveTest.php` | 7 |
| `ComputeAbcCurve` (integração com venda) | `tests/Feature/RetailSales/RetailSaleStockTest.php:169` | (arquivo maior, cobre outros temas) |
| `GenerateRecurringPayables` | `tests/Feature/Finance/RecurringPayableTest.php` | 6 |
| `MarkOverdueReceivables` | `tests/Feature/Finance/MarkOverdueReceivablesTest.php` | 5 |
| `RecalculateOverdueCharges` + `MarkOverdueReceivables` | `tests/Feature/Finance/RecalculateChargesActionTest.php` | 8 |
| `ScanExpiringBatches` | `tests/Feature/Inventory/InventoryAlertsTest.php` | 7 |
| `OnboardClinicCommand` | `tests/Feature/Foundation/OnboardClinicCommandTest.php` | 3 |
| `SyncPermissionsCommand` | `tests/Feature/Permissions/SyncPermissionsCommandTest.php` | 3 |
| eventos de impersonation | `tests/Feature/ImpersonateTest.php:118-133` (`Event::fake` + `Event::assertDispatched`) | 13 (`grep -cE "public function test" ` — arquivo é classe PHPUnit `final class ImpersonateTest extends TestCase` `:21`, não Pest) |

Total de arquivos `*Test.php` no projeto: **95** (`find tests -name '*Test.php' | wc -l`).

| # | Achado | Evidência | |
|---|---|---|---|
| W | **Todos os 5 jobs têm teste**, e o teste usa o construtor com `clinicId` para rodar só a clínica do cenário — o parâmetro opcional do padrão #1 é o que torna o job testável sem seed global. Dois estilos convivem: `dispatch(new GenerateRecurringPayables($this->clinic->id))` (`tests/Feature/Finance/RecurringPayableTest.php:44`) com `QUEUE_CONNECTION=sync` em `phpunit.xml:29`, e chamada direta de `handle()` com deps injetadas à mão (`tests/Feature/Inventory/ComputeAbcCurveTest.php:32`, `tests/Feature/Inventory/InventoryAlertsTest.php:132`). | ver paths | ⭐ |
| X | **Teste de idempotência explícito**: `RecurringPayableTest.php:63-65` despacha o mesmo job **3 vezes seguidas** e assere que não duplica. `InventoryAlertsTest.php:132-147` faz o par (2 execuções, 1 registro de `Activity`). | `tests/Feature/Finance/RecurringPayableTest.php:63-65`; `tests/Feature/Inventory/InventoryAlertsTest.php:132-147` | ⭐ |
| Y | Nenhum teste do **scheduler em si** (nada que asserte cadência, presença no `schedule:list`, ou o gate `RecalculateOverdueCharges::enabled()` no registro). `grep -rn 'Schedule' tests/` só bate em `tests/Feature/Finance/RecalculateChargesActionTest.php`. | `grep -rln 'Queue::fake\|Bus::fake\|Schedule' tests/` → 1 arquivo | ⚠️ |
| Y2 | **Estilos de teste divergentes na mesma frente**: os testes de job/command são Pest (`it(`/`test(` no topo do arquivo), mas o teste dos eventos é classe PHPUnit com 13 `public function test_*` (`tests/Feature/ImpersonateTest.php:21,31`), contra a regra do próprio projeto ("Testes **Pest** para tudo", `CLAUDE.md:35`). | `grep -cE "public function test" tests/Feature/ImpersonateTest.php` → 13 | ⚠️ |
| Z | Zero `Queue::fake()` / `Bus::fake()` no projeto — nada testa "o controller X enfileira o job Y"; consistente com o fato de que **nenhum job é despachado de `app/` ou `routes/`** (só do scheduler): `grep -rn 'dispatch' app/ routes/` filtrado pelos 5 nomes de job → nenhuma ocorrência. | `grep -rln 'Queue::fake\|Bus::fake' tests/` | — |

---

### Infra e tooling do assíncrono

| Item | Evidência | |
|---|---|---|
| `composer dev` sobe 5 processos concorrentes incluindo **`horizon:listen` e `schedule:work`** lado a lado com `serve`/`pail`/`vite` — o ciclo de dev exercita fila e scheduler por default. | `composer.json:85` (e `:90` na variante SSR). **Idêntico ao boilerplate** (`<boilerplate>/composer.json:88`) — herdado, não delta. | — |
| `composer horizon:terminate` como script nomeado (hook de deploy). | `composer.json:82`; idêntico ao boilerplate (`:85`). | — |
| Gate do dashboard do Horizon: `viewHorizon` restrito a `Roles::SUPER_USER`. | `app/Providers/HorizonServiceProvider.php:27` | — |
| `config/queue.php` byte-idêntico ao boilerplate (`diff` vazio); `failed.driver` = `database-uuids` (`:107`), batching em `job_batches` (`:88-91`) — nada usa batching. | `diff -u <boilerplate>/config/queue.php config/queue.php` → sem saída | — |
| **Nenhum artefato de deploy do scheduler/worker no repo**: sem `Procfile`, sem `Dockerfile`, sem `*.conf` de supervisord; `.github/workflows/` tem só `ci.yml` e `semgrep.yml`, e a única ocorrência de `schedule:` em `.github/` é o gatilho cron do próprio Semgrep (`.github/workflows/semgrep.yml:8`). A operação do `schedule:run`/worker em produção não está versionada. | `grep -rn 'schedule:run\|supervisor' --include='*.yml' --include='Procfile*' --include='Dockerfile*' .` | ⚠️ |
| `phpunit.xml:29` `QUEUE_CONNECTION=sync` e `:24` `CACHE_STORE=array` — jobs rodam inline no teste. | `grep -n 'env name' phpunit.xml` | — |

---

### Resumo do delta vs. boilerplate

**Só existe no cuidari (⭐ candidatos a harvest):**
1. A camada `app/Jobs/` inteira — o boilerplate **não tem o diretório**.
2. O contrato "job tenant-aware": `?int $clinicId` + `clinics(): iterable` + `CurrentClinic->set()/set(null)` + filtro `hasModule()` — replicado idêntico nos 5 jobs, testado, documentado em `docs/03-conventions.md:22,28`.
3. `ClinicClock` (`app/Services/ClinicClock.php`) como fonte de "hoje" no fuso do tenant, com o scheduler reduzido a gatilho.
4. Agendamento condicional por feature flag no `routes/console.php` (`RecalculateOverdueCharges::enabled()`).
5. Idempotência por marca no `activity_log` (`ScanExpiringBatches::alreadyScanned()`), com teste de dupla execução.
6. `OnboardClinicCommand` — command com flags + Laravel Prompts, opções alimentadas por enum/tabela, tabela de resumo no fim.
7. Escalonamento horário das tarefas (03:10→03:40) e os comentários que explicam a decisão.
8. Registro documentado das 6 filas de domínio em `config/horizon.php:202` (o único delta do arquivo).

**Existe só no boilerplate (fluxo reverso, não é harvest):**
- `app/Listeners/EnforceMailAllowlist.php`, `app/Console/Commands/CreateSuperUserCommand.php`,
  `SyncPermissionsCommand` na versão com `--dry-run`/órfãos/transação,
  e o fix de `RoleUserUpdatedEvent::broadcastWith()`.

**Guard-rails que o boilerplate deveria adotar (⚠️):**
resiliência de job (`$tries`/`$backoff`/`$timeout` explícitos, hoje `tries=1`/`timeout=60` herdados do supervisor);
`onOneServer` + `withoutOverlapping` obrigatórios em tarefa agendada (0 de 6 declaram);
`tags()` com o tenant no job; filas declaradas mas nunca roteadas (`onQueue`);
`Broadcast::event()` sem broadcaster instalado; operação do scheduler/worker fora do versionamento.
## config/, .env.example, lang/, workflows, dependências

**Fonte:** `/Users/cristianomorgante/workspace/laravel/simplify-technology/cuidari` @ `a7a11701d0937717dfbd108382b5366f83a33271` (2026-08-10).
**Comparação:** `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate` @ `bc795dbec3cf708ba806868552ab10eb3986e85d` (main, 2026-08-12).
Todos os caminhos são relativos à raiz do projeto indicado. Valores de `.env.example` estão redigidos como `***` — só nomes de chave aparecem.

### Contagens verificadas

| Métrica | Valor | Comando |
|---|---|---|
| Arquivos em `config/` (cuidari) | **18** | `find config -type f \| wc -l` |
| Arquivos em `config/` (boilerplate) | **14** | `find boilerplate/config -type f \| wc -l` |
| Configs só no cuidari | **4** | `for f in $(ls cuidari/config); do [ -f boilerplate/config/$f ] \|\| echo $f; done` |
| Configs só no boilerplate | **0** | mesma varredura invertida |
| Chaves não comentadas em `.env.example` (cuidari) | **49** | `grep -oE '^[A-Z][A-Z0-9_]*=' .env.example \| sed 's/=$//' \| sort -u \| wc -l` |
| Chaves não comentadas em `.env.example` (boilerplate) | **56** | idem no boilerplate |
| Chaves só no cuidari | **0** | `comm -23 c.keys b.keys` |
| Chaves só no boilerplate | **7** | `comm -13 c.keys b.keys` |
| Arquivos em `lang/` (cuidari) | **0** (diretório inexistente) | `find lang -type f 2>/dev/null \| wc -l` |
| Arquivos em `lang/` (boilerplate) | **4** | `find boilerplate/lang -type f \| wc -l` |
| Chaves-folha de tradução (boilerplate) | **166** | script PHP com `RecursiveIteratorIterator` sobre `lang/pt_BR/*.php` |
| Workflows em `.github/workflows/` (cuidari) | **2** | `find .github/workflows -type f \| wc -l` |
| `uses:` nos workflows (cuidari) | **16**, sendo **0 SHA-pinned** e **16 tag-pinned** | `grep -rhoE 'uses: [^ ]+@[0-9a-f]{40}' .github/workflows/*.yml \| wc -l` |
| `uses:` nos workflows (boilerplate) | **20**, sendo **20 SHA-pinned** | mesmo comando no boilerplate |
| Dependências diretas Composer (cuidari) | **21** (9 `require` + 12 `require-dev`) | script Python sobre `composer.json` |
| Dependências diretas npm (cuidari) | **58** (35 deps + 20 devDeps + 3 optionalDeps) | script Python sobre `package.json` |
| Scripts em `composer.json` (cuidari) | **15** | idem |
| Scripts em `package.json` (cuidari) | **18** | idem |
| Chamadas `onQueue(...)` em `app/`, `routes/`, `tests/`, `database/`, `config/` | **0** | `grep -rn "onQueue(" app database routes tests config \| wc -l` |
| Jobs em `app/Jobs/` | **5** | `find app/Jobs -name '*.php' \| wc -l` |
| FormRequests com `messages()` / total | **34 / 53** | `grep -rln "function messages" app/Http/Requests \| wc -l`; `find app/Http/Requests -name '*.php' \| wc -l` |
| FormRequests com `attributes()` | **0** | `grep -rln "function attributes" app/Http/Requests \| wc -l` |
| Chamadas `__()` em `app/` + `resources/` | **6** (em 4 arquivos) | `grep -rn "__(" app resources \| wc -l` |
| Configs sem `declare(strict_types = 1)` | **15 de 18** | `for f in config/*.php; do grep -q "declare(strict_types" $f \|\| echo $f; done \| wc -l` |

---

### 1. `config/` — inventário arquivo a arquivo

Coluna "vs boilerplate" = nº de linhas `+`/`-` num `diff -u boilerplate/config/X cuidari/config/X` (0 = byte-idêntico).

| Arquivo | Linhas | vs boilerplate | O que customiza |
|---|---|---|---|
| `config/activitylog.php` | 82 | 0 | Idêntico ao boilerplate (config publicada do `spatie/laravel-activitylog`). |
| `config/app.php` | 126 | 4 | ⚠️ `'locale' => env('APP_LOCALE', 'en')` e `'faker_locale' => env('APP_FAKER_LOCALE', 'en_US')` — o boilerplate usa `pt_BR` nos dois. Vs. Laravel default: removidos `frontend_url`, `asset_url` e os blocos `providers`/`aliases`. |
| `config/auth.php` | 115 | 0 | Sem customização funcional vs. Laravel default (só alinhamento do Pint). |
| `config/cache.php` | 129 | 0 | Idêntico ao boilerplate. |
| `config/cuidari.php` | 50 | **só cuidari** | ⭐ Allowlist de papéis RBAC do produto (`enabled_roles`, 13 casos) + `optional_roles` (6 papéis financeiros dormentes). Consumida em `app/Services/RoleFilterService.php:25` via `config('cuidari.enabled_roles', …)`. |
| `config/database.php` | 182 | 0 | Vs. Laravel default: usa `PDO::MYSQL_ATTR_SSL_CA` (constante antiga) em vez de `Pdo\Mysql::ATTR_SSL_CA`; faltam `prefix_indexes`, `transaction_mode`, `pragmas` do SQLite. Mesmo estado do boilerplate. |
| `config/filesystems.php` | 90 | 9 | ⭐ Disco `private` explícito (`driver: local`, `root: storage_path('app/private')`, `serve: false`, sem `url`, sem `visibility`) para uploads LGPD. Comentário cita "Spec 00". O boilerplate **não tem** esse disco. |
| `config/finance.php` | 23 | **só cuidari** | ⭐ Um único flag: `recalculate_overdue_charges` ← `env('FINANCE_RECALCULATE_OVERDUE_CHARGES', false)`. O comentário documenta o *porquê* do default OFF (encargo diário é decisão comercial da clínica). Consumido em `app/Jobs/RecalculateOverdueCharges.php:43` e o schedule só existe se o flag estiver ligado (`routes/console.php:22`). |
| `config/horizon.php` | 260 | 2 | ⚠️ `defaults.supervisor-1.queue` = `['default','messaging','billing','reports','ai','media']` (boilerplate: `['default']`). **Nenhum produtor**: 0 `onQueue()` no código e os 5 jobs de `app/Jobs/` são agendados sem fila nomeada (`routes/console.php:17-29`). As 5 filas extras são aspiracionais. |
| `config/inertia.php` | 142 | 0 | Idêntico ao boilerplate. |
| `config/inventory.php` | 28 | **só cuidari** | ⭐ 4 parâmetros de domínio, todos hard-coded (sem `env()`): `expiry_alert_days=30`, `consumption_window_days=90`, `lead_time_days=15`, `abc_window_days=365`. Consumidos em `app/Services/StockAlertService.php:49`, `app/Services/PurchaseSuggestionService.php:83,88`, `app/Jobs/ComputeAbcCurve.php:140`, `app/Http/Resources/ProductBatchResource.php:31`, `app/Http/Controllers/Inventory/Product/IndexController.php:82`. |
| `config/log-viewer.php` | 237 | 0 | Idêntico ao boilerplate. |
| `config/logging.php` | 132 | 4 | ⚠️ **Não tem** `'tap' => [PiiAwareTap::class]` nos canais `stack`/`single`/`daily` — o boilerplate tem (`App\Support\Logging\PiiAwareTap`). Num produto de saúde, é exatamente onde faria mais falta. |
| `config/mail.php` | 116 | 17 | ⚠️ **Não tem** o bloco `allowlist`/`test_inbox` do boilerplate (guarda de e-mail em staging via `App\Listeners\EnforceMailAllowlist`). Vs. Laravel default: sem a seção `markdown`. |
| `config/platform.php` | 19 | **só cuidari** | ⭐ `signup.trial_days` ← `env('PLATFORM_SIGNUP_TRIAL_DAYS', 7)` (cast `(int)` no próprio config). Consumido em `app/Services/OnboardClinicService.php:140`. ⚠️ Único dos 4 configs de produto **sem** `declare(strict_types = 1)` — `cuidari.php`, `finance.php` e `inventory.php` têm (as 15 configs stock do Laravel também não têm; `for f in config/*.php; do grep -q "declare(strict_types" $f \|\| echo $f; done` → 15 arquivos). |
| `config/queue.php` | 112 | 0 | Idêntico ao boilerplate. Vs. Laravel 13 default: faltam as conexões `deferred` e `failover` e o bloco `sqs.overflow`. |
| `config/services.php` | 38 | 0 | Idêntico ao boilerplate. |
| `config/session.php` | 217 | 0 | Vs. Laravel default: cookie name via `Str::slug(APP_NAME).'-session'` em vez de `Str::snake(...).'_session'`. Igual ao boilerplate. |

**Não publicados** (usando o default do framework): `broadcasting.php`, `concurrency.php`, `cors.php`, `hashing.php`, `view.php` — presentes em `vendor/laravel/framework/config/` mas ausentes de `config/`. Mesma situação no boilerplate.

⭐ **`tests/Feature/Foundation/FoundationConfigTest.php`** — 4 testes que travam decisões de config como contrato: filas do supervisor Horizon (`:7-10`), disco `private` sem `url`/`visibility` (`:12-20`), `platform.signup.trial_days` inteiro e > 0 (`:22-24`), e `CurrentClinic` como singleton *scoped* (`:26-34`). O boilerplate não tem um teste equivalente guardando config.

---

### 2. `.env.example` — diff de chaves

Arquivo: `cuidari/.env.example` (65 linhas, 49 chaves não comentadas + 2 comentadas: `APP_MAINTENANCE_STORE`, `CACHE_PREFIX`).
Boilerplate: `boilerplate/.env.example` (95 linhas, 56 chaves).

**Chaves só no cuidari: nenhuma.** O `.env.example` do cuidari é subconjunto estrito do boilerplate.

| Chave só no boilerplate | Config que a lê |
|---|---|
| `ACTIVITYLOG_ENABLED` | `config/activitylog.php` |
| `ACTIVITYLOG_BUFFER_ENABLED` | `config/activitylog.php` |
| `HORIZON_PATH` | `config/horizon.php` |
| `INERTIA_SSR_ENABLED` | `config/inertia.php` |
| `INERTIA_SSR_URL` | `config/inertia.php` |
| `LOG_VIEWER_ENABLED` | `config/log-viewer.php` |
| `LOG_VIEWER_API_ONLY` | `config/log-viewer.php` |

⚠️ **As 4 configs próprias do cuidari não documentam suas chaves no `.env.example`.** Cruzando `grep -rhoE "env\('[A-Z][A-Z0-9_]*'" config/ bootstrap/ app/` (146 chaves distintas) com as 49 do `.env.example`, ficam de fora — além dos defaults stock do Laravel — as duas chaves de produto: `FINANCE_RECALCULATE_OVERDUE_CHARGES` (`config/finance.php:22`) e `PLATFORM_SIGNUP_TRIAL_DAYS` (`config/platform.php:16`). Quem clona o repo não descobre que existem.

Outros deltas do arquivo (`diff -u boilerplate/.env.example cuidari/.env.example`):

| Delta | Detalhe |
|---|---|
| ⚠️ `APP_URL` | Continua apontando para o host `.test` do **boilerplate** (`simplify-technology-boilerplate.test`) — nunca foi renomeado no fork. |
| ⚠️ `APP_FALLBACK_LOCALE` | `pt_BR` no cuidari (boilerplate: `en`). Com `lang/` inexistente, o fallback aponta para um locale sem nenhum arquivo de tradução. |
| Blocos de comentário ausentes | O boilerplate documenta e deixa comentados `TRUSTED_PROXIES`, `SESSION_SECURE_COOKIE`, `SESSION_SAME_SITE`, `INERTIA_SSR_*`, `HORIZON_*`, `LOG_VIEWER_*`, `ACTIVITYLOG_*`. Nada disso existe no `.env.example` do cuidari. |

---

### 3. `lang/`

⚠️ **O cuidari não tem diretório `lang/`.** `find . -type d -name lang -not -path './vendor/*' -not -path './node_modules/*'` retorna vazio; não há arquivo JSON de locale na raiz (`ls *.json` → só `boost.json`, `components.json`, `composer.json`, `package.json`, `pint.json`, `tsconfig.json`); `laravel-lang/common` não aparece no `composer.lock` (`grep -c '"name": "laravel-lang/' composer.lock` → 0).

Ainda assim, **6 chamadas `__()` referenciam chaves do namespace `auth`/`passwords`**, que não existem em lugar nenhum do projeto:

| Local | Chamada |
|---|---|
| `app/Http/Requests/Auth/LoginRequest.php:35` | `__('auth.failed')` |
| `app/Http/Requests/Auth/LoginRequest.php:53` | `__('auth.throttle', [...])` |
| `app/Http/Controllers/Auth/ConfirmablePasswordController.php:27` | `__('auth.password')` |
| `app/Http/Controllers/Auth/NewPasswordController.php:54,58` | `__($status)` (chaves `passwords.*` do broker) |
| `app/Http/Controllers/Auth/PasswordResetLinkController.php:31` | `__('A reset link will be sent if the account exists.')` (chave-frase, sem arquivo) |

Como `config/app.php` define `locale` default `'en'` mas o `.env.example` seta `APP_LOCALE=pt_BR` e `APP_FALLBACK_LOCALE=pt_BR`, com um `.env` derivado do exemplo o resolvedor cai num locale `pt_BR` sem arquivos e devolve **a própria chave crua** (`auth.failed`) na tela de login. As mensagens de validação em português vivem espalhadas em `messages()` de 34 dos 53 FormRequests, e nenhum FormRequest usa `attributes()`.

**Boilerplate para comparação** — `lang/pt_BR/`, 4 arquivos, 166 chaves-folha:

| Arquivo | Chaves-folha | Chaves de topo |
|---|---|---|
| `boilerplate/lang/pt_BR/auth.php` | 3 | 3 |
| `boilerplate/lang/pt_BR/pagination.php` | 2 | 2 |
| `boilerplate/lang/pt_BR/passwords.php` | 5 | 5 |
| `boilerplate/lang/pt_BR/validation.php` | 156 | 111 |

(Contagem por `RecursiveIteratorIterator` sobre o array retornado de cada arquivo; "topo" = `count($array)`.)

---

### 4. `.github/` — workflows, actions, dependabot

Estrutura do cuidari (6 arquivos, `find .github -type f`):

```
.github/copilot-instructions.md
.github/skills/inertia-react-development/SKILL.md
.github/skills/pest-testing/SKILL.md
.github/skills/tailwindcss-development/SKILL.md
.github/workflows/ci.yml
.github/workflows/semgrep.yml
```

#### `.github/workflows/ci.yml` (191 linhas, 4 jobs)

| Job | Nome | Triggers | Steps-chave |
|---|---|---|---|
| `frontend` (`:16`) | `Frontend (Node ${{ matrix.node }})` | `push`/`pull_request` em `main`, `develop` | matriz `node: [22]`; `corepack prepare pnpm@11.5.3`; cache pnpm store por `hashFiles('pnpm-lock.yaml')`; `pnpm -s run types`, lint, format:check, vitest, build |
| `backend` (`:73`) | `Backend (PHP ${{ matrix.php }}, Node ${{ matrix.node }})` | idem | matriz `php: [8.4]`, `node: [22]` (comentário `# pode expandir para [20, 22] se quiser`); extensions `sqlite, pdo_sqlite`; `composer validate --strict`; cache composer por `hashFiles('**/composer.lock')`; `cp .env.example .env` + `key:generate`; `./vendor/bin/pest` |
| `quality` (`:146`) | `Code Quality` | idem | `composer validate --strict`, cache composer, `vendor/bin/pint --test` |
| `rector` (`:177`) | `Rector (dry-run)` | idem | `continue-on-error: true`; `rector process --dry-run` |

`permissions: contents: read` (`:9-10`). Sem `concurrency`. Arquivo termina sem newline final.

#### `.github/workflows/semgrep.yml` (55 linhas, 1 job)

`semgrep` / `Static Analysis (Semgrep)`, `runs-on: ubuntu-latest` com `container: semgrep/semgrep`. Triggers: `pull_request` + `push` em `main`/`develop`, `schedule: cron "17 5 * * *"`, `workflow_dispatch`. `permissions: contents: read` + `security-events: write`. Guarda `if: (github.actor != 'dependabot[bot]')`. Usa `SEMGREP_APP_TOKEN` se o secret existir, senão `SEMGREP_RULES=p/default`; publica SARIF como artifact e no Code Scanning (com guarda para PR de fork). **Idêntico ao boilerplate exceto pelo pinning das actions.**

#### Actions — pinning

⚠️ **0 de 16 `uses:` do cuidari usam SHA; todos usam tag móvel.** O boilerplate pina 20 de 20 por SHA de 40 chars com comentário de versão.

| Action | Cuidari | Boilerplate |
|---|---|---|
| `actions/checkout` | `@v4` (5×) | `@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1` |
| `actions/cache` | `@v4` (4×) | `@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0` |
| `actions/setup-node` | `@v4` (2×) | `@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0` |
| `shivammathur/setup-php` | `@v2` (3×) | `@f3e473d116dcccaddc5834248c87452386958240 # v2.37.2` |
| `actions/upload-artifact` | `@v4` (1×) | `@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1` |
| `github/codeql-action/upload-sarif` | `@v3` (1×) | `@d1ba80a13dd99fba24a470575428917156a28b43 # v3` |

#### O que o CI do boilerplate tem e o do cuidari não

| Recurso | Onde no boilerplate |
|---|---|
| ⚠️ Job `security` (Security Audit): `composer audit --locked` + `pnpm audit --prod --audit-level high` | `boilerplate/.github/workflows/ci.yml:224` |
| ⚠️ Gate de migrations em MySQL 8 (service container `mysql:8.0` com healthcheck; roda só `php artisan migrate --force`, suíte segue em SQLite) | `boilerplate/.github/workflows/ci.yml:100-102` |
| ⚠️ `composer ci:stan` (larastan) no job `quality` | `boilerplate/.github/workflows/ci.yml:219` |
| `concurrency: group: ci-… / cancel-in-progress: true` | `boilerplate/.github/workflows/ci.yml:12` |
| Cache do `node_modules/.vite` | `boilerplate/.github/workflows/ci.yml:63` |
| Comentário explicando a ausência deliberada de `paths-ignore` (required checks travariam PR só-docs) | `boilerplate/.github/workflows/ci.yml:3` |
| Node 24 / pnpm 11.19.0 | cuidari está em Node 22 / pnpm 11.5.3 |

#### Dependabot

⚠️ **`.github/dependabot.yml` não existe no cuidari** (`ls .github/dependabot.yml` → *No such file*). O boilerplate tem `boilerplate/.github/dependabot.yml` com 3 ecossistemas (`composer`, `npm`, `github-actions`), `interval: weekly`, `cooldown.default-days: 7` (espelhando o `minimumReleaseAge`), `open-pull-requests-limit: 5` e agrupamento de minor+patch num PR por ecossistema.

#### Templates de issue/PR

⚠️ Ausentes no cuidari. O boilerplate tem `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md` e `.github/PULL_REQUEST_TEMPLATE.md`.

---

### 5. `composer.json` — dependências diretas e scripts

⚠️ `composer.json:3` ainda declara `"name": "simplify-technology/boilerplate"` e `"description": "The skeleton application for the Laravel framework."` — o fork nunca foi renomeado.

#### `require` (9)

| Pacote | Versão | Boilerplate |
|---|---|---|
| `php` | `^8.4` | igual |
| ⭐ `barryvdh/laravel-dompdf` | `^3.1` | **não tem** — única dependência de produção exclusiva do cuidari |
| `inertiajs/inertia-laravel` | `^3.0` | igual |
| `laravel/framework` | `^13.0` | igual |
| `laravel/horizon` | `^5.45` | igual |
| `laravel/tinker` | `^3.0` | igual |
| `opcodesio/log-viewer` | `^3.24` | igual |
| `spatie/laravel-activitylog` | `^5.0` | igual |
| `tightenco/ziggy` | `^2.4` | igual |

#### `require-dev` (12)

| Pacote | Cuidari | Boilerplate |
|---|---|---|
| `fakerphp/faker` | `^1.23` | igual |
| `laradumps/laradumps` | `^5.3` | igual |
| `laravel/boost` | `^2.4` | igual |
| `laravel/pail` | `^1.2.2` | igual |
| `laravel/pint` | `^1.18` | igual |
| `laravel/sail` | `^1.41` | igual |
| `mockery/mockery` | `^1.6` | igual |
| `nunomaduro/collision` | `^8.6` | igual |
| `pestphp/pest` | `^4.1` | ⚠️ boilerplate em `^5.1` |
| `pestphp/pest-plugin-laravel` | `^4` | ⚠️ boilerplate em `^5.0` |
| `phpunit/phpunit` | `^12.5.12` | ⚠️ boilerplate em `^13.0` |
| `rector/rector` | `^2.0` | igual |
| — | ausente | ⚠️ `larastan/larastan ^3.10` |
| — | ausente | ⚠️ `laravel-lang/common ^6.8` |

#### Scripts (15) — todos idênticos ao boilerplate exceto o gate de análise estática

`post-autoload-dump`, `post-update-cmd`, `post-root-package-install`, `post-create-project-cmd`, `format`, `format:check`, `lint`, `lint:fix`, `ci:test`, `ci:lint`, `ci:rector`, `ci:check`, `horizon:terminate`, `dev`, `dev:ssr`.

- ⚠️ `ci:check` = `["@ci:lint","@ci:rector","@ci:test"]`. O boilerplate acrescenta `"@ci:stan"` e define `ci:stan` = `vendor/bin/phpstan analyse --memory-limit=1G`. Não há `phpstan.neon` nem larastan no cuidari.
- `dev` roda 5 processos via `npx concurrently`: `artisan serve`, `horizon:listen`, `schedule:work`, `pail --timeout=0`, `pnpm -s run dev` (`composer.json:85`). `dev:ssr` troca o Vite por `inertia:start-ssr` (`:90`).
- `config.allow-plugins`: `pestphp/pest-plugin`, `php-http/discovery`. `sort-packages: true`, `optimize-autoloader: true`.

---

### 6. `package.json` — dependências diretas, scripts, pnpm

`packageManager`: `pnpm@11.5.3+sha512.…` (boilerplate: `pnpm@11.19.0+sha512.…`).

**Nenhum pacote npm existe só no cuidari e nenhum só no boilerplate** — os dois têm exatamente os mesmos 58 nomes de dependência direta. A diferença é inteiramente de *versão* e de *seção*.

#### `dependencies` (35) — versões que divergem do boilerplate

| Pacote | Cuidari | Boilerplate |
|---|---|---|
| `@inertiajs/react` | `^3.4.0` | `^3.6.1` |
| `@radix-ui/react-avatar` | `^1.1.12` | `^1.2.6` |
| `@radix-ui/react-checkbox` | `^1.3.4` | `^1.3.11` |
| `@radix-ui/react-collapsible` | `^1.1.13` | `^1.1.20` |
| `@radix-ui/react-dialog` | `^1.1.16` | `^1.1.23` |
| `@radix-ui/react-dropdown-menu` | `^2.1.17` | `^2.1.24` |
| `@radix-ui/react-label` | `^2.1.9` | `^2.1.15` |
| `@radix-ui/react-navigation-menu` | `^1.2.15` | `^1.2.22` |
| `@radix-ui/react-select` | `^2.3.0` | `^2.3.7` |
| `@radix-ui/react-separator` | `^1.1.9` | `^1.1.15` |
| `@radix-ui/react-slot` | `^1.2.5` | `^1.3.3` |
| `@radix-ui/react-toggle` | `^1.1.11` | `^1.1.18` |
| `@radix-ui/react-toggle-group` | `^1.1.12` | `^1.1.19` |
| `@radix-ui/react-tooltip` | `^1.2.9` | `^1.2.16` |
| `@tailwindcss/vite` | `^4.3.0` | `^4.3.3` |
| `@types/react` | `^19.2.17` | `^19.2.18` |
| `@types/react-dom` | `^19.2.3` | `^19.2.4` |
| `@vitejs/plugin-react` | `^5.2.0` | `^6.0.5` |
| `concurrently` | `^9.2.1` | `^10.0.4` |
| `globals` | `^15.15.0` | `^17.9.0` |
| `laravel-vite-plugin` | `^2.1.0` | `^3.1.3` |
| `lucide-react` | `^0.475.0` | `^1.28.0` |
| `react` / `react-dom` | `^19.2.7` | `^19.2.8` |
| `tailwindcss` | `^4.3.0` | `^4.3.3` |
| ⚠️ `typescript` | `^5.9.3` — **em `dependencies`** | `^6.0.3` em `devDependencies` |
| `vite` | `^7.3.5` | `^8.2.0` |
| `ziggy-js` | `^2.6.2` | `^2.6.3` |

Iguais nos dois: `@headlessui/react ^2.2.10`, `@radix-ui/themes ^3.3.0`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `react-hot-toast ^2.6.0`, `tailwind-merge ^3.6.0`, `tailwindcss-animate ^1.0.7`.

#### `devDependencies` (20) — divergências

| Pacote | Cuidari | Boilerplate |
|---|---|---|
| `@eslint/js` | `^9.39.4` | `^10.0.1` |
| `@testing-library/jest-dom` | `^6.9.1` | `^7.0.0` |
| `@testing-library/user-event` | `^14.6.1` | `^14.6.3` |
| `@types/node` | `^22.19.21` | `^26.1.2` |
| `@typescript-eslint/*` | `^8.61.0` | `^8.66.0` |
| `@vitest/ui` / `vitest` | `^3.2.6` | `^4.1.10` |
| `eslint` | `^9.39.4` | `^10.8.0` |
| `jsdom` | `^27.4.0` | `^30.0.1` |
| `lint-staged` | `^16.4.0` | `^17.3.0` |
| `prettier` | `^3.8.4` | `^3.9.6` |
| `prettier-plugin-tailwindcss` | `^0.6.14` | `^0.8.1` |

Iguais: `@testing-library/react ^16.3.2`, `chokidar ^5.0.0`, `eslint-config-prettier ^10.1.8`, `eslint-plugin-react ^7.37.5`, `eslint-plugin-react-hooks ^7.1.1`, `husky ^9.1.7`, `prettier-plugin-organize-imports ^4.3.0`.

#### `optionalDependencies` (3) — binários linux para CI/deploy

`@rollup/rollup-linux-x64-gnu` **`4.9.5` (pinado exato)** vs. `4.62.4` no boilerplate; `@tailwindcss/oxide-linux-x64-gnu ^4.3.0` vs `^4.3.3`; `lightningcss-linux-x64-gnu ^1.32.0` vs `^1.33.0`.

#### Scripts (18) — **conjunto idêntico ao do boilerplate, nome a nome e valor a valor**

`build`, `build:ssr`, `dev`, `prepare`, `format`, `format:dirty`, `format:check`, `lint`, `lint:fix`, `types`, `ci:lint`, `test`, `test:run`, `test:ui`, `test:coverage`, `ci:test`, `ci:build`, `ci:check`.

- `ci:lint` = `pnpm -s lint && pnpm -s format:check && pnpm -s types` (`package.json:16`)
- `ci:test` = `LARAVEL_BYPASS_ENV_CHECK=1 pnpm -s test:run` (`package.json:21`)
- `ci:check` = `pnpm -s ci:lint && pnpm -s ci:test && pnpm -s ci:build` (`package.json:23`)
- `lint`/`lint:fix` com `--cache --cache-location node_modules/.cache/eslint --max-warnings=0`

`lint-staged` (`package.json:25-36`): `**/*.php` → `vendor/bin/pint --quiet`; `resources/**/*.{js,jsx,ts,tsx}` → `prettier --write` + `eslint --fix`; `resources/**/*.{css,html,json,md,mdx,scss,yaml,yml}` → `prettier --write`. Idêntico ao boilerplate.

#### `pnpm-workspace.yaml`

```yaml
allowBuilds:
  esbuild: true
minimumReleaseAge: 0
```

⚠️ **`minimumReleaseAge: 0`** — o cuidari **desliga** a proteção supply-chain do pnpm 11, com comentário justificando ("o boilerplate sempre bumpa para o latest"). O boilerplate hoje usa **`10080`** (7 dias) e documenta o escape hatch `pnpm add pacote@x.y.z --config.minimum-release-age=0`. Este é o estado *anterior* do boilerplate congelado no fork, não uma decisão nova do cuidari.

---

### 7. Config adjacente (tooling na raiz)

| Arquivo | Linhas de diff vs boilerplate | Observação |
|---|---|---|
| `pint.json` | 0 | idêntico |
| `rector.php` | 0 | idêntico |
| `.editorconfig`, `.prettierrc`, `.prettierignore`, `.gitattributes`, `laradumps.yaml` | 0 | idênticos |
| `.husky/` (`commit-msg`, `pre-commit`, `pre-push`, `prepare-commit-msg`) | `diff -r` sem saída | idênticos ao boilerplate; hooks exigem ID de issue na branch, bloqueiam commit em `main`/`develop`, `pre-push` roda `composer ci:check` + `pnpm ci:check`, escape via `SKIP_GIT_HOOKS=1` |
| `scripts/` | só falta `scripts/migration/` | `scripts/format/format-dirty.mjs` e `scripts/git/get-issue-id.sh` idênticos |
| `phpunit.xml` | 3 | ⚠️ **sem a testsuite `Arch`** que o boilerplate declara (`<directory>tests/Arch</directory>`) |
| `.gitignore` | 2 | ⚠️ não ignora `identifier.sqlite`; ignora `/.claude/settings.local.json` |
| `vite.config.ts` | 122 | ⚠️ versão bem anterior: sem `loadEnv`, sem `resolveDetectTlsHost`/`resolveDevServerConfig`, sem bypass do plugin Laravel sob Vitest (`process.env.VITEST`), sem `build.reportCompressedSize`, sem `test.include` restringindo o Vitest a `resources/js/**` (ou seja, o Vitest ainda varre `vendor/`) |
| `eslint.config.js` | 5 | ⚠️ sem a regra `react/button-has-type: error` do boilerplate |
| `tsconfig.json` | 2 | usa `"baseUrl": "."`; o boilerplate removeu (nota "removido no TS 7") |
| `components.json` | 4 | ⚠️ `"style": "default"` e `tailwind.config": "tailwind.config.js"` — arquivo que **não existe** (`ls tailwind.config.js` → *No such file*), resquício de Tailwind v3 num projeto Tailwind v4 |
| `boost.json` | 8 | agentes `[cursor, codex, copilot]` (sem `claude_code`); skills `[pest-testing, inertia-react-development, tailwindcss-development]` — sem `infer-conventions`, `laravel-best-practices`, `configuring-horizon` |
| `bootstrap/app.php` | 60 | ⭐ `prependToPriorityList(SubstituteBindings::class, EnsureClinicContext::class)` para o contexto de tenant existir antes do route model binding (404 cross-tenant); aliases `clinic` e `module`. ⚠️ **Sem** `TRUSTED_PROXIES`/`trustProxies`, `SecurityHeaders`, `SetSensitiveCacheHeaders`, `EnsureUserIsActive` e sem o `withExceptions` que renderiza páginas de erro Inertia + carimba headers (`withExceptions` é um no-op `//`). |
| `bootstrap/providers.php` | 0 | idêntico |

### 8. Arquivos versionados que não deveriam estar

⚠️ `git ls-files` confirma **dois artefatos de banco rastreados** na raiz do cuidari:

| Arquivo | Tipo | Tamanho | Adicionado em |
|---|---|---|---|
| `db_cuidari` | `SQLite 3.x database, … 103 database pages, schema 4, UTF-8` (via `file`) | 421.888 bytes | commit `4a16014` — *"[11]: feat(finance): núcleo financeiro da Spec 08 parte 1 + delta de juros/multa"* |
| `identifier.sqlite` | vazio (0 bytes) | 0 | commit inicial `48dff83` |

`db_cuidari` é um banco SQLite real de desenvolvimento commitado no repositório — potencial vazamento de dados de teste/PII. Nenhum dos dois casa com o `.gitignore` do cuidari; o boilerplate já ignora `identifier.sqlite` (`.gitignore`, última linha) mas nada cobriria `db_cuidari`. Existe ainda um diretório `_to_delete/` na working tree, **não rastreado** (`git ls-files _to_delete` → vazio).
## Frontend: páginas, componentes, hooks, utils, tipos, build

Fonte: `/Users/cristianomorgante/workspace/laravel/simplify-technology/cuidari` @ `a7a1170` (working tree limpa, leitura direta do disco).
Comparação: `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate` @ `bc795db` (branch `101-harvest-v2-busca-anunciada`).
Todos os paths abaixo são relativos à raiz do cuidari salvo quando prefixados com `boilerplate/`.

### Números verificados

| Métrica | Valor | Comando |
| --- | --- | --- |
| Páginas (`resources/js/pages/**/*.tsx`) | **41** | `find resources/js/pages -type f -name '*.tsx' \| wc -l` |
| Componentes `.tsx` totais | **101** | `find resources/js/components -type f -name '*.tsx' \| wc -l` |
| Primitivos `components/ui/*.tsx` | **27** | `find resources/js/components/ui -type f -name '*.tsx' \| wc -l` |
| Componentes fora de `ui/` | **74** | `find resources/js/components -type f -name '*.tsx' -not -path '*/ui/*' \| wc -l` |
| Hooks (`resources/js/hooks`) | **16** | `find resources/js/hooks -type f \| wc -l` |
| Utils (`resources/js/utils`) | **7** | `find resources/js/utils -type f \| wc -l` |
| Types (`resources/js/types`) | **14** | `find resources/js/types -type f \| wc -l` |
| Layouts (`resources/js/layouts`) | **10** | `find resources/js/layouts -type f \| wc -l` |
| `resources/js/lib` | **3** | `find resources/js/lib -type f \| wc -l` |
| Arquivos `.ts`/`.tsx` em `resources/js` | **201** | `find resources/js -type f \( -name '*.ts' -o -name '*.tsx' \) \| wc -l` |
| Testes de front (`*.test.*`) | **5** | `find resources/js -name '*.test.*' \| wc -l` |
| Primitivos `ui/` no boilerplate | **31** | `ls boilerplate/resources/js/components/ui \| wc -l` |
| Páginas no boilerplate | **17** | `find resources/js/pages -name '*.tsx' \| wc -l` (no boilerplate) |
| Testes de front no boilerplate | **34** | `find resources/js -name '*.test.*' \| wc -l` (no boilerplate) |

Boilerplate para referência: 50 componentes fora de `ui/`, 14 hooks, 8 utils, 8 types (mesmos comandos, rodados em `boilerplate/`).

### Páginas por módulo

Contagem por diretório: `find resources/js/pages -type f -name '*.tsx' | sed 's|resources/js/pages/||' | awk -F/ 'NF==1{print "(root)"} NF>1{print $1}' | sort | uniq -c`

| Módulo | N | Arquivos | Existe no boilerplate? |
| --- | --- | --- | --- |
| `finance` | 7 | `finance/cash-register.tsx` (367 L), `finance/payables.tsx` (298 L), `finance/receivables.tsx` (366 L), `finance/settings/accounts.tsx`, `finance/settings/categories.tsx`, `finance/settings/credit-cards.tsx`, `finance/settings/suppliers.tsx` | ⭐ não |
| `inventory` | 6 | `inventory/index.tsx` (317 L), `inventory/alerts.tsx`, `inventory/counts.tsx`, `inventory/movements.tsx`, `inventory/product-show.tsx`, `inventory/purchase-suggestions.tsx` | ⭐ não |
| `auth` | 6 | `auth/login.tsx`, `auth/register.tsx`, `auth/forgot-password.tsx`, `auth/reset-password.tsx`, `auth/confirm-password.tsx`, `auth/verify-email.tsx` | sim (6/6) |
| `users` | 5 | `users/index.tsx` (417 L), `users/show.tsx` (320 L), `users/permissions.tsx` (277 L), `users/create.tsx`, `users/edit.tsx` | sim (5/5) |
| `optical-orders` | 4 | `optical-orders/form.tsx` (**772 L**, maior página), `optical-orders/show.tsx` (343 L), `optical-orders/board.tsx` (kanban), `optical-orders/index.tsx` | ⭐ não |
| `settings` | 3 | `settings/profile.tsx` (265 L), `settings/password.tsx`, `settings/appearance.tsx` | sim (3/3) |
| `professionals` | 3 | `professionals/index.tsx` (246 L), `professionals/create.tsx`, `professionals/edit.tsx` | ⭐ não |
| `patients` | 3 | `patients/index.tsx` (331 L), `patients/show.tsx`, `patients/create.tsx` | ⭐ não |
| `retail-sales` | 2 | `retail-sales/pos.tsx` (**662 L**), `retail-sales/index.tsx` (263 L) | ⭐ não |
| `permission-role` | 1 | `permission-role/roles.tsx` (271 L) | sim |
| (raiz) | 1 | `dashboard.tsx` | sim |

- ⚠️ O boilerplate tem `boilerplate/resources/js/pages/errors/error-page.tsx`; o cuidari **não tem** `resources/js/pages/errors/` (`ls resources/js/pages/errors` → *No such file or directory*). Página de erro Inertia é lacuna do cuidari, não candidata a colheita.
- Todas as 41 páginas usam `<Head>` (loop `for f in $(find resources/js/pages -name '*.tsx'); do grep -q '<Head' $f || echo $f; done` → saída vazia).

### Componentes fora de `ui/` — o que o cuidari tem a mais

`comm -23` entre as listas dos dois projetos (paths relativos a `resources/js/components/`): **25 arquivos só no cuidari**, **1 só no boilerplate** (`data-table/date-range-filter.tsx`).

| Grupo | Arquivos (25) | Nota |
| --- | --- | --- |
| `finance/` (6) | `payable-form-dialog.tsx` (228 L), `receivable-form-dialog.tsx`, `settle-dialog.tsx` (264 L), `renegotiate-dialog.tsx`, `reason-dialog.tsx`, `status-badge.tsx` | ⭐ família completa de diálogos de baixa/renegociação, ausente no boilerplate |
| `patients/` (11) | `patient-form.tsx` (**619 L**), `alerts-manager.tsx`, `consent-manager.tsx`, `contact-preferences-manager.tsx`, `duplicate-warning.tsx`, `finance-tab.tsx`, `guardians-manager.tsx`, `patient-alerts-badges.tsx`, `patient-header.tsx`, `prescriptions-tab.tsx`, `purchases-tab.tsx` | ⭐ padrão "manager" (sub-coleção editável dentro de um form) + abas de detalhe |
| `inventory/` (3) | `product-form-dialog.tsx` (246 L), `stock-entry-dialog.tsx` (227 L), `stock-consumption-dialog.tsx` | ⭐ |
| `optical-orders/` (2) | `eye-block.tsx` (218 L), `status-badge.tsx` | ⭐ `eye-block` é entrada de grau OD/OE |
| `retail-sales/` (2) | `payment-dialog.tsx`, `status-badge.tsx` | ⭐ |
| `professionals/` (1) | `professional-form.tsx` (303 L) | ⭐ |

Os outros 49 componentes fora de `ui/` são os mesmos nomes do boilerplate (`app-sidebar`, `nav-main`, `data-table/*`, `permissions/*`, `settings/*`, `users/*`, `layout/page-header`, `empty-state`, `page-info`, `dialogs/module-info-dialog`, …).

Divergência dos arquivos homônimos (`diff -u | wc -l`, linhas de diff — quanto maior, mais afastados):

| Arquivo | Linhas de diff | Quem parece à frente |
| --- | --- | --- |
| `components/app-sidebar.tsx` | 216 | ⭐ cuidari (235 L; carrega o menu de 5 módulos com gating por `module`) |
| `components/ui/date-input.tsx` | 113 | boilerplate (83 L vs 39 L no cuidari) |
| `components/data-table/search-bar.tsx` | 100 | boilerplate (131 L vs 80 L no cuidari) |
| `components/empty-state.tsx` | 83 | boilerplate (48 L vs 44 L; o do cuidari importa `Table` de `@radix-ui/themes`) |
| `hooks/use-permissions.ts` | 34 | boilerplate (removeu o fallback morto para `user.permissions`/`user.role`) |
| `lib/toast-config.ts` | 34 | não avaliado |
| `components/impersonate-banner.tsx` | 28 | não avaliado |
| `utils/format/masks.ts` | 27 | não avaliado |
| `components/delete-confirmation-dialog.tsx` | 21 | não avaliado |
| `types/users.ts` | 18 | não avaliado |
| `types/data-table.ts` | 11 | não avaliado |
| `components/data-table/filter-toggle.tsx` | 10 | não avaliado |
| `utils/data-table/query-params.ts` | 9 | não avaliado |
| Idênticos (diff 0) | — | `data-table/pagination.tsx`, `data-table/table-header.tsx`, `layout/page-header.tsx`, `ui/toast-provider.tsx`, `hooks/use-appearance.tsx`, `lib/utils.ts`, `layouts/app-layout.tsx`, `layouts/permissions/PermissionsGuard.tsx` |

### Primitivos `ui/`

`comm` entre `ls cuidari/resources/js/components/ui | sort` e `ls boilerplate/resources/js/components/ui | sort`:

- **Só no cuidari: 0.** ⚠️ Nada a colher aqui — o cuidari não criou nenhum primitivo que o boilerplate já não tenha.
- **Só no boilerplate: 4** — `confirm-dialog.tsx`, `currency-input.tsx`, `form-field.tsx`, `masked-input.tsx`.
- **Em ambos: 27** — `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `date-input`, `dialog`, `dropdown-menu`, `icon`, `input`, `label`, `navigation-menu`, `placeholder-pattern`, `select`, `separator`, `sheet`, `sidebar` (722 L, o maior arquivo do front), `skeleton`, `table`, `textarea`, `toast-provider`, `toggle-group`, `toggle`, `tooltip`.

⚠️ **Tabela em dois canais.** `grep -rl "@radix-ui/themes" resources/js | wc -l` → **29** arquivos importam `Table`/`Box`/`Flex`/`Tabs` de `@radix-ui/themes`, enquanto `grep -rl "components/ui/table" resources/js | wc -l` → **0**: o primitivo `resources/js/components/ui/table.tsx` existe e **nunca é importado**. Toda tabela real vem do Radix Themes (`components/data-table/table-header.tsx:3`, `components/users/user-table-row.tsx:8`, `components/permissions/role-users-table.tsx:8`, `components/patients/finance-tab.tsx:10`, `components/patients/purchases-tab.tsx:6`, `pages/patients/index.tsx:15`, `pages/professionals/index.tsx:12`). Dois sistemas de tabela coexistindo, um deles morto.

### Hooks

| Arquivo | Existe no boilerplate? | Nota |
| --- | --- | --- |
| `hooks/patients/use-duplicate-check.ts` | ⭐ não | `fetch` debounced (500 ms) contra `route('patients.check-duplicates')` com `AbortController`, XSRF lido do cookie (`hooks/patients/use-duplicate-check.ts:14-18`); CPF bloqueia, celular/nome+nascimento avisam. ⚠️ é um canal HTTP paralelo ao Inertia, com montagem manual de headers em vez de `axios`/`router` |
| `hooks/patients/use-patient-label.ts` | ⭐ não | lê `clinic.segment` das shared props e devolve `{singular, plural, singularLower, pluralLower}`; copy que muda com o segmento (Paciente/Cliente/Tutor) |
| `hooks/use-flash-messages.tsx` | ⚠️ não (o boilerplate substituiu por `boilerplate/resources/js/lib/flash.ts` + `registerFlashListener()` em `app.tsx:21`) | ver bloco abaixo |
| `hooks/useUserSearch.ts` | ⚠️ não — no boilerplate é `hooks/use-user-search.ts` | nome em camelCase viola o kebab-case do `CLAUDE.md`; `export default` (o do boilerplate é named) |
| `hooks/use-permissions.ts` | sim (34 linhas de diff) | cuidari mantém o fallback `user.permissions`/`user.role` que o boilerplate removeu por ler campos nunca eager-loaded |
| `hooks/use-appearance.tsx` | sim (idêntico) | |
| `hooks/use-initials.tsx`, `use-mobile.tsx`, `use-mobile-navigation.ts` | sim | |
| `hooks/permissions/use-permission-actions.ts`, `permissions/use-permission-permissions.ts` | sim | |
| `hooks/settings/use-settings-actions.ts` | sim | |
| `hooks/users/use-user-actions.ts`, `users/use-user-filters.ts`, `users/use-user-modals.ts`, `users/use-user-permissions.ts` | sim | |
| — | ⚠️ falta `use-debounced-value.ts` (existe em `boilerplate/resources/js/hooks/use-debounced-value.ts`) | cada consumidor do cuidari refaz o debounce à mão |

⚠️ **Flash consumido em 34 páginas.** `grep -rl 'useFlashMessages' resources/js | wc -l` → **35** arquivos (1 é a própria definição `hooks/use-flash-messages.tsx`; as outras 34 são páginas que chamam o hook). O hook mantém um `Map` global de flashes já exibidos e um `setInterval` de limpeza pendurado em `window.__flashCleanupInterval` (`hooks/use-flash-messages.tsx:19-34`) para deduplicar — ou seja, a de-duplicação existe *porque* o consumo é por página. O boilerplate já resolveu isso com um listener único no ponto de montagem (`boilerplate/resources/js/app.tsx:19-21`). Guard-rail candidato: proibir consumo de flash em página.

### Utils, lib e tipos

**`resources/js/utils/` (7 arquivos)**

| Arquivo | Boilerplate | Nota |
| --- | --- | --- |
| `utils/format/quantity.ts` | ⭐ não tem | `formatQuantity`, `formatQuantityWithUnit`, `formatUnitCost` — quantidade decimal de 3 casas e custo unitário de 4 casas, formatados sem recalcular (`utils/format/quantity.ts:6,23,31`) |
| `utils/users/permissions.ts` (163 L) | ⭐ não tem | `canDeleteUser`, `PermissionCheckContext` etc. — regras de UX de "quem pode agir sobre quem" (`utils/users/permissions.ts:21`). ⚠️ é autorização espelhada no cliente; o boilerplate deixou essa lógica só no backend |
| `utils/format/money.ts` | sim (divergente) | cuidari tem `previewPercentage` (`:56`), `subtractMoney` (`:70`) e ⚠️ `formatDate` (`:81`) — helper de **data** dentro do módulo de dinheiro, importado assim em `pages/optical-orders/board.tsx:9`. Boilerplate tem `formatCentsToBRL`, `formatCentsToMasked`, `maskCurrencyInput` que o cuidari não tem |
| `utils/format/masks.ts` | sim (27 L de diff) | |
| `utils/data-table/query-params.ts` | sim (9 L de diff) | |
| `utils/users/constants.ts`, `utils/users/user-helpers.ts` | sim | |
| — | ⚠️ faltam `utils/data-table/constants.ts`, `utils/data-table/date.ts`, `utils/via-cep.ts` (existem no boilerplate) | |

**`resources/js/lib/` (3 arquivos)**

| Arquivo | Boilerplate | Nota |
| --- | --- | --- |
| `lib/clinic.ts` (46 L) | ⭐ não tem | `SEGMENT_LABELS` (7 segmentos) + `patientLabel(segment, {plural, lower})` — copy dependente de segmento espelhando `ClinicSegment::label()` do backend (`lib/clinic.ts:6,41`). Coberto por `resources/js/test/lib/clinic.test.ts` |
| `lib/toast-config.ts` | sim (34 L de diff) | |
| `lib/utils.ts` | sim (idêntico) | |
| — | ⚠️ faltam `lib/flash.ts`, `lib/form-styles.ts`, `lib/impersonation.ts`, `lib/resolve-inertia-page.tsx` (existem no boilerplate) | |

**`resources/js/types/` (14 arquivos, 1.963 L totais via `wc -l resources/js/types/*`)**

| Arquivo | L | Boilerplate |
| --- | --- | --- |
| `types/patients.ts` | 343 | ⭐ não |
| `types/finance.ts` | 272 | ⭐ não |
| `types/optical-orders.ts` | 242 | ⭐ não |
| `types/inventory.ts` | 195 | ⭐ não |
| `types/retail-sales.ts` | 189 | ⭐ não |
| `types/professionals.ts` | 63 | ⭐ não |
| `types/users.ts` | 177 | sim (18 L de diff) |
| `types/index.d.ts` | 122 | sim (112 L de diff) |
| `types/data-table.ts` | 82 | sim (11 L de diff) |
| `types/dialogs.ts` | 57 | sim |
| `types/permissions.ts` | 45 | sim |
| `types/settings.ts` | 42 | sim |
| `types/global.d.ts` | 5 | sim |
| `types/vite-env.d.ts` | 1 | sim |

⭐ `types/index.d.ts` traz o contrato multi-tenant que o boilerplate não tem: `ClinicSegment` (7 valores, `:37`), `ModuleName` (18 valores, `:39-57`), `ClinicShared { id, name, segment, enabled_modules }` (`:59`), `clinic: ClinicShared` dentro de `SharedData` (`:70`) e o campo `module?: ModuleName` em `NavItem` (`:34`). É a peça que sustenta o gating de navegação.

⚠️ `SharedData` tem `[key: string]: unknown` (`:73`) e `User` também (`:100`) — index signature que anula o type-check das props compartilhadas (mesmo padrão presente no boilerplate, então é guard-rail comum, não regressão do cuidari).

### Layouts e entrypoints

- 10 layouts, **todos com o mesmo nome dos do boilerplate**: `layouts/app-layout.tsx` (idêntico), `layouts/app/app-header-layout.tsx`, `layouts/app/app-sidebar-layout.tsx`, `layouts/auth-layout.tsx`, `layouts/auth/auth-card-layout.tsx`, `layouts/auth/auth-simple-layout.tsx`, `layouts/auth/auth-split-layout.tsx`, `layouts/permissions/PermissionsGuard.tsx` (idêntico), `layouts/permissions/layout.tsx`, `layouts/settings/layout.tsx`.
- `resources/js/app.tsx` (46 L): usa `resolvePageComponent` de `laravel-vite-plugin/inertia-helpers` direto (`:6,16`). ⚠️ O boilerplate trocou por `lib/resolve-inertia-page.tsx` (`boilerplate/resources/js/app.tsx:5,17`) e **registra o listener de flash** (`boilerplate/resources/js/app.tsx:21`) — as duas coisas faltam no cuidari. O resto (`<Theme>` do Radix com `--default-font-family` Aptos, `<ToastProvider/>`, `progress.color: '#4B5563'`, `initializeTheme()`) é idêntico nos dois.
- `resources/js/ssr.tsx` (33 L): `createServer` + `renderToString`, com o hack `global.route<RouteName>` reconstruindo `ziggy.location` e três `@ts-expect-error` dentro de um bloco `eslint-disable` (`resources/js/ssr.tsx:19-28`). ⚠️ Mesmo shape do boilerplate; o débito é comum.
- `resources/views/`: 4 blades — `app.blade.php` + ⭐ três de impressão que o boilerplate não tem (`resources/views/carnet/a4.blade.php`, `resources/views/carnet/coil80.blade.php`, `resources/views/optical-orders/a4.blade.php`), ou seja, saída em papel A4 e bobina 80 mm gerada por Blade fora do Inertia.

### `resources/css/app.css` — 701 linhas (boilerplate: 713; `diff -u` = 172 linhas)

Estrutura (`grep -n '@import\|@theme\|@layer\|@custom-variant\|@source\|@plugin\|^:root\|^\.dark'`):

| Bloco | Linha | Conteúdo |
| --- | --- | --- |
| `@import './_fonts.css'` | 2 | idêntico ao do boilerplate (`diff -q` → sem diferença) |
| `@import 'tailwindcss'` | 4 | |
| `@import '@radix-ui/themes/styles.css'` | 5 | |
| `@plugin 'tailwindcss-animate'` | 7 | |
| `@source "../views"` + `@source` da paginação | 9-10 | |
| `@custom-variant dark (&:is(.dark *))` | 12 | dark por classe, não por media query |
| `@theme { … }` | 14-70 | **1 único bloco**, **não** `@theme inline`. 32 declarações `--color-*:` (todas no formato `--color-x: var(--x)`), além de `--font-sans`/`--font-title`/`--font-subtitle` (`:17-21`) e `--radius-{sm,md,lg,xl}` (`:23-26`) |
| `@layer base` (border-color compat) | 83-91 | |
| override de fonte do Radix Themes | 94-100 | `:root, .dark, [data-radix-theme]` com `--default-font-family: … !important` |
| `:root` (modo claro) | 105-160 | 45 declarações `--*` |
| `.dark` | 161-208 | 38 declarações `--*` |
| `@layer base` (body/`@apply`) | 209-~230 | |
| scrollbar, dialog, toast | 315-668 | `.custom-scrollbar`, `[data-slot='dialog-content']`, `.toast-*` com variantes `.dark` |

⚠️⚠️ **Colisão real de `--color-*` fora de layer.** Contagens: 32 declarações `--color-*:` dentro do `@theme` (`sed -n '14,70p' … | grep -c '^\s*--color-[a-z0-9-]*:'`) e **6 declarações `--color-*:` fora dele** (`sed -n '71,701p' … | grep -c` → 6), todas em `:root` nas linhas 107-112:

```
resources/css/app.css:107   --color-primary-dark: #0f2a44;
resources/css/app.css:108   --color-primary: #1f3c57;      ← colide com @theme :37 (--color-primary: var(--primary))
resources/css/app.css:109   --color-primary-darker: #2c485e;
resources/css/app.css:110   --color-accent-light: #8ac7e5;
resources/css/app.css:111   --color-accent: #379bcb;       ← colide com @theme :46 (--color-accent: var(--accent))
resources/css/app.css:112   --color-muted-light: #e6e7e8;
```

O `@theme` emite os tokens dentro de `@layer theme`; esse `:root` das linhas 105+ é **sem layer**, então vence a cascata. Resultado: `bg-primary`/`text-primary` resolvem para o hex fixo `#1f3c57` e `bg-accent` para `#379bcb`, **e não acompanham o tema escuro** — o bloco `.dark` (161-208) redefine `--primary`/`--accent` mas nunca `--color-primary`/`--color-accent` (`sed -n '161,209p' … | grep -- '--color-'` só retorna *referências* `var(--color-primary-dark)` etc., nenhuma declaração `--color-*:`). O boilerplate já corrigiu exatamente isso renomeando a paleta-base para `--brand-navy-dark`/`--brand-cyan`/`--brand-gray` (`boilerplate/resources/css/app.css`, mesmo trecho) e adicionou `--brand-cyan-dark` para o anel de foco com contraste 4,72:1, com teste em `boilerplate/resources/js/test/styles/theme-tokens.test.ts` e `boilerplate/resources/js/test/styles/focus-ring.test.ts`. **Guard-rail claro: nenhum `--color-*` pode ser declarado fora do `@theme`.**

Demais diferenças do `diff -u` (172 linhas): o cuidari usa `--ring: var(--color-accent-light)` no claro (o boilerplate mediu 1,85:1 e trocou por `--brand-cyan-dark`) e `--primary-foreground: #ffffff` sobre ciano no escuro (o boilerplate mediu 3,13:1, reprova AA, e trocou por navy). ⚠️ Ambos são defeitos de contraste **vivos no cuidari**.

### `vite.config.ts` (32 linhas) — o mais atrasado do conjunto

| Aspecto | cuidari | boilerplate (119 L) |
| --- | --- | --- |
| Plugins | `laravel()`, `react()`, `tailwindcss()` (`vite.config.ts:8-16`) | mesmos três |
| `input` / `ssr` | `['resources/css/app.css','resources/js/app.tsx']`, ssr `resources/js/ssr.tsx` (`:10-12`) | igual |
| `detectTls` | ⚠️ ausente | `resolveDetectTlsHost(env)`, derivado de `APP_URL` |
| Plugin Laravel sob Vitest | ⚠️ sempre ativo | desligado quando `process.env.VITEST` |
| `test.include` | ⚠️ **ausente** — o Vitest varre também `vendor/` | `['resources/js/**/*.{test,spec}.{ts,tsx}']`, com comentário explicando |
| `build.reportCompressedSize` | ⚠️ ausente (default `true`, CI mais lento) | `!process.env.CI` |
| Dev server / HMR | ⚠️ ausente | `resolveDevServerConfig(command, env)` a partir de `VITE_DEV_SERVER_URL` |
| **Code splitting / `manualChunks`** | **ausente** (não há bloco `build.rollupOptions`) | **também ausente** |
| Alias | `@` → `resources/js`, `ziggy-js` → `vendor/tightenco/ziggy` (`:20-24`) | igual |
| Teste do próprio config | ⚠️ nenhum | `boilerplate/resources/js/test/vite-config.test.ts` |

Nenhum dos dois faz `manualChunks` nem qualquer split manual — nada a colher do cuidari nessa frente.

### `tsconfig.json` (127 linhas)

Praticamente o mesmo arquivo do boilerplate (base do starter Laravel, com todos os comentários). `target/module: ESNext`, `moduleResolution: bundler`, `strict: true`, `noImplicitAny: true`, `isolatedModules: true`, `noEmit: true`, `jsx: react-jsx`, `types: ["vitest/globals"]`, `include` de `resources/js/**`, `exclude: ["node_modules", ".history"]`.

Única diferença material: `tsconfig.json:110` mantém `"baseUrl": "."`, enquanto o boilerplate removeu (comentário lá: *"Sem baseUrl (removido no TS 7): entradas de paths são relativas a este arquivo"*). ⚠️ Como o cuidari está em `typescript ^5.9.3` (boilerplate: `^6.0.3`), isso ainda funciona, mas é débito de migração.

Nenhum dos dois liga `noUnusedLocals`, `noUncheckedIndexedAccess` ou `verbatimModuleSyntax`.

### `eslint.config.js` (95 linhas) e `.prettierrc`

- `.prettierrc` é **byte a byte igual** ao do boilerplate (`printWidth: 150`, `tabWidth: 4`, `singleQuote`, plugins `organize-imports` + `tailwindcss`, `tailwindFunctions: ["clsx","cn"]`).
- `eslint.config.js` é igual ao do boilerplate **exceto por uma regra**: o boilerplate tem `'react/button-has-type': 'error'` (`boilerplate/eslint.config.js:58`, com comentário sobre `<button>` submetendo form por default); o cuidari **não tem** ⚠️.
- Mesmos blocos nos dois: `js.configs.recommended`, TS parser para `**/*.{ts,tsx}`, `react.configs.flat.recommended` + `jsx-runtime`, globais Vitest + `route` do Ziggy, `react-hooks/rules-of-hooks: error` / `exhaustive-deps: warn`, override para `**/*.test.*`, `ignores: ['vendor','node_modules','public','bootstrap/ssr','tailwind.config.js','.history']`, `prettier` por último.
- `package.json`: os scripts (`build`, `build:ssr`, `lint`, `format:check`, `types`, `ci:lint`, `ci:test` com `LARAVEL_BYPASS_ENV_CHECK=1`, `ci:build`, `ci:check`) e o bloco `lint-staged` são **idênticos** aos do boilerplate.

### Inertia v3 — o que o cuidari usa e o que não usa

Versão: `@inertiajs/react` `^3.4.0` (boilerplate: `^3.6.1`).

| Recurso | Uso no cuidari | Paths |
| --- | --- | --- |
| Deferred props (`<Deferred>`) | **não usa** — `grep -rn 'Deferred' resources/js` → 0 ocorrências | — |
| `<WhenVisible>` | **não usa** — 0 ocorrências | — |
| Polling (`usePoll`) | **não usa** — 0 ocorrências | — |
| `<Form>` component | **não usa** — `grep -rn "Form[,}].*from '@inertiajs/react'"` → 0 | — |
| `useHttp` / `setLayoutProps` | **não usa** — 0 ocorrências | — |
| `prefetch` em `<Link>` | **sim, 6 superfícies** | `components/nav-main.tsx:70`, `components/app-sidebar.tsx:211`, `components/app-header.tsx:97`, `components/user-menu-content.tsx:25`, `components/settings/settings-sidebar.tsx:73`, `layouts/settings/layout.tsx:47` |
| `cacheFor` | não usa (0 ocorrências além dos 6 `prefetch` acima) | — |
| Partial reload `only:[…]` | **sim, 5 chamadas** — busca server-driven de produtos/pacientes | `pages/optical-orders/form.tsx:142,143`, `pages/retail-sales/pos.tsx:126,132,136` ⭐ |
| `useForm` | 28 arquivos (`grep -rl 'useForm' resources/js --include='*.tsx' \| wc -l`) | — |
| `router.*` | 32 arquivos | — |
| `preserveScroll` / `preserveState` | 65 / 22 ocorrências | — |
| `<Head>` | 41/41 páginas | — |

⚠️ **Cache de prefetch e impersonation.** O cuidari tem `components/impersonate-banner.tsx` e as 6 superfícies `<Link prefetch>` acima, mas **não tem** o equivalente a `boilerplate/resources/js/lib/impersonation.ts` (que dá `flushAll()` no cache antes de trocar de identidade). `grep -rn 'flushAll\|prefetch' resources/js` não retorna nenhuma invalidação. É o mesmo vazamento que o boilerplate documentou em `boilerplate/resources/js/test/lib/impersonation.test.tsx:43-47`.

⭐ **Padrão de busca por partial reload.** `pages/retail-sales/pos.tsx:126-136` e `pages/optical-orders/form.tsx:142-143` fazem busca de catálogo/paciente com `router.reload({ only: ['products'], data: { product_search: term } })` — combo autocomplete sem endpoint JSON próprio, mantendo tudo no protocolo Inertia. É o oposto do `hooks/patients/use-duplicate-check.ts`, que faz `fetch` cru: ⚠️ dois padrões diferentes para o mesmo problema dentro do mesmo projeto.

⭐ **Atalhos de balcão.** `pages/retail-sales/pos.tsx:216-239`: `useEffect` com listener global de `keydown` — F11 salva orçamento, F12 abre pagamento, com `preventDefault` e cleanup do listener. Comentado como "Spec 17 §Frontend". ⚠️ tem `// eslint-disable-next-line react-hooks/exhaustive-deps` na linha 237.

⭐ **Kanban de O.S.** `pages/optical-orders/board.tsx` — colunas por status com contagem, card com sinalização de atraso (`is_late` → borda âmbar, `board.tsx:26-29`) e `line-clamp` na descrição da lente. Só leitura (cards são `<Link>`), sem drag-and-drop.

### Gating de navegação por módulo ⭐

`components/nav-main.tsx:10-32` filtra os itens do menu em três camadas, na ordem: módulo habilitado → permissão → role.

```
resources/js/components/nav-main.tsx:10   const enabledModules = page.props.clinic?.enabled_modules ?? [];
resources/js/components/nav-main.tsx:15   if (item.module && !enabledModules.includes(item.module)) { … }
resources/js/components/nav-main.tsx:26   if (item.permission) return hasPermission(item.permission);
resources/js/components/nav-main.tsx:31   if (item.role) return hasRole(item.role);
```

`components/app-sidebar.tsx` declara `module:` em **15 itens** de menu (`grep -c` sobre as linhas `module:`): `finance` ×7 (`:54,61,71,97,104,111,118`), `inventory` ×4 (`:174,181,188,195`), `retail_sales` ×2 (`:132,139`), `optical_lab` ×2 (`:153,160`). O boilerplate tem o mesmo `nav-main` sem a camada de módulo — o campo `module?: ModuleName` em `NavItem` e o `clinic.enabled_modules` nas shared props são a diferença.

### Dependências npm

`comm` sobre as chaves de `dependencies`+`devDependencies`: **55 pacotes em cada projeto, conjunto de nomes idêntico** — nenhuma lib exclusiva de um lado. **41 pacotes com versão divergente**, todos com o boilerplate à frente. Os saltos maiores: `vite` `^7.3.5` → `^8.2.0`, `typescript` `^5.9.3` → `^6.0.3`, `vitest`/`@vitest/ui` `^3.2.6` → `^4.1.10`, `eslint` `^9.39.4` → `^10.8.0`, `laravel-vite-plugin` `^2.1.0` → `^3.1.3`, `lucide-react` `^0.475.0` → `^1.28.0`, `jsdom` `^27.4.0` → `^30.0.1`, `@vitejs/plugin-react` `^5.2.0` → `^6.0.5`, `@types/node` `^22` → `^26`, `@inertiajs/react` `^3.4.0` → `^3.6.1`. ⚠️ Nada a colher: é dívida do cuidari, não do boilerplate.

### Testes de front

5 arquivos no cuidari contra 34 no boilerplate:

| Arquivo | Boilerplate tem equivalente? |
| --- | --- |
| `resources/js/test/lib/clinic.test.ts` | ⭐ não (assunto exclusivo do cuidari) |
| `resources/js/test/components/Button.test.tsx` | sim |
| `resources/js/test/hooks/use-permissions.test.ts` | sim |
| `resources/js/test/layouts/permissions/PermissionsGuard.test.tsx` | sim |
| `resources/js/test/utils.test.ts` | sim |
| `resources/js/test/setup.ts`, `resources/js/test/vitest.d.ts` | sim (infra) |

⚠️ **Zero teste** para as 25 famílias de componentes de domínio (finance, patients, inventory, optical-orders, retail-sales), para `utils/format/money.ts`, `utils/format/quantity.ts`, `utils/format/masks.ts`, `utils/users/permissions.ts` ou para os tokens de tema. O boilerplate cobre todos esses assuntos (`boilerplate/resources/js/test/utils/money.test.ts`, `.../utils/masks.test.ts`, `.../styles/theme-tokens.test.ts`, `.../styles/focus-ring.test.ts`, `.../lib/flash.test.ts`, `.../lib/impersonation.test.tsx`, `.../components/link-button-nesting.test.ts`).
## Testes, factories, seeders, análise estática

Fonte: `cuidari` @ `a7a1170` (working tree limpa, leitura do disco = leitura do SHA).
Comparação: `boilerplate` @ `bc795db` (branch `101-harvest-v2-busca-anunciada`).
Todos os números abaixo vieram de comando; o comando está anotado na seção "Comandos usados".

---

### 1. Panorama numérico

| Métrica | cuidari | boilerplate | comando |
|---|---:|---:|---|
| Arquivos `*Test.php` | **95** | 64 | `find tests -name '*Test.php' \| wc -l` |
| Arquivos `.php` em `tests/` (inclui `Pest.php`, `TestCase.php`, `Fixtures/`) | 99 | 66 | `find tests -name '*.php' \| wc -l` |
| Casos Pest declarados (`it('` / `test('` em coluna) | **634** | 341 | `grep -rhoE "^\s*(it\|test\|arch)\('" tests --include='*.php' \| wc -l` |
| Métodos PHPUnit clássicos (`public function test_`) | 13 | 13 | `grep -rhoE "public function test_" tests --include='*.php' \| wc -l` |
| Chamadas `arch()` | **0** ⚠️ | 7 | `grep -rhoE "^\s*arch\(" tests --include='*.php' \| wc -l` |
| LOC de `tests/` | **14.335** | 5.916 | `find tests -name '*.php' \| xargs wc -l \| tail -1` |
| Factories | **36** | 1 | `ls database/factories/*.php \| wc -l` |
| LOC de factories | **1.612** | 43 | `cat database/factories/*.php \| wc -l` |
| Seeders | **11** (1.539 LOC) | 3 + `Concerns/` | `find database/seeders -name '*.php' \| wc -l`, `wc -l` |
| Arquivos de teste frontend | 5 | **34** | `find resources/js -name '*.test.ts*' \| wc -l` |
| Casos de teste frontend | 26 | **217** | `grep -rhoE "^\s*(it\|test)\(" resources/js --include='*.test.ts*' \| wc -l` |
| LOC de testes frontend | 308 | **2.796** | `find resources/js/test -name '*.ts' -o -name '*.tsx' \| xargs cat \| wc -l` |

Nota metodológica: os 634 são **casos declarados**, não expandidos por dataset. 15 arquivos usam `->with(` em 27 pontos (`grep -rlF "})->with(" tests --include='*.php' | wc -l` = 15; `grep -rF "})->with(" ... | wc -l` = 27), então a contagem em execução é maior — não medida (proibido rodar a suíte).

Assertivas por estilo (cuidari, `grep -rF <padrão> tests --include='*.php' | wc -l`):
`expect(` 649 · `assertInertia` 92 · `assertOk` 79 · `toThrow(` 80 · `assertForbidden` 66 · `assertSessionHasErrors` 55 · `assertRedirect` 53 · `assertNotFound` 38 · `assertStatus(403` 6 · `assertSoftDeleted` 3 · `assertGuest` 3 · `assertDatabaseMissing` 1 · `assertDatabaseHas` **0**.
No boilerplate: `assertDatabaseHas` 27, `assertNotFound` 6, `expect(` 265.
⭐ O cuidari trocou `assertDatabaseHas` por `expect()` sobre o model relido — estilo consistente em 649 pontos.
⭐ `assertNotFound` 38× (boilerplate 6×): reflexo direto do padrão multi-tenant "recurso de outra clínica → 404, não 403".

---

### 2. Estrutura de `tests/`

Não existem os diretórios `Arch/`, `Browser/`, `Contract/`, `Casts/`, `Console/`, `Policies/`, `Routes/`, `Seeders/`, `Mail/` — confirmado por `find tests -type d | sort`.

| Diretório | arquivos | casos | conteúdo |
|---|---:|---:|---|
| `tests/` (raiz) | 2 | — | `tests/Pest.php`, `tests/TestCase.php` |
| `tests/Fixtures/` | 2 | — | `TenantTestModel.php`, `TenantTestJob.php` ⭐ |
| `tests/Feature/` (raiz) | 5 | 9 | `DashboardTest` (2), `HorizonAccessTest` (3), `HorizonDevelopmentScriptsTest` (2), `Laravel13ConfigurationDefaultsTest` (2), `ImpersonateTest` (0 Pest — 13 métodos PHPUnit) |
| `tests/Feature/Auth/` | 5 | 16 | Authentication (4), PasswordReset (4), EmailVerification (3), PasswordConfirmation (3), Registration (2) — herdados do starter kit, praticamente idênticos ao boilerplate |
| `tests/Feature/Foundation/` | 12 | 51 | invariantes de plataforma — detalhado em §3 ⭐ |
| `tests/Feature/Finance/` | 17 | 133 | maior módulo, 3.003 LOC |
| `tests/Feature/Inventory/` | 11 | 92 | 2.239 LOC |
| `tests/Feature/OpticalOrders/` | 7 | 80 | 2.068 LOC |
| `tests/Feature/Patients/` | 12 | 80 | 1.537 LOC |
| `tests/Feature/RetailSales/` | 8 | 72 | 1.947 LOC |
| `tests/Feature/Professionals/` | 3 | 25 | Crud (12), UserLink (9), TenantIsolation (4) |
| `tests/Feature/Permissions/` | 3 | 13 | ClinicPermissionsSeed (8), SyncPermissionsCommand (3), GetAllPermissions (2) |
| `tests/Feature/PermissionRole/` | 3 | 7 | AssignRoleAllowlist (3), UpdateRolePermissionsInvalidatesUserCache (3), AssignRoleClearsPermissionCache (1) |
| `tests/Feature/Settings/` | 2 | 7 | ProfileUpdate (5), PasswordUpdate (2) |
| `tests/Unit/` | 7 | 49 | Value Objects e enums — detalhado em §5 |

Per-arquivo dos módulos grandes (`grep -cE "^\s*(it|test)\('" <arquivo>`):

- **Finance** — `ReceivableHttpTest` 17, `ReceivableServiceTest` 13, `CashRegisterTest` 12, `FinanceSettingsHttpTest` 12, `PaymentSettlementTest` 12, `CashRegisterHttpTest` 9, `PayableHttpTest` 9, `RecalculateChargesActionTest` 8, `ReceivableChargesTest` 8, `PatientFinanceTabTest` 6, `RecurringPayableTest` 6, `MarkOverdueReceivablesTest` 5, `ConcurrentSettlementTest` 4, `FinanceOnboardingTest` 3, `FinanceTenantIsolationTest` 3, `FinancialLedgerTest` 3, `PaymentInvariantTest` 3.
- **Inventory** — `InventoryHttpTest` 21, `StockEntryTest` 11, `InventoryCountTest` 10, `StockConsumptionTest` 10, `ComputeAbcCurveTest` 7, `InventoryAlertsTest` 7, `InventoryTenantIsolationTest` 7, `PurchaseSuggestionTest` 7, `StockMovementImmutabilityTest` 5, `InventoryConcurrencyTest` 4, `StockInvariantTest` 3.
- **OpticalOrders** — `OpticalOrderHttpTest` 15, `OpticalOrderLifecycleTest` 14, `PrescriptionTimelineTest` 13, `OpticalOrderPdfTest` 12, `OpticalOrderPrescriptionTest` 11, `OpticalOrderBoardTest` 10, `OpticalOrderTenantIsolationTest` 5.
- **Patients** — `PatientCrudTest` 13, `PatientTenantIsolationTest` 9, `PatientCpfTest` 8, `PatientMinorGuardianTest` 7, `PatientAlertTest`/`PatientConsentTest`/`PatientContactPreferenceTest`/`PatientSearchTest` 6 cada, `PatientDuplicateCheckTest`/`PatientProfessionalScopeTest`/`PatientRecordTabsTest` 5 cada, `PatientRecordNumberTest` 4.
- **RetailSales** — `RetailSaleHttpTest` 20, `RetailSaleLifecycleTest` 14, `CarnetPdfTest` 12, `PatientPurchasesTabTest` 8, `RetailSaleStockTest` 5, `RetailSaleTenantIsolationTest` 5, `SaleNumberServiceTest` 5, `RetailSaleInvariantTest` 3.

---

### 3. `tests/Feature/Foundation/` — a suíte de invariantes (12 arquivos, 51 casos, 886 LOC) ⭐

O boilerplate tem **1** arquivo em `tests/Feature/Foundation/` (`SchemaIdentifierLengthTest.php`, já colhido em rodada anterior — o diff contra o do cuidari é só uma linha de comentário). Os outros 11 são exclusivos do cuidari.

| Arquivo | casos | O que assere |
|---|---:|---|
| `Foundation/BelongsToClinicTest.php` | 7 | Contrato do trait tenant: preenche `clinic_id` do contexto; respeita `clinic_id` explícito; clínica A não enxerga B; **escopo vale também em console** (L49); **não filtra quando não há contexto** (L63); `withoutGlobalScope` faz bypass explícito (L73); exige `clinic_id` explícito ao criar sem contexto (L85). ⚠️ O caso de L63 documenta que sem contexto **não há filtro** — fail-open, não fail-closed. |
| `Foundation/TenantContextJobTest.php` | 2 | Job com `clinic_id` explícito filtra corretamente **mesmo em console**; contextos de jobs distintos não vazam um no outro. Usa `tests/Fixtures/TenantTestJob.php`. ⭐ |
| `Foundation/EnsureClinicContextTest.php` | 5 | Middleware: usuário com clínica passa e o contexto é setado; autenticado sem clínica → 403; `SUPER_USER` sem clínica acessa painel administrativo; `SUPER_USER` com clínica tem contexto setado; contexto isolado entre usuários de clínicas diferentes. |
| `Foundation/EnsureModuleEnabledTest.php` | 4 | Middleware de módulo: libera com módulo ligado; 403 com módulo desligado; **403 sem contexto de clínica mesmo para `SUPER_USER`** (L40); lança para nome de módulo fora do enum (L53). |
| `Foundation/ClinicModelTest.php` | 5 | `hasModule` aceita enum e string; `enabled_modules` nulo = nenhum módulo; casts (`segment`→enum, modules/settings→array); soft delete recuperável; relações users/subscription. |
| `Foundation/MoneyCastTest.php` | 4 | Round-trip `Money`↔decimal string; aceita string decimal validada; `null` round-trip; **rejeita `float` com `InvalidArgumentException`** (L45). Já existe equivalente no boilerplate em `tests/Feature/Casts/MoneyCastTest.php` (4 casos, mesmos nomes). |
| `Foundation/InertiaClinicSharedPropsTest.php` | 3 | Shared props carregam clínica + módulos habilitados; **módulos desabilitados não aparecem** (L27); clínica `null` para `SUPER_USER` sem clínica. |
| `Foundation/FoundationConfigTest.php` | 4 | Config como contrato testável ⭐: filas do supervisor Horizon = `['default','messaging','billing','reports','ai','media']`; **disco `private` sem `url` e sem `visibility`** (L12) — guarda anti-vazamento de storage; `platform.signup.trial_days` int > 0; `CurrentClinic` é singleton **scoped** que morre em `forgetScopedInstances()` (L26). |
| `Foundation/OnboardClinicServiceTest.php` | 8 | Onboarding transacional: cria clínica+owner+assinatura com presets do segmento; trial days default vs explícito; assinatura ativa com período; bloqueia e-mail de owner já existente; **rollback da clínica quando um passo posterior falha** (L107); colisão de slug com sufixo incremental; **slug fica reservado por clínica soft-deleted** (L125); grava activity log. ⭐ |
| `Foundation/OnboardClinicCommandTest.php` | 3 | O mesmo fluxo via `artisan`: sucesso por options; erro claro para e-mail de owner em uso; falha para segmento inválido / plano desconhecido. |
| `Foundation/DatabaseSeederTest.php` | 5 | Seeder como contrato ⭐: planos = `['premium','professional','starter']`, 2 clínicas de lançamento (Dental + Optics), 2 assinaturas, super user sem `clinic_id` e owner com; hub de pacientes semeado para os dois segmentos; **catálogo de estoque só nas clínicas com o módulo ligado**; balcão só com módulo retail; laboratório ótico só com módulo optical. |
| `Foundation/SchemaIdentifierLengthTest.php` | 1 | Varre `Schema::getTables()`→`Schema::getIndexes()` e falha se algum índice passar de 64 chars (limite MySQL) — a suíte roda em sqlite, que não tem o limite. Já presente no boilerplate. |

---

### 4. Padrões de teste que o boilerplate não tem

#### 4.1 Testes de invariante property-based com seed ⭐

Três arquivos parametrizam por **seed** e verificam a invariante em cada passo da sequência, não só no fim:

| Arquivo | casos | invariante | seeds |
|---|---:|---|---|
| `tests/Feature/Inventory/StockInvariantTest.php` | 3 | `products.stock` == Σ entradas − Σ saídas, e nunca negativo (L28); saldo de **cada lote** bate com os movimentos dele e a soma dos lotes bate com o produto (L69); baixa manual nunca empurra saldo abaixo de zero (L116) | `->with([11, 42, 99, 1234, 20260803, 7, 8, 9])` (L63) e `->with([11, 42, 99, 1234, 20260803])` (L114) |
| `tests/Feature/Finance/PaymentInvariantTest.php` | 3 | `paid_amount` == pagamentos confirmados − estornos (L24); invariante + snapshots de encargos limitados em recebível atrasado (L89); **nunca edita a linha do pagamento original ao estornar** (L214) | `->with([11, 42, 99, 1234, 20260727, 7, 8, 9])` (L81), `->with([11, 42, 99, 1234, 20260727])` (L155) |
| `tests/Feature/RetailSales/RetailSaleInvariantTest.php` | 3 | total == Σ itens − desconto para carrinhos aleatórios (L34); desconto nunca empurra total abaixo de zero (L57); desconto percentual incide sobre o total dos itens, não sobre o bruto (L83) | `->with([7, 11, 42, 99, 1234, 20260803])` (L55) |

O comentário em `StockInvariantTest.php:21-27` explicita o padrão: *"O teste é property-based — cada rodada sorteia uma sequência diferente de entradas, baixas e ajustes de contagem e confere a invariante em cada passo, não só no fim (mesmo padrão do PaymentInvariantTest do M3)."*

#### 4.2 Testes de concorrência / row lock ⭐

| Arquivo | casos | o que trava |
|---|---:|---|
| `tests/Feature/Inventory/InventoryConcurrencyTest.php` | 4 | recalcula saldo da **linha travada** e não da instância obsoleta (L24); segunda baixa vai para o próximo lote FEFO quando o primeiro esvazia (L60); relê o produto **dentro** da transação antes de gravar o movimento (L98); **as queries de estoque são construídas com `for update`** (L127, dataset `['lockedProductQuery','lockedBatchQuery']`) |
| `tests/Feature/Finance/ConcurrentSettlementTest.php` | 4 | mesmo trio para baixa financeira (L38/L58/L73) + **query de baixa construída com `for update`** (L98, dataset `['lockedReceivableQuery','lockedPayableQuery']`) |

#### 4.3 Teste de imutabilidade de ledger ⭐

`tests/Feature/Inventory/StockMovementImmutabilityTest.php` (5 casos): recusa `update` (L25); recusa **mass update no model** (L32); recusa `delete` (L40); **nenhuma rota expõe mutação de movimento existente** (L46 — varre o route table); **a policy não tem ability `update` nem `delete`** (L58). É a combinação model + rota + policy no mesmo arquivo — o boilerplate não tem equivalente para nenhuma entidade append-only.

#### 4.4 Padrão `*TenantIsolationTest` replicado por módulo ⭐

6 arquivos, 34 casos somados (`find tests -name '*TenantIsolationTest.php'`):
`Finance` 3 · `Inventory` 7 · `OpticalOrders` 5 · `Patients` 9 · `Professionals` 4 · `RetailSales` 5.

O formato é estável e cobre as quatro rotas de vazamento:
1. listagem escopada (`it('scopes ... to the current clinic')`);
2. leitura/escrita cross-tenant → **404** (`Patients/PatientTenantIsolationTest.php:40,46,59,69,102`);
3. FK cross-tenant recusada no payload (`Inventory/...:132,149`; `RetailSales/...:82`; `OpticalOrders/...:102`; `Patients/...:131,145`);
4. **numeração por clínica começa do 1 independentemente** (`RetailSales/...:117`, `OpticalOrders/...:124`) e **busca/autocomplete não vaza registro de outra clínica** (`RetailSales/...:126`, `OpticalOrders/...:133`, `Professionals/...:57`, `Patients/...:113`).

#### 4.5 Fixtures dedicadas ⭐

- `tests/Fixtures/TenantTestModel.php` — model de negócio fictício (`$table = 'tenant_test_models'`, `use BelongsToClinic`, cast `amount => MoneyCast::class`) usado para exercitar o trait tenant e o cast sem acoplar a suíte a um model de domínio real.
- `tests/Fixtures/TenantTestJob.php` — job que recebe `clinic_id` explícito no construtor, chama `CurrentClinic::set()` no `handle()` e registra em `public static array $seenNames` o que enxergou. Documenta o padrão obrigatório de tenant-awareness em fila.
- A tabela é criada por `createTenantTestModelsTable()` em `tests/Pest.php:347` — DDL transacional no sqlite, desfeita pelo rollback do `RefreshDatabase`.

---

### 5. `tests/Unit/` (7 arquivos, 49 casos, 451 LOC)

| Arquivo | casos | escopo |
|---|---:|---|
| `tests/Unit/MoneyTest.php` | 18 | `Money` value object: cents, parse decimal sem float, rejeita string inválida, aritmética imutável, comparação, formato BRL, JSON, soma variádica, multiplicação por int, **percentual com half-up sem float** (L87), **razão sem perda de precisão em fator grande** (L98), **`allocate` de parcelas sem perder um centavo** (L116) e **soma de qualquer alocação == total** (L130), negação/abs, ordenação. Diff contra `boilerplate/tests/Unit/MoneyTest.php`: **só um comentário** (L105) — já colhido. |
| `tests/Unit/QuantityTest.php` | 9 | `Quantity` com 3 casas: parse/render, rejeita não-3-decimais (dataset `['10.5555','1e3','10,5','abc','']`), soma/subtração sem drift, multiplicação half-up, divisão por int half-up, escala por int, comparações que as regras de estoque usam, formato pt-BR sem cauda de zeros, JSON como string decimal. ⭐ (não existe no boilerplate) |
| `tests/Unit/UnitCostTest.php` | 6 | `UnitCost` com 4 casas: parse/render, deriva custo unitário de total pago por quantidade, valora quantidade de volta em `Money` arredondando ao centavo, **custo médio móvel ponderado pelo saldo** (L36), adota custo de entrada quando não há saldo a ponderar (L48), JSON. ⭐ |
| `tests/Unit/ClinicSegmentTest.php` | 3 | Enum de segmento bate com a tabela de presets da Spec 00 (dataset por segmento), decisões de contrato de lançamento nos presets, label+options para todo case. ⭐ |
| `tests/Unit/ModuleTest.php` | 2 | Enum `Module` expõe os valores canônicos das Specs 00/17/18 e tem label para todo case. ⭐ |
| `tests/Unit/CpfFormatterTest.php` | 5 | `App\Services\CpfFormatter`. O boilerplate tem versão **mais rica** em `tests/Unit/Br/CpfFormatterTest.php` (`App\Support\Br\CpfFormatter`, com casos extras de normalize/format/mask e redação total para valores curtos) — nada a colher aqui. |
| `tests/Unit/PhoneNormalizerTest.php` | 6 | `App\Services\PhoneNormalizer` — E.164, DDD com zero à esquerda, null para curto/vazio. Diff contra `boilerplate/tests/Unit/Br/PhoneNormalizerTest.php`: **só o namespace do import** (`App\Services\` vs `App\Support\Br\`) — já colhido. |

⚠️ Divergência de namespace ainda viva: cuidari tem `CpfFormatter`/`PhoneNormalizer` em `App\Services\`, o boilerplate já moveu para `App\Support\Br\`.

---

### 6. `tests/Pest.php` (359 LOC, `wc -l`) — helpers de persona ⭐

`tests/Pest.php:14-16` — `pest()->extend(Tests\TestCase::class)->use(RefreshDatabase::class)->in('Feature')`. `tests/Unit` **não** recebe `RefreshDatabase` nem o `TestCase` da app.

⚠️ `tests/Pest.php:29-31` (`expect()->extend('toBeOne', ...)`) e `tests/Pest.php:44-47` (`function something() { // .. }`) são **scaffolding do `pest --init` nunca removido**, ainda commitados.

⚠️ 10 arquivos redeclaram `uses(RefreshDatabase::class)` mesmo já coberto pelo `->in('Feature')` (`grep -rn "uses(" tests --include='*.php'`): `Feature/DashboardTest.php:6`, `Feature/Settings/ProfileUpdateTest.php:5`, `Feature/Settings/PasswordUpdateTest.php:6`, `Feature/Auth/{Registration:3,PasswordConfirmation:5,EmailVerification:8,Authentication:5,PasswordReset:7}`, `Feature/Permissions/GetAllPermissionsTest.php:7`, `Feature/PermissionRole/AssignRoleAllowlistTest.php:9`.

**20 funções globais** (`grep -c "^function " tests/Pest.php` = 20): 1 scaffolding (`something`, L44), **16 personas RBAC** e 3 helpers de domínio. O boilerplate tem **5** (`grep -c "^function " boilerplate/tests/Pest.php` = 5: `userWithRole`, `actingAsUserWithRole`, `actingAsSuperUser`, `selectableRoles`, `guestUser`) e nenhum multi-tenant.

| Helper | linha | recorte |
|---|---:|---|
| `createClinicManager(Clinic)` | 53 | role `manager` + `manage_professionals` (mínimo de RBAC da Spec 02) |
| `createClinicReceptionist(Clinic)` | 78 | role `receptionist` sem nenhuma permission |
| `createClinicUserWith(Clinic, Roles, array<Permissions>)` | 98 | ⭐ **base de todos os outros**: `firstOrCreate` do role a partir do enum (`->label()`, `->priority()`), `firstOrCreate` de cada permission, `syncWithoutDetaching`, usuário ativo já ligado à clínica |
| `createPatientsReceptionist` | 127 | `VIEW/CREATE/EDIT_CLIENTS` (sem delete) |
| `createPatientsManager` | 139 | + `DELETE_CLIENTS`, `EXPORT_CLIENTS` |
| `createClinicProfessionalUser` | 153 | `VIEW/EDIT_CLIENTS` — vê só pacientes com vínculo (Spec 03 §14) |
| `createFinanceManager` | 165 | 12 permissions financeiras da Spec 08 |
| `createCashier` | 187 | `VIEW_FINANCIAL`, `CREATE_TRANSACTIONS`, `MANAGE_CASH_REGISTER` — abre/fecha caixa e dá baixa, **não estorna nem renegocia** |
| `createInventoryManager` | 200 | `VIEW/MANAGE_INVENTORY` |
| `createInventoryViewer` | 212 | só `VIEW_INVENTORY` (recorte PROFESSIONAL/AUDITOR) |
| `createSalesOperator` | 223 | 7 permissions de balcão, **sem `APPROVE_TRANSACTIONS`** (não devolve venda concluída) |
| `createSalesSupervisor` | 239 | balcão + `APPROVE_TRANSACTIONS` |
| `createSalesViewer` | 255 | AUDITOR: consulta sem operar |
| `createOpticalOperator` | 270 | 9 permissions — mesma pessoa que vende o óculos |
| `createOpticalViewer` | 288 | AUDITOR: consulta O.S. sem preencher |
| `createOpticalOutsider` | 304 | ⭐ usuário **sem nenhuma** permission de O.S. — o comentário L299-303 explica que o papel é `CLINICAL_ASSISTANT` de propósito, porque *"papel é uma linha só por clínica, e reaproveitar o de outro helper faria este usuário herdar a permission que o teste quer negar"* — armadilha real de suíte RBAC compartilhada, documentada no código |

Helpers de domínio:
- `retailProduct(salePrice, stock, unitCost)` — `tests/Pest.php:318`: cria produto com `Product::factory()->retail()` e dá entrada **pelo `StockService` real** (não por factory de movimento), para o custo médio nascer certo. Depende de `test()->clinic` e `test()->seller`.
- `withClinicContext(Clinic)` — `tests/Pest.php:336`: seta `CurrentClinic` para testar service direto, sem passar pelo middleware.
- `createTenantTestModelsTable()` — `tests/Pest.php:347`.

⚠️ `retailProduct()` depende de propriedades implícitas (`test()->clinic`, `test()->seller`) que não são declaradas em lugar nenhum — acoplamento não tipado, o erro só aparece em runtime.

---

### 7. `tests/TestCase.php` ⚠️ — **regressão contra o boilerplate**

cuidari (`tests/TestCase.php`, 11 linhas):

```php
abstract class TestCase extends BaseTestCase
{
    //
}
```

boilerplate (`tests/TestCase.php`):

```php
protected function setUp(): void
{
    parent::setUp();
    config()->set('inertia.ssr.enabled', false);
    Http::preventStrayRequests();
}
```

⚠️ `grep -rn "preventStrayRequests" tests app` no cuidari retorna **0 ocorrências**: nenhuma guarda contra request HTTP real saindo da suíte, e o SSR do Inertia não é desligado nos testes. Isto é o boilerplate melhor que o derivado — vale conferir na fatia de sync inversa.

Uso de fakes no cuidari (`grep -rF <padrão> tests --include='*.php' | wc -l`):
`RefreshDatabase` 16 · `Notification::fake` 3 · `Event::fake` 2 · `Queue::fake` 0 · `Storage::fake` 0 · `Bus::fake` 0 · `Mail::fake` 0 · `Http::fake` 0 · `travelTo` 0 · `freezeTime` 0 · `mock(` 0 · `partialMock` 0 · `LazilyRefreshDatabase` 0.
⚠️ Zero `travelTo`/`freezeTime` numa base com `MarkOverdueReceivablesTest`, `RecurringPayableTest` e `ReceivableChargesTest` — a manipulação de tempo é feita por outro meio (não investigado nesta frente).
⭐ Zero mocks: a suíte roda o service real contra sqlite em memória, o que explica os 14k LOC e o `retailProduct()` usando `StockService` de verdade.

`beforeEach(` aparece 51 vezes em 51 arquivos (`grep -rc "beforeEach(" tests --include='*.php' | grep -v ':0' | wc -l` = 51).

---

### 8. `phpunit.xml` — banco da suíte

`phpunit.xml` (cuidari) define 2 testsuites (`Unit` → `tests/Unit`, `Feature` → `tests/Feature`), `<source><include><directory>app</directory>`, e o bloco `<php>`:

`APP_ENV=testing` · `APP_MAINTENANCE_DRIVER=file` · `BCRYPT_ROUNDS=4` · `CACHE_STORE=array` · **`DB_CONNECTION=sqlite`** · **`DB_DATABASE=:memory:`** · `MAIL_MAILER=array` · `PULSE_ENABLED=false` · `QUEUE_CONNECTION=sync` · `SESSION_DRIVER=array` · `TELESCOPE_ENABLED=false`.

O bloco `<php>` é **byte-idêntico** ao do boilerplate (comparação visual dos dois outputs). ⚠️ `tests/Arch` não existe no cuidari, então não há testsuite para ele; e ⚠️ suíte 100% sqlite em memória contra produção MySQL — é exatamente o buraco que o `SchemaIdentifierLengthTest` tapa parcialmente, mas só para nomes de índice.

---

### 9. Factories — `database/factories/` (36 arquivos, 1.612 LOC)

Estados por factory (`grep -oE "public function [a-zA-Z0-9_]+\(" <arquivo>` menos `definition`/`configure`):

| Factory | states |
|---|---|
| `ClinicFactory.php` | `dental`, `optics`, `withModules(array)` ⭐ |
| `ProductFactory.php` | `fractional`, `requiresBatch`, `retail`, `inactive` |
| `OpticalOrderFactory.php` | `sentToLab`, `received`, `delivered`, `canceled`, `expectedOn` |
| `PatientFactory.php` | `minor`, `withoutCpf`, `withCpf` |
| `ProfessionalFactory.php` | `withUser`, `inactive`, `notBookableOnline` |
| `ReceivableFactory.php` | `overdue`, `withCharges` |
| `RetailSaleFactory.php` | `sale`, `completed` |
| `ProductBatchFactory.php` | `expiresOn`, `withoutExpiry` |
| `FinancialAccountFactory.php` | `cashDrawer`, `inactive` |
| `FinancialCategoryFactory.php` | `income`, `expense` |
| `PatientAlertFactory.php` | `critical`, `inactive` |
| `PatientConsentFactory.php` | `revoked`, `ofKind` |
| `PatientContactPreferenceFactory.php` | `email`, `optedOut` |
| `ClinicSequenceFactory.php` | `at` |
| `ClinicSubscriptionFactory.php` | `trialing` |
| `CashMovementFactory.php` | `supply` |
| `CashRegisterSessionFactory.php` | `closed` |
| `InventoryCountFactory.php` | `closed` |
| `OpticalOrderEyeFactory.php` | `forEye` |
| `OpticalOrderItemFactory.php` | `service` |
| `PatientGuardianFactory.php` | `secondary` |
| `PayableFactory.php` | `monthly` |
| `PlatformPlanFactory.php` | `inactive` |
| `PatientSourceFactory.php`, `SupplierFactory.php` | `inactive` |
| `StockMovementFactory.php` | `outbound` |
| `UserFactory.php` | `unverified` |
| sem state | `CardFeeTierFactory`, `CreditCardFactory`, `FinancialLedgerEntryFactory`, `InventoryCountItemFactory`, `OpticalOrderPhotoFactory`, `PatientGroupFactory`, `PatientTagFactory`, `PaymentFactory`, `RetailSaleItemFactory` |

⭐ `ClinicFactory::withModules(array<Module|string>)` (`database/factories/ClinicFactory.php:52-62`) normaliza enum ou string para `string` — permite montar uma clínica com recorte arbitrário de módulos numa linha. O `definition()` (L15-30) já deriva `enabled_modules` de `$segment->defaultModuleValues()`, então a factory nasce coerente com o preset de segmento.

⚠️ `database/factories/UserFactory.php` — não tem `declare(strict_types=1)` (é o único junto com a estrutura herdada do starter), e `'is_active' => fake()->boolean()` produz usuário ativo/inativo **aleatório** por default: qualquer teste que crie usuário sem passar `is_active` fica não determinístico se houver middleware de usuário ativo. Todos os helpers de `tests/Pest.php` passam `'is_active' => true` explicitamente — o que confirma que a armadilha é conhecida mas não foi corrigida na raiz. Guard-rail candidato.

⚠️ `UserFactory` gera `cpf_cnpj`/`phone`/`mobile` com `fake()->numerify()` — dígitos verificadores inválidos; qualquer validação de CPF real quebraria o default da factory.

---

### 10. Seeders — `database/seeders/` (11 arquivos, 1.539 LOC)

`database/seeders/DatabaseSeeder.php:16-27` chama, nesta ordem:
`PermissionRoleSeeder` → `PlatformPlanSeeder` → `ClinicSeeder` → `UserSeeder` → `ProfessionalSeeder` → `PatientSeeder` → `FinanceSeeder` → `InventorySeeder` → `RetailSaleSeeder` → `OpticalOrderSeeder`.

| Seeder | LOC | `firstOrCreate`/`updateOrCreate` | `fake()` |
|---|---:|---:|---:|
| `PermissionRoleSeeder.php` | 415 | 2 | 0 |
| `PatientSeeder.php` | 220 | 4 | 0 |
| `InventorySeeder.php` | 172 | 2 | 0 |
| `FinanceSeeder.php` | 166 | 6 | 0 |
| `OpticalOrderSeeder.php` | 151 | 0 | 0 |
| `RetailSaleSeeder.php` | 108 | 0 | 0 |
| `PlatformPlanSeeder.php` | 90 | 1 | 0 |
| `ProfessionalSeeder.php` | 75 | 2 | 0 |
| `ClinicSeeder.php` | 56 | 0 | 0 |
| `UserSeeder.php` | 56 | 0 | 0 |
| `DatabaseSeeder.php` | 30 | 0 | 0 |

⭐ Zero `fake()` nos seeders: o dataset de demo é **determinístico**, e é por isso que `Foundation/DatabaseSeederTest.php` consegue assertar valores exatos (contagem de clínicas, slugs de plano, catálogo por módulo). É o oposto do padrão "seeder com faker" e é o que torna o seeder testável.

⚠️ **Nenhum seeder tem guarda de ambiente.** `grep -rn "environment(\|isProduction\|isLocal" database/seeders/` retorna **0 ocorrências**. `database/seeders/UserSeeder.php:25,39,50` criam usuários com `bcrypt('***')` — senha literal fixa no código — e `database/seeders/ClinicSeeder.php:50` passa `ownerPassword: '***'` para o onboarding. O boilerplate **já resolveu isto**: `boilerplate/tests/Feature/Seeders/GuardsDemoSeedingTest.php` tem 4 casos — semeia normalmente em `testing`; **aborta fora de local/testing sem `SEED_DEMO`**; **exige `SEED_ADMIN_PASSWORD` quando forçado fora de local/testing**; usa a senha do operador quando há opt-in explícito. Guard-rail já existente no boilerplate que o cuidari perdeu/nunca recebeu.

⚠️ `Foundation/DatabaseSeederTest.php:40-41` referencia e-mails de demo fixos (`***@user.com`) — o teste está acoplado ao literal do seeder, o que é intencional mas amarra qualquer mudança de credencial de demo a uma edição de teste.

---

### 11. Análise estática

| Ferramenta | cuidari | boilerplate |
|---|---|---|
| **PHPStan / larastan** | ⚠️ **NÃO EXISTE.** `find . -maxdepth 2 -name 'phpstan*' -not -path './vendor/*'` → vazio. `grep -n "larastan\|phpstan" composer.json` → 0 linhas. Nenhum `ci:stan`. | `phpstan.neon.dist` com `includes: vendor/larastan/larastan/extension.neon`, **`level: 6`**, `paths: [app, database, routes, bootstrap/app.php]`, `excludePaths: [bootstrap/cache]`; `larastan/larastan: ^3.10` em require-dev; script `ci:stan: vendor/bin/phpstan analyse --memory-limit=1G` no `ci:check` |
| **Rector** | `rector.php` — **byte-idêntico ao do boilerplate** (`diff` limpo). Paths `app`, `bootstrap/app.php`, `database`, `routes`; `withPhpVersion(PHP_VERSION_ID)`; regra `TypedPropertyFromStrictConstructorRector`; `withTypeCoverageLevel(0)`; sets `deadCode` + `codeQuality`; skip `RemoveUselessReadOnlyTagRector`; `withPhpSets()` **comentado**. Envolto num `try/catch(InvalidConfigurationException)` que só faz `echo` — ⚠️ config inválida degrada em silêncio (retorna `null`) em vez de falhar. | idêntico |
| **Pint** | `pint.json` — **byte-idêntico ao do boilerplate** (`diff` limpo). Preset `psr12` + ~ dezenas de regras (`binary_operator_spaces` com `align_single_space_minimal` para `=` e `=>`, `braces.position_after_functions_and_oop_constructs: same`, `blank_line_before_statement` com 17 statements, `concat_space: one`, etc.) | idêntico |
| **Semgrep** | `.github/workflows/semgrep.yml` — job diário + PR/push em `main`/`develop`, container `semgrep/semgrep`, `SEMGREP_RULES=p/default` como fallback, upload de SARIF para Code Scanning | também tem (`.github/workflows/semgrep.yml`, versão mais recente — 1758 B vs 1621 B) |
| **TypeScript** | `tsconfig.json` com `strict: true`, `noImplicitAny: true`, `isolatedModules`, `skipLibCheck`. ⚠️ `include` só `resources/js/**` — `vite.config.ts` e `scripts/` **não** são type-checked por `pnpm types` | — |
| **ESLint / Prettier** | `eslint.config.js` (2.964 B), `.prettierrc`, `.prettierignore`; lint-staged em `package.json` (`**/*.php` → `pint --quiet`; `resources/**/*.{js,jsx,ts,tsx}` → prettier + eslint `--max-warnings=0 --fix`) | — |

Versões da toolchain (`composer.json` require-dev):

| pacote | cuidari | boilerplate |
|---|---|---|
| `pestphp/pest` | `^4.1` | `^5.1` |
| `pestphp/pest-plugin-laravel` | `^4` | `^5.0` |
| `phpunit/phpunit` | `^12.5.12` | `^13.0` |
| `larastan/larastan` | — ⚠️ | `^3.10` |
| `laravel-lang/common` | — | `^6.8` |

`composer.json` scripts (cuidari): `ci:lint` = `pint --test`, `ci:rector` = `rector process --dry-run`, `ci:test` = `pest`, `ci:check` = `[ci:lint, ci:rector, ci:test]` — **sem `ci:stan`** ⚠️.

CI (`.github/workflows/ci.yml`): jobs `Frontend` (types → lint → format:check → `ci:test` → build), `Backend` (composer validate → install → build assets → `cp .env.example .env` → `key:generate` → `./vendor/bin/pest`), `Code Quality` (`pint --test`) e `Rector (dry-run)` — ⚠️ o job de Rector está com `continue-on-error: true` (`.github/workflows/ci.yml:180`), então Rector **não bloqueia** o merge. Nenhum step de PHPStan.

Hooks (`.husky/pre-commit`, `.husky/pre-push`): pre-commit roda `pnpm exec lint-staged`; pre-push roda `composer ci:check` e depois `LARAVEL_BYPASS_ENV_CHECK=1 pnpm run ci:check`, com bypass por `SKIP_GIT_HOOKS=1` e checagem de `APP_KEY` antes. ⭐ O pre-push valida a existência de `APP_KEY` no `.env` e dá mensagem acionável (`.husky/pre-push:26-37`).

---

### 12. Testes Arch — comparação direta ⚠️

**cuidari: 0.** `grep -rn "arch(" tests --include='*.php'` retorna vazio; não existe `tests/Arch/`. O Pest 4 já traz o plugin arch por transitividade, então é ausência por escolha/omissão, não por falta de dependência.

**boilerplate: `tests/Arch/ArchTest.php`, 7 chamadas `arch()`:**

| linha | regra |
|---:|---|
| 12 | `arch()->preset()->php()` |
| 13 | `arch()->preset()->security()` |
| 15 | `'App\Enum contém apenas enums'` |
| 19 | `'controllers de ação única são invokable'` |
| 30 | `'models estendem Eloquent Model'` |
| 34 | `'value objects são finais e com tipos estritos'` |
| 39 | `'controllers não fazem query via facade DB'` |

O cuidari tem exatamente o material que essas regras protegem (`App\Enum` grande, controllers single-action, `App\ValueObjects\{Money,Quantity,UnitCost}`) e **nada as trava**. Direção da colheita aqui é boilerplate → cuidari, não o contrário.

Regras arch que o cuidari **justificaria criar** e o boilerplate ainda não tem (a partir do que a suíte do cuidari assere manualmente): "models append-only não expõem `update`/`delete` na policy" (hoje só em `StockMovementImmutabilityTest.php:58`) e "toda query de baixa/movimentação usa `lockForUpdate`" (hoje só em `InventoryConcurrencyTest.php:127` e `ConcurrentSettlementTest.php:98`).

---

### 13. Frontend — Vitest

Config **dentro de `vite.config.ts`** (não há `vitest.config.ts`; `ls` confirma "No such file"). `vite.config.ts:30-35`:

```ts
test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./resources/js/test/setup.ts'],
    css: true,
}
```

`resources/js/test/setup.ts` (38 linhas): importa `@testing-library/jest-dom`; stub global de `route(name, params)` retornando `/${name}?query`; mock de `window.matchMedia`; mock de `localStorage` (getItem/setItem/removeItem/clear); mock de `ResizeObserver`.
`resources/js/test/vitest.d.ts`: `/// <reference types="vitest/globals" />` + `declare global { var route: (name: string, params?: any) => string }`.
⚠️ `params?: any` no `.d.ts` e no setup — `any` explícito num projeto com `strict: true`.

Os 5 arquivos e seus casos (`grep -cE "^\s*(it|test)\(" <arquivo>`):

| arquivo | casos |
|---|---:|
| `resources/js/test/utils.test.ts` | 6 |
| `resources/js/test/lib/clinic.test.ts` | 6 |
| `resources/js/test/components/Button.test.tsx` | 5 |
| `resources/js/test/layouts/permissions/PermissionsGuard.test.tsx` | 5 |
| `resources/js/test/hooks/use-permissions.test.ts` | 4 |
| **total** | **26** |

⚠️ Assimetria brutal: 634 casos backend contra 26 no frontend, num projeto com módulos inteiros de UI (POS, board de O.S., carnê). O boilerplate tem 217 casos em 34 arquivos e é o lado forte aqui. `resources/js/test/lib/clinic.test.ts` é o único arquivo de frontend específico do domínio multi-tenant do cuidari — os outros 4 são os mesmos do boilerplate.

Scripts (`package.json`): `test`, `test:run`, `test:ui`, `test:coverage`, `ci:test` = `LARAVEL_BYPASS_ENV_CHECK=1 pnpm -s test:run`, `ci:check` = `ci:lint && ci:test && ci:build`. Deps de teste: `vitest ^3.2.6`, `@vitest/ui ^3.2.6`, `jsdom ^27.4.0`, `@testing-library/react ^16.3.2`, `@testing-library/jest-dom ^6.9.1`, `@testing-library/user-event ^14.6.1`. Sem coverage threshold configurado (nenhum bloco `coverage` no `vite.config.ts`).

---

### 14. Resumo do que é ⭐ e do que é ⚠️

**⭐ O cuidari tem e o boilerplate não:**

1. `tests/Pest.php:98` — `createClinicUserWith(Clinic, Roles, array<Permissions>)` + 12 personas derivadas, cada uma com o recorte exato da matriz RBAC documentado em comentário.
2. `tests/Feature/{Inventory/StockInvariantTest,Finance/PaymentInvariantTest,RetailSales/RetailSaleInvariantTest}.php` — invariantes property-based parametrizadas por seed, verificadas passo a passo.
3. `tests/Feature/{Inventory/InventoryConcurrencyTest,Finance/ConcurrentSettlementTest}.php` — teste de que a query é construída com `for update` + reload dentro da transação.
4. `tests/Feature/Inventory/StockMovementImmutabilityTest.php` — imutabilidade travada em model + rota + policy no mesmo arquivo.
5. `tests/Feature/Foundation/` (11 arquivos exclusivos) — middleware de tenant, middleware de módulo, cast, shared props, config, onboarding transacional e seeder, todos como contrato testável.
6. `tests/Fixtures/{TenantTestModel,TenantTestJob}.php` — fixtures dedicadas em vez de model de domínio real.
7. 6 arquivos `*TenantIsolationTest.php` com formato replicável (listagem / 404 cross-tenant / FK recusada / numeração e busca por clínica).
8. `tests/Unit/{QuantityTest,UnitCostTest}.php` — value objects decimais (3 e 4 casas) com custo médio móvel, half-up e alocação sem perda de centavo.
9. Seeders 100% determinísticos (zero `fake()`), o que habilita `Foundation/DatabaseSeederTest.php` a assertar o dataset exato.
10. `database/factories/ClinicFactory.php:52` — `withModules()` normalizando enum|string.

**⚠️ Defeitos/limitações do cuidari que merecem guard-rail (vários já resolvidos no boilerplate):**

1. **Sem PHPStan/larastan** — nenhum arquivo de config, nenhuma dep, nenhum step de CI. Boilerplate está em `level: 6`.
2. **Sem testes Arch** — 0 `arch()`; boilerplate tem 7.
3. `tests/TestCase.php` vazio — sem `Http::preventStrayRequests()` e sem desligar `inertia.ssr.enabled`; boilerplate tem os dois.
4. **Seeders sem guarda de ambiente** e com senha literal fixa; boilerplate tem `GuardsDemoSeedingTest` com 4 casos exigindo `SEED_DEMO`/`SEED_ADMIN_PASSWORD`.
5. `database/factories/UserFactory.php` — `is_active => fake()->boolean()` é fonte de não determinismo; documentos com `numerify()` (DV inválido); sem `declare(strict_types=1)`.
6. `.github/workflows/ci.yml:180` — job Rector com `continue-on-error: true`; `rector.php` engole `InvalidConfigurationException` com `echo` e retorna `null`.
7. `tests/Pest.php:29-47` — `toBeOne` e `function something()` do scaffolding do `pest --init` ainda commitados.
8. 10 `uses(RefreshDatabase::class)` redundantes com o `->in('Feature')` do `tests/Pest.php:16`.
9. `tests/Feature/Foundation/BelongsToClinicTest.php:63` documenta que **sem contexto de clínica o escopo não filtra** (fail-open).
10. Frontend com 26 casos contra 634 do backend; `tsconfig.json` `include` cobre só `resources/js/**` (deixa `vite.config.ts` e `scripts/` fora do `tsc --noEmit`); `params?: any` no `setup.ts`/`vitest.d.ts` sob `strict: true`.
11. Suíte inteira em sqlite `:memory:` contra produção MySQL; a única guarda de dialeto é `SchemaIdentifierLengthTest` (nomes de índice). O boilerplate tem `tests/Unit/Database/MigrationDialectInvariantTest.php`, que o cuidari não tem.
12. Zero `travelTo`/`freezeTime` numa base com vencimento, encargos e recorrência.
13. `App\Services\CpfFormatter` / `App\Services\PhoneNormalizer` — o boilerplate já moveu para `App\Support\Br\` e tem versão mais rica do teste de CPF.

---

### Comandos usados (verificáveis)

```
git -C <cuidari> log -1 --format='%H %ad'                                        # a7a1170…, tree limpa
find tests -type d | sort
find tests -name '*.php' -type f | wc -l                                          # 99
find tests -name '*Test.php' | wc -l                                              # 95
grep -rhoE "^\s*(it|test)\('" tests --include='*.php' | wc -l                      # 634
grep -rhoE "public function test_" tests --include='*.php' | wc -l                 # 13
grep -rn "arch(" tests --include='*.php'                                           # vazio
find tests -name '*.php' | xargs wc -l | tail -1                                   # 14335
ls database/factories/*.php | wc -l                                                # 36
cat database/factories/*.php | wc -l                                               # 1612
find database/seeders -name '*.php' | wc -l ; wc -l database/seeders/*.php          # 11 / 1539
grep -rn "environment(\|isProduction\|isLocal" database/seeders/                    # vazio
grep -rF "preventStrayRequests" tests app                                          # vazio
find . -maxdepth 2 -name 'phpstan*' -not -path './vendor/*'                        # vazio
grep -n "larastan\|phpstan" composer.json                                          # vazio
diff <boilerplate>/rector.php <cuidari>/rector.php                                 # idêntico
diff <boilerplate>/pint.json  <cuidari>/pint.json                                  # idêntico
grep -rhoE "^\s*(it|test)\(" resources/js --include='*.test.ts' --include='*.test.tsx' | wc -l   # 26
find resources/js -name '*.test.ts' -o -name '*.test.tsx' | wc -l                   # 5
grep -rF "})->with(" tests --include='*.php' | wc -l                                # 27 (em 15 arquivos)
grep -rF "beforeEach(" tests --include='*.php' | wc -l                              # 51
```
## DX, ops, docs de agente, git hooks, scripts

Fonte: `/Users/cristianomorgante/workspace/laravel/simplify-technology/cuidari` no SHA `a7a1170` (working tree limpa; leitura direta do disco). Comparação: `/Users/cristianomorgante/workspace/laravel/simplify-technology/boilerplate` em `bc795db` (main). Todos os paths abaixo são relativos à raiz do respectivo repositório.

Legenda: ⭐ = existe/é melhor no cuidari e o boilerplate não tem; ⚠️ = defeito/limitação que merece virar guard-rail.

---

### 1. Resumo de contagens (todas por comando)

| Item | cuidari | boilerplate | Comando |
|---|---|---|---|
| Arquivos em `.ai/rules/` | **0 (diretório não existe)** | 23 | `ls .ai/rules/*.md \| wc -l` (cuidari: `ls: .ai: No such file or directory`) |
| Regras `.cursor/rules/*.mdc` | 13 | 13 | `ls .cursor/rules/*.mdc \| wc -l` |
| `SKILL.md` versionados (fora de node_modules/vendor) | 9 | 30 | `find . -name 'SKILL.md' -not -path './node_modules/*' -not -path './vendor/*' \| wc -l` |
| Diretórios de agente com `skills/` | 3 (`.codex`, `.cursor`, `.github`) | 5 (`.agents`, `.claude`, `.codex`, `.cursor`, `.github`) | `ls -d …/skills \| wc -l` |
| Arquivos `.md` em `docs/` (recursivo) | **29** | 15 | `find docs -name '*.md' \| wc -l` |
| Specs em `docs/specs/` | **22** | 0 (diretório não existe) | `ls docs/specs/*.md \| wc -l` |
| ADRs em `docs/adr/` | 0 (não existe) | 7 | `ls docs/adr/*.md \| wc -l` |
| Linhas totais em `docs/*.md` + `docs/specs/*.md` | **8431** | não contado | `wc -l docs/*.md docs/specs/*.md` |
| Hooks husky versionados | 4 | 4 | `git ls-files .husky \| wc -l` |
| Arquivos em `scripts/` versionados | 2 | 3 | `git ls-files scripts \| wc -l` |
| Workflows em `.github/workflows/` | 2 | 2 | `ls .github/workflows \| wc -l` |
| Arquivos `config/*.php` | **18** | 14 | `ls config/*.php \| wc -l` |
| Arquivos `.php` em `tests/` | 99 | não contado | `find tests -name '*.php' \| wc -l` |
| Milestones na tabela de `docs/specs/90-…` | **13** | — | `grep -cE '^\| *M[0-9]' docs/specs/90-fase1-execution-plan.md` |
| Commits em HEAD | 84 | — | `git rev-list --count HEAD` |

---

### 2. Docs de agente

#### 2.1 `.ai/rules/` — comparação lado a lado

⚠️ **O cuidari não tem `.ai/` de forma alguma.** Verificado com `find . -maxdepth 3 -name '.ai' -not -path './node_modules/*' -not -path './vendor/*'` → saída vazia; `ls .ai` → `No such file or directory`.

Portanto a comparação pedida é assimétrica: **23 arquivos existem só no boilerplate, 0 existem só no cuidari.**

| Arquivo (só no boilerplate) | Assunto (pelo nome do arquivo — conteúdo não lido nesta frente) |
|---|---|
| `.ai/rules/index.md` | índice das regras |
| `.ai/rules/app.md` | camada `app/` |
| `.ai/rules/commands.md` | comandos Artisan |
| `.ai/rules/controllers.md` | controllers |
| `.ai/rules/css.md` | CSS |
| `.ai/rules/enum.md` | enums |
| `.ai/rules/events.md` | events |
| `.ai/rules/js.md` | JS/TS |
| `.ai/rules/listeners.md` | listeners |
| `.ai/rules/middleware.md` | middleware |
| `.ai/rules/migrations.md` | migrations |
| `.ai/rules/models.md` | models |
| `.ai/rules/policies.md` | policies |
| `.ai/rules/providers.md` | service providers |
| `.ai/rules/requests.md` | form requests |
| `.ai/rules/resources.md` | resources |
| `.ai/rules/routes.md` | rotas |
| `.ai/rules/seeders.md` | seeders |
| `.ai/rules/support.md` | `app/Support` |
| `.ai/rules/tests.md` | testes |
| `.ai/rules/traits.md` | traits |
| `.ai/rules/value-objects.md` | value objects |
| `.ai/rules/views.md` | views |

O cuidari cobre parte desse território por outro canal: `docs/03-conventions.md` (81 linhas) — ver §2.4.

#### 2.2 `.cursor/rules/` — 13 arquivos, 12 byte-idênticos ao boilerplate

`diff -rq .cursor/rules <boilerplate>/.cursor/rules` acusa **um único** arquivo diferente: `.cursor/rules/laravel-boost.mdc`. O diff é só de versão de stack (⚠️ ver §2.3). Os 12 restantes são idênticos:

`activitylog-auditing.mdc`, `formatting-and-checks.mdc`, `github-actions-ci-php.mdc`, `github-actions-ci-pnpm.mdc`, `js-dependency-policy.mdc`, `laravel-13-context.mdc`, `mcp-instructions.mdc`, `node-scripts-error-handling.mdc`, `react-conditional-redundancy.mdc`, `semgrep-code-scanning.mdc`, `testing-realistic-coverage.mdc`, `ui-ux-consistency.mdc`.

`.cursor/mcp.json` é byte-idêntico ao do boilerplate (`diff -u` sem saída).

#### 2.3 `AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/laravel-boost.mdc` — stack desatualizada ⚠️

Os três arquivos gerados pelo Boost no cuidari declaram versões que **não batem com o próprio `composer.json` do cuidari**:

- `AGENTS.md:13` → `inertiajs/inertia-laravel (INERTIA) - v2`, enquanto `composer.json:14` exige `"inertiajs/inertia-laravel": "^3.0"`.
- `AGENTS.md:23` → `@inertiajs/react (INERTIA) - v2`, enquanto `package.json:61` traz `"@inertiajs/react": "^3.4.0"`.
- `AGENTS.md:162` → bloco `=== inertia-laravel/v2 rules ===`.
- Mesmas três divergências em `.github/copilot-instructions.md:13,23` e `.cursor/rules/laravel-boost.mdc:16,37,165`.

⚠️ **Guard-rail candidato:** o artefato gerado pelo Boost (`AGENTS.md` + espelhos) envelhece silenciosamente após um bump de dependência. Nada no CI (`.github/workflows/ci.yml`) checa a coerência entre `composer.json`/`package.json` e as versões declaradas no `AGENTS.md` — o agente lê "v2" e escreve código v2 num app v3.

Fora essas linhas de versão, `diff AGENTS.md <boilerplate>/AGENTS.md` mostra apenas a diferença de Pest (`v4` no cuidari, `v5` no boilerplate) — o corpo das guidelines é o mesmo.

#### 2.4 `CLAUDE.md` — reescrito por completo, orientado a domínio ⭐

O `CLAUDE.md` do cuidari (58 linhas) **não é uma cópia com deltas**: é um arquivo próprio que substitui o do boilerplate. Estrutura, com os pontos que o boilerplate não tem:

| Seção do `CLAUDE.md` do cuidari | Conteúdo | Nota |
|---|---|---|
| "Regra de ouro" (`CLAUDE.md:8-13`) | "Este projeto **estende** o boilerplate. Antes de criar qualquer coisa, verifique o que já existe (RBAC, ActivityLog, Horizon, impersonation, layouts, shadcn). NÃO reescreva o que já está pronto." | ⭐ contrato explícito derivado↔boilerplate; o boilerplate não tem análogo (não precisa, mas o padrão é reusável nos derivados) |
| "Fase atual (leia antes de implementar)" (`CLAUDE.md:15-22`) | aponta `docs/specs/90-fase1-execution-plan.md` como manifesto; "um milestone por sessão/branch"; "**Em conflito entre spec e código existente, pare e pergunte — a spec é contrato**" | ⭐ |
| "Stack (não trocar)" (`CLAUDE.md:24-29`) | lista PHP 8.4/Laravel 13, Inertia, Ziggy, Horizon, ActivityLog, Pest, React 19, SSR | ⚠️ diz "Inertia v2" (`CLAUDE.md:26`) e "Páginas em `resources/js/Pages`" (`CLAUDE.md:29`) — contradiz `docs/03-conventions.md:52-53`, que corrige para `resources/js/pages/{modulo}` minúsculo |
| "Convenções herdadas (resumo)" (`CLAUDE.md:31-41`) | resumo de 10 linhas do AGENTS.md | — |
| "Princípios de domínio" (`CLAUDE.md:43-53`) | 7 princípios numerados: multi-tenant por `clinic_id`; multi-segmento; dinheiro `decimal(12,2)`+VO `Money`; soft delete; auditoria; LGPD; idempotência em integrações | ⭐ princípios invariantes numerados e citáveis |
| "Definition of Done" (`CLAUDE.md:55-58`) | DoD **por entidade**: migration+model+factory+seeder → Form Request → Policy → Service → rota+controller → página React tipada → testes Pest verdes + Pint + Rector | ⭐ o DoD do boilerplate (`<boilerplate>/CLAUDE.md`) é por *gate de CI*; o do cuidari é por *artefato produzido* — os dois são complementares |

#### 2.5 `.claude/` — praticamente vazio ⚠️

`find .claude -type f` retorna **um único arquivo**: `.claude/settings.local.json` (15 linhas). Ele **não é versionado** — `git ls-files .claude` retorna vazio, porque `.gitignore:31` traz `/.claude/settings.local.json`.

Conteúdo (só permissões, nenhum segredo): um bloco `permissions.allow` com `WebSearch`, `mcp__claude_ai_Exa__web_search_exa` e 7 entradas `WebFetch(domain:…)` para sites de concorrentes de software clínico — resíduo da pesquisa que gerou `docs/05-market-benchmark.md`.

Ausentes no cuidari: `.claude/skills/` e `.claude/commands/` (o boilerplate tem 30 arquivos em `.claude/skills/` e `.claude/commands/harvest-v2.md`, ambos **versionados** — `git ls-files .claude` no boilerplate lista os skills).

⭐ `/.claude/settings.local.json` no `.gitignore:31` do cuidari — o boilerplate **não** ignora esse arquivo (`grep -n "claude" <boilerplate>/.gitignore` → nenhuma linha), então settings locais de máquina do boilerplate podem vazar para o repositório. Linha barata de absorver.

#### 2.6 `boost.json` — 3 agentes, 3 skills (boilerplate: 4 agentes, 6 skills)

`boost.json` do cuidari:

```
"agents": ["cursor", "codex", "copilot"]
"skills": ["pest-testing", "inertia-react-development", "tailwindcss-development"]
"guidelines": true, "herd_mcp": true, "mcp": true, "sail": false
```

⚠️ **`claude_code` não está na lista de agentes** — é a causa raiz de `.claude/skills/` não existir. O boilerplate tem `"claude_code"` + as chaves `"cloud": false` e `"nightwatch": false`, e 6 skills (`infer-conventions`, `laravel-best-practices`, `configuring-horizon` a mais).

Skills faltando no cuidari, por diretório de agente (`diff -rq .cursor/skills <boilerplate>/.cursor/skills`): `configuring-horizon`, `infer-conventions`, `laravel-best-practices`. Os 3 skills presentes (`inertia-react-development`, `pest-testing`, `tailwindcss-development`) **diferem** dos do boilerplate — são as versões v2/Pest 4.

---

### 3. `docs/` — a maior diferença de todas ⭐

29 arquivos `.md`, 8431 linhas. Duas camadas.

#### 3.1 Camada de contexto (raiz de `docs/`, 7 arquivos)

| Arquivo | Linhas | Assunto |
|---|---|---|
| `docs/00-overview.md` | 50 | o que é o produto, personas, tabela Módulo → Spec → Núcleo/Plugável |
| `docs/01-architecture.md` | 84 | diagrama ASCII de camadas (HTTP → Form Request → Policy → Service → Model/Events/Jobs/DTOs) |
| `docs/02-data-model.md` | 139 | ⭐ **índice canônico** de tabelas — "os schemas completos (Blueprint) vivem nas specs; este arquivo é o índice **para não haver manutenção dupla**" (`docs/02-data-model.md:6-7`) |
| `docs/03-conventions.md` | 81 | ⭐ ver §3.3 |
| `docs/04-multi-segment.md` | 42 | núcleo agnóstico + módulos plugáveis por segmento |
| `docs/05-market-benchmark.md` | 96 | ⭐ benchmark de 30+ produtos com coluna "qual spec absorve (ou adia) cada prática" |
| `docs/roadmap.md` | 103 | fases 0→N; abre reafirmando o que o boilerplate já entrega e "não reconstruir esses itens" (`docs/roadmap.md:3-7`) |

#### 3.2 Camada de specs (`docs/specs/`, 22 arquivos)

`00-foundation-multitenant-modules` (392 l), `01-tenancy-onboarding` (164), `02-rbac-staff` (240), `03-patients` (540), `04-agenda-scheduling` (504), `05-clinical-record` (555), `06-odontogram-procedures` (351), `07-budgets-quotes` (364), `08-finance` (526), `09-memberships-billing` (255), `10-messaging-marketing` (346), `11-reports-dashboard` (230), `12-ai-copilot` (227), `13-platform-subscriptions` (464), `13a-asaas-platform-billing` (406), `14-session-packages` (282), `15-inventory` (274), `16-online-booking-patient-portal` (272), `17-retail-sales` (294), `18-optical-lab` (339), `90-fase1-execution-plan` (106), `99-cross-spec-risk-review` (705).

Dois deles são de processo, não de produto, e são os candidatos fortes:

**⭐ `docs/specs/90-fase1-execution-plan.md` — manifesto de execução para loop de agente.** Subtítulo literal: "manifesto para `/loop`" (`docs/specs/90-fase1-execution-plan.md:1`). Traz 7 "Regras do loop (guardrails — não negociáveis)" (linhas 9-38) e uma tabela de **13 milestones** com as colunas `# | Branch | Spec(s) | Escopo (recorte) | Fora deste milestone`. Os itens mais transferíveis:

- Regra 1: "Um milestone por sessão e por branch. Não avançar ao próximo milestone na mesma sessão, mesmo que sobre contexto."
- Regra 2: "A spec é contrato. Conflito… → **parar e perguntar**, nunca decidir sozinho e seguir."
- Regra 3 ⭐⭐: "a coluna **'Fora deste milestone' é proibição, não sugestão**. Ela nomeia o **artefato que não deve nascer** — tabela, coluna, job, service, listener, rota. Se ao fim do milestone o artefato citado não existir no repositório, está certo. Implementá-lo 'já que está fácil' é gold-plating, e gold-plating é regressão de prazo." — anti-escopo verificável por existência de arquivo/tabela, não por prosa. A coluna é preenchida com negativas explícitas ("**NÃO** criar `InvoiceProvider`, XML ou emissão de NFC-e/NF-e", M5).
- Regra 5: "Aceite do milestone = tudo verde", com bloco de comandos e a ressalva "Se os scripts do repo divergirem (`composer.json`/`package.json`), os equivalentes do repo prevalecem".
- Regra 6: a seção Cross-cutting de cada spec (tenant, módulo, read-only, audit, timezone, idempotência, LGPD, isolamento) "é obrigatória; os testes de isolamento entram no aceite de TODO milestone".

⚠️ Mesmo com a ressalva da regra 5, os comandos citados em `docs/specs/90-fase1-execution-plan.md:29-33` (`php artisan test --compact`, `pnpm lint && pnpm exec tsc --noEmit`) divergem dos scripts reais do repo (`composer ci:check`, `pnpm ci:check` em `composer.json:77-81` e `package.json:23`) e do fato — registrado no `CLAUDE.md` do boilerplate — de que `pnpm` não está no PATH dos agentes. Um manifesto que lista comandos literais duplica a fonte de verdade dos gates.

⚠️ O milestone M7 (`oniro-etl-golive`) referencia "plano no doc de migração" na coluna Spec, mas **não existe doc de migração em `docs/`**: `grep -rl "Oniro\|ETL" docs/` retorna só `docs/specs/17-retail-sales.md`, `docs/specs/18-optical-lab.md` e o próprio `90-…`; `ls docs/*migra*` não casa nada. Referência pendurada.

**⭐ `docs/specs/99-cross-spec-risk-review.md` (705 linhas) — revisão cruzada de riscos.** Descrita como "checklist de arquitetura, segurança, operação e riscos caros" que roda **antes** da implementação. Abre com uma tabela `Prioridade | Ponto cego | Impacto | Ação recomendada` classificada P0–P3, com regra explícita: "corrigir os itens P0/P1 antes ou durante a implementação das specs afetadas. P2/P3 podem virar backlog, **desde que a decisão seja explícita**". P0s registrados incluem "GlobalScope de tenant ignorado em console/jobs", "Read-only baseado só em verbo HTTP" e "Prontuário editável como CRUD comum"; P1s incluem "Role permission cache sem invalidação por papel" e "Exportação e relatórios sem auditoria de download". `docs/roadmap.md:6` torna a leitura da Spec 99 pré-requisito de qualquer feature nova.

#### 3.3 `docs/03-conventions.md` — o "delta sobre o AGENTS.md" ⭐

Título literal: "Convenções (delta sobre o AGENTS.md do boilerplate)". 81 linhas, 10 seções: Nomes, Dinheiro, Datas/fuso, Multi-tenant, **Autorização (ordem de gates)**, Snapshots & imutabilidade, Integrações, Inertia/React, Testes (Pest), **Estrutura de spec**, Qualidade. Dois trechos com valor direto para o boilerplate:

- Ordem de gates canônica (`docs/03-conventions.md:32-33`): `clinic` → `subscription` (read-only) → `module:x` → Policy (`hasPermissionTo`) → ownership, com "Services de escrita revalidam `canMutate()`".
- Template de spec (`docs/03-conventions.md:73-76`): "Objetivo → Benchmark de mercado → Decisões → Modelo de dados → Enums → Regras de negócio numeradas → Backend → Frontend → Cross-cutting (checklist Spec 99) → Testes → Edge cases → Fora de escopo v1 → Dependências → Branch sugerida."

#### 3.4 ADRs

Nenhum. O cuidari não tem `docs/adr/`; o boilerplate tem 7 arquivos (`docs/adr/README.md` + `0001-rbac-proprio.md`, `0002-ziggy-mantido.md`, `0003-sem-tanstack-query.md`, `0004-sem-telescope.md`, `0005-sem-api-sanctum-por-padrao.md`, `0006-error-tracking-sentry.md`). As "Decisões" do cuidari vivem dentro de cada spec, não em ADRs numerados.

---

### 4. Git hooks (`.husky/`) — o guard de ID de issue está LIGADO

4 hooks versionados (`git ls-files .husky` → 4). `diff -rq .husky <boilerplate>/.husky` **não acusa nenhuma diferença** — os quatro são byte-idênticos aos do boilerplate.

| Hook | O que roda | Guard |
|---|---|---|
| `.husky/pre-commit` | `pnpm -s exec lint-staged` (`.husky/pre-commit:18`); aborta com mensagem se `pnpm` não estiver no PATH (`:13-16`) | `SKIP_GIT_HOOKS=1` pula (`:4-6`) |
| `.husky/pre-push` | `composer ci:check --no-interaction` (`:38`) + `LARAVEL_BYPASS_ENV_CHECK=1 pnpm -s run ci:check` (`:41`); antes disso, exige `APP_KEY` no ambiente ou no `.env`, com instrução de recuperação (`:25-36`) | idem |
| `.husky/commit-msg` | **LIGADO**: bloqueia commit direto em `main`/`develop` (`:35-38`); resolve o ID via `scripts/git/get-issue-id.sh` (`:44`); exige ID na branch (`:46-50`) e ID na 1ª linha nos formatos `[ID]: msg` ou `ID: msg` (`:52-58`). Isenta `Merge`/`Revert`/`fixup!`/`squash!` (`:27-31`) e detached HEAD (`:40-42`) | idem |
| `.husky/prepare-commit-msg` | **Prefixa automaticamente** `[ID]: ` na 1ª linha quando falta (`:49-54`); normaliza `ID: msg`/`ID msg` para `[ID]: msg`; isenta merge/squash | idem |

Hooks efetivamente ativos na máquina: `git config --get core.hooksPath` → `.husky/_`, e `ls .husky/_` mostra os 17 shims instalados. Convenção confirmada no histórico real: `git log -12 --format='%h %s'` mostra 10 de 12 assuntos no formato `[NN]: tipo(escopo): descrição` (ex.: `a7a1170 [22]: fix(optical-lab): quantidade e prisma como o papel brasileiro lê`), os outros 2 sendo merges isentos.

⚠️ Herdado do boilerplate, não específico do cuidari: `pre-commit`/`pre-push` chamam `pnpm` **bare**, enquanto o `CLAUDE.md` do boilerplate registra que `pnpm` não está no PATH dos agentes (só `corepack pnpm`). Um agente que commite via `Bash` cai no `exit 1` de `.husky/pre-commit:14`.

---

### 5. `scripts/`

| Path | Conteúdo | vs. boilerplate |
|---|---|---|
| `scripts/format/format-dirty.mjs` | formatador só do que está sujo, chamado por `package.json:11` (`format:dirty`) e por `composer.json:66` | idêntico (`diff -rq scripts …` não acusa) |
| `scripts/git/get-issue-id.sh` | extrai o ID de issue do nome da branch; consumido por `commit-msg` e `prepare-commit-msg` | idêntico |
| — | — | ⚠️ o boilerplate tem um terceiro, `scripts/migration/status.sh`, que o cuidari não tem (`diff -rq scripts` → `Only in <boilerplate>/scripts: migration`) |

Não há `Makefile`, `makefile` nem `Taskfile*` (`ls Makefile Taskfile* makefile` → `no matches found`). O runner é `composer` + `pnpm`.

---

### 6. `composer.json` — script `dev` e gates

`composer.json:83-91` (`dev`) e `:87-94` (`dev:ssr`) são **byte-idênticos** aos do boilerplate:

```
dev      → concurrently: php artisan serve | php artisan horizon:listen | php artisan schedule:work | php artisan pail --timeout=0 | pnpm -s run dev
dev:ssr  → pnpm build:ssr, depois: serve | horizon:listen | schedule:work | pail | php artisan inertia:start-ssr
```

⚠️ Divergências de gate contra o boilerplate:

| | cuidari | boilerplate |
|---|---|---|
| `ci:check` | `@ci:lint`, `@ci:rector`, `@ci:test` (`composer.json:77-81`) | `@ci:lint`, `@ci:rector`, **`@ci:stan`**, `@ci:test` |
| PHPStan/larastan | **ausente** (`ls phpstan*` → nada; `larastan/larastan` não está em `require-dev`) | `larastan/larastan ^3.10` + `phpstan.neon.dist` + script `ci:stan` |
| Pest | `^4.1` / plugin `^4` / phpunit `^12.5.12` | `^5.1` / `^5.0` / `^13.0` |
| i18n | — | `laravel-lang/common ^6.8` + diretório `lang/` (o cuidari não tem `lang/`) |
| `name` | `"simplify-technology/boilerplate"` ⚠️ — o pacote nunca foi renomeado para o projeto | `"simplify-technology/boilerplate"` |
| Extra em produção ⭐ | `barryvdh/laravel-dompdf ^3.1` (`composer.json:13`) — usado para PDF de carnê e da O.S. (M5/M6) | ausente |

Comum aos dois: `laravel/horizon ^5.45`, `opcodesio/log-viewer ^3.24`, `spatie/laravel-activitylog ^5.0`, `tightenco/ziggy ^2.4`, `laravel/boost ^2.4`, `laradumps/laradumps ^5.3`.

---

### 7. `README.md`

⚠️ **Não existe.** `ls README*` → `no matches found`; `git ls-files README.md` → 0. E `.gitattributes:10` ainda carrega a linha `README.md export-ignore`, apontando para um arquivo inexistente. O boilerplate tem `README.md` (4688 bytes). Um projeto com 84 commits, 22 specs e 13 milestones não tem porta de entrada.

---

### 8. Deploy, backups, healthcheck

| Frente | Achado |
|---|---|
| Deploy (Ploi/Forge/Docker/nginx/supervisor/compose) | ⚠️ **nada versionado.** `git ls-files \| grep -iE 'deploy\|ploi\|forge\|docker\|Dockerfile\|compose\|nginx\|supervisor'` retorna apenas `composer.json`, `composer.lock`, `scripts/format/format-dirty.mjs`, `scripts/git/get-issue-id.sh` (falsos positivos do grep por substring). Zero stub de deploy, zero doc de deploy. |
| Stubs de env | `.env.example` existe e é **mais pobre** que o do boilerplate: `diff -u .env.example <boilerplate>/.env.example` mostra 0 linhas exclusivas do cuidari e 4 blocos exclusivos do boilerplate — `TRUSTED_PROXIES`, hardening de sessão (`SESSION_SECURE_COOKIE`/`SESSION_SAME_SITE`), Inertia SSR (`INERTIA_SSR_ENABLED`/`INERTIA_SSR_URL`), Horizon (`HORIZON_PATH`), log-viewer e activitylog. ⚠️ O cuidari usa `PLATFORM_SIGNUP_TRIAL_DAYS` em `config/platform.php:16` e essa chave **não está documentada no `.env.example`**. |
| Backups | ⚠️ nada. Nenhum pacote de backup em `composer.json`, nenhum job/command de backup em `routes/console.php`. |
| Healthcheck | `bootstrap/app.php:18` → `health: '/up'` (rota padrão do Laravel 13). Nenhum healthcheck de dependência (Redis/fila/disk) além disso. |

---

### 9. Observabilidade

`grep -ril "sentry\|telescope\|pulse\|bugsnag\|flare\|opcodes\|nightwatch" config/ composer.json bootstrap/` → só `composer.json` e `config/log-viewer.php`.

| Ferramenta | Estado no cuidari | Path |
|---|---|---|
| **Horizon** | instalado e configurado; dashboard protegido por gate | `composer.json:16`; `config/horizon.php`; `app/Providers/HorizonServiceProvider.php:27` → `Gate::define('viewHorizon', fn(?User $user) => $user?->hasRole(Roles::SUPER_USER) ?? false)` |
| **Horizon — filas nomeadas** ⭐ | `config/horizon.php:202` → `'queue' => ['default', 'messaging', 'billing', 'reports', 'ai', 'media']`. O boilerplate tem `['default']` na mesma linha (`diff` confirma que essa é a **única** diferença entre os dois `config/horizon.php`). Filas por domínio, para que relatório pesado não bloqueie mensageria. |
| **`horizon:snapshot`** | agendado a cada 5 min — `routes/console.php:12` |
| **Log viewer (opcodesio)** | instalado; acesso restrito a SUPER_USER — `app/Providers/AppServiceProvider.php:84` → `LogViewer::auth(fn($request) => $request->user()?->hasRole(Roles::SUPER_USER))`. Idêntico ao boilerplate (`<boilerplate>/app/Providers/AppServiceProvider.php:56`). |
| **ActivityLog (spatie)** | instalado, `config/activitylog.php` presente e byte-idêntico ao do boilerplate |
| **Sentry / Telescope / Pulse / Bugsnag / Nightwatch** | ⚠️ **nenhum**. O boilerplate registrou a decisão em `docs/adr/0004-sem-telescope.md` e `docs/adr/0006-error-tracking-sentry.md`; no cuidari não há ADR nem instalação — error tracking em produção é ponto cego não decidido. |
| **LaraDumps** | `laradumps.yaml` presente e byte-idêntico ao do boilerplate |

**Scheduler (`routes/console.php`, 33 linhas)** ⭐ — 6 entradas, todas comentadas com a spec de origem e com a razão do horário:

- `Schedule::command('horizon:snapshot')->everyFiveMinutes()` (`:12`)
- `Schedule::job(new MarkOverdueReceivables())->dailyAt('03:10')` (`:17`)
- `Schedule::job(new GenerateRecurringPayables())->dailyAt('03:20')` (`:18`)
- `Schedule::job(new ScanExpiringBatches())->dailyAt('03:30')` (`:28`)
- `Schedule::job(new ComputeAbcCurve())->monthlyOn(1, '03:40')` (`:29`)
- ⭐ **agendamento sob feature flag** (`:22-24`): `if (RecalculateOverdueCharges::enabled()) { Schedule::job(new RecalculateOverdueCharges())->dailyAt('03:15'); }` — "opcional e OFF por default: com a chave desligada o job nem chega a ser agendado". O flag mora no próprio job, não numa string de config espalhada.
- ⭐ Comentário de contrato multi-tenant × fuso (`:14-16`): "os jobs iteram clínica a clínica e resolvem 'hoje' no fuso de cada uma, então o horário do scheduler é só o gatilho — a correção da data está dentro do job."

---

### 10. Higiene do repositório ⚠️

| Achado | Evidência |
|---|---|
| ⚠️ **Banco SQLite de 421 KB versionado na raiz** | `git ls-files -- db_cuidari` → `db_cuidari`; `file db_cuidari` → "SQLite 3.x database … 103 database pages". Arquivo `db_cuidari` (sem extensão) no root, rastreado pelo git. Não foi aberto (pode conter PII de seed/uso real). Guard-rail óbvio: padrão de `.gitignore` para artefato de banco + regra de que dump/DB não entra em repositório. |
| ⚠️ **`identifier.sqlite` versionado** | `git ls-files -- identifier.sqlite` → rastreado; `file` → "empty". O boilerplate resolveu isso: a **única** diferença de `.gitignore` entre os dois é que o boilerplate adicionou `identifier.sqlite` (e removeu a linha do `.claude`). |
| ⚠️ **Diretório `_to_delete/` na raiz** | `find _to_delete -type f` → `_to_delete/_audit-git.tar.gz`. **Não** rastreado (`git ls-files _to_delete \| wc -l` → 0), mas também não ignorado — aparece sujo em `git status` de quem clona e roda auditoria. |
| ⚠️ `composer.json:3` ainda diz `"name": "simplify-technology/boilerplate"` | projeto derivado nunca renomeado |
| ⚠️ `.gitattributes:10` referencia `README.md` inexistente | ver §7 |

---

### 11. Configuração de qualidade — o que empatou e o que ficou para trás

`diff` arquivo a arquivo contra o boilerplate:

| Arquivo | Resultado | Nota |
|---|---|---|
| `.editorconfig`, `.gitattributes`, `.prettierrc`, `.prettierignore`, `pint.json`, `rector.php`, `laradumps.yaml` | **idênticos** | — |
| `.husky/*` (4 hooks), `scripts/*` (2), `.cursor/mcp.json`, `.cursor/rules/*` (12 de 13) | **idênticos** | — |
| `phpunit.xml` | difere: falta a testsuite `Arch` (`ls tests/Arch` → não existe). Suítes do cuidari: Unit, Feature | ⚠️ sem testes de arquitetura |
| `pnpm-workspace.yaml` | cuidari: `minimumReleaseAge: 0` com comentário justificando desligar a proteção. Boilerplate: `minimumReleaseAge: 10080` (7 dias) com receita de bypass pontual | ⚠️ cuidari **sem** proteção supply-chain do pnpm |
| `components.json` | cuidari: `"style": "default"` e `"tailwind.config": "tailwind.config.js"` (arquivo que não existe — Tailwind v4). Boilerplate: `"new-york"` e `"config": ""` | ⚠️ config apontando para arquivo fantasma |
| `eslint.config.js` | difere só pela regra que o boilerplate adicionou depois: `'react/button-has-type': 'error'` | — |
| `vite.config.ts` | cuidari tem 32 linhas; boilerplate 119. Faltam no cuidari: `detectTls` derivado do `APP_URL`, bypass do plugin Laravel sob Vitest, `test.include: ['resources/js/**/*.{test,spec}.{ts,tsx}']` (⚠️ sem isso o Vitest varre `vendor/`), `build.reportCompressedSize: !process.env.CI` e `server` derivado de `VITE_DEV_SERVER_URL` | ⚠️ |
| `package.json` | scripts e `lint-staged` **idênticos**; só as versões de dependência e o `packageManager` (pnpm 11.5.3 vs 11.19.0) divergem | — |
| `.github/workflows/ci.yml` | cuidari é a versão antiga: sem `concurrency`, sem SHA-pinning das actions, Node 22 (boilerplate: 24), sem serviço MySQL + gate de migrations, sem job `security` (`composer audit --locked` + `pnpm audit --prod --audit-level high`), sem cache do Vite, sem step PHPStan | ⚠️ CI atrás em 6 frentes |
| `.github/workflows/semgrep.yml` | difere só pelo SHA-pinning das actions | — |
| `.github/` (estrutura) | ⚠️ cuidari **não tem** `ISSUE_TEMPLATE/`, `PULL_REQUEST_TEMPLATE.md` nem `dependabot.yml` (o boilerplate tem os três) | — |
| Ausentes no cuidari e presentes+versionados no boilerplate | `.mcp.json` (`git ls-files .mcp.json` no boilerplate → 1), `.mise.toml` (→ 1), `.agents/`, `lang/`, `phpstan.neon.dist` | — |

---

### 12. Configs de domínio como superfície de ops ⭐

18 arquivos em `config/` contra 14 do boilerplate. Os 4 exclusivos (`diff <(ls config) <(ls <boilerplate>/config)`): `cuidari.php`, `finance.php`, `inventory.php`, `platform.php`.

**⭐ `config/cuidari.php` (50 linhas) — allowlist de papéis como config, não como código.** Duas listas, `enabled_roles` (13 papéis) e `optional_roles` (6 papéis financeiros departamentais), consumidas por `RoleFilterService::allowedRoleNames()`. O comentário do arquivo (`config/cuidari.php:8-22`) documenta a decisão: os papéis de vendas do boilerplate (`sales_manager`, `account_executive`, `sales_rep`, `customer_support`) foram **removidos do enum** por não se aplicarem a clínicas; os financeiros continuam no enum porém **dormentes** — "para habilitar, basta mover o papel para `enabled_roles`". Também marca `Roles::VISITOR` com "fallback de `revokeRole()` — manter sempre" (`:28`). É exatamente o mecanismo que um derivado precisa para podar o RBAC do boilerplate sem forkar o enum.

`config/platform.php` (19 linhas) é o menor: só `signup.trial_days` via `env('PLATFORM_SIGNUP_TRIAL_DAYS', 7)`, com comentário citando as Specs 00/01/13 — padrão de config que referencia a spec de origem.

---

### 13. Fatos ⭐ e ⚠️ condensados

**⭐ Existe no cuidari e o boilerplate não tem:**

1. `docs/specs/90-fase1-execution-plan.md` — manifesto de execução para loop de agente: 7 guardrails não-negociáveis + tabela de 13 milestones com coluna "Fora deste milestone" tratada como proibição de artefato.
2. `docs/specs/99-cross-spec-risk-review.md` — revisão cruzada de riscos P0–P3 executada **antes** de implementar, com regra de que P2/P3 só viram backlog por decisão explícita.
3. `docs/03-conventions.md` — documento "delta sobre o AGENTS.md do boilerplate", incluindo ordem canônica de gates e template de estrutura de spec.
4. `docs/02-data-model.md` — índice canônico de tabelas com regra anti-manutenção-dupla (schemas moram nas specs).
5. `docs/05-market-benchmark.md` — benchmark de 30+ concorrentes mapeado spec a spec.
6. `CLAUDE.md:8-13` "Regra de ouro" (não reescrever o que o boilerplate já entrega) + `CLAUDE.md:55-58` DoD por artefato.
7. `routes/console.php:22-24` — agendamento sob feature flag (`Job::enabled()`), com o job nem entrando no scheduler quando desligado; e `:14-16` o contrato "scheduler é gatilho, fuso resolve dentro do job".
8. `config/horizon.php:202` — 6 filas nomeadas por domínio em vez de `['default']`.
9. `config/cuidari.php` — allowlist de papéis em config, com papéis dormentes documentados.
10. `.gitignore:31` — `/.claude/settings.local.json` ignorado (o boilerplate não ignora).

**⚠️ Guard-rails candidatos:**

1. `db_cuidari` (SQLite 421 KB) e `identifier.sqlite` **versionados**; `_to_delete/_audit-git.tar.gz` largado no root.
2. `AGENTS.md`/`copilot-instructions.md`/`laravel-boost.mdc` declaram Inertia v2 enquanto `composer.json:14`/`package.json:61` já estão em v3 — nada no CI checa essa coerência.
3. `boost.json` sem `claude_code` → `.claude/skills/` inexistente; 3 skills contra 6.
4. Sem `README.md` (com `.gitattributes:10` ainda apontando para ele).
5. Sem error tracking (Sentry/Telescope/Pulse/Bugsnag) e sem ADR registrando a não-decisão.
6. Sem nada de deploy/backup versionado; healthcheck só o `/up` padrão.
7. `pnpm-workspace.yaml` com `minimumReleaseAge: 0` (proteção supply-chain desligada).
8. `vite.config.ts` sem `test.include` → Vitest varre `vendor/`.
9. `components.json` aponta `tailwind.config.js` inexistente.
10. Sem `tests/Arch`, sem PHPStan/larastan, `ci:check` com 3 gates em vez de 4.
11. `composer.json:3` ainda com o nome do pacote do boilerplate.
12. `docs/specs/90-…` M7 referencia "doc de migração" que não existe em `docs/`; e lista comandos de gate divergentes dos scripts reais do repo.
13. Hooks chamam `pnpm` bare, incompatível com o PATH dos agentes (herdado do boilerplate).
