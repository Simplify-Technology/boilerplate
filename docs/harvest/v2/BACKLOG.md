# Harvest v2 — BACKLOG

Candidatos **aprovados na verificação adversarial**, priorizados por impacto × generalidade ÷ risco.

Classificação: `[absorver]` · `[guard-rail]` · `[dep-nova]` (exige aprovação do dono) · `[proposta-adr]` · `[rejeitado]`

> Nenhuma evidência aqui pode conter segredo ou PII. Valores sensíveis vão redigidos com `***`.

## Aplicáveis agora

_(vazio — varredura ainda não começou)_

## Multi-fonte — aguardando comparação

Candidato cujo tema aparece em mais de um projeto só vira fatia depois que as células equivalentes dos demais projetos-fonte forem varridas.

| Tema | Fontes conhecidas | Células que faltam | Vencedor | Porquê |
| ---- | ----------------- | ------------------ | -------- | ------ |
| Dinheiro | `MoneyHelper` (ctfinance) × `currency.ts` (sorteiopix) × `MoneyCast` (cuidari) × `Money.php` (spinmax) × kit atual do boilerplate (`app/Casts/MoneyCast.php`, `app/ValueObjects/Money.php`, `app/Rules/MoneyString.php`, `resources/js/utils/format/money.ts`) | todas | — | — |
| PWA | ctfinance × sorteiopix | todas | — | — |
| Billing / cliente Asaas | ctfinance × ctvitrine × enum de provider (cuidari) | todas | — | — |
| Multi-tenant | ctjuris × cuidari | todas | — | — |
| Webhooks | inbox (spinmax) × assinatura (ctfinance/ctvitrine) | todas | — | — |
| Auditoria impersonation-aware | sorteiopix × `app/Resolvers/ActivityCauserResolver.php` (boilerplate) | todas | — | — |
| Tooling de a11y | ctjuris × spinmax | todas | — | — |
| i18n / `lang` | ctfinance × ctjuris × sorteiopix × spinmax | todas | — | — |

## `[dep-nova]` — represados aguardando aprovação do dono

| Pacote | Origem | Para quê | Fatia dependente |
| ------ | ------ | -------- | ---------------- |
| — | — | — | — |

## `[proposta-adr]` — conflitam com decisão vigente

| Achado | ADR em conflito | Proposta |
| ------ | --------------- | -------- |
| — | — | — |

## `[rejeitado]` — registrados para não re-descobrir

| Achado | Origem | Motivo |
| ------ | ------ | ------ |
| — | — | — |
