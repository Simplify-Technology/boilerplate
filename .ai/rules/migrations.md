---
paths:
  - 'database/migrations/**'
---

# Migrations

## Invariante de banco vale no dialeto em que a suíte roda
A suíte roda em SQLite (phpunit.xml define DB_CONNECTION=sqlite, :memory:), então invariante aplicada só via SQL cru de pgsql/MySQL — DB::statement, DB::unprepared ou ramificação por getDriverName — nunca é exercitada por teste nenhum, e a suíte fica verde falando de um banco que não é o de produção. Prefira o que o schema builder expressa em todos os dialetos (unique, not-null, FK com onDelete, índice). Quando o SQL cru for inevitável — o Blueprint do L13 não tem check() e a introspecção nativa (getTables, getColumns, getIndexes, getForeignKeys) não enxerga CHECK constraint —, garanta a mesma invariante no dialeto da suíte, por regra em código com teste cobrindo, e registre a migration em migrationsWithDialectSpecificSql() de tests/Unit/Database/MigrationDialectInvariantTest.php apontando onde essa contrapartida está.
