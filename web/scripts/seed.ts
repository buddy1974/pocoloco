// env vars injected by caller or .env.local
import bcrypt from 'bcryptjs'
import { db } from '../lib/db'
import {
  users,
  strategies,
  userStrategies,
  soccerLeagues,
  soccerTeams,
  soccerFixtures,
  soccerIntel,
  opportunities,
  demoFixtures,
  userLeaguePrefs,
} from '../lib/db/schema'

const BUNDESLIGA_TEAMS = [
  { id: 157, name: 'Bayern Munich', canonical: 'Bayern Munich', aliases: ['Bayern', 'FC Bayern', 'Bayern München', 'FCB'] },
  { id: 165, name: 'Borussia Dortmund', canonical: 'Borussia Dortmund', aliases: ['Dortmund', 'BVB', 'BVB 09'] },
  { id: 168, name: 'Bayer Leverkusen', canonical: 'Bayer Leverkusen', aliases: ['Leverkusen', 'Bayer 04', 'B04'] },
  { id: 173, name: 'RB Leipzig', canonical: 'RB Leipzig', aliases: ['Leipzig', 'Red Bull Leipzig'] },
  { id: 169, name: 'Eintracht Frankfurt', canonical: 'Eintracht Frankfurt', aliases: ['Frankfurt', 'SGE'] },
  { id: 172, name: 'VfB Stuttgart', canonical: 'VfB Stuttgart', aliases: ['Stuttgart', 'VfB'] },
  { id: 161, name: 'VfL Wolfsburg', canonical: 'VfL Wolfsburg', aliases: ['Wolfsburg', 'VfL'] },
  { id: 160, name: 'SC Freiburg', canonical: 'SC Freiburg', aliases: ['Freiburg', 'SCF'] },
  { id: 163, name: 'Borussia Mönchengladbach', canonical: 'Borussia Mönchengladbach', aliases: ['Mönchengladbach', 'Gladbach', 'BMG'] },
  { id: 162, name: 'Werder Bremen', canonical: 'Werder Bremen', aliases: ['Bremen', 'SVW'] },
  { id: 164, name: 'FSV Mainz 05', canonical: 'FSV Mainz 05', aliases: ['Mainz', 'Mainz 05'] },
  { id: 170, name: 'FC Augsburg', canonical: 'FC Augsburg', aliases: ['Augsburg', 'FCA'] },
  { id: 176, name: '1. FC Heidenheim', canonical: '1. FC Heidenheim', aliases: ['Heidenheim', 'FCH'] },
  { id: 167, name: 'TSG Hoffenheim', canonical: 'TSG Hoffenheim', aliases: ['Hoffenheim', 'TSG', '1899 Hoffenheim'] },
  { id: 171, name: '1. FC Union Berlin', canonical: '1. FC Union Berlin', aliases: ['Union Berlin', 'Union', 'FC Union'] },
  { id: 175, name: 'VfL Bochum', canonical: 'VfL Bochum', aliases: ['Bochum'] },
  { id: 174, name: 'Holstein Kiel', canonical: 'Holstein Kiel', aliases: ['Kiel', 'KSV Holstein'] },
  { id: 9456, name: 'SV Darmstadt 98', canonical: 'SV Darmstadt 98', aliases: ['Darmstadt', 'SVD'] },
]

const BUNDESLIGA2_TEAMS = [
  { id: 192, name: 'Hamburger SV', canonical: 'Hamburger SV', aliases: ['Hamburg', 'HSV'] },
  { id: 180, name: 'FC Schalke 04', canonical: 'FC Schalke 04', aliases: ['Schalke', 'S04'] },
  { id: 182, name: 'Hannover 96', canonical: 'Hannover 96', aliases: ['Hannover', 'H96'] },
  { id: 184, name: 'Karlsruher SC', canonical: 'Karlsruher SC', aliases: ['Karlsruhe', 'KSC'] },
  { id: 186, name: 'SpVgg Greuther Fürth', canonical: 'SpVgg Greuther Fürth', aliases: ['Fürth', 'Greuther Fürth'] },
  { id: 188, name: '1. FC Nürnberg', canonical: '1. FC Nürnberg', aliases: ['Nürnberg', 'FCN'] },
  { id: 190, name: 'Fortuna Düsseldorf', canonical: 'Fortuna Düsseldorf', aliases: ['Düsseldorf', 'F95'] },
  { id: 183, name: 'SV Elversberg', canonical: 'SV Elversberg', aliases: ['Elversberg'] },
  { id: 194, name: 'Hertha BSC', canonical: 'Hertha BSC', aliases: ['Hertha', 'BSC', 'Hertha Berlin'] },
  { id: 185, name: '1. FC Kaiserslautern', canonical: '1. FC Kaiserslautern', aliases: ['Kaiserslautern', 'FCK', 'Die Roten Teufel'] },
  { id: 189, name: 'FC St. Pauli', canonical: 'FC St. Pauli', aliases: ['St. Pauli', 'FCSP'] },
  { id: 191, name: 'Eintracht Braunschweig', canonical: 'Eintracht Braunschweig', aliases: ['Braunschweig', 'BTSV'] },
  { id: 193, name: 'SSV Ulm 1846', canonical: 'SSV Ulm 1846', aliases: ['Ulm', 'SSV Ulm'] },
  { id: 181, name: 'FC Hansa Rostock', canonical: 'FC Hansa Rostock', aliases: ['Rostock', 'Hansa'] },
  { id: 187, name: 'SV Wehen Wiesbaden', canonical: 'SV Wehen Wiesbaden', aliases: ['Wiesbaden', 'SVWW'] },
  { id: 195, name: 'Preußen Münster', canonical: 'Preußen Münster', aliases: ['Münster', 'SCP'] },
  { id: 196, name: 'SSV Jahn Regensburg', canonical: 'SSV Jahn Regensburg', aliases: ['Regensburg', 'Jahn'] },
  { id: 197, name: 'FC Magdeburg', canonical: 'FC Magdeburg', aliases: ['Magdeburg', '1. FCM'] },
]

