---
paths:
  - '.github/workflows/**'
---

# Workflows

## Workflow: action pinada por SHA, toolchain igual ao repo e SARIF fork-safe
Toda `uses:` é pinada pelo SHA completo do commit com o comentário da versão (`actions/checkout@3d3c42e… # v7.0.1`); quem avança o pin é o Dependabot (`github-actions` em `.github/dependabot.yml`), não a mão. O workflow declara `permissions: contents: read` no topo e `concurrency` com `cancel-in-progress` por `github.ref`, e não usa `paths-ignore` de propósito: com required checks no branch protection, PR só de docs ficaria preso em "waiting for status". PHP segue o `require.php` do `composer.json` (matriz `[ 8.4 ]`), com `sqlite, pdo_sqlite` no setup — a suíte roda em SQLite `:memory:` — e `pdo_mysql` + service MySQL só para o gate de migrations, que existe para pegar migration incompatível com o dialeto de produção; `composer validate --strict` roda antes do install e o cache do Composer é chaveado pelo `composer.lock`. Node/pnpm: `corepack enable` + `corepack prepare pnpm@<versão> --activate` com a MESMA versão do `packageManager` e do `.mise.toml`, store do pnpm em cache chaveado por `pnpm-lock.yaml`, `pnpm install --frozen-lockfile` com `HUSKY: 0`, e testes JS por `pnpm run ci:test` (é o script que exporta `LARAVEL_BYPASS_ENV_CHECK=1`), nunca `vitest` cru. `semgrep.yml` gera `semgrep.sarif`, publica como artifact e sobe para o Code Scanning com `permissions.security-events: write`; o upload é condicionado a PR do próprio repositório, porque token de fork não tem essa permissão.
