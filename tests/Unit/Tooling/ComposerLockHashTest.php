<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| O mesmo composer.lock valida em todo Composer que o lê ou o escreve
|--------------------------------------------------------------------------
|
| O `content-hash` do lock é calculado a partir de um subconjunto do
| composer.json. O Composer 2.11 passou a incluir `config.policy` nesse
| subconjunto; o 2.10 não inclui. Quem escreve o lock (Dependabot, hoje no
| 2.10.x) e quem o confere (`composer validate --strict` no CI, com
| `composer:v2` flutuante) andam em versões diferentes, então um
| `config.policy` declarado faz o mesmo lock ser válido num e "not up to
| date" no outro — foi assim que a main ficou vermelha em 2026-11-04 (#216).
|
| Exceção de pacote abandonado vai em `config.audit.ignore-abandoned`, que as
| duas versões leem e nenhuma põe no hash.
|
| Esta guarda sai quando todo escritor do lock estiver no Composer ≥ 2.11.
|
*/

it('não declara config.policy no composer.json, que muda o hash do lock entre o Composer 2.10 e o 2.11', function(): void {
    $composer = json_decode(
        (string) file_get_contents(dirname(__DIR__, 3) . '/composer.json'),
        true,
        512,
        JSON_THROW_ON_ERROR,
    );

    expect($composer['config'] ?? [])->not->toHaveKey('policy');
});
