<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Services\ImpersonationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

final class StopImpersonateController extends Controller
{
    public function __construct(
        private readonly ImpersonationService $impersonationService
    ) {
    }

    public function __invoke(Request $request): RedirectResponse
    {
        if (!$this->impersonationService->isImpersonating()) {
            abort(403, 'Você não está usando o painel como outra pessoa.');
        }

        $originalUser = $this->impersonationService->stop();

        Inertia::flash('success', "Você voltou para sua conta original: {$originalUser->name}");

        return redirect()
            ->route('users.index');
    }
}
