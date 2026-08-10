# Gap-report — ctvitrine

Projeto **#3** na ordem do [PLAYBOOK](../PLAYBOOK.md) (§2). Fork direto deste boilerplate (o `composer.json` ainda se chama `simplify-technology/boilerplate`), então o delta é pequeno e concentrado em qualidade estática, hardening e dedupe.

## 1. Stack atual (verificada no disco em 2026-08-10)

| Componente | Constraint | Lock |
| --- | --- | --- |
| PHP | `^8.4` | — |
| laravel/framework | `^13.0` | v13.15.0 |
| inertiajs/inertia-laravel | `^3.0` | v3.1.0 |
| @inertiajs/react | `^3.4.0` | 3.4.0 (React `^19.2.7`) |
| tailwindcss | `^4.3.0` | 4.3.0 |
| pestphp/pest | `^4.1` | v4.7.2 |
| rector/rector · laravel/pint | `^2.0` · `^1.18` | 2.4.5 · v1.29.1 |
| pnpm | `packageManager: pnpm@11.5.3` (corepack) | — |
| Deltas composer vs boilerplate | `league/flysystem-aws-s3-v3 ^3.0` (S3/R2) | — |

**Criticidade: ALTA — está em produção** (o próprio `pnpm-workspace.yaml` documenta "Este app está em produção"). Micro-SaaS de vitrine white-label **multi-instância** (uma instância por cliente, provisionada via Ploi + `scripts/deploy/deploy.sh`), com módulos ativáveis por env: **billing Asaas** (pagamentos), signup self-service, IA de fotos, métricas first-party e tracking Meta Pixel/CAPI. Usuários ativos reais e cobrança recorrente — mas sem checkout de e-commerce em tempo real como o spinmax.

## 2. Já em conformidade

- Laravel 13 + PHP 8.4 + Inertia v3 + React 19 + Tailwind 4 + Pest 4 — **nenhum upgrade de framework pendente**.
- Tooling: `pint.json`, `rector.php` + `ci:rector`, Husky (`prepare`) + `format:dirty`, scripts `composer ci:check` (lint+rector+test) e `pnpm ci:check` com a mesma semântica do boilerplate; vitest com `@testing-library/jest-dom`/`user-event`.
- CI: `.github/workflows/ci.yml` (frontend/backend/rector) + `semgrep.yml`, **actions já pinadas por SHA** — este projeto foi a origem do padrão adotado na harvest.
- Supply-chain: `pnpm-workspace.yaml` com `minimumReleaseAge: 10080` + `allowBuilds` — também origem do padrão.
- Pacotes de paridade: Horizon 5.47, log-viewer, activitylog, Ziggy; `Laravel13ConfigurationDefaultsTest` presente.
- Testes: 106 arquivos Feature, cultura forte de testes-guarda (`EnvExampleGuardTest`, `EnvDocsGuardTest`, testes de modo por módulo).
- Convenções: Form Requests amplamente usados, RBAC próprio (`HasRolesAndPermissions`), `User.is_active` já existe no modelo/migration.
- Skills de agente em `.github/.cursor/.agents/.codex` (inclui `laravel-best-practices` e `configuring-horizon`, que o boilerplate incorporou na harvest).

## 3. Divergências e riscos específicos

