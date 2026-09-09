---
description: Rodada Harvest v2 — re-análise profunda dos 7 projetos derivados e absorção do melhor de cada um no boilerplate, em fatias com gates verdes
argument-hint: "[continue]"
---

# /harvest-v2 — Re-análise profunda + absorção do melhor de cada projeto (ultracode)

ultracode. Use orquestração multi-agente em toda fase substantiva: varredura em paralelo por dimensão, verificação adversarial de cada candidato antes do backlog, crítico de completude antes de fechar projeto. Não economize agente em varredura; economize em burocracia.

## Missão

Re-analisar profundamente os 7 projetos derivados e trazer para o boilerplate o melhor que cada um possui — cada pequena feature, padrão, componente, middleware, fluxo, microcopy — para que o padrão Simplify permaneça o melhor estado conhecido de todos os projetos, otimizado e atual. Depois da análise, APLICAR os vencedores no boilerplate em fatias pequenas com gates verdes, atualizar pacotes/frameworks, e fechar a rodada com re-congelamento do alvo registrado no PLAYBOOK.

Direção desta rodada: **projetos → boilerplate** (harvest). É o inverso do PLAYBOOK de migração (boilerplate → projetos). Consequência: os projetos derivados são **read-only** nesta rodada (ver Guardrail 2 — read-only operacional, não só de intenção); toda escrita acontece no boilerplate e em `docs/`. Durante a rodada, fatias de migração dos derivados (o outro playbook) continuam contra o alvo congelado de 2026-08-10 — o alvo só muda no re-congelamento final desta rodada.

## Projetos-fonte (read-only)

Ordem de varredura por densidade de ativos (mais rico primeiro):

| # | Projeto | Path | Estado (2026-08-10) |
| - | ------- | ---- | ------------------- |
| 1 | ctfinance | ~/workspace/laravel/simplify-technology/ctfinance | L12 + Inertia 2 · SaaS financeiro c/ billing Asaas · criticidade ALTA |
| 2 | spinmax | ~/workspace/laravel/clients/spinmax/app | L12 + Inertia 2 · e-commerce Mercado Pago em produção, dev intenso · criticidade MÁXIMA |
| 3 | sorteiopix | ~/workspace/laravel/simplify-technology/sorteiopix | L12 + Inertia 2 · Pix P2P + Reverb/PWA/push · dormante ~5 meses |
| 4 | ctjuris | ~/workspace/laravel/simplify-technology/ctjuris | L13 + Inertia 2 · PostgreSQL · PII jurídica, piloto com cliente real |
| 5 | ctvitrine | ~/workspace/laravel/simplify-technology/ctvitrine | L13 + Inertia 3 · white-label multi-instância Ploi, em produção |
| 6 | cuidari | ~/workspace/laravel/simplify-technology/cuidari | L13 + Inertia 3 · clínicas/óticas multi-tenant, dev diário ativo |
| 7 | transitado-em-julgado | ~/workspace/laravel/simplify-technology/transitado-em-julgado | L13 + Inertia 3 · piloto da migração (fatias 0–2b ✅), quase-paridade |

Os paths usam `~` por legibilidade — a Fase 0 resolve para caminhos absolutos reais, valida os 7 diretórios e grava os paths resolvidos no STATE.md. Atenção ao spinmax: a raiz Laravel é o subdiretório `app/`; o diretório-pai `clients/spinmax` guarda só anexos e `_to_delete/`.

## Mapa inicial de ativos (dos gap-reports de 2026-08-10 — ponto de partida, NÃO teto)

Ativos já conhecidos. A varredura confirma no código pinado (SHA da Fase 0) e cava ALÉM:

