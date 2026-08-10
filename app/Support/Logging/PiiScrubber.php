<?php

declare(strict_types = 1);

namespace App\Support\Logging;

/**
 * Scrubber de PII (LGPD) usado pelo processor Monolog
 * ({@see PiiScrubbingProcessor}) que intercepta o stack de logs padrão.
 *
 * Duas camadas:
 *  - Por chave: qualquer chave de contexto presente em {@see SENSITIVE_KEYS}
 *    (case insensitive) tem o valor substituído por `[REDACTED]` — campos
 *    sensíveis pelo nome, independente do formato do payload
 *    (cpf, cnpj, phone, email, password, token, …).
 *  - Por padrão: strings são varridas por assinaturas de CPF/CNPJ/CEP/
 *    telefone/email/JWT/bearer e substituídas por placeholders.
 *
 * Idempotente: rodar o scrub sobre saída já redigida é um no-op.
 */
final class PiiScrubber
{
    public const REDACTED = '[REDACTED]';

    /** @var list<string> Chaves cujo valor é substituído por inteiro. */
    private const SENSITIVE_KEYS = [
        // Secrets
        'password',
        'password_confirmation',
        'token',
        'access_token',
        'refresh_token',
        'api_key',
        'api-key',
        'apikey',
        'secret',
        'authorization',
        'auth',
        'bearer',
        'cookie',
        'session',
        // PII (LGPD)
        'cpf',
        'cnpj',
        'cpf_cnpj',
        'rg',
        'phone',
        'telefone',
        'celular',
        'mobile',
        'whatsapp',
        'email',
        'e_mail',
        'name',
        'nome',
        'full_name',
        'first_name',
        'last_name',
        'cep',
        'address',
        'endereco',
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
        if (is_array($value)) {
            $out = [];

            foreach ($value as $key => $sub) {
                if (is_string($key) && in_array(mb_strtolower($key), self::SENSITIVE_KEYS, true)) {
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

    public function scrubString(string $value): string
    {
        return preg_replace(array_keys(self::PATTERNS), array_values(self::PATTERNS), $value) ?? $value;
    }
}
