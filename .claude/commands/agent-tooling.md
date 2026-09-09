---
description: Rodada agent-tooling — varredura do setup de agentes (Claude Code) no boilerplate e nos projetos derivados; aplica só o que tem ganho comprovado, sem colidir com /harvest-v2 nem com o PLAYBOOK de migração
argument-hint: "[KIT_DIR=<path>] [continue]"
---

# /agent-tooling — setup de agentes: diagnosticar, provar ganho, aplicar o mínimo

Pode usar orquestração multi-agente (ultracode) na Fase A para o inventário paralelo dos repositórios. Fora disso, um agente basta — esta rodada é cirúrgica, não uma harvest.

## Missão

Fazer com que o Claude Code trabalhe com as convenções, os portões e os limites que os repositórios **já têm**, e que cada dev (Cristiano + 2 juniores) receba isso no clone, sem configuração manual. Dimensão única desta rodada: **tooling de agente** — CLAUDE.md, `.claude/` (settings, hooks, rules, skills, commands), Boost (`boost.json`, `.mcp.json`, AGENTS.md), plugins, padrões de segurança do agente, integração com husky/CI.

Não é rodada de features, deps, UX ou arquitetura. Achado fora da dimensão vai para o BACKLOG do `/harvest-v2` (se pertencer a projeto-fonte → boilerplate) ou para o gap-report do PLAYBOOK (se boilerplate → projeto). Nunca é aplicado aqui.

## Fronteiras com o que já está em andamento

| Trilho | Direção | Onde vive | O que esta rodada faz com ele |
| ------ | ------- | --------- | ----------------------------- |
| `/harvest-v2` | projetos → boilerplate, 8 dimensões, projetos read-only | `docs/harvest/v2/` em branch/worktree próprio; PRs `*-harvest-v2-*` | Lê STATE/BACKLOG; **não reabre célula, não aplica candidato dele**. Registra nesta rodada que a "dimensão agente" foi coberta aqui, para o harvest não repetir. Se o hook de gate afetar o loop dele, ajusta o texto do comando (Fase C). |
| PLAYBOOK de migração | boilerplate → projetos, 7 fatias por projeto, alvo congelado | `docs/migration/PLAYBOOK.md`, `docs/migration/projects/<p>.md`, `scripts/migration/status.sh` | Kit de agente entra como item da **Fatia 2** (já recomenda copiar `.ai/rules` + CLAUDE.md antecipando a 6-docs). Projeto só recebe o kit por PR de fatia, respeitando a ordem e o estado do gap-report. |
| ADRs | decisões vigentes | `docs/adr/` | Nada aqui conflita; se conflitar, `[proposta-adr]` e parar. |

Princípio 4 do PLAYBOOK (alvo parado): o kit de agente **não muda stack nem convenção de código**; é tooling. Ainda assim, registre no §1 do PLAYBOOK uma nota datada quando o kit entrar na Fatia 2, como foi feito em 2026-08-10.

## Ponto de partida — hipóteses de 2026-09-08 (verificar no repo, não confiar)

Sessão anterior leu o boilerplate e produziu um kit (`KIT_DIR`, default `~/workspace/laravel/_kits/claude-setup`): `.claude/settings.json`, `.claude/hooks/ci-gate.sh`, `.claude/hooks/guard-git.sh`, `.claude/security-patterns.json`, `.claude/claude-security-guidance.md`, `APLICAR.md`. Cada hipótese abaixo tem a evidência que a sustentou; **re-colete a evidência no HEAD atual** antes de classificar.

