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
| tailwindcss / typescript / vite | `^4.3.3` / `^5.9.3` / `^7.3.6` | paridade ✅ |
| pestphp/pest | `^4.1` (lock: **v4.7.5**) + vitest `^3.2.7` | paridade ✅ |
| larastan/larastan | **ausente** (sem `phpstan.neon`, sem `ci:stan`) | `^3.10`, nível 6 |
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

1. **Larastan inexistente** — não está no `require-dev`, sem `phpstan.neon`, `ci:check` sem `ci:stan`. Único gap de análise estática da rodada.
2. **CI defasado estruturalmente** — sem jobs `quality` e `security` (composer/pnpm audit), sem gate de migrations em MySQL real, sem `concurrency`/`cancel-in-progress`.
3. **Sem `.ai/rules/`** — diretório `.ai` não existe.
4. **Sem `lang/`** — boilerplate tem `lang/pt_BR` + `pt_BR.json`; mensagens de validação hoje saem em inglês.
5. **`tests/` só tem `Feature`** — sem `Unit`, `Arch` e browser/smoke.
6. **Hardening ausente por completo** — verificado no disco: sem `SecurityHeaders`, `SetSensitiveCacheHeaders`, `EnsureUserIsActive`, `PiiScrubber`/tap de logging, `TRUSTED_PROXIES`, páginas de erro (`errors/500.blade.php` + `error-page.tsx`) e strict mode com `report()`. `bootstrap/app.php` só registra `ViagemNoTempoLocal`, `HandleAppearance`, `HandleInertiaRequests`.
7. **Kit BR/frontend com drift** — `resources/js/utils/format/masks.ts` é subconjunto antigo (sem `applyPhoneAutoMask`/`applyCepMask`); sem `money.ts`, sem `via-cep.ts`; `data-table/` sem `constants.ts`/`date.ts` e `query-params.ts` divergente; `users/constants.ts` divergente.
8. **Supply-chain** — sem `.github/dependabot.yml`, sem `.mise.toml`, `pnpm-workspace.yaml` com `minimumReleaseAge: 0` (boilerplate: 10080).

**Código local que fica (delta legítimo, não é dívida):** `ViagemNoTempoLocal` (interruptor de data dev-only), `EnsureIntimadaIdentificada` + `PortaoCapitulosService` (portão de domínio; assets respondem 404), `WhatsAppService` + módulo WhatsApp, `COWORK.md`.

**Traps deste projeto:**

- **Conteúdo data-gated:** capítulos/recados abrem por data real (`Capitulo`, recados `AAAA-MM-DD-slug.php`). Testes novos das fatias devem congelar o relógio (`Carbon::setTestNow`) para não flakear conforme o calendário; evitar deploy no entorno de 23/10/2026 (desbloqueio da Parte 3).
- **`ViagemNoTempoLocal` é no-op fora de `local` por contrato** — qualquer mexida na pilha de middleware (Fatia 4) precisa preservar isso; um teste garantindo o no-op em produção é barato e obrigatório.
- **Job WhatsApp dia 19** roda via scheduler/Horizon — deploys não podem deixar `schedule:work`/Horizon mortos; smoke pós-deploy deve conferir.
- **`EnsureUserIsActive` exige coluna `is_active`** — aqui provavelmente precisa de migration própria; trap de sessões vivas do playbook §4 é irrelevante (2 usuários), mas a migration roda em MySQL de produção.
- **CSP:** sem gateway de pagamento, mas as páginas servem mídia própria (músicas/capítulos) — ainda assim começar em report-only, conforme Fatia 4.
- **`minimumReleaseAge` 0→10080** pode segurar deps recém-publicadas (trap §4 do playbook).

## 4. Fatias aplicáveis (ordem para este projeto)

