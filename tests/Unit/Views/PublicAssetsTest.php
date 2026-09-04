<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| public/ e o <head> só carregam o que se usa
|--------------------------------------------------------------------------
|
| O Vite copia public/ verbatim: nada ali entra no grafo do Rollup, então um
| arquivo sem referência não falha build nenhum, e um href para arquivo que
| não existe é 404 silencioso em toda página. Foi assim que o boilerplate
| carregou por meses uma fonte duplicada por artefato do Finder
| (`aptos-extrabold-italic 2.woff2`, 79 KB, mesmo blob da versão sem ` 2`),
| quatro PNG de ícone que nenhum <link> citava e um `preconnect` para
| fonts.bunny.net herdado do starter kit — TLS aberto a cada navegação com um
| host de onde nenhum byte vinha (todas as @font-face são same-origin).
|
| Três contratos, cada um com controle positivo para não passar por vacuidade:
|
| 1. fontes: todo .woff2 de public/fonts é citado por _fonts.css, e toda url()
|    de _fonts.css existe no disco (o sentido inverso é o FOIT silencioso);
| 2. <head>: todo href de <link> em app.blade.php existe em public/, e dica de
|    rede (preconnect/dns-prefetch) só entra com consumidor em resources/;
| 3. árvore: todo arquivo de public/ fora de fonts/, vendor/ e build/ é
|    convenção do browser, é referenciado por resources/, ou está na dívida
|    datada — que precisa continuar órfã, senão a entrada apodrece.
|
*/

function projectRoot(): string
{
    return dirname(__DIR__, 3);
}

/**
 * Arquivos regulares abaixo de public/, como caminho absoluto de URL
 * (`/fonts/…`). Não segue symlink (public/storage) e poda o que é gerado ou
 * publicado por pacote: build/, hot, vendor/.
 *
 * @return list<string>
 */
function publicFiles(string $subdir = ''): array
{
    $base = projectRoot() . '/public';
    $dir  = $base . $subdir;

    if (!is_dir($dir)) {
        return [];
    }

    $arquivos = [];

    foreach (scandir($dir) ?: [] as $entrada) {
        if (in_array($entrada, ['.', '..'], true)) {
            continue;
        }

        $caminho  = $dir . '/' . $entrada;
        $relativo = $subdir . '/' . $entrada;

        if (is_link($caminho) || in_array($relativo, ['/build', '/hot', '/vendor'], true)) {
            continue;
        }

        if (is_dir($caminho)) {
            array_push($arquivos, ...publicFiles($relativo));

            continue;
        }

        $arquivos[] = $relativo;
    }

    sort($arquivos);

    return $arquivos;
}

/** Todo o texto de resources/ (tsx, ts, css, blade) numa string só, para buscar referência. */
function resourcesCorpus(): string
{
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(projectRoot() . '/resources', FilesystemIterator::SKIP_DOTS));
    $corpus   = '';

    foreach ($iterator as $arquivo) {
        if (preg_match('/\.(tsx?|css|php)$/', $arquivo->getFilename()) === 1) {
            $corpus .= file_get_contents($arquivo->getPathname()) . "\n";
        }
    }

    return $corpus;
}

/** O <head> de app.blade.php sem os comentários Blade — um deles cita tags em prosa. */
function rootBladeHead(): string
{
    $blade = (string) file_get_contents(projectRoot() . '/resources/views/app.blade.php');
    $blade = preg_replace('/\{\{--.*?--\}\}/s', '', $blade) ?? '';

    preg_match('/<head\s*>(.*?)<\/head\s*>/s', $blade, $matches);

    return $matches[1] ?? '';
}

/**
 * Tags <link> do <head> com rel e href, como pares.
 *
 * @return list<array{rel: string, href: string}>
 */
function headLinks(): array
{
    preg_match_all('/<link\b[^>]*>/', rootBladeHead(), $tags);

    $links = [];

    foreach ($tags[0] as $tag) {
        if (preg_match('/\brel="([^"]+)"/', $tag, $rel) !== 1 || preg_match('/\bhref="([^"]+)"/', $tag, $href) !== 1) {
            continue;
        }

        $links[] = ['rel' => $rel[1], 'href' => $href[1]];
    }

    return $links;
}

/**
 * URLs same-origin citadas pelo _fonts.css, sem duplicata.
 *
 * @return list<string>
 */
function fontFaceUrls(): array
{
    $css = (string) file_get_contents(projectRoot() . '/resources/css/_fonts.css');

    preg_match_all('/url\(\s*["\']?([^"\')]+)["\']?\s*\)/', $css, $matches);

    $urls = array_values(array_unique(array_filter($matches[1], fn(string $url): bool => str_starts_with($url, '/fonts/'))));
    sort($urls);

    return $urls;
}

