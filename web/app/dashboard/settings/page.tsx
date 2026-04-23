'use client'

import { useState } from 'react'

const ROUTINES = [
  { id: 'ingest-fixtures', label: 'Fixture ingestion' },
  { id: 'build-intel', label: 'Build intel' },
  { id: 'publish-value-1x2', label: 'Publish value 1X2' },
  { id: 'grade-results', label: 'Grade results' },
]

export default function SettingsPage() {
  const [chatId, setChatId] = useState('')
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [triggerStatus, setTriggerStatus] = useState<Record<string, 'idle' | 'ok' | 'fail'>>({})
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState('')

  async function saveTelegram() {
    await fetch('/api/user/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, action: 'save' }),
    })
  }

  async function verifyTelegram() {
    const res = await fetch('/api/user/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, action: 'verify' }),
    })
    const d = await res.json()
    setVerifyStatus(d.verified ? 'ok' : 'fail')
  }

  async function triggerRoutine(routine: string) {
    setTriggerStatus(s => ({ ...s, [routine]: 'idle' }))
    const res = await fetch(`/api/triggers/${routine}`, { method: 'POST' })
    setTriggerStatus(s => ({ ...s, [routine]: res.ok ? 'ok' : 'fail' }))
  }

  async function openPortal() {
    setPortalLoading(true)
    setPortalError('')
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    setPortalLoading(false)
    if (data.url) {
      window.location.href = data.url
    } else {
      setPortalError(data.error ?? 'Could not open billing portal')
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      {/* Subscription */}
      <div className="p-5 rounded-lg border space-y-4"
           style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="mono text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>SUBSCRIPTION</h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Manage your plan and billing.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e86a1a' }}>Current plan: <span style={{ color: '#f0f0f0' }}>Loading…</span></div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/pricing" style={{
              padding: '8px 16px', borderRadius: 6, border: '1px solid #e86a1a',
              color: '#e86a1a', fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}>
              View Plans
            </a>
            <button
              onClick={openPortal}
              disabled={portalLoading}
              style={{
                padding: '8px 16px', borderRadius: 6, background: '#e86a1a',
                color: '#0d0d0d', fontSize: 12, fontWeight: 700, border: 'none',
                cursor: portalLoading ? 'wait' : 'pointer', opacity: portalLoading ? 0.6 : 1,
              }}
            >
              {portalLoading ? 'Opening…' : 'Manage Subscription'}
            </button>
          </div>
        </div>
        {portalError && <p style={{ fontSize: 11, color: '#ef4444', margin: 0 }}>{portalError}</p>}
      </div>

      {/* Telegram */}
      <div className="p-5 rounded-lg border space-y-4"
           style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="mono text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>TELEGRAM ALERTS</h2>
        <ol className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
          <li>1. Open Telegram → search @PocolocoBot → send /start</li>
          <li>2. Send /start to @userinfobot to get your Chat ID</li>
        </ol>
        <div className="flex gap-2">
          <input
            value={chatId}
            onChange={e => setChatId(e.target.value)}
            placeholder="Your Chat ID"
            className="flex-1 rounded border px-3 py-2 text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <button onClick={saveTelegram}
                  className="px-3 py-2 rounded border text-xs"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Save
          </button>
          <button onClick={verifyTelegram}
                  className="px-3 py-2 rounded text-xs font-medium"
                  style={{ backgroundColor: 'var(--accent)', color: '#0a0e1a' }}>
            Verify
          </button>
        </div>
        {verifyStatus === 'ok' && <p className="text-xs" style={{ color: 'var(--success)' }}>✓ Verified</p>}
        {verifyStatus === 'fail' && <p className="text-xs" style={{ color: 'var(--danger)' }}>✗ Not received. Check your Chat ID.</p>}
      </div>

      {/* Manual triggers */}
      <div className="p-5 rounded-lg border space-y-4"
           style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <h2 className="mono text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>MANUAL TRIGGERS</h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Dispatches a GitHub Actions workflow run.</p>
        <div className="space-y-2">
          {ROUTINES.map(({ id, label }) => (
            <div key={id} className="flex items-center justify-between">
              <span className="mono text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <div className="flex items-center gap-2">
                {triggerStatus[id] === 'ok' && <span className="text-xs" style={{ color: 'var(--success)' }}>✓ dispatched</span>}
                {triggerStatus[id] === 'fail' && <span className="text-xs" style={{ color: 'var(--danger)' }}>✗ failed</span>}
                <button onClick={() => triggerRoutine(id)}
                        className="px-3 py-1 rounded border text-xs"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  Run
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
