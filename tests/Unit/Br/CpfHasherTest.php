<?php

declare(strict_types = 1);

use App\Support\Br\CpfHasher;

uses(Tests\TestCase::class);

it('hashes independent of formatting and is keyed (not a bare sha256)', function(): void {
    config(['app.key' => 'base64:' . base64_encode(str_repeat('a', 32))]);

    expect(CpfHasher::hash('390.533.447-05'))->toBe(CpfHasher::hash('39053344705'))
        // Com chave derivada: não é o sha256 puro (que seria invertível offline).
        ->and(CpfHasher::hash('39053344705'))->not->toBe(hash('sha256', '39053344705'))
        // Nem o HMAC com a APP_KEY crua — a chave é derivada antes de usar.
        ->and(CpfHasher::hash('39053344705'))->not->toBe(hash_hmac('sha256', '39053344705', (string) config('app.key')));
});

it('is deterministic for the same key and changes with the key', function(): void {
    config(['app.key' => 'base64:' . base64_encode(str_repeat('a', 32))]);
    $first = CpfHasher::hash('39053344705');

    expect(CpfHasher::hash('39053344705'))->toBe($first);

    config(['app.key' => 'base64:' . base64_encode(str_repeat('b', 32))]);

    expect(CpfHasher::hash('39053344705'))->not->toBe($first);
});

it('accepts a raw key without the base64 prefix', function(): void {
    config(['app.key' => str_repeat('a', 32)]);

    expect(CpfHasher::hash('39053344705'))->toBeString()->toHaveLength(64);
});

it('normalizes to exactly eleven digits or null', function(): void {
    expect(CpfHasher::normalize('390.533.447-05'))->toBe('39053344705')
        ->and(CpfHasher::normalize('39053344705'))->toBe('39053344705')
        ->and(CpfHasher::normalize('123'))->toBeNull()
        ->and(CpfHasher::normalize(''))->toBeNull()
        ->and(CpfHasher::normalize(null))->toBeNull();
});

it('returns null for non-cpf input without requiring the key', function(): void {
    // Registro sem CPF é caso comum; salvar um não pode depender da chave.
    config(['app.key' => '']);

    expect(CpfHasher::hash(null))->toBeNull()
        ->and(CpfHasher::hash(''))->toBeNull()
        ->and(CpfHasher::hash('123'))->toBeNull();
});

it('fails loud instead of hashing with an empty key', function(string $key): void {
    config(['app.key' => $key]);

    expect(fn() => CpfHasher::hash('39053344705'))->toThrow(RuntimeException::class, 'APP_KEY');
})->with([
    'chave vazia'            => [''],
    'base64 inválido'        => ['base64:!!! não é base64 !!!'],
    'base64 de string vazia' => ['base64:'],
]);
