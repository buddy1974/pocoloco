import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No session' }, { status: 401 })

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1)

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_URL}/dashboard/settings`,
    })
    return NextResponse.json({ url: portalSession.url })
  } catch (e: any) {
    console.error('[stripe portal]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
