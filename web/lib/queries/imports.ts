import { db } from '@/lib/db'
import { userSoccerImports, userColumnMappings } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getImportsForUser(userId: string) {
  return db
    .select()
    .from(userSoccerImports)
    .where(eq(userSoccerImports.userId, userId))
    .orderBy(desc(userSoccerImports.createdAt))
}

export async function getColumnMapping(userId: string, fingerprint: string) {
  const [result] = await db
    .select()
    .from(userColumnMappings)
    .where(
      eq(userColumnMappings.userId, userId)
    )
    .limit(1)
  return result ?? null
}
