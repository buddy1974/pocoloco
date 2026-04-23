'use client'

import { useState } from 'react'

const STRATEGIES = [
  { id: 'value_1x2', label: 'Value Betting (1X2)', desc: 'Find fixtures where our model disagrees with bookmaker odds. Your edge, explained.', enabled: true },
  { id: 'value_ou25', label: 'Value (O/U 2.5)', desc: 'Coming soon', disabled: true },
  { id: 'arb_1x2', label: 'Arbitrage (1X2)', desc: 'Coming soon — requires multi-book odds', disabled: true },
  { id: 'matched', label: 'Matched Betting', desc: 'Coming soon', disabled: true },
]

export default function StepModules({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState(['value_1x2'])

  async function save() {
    await fetch('/api/user/strategies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ strategyIds: selected }),
    })
    onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mono text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          What do you want to do?
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select your strategies</p>
      </div>
      <div className="space-y-2">
        {STRATEGIES.map(s => (
          <label key={s.id} className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors"
                 style={{
                   borderColor: selected.includes(s.id) ? 'var(--accent-green)' : 'var(--border)',
                   backgroundColor: 'var(--bg-elevated)',
                   opacity: s.disabled ? 0.5 : 1,
                   cursor: s.disabled ? 'not-allowed' : 'pointer',
                 }}>
            <input
              type="checkbox"
              checked={selected.includes(s.id)}
              disabled={s.disabled}
              onChange={e => {
                if (s.id === 'value_1x2') return
                setSelected(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))
              }}
              className="mt-0.5"
            />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
            </div>
          </label>
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
