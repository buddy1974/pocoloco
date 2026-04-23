#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Source .env if present (local mode only)
if [[ -f "$ROOT/.env.local" ]]; then
  set -a; source "$ROOT/.env.local"; set +a
fi

# Assert required env var
if [[ -z "${APIFOOTBALL_KEY:-}" ]]; then
  echo "APIFOOTBALL_KEY: MISSING"
  exit 3
fi

BASE="https://v3.football.api-sports.io"
COUNTER_FILE="$ROOT/data/apifootball-usage.json"
TODAY=$(date -u +%Y-%m-%d)

# Load or reset daily counter
if [[ -f "$COUNTER_FILE" ]]; then
  FILE_DATE=$(python3 -c "import json,sys; d=json.load(open('$COUNTER_FILE')); print(d.get('date',''))")
  FILE_COUNT=$(python3 -c "import json,sys; d=json.load(open('$COUNTER_FILE')); print(d.get('count',0))")
  if [[ "$FILE_DATE" == "$TODAY" ]]; then
    COUNT=$FILE_COUNT
  else
    COUNT=0
  fi
else
  COUNT=0
fi

_check_ceiling() {
  if [[ $COUNT -ge 95 ]]; then
    bash "$ROOT/engines/scripts/telegram.sh" \
      "${TELEGRAM_ADMIN_CHAT_ID:-}" \
      "🚨 Pocoloco: API-Football ceiling reached (95/day). Routine aborted: $0" 2>/dev/null || true
    echo "ERROR: API-Football daily ceiling (95) reached" >&2
    exit 4
  fi
}

_increment_counter() {
  COUNT=$((COUNT+1))
  python3 -c "import json; json.dump({'date':'$TODAY','count':$COUNT}, open('$COUNTER_FILE','w'))"
}

_call() {
  local ENDPOINT="$1"
  _check_ceiling
  local RESPONSE
  RESPONSE=$(curl -sf \
    -H "x-apisports-key: $APIFOOTBALL_KEY" \
    "$BASE$ENDPOINT")
  _increment_counter
  echo "$RESPONSE"
}

CMD="${1:-}"
shift || true

case "$CMD" in
  fixtures)
    # Usage: fixtures FROM TO [LEAGUE]
    FROM="${1:?FROM date required}"
    TO="${2:?TO date required}"
    LEAGUE="${3:-}"
    if [[ -n "$LEAGUE" ]]; then
      _call "/fixtures?date=$FROM&season=2025&league=$LEAGUE"
    else
      _call "/fixtures?date=$FROM&season=2025"
    fi
    ;;
  fixture)
    # Usage: fixture ID
    ID="${1:?fixture ID required}"
    _call "/fixtures?id=$ID"
    ;;
  lineups)
    # Usage: lineups FIXTURE_ID
    ID="${1:?fixture ID required}"
    _call "/fixtures/lineups?fixture=$ID"
    ;;
  injuries)
    # Usage: injuries TEAM_ID
    TEAM="${1:?team ID required}"
    _call "/injuries?team=$TEAM&season=2025"
    ;;
  stats)
    # Usage: stats FIXTURE_ID
    ID="${1:?fixture ID required}"
    _call "/fixtures/statistics?fixture=$ID"
    ;;
  odds)
    # Usage: odds FIXTURE_ID
    ID="${1:?fixture ID required}"
    _call "/odds?fixture=$ID"
    ;;
  h2h)
    # Usage: h2h TEAM_A TEAM_B
    A="${1:?team A required}"
    B="${2:?team B required}"
    _call "/fixtures/headtohead?h2h=$A-$B"
    ;;
  team-form)
    # Usage: team-form TEAM_ID N
    TEAM="${1:?team ID required}"
    N="${2:-10}"
    _call "/fixtures?team=$TEAM&last=$N"
    ;;
  standings)
    # Usage: standings LEAGUE SEASON
    LEAGUE="${1:?league required}"
    SEASON="${2:-2025}"
    _call "/standings?league=$LEAGUE&season=$SEASON"
    ;;
  budget)
    echo "Date: $TODAY | Used: $COUNT / 95"
    ;;
  *)
    echo "Usage: apifootball.sh <fixtures|fixture|lineups|injuries|stats|odds|h2h|team-form|standings|budget> [args...]" >&2
    exit 1
    ;;
esac
