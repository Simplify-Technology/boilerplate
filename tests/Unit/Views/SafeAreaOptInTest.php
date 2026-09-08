<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| env(safe-area-inset-*) só entra com viewport-fit=cover
|--------------------------------------------------------------------------
|
| Sem `viewport-fit=cover` na meta viewport, o WebKit mantém o layout dentro
| da safe area e as quatro variáveis `env(safe-area-inset-*)` valem `0px`
| (MDN, meta/viewport: é o `cover` que faz o conteúdo alcançar o notch e, por
| isso, exige os insets). O boilerplate carregou por meses um `padding` de
| quatro `env()` no `body` sem o opt-in — a intenção estava no CSS e não tinha
| efeito em lugar nenhum. E ativar não é uma linha: sidebar, portais Radix e o
| Toaster são `fixed`, resolvem contra o viewport e ignorariam o padding do
| `body`; o idioma atual é `max(…, env(safe-area-max-inset-*, 0px))` no
| elemento que encosta na borda.
|
| Este contrato aceita os dois estados coerentes (nenhum inset, ou inset com
| o opt-in) e recusa o incoerente (inset sem opt-in) — que é como o padding
| morto voltaria.
|
*/

/** @return list<string> arquivos de resources/ (css, tsx, ts, blade) que citam safe-area */
function safeAreaConsumers(): array
{
    $root     = dirname(__DIR__, 3) . '/resources';
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    $achados  = [];

    foreach ($iterator as $arquivo) {
        if (preg_match('/\.(tsx?|css|php)$/', $arquivo->getFilename()) !== 1) {
            continue;
        }

        // Comentários fora: o app.css explica em prosa por que NÃO tem o inset,
        // e a prosa não é consumidor.
        $codigo = preg_replace(['/\/\*.*?\*\//s', '/\{\{--.*?--\}\}/s', '/^\s*\/\/.*$/m'], '', (string) file_get_contents($arquivo->getPathname())) ?? '';

        if (str_contains($codigo, 'safe-area-')) {
            $achados[] = substr($arquivo->getPathname(), strlen($root) + 1);
        }
    }

    sort($achados);

    return $achados;
}

function viewportMetaContent(): string
{
    $blade = (string) file_get_contents(dirname(__DIR__, 3) . '/resources/views/app.blade.php');

    preg_match('/<meta\s+name="viewport"\s+content="([^"]*)"/', $blade, $matches);

    return $matches[1] ?? '';
}

it('declares a viewport meta in the root blade', function(): void {
    expect(viewportMetaContent())->toContain('width=device-width');
});

it('uses env(safe-area-*) only when the viewport opts in with viewport-fit=cover', function(): void {
    $consumidores = safeAreaConsumers();

    if ($consumidores === []) {
        // Via `str_contains` + `toBe`, e não `toContain`: no Pest o segundo
        // argumento de `toContain` é OUTRO needle, não a mensagem de falha.
        expect(str_contains(viewportMetaContent(), 'viewport-fit=cover'))->toBe(
            false,
            'viewport-fit=cover sem nenhum env(safe-area-*) em resources/: o conteúdo passa a alcançar o '
            . 'notch e nada o afasta dele. Ou entra o inset no elemento que encosta na borda, ou sai o opt-in.'
        );

        return;
    }

    expect(str_contains(viewportMetaContent(), 'viewport-fit=cover'))->toBe(true, sprintf(
        'env(safe-area-*) em %s sem viewport-fit=cover na meta viewport: as quatro variáveis valem 0px e '
        . 'o padding é morto. Ativar exige o opt-in E um plano para os elementos fixed (sidebar, portais '
        . 'Radix, Toaster), que resolvem contra o viewport e não contra o padding do body.',
        implode(', ', $consumidores)
    ));
});
