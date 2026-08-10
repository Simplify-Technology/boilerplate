<?php

declare(strict_types = 1);

use App\Support\Br\PhoneNormalizer;

it('normalizes a masked brazilian mobile to e164', function(): void {
    expect(PhoneNormalizer::normalize('(11) 98888-7777'))->toBe('+5511988887777');
});

it('normalizes a landline to e164', function(): void {
    expect(PhoneNormalizer::normalize('11 3333-3333'))->toBe('+551133333333');
});

it('keeps an already normalized number', function(): void {
    expect(PhoneNormalizer::normalize('+55 11 98888-7777'))->toBe('+5511988887777');
});

it('drops the leading zero of the area code', function(): void {
    expect(PhoneNormalizer::normalize('011 98888-7777'))->toBe('+5511988887777');
});

it('returns null for empty or too short values', function(): void {
    expect(PhoneNormalizer::normalize(null))->toBeNull()
        ->and(PhoneNormalizer::normalize(''))->toBeNull()
        ->and(PhoneNormalizer::normalize('12345'))->toBeNull();
});

it('extracts only the digits of a masked value', function(): void {
    expect(PhoneNormalizer::digits('(11) 98888-7777'))->toBe('11988887777')
        ->and(PhoneNormalizer::digits(null))->toBe('');
});
