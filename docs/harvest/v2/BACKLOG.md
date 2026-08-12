# Harvest v2 — BACKLOG

Candidatos **aprovados na verificação adversarial**, priorizados por impacto × generalidade ÷ risco.

Classificação: `[absorver]` · `[guard-rail]` · `[dep-nova]` (exige aprovação do dono) · `[proposta-adr]` · `[rejeitado]`

> Nenhuma evidência aqui pode conter segredo ou PII. Valores sensíveis vão redigidos com `***`.
>
> **O escopo registrado é o CORRIGIDO pelas 3 lentes, não o proposto pelo caçador.** Onde a lente derrubou parte do candidato, a redução está anotada. Fatia que reabrir o escopo original está errada.

## Aplicáveis agora — ctfinance (dimensões 1–3)

Ordenados por (impacto × generalidade) ÷ risco. Fonte de todos: ctfinance @ `b8c6d57`.

### ~~A1~~ ✅ APLICADO · PR [#52](https://github.com/Simplify-Technology/boilerplate/pull/52) · `[guard-rail]` `can:` em toda rota de escrita autenticada · P · risco baixo

- **Origem:** `routes/web.php:99-102` — `POST users/{user}/impersonate` tem só `throttle:10,1`, sem `can:impersonate_users`. O boilerplate acerta hoje, mas por disciplina, não por gate.
- **Absorver:** teste de contrato que anda por `Route::getRoutes()` e exige autorização em toda rota de escrita autenticada, com allowlist explícita. Molde pronto em `tests/Feature/Auth/AuthRouteThrottleTest.php:22-32`.
- **Correção da lente ATUALIDADE:** a asserção **não pode casar só o prefixo `can:`** — o L13 permite anexar a mesma autorização pelo atributo nativo `#[Authorize]` no controller. Cobrir os dois caminhos.
- **Allowlist inicial (7, self-service):** `POST logout`, `POST confirm-password`, `POST email/verification-notification` (`routes/auth.php:50,57,59`) e as rotas de `routes/settings.php`.
- **Por que primeiro:** é o mais barato dos 20, não tem runtime, e é o guard-rail que teria pego o furo real do ctfinance.

### A2 · ⏸️ REALOCADO para fatia de regras · `[absorver]` FK do payload escopada por dono · P · risco baixo

> **Por que saiu da fila de fatias (2026-08-11):** depois da correção das lentes, sobrou pouco corpo executável. O caso simples é `Rule::exists()->where()` **nativo** (nada a escrever), e o caso com scope não tem onde pousar: `app/Models/` do boilerplate só tem `User`, `Role`, `Permission` e `PermissionUser` — **nenhum recurso com dono**. Uma fatia agora entregaria prescrição em `.ai/rules/requests.md` sem call site nem teste de comportamento, o que não fecha a Definition of Done do `CLAUDE.md`. Entra na primeira fatia de regras (junto de B4 e B6, que estão na mesma situação) ou na primeira fatia que introduza um recurso com dono — o que vier antes.


- **Origem:** `app/Http/Requests/Transaction/StoreTransactionRequest.php:207-228` — closure `validateOwnedRecord`, **duplicada byte-a-byte 4×** (`RecurringIncome/Store:104`, `RecurringIncome/Update:157`, `Transaction/Update:240`).
- **Ideia:** `exists:tabela,id` **não escopa dono**. FK que o cliente manda no payload precisa de segunda regra confirmando propriedade — senão vaza dado cruzado sem nunca tocar rota `{id}`.
- **Correção da lente ATUALIDADE — muda a implementação:** **não** criar `App\Rules\OwnedByCurrentUser`. O equivalente nativo é `Rule::exists(Model::class,'id')->where(fn (Builder $q) => $q->where('user_id', $this->user()->id))`. Reservar uma fábrica fina em `app/Rules/` **só** para o caso com scope (equivalente ao `Category::visibleTo` do ctfinance). Documentar que `Rule::exists` roda no query builder da TABELA — global scopes e soft delete precisam ser reescritos dentro do `where()`.
- **Correção da lente REFUTAR:** o contraste citado era falso — `SyncPermissionsRequest.php:22` (`exists:permissions,name`) e `AssignRoleRequest.php:30` (`exists:roles,name`) são recursos **globais**, não IDOR. A regra entra sem call site real (mesmo status de `MoneyString`/`MoneyCast` hoje).
- **Precaução da lente RISCO:** documentar que `$this->user()` aqui é o usuário **impersonado de propósito** (escopo de dado) — contra a regra do `CLAUDE.md` que manda resolver o original via `ImpersonationService`. Sem essa nota, alguém copia a regra para checagem de privilégio e inverte o sentido.

### ~~A3~~ ✅ APLICADO · PR [#54](https://github.com/Simplify-Technology/boilerplate/pull/54) · `[guard-rail]` shape do `share()` travado por inteiro · P · risco baixo

- **Origem:** `resources/js/types/index.d.ts:7` do ctfinance tipa `Auth.user` como o `User` inteiro, mais largo do que o `share()` entrega.
- **Lacuna no boilerplate:** `tests/Feature/SharedPropsTest.php:30` trava `has('auth.user', 4)` e os `missing()` de PII, mas **nada trava a contagem de chaves de `auth` nem o topo**.
- **Correção da lente ATUALIDADE:** `->has('auth', 4)` é o mecanismo fraco; o nativo é `AssertableInertia`/`AssertableJson::interacted()`, que falha com "Unexpected properties were found in scope" quando sobra chave não tocada.
- **Correção da lente RISCO:** o conjunto top-level proposto **nasceria vermelho** — o `share()` espalha `parent::share($request)` e o middleware do Inertia 3 injeta `['errors' => Inertia::always(...)]`. Contar/enumerar considerando isso.

### A4 · `[absorver]` `role_id` e `is_active` fora do `$fillable` · M · risco **médio** · fatia ATÔMICA

- **Origem:** `ctfinance/app/Models/User.php:25-40` omite ambos deliberadamente e escreve por `forceFill()`.
- **Buraco verificado no boilerplate:** `app/Models/User.php:30-32` tem `'is_active','role_id'` como as **duas primeiras** chaves do `$fillable`. Qualquer endpoint novo de derivado que faça `$user->update($request->validated())` com `role_id` na whitelist vira autopromoção silenciosa — `UserPolicy` não é acionada num `update()` genérico.
- **⚠️ Correção da lente RISCO — o modo de falha precisa ser invertido ANTES:** `app/Providers/AppServiceProvider.php:81-89` registra `handleDiscardedAttributeViolationUsing` que só faz `report()` em produção, **não lança**. Tirar as chaves sem converter todos os call sites faz o rebaixamento para VISITOR e a desativação de conta virarem **no-op fail-OPEN em produção** — cache limpo, UI respondendo "Cargo removido com sucesso!", e nada persistido.
- **São 8 call sites, não 3** (verificado): `HasRolesAndPermissions.php:74` e `:97`, `PermissionRole/AssignRoleController.php:122`, `PermissionRole/RevokeRoleController.php:90`, `User/ToggleActiveController.php:16`, `Console/Commands/SyncPermissionsCommand.php:89`, mais `User/StoreController.php:83` e `User/UpdateController.php:106`.
- **Correção da lente REFUTAR:** `forceFill($data)` **em bloco** desliga o filtro para todo o payload — manter `create()`/`update()` para campos comuns e `forceFill` só para os dois de privilégio. A suíte não quebra: `Factory::make()` embrulha em `Model::unguarded`, então os `User::factory()->create(['role_id'=>…])` seguem válidos; só `tests/Feature/User/EditControllerTest.php:34` precisa mudar.
- **Ordem obrigatória:** (1) fazer a violação **lançar** para o `User` em produção; (2) converter os 8 call sites; (3) tirar as chaves do `$fillable`; (4) teste **positivo** (revoke/toggle realmente persistem) + teste de negação; (5) reescrever a linha de `.ai/rules/models.md` que hoje manda o contrário.
- **Nota da lente ATUALIDADE:** o L13 traz `#[Fillable]`/`#[Guarded]` como forma alternativa — a guarda deve assertar em `(new User)->getFillable()` em runtime, **nunca por grep da propriedade**.

### A5 · `[absorver]` gestão de sessões ativas — **em 2 fatias** · M · risco baixo→médio

- **Origem:** `app/Http/Controllers/Settings/Sessions/{Show,LogoutOthers}Controller.php` + `app/Support/UserAgentParser.php`.
- **🔴 As 3 lentes convergiram no mesmo defeito: na origem isso é teatro de segurança.** `Auth::logoutOtherDevices()` (L13, `SessionGuard.php:740-777`) só chama `rehashUserPasswordForDeviceLogout()`. Quem mata as outras sessões é o middleware nativo `Illuminate\Session\Middleware\AuthenticateSession` (alias `auth.session`) — e `grep AuthenticateSession` volta **vazio nos dois repositórios**. Hoje o botão do ctfinance grava "Demais sessões foram encerradas." sem encerrar nada.
- **Fatia A5a (inócua):** tela read-only. Tabela `sessions` já existe (`0001_01_01_000000_create_users_table.php:31`), driver já é `database` (`config/session.php:21`), `SetSensitiveCacheHeaders` já força `no-store`. Copiar os 3 detalhes bons da origem: ID truncado em 8 chars antes de ir para a prop, `hash_equals` para marcar a sessão atual, e degradar com `unavailable: true` quando o driver não é `database`.
- **Fatia A5b (comportamental, deploy fora de pico):** `auth.session` no grupo web + limiter nomeado `sessions` + linha no dataset de `AuthRouteThrottleTest.php:37-47` + **teste Feature provando que a segunda sessão de fato perde acesso**. Escreve em coluna persistida (`users.password`) e muda a pilha de auth globalmente. Atenção: as linhas de `sessions` não são apagadas — sem delete/reload a lista continua exibindo as sessões "encerradas".
- **Colisão a resolver:** `ShowController.php:31` faz `DB::table('sessions')` dentro do controller, o que viola o guard **já existente** `arch('controllers não fazem query via facade DB')` (`tests/Arch/ArchTest.php:39-41`). A consulta vai para Service/Support.

### ~~A6~~ ✅ APLICADO · PR [#56](https://github.com/Simplify-Technology/boilerplate/pull/56) · `[guard-rail]` invariante de banco que vira no-op no SQLite · M · risco baixo

> **Correções que a aplicação trouxe (2026-08-11):** (a) o marcador `DB::unprepared` faltava no candidato — é a forma que o ctfinance usa no ramo MySQL, e sem ela metade do caso de origem escapava; (b) o teste **não** podia ficar ao lado do molde irmão em `tests/Feature/Foundation/` — lá herda `RefreshDatabase` e depende de as migrations rodarem, que é o que quebra quando o erro acontece (medido: `QueryException` antes de qualquer asserção). Foi para `tests/Unit/Database/`, sem app; (c) a lente de atualidade foi reconfirmada no vendor: sem `check()` no `Blueprint`, sem `getCheckConstraints()` na introspecção.


- **Origem:** `2026_01_27_000003_add_recurring_expenses_xor_bank_account_credit_card_check.php:23` — CHECK no pgsql, **trigger `SIGNAL SQLSTATE '45000'`** no MySQL, **no-op no SQLite**. A suíte roda em SQLite, então o teste nunca vê a constraint.
- **Absorver:** guarda que detecta migration com `DB::statement`/`getDriverName` e exige (a) teste que exercite a invariante no dialeto real ou (b) a mesma invariante em código. Molde irmão: `tests/Feature/Foundation/SchemaIdentifierLengthTest.php:7-12`.
- **Lacuna adjacente verificada:** `.ai/rules/index.md` **não tem glob para `database/migrations/**`** (só `seeders`). Corrigir na mesma fatia.
- **Nasce verde:** nenhuma das 6 migrations do boilerplate usa `DB::statement`/`getDriverName`.
- **Nota da lente ATUALIDADE:** não existe API nativa de CHECK no schema builder do L13 nem introspecção equivalente a `Schema::getIndexes()` — grep no texto da migration segue sendo o único caminho.

### A7 · `[guard-rail]` job sem contrato de fila não entra · P · risco baixo

- **Origem:** `app/Jobs/CloseCreditCardInvoicesJob.php:18-25` e `Lgpd/GenerateLgpdExportJob.php:18-27` — nenhum declara `$queue`/`$tries`/`$backoff`/`$timeout`/`$maxExceptions`.
- **Correção da lente ATUALIDADE — a FORMA proposta está obsoleta:** no L13 isso virou atributo PHP; `Illuminate\Queue\Attributes\{Tries,Backoff,Timeout,MaxExceptions,FailOnTimeout,Queue,Connection}` existe no vendor instalado. A guarda deve aceitar propriedade **ou** atributo.
- **Correção da lente REFUTAR:** exigir os quatro de uma vez é over-reach. Reduzir ao par que importa (`tries`/`backoff` ou o atributo equivalente) + fila declarada em supervisor do Horizon (`config/horizon.php`).
- **Raio zero hoje:** `app/Jobs` não existe e não há uma única `ShouldQueue` no boilerplate — o teste nasce vazio e só constrange código futuro.

### A8 · `[guard-rail]` schedule com casa única e guardas de concorrência · P · risco baixo

