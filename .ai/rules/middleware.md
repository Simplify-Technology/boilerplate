---
paths:
  - 'app/Http/Middleware/**'
---

# Middleware

## Contrato de shared props do Inertia
Dados globais são compartilhados só em HandleInertiaRequests::share: auth = {user, permissions e roles como arrays de nomes string, impersonating} e flash = {success,error,warning,info} lidos com session()->pull(). Tipe toda prop compartilhada nova em SharedData (resources/js/types/index.d.ts).
