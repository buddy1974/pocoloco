export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { eq, and, isNotNull, desc } from 'drizzle-orm'
import { formatEdge } from '@/lib/utils'

export default async function ResultsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const graded = await db
    .select()
    .from(predictions)
    .where(and(
      eq(predictions.userId, session.user.id),
      isNotNull(predictions.gradedAt),
    ))
    .orderBy(desc(predictions.kickoff))

  const highGraded = graded.filter(p => p.confidence === 'HIGH')
  const medGraded = graded.filter(p => p.confidence === 'MEDIUM')

  function hitRate(rows: typeof graded): number | null {
    if (rows.length === 0) return null
    return Math.round((rows.filter(p => p.correct === true).length / rows.length) * 100)
  }

  const highHit = hitRate(highGraded)
  const medHit = hitRate(medGraded)

  return (
    <div className="space-y-8">
      <h1 className="mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Results</h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'HIGH hit rate', val: highHit !== null ? `${highHit}%` : '—', n: highGraded.length, color: 'var(--accent-green)' },
          { label: 'MEDIUM hit rate', val: medHit !== null ? `${medHit}%` : '—', n: medGraded.length, color: 'var(--accent-amber)' },
          { label: 'Total graded', val: String(graded.length), n: null, color: 'var(--text-secondary)' },
        ].map(({ label, val, n, color }) => (
          <div key={label} className="p-5 rounded-lg border"
               style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
            <p className="mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{label.toUpperCase()}</p>
            <p className="text-3xl font-bold mono" style={{ color }}>{val}</p>
            {n !== null && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>n={n}</p>
            )}
            {n !== null && n < 30 && (
              <p className="text-xs mt-1" style={{ color: 'var(--accent-amber)' }}>
                Need 30+ for reliable calibration
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {graded.length === 0 ? (
          <p className="p-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            No graded results yet. Predictions are graded automatically after matches complete.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                {['Fixture', 'Pick', 'Conf', 'Edge', 'Result', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-2 mono text-xs font-medium"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {graded.map(p => (
                <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {p.homeTeam} vs {p.awayTeam}
                  </td>
                  <td className="px-4 py-3 mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {p.pick}
                  </td>
                  <td className="px-4 py-3 mono text-xs" style={{
                    color: p.confidence === 'HIGH' ? 'var(--accent-green)' :
                           p.confidence === 'MEDIUM' ? 'var(--accent-amber)' : 'var(--text-muted)',
                  }}>
                    {p.confidence}
                  </td>
                  <td className="px-4 py-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatEdge(p.edge)}
                  </td>
                  <td className="px-4 py-3 mono text-xs font-bold" style={{
                    color: p.correct === true ? 'var(--accent-green)' :
                           p.correct === false ? 'var(--accent-red)' : 'var(--text-muted)',
                  }}>
                    {p.correct === null ? '—' : p.correct ? '✓' : '✗'}
                  </td>
                  <td className="px-4 py-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(p.kickoff).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
