import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { userLeaguePrefs } from '@/lib/db/schema'

const AVAILABLE_LEAGUES = [
  { leagueId: 78, leagueName: 'Bundesliga', country: 'Germany' },
  { leagueId: 79, leagueName: 'Bundesliga 2', country: 'Germany' },
]

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { leagueIds } = (await req.json()) as { leagueIds: number[] }

  for (const league of AVAILABLE_LEAGUES) {
    await db
      .insert(userLeaguePrefs)
      .values({
        userId: session.user.id,
        leagueId: league.leagueId,
        leagueName: league.leagueName,
        country: league.country,
        enabled: leagueIds.includes(league.leagueId),
      })
      .onConflictDoNothing()
  }

  return NextResponse.json({ ok: true })
}
