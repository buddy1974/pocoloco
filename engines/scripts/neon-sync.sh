#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -f "$ROOT/.env.local" ]]; then
  set -a; source "$ROOT/.env.local"; set +a
fi

TABLE="${1:?table required}"
CONFLICT_COLS="${2:?conflict columns required}"
JSON_PAYLOAD="${3:?json payload required}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  FALLBACK="$ROOT/NEON-SYNC-FALLBACK.md"
  echo "$(date -Iseconds) | table:$TABLE | $JSON_PAYLOAD" >> "$FALLBACK"
  exit 0
fi

TMPFILE=$(mktemp /tmp/neon-sync-XXXXXX.sql)
trap "rm -f $TMPFILE" EXIT

python3 - "$TABLE" "$CONFLICT_COLS" "$JSON_PAYLOAD" <<'PYEOF' > "$TMPFILE"
import sys, json

table = sys.argv[1]
conflict_cols = sys.argv[2]
payload = json.loads(sys.argv[3])

cols = list(payload.keys())
vals = []
for v in payload.values():
    if v is None:
        vals.append('NULL')
    elif isinstance(v, bool):
        vals.append('TRUE' if v else 'FALSE')
    elif isinstance(v, (int, float)):
        vals.append(str(v))
    elif isinstance(v, (dict, list)):
        escaped = json.dumps(v).replace("'", "''")
        vals.append(f"'{escaped}'::jsonb")
    else:
        escaped = str(v).replace("'", "''")
        vals.append(f"'{escaped}'")

cols_sql = ', '.join(f'"{c}"' for c in cols)
vals_sql = ', '.join(vals)

updates = ', '.join(
    f'"{c}"=EXCLUDED."{c}"'
    for c in cols
    if c not in conflict_cols.split(',')
)

sql = f"""INSERT INTO {table} ({cols_sql})
VALUES ({vals_sql})
ON CONFLICT ({conflict_cols}) DO UPDATE SET {updates};"""

print(sql)
PYEOF

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$TMPFILE" -q
echo "neon-sync: $TABLE ✓"
