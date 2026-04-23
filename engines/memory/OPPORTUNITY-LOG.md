# Opportunity Log

## Purpose
Running log of all published opportunities and PASS decisions. One entry per fixture × user × strategy. Updated by publish routines. Post-match grade block added by grade-results routine.

## Schema
Each entry:
- ## [DATE] [HOME vs AWAY] [STRATEGY] [PICK] [CONFIDENCE]
- Grade: [confidence] | Edge: [edge]% | Pick: [pick]
- Model: H=[p] D=[p] A=[p] | Market: H=[p] D=[p] A=[p]
- Factors: [top 3 named]
- Reasoning: [text]
- [If PASS] Reason: [which gate fired]
- UserStats: yes/no
- [Post-match] Actual: [outcome] | Correct: yes/no | Brier: [score]

## Entries

(populated by engine routines)
