<?php

declare(strict_types = 1);

namespace App\Support\Logging;

use Illuminate\Contracts\Support\Arrayable;

/**
 * Scrubber de PII (LGPD) usado pelo processor Monolog
 * ({@see PiiScrubbingProcessor}) que intercepta o stack de logs padrão.
 *
 * Duas camadas:
 *  - Por chave: chave de contexto que CONTENHA um termo de
 *    {@see SENSITIVE_KEY_PARTS}, ou que seja exatamente um de
 *    {@see SENSITIVE_KEYS}, tem o valor substituído por `[REDACTED]` —
 *    inclusive subárvore inteira.
 *  - Por padrão: strings são varridas por assinaturas de CPF/CNPJ/CEP/
 *    telefone/email/JWT/bearer e substituídas por placeholders.
 *
 * Objeto que implementa `Arrayable` (model, Collection, DTO, resource) é
 * convertido antes de descer. Sem isso ele atravessava o processor intacto e
 * só era serializado pelo formatter do Monolog — DEPOIS das duas camadas —,
 * então `Log::info('x', ['user' => $user])` gravava nome, CPF formatado e
 * notas internas em claro, mesmo com o CPF tendo assinatura de regex.
 *
 * Idempotente: rodar o scrub sobre saída já redigida é um no-op.
 *
 * **Limite conhecido, medido:** a mensagem e o trace de um `Throwable` passado
 * em `['exception' => $e]` são renderizados pelo formatter, fora do alcance de
 * qualquer processor. A regra continua sendo não colocar PII em mensagem de
 * exception.
 */
final class PiiScrubber
{
    public const REDACTED = '[REDACTED]';

    /**
     * Termos inequívocos: a chave é sensível se os CONTIVER. Cobre a família
     * composta (`user_email`, `customer_cpf`, `billing_address`), que a
     * igualdade exata deixava passar sempre que o valor não tinha assinatura
     * de regex — nome de pessoa e endereço livre não têm.
     *
     * Todo termo aqui passou por auditoria de substring acidental. `cep` NÃO
     * entra: "ex**cep**tion" o contém, e casá-lo apagaria a classe do erro em
     * todo log de falha.
     *
     * @var list<string>
     */
    private const SENSITIVE_KEY_PARTS = [
        // Secrets
        'password',
        'token',
        'secret',
        'api_key',
        'api-key',
        'apikey',
        'authorization',
        // PII (LGPD)
        'cpf',
        'cnpj',
        'phone',
        'telefone',
        'celular',
        'whatsapp',
        'email',
        'e_mail',
        'address',
        'endereco',
    ];

    /**
     * Termos ambíguos: sensíveis só quando a chave é exatamente isto.
     *
     * `name` sozinho é o nome do titular, mas `role_name`, `permission_name` e
     * `file_name` são dado operacional que o log PRECISA carregar — este
     * repositório registra os dois primeiros o tempo todo. Pela mesma razão
     * `rg` (que "o**rg**anization" e "ta**rg**et" contêm), `auth` ("**auth**or"),
     * `session`, `mobile` e `cep` ficam aqui. Composto de `name` que nomeia
     * pessoa entra explicitamente na lista, um a um.
     *
     * @var list<string>
     */
    private const SENSITIVE_KEYS = [
        'auth',
        'bearer',
        'cookie',
        'session',
        'rg',
        'mobile',
        'cep',
        'name',
        'nome',
        'user_name',
        'full_name',
        'first_name',
        'last_name',
        // Os quatro campos que o `UserPolicy::viewSensitive()` protege são
        // `cpf_cnpj`, `phone`, `mobile` e `user_notes`. Os três primeiros já
        // caem nos termos acima; este faltava, e um model no contexto o
        // entregava inteiro. `notes` fica exato porque `release_notes` e
        // `notes_count` são operacionais.
        'notes',
        'user_notes',
    ];

    /** @var array<string, string> Regex → substituição em strings. */
    private const PATTERNS = [
        // CPF formatado (000.000.000-00)
        '/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/' => '[CPF]',
        // CNPJ formatado (00.000.000/0000-00)
        '/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/' => '[CNPJ]',
        // Telefone E.164 (+55…, +1…)
        '/\+\d{10,15}\b/' => '[PHONE]',
        // Telefone BR formatado ((11) 98765-4321, (11) 3210-9876)
        '/\(\d{2}\)\s?\d{4,5}-\d{4}\b/' => '[PHONE]',
        // CEP formatado (01001-000)
        '/\b\d{5}-\d{3}\b/' => '[CEP]',
        // Email
        '/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/' => '[EMAIL]',
        // JWT (três segmentos base64url)
        '/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/' => '[JWT]',
        // Token bearer inline ("Bearer abc123…")
        '/\bBearer\s+[A-Za-z0-9._~+\/=-]{8,}/' => 'Bearer [TOKEN]',
        // Sequência solta de 11–14 dígitos (CPF/CNPJ sem máscara)
        '/\b\d{11,14}\b/' => '[NUMERIC_ID]',
    ];

    public function scrub(mixed $value): mixed
    {
        if ($value instanceof Arrayable) {
            $value = $value->toArray();
        }

        if (is_array($value)) {
            $out = [];

            foreach ($value as $key => $sub) {
                if (is_string($key) && $this->isSensitiveKey($key)) {
                    $out[$key] = self::REDACTED;

                    continue;
                }

                $out[$key] = $this->scrub($sub);
            }

            return $out;
        }

        if (is_string($value)) {
            return $this->scrubString($value);
        }

        return $value;
    }

    private function isSensitiveKey(string $key): bool
    {
        $key = mb_strtolower($key);

        if (in_array($key, self::SENSITIVE_KEYS, true)) {
            return true;
        }

        foreach (self::SENSITIVE_KEY_PARTS as $part) {
            if (str_contains($key, $part)) {
                return true;
            }
        }

        return false;
    }

    public function scrubString(string $value): string
    {
        return preg_replace(array_keys(self::PATTERNS), array_values(self::PATTERNS), $value) ?? $value;
    }
}
