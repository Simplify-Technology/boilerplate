---
paths:
  - 'routes/**'
---

# Routes

## Throttle sempre via limiter nomeado
Toda rota com rate limit usa limiter nomeado (throttle:auth, throttle:impersonate, throttle:verification, throttle:password-confirmation) definido em AppServiceProvider::configRateLimiting() — nunca throttle:N,M inline. Caso novo = novo RateLimiter::for() no provider + entrada no teste de contrato AuthRouteThrottleTest. Rota atrás de `auth` chaveia o limiter pelo usuário (`$request->user()->id ?? $request->ip()`), não pelo IP: dentro do painel, chavear por IP tranca colegas que compartilham a mesma saída NAT.

## Rota que confere segredo precisa de teto em ALGUM lugar
O limite pode morar no limiter nomeado da rota ou dentro do próprio FormRequest (é onde vive o do login, por `email|ip`) — mas não pode faltar nos dois. `POST confirm-password` ficou sem nenhum dos dois e aceitava chute ilimitado da senha do PRÓPRIO usuário logado, que é exatamente o segredo que o login protege: sessão sequestrada abria tudo que está atrás de `password.confirm` por força bruta. Ao criar rota que valida senha, token, código ou assinatura, decida onde o teto mora e escreva o teste que prova que ele morde.

## `POST login` fica sem throttle de rota de propósito
É a única rota do grupo `guest` sem middleware de limite, e não é esquecimento: o limite dela mora no `LoginRequest` e é por **`email|ip`**, não por IP. Não acrescente `throttle:auth` ali — o limiter `auth` conta só por `$request->ip()`, então ele transformaria a defesa em arma, deixando um atacante trancar todo mundo que compartilha a mesma saída NAT. As quatro propriedades do lockout (senha correta segue recusada durante o bloqueio; as duas metades da chave importam; sucesso zera o contador; o evento `Lockout` dispara) estão travadas em `tests/Feature/Auth/LoginLockoutTest.php` — mexeu no `LoginRequest`, é lá que a conta é prestada.

## Rota de escrita autenticada declara autorização na própria rota
Toda rota POST/PUT/PATCH/DELETE sob `auth` carrega `can:<permissão>` (ou o atributo `#[Authorize]`, que o L13 também aceita). Throttle não é autorização: uma rota com `throttle:` e sem `can:` está aberta a qualquer usuário logado. A única exceção é self-service — ação que o usuário só exerce sobre a própria conta — e ela precisa entrar em `selfServiceWriteRoutes()` de tests/Feature/Routes/WriteRoutesAuthorizationTest.php, que valida a allowlist nos dois sentidos.
