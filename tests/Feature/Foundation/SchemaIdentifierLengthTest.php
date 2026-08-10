<?php

declare(strict_types = 1);

use Illuminate\Support\Facades\Schema;

/**
 * O MySQL rejeita identificadores acima de 64 caracteres, e o nome que o
 * Laravel gera para índices compostos passa disso com facilidade. A suíte roda
 * em sqlite, que não tem esse limite — sem esta guarda o erro só aparece no
 * `migrate` contra o banco real.
 */
it('keeps every generated index name within the mysql 64 character limit', function(): void {
    $names = collect(Schema::getTables())
        ->pluck('name')
        ->flatMap(fn(string $table): array => collect(Schema::getIndexes($table))
            ->pluck('name')
            ->filter()
            ->all())
        ->reject(fn(string $name): bool => str_starts_with($name, 'sqlite_'))
        ->values();

    expect($names)->not->toBeEmpty();

    $tooLong = $names
        ->filter(fn(string $name): bool => strlen($name) > 64)
        ->map(fn(string $name): string => $name . ' (' . strlen($name) . ')')
        ->values()
        ->all();

    expect($tooLong)->toBe([]);
});
