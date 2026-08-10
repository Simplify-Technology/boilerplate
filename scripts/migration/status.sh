#!/usr/bin/env bash
# Painel de status do rollout de migração (lê os checklists "Estado" dos gap-reports).
# Uso: scripts/migration/status.sh [--next]
#   --next  mostra só a próxima fatia pendente de cada projeto
set -euo pipefail

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
DIR="$ROOT/docs/migration/projects"
ORDER=(transitado-em-julgado cuidari ctvitrine ctjuris sorteiopix ctfinance spinmax)

NEXT_ONLY=false
[ "${1:-}" = "--next" ] && NEXT_ONLY=true

total_done=0
total_all=0

printf '\n%-24s %-10s %s\n' "PROJETO" "PROGRESSO" "PRÓXIMA FATIA PENDENTE"
printf '%-24s %-10s %s\n' "------------------------" "----------" "----------------------------------------"

for project in "${ORDER[@]}"; do
    file="$DIR/$project.md"

    if [ ! -f "$file" ]; then
        printf '%-24s %-10s %s\n' "$project" "—" "gap-report ausente"
        continue
    fi

    done_count=$(grep -c '^- \[x\]' "$file" || true)
    todo_count=$(grep -c '^- \[ \]' "$file" || true)
    all_count=$((done_count + todo_count))
    next=$(grep -m1 '^- \[ \]' "$file" | sed -E 's/^- \[ \] *(⬜ *)?//' || true)

    total_done=$((total_done + done_count))
    total_all=$((total_all + all_count))

    if $NEXT_ONLY && [ -z "$next" ]; then
        continue
    fi

    printf '%-24s %-10s %s\n' "$project" "$done_count/$all_count" "${next:-✅ completo}"
done

printf '\nTotal: %d/%d fatias concluídas.\n' "$total_done" "$total_all"
printf 'Detalhe por projeto: docs/migration/projects/<nome>.md · Guia: docs/migration/PLAYBOOK.md\n\n'
