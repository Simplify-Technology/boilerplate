---
paths:
  - 'routes/**'
---

# Routes

## Throttle sempre via limiter nomeado
Toda rota com rate limit usa limiter nomeado (throttle:auth, throttle:impersonate, throttle:verification) definido em AppServiceProvider::configRateLimiting() — nunca throttle:N,M inline. Caso novo = novo RateLimiter::for() no provider + entrada no teste de contrato AuthRouteThrottleTest.
