# Guia de segurança deste boilerplate (lido pelos reviewers do security-guidance)

Contexto: Laravel 13 + Inertia 3/React, monólito com sessão. RBAC próprio (ADR 0001, sem spatie/laravel-permission); sem API/Sanctum por padrão (ADR 0005); Sentry é o error tracking homologado, desligado sem DSN (ADR 0006). Toda frase abaixo tem origem em `CLAUDE.md`, em `.ai/rules/*.md` ou em `docs/adr/`.

## Autorização

- Autorização real é sempre backend (gates e policies). `use-permissions` e `PermissionsGuard` no React são UX: rota de escrita que depende só deles é falha.
- Rota de escrita autenticada declara `can:<permissão>` (ou `#[Authorize]`) na própria rota; throttle não é autorização. A única exceção é self-service sobre a própria conta, e ela entra na allowlist de `tests/Feature/Routes/WriteRoutesAuthorizationTest.php`.
- Três camadas redundantes: `can:` no grupo de rota, `Gate::authorize`/`$this->authorize()` no controller e `authorize()` com `$this->user()->can(...)` no Form Request. Faltar uma camada é achado.
- Controller que **concede** cargo ou permissão tem uma pergunta a mais: "o ator tem isso para dar?". Passe a lista validada — `Gate::authorize('mutatePermissions', [$user, $nomes])` — e a policy mede com `permissionsBeyondOwn()`; o teto olha o payload inteiro, não o delta. Revogação não passa pelo teto de conteúdo.
- Em impersonação a permissão se lê na persona, mas todo **teto** (prioridade, superfície de concessão, leitura de campo sensível) mede o humano real via `effectiveActor()` / `ImpersonationService::getOriginalUser()`. Medir teto na persona é escalação.
- `App\Enum\Permissions` e `App\Enum\Roles` são a fonte de verdade; permissão referenciada por string solta fora do enum é achado. Após mudar um enum, `php artisan permissions:sync`.
- Recusa que precisa explicar sai por `Response::deny($frase)`, com a frase vinda de `Permissions::grantDenialMessage()`; recusa que não deve vazar informação devolve `bool`.

## Cache de permissões

- Permissões ficam em `user:{id}:permissions` com `rememberForever`. Toda escrita em cargo do usuário, permissão direta ou permissões de um cargo invalida o cache de todos os usuários afetados — só pelos métodos de `HasRolesAndPermissions` (`assignRole`, `revokeRole`, `givePermissionTo`, `revokePermissionTo`) ou por `PermissionManagementService`. Escrita direta em `roles`, `permissions` ou pivôs é achado: usuário mantém acesso revogado.

## Entrada e validação

- Escrita de domínio só via Form Request (`rules()`, `authorize()`, `messages()` em pt-BR). `$request->validate()` inline em controller de domínio é achado (o scaffold Auth/Settings é a exceção herdada).
- Mass assignment: `$fillable` explícito em todo model; `$guarded = []` e `Model::unguard()` só em seeder/factory.
- Em listagem, `sort_by`, `sort_order` e `per_page` são entrada não confiável: passam por `App\Support\Listing\ListQueryNormalizer` antes do query builder, e o eco em `filters` publica o valor normalizado.
- Campo sensível em Resource nasce atrás de `Gate::forUser($request->user())->allows('viewSensitive', $this->resource)`, com a régua na policy; prefira mascarar (`CpfFormatter::mask()`) a omitir quando o campo identifica a linha. Cubra o par: quem vê e quem não vê.

## Rate limiting

- Todo rate limit usa limiter nomeado de `AppServiceProvider::configRateLimiting()` — `throttle:N,M` inline é achado. Rota atrás de `auth` chaveia pelo usuário, não pelo IP.
- `POST login` **não tem** throttle de rota de propósito: o lockout mora no `LoginRequest`, por `email|ip`, e está travado em `tests/Feature/Auth/LoginLockoutTest.php`. Não reporte a ausência como achado; reporte se alguém acrescentar `throttle:auth` ali (transformaria a defesa em arma contra quem compartilha NAT).
- Rota que confere segredo (senha, token, código, assinatura) precisa de teto em algum lugar — no limiter da rota ou no Form Request — e de um teste que prove que ele morde.

## Sessão, middleware e feedback

- `SecurityHeaders`, `SetSensitiveCacheHeaders`, `HandleAppearance`, `HandleInertiaRequests` e `EnsureUserIsActive` entram pelo grupo `web` em `bootstrap/app.php`, nunca por `Route::middleware()` num arquivo de rota — senão `settings/*` e `auth` ficam descobertos.
- Código que invalida a sessão (logout, `EnsureUserIsActive`) chama `Inertia::flash()` **depois** de `invalidate()`/`regenerateToken()`.
- Props globais vêm só de `HandleInertiaRequests::share()` (`auth` com user, permissions e roles como nomes, `impersonating`, `ziggy`); flash não é prop compartilhada.

## Auditoria

- Mudança em cargos/permissões, ciclo de vida de conta, personificação e ação sensível deixa trilha: mudança de estado de model via `LogsActivity`; o que não é ciclo de vida de Eloquent vai à mão com `activity('security')->performedOn()->causedBy()->event()->withProperties([...])`, como em `app/Listeners/LogImpersonateStarted.php`. Sob personificação o causer é o humano real (`App\Resolvers\ActivityCauserResolver`). Ausência de trilha nesses fluxos é achado a reportar, não a corrigir em silêncio.

## Dados pessoais e logs

- Nunca logue PII crua (CPF, e-mail, telefone, nome): logue ids e deixe o `App\Support\Logging\PiiScrubber` redigir por chave e por padrão; canal novo em `config/logging.php` recebe o tap `PiiAwareTap`.
- O scrubber só varre objeto `Arrayable` e não alcança `Throwable` em `['exception' => $e]`: PII em mensagem de exception vaza. Coluna sensível nova entra na lista do scrubber **e** ganha caso em `LogScrubbingTest`.
- Qualquer dado novo enviado ao Sentry passa pelo scrubbing de PII; ampliar o payload exige revisar o scrubber junto (ADR 0006).
