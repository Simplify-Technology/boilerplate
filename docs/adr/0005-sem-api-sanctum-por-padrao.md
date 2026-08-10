# ADR 0005 — Sem API/Sanctum por padrão

**Status:** aceito

## Contexto

O boilerplate é um monólito Inertia: o React é servido pelo próprio Laravel e autenticado por **sessão** (cookies + CSRF). Nenhum dos forks precisou de API pública ou tokens no dia zero. Instalar Sanctum e rotas `api.php` "por via das dúvidas" cria superfície de manutenção e segurança sem consumidor real.

## Decisão

Não incluir API REST nem Sanctum por padrão. Toda a comunicação frontend↔backend passa pelo Inertia com sessão.

## Consequências

- Menos rotas, menos middleware, menos vetores de ataque; autorização concentrada em gates/policies.
- Quando um projeto precisar de API (mobile, integrações), o caminho é: `php artisan install:api` (Sanctum + `routes/api.php`), versionar a API (`/api/v1`), usar API Resources e proteger com `auth:sanctum` — reaproveitando os mesmos gates/policies do RBAC.
- Consumo third-party de webhooks/rotas pontuais pode usar rotas assinadas ou middleware de token simples antes de justificar Sanctum completo.
