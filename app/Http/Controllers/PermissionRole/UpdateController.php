<?php

declare(strict_types = 1);

namespace App\Http\Controllers\PermissionRole;

use App\Enum\Permissions;
use App\Enum\Roles as RolesEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\PermissionRole\UpdateRolePermissionsRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\ImpersonationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;

final class UpdateController extends Controller
{
    public function __construct(
        private readonly ImpersonationService $impersonationService
    ) {
    }

    public function __invoke(UpdateRolePermissionsRequest $request, string $roleName): RedirectResponse
    {
        $allowedRoleNames = array_map(
            static fn(RolesEnum $role) => $role->value,
            RolesEnum::cases()
        );

        abort_unless(in_array($roleName, $allowedRoleNames, true), 404);

        $role = Role::where('name', $roleName)->firstOrFail();

        $permissionNames = $request->validated('permissions', []);

        $this->ensureActorMayEdit($request, $role, $permissionNames);

        $role->permissions()->sync(Permission::getIdsFromNames($permissionNames));

        Cache::forget("role:$role->id:permissions");
        Cache::rememberForever("role:$role->id:permissions", fn() => $role->permissions()->pluck('name')->toArray());

        $invalidatedUserCount = 0;

        User::query()
            ->where('role_id', $role->id)
            ->select('id')
            ->orderBy('id')
            ->chunkById(500, function($users) use (&$invalidatedUserCount): void {
                foreach ($users as $user) {
                    Cache::forget("user:$user->id:permissions");
                    Cache::forget("user:$user->id:roles");
                    $invalidatedUserCount++;
                }
            });

        return redirect()->back()->with('success', "Permissões de {$role->label} atualizadas com sucesso!");
    }

    /**
     * `can:manage_roles` responde "pode mexer em cargo?", nunca "pode mexer
     * NESTE cargo, com ESTAS permissões?" — e essa diferença era uma escada.
     *
     * O `PermissionRoleSeeder` tira `impersonate_users` do administrador de
     * propósito. Mas o administrador tem `manage_roles`: ele abria a tela de
     * Cargos, marcava a caixa no PRÓPRIO cargo e anulava a exclusão. Um PUT
     * direto no cargo `super_user` — que a tela nem lista para ele — deixava o
     * suporte com zero permissões, sem caminho de volta pelo painel.
     *
     * Proteger isso só pela matriz seria proteger com a chave dentro da
     * fechadura, porque é esta mesma tela que distribui `manage_roles`.
     *
     * Duas regras, as mesmas do `UserPolicy`: só se mexe em cargo de prioridade
     * ESTRITAMENTE menor, e só se concede permissão que o próprio ator tem.
     *
     * @param list<string> $permissions
     */
    private function ensureActorMayEdit(UpdateRolePermissionsRequest $request, Role $role, array $permissions): void
    {
        $actor = $this->realActor($request);

        if ($actor->hasRole(RolesEnum::SUPER_USER)) {
            /*
             * O suporte monta qualquer cargo — menos tirar de si mesmo o que o
             * traz de volta a esta tela. Um "desmarcar tudo" no próprio cargo
             * trancaria a operação fora do editor, com saída só por shell.
             */
            if ($role->isSuperUser() && !in_array(Permissions::MANAGE_ROLES->value, $permissions, true)) {
                abort(403, sprintf(
                    'Você não pode tirar "%s" do seu próprio cargo — seria perder o acesso a esta tela.',
                    Permissions::MANAGE_ROLES->label()
                ));
            }

            return;
        }

        if ($role->getPriority() >= ($actor->role?->getPriority() ?? 0)) {
            abort(403, 'Você não pode alterar as permissões deste cargo.');
        }

        // `getAllPermissions()` soma cargo + permissões individuais: é a
        // superfície real do ator, e é ela que ele pode repassar.
        $concedeAlemDoProprio = array_diff($permissions, $actor->getAllPermissions()->pluck('name')->all());

        if ($concedeAlemDoProprio !== []) {
            abort(403, 'Você não pode conceder um acesso que você mesmo não tem.');
        }
    }

    /**
     * Quem manda é o humano por trás da sessão, não a persona impersonada —
     * mesma leitura do `UserPolicy::effectiveActor()`. Sem isto, vestir um cargo
     * mais alto viraria o caminho para editar cargos.
     */
    private function realActor(UpdateRolePermissionsRequest $request): User
    {
        $actor = $this->impersonationService->getOriginalUser() ?? $request->user();

        if ($actor === null) {
            abort(401, 'Usuário não autenticado');
        }

        if (!$actor->relationLoaded('role')) {
            $actor->load('role');
        }

        return $actor;
    }
}
