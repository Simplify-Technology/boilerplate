<?php

declare(strict_types = 1);

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

test('the named auth rate limiter is registered', function() {
    expect(RateLimiter::limiter('auth'))->not->toBeNull();
});

it('registers the named limiter', function(string $limiter) {
    expect(RateLimiter::limiter($limiter))->not->toBeNull();
})->with([
    'impersonate'  => 'impersonate',
    'verification' => 'verification',
]);

// Teste de contrato: garante que ninguém remove o throttle dessas rotas por
// acidente. O login não entra aqui porque já tem limitação própria via
// LoginRequest (por email+ip).
test('abuse-prone auth routes keep the named throttle middleware', function(string $method, string $uri) {
    $route = collect(Route::getRoutes()->getRoutes())
        ->first(fn($route): bool => in_array($method, $route->methods(), true) && $route->uri() === $uri);

    expect($route)->not->toBeNull()
        ->and($route->gatherMiddleware())->toContain('throttle:auth');
})->with([
    ['POST', 'register'],
    ['POST', 'forgot-password'],
    ['POST', 'reset-password'],
]);

// Mesmo contrato para os limiters nomeados que substituíram os throttles
// inline (throttle:10,1 / throttle:6,1): a rota carrega o middleware nomeado
// e o inline não volta por acidente.
it('keeps the named throttle middleware instead of the inline limit', function(string $method, string $uri, string $named, string $inline) {
    $route = collect(Route::getRoutes()->getRoutes())
        ->first(fn($route): bool => in_array($method, $route->methods(), true) && $route->uri() === $uri);

    expect($route)->not->toBeNull()
        ->and($route->gatherMiddleware())->toContain($named)->not->toContain($inline);
})->with([
    'impersonate start'   => ['POST', 'users/{user}/impersonate', 'throttle:impersonate', 'throttle:10,1'],
    'verification verify' => ['GET', 'verify-email/{id}/{hash}', 'throttle:verification', 'throttle:6,1'],
    'verification send'   => ['POST', 'email/verification-notification', 'throttle:verification', 'throttle:6,1'],
]);

test('forgot-password blocks the 11th request within a minute', function() {
    for ($attempt = 1; $attempt <= 10; $attempt++) {
        $response = $this->post('/forgot-password', [
            'email' => "ghost{$attempt}@example.com",
        ]);

        expect($response->status())->not->toBe(429);
    }

    $blocked = $this->post('/forgot-password', [
        'email' => 'ghost11@example.com',
    ]);

    expect($blocked->status())->toBe(429);
});