| Fatia | Aplica? | Notas para este projeto |
| ----- | ------- | ----------------------- |
| **0 — Baseline** | Sim | CI já existe; a fatia é levar `ci.yml` à paridade estrutural (jobs `quality`/`security`, concurrency, SHA-pinning) e documentar o verde atual (21 arquivos Feature). |
| **1 — Redes de segurança** | Sim | Larastan do zero (sem baseline legado grande — projeto pequeno, mirar zero erros como o boilerplate, não baseline). Gate MySQL 8 no CI. Cobrir fluxos críticos: portão da intimada, desbloqueio por data (com relógio congelado), recados agendados, disparo WhatsApp. Smoke browser mínimo do hub. |
| **2 — Tooling/CI** | Parcial | Pint/Rector/Husky/scripts já conformes. Falta: `dependabot.yml`, `.mise.toml`, `minimumReleaseAge: 10080`, SHA-pinning. **Antecipar `.ai/rules/` + adaptação de `CLAUDE.md`/`AGENTS.md` para cá** (recomendação da Fatia 6). |
| **3a — Laravel 12→13** | **Não se aplica** | Já é L13 (v13.21.1). |
| **3b — Inertia 2→3** | **Não se aplica** | Já é Inertia v3; frontend inclusive à frente do boilerplate (react 3.6.1). |
| **4 — Hardening** | Sim (integral) | Nada existe hoje — copiar o pacote completo (§Fatia 4 do playbook): SecurityHeaders com CSP report-only primeiro, `stamp()` no exception handler, PiiScrubber, `TRUSTED_PROXIES`, páginas de erro, strict mode com report, `EnsureUserIsActive` (com migration `is_active`). Preservar o contrato 404-para-assets do portão. |
| **5 — Kit BR / dedupe** | Sim | Substituir `masks.ts` local pelo kit + testes, trazer `money.ts`, sincronizar `data-table/` e `users/constants.ts`, deletar cópias locais no mesmo PR. **Sem trap de dados persistidos** (não há CpfHasher local nem hash de CPF no banco). |
| **6 — Convenções** | Parcial | Form Requests e RBAC já no padrão (origem da harvest — apenas ressincronizar o trait se divergiu). Restante: `lang/pt_BR`, rate limiters nomeados, conferência kebab-case, ADRs como guarda ao limpar deps. `.ai/rules` já antecipado na Fatia 2. |

Ordem recomendada: **0 → 1 → 2 → 4 → 5 → 6** (3a/3b puladas).

## 5. Estado

- [x] ✅ Fatia 0 — Baseline (CI em paridade estrutural + verde documentado) (2026-08-10)
- [ ] ⬜ Fatia 1 — Redes de segurança (Larastan zero-erros, gate MySQL, fluxos críticos, smoke)
- [ ] ⬜ Fatia 2 — Tooling/CI (dependabot, mise, minimumReleaseAge, SHA-pinning, `.ai/rules` antecipado)
- [ ] ⬜ Fatia 4 — Hardening (pacote completo, CSP report-only primeiro)
- [ ] ⬜ Fatia 5 — Kit BR / dedupe frontend
- [ ] ⬜ Fatia 6 — Convenções (lang/pt_BR, rate limiters, kebab-case, sync trait RBAC)

**Baseline verde da Fatia 0 (2026-08-10, medido localmente; branch `chore/3-fatia-0-baseline`, issue #3):**

- Pest: **117 testes / 660 assertions** em 21 arquivos de `tests/Feature` (SQLite `:memory:`), zero skipados. Cobrem os domínios listados em §2; sem `Unit`/`Arch`/browser (gap §3.5, endereçado na Fatia 1).
- Vitest: **32 testes / 7 arquivos**, zero skipados.
- `composer ci:check` (pint `--test` + rector dry-run + pest) e `pnpm ci:check` (lint + format:check + types + vitest + build) verdes antes e depois da fatia.
- **Desvios deliberados no CI novo:** (1) job `quality` sem step de PHPStan — Larastan só entra na Fatia 1; o CI descreve o presente. (2) job `security` nasceu com `continue-on-error: true` porque os audits acusavam advisories reais do lockfile (composer: guzzle <7.15.2, league/commonmark <2.9.0 | pnpm: axios <1.18.0 e nanoid <3.3.17, transitivos) — **resolvido no mesmo dia** (issue #4): guzzle 7.15.2 + commonmark 2.9.1 via `composer update` pontual; no pnpm, `overrides` com seletor de range no `pnpm-workspace.yaml` — nanoid 3.3.16→3.3.18, e o axios 1.17.0 (peer **opcional** do @inertiajs/core e do laravel-precognition; Inertia v3 usa fetch) saiu da árvore inteiro, pois com os peer-ranges reescritos nada mais o requeria; `continue-on-error` removido em seguida — job `security` bloqueante, paridade plena com o boilerplate.

Última atualização: 2026-08-10 (Fatia 0 concluída)
