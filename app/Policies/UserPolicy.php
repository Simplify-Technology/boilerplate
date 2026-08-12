<?php

declare(strict_types = 1);

namespace App\Policies;

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\User;
use App\Services\ImpersonationService;
use Illuminate\Auth\Access\Response;

/**
 * `manage_users` sozinho não basta. Sem checagem de prioridade, quem tivesse a
 * permissão trocava a **senha e o e-mail** de qualquer outro portador dela —
 * inclusive de quem estivesse acima — e assumia a conta. Na matriz do
 * `PermissionRoleSeeder`, `manage_users` vai para `super_user` (100), `admin`
 * (90) e `manager` (70): o gerente excluía o administrador, e dois
 * administradores eram pares agindo um sobre o outro.
 *
 * Daqui em diante, ação sobre alguém de prioridade **igual ou maior** é negada.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage_users');
    }

    public function view(User $user, User $model): bool
    {
        return $user->hasPermissionTo('manage_users');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage_users');
    }

    public function update(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('manage_users')) {
            return false;
        }

        // Impede que o usuário altere seu próprio status ativo/inativo
        // Isso deve ser feito através do perfil ou por outro administrador
        if ($this->isSelf($user, $model) && request()->has('is_active')) {
            return false;
        }

        return $this->outranks($user, $model);
    }

    public function delete(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('manage_users')) {
            return false;
        }

        // Impede auto-exclusão
        if ($this->isSelf($user, $model)) {
            return false;
        }

        return $this->outranks($user, $model);
    }

    public function toggleActive(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('manage_users')) {
            return false;
        }

        // Impede que o usuário desative a si mesmo
        if ($this->isSelf($user, $model)) {
            return false;
        }

        return $this->outranks($user, $model);
    }

    public function impersonate(User $user, User $model): bool
    {
        return $user->canImpersonate($model);
    }

    /**
     * **Leitura** da matriz de permissões de alguém (`users.permissions.show`).
     * Sem teto de propósito: quem administra usuários precisa enxergar o que
     * cada conta pode fazer, inclusive contas acima da sua. Para mutar, veja
     * `mutatePermissions()`.
     */
    public function managePermissions(User $user): bool
    {
        return $user->hasPermissionTo('manage_permissions');
    }

    /**
     * **Mutação** das permissões individuais de outro usuário (grant/revoke/sync).
     *
     * O `managePermissions()` acima ignora o alvo — a assinatura tem um único
     * parâmetro e o PHP descarta o argumento extra que os call sites passam —,
     * então qualquer portador de `manage_permissions` atingia qualquer conta,
     * inclusive a própria: um administrador auto-concedia `impersonate_users`,
     * exatamente a permissão que o seeder lhe nega. Aqui o alvo precisa ter
     * prioridade estritamente menor que a do ator real, o que também barra o
     * auto-alvo.
     *
     * O terceiro teto é sobre o CONTEÚDO, e faltava: alcançar o alvo não diz
     * nada sobre o que se pode dar a ele. Sem `$granting`, o administrador
     * gravava num gerente a `impersonate_users` que o seeder lhe nega — pela
     * tela de Cargos a mesma tentativa já era 403.
     *
     * @param list<string> $granting Permissões que a chamada quer que o alvo
     *                               passe a ter. Vazio em revogação, que não
     *                               concede nada.
     */
    public function mutatePermissions(User $user, User $model, array $granting = []): bool|Response
    {
        if (!$user->hasPermissionTo('manage_permissions')) {
            return false;
        }

        if (!$this->outranks($user, $model)) {
            return false;
        }

        return $this->grantsWithinOwnSurface($user, $granting);
    }

    /**
     * Mesma régua do `PermissionRole/UpdateController`, pela mesma função:
     * quem monta o conjunto só distribui o que já é seu. `super_user` compõe
     * qualquer coisa, e a superfície é a do humano por trás da sessão — senão
     * vestir uma persona alta viraria caminho para conceder o que a matriz nega.
     *
     * O payload INTEIRO é medido, não só o que o alvo ainda não tem. Um teto
     * por delta deixaria o mesmo formulário reafirmar o que o ator não pode
     * dar, e voltaríamos a ter duas respostas para a mesma pergunta.
     *
     * @param list<string> $granting
     */
    private function grantsWithinOwnSurface(User $user, array $granting): bool|Response
    {
        $actor = $this->effectiveActor($user);

        if ($actor->hasRole(Roles::SUPER_USER)) {
            return true;
        }

        $beyond = $actor->permissionsBeyondOwn($granting);

        return $beyond === []
            ? true
            : Response::deny(Permissions::grantDenialMessage($beyond));
    }

    /**
     * Ver os dados sensíveis de outra conta: CPF/CNPJ, telefones e notas
     * internas.
     *
     * O teto de autoridade desta classe começava em `update()`: `viewAny()` e
     * `view()` eram `manage_users` puro, sem comparar prioridade. Só que o
     * `UserResource` devolvia PII sem condicional nenhuma, e `manage_users`
     * vai para `manager` (70) na matriz do seeder — então o gerente abria
     * `/users` e lia o CPF, os telefones e as notas internas do administrador
     * (90) em claro. Mutação estava travada; **leitura** ficou de fora.
     *
     * Mesma régua da mutação, para não haver duas respostas para a mesma
     * pergunta: a si mesmo sempre, `super_user` sempre, e no resto prioridade
     * estritamente maior — medida no ator REAL, não na persona impersonada.
     */
    public function viewSensitive(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('manage_users')) {
            return false;
        }

        if ($this->effectiveActor($user)->id === $model->id) {
            return true;
        }

        return $this->outranks($user, $model);
    }

    /**
     * Atribuir/remover o CARGO de outro usuário (rotas `user.assign-role` e
     * `user.revoke-role`). Essas rotas checavam o cargo NOVO contra o ator e
     * nunca o cargo ATUAL do alvo: um gerente (70) rebaixava o administrador
     * (90) para `viewer`, ou o jogava em `visitor` pelo revoke — travando a
     * organização fora do painel, sem caminho de volta pela interface.
     */
    public function assignRole(User $user, User $model): bool
    {
        if (!$user->hasPermissionTo('assign_roles')) {
            return false;
        }

        if ($this->isSelf($user, $model)) {
            return false;
        }

        return $this->outranks($user, $model);
    }

    /**
     * Teto de autoridade: o alvo precisa ter prioridade ESTRITAMENTE menor.
     * `super_user` segue como estava — edita, desativa e exclui qualquer um,
     * inclusive outro `super_user`.
     */
    private function outranks(User $user, User $model): bool
    {
        $actor = $this->effectiveActor($user);

        if ($actor->hasRole(Roles::SUPER_USER)) {
            return true;
        }

        return $this->priority($actor) > $this->priority($model);
    }

    /**
     * **Quem manda é o usuário real, não a persona impersonada.**
     *
     * A permissão continua sendo lida na persona (impersonar precisa reproduzir
     * o que aquele usuário consegue fazer), mas o teto de autoridade é do humano
     * por trás da sessão — senão impersonar vira escada: `canImpersonateAny()`
     * (meta da permissão `impersonate_users`) ignora a prioridade, então um
     * gerente que a tivesse poderia vestir o administrador e, de dentro dele,
     * editar outros administradores. Mesma leitura que o `RoleFilterService` e o
     * `AssignRoleController` já fazem.
     */
    private function effectiveActor(User $user): User
    {
        return app(ImpersonationService::class)->getOriginalUser() ?? $user;
    }

    /**
     * Sem cargo = prioridade 0: não supera ninguém, nem outro sem cargo.
     */
    private function priority(User $user): int
    {
        return $user->role?->getPriority() ?? 0;
    }

    /**
     * Vale para a persona E para o usuário real: um administrador impersonando
     * um gerente não pode excluir nem desativar a própria conta de administrador.
     */
    private function isSelf(User $user, User $model): bool
    {
        return $model->id === $user->id || $model->id === $this->effectiveActor($user)->id;
    }
}