| # | Hipótese | Evidência de origem | Como re-verificar |
| - | -------- | ------------------- | ----------------- |
| H1 | `.ai/rules/` (24 arquivos, `paths:`) não é lido pelo Claude Code | `grep -rn "ai/rules" CLAUDE.md AGENTS.md` vazio; `vendor/laravel/boost/src` só escreve (`RecordRule`); não existe `.claude/rules/` | repetir os greps; `ls .claude/rules`; numa sessão, abrir um controller e rodar `/context` — `controllers.md` não aparece |
| H2 | Gate determinístico existe fora do agente, não dentro | `.husky/pre-push` roda os dois `ci:check`; `ci.yml` + `semgrep.yml`; CLAUDE.md "Definition of done" é texto | confirmar hooks e workflows; confirmar que não há `hooks` em `.claude/settings*.json` |
| H3 | `.claude/settings.local.json` é o único settings (pessoal); juniores não herdam nada | `git ls-files .claude` só lista `skills/` | `git ls-files .claude`; `ls .claude` |
| H4 | `.claude/commands/harvest-v2.md` não está commitado | `git ls-files .claude/commands` vazio | idem |
| H5 | CLAUDE.md desatualizado em 2 linhas: `ci:check` omite PHPStan; falta formato de commit `[<issue>]: tipo(escopo): resumo` exigido pelo `commit-msg` | `composer.json` `ci:check` inclui `ci:stan`; `.husky/commit-msg` | ler os três arquivos |
| H6 | `security-guidance` v2.x não tem padrão PHP built-in; custa modelo por turno (Stop) e por commit | docs oficiais + `hooks/patterns.py` do plugin | `claude plugin details security-guidance@claude-plugins-official` ou ler a doc; conferir versão instalada |
| H7 | `.cursor/rules/*.mdc` com `alwaysApply: true` (activitylog, node-scripts, github-actions) também são invisíveis ao Claude | `ls .cursor/rules` | ler frontmatter |
| H8 | Nos projetos derivados o setup de agente é heterogêneo e nenhum tem o kit | não verificado — é a Fase A | inventário por projeto |

## Fase 0 — Preflight (1ª invocação e todo `continue`)

1. **Acesso:** `ls <path>/composer.json` para os 7 derivados (tabela do `/harvest-v2`; spinmax tem raiz em `clients/spinmax/app`). Falha ⇒ PARE: reiniciar com `claude --add-dir ~/workspace/laravel`. Nunca marque projeto com base em leitura negada.
2. **Versões e ferramentas:** `claude --version` (anote — `.claude/rules` com symlink e `if:` em hooks são recursos recentes; se a doc indicar mínimo, compare), `gh auth status`, `corepack pnpm -v`, `python3 --version` (≥ 3.10 para o security-guidance), `which intelephense typescript-language-server`.
3. **Reconciliação com o que está em andamento:**
   - `git status`, `git branch --list '*harvest-v2*' '*agent-tooling*'`, `gh issue list --search "harvest-v2 OR agent-tooling"`, `gh pr list --search "harvest-v2 OR agent-tooling"`.
   - Se existir worktree/branch de estado do harvest, leia `docs/harvest/v2/STATE.md` e `BACKLOG.md` lá (read-only nesta rodada) — anote fatias abertas e se alguma toca `.claude/`, `CLAUDE.md`, `.ai/rules` ou hooks. Se tocar, esta rodada **espera** essa fatia ou coordena com ela; nunca abre PR concorrente no mesmo arquivo.
   - `scripts/migration/status.sh` — estado das fatias por projeto. Define quem pode receber o kit (Fase B, item D3).
4. **Medir o custo do gate antes de prometer:** `time vendor/bin/pest --parallel` e `time vendor/bin/pint --test --dirty` no boilerplate. Grave os números. Se pest > ~60 s, o hook de Stop precisa de ajuste (ver Fase B, B3) antes de ser proposto como está.
5. **Estado desta rodada:** issue única `gh issue create --title "agent-tooling: rodada 1"` com checklist (H1–H8, D1–D4, C1–C4). Estado vive no corpo da issue (`gh issue edit`) e em comentários — não crie diretório de estado no repo; a rodada é bounded.

## Fase A — Diagnóstico (read-only em tudo; termina em relatório e PARA)