- **ctfinance** — origem de `HandleAppearance`, flash→toast, `resolve-inertia-page` deploy-safe e `FormField` a11y; billing Asaas completo (`AsaasService`, `VerifyAsaasSignature`, `EnsureSubscriptionActive`); fluxo LGPD de exclusão agendada/hard delete; `browser.yml` (gate PR + nightly); PWA via vite-plugin-pwa; Pulse; `AuthRouteThrottleTest`; `lang/pt_BR` mais completo que o do boilerplate; `MoneyHelper` (trap: decimal persistido).
- **spinmax** — checkout Pix/cartão Mercado Pago (dx-php + sdk-react, webhooks em fila, limiter nomeado `mp-webhook`); **webhook inbox** (`webhook_events` com reprocesso/prune); `pest-plugin-browser` + Playwright + `tests/Contract` (sandbox MP); backup GPG→R2 com restore-drill + healthchecks de fila/backup; `check-contrast.mjs`; mail allowlist fora de produção; Resend. Trap: `Cpf.php` HMAC com APP_KEY crua, `cpf_hash` persistido.
- **sorteiopix** — realtime Laravel Reverb (+ doc de deploy); Web Push VAPID + notification center; PWA completo (`lib/pwa.ts`, pull-to-refresh); Socialite Google; `PixKey` (rule + VO); `EntropyProvider` com `bindFixedEntropy()` (aleatoriedade testável); `AuditUserResolver` impersonation-aware sobre owen-it; `TranslationTest` de guarda; `currency.ts` em centavos (trap: `amount_cents` persistido).
- **ctjuris** — stack PII/LGPD (CPF cifrado + `cpf_hash`, scrubbing em logs E Sentry `before_send` PHP+JS); sidecar Node de DOCX em monorepo pnpm (auth por shared secret); multi-tenant próprio (`TenantContext`, global scopes, `PinTenantFromUser`); `tests/Arch` de multi-tenancy; sweep de a11y/motion no Vitest; ViaCEP; intake WhatsApp→caso.
- **ctvitrine** — origem do SHA-pinning e do `minimumReleaseAge`; módulos ativáveis por env (`Ensure*Mode` off/demo/live) com testes de modo; `EnsureTermsAccepted` + `TermsAcceptance` (aceite LGPD auditável hash/ip/ua); `SessionHasher` (pepper com rotação diária); `SafeLinkUrl`; `ImageOptimizer`; clients Asaas/Ploi/Turnstile; Meta Pixel/CAPI first-party; testes-guarda (`EnvExampleGuardTest`, `EnvDocsGuardTest`); ops multi-instância (stubs de env/deploy Ploi).
- **cuidari** — `MoneyCast` (decimal 12,2) + módulo financeiro completo (Payable/Receivable/Payment/LedgerEntry/caixa); suíte `Foundation` de invariantes (config, seeders, tenancy, casts, `SchemaIdentifierLengthTest`); 53 Form Requests + DTOs `final readonly`; billing plugável por enum de provider; dompdf (O.S./PDF); `ToggleActiveController`.
- **transitado-em-julgado** — origem da harvest v1 (RBAC/impersonation); módulo WhatsApp Cloud API; portão de domínio com 404 de assets; helpers de persona de teste (`viajarPara`/`comoIntimada`/`escreverRecado`); `ViagemNoTempoLocal`; conteúdo data-gated com relógio congelado nos testes.

## Leitura obrigatória (1ª iteração)

1. `docs/migration/PLAYBOOK.md` — em especial §4 (armadilhas já pagas) e §5 (definição de pronto).
2. `docs/migration/projects/<projeto>.md` — gap-reports mapeiam a direção oposta (o que falta NO projeto); as seções "Já em conformidade" e "origem da harvest" apontam onde cada projeto é forte.
3. `docs/adr/` — decisões vigentes. Não se viola ADR por achado de varredura; propor NOVO ADR ao dono é o único caminho.
4. `.ai/rules/index.md` + arquivos de área e `CLAUDE.md` — convenções, gates e git do boilerplate.
5. Skill `infer-conventions` (`.claude/skills/infer-conventions/`) — reutilize método e checklist (~49 dimensões) na varredura de convenções de cada projeto.

## Estado persistente — o que torna isto um loop retomável

Tudo em `docs/harvest/v2/`, que vive num **branch dedicado de longa duração** (issue própria; ex.: `<id>-harvest-v2-rodada`), mantido num worktree separado (`git worktree add ../boilerplate-harvest-state <id>-harvest-v2-rodada`) para commitar estado sem trocar de branch no worktree principal. **PRs de fatia NUNCA tocam `docs/harvest/v2/`** — estado e código viajam em branches separados. Commit do estado ao fim de cada unidade; push em lote (a cada ~5 unidades ou no fechamento — o pre-push roda os dois `ci:check`).

