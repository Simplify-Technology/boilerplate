# Gap-report — ctjuris

Projeto **#4 na ordem do [PLAYBOOK](../PLAYBOOK.md)** — estreia a Fatia 3b (Inertia 2→3) fora dos projetos de dinheiro.

## 1. Stack atual (verificada no disco em 2026-08-10)

| Item | ctjuris | Boilerplate | Gap |
| ---- | ------- | ----------- | --- |
| PHP / Laravel | `^8.4` / `^13.0` | `^8.4` / `^13.0` | ✅ paridade |
| Inertia (back/front) | `^2.0` / `@inertiajs/react ^2.3.23` | `^3.0` / `^3.4.0` | ❌ Fatia 3b |
| React / Tailwind / Vite | `^19.2.6` / `^4.3.0` / `^7.3.3` | 19 / 4 / 7 | ✅ paridade |
| Pest / Pint / Rector | `^4.1` / `^1.18` / `^2.0` | idem | ✅ paridade |
| Larastan | **ausente** (sem `phpstan.neon*`; `ci:check` = lint+rector+test) | `^3.10`, level 6 no `ci:check` | ❌ Fatia 1 |
| Workflows GitHub | `ci.yml.disabled`, `semgrep.yml.disabled`, `ci-docx.yml.disabled` | ativos | ❌ Fatia 0 |
| pnpm | `11.1.2` (packageManager) | `11.5.3` | Fatia 2 |
| Banco / fila | **PostgreSQL** (`pgsql`) + Redis/Horizon | MySQL no gate de CI | adaptar gate |

Extras relevantes: monorepo pnpm-workspace com sidecar Node `services/docx` (CI própria, shared secret); Sentry full-stack; S3/flysystem; `composer name` ainda é `simplify-technology/boilerplate` (nunca renomeado).

**Criticidade:** SaaS jurídico B2B multi-tenant em **piloto com cliente real** (seeders `BernardinoPilotSeeder`), desenvolvimento ativo (último commit 2026-08-03). **Sem pagamentos, sem realtime/websockets**, mas com PII jurídica pesada (LGPD): CPF cifrado + `cpf_hash` **persistido** em `contacts`, scrubbing em logs/Sentry. Erro aqui não perde receita direta, mas vaza dado sensível — staging observado no Sentry é obrigatório em toda fatia.

## 2. Já em conformidade

ctjuris é a **fonte** de boa parte da harvest — não re-portar, apenas reconciliar drift:

- L13 + PHP 8.4 + React 19 + Tailwind 4 + Pest 4 (nascido do boilerplate).
- `lang/pt_BR` completo (auth, pagination, passwords, validation).
- Hooks Husky com issue-ID (`commit-msg`, `prepare-commit-msg`, `pre-push` com `ci:check`) + `scripts/git/get-issue-id.sh` — é a origem do padrão.
- Scripts `ci:*` com a mesma semântica do boilerplate (composer e pnpm), Pint + Rector configurados.
- `tests/Arch` (multi-tenant, factories, módulos) + vitest com mocks globais + sweep de a11y/motion.
- Stack PII/LGPD (`app/Support/Logging/*`, Sentry before_send/JS), impersonation auditada, RBAC enum-driven, kit data-table, flash→toast, dark mode via cookie, ConfirmDialog, masks/ViaCEP, rule `CpfCnpj`, `GuardsDemoSeeding` — tudo fonte da harvest.

## 3. Divergências e riscos específicos

1. **CI desligado no GitHub** — os 3 workflows estão `.disabled`; a única barreira hoje é o pre-push local. Fatia 0 é urgente e barata (conteúdo pronto, basta reconciliar com o `ci.yml` do boilerplate e reativar).
2. **PostgreSQL, não MySQL** — o "gate de migrations em MySQL real" das Fatias 0/1 do playbook deve usar service `postgres` aqui (a suíte continua em SQLite). Não copiar o service MySQL cegamente.
3. **⚠️ TRAP `CpfHasher` (mesma classe do spinmax, §4 do playbook)** — `cpf_hash` HMAC-SHA256 persistido (`2026_08_03_150000_encrypt_contact_pii_and_add_cpf_hash.php`, `Contact`), chave derivada da `APP_KEY` em `app/Support/Pii/CpfHasher.php`. O boilerplate usa contexto `app:cpf-hash:v1` em `app/Support/Br/` — derivação pode divergir. Teste de compatibilidade contra valores reais do banco ANTES de trocar; rotação de `APP_KEY` invalida os hashes.
4. **Código local que o boilerplate agora supre** (dedupe na Fatia 5, com diff — as versões do boilerplate evoluíram): `masks.ts` (sem `money.ts`/`MaskedInput`/`CurrencyInput` locais), `CpfHasher` (path diferente), PiiScrubber (reconciliar com a versão canônica), vitest setup.
5. **Sem hardening da Fatia 4** — não existem `SecurityHeaders`, `SetSensitiveCacheHeaders`, `EnsureUserIsActive`, páginas de erro custom. CSP em report-only primeiro: allowlist para **ViaCEP** (fetch no frontend) e Sentry (`connect-src`). Trap `EnsureUserIsActive` derrubando sessões vivas no deploy se aplica.
6. **Upgrade Inertia 3b tem superfície real** — 55 arquivos usam `useForm`/`router.*`, 18 usam `usePage`, SSR ativo (`dev:ssr`, `build:ssr`). Este projeto **estreia a receita `fad56c0`**: lições viram ajuste no playbook antes de sorteiopix/ctfinance.
7. **Sidecar `services/docx`** — pnpm workspace + `ci-docx.yml.disabled` + `DOCX_SHARED_SECRET`. Fatias 0/2 não podem quebrar o workspace; `minimumReleaseAge` no `pnpm-workspace.yaml` afeta também o sidecar.
8. **Multi-tenant é código próprio e fica** — `TenantContext`/scopes/`PinTenantFromUser` não têm equivalente default no boilerplate (kit é opt-in documentado). Não "limpar" na Fatia 6.
9. **Sem `.ai/rules`** (só `.ai/mcp`) e `CLAUDE.md` próprio com protocolo SESSION.md ativo — na Fatia 2/6, **mesclar** as regras do boilerplate sem destruir o protocolo de sessão local.
10. Menores: throttles mágicos (`throttle:6,1`, `throttle:10,1`) → rate limiters nomeados (Fatia 6); `composer name` ainda "simplify-technology/boilerplate"; sem `tests/Browser`; pnpm 11.1.2 → 11.5.3.

