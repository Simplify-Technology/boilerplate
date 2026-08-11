<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Enum\Roles as RolesEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\ImpersonationService;
use App\Services\RoleFilterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

final class StoreController extends Controller
{
    public function __construct(
        private readonly RoleFilterService $roleFilterService,
        private readonly ImpersonationService $impersonationService
    ) {
    }

    public function __invoke(StoreUserRequest $request): RedirectResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();

        // Se estiver impersonando, usa o usuário original (impersonador) para validações
        $effectiveUser = $this->impersonationService->getOriginalUser() ?? $request->user();
        $effectiveUser->load('role');

        // Valida role_id se fornecido
        if (isset($data['role_id'])) {
            $requestedRole = Role::find($data['role_id']);

            if (!$requestedRole) {
                return redirect()->back()
                    ->withErrors(['role_id' => 'Cargo selecionado é inválido.'])
                    ->withInput();
            }

            // Verifica se o usuário pode atribuir este role
            $assignableRoles = $this->roleFilterService->getAssignableRoles($effectiveUser);
            $canAssignRole   = $assignableRoles->contains('id', $requestedRole->id);

            if (!$canAssignRole) {
                Log::warning('User attempted to create user with non-assignable role', [
                    'auth_user_id'        => $request->user()->id,
                    'effective_user_id'   => $effectiveUser->id,
                    'effective_user_role' => $effectiveUser->role?->name,
                    'requested_role_id'   => $requestedRole->id,
                    'requested_role_name' => $requestedRole->name,
                    'is_impersonating'    => $this->impersonationService->isImpersonating(),
                ]);

                return redirect()->back()
                    ->withErrors(['role_id' => 'Você não tem permissão para atribuir este cargo.'])
                    ->withInput();
            }

            // Proteção especial: apenas SUPER_USER pode criar SUPER_USER
            if ($requestedRole->isSuperUser() && !$effectiveUser->hasRole(\App\Enum\Roles::SUPER_USER)) {
                return redirect()->back()
                    ->withErrors(['role_id' => 'Apenas Super Usuários podem criar usuários com cargo de Super Usuário.'])
                    ->withInput();
            }
        } else {
            // Se não fornecido, atribui role VISITOR por padrão
            $visitorRole = Role::where('name', RolesEnum::VISITOR->value)->first();

            if ($visitorRole) {
                $data['role_id'] = $visitorRole->id;
            }
        }

        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        // Limpa cache de permissões
        Cache::forget(User::permissionCacheKey($user->id));

        return redirect()
            ->route('users.index')
            ->with('success', 'Usuário criado com sucesso!');
    }
}
