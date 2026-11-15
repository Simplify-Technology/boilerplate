<?php

declare(strict_types = 1);

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\ImpersonationService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Encerra a sessão de um usuário desativado no meio da sessão. Novos logins
 * já são bloqueados pelo is_active na query do LoginRequest::authenticate();
 * este middleware cobre a sessão aberta quando a conta é desativada, para que
 * revogar o acesso não dependa de o usuário deslogar sozinho.
 */
final class EnsureUserIsActive
{
    public function __construct(private readonly ImpersonationService $impersonationService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null) {
            return $next($request);
        }

        $isActive        = User::query()->whereKey($user->getAuthIdentifier())->where('is_active', true)->exists();
        $isImpersonating = $this->impersonationService->isImpersonating();
        $originalUser    = $this->impersonationService->getOriginalUser();

        if (!$isActive || ($isImpersonating && $originalUser?->is_active !== true)) {
            $actor = $isImpersonating ? $originalUser : $user;
            $route = $request->route();

            $activity = activity('security')
                ->performedOn($user)
                ->event('inactive_session_terminated')
                ->withProperties([
                    'type'    => 'authentication',
                    'scope'   => 'security',
                    'request' => [
                        'url'        => $route instanceof Route ? $route->uri() : null,
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ],
                    'impersonation' => [
                        'active'           => $isImpersonating,
                        'original_user_id' => $originalUser?->id,
                        'target_user_id'   => $isImpersonating ? $user->getAuthIdentifier() : null,
                    ],
                ]);

            if ($actor === null) {
                $activity->causedByAnonymous();
            } else {
                $activity->causedBy($actor);
            }

            $activity->log('inactive_session_terminated');

            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            Inertia::flash('error', 'Sua conta foi desativada. Entre em contato com o administrador.');
        }

        return $next($request);
    }
}
