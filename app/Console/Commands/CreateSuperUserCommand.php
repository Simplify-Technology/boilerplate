<?php

declare(strict_types = 1);

namespace App\Console\Commands;

use App\Enum\Roles;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;

use function Laravel\Prompts\password;
use function Laravel\Prompts\text;

/**
 * Bootstrap do primeiro admin: cria (ou atualiza) o super user de manutenção.
 *
 * Um ambiente recém-provisionado não tem NENHUM usuário, e o `UserSeeder` não
 * pode rodar fora de dev (credenciais conhecidas). O caminho manual via tinker
 * erra de formas silenciosas: `bcrypt()` duplica o hash (o cast `hashed` já
 * hasheia na atribuição), `email_verified_at` não é `$fillable` (a conta fica
 * presa na verificação) e `is_active` esquecido cria conta que não loga.
 *
 * Credenciais: opções `--email/--password/--name`, senão env `SUPER_USER_*`,
 * senão Laravel Prompts. A senha NUNCA é impressa. Rodar de novo é seguro e é
 * o caminho de rotação de senha: casa pelo e-mail e regrava a senha.
 */
final class CreateSuperUserCommand extends Command
{
    use ConfirmableTrait;

    /**
     * Mínimo para uma conta que enxerga o painel inteiro, /horizon e os logs.
     */
    private const MIN_PASSWORD_LENGTH = 12;

    protected $signature = 'users:super-user
        {--name= : Nome do usuário (default: env SUPER_USER_NAME ou "Super User")}
        {--email= : E-mail do usuário (default: env SUPER_USER_EMAIL; sem ele, pergunta)}
        {--password= : Senha (default: env SUPER_USER_PASSWORD; sem ela, pergunta de forma oculta)}
        {--force : Não pedir confirmação em produção}';

    protected $description = 'Cria ou atualiza o super user de manutenção (idempotente pelo e-mail); nunca imprime a senha.';

    public function handle(): int
    {
        if (!$this->confirmToProceed()) {
            return self::FAILURE;
        }

        $name  = $this->stringOption('name') ?? $this->env('SUPER_USER_NAME') ?? 'Super User';
        $email = $this->stringOption('email')
            ?? $this->env('SUPER_USER_EMAIL')
            ?? text(label: 'E-mail do super user', required: true);

        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $this->error(sprintf('E-mail inválido: "%s".', $email));

            return self::FAILURE;
        }

        $plainPassword = $this->stringOption('password')
            ?? $this->env('SUPER_USER_PASSWORD')
            ?? password(label: 'Senha do super user (não será exibida nem impressa)', required: true);

        if (mb_strlen($plainPassword) < self::MIN_PASSWORD_LENGTH) {
            $this->error(sprintf(
                'A senha tem %d caracteres; o mínimo é %d. Gere uma: openssl rand -base64 24',
                mb_strlen($plainPassword),
                self::MIN_PASSWORD_LENGTH,
            ));

            return self::FAILURE;
        }

        // Checado ANTES de escrever: o `assignRole` estoura em `firstOrFail()`
        // se os papéis não foram semeados, e a conta ficaria meio-provisionada.
        if (!Role::query()->where('name', Roles::SUPER_USER->value)->exists()) {
            $this->error(sprintf('O papel "%s" não existe.', Roles::SUPER_USER->value));
            $this->line('  Rode antes: php artisan permissions:sync');

            return self::FAILURE;
        }

        $existing = User::query()->where('email', $email)->first();

        // A senha vai em texto puro de propósito: o cast `hashed` do model hasheia.
        $user = User::query()->updateOrCreate(
            ['email' => $email],
            ['name' => $name, 'password' => $plainPassword, 'is_active' => true],
        );

        // Fora do array acima porque `email_verified_at` não é `$fillable`.
        if ($user->email_verified_at === null) {
            $user->email_verified_at = now();
            $user->save();
        }

        $user->assignRole(Roles::SUPER_USER->value);

        $this->info(sprintf(
            '%s: %s (%s) com papel %s.',
            $existing === null ? 'Super user criado' : 'Super user atualizado — senha rotacionada',
            $user->name,
            $user->email,
            Roles::SUPER_USER->value,
        ));

        return self::SUCCESS;
    }

    private function stringOption(string $key): ?string
    {
        $value = $this->option($key);

        return is_string($value) && $value !== '' ? $value : null;
    }

    /**
     * Lido via `env()` de propósito (não há config dedicada no boilerplate):
     * com `config:cache`, exporte a variável no ambiente do processo ou use
     * as opções do comando.
     */
    private function env(string $key): ?string
    {
        // @phpstan-ignore larastan.noEnvCallsOutsideOfConfig (uso deliberado, documentado acima: sem config dedicada; com config:cache exporte a variável no ambiente)
        $value = env($key);

        return is_string($value) && $value !== '' ? $value : null;
    }
}
