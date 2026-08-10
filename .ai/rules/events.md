---
paths:
  - 'app/Events/**'
---

# Events

## Events só para efeitos colaterais transversais
Use events+listeners apenas para efeitos colaterais transversais (audit/activity log, guarda de e-mail, broadcast); o fluxo de negócio chama services diretamente. Dispare com event(new X) — nunca X::dispatch() — e confie na auto-descoberta de listeners em App\Listeners, sem registro manual.
