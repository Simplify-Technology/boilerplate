---
paths:
  - 'app/Providers/**'
---

# Providers

## Throttle sempre via limiter nomeado
Rate limiters são nomeados e centralizados em AppServiceProvider::configRateLimiting() (Limit::perMinute()->by(user id ?? ip)); as rotas referenciam throttle:<nome>. Nunca espalhe throttle:N,M inline em arquivos de rota.
