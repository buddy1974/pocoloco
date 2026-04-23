'use client'

import { useState } from 'react'

export default function StepTelegram({ onNext }: { onNext: () => void }) {
  const [chatId, setChatId] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle')

  async function verify() {
    if (!chatId) return
    const res = await fetch('/api/user/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, action: 'verify' }),
    })
    const d = await res.json()
    setStatus(d.verified ? 'ok' : 'fail')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mono text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Get instant alerts on your phone
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          HIGH and MEDIUM confidence opportunities delivered to Telegram before odds move.
        </p>
      </div>

      <ol className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <li>1. Open Telegram</li>
        <li>2. Search <span className="mono" style={{ color: 'var(--accent-green)' }}>@PocolocoBot</span> → send /start</li>
        <li>3. Send <span className="mono">/start</span> to <span className="mono">@userinfobot</span> to get your Chat ID</li>
      </ol>

      <div className="flex gap-2">
        <input
          value={chatId}
          onChange={e => setChatId(e.target.value)}
          placeholder="Paste Chat ID"
          className="flex-1 rounded border px-3 py-2 text-sm outline-none"
          style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <button onClick={verify}
                className="px-4 py-2 rounded text-sm font-medium border"
                style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>
          Verify
        </button>
      </div>

      {status === 'ok' && <p className="text-sm" style={{ color: 'var(--accent-green)' }}>✓ Verified — test message sent</p>}
      {status === 'fail' && <p className="text-sm" style={{ color: 'var(--accent-red)' }}>✗ Not received. Check your Chat ID.</p>}

      <div>
        <button onClick={onNext}
                className="w-full py-3 rounded font-semibold"
                style={{ backgroundColor: 'var(--accent-green)', color: '#0a0e1a' }}>
          Finish setup →
        </button>
        <button onClick={onNext}
                className="w-full mt-2 text-xs text-center"
                style={{ color: 'var(--text-muted)' }}>
          Skip — I&apos;ll set this up later →
        </button>
      </div>
    </div>
  )
}
