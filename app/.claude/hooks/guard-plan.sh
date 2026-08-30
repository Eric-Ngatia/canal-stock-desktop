#!/bin/bash
# Refuse toute ecriture de code source tant qu'aucun plan n'existe dans .plans/.
# Exit 2 = blocage + message renvoye a Claude comme retour exploitable.
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0

# Plans, doc et configuration restent libres
case "$FILE" in
  */.plans/*|*.md|*/.claude/*) exit 0 ;;
esac

# Le renderer buildé n'est jamais ecrit a la main
case "$FILE" in
  */dist/*|*/release/*|*/node_modules/*) exit 0 ;;
esac

# Seul le code source (main + renderer) est concerne
case "$FILE" in
  */src/*.js|*/src/*.jsx|*/src/*.sql) ;;
  *) exit 0 ;;
esac

if ! ls "${CLAUDE_PROJECT_DIR}"/.plans/*.md >/dev/null 2>&1; then
  echo "Bloque : aucun plan dans .plans/. Lance /plan <tache> puis /exec (workflow Plan -> Exec -> Review)." >&2
  exit 2
fi

exit 0
