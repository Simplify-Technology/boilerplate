<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property-read PermissionUser|null $pivot Presente quando carregado via relação `User::permissions()`.
 */
class Permission extends Model
{
    protected $fillable = ['name', 'label'];

    /**
     * @param array<int, string> $permissionNames
     * @return array<int, int>
     */
    public static function getIdsFromNames(array $permissionNames): array
    {
        return self::whereIn('name', $permissionNames)->pluck('id')->toArray();
    }

    /**
     * @return BelongsToMany<Role, $this>
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);
    }
}