async function seed() {
  console.log('Seeding Pocoloco…')

  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@pocoloco.app'
  const ownerPass = process.env.SEED_OWNER_PASSWORD ?? 'demo-owner'
  const dpEmail = process.env.SEED_DP_EMAIL ?? 'dp@pocoloco.app'
  const dpPass = process.env.SEED_DP_PASSWORD ?? 'demo-dp'

  const [ownerHash, dpHash] = await Promise.all([
    bcrypt.hash(ownerPass, 12),
    bcrypt.hash(dpPass, 12),
  ])

  const [owner] = await db.insert(users).values({
    email: ownerEmail,
    name: 'Marcel (Owner)',
    role: 'owner',
    passwordHash: ownerHash,
    onboardingComplete: true,
  }).onConflictDoNothing().returning()

  const [dp] = await db.insert(users).values({
    email: dpEmail,
    name: 'Design Partner',
    role: 'design_partner',
    passwordHash: dpHash,
    onboardingComplete: true,
  }).onConflictDoNothing().returning()

  console.log('✓ Users seeded')

  await db.insert(strategies).values([
    { id: 'value_1x2', name: 'Value Betting (1X2)', category: 'value', market: '1X2', description: 'Find fixtures where our model disagrees with bookmaker odds. Your edge, explained.', enabled: true, comingSoon: false, sortOrder: 1 },
    { id: 'value_ou25', name: 'Value Betting (O/U 2.5)', category: 'value', market: 'OU_2.5', description: 'Identify over/under 2.5 goals value opportunities.', enabled: false, comingSoon: true, sortOrder: 2 },
    { id: 'value_btts', name: 'Value Betting (BTTS)', category: 'value', market: 'BTTS', description: 'Both teams to score value betting.', enabled: false, comingSoon: true, sortOrder: 3 },
    { id: 'arb_1x2', name: 'Arbitrage (1X2)', category: 'arbitrage', market: '1X2', description: 'Guaranteed profit across multiple bookmakers.', enabled: false, comingSoon: true, sortOrder: 4 },
    { id: 'matched', name: 'Matched Betting', category: 'matched', market: '1X2', description: 'Risk-free profit using bookmaker promotions.', enabled: false, comingSoon: true, sortOrder: 5 },
  ]).onConflictDoNothing()

  console.log('✓ Strategies seeded')

  const leagues = await db.insert(soccerLeagues).values([
    { id: 78, name: 'Bundesliga', country: 'Germany', season: 2025 },
    { id: 79, name: 'Bundesliga 2', country: 'Germany', season: 2025 },
  ]).onConflictDoNothing().returning()

  console.log('✓ Leagues seeded')

  const allTeams = [
    ...BUNDESLIGA_TEAMS.map(t => ({ ...t, leagueId: 78 })),
    ...BUNDESLIGA2_TEAMS.map(t => ({ ...t, leagueId: 79 })),
  ]

  await db.insert(soccerTeams).values(allTeams).onConflictDoNothing()
  console.log('✓ Teams seeded (36)')

  if (owner || dp) {
    const userId = dp?.id ?? owner?.id
    if (userId) {
      await db.insert(userStrategies).values([
        { userId, strategyId: 'value_1x2', enabled: true },
      ]).onConflictDoNothing()

      await db.insert(userLeaguePrefs).values([
        { userId, leagueId: 78, leagueName: 'Bundesliga', country: 'Germany', enabled: true },
        { userId, leagueId: 79, leagueName: 'Bundesliga 2', country: 'Germany', enabled: true },
      ]).onConflictDoNothing()
    }

    if (owner?.id) {
      await db.insert(userStrategies).values([
        { userId: owner.id, strategyId: 'value_1x2', enabled: true },
      ]).onConflictDoNothing()
    }
  }

  console.log('✓ User strategies + leagues seeded')

  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const in2days = new Date(now.getTime() + 48 * 60 * 60 * 1000)

  const demoFixtureData = [
    { id: 999001, homeTeamId: 157, awayTeamId: 165, homeTeamName: 'Bayern Munich', awayTeamName: 'Borussia Dortmund', kickoff: new Date(tomorrow.setHours(17, 30, 0, 0)) },
    { id: 999002, homeTeamId: 168, awayTeamId: 173, homeTeamName: 'Bayer Leverkusen', awayTeamName: 'RB Leipzig', kickoff: new Date(tomorrow.setHours(15, 30, 0, 0)) },
    { id: 999003, homeTeamId: 169, awayTeamId: 172, homeTeamName: 'Eintracht Frankfurt', awayTeamName: 'VfB Stuttgart', kickoff: new Date(in2days.setHours(15, 30, 0, 0)) },
    { id: 999004, homeTeamId: 161, awayTeamId: 162, homeTeamName: 'VfL Wolfsburg', awayTeamName: 'Werder Bremen', kickoff: new Date(in2days.setHours(18, 0, 0, 0)) },
    { id: 999005, homeTeamId: 163, awayTeamId: 160, homeTeamName: 'Borussia Mönchengladbach', awayTeamName: 'SC Freiburg', kickoff: new Date(in2days.setHours(20, 30, 0, 0)) },
  ]

  await db.insert(soccerFixtures).values(
    demoFixtureData.map(f => ({
      ...f,
      leagueId: 78,
      season: 2025,
      status: 'intel-built',
      lineupConfidence: '0.85',
      dataCompleteness: '0.92',
      dataFlags: {},
    }))
  ).onConflictDoNothing()

  await db.insert(soccerIntel).values(
    demoFixtureData.map(f => ({
      fixtureId: f.id,
      homeLineupConfidence: '0.85',
      awayLineupConfidence: '0.80',
      homeForm5: { wins: 4, draws: 0, losses: 1, pts: 12 },
      awayForm5: { wins: 3, draws: 1, losses: 1, pts: 10 },
      homeForm10: { wins: 7, draws: 1, losses: 2, pts: 22 },
      awayForm10: { wins: 6, draws: 2, losses: 2, pts: 20 },
      homeCoachTenure: 365,
      awayCoachTenure: 280,
      homeRedCardLast3: false,
      awayRedCardLast3: false,
      homeCongestion: 7,
      awayCongestion: 8,
      oddsSnapshot: { 'Bet365': { H: 2.1, D: 3.4, A: 3.6 } },
      marketProbs: { H: 0.46, D: 0.28, A: 0.26 },
      dataCompleteness: '0.92',
    }))
  ).onConflictDoNothing()

  console.log('✓ Demo fixtures + intel seeded')

  await db.insert(demoFixtures).values(
    demoFixtureData.map(f => ({ fixtureId: f.id }))
  ).onConflictDoNothing()

  if (dp?.id) {
    const demoOpps = [
      {
        userId: dp.id,
        fixtureId: 999001,
        strategyId: 'value_1x2',
        market: '1X2',
        pick: 'H',
        confidence: 'HIGH',
        edge: '0.067',
        modelProbs: { H: 0.52, D: 0.27, A: 0.21 },
        marketProbs: { H: 0.46, D: 0.28, A: 0.26 },
        oddsSnapshot: { 'Bet365': { H: 2.1, D: 3.4, A: 3.6 } },
        featureSnapshot: {
          home_form_5_pts: 12,
          away_form_5_pts: 10,
          home_goals_for_rate: 2.8,
          away_goals_against_rate: 1.4,
          evidence_score: 0.87,
          lineup_confidence: 0.85,
          data_flags: {}
        },
        userStatsUsed: false,
        reasoning: 'Bayern Munich enter this fixture with exceptional home form (4W, 1L from last 5 at home), averaging 2.8 goals per game while Dortmund concede 1.4 on the road. The model assigns a 6.7% edge on the home win after applying the 2% safety margin against Bet365\'s line. Lineup confidence is 85% with no significant injury concerns on either side. The main risk factor is Dortmund\'s attacking quality on the break — a defensive error could swing this quickly.',
        passReasons: null,
      },
      {
        userId: dp.id,
        fixtureId: 999002,
        strategyId: 'value_1x2',
        market: '1X2',
        pick: 'H',
        confidence: 'HIGH',
        edge: '0.054',
        modelProbs: { H: 0.51, D: 0.28, A: 0.21 },
        marketProbs: { H: 0.44, D: 0.29, A: 0.27 },
        oddsSnapshot: { 'Bet365': { H: 2.2, D: 3.3, A: 3.5 } },
        featureSnapshot: {
          home_form_5_pts: 13,
          away_form_5_pts: 9,
          evidence_score: 0.81,
          lineup_confidence: 0.85,
        },
        userStatsUsed: false,
        reasoning: 'Leverkusen\'s home form this season is outstanding with 13 points from last 5 home games. Leipzig have won only 3 of their last 10 away fixtures. The edge of 5.4% against Bet365 is comfortably above our HIGH threshold. Data completeness is 92% with full lineup information confirmed. The key uncertainty is Leipzig\'s set piece threat, which historically troubles Leverkusen\'s high defensive line.',
        passReasons: null,
      },
      {
        userId: dp.id,
        fixtureId: 999003,
        strategyId: 'value_1x2',
        market: '1X2',
        pick: 'H',
        confidence: 'MEDIUM',
        edge: '0.038',
        modelProbs: { H: 0.48, D: 0.29, A: 0.23 },
        marketProbs: { H: 0.43, D: 0.30, A: 0.27 },
        oddsSnapshot: { 'Bet365': { H: 2.3, D: 3.2, A: 3.6 } },
        featureSnapshot: {
          home_form_5_pts: 10,
          away_form_5_pts: 8,
          evidence_score: 0.71,
          lineup_confidence: 0.80,
        },
        userStatsUsed: false,
        reasoning: 'Frankfurt show moderate home advantage with Stuttgart underperforming away from home this season. The 3.8% edge clears our MEDIUM threshold. Evidence score of 0.71 reflects some lineup uncertainty — probable starters not yet confirmed by both clubs. Lineups for the 3:30pm KO typically confirmed by 1:00pm local time; monitor before placing.',
        passReasons: null,
      },
      {
        userId: dp.id,
        fixtureId: 999004,
        strategyId: 'value_1x2',
        market: '1X2',
        pick: 'H',
        confidence: 'MEDIUM',
        edge: '0.031',
        modelProbs: { H: 0.47, D: 0.30, A: 0.23 },
        marketProbs: { H: 0.43, D: 0.31, A: 0.26 },
        oddsSnapshot: { 'Bet365': { H: 2.3, D: 3.1, A: 3.8 } },
        featureSnapshot: {
          home_form_5_pts: 9,
          away_form_5_pts: 7,
          evidence_score: 0.68,
          lineup_confidence: 0.75,
        },
        userStatsUsed: false,
        reasoning: 'Wolfsburg have won 3 of their last 5 home fixtures while Werder Bremen have only managed 1 win in their last 5 away games. Edge of 3.1% clears MEDIUM. The evidence score of 0.68 is just above the widening threshold, partly due to Wolfsburg\'s striker situation — one key forward is listed as doubtful. If he is ruled out before kickoff, this opportunity should be reconsidered.',
        passReasons: null,
      },
      {
        userId: dp.id,
        fixtureId: 999005,
        strategyId: 'value_1x2',
        market: '1X2',
        pick: 'H',
        confidence: 'PASS',
        edge: null,
        modelProbs: { H: 0.44, D: 0.31, A: 0.25 },
        marketProbs: { H: 0.43, D: 0.30, A: 0.27 },
        oddsSnapshot: { 'Bet365': { H: 2.3, D: 3.2, A: 3.7 } },
        featureSnapshot: {
          evidence_score: 0.54,
          lineup_confidence: 0.55,
        },
        userStatsUsed: false,
        reasoning: 'No sufficient edge identified after applying safety margin. Gladbach vs Freiburg shows balanced market probabilities with the model finding no significant disagreement.',
        passReasons: ['lineup_confidence_below_0.6_and_kickoff_gt_3h'],
      },
    ]

    await db.insert(opportunities).values(demoOpps).onConflictDoNothing()
    console.log('✓ Demo opportunities seeded (5)')
  }

  console.log('\n✓ Seed complete.')
  console.log(`  Owner: ${process.env.SEED_OWNER_EMAIL ?? 'owner@pocoloco.app'}`)
  console.log(`  Design Partner: ${process.env.SEED_DP_EMAIL ?? 'dp@pocoloco.app'}`)
  console.log('  Quick-access pills on /login will fill these credentials.')
}

seed().catch(console.error).finally(() => process.exit())