- **Origem:** `ctfinance/bootstrap/app.php:20-33` agenda `CloseCreditCardInvoicesJob` **sem `withoutOverlapping`/`onOneServer`**, enquanto `routes/console.php:15-19` usa `onOneServer` — scheduler dividido entre duas casas, com disciplina diferente em cada.
- **Absorver:** regra de casa única (`routes/console.php`) + guardas de concorrência obrigatórias em tarefa de varredura + `chunkById` em comando de lote (`RecalculateBudgets.php:41` usa `->get()`).
- **⚠️ Dois footguns da lente RISCO:** `onOneServer()` num evento de job/closure **lança `RuntimeException` se não houver `->name()` antes** (`Scheduling/CallbackEvent.php:156-164`) — regra cega derruba o boot do console. E `withoutOverlapping` exige store de cache compartilhado.
- **Nota da lente ATUALIDADE:** o L13 abençoa as duas casas (`routes/console.php` e `withSchedule()`), então "casa única" é convenção de projeto legítima — escrever como convenção, não como correção.

### A9 · `[guard-rail]` escrita de coluna derivada exige transação + lock · M · risco baixo

- **Origem:** `app/Services/CreditCardLimitService.php:19-33` faz read-then-write **sem lock**, enquanto `:45-56` da mesma classe usa `lockForUpdate`; `BankAccountBalanceService.php:43-45` idem, no caminho chamado pelo `TransactionObserver`.
- **Absorver:** regra prescritiva — saldo/limite/contador derivado de agregação escreve dentro de `DB::transaction` + `lockForUpdate`. Chega antes do primeiro caso de dinheiro no boilerplate (hoje há **um** `DB::transaction`, em `SyncPermissionsCommand.php:83`, e zero `lockForUpdate`).
- **⚠️ Correção da lente RISCO — o reforço automatizado é ilusório:** a suíte roda SQLite, cuja gramática compila `FOR UPDATE` para **string vazia**. O teste não consegue provar o lock. Entra como regra `.ai/rules` + revisão, não como gate verde enganoso.
- **Lente ATUALIDADE: `sobrevive` limpo** — não há recurso nativo no L13 que substitua transação + `SELECT … FOR UPDATE` para escrita derivada.

### A10 · `[absorver]` `Inertia::defer` com grupos nomeados nas props caras · M · risco baixo

- **Origem:** `app/Domain/Dashboard/Services/DashboardPageBuilder.php:153-175`.
- **Buraco verificado:** zero `Inertia::defer`/`Inertia::optional` em `app/` do boilerplate; `resources/js/` só tem `prefetch`. O **ADR 0003 já elege deferred props como a ferramenta oficial** — o boilerplate não pratica a própria decisão.
- **Correção da lente RISCO:** muda payload observável e o ponto de pouso proposto quebra na hora — `resources/js/types/users.ts:109` declara `roles: Role[]` como obrigatório e `pages/users/index.tsx:29,20x` consome direto. Tipo vira opcional + `<Deferred>` na mesma fatia.

### A11 · `[absorver]` idempotência por índice único + recuperação · M · risco baixo

- **Origem:** `2026_01_27_000001_add_recurring_generated_idempotency_to_transactions_table.php:19-22` + `app/Services/RecurringExpenseService.php:252-278,296-304`.
- **Correção da lente ATUALIDADE — metade já é nativa:** `Builder::createOrFirst()` (`vendor/laravel/framework/.../Eloquent/Builder.php:728-735`) já faz `try { create } catch (UniqueConstraintViolationException) { where(...)->first() }`. Absorver só a parte não-nativa: a **coluna-flag de idempotência + UNIQUE composto** como padrão de geração recorrente.
- **⚠️ Bug de portabilidade na origem:** o `catch` e o SELECT de recuperação rodam **dentro** do `DB::transaction` — no MySQL passa, em pgsql a transação já está abortada. Não copiar essa forma.

### A12 · `[guard-rail]` status enum é máquina de estado · P · risco baixo

- **Origem:** `app/Enum/TransactionStatus.php:10` + o estrago documentado em `normalize_transaction_statuses_to_posted.php:12-18`.
- **Correção da lente REFUTAR — reduzir o escopo:** nenhum bug de *transição inválida* é citado no ctfinance; o estrago real veio de **renomear status e conviver com cases legados**. A regra que a evidência sustenta é sobre renomeação/convivência, não sobre máquina de estado completa.
- **⚠️ Correção da lente RISCO — a cláusula "remover o case legado no mesmo ciclo" é perigosa AQUI:** neste boilerplate, case de enum **é dado persistido** (`SyncPermissionsCommand` materializa `Permissions::cases()` em tabela). Remover case sem migração de dados quebra permissões vivas.
- **Nota da lente ATUALIDADE:** "nunca aceita status arbitrário do payload" tem API nativa a prescrever por nome — `Rule::enum(Status::class)->only([...])`.

## Aplicáveis agora — ctfinance (dimensão 4)

Fonte: ctfinance @ `b8c6d57`. **Particularidade desta célula:** três dos quatro candidatos não são "código a portar" — são **defeitos que o boilerplate já tem** e que a leitura comparada do ctfinance revelou. O ativo colhido é o diagnóstico, não o arquivo.

### ~~D2~~ ✅ APLICADO · PR [#58](https://github.com/Simplify-Technology/boilerplate/pull/58) · `[guard-rail]` cache de prefetch sobrevive à troca de identidade · P · risco baixo

> **Como foi aplicado (2026-08-11):** não como `flushAll()` espalhado pelos 3 call sites, e sim como `resources/js/lib/impersonation.ts` — único caminho para trocar de identidade — mais um teste de propriedade proibindo nomear as rotas `users.impersonate` fora do módulo. Os 3 call sites nasceram um de cada vez sem saber uns dos outros; espalhar a chamada consertaria hoje e reabriria no quarto.

- **Origem:** `resources/js/components/sidebar-context-switcher.tsx:36-38` — `router.flushAll()` antes de trocar de contexto, com o comportamento travado em teste (`resources/js/test/components/sidebar-context-switcher.test.tsx:8,13,90`).
- **Bug vivo no boilerplate**, com os dois ingredientes: 6 superfícies `<Link prefetch>` (`nav-main.tsx:58`, `app-sidebar.tsx:39`, `user-menu-content.tsx:25`, `app-header.tsx:97`, `settings/settings-sidebar.tsx:73`, `layouts/settings/layout.tsx:47`) e **3** pontos de troca de identidade sem invalidação — `user-details-dialog.tsx:47-61`, `impersonate-banner.tsx:15-18` e `hooks/users/use-user-actions.ts:51-53` (este último o caçador perdeu; achado da lente). `grep -rn "flushAll\|flushByCacheTags\|invalidateCacheTags" resources/js` → **0 linhas**.
- **O default do Inertia não cobre** (core 3.6.1, `dist:2488-2490`): após visita bem-sucedida só há `flushByCacheTags([])` — que não remove nada, `tags.includes(tag)` é falso em array vazio — e `router.flush(url)`, que limpa apenas a URL de destino.
- **Cheque decisivo (duas lentes, nenhum caçador):** `StartImpersonateController.php:39-42` e `StopImpersonateController.php:26-28` devolvem `RedirectResponse` puro, **não** `Inertia::location()`. Fosse `location()`, a navegação dura limparia o cache e o candidato seria vazio.
- **Impacto:** `pages/settings/profile.tsx:44-45` renderiza `auth.user.name`/`auth.user.email` — prefetch velho mostra nome e e-mail do **admin** durante impersonation.
- **Forma decidida — `flushAll()`, não `cacheTags`:** a lente de atualidade propôs o idioma v3 (`cacheTags` + `invalidateCacheTags`); REFUTAR e RISCO rejeitaram por **modo de falha**. Tag **falha aberto** (esquecer a tag em 1 dos 6 `<Link>`, ou no 7º futuro, devolve dado alheio em silêncio); `flushAll` **falha fechado** (pior caso: alguns requests extras, num momento raro).
- **Fact-check da lente:** "o flush precisa vir antes do `router.post`, senão o redirect resolve do cache" é **falso** — o cache só é consultado em `sendRequest()` (`dist:3186`), alcançado por `router.visit`/`<Link>`; o 302 é seguido pelo axios e não reentra ali. A página velha aparece no **clique seguinte**. O bug permanece; cai só o racional de ordenação.
- **Fatia:** `flushAll()` nos 3 call sites + regra em `.ai/rules/js.md` + 1 teste Vitest por componente. **Mutação que prova:** apagar a linha → teste quebra.

### ~~D4~~ ✅ APLICADO · PR [#62](https://github.com/Simplify-Technology/boilerplate/pull/62) · `[guard-rail]` primeiro paint em dark depende de token que ainda não existe · P · risco baixo

> **Medição que a aplicação acrescentou (2026-08-11):** a lente já dizia que era problema de dev, e o manifest do build confirma o mecanismo — `resources/js/app.tsx` → `css: ['assets/app-*.css']`, ou seja, o `@vite` emite `<link>` render-blocking e o token existe no primeiro paint em produção. **O ganho real em produção é a meta `color-scheme`**, não o hex: sem ela, canvas, barras de rolagem e controles nativos ignoram o tema (a página de erro já cuidava disso, o app não).

- **Regressão datada no boilerplate:** `resources/views/app.blade.php:30` usa `background-color: var(--color-primary-dark)`, mas `--color-primary-dark: #0f2a44` só existe em `resources/css/app.css:107`, carregado pelo `@vite(...)` da linha 52 — **depois** do `<style>` inline da linha 23. `git blame`: era `oklch(0.14 0.006 220)` literal até `c2ffbc7` ("feat: add Aptos, Montserrat…"). A linha irmã `:25` continua literal.
- **Correção de severidade (lente RISCO):** em produção o `@vite` emite o CSS como `<link>` render-blocking, então o token existe antes do primeiro paint e o `var()` quebrado é **latente**. A janela visível está em `composer dev` (CSS injetado por JS). A fatia conserta acoplamento frágil + canvas/scrollbars nativos — **não** vender como flash em produção.
- **Cai do candidato:** "`classList.add` sem remove" **não é bug** — a classe `dark` só chega por `@class([...])` em `:2`, e nesse ramo o guard `appearance === 'system'` é falso. O runtime já usa `classList.toggle('dark', isDark)` (`use-appearance.tsx:25`).
- **Não absorver `data-theme`:** código morto no ctfinance — escrito em 3 lugares, `grep` não acha nenhum seletor que o consuma.
- **Fatia:** hex literal no inline + `<meta name="color-scheme">` com os hexes da marca do boilerplate + teste de sincronia blade ↔ `app.css`.

### ~~D5~~ ✅ APLICADO · PR [#60](https://github.com/Simplify-Technology/boilerplate/pull/60) · `[guard-rail]` spinner de busca é código morto — e o único visível nunca para · P · risco baixo

> **Correção que a aplicação trouxe (2026-08-11):** a lente prescrevia "slot de largura fixa no canto direito alternando conteúdo". Medindo, isso é **pior**: o X aparece com o campo preenchido, que é exatamente quando a busca está em curso — ele piscaria a cada tecla. O indicador foi para o **canto esquerdo**, no lugar da lupa, que já é slot fixo e cujo glifo é decorativo. Zero disputa, zero piscar, botão de limpar estável.

> **Mecanismo exato do defeito B, mapeado na aplicação:** o `setIsSearching(true)` roda **antes** do `setTimeout`, e o cleanup do efeito cancela esse timeout a cada tecla. Voltar o texto ao valor aplicado cai no early-return; como o request nunca saiu, não há `onFinish` para desligar. O teste do hook foi escrito antes da correção e falhava reproduzindo o estado travado.

- **Defeito no boilerplate**, `resources/js/components/data-table/search-bar.tsx:73`: `{isSearching && !value && (` — o spinner só renderiza com o campo **vazio**, nunca enquanto se digita, que é quando serviria. Estado produzido e propagado corretamente (`use-user-search.ts:31,142`, `users/use-user-filters.ts:31,154`), descartado na renderização. `grep -rln "SearchBar" resources/js/test/` → vazio.
- **Achado que dobra a fatia:** o estado `value === '' && isSearching === true` inclui caso travado — early-return em `use-user-filters.ts:54` sem reset. O único spinner hoje visível é, com frequência, um que **nunca para**. Dois arquivos, não um.
- **Correção de largura (lente):** 9 telas no ctfinance (não 11 — os pares citados misturavam `SearchBar` e `FilterPanel`) e **1** no boilerplate (`pages/users/index.tsx:168`). A alavancagem (primitivo que os derivados copiam) vale; a largura alegada, não.
- **Cuidados:** X e spinner disputam o canto (`right-2` `:62` × `right-3` `:74`) — slot de largura fixa alternando conteúdo, senão o X pisca. Não remover o `aria-live` de `pages/users/index.tsx:139-141`: a lacuna é só visual.

### ~~D3~~ ✅ APLICADO · PR [#64](https://github.com/Simplify-Technology/boilerplate/pull/64) · `[guard-rail]` closure em prop não é lazy · P · risco baixo · **só doc, sem gate**

