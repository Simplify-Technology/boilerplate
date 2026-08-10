# Gap-report — ctfinance

Projeto #6 na ordem do [PLAYBOOK](../PLAYBOOK.md) (§2): penúltimo, deliberadamente — financeiro, mas chega com a rede de segurança mais forte dos derivados (suíte browser própria) e herda a receita Inertia 2→3 já validada em ctjuris/sorteiopix.

## 1. Stack atual (verificado no disco em 2026-08-10)

| Item | ctfinance | Alvo (boilerplate) |
| --- | --- | --- |
| PHP | ^8.4 | ^8.4 ✅ |
| laravel/framework | **^12.0** | ^13.0 |
| inertiajs/inertia-laravel | **^2.0** | ^3.0 |
| @inertiajs/react | **^2.3.21** | ^3.4.0 |
| React / Tailwind / Vite | 19.2 / 4.2 / 7.3 | paridade ✅ |
| pestphp/pest | ^4.1 (Feature + Browser/Playwright, 115 arquivos de teste) | ^4 ✅ |
| larastan | **ausente** (sem phpstan.neon) | ^3.10, nível 6 |
| pint / rector | ^1.18 / ^2.0 | presentes ✅ |
| Node/pnpm (.mise.toml) | node 22.22.1 / **pnpm 10.33.0** | pnpm 11.5.3 |
| Extras backend | Socialite, Pulse, owen-it/laravel-auditing, log-viewer, Ziggy | — |

**Criticidade: ALTA.** SaaS financeiro BR (pessoal/família/MEI) com dados financeiros persistidos de usuários e **cobrança recorrente via Asaas** (`config/billing.php`, `app/Services/Billing/AsaasService.php`, webhook com `VerifyAsaasSignature`, `EnsureSubscriptionActive`). Fluxo LGPD com exclusão agendada/hard delete já em uso. Tratar como produção com pagamento real: deploy de fatias comportamentais fora de pico e staging observado.

## 2. Já em conformidade

- **CI/workflows:** `.github/workflows/ci.yml`, `semgrep.yml` e `browser.yml` (gate PR + nightly) existem.
- **Testes:** Pest 4 com testsuite Browser separada (`tests/Browser/BrowserTestCase.php` + 8 browser tests), Vitest, scripts `ci:check`/`ci:browser` no composer.
- **Tooling:** `pint.json`, `rector.php`, hooks Husky completos (guard de branch + auto-prefixo de issue via `scripts/git/get-issue-id.sh`), `.mise.toml`, `pnpm-workspace.yaml`.
- **Hardening parcial:** `SecurityHeaders` e `SetSensitiveCacheHeaders` próprios e testados; throttle explícito nas rotas de auth com teste de contrato (`AuthRouteThrottleTest`).
- **i18n:** `lang/pt_BR/` completo (validation, auth, passwords, messages) + `pt_BR.json`.
- **Frontend:** `HandleAppearance` (tema sem FOUC), pipeline flash→toast, `resolve-inertia-page` deploy-safe, FormField com a11y — vários destes foram a **origem** do padrão do boilerplate na harvest.
- **Convenções:** 39 Form Requests já em uso; RBAC enum-backed próprio (alinhado ao ADR `0001-rbac-proprio`); CLAUDE.md e `.cursor/rules` maduros.

## 3. Divergências e riscos específicos

1. **Sem Larastan.** Nenhuma análise estática de tipos; é o maior gap da rede de segurança (Fatia 1). Baseline congelando o passivo, não zero-erros.
2. **Upgrade duplo pendente:** L12→L13 e Inertia 2→3 (Fatias 3a/3b, nunca no mesmo PR).
3. **Kit BR local que o boilerplate agora supre:** `app/Rules/CpfCnpj.php`, `app/Helpers/MoneyHelper.php`, `resources/js/utils/format/masks.ts` vs `app/Support/Br/*` + `masks.ts`/`money.ts`/`masked-input` do boilerplate. **Trap:** `MoneyHelper` grava valores em colunas DECIMAL — antes do dedupe, testes de paridade `toCents`/`fromCents` contra `money.ts`/helpers novos com valores reais (arredondamento divergente corrompe saldo silenciosamente). Sem trap de hash de CPF aqui (isso é spinmax).
4. **Middleware com versões próprias:** `SecurityHeaders`/`SetSensitiveCacheHeaders` locais divergem do boilerplate (sem `SecurityHeaders::stamp()` no exception handler, política CSP própria). Alinhar, não duplicar. **CSP: report-only obrigatório** (§4 do playbook) — checkout/webhook Asaas e scripts do gateway não podem quebrar.
5. **Webhook Asaas é rota crítica:** ao portar hardening/rate limiting, garantir que `VerifyAsaasSignature` e a rota de webhook fiquem fora de CSRF/throttle agressivo/no-store indevido. Smoke de billing verde antes das fatias 4–6.
6. **Auditoria divergente:** usa owen-it/laravel-auditing; boilerplate padroniza spatie/laravel-activitylog. **Não trocar mecanicamente** — trilha de auditoria de models financeiros é dado persistido e requisito de compliance; decisão explícita na Fatia 6 (manter owen-it como desvio registrado ou plano de migração de dados).
7. **Sem Sentry** (ADR `0006-error-tracking-sentry`) e sem strict mode com report em produção.
8. **Sem PiiScrubber nos logs** — app financeiro logando sem scrubbing de PII é risco LGPD direto; prioridade dentro da Fatia 4.
9. **Rate limiters mágicos** (`throttle:5,1`/`10,1`/`6,1`) em vez de nomeados; ao migrar, atualizar o `AuthRouteThrottleTest` junto (o contrato é o valor, não a sintaxe).
10. **Supply-chain incompleto:** sem `.github/dependabot.yml`; `pnpm-workspace.yaml` só tem `allowBuilds` (sem `minimumReleaseAge`); pnpm 10.33.0 vs 11.5.3 do boilerplate; SHA-pinning das actions a verificar.
11. **Sem `.ai/rules/`** (tem `.cursor/rules` própria) e `declare(strict_types=1)` ausente em arquivos pontuais (`EnsureSubscriptionActive`, `HandleInertiaRequests`, `HandleAppearance`).
12. **Inline validation residual:** 7 controllers com `$request->validate(` (Fatia 6, por módulo).
13. **PWA (vite-plugin-pwa):** o service worker cacheia bundles — no upgrade Inertia/Vite (3b), validar denylist e fluxo de update do SW junto com o `resolve-inertia-page`, senão bundle stale vira incidente.

