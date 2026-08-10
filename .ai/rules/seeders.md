---
paths:
  - 'database/seeders/**'
---

# Seeders

## Seeders de dados canônicos são idempotentes
Seeders que materializam dados canônicos (roles, permissions, super user) escrevem com updateOrCreate/firstOrCreate keyed pelo name, mantendo a re-execução idempotente; não use create() puro para esses registros. Seeders de credencial demo usam o concern GuardsDemoSeeding para nunca rodar fora de local/testing.
