<?php

declare(strict_types = 1);

use App\Enum\Roles;
use App\Models\User;
use Database\Seeders\PermissionRoleSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

const SUPER_USER_TEST_PASSWORD = 'senha-forte-de-manutencao';

beforeEach(function(): void {
    $this->seed(PermissionRoleSeeder::class);
});

it('creates the super user with the role, active and already verified', function(): void {
    $this->artisan('users:super-user', [
        '--name'     => 'Admin Bootstrap',
        '--email'    => 'admin@example.com',
        '--password' => SUPER_USER_TEST_PASSWORD,
    ])->assertSuccessful();

    $user = User::query()->where('email', 'admin@example.com')->firstOrFail();

    expect($user->name)->toBe('Admin Bootstrap')
        ->and($user->hasRole(Roles::SUPER_USER))->toBeTrue()
        // `is_active` é o campo que libera o login.
        ->and($user->is_active)->toBeTrue()
        // `email_verified_at` não é `$fillable` e o User implementa MustVerifyEmail.
        ->and($user->email_verified_at)->not->toBeNull();
});

// A armadilha nº 1 do tinker manual: com `'password' => 'hashed'` no casts(),
// um `bcrypt()` do lado de fora gera hash duplo e o login nunca funciona.
it('stores the password hashed exactly once, so the login actually works', function(): void {
    $this->artisan('users:super-user', [
        '--email'    => 'admin@example.com',
        '--password' => SUPER_USER_TEST_PASSWORD,
    ])->assertSuccessful();

    $user = User::query()->where('email', 'admin@example.com')->firstOrFail();

    expect(Hash::check(SUPER_USER_TEST_PASSWORD, $user->password))->toBeTrue()
        ->and($user->password)->not->toBe(SUPER_USER_TEST_PASSWORD);
});

it('never prints the password', function(): void {
    $this->artisan('users:super-user', [
        '--email'    => 'admin@example.com',
        '--password' => SUPER_USER_TEST_PASSWORD,
    ])
        ->doesntExpectOutputToContain(SUPER_USER_TEST_PASSWORD)
        ->assertSuccessful();
});

it('asks for the password with a hidden prompt when none is given', function(): void {
    $this->artisan('users:super-user', ['--email' => 'admin@example.com'])
        ->expectsQuestion('Senha do super user (não será exibida nem impressa)', SUPER_USER_TEST_PASSWORD)
        ->assertSuccessful();

    $user = User::query()->where('email', 'admin@example.com')->firstOrFail();

    expect(Hash::check(SUPER_USER_TEST_PASSWORD, $user->password))->toBeTrue();
});

it('refuses a password below the minimum length', function(): void {
    $this->artisan('users:super-user', [
        '--email'    => 'admin@example.com',
        '--password' => 'curta',
    ])->assertFailed();

    expect(User::query()->where('email', 'admin@example.com')->exists())->toBeFalse();
});

it('refuses an invalid email', function(): void {
    $this->artisan('users:super-user', [
        '--email'    => 'nao-e-email',
        '--password' => SUPER_USER_TEST_PASSWORD,
    ])->assertFailed();

    expect(User::query()->count())->toBe(0);
});

it('is idempotent and rotates the password on re-run', function(): void {
    $this->artisan('users:super-user', [
        '--email'    => 'admin@example.com',
        '--password' => SUPER_USER_TEST_PASSWORD,
    ])->assertSuccessful();

    $this->artisan('users:super-user', [
        '--email'    => 'admin@example.com',
        '--password' => 'outra-senha-de-manutencao',
    ])->assertSuccessful();

    expect(User::query()->where('email', 'admin@example.com')->count())->toBe(1);

    $user = User::query()->where('email', 'admin@example.com')->firstOrFail();

    expect(Hash::check('outra-senha-de-manutencao', $user->password))->toBeTrue()
        ->and($user->hasRole(Roles::SUPER_USER))->toBeTrue();
});

// Sem os papéis semeados o `assignRole` estoura em firstOrFail(). Se a checagem
// viesse depois da escrita, a conta ficaria criada e sem papel.
it('fails before writing anything when the roles were not seeded', function(): void {
    DB::table('permission_user')->delete();
    DB::table('permission_role')->delete();
    User::query()->delete();
    App\Models\Role::query()->delete();

    $this->artisan('users:super-user', [
        '--email'    => 'admin@example.com',
        '--password' => SUPER_USER_TEST_PASSWORD,
    ])->assertFailed();

    expect(User::query()->where('email', 'admin@example.com')->exists())->toBeFalse();
});

it('is registered as an artisan command', function(): void {
    expect(array_keys(Artisan::all()))->toContain('users:super-user');
});
