# Gap-report — transitado-em-julgado

Projeto piloto da rodada (posição 1 na ordem do [PLAYBOOK](../PLAYBOOK.md) §2). Fork fiel do boilerplate; toda lição aprendida aqui vira ajuste no playbook antes dos demais.

## 1. Stack atual (verificado no disco em 2026-08-10)

| Item | Versão no projeto | Boilerplate |
| ---- | ----------------- | ----------- |
| PHP | `^8.4` | `^8.4` ✅ |
| laravel/framework | `^13.0` (lock: **v13.21.1**) | `^13.0` ✅ |
| inertiajs/inertia-laravel | `^3.0` (lock: **v3.1.1**) | `^3.0` ✅ |
| @inertiajs/react | `^3.6.1` | `^3.4.0` (projeto **à frente**) |
| react / react-dom | `^19.2.7` | 19 ✅ |
| tailwindcss / typescript / vite | `^4.3.3` / `~6.0.3` / `^7.3.6` | tailwind ✅; typescript ✅ (Fatia 2b); **vite: boilerplate em `^8.2.0`** — drift deixado fora do escopo da 2b |
| pestphp/pest | `^5.1` (lock: **v5.1.0**) + vitest `^4.1.10` | ✅ (Fatia 2b) |
| Node / pnpm | 24 / 11.19.0 (`.mise.toml`, `packageManager`, CI) | ✅ (Fatia 2b) |
| larastan/larastan | `^3.10` + `phpstan.neon.dist` nível 6, **zero erros** (desde a Fatia 1) | `^3.10`, nível 6 ✅ |
| `require` de produção | idêntico ao boilerplate (Horizon, activitylog, ziggy, log-viewer) | ✅ |

**Criticidade:** em produção (Parte 1 "live" desde 12/06/2026), MySQL com dados persistidos modestos (users, RBAC, músicas, activity_log). **Sem pagamentos, sem realtime**; base de usuários mínima (projeto pessoal: usuária final + admin). Conteúdo **data-gated** (Parte 3 desbloqueia 23/10/2026) e integração WhatsApp Cloud API (Meta) com job mensal dia 19 — código pronto, `WHATSAPP_ENABLED=false` aguardando setup. Risco de negócio: baixo.

## 2. Já em conformidade

- Laravel 13 + PHP 8.4 + Inertia v3 (backend e frontend) + React 19 + Tailwind 4 — nenhum upgrade de framework pendente.
- Pest 4 com 21 arquivos de teste em `tests/Feature` (Auth, Capitulos, Musicas, PermissionRole, Permissions, Settings, WhatsApp, Impersonate, Horizon, Dashboard), incluindo `Laravel13ConfigurationDefaultsTest`.
- `pint.json`, `rector.php`, scripts `ci:*` no `composer.json` e `package.json` (`ci:check` composer = lint + rector + test; pnpm = lint + format + types + vitest + build).
- Husky completo (`pre-commit`, `pre-push`, `commit-msg`, `prepare-commit-msg`) + `scripts/format/format-dirty.mjs`.
- `.github/workflows/ci.yml` (jobs frontend + backend + pint + rector) e `semgrep.yml`.
- RBAC próprio (enums `Roles`/`Permissions`, models, trait) e impersonation (events/listeners/teste) — este projeto foi a **origem** da harvest dessas peças; já alinhado por construção.
- Form Requests por módulo, Policies, DTOs, `declare(strict_types=1)` em todo `app/`.
- `CLAUDE.md` / `AGENTS.md` / `COWORK.md` presentes.

## 3. Divergências e riscos específicos

**Gaps de padrão (o que falta do boilerplate):**