- **Sem Larastan** — não há `phpstan.neon*`, larastan não está no `require-dev` e `ci:check` não tem `ci:stan`. Maior gap de qualidade estática vs o boilerplate (nível 6, zero erros). Entrar com **baseline** (Fatia 1), não com zero-erros.
- **CI incompleto vs Fatia 0**: sem job `quality` (stan), sem job `security` (`composer audit` + `pnpm audit`), sem service MySQL para gate de migrations, sem bloco `concurrency`/`cancel-in-progress`.
- **Sem `tests/Browser`** — nenhum smoke E2E; os fluxos de billing/signup dependem só de Feature tests.
- **Sem `.ai/rules/`, `CLAUDE.md`, `.github/dependabot.yml`, `.mise.toml`** — tem `.cursor/rules/*.mdc` próprios, mas não o formato canônico.
- **Sem `lang/`** — strings pt-BR hardcoded; boilerplate agora tem `lang/pt_BR` completo + `TranslationTest`.
- **Hardening ausente** (o boilerplate agora supre): sem `SecurityHeaders`, `SetSensitiveCacheHeaders`, `EnsureUserIsActive` (o `is_active` existe mas nada o consome no login/sessão), sem `PiiScrubber` nos logs, sem páginas de erro padronizadas, sem strict mode com report.
- **Código local que o boilerplate agora supre** (dedupe na Fatia 5): `resources/js/lib/masks.ts` + `lib/format.ts` (máscaras de digitação/moeda — absorvidas pelo kit canônico na harvest), `resources/js/utils/format/masks.ts` (cópia da versão antiga do boilerplate), `lib/clipboard.ts`. Conferir na dedupe que o kit canônico preserva o comportamento (ele nasceu daqui).
- **NÃO deduplicar**: middlewares `Ensure*Mode` (off/demo/live), `EnsureTermsAccepted`, `SessionHasher`, `SafeLinkUrl`, `ImageOptimizer`, clients Asaas/Ploi/Turnstile — são do produto ou candidatos a subir ao boilerplate, não o contrário.
- **Traps**:
  - **Multi-instância**: cada fatia precisa ser deployada em TODAS as instâncias Ploi; os stubs `stubs/ops/instance.env.stub` e `deploy-script.stub` devem ser atualizados junto, ou instâncias novas nascem fora do padrão.
  - **CSP × Meta Pixel/CAPI**: `lib/meta-tracking.ts` dispara o Pixel no front — a CSP do boilerplate bloqueia `script-src`/`connect-src` do Meta. **Report-only obrigatório** + allowlist antes de enforce (PLAYBOOK §4).
  - **Testes-guarda de env**: qualquer fatia que adicione env nova (`TRUSTED_PROXIES`, Sentry…) quebra a suíte se `.env.example` e `docs/tecnico` não forem atualizados no mesmo PR — é proteção, mas surpreende quem copia material do boilerplate.
  - **`EnsureUserIsActive` derruba sessões vivas** no deploy (PLAYBOOK §4) — auditar inativos logados antes de ativar.
  - **Dados persistidos**: `TermsAcceptance` (hash/ip/ua — alterar `resources/legal` força re-aceite global) e assinaturas/cobranças Asaas; `SessionHasher` usa `APP_KEY` como pepper, mas rotaciona diariamente — sem risco de migração.
  - `ImageOptimizer` exige Imagick na infra de cada instância.

## 4. Fatias aplicáveis (ordem para este projeto)

1. **Fatia 0 — Baseline**: parcial — CI já espelha a estrutura antiga com SHA-pinning; falta paridade com o `ci.yml` novo (job quality, job security, concurrency, service MySQL). Documentar aqui o baseline verde (106 arquivos Feature).
2. **Fatia 2 — Tooling/CI** (antecipada, é quase toda ganha): adicionar `dependabot.yml`, `.mise.toml`; **antecipar da Fatia 6**: `.ai/rules/` + `CLAUDE.md`/`AGENTS.md` adaptados. Pint/Rector/Husky/minimumReleaseAge já prontos.
3. **Fatia 1 — Redes de segurança**: Larastan com `--generate-baseline` + `ci:stan`; gate de migrations em MySQL 8 real; smoke browser mínimo (páginas-chave + fluxo signup/billing demo). Cobertura Feature já é forte — foco no que falta, não em rescrever.
4. **Fatia 3 — NÃO SE APLICA** (nem 3a nem 3b: já é L13 + Inertia v3 + React 19).
5. **Fatia 4 — Hardening**: SecurityHeaders com **CSP report-only** (allowlist Meta/Turnstile/Asaas conforme módulos ativos), SetSensitiveCacheHeaders, EnsureUserIsActive (is_active já existe — só o gate falta), PiiScrubber, páginas de erro, strict mode com report, `TRUSTED_PROXIES`. Atualizar `.env.example` + docs de env no mesmo PR (testes-guarda).
6. **Fatia 5 — Kit BR/dedupe**: trocar `lib/masks.ts`/`lib/format.ts`/`utils/format/masks.ts`/`lib/clipboard.ts` pelos canônicos e apagar os locais. Sem hash de CPF persistido aqui — a trap do spinmax não se aplica.
7. **Fatia 6 — Convenções**: eliminar as 7 validações inline restantes em controllers (`$request->validate(`), rate limiters nomeados, kebab-case, sincronizar `HasRolesAndPermissions`, revisar ADRs. `lang/pt_BR` + `TranslationTest` entram aqui como adoção do padrão novo.

## 5. Estado

- [ ] ⬜ Fatia 0 — Baseline (paridade do CI + baseline documentado)
- [ ] ⬜ Fatia 2 — Tooling/CI (dependabot, mise, `.ai/rules` + CLAUDE.md antecipados)
- [ ] ⬜ Fatia 1 — Redes de segurança (Larastan baseline, gate MySQL, smoke browser)
- [ ] ⬜ Fatia 4 — Hardening (CSP report-only → enforce, middlewares, PiiScrubber)
- [ ] ⬜ Fatia 5 — Kit BR/dedupe (masks/format/clipboard)
- [ ] ⬜ Fatia 6 — Convenções (validação inline, limiters, lang/pt_BR, RBAC sync)

Última atualização: 2026-08-10 (gap-report inicial)
