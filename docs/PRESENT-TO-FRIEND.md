# Demo script — presenting Pocoloco

## What to open first

1. Landing page (`/`) → "This is what a new visitor sees"
2. `/login` → quick-access pill for design-partner → fills email/password instantly
3. `/dashboard` → demo data shows immediately, no API keys needed
4. `/dashboard/opportunities` → 4 live opportunities (2 HIGH, 2 MEDIUM, 1 PASS)
5. Click one HIGH opportunity → expand intel card → all sections render
6. Show the reasoning section → "This is why the pick was made"
7. Click Accept → show how verdict is recorded
8. `/onboarding` screen 4 (Import) → "Drop your spreadsheet here" [have his actual .xlsx ready]
9. `/dashboard/results` → "After the match, it grades itself"
10. `/dashboard/admin` → log in as owner → API budget, engine runs

## Questions to ask at each screen

**Opportunities page:** "Is this the information you'd want to see before placing a bet? What's missing?"

**Intel card:** "Does the reasoning match how you'd think about it? Which factors would you weight differently?"

**Import screen:** "Does this match your current column names? Which columns do you track that aren't listed?"

**Results page:** "Do you currently track your hit rate by confidence level?"

## Key phrases to use

- "Your spreadsheet goes in here → it changes the picks"
- "Every pick has a written reason — no black boxes"
- "PASS means we don't have enough edge. We won't publish junk."
- "After every match, it grades itself"
- "HIGH/MEDIUM confidence = Telegram push. LOW and PASS = silent."

## What to ask about his workflow

1. Walk me through last Saturday's bets, start to finish
2. Which bookmakers do you use? (→ determines if arb is relevant)
3. Do you do O/U 2.5 or just 1X2? (→ unlocks next strategy)
4. What takes the most time each matchday?
5. How do you currently track your results?
6. Are you betting solo or with others? (→ multi-user plan)

## Decision tree from his answers

- "I do O/U 2.5" → activate value_ou25 strategy
- "I use 3+ bookmakers" → The Odds API for arb, activate arb_1x2
- "Others bet with me" → multi-user onboarding, team invite flow
- "I track everything in this spreadsheet" → perfect, drop it in

## Technical questions he might ask

**"How does it know what to look at?"** → API-Football gives us lineups, injuries, odds. Your spreadsheet gives us your historical xG data. We blend them.

**"What if it's wrong?"** → Every prediction grades itself after the match. Hit rates are tracked per confidence band. If HIGH is performing like MEDIUM, calibration proposes a fix.

**"What does PASS mean?"** → Not enough edge, or something made us uncertain (lineup not confirmed, coach changed recently, red card distortion). We'd rather say nothing than give you junk.

**"Can I change the weights?"** → Not in v1. The factor weights are in STRATEGIES-CATALOG.md and we adjust them based on calibration data.