- `STATE.md` — paths resolvidos + SHA pinado de cada projeto, matriz projeto × (inventário + 8 dimensões) com status ⬜/🔍/✅, fatias com checkpoints (issue #, branch, testes, gates, PR #), próxima unidade. Toda iteração TERMINA atualizando este arquivo.
- `<projeto>.md` — abre com `## Inventário` (gerado na célula de inventário; as dimensões completam se acharem lacuna); depois achados com evidência (path@SHA + trecho REDIGIDO + veredito adversarial). Célula sem inventário persistido não é declarável ✅.
- `BACKLOG.md` — candidatos aprovados, priorizados por impacto × generalidade ÷ risco, cada um com: origem (projeto/path@SHA), o que absorver, adaptação, fatia proposta, risco, esforço, e — quando multi-fonte — a linha de comparação (fontes concorrentes → vencedor → porquê).
- `RELATORIO.md` — no fechamento: o melhor de cada projeto (absorvido/adiado/rejeitado), links de PR, fontes que evoluíram durante a rodada.

## Fase 0 — Preflight (1ª invocação E todo resume)

1. **Acesso:** para cada projeto da tabela, rode `ls <path>/composer.json`. Qualquer falha ⇒ PARE e reporte ao dono: reiniciar com `claude --add-dir ~/workspace/laravel` (uma raiz cobre simplify-technology/* e clients/*) ou adicionar `permissions.additionalDirectories` no `.claude/settings.local.json`. NUNCA prossiga com varredura parcial nem marque célula com base em leitura negada.
2. **Pin:** `git -C <path> rev-parse --short HEAD` para cada projeto → grave no STATE.md como SHA da rodada (anote working tree suja). Toda varredura/evidência/veredito refere-se a esse SHA. Commits posteriores estão FORA da rodada: registre "evoluiu durante a rodada" no RELATORIO.md e deixe para a próxima harvest. Célula/projeto ✅ jamais reabre por commit novo na fonte.
3. **Ferramentas:** `gh auth status` e `git remote -v` verdes (senão pare e peça `gh auth login`); `corepack pnpm -v` responde.
4. **Estado:** se `docs/harvest/v2/` não existe, crie issue + branch de estado (item acima) e os 3 arquivos-base. Se existe, **reconcilie antes de agir**: `git status`, `git branch --list '*harvest-v2*'`, `gh issue list --search harvest-v2`, `gh pr list --search harvest-v2` — divergência resolve-se a favor do git/GitHub e o STATE.md é corrigido ANTES de executar qualquer unidade.

## A matriz: Inventário + 8 dimensões (por projeto)

**Célula 0 — Inventário (primeira do projeto, obrigatória):** um único fan-out enumera, com paths: módulos, rotas (web/console/broadcast — `routes/channels.php`), middlewares, jobs, commands + scheduler (`routes/console.php`), events/listeners, observers, mails/notifications, policies, Form Requests, rules de validação, casts, enums, exceptions, providers, migrations (schema completo: constraints, índices, tipos), factories/seeders, `config/*` e `.env.example` (diff de chaves vs boilerplate), `lang/`, workflows `.github/`, componentes React, hooks, utils, testes. Grava em `<projeto>.md § Inventário`. **As 8 dimensões CONSOMEM o inventário** e só abrem os arquivos relevantes à sua pergunta — nada de re-listar o disco a cada célula.

A pergunta de cada dimensão nunca é "o que está errado no projeto?" — é dupla: **(a)** o que este projeto faz MELHOR que o boilerplate — ou tem e o boilerplate não tem — que mereça virar padrão? **(b)** que erro/limitação daqui deve virar guard-rail no boilerplate (teste Arch, regra `.ai/rules`, lint, doc)?

### 1. Segurança

- Authn/authz: policies/gates em TODA escrita; caçar IDOR (rotas com `{id}` sem checagem de dono/escopo), mass assignment, autorização re-checada em camadas.
- Middlewares e defesas melhores/além: variações de `SecurityHeaders`/CSP (allowlist de gateway), assinatura de webhook, bloqueio por assinatura/estado, cache headers sensíveis.
- Rate limiting: limiters nomeados + testes de contrato de throttle (padrão `AuthRouteThrottleTest`) — guard-rail clássico.
- LGPD/PII: exclusão/anonimização agendada, scrubbing de logs e Sentry, retenção; uploads (MIME/size, storage privado, URLs assinadas R2).
- Sessão/cookies, redirecionamentos, enumeração de usuários em auth, queries cruas sem binding.

### 2. Arquitetura & engenharia de software

- Camadas e contratos: onde cada projeto resolveu MELHOR o trio controller single-action → FormRequest → Service/DTO/Query; exceptions de domínio; enums; events/listeners; jobs idempotentes com retry/backoff/tags.
- Modelagem de dados e domínio: migrations 1-a-1 além de índices — constraints de integridade (FK com on-delete correto, unique, not-null, checks), tipos de coluna para dinheiro/datas/status, soft-deletes; máquinas de estado (enum de status + transições válidas aplicadas em código); invariantes de domínio testados (padrão da suíte `Foundation` do cuidari — guard-rail para os demais).
- Contrato backend↔frontend: variações superiores de `HandleInertiaRequests::share()` + espelho de tipos TS; resources tipados.
- Testes como engenharia: helpers de persona, states de factory, `Http::fake` de integrações (Asaas, MP, WhatsApp), suíte browser + nightly, testes Arch além dos do boilerplate.
- Análise estática: anotações/generics melhores; nível PHPStan acima.
- Use a skill `infer-conventions` para varrer as convenções REAIS de cada projeto e detectar padrões que o boilerplate ainda não codificou em `.ai/rules`.

### 3. Performance backend

- N+1/eager loading (inclusive `withCount`/`withSum`), índices nas migrations vs boilerplate, paginação em toda listagem.
- Cache: chaves/invalidação melhores que `user:{id}:permissions`; caches de agregados; locks.
- Filas: supervisors/balanceamento do Horizon por perfil de carga, timeouts, `retryUntil`, chunking, exports em fila.
- Transações onde importa (dinheiro!), `lockForUpdate` em saldo/estoque, idempotência de webhooks (inbox do spinmax).
- Payload Inertia: shared props enxutas, partial reloads, nº de queries por página.

### 4. Fluidez & performance frontend

- Inertia v3 bem usado: deferred props + skeleton, prefetch, polling, `WhenVisible`, form helper com progresso; optimistic UI onde os projetos fizeram.
- Boot/tema: variações de `HandleAppearance` (FOUC-zero), `resolve-inertia-page` deploy-safe, tratamento de asset stale (service worker/PWA — candidato E trap).
- Bundle: análise ESTÁTICA (vite.config, imports dinâmicos, dependencies) — é PROIBIDO rodar install/build/test nos projetos-fonte; se um build for indispensável, copie o projeto para `/tmp/harvest-v2/<projeto>` e rode lá.
- Percepção: skeletons consistentes, debounce de busca, scroll restoration, loading por botão (não tela inteira), imagens (lazy, dimensões, formatos).

### 5. UX

- Enumerar os FLUXOS reais (onboarding, CRUD, checkout, billing, sorteio, O.S., LGPD...) e extrair o que cada um resolve melhor: menos passos, melhor recuperação de erro, melhor feedback.
- Formulários: máscaras BR no input, validação inline com foco no erro, preservação de dados em falha, confirmações destrutivas com fricção proporcional.
- Tabelas/listas: padrões de `data-table` (filtros na URL, ordenação, seleção em massa, export), filtros persistentes.
- Estados: vazio com CTA, erro com ação de recuperação, loading com skeleton, sucesso com toast — pipeline flash→toast completo.
- Acessibilidade: `FormField` com a11y real, navegação por teclado nos primitivos, foco visível, contraste (ferramentas: `check-contrast.mjs` do spinmax, sweep a11y do ctjuris).
- Navegação: breadcrumbs, deep-links estáveis, back do navegador, 404/500 amigáveis com saída.

### 6. UI

- Tokens e consistência: theme Tailwind (cores/espaçamento/tipografia/radius) — qual projeto tem o sistema mais maduro; dark mode completo.
- Primitivos: componentes `ui/` que projetos evoluíram além do boilerplate (dialogs, selects, date/money pickers, upload com preview, steppers, charts) — absorver a melhor versão de cada primitivo.
- Variantes com CVA, ícones consistentes, densidade/hierarquia das telas de referência.
- Padronizar skeletons, empty states ilustrados e microinterações já resolvidos por algum projeto.

### 7. Copy & microcopy pt-BR

- `lang/pt_BR` mais completo entre os projetos — absorver o superset; zero strings de UI hardcoded onde o padrão é lang; teste-guarda de tradução (padrão `TranslationTest`).
- Tom de voz consistente; terminologia BR correta (CPF/CNPJ, Pix, boleto, NF-e).
- Os melhores textos reais: validação humana, empty states, confirmações destrutivas, e-mails transacionais, páginas de erro, toasts, CTAs.
- Erros de integração traduzidos para o usuário (Asaas/MP/nfe.io/WhatsApp) em vez de mensagem técnica crua.

### 8. Manutenção, DX & ops

- CI: jobs além do boilerplate (ex.: `browser.yml` gate+nightly), tempos, caches; supply-chain (dependabot, SHA-pinning, `minimumReleaseAge`).
- Ops & resiliência: backups (rotina agendada, cifragem, destino off-site, **restore drill testado** — padrão spinmax), healthchecks (fila, scheduler, backup), alerta de falha de tarefas agendadas, stubs de deploy/env por instância (padrão ctvitrine/Ploi), docs de deploy de serviços stateful (Reverb, Horizon), zero-downtime.
- Observabilidade: Sentry (ADR 0006) — quem integrou melhor (contexto, release, scrubbing `before_send`); candidatos tipo Pulse ⇒ `[proposta-adr]`/`[dep-nova]`.
- DX: scripts `composer dev`/`scripts/` melhores, seeds/factories ricos, `.env.example` completo, docs de agente maduros — reconciliar no formato do boilerplate.
- Docs vivos: `.ai/rules` cobrindo o que for absorvido; ADRs para decisões descobertas.

## Protocolo de iteração

Cada iteração executa UMA unidade de trabalho, nesta prioridade:

0. **Fatia em andamento** (tem checkpoint aberto no STATE.md) — terminar antes de abrir qualquer coisa.
1. Fatia de aplicação pronta no BACKLOG (Fase B) — aplicar antes de acumular, EXCETO tema multi-fonte ainda não comparado (ver abaixo).
2. Célula pendente (Fase A): inventário do próximo projeto, ou próxima dimensão de projeto já inventariado.
3. Fatia de deps/atualização pendente.
4. Fechamento (re-congelamento + docs) quando tudo acima secar.

### Temas multi-fonte — comparar antes de aplicar

Candidato cujo tema aparece em MAIS de um projeto não vira fatia enquanto as células equivalentes dos demais projetos-fonte não forem varridas: compare as implementações concorrentes, eleja o vencedor com linha de comparação registrada no BACKLOG (fontes → vencedor → porquê), só então abra a fatia. Já sabidamente multi-fonte: **dinheiro** (MoneyHelper ctfinance × currency.ts sorteiopix × MoneyCast cuidari × Money.php spinmax × kit atual do boilerplate), **PWA** (ctfinance × sorteiopix), **billing/cliente Asaas** (ctfinance × ctvitrine × enum do cuidari), **multi-tenant** (ctjuris × cuidari), **webhooks** (inbox spinmax × assinatura ctfinance/ctvitrine), **auditoria impersonation-aware** (sorteiopix × ActivityCauserResolver do boilerplate), **a11y tooling** (ctjuris × spinmax), **i18n/lang** (ctfinance × ctjuris × sorteiopix × spinmax).

### Fase A — varredura profunda de uma célula

1. Fan-out sobre o código REAL no SHA pinado, consumindo o inventário; comparação 1-a-1 com o equivalente do boilerplate.
2. Evidência obrigatória: path@SHA + trecho. Candidato sem evidência verificada morre. **Evidência nunca carrega segredo nem PII**: não leia `.env*` dos derivados (só `.env.example`); trechos citados em docs/BACKLOG/PRs não podem conter chaves, tokens, secrets de config nem dados pessoais reais de seeders/fixtures (ex.: seeder de piloto do ctjuris) — cite path + estrutura e redija valores com `***`. `docs/harvest/` é commitado: segredo ali é vazamento consumado.
3. Verificação adversarial (3 lentes por candidato): um verificador tenta REFUTAR (já existe no boilerplate? viola ADR? acoplado ao domínio e não generaliza? custo > ganho?); outro avalia risco de absorção (dados persistidos? comportamento? segurança?); o terceiro confere **ATUALIDADE** via `search-docs` do Boost (docs oficiais/context7 quando faltar): padrão superado por recurso nativo do framework/lib atual vira `[rejeitado]` (obsoleto) ou `[absorver]` com modernização anotada.
4. Classifique: `[absorver]` · `[guard-rail]` · `[dep-nova]` (adiciona dependência ao boilerplate — só com aprovação do dono) · `[proposta-adr]` (conflita com decisão vigente — parar e propor) · `[rejeitado]` (motivo de uma linha, registrado para não re-descobrir).
5. **Secagem bounded:** a passada extra "o que ficou sem olhar?" (diffada contra o inventário) é ÚNICA — candidatos que ela achar seguem o fluxo normal e a célula vira ✅ ao fim dela de qualquer forma. Nunca há 2ª passada extra.

**Crítico de completude do projeto** (após as 8 dimensões): "que módulo/rota/job/scheduled task/mail/export/migration/observer/cast/config ninguém enumerou?" — roda 1× (máx 2× se a 1ª achou algo); achados viram candidatos normais e NUNCA reabrem células; após a última execução o projeto é ✅ incondicionalmente — o que sobrou vive no BACKLOG, não na matriz.

### Fase B — aplicação de uma fatia no boilerplate

1. 1 tema = 1 issue = 1 branch = 1 PR: `NUM=$(gh issue create --title "harvest-v2: <tema>" --body "<origem/escopo>" | xargs basename)`; branch `${NUM}-harvest-v2-<tema>` a partir de `origin/main` (o boilerplate **não tem** branch `develop` — só `main`). Nunca commitar direto em `main`. Grave checkpoints no STATE.md assim que existirem: issue #, branch, "testes escritos", "gates verdes", "PR #". Uma invocação `continue` pode executar apenas o PRÓXIMO checkpoint de uma fatia grande.
2. Antes de codar contra framework/pacote: **docs recentes SEMPRE** — `search-docs` do Boost primeiro (versão-aware); docs oficiais/context7 quando faltar. Nunca confie em memória de treino para API atual.
3. Comportamental ⇒ teste primeiro (feliz + negação, 403/422 quando houver autorização/validação). Gates: `composer ci:check` e `corepack pnpm ci:check` verdes. **Evidência por classe de candidato, além dos gates:** UI/UX/fluidez ⇒ teste de componente (Vitest/Testing Library) ou browser test + screenshot no PR; performance ⇒ métrica antes/depois no PR (KB de bundle, nº de queries); copy ⇒ teste-guarda de tradução cobrindo as chaves novas; a11y ⇒ check-contrast/sweep quando já absorvidos. O boilerplate ainda não tem `pest-plugin-browser` (PLAYBOOK §4): priorize a fatia `[dep-nova]` da suíte browser (fonte: spinmax/ctfinance) para as fatias de UX/UI seguintes terem gate real.
4. Nunca misturar tema com upgrade de deps na mesma fatia (Princípio 2 do PLAYBOOK vale aqui).
5. Na mesma fatia, atualizar o que a mudança tocar: `.ai/rules` (fact-checked contra o código novo), tipos TS espelhando `share()`, README/ADR se estrutural. Antes do commit, varrer o diff por segredos e dados reais (tokens, URLs com credencial, e-mails/CPFs/telefones reais em fixtures/factories/seeds) — dado real ⇒ substituir por sintético (`fake()->cpf()` etc.) na própria fatia.
6. PR referencia a origem (`harvest: spinmax app/...@SHA`) para rastreabilidade. **Merge é sempre do dono** — nunca rode `gh pr merge` nem feche PR próprio. Estado terminal de fatia para o agente: PR aberto com gates verdes.

## Atualização de pacotes e frameworks (fatias próprias, recorrentes)

- Levantamento: `composer outdated --direct`, `corepack pnpm outdated`, `composer audit`, `corepack pnpm audit --prod`.
- Patch/minor: uma fatia "deps" agrupada, lockfiles + smoke + gates. Major: fatia própria POR pacote, com guia oficial de upgrade lido e resumido no PR; se mudar decisão de arquitetura, ADR antes.
- Incluir na primeira fatia de deps: corrigir o pin `typescript ^6.0.3 → ~6.0.3` no boilerplate (mina registrada no PLAYBOOK §4).
- Traps já pagas (PLAYBOOK §4 — reler antes de toda fatia de deps): `minimumReleaseAge: 10080` segura versão recém-publicada (exceção version-scoped com data de remoção anotada); `composer update -w` (nunca `-W`); Vitest 4 não puxa `@types/node`; Prettier pode reformatar `app.css`; shim do mise não resolve em shell não-interativo (`mise exec -- <cmd>`).
- Referência do ecossistema verificada em 2026-08-11 (RE-VERIFIQUE ao rodar — isto envelhece):

| Item | Estável em 2026-08-11 | Nota |
| ---- | --------------------- | ---- |
| laravel/framework | 13.24 | Laravel 14 NÃO existe (~Q1 2027). L12 perde bug fixes em 13/08/2026 — pressão real para as Fatias 3a dos derivados. |
| inertia | @inertiajs/react 3.6.x / adapter 3.3.x | Não existe v4. |
| react / tailwind / vite | 19.2.x / 4.3.x / 8.2.x | Sem v20 / v5 / v9. |
| pest / phpunit | 5.x / 13.3.x | Majors atuais (PHP ≥ 8.4). |
| pnpm | 11.21.x | **pnpm 12 em RC** — major iminente; não adotar sem validar corepack/hooks/CI. |
| Node | 24 LTS | Node 26 vira LTS ~out/2026; bump só quando LTS. |
| typescript | série 6.0.x | TS 7 (compilador Go) é GA, mas typescript-eslint suporta `<6.1` — permanecer em `~6.0.x`. |
| horizon / activitylog | 5.48 / 5.0 | activitylog 5 é major novo (exige L12/13) — boilerplate já em `^5.0` ✓. |
| sentry-laravel | 4.27 | Referência p/ derivados — NÃO está no composer.json do boilerplate (ADR 0006 registra a decisão, não a instalação); instalar aqui é `[dep-nova]`. |

## Guardrails invioláveis

1. **ADRs vigentes** — RBAC próprio sem pacote externo (0001), Ziggy mantido (0002), sem TanStack Query (0003), sem Telescope (0004), sem API/Sanctum por padrão (0005), Sentry para error tracking (0006). Achado que conflita ⇒ `[proposta-adr]`, nunca aplicação direta.
2. **Read-only operacional nos derivados** — apenas leitura de arquivos e git read-only (`log`, `show`, `diff`, `blame`). PROIBIDO qualquer comando que escreva ou execute o app lá: `pnpm/corepack install|build`, `composer install|update`, `php artisan` (qualquer), rodar suítes, `git checkout/fetch/stash/clean`. spinmax e cuidari têm dev ativo — working tree alheia é intocável. Precisou executar? Copie para `/tmp/harvest-v2/<projeto>` e rode lá. Nunca copiar `.env`, credenciais, tokens ou dados de usuário — código sim; segredo jamais (redação `***` em evidências).
3. **Dependência nova só com aprovação** — absorção que adiciona pacote ao boilerplate (Pulse, Reverb, webpush, vite-plugin-pwa, pest-plugin-browser/Playwright, sentry-laravel, dompdf, socialite...) é `[dep-nova]` no BACKLOG e SÓ vira fatia com aprovação explícita do dono (AGENTS.md: dependências não mudam sem aprovação). Atualizar pacote existente está pré-autorizado; adicionar, nunca.
4. **`AGENTS.md` não se edita à mão** — é gerado pelo Boost e é a única cópia (Cursor, Codex, Copilot e, via `@AGENTS.md` no CLAUDE.md, o Claude Code leem o mesmo arquivo; `config/boost.php` fixa esse alvo para o `claude_code`). Fonte de verdade de versão é o LOCKFILE, não o AGENTS.md — se o fact-check apanhar AGENTS.md defasado, o caminho é `php artisan boost:update --no-interaction --no-discover` em fatia própria de docs (o comando também mantém as skills espelhadas por ferramenta), ou registrar no RELATORIO para o dono.
5. **Fact-check** — regra/candidato afirmando fato falso é pior que nada (lição da rodada 1). Verifique cada afirmação no código real antes de gravar em docs ou `.ai/rules`.
6. Absorção de código com dados persistidos nos projetos-fonte (hashers, money, auditoria) NÃO cria obrigação de compatibilidade no boilerplate — mas o BACKLOG anota a trap de migração para a próxima rodada de sincronização (ex.: HMAC de CPF do spinmax/ctjuris com APP_KEY crua × `CpfHasher` canônico com contexto `app:cpf-hash:v1`; `amount_cents` do sorteiopix; `MoneyHelper` decimal do ctfinance).
7. **PR gigante é proibido**; fatia pequena, revisável, reversível. Gate vermelho nunca se contorna. Desde a rodada agent-tooling (#133, PR #139), o `guard-git.sh` do `.claude/settings.json` bloqueia no agente qualquer commit ou push que pule os hooks do husky (`--no-verify`, `SKIP_GIT_HOOKS`, `HUSKY=0`, `core.hooksPath`) e o push forçado. Se o hook falhar por AMBIENTE (pnpm/mise fora do PATH, worktree de estado sem `.env`), o agente roda os dois `ci:check` manualmente (`corepack pnpm` / `mise exec`), prova que o diff é só `docs/` (`git diff $(git merge-base origin/main HEAD)..HEAD --stat -- ':!docs'` vazio) e **pede ao dono** que faça aquele push com a variável de skip, registrando no STATE.md quem fez e por quê.

## Convergência e fechamento da rodada

- Célula ✅ e projeto ✅: critérios bounded da Fase A (passada extra única; crítico 1–2×; nunca reabrir).
- Rodada em "**aguardando revisão do dono**" (estado terminal válido): matriz completa, BACKLOG sem pendência aplicável e PRs abertos com gates verdes esperando merge. O fechamento final só acontece DEPOIS de o dono mesclar.
- Fechamento (após merges do dono):
  1. `BACKLOG.md` zerado: cada candidato aplicado ou adiado com motivo explícito (`[dep-nova]` sem aprovação = adiado).
  2. Deps sem pendência não-justificada; audits limpos; `composer ci:check` + `corepack pnpm ci:check` verdes.
  3. PLAYBOOK: registrar a exceção ao Princípio 4 no §1 (data + racional + decisão do dono, como a de 2026-08-10); parágrafo de re-congelamento do alvo; traps novas em §4; RE-VERIFICAR §3 e o cabeçalho (paths de origem citados) contra o boilerplate novo.
  4. Atualizar os 7 gap-reports onde o delta mudou (seções "o boilerplate agora supre" e fatias) — no mínimo, fatia de realinhamento aberta para `transitado-em-julgado` (único que já migrou toolchain).
  5. `RELATORIO.md` final: o melhor de cada projeto (absorvido/adiado/rejeitado), links de PR, fontes que evoluíram durante a rodada.

## Modo loop

Argumento recebido: $ARGUMENTS

- **`continue`** (ou invocação dentro de loop externo): Fase 0 de reconciliação, depois exatamente UMA unidade de trabalho, atualize STATE.md e pare reportando em 5 linhas: o que fez, evidências novas, próxima unidade, % da matriz, fatias abertas.
- **Sem argumento** (modo contínuo): no máximo 5 unidades por invocação; pare SEMPRE na fronteira de unidade (checkpoint gravado), nunca no meio. Ao notar contexto degradado, feche a unidade corrente, atualize STATE.md e pare com o mesmo report de 5 linhas.
