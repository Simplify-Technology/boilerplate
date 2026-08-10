<?php

declare(strict_types = 1);

namespace App\Support\Br;

use RuntimeException;

/**
 * HMAC determinístico do CPF para busca/dedupe quando a coluna é cifrada.
 *
 * Com `cpf` no cast `encrypted`, o ciphertext é não-determinístico: o mesmo
 * CPF gera bytes diferentes a cada escrita — fatal para `WHERE cpf = ?` e
 * para unicidade. O hash resolve o lado da busca sem devolver o dado ao
 * texto claro.
 *
 * **Por que HMAC e não `sha256` puro.** O espaço de CPFs válidos é pequeno
 * (~10^9 com dígito verificador): um `sha256(cpf)` sem chave cai por força
 * bruta em minutos. Com HMAC sob chave derivada da `APP_KEY`, o atacante
 * precisa também da chave da aplicação — a mesma barreira do ciphertext.
 *
 * A chave é derivada (nunca a `APP_KEY` crua) e o método **falha alto** com
 * segredo vazio: HMAC sem chave é público e a coluna continuaria parecendo
 * protegida. Trocar `DERIVATION_CONTEXT` ou rotacionar a `APP_KEY` invalida
 * todos os hashes já gravados — exige rotina deliberada de re-hash.
 */
final class CpfHasher
{
    private const string DERIVATION_CONTEXT = 'app:cpf-hash:v1';

    /**
     * HMAC-SHA256 do CPF normalizado. Entrada sem 11 dígitos devolve null —
     * CPF parcial ou lixo não vira chave de busca.
     */
    public static function hash(?string $cpf): ?string
    {
        $digits = self::normalize($cpf);

        if ($digits === null) {
            return null;
        }

        return hash_hmac('sha256', $digits, self::key());
    }

    /**
     * Só-dígitos, exatamente 11 — senão não é CPF. Sem normalizar, grafias
     * diferentes (`390.533.447-05` vs `39053344705`) gerariam hashes
     * diferentes e a busca nunca encontraria nada.
     */
    public static function normalize(?string $cpf): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $cpf) ?? '';

        return strlen($digits) === 11 ? $digits : null;
    }

    /**
     * Chave derivada da `APP_KEY`. `app.key` ausente, vazia ou `base64:` com
     * payload inválido lança — nunca hasheia PII em silêncio com chave vazia.
     */
    private static function key(): string
    {
        $secret = (string) config('app.key', '');

        if (str_starts_with($secret, 'base64:')) {
            $decoded = base64_decode(substr($secret, 7), true);
            $secret  = $decoded === false ? '' : $decoded;
        }

        if ($secret === '') {
            throw new RuntimeException(
                'CpfHasher: APP_KEY ausente, vazia ou com base64 inválido. HMAC sem '
                . 'chave é público — o CPF sairia por força bruta a partir do hash. '
                . 'Configure APP_KEY antes de hashear CPFs.'
            );
        }

        return hash_hmac('sha256', self::DERIVATION_CONTEXT, $secret, true);
    }
}
