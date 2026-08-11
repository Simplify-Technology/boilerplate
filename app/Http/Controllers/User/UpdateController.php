<?php

declare(strict_types = 1);

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\ImpersonationService;
use App\Services\RoleFilterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

final class UpdateController extends Controller
{
    public function __construct(
        private readonly RoleFilterService $roleFilterService,
        private readonly ImpersonationService $impersonationService
    ) {
    }

    public function __invoke(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $data = $request->validated();

        // Select de cargo vazio significa "não mexer no cargo", não "apagar o
        // cargo". O ConvertEmptyStringsToNull transforma `role_id=''` em null, a
        // regra é `nullable`, e o bloco de validação de cargo abaixo é guardado
        // por isset() — que é false para null. O resultado era o pior dos dois
        // mundos: o null passava para o update e apagava o cargo, mas o flush de
        // `user:{id}:permissions` (que mora dentro daquele bloco) era pulado.
        // Como o cache é rememberForever, a pessoa perdia o cargo no banco e
        // ficava com as permissões dele para sempre. Para remover cargo existe a
        // rota `user.revoke-role`.
        if (array_key_exists('role_id', $data) && $data['role_id'] === null) {
            unset($data['role_id']);
        }

        // Se estiver impersonando, usa o usuário original (impersonador) para validações
        $effectiveUser = $this->impersonationService->getOriginalUser() ?? $request->user();
        $effectiveUser->load('role');

        // Captura role_id original antes do update
        $originalRoleId = $user->role_id;
        $roleChanged    = false;

        // Valida role_id se fornecido e diferente do atual
        if (isset($data['role_id']) && $data['role_id'] != $originalRoleId) {
            $roleChanged   = true;
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
                Log::warning('User attempted to update user with non-assignable role', [
                    'auth_user_id'        => $request->user()->id,
                    'effective_user_id'   => $effectiveUser->id,
                    'effective_user_role' => $effectiveUser->role?->name,
                    'target_user_id'      => $user->id,
                    'target_user_role'    => $user->role?->name,
                    'requested_role_id'   => $requestedRole->id,
                    'requested_role_name' => $requestedRole->name,
                    'is_impersonating'    => $this->impersonationService->isImpersonating(),
                ]);

                return redirect()->back()
                    ->withErrors(['role_id' => 'Você não tem permissão para atribuir este cargo.'])
                    ->withInput();
            }

            // Proteção especial: apenas SUPER_USER pode atribuir SUPER_USER
            if ($requestedRole->isSuperUser() && !$effectiveUser->hasRole(\App\Enum\Roles::SUPER_USER)) {
                return redirect()->back()
                    ->withErrors(['role_id' => 'Apenas Super Usuários podem atribuir o cargo de Super Usuário.'])
                    ->withInput();
            }

            // Impede que usuário altere seu próprio cargo
            if ($effectiveUser->id === $user->id) {
                return redirect()->back()
                    ->withErrors(['role_id' => 'Você não pode alterar o seu próprio cargo.'])
                    ->withInput();
            }
        }

        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        // Limpa cache de permissões se role foi alterado
        if ($roleChanged) {
            \Illuminate\Support\Facades\Cache::forget("user:$user->id:permissions");
            \Illuminate\Support\Facades\Cache::forget("user:$user->id:roles");
        }

        // Recarrega o usuário para obter o role atualizado
        $user->refresh();
        $user->load('role');

        return redirect()
            ->route('users.show', $user)
            ->with('success', 'Usuário atualizado com sucesso!');
    }
}
