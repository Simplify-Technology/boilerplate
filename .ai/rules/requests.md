---
paths:
  - 'app/Http/Requests/**'
---

# Requests

## Autorização em camadas redundantes
Form Requests de escrita implementam authorize() com $this->user()->can(...) mesmo quando a rota já tem middleware can: e o controller re-autoriza — a autorização é em camadas redundantes por convenção.

## Form Requests com messages() em pt-BR
Todo Form Request define messages() com mensagens em português (pt-BR) para as regras principais; lang/pt_BR/validation.php serve só de fallback. Faça o mesmo ao criar novos Form Requests.

## Validação de escrita de domínio sempre via Form Request
Novos endpoints de escrita ganham Form Request no subdiretório do domínio (User/, PermissionRole/) com rules(), authorize() via $this->user()->can(Permissions::X) e messages() pt-BR — nunca validação inline no controller.