## 4. Fatias aplicáveis (ordem para este projeto)

| Fatia | Aplica? | Notas para ctfinance |
| --- | --- | --- |
| 0 — Baseline | ✅ (auditoria de paridade) | Workflows já existem; falta paridade com o `ci.yml` do boilerplate: job `quality` com Larastan, gate MySQL 8, job `security` (composer/pnpm audit), SHA-pinning. CI descreve o presente (L12/Inertia 2). Documentar aqui a contagem/cobertura da suíte. |
| 1 — Redes de segurança | ✅ | Foco: **Larastan + baseline** (hoje inexistente) e gate MySQL. Cobertura Feature/Browser já é forte — ampliar smoke browser para billing Asaas (assinatura de webhook + bloqueio por `EnsureSubscriptionActive`) e fluxos LGPD. |
| 2 — Tooling/CI | ✅ (delta pequeno) | Adicionar dependabot.yml, `minimumReleaseAge: 10080`, pnpm 10→11.5.3 (+ `.mise.toml` e `packageManager`), conferir scripts `ci:*`. **Antecipar `.ai/rules/` + AGENTS.md** (reconciliar com `.cursor/rules` existente, não duplicar). |
| 3a — Laravel 12→13 | ✅ | Shift + diff de `config/` e `lang/` (trap §4: chaves L12≠L13; `lang/pt_BR` local é mais completo que o do boilerplate — preservar). Staging observado antes da 3b. |
| 3b — Inertia 2→3 | ✅ | Receita do commit `fad56c0`. Atenção extra: SSR habilitado, PWA/service worker (item 13 acima) e `resolve-inertia-page` customizado no `app.tsx`/`ssr.tsx`. Gate inclui `build:ssr` + suíte browser inteira. |
| 4 — Hardening | ✅ (parcial) | Alinhar `SecurityHeaders`/`SetSensitiveCacheHeaders` locais à versão do boilerplate (+ `stamp()` no handler). CSP **report-only 1–2 semanas** com allowlist Asaas. Adicionar: PiiScrubber (prioridade), `EnsureUserIsActive` (trap §4: sessões vivas), TRUSTED_PROXIES, páginas de erro, strict mode + Sentry. |
| 5 — Kit BR / dedupe | ✅ | Trocar `MoneyHelper`/`masks.ts`/`CpfCnpj` locais pelo kit do boilerplate **com testes de paridade monetária antes** (item 3 acima); deletar cópias locais no mesmo PR. |
| 6 — Convenções | ✅ (delta pequeno) | 7 controllers → Form Requests; rate limiters nomeados; `strict_types` faltantes; decisão registrada sobre owen-it vs activitylog; sincronizar trait RBAC com o do boilerplate. |

## 5. Estado

- [ ] ⬜ Fatia 0 — Baseline (paridade de CI + documentação da suíte)
- [ ] ⬜ Fatia 1 — Redes de segurança (Larastan + baseline, gate MySQL, smoke billing/LGPD)
- [ ] ⬜ Fatia 2 — Tooling/CI (dependabot, minimumReleaseAge, pnpm 11, `.ai/rules` antecipado)
- [ ] ⬜ Fatia 3a — Upgrade Laravel 12→13
- [ ] ⬜ Fatia 3b — Upgrade Inertia 2→3
- [ ] ⬜ Fatia 4 — Hardening (CSP report-only→enforce, PiiScrubber, Sentry, strict mode)
- [ ] ⬜ Fatia 5 — Kit BR / dedupe (com testes de paridade monetária)
- [ ] ⬜ Fatia 6 — Convenções (Form Requests, limiters nomeados, decisão de auditoria)

Última atualização: 2026-08-10 (gap-report inicial)