- **Fato (vendor do alvo):** `PropsResolver.php:278-280,355-360` só exclui do primeiro load quem implementa `IgnoreFirstLoad` (`OptionalProp.php:5`, `DeferProp.php:5`). Closure nua resolve sempre. No ctfinance, `DashboardPageBuilder.php:151,163-165` + `dashboard.tsx:166-168` fazem o trabalho duas vezes.
- **⚠️ Teste arch é INVIÁVEL** — barrar `=> fn(` dá falso positivo em 100 % do uso correto (`Inertia::defer(fn() => ...)` contém a string). `arch()` também não assere posição de closure dentro de call. Fatia que tentar o gate está errada.
- **⚠️ NÃO escrever "use `once()` em vez de `??=`"** — seria orientação ativamente errada. `once()` é cache **no cliente entre visitas** (`ResolvesOnce.php` com `until()`/`expiresAt()`/`fresh()`; `PropsResolver.php:371-373` condiciona ao que o cliente carregou), não memoização intra-request, e introduz staleness nova em dado por usuário.
- **A regra PRECISA separar dois casos:** prop de `Inertia::render` (closure = eager) × shared prop de `share()` (closure = **correta**, reavalia por request — `'ziggy' => fn(): array =>` em `HandleInertiaRequests.php:74`). Sem isso, um agente "conserta" o Ziggy e quebra o `location` por navegação.
- **Fact-check:** a narrativa "o dev achou que closure era lazy" é falsa — `DashboardTest.php:80-84` do ctfinance assere `->has('categories')` no primeiro load. O defeito é partial reload redundante.

### D1 · `[guard-rail]` chunk manual por pacote de UI · P · **2/3 — rescopado, prioridade baixa**

- **Premissa do caçador invertida por 2 lentes:** `manualChunks` **não** sumiu no Vite 8. `vite/dist/node/index.d.ts:2182` → `rollupOptions?: RolldownOptions` sem `Omit`; rolldown 1.2.2 tipa `manualChunks?: ManualChunksFunction` (`define-config-DSMNXceb.d.mts:806`, `@deprecated`) e traduz em runtime para `codeSplitting.groups`. O hazard está **vivo**; a "rede do `tsc`" alegada não existe.
- **Derrubado por REFUTAR na evidência:** o incidente TDZ **nunca foi atestado** no ctfinance — `git log --all --grep=TDZ -i` devolve só `490de93`, que *cita* o caveat; os "reverts" são `refactor(vite)` e `chore(ci)`, nenhum `fix(`. O boilerplate não tem `recharts`, e a etiologia é do Rollup, não verificada no Rolldown.
- **Resolução (Guardrail 5):** se um dia existir, a regra cita a **doc do Rolldown** ("manual splitting can affect application behavior if side effects occur before modules are loaded", com `strictExecutionOrder` nativo — `define-config-DSMNXceb.d.mts:978`), nunca o incidente do ctfinance. Como o boilerplate não tem chunk manual algum, nasceria sem call site.

### Registrados sem veredito (dimensão 4) — entram na fila quando a fila de P secar

| # | Candidato | Tipo | Nota |
| - | --------- | ---- | ---- |
| D7 | `will-change` estático + `transition-all` em linha de lista | `[guard-rail]` P | O boilerplate é a **origem** do anti-padrão (`utils/users/constants.ts:8-9`), que o ctfinance multiplicou em 8 gêmeos byte-a-byte |
| D8 | Barrel de 190 ícones lucide resolvido por string em runtime | `[guard-rail]` P | Tree-shaking impossível por construção. O boilerplate ainda está limpo — a regra vale **antes** de alguém portar o arquivo |
| D9 | Code splitting no nível do componente (`React.lazy` + `Suspense`) | `[absorver]` M | `grep` por `Suspense\|React.lazy\|=> import(` no boilerplate → **0 linhas** |
| D10 | Gate de tamanho de chunk no CI | `[guard-rail]` M | No ctfinance o gate é **manual**; o boilerplate não tem nem isso |
| D11 | Deferred props com grupo + fallback skeleton | `[absorver]` M | **É o A10 visto de outro ângulo** — a implementação de referência que o ADR 0003 promete e o boilerplate nunca escreveu. Consolidar com A10 |
| D12 | Guarda de paridade `app.tsx` ↔ `ssr.tsx` no resolver | `[guard-rail]` M | O boilerplate já tem a paridade; **nada a fixa**. `grep -rln "ssr" resources/js/test/` → vazio |
| D13 | PWA / service worker | `[dep-nova]` G | **Multi-fonte** (ctfinance × sorteiopix). O `navigateFallback` é "arma engatilhada" — candidato E trap |
| D14 | Auditoria de overflow em 53 rotas a 390 px | `[dep-nova]` G | **Multi-fonte** com a suíte browser do spinmax. Depende da aprovação de `pest-plugin-browser` |
| D6 | `prefers-reduced-motion` | `[guard-rail]` P | **Multi-fonte** — colide com o sweep de motion do ctjuris. Represado até varrer ctjuris |

## Achados internos do boilerplate (não são harvest — medidos durante fatias)

Não vieram de projeto-fonte, então não têm origem `projeto/path@SHA`. Ficam aqui para não se perderem.

### C1 · coluna `*_id` que parece FK e não é · P · risco baixo · **medido em 2026-08-11**

- **Medido** durante a fatia A6, com `Schema::getForeignKeys()` na suíte (sqlite `:memory:`, `PRAGMA foreign_keys = 1` — as FKs de verdade são aplicadas):

  | Tabela | FKs materializadas |
  | ------ | ------------------ |
  | `users` | **nenhuma** |
  | `sessions` | **nenhuma** |
  | `permission_role` | `permission_id→permissions`, `role_id→roles` (ambas `no action`) |
  | `permission_user` | `permission_id→permissions`, `user_id→users` (ambas `cascade`) |
  | `activity_log` | nenhuma (é `nullableMorphs`, esperado) |

- **Causa:** `0001_01_01_000004_add_role_id_to_users_table.php:11` declara `foreignId('role_id')->after('is_active')->nullable()` **sem `->constrained()`**, e `0001_01_01_000000_create_users_table.php:33` faz o mesmo em `sessions.user_id`. `foreignId()` sozinho é só um `unsignedBigInteger` — o nome sugere integridade que não existe.
- **Consequência:** nada no banco impede `users.role_id` de apontar para um `role` apagado. O contraste é gritante dentro do mesmo schema: `permission_user` tem `cascade` nas duas pontas.
- **Por que não entrou na fatia A6:** é mudança comportamental (adicionar constraint a coluna existente exige decidir o `onDelete` — `set null` casa com o `nullable()` e com o VISITOR como piso de privilégio, mas é decisão, não detalhe). Fatia própria.
- **Trap anotada:** `permission_role` está com `no action` enquanto `permission_user` está com `cascade` — a assimetria também não tem decisão registrada.

## Adiados / rescopados para prioridade baixa

| # | Candidato | Tipo | Por quê ficou para depois |
| - | --------- | ---- | ------------------------- |
| B1 | Hard delete agendado + anonimização da trilha de auditoria | `[absorver]` | **Maior raio da rodada** (G): cria coluna, destrói dado irreversivelmente e agenda comando que APAGA usuário. Buraco real confirmado (`app/Models/User.php:60-69` loga `cpf_cnpj`/`email`/`phone` e `create_activity_log_table.php:16` usa `nullableMorphs('causer')` sem FK — a trilha com PII **sobrevive ao delete**). Lente ATUALIDADE: o comando custom é superado pelo trait nativo `Prunable` + `model:prune`. Vale, mas só depois dos guard-rails baratos. |
| B2 | Ligar `withPhpSets()` no Rector | `[absorver]` | Lente RISCO: maior raio de reescrita automática (app/, database/, routes/). **A adaptação proposta estava factualmente errada** — `withPhpSets()` sem argumento resolve a versão pelo `composer.json`, não pelo runtime (`RectorConfigBuilder.php:420-421`). E a "prova de sustentabilidade" invocada não existe: no ctfinance o passo é `continue-on-error: true`. Exige medir o diff real antes de virar fatia. |
| B3 | Policy registrada explicitamente, sem auto-discovery | `[guard-rail]` | Lente REFUTAR: **premissa falsa** — o boilerplate não tem `Gate::before`/`Gate::after` (verificado), então model sem policy não faz fail-open como o candidato alegava. Sobrevive como higiene barata (1 linha por policy), não como correção de segurança. |
| B4 | Upload sempre em disco privado | `[guard-rail]` | Lente ATUALIDADE: premissa parcialmente falsa — `config/filesystems.php:36` já declara `'serve' => true` no disco `local` e o L13 serve por rota assinada nativa. Entra só como prescrição em `.ai/rules` para código futuro; a guarda executável proposta não é implementável com `arch()`. |
| B5 | Arch test para a regra "sem observers" | `[guard-rail]` | Lente RISCO: `arch()->expect('App\Observers')` sobre namespace inexistente devolve layer vazia — **no-op silencioso**. Precisa detectar também `#[ObservedBy]` (forma do L13). A regra textual já existe em `.ai/rules/models.md`. |
| B6 | Exception de domínio com contrato de render | `[guard-rail]` | Sobrevive como prescrição (`app/Exceptions/` não existe; custo zero). Armadilha real e específica: `bootstrap/app.php:57` transforma qualquer 500 em `errors/error-page` em produção. Baixa urgência. |
| B7 | Orçamento de queries por request | `[guard-rail]` | **⚠️ Risco de PII:** a implementação de origem loga `$event->toRawSql()`, que interpola bindings (e-mail, CPF, hash) — ligar em produção com `report()` manda SQL cru para o Sentry, contra ADR 0006. Absorver só `DB::whenQueryingForLongerThan`, **nunca** o `DB::listen` com raw SQL. |

## `[rejeitado]` — registrados para não re-descobrir

| Achado | Origem | Motivo (lente que derrubou) |
| ------ | ------ | --------------------------- |
| Trait de regra compartilhada em `app/Http/Requests/Concerns` | `ValidatesRecurringEndDateRelativeToStart.php:17` | REFUTAR: não é convenção nem no ctfinance — o próprio par Store/Update que usa a trait mantém **outra** closure duplicada com a mesma lógica inline (`StoreRecurringExpenseRequest.php:69-71` vs `UpdateRecurringExpenseRequest.php:71-83`). Extração ad-hoc n=1, não padrão. |
| Invalidação de cache derivado por bump de versão O(1) | `Domain/Dashboard/Support/DashboardCache.php:48-71` | REFUTAR: já é política vigente — `.ai/rules/models.md` diz literalmente "invalidação de cache são chamados explicitamente nos métodos que mutam", e a factory de chave tipada já existe (`HasRolesAndPermissions.php:51-53`). RISCO: aplicar bump de versão a `user:{id}:permissions` (`rememberForever`) transforma meia absorção em **escalada de privilégio**. |
| `MoneyHelper` do ctfinance | `app/Helpers/MoneyHelper.php` | Direção inversa: dois métodos estáticos contra o VO `Money` (~25 métodos) + `MoneyCast` + `MoneyString` do boilerplate. Entra no gap-report do ctfinance, não aqui. |
| `PiiScrubber`, `EnsureUserIsActive`, kit BR, larastan, limiters nomeados, `withExceptions` | ausências no ctfinance | Direção inversa — o boilerplate já é superior. Vira fatia no PLAYBOOK de migração do ctfinance. |
| `.husky/commit-msg` com `REQUIRE_ISSUE_ID` default 0 | `.husky/commit-msg:16` | Regressão deliberada do ctfinance ("religar antes do lançamento"). Não absorver em hipótese alguma. |

## Multi-fonte — aguardando comparação

Candidato cujo tema aparece em mais de um projeto só vira fatia depois que as células equivalentes dos demais projetos-fonte forem varridas.

| Tema | Fontes conhecidas | Células que faltam | Vencedor | Porquê |
| ---- | ----------------- | ------------------ | -------- | ------ |
| Dinheiro | `MoneyHelper` (ctfinance, **já perdeu** para o kit do boilerplate) × `currency.ts` (sorteiopix) × `MoneyCast` (cuidari) × `Money.php` (spinmax) × kit atual do boilerplate | sorteiopix, cuidari, spinmax | parcial: boilerplate > ctfinance | VO com ~25 métodos + cast + rule contra 2 funções estáticas |
| PWA | ctfinance (`vite-plugin-pwa`, `lib/pwa-registration.ts`, `pwa/pwa-chrome.tsx`, `navigateFallback` com denylist) × sorteiopix | sorteiopix | — | — |
| Billing / cliente Asaas | ctfinance (`AsaasService`, `VerifyAsaasSignature`, `EnsureSubscriptionActive`, `BillingWebhookLog`) × ctvitrine × enum de provider (cuidari) | ctvitrine, cuidari | — | — |
| Webhooks | assinatura HMAC + log de tentativa inválida (ctfinance) × inbox `webhook_events` (spinmax) | spinmax | — | — |
| Multi-tenant | ctjuris × cuidari | ambas | — | — |
| Auditoria impersonation-aware | `AuditUserResolver` sobre owen-it (ctfinance) × sorteiopix × `ActivityCauserResolver` sobre spatie (boilerplate) | sorteiopix | — | pilhas divergentes (owen-it × spatie) — comparar antes |
| Tooling de a11y | ctjuris × spinmax × (dim. 5 do ctfinance: **nenhuma** ferramenta nos dois lados) | ctjuris, spinmax | parcial: `jest-axe` sobre o Vitest existente > `eslint-plugin-jsx-a11y` | o lint não enxerga componentes (`<Button>`, Slot do Radix, `asChild`) e seu peer para no ESLint 9; axe sobre o DOM renderizado pegaria 4 achados da dim. 5. Comparar com `check-contrast.mjs` (spinmax) e o sweep do ctjuris antes de fatiar |
| Estado vazio / `EmptyState` | ctfinance (`action` + 29 usos em 18 arquivos, 100% Tailwind) × boilerplate (sem `action`, ainda em `@radix-ui/themes`) × demais a varrer | 6 projetos | parcial: ctfinance > boilerplate **no contrato** (`action`) | o corpo visual é dimensão 6 e fica represado; o contrato (E15) não |
| Variante mobile-card de listagem | ctfinance (9 páginas com o par card/linha, 19 `min-h-11`) × demais a varrer | 6 projetos | — | o boilerplate tem **0** de ambos; a metade barata (piso de alvo de toque, E16 fatia A) não precisa esperar |
| Canal de flash → toast | boilerplate (`->with()` + prop + hook caseiro, opt-in por página) × ctfinance (mesmo canal, mas consumido em 51 páginas) × **nativo do Inertia 3.6** | 6 projetos | provável: **nativo** > ambos | `Inertia::flash()` + `router.on('flash')` apaga o hook caseiro; decisão do dono pendente (ver §Decisões) |
| Motion / `prefers-reduced-motion` | ctfinance (só um hook pontual, sem tratamento global) × sweep de motion no Vitest do ctjuris | ctjuris | — | boilerplate hoje tem **0** ocorrências contra 17 usos de `animate-*` |
| Code splitting / chunking | ctfinance (`manualChunks` Rollup + `React.lazy` por widget) × demais a varrer | 6 projetos | — | premissa do caçador invertida: `manualChunks` segue vivo no Vite 8 via Rolldown |
| i18n / `lang` | ctfinance (`messages.php` 198 l. com 4 grupos de plataforma + `pt_BR.json`) × ctjuris × sorteiopix × spinmax | 3 | — | — |
| Suíte browser | ctfinance (`browser.yml` + `MobileResponsiveAuditTest` de 56 rotas) × spinmax (`pest-plugin-browser` + Playwright + `tests/Contract`) | spinmax | — | `[dep-nova]` nos dois casos |

