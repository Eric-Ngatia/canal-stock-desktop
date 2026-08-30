#!/bin/bash
# Refuse toute ecriture dans src/renderer/** qui importerait un module d'acces disque
# (better-sqlite3, fs, node:fs...) ou appellerait window.api en dehors de bridge.js.
# Materialise l'ADR 0002 : le renderer ne parle jamais a SQLite ni au disque directement.
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0

# Seul le code du renderer est concerne
case "$FILE" in
  */src/renderer/*.js|*/src/renderer/*.jsx) ;;
  *) exit 0 ;;
esac

# bridge.js est le seul fichier autorise a toucher window.api
BASENAME=$(basename "$FILE")

# Concatene le contenu ecrit/edite, selon que l'outil est Write ou Edit
CONTENT=$(echo "$INPUT" | jq -r '
  [.tool_input.content, .tool_input.new_string, .tool_input.new_str]
  | map(select(. != null))
  | join("\n")
')
[ -z "$CONTENT" ] && exit 0

if echo "$CONTENT" | grep -qE "require\(['\"](better-sqlite3|fs|node:fs)['\"]\)|from ['\"](better-sqlite3|fs|node:fs)['\"]"; then
  echo "Bloque : $FILE tente d'importer un module d'acces disque depuis le renderer. Passe par un service (src/main/services), un handler IPC, puis src/renderer/api/bridge.js (voir ADR 0002)." >&2
  exit 2
fi

if [ "$BASENAME" != "bridge.js" ] && echo "$CONTENT" | grep -qE "window\.api\."; then
  echo "Bloque : $FILE appelle window.api directement. Seul src/renderer/api/bridge.js a le droit d'appeler window.api - ajoute la methode au bridge et importe-la depuis la plutot." >&2
  exit 2
fi

exit 0
