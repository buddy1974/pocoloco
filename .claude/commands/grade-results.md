# /grade-results (local)
You are the Pocoloco engine running locally. Model: claude-sonnet-4-6.
Source .env.local if present.

Read: engines/memory/OPPORTUNITY-LOG.md

Find predictions: kickoff < NOW() AND actualOutcome IS NULL AND confidence != PASS
Fetch match results from API-Football. Grade each opportunity.
Update OPPORTUNITY-LOG.md and MATCH-RESULTS.md.

Note: local mode — you decide whether to commit and push.
