# CLAUDE.md

Guia para agentes de IA neste repositório. Complementa o `AGENTS.md` (guidelines do Laravel Boost — versões da stack, skills e regras de Laravel/Inertia/Pest/Tailwind valem integralmente); aqui ficam só as convenções específicas deste boilerplate.

## Comandos

`pnpm` **não está no PATH** dos agentes — use sempre `corepack pnpm`.

```bash
composer ci:check                          # Pint --test + Rector --dry-run + Pest
corepack pnpm ci:check                     # ESLint + Prettier check + tsc + Vitest + build
vendor/bin/pest tests/Feature/Foo.php      # um arquivo de teste
vendor/bin/pint --dirty                    # formatar só o que mudou
corepack pnpm exec vitest run <path>       # um teste do frontend
corepack pnpm types                        # tsc --noEmit
```

Fora do `composer dev`, o Vitest precisa de `LARAVEL_BYPASS_ENV_CHECK=1` (o script `ci:test` já define).

## Definition of done

Uma mudança só está pronta quando:

1. Tem teste cobrindo o comportamento (feliz **e** negação — 403/422 quando houver autorização/validação) e ele passa.
2. `composer ci:check` passa (Pint, Rector, Pest).
3. `corepack pnpm ci:check` passa (ESLint, Prettier, types, Vitest, build) quando tocar frontend.

Rode os dois `ci:check` antes de finalizar qualquer tarefa.

## Controllers

- **Single-action, um arquivo por verbo:** `app/Http/Controllers/{Modulo}/{Verbo}Controller.php` com `__invoke()` (ex.: `User/StoreController.php`).
- Ordem interna obrigatória: **authorize → validate (FormRequest) → service/query → response**.
- Dependências via constructor promotion; não use `app()`/`resolve()` dentro da action.
- PHP sempre com `declare(strict_types=1)` e tipos de retorno explícitos (Rector cobra).

## RBAC — enums são a fonte de verdade

- `App\Enum\Permissions` e `App\Enum\Roles` definem tudo; os gates são auto-registrados no `AppServiceProvider` (um gate por case → `can:manage_users` nas rotas).
- Mudou um enum? Sincronize o banco: `php artisan permissions:sync`.
- Permissões são cacheadas em `user:{id}:permissions` (`rememberForever`). Qualquer mudança de role do usuário, permissão direta ou permissões de um role **deve invalidar o cache** de todos os usuários afetados (o trait `HasRolesAndPermissions` e o `PermissionManagementService` já fazem isso — siga o padrão).
- Autorização real é sempre backend (gates/policies). `use-permissions` / `PermissionsGuard` no React são UX-only.
- Impersonation: para checagens de segurança (atribuir role, conceder permissão), resolva o usuário **original** via `ImpersonationService`, não o impersonado.

## Contrato shared props ↔ types TS

`App\Http\Middleware\HandleInertiaRequests::share()` é a fonte única das props globais (`auth` com user/permissions/roles/impersonating, `flash`, `ziggy`). Os tipos em `resources/js/types/` espelham esse shape — **toda mudança no `share()` exige atualizar os tipos correspondentes, e vice-versa**. Não crie um segundo canal (View Composer, endpoint) com shape diferente para os mesmos dados.

## Frontend

- Arquivos em kebab-case; componentes funcionais tipados.
- Reuse os primitivos de `resources/js/components/ui/` (shadcn/Radix) e os tokens do Tailwind do projeto antes de criar estilo novo.
- Layout por módulo: `pages/{modulo}`, `components/{modulo}`, `hooks/{modulo}`, `utils/{modulo}`, `types/{modulo}.ts`.

## Git

- Nunca commite em `main`/`develop`; branch precisa de ID de issue (`123-feature`). Hooks do husky rodam lint-staged (pre-commit) e os dois `ci:check` (pre-push); `SKIP_GIT_HOOKS=1` só com intenção explícita.
