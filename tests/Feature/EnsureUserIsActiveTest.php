<?php

declare(strict_types = 1);

use App\Http\Middleware\EnsureUserIsActive;
use App\Models\User;
use App\Services\ImpersonationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Activitylog\Models\Activity;

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
    $user = guestUser();

    $this->actingAs($user)->withSession(['private_marker' => 'preserved'])
        ->get('/dashboard')->assertOk()->assertSessionHas('private_marker', 'preserved');
    $this->assertAuthenticated();

    expect(Activity::query()->where('event', 'inactive_session_terminated')->exists())->toBeFalse();
});

it('rejects a deactivated account when the authenticated model is stale', function(): void {
    $user = guestUser();

    $this->actingAs($user)->get('/dashboard')->assertOk();

    User::query()->whereKey($user->id)->update(['is_active' => false]);

    expect($user->is_active)->toBeTrue();

    $this->get('/dashboard')->assertRedirect(route('login'));

    $this->assertGuest();
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

    $this->get(route('home'))->assertRedirect(route('dashboard'));

    $this->assertGuest();
});

it('serves a public page as a guest after deactivation', function(): void {
    Route::middleware('web')->get('/inactive-public-page', fn() => Inertia::render('auth/login'));

    desativadaNoMeioDaSessao();

    $this->get('/inactive-public-page')
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->where('auth.user', null)->hasFlash('error'));

    $this->assertGuest();
});

it('uses the authentication middleware response for deactivated JSON requests', function(): void {
    desativadaNoMeioDaSessao();

    $this->getJson(route('dashboard'))->assertUnauthorized();

    $this->assertGuest();
});

it('audits session termination without persisting URL credentials or personal data', function(): void {
    Route::middleware('web')->get('/__tests/reset/{token}', fn() => response('public page'));

    desativadaNoMeioDaSessao();

    $this->get('/__tests/reset/synthetic-reset-secret?email=private-person@example.test')->assertOk();

    $activity   = Activity::query()->where('event', 'inactive_session_terminated')->sole();
    $properties = $activity->properties->toJson();

    expect($properties)->not->toContain('synthetic-reset-secret')
        ->not->toContain('private-person@example.test');

    expect($activity->getProperty('request.url'))->toBe('__tests/reset/{token}');
});

it('invalidates session data and rotates session and CSRF identifiers', function(): void {
    $user = guestUser();

    $this->post(route('login'), ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect(route('dashboard'));

    $session = $this->app['session.store'];
    $session->put('private_marker', 'sensitive value');
    $sessionId = $session->getId();
    $csrfToken = $session->token();

    User::query()->whereKey($user->id)->update(['is_active' => false]);
    Auth::forgetGuards();

    $this->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertSessionMissing('private_marker')
        ->assertInertiaFlash('error');

    expect($session->getId())->not->toBe($sessionId)
        ->and($session->token())->not->toBe($csrfToken);

    $this->assertGuest();

    $this->get(route('login'))->assertOk()
        ->assertInertia(fn(Assert $page) => $page->hasFlash('error'));
});

it('rejects remember me authentication and expires the recaller cookie', function(): void {
    $user = guestUser();

    $login = $this->post(route('login'), [
        'email' => $user->email, 'password' => 'password', 'remember' => true,
    ])->assertRedirect(route('dashboard'));

    $cookieName    = Auth::guard('web')->getRecallerName();
    $cookie        = $login->getCookie($cookieName);
    $rememberToken = $user->fresh()->getRememberToken();

    expect($cookie)->not->toBeNull();

    $this->app['session.store']->invalidate();
    Auth::forgetGuards();
    User::query()->whereKey($user->id)->update(['is_active' => false]);

    $this->withCookie($cookieName, $cookie->getValue())
        ->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertCookieExpired($cookieName);

    $this->assertGuest();

    expect($user->fresh()->getRememberToken())->not->toBe($rememberToken);

    Auth::forgetGuards();
    $this->get(route('dashboard'))->assertRedirect(route('login'));
    $this->assertGuest();
});

it('ends impersonation without restoring either user when an account becomes unavailable', function(string $unavailable): void {
    $original = actingAsSuperUser();
    $persona  = guestUser();

    $this->post(route('users.impersonate', $persona))->assertRedirect(route('dashboard'));
    $this->get(route('dashboard'))->assertOk();

    if ($unavailable === 'deleted original') {
        $original->delete();
    } else {
        $user = $unavailable === 'original' ? $original : $persona;
        User::query()->whereKey($user->id)->update(['is_active' => false]);
    }

    $this->delete(route('users.impersonate.stop'))
        ->assertRedirect(route('login'))
        ->assertSessionMissing('impersonate_original_user_id')
        ->assertSessionMissing('impersonate_original_user_name')
        ->assertInertiaFlash('error');

    $this->assertGuest();
    expect(app(ImpersonationService::class)->isImpersonating())->toBeFalse()
        ->and(Activity::query()->where('event', 'impersonate_stopped')->exists())->toBeFalse();

    $activity = Activity::query()->where('event', 'inactive_session_terminated')->sole();

    expect($activity->subject_id)->toBe($persona->id)
        ->and($activity->causer_id)->toBe($unavailable === 'deleted original' ? null : $original->id)
        ->and($activity->causer_type)->toBe($unavailable === 'deleted original' ? null : User::class)
        ->and($activity->getProperty('scope'))->toBe('security');

    $this->post(route('logout'))->assertRedirect(route('login'));
    $this->assertGuest();

    expect(Activity::query()->where('event', 'inactive_session_terminated')->count())->toBe(1);
})->with(['original', 'persona', 'deleted original']);

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
