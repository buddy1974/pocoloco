#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -f "$ROOT/.env.local" ]]; then
  set -a; source "$ROOT/.env.local"; set +a
fi

PASS=true
PARTIAL=false

echo "=== Pocoloco Smoke Test ==="
echo ""

# API-Football
if [[ -n "${APIFOOTBALL_KEY:-}" ]]; then
  FROM=$(date -u +%Y-%m-%d)
  TO=$(date -u -d '+3 days' +%Y-%m-%d 2>/dev/null || date -u -v+3d +%Y-%m-%d)
  if bash "$ROOT/engines/scripts/apifootball.sh" fixtures "$FROM" "$TO" 78 > /dev/null 2>&1; then
    echo "✓ API-Football reachable"
  else
    echo "✗ API-Football failed"
    PASS=false
  fi
else
  echo "~ API-Football: APIFOOTBALL_KEY not set (skipped)"
  PARTIAL=true
fi

# Neon
if [[ -n "${DATABASE_URL:-}" ]]; then
  TS=$(date -Iseconds 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%S+00:00)
  PAYLOAD="{\"id\":\"smoke\",\"routine\":\"smoke\",\"started_at\":\"$TS\",\"status\":\"ok\"}"
  if bash "$ROOT/engines/scripts/neon-sync.sh" engine_runs id "$PAYLOAD" > /dev/null 2>&1; then
    echo "✓ Neon reachable"
  else
    echo "✗ Neon sync failed"
    PASS=false
  fi
else
  echo "~ Neon: DATABASE_URL not set (skipped)"
  PARTIAL=true
fi

# Telegram
if [[ -n "${TELEGRAM_BOT_TOKEN:-}" ]] && [[ -n "${TELEGRAM_ADMIN_CHAT_ID:-}" ]]; then
  if bash "$ROOT/engines/scripts/telegram.sh" "$TELEGRAM_ADMIN_CHAT_ID" "Pocoloco smoke test OK" > /dev/null 2>&1; then
    echo "✓ Telegram reachable"
  else
    echo "✗ Telegram failed"
    PASS=false
  fi
else
  echo "~ Telegram: credentials not set (skipped)"
  PARTIAL=true
fi

echo ""
if [[ "$PASS" == "true" ]] && [[ "$PARTIAL" == "false" ]]; then
  echo "SMOKE TEST: PASS"
  exit 0
elif [[ "$PARTIAL" == "true" ]]; then
  echo "SMOKE TEST: PARTIAL (some keys not configured)"
  exit 0
else
  echo "SMOKE TEST: FAIL"
  exit 1
fi