### A1. Boilerplate

Para cada hipótese H1–H8: evidência nova (comando + saída redigida) → veredito `confirmada` / `parcial` / `refutada` / `já resolvida` (alguém aplicou desde então — verifique `git log --since=2026-09-08 -- .claude CLAUDE.md .ai .gitignore`). Além das hipóteses, uma varredura curta e única: `.claude/skills/*` (alguma skill contradiz `.ai/rules` ou CLAUDE.md? duplicadas com o AGENTS.md?), `boost.json` (agentes/skills coerentes com o que existe no disco em `.claude/`, `.codex/`, `.cursor/`, `.agents/`?), `.github/copilot-instructions.md` (cópia do AGENTS.md — está na versão atual?). Não é auditoria de conteúdo das rules — é só coerência de caminho e carga.

### A2. Sete projetos derivados (read-only operacional, como no `/harvest-v2`: só leitura de arquivos e git read-only)

Um fan-out por projeto, no HEAD atual, gravando uma tabela por projeto:

`CLAUDE.md` (existe? linhas? referencia AGENTS.md? tem "Definition of done"?) · `AGENTS.md`/Boost (`boost.json`, `.mcp.json`, versão de `laravel/boost` no lock, skills geradas) · `.ai/rules/` (existe? quantos? algum específico do domínio que o boilerplate não tem — isso é candidato de **harvest**, registre para o BACKLOG do `/harvest-v2`, não aplique) · `.claude/` (settings, hooks, commands, skills, rules) · `.cursor/`, `.codex/`, `.github/copilot-instructions.md` · husky/`ci:check` presentes (pré-requisito do gate) · `.github/workflows` de review por IA (algum projeto já usa `claude-code-action`? evidência) · fatia atual no gap-report.

Pergunta dupla, como no harvest: **(a)** o projeto tem algo de tooling de agente melhor que o boilerplate? → candidato `[harvest]` (vai para o BACKLOG do `/harvest-v2` com path@SHA). **(b)** o que do kit faz sentido aqui e quando (qual fatia)? → candidato `[propagar]` com pré-requisitos.

### A3. Outros repositórios do workspace (inventário, sem ação)

`~/workspace/laravel/{claw-code,fintrack,opensquad,test-squadpack}` e `~/workspace/laravel/clients/{digisonic,tz-editora}` (paths de 2026-08-11 — confirme com `ls`). Uma linha por repo: é Laravel? deriva do boilerplate? tem CLAUDE.md? Recomendação de uma linha (`fora do escopo` / `candidato a derivado no PLAYBOOK` / `só CLAUDE.md mínimo`). Nada é aplicado neles nesta rodada.

### A4. Relatório e parada obrigatória

Poste como comentário na issue e imprima no terminal: (1) tabela H1–H8 com veredito e evidência; (2) tabela dos 7 derivados; (3) inventário dos outros; (4) **lista de itens propostos para a Fase B, cada um com a régua abaixo preenchida**; (5) lista `[rejeitado]` com motivo de uma linha (para não redescobrir); (6) o que foi encaminhado ao `/harvest-v2` e ao PLAYBOOK. **PARE e aguarde aprovação item a item do dono.** Sem aprovação explícita, a Fase B não começa — nem para item "óbvio".

## Régua de decisão — um item só entra se responder às seis

1. **Lacuna provada:** comando/saída que mostra o problema no HEAD atual (não a evidência de 08/09).
2. **Mecanismo verificado na doc atual**, não em memória: `code.claude.com/docs` (memory, hooks, settings, plugins, security-guidance) ou `search-docs` do Boost. Recurso que a doc não confirma não entra.
3. **Ganho nomeado:** que falha deixa de acontecer ou que custo some — em uma frase concreta ("agente encerra turno com pest vermelho"; "24 rules nunca carregam"). "Boa prática" não é ganho.
4. **Nada existente já cobre:** husky, CI, Semgrep, Boost, skill, ADR, Arch test. Se cobre, `[rejeitado: já coberto por X]`.
5. **Custo e risco com mitigação:** tokens/turno, segundos por Stop, setup por dev, chance de bloquear trabalho legítimo, chance de loop. Sem mitigação escrita, não entra.
6. **Reversível em um commit** e sem tocar código de aplicação.

