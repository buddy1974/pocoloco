#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PASS=true

check() {
  local label="$1"
  local result="$2"
  if [[ "$result" == "ok" ]]; then
    echo "✓ $label"
  else
    echo "✗ $label — $result"
    PASS=false
  fi
}

# Working directory
if [[ "$ROOT" == *pocoloco ]]; then
  check "pwd ends with pocoloco" "ok"
else
  check "pwd ends with pocoloco" "$ROOT"
fi

# Git repo
if git -C "$ROOT" rev-parse --git-dir > /dev/null 2>&1; then
  check "git repo" "ok"
else
  check "git repo" "not a git repo"
fi

# Git remote
REMOTE=$(git -C "$ROOT" remote get-url origin 2>/dev/null || echo "none")
if [[ "$REMOTE" == *"buddy1974/pocoloco"* ]]; then
  check "git remote → buddy1974/pocoloco" "ok"
else
  check "git remote → buddy1974/pocoloco" "$REMOTE"
fi

# Tools
bash --version > /dev/null 2>&1 && check "bash" "ok" || check "bash" "not found"
curl --version > /dev/null 2>&1 && check "curl" "ok" || check "curl" "not found"
python3 --version > /dev/null 2>&1 && check "python3" "ok" || check "python3" "not found"
psql --version > /dev/null 2>&1 && check "psql" "ok" || check "psql" "not found"

NODE_VER=$(node --version 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [[ -n "$NODE_VER" ]] && [[ "$NODE_VER" -ge 20 ]]; then
  check "node >= 20" "ok"
else
  check "node >= 20" "found: $(node --version 2>/dev/null || echo 'not found')"
fi

pnpm --version > /dev/null 2>&1 && check "pnpm" "ok" || check "pnpm" "not found"

echo ""
if [[ "$PASS" == "true" ]]; then
  echo "PREFLIGHT: PASS"
  exit 0
else
  echo "PREFLIGHT: FAIL"
  exit 1
fi
