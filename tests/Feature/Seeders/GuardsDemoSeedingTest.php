<?php

declare(strict_types = 1);

use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Support\Facades\Hash;

afterEach(function(): void {
    unset($_ENV['SEED_DEMO'], $_SERVER['SEED_DEMO'], $_ENV['SEED_ADMIN_PASSWORD'], $_SERVER['SEED_ADMIN_PASSWORD']);
});

function forceAppEnvironment(string $environment): void
{
    app()->detectEnvironment(fn(): string => $environment);
}

function setSeedEnv(string $key, string $value): void
{
    $_ENV[$key]    = $value;
    $_SERVER[$key] = $value;
}

it('seeds demo users normally in the testing environment', function(): void {
    $this->seed(PermissionRoleSeeder::class);

    (new UserSeeder())->run();

    $superUser = User::query()->where('email', 'super@user.com')->firstOrFail();

    // Em local/testing a senha conhecida `password` é permitida.
    expect(Hash::check('password', $superUser->password))->toBeTrue()
        ->and(User::query()->count())->toBeGreaterThan(1);
});

it('aborts the demo seeder outside local/testing without SEED_DEMO', function(): void {
    $this->seed(PermissionRoleSeeder::class);
    forceAppEnvironment('production');

    (new UserSeeder())->run();

    expect(User::query()->count())->toBe(0);
});

it('requires SEED_ADMIN_PASSWORD when demo seeding is forced outside local/testing', function(): void {
    $this->seed(PermissionRoleSeeder::class);
    forceAppEnvironment('production');
    setSeedEnv('SEED_DEMO', 'true');

    // Falha ANTES de escrever qualquer usuário: a senha `password` nunca chega em prod.
    expect(fn() => (new UserSeeder())->run())->toThrow(RuntimeException::class, 'SEED_ADMIN_PASSWORD');

    expect(User::query()->count())->toBe(0);
});

it('seeds with the operator-supplied password when explicitly opted in', function(): void {
    $this->seed(PermissionRoleSeeder::class);
    forceAppEnvironment('production');
    setSeedEnv('SEED_DEMO', 'true');
    setSeedEnv('SEED_ADMIN_PASSWORD', 'senha-explicita-do-operador');

    (new UserSeeder())->run();

    $superUser = User::query()->where('email', 'super@user.com')->firstOrFail();

    expect(Hash::check('senha-explicita-do-operador', $superUser->password))->toBeTrue()
        ->and(Hash::check('password', $superUser->password))->toBeFalse();
});
