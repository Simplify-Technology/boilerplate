<?php

declare(strict_types = 1);

use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Event;

/*
|--------------------------------------------------------------------------
| Lockout do login
|--------------------------------------------------------------------------
|
| `POST login` é a rota mais atacada da aplicação e a única do grupo `guest`
| SEM throttle de rota (`routes/auth.php`): `register`, `forgot-password` e
| `reset-password` carregam `throttle:auth`, o login não. A defesa inteira mora
| no `LoginRequest::ensureIsNotRateLimited()` — 5 tentativas por `email|ip` —,
| e até aqui nada exercitava esse limite.
|
| O `AuthRouteThrottleTest` chega a documentar a ausência ("O login não entra
| aqui porque já tem limitação própria via LoginRequest") sem que essa
| limitação própria fosse provada em lugar nenhum. Este arquivo fecha isso.
|
| Cada teste trava uma propriedade que se perde numa refatoração inocente, não
| só "a 6ª tentativa falha".
|
*/

/** Queima as tentativas com senha errada; devolve a última resposta. */
function tentativasFalhas(string $email, int $vezes = 5)
{
    $resposta = null;

    for ($i = 0; $i < $vezes; $i++) {
        $resposta = test()->post('/login', [
            'email'    => $email,
            'password' => 'senha-errada',
        ]);
    }

    return $resposta;
}

it('answers the sixth attempt with the throttle message, not with the failure one', function(): void {
    $user = User::factory()->create(['is_active' => true]);

    tentativasFalhas($user->email)
        ->assertSessionHasErrors(['email' => __('auth.failed')]);

    test()->post('/login', ['email' => $user->email, 'password' => 'senha-errada'])
        ->assertSessionHasErrorsIn('default', ['email']);

    expect(session('errors')->get('email')[0])
        ->toContain('Tentativas de login em excesso');
});

it('keeps refusing the correct password while the lockout holds', function(): void {
    /*
     * A propriedade que importa para segurança, e a mais fácil de perder ao
     * mover a checagem para depois do `Auth::attempt()`: o bloqueio não é
     * contornável acertando a senha na tentativa seguinte.
     */
    $user = User::factory()->create(['is_active' => true]);

    tentativasFalhas($user->email);

    $this->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('locks the pair email+ip, not the ip alone', function(): void {
    /*
     * Chave só por IP transformaria a defesa em arma: um atacante trancaria
     * todo mundo que compartilha a saída NAT, sem saber senha nenhuma.
     */
    $vitima   = User::factory()->create(['is_active' => true]);
    $terceiro = User::factory()->create(['is_active' => true]);

    tentativasFalhas($vitima->email);

    $this->post('/login', ['email' => $terceiro->email, 'password' => 'password'])
        ->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticatedAs($terceiro);
});

it('locks the pair email+ip, not the email alone', function(): void {
    /*
     * A outra metade da chave. Sem o IP, a mesma conta seria trancável de
     * qualquer lugar — e força bruta distribuída passaria a derrubar contas
     * alheias de propósito.
     */
    $user = User::factory()->create(['is_active' => true]);

    tentativasFalhas($user->email);

    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.7'])
        ->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect(route('dashboard', absolute: false));

    $this->assertAuthenticatedAs($user);
});

it('clears the counter after a successful login', function(): void {
    // Sem o `RateLimiter::clear()`, quem errasse 4 vezes ao longo do dia seria
    // trancado no primeiro erro seguinte, mesmo tendo entrado no meio.
    $user = User::factory()->create(['is_active' => true]);

    tentativasFalhas($user->email, 4);

    $this->post('/login', ['email' => $user->email, 'password' => 'password'])
        ->assertRedirect(route('dashboard', absolute: false));

    $this->post('/logout');

    // Se o contador tivesse sobrevivido, estas 4 já estourariam o limite.
    tentativasFalhas($user->email, 4);

    expect(session('errors')->get('email')[0])->toBe(__('auth.failed'));
});

it('fires the Lockout event so a project can alert on it', function(): void {
    Event::fake([Lockout::class]);

    $user = User::factory()->create(['is_active' => true]);

    tentativasFalhas($user->email, 6);

    Event::assertDispatched(Lockout::class);
});

it('does not fire the Lockout event before the limit', function(): void {
    Event::fake([Lockout::class]);

    $user = User::factory()->create(['is_active' => true]);

    tentativasFalhas($user->email, 5);

    Event::assertNotDispatched(Lockout::class);
});
