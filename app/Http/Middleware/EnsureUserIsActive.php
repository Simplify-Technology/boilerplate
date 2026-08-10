<?php

declare(strict_types = 1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Encerra a sessão de um usuário desativado no meio da sessão. Novos logins
 * já são bloqueados pelo is_active na query do LoginRequest::authenticate();
 * este middleware cobre a sessão aberta quando a conta é desativada, para que
 * revogar o acesso não dependa de o usuário deslogar sozinho.
 */
final class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->is_active === false) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()
                ->route('login')
                ->with('error', 'Sua conta foi desativada. Entre em contato com o administrador.');
        }

        return $next($request);
    }
}
