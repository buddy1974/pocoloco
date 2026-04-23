# Fixture Log

## Purpose
Running log of all fixtures ingested from API-Football. Updated by ingest-fixtures and build-intel routines. Entries older than 14 days are pruned by weekly-calibration (graded entries move to MATCH-RESULTS.md).

## Schema
Each entry:
- ## [DATE] [HOME vs AWAY] (League) — Fixture ID: [id]
- Kickoff: [ISO timestamp]
- Status: upcoming | intel-built | processing | published | graded
- Intel block (populated by build-intel):
  - Lineup confidence: [0-1]
  - Data completeness: [0-1]
  - Flags: [list of active flags]

## Entries

(populated by engine routines)
