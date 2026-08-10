---
paths:
  - 'app/Policies/**'
---

# Policies

## RBAC próprio: enums são a fonte de verdade
Policies delegam a hasPermissionTo()/hasRole() do trait HasRolesAndPermissions e são registradas explicitamente via Gate::policy no AppServiceProvider. Não crie Gate::define avulso — permissões novas nascem como case do enum Permissions.
