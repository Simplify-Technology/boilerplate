<?php

declare(strict_types = 1);

use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Auth\Middleware\Authorize as AuthorizeMiddleware;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Contrato de autorização das rotas de escrita
|--------------------------------------------------------------------------
|
| Origem: harvest v2, dimensão 1 (Segurança) do ctfinance @ b8c6d57. Lá,
| `POST users/{user}/impersonate` carregava só `throttle:10,1` — a
| autorização tinha sumido da rota e nada acusou.
|
| A regra: toda rota de escrita (POST/PUT/PATCH/DELETE) sob `auth` declara
| autorização NA PRÓPRIA ROTA. Duas formas contam, porque o L13 aceita as
| duas: o alias `can:` e o atributo nativo `#[Authorize]`, que não vira
| `can:` — vira `Illuminate\Auth\Middleware\Authorize:<ability>`.
|
| A exceção é o self-service: ação que o usuário só exerce sobre a própria
| conta, onde estar autenticado JÁ É a autorização inteira. Essas rotas vivem
| numa allowlist explícita, verificada nos dois sentidos.
|
| Fora do contrato: rotas de pacote (Horizon, log-viewer), que têm gate
| próprio, e `Route::redirect()`, que não escreve nada.
|
*/

/**
 * Rotas de escrita autenticadas que legitimamente não declaram autorização:
 * o usuário age sobre a própria conta.
 *
 * @return list<string>
 */
function selfServiceWriteRoutes(): array
{
    return [
        'DELETE settings/profile',
        'DELETE users/impersonate',
        'PATCH settings/profile',
        'POST confirm-password',
        'POST email/verification-notification',
        'POST logout',
        'PUT settings/password',
    ];
}

/**
 * Rotas de escrita da aplicação, sob `auth`, que não declaram autorização.
 *
 * @return list<string>
 */
function writeRoutesWithoutAuthorization(): array
{
    $found = [];

    foreach (Route::getRoutes()->getRoutes() as $route) {
        if (!routeIsOwnedByTheApplication($route)) {
            continue;
        }

        $middleware = array_filter($route->gatherMiddleware(), is_string(...));

        if (!middlewareRequiresAuthentication($middleware) || middlewareDeclaresAuthorization($middleware)) {
            continue;
        }

        foreach (array_intersect($route->methods(), ['POST', 'PUT', 'PATCH', 'DELETE']) as $method) {
            $found[] = $method . ' ' . $route->uri();
        }
    }

    $found = array_values(array_unique($found));
    sort($found);

    return $found;
}

/**
 * Rotas de pacote têm gate próprio e `Route::redirect()` não escreve nada —
 * o contrato governa só o que é nosso. Closure em arquivo de rota conta como
 * nossa (é código da aplicação, mesmo sem controller).
 */
function routeIsOwnedByTheApplication(RoutingRoute $route): bool
{
    $action = $route->getAction('uses');

    if (!is_string($action)) {
        return true;
    }

    return str_starts_with(ltrim($action, '\\'), 'App\\Http\\Controllers\\');
}

/**
 * @param  array<int, string>  $middleware
 */
function middlewareRequiresAuthentication(array $middleware): bool
{
    foreach ($middleware as $entry) {
        if ($entry === 'auth' || str_starts_with($entry, 'auth:')) {
            return true;
        }

        if ($entry === Authenticate::class || str_starts_with($entry, Authenticate::class . ':')) {
            return true;
        }
    }

    return false;
}

/**
 * Aceita as duas formas que o L13 produz: o alias `can:` (via `middleware()`
 * ou `Route::can()`) e o FQCN que o atributo `#[Authorize]` gera.
 *
 * @param  array<int, string>  $middleware
 */
function middlewareDeclaresAuthorization(array $middleware): bool
{
    foreach ($middleware as $entry) {
        if (str_starts_with($entry, 'can:') || str_starts_with($entry, AuthorizeMiddleware::class . ':')) {
            return true;
        }
    }

    return false;
}

it('exige autorização declarada em toda rota de escrita autenticada', function(): void {
    $unprotected = array_values(array_diff(
        writeRoutesWithoutAuthorization(),
        selfServiceWriteRoutes()
    ));

    expect($unprotected)->toBe([], sprintf(
        "Rota(s) de escrita sob `auth` sem autorização declarada:\n  - %s\n\n"
        . 'Some `can:<permissão>` (ou o atributo #[Authorize]) à rota. Se a ação for '
        . 'mesmo self-service — o usuário agindo sobre a própria conta — acrescente-a '
        . 'a selfServiceWriteRoutes() neste arquivo, com o motivo no PR.',
        implode("\n  - ", $unprotected)
    ));
});

it('mantém a allowlist de self-service honesta', function(): void {
    $stale = array_values(array_diff(
        selfServiceWriteRoutes(),
        writeRoutesWithoutAuthorization()
    ));

    expect($stale)->toBe([], sprintf(
        "Entrada(s) obsoleta(s) em selfServiceWriteRoutes():\n  - %s\n\n"
        . 'A rota deixou de existir, mudou de URI/verbo, ou passou a declarar '
        . 'autorização. Remova a entrada — allowlist que não corresponde ao código '
        . 'esconde a próxima rota desprotegida.',
        implode("\n  - ", $stale)
    ));
});

// Regressão nomeada: é o furo concreto encontrado no ctfinance, onde a rota
// ficou só com o throttle. AuthRouteThrottleTest cobre o limiter; aqui cobrimos
// o gate, para que remover um não passe despercebido por causa do outro.
it('mantém o gate de permissão na rota de iniciar impersonation', function(): void {
    $route = collect(Route::getRoutes()->getRoutes())
        ->first(fn(RoutingRoute $route): bool => in_array('POST', $route->methods(), true)
            && $route->uri() === 'users/{user}/impersonate');

    expect($route)->not->toBeNull()
        ->and($route->gatherMiddleware())->toContain('can:impersonate_users');
});
