import { db } from '@/lib/db'
import { soccerFixtures, soccerIntel } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'

export async function getUpcomingFixtures(hours = 48) {
  const from = new Date()
  const to = new Date(Date.now() + hours * 60 * 60 * 1000)
  return db
    .select()
    .from(soccerFixtures)
    .where(and(gte(soccerFixtures.kickoff, from), lte(soccerFixtures.kickoff, to)))
    .orderBy(soccerFixtures.kickoff)
}

export async function getFixtureWithIntel(fixtureId: number) {
  const [result] = await db
    .select({ fixture: soccerFixtures, intel: soccerIntel })
    .from(soccerFixtures)
    .leftJoin(soccerIntel, eq(soccerFixtures.id, soccerIntel.fixtureId))
    .where(eq(soccerFixtures.id, fixtureId))
    .limit(1)
  return result ?? null
}
