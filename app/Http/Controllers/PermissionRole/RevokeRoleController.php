<?php

declare(strict_types = 1);

namespace App\Http\Controllers\PermissionRole;

use App\Enum\Roles as RolesEnum;
use App\Events\RoleUserUpdatedEvent;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\ImpersonationService;
use App\Services\RoleFilterService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

final class RevokeRoleController extends Controller
{
    public function __construct(
        private readonly RoleFilterService $roleFilterService,
        private readonly ImpersonationService $impersonationService
    ) {
    }

    public function __invoke(Request $request, User $user): RedirectResponse
    {
        $authUser = $request->user();

        if (!$authUser) {
            abort(401, 'Usuário não autenticado');
        }

        // Se estiver impersonando, usa o usuário original (impersonador) para validações
        $effectiveUser = $this->impersonationService->getOriginalUser() ?? $authUser;
        $effectiveUser->load('role');

        // Verifica permissão básica usando o usuário efetivo
        if (!$effectiveUser->hasPermissionTo('assign_roles')) {
            return redirect()->back()->withErrors(['error' => 'Você não tem permissão para remover cargos!']);
        }

        // Impede que usuário remova cargo de si mesmo (verifica o usuário efetivo)
        if ($effectiveUser->id === $user->id) {
            return redirect()->back()->withErrors(['error' => 'Você não pode remover o seu próprio cargo!']);
        }

        // Teto sobre o cargo ATUAL do alvo. A checagem abaixo pergunta apenas se
        // o ator poderia atribuir `visitor` — e todo mundo com `assign_roles`
        // pode, porque `visitor` é o piso. Sem esta guarda, um gerente (70)
        // jogava o administrador (90) em `visitor` e o trancava fora do painel.
        if (Gate::denies('assignRole', $user)) {
            Log::warning('User attempted to revoke the role of a user at or above their own priority', [
                'auth_user_id'      => $authUser->id,
                'effective_user_id' => $effectiveUser->id,
                'target_user_id'    => $user->id,
                'target_user_role'  => $user->role?->name,
                'is_impersonating'  => $this->impersonationService->isImpersonating(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'Você não pode remover o cargo deste usuário!',
            ]);
        }

        // Verifica se pode atribuir o role VISITOR (mesma validação de prioridade)
        $visitorRole      = Role::where('name', RolesEnum::VISITOR->value)->firstOrFail();
        $assignableRoles  = $this->roleFilterService->getAssignableRoles($effectiveUser);
        $canAssignVisitor = $assignableRoles->contains('name', $visitorRole->name);

        if (!$canAssignVisitor) {
            Log::warning('User attempted to revoke role without permission', [
                'auth_user_id'        => $authUser->id,
                'effective_user_id'   => $effectiveUser->id,
                'effective_user_role' => $effectiveUser->role?->name,
                'target_user_id'      => $user->id,
                'target_user_role'    => $user->role?->name,
                'is_impersonating'    => $this->impersonationService->isImpersonating(),
            ]);

            return redirect()->back()->withErrors([
                'error' => 'Você não tem permissão para remover este cargo!',
            ]);
        }

        // Atualiza o role para VISITOR
        $user->update(['role_id' => $visitorRole->id]);

        // Limpa cache
        Cache::forget("user:$user->id:roles");
        Cache::forget("user:$user->id:permissions");

        // Dispara evento
        Broadcast::event(new RoleUserUpdatedEvent($user));

        return redirect()->back()->with(['success' => 'Cargo removido com sucesso!', 'role' => $user->role?->name]);
    }
}
