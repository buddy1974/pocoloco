export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'PASS'
export type Pick = 'HOME' | 'DRAW' | 'AWAY' | 'PASS'

export interface FixtureIntel {
  fixtureId: number
  homeTeam: string
  awayTeam: string
  homeLogo: string
  awayLogo: string
  kickoff: string
  league: string
  leagueFlag: string
  status: string
  homeOdds: number
  drawOdds: number
  awayOdds: number
  pick: Pick
  confidence: Confidence
  edge: number
  reasoning: string[]
  warnings: string[]
  injuredPlayers: string[]
  h2hRecord: string
  homeForm: string
  awayForm: string
  score?: string
  // Structured factors (Phase D)
  formScore: number      // [-1, 1] — positive = home form advantage
  h2hScore: number       // [0, 1] — home team H2H win rate
  injuryImpact: number   // [0, 1] — normalized injury burden
}

function devig(home: number, draw: number, away: number) {
  const h = 1 / home
  const d = 1 / draw
  const a = 1 / away
  const total = h + d + a
  return { home: h / total, draw: d / total, away: a / total }
}

function extractOdds(oddsData: any) {
  if (!oddsData?.[0]?.bookmakers?.[0]?.bets) return null
  const bets = oddsData[0].bookmakers[0].bets
  const matchWinner = bets.find((b: any) => b.name === 'Match Winner')
  if (!matchWinner) return null
  const values = matchWinner.values
  return {
    home: parseFloat(values.find((v: any) => v.value === 'Home')?.odd ?? '0'),
    draw: parseFloat(values.find((v: any) => v.value === 'Draw')?.odd ?? '0'),
    away: parseFloat(values.find((v: any) => v.value === 'Away')?.odd ?? '0'),
  }
}

function calcForm(fixtures: any[], teamId: number): string {
  return fixtures.slice(-5).map((f: any) => {
    const isHome = f.teams?.home?.id === teamId
    const hg = f.goals?.home
    const ag = f.goals?.away
    if (hg == null) return '?'
    if (isHome) return hg > ag ? 'W' : hg < ag ? 'L' : 'D'
    return ag > hg ? 'W' : ag < hg ? 'L' : 'D'
  }).join('')
}

function calcH2H(h2hFixtures: any[], homeId: number): string {
  if (!h2hFixtures?.length) return 'No H2H data'
  const last5 = h2hFixtures.slice(-5)
  let hw = 0, aw = 0, draws = 0
  last5.forEach((f: any) => {
    const hg = f.goals?.home
    const ag = f.goals?.away
    if (hg == null || ag == null) return
    const isHomeTeamHome = f.teams?.home?.id === homeId
    if (hg === ag) { draws++; return }
    if (hg > ag) { isHomeTeamHome ? hw++ : aw++; return }
    isHomeTeamHome ? aw++ : hw++
  })
  return `Last ${last5.length}: H ${hw}W · ${draws}D · ${aw}W A`
}

