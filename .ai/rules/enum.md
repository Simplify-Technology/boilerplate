---
paths:
  - 'app/Enum/**'
---

# Enum

## RBAC próprio: enums são a fonte de verdade
Permissions/Roles são string-enums em App\Enum; cada case de Permissions vira um Gate auto-registrado no AppServiceProvider delegando a $user->hasPermissionTo() (trait HasRolesAndPermissions, cache forever user:{id}:permissions). Regras por-modelo ficam em Policies registradas via Gate::policy. Nova permissão/papel = novo case no enum + `php artisan permissions:sync`; mute papéis/permissões só pelos métodos do trait (invalidam o cache); nunca escreva direto nas tabelas nem introduza pacote de permissões externo ou Gate::define avulso.

## Enums string-backed com cases SCREAMING_SNAKE e label() pt-BR
Enums são string-backed e vivem em App\Enum (singular), com cases em SCREAMING_SNAKE_CASE cujo valor é o próprio nome em snake_case (MANAGE_USERS = 'manage_users'). Todo enum expõe label() via match retornando rótulo em pt-BR; listas para UI saem de um options() estático com pares value/label.
