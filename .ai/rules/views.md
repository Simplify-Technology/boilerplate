---
paths:
  - 'resources/views/**'
---

# Views

## Blade que pinta sem o `app.css` usa literal, e o literal espelha o token
Duas superfícies são pintadas por CSS inline e não pelo `app.css`: o bloco de estilo no topo de `app.blade.php` (que cobre a janela antes de o `@vite` entregar o CSS) e `errors/500.blade.php` (o fallback do `catch` de `bootstrap/app.php`, renderizado justamente quando o manifest/build quebrou — ali não existe `app.css` nenhum). Nas duas, um `var(--token)` declarado no `app.css` é inválido em computed-value time exatamente na janela que o bloco existe para cobrir, e o fundo fica sem cor. O preço do literal é duplicação: `tests/Unit/Theme/InlineThemeBackgroundTest.php` cobra que o hex continue igual ao `--brand-navy-dark`. Superfície nova pintada fora do `app.css` entra nesse teste no mesmo commit — o 500 tinha divergido para `#0f172a` (o slate-900 do Tailwind) sem ninguém ver, porque a guarda nascera olhando um arquivo só.

## `color-scheme` acompanha a classe `.dark`, nunca um valor calculado no servidor
O cromo nativo (barra de rolagem, controles de formulário, campo de data) segue o `color-scheme`. Se ele vier só do `<meta name="color-scheme">`, congela no valor que o servidor renderizou: quem troca o tema em `use-appearance.tsx` — que alterna a classe `.dark` — fica com o cromo do tema anterior até dar reload. Declarar `color-scheme: light` em `html` e `color-scheme: dark` em `html.dark` no mesmo bloco inline resolve sem uma linha de JS e já no primeiro paint, porque a classe é justamente o que muda. O `<meta>` fica como declaração precoce, e os dois concordam.

## A página de último recurso não ganha dependência nova
`errors/500.blade.php` existe para o caso de tudo o mais ter falhado: sem Vite, sem app.css, possivelmente sem middleware. Cada dependência acrescentada ali é uma chance a mais de ela também não aparecer. O tema vem de `$appearance` (publicado por `HandleAppearance` via `View::share`, com o cookie fora do `encryptCookies`) sempre com `?? 'system'` e com o valor restrito a `light|dark|system` antes de entrar no HTML — o `system` cai no `prefers-color-scheme`. Sem JS, sem asset, sem consulta ao banco.
