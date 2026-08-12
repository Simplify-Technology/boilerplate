---
paths:
  - 'routes/**'
---

# Routes

## Throttle sempre via limiter nomeado
Toda rota com rate limit usa limiter nomeado (throttle:auth, throttle:impersonate, throttle:verification) definido em AppServiceProvider::configRateLimiting() — nunca throttle:N,M inline. Caso novo = novo RateLimiter::for() no provider + entrada no teste de contrato AuthRouteThrottleTest.

## `POST login` fica sem throttle de rota de propósito
É a única rota do grupo `guest` sem middleware de limite, e não é esquecimento: o limite dela mora no `LoginRequest` e é por **`email|ip`**, não por IP. Não acrescente `throttle:auth` ali — o limiter `auth` conta só por `$request->ip()`, então ele transformaria a defesa em arma, deixando um atacante trancar todo mundo que compartilha a mesma saída NAT. As quatro propriedades do lockout (senha correta segue recusada durante o bloqueio; as duas metades da chave importam; sucesso zera o contador; o evento `Lockout` dispara) estão travadas em `tests/Feature/Auth/LoginLockoutTest.php` — mexeu no `LoginRequest`, é lá que a conta é prestada.

## Rota de escrita autenticada declara autorização na própria rota
Toda rota POST/PUT/PATCH/DELETE sob `auth` carrega `can:<permissão>` (ou o atributo `#[Authorize]`, que o L13 também aceita). Throttle não é autorização: uma rota com `throttle:` e sem `can:` está aberta a qualquer usuário logado. A única exceção é self-service — ação que o usuário só exerce sobre a própria conta — e ela precisa entrar em `selfServiceWriteRoutes()` de tests/Feature/Routes/WriteRoutesAuthorizationTest.php, que valida a allowlist nos dois sentidos.
