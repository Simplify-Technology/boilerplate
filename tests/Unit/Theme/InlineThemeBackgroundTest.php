<?php

declare(strict_types = 1);

/*
|--------------------------------------------------------------------------
| Fundo do tema antes do CSS chegar
|--------------------------------------------------------------------------
|
| O `<style>` inline de resources/views/app.blade.php existe para pintar o
| fundo antes de o app.css ser baixado — ele fica no topo do <head>, e o CSS
| só entra pelo @vite mais abaixo. Isso o obriga a usar valores literais: um
| `var(--token)` declarado no app.css é inválido em computed-value time
| justamente na janela que o bloco existe para cobrir, e o fundo fica sem cor.
|
| Foi o que aconteceu em c2ffbc7 (um commit de fontes): a linha escura virou
| `var(--color-primary-dark)` — hoje `--brand-navy-dark` — e ninguém viu, porque em produção o CSS é
| render-blocking e o token já existe no primeiro paint. A janela real é o
| `composer dev`, onde o Vite injeta o CSS por JS.
|
| O preço do literal é duplicação, e é isso que esta guarda cobra: o hex do
| blade tem de continuar igual ao token do app.css.
|
*/

function inlineThemeStyleBlock(): string
{
    $blade = (string) file_get_contents(dirname(__DIR__, 3) . '/resources/views/app.blade.php');

    preg_match('/<style\s*>(.*?)<\/style\s*>/s', $blade, $matches);

    return $matches[1] ?? '';
}

function appCssToken(string $token): string
{
    $css = (string) file_get_contents(dirname(__DIR__, 3) . '/resources/css/app.css');

    preg_match('/--' . preg_quote($token, '/') . ':\s*([^;]+);/', $css, $matches);

    return trim($matches[1] ?? '');
}

it('reads both files', function(): void {
    expect(inlineThemeStyleBlock())->not->toBe('')
        ->and(appCssToken('brand-navy-dark'))->not->toBe('');
});

it('paints the dark background with a literal, never a css variable', function(): void {
    expect(str_contains(inlineThemeStyleBlock(), 'var(--'))->toBe(
        false,
        'O <style> inline roda antes do app.css: um var() aqui fica sem valor '
        . 'exatamente na janela que este bloco existe para cobrir. Use o literal '
        . 'e deixe o teste de sincronia cobrar a igualdade com o token.'
    );
});

it('keeps the inline dark background in sync with the app.css token', function(): void {
    $token = appCssToken('brand-navy-dark');

    expect(str_contains(inlineThemeStyleBlock(), $token))->toBe(true, sprintf(
        'O fundo escuro inline de resources/views/app.blade.php saiu de sincronia '
        . 'com --brand-navy-dark (%s) de resources/css/app.css. Os dois pintam '
        . 'a mesma superfície em momentos diferentes do carregamento: divergir faz '
        . 'a cor trocar sozinha quando o CSS termina de chegar.',
        $token
    ));
});

it('declares a color-scheme meta so native chrome follows the theme', function(): void {
    $blade = (string) file_get_contents(dirname(__DIR__, 3) . '/resources/views/app.blade.php');

    expect($blade)->toContain('name="color-scheme"');
});
