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
