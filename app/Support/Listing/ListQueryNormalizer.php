<?php

declare(strict_types = 1);

namespace App\Support\Listing;

/**
 * Normaliza ordenação e page size vindos da querystring de uma listagem.
 *
 * Estes três parâmetros são entrada NÃO CONFIÁVEL, mesmo em rota autenticada:
 *
 * - direção fora de `asc`/`desc` faz `Query\Builder::orderBy()` lançar
 *   `InvalidArgumentException`, ou seja, 500 alcançável por link;
 * - campo de ordenação cru vira nome de coluna no SQL;
 * - page size sem teto puxa a tabela inteira num request.
 *
 * Métodos estáticos puros, sem Eloquent — o controller segue chamando o
 * builder direto, como manda a convenção de `.ai/rules/controllers.md`.
 */
final class ListQueryNormalizer
{
    public const int PER_PAGE_MIN = 5;

    public const int PER_PAGE_MAX = 50;

    public const int PER_PAGE_DEFAULT = 15;

    /**
     * Devolve `$value` apenas se ele for exatamente um dos campos permitidos.
     *
     * A comparação é estrita e sensível a caixa de propósito: o retorno vira
     * nome de coluna, então "quase igual" não serve.
     *
     * @param  list<string>  $allowed
     */
    public static function sortField(mixed $value, array $allowed, string $default): string
    {
        return is_string($value) && in_array($value, $allowed, true)
            ? $value
            : $default;
    }

    /**
     * Devolve `asc` ou `desc` — nunca outra coisa.
     *
     * `$default` também passa pela normalização, para que um default errado
     * no call site não reintroduza o mesmo 500 que este método existe para
     * evitar.
     */
    public static function direction(mixed $value, string $default = 'desc'): string
    {
        foreach ([$value, $default] as $candidate) {
            if (!is_string($candidate)) {
                continue;
            }

            $normalized = strtolower(trim($candidate));

            if ($normalized === 'asc' || $normalized === 'desc') {
                return $normalized;
            }
        }

        return 'desc';
    }

    /**
     * Devolve um page size dentro de [PER_PAGE_MIN, PER_PAGE_MAX].
     *
     * Entrada não numérica (texto, array, null) cai no default em vez de
     * virar 0 por cast silencioso — `paginate(0)` traz a tabela inteira.
     */
    public static function perPage(mixed $value, int $default = self::PER_PAGE_DEFAULT): int
    {
        $perPage = is_numeric($value) ? (int) $value : $default;

        return max(self::PER_PAGE_MIN, min(self::PER_PAGE_MAX, $perPage));
    }
}
