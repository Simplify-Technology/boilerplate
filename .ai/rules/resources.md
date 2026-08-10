---
paths:
  - 'app/Http/Resources/**'
---

# Resources

## Relações em Resources só via whenLoaded()
Em Resources, exponha relações exclusivamente via whenLoaded() (e relationLoaded() para aninhadas) — nunca acesso incondicional. Ao resolver coleções manualmente use resolve(), não toArray(), para que relações não carregadas sejam omitidas; declare public bool $preserveKeys = true.
