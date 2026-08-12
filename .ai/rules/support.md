---
paths:
  - 'app/Support/**'
---

# Support

## Helpers em app/Support: final, estáticos, puros
Helpers transversais vivem em app/Support/<Contexto>/ como `final class` com métodos estáticos puros e null-safe (entrada ?string → retorna null para vazio/null). Não crie helpers com estado, singletons ou funções globais; siga o estilo de CpfFormatter/PhoneNormalizer.

## PiiScrubber: o que ele alcança e o que não
O scrubber tem duas camadas — chave e padrão — e ambas rodam ANTES do formatter do Monolog. Consequências práticas ao logar:

- **Objeto no contexto só é varrido se for `Arrayable`** (model, Collection, resource, DTO que implemente). Qualquer outro objeto atravessa intacto e o formatter o serializa depois que a defesa já passou — foi assim que `['user' => $user]` gravava nome, CPF formatado e notas internas em claro. DTO novo que possa carregar PII implementa `Arrayable`.
- **`Throwable` em `['exception' => $e]` está fora de alcance**: mensagem e trace são renderizados pelo formatter, e nenhum processor os vê. Medido. Não coloque PII em mensagem de exception.
- **Chave sensível tem duas listas, e a divisão é deliberada.** `SENSITIVE_KEY_PARTS` casa por substring e só recebe termo inequívoco (`cpf`, `email`, `phone`, `token`, `password`, `address`…), o que cobre a família composta (`user_email`, `billing_address`). `SENSITIVE_KEYS` casa por igualdade e guarda os ambíguos: `name` (senão `role_name`, `permission_name` e `file_name` somem do log, e o RBAC registra os dois primeiros o tempo todo), `rg` (dentro de "o**rg**anization"), `auth` (dentro de "**auth**or"), `cep` (dentro de "ex**cep**tion"), `session`, `mobile`. **Ao acrescentar termo à lista de substring, procure-o dentro de palavras comuns de log antes** — um falso positivo aqui apaga a informação que ia depurar o incidente.
- Coluna sensível nova no model entra na lista **e** ganha caso no `LogScrubbingTest`; `user_notes` é o precedente.
