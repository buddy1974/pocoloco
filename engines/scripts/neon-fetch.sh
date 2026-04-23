#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -f "$ROOT/.env.local" ]]; then
  set -a; source "$ROOT/.env.local"; set +a
fi

CMD="${1:-}"
shift || true

case "$CMD" in
  user-stats)
    USER_ID="${1:?user_id required}"
    TEAM_H="${2:?home team canonical required}"
    TEAM_A="${3:?away team canonical required}"

    if [[ -z "${DATABASE_URL:-}" ]]; then
      echo "[]"
      exit 0
    fi

    SQL="SELECT stat_key, stat_value, stat_text, match_date, team_canon
      FROM user_soccer_stats
      WHERE user_id='${USER_ID}'
        AND team_canon IN ('${TEAM_H}','${TEAM_A}')
        AND match_date > NOW() - INTERVAL '120 days'
      ORDER BY match_date DESC"

    RESULT=$(psql "$DATABASE_URL" -At -c "$SQL" 2>/dev/null || echo "")

    if [[ -z "$RESULT" ]]; then
      echo "[]"
      exit 0
    fi

    echo "$RESULT" | python3 -c "
import sys, json
rows = [l.split('|') for l in sys.stdin.read().strip().split('\n') if l]
print(json.dumps(rows))
"
    ;;
  *)
    echo "Usage: neon-fetch.sh user-stats USER_ID TEAM_H TEAM_A" >&2
    exit 1
    ;;
esac
