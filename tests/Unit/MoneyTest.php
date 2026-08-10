<?php

declare(strict_types = 1);

use App\ValueObjects\Money;

it('creates money from cents', function(): void {
    expect(Money::fromCents(1050)->cents())->toBe(1050)
        ->and(Money::fromCents(-5)->cents())->toBe(-5)
        ->and(Money::zero()->cents())->toBe(0);
});

it('parses decimal strings without floating point', function(string $decimal, int $cents): void {
    expect(Money::fromDecimal($decimal)->cents())->toBe($cents);
})->with([
    ['0', 0],
    ['10', 1000],
    ['10.5', 1050],
    ['10.55', 1055],
    ['1234.56', 123456],
    ['-3.07', -307],
    ['-0.05', -5],
    ['9999999999.99', 999999999999],
]);

it('rejects invalid decimal strings', function(string $invalid): void {
    expect(fn() => Money::fromDecimal($invalid))->toThrow(InvalidArgumentException::class);
})->with([
    'abc',
    '10.555',
    '1,50',
    '',
    '10.',
    '.50',
    'R$ 10,00',
]);

it('formats cents back to decimal strings', function(): void {
    expect(Money::fromCents(123456)->toDecimal())->toBe('1234.56')
        ->and(Money::fromCents(-5)->toDecimal())->toBe('-0.05')
        ->and(Money::zero()->toDecimal())->toBe('0.00')
        ->and(Money::fromCents(1000)->toDecimal())->toBe('10.00');
});

it('adds and subtracts immutably', function(): void {
    $ten  = Money::fromDecimal('10.00');
    $five = Money::fromDecimal('5.50');

    expect($ten->add($five)->cents())->toBe(1550)
        ->and($ten->subtract($five)->cents())->toBe(450)
        ->and($five->subtract($ten)->cents())->toBe(-450)
        ->and($ten->cents())->toBe(1000);
});

it('compares equality and sign', function(): void {
    expect(Money::fromDecimal('10.00')->equals(Money::fromCents(1000)))->toBeTrue()
        ->and(Money::fromDecimal('10.00')->equals(Money::fromCents(1001)))->toBeFalse()
        ->and(Money::zero()->isZero())->toBeTrue()
        ->and(Money::fromCents(-1)->isNegative())->toBeTrue()
        ->and(Money::fromCents(1)->isNegative())->toBeFalse();
});

it('formats brazilian currency', function(): void {
    expect(Money::fromCents(123456)->format())->toBe('R$ 1.234,56')
        ->and(Money::fromCents(-5)->format())->toBe('-R$ 0,05')
        ->and(Money::zero()->format())->toBe('R$ 0,00')
        ->and(Money::fromCents(100000000)->format())->toBe('R$ 1.000.000,00');
});

it('serializes to json and string as decimal', function(): void {
    expect(json_encode(Money::fromCents(1234)))->toBe('"12.34"')
        ->and((string) Money::fromCents(1234))->toBe('12.34');
});

it('sums a variadic list of money', function(): void {
    expect(Money::sum()->cents())->toBe(0)
        ->and(Money::sum(Money::fromDecimal('10.10'), Money::fromDecimal('0.90'))->cents())->toBe(1100)
        ->and(Money::sum(Money::fromCents(500), Money::fromCents(-500))->cents())->toBe(0);
});

it('multiplies by an integer factor', function(): void {
    expect(Money::fromDecimal('10.35')->multiply(3)->toDecimal())->toBe('31.05')
        ->and(Money::fromDecimal('10.00')->multiply(0)->cents())->toBe(0)
        ->and(Money::fromDecimal('1.11')->multiply(-2)->toDecimal())->toBe('-2.22');
});

it('applies a percentage with half-up rounding and no float', function(string $amount, string $percent, string $expected): void {
    expect(Money::fromDecimal($amount)->percentage($percent)->toDecimal())->toBe($expected);
})->with([
    'taxa cheia'          => ['100.00', '3.20', '3.20'],
    'arredonda para cima' => ['10.00', '3.25', '0.33'],
    'meio centavo sobe'   => ['1.00', '2.50', '0.03'],
    'taxa zero'           => ['999.99', '0.00', '0.00'],
    'negativo espelha'    => ['-100.00', '3.20', '-3.20'],
    'centavos exatos'     => ['33.33', '10.00', '3.33'],
]);

