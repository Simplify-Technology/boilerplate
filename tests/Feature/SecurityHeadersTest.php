<?php

declare(strict_types = 1);

use App\Models\User;
use Illuminate\Testing\TestResponse;

function assertBaselineSecurityHeaders(TestResponse $response): void
{
    $response
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
}

it('stamps the baseline security headers on web responses', function() {
    assertBaselineSecurityHeaders($this->get('/login')->assertOk());
});

it('does not send HSTS or CSP outside production', function() {
    $response = $this->get('/login')->assertOk();

    $response
        ->assertHeaderMissing('Strict-Transport-Security')
        ->assertHeaderMissing('Content-Security-Policy');
});

it('stamps the security headers on responses rendered by the exception handler', function() {
    // Exception lançada middleware adentro escapa do `$next()`, então a resposta
    // vem do handler — coberta pelo `$exceptions->respond()` do bootstrap.
    assertBaselineSecurityHeaders($this->get('/dashboard')->assertRedirect(route('login')));

    assertBaselineSecurityHeaders($this->get('/rota-que-nao-existe')->assertNotFound());
});

it('marks authenticated html responses as non-cacheable', function() {
    $user = User::factory()->create(['is_active' => true]);

    $cacheControl = (string) $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->headers->get('Cache-Control');

    expect($cacheControl)
        ->toContain('no-store')
        ->toContain('private');
});

it('leaves guest responses cacheable by the browser default rules', function() {
    $cacheControl = (string) $this->get('/login')
        ->assertOk()
        ->headers->get('Cache-Control');

    expect($cacheControl)->not->toContain('no-store');
});
