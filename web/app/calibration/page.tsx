import Link from 'next/link'
import { db } from '@/lib/db'
import { calibration, predictions } from '@/lib/db/schema'
import { desc, gte } from 'drizzle-orm'

export const revalidate = 3600

type StatRow = { confidence: string; hitRate: number; total: number; correct: number; avgEdge: number; color: string }

export default async function CalibrationPage() {
  let stats: StatRow[] = []
  let isReal = false
  let recentPredictions: any[] = []

  try {
    const rows = await db.select().from(calibration).orderBy(desc(calibration.createdAt)).limit(20)
    if (rows.length > 0) {
      const grouped: Record<string, typeof rows[0]> = {}
      for (const r of rows) {
        if (!grouped[r.confidence]) grouped[r.confidence] = r
      }
      const realStats = ['HIGH', 'MEDIUM', 'LOW'].map(conf => {
        const r = grouped[conf]
        if (!r) return null
        return {
          confidence: conf,
          hitRate: r.hitRate,
          total: r.totalPredictions,
          correct: r.correctPredictions,
          avgEdge: r.avgEdge,
          color: conf === 'HIGH' ? '#22c55e' : conf === 'MEDIUM' ? '#e86a1a' : '#888',
        }
      }).filter(Boolean) as StatRow[]

      if (realStats.length > 0) {
        stats = realStats
        isReal = true
      }
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    recentPredictions = await db
      .select()
      .from(predictions)
      .where(gte(predictions.kickoff, thirtyDaysAgo))
      .orderBy(desc(predictions.kickoff))
      .limit(20)
  } catch (e) {
    console.error('[calibration] DB error:', e)
  }

  const totalPredictions = stats.reduce((s, r) => s + r.total, 0)
  const totalCorrect = stats.reduce((s, r) => s + r.correct, 0)
  const overallHitRate = totalPredictions > 0 ? totalCorrect / totalPredictions : null
  const gradedLast30 = recentPredictions.filter(p => p.gradedAt !== null).length

  return (
    <main style={{ background: '#0d0d0d', minHeight: '100vh', padding: '0 0 48px' }}>
      {/* Nav */}
      <nav style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#e86a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, fontSize: 10, color: '#0d0d0d' }}>PL</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#f0f0f0' }}>Poco Loco</span>
        </Link>
        <Link href="/login" style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e86a1a', color: '#e86a1a', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Sign in
        </Link>
      </nav>

      <div style={{ padding: '32px 16px', maxWidth: 600, margin: '0 auto' }}>
        {/* Manifesto */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#e86a1a', margin: '0 0 12px' }}>
            Calibration Report
          </h1>
          <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: '#f0f0f0', margin: 0, lineHeight: 1.7 }}>
              We publish our full prediction history.
              Every pick. Every result. Nothing hidden.
              That is how you know this is real.
            </p>
          </div>
          {!isReal && (
            <p style={{ fontSize: 11, color: '#555', marginTop: 8, fontFamily: 'Roboto Mono, monospace' }}>
              * Not enough graded data yet — calibration builds after 2 weeks of predictions
            </p>
          )}
        </div>

        {/* Overall */}
        <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '16px', marginBottom: 16, display: 'flex', gap: 16, justifyContent: 'space-around' }}>
          {[
            { label: 'Total Predictions', value: totalPredictions > 0 ? String(totalPredictions) : '—' },
            { label: 'Overall Hit Rate', value: overallHitRate !== null ? `${(overallHitRate * 100).toFixed(0)}%` : '—' },
            { label: 'Graded (30d)', value: String(gradedLast30) },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e86a1a', fontFamily: 'Roboto Mono, monospace' }}>{value}</div>
              <div style={{ fontSize: 10, color: '#888', letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Per confidence band */}
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 10 }}>HIT RATE BY CONFIDENCE</h2>
        {!isReal && (
          <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '24px 16px', textAlign: 'center', color: '#555', fontFamily: 'Roboto Mono, monospace', fontSize: 13, marginBottom: 8 }}>
            Not enough graded data yet
          </div>
        )}
        {stats.map(s => (
          <div key={s.confidence} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 12, fontWeight: 700, color: s.color, padding: '2px 8px', border: `1px solid ${s.color}44`, borderRadius: 4 }}>
                  {s.confidence}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'Roboto Mono, monospace' }}>
                  {(s.hitRate * 100).toFixed(0)}%
                </span>
                <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>{s.correct}/{s.total} picks</span>
              </div>
            </div>
            <div style={{ height: 6, background: '#0d0d0d', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.hitRate * 100}%`, background: s.color, borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 6 }}>
              Avg edge: +{(s.avgEdge * 100).toFixed(1)}%
            </div>
          </div>
        ))}

        {/* Recent predictions */}
        {recentPredictions.length > 0 && (
          <>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 10, marginTop: 24 }}>RECENT PICKS</h2>
            {recentPredictions.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#161616', border: '1px solid #2a2a2a', borderRadius: 6, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f0' }}>{p.homeTeam} vs {p.awayTeam}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{p.league} · {p.pick}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {p.correct === null ? (
                    <span style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto Mono, monospace' }}>Pending</span>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.correct ? '#22c55e' : '#ef4444' }}>
                      {p.correct ? '✓ WIN' : '✗ LOSS'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Disclaimer */}
        <div style={{ marginTop: 28, border: '1px solid #e86a1a33', borderRadius: 8, padding: '12px 16px', background: '#e86a1a08' }}>
          <p style={{ fontSize: 11, color: '#888', margin: 0, lineHeight: 1.7 }}>
            Past hit rates do not guarantee future results. This is an analytical tool only. Not financial advice. 18+.
          </p>
        </div>
      </div>
    </main>
  )
}
