# Pocoloco — Soccer Intelligence Platform

> Upload your stats. We surface the opportunities.

Multi-tenant soccer intelligence SaaS for expert bettors. Fuses your manually-maintained stats with live API-Football fixtures, lineups, injuries, and bookmaker odds. Publishes per-fixture opportunity cards with explainable picks, confidence grades, and edge vs bookmaker odds. Advisory only — never places bets.

## Quick links

- [Quickstart](docs/CLOUD-SETUP.md)
- [Routine catalog](docs/ROUTINES.md)
- [Import guide](docs/IMPORT-GUIDE.md)
- [Cloud setup](docs/CLOUD-SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Present to friend](docs/PRESENT-TO-FRIEND.md)

## Local development

```bash
cp env.template .env.local
# fill in credentials

pnpm install
pnpm db:push
pnpm db:seed
pnpm web:dev
```

## Engine commands (local)

```bash
/ingest-fixtures      # fetch upcoming fixtures
/build-intel          # build match intel
/publish-value-1x2    # publish value opportunities
/grade-results        # grade completed matches
/weekly-calibration   # weekly calibration report
/check-api-budget     # check API-Football usage
```