export function gradeFixture(
  fixture: any,
  oddsData: any,
  injuries: any[],
  h2hFixtures: any[],
  homeFormFixtures: any[],
  awayFormFixtures: any[],
  leagueName: string,
  leagueFlag: string,
): FixtureIntel {
  const homeId: number = fixture.teams?.home?.id ?? 0
  const awayId: number = fixture.teams?.away?.id ?? 0
  const reasoning: string[] = []
  const warnings: string[] = []

  const odds = extractOdds(oddsData)
  const homeOdds = odds?.home ?? 0
  const drawOdds = odds?.draw ?? 0
  const awayOdds = odds?.away ?? 0

  const homeForm = calcForm(homeFormFixtures ?? [], homeId)
  const awayForm = calcForm(awayFormFixtures ?? [], awayId)
  const h2hRecord = calcH2H(h2hFixtures ?? [], homeId)

  const injuredPlayers: string[] = (injuries ?? [])
    .filter((i: any) => i.player?.name)
    .map((i: any) => `${i.player.name} (${i.team?.name ?? '?'})`)
    .slice(0, 6)

  if (injuredPlayers.length > 3) warnings.push(`${injuredPlayers.length} injuries reported`)

  const homeWins = (homeForm.match(/W/g) ?? []).length
  const awayWins = (awayForm.match(/W/g) ?? []).length
  const homeLosses = (homeForm.match(/L/g) ?? []).length
  const awayLosses = (awayForm.match(/L/g) ?? []).length

  if (homeWins >= 4) reasoning.push(`${fixture.teams?.home?.name} in excellent form (${homeForm})`)
  else if (homeWins >= 3) reasoning.push(`${fixture.teams?.home?.name} good form (${homeForm})`)
  if (awayWins >= 4) reasoning.push(`${fixture.teams?.away?.name} in excellent form (${awayForm})`)
  else if (awayLosses >= 3) reasoning.push(`${fixture.teams?.away?.name} poor away form (${awayForm})`)
  if (homeLosses >= 3) warnings.push(`${fixture.teams?.home?.name} losing run (${homeForm})`)

  reasoning.push(`H2H: ${h2hRecord}`)

  let pick: Pick = 'PASS'
  let edge = 0
  let confidence: Confidence = 'PASS'

  if (odds && homeOdds > 1 && drawOdds > 1 && awayOdds > 1) {
    const market = devig(homeOdds, drawOdds, awayOdds)
    const SAFETY = 0.02
    const homeAdv = 0.05
    const formDiff = (homeWins - homeLosses) - (awayWins - awayLosses)

    let mHome = market.home + homeAdv + formDiff * 0.02
    let mAway = market.away - homeAdv - formDiff * 0.02
    let mDraw = market.draw
    const tot = mHome + mDraw + mAway
    mHome /= tot; mDraw /= tot; mAway /= tot

    const eHome = mHome - market.home - SAFETY
    const eDraw = mDraw - market.draw - SAFETY
    const eAway = mAway - market.away - SAFETY
    const best = Math.max(eHome, eDraw, eAway)

    if (best === eHome && eHome > 0) { pick = 'HOME'; edge = eHome }
    else if (best === eAway && eAway > 0) { pick = 'AWAY'; edge = eAway }
    else if (best === eDraw && eDraw > 0) { pick = 'DRAW'; edge = eDraw }

    if (pick !== 'PASS') {
      if (edge >= 0.05 && injuredPlayers.length <= 2) confidence = 'HIGH'
      else if (edge >= 0.03) confidence = 'MEDIUM'
      else if (edge >= 0.015) confidence = 'LOW'
      else { pick = 'PASS'; confidence = 'PASS' }
    }

    if (pick !== 'PASS') {
      reasoning.push(`Edge vs market: +${(edge * 100).toFixed(1)}%`)
      const pickOdds = pick === 'HOME' ? homeOdds : pick === 'AWAY' ? awayOdds : drawOdds
      reasoning.push(`${pick} @ ${pickOdds} looks underpriced`)
    }
  } else {
    warnings.push('No odds data — cannot calculate edge')
  }

  if (injuredPlayers.length > 4) {
    pick = 'PASS'; confidence = 'PASS'
    warnings.push('Too many injuries — skipping')
  }

  // Structured prediction factors
  const formScore = Math.max(-1, Math.min(1,
    ((homeWins - homeLosses) - (awayWins - awayLosses)) / 4
  ))

  const last5h2h = (h2hFixtures ?? []).slice(-5)
  const h2hPlayed = last5h2h.filter((f: any) => f.goals?.home != null).length
  let homeH2HWins = 0
  last5h2h.forEach((f: any) => {
    const hg = f.goals?.home; const ag = f.goals?.away
    if (hg == null || ag == null || hg === ag) return
    const isHome = f.teams?.home?.id === homeId
    if ((hg > ag && isHome) || (ag > hg && !isHome)) homeH2HWins++
  })
  const h2hScore = h2hPlayed > 0 ? homeH2HWins / h2hPlayed : 0.5

  const injuryImpact = Math.min(1, injuredPlayers.length / 6)

  const score = fixture.goals?.home != null
    ? `${fixture.goals.home} - ${fixture.goals.away}`
    : undefined

  return {
    fixtureId: fixture.fixture?.id ?? 0,
    homeTeam: fixture.teams?.home?.name ?? 'Home',
    awayTeam: fixture.teams?.away?.name ?? 'Away',
    homeLogo: fixture.teams?.home?.logo ?? '',
    awayLogo: fixture.teams?.away?.logo ?? '',
    kickoff: fixture.fixture?.date ?? '',
    league: leagueName,
    leagueFlag,
    status: fixture.fixture?.status?.short ?? 'NS',
    homeOdds, drawOdds, awayOdds,
    pick, confidence, edge: Math.max(0, edge),
    reasoning, warnings, injuredPlayers, h2hRecord,
    homeForm, awayForm, score,
    formScore, h2hScore, injuryImpact,
  }
}

// ── AI reasoning via OpenAI ──────────────────────────────────────────────────