1. **Larastan inexistente** — não está no `require-dev`, sem `phpstan.neon`, `ci:check` sem `ci:stan`. Único gap de análise estática da rodada. **[resolvido na Fatia 1]**
2. **CI defasado estruturalmente** — sem jobs `quality` e `security` (composer/pnpm audit), sem gate de migrations em MySQL real, sem `concurrency`/`cancel-in-progress`. **[jobs/concurrency na Fatia 0; gate MySQL na Fatia 1]**
3. **Sem `.ai/rules/`** — diretório `.ai` não existe. **[resolvido na Fatia 2]**
4. **Sem `lang/`** — boilerplate tem `lang/pt_BR` + `pt_BR.json`; mensagens de validação hoje saem em inglês.
5. **`tests/` só tem `Feature`** — sem `Unit`, `Arch` e browser/smoke. **[`Arch` adicionado na Fatia 1; browser/smoke adiado por decisão para a Fatia 4 (par natural da CSP); `Unit` naturalmente na Fatia 5 (kit BR)]**
6. **Hardening ausente por completo** — verificado no disco: sem `SecurityHeaders`, `SetSensitiveCacheHeaders`, `EnsureUserIsActive`, `PiiScrubber`/tap de logging, `TRUSTED_PROXIES`, páginas de erro (`errors/500.blade.php` + `error-page.tsx`) e strict mode com `report()`. `bootstrap/app.php` só registra `ViagemNoTempoLocal`, `HandleAppearance`, `HandleInertiaRequests`.
7. **Kit BR/frontend com drift** — `resources/js/utils/format/masks.ts` é subconjunto antigo (sem `applyPhoneAutoMask`/`applyCepMask`); sem `money.ts`, sem `via-cep.ts`; `data-table/` sem `constants.ts`/`date.ts` e `query-params.ts` divergente; `users/constants.ts` divergente.
8. **Supply-chain** — sem `.github/dependabot.yml`, sem `.mise.toml`, `pnpm-workspace.yaml` com `minimumReleaseAge: 0` (boilerplate: 10080). **[resolvido na Fatia 2]**

**Código local que fica (delta legítimo, não é dívida):** `ViagemNoTempoLocal` (interruptor de data dev-only), `EnsureIntimadaIdentificada` + `PortaoCapitulosService` (portão de domínio; assets respondem 404), `WhatsAppService` + módulo WhatsApp, `COWORK.md`.

**Traps deste projeto:**

- **Conteúdo data-gated:** capítulos/recados abrem por data real (`Capitulo`, recados `AAAA-MM-DD-slug.php`). Testes novos das fatias devem congelar o relógio (`Carbon::setTestNow`) para não flakear conforme o calendário; evitar deploy no entorno de 23/10/2026 (desbloqueio da Parte 3).
- **`ViagemNoTempoLocal` é no-op fora de `local` por contrato** — qualquer mexida na pilha de middleware (Fatia 4) precisa preservar isso; um teste garantindo o no-op em produção é barato e obrigatório.
- **Job WhatsApp dia 19** roda via scheduler/Horizon — deploys não podem deixar `schedule:work`/Horizon mortos; smoke pós-deploy deve conferir.
- **`EnsureUserIsActive` e a coluna `is_active`** — verificado na Fatia 1: a coluna **já existe** desde a migration inicial (`create_users_table`, default `true`) e o factory a popula — a Fatia 4 **não** precisa de migration própria. Trap de sessões vivas do playbook §4 segue irrelevante (2 usuários).
- **CSP:** sem gateway de pagamento, mas as páginas servem mídia própria (músicas/capítulos) — ainda assim começar em report-only, conforme Fatia 4.
- **`minimumReleaseAge` 0→10080** pode segurar deps recém-publicadas (trap §4 do playbook).

## 4. Fatias aplicáveis (ordem para este projeto)

