<?php

declare(strict_types = 1);

namespace App\Support\Br;

/**
 * Normalização, formatação e mascaramento de CPF (LGPD). O valor é persistido
 * somente com dígitos; a máscara ***.***.***-12 é o que sai para quem não tem
 * permissão de ver o documento completo.
 */
final class CpfFormatter
{
    public static function normalize(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $raw) ?? '';

        return $digits === '' ? null : $digits;
    }

    /**
     * Formata para exibição completa (000.000.000-00) quando houver 11 dígitos.
     */
    public static function format(?string $cpf): ?string
    {
        $digits = self::normalize($cpf);

        if ($digits === null) {
            return null;
        }

        if (strlen($digits) !== 11) {
            return $digits;
        }

        return substr($digits, 0, 3) . '.' . substr($digits, 3, 3) . '.' . substr($digits, 6, 3) . '-' . substr($digits, 9, 2);
    }

    /**
     * Máscara LGPD: preserva apenas os dois últimos dígitos.
     */
    public static function mask(?string $cpf): ?string
    {
        $digits = self::normalize($cpf);

        if ($digits === null) {
            return null;
        }

        if (strlen($digits) < 3) {
            return str_repeat('*', strlen($digits));
        }

        return '***.***.***-' . substr($digits, -2);
    }
}
