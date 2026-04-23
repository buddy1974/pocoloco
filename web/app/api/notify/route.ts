import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { predictions, users, userTelegram } from '@/lib/db/schema'
import { eq, gte, lte, and, inArray, isNull } from 'drizzle-orm'
import { sendTip, isQuietHours } from '@/lib/telegram'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!secret || (secret !== cronSecret && secret !== anthropicKey)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  // Only picks not yet notified today
  const todayPicks = await db
    .select()
    .from(predictions)
    .where(and(
      gte(predictions.createdAt, todayStart),
      lte(predictions.createdAt, todayEnd),
      inArray(predictions.confidence, ['HIGH', 'MEDIUM']),
      isNull(predictions.notifiedAt),
    ))

  if (todayPicks.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No unnotified picks today' })
  }

  // Pro/Elite users with verified Telegram
  const proUsers = await db
    .select({
      userId: users.id,
      chatId: userTelegram.chatId,
      quietStart: userTelegram.quietStart,
      quietEnd: userTelegram.quietEnd,
      timezone: userTelegram.timezone,
    })
    .from(users)
    .innerJoin(userTelegram, eq(userTelegram.userId, users.id))
    .where(and(
      inArray(users.subscriptionTier, ['pro', 'elite']),
      eq(userTelegram.verified, true),
    ))

  let sent = 0
  for (const pick of todayPicks) {
    let pickSent = false

    for (const user of proUsers) {
      // Respect quiet hours per user's timezone
      if (isQuietHours(user.quietStart, user.quietEnd, user.timezone)) continue

      const ok = await sendTip(user.chatId, {
        homeTeam: pick.homeTeam,
        awayTeam: pick.awayTeam,
        league: pick.league,
        pick: pick.pick,
        odds: pick.pick === 'HOME' ? (pick.homeOdds ?? 0)
            : pick.pick === 'DRAW' ? (pick.drawOdds ?? 0)
            : (pick.awayOdds ?? 0),
        confidence: pick.confidence,
        edge: pick.edge,
        reasoning: pick.reasoning ?? [],
        kickoff: pick.kickoff.toISOString(),
      })
      if (ok) { sent++; pickSent = true }
    }

    // Mark pick as notified regardless of recipient count (prevents re-send on retry)
    if (pickSent) {
      await db
        .update(predictions)
        .set({ notifiedAt: new Date() })
        .where(eq(predictions.id, pick.id))
    }
  }

  return NextResponse.json({ sent, picks: todayPicks.length, users: proUsers.length })
}
