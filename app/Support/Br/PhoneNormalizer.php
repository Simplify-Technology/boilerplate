<?php

declare(strict_types = 1);

namespace App\Support\Br;

/**
 * Normalização de telefones brasileiros para E.164. Entrada é sempre o valor
 * bruto digitado (com ou sem máscara BR); a máscara de exibição é
 * responsabilidade da UI.
 */
final class PhoneNormalizer
{
    private const string DEFAULT_COUNTRY_CODE = '55';

    /**
     * Retorna o número em E.164 (+5511999998888) ou null quando não há dígitos
     * suficientes para formar um telefone brasileiro válido.
     */
    public static function normalize(?string $raw, string $countryCode = self::DEFAULT_COUNTRY_CODE): ?string
    {
        $digits = self::digits($raw);

        if ($digits === '') {
            return null;
        }

        $digits = ltrim($digits, '0');

        if (str_starts_with($digits, $countryCode) && strlen($digits) >= 12) {
            return '+' . $digits;
        }

        if (strlen($digits) === 10 || strlen($digits) === 11) {
            return '+' . $countryCode . $digits;
        }

        if (strlen($digits) < 10) {
            return null;
        }

        return '+' . $digits;
    }

    /**
     * Somente os dígitos do valor — usado em buscas que aceitam entrada mascarada.
     */
    public static function digits(?string $raw): string
    {
        if ($raw === null) {
            return '';
        }

        return preg_replace('/\D/', '', $raw) ?? '';
    }
}
