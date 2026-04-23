import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

function tierFromPriceId(priceId: string | undefined): string {
  if (!priceId) return 'free'
  return Object.values(PLANS).find(p => p.priceId === priceId)?.tier ?? 'free'
}

function tierFromSubscription(sub: any): string {
  if (sub.metadata?.plan) return sub.metadata.plan
  return tierFromPriceId(sub.items?.data?.[0]?.price?.id)
}

// current_period_end field name may vary across Stripe API versions — read defensively
function periodEnd(sub: any): number {
  return sub.current_period_end
    ?? sub.billing_cycle_anchor
    ?? Math.floor(Date.now() / 1000) + 30 * 24 * 3600
}

async function activateUser(
  userId: string,
  tier: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  currentPeriodEnd: number,
) {
  const expiresAt = new Date(currentPeriodEnd * 1000)
  await db.update(users).set({ subscriptionTier: tier }).where(eq(users.id, userId))
  await db
    .insert(subscriptions)
    .values({ userId, tier, status: 'active', stripeCustomerId, stripeSubscriptionId, expiresAt })
    .onConflictDoUpdate({
      target: [subscriptions.stripeSubscriptionId],
      set: { tier, status: 'active', expiresAt },
    })
  console.log(`[webhook] activated userId=${userId} tier=${tier} expires=${expiresAt.toISOString()}`)
}

async function expireByStripeId(stripeSubscriptionId: string, userId?: string) {
  await db
    .update(subscriptions)
    .set({ status: 'expired', tier: 'free' })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))

  if (userId) {
    await db.update(users).set({ subscriptionTier: 'free' }).where(eq(users.id, userId))
  }
  console.log(`[webhook] expired stripeId=${stripeSubscriptionId} userId=${userId ?? 'unknown'} → free`)
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: ReturnType<typeof stripe.webhooks.constructEvent>
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (e: any) {
    console.error('[webhook] signature failed', e.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const data = event.data.object as any

  switch (event.type) {

    // Initial checkout: fetch subscription for correct current_period_end
    case 'checkout.session.completed': {
      const userId = data.metadata?.userId
      const stripeSubscriptionId = data.subscription
      if (!userId || !stripeSubscriptionId) break

      try {
        const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any
        await activateUser(
          userId,
          tierFromSubscription(sub),
          data.customer,
          stripeSubscriptionId,
          periodEnd(sub),
        )
      } catch (e: any) {
        console.error('[webhook] checkout.session.completed retrieve failed:', e.message)
      }
      break
    }

    // Renewals, plan changes, cancel_at_period_end toggles
    case 'customer.subscription.updated': {
      const stripeSubscriptionId = data.id
      const userId: string | undefined = data.metadata?.userId
      const isActive = ['active', 'trialing'].includes(data.status as string)

      if (isActive) {
        const tier = tierFromSubscription(data)
        const expiresAt = new Date((data.current_period_end as number) * 1000)

        // Always update subscription row
        await db
          .update(subscriptions)
          .set({ tier, status: 'active', expiresAt })
          .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))

        // Update users table if we have userId
        if (userId) {
          await db.update(users).set({ subscriptionTier: tier }).where(eq(users.id, userId))
        }
        console.log(`[webhook] subscription.updated stripeId=${stripeSubscriptionId} tier=${tier} expires=${expiresAt.toISOString()}`)
      } else {
        await expireByStripeId(stripeSubscriptionId, userId)
      }
      break
    }

    // Cancellation or expiry
    case 'customer.subscription.deleted': {
      await expireByStripeId(data.id, data.metadata?.userId)
      break
    }

    // Successful payment — safety net for renewals, ensures expiresAt is always current
    case 'invoice.payment_succeeded': {
      const stripeSubscriptionId = data.subscription as string | undefined
      if (!stripeSubscriptionId) break

      try {
        const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any
        const userId: string | undefined = sub.metadata?.userId
        if (!userId) {
          const expiresAt = new Date(periodEnd(sub) * 1000)
          await db
            .update(subscriptions)
            .set({ status: 'active', expiresAt })
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
          console.log(`[webhook] invoice.payment_succeeded renewed stripeId=${stripeSubscriptionId}`)
        } else {
          await activateUser(
            userId,
            tierFromSubscription(sub),
            data.customer,
            stripeSubscriptionId,
            periodEnd(sub),
          )
        }
      } catch (e: any) {
        console.error('[webhook] invoice.payment_succeeded failed:', e.message)
      }
      break
    }

    // Payment failed — downgrade to free immediately (Stripe will retry; if all fail, subscription.deleted fires)
    case 'invoice.payment_failed': {
      const stripeSubscriptionId = data.subscription as string | undefined
      console.warn(`[webhook] payment_failed customer=${data.customer} stripeId=${stripeSubscriptionId}`)
      if (stripeSubscriptionId) {
        let userId: string | undefined
        try {
          const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any
          userId = sub.metadata?.userId
        } catch {}
        await expireByStripeId(stripeSubscriptionId, userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