## `[dep-nova]` — represados aguardando aprovação do dono

| Pacote | Origem | Para quê | Fatia dependente |
| ------ | ------ | -------- | ---------------- |
| `pestphp/pest-plugin-browser` + `playwright` | ctfinance (`^4.3.1` / `1.59.1` pin exato) | Suíte browser + `browser.yml` com cron noturno e cache de `~/.cache/ms-playwright`. **PLAYBOOK §4 registra que o boilerplate não tem e que isso travou a Fatia 1 do piloto.** Desbloqueia o gate real das fatias de UX/UI. | todas as fatias de UX/UI/fluidez |
| `laravel/socialite` | ctfinance `^5.26` | Login Google (`GoogleAuthController`, `SocialAccount`, `config/social_auth.php` com allowlist de domínio) | — |
| `laravel/pulse` | ctfinance `^1.7` | 10 recorders. **Colide com ADR 0004** (stack de observabilidade local é Pail + Log Viewer + Horizon + LaraDumps) → tratar como `[proposta-adr]`, não `[dep-nova]` pura. | — |
| `vite-plugin-pwa` + `workbox-window` | ctfinance | PWA (tema multi-fonte com sorteiopix — comparar antes) | — |

## `[proposta-adr]` — conflitam com decisão vigente

| Achado | ADR em conflito | Proposta |
| ------ | --------------- | -------- |
| `laravel/pulse` no ctfinance | 0004 (sem Telescope; stack = Pail + Log Viewer + Horizon + LaraDumps) | O ADR 0004 rejeita o Telescope nominalmente, mas o racional (duplicar observabilidade já instalada, mais um painel a proteger) alcança o Pulse. Decidir explicitamente: estender o 0004 ou abrir ADR próprio. |
| `owen-it/laravel-auditing` (ctfinance) × `spatie/laravel-activitylog` (boilerplate) | nenhum ADR cobre a escolha de pilha de auditoria | Duas pilhas divergentes entre projetos irmãos, sem decisão registrada. Candidato a ADR novo depois de varrer sorteiopix (que também tem resolver impersonation-aware). |

## Aplicáveis agora — ctfinance (dimensão 5 — UX)

Fonte: ctfinance @ `b8c6d57`, comparado ao boilerplate `main` @ `9814f46`. **28 sobreviventes de 32 candidatos; 22 deles são defeitos vivos no próprio boilerplate.** O escopo abaixo é o CORRIGIDO pelas 3 lentes.

### ~~E17~~ ✅ APLICADO · PR [#66](https://github.com/Simplify-Technology/boilerplate/pull/66) (mesclado) · `[absorver]` `sort_order`/`per_page` crus — 500 alcançável por URL · P

- **Defeito vivo no boilerplate:** `app/Http/Controllers/User/IndexController.php:64-73` tem allow-list só do CAMPO; `:76` passa `sort_order` cru ao `orderBy()`, que lança em `Builder.php:2985-2993`. `/users?sort_order=<lixo>` e `?sort_order[]=a` devolvem **500**. `per_page` não tem teto — `?per_page=999999` pagina tudo.
- **Origem da correção (verbatim, não inventar):** `RecurringExpense/IndexController.php:94-103` e `RecurringIncome/IndexController.php:72-81` — allow-list do campo **e** da direção, `$perPage = max(5, min(50, (int) $request->integer('per_page', 15)))` com o helper nativo.
- **⚠️ Correção da lente REFUTAR:** o caçador afirmou que no ctfinance a defesa "é constante de frontend, nunca chega ao servidor" — **falso**, é server-side completa. Isso muda a classe de `guard-rail` de casa para `absorver` padrão do derivado.
- **Escopo:** portar a forma para `User/IndexController`; testes Pest de negação (`?sort_order=<lixo>`, `?sort_order[]=a`, `?per_page=999999` → 200 com fallback, nunca 500); regra em `.ai/rules/controllers.md` (ordenação/paginação de URL é entrada não confiável; o eco em `$filters` publica o valor **normalizado**, senão o lixo volta pela URL via `withQueryString()`). Como esta listagem é o template dos próximos módulos, extrair para trait/FormRequest do kit.
- **Precede o E19** (ligar ordenação sem isto cria um 500 alcançável por clique).

### ~~E13~~ ✅ APLICADO · PR [#68](https://github.com/Simplify-Technology/boilerplate/pull/68) · `[absorver]` `flash` no `share()`

> **Resolvido pelo canal NATIVO, não por `Inertia::always()`** (decisão do dono, 2026-08-11). O flash nativo não é prop, então não há filtro de partial reload a driblar — o `Inertia::always()` que este candidato propunha virou desnecessário.

- **Defeito vivo:** `HandleInertiaRequests.php:68-73` publica `flash` como array cru com `pull`. Em partial reload que não pede `flash`, a prop é filtrada — mas o `pull` **já rodou**, e a mensagem some sem nunca chegar à tela.
- **Escopo:** `'flash' => Inertia::always(fn (): array => [...])` — uma linha, shape TS inalterado. Teste Pest: redirect com `->with('success')` seguido de GET com `X-Inertia-Partial-Data` sem `flash`, assertando que `flash.success` **chega** no payload.
- **⚠️ Duas correções GRAVES da lente:** (a) a forma proposta pelo caçador (closure pelada) **não preserva nada** — `Store::save()` chama `ageFlashData()` em toda requisição (`Session/Store.php:181-183,233-240`), a mensagem não-pullada é apagada no fim do próprio request parcial; (b) o teste que ele propôs ("a mensagem AINDA está na sessão") **falha mesmo com a correção** — seria gate enganoso. O mecanismo nativo é `AlwaysProp`, que faz bypass do filtro em `PropsResolver.php:325`.
- Regra em `.ai/rules/middleware.md`: prop compartilhada com efeito colateral (`pull`/consume/increment) nunca entra crua no `share()`.

### E14 + E15 · `[guard-rail]` + `[absorver]` `EmptyState`: HTML inválido e beco sem saída · P · risco baixo · **1 PR, 1 arquivo**

- **E14 — HTML inválido vivo:** `components/empty-state.tsx:13-29`, ramo `type="row"`, emite `Table.Row`/`Table.Cell` próprios; o **único** call-site (`role-users-table.tsx:141`) já o embrulha → `<tr>` dentro de `<div>` dentro de `<td>`. Escopo: apagar o ramo **e** a prop `type` (`:9`), que fica órfã.
- **E15 — beco sem saída:** o `EmptyState` do boilerplate não aceita `action`; o do ctfinance sim (29 usos em **18** arquivos — o caçador disse 17). Escopo: `action?: ReactNode` + `className?`, e migrar os 2 call-sites: `pages/users/index.tsx:274-286` ganha CTA de criar no vazio-inicial e "Limpar filtros" (via `use-user-filters.ts:112-122`) no vazio-por-filtro; `role-users-table.tsx:137-142` ganha link para usuários.
- Regra em `.ai/rules/js.md`: vazio-por-filtro ≠ vazio-inicial, cada um com sua ação.
- **Não trazer o corpo Tailwind/tokens do ctfinance** (o do boilerplate ainda importa `@radix-ui/themes`) — é dimensão 6. `data-testid="empty-state"` só junto do teste de regressão, senão nasce peça morta.

### E6 + E20 · `[absorver]` ARIA do campo: erro não anunciado e `aria-invalid` sobrescrito · P · risco baixo · **1 PR**

- **E6 — `InputError` não é live region:** `components/input-error.tsx` renderiza `<p>` sem nada; 27 mensagens de erro aparecem em silêncio para leitor de tela.
  - **⚠️ Absorver o problema, REJEITAR o remédio do derivado:** o ctfinance põe `aria-live="polite"` no próprio nó, e **`aria-live` num nó recém-montado não anuncia** — a região precisa preexistir. Escopo correto: (a) `form-field.tsx` renderiza SEMPRE o slot de erro (`<p id={errorId} aria-live="polite">{error ?? ''}</p>`), id estável, sem montar/desmontar; (b) `input-error.tsx` ganha `role="alert"` (é o mecanismo para nó inserido dinamicamente) + `data-slot="input-error"` + guard `message.trim() === ''`.
  - Modelo interno melhor que o do ctfinance: `pages/users/index.tsx:139` já faz o padrão certo.
  - Ressalva a anotar: com 4 erros de um 422, 4 `role="alert"` disparam em série; região única de nível de formulário é evolução futura, fora desta fatia.
- **E20 — `DateInput` sobrescreve o `aria-invalid` do `FormField`** (ordem de spread). **⚠️ A primeira correção sugerida pelo caçador ("mover para antes do spread") está ERRADA e reintroduz o bug espelhado** — o `cloneElement` do `FormField` grava `'aria-invalid': undefined` como chave própria quando não há erro, e o `undefined` do pai apagaria o `invalid` do próprio `DateInput`. Só a **fusão** funciona: `aria-invalid={props['aria-invalid'] ?? invalid ?? undefined}`. Regra em `.ai/rules/js.md`: em wrapper de primitivo, ARIA próprio se FUNDE com o de `props`, nunca é redeclarado depois do spread.
  - Alcance real hoje: os 2 usos (`date-range-filter.tsx:87,96`) não passam por `FormField` — nada quebra em tela; é trava para quando o E7 rodar.
- Não copiar as classes do ctfinance (`text-destructive` + tokens) — dimensão 6.

### E22 + E24 · `[guard-rail]` navegação: sem landmark, sem `aria-current`, sem skip-link · P · risco baixo · **1 PR**

- **E22:** `nav-main.tsx:57-61` — extrair `const active = isItemActive(item)` e passar `aria-current={active ? 'page' : undefined}` no `<Link>` (o `asChild`/Slot cai no `<a>`); `app-sidebar.tsx:47` ganha `role="navigation"` + `aria-label`. **Não tocar em `ui/sidebar.tsx`** (código shadcn, tem de continuar rastreável ao upstream).
- **E24:** `id="conteudo"` + `tabIndex={-1}` em `app-sidebar-layout.tsx:18`; `<a href="#conteudo">` escondido antes do `<AppSidebar/>`.
  - **⚠️ Fato do caçador invertido:** ele mandou ancorar no `<main>` de `app-content.tsx:14` — esse é o ramo `variant="header"`, alcançável só pelo layout morto. O `<main>` de toda página autenticada é o de `ui/sidebar.tsx:304` (`SidebarInset`), via `app-layout.tsx:1` → `app-sidebar-layout.tsx:18` → `app-content.tsx:10`. Seguir o caçador daria um skip-link apontando para id inexistente. Verificado que `AppContent` repassa `{...props}` nos dois ramos e `SidebarInset` espalha em `:311` — um único call site cobre tudo sem tocar no primitivo.
- Correções menores de contagem do caçador: são **5** linhas de `<nav|role=navigation` (não 6); `<ul>` em `sidebar.tsx:451` (não 449); `<li>` em `:462` (não 460).

### E21 + E12 · `[guard-rail]` + `[absorver]` diálogo destrutivo · P · risco baixo · **1 PR, 1 arquivo**

- **E21:** `delete-confirmation-dialog.tsx:33` — tornar `description` **obrigatória** no tipo, espelhando `ui/confirm-dialog.tsx:6`, e render incondicional em `:90` (alertdialog exige descrição pela APG; os 2 call sites já passam, custo zero). Remover o `role="button"` redundante em `page-info.tsx:72`.
  - **⚠️ Fato do caçador errado:** "é o que dispara o warning do Radix" — `@radix-ui/react-dialog@1.1.23` **não tem esse warning** (`grep -n "warn"` no dist → 0 linhas). O argumento se sustenta em ARIA, sem ruído de console.
  - **Fora do escopo:** as strings de fallback do ctfinance (ruído na árvore de a11y) e `helpDescription` no `PageHeaderProps` (componente com **0** call sites — mexer nele é arrumar código morto).
