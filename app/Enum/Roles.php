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

    /**
     * Uma linha sobre a quem atribuir o cargo — "Gerente" sozinho não diz.
     *
     * O texto descreve a matriz que o `PermissionRoleSeeder` semeia. Se você
     * mudar quem recebe o quê, mude a frase junto: uma descrição desatualizada
     * é pior que nenhuma, porque a pessoa decide por ela.
     */
    public function description(): string
    {
        return match ($this) {
            self::SUPER_USER => 'Acesso total, inclusive às ferramentas de suporte. É o único cargo que age sobre outro igual ao seu.',
            self::ADMIN      => 'Faz tudo no painel e cuida de quem entra. Não consegue usar o painel como outra pessoa.',
            self::MANAGER    => 'Cuida da equipe: cadastra pessoas e troca o cargo delas. Não mexe no que cada cargo libera.',
            self::VIEWER     => 'Entra no painel, mas nenhuma tela de gestão abre para ele. Use como base para um cargo de leitura que você montar.',
            self::VISITOR    => 'Sem nenhum acesso. É onde a pessoa cai quando você remove o cargo dela.',
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
