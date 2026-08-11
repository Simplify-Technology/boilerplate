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

### D3 · `[guard-rail]` closure em prop não é lazy · P · risco baixo · **só doc, sem gate**

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
| Tooling de a11y | ctjuris × spinmax | ambas | — | — |
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