- **E12:** adicionar (não "reintroduzir") `confirmationNote?: ReactNode` como override do parágrafo de consequência, com o texto atual de default.
  - **⚠️ Quatro fatos do caçador errados:** o boilerplate **nunca teve** o prop (`git log -S "confirmationNote" -- resources/js/` → zero commits); o ctfinance o adicionou em `ebbee55` (2026-04-29), depois do fork. O texto "não pode ser desfeita" é o original de `400fb2f`, não substituiu nada. E ele **não é falso hoje**: o boilerplate não tem `SoftDeletes` em nenhum modelo e os 2 call sites são hard delete.
  - No mesmo diff, os dois achados que pesam mais e ele omitiu: devolver `w-full sm:w-auto` aos botões do rodapé (rotear com D14) e pôr fallback na `DialogDescription` em vez do render condicional.
- Copy do texto default é dimensão 7. Modernização futura anotada: trocar o `Dialog` + `role` hand-rolled pelo `AlertDialog` de `@radix-ui/themes` (sem dep nova) — fora do escopo.

### E23 · `[absorver]` `<div role="button">` na busca: não focável, sem teclado · P · risco baixo

- **Único defeito vivo desta família:** `components/data-table/search-bar.tsx:56` — `<div className="cursor-pointer" onClick={focusInput} role="button" aria-label="Focar busca">`, sem `tabIndex`, sem handler de teclado. O ctfinance usa `<button type="button">` (`search-bar.tsx:57-68`).
- **⚠️ O fato central do título original era falso:** "botões só-ícone sem nome em toda página autenticada" — `AppHeaderLayout` **não é importado por ninguém** e `layouts/app-layout.tsx:1` importa fixo o `app-sidebar-layout`; nenhum dos dois botões renderiza jamais. O cabeçalho real (`app-sidebar-header.tsx:9`) usa `SidebarTrigger`, que **tem** nome acessível (`ui/sidebar.tsx:272`).
- Teste Vitest sobre `SearchBar`: todo elemento com role interativo é focável e tem nome. **Não escrever teste contra `AppHeader`.**
- Item separado, decisão de escopo do boilerplate e não de a11y: **remover `app-header.tsx` + `app-header-layout.tsx`** (código morto com botão inerte).

### E18 · `[guard-rail]` toast de erro anunciado como `polite` · P · risco baixo

- `toast-config.ts:45-58` e `:63` — acrescentar `ariaProps: { role: 'alert', 'aria-live': 'assertive' }` em `toastErrorOptions` e `toastWarningOptions`, mantendo `polite` em success/info. Teste em `test/hooks/use-flash-messages.test.ts`.
- **⚠️ Não mexer em `duration`, e em hipótese alguma usar `Infinity`** — `ui/toast-provider.tsx` não tem botão de dispensa; viraria toast preso. No máximo ~8s, e só com afordância de fechar entregue junto.
- Justificar pelo comportamento de live region inserida dinamicamente, **não** por "fila de anúncios" (especulação do caçador).

### E25 · `[guard-rail]` a live region da busca anuncia o começo e nunca o resultado · P · risco baixo

- `pages/users/index.tsx:139-141` anuncia "Buscando…" e nunca o desfecho. Mover a região para dentro de `components/data-table/search-bar.tsx` (que **já** é dona da prop `isSearching` — `:16`; o caçador propôs componente novo desnecessário), com prop opcional de contagem/rótulo. Teste Vitest cobrindo as três fases.
- Onde a implementação emperra de verdade e o caçador não apontou: a contagem de resultados não existe no hook, tem de vir das props da página. Texto exato é dimensão 7.
- Valor honesto: ganho de **uma** tela hoje; o retorno está em não replicar nos derivados o copy-paste de 11 páginas do ctfinance.

### ~~E2~~ ✅ APLICADO · PR [#68](https://github.com/Simplify-Technology/boilerplate/pull/68) · `[absorver]` consumo de flash opt-in por página

> Aplicado como **um** `router.on('flash')` em `app.tsx`, não como hook subido para dois layouts. `use-flash-messages.tsx` e as 9 chamadas por página foram apagados.

- **Regra escrita e violada:** `.ai/rules/js.md:15` diz "cada página Inertia chama `useFlashMessages()`". Medido: 17 páginas, **9** chamam, 8 não (as 6 de `auth/`, `dashboard.tsx`, `errors/error-page.tsx`).
- **Três mensagens comprovadamente mortas:** `EnsureUserIsActive.php:29-31` (`->with('error', 'Sua conta foi desativada…')` → `login.tsx` só renderiza a prop `status`, `:43-45`) · `bootstrap/app.php:67-68` (419 → `back()` → login) · `StartImpersonateController.php:41-42` (→ `dashboard.tsx`, mitigado só pelo banner).
- **⚠️ O guard-rail proposto pelo caçador (varredura estática de destino de `->with()`) não se sustenta** — descartar. O que fica: teste Vitest do ponto único com `flash.error` + Pest que assere que `EnsureUserIsActive` redireciona **com** a flash.
- **Escopo:** consumo em UM lugar (`app.tsx`/`ssr.tsx` ou `app-layout` + `auth-layout`, com decisão explícita para `errors/error-page.tsx`, que não usa layout), remover as 9 chamadas, reescrever `.ai/rules/js.md:15` para "o ponto de montagem chama; página nenhuma chama".
- **Ver a proposta ao dono abaixo** — o Inertia 3.6 tem flash nativo e isto pode ser resolvido de outra forma. **Não abrir esta fatia antes da decisão.**

### E7 + E8 · `[guard-rail]` `FormField` existe, é testado e tem zero adoção · M · risco **médio** · **3 fatias, nesta ordem**

- **Medido:** 0 usos de `FormField` no boilerplate; 27 `InputError` hand-rolled, **0** com `aria-describedby`, `aria-invalid` só em `user-form`. No ctfinance: 16 usos em 6 arquivos.
- **⚠️ Correção da lente — NÃO é migração mecânica:** o próprio arquivo de referência (`ctfinance onboarding/show.tsx:1710-1737`) mostra o `FormField` **perdendo `aria-describedby` e `aria-invalid` em silêncio** quando o filho é a raiz `<Select>` do Radix — e o boilerplate tem a mesma forma em `user-form.tsx:191-214`. O modo de falha é silencioso e a suíte atual não o pega. Os 27 campos não são uniformes (Select, Checkbox, Textarea, Label sr-only).
- **Fatia 1 — ENDURECER antes de migrar:** aviso em dev (ou estreitamento de tipo) quando o filho não aceita os props injetados + teste novo em `form-field.test.tsx` com `<Select>`/`<SelectTrigger>` provando qual é o filho legal.
- **Fatia 2 — as 5 páginas de `pages/auth/`** (login, register, reset-password, forgot-password, confirm-password): 11 dos 27, todos `<Input>`, menor superfície, e é o que os 7 derivados copiam. **Preservar o `required` nativo** dos 6 inputs existentes. Delta visual a tratar: `grid gap-2` → `flex flex-col gap-2` + `FORM_CONTROL_LABEL_CLASSNAME`.
- **Fatia 3 — `settings/` e `user-form.tsx`** (16 restantes), tratando Select/Checkbox/Textarea um a um (o filho do `FormField` sendo o `SelectTrigger`).
- **E8 (só depois da fatia 2):** ESLint `no-restricted-imports` proibindo `@/components/input-error` fora de `resources/js/components/ui/**` — ferramenta nativa, roda no editor, zero código novo (a regra **não** está no `eslint.config.js` hoje). Em `warn` com contagem decrescente durante a migração, em vez de inventar allowlist. **Descartar a varredura de filesystem copiada do teste de impersonation** — redundante com o lint, e ela trava quem *renderiza* o erro, não quem *liga* o erro ao campo (passaria verde justamente no cenário de regressão do E7).
- Teste de varredura de `aria-describedby` entra ao final, escopado a `pages/auth/**` enquanto o resto não migrar.

### E9 · `[absorver]` máscara inline no `onChange` sem preservação de caret · M · risco baixo

- **⚠️ O fato central do caçador estava errado:** ele disse "o boilerplate hoje tem 0 offenders — nasce verde". **Há 3 offenders vivos**, exatamente o padrão do docblock: `components/user-form.tsx:172-175`, `:235-238`, `:257-260`.
- **Ordem invertida pela lente:** (1) PRIMEIRO corrigir os 3, trocando por `<MaskedInput>`, **acrescentando `mobile: applyMobileMask` ao mapa `MASKS`** (`masked-input.tsx:5-11` — não existe hoje, a migração do campo Celular não é 1:1), com teste de caret (editar no meio, backspace sobre separador) em `test/components/masked-input.test.tsx`. (2) SÓ ENTÃO ligar a trava, e mirando o padrão certo: varredura por `apply*Mask(` **dentro de `onChange`**, não ban de import — senão `pages/users/show.tsx:30-32` (leitura legítima) vira falso positivo. (3) Uma linha em `.ai/rules/js.md` com o motivo (caret) e o ponteiro para `MaskedInput`/`CurrencyInput`.

### E1 · `[guard-rail]` o motivo do bloqueio morre na fronteira do hook · M · risco baixo

- **Defeito vivo:** `hooks/users/use-user-actions.ts:8,11,28-29,68-69` e `hooks/permissions/use-permission-actions.ts:44-45,76-77,106-107` declaram `onError?: () => void` — **descartam o errors bag**. O backend produz 10 motivos acionáveis (`RevokeRoleController.php:43,48,65,85`; `AssignRoleController.php:46,51,58,75,97,116`) e o usuário vê "Erro ao remover cargo. Por favor, tente novamente." para uma ação que **nunca** vai passar. Revogar o próprio cargo em `/users` mostra **zero** texto. `grep -rn "errors\.error" resources/js/` → 0.
- **⚠️ Correção de escopo da lente:** reduzir aos caminhos que de fato fazem `withErrors` — `use-permission-actions.ts` (3 callbacks) e o `onRevokeRoleError` de `use-user-actions.ts`. **Não** mexer no `onDeleteError` de users: `User/DestroyController.php:14` usa `$this->authorize()` → 403 → `errors/error-page` (`bootstrap/app.php:57`); não existe bag ali.
- Assinatura passa a `(errors: Record<string,string>) => void`; `delete-confirmation-dialog.tsx` ganha `error?: string` renderizado **antes do `DialogFooter`, dentro do diálogo** — corrigindo a colocação que o próprio ctfinance errou (`categories/index.tsx:127-131` pinta no corpo da página com o diálogo aberto; `bank-accounts/index.tsx:75` descarta tudo).
- Guard-rail: Vitest do diálogo com erro + Pest assertando `withErrors(['error' => ...])` ao revogar o próprio cargo (fixa a chave). **Descartar a regra de ESLint proposta.**

### E5 · `[guard-rail]` 429 dos limiters do boilerplate sem tratamento · M · risco baixo

- Escopo reduzido: `Limit::response()` em `AppServiceProvider::configRateLimiting()`, **só** nos limiters `verification` e `impersonate` — `back()->with('error', 'Muitas tentativas. Aguarde N segundos…')` com o N vindo do `Retry-After` que o framework já passa ao callback.
- **⚠️ Deixar o limiter `auth` e o `bootstrap/app.php` intactos** — `AuthRouteThrottleTest.php:62` fixa o 429 cru e quebra com correção global.
- **Dois fatos do caçador errados:** (1) "o modal do Inertia mostra o HTML padrão do **Symfony**" — o Laravel 13.24 tem view própria de 429 (`Foundation/Exceptions/views/429.blade.php`); o sintoma visível é o mesmo, a atribuição é falsa. (2) Contradição interna: ele afirma que 429 não cai em nenhum ramo do handler **e** que `error-page.tsx:29` responderia "Erro interno" — o fallback jamais é alcançado. **Descartar também o recado de revisar `bootstrap/app.php:57`** (aquele guard preserva a página de debug do framework em `local`; é decisão deliberada de DX, não carona deste PR).

### E3 · `[guard-rail]` `/` não é destino: logout e auto-exclusão ricocheteiam mudos · P · risco baixo

- `AuthenticatedSessionController.php:40` e `ProfileController.php:52` fazem `redirect('/')`, que é rota autenticada — o usuário ricocheteia até o login sem mensagem nenhuma.
- Escopo: trocar por `to_route('login')->with(...)`; atualizar os **2 testes** que assertam `'/'` (omissão do caçador, e não estava no esforço); resolver os **4 links `route('home')`** das 3 auth layouts (apontar para `login` ou dar a `/` uma página pública) — é o sintoma mais visível e também não estava na evidência.
- Guard-rail: Pest assertando `assertRedirect(route('login'))` em **um** salto. A mensagem de chegada depende do E2 estar no ponto único — os dois andam juntos.

### E16 · `[absorver]` sem variante mobile-card e sem piso de alvo de toque · M · risco baixo · **2 fatias**

