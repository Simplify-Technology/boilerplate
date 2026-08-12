{{--
    Fallback de último recurso: renderizado no `catch` de bootstrap/app.php,
    quando o próprio render Inertia falha — tipicamente manifest/build quebrado.
    Ou seja, é a única página do app que roda SEM o app.css. Como o bloco de
    estilo inline de app.blade.php, ele carrega literais, e os literais têm de
    espelhar os tokens; tests/Unit/Theme/InlineThemeBackgroundTest.php cobra a
    sincronia dos dois arquivos.

    O tema vem da MESMA fonte do resto do app: `$appearance`, publicado por
    HandleAppearance via View::share (o cookie está fora do encryptCookies).
    Antes esta página decidia só por `prefers-color-scheme`, então quem tinha
    escolhido "escuro" com o sistema em claro recebia uma página branca. O modo
    `system` segue caindo na media query. Sem JS: numa página que existe para o
    caso de tudo ter quebrado, cada dependência a menos é uma chance a mais de
    ela aparecer.
--}}
@php($theme = in_array($appearance ?? 'system', ['light', 'dark'], true) ? $appearance : 'system')
    <!DOCTYPE html>
<html lang="pt-BR" class="{{ $theme }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Erro interno</title>
    <style>
        html {
            color-scheme: light;
        }

        html.dark {
            color-scheme: dark;
        }

        body {
            margin: 0;
            display: flex;
            min-height: 100vh;
            align-items: center;
            justify-content: center;
            font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
            background: #ffffff;
            color: #0f2a44;
        }

        html.dark body {
            background: #0f2a44;
            color: #ffffff;
        }

        @media (prefers-color-scheme: dark) {
            html.system {
                color-scheme: dark;
            }

            html.system body {
                background: #0f2a44;
                color: #ffffff;
            }
        }

        main {
            text-align: center;
            padding: 1.5rem;
        }

        .status {
            font-size: 4.5rem;
            font-weight: 700;
            opacity: 0.35;
            margin: 0;
        }

        h1 {
            font-size: 1.5rem;
            margin: 0.5rem 0;
        }

        p {
            font-size: 0.875rem;
            opacity: 0.7;
            max-width: 28rem;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <main>
        <p class="status">500</p>
        <h1>Erro interno</h1>
        <p>Algo deu errado do nosso lado. Tente novamente em instantes.</p>
    </main>
</body>
</html>
