import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { userStrategies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { strategyIds } = (await req.json()) as { strategyIds: string[] }
  if (!Array.isArray(strategyIds) || strategyIds.length === 0) {
    return NextResponse.json({ error: 'strategyIds required' }, { status: 400 })
  }

  for (const strategyId of strategyIds) {
    await db
      .insert(userStrategies)
      .values({ userId: session.user.id, strategyId, enabled: true })
      .onConflictDoNothing()
  }

  return NextResponse.json({ ok: true })
}
