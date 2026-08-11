# Boilerplate — Simplify Technology

Ponto de partida para SaaS de pequeno/médio porte: **Laravel 13 + Inertia v3 + React 19 + Tailwind 4**, com RBAC próprio (enum-based), impersonation, Horizon, activity log e pipeline de qualidade (Pint, Rector, Larastan, Pest 4, ESLint, Prettier, Vitest 3) já configurados.

## Requisitos

- PHP 8.4 + Composer
- Node 24 LTS + pnpm 11 via Corepack (`corepack enable`) ou mise
- Redis (sessão, cache, filas e Horizon)
- MySQL (padrão do `.env.example`; os testes usam SQLite `:memory:`)

## Quickstart

```bash
composer install
corepack pnpm install
cp .env.example .env        # ajuste DB_* e REDIS_* para o seu ambiente
php artisan key:generate
php artisan migrate --seed  # cria roles/permissions a partir dos enums + usuários iniciais
composer dev                # serve + horizon + scheduler + pail + vite
```

## Scripts principais

| Comando             | O que faz                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| `composer dev`      | `serve` + `horizon:listen` + `schedule:work` + `pail` + Vite (concorrente) |
| `composer dev:ssr`  | Mesmo que `dev`, com build SSR + `inertia:start-ssr` no lugar do Vite dev  |
| `composer ci:check` | Pint `--test` + Rector `--dry-run` + Pest                                  |
| `composer format`   | Pint `--dirty` + Prettier nos arquivos alterados                           |
| `pnpm ci:check`     | ESLint + Prettier check + `tsc --noEmit` + Vitest + build                  |
| `pnpm test:run`     | Vitest one-off (`pnpm test` para modo watch)                               |
| `pnpm types`        | Type-check (`tsc --noEmit`)                                                |

> Sem pnpm no PATH? Prefixe com Corepack: `corepack pnpm ci:check`.

## Arquitetura

**RBAC próprio (sem pacote externo).** Cada usuário tem **um** papel (`users.role_id`) e pode receber permissões diretas extras (pivot `permission_user`, com metadados). `App\Enum\Permissions` e `App\Enum\Roles` são a fonte de verdade: o `AppServiceProvider` registra um Gate por case do enum (`can:manage_users` etc.), e o `PermissionRoleSeeder` sincroniza enums → banco (rode `php artisan permissions:sync` após alterar os enums). O trait `App\Traits\Models\HasRolesAndPermissions` resolve papel + permissões com cache `user:{id}:permissions`, invalidado a cada mudança de papel/permissão. Veja o racional em [`docs/adr/0001`](docs/adr/0001-rbac-proprio.md).

**Impersonation.** Usuários com `impersonate_users` podem assumir a sessão de outro usuário (`ImpersonationService`, rotas `users.impersonate` / `users.impersonate.stop`). O usuário original fica na sessão; início/fim disparam eventos (`ImpersonateStarted`/`ImpersonateStopped`) registrados no activity log, e o `ActivityCauserResolver` garante que ações durante a impersonação sejam atribuídas ao usuário **original**. O estado é exposto ao frontend via shared props (`auth.impersonating`).

**Shared props do Inertia.** `App\Http\Middleware\HandleInertiaRequests::share()` é o contrato único entre backend e frontend: `auth` (user, `permissions`, `roles`, `impersonating`), `flash` (success/error/warning/info) e `ziggy` (rotas nomeadas tipadas via `route()` no TS). Os tipos em `resources/js/types/` espelham esse shape — mudou o `share()`, atualize os tipos. Hooks como `use-permissions` e o `PermissionsGuard` consomem essas props para UX; a autorização real é sempre no backend.

## Convenções de git

- Nunca commite direto em `main`/`develop` (o hook bloqueia).
- Branch deve conter o ID da issue: `PRO-123-minha-feature` ou `123-minha-feature`. O hook `prepare-commit-msg` prefixa a primeira linha com `[ID]:` automaticamente.
- Hooks do husky: `pre-commit` roda lint-staged (Pint / Prettier / ESLint nos arquivos staged); `pre-push` roda `composer ci:check` + `pnpm ci:check` completos.
- Escape intencional: `SKIP_GIT_HOOKS=1 git commit ...` (use com parcimônia).

## Testes

- **Backend (Pest 4):** suíte `Feature` em `tests/Feature` (SQLite `:memory:`, ver `phpunit.xml`). Rode `composer ci:test`, um arquivo com `vendor/bin/pest tests/Feature/Foo.php` ou filtre com `--filter="nome"`.
- **Frontend (Vitest 3):** specs em `resources/js/**/*.test.{ts,tsx}` (jsdom + Testing Library). Rode `corepack pnpm test:run`; fora do `composer dev` use `LARAVEL_BYPASS_ENV_CHECK=1` (o script `ci:test` já faz isso).

## Decisões de arquitetura

As escolhas estruturais (RBAC próprio, Ziggy, ausência de TanStack Query/Telescope/API por padrão, error tracking) estão registradas em [`docs/adr/`](docs/adr/).
