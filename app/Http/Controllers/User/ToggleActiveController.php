<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ToggleActiveController extends Controller
{
    public function __invoke(Request $request, User $user): RedirectResponse
    {
        $this->authorize('toggleActive', $user);

        $user->update(['is_active' => !$user->is_active]);

        $message = $user->is_active
            ? 'Usuário ativado com sucesso!'
            : 'Usuário desativado com sucesso!';

        Inertia::flash('success', $message);

        return redirect()
            ->back();
    }
}
