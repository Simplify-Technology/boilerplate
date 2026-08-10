# Gap-report — sorteiopix

Projeto **#5 na ordem do [PLAYBOOK](../PLAYBOOK.md)** — envolve dinheiro (Pix P2P), upgrade duplo (Fatias 3a **e** 3b); herda a receita Inertia validada no ctjuris.

## 1. Stack atual (verificada no disco em 2026-08-10)

| Item | sorteiopix | Boilerplate | Gap |
| ---- | ---------- | ----------- | --- |
| PHP / Laravel | `^8.4` / `^12.0` | `^8.4` / `^13.0` | ❌ Fatia 3a |
| Inertia (back/front) | `^2.0` / `@inertiajs/react ^2.3.17` | `^3.0` / `^3.4.0` | ❌ Fatia 3b |
| React / Tailwind | `^19.2.4` / `^4.2.1` | 19 / 4 | ✅ paridade |
| Pest / Pint / Rector | `^4.1` / `^1.18` / `^2.0` | idem | ✅ paridade |
| Larastan | **ausente** (sem `larastan` no require-dev, sem `phpstan.neon*`; `ci:check` = lint+rector+test) | `^3.10`, level 6 no `ci:check` | ❌ Fatia 1 |
| Workflows GitHub | `ci.yml` + `semgrep.yml` **ativos** | idem | reconciliar (Fatia 0) |
| pnpm | `10.32.1` (packageManager) | `11.5.3` | Fatia 2 |
| Banco / fila / realtime | MySQL + Redis (Horizon `^5.45`) + **Reverb** (broadcast) | MySQL no gate de CI | gate falta no CI |

Extras relevantes: PWA completo (service worker, manifest, pull-to-refresh), Web Push VAPID (`webpush ^10.5`), Google OAuth (Socialite), RBAC caseiro por enum, impersonation, auditoria `owen-it/laravel-auditing ^14`, log-viewer; SSR ativo (`build:ssr` + `ssr.tsx`); 32 arquivos de teste Pest + 41 vitest; `composer name` ainda é `simplify-technology/boilerplate`.

**Criticidade:** app de grupos de sorteio/caixinha com **dinheiro entre pessoas**: pagamentos PIX P2P confirmados manualmente (sem gateway — `ConfirmPaymentRequest` só exige acknowledgment), com `amount_cents` **persistido** em `payments` + lembretes. `docs/REVERB-DEPLOY.md` indica ambiente implantado com websockets. Último commit 2026-03-13 (dormante ~5 meses) — bom momento para migrar, mas staging observado continua obrigatório: registros financeiros + realtime + service worker em produção não perdoam deploy descuidado.

## 2. Já em conformidade

sorteiopix é **fonte** de vários itens da harvest — não re-portar, apenas reconciliar drift:

- PHP 8.4 + React 19 + Tailwind 4 + Pest 4 + Vitest (setup com mocks globais de Ziggy/matchMedia — origem do padrão).
- `lang/pt_BR` completo (auth, pagination, passwords, validation + `pt_BR.json`) com `TranslationTest` de guarda.
- Hooks Husky com issue-ID (`commit-msg`, `prepare-commit-msg`, `pre-push` com `ci:check`) + `scripts/git/get-issue-id.sh` — origem do padrão.
- `pint.json`, `rector.php`, scripts `ci:*` (composer e pnpm) com a mesma semântica.
- `semgrep.yml` com SARIF (origem do padrão) e `ci.yml` com jobs separados frontend/backend/quality.
- Impersonation completa, flash→toast com dedupe, kit data-table, dark mode `HandleAppearance`, notification center, rule `CpfCnpj`, single-action controllers com FormRequests por módulo — tudo fonte da harvest.
- `AGENTS.md` + `.github/copilot-instructions.md` + skills replicadas em `.github/.codex/.cursor`.

## 3. Divergências e riscos específicos