- **Fatia A (P, vale agora):** piso de alvo de toque como regra + asserção — `min-h-11` nos alvos interativos primários de lista, com escape de breakpoint para não engordar a linha desktop; regra em `.ai/rules/js.md` citando WCAG 2.2 Target Size; teste Vitest no estilo `transaction-mobile-card.test.tsx:67`. Medido: **0** `min-h-11` no boilerplate contra 19 em 9 componentes no ctfinance.
- **Fatia B (M, só com aval do dono):** `components/users/user-mobile-card.tsx` reusando `UserActionsMenu` e `getUserInitials`, com toggle `sm:hidden` / `hidden sm:block` em `pages/users/index.tsx`; trocar `@/content/phase-one-surface-copy` (que o boilerplate não tem) por strings locais; desenho visual do card deferido à dimensão 6. **Regra obrigatória junto:** card e linha COMPARTILHAM o mesmo `{modulo}-actions-menu`, nunca reimplementam ações.
- Correções da lente: são **9** páginas com o par (não 8); o boilerplate **tem** tratamento responsivo parcial que o caçador não citou (`pages/users/index.tsx:223`, `hidden md:table-cell`); `h-8 w-8` está em `user-actions-menu.tsx:46`; aplicar `min-h-11` nesse trigger altera **também** a tabela desktop (dimensão 6). Distinto de D14 (auditoria de 56 rotas).

### E19 · `[guard-rail]` peças mortas do kit data-table · P · risco baixo

- Refeito grep a grep: `DataTableHeader` = 1 linha (a declaração) nos dois projetos · `DateRangeFilter` sem consumidor de produção e inexistente no ctfinance · `use-user-search` sem consumidor e inexistente no ctfinance · cabeçalhos não clicáveis (`pages/users/index.tsx:216-239`).
- **AGORA (P):** decisão binária registrada. Recomendado apagar `components/data-table/table-header.tsx` e `hooks/use-user-search.ts` + seu teste (semântica divergente de `hooks/users/use-user-filters.ts:69` — `use-user-search.ts:26` injeta default `'created_at'` onde o outro repassa cru). Manter `DateRangeFilter` só se algum derivado o consumir — **consultar antes de apagar**.
- Se a escolha for LIGAR a ordenação em vez de apagar: **E17 é pré-requisito obrigatório**, senão vira 500 alcançável por clique.
- **`[dep-nova]` separado:** `knip` (ou `eslint-plugin-import`) para detecção contínua de export órfão — **nenhum dos dois está instalado** e `eslint.config.js:1-7` não os carrega; o caçador propôs `no-unused-modules` como se fosse configuração. Não pode viajar embutido num PR de limpeza.

### E4 · `[guard-rail]` contrato de gate que redireciona · P · risco baixo · **só documentação**

- Em `.ai/rules/middleware.md` (o glob já aponta para `app/Http/Middleware/**`): (a) gate que redireciona isenta o próprio destino + settings + logout, com a razão escrita por entrada; (b) memória do destino é `redirect()->guest()` + `redirect()->intended($default)` — **nunca serviço próprio com chave de sessão paralela**; (c) gate insatisfazível explica na própria tela em vez de redirecionar. `EnsureUserIsActive` entra como contraexemplo de gate que não redireciona.
- **Descartar o teste Pest de contrato** — nasce vácuo.
- Correção da lente: o caçador conflacionou dois arquivos (quem grava o destino é `RedirectPendingOnboardingProfileSelection.php:38`, não `OnboardingEntryRedirector.php:38`) e, pior, apresentou o `OnboardingEntryRedirector` como padrão a absorver quando ele **reimplementa `redirect()->guest()`**.

### E10 · `[guard-rail]` validação progressiva de form longo · P · risco baixo · **só documentação**

- Duas frases em `.ai/rules/requests.md`, **sem canonizar o arquivo do ctfinance**: (1) validação por etapa de wizard usa **Precognition** (`HandlePrecognitiveRequests`, presente no framework 13.24 instalado) + `<Form>` do Inertia com `validate({only})` — não um discriminador `intent` no payload; (2) se for preciso PERSISTIR parcial, o ramo frouxo escreve num slot de rascunho separado, mantém o mesmo `authorize()` com `$this->user()->can(...)` (regra vigente de `requests.md:9`) e **não pode avançar a máquina de estado** — porque `intent` vem do cliente.
- O Request modelo do ctfinance tem `authorize(): return true` (`:13-16`), em conflito direto com `requests.md:9` do boilerplate. Citar o gate de `current_step` como o padrão, não o `return true`.
- Nota: o cliente `laravel-precognition-react-inertia` **não** está em `node_modules` — adotá-lo seria `[dep-nova]`.

### E11 · `[guard-rail]` visita repetida disparada por digitação · P · risco baixo · **só documentação**

- Entrada curta em `.ai/rules/js.md`, ao lado das regras de Inertia que vieram de D2/D3: autosave, filtro persistido e gravação por polling precisam de (a) debounce com cleanup no unmount, (b) dedup por assinatura do payload com refs de "último persistido" e "último tentado", (c) guard contra corrida com o submit explícito, (d) `preserveState: true` para o redirect não clobberar o form.
- **⚠️ O fato central do caçador está errado:** "sem `replace: true` cada autosave empilha uma entrada no histórico". **Falso neste código** — o PATCH responde `to_route('onboarding.show')`, mesma URL, e o Inertia 3.6.1 já seta replace sozinho (`isSameUrlWithoutHash` no core; docs v3: "Visits made to the same URL automatically set replace to true"). Usar `replace: true` **só** quando a resposta muda a URL. E `preserveState` não é acessório: é o que protege o estado do form.

## Novos `[rejeitado]` da dimensão 5 — registrados para não re-descobrir

| Achado | Origem | Motivo (lente que derrubou) |
| ------ | ------ | --------------------------- |
| Janela de arrependimento em exclusão de conta (7 dias + banner + cancelar) | `Settings/Privacy/{Schedule,Cancel}AccountDeletionController` | REFUTAR: é a metade UX do **B1**, que mexe na mesma coluna, controller e comando de expurgo — dois cards na mesma coluna abrem PR conflitante. "7 dias" é decisão de produto de app financeiro; o que generaliza ("destrutivo de conta tem estado e volta") já está no B1. ATUALIDADE: o comando custom é desnecessário — `SoftDeletes` + `Prunable` + `model:prune` é a expressão nativa (o `User` do boilerplate não usa nenhum dos dois). RISCO: o modelo exibido como exemplar contém o anti-padrão da casa — `Privacy/ShowController.php:19` é um **segundo canal** para `pendingDeleteUntil`, que o `share()` já publica em `HandleInertiaRequests.php:75`. |
| `intent` explícito no payload como contrato de rascunho parcial | `UpdatePfFirstValueRequest.php:20,22,27,34` | REFUTAR: regra prescrevendo para código que o boilerplate não tem **e não tem plano de ter** — wizard multi-etapa com rascunho servidor não é necessidade previsível de um painel administrativo, e `.ai/rules/requests.md` entra no contexto de todo agente que toca `app/Http/Requests/**` (imposto de contexto). Único candidato da leva sem nenhum defeito de casa revelado. ATUALIDADE: **Precognition** (nativo, instalado) resolve a validação progressiva sem ramo de `intent`; `useRemember` do `@inertiajs/react` 3.6 resolve a metade cliente. Sobreviveu **só** a parte documental, que virou o E10. |
| `required` do `FormField` é só um asterisco `aria-hidden` | `ui/form-field.tsx:66-70` | REFUTAR: **conclusão falsa nos dois lados.** No boilerplate o `FormField` tem 0 call sites e as telas reais põem `required` **nativo** no `<Input>` (`login.tsx:56,80`; `register.tsx:44,61,77,93` — 6 verificados), que mapeia para `aria-required` na árvore de acessibilidade. No ctfinance idem (`register.tsx:77,91,105`) — o que existe lá é cheiro de DRY, não furo de a11y. Não protege um pixel renderizado hoje; vira **critério de aceite do E7**, não item próprio. |
| `eslint-plugin-jsx-a11y` | ausência nos dois projetos | REFUTAR: **bloqueio duro, não decisão** — o boilerplate roda ESLint **10.8.0** e o `eslint-plugin-jsx-a11y@6.10.2` (última publicada) declara peer `eslint: ^3 \|\| … \|\| ^9`. Instalar exige override de peer no linter que trava todo push. E o rendimento é de 1 arquivo: o exemplo usado para vendê-lo é código morto, e o plugin não enxerga componentes sem mapa `settings['jsx-a11y'].components`. ATUALIDADE: o que pega o que ele estruturalmente não pega (nome acessível computado através de `<Button>`, Slot do Radix, `asChild`) é **axe sobre o DOM renderizado na suíte Vitest que já existe** — `jest-axe@11` é mantido e roda sob Vitest via `expect.extend`. Axe teria pego 4 achados desta célula; o lint, nenhum. Ver `[dep-nova]`. |

## Decisões que precisam do dono (dimensão 5)

### ADR/arquitetura — canal de flash nativo do Inertia 3.6 (subsome E2 + E13)

O Inertia 3.3+/3.6 tem **flash nativo**: `Inertia::flash()` no servidor, `Page['flash']` no payload, e o evento `inertia:flash` / `router.on('flash')` no cliente (`@inertiajs/core/types/types.d.ts:45,85`). O boilerplate reimplementa isso com `->with()` + prop no `share()` + `hooks/use-flash-messages.tsx` + 9 chamadas por página. Migrar resolveria E2 e E13 de uma vez e apagaria o hook caseiro, com um `router.on('flash')` registrado uma vez em `app.tsx`.

Não conflita com ADR vigente — é escolha de arquitetura ainda não registrada. **Caminho conservador** (fallback, se o dono preferir): hook num ponto único de montagem + `Inertia::always()` no `share()`, assumindo a dívida contra o nativo e registrando no PR. **Nenhuma fatia de flash deve abrir antes desta decisão.**

### `[dep-nova]` — represados aguardando aprovação

| Pacote | Origem | Para quê | Fatia dependente |
| ------ | ------ | -------- | ---------------- |
| `jest-axe ^11` (dev) | lente de ATUALIDADE da dimensão 5 (nenhum projeto-fonte tem) | axe sobre o DOM renderizado na suíte Vitest existente (`vitest 4.1.10` + `@testing-library/react 16.3.2` + `jest-dom 7.0.0`), via `expect.extend`. Teria pegado E6, E21, E22 e E23 de uma vez. `vitest-axe` está abandonado em 0.1.0 — não é alternativa. | trava contínua das fatias de a11y |
| `knip` **ou** `eslint-plugin-import` (dev) | E19 | detecção contínua de export órfão; nenhum dos dois está instalado | E19 (a limpeza manual não depende disto) |
| ~~`eslint-plugin-jsx-a11y`~~ | — | **rejeitado por incompatibilidade de peer com ESLint 10**, não por falta de aprovação | — |

## Secagem da dimensão 5 — E26–E30 (verificados nas 3 lentes, 5 de 6 sobreviveram)

A passada extra rendeu uma família que nenhuma das 4 frentes viu: **código morto herdado do starter kit**, e um bug de diálogo que está em todos os 7 derivados por construção.

### E30 · `[guard-rail]` o erro de senha sobrevive ao Esc e ao X · P · risco baixo · **multi-fonte confirmado**

- **Bug vivo:** `components/delete-user.tsx:52` monta `<Dialog>` **não controlado** (sem `open`, sem `onOpenChange`); `closeModal()` (`:26-29`, o único que faz `clearErrors()` + `reset()`) está pendurado **só** no botão Cancelar (`:82-86`). O X (`ui/dialog.tsx:64-68`, sempre renderizado), o Escape e o clique fora não passam por ele. O `useForm` vive **fora** do `<Dialog>`, então não desmonta: quem errou a senha, fechou com Esc e reabriu vê "senha incorreta" sobre um campo vazio, como se a tentativa nova já tivesse sido rejeitada.
- `grep -rn "clearErrors" resources/js` → **2 linhas, ambas neste arquivo**.
- **O padrão certo já existe na casa:** `ui/confirm-dialog.tsx:44-48` usa `onOpenChange={(next) => { if (!next) onCancel(); }}`, e `delete-confirmation-dialog.tsx:29-30` recebe `open`/`onOpenChange`. `delete-user.tsx` é o outlier — o conserto é **alinhar ao padrão da casa**, não inventar padrão.
- **Escopo:** tornar o Dialog controlado, cobrindo Esc/X/overlay/Cancelar por um funil único. Teste Vitest: submeter → erro renderizado → Escape → reabrir → `InputError` sumiu. Uma linha em `.ai/rules/js.md` (não nasce vácuo: há 3 diálogos na árvore para policiar).
- **Multi-fonte medido:** `ctfinance delete-user.tsx:51,84,13,27` tem o bug byte a byte. É arquivo verbatim do starter kit — **todo derivado tem**.
- Modernização anotada (não requisito): o `<Form>` do Inertia v3 expõe `clearErrors` e `resetAndClearErrors` como slot props.
- Lente: **nenhum fato do caçador errado.** Só ajuste de rótulo — sem o teste isto é bug fix de um arquivo; com o teste vira guard-rail.

### E27 + E29 · `[guard-rail]` + `[absorver]` código morto do starter kit que finge cobertura · P · risco baixo · **1 PR**