| Fatia | Aplica? | Notas para este projeto |
| ----- | ------- | ----------------------- |
| **0 — Baseline** | Sim | CI já existe; a fatia é levar `ci.yml` à paridade estrutural (jobs `quality`/`security`, concurrency, SHA-pinning) e documentar o verde atual (21 arquivos Feature). |
| **1 — Redes de segurança** | Sim | Larastan do zero (sem baseline legado grande — projeto pequeno, mirar zero erros como o boilerplate, não baseline). Gate MySQL 8 no CI. Cobrir fluxos críticos: portão da intimada, desbloqueio por data (com relógio congelado), recados agendados, disparo WhatsApp. Smoke browser mínimo do hub. |
| **2 — Tooling/CI** | Parcial | Pint/Rector/Husky/scripts já conformes. Falta: `dependabot.yml`, `.mise.toml`, `minimumReleaseAge: 10080`, SHA-pinning. **Antecipar `.ai/rules/` + adaptação de `CLAUDE.md`/`AGENTS.md` para cá** (recomendação da Fatia 6). Inclui toolchain de teste → alvo novo (Pest 5, Vitest 4, ESLint 10, TS ~6.0, Node 24, pnpm 11.19). Nota: Fatias 0 e 2 (✅) fecharam contra o alvo antigo (Node 22/pnpm 11.5.3) — o realinhamento para o alvo novo virou a **Fatia 2b** (✅ 2026-08-10), sem reabri-las. |
| **3a — Laravel 12→13** | **Não se aplica** | Já é L13 (v13.21.1). |
| **3b — Inertia 2→3** | **Não se aplica** | Já é Inertia v3; frontend inclusive à frente do boilerplate (react 3.6.1). |
| **4 — Hardening** | Sim (integral) | Nada existe hoje — copiar o pacote completo (§Fatia 4 do playbook): SecurityHeaders com CSP report-only primeiro, `stamp()` no exception handler, PiiScrubber, `TRUSTED_PROXIES`, páginas de erro, strict mode com report, `EnsureUserIsActive` (com migration `is_active`). Preservar o contrato 404-para-assets do portão. |
| **5 — Kit BR / dedupe** | Sim | Substituir `masks.ts` local pelo kit + testes, trazer `money.ts`, sincronizar `data-table/` e `users/constants.ts`, deletar cópias locais no mesmo PR. **Sem trap de dados persistidos** (não há CpfHasher local nem hash de CPF no banco). |
| **6 — Convenções** | Parcial | Form Requests e RBAC já no padrão (origem da harvest — apenas ressincronizar o trait se divergiu). Restante: `lang/pt_BR`, rate limiters nomeados, conferência kebab-case, ADRs como guarda ao limpar deps. `.ai/rules` já antecipado na Fatia 2. |

Ordem recomendada: **0 → 1 → 2 → 4 → 5 → 6** (3a/3b puladas).

## 5. Estado

- [x] ✅ Fatia 0 — Baseline (CI em paridade estrutural + verde documentado) (2026-08-10)
- [x] ✅ Fatia 1 — Redes de segurança (Larastan zero-erros, gate MySQL, fluxos críticos, Arch) (2026-08-10)
  - **Desvio registrado (decisão do dono, 2026-08-10):** smoke **browser** adiado para a Fatia 4. Racional: o ganho residual hoje (erro de runtime JS na montagem) é estreito frente ao custo (Playwright no CI, flakiness, e o relógio congelado não atravessa processo servidor/teste porque `ViagemNoTempoLocal` é no-op fora de local); o smoke server-side existente (`assertInertia` em todas as páginas-chave) cobre o resto. O browser smoke vira item da Fatia 4, cujo gate do playbook já exige "smoke browser verde" — é o detector natural de quebra por CSP.
- [x] ✅ Fatia 2 — Tooling/CI (dependabot, mise, minimumReleaseAge, SHA-pinning, `.ai/rules` antecipado) (2026-08-10)
  - **Nota (2026-08-10, alvo re-congelado pós-update de deps):** a fatia fechou contra o alvo antigo (Node 22/pnpm 11.5.3, Pest 4/Vitest 3) — como a Fatia 0. O delta virou a **Fatia 2b** abaixo (fatias fechadas não reabrem).
