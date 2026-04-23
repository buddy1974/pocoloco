# Import Guide

## Supported formats

`.xlsx` (Excel) and `.csv`. Max 10MB. First sheet only.

## Expected structure

One row per match-team stat. Columns must include at minimum:
- `team` — team name (will be resolved against canonical names)
- `match_date` — date in any parseable format (YYYY-MM-DD recommended)

All other columns are optional and can be mapped during import.

## Canonical stat keys

| Key | Description |
|-----|-------------|
| `xg_for` | Expected goals for |
| `xg_against` | Expected goals against |
| `ppda` | Passes allowed per defensive action |
| `shots_on_target` | Shots on target |
| `shots_off_target` | Shots off target |
| `possession` | Possession percentage (0-100) |
| `goals_scored` | Goals scored |
| `goals_conceded` | Goals conceded |
| `clean_sheets` | Clean sheet (0 or 1) |
| `corners_for` | Corners won |
| `corners_against` | Corners conceded |
| `cards_yellow` | Yellow cards |
| `cards_red` | Red cards |
| `form_score` | Your own form score |
| `user_rating` | Your own match rating |

Any column prefixed `user_` is accepted as a custom stat.

## Column mapping

On first upload with new headers, a mapping UI appears. You map each header to a canonical key or `[skip]`. The mapping is saved by header fingerprint — subsequent uploads with the same headers auto-map.

## Team name resolution

Team names are resolved against `soccerTeams.canonical` and `soccerTeams.aliases` using:
1. Exact match (case-insensitive)
2. Alias match
3. Levenshtein distance < 3

Unresolved teams are flagged for manual resolution in the import review screen.

## Troubleshooting

**"0 rows imported"** — Check that `team` and `match_date` columns are mapped. Both are required per row.

**Teams not recognised** — Use the canonical name from the team list (e.g. "Bayern Munich" not "Bayern04").

**Date parse errors** — Use ISO format: `YYYY-MM-DD`. Avoid Excel date serials.