- **E27 — `layouts/app/app-header-layout.tsx` é órfão.** `grep "app-header-layout|AppHeaderLayout"` → **1 linha, a própria declaração** (`:7`). `layouts/app-layout.tsx:1` importa fixo o `app-sidebar-layout`. Só o `app-sidebar-layout.tsx:20-24` monta o `<ImpersonateBanner>`, que é a **única** saída da personificação em código de app (`grep stopImpersonation` → só `impersonate-banner.tsx:1,17`; o `user-menu-content.tsx` tem apenas "Configurações" e "Sair").
  - **⚠️ Tempo verbal do caçador errado:** "quebra a saída da personificação" — hoje **não quebra**, porque ninguém renderiza o layout morto. É armadilha latente: quem trocar o template em `app-layout.tsx:1` perde a saída e **nenhum teste reclama**. A fatia D2 não cobre isso — ela trava *como* se troca de identidade (flush + posse de rota) e renderiza o banner isolado (`test/lib/impersonation.test.tsx:81-87`), mas nada afirma que um layout o **monta**.
  - **Escopo (reduzido de M para P): deletar** o layout, não preenchê-lo. `components/app-header.tsx` fica órfão junto (1 único importador é o layout deletado) — decidir no mesmo PR. Guard-rail que sobrevive à próxima troca de template: teste Vitest que renderiza `layouts/app-layout.tsx` com `auth.impersonating.active=true` e exige o link de saída.
- **E29 — o único caminho vivo de personificar é mudo, e trava o menu aberto.** `components/users/user-actions-menu.tsx:106-117` chama `onImpersonate` sem estado nem feedback. **Achado que o caçador não viu e é o mais concreto:** o `e.preventDefault()` de `:109` suprime o `handleSelect` do Radix (`react-menu@2.1.24/dist/index.mjs:397` usa `composeEventHandlers` com `checkForDefaultPrevented=true`), então **o dropdown não fecha** — inconsistente com todos os irmãos do mesmo menu.
  - **⚠️ A premissa "dois caminhos" é FALSA:** `components/user-details-dialog.tsx` (o suposto caminho com feedback) é **código morto** — `grep "UserDetailsDialog"` → 2 hits, ambos dentro do próprio arquivo; `grep "user-details-dialog"` → **0**. A página real (`pages/users/show.tsx`) não tem personificação.
  - **⚠️ "Nenhum dos dois barra o clique duplo" é FALSO nas duas metades:** o diálogo morto barra (`:193`), e o `@inertiajs/core` 3.6.1 **já aborta a visita em voo** (`dist/index.js:3015-3018` `maxConcurrent: 1, interruptible: true` + `:3173` `interruptInFlight()`). **Não implementar guarda de duplo-POST.**
  - **Escopo:** deletar `user-details-dialog.tsx` (é o chamariz que fez o caçador — e faria o próximo leitor — acreditar que existe um caminho bom); remover o `preventDefault()` ou trocar por `onSelect` com `pending` explícito; um teste Vitest no menu.
- **Tema consolidado — código morto do boilerplate medido nesta célula:** `app-header-layout.tsx`, `app-header.tsx`, `user-details-dialog.tsx`, `layout/page-header.tsx` (0 call sites), `data-table/table-header.tsx`, `hooks/use-user-search.ts`, `DateRangeFilter` (ver E19). Sete peças. Duas delas fizeram caçadores errarem o diagnóstico nesta mesma célula (E23 e E29) — **código morto não é só peso, é desinformação ativa**. Candidato natural a uma fatia de limpeza única, mais o `[dep-nova]` `knip` do E19 para não reacumular.

### E28 · `[absorver]` `loading`/`aria-busy` no `Button` · M · risco médio

- **Medido no boilerplate:** `grep "animate-spin"` → **16**; `grep "aria-busy"` → **0**; `grep 'disabled={processing'` → 24. Os 16 se partem em **2 idiomas**: 6× `<LoaderCircle className="h-4 w-4 animate-spin" />` (as 6 páginas de auth) e 10× div artesanal com `border-2 border-current border-t-transparent`.
- **Origem:** `ctfinance ui/button.tsx:41-88` tem `loading`, `loadingText`, `aria-busy`, `aria-disabled` e ícone com `data-slot`, coberto por `test/components/Button.test.tsx:53`.
- **⚠️ Risco de regressão ao copiar verbatim — o item mais importante desta entrada:** `ctfinance ui/button.tsx:60,82` faz `shouldRenderLoadingIndicator = loading && !asChild` e `disabled={asChild ? undefined : isDisabled}` — com `asChild` ele **não passa `disabled`**, só `aria-disabled`. O boilerplate tem exatamente um call-site destrutivo com `asChild`: `delete-user.tsx:86` (Excluir Conta). Absorver sem ajuste faria esse botão **perder o `disabled` real e voltar a ser clicável durante o envio** — falha ABERTA num caminho de exclusão de conta. **Divergir do ctfinance nesse ponto: manter `disabled` real também sob `asChild`.**
- **Escopo:** (1) `loading`/`loadingText`/`aria-busy` em `ui/button.tsx` com a divergência acima; (2) repassar `busy → loading` em `ui/confirm-dialog.tsx:57-68` (o caçador não viu que a lacuna está em **2** lugares); (3) corrigir `delete-user.tsx:86` tirando o `asChild`; (4) um teste Vitest espelhando o do ctfinance. Migrar os outros 15 spinners artesanais é follow-up e **não bloqueia**.
- **Lente de atualidade:** `useFormStatus` do react-dom 19.2.8 **não substitui** — só reporta dentro de `<form action={fn}>` (React Actions), e o boilerplate submete por `useForm` + `onSubmit` do Inertia, então reportaria sempre `pending:false`. O `<Form>` do Inertia v3 dá `processing` como slot prop e elimina o encanamento manual, mas **não** dá `aria-busy` — o `loading` no Button é ortogonal e segue necessário. Nota de modernização: formulários novos usam `<Form>`+`processing` alimentando `<Button loading>`.
- Imprecisão do caçador: `delete-user.tsx:86` não fica "sem nenhum sinal" — a cva aplica `disabled:opacity-50`.

### E26 · `[guard-rail]` Cmd/Ctrl+B da sidebar come tecla dentro de campo de texto, e é invisível · P · risco baixo

- `ui/sidebar.tsx:31,94-105` — handler global de `keydown` com `event.preventDefault()` e **zero** checagem de `event.target`/`isContentEditable`. Alcança toda página autenticada (`app-shell.tsx:25` → `app-sidebar-layout.tsx:17` → `app-layout.tsx:1`).
- **⚠️ Dois fatos do caçador corrigidos:** (1) "sequestra uma tecla de edição de texto" está **exagerado** — não há contenteditable nem editor rich-text no boilerplate (0 ocorrências de `contenteditable|tiptap|slate|quill|lexical`); o dano real é estreito: em macOS, Ctrl+B é o binding Cocoa de "mover o cursor um caractere à esquerda" dentro de `<input>`/`<textarea>`, e o `preventDefault()` come essa tecla. (2) **Não é colheita do ctfinance** — `ctfinance ui/sidebar.tsx:31,98-99` é byte-idêntico e igualmente sem guarda. O que se colhe de lá é só a **dica de atalho** (`balance-visibility-toggle.tsx:57`, `shortcutHint` em Tooltip).
- Atalho invisível: `SidebarTrigger` tem só `<span className="sr-only">Abrir ou fechar o menu lateral</span>` (`ui/sidebar.tsx:272`), sem Tooltip/`title`; `grep -i "⌘|cmd|atalho|shortcut"` → 0 ocorrências que descrevam o atalho a um usuário.
- **Escopo:** early-return quando o alvo é INPUT/TEXTAREA/SELECT ou `isContentEditable`; expor o atalho no `SidebarTrigger`; um teste Vitest disparando Ctrl+B com foco num input. **Não** importar o Cmd+H do ctfinance (o macOS come antes do browser, e lá também não há guarda).
- Custo colateral honesto: `ui/sidebar.tsx` é shadcn vendorizado de 722 linhas e patchear diverge do upstream — mas o arquivo **já** foi localizado (sr-only em pt-BR na `:272`), o precedente existe.
- Multi-fonte: o arquivo é idêntico entre boilerplate e ctfinance; todo derivado com sidebar carrega o mesmo handler.

### `[rejeitado]` da secagem

| Achado | Origem | Motivo (lente que derrubou) |
| ------ | ------ | --------------------------- |
| Guard-rail contra "interruptor de preferência sem ponto de leitura em produção" | `ctfinance NotificationPreferenceService.php:12-16` — `financial_summary` e `recurring_generated` têm **zero** consumidores (só `lgpd_export_ready` é lido, em `ExportReadyNotification.php:28`) | REFUTAR: o defeito no ctfinance é real e medido, mas **não tem contraparte no boilerplate** — não existe nenhuma preferência persistida em banco lá (a única é o tema, em localStorage/cookie, e ela **é** lida em `use-appearance.tsx:22-23`). RISCO: é a armadilha de vácuo do enunciado — `arch()` sobre `App\Services\*PreferenceService` resolve para camada vazia e passa vacuamente; teste por varredura de árvore nasceria com conjunto vazio e apodreceria em silêncio. E a premissa "o teste só prova que o checkbox aparece" é **falsa**: `NotificationsPreferencesTest.php` é Pest de backend com 6 testes (guest→redirect, defaults, PATCH+releitura, 422 de categoria desconhecida, always-on, e o gate real do `ExportReadyNotification`) e **zero** asserção de checkbox. O buraco correto é "nenhum teste prova EFEITO das 2 órfãs". **Resíduo:** uma frase em `.ai/rules` a ser ATIVADA como teste quando a primeira preferência persistida aterrissar no boilerplate. Fora do escopo desta colheita: vale abrir bug no ctfinance. |

## Aplicáveis agora — ctfinance (dimensão 6 — UI)

Fonte: ctfinance @ `b8c6d57` × boilerplate `main` @ `fb3eb67`. **66 sobreviventes de 67 candidatos + 8 da secagem.** Escopo abaixo é o CORRIGIDO pelas 3 lentes.

> **Esta célula tem cadeia de dependência real.** A ordem abaixo não é sugestão: F1 destrava F2/F3/F9/F10 e a metade visual de E6/E12/E14. Aplicar fora de ordem produz PR que "conserta" cor com token que ainda não existe.

### F1 · `[absorver]` + `[guard-rail]` o `@theme` está quebrado de 3 formas · G · risco **médio** · **PRIMEIRO DA FILA, destrava metade da célula**

- **Defeito 1 — `--color-primary` definido duas vezes:** `app.css:37` no `@theme` (`var(--primary)`) × `app.css:108` num `:root` **sem layer** (`#1f3c57`). Sem layer vence `@layer` — confirmado no CSS **compilado** (posições 11239 dentro de `@layer theme{` × 813686 fora de layer). `bg-primary`/`text-primary`/`hover:bg-primary/90` resolvem para `#1f3c57` **nos dois temas**; `--primary` nunca chega a utilitário. `text-primary` no escuro = **1.28:1**. O comentário `/* Buttons/CTAs should be high-contrast in dark mode */` (`:169`) descreve efeito morto.
- **Defeito 2 — mesma colisão em `--color-accent`** (`:46` × `:111`): `hover:bg-accent` de todo `Button variant="ghost"`/`outline` pinta `#379bcb` saturado, igual nos dois temas. Alcance real: **59 matches em 39 linhas** (não 84 — aquilo era `grep -o` e incluía 25 `-foreground`, que não são sombreados).
- **Defeito 3 — [NOVO, nascido na verificação] `@radix-ui/themes` redeclara `--color-background` sem layer** e sequestra `bg-background` no app inteiro. Chega por `app.tsx:7` (`import { Theme }`) — o caçador listou 6 consumidores e omitiu justamente este, que é o que torna a colisão global.
- **⚠️ O mecanismo é uma palavra, a fatia NÃO é:** `@theme {` → `@theme inline {` (`app.css:14`) conserta a resolução, mas a lente mediu que **pós-correção `bg-primary` + `text-primary-foreground` no escuro cai de 11.4:1 para 3.13:1 e reprova AA**. A fatia é a palavra **+ recalibração das duas paletas + revisão visual**. Sem isso é regressão embarcada.
- **Higiene na mesma PR:** renomear os literais de paleta base de `app.css:107-112` para fora do namespace (`--brand-navy`, `--brand-cyan`, …) — 4 deles viram utilitário fantasma do Tailwind sem ninguém querer. E reafirmar `--color-background` depois do `@import` da `:5`.
- **Guard-rail que nasce junto (F4):** teste Vitest lendo `resources/css/app.css` que falha se **qualquer `--color-*` for declarado fora do bloco `@theme`**, mais a asserção de que todo `@import` de folha de terceiro carrega `layer(...)`.
- **Não copiar do ctfinance:** ele tem a mesma colisão (`app.css:119-126`) e não a resolveu. A prova do mecanismo vem de `app.css:299-311`, onde ele remapeia `--color-cyan-*` no `:root` **de propósito**, por saber que o não-layerizado vence.

### F2 · `[absorver]` os 6 pares `--color-success/warning/info(-foreground)` não estão no `@theme` · P · risco baixo · **viaja com F1**

