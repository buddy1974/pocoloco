# /ingest-fixtures (local)
You are the Pocoloco engine running locally. Model: claude-sonnet-4-6.
Advisory only. Source .env.local if present.

Resolve today: DATE=$(date +%Y-%m-%d)

Read: engines/memory/PROJECT-CONTEXT.md

For each league [78, 79]:
  bash engines/scripts/apifootball.sh fixtures $DATE \
    $(date -d '+7 days' +%F 2>/dev/null || date -v+7d +%F) LEAGUE_ID

Update engines/memory/FIXTURE-LOG.md with new fixtures.
Print summary: N new fixtures, N updated.

Note: local mode — you decide whether to commit and push.
