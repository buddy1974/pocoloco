import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db
    .update(users)
    .set({ onboardingComplete: true })
    .where(eq(users.id, session.user.id))

  return NextResponse.json({ ok: true })
}
