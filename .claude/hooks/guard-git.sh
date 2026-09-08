#!/usr/bin/env bash
# guard-git.sh — PreToolUse(Bash): impede o agente de contornar os hooks do husky
# (lint-staged, commit-msg, os dois ci:check do pre-push) ou de reescrever
# histórico remoto. O CLAUDE.md diz "SKIP_GIT_HOOKS=1 só com intenção explícita";
# isto transforma o aviso em regra: a exceção passa a ser executada por um
# humano, fora do agente, e registrada.
#
# Bloqueia: --no-verify · git commit -n · SKIP_GIT_HOOKS=… ou HUSKY=0 antes de um
# comando git (inclusive via export) · core.hooksPath · git push --force / -f.
# Deixa passar: git push --force-with-lease (não sobrescreve trabalho alheio).
# Falso positivo conhecido: heredoc de documentação que cita um desses comandos
# literalmente — escreva o arquivo com a ferramenta de edição em vez do Bash.
#
# exit 2 = bloqueia o comando e devolve o motivo ao agente.

set -u

CMD="$(python3 -c 'import sys, json
try:
    print(json.load(sys.stdin).get("tool_input", {}).get("command", ""))
except Exception:
    print("")' 2>/dev/null)"

[ -z "$CMD" ] && exit 0

PATTERN='(^|[[:space:];&|(])(SKIP_GIT_HOOKS|HUSKY)=[^[:space:]]*[[:space:]]+([^[:space:]|;&]+[[:space:]]+)*git([[:space:]]|$)'
PATTERN="$PATTERN|(^|[[:space:];&|(])export[[:space:]]+(SKIP_GIT_HOOKS|HUSKY)="
PATTERN="$PATTERN|--no-verify|core\.hooksPath"
PATTERN="$PATTERN|git[[:space:]]+push[^|;&]*(--force([^-]|$)|[[:space:]]-f([[:space:]]|$))"
PATTERN="$PATTERN|git[[:space:]]+commit[^|;&]*[[:space:]]-n([[:space:]]|$)"

if printf '%s' "$CMD" | grep -Eq -- "$PATTERN"; then
  {
    echo "guard-git: comando bloqueado — ele pula os hooks do husky (lint-staged / ci:check) ou reescreve histórico remoto."
    echo "  comando: $CMD"
    echo "Rode o gate de verdade e corrija o que falhar. Se for realmente necessário pular, peça ao humano para rodar o comando fora do agente e registrar o motivo."
  } >&2
  exit 2
fi

exit 0
