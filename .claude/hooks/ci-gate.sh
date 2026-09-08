#!/usr/bin/env bash
# ci-gate.sh — portão determinístico no loop do agente.
#
#   UserPromptSubmit → ci-gate.sh baseline   (grava o hash da árvore no início do turno)
#   Stop             → ci-gate.sh check      (se o turno mudou código e o gate está vermelho, bloqueia o stop)
#
# Regras:
#   - Só roda se ESTE turno alterou código (hash atual != baseline do prompt).
#   - Nunca bloqueia duas vezes a mesma árvore (anti-loop). O Claude Code ainda
#     manda stop_hook_active=true nos Stops seguintes e impõe teto de 8
#     bloqueios consecutivos — este script é a primeira trava, aquele é a última.
#   - Rápido: pint --test --dirty + pest --parallel --bail; tsc + eslint (arquivos
#     alterados) + vitest --changed só se tocou resources/js. phpstan e rector
#     ficam no pre-push (husky) e no CI — lentos demais para cada stop.
#   - A árvore avaliada é a do `cwd` que o Claude Code manda no JSON de entrada,
#     não a de CLAUDE_PROJECT_DIR: em worktree, CLAUDE_PROJECT_DIR fica no
#     checkout principal e o cwd segue o agente (doc de hooks, "Worktrees are
#     different").
#   - exit 2 + stderr = o agente não para, lê o motivo e corrige.
#   - Estado em .claude/.ci-gate/ (gitignorado): baseline, last-blocked, log.

set -u

INPUT="$(cat 2>/dev/null || true)"

json_field() { # json_field <chave> — campo de topo do JSON de entrada; vazio se ausente
  printf '%s' "$INPUT" | python3 -c 'import sys, json
try:
    value = json.load(sys.stdin).get(sys.argv[1], "")
except Exception:
    value = ""
if isinstance(value, bool):
    value = "true" if value else "false"
print(value if isinstance(value, str) else "")' "$1" 2>/dev/null
}

CWD="$(json_field cwd)"

ROOT=""
if [ -n "$CWD" ] && [ -d "$CWD" ]; then
  ROOT="$(git -C "$CWD" rev-parse --show-toplevel 2>/dev/null || true)"
fi
[ -z "$ROOT" ] && ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$ROOT" || exit 0

STATE_DIR="$ROOT/.claude/.ci-gate"
mkdir -p "$STATE_DIR"
LOG="$STATE_DIR/log"

CODE_PATHS=(app routes database tests config bootstrap resources composer.json package.json)

tree_hash() {
  {
    git diff HEAD -- "${CODE_PATHS[@]}" 2>/dev/null
    git ls-files --others --exclude-standard -- "${CODE_PATHS[@]}" 2>/dev/null | sort | while IFS= read -r f; do
      printf '== %s\n' "$f"; cat "$f" 2>/dev/null
    done
  } | shasum -a 1 | cut -c1-40
}

changed_files() {
  { git diff HEAD --name-only -- "${CODE_PATHS[@]}"; git ls-files --others --exclude-standard -- "${CODE_PATHS[@]}"; } 2>/dev/null | sort -u
}

MODE="${1:-check}"

case "$MODE" in
  baseline)
    git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
    tree_hash > "$STATE_DIR/baseline"
    exit 0
    ;;
  check) ;;
  *) exit 0 ;;
esac

# Sem repositório git ou sem baseline → não há o que comparar.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0
[ -f "$STATE_DIR/baseline" ] || exit 0

NOW="$(tree_hash)"
BASE="$(cat "$STATE_DIR/baseline")"
LAST_BLOCKED="$(cat "$STATE_DIR/last-blocked" 2>/dev/null || true)"

# Turno não mudou código → libera.
[ "$NOW" = "$BASE" ] && exit 0
# Mesma árvore já foi bloqueada uma vez → libera (quem decide agora é o humano).
[ "$NOW" = "$LAST_BLOCKED" ] && exit 0

START="$(date +%s)"
FILES="$(changed_files)"
PHP_CHANGED=0;  echo "$FILES" | grep -qE '\.php$'                              && PHP_CHANGED=1
JS_CHANGED=0;   echo "$FILES" | grep -qE '^resources/js/.*\.(ts|tsx|js|jsx)$'   && JS_CHANGED=1
DEPS_CHANGED=0; echo "$FILES" | grep -qE '^(composer|package)\.json$'           && DEPS_CHANGED=1

FAIL=""
run() { # run <rótulo> <comando...>
  local label="$1"; shift
  local out
  if ! out="$("$@" 2>&1)"; then
    FAIL="${FAIL}
--- ${label} FALHOU ---
$(printf '%s\n' "$out" | tail -n 40)"
  fi
}

if [ "$PHP_CHANGED" = 1 ] || [ "$DEPS_CHANGED" = 1 ]; then
  [ -x vendor/bin/pint ] && run "pint --test --dirty" vendor/bin/pint --test --dirty
  [ -x vendor/bin/pest ] && run "pest" vendor/bin/pest --parallel --bail
fi

if [ "$JS_CHANGED" = 1 ] || [ "$DEPS_CHANGED" = 1 ]; then
  if command -v corepack >/dev/null 2>&1; then
    run "tsc --noEmit" corepack pnpm -s types
    JS_FILES="$(echo "$FILES" | grep -E '^resources/js/.*\.(ts|tsx|js|jsx)$' | while IFS= read -r f; do [ -f "$f" ] && printf '%s\n' "$f"; done)"
    # shellcheck disable=SC2086
    [ -n "$JS_FILES" ] && run "eslint (arquivos alterados)" corepack pnpm -s exec eslint --max-warnings=0 $JS_FILES
    run "vitest --changed" env LARAVEL_BYPASS_ENV_CHECK=1 corepack pnpm -s exec vitest run --changed --passWithNoTests
  fi
fi

ELAPSED="$(( $(date +%s) - START ))"

if [ -n "$FAIL" ]; then
  printf '%s\n' "$NOW" > "$STATE_DIR/last-blocked"
  printf '%s\tBLOCK\t%ss\t%s\n' "$(date -u +%FT%TZ)" "$ELAPSED" "$(echo "$FILES" | wc -l | tr -d ' ') arquivo(s)" >> "$LOG"
  {
    echo "ci-gate: a mudança deste turno NÃO passa no gate. Corrija antes de encerrar (Definition of done do CLAUDE.md)."
    echo "Arquivos com mudança não commitada (o gate roda sobre todos eles):"
    echo "$FILES" | sed 's/^/  - /'
    echo "$FAIL"
    echo
    echo "Se o vermelho for pré-existente e fora do escopo da tarefa, diga isso explicitamente ao usuário em vez de contornar o gate."
  } >&2
  exit 2
fi

printf '%s\tPASS\t%ss\n' "$(date -u +%FT%TZ)" "$ELAPSED" >> "$LOG"
rm -f "$STATE_DIR/last-blocked"
exit 0
