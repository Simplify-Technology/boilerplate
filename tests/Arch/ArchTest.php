<?php

declare(strict_types = 1);

use Illuminate\Database\Eloquent\Model;

/*
 * Guardas de arquitetura (Pest 4). Regras pragmáticas: protegem as convenções
 * do boilerplate (AGENTS.md) sem exigir refatoração do código legítimo.
 */

arch()->preset()->php();
arch()->preset()->security();

arch('App\Enum contém apenas enums')
    ->expect('App\Enum')
    ->toBeEnums();

arch('controllers de ação única são invokable')
    ->expect('App\Http\Controllers')
    ->toBeInvokable()
    ->ignoring([
        // Resource controllers herdados dos starter kits de auth/settings.
        'App\Http\Controllers\Auth',
        'App\Http\Controllers\Settings',
        // Classe base abstrata.
        'App\Http\Controllers\Controller',
    ]);

arch('models estendem Eloquent Model')
    ->expect('App\Models')
    ->toExtend(Model::class);

arch('value objects são finais e com tipos estritos')
    ->expect('App\ValueObjects')
    ->toBeFinal()
    ->toUseStrictTypes();

arch('controllers não fazem query via facade DB')
    ->expect('App\Http\Controllers')
    ->not->toUse('Illuminate\Support\Facades\DB');
