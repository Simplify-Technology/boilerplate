<?php

declare(strict_types = 1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Dinheiro chega do front como string decimal de até duas casas — o mesmo
 * formato que o `Money::fromDecimal()` aceita. Bloqueia notação científica,
 * vírgula e centavos a mais antes de qualquer conversão.
 */
class MoneyString implements ValidationRule
{
    public function __construct(private readonly bool $allowNegative = false)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $pattern = $this->allowNegative ? '/^-?\d{1,10}(\.\d{1,2})?$/' : '/^\d{1,10}(\.\d{1,2})?$/';

        if (!is_string($value) && !is_int($value)) {
            $fail('O valor informado não é um valor monetário válido.');

            return;
        }

        if (preg_match($pattern, (string) $value) !== 1) {
            $fail('Informe um valor monetário no formato 1234.56.');
        }
    }
}
