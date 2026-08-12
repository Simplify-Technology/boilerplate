<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| Tema fora do React — os dois blades que pintam sem o app.css
|--------------------------------------------------------------------------
|
| Duas superfícies do app são pintadas por CSS inline, não pelo app.css:
|
| 1. resources/views/app.blade.php — o <style> no topo do <head> pinta o fundo
|    ANTES de o app.css ser baixado (ele vem pelo @vite lá embaixo).
| 2. resources/views/errors/500.blade.php — o fallback do `catch` de
|    bootstrap/app.php, renderizado quando o próprio render Inertia falha.
|    Tipicamente manifest/build quebrado: aqui não existe app.css nenhum.
|
| As duas são obrigadas a usar valores literais — um `var(--token)` declarado no
| app.css é inválido em computed-value time exatamente na janela que estes
| blocos existem para cobrir, e o fundo fica sem cor. Foi o que aconteceu em
| c2ffbc7 (um commit de fontes): a linha escura virou `var(--color-primary-dark)`
| e ninguém viu, porque em produção o CSS é render-blocking e o token já existe
| no primeiro paint. A janela real é o `composer dev`, onde o Vite injeta o CSS
| por JS.
|
| O preço do literal é duplicação, e é isso que esta guarda cobra: o hex do
| blade tem de continuar igual ao token do app.css. A guarda nasceu cobrindo só
| o app.blade.php, e o 500 divergiu sem ninguém ver — pintava #0f172a (slate-900
| do Tailwind) onde o app pinta #0f2a44. Agora ela cobre os dois.
|
*/

/** @return array<string, string> nome legível => caminho do blade */
function themedBlades(): array
{
    $root = dirname(__DIR__, 3);

    return [
        'app.blade.php'        => $root . '/resources/views/app.blade.php',
        'errors/500.blade.php' => $root . '/resources/views/errors/500.blade.php',
    ];
}

function themeStyleBlock(string $nome): string
{
    $blade = themedBlades()[$nome];

    // Os comentários Blade saem antes de procurar a tag: um deles CITA a tag de
    // estilo em prosa, e o regex mordia a citação em vez do bloco real —
    // devolvendo um "CSS" que continha qualquer coisa que o comentário dissesse.
    $conteudo = preg_replace('/\{\{--.*?--\}\}/s', '', (string) file_get_contents($blade)) ?? '';

    preg_match('/<style\s*>(.*?)<\/style\s*>/s', $conteudo, $matches);

    return $matches[1] ?? '';
}

/**
 * Regras do bloco de estilo, achatadas: o abre-`@media` sai fora para as
 * regras aninhadas virarem topo de nível.
 *
 * @return array<int, array{seletor: string, corpo: string}>
 */
function themeRules(string $nome): array
{
    $css = preg_replace('/@media[^{]*\{/', '', themeStyleBlock($nome)) ?? '';

    preg_match_all('/([^{}]+)\{([^{}]*)\}/', $css, $regras, PREG_SET_ORDER);

    return array_map(fn(array $r): array => [
        'seletor' => trim(preg_replace('/\s+/', ' ', $r[1]) ?? ''),
        'corpo'   => $r[2],
    ], $regras);
}

/**
 * Valor de uma propriedade nas regras cujo seletor casa com o filtro.
 *
 * Existe porque a versão anterior desta guarda perguntava só "o texto aparece
 * em algum lugar do bloco?" — e isso passava verde com o defeito no lugar: o
 * hex do token aparecia como `color` do tema CLARO, e o `color-scheme: dark`
 * aparecia dentro do `@media`. Medir a declaração da regra certa é o que
 * transforma a busca em guarda.
 *
 * @return array<string, string> seletor => valor
 */
function themeDeclarations(string $nome, string $propriedade, callable $seletorCasa): array
{
    $encontradas = [];

    foreach (themeRules($nome) as ['seletor' => $seletor, 'corpo' => $corpo]) {
        if (!$seletorCasa($seletor)) {
            continue;
        }

        if (preg_match('/(?:^|\s)' . preg_quote($propriedade, '/') . ':\s*([^;]+);/', $corpo, $decl) === 1) {
            $encontradas[$seletor] = trim($decl[1]);
        }
    }

    return $encontradas;
}

