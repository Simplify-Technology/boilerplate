<?php

declare(strict_types = 1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Impede que caches compartilhados (proxies, CDNs) armazenem respostas
 * HTML/JSON (Inertia) de usuários autenticados.
 */
final class SetSensitiveCacheHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!$request->user()) {
            return $response;
        }

        $contentType = (string) $response->headers->get('Content-Type', '');

        if (!str_contains($contentType, 'text/html') && !str_contains($contentType, 'application/json')) {
            return $response;
        }

        $response->headers->set('Cache-Control', 'private, no-store, must-revalidate');

        return $response;
    }
}
