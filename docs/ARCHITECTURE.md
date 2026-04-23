# Architecture

## System overview

Pocoloco is a multi-tenant soccer intelligence SaaS with three distinct layers:

**1. Engine layer (GitHub Actions + Claude Code)**
Bash scripts + Claude Code routines that run on cron. Stateless — each run clones the repo, reads markdown memory files, fetches live data, writes back to markdown, commits and pushes. No persistent process required.

**2. Persistence layer (three-tier)**
- Git markdown (`engines/memory/`) — engine memory. LLM-native format, free versioning, diff, rollback. Source of truth for the engine loop.
- Neon Postgres — structured queryable data for the web dashboard. Fast filters, sorts, joins. Synced from engine at end of each routine.
- Vercel Blob — binary file storage for imported spreadsheets. Referenced by URL from the DB.

**3. Web app layer (Next.js on Vercel)**
User-facing dashboard. Reads from Neon Postgres. Never writes to git. Server components for data fetching, client components for interactivity.

## Engine pattern

Each routine follows the Nate Herk 8-section scaffold:
1. Read memory files
2. Pull live data via wrappers
3-N-2. Domain work
N-1. Telegram notify
N. Commit and push
N+1. Neon sync

Routines are LLM prompt files (`.md`) executed by `claude --print --prompt-file`. The LLM orchestrates bash wrapper calls, not arbitrary shell execution.

## Multi-tenant design

All user-scoped tables include `user_id`. API routes scope every query by `session.user.id`. Engine routines loop over users in Neon when personalising predictions. Zero cross-contamination.

## Data flow: fixture → opportunity

```
ingest-fixtures (5am UTC)
  → soccerFixtures (status=upcoming)

build-intel (5:30am + 5pm UTC)
  → soccerIntel, soccerFixtures (status=intel-built)

publish-value-1x2 (8am, 1pm, 6pm UTC)
  → opportunities (one row per user per fixture)
  → Telegram notification (HIGH/MEDIUM only)

grade-results (1am UTC)
  → opportunities (actualOutcome, brierScore, gradedAt)
  → soccerResults

weekly-calibration (Mon 6am UTC)
  → userCalibration
```
