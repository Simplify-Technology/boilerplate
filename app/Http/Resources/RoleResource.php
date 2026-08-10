<?php

declare(strict_types = 1);

namespace App\Http\Resources;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;

/**
 * @mixin Role
 */
class RoleResource extends JsonResource
{
    public bool $preserveKeys = true;

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'label'       => $this->label,
            'permissions' => $this->whenLoaded('permissions', fn() => $this->permissions->map(fn($perm) => [
                'name'  => $perm->name,
                'label' => $perm->label,
            ])),
            'users'      => $this->whenLoaded('users'),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Transform a collection of roles to a numeric array for frontend use.
     * This ensures compatibility with React components that expect arrays.
     *
     * @param Collection<int, Role> $roles Collection of Role models
     * @return array<int, array<string, mixed>>
     */
    public static function toArrayCollection(Collection $roles, Request $request): array
    {
        // resolve() (e não toArray()) roda o pipeline de filtragem do
        // JsonResource: whenLoaded() sem relation carregada OMITE a chave,
        // em vez de vazar MissingValue serializado como {}.
        return $roles->values()
            ->map(fn(Role $role): array => (new self($role))->resolve($request))
            ->all();
    }
}
