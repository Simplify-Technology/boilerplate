<?php

declare(strict_types = 1);

use App\Models\User;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

test('the named auth rate limiter is registered', function() {
    expect(RateLimiter::limiter('auth'))->not->toBeNull();
});

it('registers the named limiter', function(string $limiter) {
    expect(RateLimiter::limiter($limiter))->not->toBeNull();
})->with([
    'impersonate'           => 'impersonate',
    'verification'          => 'verification',
    'password-confirmation' => 'password-confirmation',
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

// region Re-confirmação de senha
/*
 * `POST confirm-password` valida a senha do próprio usuário com
 * `Auth::guard('web')->validate()` e não tinha limite em lugar nenhum: nem
 * throttle de rota, nem limiter no controller (ao contrário do `LoginRequest`,
 * que tem o dele). É o MESMO segredo do login, defendido de um lado só — e a
 * tela existe justamente porque "estar logado" não basta para o que vem
 * depois dela. Sem teto, uma sessão sequestrada chutava a senha do dono à
 * vontade até abrir tudo que está atrás de `password.confirm`.
 */

test('confirm-password carries the named throttle', function() {
    $route = collect(Route::getRoutes()->getRoutes())
        ->first(fn($route): bool => in_array('POST', $route->methods(), true) && $route->uri() === 'confirm-password');

    expect($route)->not->toBeNull()
        ->and($route->gatherMiddleware())->toContain('throttle:password-confirmation');
});

test('confirm-password blocks the seventh guess within a minute', function() {
    $user = User::factory()->create(['is_active' => true]);
    $this->actingAs($user);

    for ($attempt = 1; $attempt <= 6; $attempt++) {
        expect($this->post('/confirm-password', ['password' => 'chute-errado'])->status())
            ->not->toBe(429, "A tentativa {$attempt} não deveria ser bloqueada");
    }

    $this->post('/confirm-password', ['password' => 'chute-errado'])
        ->assertStatus(429);
});

test('the confirm-password limit is per user, not global', function() {
    // Chave por usuário, como `impersonate` e `verification`. Se fosse global
    // (ou só por IP), queimar o limite trancaria colegas atrás do mesmo NAT
    // para fora das áreas sensíveis.
    $atacado  = User::factory()->create(['is_active' => true]);
    $terceiro = User::factory()->create(['is_active' => true]);

    $this->actingAs($atacado);

    for ($attempt = 1; $attempt <= 7; $attempt++) {
        $this->post('/confirm-password', ['password' => 'chute-errado']);
    }

    $this->actingAs($terceiro)
        ->post('/confirm-password', ['password' => 'password'])
        ->assertRedirect();
});

test('confirm-password still confirms a correct password within the limit', function() {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)
        ->post('/confirm-password', ['password' => 'password'])
        ->assertRedirect();

    expect(session()->has('auth.password_confirmed_at'))->toBeTrue();
});
// endregion

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
