<?php

declare(strict_types = 1);

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Pivot de `permission_user`: carrega o `meta` (JSON) da permissão direta do usuário.
 *
 * @property string|null $meta
 */
class PermissionUser extends Pivot
{
}
