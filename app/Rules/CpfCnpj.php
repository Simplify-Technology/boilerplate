<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class CpfCnpj implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Se o valor estiver vazio, a validação passa (nullable já trata isso)
        if (empty($value) || !is_string($value)) {
            return;
        }

        if (!$this->isValid($value)) {
            $fail("O campo {$attribute} não é um CPF ou CNPJ válido.");
        }
    }

    private function isValid(string $value): bool
    {
        // Remove caracteres não numéricos
        $value = preg_replace('/[^0-9]/', '', $value);

        if (strlen($value) === 11) {
            return $this->validateCpf($value);
        }

        if (strlen($value) === 14) {
            return $this->validateCnpj($value);
        }

        return false;
    }

    private function validateCpf(string $cpf): bool
    {
        if (preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }

        for ($t = 9; $t < 11; $t++) {
            for ($d = 0, $c = 0; $c < $t; $c++) {
                $d += (int) $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;

            if ($cpf[$c] != $d) {
                return false;
            }
        }

        return true;
    }

    private function validateCnpj(string $cnpj): bool
    {
        if (preg_match('/(\d)\1{13}/', $cnpj)) {
            return false;
        }

        $length  = strlen($cnpj) - 2;
        $numbers = substr($cnpj, 0, $length);
        $digits  = substr($cnpj, $length);
        $sum     = 0;
        $pos     = $length - 7;

        for ($i = $length; $i >= 1; $i--) {
            $sum += (int) $numbers[$length - $i] * $pos--;

            if ($pos < 2) {
                $pos = 9;
            }
        }

        $result = $sum % 11 < 2 ? 0 : 11 - $sum % 11;

        if ($result != $digits[0]) {
            return false;
        }

        $length += 1;
        $numbers = substr($cnpj, 0, $length);
        $sum     = 0;
        $pos     = $length - 7;

        for ($i = $length; $i >= 1; $i--) {
            $sum += (int) $numbers[$length - $i] * $pos--;

            if ($pos < 2) {
                $pos = 9;
            }
        }

        $result = $sum % 11 < 2 ? 0 : 11 - $sum % 11;

        return $result == $digits[1];
    }
}
