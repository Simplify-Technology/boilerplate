<?php

declare(strict_types = 1);

use App\Support\Br\CpfFormatter;

it('normalizes a cpf to digits only', function(): void {
    expect(CpfFormatter::normalize('390.533.447-05'))->toBe('39053344705')
        ->and(CpfFormatter::normalize('39053344705'))->toBe('39053344705')
        ->and(CpfFormatter::normalize('abc'))->toBeNull()
        ->and(CpfFormatter::normalize(''))->toBeNull()
        ->and(CpfFormatter::normalize(null))->toBeNull();
});

it('formats a cpf for display', function(): void {
    expect(CpfFormatter::format('39053344705'))->toBe('390.533.447-05')
        ->and(CpfFormatter::format('390.533.447-05'))->toBe('390.533.447-05')
        ->and(CpfFormatter::format(null))->toBeNull();
});

it('returns digits untouched when the length is not a cpf', function(): void {
    expect(CpfFormatter::format('123'))->toBe('123');
});

it('masks a cpf keeping only the last two digits', function(): void {
    expect(CpfFormatter::mask('390.533.447-05'))->toBe('***.***.***-05')
        ->and(CpfFormatter::mask('39053344705'))->toBe('***.***.***-05')
        ->and(CpfFormatter::mask(null))->toBeNull();
});

it('fully redacts values too short to keep any digit', function(): void {
    expect(CpfFormatter::mask('12'))->toBe('**')
        ->and(CpfFormatter::mask('1'))->toBe('*');
});
