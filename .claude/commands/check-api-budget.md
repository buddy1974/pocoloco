# /check-api-budget (local)
You are checking the API-Football daily usage counter.

Run: bash engines/scripts/apifootball.sh budget

Print the result clearly: Date, calls used, remaining, percentage.
If used > 80: warn that the daily ceiling is approaching.
If used >= 95: warn that the ceiling is hit and routines will abort.