/** Seletores de tema escuro: `.dark` explícito ou o `.system` dentro do `@media`. */
function ehSeletorEscuro(string $seletor): bool
{
    return str_contains($seletor, '.dark') || str_contains($seletor, '.system');
}

/** @return array<string, string> */
function darkBackgroundDeclarations(string $nome): array
{
    $fundos = themeDeclarations($nome, 'background', ehSeletorEscuro(...));

    return $fundos + themeDeclarations($nome, 'background-color', ehSeletorEscuro(...));
}

function appCssToken(string $token): string
{
    $css = (string) file_get_contents(dirname(__DIR__, 3) . '/resources/css/app.css');

    preg_match('/--' . preg_quote($token, '/') . ':\s*([^;]+);/', $css, $matches);

    return trim($matches[1] ?? '');
}

it('reads every themed blade and the css token', function(): void {
    expect(appCssToken('brand-navy-dark'))->not->toBe('');

    foreach (themedBlades() as $nome => $caminho) {
        expect(themeStyleBlock($nome))->not->toBe('', "O <style> de {$nome} não foi encontrado");
    }
});

it('paints the dark background with a literal, never a css variable', function(string $nome): void {
    expect(str_contains(themeStyleBlock($nome), 'var(--'))->toBe(
        false,
        "O <style> inline de {$nome} roda antes (ou na ausência) do app.css: um var() aqui "
        . 'fica sem valor exatamente na janela que este bloco existe para cobrir. Use o '
        . 'literal e deixe o teste de sincronia cobrar a igualdade com o token.'
    );
})->with(fn() => array_keys(themedBlades()));

it('keeps the inline dark background in sync with the app.css token', function(string $nome): void {
    $token       = appCssToken('brand-navy-dark');
    $declaracoes = darkBackgroundDeclarations($nome);

    expect($declaracoes)->not->toBeEmpty(
        "Nenhuma regra de tema escuro com fundo foi encontrada em {$nome} — o seletor mudou "
        . 'e esta guarda ficaria vazia, passando por acidente.'
    );

    foreach ($declaracoes as $seletor => $valor) {
        expect($valor)->toBe($token, sprintf(
            'O fundo escuro de `%s` em %s (%s) saiu de sincronia com --brand-navy-dark (%s) '
            . 'de resources/css/app.css. Os dois pintam a mesma superfície em momentos '
            . 'diferentes do carregamento: divergir faz a cor trocar sozinha quando o CSS '
            . 'termina de chegar.',
            $seletor,
            $nome,
            $valor,
            $token
        ));
    }
})->with(fn() => array_keys(themedBlades()));

it('declares color-scheme for both themes so native chrome follows the class', function(string $nome): void {
    // Preso à CLASSE, e não a um valor calculado no servidor: é a classe que
    // muda quando o usuário troca de tema, então o cromo nativo (barra de
    // rolagem, controles de formulário) acompanha sem JS e sem reload.
    $claro  = themeDeclarations($nome, 'color-scheme', fn(string $s): bool => !ehSeletorEscuro($s));
    $escuro = themeDeclarations($nome, 'color-scheme', fn(string $s): bool => str_contains($s, '.dark'));

    // Via `in_array` e não `toContain`: o segundo argumento de `toContain` é
    // OUTRO needle no Pest, não a mensagem de falha.
    expect(in_array('light', $claro, true))->toBe(true, "Falta uma regra de tema claro declarando color-scheme em {$nome}")
        ->and(in_array('dark', $escuro, true))->toBe(true, "Falta uma regra `.dark` declarando color-scheme em {$nome}");
})->with(fn() => array_keys(themedBlades()));

it('declares a color-scheme meta so native chrome follows the theme', function(): void {
    $blade = (string) file_get_contents(dirname(__DIR__, 3) . '/resources/views/app.blade.php');

    expect($blade)->toContain('name="color-scheme"');
});
