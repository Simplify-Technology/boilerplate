<?php

declare(strict_types = 1);

namespace App\ValueObjects;

use InvalidArgumentException;
use JsonSerializable;
use Stringable;

/**
 * Dinheiro como centavos inteiros (nunca float). Persistência em decimal(12,2)
 * via MoneyCast; serialização JSON como string decimal com duas casas.
 */
final class Money implements JsonSerializable, Stringable
{
    private function __construct(private readonly int $cents)
    {
    }

    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    public static function fromDecimal(string $amount): self
    {
        $normalized = trim($amount);

        if (in_array(preg_match('/^(-?)(\d+)(?:\.(\d{1,2}))?$/', $normalized, $matches), [0, false], true)) {
            throw new InvalidArgumentException("Valor monetário inválido: [{$amount}]. Use o formato 1234.56.");
        }

        $sign     = $matches[1] === '-' ? -1 : 1;
        $integer  = (int) $matches[2];
        $fraction = (int) str_pad($matches[3] ?? '0', 2, '0');

        return new self($sign * ($integer * 100 + $fraction));
    }

    public static function zero(): self
    {
        return new self(0);
    }

    public function cents(): int
    {
        return $this->cents;
    }

    public function toDecimal(): string
    {
        $sign     = $this->cents < 0 ? '-' : '';
        $absolute = abs($this->cents);

        return sprintf('%s%d.%02d', $sign, intdiv($absolute, 100), $absolute % 100);
    }

    public function add(self $other): self
    {
        return new self($this->cents + $other->cents);
    }

    public function subtract(self $other): self
    {
        return new self($this->cents - $other->cents);
    }

    /**
     * Soma variádica — evita `array_reduce` com `Money::zero()` espalhado pelos services.
     */
    public static function sum(self ...$monies): self
    {
        $total = 0;

        foreach ($monies as $money) {
            $total += $money->cents;
        }

        return new self($total);
    }

    public function multiply(int $multiplier): self
    {
        return new self($this->cents * $multiplier);
    }

    /**
     * Multiplicação proporcional em centavos com arredondamento half-up, sem
     * float em nenhum ponto. A divisão é decomposta em quociente + resto para
     * que `cents × numerator` nunca estoure o int de 64 bits com fatores
     * grandes (ex.: juros pro-rata die usa numerador = % × dias).
     */
    public function multiplyRatio(int $numerator, int $denominator): self
    {
        if ($denominator <= 0) {
            throw new InvalidArgumentException('O denominador do rateio deve ser positivo.');
        }

        if ($numerator < 0) {
            throw new InvalidArgumentException('O numerador do rateio não pode ser negativo.');
        }

        $signal   = $this->cents < 0 ? -1 : 1;
        $absolute = abs($this->cents);

        $whole     = intdiv($absolute, $denominator) * $numerator;
        $remainder = ($absolute % $denominator)      * $numerator;

        $scaled = $whole + intdiv(2 * $remainder + $denominator, 2 * $denominator);

        return new self($signal * $scaled);
    }

    /**
     * Percentual com duas casas (decimal(5,2) no schema): `10.00` = 10%.
     */
    public function percentage(string $percent): self
    {
        return $this->multiplyRatio(self::fromDecimal($percent)->cents(), 10_000);
    }

    /**
     * Rateio de parcelas sem perder centavo: a soma das partes é sempre igual
     * ao total, e o resto vai nas primeiras parcelas.
     *
     * @return list<self>
     */
    public function allocate(int $parts): array
    {
        if ($parts < 1) {
            throw new InvalidArgumentException("Número de parcelas inválido: [{$parts}].");
        }

        $signal   = $this->cents < 0 ? -1 : 1;
        $absolute = abs($this->cents);

        $base      = intdiv($absolute, $parts);
        $remainder = $absolute % $parts;

        $allocated = [];

        for ($index = 0; $index < $parts; $index++) {
            $allocated[] = new self($signal * ($base + ($index < $remainder ? 1 : 0)));
        }

        return $allocated;
    }

    public function negate(): self
    {
        return new self(-$this->cents);
    }

    public function absolute(): self
    {
        return new self(abs($this->cents));
    }

    public function equals(self $other): bool
    {
        return $this->cents === $other->cents;
    }

    public function compareTo(self $other): int
    {
        return $this->cents <=> $other->cents;
    }

    public function isGreaterThan(self $other): bool
    {
        return $this->cents > $other->cents;
    }

    public function isLessThan(self $other): bool
    {
        return $this->cents < $other->cents;
    }

    public function isZero(): bool
    {
        return $this->cents === 0;
    }

    public function isNegative(): bool
    {
        return $this->cents < 0;
    }

    public function isPositive(): bool
    {
        return $this->cents > 0;
    }

    public function format(): string
    {
        $sign     = $this->cents < 0 ? '-' : '';
        $absolute = abs($this->cents);
        $integer  = number_format(intdiv($absolute, 100), 0, ',', '.');
        $fraction = sprintf('%02d', $absolute % 100);

        return "{$sign}R$ {$integer},{$fraction}";
    }

    public function jsonSerialize(): string
    {
        return $this->toDecimal();
    }

    public function __toString(): string
    {
        return $this->toDecimal();
    }
}