- [x] ✅ Fatia 2b — Realinhamento de toolchain ao alvo re-congelado: Pest ^5.1 + PHPUnit ^13.0, Vitest ^4, ESLint 10, TypeScript ~6.0 (`baseUrl` removido do tsconfig), Node 24 LTS + pnpm 11.19.0 (packageManager, `.mise.toml`, CI matrix e `corepack prepare` juntos) (2026-08-10)
- [ ] ⬜ Fatia 2c — Kit de agente (rodada agent-tooling #133: `.claude/` do boilerplate — settings, hooks, rules por symlink, security-patterns —, `config/boost.php`, `@AGENTS.md` no CLAUDE.md; ver PLAYBOOK §3 Fatia 2). Bloqueado até as Fatias 0–2b entrarem em `main`.
- [ ] ⬜ Fatia 4 — Hardening (pacote completo, CSP report-only primeiro) **+ smoke browser adiado da Fatia 1** (instalar `pest-plugin-browser`/Playwright faz parte desta fatia)
- [ ] ⬜ Fatia 5 — Kit BR / dedupe frontend
- [ ] ⬜ Fatia 6 — Convenções (lang/pt_BR, rate limiters, kebab-case, sync trait RBAC)

**Baseline verde da Fatia 0 (2026-08-10, medido localmente; branch `chore/3-fatia-0-baseline`, issue #3):**

- Pest: **117 testes / 660 assertions** em 21 arquivos de `tests/Feature` (SQLite `:memory:`), zero skipados. Cobrem os domínios listados em §2; sem `Unit`/`Arch`/browser (gap §3.5, endereçado na Fatia 1).
- Vitest: **32 testes / 7 arquivos**, zero skipados.
- `composer ci:check` (pint `--test` + rector dry-run + pest) e `pnpm ci:check` (lint + format:check + types + vitest + build) verdes antes e depois da fatia.
- **Desvios deliberados no CI novo:** (1) job `quality` sem step de PHPStan — Larastan só entra na Fatia 1; o CI descreve o presente. (2) job `security` nasceu com `continue-on-error: true` porque os audits acusavam advisories reais do lockfile (composer: guzzle <7.15.2, league/commonmark <2.9.0 | pnpm: axios <1.18.0 e nanoid <3.3.17, transitivos) — **resolvido no mesmo dia** (issue #4): guzzle 7.15.2 + commonmark 2.9.1 via `composer update` pontual; no pnpm, `overrides` com seletor de range no `pnpm-workspace.yaml` — nanoid 3.3.16→3.3.18, e o axios 1.17.0 (peer **opcional** do @inertiajs/core e do laravel-precognition; Inertia v3 usa fetch) saiu da árvore inteiro, pois com os peer-ranges reescritos nada mais o requeria; `continue-on-error` removido em seguida — job `security` bloqueante, paridade plena com o boilerplate.

**Fatia 1 — concluída (2026-08-10, branch `chore/5-fatia-1-redes-de-seguranca`, issue #5; smoke browser adiado → Fatia 4, ver desvio no checklist):**

- **Larastan:** `larastan/larastan ^3.10` no `require-dev`, `phpstan.neon.dist` copiado do boilerplate (nível 6; app, database, routes, bootstrap/app.php), `ci:stan` no `composer.json` e encadeado no `ci:check`, step "Run PHPStan (larastan)" no job `quality`. Passivo inicial de **96 erros zerado** (sem baseline, conforme decidido em §4).
- **Como os 96 foram zerados:** tipagem portada dos arquivos de origem comum do boilerplate — models RBAC (`Role`, `Permission`, `User` + novo pivot `PermissionUser` com `->using()` no trait), `HasRolesAndPermissions` (anotações), `UserResource`/`RoleResource` (`@mixin` + fix de `toArrayCollection` via `resolve()`), `PermissionMetaDTO`, `UserFactory` (`@extends Factory<User>`), docblocks de `rules()` nos 6 Form Requests, casts `(int)` no `CpfCnpj`, e **fix de bug latente** no `RoleUserUpdatedEvent` (referenciava relação inexistente `roles`; agora `role?->name`, como no boilerplate). Domínio próprio anotado à mão (`Faixa`, `MusicaNossa`, `WhatsAppService`, `Parte1Controller`, `Roles::options`).
- **Divergências de comportamento deliberadamente NÃO portadas** (cada uma pertence à sua fatia): `is_active` na query do `LoginRequest` (Fatia 4), `unsetRelation` no `refreshPermissionsCache` + `GuardsDemoSeeding` no `UserSeeder` + generalização do `RoleFilterService` (removeu SALES/FINANCE) + `AssignRoleRequest` extraído (tudo Fatia 6 — resync RBAC).
- **Gate MySQL:** service `mysql:8.0` + step "Migrations (MySQL 8)" no job `backend` (DB `transitado_em_julgado_ci`), `pdo_mysql` nas extensions; validado localmente com `migrate --force` contra MySQL 8 real em banco descartável — 8 migrations OK.
- **Fluxos críticos:** auditoria da suíte existente concluiu que **já estão cobertos** (portão da intimada com 404 de assets, desbloqueio por data com relógio congelado, recados agendados com unhappy paths, WhatsApp com `Http::fake`, no-op da `ViagemNoTempoLocal` fora de local) — nenhum teste Feature novo foi necessário.
- **`tests/Arch`** novo (presets `php` + `security` e regras do boilerplate adaptadas: sem `App\ValueObjects` → regra para `App\DataTransferObjects` readonly; exceções comentadas para `shuffle` do quiz e `DB::transaction` do `ReordenarController`) + testsuite `Arch` no `phpunit.xml`. Suíte: **124 testes / 669 assertions** (117 Feature + 7 Arch).
- Gates verdes antes e depois: `composer ci:check` (agora com `ci:stan`) e `pnpm ci:check`.

**Fatia 2 — concluída (2026-08-10, branch `chore/8-fatia-2-tooling`, issue #8; empilhada sobre a Fatia 1 — PRs #6/#7 ainda abertos):**

- **Supply-chain:** `.github/dependabot.yml` e `.mise.toml` copiados fiéis do boilerplate; `minimumReleaseAge` 0→10080 preservando os `overrides` da #4. SHA-pinning já estava em paridade total desde a Fatia 0 (diff dos `uses:` contra o boilerplate: idêntico) — o item virou verificação, não mudança.
- **Trap do `minimumReleaseAge` em forma nova:** o pnpm 11.5 verifica o lockfile INTEIRO contra a política (inclusive em `pnpm run`, via verify-deps) — ligar 10080 quebrou na hora porque o piso de segurança `nanoid@3.3.18` da #4 tinha 3 dias de publicado. Válvula: `minimumReleaseAgeExclude: [nanoid@3.3.18]` (version-scoped, pnpm ≥10.19), com data de remoção anotada no próprio arquivo (≥2026-08-14). Playbook §4 atualizado com a lição.
- **`.ai/rules/` antecipado (Fatia 6-docs):** `index.md` + 18 arquivos de área, adaptados com fact-check contra o código — não cópia cega. Desvios do boilerplate: sem `value-objects.md` (não há Money/ValueObjects; a regra de DTO readonly vive em `app.md`); `tests.md` documenta os helpers próprios (`viajarPara`/`identificar`/`comoIntimada`/`escreverRecado`) e o contrato do relógio congelado, sem afirmar `preventStrayRequests` (inativo aqui); regra NOVA `conteudo.md` para `resources/conteudo/**` (server-side por contrato, recados `AAAA-MM-DD-slug.php`, mídia só via rotas allowlisted); `middleware.md` grava os contratos ViagemNoTempoLocal no-op fora de local e 404 de assets; `enum.md` separa RBAC (SCREAMING_SNAKE) do `Capitulo` (PascalCase, calendário do presente). Regras de alvo prescritivo onde o diretório ainda não existe (`commands.md`, `support.md`) e onde a Fatia 6 migrará legado (throttle nomeado; `it()` para testes novos — suíte hoje mista, 7 arquivos `it`/11 `test`).
- **Fiação:** ponteiro em `CLAUDE.md` (Required reading → ler a linha do `index.md` cujo glob casa com o arquivo). `AGENTS.md` intocado — invariante Boost de cópia idêntica ×3; o próprio boilerplate não referencia `.ai/rules` nos docs de agente (trap nova no playbook).
- **Drift descoberto p/ resync da Fatia 6:** Form Requests de `Musicas/` autorizam `true` (User/PermissionRole re-checam `can()` — a convenção em camadas); requests usam a string `'manage_users'` em vez do enum `Permissions`.
- Gates verdes antes e depois: `composer ci:check` e `pnpm ci:check` (este, após a válvula do nanoid).

**Fatia 2b — concluída (2026-08-10, branch `chore/9-fatia-2b-toolchain`, issue #9; empilhada sobre a Fatia 2):**

- **Backend:** `pestphp/pest ^4.1→^5.1`, `pest-plugin-laravel ^4→^5.0`, `phpunit/phpunit ^12.5.12→^13.0`. **Zero mudanças em arquivos de teste** — a suíte fechou em 124 testes/669 assertions, igual ao baseline (o commit de re-freeze do boilerplate, `fa323bd`, também não tocou testes).
- **Escopo do `composer update`:** `--with-all-dependencies` arrastava `laravel/framework` v13.21.1→v13.24.0 + symfony/guzzle/carbon/commonmark. Refeito com **`--with-dependencies`**: 34 pacotes, todos do toolchain de teste (Pest, PHPUnit, sebastian/\*, paratest) + 4 componentes symfony que o Pest/PHPUnit requerem direto; framework congelado. Custo do escopo estreito: `pest-plugin-laravel` fica em v5.0.0 (boilerplate: v5.0.1) — mesma constraint `^5.0`. Trap nova no playbook §4.
- **Frontend:** Vitest+@vitest/ui 3.2.7→4.1.10, ESLint 9.39.5→10.8.0 (+ `@eslint/js` 10.0.1, `@typescript-eslint/*` 8.66.0), jsdom 27→30.0.1, lint-staged 16→17.3.0, prettier 3.9.5→3.9.6, prettier-plugin-tailwindcss 0.6.14→0.8.1, `@testing-library/jest-dom` 6→7.0.0 + `user-event` 14.6.3, `@types/node` 22→24.13.3, `globals` 15→17.9.0. TypeScript 5.9.3→**`~6.0.3`** e **movido de `dependencies` para `devDependencies`** (como no boilerplate). Todas as versões resolveram exatamente no lock do boilerplate.
- **`typescript` com `~` e não `^`:** o boilerplate declara `^6.0.3`, mas o PLAYBOOK §Fatia 2/§4 prescreve `~6.0` porque typescript-eslint exige `<6.1.0`. Hoje é indiferente (não existe 6.1 estável; o latest é 7.0.2), mas `~6.0.3` é a única forma que sobrevive ao lançamento do 6.1. Divergência deliberada do alvo — registrada como trap no playbook.
- **`tsconfig.json`:** `baseUrl` removido (entradas de `paths` passam a ser relativas ao arquivo; como o tsconfig está na raiz, o efeito é nulo).
- **Correção exigida pelo type-check (entra junto, conforme playbook §4):** `resources/js/test/setup.ts` atribui em `global` (binding do Node) e o Vitest 3 puxava `@types/node` de carona; o Vitest 4 não puxa mais, e o `tsc` quebrou com `TS2304: Cannot find name 'global'`. O boilerplate não sente porque a suíte de lá importa o `vite.config.ts`, e o `vite/dist/node/index.d.ts` referencia os tipos de node. Correção: `/// <reference types="node" />` em `resources/js/test/vitest.d.ts` (o `@types/node` já era devDependency direta), com o porquê no comentário. **Trap nova no playbook — todo derivado vai bater nisso na sua Fatia 2.**
- **Prettier 3.9.6** reformatou `resources/css/app.css` (`@source "../views"` → aspas simples) — exatamente a mesma linha que mudou no boilerplate em `fa323bd`. `pnpm format` faz parte da fatia.
- **CI:** Node 22→24 (matrix `frontend`, matrix `backend`, `node-version` do `security`) e `corepack prepare pnpm@11.19.0` nos 3 pontos. O `ci.yml` ficou **byte a byte igual ao do boilerplate**, exceto o nome do banco (`transitado_em_julgado_ci`). `.mise.toml` → node 24 / pnpm 11.19.0.
- **`minimumReleaseAge` não bloqueou:** conferidas as datas de publicação reais de cada versão-alvo antes do install — todas com ≥7 dias (a mais nova, `@typescript-eslint@8.66.0`, de 03/08). A exceção `nanoid@3.3.18` continua necessária (segue na árvore) até 14/08.
- **Verificações extras:** `composer audit --locked` limpo; `pnpm audit --prod --audit-level high` exit 0; hook `pre-commit` com lint-staged 17 disparando (smoke com arquivos reais staged).
- **Drift remanescente (deixado fora do escopo, para fatia futura):** Vite `^7.3.6` vs `^8.2.0` do boilerplate, e com ele `laravel-vite-plugin ^2.1.0`→`^3.1.3`, `@vitejs/plugin-react ^5.2.0`→`^6.0.5`; além de `lucide-react ^0.475.0`→`^1.28.0` (major), radix-ui, `concurrently ^9`→`^10`. Consequência mensurável: o `pnpm audit` acusa **1 advisory moderate pré-existente** (postcss 8.5.20, GHSA-fxqj-rqcc-2cmp, `<=8.5.22`) que chega via `vite`; o boilerplate não tem porque o Vite 8 resolve postcss 8.5.25. Não bloqueia o CI (moderate < `--audit-level high`) e é anterior à fatia — o lockfile tinha 8.5.20 antes e depois. Também segue divergente o `vite.config.ts` estrutural (o do boilerplate tem `loadEnv`/`detectTls`, `reportCompressedSize` e `test.include`).
- Gates verdes antes e depois: `composer ci:check` (Pint + Rector + PHPStan "No errors" + Pest 124/669) e `pnpm ci:check` (lint + format:check + types + Vitest 7 arquivos/32 testes + build).

**Drift criado pelo boilerplate depois da Fatia 1 (harvest reversa do spinmax, 2026-08-11) — resolver na Fatia 6:**

A Fatia 1 zerou o passivo do Larastan portando tipagem de arquivos de origem comum. Dois deles **deixaram de existir no boilerplate** desde então:

- **`app/DataTransferObjects/PermissionMetaDTO.php` foi apagado** (PR #45). Era código morto lá: o único hit no repositório era a própria declaração, e `HasRolesAndPermissions::getCustomPermissionsList()` remonta a mesma forma inline. Aqui ele chegou como material de tipagem, não por uso — conferir se algum ponto do transitado passou a consumi-lo de verdade antes de apagar. Atenção: a regra de arch local ("`App\DataTransferObjects` readonly") ficaria sem alvo se este for o único DTO do projeto.
- **`Roles::options()` foi apagado** (mesmo PR). Zero call sites no boilerplate, e devolvia `super_user` e `visitor` crus para um `<select>` que ignora o `RoleFilterService`. Aqui ele aparece na lista de "domínio próprio anotado à mão" da Fatia 1 — verificar se tem consumidor real antes de remover.

No mesmo lote o boilerplate ganhou `Roles::isSelectable()` (tira "Visitante" do seletor de atribuição, **só na exibição**), `User::permissionCacheKey()` (a chave estava escrita à mão em 7 pontos) e `Cache::forget` no `PermissionRoleSeeder`. Os três entram junto no resync do RBAC.

Também **saíram do boilerplate** `lang/pt_BR.json`, `lang/pt_BR/actions.php` e `lang/pt_BR/http-statuses.php` (zero referências). O §3 acima registra "sem `lang/`" como gap deste projeto: quando a fatia de i18n rodar, o alvo a copiar é `auth.php`, `pagination.php`, `passwords.php` e `validation.php` — **não** mais o `pt_BR.json`.

**Tooling de agente (Fase A da rodada agent-tooling, 2026-09-08):** HEAD `7749a1e`: CLAUDE.md de 88 linhas em inglês, reescrita total (não importa AGENTS.md); AGENTS.md do Boost 2.4.13 sem `claude_code`; `.ai/rules` com 20 arquivos adaptados (+ `conteudo.md`); `composer ci:check` com PHPStan e pre-push completo — único candidato ao kit hoje. **As Fatias 0–2 vivem em `chore/8-fatia-2-tooling`/`chore/9-fatia-2b-toolchain`, não em `main`**, e a 2b está sem commit: o kit espera o merge (ou empilha na 2b, por decisão do dono).

**Reconciliação (2026-09-10, rodada agent-tooling #133 → #144):** o registro da Fatia 2b acima ficou um mês só no working tree do boilerplate (fora do PR #143) e entrou em `main` por este commit. No repositório do transitado nada mudou desde 2026-09-08: `main` = `6909e32`; PRs #7 (Fatia 0) e #6 (Fatia 1) continuam abertos; `chore/8-fatia-2-tooling` (`7749a1e`) existe só localmente; `chore/9-fatia-2b-toolchain` aponta para o mesmo commit e os 9 arquivos da 2b (`ci.yml`, `.mise.toml`, `composer.*`, `package.json`, `pnpm-lock.yaml`, `app.css`, `vitest.d.ts`, `tsconfig.json`) seguem **sem commit**. Os ✅ deste checklist descrevem as branches, não `main` — a Fatia 2c (kit de agente) só entra depois que o dono mesclar #6/#7, publicar a Fatia 2 e commitar a 2b.

Última atualização: 2026-08-10 (Fatia 2b concluída — toolchain em paridade com o alvo re-congelado; próxima: Fatia 4 — Hardening + smoke browser adiado da Fatia 1) · 2026-09-08: kit de agente registrado (rodada agent-tooling #133), fatias inalteradas · 2026-09-10: registro da 2b reconciliado com `main` (#144); repositório do transitado inalterado
