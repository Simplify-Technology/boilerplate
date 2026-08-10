<?php

declare(strict_types = 1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Baseline security headers para toda superfície web.
 *
 * HSTS e CSP são aplicados apenas em produção (e sob HTTPS) para não quebrar o
 * HMR do Vite em desenvolvimento; a CSP usa 'unsafe-inline' enquanto o
 * app.blade.php tiver script/style inline. Só preenche o que a resposta ainda
 * não declarou, para uma rota poder abrir exceção explicitamente sem precisar
 * sair do middleware.
 */
final class SecurityHeaders
{
    /** @var array<string, string> */
    private const HEADERS = [
        'X-Frame-Options'        => 'DENY',
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy'        => 'strict-origin-when-cross-origin',
        'Permissions-Policy'     => 'camera=(), microphone=(), geolocation=(), payment=()',
    ];

    /**
     * Carimba os headers numa resposta já pronta.
     *
     * Usado também pelo handler de exceptions (`bootstrap/app.php`): quando um
     * middleware interno lança (ex.: `auth` redirecionando para o login), a
     * exception escapa do `$next()` daqui e a resposta é renderizada por fora
     * da pilha — sem este ponto de entrada ela sairia sem os headers.
     */
    public static function stamp(Response $response): Response
    {
        foreach (self::HEADERS as $header => $value) {
            if (!$response->headers->has($header)) {
                $response->headers->set($header, $value);
            }
        }

        return $response;
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = self::stamp($next($request));

        if (app()->isProduction() && $request->isSecure()) {
            if (!$response->headers->has('Strict-Transport-Security')) {
                $response->headers->set(
                    'Strict-Transport-Security',
                    'max-age=31536000; includeSubDomains; preload',
                );
            }

            if (!$response->headers->has('Content-Security-Policy')) {
                $response->headers->set(
                    'Content-Security-Policy',
                    implode('; ', [
                        "default-src 'self'",
                        "script-src 'self' 'unsafe-inline'",
                        "style-src 'self' 'unsafe-inline'",
                        "img-src 'self' data: https:",
                        "font-src 'self' data:",
                        "connect-src 'self'",
                        "frame-ancestors 'none'",
                        "form-action 'self'",
                        "base-uri 'self'",
                        "object-src 'none'",
                    ]),
                );
            }
        }

        return $response;
    }
}
