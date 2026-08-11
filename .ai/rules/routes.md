---
paths:
  - 'routes/**'
---

# Routes

## Throttle sempre via limiter nomeado
Toda rota com rate limit usa limiter nomeado (throttle:auth, throttle:impersonate, throttle:verification) definido em AppServiceProvider::configRateLimiting() — nunca throttle:N,M inline. Caso novo = novo RateLimiter::for() no provider + entrada no teste de contrato AuthRouteThrottleTest.

## Rota de escrita autenticada declara autorização na própria rota
Toda rota POST/PUT/PATCH/DELETE sob `auth` carrega `can:<permissão>` (ou o atributo `#[Authorize]`, que o L13 também aceita). Throttle não é autorização: uma rota com `throttle:` e sem `can:` está aberta a qualquer usuário logado. A única exceção é self-service — ação que o usuário só exerce sobre a própria conta — e ela precisa entrar em `selfServiceWriteRoutes()` de tests/Feature/Routes/WriteRoutesAuthorizationTest.php, que valida a allowlist nos dois sentidos.
