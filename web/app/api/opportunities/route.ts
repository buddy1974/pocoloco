import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getOpportunitiesForUser } from '@/lib/queries/opportunities'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await getOpportunitiesForUser(session.user.id)
  const data = rows.map(({ opportunity: opp, fixture: fix }) => ({
    id: opp.id,
    pick: opp.pick,
    confidence: opp.confidence,
    edge: opp.edge,
    reasoning: opp.reasoning,
    passReasons: opp.passReasons,
    userVerdict: opp.userVerdict,
    userStatsUsed: opp.userStatsUsed,
    publishedAt: opp.publishedAt,
    fixtureId: opp.fixtureId,
    modelProbs: opp.modelProbs,
    marketProbs: opp.marketProbs,
    fixture: {
      homeTeamName: fix.homeTeamName,
      awayTeamName: fix.awayTeamName,
      kickoff: fix.kickoff,
      status: fix.status,
    },
  }))

  return NextResponse.json(data)
}