Empate ou dúvida ⇒ `[adiado]` com o que faltou provar. A rodada mede-se pelo que **não** aplicou com razão registrada, tanto quanto pelo que aplicou.

## Fase B — Aplicação (só itens aprovados; 1 tema = 1 issue-filha = 1 branch = 1 PR)

Branch a partir de `origin/main` com ID de issue (`<id>-agent-tooling-<tema>`); nunca em `main`; commit `[<id>]: tipo(escopo): resumo`; gates `composer ci:check` + `corepack pnpm ci:check` verdes; **merge é do dono** — estado terminal do agente é PR aberto. Nunca `SKIP_GIT_HOOKS`/`--no-verify`; hook falhando por ambiente ⇒ reporte e pare.

Ordem por ganho ÷ risco (aplique apenas os aprovados, nesta ordem):

- **B1 — rules visíveis.** `mkdir -p .claude/rules && ln -s ../../.ai/rules .claude/rules/conventions`; opcionalmente converter os `.cursor/rules/*.mdc` `alwaysApply` em `.claude/rules/*.md` (frontmatter `globs:`→`paths:`; sem `paths` = carrega sempre — só faça se o conteúdo ainda for verdadeiro; fact-check contra o código). **Prova no PR:** saída do `/context` antes/depois (Memory files) e/ou hook `InstructionsLoaded` logando `conventions/controllers.md` ao abrir um controller. Sem essa prova, PR não abre.
- **B2 — CLAUDE.md, duas linhas** (H5) + commitar `.claude/commands/harvest-v2.md` (H4) se o dono confirmar que ele deve ser compartilhado. Sem reescrever o resto do CLAUDE.md.
- **B3 — settings compartilhado + hooks.** Copiar do `KIT_DIR`: `.claude/settings.json` (`enabledPlugins` do `claude-plugins-official`: security-guidance, feature-dev, pr-review-toolkit, commit-commands, php-lsp, typescript-lsp; `enabledMcpjsonServers: ["laravel-boost"]`; hooks), `.claude/hooks/ci-gate.sh` e `guard-git.sh` (`chmod +x`), `.gitignore` += `.claude/.ci-gate/`. Antes de commitar, **teste no repo real**: sessão nova → editar um teste para falhar → tentar encerrar → o Stop deve bloquear com o motivo; corrigir → libera; encerrar sem mudar código → libera em ms; `git commit --no-verify` deve ser barrado. Ajustes permitidos: se pest medido na Fase 0 passou de ~60 s, trocar por subconjunto por diretório tocado ou aumentar `timeout`; se o dono não quiser LSP, remover as duas entradas (exigem binário global). Registre no PR os tempos medidos.
- **B4 — segurança com sotaque Laravel.** `.claude/security-patterns.json` e `.claude/claude-security-guidance.md` do kit. **Fact-check obrigatório** de cada padrão contra `app/` (nomes de métodos, traits, serviços, chaves de cache) e de cada frase do guia contra CLAUDE.md, `.ai/rules` e ADRs — frase que não tiver origem no repo sai. Validar JSON e regexes (Python `re`). Definir `SECURITY_REVIEW_MODEL` via `env` no settings compartilhado apontando para o Sonnet vigente (ID pela doc de modelos, não de memória) — custo é a armadilha mais provável desta fatia.
- **B5 — derivados (D3).** Só projetos cujo gap-report mostra Fatia 2 ✅ ou em andamento (hoje o candidato é `transitado-em-julgado`; confirme no `status.sh`). Para cada um: PR de fatia **no próprio projeto** (branch com issue do projeto, título "Fatia 2 — kit de agente"), copiando B1–B4 adaptados (rules do projeto, não do boilerplate; patterns só se o domínio tiver os mesmos métodos — senão subconjunto genérico) e marcando o checkbox no gap-report do boilerplate. Projetos antes da Fatia 2 **não recebem nada** — falta o `ci:check` que o gate chama. spinmax não recebe nesta rodada em nenhuma hipótese (é o último do PLAYBOOK).

