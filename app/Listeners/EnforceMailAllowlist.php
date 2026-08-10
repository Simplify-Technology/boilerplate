<?php

declare(strict_types = 1);

namespace App\Listeners;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Mail\Events\MessageSending;
use Symfony\Component\Mime\Address;

/**
 * Trava de staging: FORA de produção, redireciona destinatários fora da
 * allowlist (`config('mail.allowlist')` / env MAIL_ALLOWLIST) para a caixa de
 * teste (`config('mail.test_inbox')` / env MAIL_TEST_INBOX) — evita e-mail de
 * staging chegar em gente real. Em produção, ou sem allowlist configurada,
 * não faz nada.
 *
 * Registro: descoberta automática de eventos do Laravel (listeners em
 * `app/Listeners` com `handle()` tipado são registrados sozinhos).
 */
final class EnforceMailAllowlist
{
    public function __construct(private readonly Application $app)
    {
    }

    /**
     * Retorna `false` para cancelar o envio; `null` para seguir (deixa outros
     * listeners de MessageSending rodarem — `until()` só para em retorno não-nulo).
     */
    public function handle(MessageSending $event): ?bool
    {
        if ($this->app->environment('production')) {
            return null;
        }

        /** @var array<int, string> $allowlist */
        $allowlist = config('mail.allowlist', []);

        if ($allowlist === []) {
            return null;
        }

        $testInbox = config('mail.test_inbox');
        $message   = $event->message;

        $to  = $this->filter($message->getTo(), $allowlist, is_string($testInbox) ? $testInbox : null);
        $cc  = $this->filter($message->getCc(), $allowlist, null);
        $bcc = $this->filter($message->getBcc(), $allowlist, null);

        // Nada sobrou e sem caixa de teste: cancela o envio (não vaza para ninguém).
        if ($to === [] && $cc === [] && $bcc === []) {
            return false;
        }

        $message->to(...$to);
        $message->cc(...$cc);
        $message->bcc(...$bcc);

        return null;
    }

    /**
     * @param  array<int, Address> $addresses
     * @param  array<int, string>  $allowlist
     * @return array<int, Address>
     */
    private function filter(array $addresses, array $allowlist, ?string $fallback): array
    {
        $kept    = [];
        $blocked = false;

        foreach ($addresses as $address) {
            if ($this->allowed($address->getAddress(), $allowlist)) {
                $kept[] = $address;
            } else {
                $blocked = true;
            }
        }

        if ($blocked && $fallback !== null && $fallback !== '') {
            $kept[] = new Address($fallback);
        }

        return $kept;
    }

    /**
     * Um e-mail é permitido por match exato ("contato@empresa.com.br") ou por
     * domínio ("@empresa.com.br" ou "empresa.com.br").
     *
     * @param  array<int, string> $allowlist
     */
    private function allowed(string $email, array $allowlist): bool
    {
        $email  = mb_strtolower($email);
        $atPos  = mb_strpos($email, '@');
        $domain = $atPos === false ? '' : mb_substr($email, $atPos + 1);

        foreach ($allowlist as $entry) {
            $entry = mb_strtolower(trim($entry));

            if ($entry === '') {
                continue;
            }

            // Entrada por domínio: "@dominio.com" ou "dominio.com" (sem @).
            if (!str_contains($entry, '@') || str_starts_with($entry, '@')) {
                if ($domain !== '' && $domain === ltrim($entry, '@')) {
                    return true;
                }

                continue;
            }

            // Entrada por e-mail exato.
            if ($email === $entry) {
                return true;
            }
        }

        return false;
    }
}
