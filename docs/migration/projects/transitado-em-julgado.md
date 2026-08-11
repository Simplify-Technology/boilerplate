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
| tailwindcss / typescript / vite | `^4.3.3` / `^5.9.3` / `^7.3.6` | tailwind/vite ✅; typescript: boilerplate agora em `~6.0` — gap (Fatia 2) |
| pestphp/pest | `^4.1` (lock: **v4.7.5**) + vitest `^3.2.7` | boilerplate agora em Pest `^5.1` + Vitest `^4.1` — gap (Fatia 2) |
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
| **2 — Tooling/CI** | Parcial | Pint/Rector/Husky/scripts já conformes. Falta: `dependabot.yml`, `.mise.toml`, `minimumReleaseAge: 10080`, SHA-pinning. **Antecipar `.ai/rules/` + adaptação de `CLAUDE.md`/`AGENTS.md` para cá** (recomendação da Fatia 6). Inclui toolchain de teste → alvo novo (Pest 5, Vitest 4, ESLint 10, TS ~6.0, Node 24, pnpm 11.19). Nota: Fatias 0 e 2 (✅) fecharam contra o alvo antigo (Node 22/pnpm 11.5.3) — o realinhamento para o alvo novo é follow-up do tema desta fatia, sem reabri-las. |
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
  - **Nota (2026-08-10, alvo re-congelado pós-update de deps):** a fatia fechou contra o alvo antigo (Node 22/pnpm 11.5.3, Pest 4/Vitest 3) — como a Fatia 0. Follow-up pendente, sem reabrir fatias: toolchain de teste → alvo novo (Pest 5, Vitest 4, ESLint 10, TS ~6.0, Node 24, pnpm 11.19), incluindo o realinhamento do CI/`.mise.toml` para Node 24/pnpm 11.19.
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

Última atualização: 2026-08-10 (alvo re-congelado pós-update de deps; Fatia 2 concluída — próxima: Fatia 4 — Hardening + smoke browser adiado da Fatia 1)
