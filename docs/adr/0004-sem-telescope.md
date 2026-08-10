# ADR 0004 — Sem Telescope

**Status:** aceito

## Contexto

O Laravel Telescope é a ferramenta clássica de debug/observabilidade local, mas duplica o que já temos instalado: Pail (tail de logs no `composer dev`), opcodesio/log-viewer (UI de logs, restrita a `super_user`), Horizon (filas/jobs com snapshot agendado) e LaraDumps (dump/debug interativo em dev). Telescope ainda adiciona migrations, coleta de dados sensíveis e mais um painel para proteger.

## Decisão

Não incluir o Telescope. A stack de observabilidade local do boilerplate é: **Pail + Log Viewer + Horizon + LaraDumps**. Erros em produção são tratados por tracking dedicado (ver ADR 0006).

## Consequências

- Menos migrations, menos superfície de ataque, menos um painel com controle de acesso.
- Não há timeline unificada de requests/queries como no Telescope; para investigar queries usa-se LaraDumps/logs.
- Se um debug pontual exigir Telescope, instale localmente no projeto e não versione a decisão sem ADR.
