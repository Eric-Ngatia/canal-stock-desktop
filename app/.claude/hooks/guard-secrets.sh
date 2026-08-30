#!/bin/bash
# Refuse toute ecriture sur un fichier porteur de secrets.
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0

case "$FILE" in
  *.example) exit 0 ;;
esac

case "$FILE" in
  *.env|*.env.*|*/release/*.p12|*/release/*.pfx)
    echo "Bloque : $FILE porte des secrets ou un certificat de signature. Modifie plutot le fichier .example et documente la variable." >&2
    exit 2
    ;;
esac

exit 0
