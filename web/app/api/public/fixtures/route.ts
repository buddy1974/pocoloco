import { NextResponse } from 'next/server'
import { fetchFixtures, fetchOdds, LEAGUES } from '@/lib/apifootball'
import { gradeFixture } from '@/lib/intelligence'

export const runtime = 'nodejs'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]

  const allFixtures = await Promise.all(
    Object.values(LEAGUES).map(async (league) => {
      const fixtures = await fetchFixtures(today, league.id)
      return (fixtures ?? []).map((f: any) => ({ ...f, _league: league }))
    })
  ).then(r => r.flat())

  const top5 = allFixtures.slice(0, 5)

  const intel = await Promise.all(
    top5.map(async (f: any) => {
      const odds = await fetchOdds(f.fixture.id)
      return gradeFixture(f, odds, [], [], [], [], f._league.name, f._league.flag)
    })
  )

  return NextResponse.json({
    date: today,
    fixtures: intel.map(i => ({
      fixtureId: i.fixtureId,
      homeTeam: i.homeTeam,
      awayTeam: i.awayTeam,
      league: i.league,
      leagueFlag: i.leagueFlag,
      kickoff: i.kickoff,
      pick: i.pick,
      confidence: i.confidence,
      edge: i.edge,
      homeOdds: i.homeOdds,
      drawOdds: i.drawOdds,
      awayOdds: i.awayOdds,
      status: i.status,
      score: i.score,
      reasoning: i.confidence !== 'PASS'
        ? ['Register free to see full analysis']
        : [],
    })),
    totalToday: allFixtures.length,
    highCount: intel.filter(i => i.confidence === 'HIGH').length,
  })
}
