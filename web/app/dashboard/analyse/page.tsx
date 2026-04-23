'use client'
import { useState } from 'react'

export default function AnalysePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [image, setImage] = useState<string | null>(null)

  async function analyse() {
    if (!query && !image) return
    setLoading(true)
    setResult(null)
    const res = await fetch('/api/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, image }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const confColor = result?.confidence === 'HIGH' ? '#22c55e' :
    result?.confidence === 'MEDIUM' ? '#e86a1a' : '#888'

  return (
    <div className="analyse-container">
      <h1 style={{ fontSize: 20, fontWeight: 900, color: '#e86a1a', margin: '0 0 4px' }}>
        Quick Analyse
      </h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Type a match or upload a screenshot for an instant tip.
      </p>

      <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: 16, marginBottom: 20 }}>
        {/* Match input */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Match
          </label>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && analyse()}
            placeholder="e.g. Bayern vs Dortmund"
            style={{
              width: '100%', height: 48, padding: '0 14px',
              background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 6,
              color: '#f0f0f0', fontFamily: 'Roboto, sans-serif', fontSize: 14, fontWeight: 700,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Image upload */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Or upload screenshot
          </label>
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 48, background: '#0d0d0d', border: '1px dashed #2a2a2a',
            borderRadius: 6, cursor: 'pointer', fontSize: 13, color: image ? '#e86a1a' : '#555',
            fontWeight: 700,
          }}>
            {image ? '✓ Screenshot loaded' : '+ Upload image'}
            <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
          </label>
        </div>

        {/* Analyse button */}
        <button
          onClick={analyse}
          disabled={loading || (!query && !image)}
          style={{
            width: '100%', height: 52, background: '#e86a1a', color: '#0d0d0d',
            border: 'none', borderRadius: 6, fontWeight: 900, fontSize: 15,
            cursor: loading ? 'wait' : 'pointer', fontFamily: 'Roboto, sans-serif',
            opacity: (loading || (!query && !image)) ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}
        >
          {loading && (
            <span style={{
              width: 14, height: 14, border: '2px solid #0d0d0d44',
              borderTopColor: '#0d0d0d', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', display: 'inline-block',
            }} />
          )}
          {loading ? 'Analysing…' : 'Analyse →'}
        </button>
      </div>

      {/* Placeholder */}
      {!result && !loading && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#444', fontSize: 13 }}>
          Enter a match above to get started
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{
          background: '#1e1e1e',
          border: `1px solid ${result.confidence === 'HIGH' ? '#22c55e44' : result.confidence === 'MEDIUM' ? '#e86a1a44' : '#2a2a2a'}`,
          borderLeft: `3px solid ${confColor}`,
          borderRadius: 8, padding: 20,
        }}>
          {/* Match + confidence badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#f0f0f0', flex: 1 }}>{result.match}</div>
            <div style={{
              padding: '4px 10px', borderRadius: 4, flexShrink: 0,
              background: `${confColor}22`, color: confColor,
              fontFamily: 'Roboto Mono, monospace', fontSize: 11, fontWeight: 700,
            }}>{result.confidence}</div>
          </div>

          {/* Pick */}
          <div style={{ fontSize: 28, fontWeight: 900, color: '#e86a1a', marginBottom: 16, fontFamily: 'Roboto Mono, monospace' }}>
            {result.pick}
            {result.odds && <span style={{ fontSize: 16, marginLeft: 10, color: '#f0f0f0' }}>@ {result.odds}</span>}
          </div>

          {/* Reasoning */}
          {result.reasoning?.map((r: string, i: number) => (
            <div key={i} style={{ fontSize: 13, color: '#f0f0f0', padding: '4px 0 4px 12px', borderLeft: '2px solid #e86a1a', marginBottom: 6 }}>
              {r}
            </div>
          ))}

          {/* Warnings */}
          {result.warnings?.map((w: string, i: number) => (
            <div key={i} style={{ fontSize: 12, color: '#ef4444', padding: '4px 0 4px 12px', borderLeft: '2px solid #ef4444', marginBottom: 4, marginTop: 8 }}>
              ⚠ {w}
            </div>
          ))}

          {/* Disclaimer */}
          <div style={{ marginTop: 16, padding: 10, background: '#0d0d0d', borderRadius: 6, fontSize: 11, color: '#555' }}>
            Not financial advice. Analytical tool only. Bet responsibly.
          </div>
        </div>
      )}
    </div>
  )
}
