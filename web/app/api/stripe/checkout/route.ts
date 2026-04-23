import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, PLANS } from '@/lib/stripe'
import { getSession } from '@/lib/session'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: string }
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const session = await getSession()
  const email = session?.user?.email

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email ?? undefined,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?cancelled=true`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
    })
    return NextResponse.json({ url: checkoutSession.url })
  } catch (e: any) {
    console.error('[stripe checkout]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
