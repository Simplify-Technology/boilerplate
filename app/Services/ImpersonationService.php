<?php

declare(strict_types = 1);

namespace App\Services;

use App\Events\ImpersonateStarted;
use App\Events\ImpersonateStopped;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

final class ImpersonationService
{
    private const SESSION_ORIGINAL_USER_ID = 'impersonate_original_user_id';

    private const SESSION_ORIGINAL_USER_NAME = 'impersonate_original_user_name';

    public function start(User $impersonator, User $targetUser): void
    {
        Session::put(self::SESSION_ORIGINAL_USER_ID, $impersonator->id);
        Session::put(self::SESSION_ORIGINAL_USER_NAME, $impersonator->name);

        Auth::login($targetUser);

        event(new ImpersonateStarted($impersonator, $targetUser));
    }

    public function stop(): User
    {
        // A conta original é resolvida ANTES de a sessão ser limpa. Se ela foi
        // excluída durante a impersonação, o findOrFail estoura — e com a ordem
        // invertida estourava depois de a sessão já ter ido, deixando o operador
        // preso na persona, sem marcador e sem caminho de volta pelo painel.
        $originalUser = User::findOrFail(Session::get(self::SESSION_ORIGINAL_USER_ID));

        Session::forget([self::SESSION_ORIGINAL_USER_ID, self::SESSION_ORIGINAL_USER_NAME]);

        $impersonatedUser = Auth::user();

        Auth::login($originalUser);

        event(new ImpersonateStopped($originalUser, $impersonatedUser));

        return $originalUser;
    }

    public function isImpersonating(): bool
    {
        return Session::has(self::SESSION_ORIGINAL_USER_ID);
    }

    public function getOriginalUserName(): ?string
    {
        return Session::get(self::SESSION_ORIGINAL_USER_NAME);
    }

    public function getOriginalUser(): ?User
    {
        if (!$this->isImpersonating()) {
            return null;
        }

        $originalUserId = Session::get(self::SESSION_ORIGINAL_USER_ID);

        if (!$originalUserId) {
            return null;
        }

        return User::find($originalUserId);
    }
}
