export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { strategies, userStrategies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function StrategiesPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [allStrategies, userStrats] = await Promise.all([
    db.select().from(strategies).orderBy(strategies.sortOrder),
    db.select().from(userStrategies).where(eq(userStrategies.userId, session.user.id)),
  ])

  const userStratMap = new Map(userStrats.map(s => [s.strategyId, s]))

  return (
    <div className="space-y-6">
      <h1 className="mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Strategies</h1>

      <div className="space-y-3">
        {allStrategies.map(s => {
          const userStrat = userStratMap.get(s.id)
          const isActive = userStrat?.enabled && !s.comingSoon

          return (
            <div key={s.id} className="p-5 rounded-lg border"
                 style={{
                   backgroundColor: 'var(--bg-surface)',
                   borderColor: isActive ? 'var(--accent-green)' : 'var(--border)',
                   opacity: s.comingSoon ? 0.6 : 1,
                 }}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {s.name}
                    </h3>
                    {s.comingSoon && (
                      <span className="mono text-xs px-2 py-0.5 rounded border"
                            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                        COMING SOON
                      </span>
                    )}
                    {isActive && (
                      <span className="mono text-xs px-2 py-0.5 rounded border"
                            style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.description}</p>
                  <p className="mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Market: {s.market} · Category: {s.category}
                  </p>
                </div>
              </div>

              {isActive && userStrat && (
                <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t text-xs"
                     style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Min confidence: </span>
                    <span className="mono" style={{ color: 'var(--text-secondary)' }}>{userStrat.minConfidence}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Notify on: </span>
                    <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                      {userStrat.notifyOn?.join(', ') ?? 'HIGH, MEDIUM'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
