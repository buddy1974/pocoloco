import { db } from '@/lib/db'
import { userCalibration } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function getUserCalibration(userId: string, strategyId = 'value_1x2') {
  return db
    .select()
    .from(userCalibration)
    .where(
      and(
        eq(userCalibration.userId, userId),
        eq(userCalibration.strategyId, strategyId)
      )
    )
    .orderBy(userCalibration.computedAt)
}
