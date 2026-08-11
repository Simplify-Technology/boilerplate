<?php

declare(strict_types = 1);

namespace App\Http\Controllers\PermissionRole;

use App\Enum\Roles as RolesEnum;
use App\Events\RoleUserUpdatedEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\PermissionRole\AssignRoleRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\ImpersonationService;
use App\Services\RoleFilterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

final class AssignRoleController extends Controller
{
    public function __construct(
        private readonly RoleFilterService $roleFilterService,
        private readonly ImpersonationService $impersonationService
    ) {
    }

    public function __invoke(AssignRoleRequest $request, User $user): RedirectResponse
    {
        $authUser = $request->user();

        if (!$authUser) {
            abort(401, 'Usuário não autenticado');
        }

        // Se estiver impersonando, usa o usuário original (impersonador) para validações
        $effectiveUser = $this->impersonationService->getOriginalUser() ?? $authUser;
        $effectiveUser->load('role');
        $authUser->load('role');

        $newRole = Role::where('name', $request->validated('role'))->firstOrFail();

        // Verifica permissão básica usando o usuário efetivo (original se impersonando)
        if (!$effectiveUser->hasPermissionTo('assign_roles')) {
            return redirect()->back()->withErrors(['error' => 'Você não tem permissão para atribuir cargos!']);
        }

        // Proteção especial: apenas SUPER_USER pode atribuir role SUPER_USER (verifica usuário efetivo)
        if ($newRole->isSuperUser() && !$effectiveUser->hasRole(RolesEnum::SUPER_USER)) {
            return redirect()->back()->withErrors([
                'error' => 'Apenas Super Usuários podem atribuir o cargo de Super Usuário!',
            ]);
        }

        // Impede que usuário altere seu próprio cargo (verifica o usuário efetivo, não o impersonado)
        if ($effectiveUser->id === $user->id) {
            return redirect()->back()->withErrors(['error' => 'Você não pode alterar o seu próprio cargo!']);
        }

        // Teto sobre o cargo ATUAL do alvo. As validações abaixo só olham o cargo
        // NOVO, então sem esta guarda um gerente (70) rebaixava um administrador
        // (90) para `viewer` — cargo que ele pode atribuir, sobre alguém em quem
        // não deveria tocar. Mesma regra do UserPolicy, com o ator real por trás
        // da impersonação.
        if (Gate::denies('assignRole', $user)) {
            Log::warning('User attempted to change the role of a user at or above their own priority', [
                'auth_user_id'      => $authUser->id,
                'effective_user_id' => $effectiveUser->id,
                'target_user_id'    => $user->id,
                'target_user_role'  => $user->role?->name,
                'is_impersonating'  => $this->impersonationService->isImpersonating(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'Você não pode alterar o cargo deste usuário!',
            ]);
        }

        // Validação de prioridade: só pode atribuir roles com prioridade menor (usa usuário efetivo)
        // EXCETO: SUPER_USER pode atribuir qualquer role, incluindo SUPER_USER
        $authUserPriority = $effectiveUser->role?->getPriority() ?? 0;
        $newRolePriority  = $newRole->getPriority();
        $isSuperUser      = $effectiveUser->hasRole(RolesEnum::SUPER_USER);

        // SUPER_USER pode atribuir qualquer role (bypass da validação de prioridade)
        if (!$isSuperUser && $newRolePriority >= $authUserPriority) {
            Log::warning('User attempted to assign role with equal or higher priority', [
                'auth_user_id'       => $authUser->id,
                'effective_user_id'  => $effectiveUser->id,
                'auth_user_priority' => $authUserPriority,
                'new_role_priority'  => $newRolePriority,
                'new_role'           => $newRole->name,
                'is_impersonating'   => $this->impersonationService->isImpersonating(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'Você só pode atribuir cargos com prioridade menor que o seu!',
            ]);
        }

        // Verifica se a role está na lista de roles atribuíveis (usa usuário efetivo)
        $assignableRoles = $this->roleFilterService->getAssignableRoles($effectiveUser);
        $canAssignRole   = $assignableRoles->contains('name', $newRole->name);

        if (!$canAssignRole) {
            Log::warning('User attempted to assign non-assignable role', [
                'auth_user_id'        => $authUser->id,
                'effective_user_id'   => $effectiveUser->id,
                'auth_user_role'      => $authUser->role?->name,
                'effective_user_role' => $effectiveUser->role?->name,
                'new_role'            => $newRole->name,
                'is_impersonating'    => $this->impersonationService->isImpersonating(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'Você não tem permissão para atribuir este cargo!',
            ]);
        }

        // Atualiza o role do usuário
        $user->update(['role_id' => $newRole->id]);

        // Limpa cache
        Cache::forget("user:$user->id:roles");
        Cache::forget("user:$user->id:permissions");

        // Dispara evento
        Broadcast::event(new RoleUserUpdatedEvent($user));

        return redirect()->back()->with('success', 'Cargo atualizado com sucesso!');
    }
}
