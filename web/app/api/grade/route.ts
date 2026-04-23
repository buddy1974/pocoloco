import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { predictions, calibration } from '@/lib/db/schema'
import { eq, gte, lte, and, isNull } from 'drizzle-orm'

export const runtime = 'nodejs'

const BASE = 'https://v3.football.api-sports.io'
const KEY = process.env.APIFOOTBALL_KEY!

async function fetchResult(fixtureId: number) {
  const res = await fetch(`${BASE}/fixtures?id=${fixtureId}`, {
    headers: { 'x-apisports-key': KEY },
  })
  const data = await res.json()
  const fixture = data.response?.[0]
  if (!fixture) return null
  const status = fixture.fixture?.status?.short
  if (!['FT', 'AET', 'PEN'].includes(status)) return null
  const hg = fixture.goals?.home ?? 0
  const ag = fixture.goals?.away ?? 0
  return hg > ag ? 'HOME' : ag > hg ? 'AWAY' : 'DRAW'
}

function weekPeriod(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const start = new Date(yesterday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(yesterday)
  end.setHours(23, 59, 59, 999)

  const ungraded = await db
    .select()
    .from(predictions)
    .where(and(
      gte(predictions.kickoff, start),
      lte(predictions.kickoff, end),
      isNull(predictions.gradedAt),
    ))

  let graded = 0
  let correct = 0

  for (const pred of ungraded) {
    const result = await fetchResult(pred.fixtureId)
    if (!result) continue

    const isCorrect = pred.pick === result
    await db
      .update(predictions)
      .set({ result, correct: isCorrect, gradedAt: new Date() })
      .where(eq(predictions.id, pred.id))

    graded++
    if (isCorrect) correct++
  }

  console.log(`[grade] graded=${graded} correct=${correct} total=${ungraded.length}`)

  // Update calibration for this period
  if (graded > 0) {
    const period = weekPeriod(yesterday)
    const allThisPeriod = await db
      .select()
      .from(predictions)
      .where(and(gte(predictions.kickoff, start), lte(predictions.kickoff, end)))

    // Pass rate = PASS-confidence picks / all picks; computed once for the period
    const passCount = allThisPeriod.filter(p => p.confidence === 'PASS').length
    const passRate = allThisPeriod.length > 0 ? passCount / allThisPeriod.length : 0

    for (const conf of ['HIGH', 'MEDIUM', 'LOW'] as const) {
      const subset = allThisPeriod.filter(p => p.confidence === conf && p.gradedAt)
      if (subset.length === 0) continue
      const correctCount = subset.filter(p => p.correct).length
      const avgEdge = subset.reduce((s, p) => s + p.edge, 0) / subset.length

      await db
        .insert(calibration)
        .values({
          period,
          confidence: conf,
          totalPredictions: subset.length,
          correctPredictions: correctCount,
          hitRate: correctCount / subset.length,
          avgEdge,
          passRate,
        })
        .onConflictDoUpdate({
          target: [calibration.period, calibration.confidence],
          set: {
            totalPredictions: subset.length,
            correctPredictions: correctCount,
            hitRate: correctCount / subset.length,
            avgEdge,
            passRate,
          },
        })

      console.log(`[grade] calibration ${conf} period=${period} total=${subset.length} correct=${correctCount}`)
    }
  }

  return NextResponse.json({ graded, correct, total: ungraded.length })
}
