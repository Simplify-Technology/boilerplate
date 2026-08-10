# ADR 0001 — RBAC próprio em vez de spatie/laravel-permission

**Status:** aceito

## Contexto

Todo projeto derivado do boilerplate precisa de papéis e permissões. O spatie/laravel-permission é o padrão do ecossistema, mas traz múltiplos roles por usuário, teams, guards e uma API grande — mais do que os nossos SaaS de pequeno/médio porte usam. A implementação própria já foi validada em 6 forks do boilerplate sem necessidade dos recursos extras.

## Decisão

Manter o RBAC próprio: enums `App\Enum\Permissions` / `App\Enum\Roles` como fonte de verdade, **um** role por usuário (`users.role_id`), permissões diretas via pivot com metadados, gates auto-registrados no `AppServiceProvider` e sincronização enum → banco pelo `PermissionRoleSeeder` (seed inicial) e pelo comando idempotente `permissions:sync` (deploys). Cache por usuário (`user:{id}:permissions`) invalidado a cada mudança.

## Consequências

- Menos dependência externa; permissões tipadas e enxutas, limpas de domínio genérico.
- Limitações assumidas: 1 role por usuário, sem teams/guards múltiplos. Se um projeto precisar disso, a migração para o spatie é o caminho — não estender o RBAC próprio.
- Alterou os enums? É obrigatório rodar o seeder de sincronização e invalidar caches afetados.
