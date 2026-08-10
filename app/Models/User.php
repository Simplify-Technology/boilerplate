<?php

declare(strict_types = 1);

namespace App\Models;

use App\Traits\Models\HasRolesAndPermissions;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

/**
 * @property \Carbon\CarbonImmutable|null $email_verified_at
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;

    use Notifiable;
    use HasRolesAndPermissions;
    use LogsActivity;

    // Removido $with para evitar eager loading automático que pode causar problemas
    // Use explicitamente ->with(['role', 'permissions']) quando necessário

    protected $fillable = [
        'is_active',
        'role_id',
        'name',
        'email',
        'cpf_cnpj',
        'phone',
        'mobile',
        'user_notes',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('users')
            ->logOnly([
                'is_active',
                'role_id',
                'name',
                'email',
                'cpf_cnpj',
                'phone',
                'mobile',
                'user_notes',
            ])
            ->logOnlyDirty()
            ->dontLogIfAttributesChangedOnly(['updated_at'])
            ->dontLogEmptyChanges()
            ->setDescriptionForEvent(static fn(string $eventName): string => "user_{$eventName}");
    }
}