it('multiplies by a ratio without losing precision on large factors', function(): void {
    // Juros pro-rata die: 1% a.m. sobre R$ 1.000,00 por 15 dias = R$ 5,00.
    expect(Money::fromDecimal('1000.00')->multiplyRatio(100 * 15, 30 * 10_000)->toDecimal())->toBe('5.00');

    // 12% a.m. sobre R$ 250,00 por 45 dias = R$ 45,00.
    expect(Money::fromDecimal('250.00')->multiplyRatio(1200 * 45, 30 * 10_000)->toDecimal())->toBe('45.00');

    // Valor alto com fator alto continua exato (sem estouro de int).
    expect(Money::fromDecimal('9999999.99')->multiplyRatio(1000 * 3650, 30 * 10_000)->toDecimal())
        ->toBe('121666666.55');
});

it('rejects invalid ratios', function(): void {
    expect(fn() => Money::fromDecimal('10.00')->multiplyRatio(1, 0))->toThrow(InvalidArgumentException::class)
        ->and(fn() => Money::fromDecimal('10.00')->multiplyRatio(-1, 10))->toThrow(InvalidArgumentException::class);
});

it('allocates installments in cents without losing a single cent', function(string $total, int $parts, array $expected): void {
    $allocated = Money::fromDecimal($total)->allocate($parts);

    expect(array_map(static fn(Money $money): string => $money->toDecimal(), $allocated))->toBe($expected)
        ->and(Money::sum(...$allocated)->toDecimal())->toBe(Money::fromDecimal($total)->toDecimal());
})->with([
    'divide exato'         => ['100.00', 4, ['25.00', '25.00', '25.00', '25.00']],
    'resto na primeira'    => ['100.00', 3, ['33.34', '33.33', '33.33']],
    'dois centavos sobram' => ['10.00', 3, ['3.34', '3.33', '3.33']],
    'parcela única'        => ['7.77', 1, ['7.77']],
    'centavo indivisível'  => ['0.01', 2, ['0.01', '0.00']],
    'negativo espelha'     => ['-100.00', 3, ['-33.34', '-33.33', '-33.33']],
]);

it('keeps the sum of any allocation equal to the total', function(): void {
    foreach (range(1, 60) as $parts) {
        foreach (['0.01', '9.99', '1234.56', '100000.00', '7.03'] as $total) {
            $money     = Money::fromDecimal($total);
            $allocated = $money->allocate($parts);

            expect(Money::sum(...$allocated)->cents())->toBe($money->cents())
                ->and($allocated)->toHaveCount($parts);
        }
    }
});

it('rejects an invalid number of parts', function(): void {
    expect(fn() => Money::fromDecimal('10.00')->allocate(0))->toThrow(InvalidArgumentException::class);
});

it('negates and takes the absolute value', function(): void {
    expect(Money::fromDecimal('10.00')->negate()->toDecimal())->toBe('-10.00')
        ->and(Money::fromDecimal('-10.00')->negate()->toDecimal())->toBe('10.00')
        ->and(Money::fromDecimal('-10.00')->absolute()->toDecimal())->toBe('10.00')
        ->and(Money::zero()->negate()->cents())->toBe(0);
});

it('orders amounts', function(): void {
    $ten  = Money::fromDecimal('10.00');
    $five = Money::fromDecimal('5.00');

    expect($ten->isGreaterThan($five))->toBeTrue()
        ->and($five->isLessThan($ten))->toBeTrue()
        ->and($ten->isGreaterThan($ten))->toBeFalse()
        ->and($ten->compareTo($five))->toBe(1)
        ->and($five->compareTo($ten))->toBe(-1)
        ->and($ten->compareTo(Money::fromCents(1000)))->toBe(0)
        ->and($ten->isPositive())->toBeTrue()
        ->and(Money::zero()->isPositive())->toBeFalse();
});
