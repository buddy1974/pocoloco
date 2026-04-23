import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await db
    .select({
      fixtureId: predictions.fixtureId,
      homeTeam: predictions.homeTeam,
      awayTeam: predictions.awayTeam,
      league: predictions.league,
      kickoff: predictions.kickoff,
      pick: predictions.pick,
      confidence: predictions.confidence,
      edge: predictions.edge,
      homeOdds: predictions.homeOdds,
      drawOdds: predictions.drawOdds,
      awayOdds: predictions.awayOdds,
      result: predictions.result,
      correct: predictions.correct,
      gradedAt: predictions.gradedAt,
    })
    .from(predictions)
    .where(eq(predictions.userId, session.user.id))
    .orderBy(desc(predictions.kickoff))
    .limit(100)

  return NextResponse.json(rows)
}
