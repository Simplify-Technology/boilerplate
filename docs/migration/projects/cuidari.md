# Gap-report — cuidari

> Verificado no disco em 2026-08-10 (`~/workspace/laravel/simplify-technology/cuidari`, branch `22-optical-lab-pdf-board`).
> Fatias referenciadas: [PLAYBOOK.md](../PLAYBOOK.md).

## 1. Stack atual e criticidade

| Item | Valor verificado |
| ---- | ---------------- |
| PHP / Laravel | `^8.4` / `laravel/framework ^13.0` |
| Inertia | `inertiajs/inertia-laravel ^3.0` + `@inertiajs/react ^3.4.0` |
| Frontend | React `^19.2.7`, Tailwind `^4.3.0`, pnpm `11.5.3` via corepack |
| Testes | Pest `^4.1` (95 arquivos: 88 Feature — inclui suíte `Foundation` —, 7 Unit) + 5 testes vitest |
| Qualidade | Pint `^1.18`, Rector `^2.0`; **sem Larastan/PHPStan** (nem `phpstan.neon`, nem `ci:stan`) |
| Extras | Horizon `^5.45`, dompdf `^3.1`, spatie/activitylog `^5.0`, log-viewer, Ziggy `^2.4` |

Fork direto do boilerplate (`composer.json` ainda se chama `simplify-technology/boilerplate`). SaaS multi-tenant de clínicas/óticas em **desenvolvimento ativo** (commits diários na issue #22). Criticidade: módulo financeiro pesado (Payable/Receivable/Payment/FinancialLedgerEntry/caixa) com dinheiro **persistido** em `decimal(12,2)` via MoneyCast; **dados de saúde de pacientes (LGPD)**; billing da plataforma por enum `PlatformPaymentProvider` (Manual|Asaas) — **sem SDK de gateway instalado**, logo sem integração de pagamento viva a proteger. Sem realtime.

## 2. Já em conformidade

- Laravel 13 + PHP 8.4 + Inertia v3 + React 19 + Tailwind 4 + Pest 4 (todo o alvo da Fatia 3).
- `config/inertia.php` v3 presente; pnpm 11.5.3 por corepack igual ao CI do boilerplate.
- Husky com os 4 hooks (`pre-commit`, `pre-push`, `commit-msg`, `prepare-commit-msg`), `pint.json`, `rector.php`, scripts `ci:*` no composer/package.
- CI com jobs frontend (types/lint/format/vitest/build), backend (Pest SQLite), quality (Pint) e `semgrep.yml`.
- RBAC próprio (`HasRolesAndPermissions`, ADR 0001) + `PermissionRoleSeeder` + comando `sync-permissions`.
- 53 Form Requests cobrindo a escrita de domínio; DTOs `final readonly`; Ziggy mantido (ADR 0002); sem Telescope/TanStack/Sanctum (ADRs 0003–0005).
- Cobertura forte de invariantes: suíte `tests/Feature/Foundation` (config, seeders, tenancy, casts, shared props) + `SchemaIdentifierLengthTest`.

## 3. Divergências e riscos específicos

- **Sem análise estática nenhuma.** Nem Larastan, nem baseline, nem `ci:stan` no `ci:check`. Maior gap individual do projeto.
- **CI do fork está defasado:** actions por tag (sem SHA-pinning), sem `concurrency`/`cancel-in-progress`, sem job `security` (composer/pnpm audit), sem service MySQL 8 para gate de migrations, job Rector com `continue-on-error`.
- **Hardening ausente por completo:** sem `SecurityHeaders`, `SetSensitiveCacheHeaders`, `EnsureUserIsActive`, `PiiScrubber`, páginas de erro, `TRUSTED_PROXIES`, strict mode com `report(...)`, **sem Sentry** (ADR 0006). Grave dado o domínio LGPD/saúde.
- **Código local que o boilerplate agora supre (dedupe reverso):** o kit BR do boilerplate foi **colhido deste projeto** — `app/Services/PhoneNormalizer.php`, `app/Services/CpfFormatter.php`, `resources/js/utils/format/money.ts` e `masks.ts` locais viram imports de `app/Support/Br/*` e `utils/format/*`. Deve ser mecânico, mas conferir assinaturas pós-harvest; falta também `ui/masked-input.tsx`.
- **Trap de dados persistidos (Fatia 5):** telefone gravado em E.164 e CPF em dígitos puros — o normalizador/formatter novos precisam preservar exatamente essas formas. `CpfHasher` (HMAC) **não é usado aqui**: não adotar no dedupe; a trap de HMAC é do spinmax.
- **Trap `is_active` (Fatia 4):** o domínio já tem `is_active` com `ToggleActiveController`, mas login não o verifica. Ativar `EnsureUserIsActive` derruba sessões vivas de users inativos no deploy — auditar antes, deployar fora de pico.
- **Sem `lang/`:** o boilerplate tem `lang/pt_BR` completo; middleware/testes copiados que dependem de chaves de tradução quebram — copiar `lang/` junto na Fatia 4.
- **Supply-chain frouxa:** `pnpm-workspace.yaml` com `minimumReleaseAge: 0` (boilerplate: `10080`); sem `dependabot.yml`; sem `.mise.toml`.
- **Sem `.ai/rules/`** (usa `.cursor` + `AGENTS.md`/`CLAUDE.md` herdados do fork antigo) e **sem `tests/Browser`** (nenhum smoke browser).
- Validação inline remanescente em 7 controllers (`Auth/*`, `Settings/*`, `PermissionRole/*` — scaffolding herdado) e **nenhum** rate limiter nomeado (`RateLimiter::for` inexistente).

## 4. Fatias aplicáveis (ordem para este projeto)

| Ordem | Fatia | Notas para o cuidari |
| ----- | ----- | -------------------- |
| 1 | **Fatia 0 — Baseline** | Não é criar o CI, é atualizá-lo para paridade: SHA-pinning, `concurrency`, job `security`, Rector sem `continue-on-error`. Documentar a suíte atual (95 arquivos) no gate. |
| 2 | **Fatia 1 — Redes de segurança** | Larastan do zero com baseline (`phpstan.neon.dist` + `ci:stan` no `ci:check`); gate MySQL real no CI (complementa o `SchemaIdentifierLengthTest` local); smoke browser mínimo das rotas-chave (login, pacientes, PDV, O.S., financeiro). Fluxos críticos já bem cobertos — só documentar. |
| 3 | **Fatia 2 — Tooling/CI** | Quase pronta. Falta: `dependabot.yml`, `.mise.toml`, `minimumReleaseAge: 10080`. **Antecipar `.ai/rules/` + `CLAUDE.md`/`AGENTS.md` adaptados aqui.** |
| — | **Fatia 3 (a e b) — não se aplica** | Já é L13/PHP 8.4/Inertia v3/React 19. Ressalva: copiar `lang/pt_BR` do boilerplate (ver §3) antes da Fatia 4. |
| 4 | **Fatia 4 — Hardening** | Aplicável na íntegra + Sentry. CSP em report-only primeiro (front sem terceiros aparente — janela pode ser curta); `PiiScrubber` prioritário (dados de saúde); trap `is_active` (§3); `TRUSTED_PROXIES` antes de HSTS em produção. |
| 5 | **Fatia 5 — Kit BR / dedupe** | Dedupe reverso (§3): substituir os originais locais pelos do boilerplate e **deletar** os locais no mesmo PR. Preservar E.164 e CPF em dígitos; sem `CpfHasher`. Trazer `masked-input.tsx` + testes do kit. |
| 6 | **Fatia 6 — Convenções** | Migrar os 7 controllers com validação inline; criar rate limiters nomeados (`throttle:auth` no login); sync `HasRolesAndPermissions` com o do boilerplate (diff pós-harvest); renomear `composer.json` para `simplify-technology/cuidari`. Kebab-case já ok. |

## 5. Estado

- [ ] ⬜ Fatia 0 — Baseline (paridade do ci.yml: SHA-pinning, concurrency, job security)
- [ ] ⬜ Fatia 1 — Redes de segurança (Larastan + baseline, gate MySQL, smoke browser)
- [ ] ⬜ Fatia 2 — Tooling/CI (dependabot, .mise.toml, minimumReleaseAge, .ai/rules antecipado)
- [ ] ⬜ Fatia 4 — Hardening (headers, PiiScrubber, EnsureUserIsActive, error pages, Sentry)
- [ ] ⬜ Fatia 5 — Kit BR / dedupe (Support/Br + utils/format + masked-input, deletar locais)
- [ ] ⬜ Fatia 6 — Convenções (validação inline restante, rate limiters, RBAC sync, rename do pacote)

Última atualização: 2026-08-10 (gap-report inicial)
