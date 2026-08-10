---
paths:
  - 'app/Console/Commands/**'
---

# Commands

## Comandos de dados canônicos são idempotentes
Comandos que materializam dados canônicos (permissions:sync, users:super-user) são idempotentes por design — updateOrCreate keyed por chave natural, --dry-run quando houver remoção, e invalidação explícita dos caches afetados. Siga esse contrato em comandos novos.
