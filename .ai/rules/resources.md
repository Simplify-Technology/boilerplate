---
paths:
  - 'app/Http/Resources/**'
---

# Resources

## Relações em Resources só via whenLoaded()
Em Resources, exponha relações exclusivamente via whenLoaded() (e relationLoaded() para aninhadas) — nunca acesso incondicional. Ao resolver coleções manualmente use resolve(), não toArray(), para que relações não carregadas sejam omitidas; declare public bool $preserveKeys = true.

## Campo sensível passa por policy, e a régua não mora no Resource
Permissão diz *se a tela abre*; ela não diz *quanto daquela linha a pessoa pode ler*. `manage_users` vai para `manager` (70) na matriz do seeder, então um Resource que devolvesse CPF, telefones e notas internas sem condicional entregava a PII do administrador (90) ao gerente — foi exatamente o que aconteceu com o `UserResource`, com o teto de autoridade existindo só a partir de `update()`. Campo sensível novo nasce atrás de `Gate::forUser($request->user())->allows('viewSensitive', $this->resource)`. A régua fica na policy, nunca inline no Resource: um só lugar responde "quem manda em quem", e é ele que resolve o **ator real** por trás de uma impersonation (`effectiveActor()`), porque a permissão se lê na persona mas o teto é do humano. Prefira **mascarar** a omitir quando o campo serve para reconhecer a linha (`CpfFormatter::mask()`), e cubra o par: quem vê e quem não vê.
