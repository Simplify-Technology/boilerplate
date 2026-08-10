<?php

declare(strict_types = 1);

use Illuminate\Support\Arr;

it('uses pt_BR as the default application locale', function(): void {
    expect(app()->getLocale())->toBe('pt_BR');
});

it('ships pt_BR locale defaults in config/app.php', function(): void {
    $snapshot = [];

    foreach (['APP_LOCALE', 'APP_FALLBACK_LOCALE', 'APP_FAKER_LOCALE'] as $key) {
        $snapshot[$key] = getenv($key);
        putenv($key);
        unset($_ENV[$key], $_SERVER[$key]);
    }

    $appConfig = require config_path('app.php');

    foreach ($snapshot as $key => $value) {
        if ($value !== false) {
            putenv("{$key}={$value}");
            $_ENV[$key]    = $value;
            $_SERVER[$key] = $value;
        }
    }

    expect($appConfig['locale'])->toBe('pt_BR')
        ->and($appConfig['fallback_locale'])->toBe('en')
        ->and($appConfig['faker_locale'])->toBe('pt_BR');
});

test('authentication messages are translated to pt_BR', function(): void {
    expect(__('auth.failed'))
        ->not->toBe('auth.failed')
        ->not->toBe('These credentials do not match our records.')
        ->toBe('As credenciais informadas não conferem.');
});

test('validation messages are translated to pt_BR', function(): void {
    expect(__('validation.required', ['attribute' => 'nome']))
        ->not->toBe('validation.required')
        ->not->toBe('The nome field is required.')
        ->toBe('O campo nome é obrigatório.');
});

test('password reset messages are translated to pt_BR', function(): void {
    expect(__('passwords.reset'))
        ->not->toBe('passwords.reset')
        ->not->toBe('Your password has been reset.')
        ->toBe('Sua senha foi redefinida.');
});

test('pt_BR validation covers every framework validation rule', function(): void {
    $frameworkMessages = require base_path('vendor/laravel/framework/src/Illuminate/Translation/lang/en/validation.php');
    $ptBrMessages      = require lang_path('pt_BR/validation.php');

    $ruleKeys = fn(array $messages): array => array_keys(
        Arr::dot(Arr::except($messages, ['custom', 'attributes']))
    );

    $missing = array_diff($ruleKeys($frameworkMessages), $ruleKeys($ptBrMessages));

    expect(array_values($missing))->toBe([]);
});