## 4. Fatias aplicáveis (ordem para este projeto)

1. **Fatia 0 — Baseline**: remover `.disabled` de `ci.yml`/`semgrep.yml` e reconciliar com o boilerplate (pnpm 11.5.3, actions por SHA, concurrency); **service `postgres` no lugar de `mysql`**; manter/reativar `ci-docx.yml` do sidecar.
2. **Fatia 1 — Redes de segurança**: introduzir Larastan (`phpstan.neon.dist` + `--generate-baseline`, `ci:stan` no `ci:check`); gate de migrations em **PostgreSQL** real; smoke browser mínimo (não há `tests/Browser`) dos fluxos críticos: login, intake WhatsApp→caso, cálculo, geração de petição (docx). Cobertura Feature/Arch/Unit já é boa — documentar contagem aqui.
3. **Fatia 2 — Tooling/CI**: só deltas — `.mise.toml`, pnpm 11.5.3, `dependabot.yml`, SHA-pinning, `minimumReleaseAge` (testar contra o workspace docx). Hooks já são o padrão. Antecipar `.ai/rules/` + mescla de `CLAUDE.md`/`AGENTS.md`.
4. **Fatia 3a — NÃO se aplica** (já é L13/PHP 8.4).
5. **Fatia 3b — Inertia 2→3**: receita `fad56c0` (gabarito via `git show`); republicar `config/inertia.php` v3; tipar `resolve()` em `app.tsx`/`ssr.tsx`; caçar eventos renomeados e cancelamento antigo nos 55 arquivos; gate = tsc + eslint + prettier + vitest + `build:ssr` + health SSR + Pest. **Primeiro projeto a rodar 3b — registrar arestas no playbook.**
6. **Fatia 4 — Hardening**: `SecurityHeaders` (CSP **report-only** 1–2 semanas; allowlist ViaCEP/Sentry) + `stamp()` no exception handler; `SetSensitiveCacheHeaders`; `EnsureUserIsActive` (auditar sessões de inativos antes); páginas de erro; strict mode com `report()`. PiiScrubber: diff local vs boilerplate, adotar a canônica.
7. **Fatia 5 — Kit BR/dedupe**: **teste de compatibilidade do `CpfHasher` primeiro** (risco #3); trocar `masks.ts`/`CpfHasher` locais pelo kit `app/Support/Br` + `utils/format`, deletar cópias no mesmo PR; ganhar `money.ts`/`MaskedInput` de graça.
8. **Fatia 6 — Convenções**: rate limiters nomeados; Form Requests onde houver validação inline; kebab-case; sync do trait RBAC; renomear `composer name`; respeitar ADRs (Ziggy fica, sem TanStack, sem Telescope, Sentry).

## 5. Estado

- ⬜ Fatia 0 — Baseline (CI reativado, service PostgreSQL)
- ⬜ Fatia 1 — Redes de segurança (Larastan baseline, gate pgsql, smoke browser)
- ⬜ Fatia 2 — Tooling/CI (mise, pnpm 11.5.3, dependabot, `.ai/rules` antecipado)
- ⬜ Fatia 3b — Inertia 2→3 (estreia da receita `fad56c0`)
- ⬜ Fatia 4 — Hardening (CSP report-only, EnsureUserIsActive, error pages)
- ⬜ Fatia 5 — Kit BR/dedupe (⚠️ compat `CpfHasher` antes do merge)
- ⬜ Fatia 6 — Convenções (rate limiters, Form Requests, RBAC sync)

Última atualização: 2026-08-10 (gap-report inicial)
