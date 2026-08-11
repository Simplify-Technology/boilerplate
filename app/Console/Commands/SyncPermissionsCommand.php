<?php

declare(strict_types = 1);

namespace App\Console\Commands;

use App\Enum\Permissions;
use App\Enum\Roles;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Alinha as tabelas roles/permissions aos enums e apaga o que sobrou de
 * versões anteriores. Idempotente — pensado para rodar em todo deploy.
 *
 * Ordem: primeiro o `PermissionRoleSeeder` cria/atualiza o que os enums
 * declaram (garante que o papel de fallback existe), depois usuários em
 * papéis órfãos são remanejados para `visitor` (mesmo fallback do
 * `revokeRole()`), os vínculos `permission_role` mortos caem, e por fim os
 * papéis/permissões fora do enum são apagados. Os caches de permissões do
 * trait `HasRolesAndPermissions` (`user:{id}:permissions`) são invalidados
 * em chunk para todos os usuários.
 *
 * `--dry-run` mostra o plano (faltantes e órfãs) sem escrever nada.
 */
final class SyncPermissionsCommand extends Command
{
    use ConfirmableTrait;

    /**
     * Destino de quem está num papel que deixou de existir — o mesmo
     * fallback que `HasRolesAndPermissions::revokeRole()` usa.
     */
    private const ORPHAN_FALLBACK = Roles::VISITOR;

    protected $signature = 'permissions:sync
        {--dry-run : Mostra o que mudaria e não escreve nada}
        {--force : Não pedir confirmação em produção}';

    protected $description = 'Sincroniza permissões e cargos dos enums com o banco, remove órfãos e invalida os caches de permissões';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        if (!$dryRun && !$this->confirmToProceed()) {
            return self::FAILURE;
        }

        $keptRoles       = array_column(Roles::cases(), 'value');
        $keptPermissions = array_column(Permissions::cases(), 'value');

        $deadRoles       = Role::query()->whereNotIn('name', $keptRoles)->get();
        $deadPermissions = Permission::query()->whereNotIn('name', $keptPermissions)->get();

        $orphanUsers = User::query()
            ->whereIn('role_id', $deadRoles->pluck('id'))
            ->get(['id', 'email', 'role_id']);

        $missingRoles       = array_values(array_diff($keptRoles, Role::query()->pluck('name')->all()));
        $missingPermissions = array_values(array_diff($keptPermissions, Permission::query()->pluck('name')->all()));

        $this->report($deadRoles, $deadPermissions, $orphanUsers, $missingRoles, $missingPermissions);

        if ($dryRun) {
            $this->newLine();
            $this->comment('Nada foi gravado (--dry-run). Rode sem a opção para aplicar.');

            return self::SUCCESS;
        }

        // Primeiro o seeder: cria o que falta e ressincroniza a matriz —
        // garante que o papel de fallback existe antes de remanejar alguém.
        $this->call('db:seed', ['--class' => PermissionRoleSeeder::class, '--force' => true]);

        DB::transaction(function() use ($deadRoles, $deadPermissions, $orphanUsers): void {
            if ($orphanUsers->isNotEmpty()) {
                $fallback = Role::query()->where('name', self::ORPHAN_FALLBACK->value)->firstOrFail();

                User::query()
                    ->whereIn('id', $orphanUsers->pluck('id'))
                    ->update(['role_id' => $fallback->id]);
            }

            // Os vínculos primeiro, nos dois sentidos: `permission_role` tem FK
            // para as duas pontas, e a linha morta pode estar pendurada num
            // papel vivo (permission morta) ou o contrário.
            if ($deadRoles->isNotEmpty()) {
                DB::table('permission_role')->whereIn('role_id', $deadRoles->pluck('id'))->delete();
                Role::query()->whereIn('id', $deadRoles->pluck('id'))->delete();
            }

            if ($deadPermissions->isNotEmpty()) {
                DB::table('permission_role')->whereIn('permission_id', $deadPermissions->pluck('id'))->delete();
                // `permission_user` (permissões avulsas) cai por `onDelete('cascade')`.
                Permission::query()->whereIn('id', $deadPermissions->pluck('id'))->delete();
            }
        });

        // A matriz mudou para qualquer papel: invalida o cache do trait
        // HasRolesAndPermissions para todos os usuários, em chunk.
        $invalidatedUserCount = 0;

        User::query()
            ->select('id')
            ->orderBy('id')
            ->chunkById(500, function(Collection $users) use (&$invalidatedUserCount): void {
                foreach ($users as $user) {
                    Cache::forget(User::permissionCacheKey($user->id));
                    $invalidatedUserCount++;
                }
            });

        $this->newLine();
        $this->info(sprintf(
            'Pronto: %d cargos, %d permissões, %d usuário(s) remanejado(s), caches de %d usuário(s) invalidados.',
            Role::query()->count(),
            Permission::query()->count(),
            $orphanUsers->count(),
            $invalidatedUserCount,
        ));

        return self::SUCCESS;
    }

    /**
     * @param Collection<int, Role>       $deadRoles
     * @param Collection<int, Permission> $deadPermissions
     * @param Collection<int, User>       $orphanUsers
     * @param list<string>                $missingRoles
     * @param list<string>                $missingPermissions
     */
    private function report(
        Collection $deadRoles,
        Collection $deadPermissions,
        Collection $orphanUsers,
        array $missingRoles,
        array $missingPermissions,
    ): void {
        if ($missingRoles !== []) {
            $this->info(sprintf('Cargos do enum ausentes no banco (%d): %s', count($missingRoles), implode(', ', $missingRoles)));
        }

        if ($missingPermissions !== []) {
            $this->info(sprintf('Permissões do enum ausentes no banco (%d): %s', count($missingPermissions), implode(', ', $missingPermissions)));
        }

        if ($deadRoles->isEmpty() && $deadPermissions->isEmpty()) {
            $this->info('Nenhum cargo ou permissão órfã a remover.');

            return;
        }

        if ($deadRoles->isNotEmpty()) {
            $this->warn(sprintf('Cargos órfãos a remover (%d):', $deadRoles->count()));
            $this->line('  ' . $deadRoles->pluck('name')->implode(', '));
        }

        if ($deadPermissions->isNotEmpty()) {
            $this->warn(sprintf('Permissões órfãs a remover (%d):', $deadPermissions->count()));
            $this->line('  ' . $deadPermissions->pluck('name')->implode(', '));
        }

        if ($orphanUsers->isNotEmpty()) {
            $this->warn(sprintf(
                'Usuários que vão para `%s` (%d):',
                self::ORPHAN_FALLBACK->value,
                $orphanUsers->count(),
            ));

            $orphanUsers->each(fn(User $user) => $this->line("  {$user->email}"));
        }
    }
}