export async function getAIReasoning(
  homeTeam: string,
  awayTeam: string,
  homeForm: string,
  awayForm: string,
  h2hRecord: string,
  injuries: string[],
  pick: string,
  edge: number,
  homeOdds: number,
  drawOdds: number,
  awayOdds: number,
): Promise<string[]> {
  try {
    const { openai } = await import('@/lib/openai')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You are a sharp soccer betting analyst. Be brief, specific, and data-driven. No fluff.',
        },
        {
          role: 'user',
          content: `Analyse this match and give 3 sharp bullet points.

Match: ${homeTeam} vs ${awayTeam}
Home form last 5: ${homeForm || 'Unknown'}
Away form last 5: ${awayForm || 'Unknown'}
H2H: ${h2hRecord}
Injuries: ${injuries.join(', ') || 'None reported'}
Our pick: ${pick}
Edge vs market: +${(edge * 100).toFixed(1)}%
Odds: H ${homeOdds} / D ${drawOdds} / A ${awayOdds}

Return ONLY a JSON object with key "reasons" containing an array of 3 strings.
Example: {"reasons": ["Bayern 4W last 5 home games", "Key striker doubtful", "H2H: 7 wins in last 10"]}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed.slice(0, 3)
    if (Array.isArray(parsed.reasons)) return parsed.reasons.slice(0, 3)
    if (Array.isArray(parsed.analysis)) return parsed.analysis.slice(0, 3)
    if (Array.isArray(parsed.bullets)) return parsed.bullets.slice(0, 3)
    // Fallback: find any array value in the object
    const arr = Object.values(parsed).find(v => Array.isArray(v))
    if (arr) return (arr as string[]).slice(0, 3)
    return []
  } catch (e) {
    console.error('[getAIReasoning]', e)
    return []
  }
}

// ── Strategy calculators ─────────────────────────────────────────────────────

export interface Value1X2Result {
  strategy: 'VALUE_1X2'
  pick: string
  odds: number
  edge: number
  kellyStake: number
  exampleStake100: string
  expectedReturn: string
}

export function calcValue1X2(
  modelHome: number, modelDraw: number, modelAway: number,
  marketHome: number, marketDraw: number, marketAway: number,
  homeOdds: number, drawOdds: number, awayOdds: number,
  safetyMargin = 0.02,
): Value1X2Result | null {
  const edges = [
    { outcome: 'HOME', edge: modelHome - marketHome - safetyMargin, odds: homeOdds, prob: modelHome },
    { outcome: 'DRAW', edge: modelDraw - marketDraw - safetyMargin, odds: drawOdds, prob: modelDraw },
    { outcome: 'AWAY', edge: modelAway - marketAway - safetyMargin, odds: awayOdds, prob: modelAway },
  ].filter(e => e.edge > 0).sort((a, b) => b.edge - a.edge)

  if (!edges.length) return null
  const best = edges[0]
  const b = best.odds - 1
  const p = best.prob
  const q = 1 - p
  const kelly = Math.max(0, (b * p - q) / b)
  const halfKelly = kelly / 2

  return {
    strategy: 'VALUE_1X2',
    pick: best.outcome,
    odds: best.odds,
    edge: best.edge,
    kellyStake: halfKelly,
    exampleStake100: (halfKelly * 100).toFixed(2),
    expectedReturn: (halfKelly * 100 * best.odds).toFixed(2),
  }
}

export interface DutchingResult {
  strategy: 'DUTCHING'
  outcomes: Array<{ outcome: string; odds: number; stake: string; return: string }>
  totalStake: string
  guaranteedProfit: string
  profitMargin: string
}

export function calcDutching(
  outcomes: Array<{ name: string; odds: number; probability: number }>,
  targetProfit = 100,
): DutchingResult | null {
  const top2 = [...outcomes].sort((a, b) => b.probability - a.probability).slice(0, 2)
  const combinedProb = top2.reduce((s, o) => s + o.probability, 0)
  if (combinedProb > 0.95) return null

  const totalOddsReciprocal = top2.reduce((s, o) => s + 1 / o.odds, 0)
  const totalStake = targetProfit / (1 / totalOddsReciprocal - 1)

  const stakes = top2.map(o => ({
    outcome: o.name,
    odds: o.odds,
    stake: (totalStake / o.odds / totalOddsReciprocal).toFixed(2),
    return: targetProfit.toFixed(2),
  }))

  return {
    strategy: 'DUTCHING',
    outcomes: stakes,
    totalStake: totalStake.toFixed(2),
    guaranteedProfit: targetProfit.toFixed(2),
    profitMargin: ((targetProfit / totalStake) * 100).toFixed(1),
  }
}

export interface SureBetResult {
  strategy: 'SURE_BET'
  arbPercentage: string
  stakes: { home: string; draw: string; away: string }
  totalStake: number
  guaranteedProfit: string
  roi: string
}

export function calcSureBet(
  homeOdds: number, drawOdds: number, awayOdds: number, stake = 100,
): SureBetResult | null {
  if (!homeOdds || !drawOdds || !awayOdds) return null
  const arb = 1 / homeOdds + 1 / drawOdds + 1 / awayOdds
  if (arb >= 1) return null

  const profit = stake * (1 / arb - 1)
  return {
    strategy: 'SURE_BET',
    arbPercentage: ((1 - arb) * 100).toFixed(2),
    stakes: {
      home: (stake / (homeOdds * arb)).toFixed(2),
      draw: (stake / (drawOdds * arb)).toFixed(2),
      away: (stake / (awayOdds * arb)).toFixed(2),
    },
    totalStake: stake,
    guaranteedProfit: profit.toFixed(2),
    roi: ((profit / stake) * 100).toFixed(2),
  }
}
