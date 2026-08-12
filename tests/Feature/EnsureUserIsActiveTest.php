<?php

declare(strict_types = 1);

use App\Http\Middleware\EnsureUserIsActive;
use App\Models\User;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Onde o middleware está pendurado é metade do que ele faz
|--------------------------------------------------------------------------
|
| `EnsureUserIsActive` entra por `$middleware->web(append: [...])` em
| `bootstrap/app.php`, ou seja, no GRUPO — e por isso cobre os três arquivos de
| rota (`web.php`, `settings.php`, `auth.php`) e qualquer arquivo futuro, de
| graça.
|
| A forma "natural" de escrever a mesma coisa é pendurá-lo num grupo dentro de
| `routes/web.php`. Um projeto derivado fez exatamente isso e deixou
| `settings/*` e as rotas de `auth` descobertas — uma conta desativada seguia
| trocando a própria senha. Os testes de baixo existiam lá, e continuavam
| verdes, porque todos exercitavam só o dashboard.
|
| Daí os casos abaixo: um por arquivo de rota, um em rota SEM `auth` (o
| middleware é do grupo, não da autenticação) e um estrutural, que é o único
| que percebe o dia em que alguém repetir a declaração nos três arquivos e
| deixar o quarto de fora.
|
*/

it('keeps an active user session untouched', function() {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)->get('/dashboard')->assertOk();
    $this->assertAuthenticated();
});

it('logs out a user that gets deactivated mid-session', function() {
    $user = User::factory()->create(['is_active' => true]);

    $this->actingAs($user)->get('/dashboard')->assertOk();

    $user->forceFill(['is_active' => false])->save();

    $this->get('/dashboard')
        ->assertRedirect(route('login'))
        ->assertInertiaFlash('error');

    $this->assertGuest();
});

it('blocks a deactivated user from logging in at all', function() {
    $user = User::factory()->create(['is_active' => false]);

    $response = $this->post('/login', [
        'email'    => $user->email,
        'password' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

/** Autentica, desativa a conta no meio da sessão e devolve o usuário. */
function desativadaNoMeioDaSessao(): User
{
    $user = User::factory()->create(['is_active' => true]);

    test()->actingAs($user)->get('/dashboard')->assertOk();

    $user->forceFill(['is_active' => false])->save();

    return $user;
}

it('ends the session on a settings route, not only on the dashboard', function(): void {
    // `routes/settings.php`. Era aqui que o derivado deixava a conta desativada
    // trocar a própria senha e o próprio e-mail.
    desativadaNoMeioDaSessao();

    $this->get(route('profile.edit'))
        ->assertRedirect(route('login'))
        ->assertInertiaFlash('error');

    $this->assertGuest();
});

it('ends the session on a route from the auth file', function(): void {
    // `routes/auth.php`. A confirmação de senha é o caminho para as áreas
    // sensíveis — cobri-la é o mínimo.
    desativadaNoMeioDaSessao();

    $this->get(route('password.confirm'))
        ->assertRedirect(route('login'))
        ->assertInertiaFlash('error');

    $this->assertGuest();
});

it('ends the session even where no auth middleware runs', function(): void {
    /*
     * `/` não carrega `auth`. Se o middleware fosse movido para o grupo
     * `auth` — a outra forma "natural" de errar —, a sessão de uma conta
     * desativada sobreviveria em toda rota pública, e ela seguiria vista como
     * autenticada por qualquer coisa que só leia `$request->user()`.
     */
    desativadaNoMeioDaSessao();

    $this->get(route('home'))->assertRedirect(route('login'));

    $this->assertGuest();
});

it('stays in the web middleware group, so a new route file is covered by default', function(): void {
    /*
     * O único caso que percebe a regressão mais teimosa: repetir a declaração
     * dentro dos três arquivos de rota deixa os três testes acima verdes e
     * ainda assim quebra a promessa — o próximo `routes/*.php` nasce
     * descoberto, sem nada avisando.
     */
    expect(Route::getMiddlewareGroups()['web'] ?? [])
        ->toContain(EnsureUserIsActive::class);
});
