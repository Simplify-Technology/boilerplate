<?php

declare(strict_types = 1);

namespace App\DataTransferObjects;

use App\Models\Permission;

readonly class PermissionMetaDTO
{
    /**
     * @param array<string, mixed>|null $meta
     */
    public function __construct(
        public string $name,
        public string $label,
        public ?array $meta = null,
    ) {
    }

    public static function fromPermission(Permission $permission): self
    {
        return new self(
            name: $permission->name,
            label: $permission->label,
            meta: $permission->pivot?->meta ? json_decode($permission->pivot->meta, true) : null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name'  => $this->name,
            'label' => $this->label,
            'meta'  => $this->meta,
        ];
    }
}
