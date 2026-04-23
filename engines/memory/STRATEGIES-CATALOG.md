# Strategies Catalog

## value_1x2 — Value Betting 1X2 [LIVE]

### Pipeline
1. Extract features per team from soccerIntel
2. Compute base 1X2 via Dixon-Coles-lite Poisson from expected goals
3. Apply: injuries, suspensions, coach-change dampening, congestion penalty, red-card distortion discount
4. If user_soccer_stats present for BOTH teams: apply user feature weights
5. Compute evidence score; widen toward base rate if < 0.6
6. De-vig bookmaker odds → market probs
7. Edge = model_prob - market_prob - safety_margin (0.02)
8. Apply PASS gates
9. Assign confidence grade
10. Write reasoning (3-6 sentences naming top 3 factors)

### Factor weights (v0)
recent_form_5: 0.25 | recent_form_10: 0.15 | home_away_split: 0.15
injuries_suspensions: 0.15 | h2h: 0.05 | motivation: 0.05
user_xg_for: 0.10 (only when user stats present for both)
user_xg_against: 0.10 (same condition)

### Thresholds
HIGH:   edge >= 0.05 AND evidence >= 0.75
MEDIUM: edge >= 0.03 AND evidence >= 0.60
LOW:    edge >= 0.015 (logged, not notified)
PASS:   any gate fires

### PASS gates (any one → PASS, state which gate)
1. Lineup confidence < 0.6 AND kickoff > 3h away
2. Probable starter flagged doubtful with no confirmation
3. Coach change within 14 days for either team
4. Red card distortion: 2 of last 3 matches affected
5. Edge < 0.02 (safety margin)
6. Market moved against pick > 0.02 since last fetch
7. Any data fetch returned partial/empty data
8. Single-outcome probability > 0.75 → model bug flag

### Never
- Emit probability > 0.75 on any single outcome
- Notify LOW or PASS
- Skip the featureSnapshot field

---

## value_ou25 — Value Betting O/U 2.5 [COMING SOON]

## value_btts — Value Betting BTTS [COMING SOON]

## arb_1x2 — Arbitrage 1X2 [COMING SOON — needs multi-bookmaker odds]

## matched — Matched Betting [COMING SOON]
