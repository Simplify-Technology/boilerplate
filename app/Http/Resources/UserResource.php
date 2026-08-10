<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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

        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'cpf_cnpj'   => $this->cpf_cnpj,
            'phone'      => $this->phone,
            'mobile'     => $this->mobile,
            'is_active'  => $this->is_active,
            'user_notes' => $this->user_notes,
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
