<?php

declare(strict_types = 1);

use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;

beforeEach(function() {
    $this->withoutVite();
});

// O respond() do bootstrap só troca a resposta pela página Inertia fora de
// local/testing; simulamos produção trocando o env em runtime.
it('renders the inertia error page for a 404 in production', function() {
    $this->app['env'] = 'production';

    $this->get('/rota-que-nao-existe')
        ->assertNotFound()
        ->assertInertia(
            fn(AssertableInertia $page) => $page
                ->component('errors/error-page')
                ->where('status', 404)
        );
});

it('renders the inertia error page for a 500 in production', function() {
    $this->app['env'] = 'production';

    Route::middleware('web')->get('/_boom', fn() => abort(500));

    $response = $this->get('/_boom');

    $response->assertStatus(500)
        ->assertInertia(
            fn(AssertableInertia $page) => $page
                ->component('errors/error-page')
                ->where('status', 500)
        );

    // Mesmo vindas do exception handler, as respostas saem carimbadas.
    $response->assertHeader('X-Frame-Options', 'DENY');
});

it('keeps the default error rendering in the testing environment', function() {
    $this->get('/rota-que-nao-existe')
        ->assertNotFound()
        ->assertDontSee('errors/error-page');
});

it('redirects back with a flash when the session expires (419)', function() {
    $this->app['env'] = 'production';

    // Fora de testing o CSRF volta a valer: POST sem token gera 419.
    $this->from(route('login'))
        ->post(route('login'), [])
        ->assertRedirect(route('login'))
        ->assertInertiaFlash('error');
});
