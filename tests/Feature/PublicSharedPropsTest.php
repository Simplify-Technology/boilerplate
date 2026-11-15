<?php

declare(strict_types = 1);

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;

it('publica apenas props permitidas para visitantes nas entradas públicas', function(string $routeName, string $transport): void {
    $this->withoutVite();
    $this->withSession(['status' => 'Senha redefinida com sucesso.']);

    $headers = $transport === 'html' ? [] : [
        'X-Inertia'         => 'true',
        'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(Request::create(route($routeName))),
    ];

    if ($transport === 'partial') {
        $headers['X-Inertia-Partial-Component'] = 'auth/login';
        $headers['X-Inertia-Partial-Except']    = 'quote';
    }

    /**
     * A home redireciona para dashboard e depois login. Seguir o caminho real
     * mantém esta guarda válida para a entrada pública sem inventar uma home.
     */
    $response = $this->withHeaders($headers)->followingRedirects()->get(route($routeName));

    $response->assertSuccessful();
    $this->assertGuest();

    if ($transport === 'html') {
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');

        $document = new DOMDocument();
        $document->loadHTML($response->getContent(), LIBXML_NOERROR | LIBXML_NOWARNING);
        $scripts = (new DOMXPath($document))->query('//script[@data-page="app" and @type="application/json"]');

        expect($scripts)->toHaveCount(1);

        $page = json_decode($scripts->item(0)->textContent, true, flags: JSON_THROW_ON_ERROR);
    } else {
        $response->assertHeader('X-Inertia', 'true');
        $page = $response->json();
    }

    expect($page['component'])->toBe('auth/login');

    $props = $page['props'];

    /**
     * Allowlist do payload inteiro, incluindo props próprias do login. Uma
     * chave operacional nova deve reprovar, mesmo sem nome conhecido aqui.
     * Partial-Except exercita o filtro sem esconder possíveis chaves extras.
     */
    $allowedProps = ['errors', 'name', 'auth', 'ziggy', 'canResetPassword', 'status'];

    if ($transport !== 'partial') {
        $allowedProps[] = 'quote';

        expect(array_keys($props['quote']))->toEqualCanonicalizing(['message', 'author']);
    }

    expect(array_keys($props))->toEqualCanonicalizing($allowedProps)
        ->and($props['auth'])->toBe([
            'user'          => null,
            'permissions'   => [],
            'roles'         => [],
            'impersonating' => [
                'active'               => false,
                'originalUserName'     => null,
                'impersonatedUserName' => null,
            ],
        ])
        ->and($props['name'])->toBe(config('app.name'))
        ->and($props['canResetPassword'])->toBeTrue()
        ->and($props['status'])->toBe('Senha redefinida com sucesso.');
})->with([
    'home'  => ['home'],
    'login' => ['login'],
])->with([
    'HTML inicial'   => ['html'],
    'visita Inertia' => ['inertia'],
    'reload parcial' => ['partial'],
]);
