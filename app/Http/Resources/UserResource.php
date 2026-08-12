<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\Br\CpfFormatter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Gate;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    public bool $preserveKeys = true;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $currentUser = $request->user();

        /*
         * O teto de PII. `manage_users` é o que abre este resource, e ele vai
         * para `manager` (70) na matriz do seeder — sem esta linha, o gerente
         * lia CPF, telefones e notas internas do administrador (90) em claro.
         * A régua é a mesma da mutação e mora na policy, não aqui: um só lugar
         * responde "quem manda em quem", e ele já resolve o ator real por trás
         * de uma impersonation.
         */
        $veSensiveis = $currentUser !== null && Gate::forUser($currentUser)->allows('viewSensitive', $this->resource);

        return [
            'id'    => $this->id,
            'name'  => $this->name,
            'email' => $this->email,
            // Mascarado, não omitido: a tela de listagem usa o CPF para o
            // operador reconhecer a linha, e os dois últimos dígitos bastam
            // para isso sem entregar o documento.
            'cpf_cnpj'   => $veSensiveis ? $this->cpf_cnpj : CpfFormatter::mask($this->cpf_cnpj),
            'phone'      => $veSensiveis ? $this->phone : null,
            'mobile'     => $veSensiveis ? $this->mobile : null,
            'is_active'  => $this->is_active,
            'user_notes' => $veSensiveis ? $this->user_notes : null,
            'role'       => $this->whenLoaded('role', function() {
                if ($this->role === null) {
                    return null;
                }

                $permissions = [];

                if ($this->role->relationLoaded('permissions')) {
                    $permissions = $this->role->permissions->map(fn($perm) => [
                        'name'  => $perm->name,
                        'label' => $perm->label,
                    ])->toArray();
                }

                return [
                    'id'          => $this->role->id,
                    'name'        => $this->role->name,
                    'label'       => $this->role->label,
                    'permissions' => $permissions,
                ];
            }),
            'permissions' => $this->whenLoaded('permissions', fn() => $this->permissions->map(fn($perm) => [
                'name'  => $perm->name,
                'label' => $perm->label,
            ])),
            'custom_permissions_count' => $this->getCustomPermissionsCount(),
            'custom_permissions_list'  => $this->getCustomPermissionsList(),
            'can_impersonate'          => $currentUser ? $currentUser->canImpersonate($this->resource) : false,
            'created_at'               => $this->created_at?->toISOString(),
            'updated_at'               => $this->updated_at?->toISOString(),
        ];
    }
}
