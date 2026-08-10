---
paths:
  - 'app/Listeners/**'
---

# Listeners

## Events só para efeitos colaterais transversais
Listeners em App\Listeners são auto-descobertos — nunca os registre manualmente (Event::listen em provider causaria dispatch duplicado). Use listeners só para efeitos transversais (auditoria, guarda de e-mail); fluxo de negócio chama services diretamente.
