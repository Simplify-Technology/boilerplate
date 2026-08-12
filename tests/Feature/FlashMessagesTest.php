<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia as Assert;

/*
|--------------------------------------------------------------------------
| Canal de flash — nativo do Inertia 3
|--------------------------------------------------------------------------
|
| O flash viaja no OBJETO DE PÁGINA (irmão de component/props/url), não entre
| as props. Duas consequências que estes testes travam:
|
| 1. Partial reload não o alcança. Antes, `flash` era prop montada com
|    `session()->pull()` no share(): num reload parcial que não pedisse a
|    chave, a prop era filtrada DEPOIS de o pull já ter consumido a mensagem,
|    e o toast nunca aparecia.
| 2. O consumo é global (um `router.on('flash')` em app.tsx), então não existe
|    mais "página que esqueceu de chamar o hook". Os três casos abaixo eram
|    exatamente isso: mensagens que o backend emitia e ninguém exibia.
|
*/

it('entrega o flash de uma mutação na página de destino', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->delete(route('users.destroy', $target))
        ->assertRedirect(route('users.index'))
        ->assertInertiaFlash('success', 'Usuário excluído com sucesso!');

    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->hasFlash('success', 'Usuário excluído com sucesso!'));
});

it('sobrevive a um partial reload que não pede a chave', function(): void {
    // O caso que o canal antigo perdia. O reload parcial pede só `users`;
    // o flash chega assim mesmo, porque não é prop.
    actingAsSuperUser();
    $target = guestUser();

    $this->delete(route('users.destroy', $target))->assertRedirect(route('users.index'));

    // Asserção no payload cru de propósito: o `AssertableInertia` não parseia
    // resposta parcial, e o que importa aqui é justamente ONDE o flash está —
    // no topo da página, fora de `props`. Se um dia ele voltar para dentro de
    // `props`, a segunda expectativa pega.
    $page = $this->get(route('users.index'), [
        'X-Inertia'                   => 'true',
        'X-Inertia-Version'           => (string) Inertia::getVersion(),
        'X-Inertia-Partial-Data'      => 'users',
        'X-Inertia-Partial-Component' => 'users/index',
    ])->assertOk()->json();

    expect($page['props'])->toHaveKeys(['users'])
        ->and($page['props'])->not->toHaveKey('flash')
        ->and($page)->toHaveKey('flash.success', 'Usuário excluído com sucesso!');
});

it('não deixa resto de flash em uma navegação seguinte', function(): void {
    actingAsSuperUser();
    $target = guestUser();

    $this->delete(route('users.destroy', $target))->assertRedirect(route('users.index'));
    $this->get(route('users.index'))->assertOk();

    // Segunda visita: o servidor já entregou a mensagem, ela não pode voltar.
    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page->missingFlash('success'));
});

/*
|--------------------------------------------------------------------------
| Os três casos que estavam mudos
|--------------------------------------------------------------------------
*/

it('avisa o usuário desativado no meio da sessão, na tela de login', function(): void {
    // `EnsureUserIsActive` invalida a sessão antes de redirecionar. Como o
    // Inertia::flash() escreve na sessão NA HORA (ao contrário do ->with(),
    // aplicado só no envio), ele precisa vir depois do invalidate(). Se alguém
    // subir a chamada para antes, este teste fica vermelho.
    $user = actingAsUserWithRole(Roles::MANAGER);
    $user->forceFill(['is_active' => false])->save();

    $this->get(route('users.index'))
        ->assertRedirect(route('login'))
        ->assertInertiaFlash('error', 'Sua conta foi desativada. Entre em contato com o administrador.');

    $this->assertGuest();
});

it('avisa que a sessão expirou no 419', function(): void {
    // O CSRF real não dispara em teste (o ValidateCsrfToken se desliga sozinho
    // sob PHPUnit), então exercitamos o ramo do handler pelo status, que é o
    // que `bootstrap/app.php` de fato inspeciona.
    Route::middleware('web')->get('/__teste-419', fn() => abort(419));

    $this->from(route('login'))
        ->get('/__teste-419')
        ->assertRedirect(route('login'))
        ->assertInertiaFlash('error', 'Sua sessão expirou. Por favor, tente novamente.');
});

it('avisa ao entrar e ao sair da personificação', function(): void {
    $admin  = actingAsSuperUser();
    $target = userWithRole(Roles::MANAGER);

    $this->post(route('users.impersonate', $target))
        ->assertInertiaFlash('success', "Você está usando o painel como {$target->name}");

    $this->delete(route('users.impersonate.stop'))
        ->assertInertiaFlash('success', "Você voltou para sua conta original: {$admin->name}");
});

it('publica apenas as chaves realmente setadas', function(): void {
    // O bloco antigo do share() mandava as quatro chaves com null em TODA
    // resposta. O nativo só carrega o que foi flashado.
    actingAsSuperUser();
    $target = guestUser();

    $this->delete(route('users.destroy', $target))->assertRedirect(route('users.index'));

    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->hasFlash('success')
            ->missingFlash('error')
            ->missingFlash('warning')
            ->missingFlash('info'));
});

it('não publica flash em uma navegação sem mutação', function(): void {
    actingAsSuperUser();

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn(Assert $page) => $page
            ->missingFlash('success')
            ->missingFlash('error'));

    expect(User::query()->count())->toBeGreaterThan(0);
});