Cada PR: origem (`agent-tooling: KIT_DIR/…` ou hipótese Hn), evidência antes/depois, tempos, o que foi deixado de fora e por quê.

## Fase C — Handoff (docs; PR próprio, pequeno)

- **C1 — PLAYBOOK §3 Fatia 2** ganha o bullet "kit de agente" (arquivos, pré-requisito `ci:check`, prova de carga das rules) e a Fatia 6-docs referencia-o; **§1** recebe nota datada explicando por que tooling de agente entrou fora do re-congelamento. **§4** ganha as traps desta rodada (ex.: `.ai/rules` não carrega sem `.claude/rules`; hook de Stop precisa de anti-loop; `security-guidance` custa modelo por turno).
- **C2 — gap-reports** dos 7: linha "kit de agente" na Fatia 2 (⬜/✅ conforme B5).
- **C3 — `/harvest-v2`**: no `BACKLOG.md` do estado (branch dele), os candidatos `[harvest]` de tooling encontrados na A2 (path@SHA, redigidos); no `STATE.md`, nota "dimensão agente coberta pela rodada agent-tooling em <data>, issue #N". Se B3 foi aplicado, ajustar o **Guardrail 7** do comando: com `guard-git.sh`, o agente não consegue `SKIP_GIT_HOOKS=1` — a exceção de ambiente passa a ser executada pelo dono, registrada no STATE.md. Esses commits vão na branch de estado do harvest, nunca em PR de fatia (regra dele).
- **C4 — fechamento na issue:** aplicado / adiado / rejeitado, com links de PR; medições (tempo de Stop, BLOCKs na primeira semana se houver); e os dois números a acompanhar em 30 dias: bugs em staging por PR e tempo abrir→merge.

## Guardrails

1. Derivados e "outros repos" são **read-only operacional** (só leitura e git read-only); a única escrita permitida neles é o PR de fatia do B5, e só nos que a Fase 0 qualificou.
2. Nunca `php artisan`, `composer install/update`, `pnpm install/build` fora do boilerplate e do worktree do PR de fatia. Nunca ler `.env*` dos projetos (só `.env.example`); evidência sem segredo nem PII (`***`).
3. `AGENTS.md` não se edita à mão (Boost regenera). Se estiver defasado, registre — é assunto do `/harvest-v2` (Guardrail 4 dele).
4. Sem dependência nova de projeto (composer/npm). Plugins do marketplace oficial e binários globais de LSP não são dependência de projeto, mas **entram no relatório como custo de setup por dev** e só com aprovação.
5. Nada é aplicado sem passar pela régua e pela aprovação item a item. "Faz sentido" não é critério; a régua é.
6. Fatia pequena; PR gigante proibido; um arquivo de config por tema quando possível.
7. Toda afirmação sobre comportamento do Claude Code (o que carrega, quando um hook dispara, exit codes) vem da doc atual, citada no PR. Comportamento observado ≠ comportamento documentado: se divergirem, registre os dois.

## Modo de execução

Argumento recebido: $ARGUMENTS

- `KIT_DIR=<path>` sobrescreve o default do kit.
- **Sem `continue`:** Fase 0 → Fase A completa → relatório → **PARA** aguardando aprovação.
- **`continue`:** Fase 0 (reconciliação) → executa **um** item aprovado da Fase B ou C → atualiza a issue → para com report de 5 linhas: o que fez, evidência/medição nova, próximo item, itens restantes, PRs abertos.
