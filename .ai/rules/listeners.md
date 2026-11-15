---
paths:
  - 'app/Listeners/**'
---

# Listeners

## Events só para efeitos colaterais transversais
Listeners em App\Listeners são auto-descobertos — nunca os registre manualmente (Event::listen em provider causaria dispatch duplicado). Use listeners só para efeitos transversais (auditoria, guarda de e-mail); fluxo de negócio chama services diretamente.

## Sanitização de JobFailed precede os consumidores do Horizon
Exceção estreita à auto-descoberta: SanitizeFailedQueryException é registrado em AppServiceProvider::register(), antes de o Horizon registrar consumidores de JobFailed no boot. Seu método chama-se sanitize, sem handle*/__invoke, para não ser descoberto em duplicidade; teste exige registro único e ordem anterior a MarshalFailedEvent. Ele substitui só a apresentação textual de event.exception, nunca a exceção original do worker; não reutilize RedactedQueryException como substituta para relançar ou para SDKs que inspecionem o trace.
