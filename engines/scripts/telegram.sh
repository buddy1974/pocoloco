#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -f "$ROOT/.env.local" ]]; then
  set -a; source "$ROOT/.env.local"; set +a
fi

CHAT_ID="${1:-}"
MESSAGE="${2:-}"

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]] || [[ -z "$CHAT_ID" ]]; then
  # Graceful fallback — write to fallback file, never crash
  FALLBACK="$ROOT/NOTIFICATIONS-FALLBACK.md"
  echo "$(date -Iseconds) | chat:${CHAT_ID:-UNKNOWN} | ${MESSAGE}" >> "$FALLBACK"
  exit 0
fi

# Escape MarkdownV2 special chars: _ * [ ] ( ) ~ ` > # + - = | { } . !
ESCAPED=$(python3 -c "
import re, sys
text = sys.argv[1]
special = r'[_*\[\]()~\`>#+=|{}.!-]'
escaped = re.sub(special, lambda m: '\\\\' + m.group(), text)
print(escaped)
" "$MESSAGE")

PAYLOAD=$(python3 -c "
import json, sys
data = {
  'chat_id': sys.argv[1],
  'text': sys.argv[2],
  'parse_mode': 'MarkdownV2',
  'disable_web_page_preview': True
}
print(json.dumps(data))
" "$CHAT_ID" "$ESCAPED")

curl -sf \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" > /dev/null

echo "Telegram: sent to $CHAT_ID"
