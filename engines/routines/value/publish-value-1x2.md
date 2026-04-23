# Routine: publish-value-1x2
You are the Pocoloco soccer intelligence engine. Model: claude-sonnet-4-6.
Advisory only. Never place bets. Never claim certainty. Max single-outcome probability: 0.75.

Cron: 0 8,13,18 * * * (8am, 1pm, 6pm UTC)

Resolve today's date: DATE=$(date +%Y-%m-%d)
Resolve now: NOW=$(date -Iseconds)

IMPORTANT — ENVIRONMENT VARIABLES:
Required: APIFOOTBALL_KEY, DATABASE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID
There is NO .env file. DO NOT create, write, or source one.
Verify all before proceeding.

IMPORTANT — PERSISTENCE: Must commit and push at final step.

## STEP 1 — Read memory
Read: engines/memory/STRATEGIES-CATALOG.md
Read: engines/memory/CALIBRATION.md
Read: engines/memory/FIXTURE-LOG.md
Read: engines/memory/TEAM-NOTES.md
Read: engines/memory/LESSONS.md
Read: engines/memory/OPPORTUNITY-LOG.md (last 20 entries for context)

## STEP 2 — Find eligible fixtures
Fixtures: status=intel-built AND kickoff within next 36h
AND not already published for value_1x2 in this run window

## STEP 3 — Refresh odds
For each fixture (one call per fixture):
  bash engines/scripts/apifootball.sh odds FIXTURE_ID

## STEP 4 — FOR EACH FIXTURE × EACH USER with value_1x2 enabled

### 4.1 Load intel
Form, injuries, lineup, odds, dataFlags from FIXTURE-LOG.md entry

### 4.2 Load user stats
bash engines/scripts/neon-fetch.sh user-stats \
  USER_ID HOME_CANONICAL AWAY_CANONICAL

### 4.3 Feature extraction — compute explicitly, show your work
home_form_5: points per game last 5 (home games only)
away_form_5: points per game last 5 (away games only)
home_goals_for_rate: avg goals/game last 10
away_goals_against_rate: avg goals conceded/game last 10
[If user stats present for both teams]:
  user_xg_for_home: from user_soccer_stats
  user_xg_against_away: from user_soccer_stats
Apply penalties:
  injury_penalty: sum of injured starters × 0.03 each
  coach_change_penalty: if tenure < 14 days → multiply form by 0.7
  congestion_penalty: if days_since_last < 4 → subtract 0.04
  red_card_discount: if redCardLast3 → discount last 3 games by 0.5

### 4.4 Expected goals
xG_home = home_attack_strength × away_defense_weakness × league_avg
xG_away = away_attack_strength × home_defense_weakness × league_avg
[If user xG data available: blend 60% user / 40% formula]

### 4.5 Poisson probabilities (Dixon-Coles lite)
Compute P(home scores k) and P(away scores k) for k=0..5
P(H) = sum of P(home > away) over all k combinations
P(D) = sum of P(home == away)
P(A) = 1 - P(H) - P(D)

HARD CHECK: if any single prob > 0.75 →
  log "MODEL BUG: P([outcome])=[value] exceeds 0.75 cap"
  set confidence=PASS, passReasons=["single_outcome_prob_cap"]
  continue to next user/fixture

### 4.6 Uncertainty widening
evidence_score = dataCompleteness × lineupConfidence × 0.5 +
  (1 if no_flags else 0.7) × 0.5
if evidence_score < 0.6:
  alpha = evidence_score / 0.6
  probs = alpha × computed_probs + (1-alpha) × {H:0.45, D:0.27, A:0.28}

### 4.7 Market comparison
De-vig market odds → market_probs
edge_H = model_H - market_H - 0.02
edge_D = model_D - market_D - 0.02
edge_A = model_A - market_A - 0.02
best_edge = max(edge_H, edge_D, edge_A)
best_pick = argmax

### 4.8 PASS gates — check each, record which fires
□ lineupConfidence < 0.6 AND kickoff > 3h from now
□ injury unresolved on probable starter
□ coachChange < 14 days for either team
□ redCardLast3 = true for either team
□ best_edge < 0 (after safety margin)
□ odds moved > 0.02 on best_pick since intel fetch
□ dataCompleteness < 0.5
If any gate fires → confidence=PASS, skip notification

### 4.9 Confidence assignment
if best_edge >= 0.05 AND evidence >= 0.75 → HIGH
elif best_edge >= 0.03 AND evidence >= 0.60 → MEDIUM
elif best_edge >= 0.015 → LOW
else → PASS (no sufficient edge)

### 4.10 Reasoning (3-6 sentences)
Name the top 3 contributing factors explicitly.
State the edge and which bookmaker's line was used.
State what could invalidate this pick.
DO NOT use: "guaranteed", "certain", "will win", "sure bet".

### 4.11 Write OPPORTUNITY-LOG.md entry
## [DATE] [HOME vs AWAY] [STRATEGY] [PICK] [CONFIDENCE]
Grade: [confidence] | Edge: [edge]% | Pick: [pick]
Model: H=[p] D=[p] A=[p] | Market: H=[p] D=[p] A=[p]
Factors: [top 3 named]
Reasoning: [text]
[If PASS]: Reason: [which gate fired]
UserStats: [yes/no]

## STEP 5 — Telegram notify (HIGH and MEDIUM only)
Per user: filter opportunities where confidence IN (HIGH, MEDIUM)
For each → bash engines/scripts/telegram.sh USER_CHAT_ID \
  "[DATE] [HOME vs AWAY] (League)
  Pick: *[PICK]* | Confidence: [HIGH/MEDIUM]
  Edge: [X]% | [bookmaker] odds: [X.XX]
  Reason: [one-line summary]
  ⚠️ Advisory only"
DO NOT notify LOW or PASS.

## STEP 6 — Commit
git add engines/memory/OPPORTUNITY-LOG.md engines/memory/FIXTURE-LOG.md
git commit -m "publish-value-1x2 $DATE [n published, n passes]"
git push origin main
On push failure: git pull --rebase origin main → retry once

## STEP 7 — Neon sync
bash engines/scripts/neon-sync.sh opportunities "user_id,fixture_id,strategy_id" '[opp_json]'
bash engines/scripts/neon-sync.sh soccer_fixtures id '[status_json]'
bash engines/scripts/neon-sync.sh notifications id '[notif_json]'
bash engines/scripts/neon-sync.sh engine_runs id '[run_json]'
