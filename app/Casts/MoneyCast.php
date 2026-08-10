<?php

declare(strict_types = 1);

namespace App\Casts;

use App\ValueObjects\Money;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * Persiste `Money` como string decimal (coluna decimal(12,2)). Aceita `Money`,
 * string decimal validada ou null; rejeita float para nunca perder centavo.
 *
 * @implements CastsAttributes<Money, Money|string>
 */
class MoneyCast implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): ?Money
    {
        if ($value === null) {
            return null;
        }

        return Money::fromDecimal((string) $value);
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof Money) {
            return $value->toDecimal();
        }

        if (is_string($value)) {
            return Money::fromDecimal($value)->toDecimal();
        }

        // Guarda defensiva: `TSet` declara o contrato válido (Money|string), mas o
        // Eloquent não o impõe em runtime (ex.: float via `create()`) — coberto em MoneyCastTest.
        // @phpstan-ignore deadCode.unreachable
        throw new InvalidArgumentException(
            "O atributo [{$key}] espera App\\ValueObjects\\Money, string decimal ou null."
        );
    }
}