1. **Upgrade duplo obrigatório** — único projeto até aqui na ordem que precisa de 3a (L12→13) **e** 3b (Inertia 2→3). Jamais no mesmo PR (Princípio 2). Na 3a, validar compat dos pacotes que o boilerplate não tem: Reverb `^1.0`, Horizon `^5.45`, webpush `^10.5`, Socialite `^5.25`, owen-it auditing `^14`, log-viewer `^3.15`.
2. **Superfície Inertia 3b real**: 40 arquivos com `useForm`/`router.*`, 17 com `usePage`, SSR ativo. Usar a receita `fad56c0` já calibrada no ctjuris.
3. **⚠️ TRAP dinheiro em centavos**: `payments.amount_cents` persistido; o `currency.ts` local (format/parse/mask em centavos) alimenta esses valores. Na Fatia 5, o `money.ts` do boilerplate só entra com diff de API + testes espelho verdes — mudança silenciosa de parse corrompe valor financeiro digitado.
4. **⚠️ TRAP service worker/PWA**: SW em produção pode servir assets antigos após deploy das fatias 3a/3b. Observar a estratégia de update/reload de `lib/pwa.ts` no staging de cada fatia comportamental; um SW travado transforma rollback em "rollback que o cliente não recebe".
5. **`is_active` existe mas não é imposto** — User tem o campo e há `ToggleActiveController` na UI, porém `LoginRequest` não checa e não há `EnsureUserIsActive`. Ativar o middleware na Fatia 4 **muda comportamento real**: usuários já marcados inativos hoje conseguem logar; auditar antes (trap §4 do playbook).
6. **Strict mode sem `report()`**: `Model::shouldBeStrict()` seco no `AppServiceProvider` — em produção, lazy-loading violation vira 500 na cara do usuário. Não há Sentry no projeto (ADR `0006`). Fatia 4 corrige (strict + handlers com `report()`), e introduzir error tracking entra junto.
7. **CSP com realtime + push + OAuth**: `connect-src` precisa do host Reverb (`wss://`), `worker-src 'self'` para o service worker, `img-src` para avatares `googleusercontent`. **Report-only obrigatório** (§4 do playbook cita sorteiopix nominalmente); sem gateway de pagamento, mas websocket bloqueado por CSP mata o realtime silenciosamente.
8. **CI bom, mas sem os gates novos**: suíte só em SQLite (produção é MySQL — sem gate de migrations real), actions pinadas por tag `@v4` (não SHA), sem `concurrency`/cancel-in-progress, sem job `security` (composer/pnpm audit), rector em `continue-on-error` (boilerplate bloqueia).
9. **Código local que o boilerplate agora supre** (Fatia 5): `masks.ts`/`currency.ts`/`numeric.ts` + `CurrencyInput`/`IntegerInput` vs `masks.ts`/`money.ts`/`MaskedInput` canônicos. **Ficam**: `PixKey` (rule + VO — domínio), `EntropyProvider` (sorteio auditável), DTOs de draw.
10. **Auditing é `owen-it`, não activitylog** — não trocar o pacote na rodada (dado de auditoria persistido em `audits`); apenas garantir que o `AuditUserResolver` (impersonation-aware) sobreviva aos upgrades.
11. Menores: sem `.ai/rules` e sem `CLAUDE.md` (só AGENTS.md/copilot); sem `.mise.toml`, sem `dependabot.yml`, `pnpm-workspace.yaml` sem `minimumReleaseAge`; throttles mágicos (`throttle:6,1`, `throttle:10,1`); validação inline em 5 controllers de Auth/Settings; sem `tests/Browser`; sem `resources/views/errors/`; `composer name` nunca renomeado.

## 4. Fatias aplicáveis (ordem para este projeto)

