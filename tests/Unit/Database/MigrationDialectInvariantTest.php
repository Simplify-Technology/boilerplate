<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| Invariante de banco que a suíte não enxerga
|--------------------------------------------------------------------------
|
| Origem: harvest v2, dimensão 2 do ctfinance @ b8c6d57. Lá, a migration
| `..._add_recurring_expenses_xor_bank_account_credit_card_check.php` aplica
| a MESMA invariante de três jeitos: CHECK constraint no pgsql (DB::statement),
| dois triggers com SIGNAL SQLSTATE '45000' no MySQL (DB::unprepared), e
| `return` early no SQLite — ou seja, nada.
|
| A suíte roda em SQLite (phpunit.xml → DB_CONNECTION=sqlite, :memory:). O
| resultado é o pior dos mundos: a regra que protege o dado em produção é
| exatamente a única que teste nenhum exercita. A suíte fica verde falando
| sobre um banco que não é o de produção.
|
| Esta guarda não proíbe SQL cru — às vezes é a única saída, porque o schema
| builder do L13 não tem `check()` e a introspecção nativa (getTables,
| getColumns, getIndexes, getForeignKeys) não enxerga CHECK constraint. O que
| ela proíbe é fazer isso EM SILÊNCIO: quem ramifica por dialeto declara, na
| allowlist abaixo, como a invariante se sustenta no dialeto da suíte.
|
| Sem API nativa para introspectar, ler o texto da migration é o único caminho.
|
| Por que em Unit, longe do irmão SchemaIdentifierLengthTest: a guarda lê
| arquivo, não banco. Em Feature ela herdaria o RefreshDatabase e passaria a
| depender de as migrations rodarem — justamente o que falha quando alguém
| comete o erro que ela existe para pegar. Verificado por mutação: uma
| migration com trigger MySQL derruba a suíte Feature com QueryException antes
| de qualquer asserção. Aqui a guarda ainda fala, e a mensagem dela é a útil.
|
*/

/**
 * Migrations que ramificam por dialeto, e como cada uma garante a MESMA
 * invariante no SQLite — o dialeto onde a suíte roda.
 *
 * Formato: nome do arquivo => como a invariante é garantida onde o SQL cru
 * não roda. Uma entrada só é honesta se apontar código ou teste concreto;
 * "validação no model" sem o caminho do arquivo é papel passado.
 *
 * @return array<string, string>
 */
function migrationsWithDialectSpecificSql(): array
{
    return [];
}

/**
 * Marcadores de SQL dialeto-dependente. `statement`/`unprepared` executam SQL
 * cru que o SQLite pode rejeitar ou interpretar de outro jeito; getDriverName
 * é a ramificação explícita por banco — a forma exata do ctfinance.
 *
 * Comentários são removidos antes do casamento: mencionar `DB::statement` num
 * comentário explicando por que NÃO se usa não pode reprovar a migration.
 */
function migrationFilesUsingDialectSpecificSql(): array
{
    $found = [];

    foreach (migrationFiles() as $name => $path) {
        $code = stripPhpComments((string) file_get_contents($path));

        $usesRawSql       = preg_match('/(?:DB::|->)\s*(?:statement|unprepared)\s*\(/i', $code) === 1;
        $branchesOnDriver = preg_match('/getDriverName\s*\(/i', $code)                          === 1;

        if ($usesRawSql || $branchesOnDriver) {
            $found[] = $name;
        }
    }

    sort($found);

    return $found;
}

/**
 * Caminho resolvido a partir do próprio arquivo, não de `database_path()`:
 * este teste roda sem o app bootado (tests/Unit usa o TestCase base do
 * PHPUnit, ver tests/Pest.php).
 *
 * @return array<string, string> nome do arquivo => caminho absoluto
 */
function migrationFiles(): array
{
    $files = glob(dirname(__DIR__, 3) . '/database/migrations/*.php');

    $map = [];

    foreach ($files === false ? [] : $files as $path) {
        $map[basename($path)] = $path;
    }

    ksort($map);

    return $map;
}

function stripPhpComments(string $code): string
{
    $out = '';

    foreach (token_get_all($code) as $token) {
        if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
            continue;
        }

        $out .= is_array($token) ? $token[1] : $token;
    }

    return $out;
}

// A varredura precisa ter olhado para alguma coisa. Se o glob quebrar (pasta
// renomeada, teste movido), esta linha derruba o arquivo em vez de deixar as
// duas guardas abaixo passarem vacuamente sobre uma lista vazia.
it('actually reads the migration directory', function(): void {
    expect(migrationFiles())->not->toBeEmpty();
});

it('forbids dialect-specific sql in a migration without declaring the sqlite fallback', function(): void {
    $undeclared = array_values(array_diff(
        migrationFilesUsingDialectSpecificSql(),
        array_keys(migrationsWithDialectSpecificSql())
    ));

    expect($undeclared)->toBe([], sprintf(
        "Migration(s) com SQL dialeto-dependente e sem contrapartida declarada:\n  - %s\n\n"
        . 'A suíte roda em SQLite: o que só existe no pgsql/MySQL nenhum teste exercita. '
        . 'Garanta a mesma invariante no dialeto da suíte (constraint que o schema builder '
        . 'suporte, ou a regra em código com teste cobrindo) e registre a migration em '
        . 'migrationsWithDialectSpecificSql() dizendo ONDE isso está.',
        implode("\n  - ", $undeclared)
    ));
});

it('keeps the dialect allowlist honest', function(): void {
    $stale = array_values(array_diff(
        array_keys(migrationsWithDialectSpecificSql()),
        migrationFilesUsingDialectSpecificSql()
    ));

    expect($stale)->toBe([], sprintf(
        "Entrada(s) obsoleta(s) em migrationsWithDialectSpecificSql():\n  - %s\n\n"
        . 'A migration sumiu, foi renomeada, ou deixou de usar SQL dialeto-dependente. '
        . 'Remova a entrada — allowlist que não corresponde ao código esconde a próxima '
        . 'invariante invisível.',
        implode("\n  - ", $stale)
    ));
});
