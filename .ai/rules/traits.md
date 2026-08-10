---
paths:
  - 'app/Traits/**'
---

# Traits

## RBAC próprio: enums são a fonte de verdade
Papéis e permissões mudam só pelos métodos de HasRolesAndPermissions (assignRole, revokeRole, givePermissionTo, revokePermissionTo) — eles invalidam o cache forever user:{id}:permissions. Após alterar os enums Permissions/Roles, rode `php artisan permissions:sync`. Nunca escreva direto nas tabelas roles/permissions/pivôs.
