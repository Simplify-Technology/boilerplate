<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        Password::sendResetLink(
            $request->only('email')
        );

        // Sem chave em lang/pt_BR.json, o `__()` devolvia a própria string em
        // inglês na tela de recuperação de senha. O painel não tem i18n — o
        // texto em pt-BR fica aqui, como no resto da aplicação.
        return back()->with('status', 'Se existir uma conta com esse e-mail, o link de redefinição será enviado.');
    }
}
