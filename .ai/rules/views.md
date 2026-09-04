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

## `public/` e o `<head>` só carregam o que se usa
O Vite copia `public/` verbatim — nada ali entra no grafo do Rollup — então um arquivo sem referência não quebra build nenhum e um `href` para arquivo inexistente é 404 silencioso em toda página. Foi assim que uma fonte duplicada por artefato do Finder (`aptos-extrabold-italic 2.woff2`, 79 KB, mesmo blob da versão sem ` 2`), quatro PNG de ícone que nenhum `<link>` citava e um `preconnect` para `fonts.bunny.net` herdado do starter kit (todas as `@font-face` são same-origin, e a folha do `@radix-ui/themes` não puxa host nenhum) viveram meses em `main`. Dica de rede (`preconnect`/`dns-prefetch`/`preload`) só entra com consumidor demonstrável em `resources/`; asset novo em `public/` entra com o `<link>`/`src` que o usa no mesmo commit; o `favicon.ico` já carrega 16/32/48 px, então PNG de 16/32 ao lado dele é peso morto. `tests/Unit/Views/PublicAssetsTest.php` cobra os três contratos — fontes ↔ `_fonts.css` nos dois sentidos, `href` do `<head>` ↔ disco, árvore de `public/` ↔ referência — com controle positivo em cada um e uma lista de dívida datada amarrada por simetria (a entrada some quando o arquivo ganhar consumidor ou for apagado). Manifest e `theme-color` não estão no `<head>` de propósito: o primeiro é decisão do tema PWA, o segundo precisa acompanhar a troca de tema, não só o `prefers-color-scheme`.
