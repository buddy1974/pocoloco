#!/usr/bin/env bash
# research wrapper — cascade: Perplexity → Tavily → native Claude search (exit 3)
# Output always: { "text": "...", "sources": ["url1", ...] }
# Exit 3 → caller must use Claude native WebSearch and mark reasoning "data-driven only"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ -f "$ROOT/.env.local" ]]; then
  set -a; source "$ROOT/.env.local"; set +a
fi

QUERY="${1:?query argument required}"

# ── 1. Perplexity ────────────────────────────────────────────────────────────
if [[ -n "${PERPLEXITY_API_KEY:-}" ]]; then
  MODEL="${PERPLEXITY_MODEL:-sonar}"

  PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({
  'model': sys.argv[1],
  'messages': [
    {'role': 'system', 'content': 'You are a precise soccer analytics assistant. Cite every factual claim. Be concise. Focus on match-relevant information: injuries, tactics, form, manager quotes, lineup news.'},
    {'role': 'user', 'content': sys.argv[2]}
  ]
}))
" "$MODEL" "$QUERY")

  RESPONSE=$(curl -sf --max-time 15 \
    -H "Authorization: Bearer $PERPLEXITY_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    "https://api.perplexity.ai/chat/completions") || { echo "research: perplexity call failed" >&2; exit 3; }

  python3 -c "
import json, sys
d = json.load(sys.stdin)
text = d['choices'][0]['message']['content']
sources = [c.get('url','') for c in d.get('citations', [])]
print(json.dumps({'text': text, 'sources': sources}))
" <<< "$RESPONSE"
  exit 0
fi

# ── 2. Tavily (1000 req/month free) ─────────────────────────────────────────
if [[ -n "${TAVILY_API_KEY:-}" ]]; then
  PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({
  'api_key': sys.argv[1],
  'query': sys.argv[2],
  'search_depth': 'basic',
  'include_answer': True,
  'max_results': 3
}))
" "$TAVILY_API_KEY" "$QUERY")

  RESPONSE=$(curl -sf --max-time 15 \
    -X POST "https://api.tavily.com/search" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD") || { echo "research: tavily call failed" >&2; exit 3; }

  python3 -c "
import json, sys
d = json.load(sys.stdin)
text = d.get('answer') or ''
sources = [r.get('url','') for r in d.get('results', [])]
print(json.dumps({'text': text, 'sources': sources}))
" <<< "$RESPONSE"
  exit 0
fi

# ── 3. No provider — native Claude fallback ──────────────────────────────────
echo "research: no provider configured — using native search fallback" >&2
exit 3
