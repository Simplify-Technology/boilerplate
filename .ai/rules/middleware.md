---
paths:
  - 'app/Http/Middleware/**'
---

# Middleware

## Contrato de shared props do Inertia
Dados globais são compartilhados só em HandleInertiaRequests::share: name, quote, auth = {user, permissions e roles como arrays de nomes string, impersonating} e ziggy. **Flash não é prop compartilhada** — vai pelo canal nativo do Inertia 3 (`Inertia::flash()`), fora de props, e o share() não o republica; ver .ai/rules/controllers.md e js.md. Tipe toda prop compartilhada nova em SharedData (resources/js/types/index.d.ts), e o shape inteiro está travado por tests/Feature/SharedPropsTest.php.

## Middleware que vale para a app inteira mora no GRUPO, não num arquivo de rota
`SecurityHeaders`, `SetSensitiveCacheHeaders`, `HandleAppearance`, `HandleInertiaRequests` e `EnsureUserIsActive` entram por `$middleware->web(append: [...])` em bootstrap/app.php. É de propósito: assim cobrem os três arquivos de rota (web, settings, auth) e qualquer arquivo futuro sem ninguém lembrar de nada. Pendurar um deles num `Route::middleware(...)->group()` dentro de routes/web.php — a forma que parece mais explícita — deixa `settings/*` e `auth` descobertos, e é como um projeto derivado permitiu que conta desativada seguisse trocando a própria senha. `tests/Feature/EnsureUserIsActiveTest.php` cobre os três arquivos, uma rota sem `auth` e a presença no grupo.