1. **Fatia 0 — Baseline**: reconciliar `ci.yml` com o do boilerplate (SHA-pinning, concurrency, job security, rector bloqueante, pnpm 11.5.3) **mantendo as versões atuais** (L12/Inertia 2 — o CI descreve o presente); `semgrep.yml` já é o padrão. Documentar aqui a contagem verde (32 Pest + 41 vitest).
2. **Fatia 1 — Redes de segurança**: introduzir Larastan (`phpstan.neon.dist` + `--generate-baseline`, `ci:stan` no `ci:check`); gate de migrations em **MySQL 8 real** no CI; smoke browser mínimo (não há `tests/Browser`) dos fluxos que pagam as contas: login, criação de grupo, ciclo, **sorteio** (com `bindFixedEntropy()`), confirmação de pagamento PIX, notificações.
3. **Fatia 2 — Tooling/CI**: só deltas — `.mise.toml`, pnpm 10.32.1→11.5.3, `dependabot.yml`, `minimumReleaseAge: 10080` no `pnpm-workspace.yaml` (preservar `onlyBuiltDependencies: esbuild`). Hooks/pint/rector já são o padrão. Antecipar `.ai/rules/` + `CLAUDE.md` mesclado ao `AGENTS.md` existente.
4. **Fatia 3a — Laravel 12→13**: Shift + revisão manual; diffar `config/`, `bootstrap/app.php` e `lang/` (trap de chaves L12, §4); atenção aos 6 pacotes fora do baseline (risco #1). Gate: suíte + gate MySQL + staging com Reverb/Horizon/push funcionando e **service worker atualizando** (risco #4).
5. **Fatia 3b — Inertia 2→3**: receita `fad56c0` já rodada no ctjuris; republicar `config/inertia.php` v3; tipar `resolve()` em `app.tsx`/`ssr.tsx`; caçar eventos renomeados/cancelamento nos 40 arquivos; gate = tsc + eslint + prettier + vitest + `build:ssr` + health SSR + Pest.
6. **Fatia 4 — Hardening**: `SecurityHeaders` com CSP **report-only** 1–2 semanas (allowlist `wss://` Reverb, `worker-src`, googleusercontent — risco #7) + `stamp()` no exception handler; `SetSensitiveCacheHeaders`; `EnsureUserIsActive` + checagem no `LoginRequest` (auditar inativos logados antes — risco #5); páginas de erro (não existem); strict mode com `report()` + error tracking Sentry (risco #6).
7. **Fatia 5 — Kit BR/dedupe**: diff `currency.ts` local vs `money.ts` canônico **com testes espelho antes** (risco #3); trocar `masks.ts` local pelo kit, deletar cópias no mesmo PR; adotar `MaskedInput`; manter `PixKey`/`EntropyProvider` (domínio). Sem hash de CPF persistido aqui — a trap do spinmax não se aplica.
8. **Fatia 6 — Convenções**: rate limiters nomeados no lugar dos `throttle:N,1`; migrar validação inline dos 5 controllers Auth/Settings para FormRequests; sync do trait `HasRolesAndPermissions` com o canônico (ADR `0001`); renomear `composer name`; respeitar ADRs (Ziggy fica, sem TanStack, sem Telescope, Sentry).

## 5. Estado

- [ ] ⬜ Fatia 0 — Baseline (reconciliar ci.yml: SHA-pin, concurrency, security job)
- [ ] ⬜ Fatia 1 — Redes de segurança (Larastan baseline, gate MySQL, smoke browser do sorteio/pagamento)
- [ ] ⬜ Fatia 2 — Tooling/CI (mise, pnpm 11.5.3, dependabot, `.ai/rules` antecipado)
- [ ] ⬜ Fatia 3a — Laravel 12→13 (compat Reverb/Horizon/webpush/Socialite/auditing)
- [ ] ⬜ Fatia 3b — Inertia 2→3 (receita `fad56c0` herdada do ctjuris)
- [ ] ⬜ Fatia 4 — Hardening (CSP report-only c/ wss, EnsureUserIsActive, strict+report, Sentry)
- [ ] ⬜ Fatia 5 — Kit BR/dedupe (⚠️ diff `currency.ts`/centavos antes do merge)
- [ ] ⬜ Fatia 6 — Convenções (rate limiters, Form Requests, RBAC sync, composer name)

Última atualização: 2026-08-10 (gap-report inicial)
