<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Erro interno</title>
    <style>
        :root {
            color-scheme: light dark;
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

        @media (prefers-color-scheme: dark) {
            body {
                background: #0f172a;
                color: #e2e8f0;
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
