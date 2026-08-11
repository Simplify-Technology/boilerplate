<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Services\ImpersonationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

/*
 * `stop()` resolvia a conta original DEPOIS de limpar a sessão. Se a conta foi
 * excluída durante a impersonação, o findOrFail estourava com a sessão já ida:
 * o operador ficava preso na persona, sem marcador e sem caminho de volta.
 */

it('keeps the impersonation marker when the original account is gone', function(): void {
    $impersonator = actingAsSuperUser();
    $persona      = userWithRole(Roles::MANAGER);

    app(ImpersonationService::class)->start($impersonator, $persona);

    // A conta original some no meio da sessão (exclusão pelo painel, sync, etc).
    $impersonator->delete();

    expect(fn() => app(ImpersonationService::class)->stop())
        ->toThrow(Illuminate\Database\Eloquent\ModelNotFoundException::class);

    // O que importa: a sessão continua marcando a impersonação, então o painel
    // segue mostrando a faixa e o botão de voltar em vez de esconder o estado.
    expect(app(ImpersonationService::class)->isImpersonating())->toBeTrue()
        ->and(app(ImpersonationService::class)->getOriginalUserName())->toBe($impersonator->name);
});

it('clears the session on a successful stop', function(): void {
    $impersonator = actingAsSuperUser();
    $persona      = userWithRole(Roles::MANAGER);

    app(ImpersonationService::class)->start($impersonator, $persona);

    expect(app(ImpersonationService::class)->isImpersonating())->toBeTrue();

    $back = app(ImpersonationService::class)->stop();

    expect($back->id)->toBe($impersonator->id)
        ->and(Auth::id())->toBe($impersonator->id)
        ->and(app(ImpersonationService::class)->isImpersonating())->toBeFalse()
        ->and(Session::has('impersonate_original_user_name'))->toBeFalse();
});
