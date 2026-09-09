---
paths:
  - 'scripts/**'
---

# Scripts

## Script Node chama binário externo por um helper que falha com mensagem acionável
Script Node em `scripts/` que chama binário externo (`git`, `prettier`, `pnpm`, `php`) não deixa `execFileSync`/`spawnSync` estourar com stacktrace cru: toda chamada passa por um helper único — `execFileSyncOrExit` em `scripts/format/format-dirty.mjs` é o modelo — que escreve no stderr o comando completo, a `error.message` e o `stderr` do processo, e encerra com `process.exit(1)`; `args` é opcional e normalizado para `[]` antes do `join`, e o JSDoc do helper avisa que ele encerra o processo. Para listar arquivos alterados antes de formatar ou lintar, use `git diff --name-only --diff-filter=ACMRU` duas vezes (working tree e `--cached`) e filtre por uma allow-list de extensões, documentando no código que caminho sem `.` é ignorado de propósito.
