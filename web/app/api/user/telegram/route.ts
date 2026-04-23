import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { userTelegram } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { chatId, action } = (await req.json()) as { chatId: string; action: 'save' | 'verify' }

  if (action === 'save') {
    await db
      .insert(userTelegram)
      .values({ userId: session.user.id, chatId, verified: false })
      .onConflictDoUpdate({ target: userTelegram.userId, set: { chatId, verified: false } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'verify') {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return NextResponse.json({ error: 'Bot not configured' }, { status: 503 })

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '✓ Pocoloco connected. You will receive opportunity alerts here.',
      }),
    })

    if (!res.ok) return NextResponse.json({ verified: false })

    await db
      .update(userTelegram)
      .set({ verified: true })
      .where(eq(userTelegram.userId, session.user.id))

    return NextResponse.json({ verified: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