- **Classe morta com call-site vivo:** no CSS compilado (832 KB) há **0** ocorrências de `.text-success`, `.bg-success`, `.text-warning`, `.text-info`, e **0** de `--color-success`. Controle positivo: `.text-destructive` existe. `users/user-actions-menu.tsx:125` escreve `text-success focus:text-success` e a classe é descartada. Hoje os 6 tokens só são lidos pelo CSS de toast (`app.css:615-654`).
- **Escopo:** as 6 linhas de export, no molde de `ctfinance app.css:49-54`. **Tem de vir junto do `@theme inline` do F1**, senão o mapeamento herda o bug.
- **⚠️ Sozinho isso entrega utilitário que reprova em AA no claro:** `text-warning` (#f59e0b sobre branco) **2.15:1**, `text-info` **2.77:1**, `text-success` **3.30:1** — no escuro ficam bons (6.42 / 8.77 / 6.83). Ou vem com o F3, ou os valores claros escurecem antes de virar cor de texto.
- Adoção que justifica: **159** ocorrências de `(bg|text|border|ring)-(success|warning|info)` em produção no ctfinance (o caçador disse 72 — não reproduz).

### F3 · `[absorver]` trio `--state-{status}-{bg,fg,border}` — separar preenchimento de texto · M · risco médio · **viaja com F1+F2**

- **O problema real:** um token achatado por status faz dois trabalhos incompatíveis. `ui/button.tsx:15` usa `bg-destructive text-white` = **3.67:1** no escuro. Clarear `--destructive` para servir de texto piora o botão; escurecer para servir de botão piora o texto.
- **Absorver a FORMA** (`ctfinance app.css:185-196` claro, `:281-292` escuro, classes em `:378-400`), **via `@utility`, não `@layer components`**.
- **⚠️ NÃO copiar os percentuais.** Aritmética refeita ao centésimo: com a fórmula do ctfinance na paleta do boilerplate, **3 dos 4 reprovam** — warning **2.53:1**, info **3.26:1**, success **3.92:1**. Fixar os `fg` como HEX literais derivados de alvo calculado (≥4.5:1 contra o bg do próprio estado; **≥14:1 onde for substituir o emerald atual**, que hoje tem **14.38:1** em `verify-email.tsx` — trocá-lo por soft mal calibrado é regressão).

### F5 · ✅ **APLICADO** (PR [#72](https://github.com/Simplify-Technology/boilerplate/pull/72), 2026-08-12) · `[guard-rail]` `--ring` é igual nos dois temas e dá 1.34:1: o anel de foco é invisível · P · risco baixo

- **Corrigir o VALOR, não absorver a forma.** ~~Dar a `--ring` um par próprio no `.dark`~~ e escolher tons com **≥3:1 contra `--background` E contra `--input`** nos dois temas. ~~Manter `focus-visible:ring-ring/50 ring-[3px]`.~~
- **Nada de `.focus-ring-brand`** (a classe do ctfinance). Se quiser `--focus-ring-{width,offset}`, que sejam vars simples no `:root` consumidas pelos primitivos. ✅ respeitado.
- Correção de método da lente: o caçador compôs `ring-ring/50` em sRGB, mas o CSS compilado usa `color-mix(in oklab, …)`. O hex exato difere; a razão continua em 1.3–1.5, longe de 3:1. Conclusão intacta.

**Três correções que a aplicação trouxe** (o escopo entregue é este, não o de cima):

1. **A prescrição estava invertida.** O `.dark` era o lado CERTO (7.93:1 vs fundo, 5.18:1 vs `--input`); quem reprovava era o `:root` — **1.85:1** e **1.49:1**. O par novo nasceu no tema claro (`--brand-cyan-dark: #2a7ba2`, o `--brand-cyan` na mesma matiz/saturação escurecido de L 50.6% → 40% ⇒ 4.72:1 e 3.81:1).
2. **`focus-visible:border-ring` é no-op em 5 das 6 variantes de `Button`** — pinta só a cor, e o preflight deixa `border-width: 0`. Com `outline-none`, o halo de 50% era o indicador inteiro. O F5 não era "anel fraco": era **foco invisível em todo botão**.
3. **Por isso o "manter `/50`" caiu.** Medido: composto a 50% sobre branco, **nenhum** tom da família ciano alcança 3:1 (teto ~3.08:1, e só com azul quase preto). A fatia trocou `focus-visible:ring-ring/50` → `focus-visible:ring-ring` nos 8 primitivos vivos. O anel de erro (`ring-destructive/20|40`) ficou de fora de propósito — acompanha `aria-invalid:border-destructive` num campo que tem borda.

**Achado que muda o E27:** `ui/navigation-menu.tsx` usa um TERCEIRO idioma de foco (`ring-ring/10 dark:ring-ring/20` + `outline-ring/50`), pior que o de 50%, e é **código morto** — nada importa `layouts/app/app-header-layout.tsx`, único consumidor de `components/app-header.tsx`, único de `navigation-menu`. Os três arquivos somam à lista do E27. Estão em allowlist verificada nos dois sentidos no teste novo, então a limpeza do E27 tem de removê-la junto.

### F9b · `[absorver]` `<Alert variant="destructive">` é texto branco em fundo branco no tema claro · P · risco baixo · **bug visível**

- **⚠️ E o remédio proposto também estava errado:** `bg-destructive/10 text-destructive` dá **4.00:1**, abaixo de AA. A forma correta, que é a do shadcn atual: `border-destructive/30 bg-card text-destructive` — `#e11d48` sobre branco = **4.70:1**.
- Teste: renderizar a variante e exigir que a className resolvida contenha classe de background.
- Correção de citação: a variante `destructive` do ctfinance está em `ui/alert.tsx:12-13`, não `:16-17` (`:16-17` é a `warning`).

### F22 · `[absorver]` `<Link><Button>` produz `<a><button>` em 6 pontos · P · risco baixo · **sem dependência, mandar cedo**

- Os 6 viram `<Button asChild><Link/></Button>`, className migra para o `<Button>`, e a asserção "zero `<Link ...><Button`" entra no mesmo PR nascendo verde.
- **Cuidado que o caçador não citou:** em `pages/users/show.tsx:59,64` e `permissions.tsx:110,116` os botões carregam a string cyan de 190 caracteres — **não limpar a cor aqui** (é o F7), misturar torna o diff ilegível.
- Melhor precedente do caso difícil (Tooltip + `asChild` + `size="icon"`): `ctfinance users/user-table-row.tsx:92`.
- Lente: **nenhum fato errado** — os 6 path:linha, os 12 do ctfinance e o `asChild` em 62 linhas, todos verificados.

### Metades visuais que viajam com fatias já decididas na dimensão 5

Foi para isto que a dimensão 6 foi varrida antes de aplicar a fila da 5. Pareamentos **confirmados pelas lentes**:

| Fatia da dim. 5 | Metade visual que entra no MESMO PR | Dependência |
| --------------- | ----------------------------------- | ----------- |
| **E6** (`input-error.tsx`) | `text-red-600 dark:text-red-400` → `text-destructive`; é a mesma linha 6, diff de ~10 linhas | ⚠️ `--destructive` no escuro dá **3.99:1** como texto — **se F3 não entrar antes, o E6 regride a acessibilidade**; nesse caso entra sem a troca de className |
| **E12+E21** (`delete-confirmation-dialog.tsx`) | 35 literais de cor → tokens de estado; levar junto `settings/delete-account-info-dialog.tsx` | depende de `--color-warning` (F2) |
| **E14+E15** (`empty-state.tsx`) | corpo `@radix-ui/themes` → Tailwind + `<h3>` + ícone em chip com `aria-hidden`; toca 3 arquivos (`role-users-table.tsx:137,141` é call-site) | nenhuma. **NÃO** acoplar o escopo do CSS do Radix (F6) aqui |
| **E16 fatia A** (piso de toque) | `--radius-control`/`--touch-target-comfort` no `@theme` + `<InfoTrigger>` | ⚠️ o CVA `icon: size-9→size-11` muda **1 call-site vivo** — quase no-op; o valor está no `<InfoTrigger>` e na regra |
| **E18+E23+E25** (`search-bar.tsx`, `toast-config.ts`) | variantes `toolbar`/`toolbarActive` + `buttonVariants()` como fábrica; botões-ícone reusam `buttonVariants` | mesmo par de arquivos que `filter-toggle.tsx`; se a recalibração de `toolbarActive` depender do F1, corte o escopo |
| **E28** (`loading`/`aria-busy` no Button) | vencedor visual é o `LoaderCircle` com `data-slot="button-loading-icon"`; `aria-hidden` no ícone | — |
| **E22** | `aria-current` aparece **1 vez** no repo inteiro, dentro do breadcrumb | — |
| **E27** | mais **4 layouts órfãos** além do já contado | — |
| **E29** | banner de personificação: `bg-teal-500` + `text-white` ≈ **2.6:1**, e a saída é `<a href="#">` | — |

### Restante da dimensão 6 — F6–F42

| # | Candidato | Classe | Nota decisiva |
| - | --------- | ------ | ------------- |
| F4 | teste de contrato lendo o CSS como texto | guard-rail M | absorver a IDEIA, trocar as asserções: o do ctfinance lista nomes e apodrece. A asserção que vale é "nenhum `--color-*` fora do `@theme`". Nasce com o F1 |
| F6 | `@radix-ui/themes/styles.css` global: **812–832 KB em toda página**, inclusive as de auth que não usam Radix | guard-rail M | **bloqueado pelo F1 defeito 3**. NÃO viaja com E14+E15 |
| F7 | cor de marca `cyan-*` hardcoded em **229 literais / 90 linhas / 23 arquivos** — e não é o `--primary` | guard-rail G | **decisão de marca do dono**; isolar para poder ser recusada sem derrubar o resto. Depois do F1 |
| F17 | **nenhuma página autenticada renderiza `<h1>`**; `--font-title` usado 2× | guard-rail M | resolve com o `SectionHeader`, o único primitivo só-do-ctfinance que generaliza sem dep nova |
| F18 | `page-header.tsx` monta className por interpolação — gradiente nunca gerado | guard-rail P | morto nos dois projetos; a exclusão vai no PR do `SectionHeader`, sobra só a regra |
| F19 | foco: 35 `focus-visible:` repetidos nos primitivos × 4 tokens no ctfinance | absorver M | mesmo bloco de tokens do F2 |
| F20 | **422 utilitários de cor literal em 35 arquivos** de produção — os primitivos estão limpos, os consumidores é que furam | guard-rail M | catraca com contagem decrescente; **depois** dos PRs de cor, senão trava todos |
| F23 | 3 `<button>` de produção sem `type` | guard-rail P | dobra no PR do `filter-toggle` (`react/button-has-type`) |
| F24 | camada `ui/` sem fronteira: primitivos importam componente de app, utils de formatação e config de toast | guard-rail M | mesmo arquivo de teste do F4/F20 |
| F26 | **9 dos 31** primitivos de `ui/` mortos ou vivos só pelo próprio teste | guard-rail M | depois do PR do `SectionHeader` |
| F27 | duas tabelas convivendo: `ui/table.tsx` (**0 usos**) × `Table` do Radix Themes | **proposta-adr** G | `ui/table.tsx` é o único lugar com estado de linha selecionada |
| F28 | `Input`/`Select`/`Textarea`: piso de toque e afinação do escuro | absorver P | a metade escura viaja **sozinha e já** |
| F29 | `Skeleton` inapto: token errado (`bg-primary/10`), sem variantes, **0 call-sites**, 0 teste | absorver P | some junto com o F1 — é a colisão que apaga o skeleton no escuro |
| F30 | botão não anima o fundo: `transition-[color,box-shadow]` faz todo hover de background estalar | absorver P | mesma CVA do E16 fatia A |
| F32 | animação de toast é **CSS morto** — `react-hot-toast` 2.6.0 não emite `data-state` nem `data-icon` | guard-rail P | poda autossuficiente; não espera o E18 |
| F33 | 25 `hover:scale-*`/`active:scale-*` sem sistema | guard-rail P | **represado com D6/D7** — mesmas classNames, mesmos arquivos |
| F35 | `<meta name="color-scheme">` é calculado no servidor e **nunca atualizado** ao trocar o tema — o cromo nativo fica errado até o reload | guard-rail P | fecha o buraco que o D4 deixou |
| F14 | `<meta name="theme-color">` por esquema | absorver P | absorver corrigindo o erro do ctfinance |
| F15 | cor da barra de progresso do Inertia hardcoded fora da paleta | absorver P | carona em qualquer PR que toque `app.tsx` |
| F37 | identidade: PNG **2084×2120 servido a 40px** dentro de chip preto, ícone do starter kit da Laravel na sidebar, `logo.svg` órfão de 26 KB | absorver M | — |
| F38 | o `<head>` não declara ícone nenhum: **5 arquivos (126 KB) órfãos** em `public/`, e o `preconnect` para fonts.bunny.net abre TLS com terceiro sem baixar nada | absorver P | — |
| F41 | o seletor de tema fala **inglês** num produto pt-BR e não anuncia qual opção está escolhida | absorver P | metade é dimensão 7 |
| F42 | `errors/500.blade.php` pinta fundo escuro **diferente** do canvas do app, e o guard do D4 só olha um dos dois arquivos | guard-rail P | fecha buraco de fatia já mesclada |
| F34 | `eslint-plugin-jsx-a11y` | `[dep-nova]` | **⚠️ a dimensão 5 já REJEITOU** por incompatibilidade de peer (plugin declara até ESLint 9; o boilerplate roda 10.8.0). Esta célula o ressuscitou sem refutar aquilo — **a rejeição vale**; a alternativa segue sendo `jest-axe` |

### `[rejeitado]` da dimensão 6

| Achado | Motivo |
| ------ | ------ |
| `hidden-text`/`hidden-value` como primitivos a absorver | O padrão (mascarar PII em tela) generaliza, mas os dois usam `role="text"`, que **não é role ARIA válido** (extensão só do Safari) — o `aria-label` irmão pode ser ignorado e o mascaramento vira só visual. Sem call-site no boilerplate. Sobrevive só como **regra de uma linha** em `.ai/rules`, junto da regra contra className por interpolação |
