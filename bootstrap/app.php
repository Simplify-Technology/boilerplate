<?php

declare(strict_types = 1);

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetSensitiveCacheHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function(Middleware $middleware): void {
        // Atrás de LB/CDN com TLS terminado, TRUSTED_PROXIES faz o framework
        // honrar X-Forwarded-* — sem isso isSecure() fica false e o
        // SecurityHeaders nunca emite HSTS/CSP em produção.
        /** @phpstan-ignore larastan.noEnvCallsOutsideOfConfig (env de infraestrutura lida no bootstrap) */
        $proxies = env('TRUSTED_PROXIES');

        if (is_string($proxies) && $proxies !== '') {
            $middleware->trustProxies(at: $proxies === '*' ? '*' : array_map(trim(...), explode(',', $proxies)));
        }

        $middleware->encryptCookies(except: ['appearance']);

        $middleware->web(append: [
            SecurityHeaders::class,
            SetSensitiveCacheHeaders::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            EnsureUserIsActive::class,
        ]);
    })
    ->withExceptions(function(Exceptions $exceptions): void {
        // Respostas renderizadas pelo handler (login redirect do `auth`, 403,
        // 404, 500) saem por fora da pilha de middleware — carimbamos aqui os
        // mesmos headers de segurança via SecurityHeaders::stamp().
        $exceptions->respond(function(Response $response, Throwable $exception, Request $request): Response {
            $status = $response->getStatusCode();

            // Clientes JSON puros (sem X-Inertia) continuam recebendo o corpo
            // JSON padrão do framework, nunca uma página HTML.
            $wantsHtml = $request->inertia() || !$request->expectsJson();

            if ($wantsHtml && !app()->environment(['local', 'testing']) && in_array($status, [403, 404, 500, 503], true)) {
                try {
                    $response = Inertia::render('errors/error-page', ['status' => $status])
                        ->toResponse($request)
                        ->setStatusCode($status);
                } catch (Throwable) {
                    // Se o próprio 500 vem de build/manifest quebrado, o render
                    // Inertia falharia de novo — Blade estático sem Vite.
                    $response = response()->view('errors.500', status: $status);
                }
            } elseif ($status === 419) {
                $response = back()->with('error', 'Sua sessão expirou. Por favor, tente novamente.');
            }

            return SecurityHeaders::stamp($response);
        });
    })->create();