it('cites every woff2 in public/fonts from _fonts.css, and every url() exists on disk', function(): void {
    $noDisco = array_values(array_filter(publicFiles('/fonts'), fn(string $f): bool => str_ends_with($f, '.woff2')));
    $noCss   = fontFaceUrls();

    // Controle positivo: os dois lados têm de ter enxergado a família inteira.
    // Um regex que deixasse de casar `url("…")` encolheria a lista e o teste
    // passaria verde afirmando nada.
    expect(count($noCss))->toBeGreaterThanOrEqual(21)
        ->and(count($noDisco))->toBeGreaterThanOrEqual(21);

    expect(array_values(array_diff($noDisco, $noCss)))->toBe(
        [],
        'Fonte em public/fonts sem @font-face em _fonts.css: é peso morto que nenhum build denuncia, '
        . 'porque public/ não entra no grafo do Rollup. Apague o arquivo ou declare a face.'
    );

    expect(array_values(array_diff($noCss, $noDisco)))->toBe(
        [],
        '@font-face apontando para arquivo que não existe em public/: o browser cai no fallback em '
        . 'silêncio (FOIT/FOUT) e nenhum 404 aparece em teste. Suba o arquivo ou corrija a url().'
    );
});

it('links only assets that exist in public/ from the <head>', function(): void {
    $locais = array_values(array_filter(headLinks(), fn(array $link): bool => str_starts_with($link['href'], '/')));

    // Controle positivo: os 5 preloads de fonte + os ícones.
    expect(count($locais))->toBeGreaterThanOrEqual(6);

    foreach ($locais as ['rel' => $rel, 'href' => $href]) {
        $caminho = (string) parse_url($href, PHP_URL_PATH);

        expect(is_file(projectRoot() . '/public' . $caminho))->toBe(true, sprintf(
            '<link rel="%s" href="%s"> aponta para arquivo que não existe em public/: é 404 em toda '
            . 'página, sem sintoma visível. Suba o asset no mesmo commit ou tire o <link>.',
            $rel,
            $href
        ));
    }
});

it('declares the tab icons the browser can find', function(): void {
    $rels = array_column(headLinks(), 'href', 'rel');

    expect($rels)->toHaveKey('icon')
        ->and($rels)->toHaveKey('apple-touch-icon');
});

it('only preconnects to hosts that something in resources/ actually fetches', function(): void {
    $dicas = array_values(array_filter(headLinks(), fn(array $link): bool => in_array($link['rel'], ['preconnect', 'dns-prefetch'], true)));

    // O corpus sem as próprias tags de dica: a tag não é consumidor dela mesma.
    $corpus = preg_replace('/<link\b[^>]*\brel="(?:preconnect|dns-prefetch)"[^>]*>/', '', resourcesCorpus()) ?? '';

    $semConsumidor = array_values(array_filter($dicas, function(array $dica) use ($corpus): bool {
        $host = (string) parse_url($dica['href'], PHP_URL_HOST);

        return $host === '' || !str_contains($corpus, $host);
    }));

    // Sempre afirma algo — inclusive "não há dica nenhuma", que é o estado
    // certo enquanto todo asset for same-origin.
    expect($semConsumidor)->toBe(
        [],
        'Dica de rede para um host de onde nada em resources/ busca byte algum: é handshake TLS a '
        . 'cada navegação, para nada. preconnect/dns-prefetch só entra com consumidor demonstrável '
        . '(url(), src, href ou fetch) na árvore.'
    );
});

/*
 * Convenção do browser: alcançáveis sem <link> nenhum (o Safari busca
 * /apple-touch-icon.png e todo browser busca /favicon.ico) — e os três do
 * servidor. Tudo o mais em public/ precisa de quem o use.
 */
function publicConventions(): array
{
    return ['/.htaccess', '/index.php', '/robots.txt', '/favicon.ico', '/apple-touch-icon.png'];
}

/**
 * Dívida datada: órfãos que uma decisão pendente vai resolver. A entrada some
 * quando o arquivo ganhar consumidor ou for apagado — e o teste de simetria
 * abaixo cobra isso, senão a lista vira licença permanente.
 *
 * @return array<string, string> caminho => motivo
 */
function publicOrphanDebt(): array
{
    return [
        '/logo.svg' => 'F37 (2026-09-04): identidade — o SVG de 26 KB é órfão desde o starter kit; '
            . 'decide-se junto com o PNG de 116 KB servido a 40 px.',
    ];
}

it('keeps no orphan file in public/ outside fonts, vendor and build', function(): void {
    $arquivos = array_values(array_filter(publicFiles(), fn(string $f): bool => !str_starts_with($f, '/fonts/')));

    // Controle positivo: a árvore foi lida (servidor + ícones + logo).
    expect(count($arquivos))->toBeGreaterThanOrEqual(5);

    $corpus = resourcesCorpus();
    $orfaos = array_values(array_filter(
        $arquivos,
        fn(string $f): bool => !in_array($f, publicConventions(), true)
            && !array_key_exists($f, publicOrphanDebt())
            && !str_contains($corpus, basename($f)),
    ));

    expect($orfaos)->toBe(
        [],
        'Arquivo em public/ que nada em resources/ referencia. public/ é copiado verbatim pelo Vite, '
        . 'então isto nunca falha build: ou entra o <link>/src que o usa, ou o arquivo sai, ou a '
        . 'decisão pendente vai para publicOrphanDebt() com data e motivo.'
    );
});

it('keeps the orphan debt list honest: every entry is still an orphan', function(): void {
    $corpus = resourcesCorpus();

    foreach (publicOrphanDebt() as $arquivo => $motivo) {
        expect(is_file(projectRoot() . '/public' . $arquivo))->toBe(true, "{$arquivo} está na dívida mas não existe mais — apague a entrada.")
            ->and(str_contains($corpus, basename($arquivo)))->toBe(false, "{$arquivo} ganhou consumidor — apague a entrada da dívida ({$motivo}).");
    }
});
