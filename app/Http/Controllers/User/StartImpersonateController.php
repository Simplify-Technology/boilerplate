<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ImpersonationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

final class StartImpersonateController extends Controller
{
    public function __construct(
        private readonly ImpersonationService $impersonationService
    ) {
    }

    public function __invoke(Request $request, User $targetUser): RedirectResponse
    {
        $user = $request->user();

        // Prevent starting new impersonation if already impersonating
        if ($this->impersonationService->isImpersonating()) {
            abort(403, 'Você já está usando o painel como outra pessoa. Volte para a sua conta antes de trocar de novo.');
        }

        // Manual user lookup since model binding is not working in tests
        $targetUser = User::findOrFail($request->route('user'));

        Gate::authorize('impersonate', $targetUser);

        $this->impersonationService->start(
            impersonator: $user,
            targetUser: $targetUser
        );

        Inertia::flash('success', "Você está usando o painel como {$targetUser->name}");

        return redirect()
            ->route('dashboard');
    }
}
