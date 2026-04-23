export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getImportsForUser } from '@/lib/queries/imports'
import DropZone from './_components/DropZone'

export default async function ImportsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const imports = await getImportsForUser(session.user.id)

  return (
    <div className="space-y-8">
      <h1 className="mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Imports</h1>

      {/* Upload zone */}
      <div className="rounded-lg border p-6"
           style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="mono text-sm font-bold mb-4" style={{ color: 'var(--text-secondary)' }}>
          UPLOAD STATS SPREADSHEET
        </h2>
        <DropZone />
      </div>

      {/* Import history */}
      <div>
        <h2 className="mono text-sm font-bold mb-3" style={{ color: 'var(--text-secondary)' }}>
          IMPORT HISTORY
        </h2>
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {imports.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              No imports yet. Upload your first spreadsheet above.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  {['File', 'Date', 'Rows', 'Skipped', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-2 mono text-xs font-medium"
                        style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imports.map(imp => (
                  <tr key={imp.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {imp.originalFilename}
                    </td>
                    <td className="px-4 py-3 mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {imp.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 mono" style={{ color: 'var(--text-primary)' }}>
                      {imp.rowsParsed}
                    </td>
                    <td className="px-4 py-3 mono text-xs" style={{ color: imp.rowsSkipped > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                      {imp.rowsSkipped}
                    </td>
                    <td className="px-4 py-3">
                      <span className="mono text-xs px-2 py-0.5 rounded border" style={{
                        borderColor: imp.status === 'approved' ? 'var(--accent-green)' : 'var(--border)',
                        color: imp.status === 'approved' ? 'var(--accent-green)' : 'var(--text-muted)',
                      }}>
                        {imp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
