export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, engineRuns } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join } from 'path'

function getApiUsage() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const file = join(process.cwd(), '..', 'data', 'apifootball-usage.json')
    const data = JSON.parse(readFileSync(file, 'utf-8'))
    return data.date === today ? data.count : 0
  } catch {
    return null
  }
}

export default async function AdminPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.user.role !== 'owner') redirect('/dashboard')

  const [allUsers, lastRuns] = await Promise.all([
    db.select({
      id: users.id, email: users.email, role: users.role,
      onboardingComplete: users.onboardingComplete, createdAt: users.createdAt,
    }).from(users),
    db.select().from(engineRuns).orderBy(desc(engineRuns.startedAt)).limit(20),
  ])

  const apiUsage = getApiUsage()

  return (
    <div className="space-y-8">
      <h1 className="mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin</h1>

      {/* API Budget */}
      <div className="p-5 rounded-lg border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="mono text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>API-FOOTBALL BUDGET</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
            <div className="h-full rounded-full transition-all"
                 style={{
                   width: apiUsage !== null ? `${(apiUsage / 95) * 100}%` : '0%',
                   backgroundColor: (apiUsage ?? 0) > 80 ? 'var(--accent-red)' : 'var(--accent-green)',
                 }} />
          </div>
          <span className="mono text-sm" style={{ color: 'var(--text-secondary)' }}>
            {apiUsage !== null ? `${apiUsage} / 95` : 'N/A (local only)'}
          </span>
        </div>
      </div>

      {/* Engine runs */}
      <div>
        <h2 className="mono text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>ENGINE RUNS</h2>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {lastRuns.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No runs recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  {['Routine', 'Started', 'Status', 'API calls'].map(h => (
                    <th key={h} className="text-left px-4 py-2 mono text-xs font-medium"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lastRuns.map(run => (
                  <tr key={run.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2 mono text-xs" style={{ color: 'var(--text-secondary)' }}>{run.routine}</td>
                    <td className="px-4 py-2 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {run.startedAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span className="mono text-xs px-2 py-0.5 rounded border" style={{
                        borderColor: run.status === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)',
                        color: run.status === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)',
                      }}>{run.status}</span>
                    </td>
                    <td className="px-4 py-2 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {run.apiCallsUsed ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Users */}
      <div>
        <h2 className="mono text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>USERS ({allUsers.length})</h2>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                {['Email', 'Role', 'Onboarded', 'Since'].map(h => (
                  <th key={h} className="text-left px-4 py-2 mono text-xs font-medium"
                      style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allUsers.map(u => (
                <tr key={u.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td className="px-4 py-2 mono text-xs" style={{ color: 'var(--text-muted)' }}>{u.role}</td>
                  <td className="px-4 py-2 text-xs" style={{
                    color: u.onboardingComplete ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}>{u.onboardingComplete ? '✓' : '—'}</td>
                  <td className="px-4 py-2 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {u.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
