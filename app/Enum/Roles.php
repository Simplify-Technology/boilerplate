<?php

declare(strict_types = 1);

namespace App\Enum;

enum Roles: string
{
    // ===== NÍVEL ADMINISTRATIVO =====
    case SUPER_USER = 'super_user';
    case ADMIN      = 'admin';

    // ===== NÍVEL GERENCIAL =====
    case MANAGER = 'manager';

    // ===== NÍVEL CONSULTIVO =====
    case VIEWER  = 'viewer';
    case VISITOR = 'visitor';

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn($case) => ['value' => $case->value, 'label' => $case->label()],
            self::cases()
        );
    }

    public function label(): string
    {
        return match ($this) {
            self::SUPER_USER => 'Super Usuário',
            self::ADMIN      => 'Administrador',
            self::MANAGER    => 'Gerente',
            self::VIEWER     => 'Visualizador',
            self::VISITOR    => 'Visitante',
        };
    }

    public function priority(): int
    {
        return match ($this) {
            self::SUPER_USER => 100,
            self::ADMIN      => 90,
            self::MANAGER    => 70,
            self::VIEWER     => 10,
            self::VISITOR    => 5,
        };
    }
}
