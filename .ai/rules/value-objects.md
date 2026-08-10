---
paths:
  - 'app/ValueObjects/**'
---

# Value Objects

## Dinheiro: Money VO em centavos inteiros; nunca float
Dinheiro é sempre centavos inteiros dentro do Money VO — nunca float. Persista com MoneyCast (decimal 12,2), valide entrada com a rule MoneyString, trafegue string decimal "1234.56" e faça TODA matemática monetária no servidor; o front (resources/js/utils/format/money.ts) apenas formata para exibição.
