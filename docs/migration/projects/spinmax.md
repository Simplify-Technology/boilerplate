# Gap-report — spinmax

Projeto **#7 (último) na ordem do [PLAYBOOK](../PLAYBOOK.md)** — deliberadamente: e-commerce com pagamento real, upgrade duplo (L12→13 + Inertia 2→3) e a trap do HMAC de CPF. Só recebe fatias com o playbook rodado 6 vezes.

## 1. Stack atual (verificada no disco em 2026-08-10)

| Item | spinmax | Boilerplate | Gap |
| ---- | ------- | ----------- | --- |
| PHP / Laravel | `^8.4` / `^12.0` | `^8.4` / `^13.0` | ❌ Fatia 3a |
| Inertia (back/front) | `^2.0` / `@inertiajs/react ^2.3.27` | `^3.0` / `^3.4.0` | ❌ Fatia 3b |
| React / Tailwind / Vite | `^19.2.8` / `^4.3.3` / `^7.3.6` | 19 / 4 / 7 | ✅ paridade |
| Pest / Pint / Rector | `^4.1` / `^1.18` / `^2.0` + `pest-plugin-browser ^4.3` | Pest `^5.1` / idem / idem (sem browser) | ❌ Pest → Fatia 2; à frente no browser |
| Larastan | **ausente** (sem `phpstan.neon*`; `ci:check` = pint `--test` + pest) | `^3.10`, level 6 no `ci:check` | ❌ Fatia 1 |
| Workflows GitHub | `ci.yml` + `semgrep.yml` **ativos** (actions por tag `@v4`, sem SHA) | ativos, SHA-pinned | ajuste Fatia 0/2 |
| pnpm / Node | `11.17.0` / Node 24 (`.mise.toml`) | `11.19.0` / Node 24 | boilerplate agora em 11.19/24 — alinhar na Fatia 2 |
| Banco / fila | MySQL (prod; suíte SQLite `:memory:`) + Redis/**Horizon** `^5.48` | MySQL no gate de CI | ✅ gate já existe |

Extras relevantes: **Mercado Pago** (`mercadopago/dx-php ^3.10` + `@mercadopago/sdk-react`), `owen-it/laravel-auditing ^14.0`, `resend/resend-laravel ^1.4`, Ziggy, SSR (`build:ssr`), backup GPG→R2 com restore-drill, healthcheck de fila/backup. Sem realtime/broadcast.

**Criticidade: MÁXIMA.** E-commerce em **produção com pagamento real** (checkout Pix/cartão), clientes ativos e desenvolvimento intenso (último commit **2026-08-10**, PR #153). CPF cifrado + `cpf_hash` **persistido** (`customers`, retenção fiscal). Regras do §4 do playbook valem integralmente: deploy fora de pico sempre, rollback ensaiado, e **smoke de checkout verde antes de qualquer fatia**.

## 2. Já em conformidade

spinmax é a maior fonte da harvest — reconciliar drift, não re-portar:

- React 19 + Tailwind 4 + Vite 7 + Pest 4 + Pint + Rector; scripts `ci:*` com semântica do boilerplate (composer e pnpm).
- CI ativo e abrangente: gate de migrations em **MySQL 8 real** (Fatia 0/1 em grande parte pronta), smoke browser com screenshots como artifact, jobs quality/security (`composer audit` high/critical + `pnpm audit --prod`), rector dry-run, Semgrep.
- `tests/Browser/ShopSmokeTest.php` (pest-plugin-browser + Playwright) e grupos `browser`/`contract` fora da suíte padrão via `phpunit.xml`.
- Hardening parcial já é o padrão: `SecurityHeaders` com `stamp()`, `EnsureUserIsActive`, PiiScrubber em logs, mail allowlist fora de produção.
- Kit BR completo (fonte da harvest): `MaskedInput`/`CurrencyInput`/`masks.ts`/`money.ts` + `Money.php`/`Cpf.php`; data-table kit; flash→toast com dedupe; `check-contrast.mjs`.
- RBAC enum-driven + `RbacSyncCommand`, impersonation auditada, webhook inbox (`webhook_events` + reprocesso/prune). **Ressalva:** "em conformidade" aqui significa *mesma arquitetura*, não *mesmo código* — o RBAC divergiu nos dois sentidos desde a origem comum. Ver §4.
- `lang/pt_BR` completo; `.mise.toml`; `pnpm-workspace.yaml` com overrides de supply-chain; Husky (`pre-commit`, `commit-msg`); `AGENTS.md` + `.github/skills/`; Form Requests já existem em Auth/Settings/Shipping/Shop/Store/User.

## 3. Divergências e riscos específicos

1. **⚠️ TRAP HMAC de CPF (confirmada no código).** `app/Support/Cpf.php` faz `hash_hmac('sha256', normalize($cpf), config('app.key'))` — **APP_KEY crua, sem derivação**. O `CpfHasher` do boilerplate deriva chave com contexto `app:cpf-hash:v1` → **os hashes NÃO batem**. `cpf_hash` está persistido em `customers`, usado para dedupe/busca (`Customer::findByCpf`) e mantido por retenção fiscal. Troca silenciosa quebra busca e unicidade sem erro visível. Fatia 5 exige teste de compatibilidade contra valores reais ANTES do merge; preservar formato legado ou re-hash deliberado com `down()` real. Rotação de `APP_KEY` também invalida os hashes.
2. **Upgrade duplo com dinheiro no meio.** Único projeto que precisa de 3a E 3b com checkout em produção. 3a antes de 3b, staging observado dias entre elas, janela de baixo tráfego, jobs de webhook Mercado Pago em voo durante deploy (fila Redis/Horizon — drenar/observar).
3. **CSP × Mercado Pago.** O `SecurityHeaders` local só preenche 3 headers ausentes, sem CSP. O SDK MP injeta scripts inline e chama hosts externos: CSP **report-only obrigatório** com allowlist dos domínios MP por 1–2 semanas antes de enforce (§4 do playbook) — checkout quebrado por CSP é perda de receita direta.
4. **Dedupe às avessas (Fatia 5).** spinmax é a *origem* de masks/money/inputs/PiiScrubber, mas o boilerplate canonizou em paths diferentes (`app/Support/Br/*`, `app/Support/Logging/*` + `PiiAwareTap`) e pode ter evoluído. Reconciliar por diff, adotar a canônica, deletar locais no mesmo PR — exceto o hasher (risco #1).
5. **Larastan ausente** — nem pacote nem config; `ci:check` sem análise estática. Fatia 1 com `--generate-baseline`.
6. **Dois trilhos de auditoria.** Local usa `owen-it/laravel-auditing` (tabela `audits` com dados de produção + `AuditUserResolver` + fila dedicada `AUDIT_QUEUE_CONNECTION`); boilerplate usa spatie/activitylog. **Não migrar** — registrar exceção documentada na Fatia 6; verificar compat do auditing no upgrade 3a.
7. **Resend** como provider de e-mail — escolha por cliente, fica (inventário: "no" para o boilerplate).
8. **`tests/Contract`** roda contra sandbox MP real — manter fora dos gates de fatia (já excluído da suíte padrão).
9. **pnpm 11.17.0 / Node 24** — o boilerplate re-congelado alcançou e passou (11.19.0 / Node 24): Node já em paridade; alinhar pnpm 11.17→11.19 na Fatia 2 (não é mais exceção).
10. Menores: actions por tag (sem SHA), sem `dependabot.yml`, Husky sem `pre-push`/`prepare-commit-msg` (ci:check não roda no push), sem `.ai/rules`/`CLAUDE.md` (tem AGENTS.md + skills — mesclar, não sobrescrever), sem `SetSensitiveCacheHeaders`, sem `resources/views/errors/`, validação inline em ~7 controllers (Auth/Settings/PermissionRole), só 1 rate limiter nomeado (`mp-webhook`).

## 4. Drift bidirecional do RBAC

O boilerplate **nasceu do spinmax**, e os dois evoluíram separados. Não existe um lado canônico para o RBAC inteiro: existe um lado canônico **por arquivo**. Sem este registro, em seis meses ninguém sabe qual é qual — e a Fatia 6 corre o risco de "sincronizar" desfazendo correção.

### 4.1 O que o boilerplate já colheu do spinmax (harvest reversa, 2026-08-11)

Sentido **inverso** ao das fatias, independente da numeração: o spinmax não precisou "chegar na vez dele". Cinco PRs, todos mergeados — só mecanismo, estrutura e texto; nenhuma regra de negócio da loja veio junto.

| PR | O que veio | Onde estava no spinmax |
| -- | ---------- | ---------------------- |
| #36 | Teto de prioridade no RBAC: `outranks()` + `effectiveActor()` na `UserPolicy`, `mutatePermissions()` separado da leitura, `assignRole()` na policy, `ensureActorMayEdit()` no editor de cargos | `UserPolicy`, `PermissionRole/UpdateController` |
| #39 | `canManagePermissions` lendo `manage_permissions` (o backend sempre exigiu essa) | `use-user-permissions.ts` |
| #41 | Pente editorial: "Cargos" como termo único, consequência em vez de nome de tela, estados vazios acionáveis | diffs de `pages/users/*` e `pages/permission-role/*` |
| #43 | `description()` em `Permissions` e `Roles` | `app/Enum/Permissions.php`, `app/Enum/Roles.php` |
| #45 | `Roles::isSelectable()`, `ImpersonationService::stop()` resolvendo antes de limpar a sessão, `Cache::forget` no seeder | `Roles.php`, `ImpersonationService`, `PermissionRoleSeeder` |

Quatro escaladas de privilégio estavam **vivas no boilerplate** e foram fechadas por #36 — o spinmax já as tinha resolvido. Os textos dos cargos **não** portaram literais: o spinmax tem `OPERATIONS`/`ACCOUNTING` onde o boilerplate tem `MANAGER`, e o `SUPER_USER` dele nomeia o cliente.

### 4.2 O que o boilerplate deve DEVOLVER na Fatia 6

Aqui o boilerplate está à frente. Ao sincronizar o RBAC, estes três vão no sentido boilerplate → spinmax:

1. **Bug em `getAllPermissions()`** — o spinmax tem `$this->role?->permissions->merge($this->permissions)->unique('id') ?? collect()`. O `?->` curto-circuita a **expressão inteira**: para um usuário **sem cargo**, o resultado é `collect()` vazio e as **permissões avulsas dele somem**. O boilerplate resolve o cargo primeiro (`$this->role->permissions ?? collect()`) e só então faz o merge. É correção de bug, não estilo.
2. **`unsetRelation()` no `refreshPermissionsCache()`** — sem descartar as relations memoizadas antes de recomputar, um `assignRole()`/`givePermissionTo()` grava no cache `rememberForever` as permissões do **cargo antigo**. O spinmax só faz `forget` + `rememberForever`.
3. **`role="alertdialog"` + `autoFocus` no botão seguro** do `delete-confirmation-dialog.tsx` — o spinmax tem o componente sem os dois. Leitor de tela não anuncia o diálogo como destrutivo, e o foco inicial não cai no "Cancelar".

Vale também o que a §3.4 já diz do kit BR: reconciliar **por diff**, adotar a canônica, deletar a local no mesmo PR.

### 4.3 O que NÃO deve ser sincronizado

- **A matriz de cargos.** `OPERATIONS`/`ACCOUNTING` são da operação da loja; `MANAGER` é do boilerplate. As descrições de `Roles::description()` descrevem matrizes diferentes de propósito.
- **As descrições das permissões de loja** (`VIEW_ORDERS`, `MANAGE_SHIPPING_TABLE`, …) — não existem no boilerplate e não devem existir.
- **`RbacSyncCommand` × `permissions:sync`** — mesmo papel, nomes diferentes; decidir na Fatia 6 qual nome fica, sem re-portar lógica.

## 5. Fatias aplicáveis (ordem para este projeto)

0. **Pré-requisito (§4 do playbook): smoke de checkout completo verde.** `ShopSmokeTest` existe — ampliar para o fluxo Pix/cartão com fakes (pest-plugin-browser roda no processo do teste; `Http::fake` vale). Nenhuma fatia entra sem isso.
1. **Fatia 0 — Baseline**: CI já ativo e estruturalmente próximo do alvo (spinmax é fonte do `ci.yml` do boilerplate). Deltas: SHA-pinning das actions, reconciliar `concurrency`/jobs com o boilerplate, documentar aqui a contagem/cobertura da suíte e o que está em `browser`/`contract`.
2. **Fatia 1 — Redes de segurança**: introduzir Larastan (`phpstan.neon.dist` + `--generate-baseline`, `ci:stan` no `ci:check`). Gate MySQL **já existe**; smoke browser **já existe** — o trabalho novo é o Larastan e o smoke de checkout do item 0.
3. **Fatia 2 — Tooling/CI**: `dependabot.yml`, SHA-pinning, Husky `pre-push` + `prepare-commit-msg` + `format-dirty.mjs`/`get-issue-id.sh`, `minimumReleaseAge` (mesclar com os overrides locais do `pnpm-workspace.yaml`). Alinhar pnpm 11.17→11.19.0 (risco #9; Node 24 já em paridade). Inclui toolchain de teste → alvo novo (Pest 5, Vitest 4, ESLint 10, TS ~6.0, Node 24, pnpm 11.19). Antecipar `.ai/rules/` + `CLAUDE.md` mesclando com AGENTS.md/skills locais.
4. **Fatia 3a — Laravel 12→13**: Shift + revisão manual; diffar `config/` e `lang/` (trap §4); validar Horizon e laravel-auditing na major nova; janela de baixo tráfego, staging observado dias, fila drenada no deploy.
5. **Fatia 3b — Inertia 2→3**: receita `fad56c0` já validada em ctjuris/sorteiopix/ctfinance; republicar `config/inertia.php` v3; tipar `resolve()` em `app.tsx`/`ssr.tsx` (SSR ativo); caçar eventos renomeados/cancelamento antigo; atenção ao `@mercadopago/sdk-react` no build. Gate = tsc + eslint + prettier + vitest + `build:ssr` + Pest + **smoke de checkout**.
6. **Fatia 4 — Hardening**: evoluir o `SecurityHeaders` local para o do boilerplate com **CSP report-only** + allowlist Mercado Pago (risco #3); `SetSensitiveCacheHeaders`; páginas de erro; strict mode com `report()`. `EnsureUserIsActive` já existe — só reconciliar com `LoginRequest`.
7. **Fatia 5 — Kit BR/dedupe**: **teste de compatibilidade do hash de CPF primeiro** (risco #1); depois dedupe por diff de masks/money/inputs/PiiScrubber para os paths canônicos, deletando locais no mesmo PR.
8. **Fatia 6 — Convenções**: Form Requests nos ~7 controllers com validação inline; rate limiters nomeados além de `mp-webhook`; kebab-case; sync do trait RBAC com o boilerplate **no sentido §4.2** (os três itens de devolução, com o bug do `?->` primeiro); registrar exceções (auditing owen-it, Resend); respeitar ADRs.

## 6. Estado

- [ ] ⬜ Pré-requisito — smoke de checkout completo verde (bloqueia todas as fatias)
- [ ] ⬜ Fatia 0 — Baseline (SHA-pinning, reconciliar ci.yml, documentar suíte)
- [ ] ⬜ Fatia 1 — Redes de segurança (Larastan baseline; gate MySQL e browser já existem)
- [ ] ⬜ Fatia 2 — Tooling/CI (dependabot, pre-push, `.ai/rules` antecipado; pnpm → 11.19.0; toolchain de teste → alvo novo: Pest 5, Vitest 4, ESLint 10, TS ~6.0, Node 24, pnpm 11.19)
- [ ] ⬜ Fatia 3a — Laravel 12→13 (Horizon/auditing compat, janela de baixo tráfego)
- [ ] ⬜ Fatia 3b — Inertia 2→3 (receita `fad56c0` madura, SSR, sdk MP)
- [ ] ⬜ Fatia 4 — Hardening (CSP report-only + allowlist Mercado Pago)
- [ ] ⬜ Fatia 5 — Kit BR/dedupe (⚠️ compat do hash de CPF antes do merge)
- [ ] ⬜ Fatia 6 — Convenções (Form Requests, rate limiters, exceção auditing/Resend; **devolver §4.2**: bug do `?->` em `getAllPermissions`, `unsetRelation`, a11y do dialog de exclusão)

Última atualização: 2026-08-11 (§4 nova — drift bidirecional do RBAC, após a harvest reversa PRs #36/#39/#41/#43/#45)
