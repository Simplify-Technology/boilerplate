---
paths:
  - 'app/Support/**'
---

# Support

## Helpers em app/Support: final, estáticos, puros
Helpers transversais vivem em app/Support/<Contexto>/ como `final class` com métodos estáticos puros e null-safe (entrada ?string → retorna null para vazio/null). Não crie helpers com estado, singletons ou funções globais; siga o estilo de CpfFormatter/PhoneNormalizer.
