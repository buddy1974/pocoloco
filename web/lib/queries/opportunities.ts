import { db } from '@/lib/db'
import { opportunities, soccerFixtures, soccerIntel } from '@/lib/db/schema'
import { eq, desc, and, gte, sql } from 'drizzle-orm'

export async function getOpportunitiesForUser(userId: string) {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
  return db
    .select({
      opportunity: opportunities,
      fixture: soccerFixtures,
    })
    .from(opportunities)
    .innerJoin(soccerFixtures, eq(opportunities.fixtureId, soccerFixtures.id))
    .where(
      and(
        eq(opportunities.userId, userId),
        gte(opportunities.publishedAt, cutoff)
      )
    )
    .orderBy(
      sql`CASE WHEN ${opportunities.confidence} = 'HIGH' THEN 1
               WHEN ${opportunities.confidence} = 'MEDIUM' THEN 2
               WHEN ${opportunities.confidence} = 'LOW' THEN 3
               ELSE 4 END`,
      desc(opportunities.edge),
      soccerFixtures.kickoff
    )
}

export async function getOpportunityById(id: string, userId: string) {
  const [result] = await db
    .select({
      opportunity: opportunities,
      fixture: soccerFixtures,
      intel: soccerIntel,
    })
    .from(opportunities)
    .innerJoin(soccerFixtures, eq(opportunities.fixtureId, soccerFixtures.id))
    .leftJoin(soccerIntel, eq(opportunities.fixtureId, soccerIntel.fixtureId))
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
    .limit(1)
  return result ?? null
}

export async function updateOpportunityVerdict(
  id: string,
  userId: string,
  verdict: { userVerdict: string; userPick?: string; userOdds?: number; userStake?: number; userNotes?: string }
) {
  await db
    .update(opportunities)
    .set({
      userVerdict: verdict.userVerdict,
      userPick: verdict.userPick ?? null,
      userOdds: verdict.userOdds?.toString() ?? null,
      userStake: verdict.userStake?.toString() ?? null,
      userNotes: verdict.userNotes ?? null,
      verdictAt: new Date(),
    })
    .where(and(eq(opportunities.id, id), eq(opportunities.userId, userId)))
}
