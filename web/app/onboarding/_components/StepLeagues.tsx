'use client'

import { useState } from 'react'

const LIVE_LEAGUES = [
  { id: 78, name: 'Bundesliga', country: 'Germany' },
  { id: 79, name: 'Bundesliga 2', country: 'Germany' },
]
const COMING_LEAGUES = ['EPL', 'La Liga', 'Serie A', 'Ligue 1']

export default function StepLeagues({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState([78, 79])

  async function save() {
    await fetch('/api/user/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueIds: selected }),
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mono text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Which leagues do you cover?
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Live API data is available for these leagues</p>
      </div>
      <div className="space-y-2">
        {LIVE_LEAGUES.map(l => (
          <label key={l.id} className="flex items-center gap-3 p-4 rounded-lg border cursor-pointer"
                 style={{
                   borderColor: selected.includes(l.id) ? 'var(--accent-green)' : 'var(--border)',
                   backgroundColor: 'var(--bg-elevated)',
                 }}>
            <input type="checkbox" checked={selected.includes(l.id)}
                   onChange={e => setSelected(prev => e.target.checked ? [...prev, l.id] : prev.filter(x => x !== l.id))} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{l.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.country}</p>
            </div>
          </label>
        ))}
        {COMING_LEAGUES.map(l => (
          <div key={l} className="flex items-center gap-3 p-4 rounded-lg border opacity-40"
               style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-elevated)' }}>
            <input type="checkbox" disabled />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>{l}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Available via spreadsheet import · Live data requires paid plan
              </p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={save}
              className="w-full py-3 rounded font-semibold"
              style={{ backgroundColor: 'var(--accent-green)', color: '#0a0e1a' }}>
        Continue →
      </button>
    </div>
  )
}
