<?php

namespace App\Http\Middleware;

use App\Services\ImpersonationService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * Campos do usuário autenticado publicados em toda página. Mexer aqui exige
     * atualizar o tipo `AuthUser` em resources/js/types no mesmo commit.
     *
     * @var list<string>
     */
    private const SHARED_USER_FIELDS = ['id', 'name', 'email', 'email_verified_at'];

    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $impersonationService = app(ImpersonationService::class);

        $isImpersonating = $impersonationService->isImpersonating();

        $user        = $request->user();
        $permissions = [];
        $roles       = [];

        if ($user) {
            $permissions = $user->getAllPermissions()->pluck('name')->toArray();
            $roles       = $user->role ? [$user->role->name] : [];
        }

        return [
            ...parent::share($request),
            'name'  => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth'  => [
                // Só o que o front realmente lê. `$hidden` do model esconde
                // apenas password e remember_token, então compartilhar o model
                // inteiro mandava cpf_cnpj, phone, mobile e user_notes em TODA
                // navegação do painel, para qualquer tela. O espelho deste shape
                // é o tipo `AuthUser` em resources/js/types.
                'user'          => $user ? Arr::only($user->toArray(), self::SHARED_USER_FIELDS) : null,
                'permissions'   => $permissions,
                'roles'         => $roles,
                'impersonating' => [
                    'active'           => $isImpersonating,
                    'originalUserName' => $impersonationService->getOriginalUserName(),
                    // Nome do usuário que está sendo impersonado (usuário atual durante a impersonação)
                    'impersonatedUserName' => $isImpersonating && $user
                        ? $user->name
                        : null,
                ],
            ],
            'flash' => [
                'success' => $request->session()->pull('success'),
                'error'   => $request->session()->pull('error'),
                'warning' => $request->session()->pull('warning'),
                'info'    => $request->session()->pull('info'),
            ],
            'ziggy' => fn(): array => [
                ...(new Ziggy())->toArray(),
                'location' => $request->url(),
            ]
        ];
    }
}
