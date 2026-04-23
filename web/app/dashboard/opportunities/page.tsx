'use client'

import { useEffect, useState } from 'react'
import { formatEdge, formatProb } from '@/lib/utils'
import { calcValue1X2, calcSureBet } from '@/lib/intelligence'

type Opportunity = {
  id: string
  pick: string
  confidence: string
  edge: string | null
  reasoning: string
  passReasons: string[] | null
  userVerdict: string | null
  userStatsUsed: boolean
  publishedAt: string
  fixtureId: number
  modelProbs: Record<string, number> | null
  marketProbs: Record<string, number> | null
  fixture: {
    homeTeamName: string
    awayTeamName: string
    kickoff: string
    status: string
  }
}

const CONF_COLORS: Record<string, string> = {
  HIGH: 'var(--accent)',
  MEDIUM: 'var(--accent-amber)',
  LOW: 'var(--muted)',
  PASS: 'var(--border)',
}

export default function OpportunitiesPage() {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    fetch('/api/opportunities')
      .then(r => r.json())
      .then(data => { setOpps(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? opps : opps.filter(o => o.confidence === filter)

  const grouped = filtered.reduce<Record<string, Opportunity[]>>((acc, opp) => {
    const date = new Date(opp.fixture.kickoff).toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })
    const label = date === today ? 'Today' : date === tomorrow ? 'Tomorrow' : date
    acc[label] = acc[label] ?? []
    acc[label].push(opp)
    return acc
  }, {})

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="mono text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="mono text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Opportunities</h1>
          <span className="mono text-sm px-2 py-0.5 rounded border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            {opps.length}
          </span>
        </div>
        {/* Filters */}
        <div className="flex gap-1">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW', 'PASS'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-1 rounded text-xs mono transition-colors"
                    style={{
                      backgroundColor: filter === f ? 'var(--bg-elevated)' : 'transparent',
                      color: CONF_COLORS[f] ?? 'var(--text-secondary)',
                      border: `1px solid ${filter === f ? (CONF_COLORS[f] ?? 'var(--border)') : 'var(--border)'}`,
                    }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="mono text-sm">No opportunities found.</p>
          <p className="text-xs mt-2">Run publish-value-1x2 or wait for the next scheduled run.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayOpps]) => (
          <div key={date}>
            <h2 className="mono text-xs font-bold mb-3 uppercase tracking-widest"
                style={{ color: 'var(--text-muted)' }}>{date}</h2>
            <div className="space-y-2">
              {dayOpps.map(opp => (
                <OppCard
                  key={opp.id}
                  opp={opp}
                  expanded={expanded === opp.id}
                  onToggle={() => setExpanded(expanded === opp.id ? null : opp.id)}
                  onVerdictChange={(id, verdict) =>
                    setOpps(prev => prev.map(o => o.id === id ? { ...o, userVerdict: verdict } : o))
                  }
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function OppCard({
  opp,
  expanded,
  onToggle,
  onVerdictChange,
}: {
  opp: Opportunity
  expanded: boolean
  onToggle: () => void
  onVerdictChange: (id: string, verdict: string) => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const confColor = CONF_COLORS[opp.confidence] ?? 'var(--text-muted)'
  const edgeVal = opp.edge ? parseFloat(String(opp.edge)) : null
  const kickoffDate = new Date(opp.fixture.kickoff)
  const kickoffStr = kickoffDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  async function submitVerdict(verdict: string) {
    setSubmitting(true)
    await fetch(`/api/opportunities/${opp.id}/verdict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userVerdict: verdict }),
    })
    onVerdictChange(opp.id, verdict)
    setSubmitting(false)
  }

  return (
    <div className="rounded-lg border overflow-hidden transition-all"
         style={{ backgroundColor: 'var(--bg-surface)', borderColor: expanded ? confColor : 'var(--border)' }}>
      {/* Collapsed row */}
      <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={onToggle}>
        <div className="mono text-xs w-10 text-center" style={{ color: 'var(--text-muted)' }}>
          {kickoffStr}
        </div>
        <div className="flex-1">
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {opp.fixture.homeTeamName} vs {opp.fixture.awayTeamName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-sm font-bold px-2 py-0.5 rounded border"
                style={{ color: confColor, borderColor: confColor,
                         boxShadow: opp.confidence === 'HIGH' ? `0 0 8px ${confColor}40` : 'none' }}>
            {opp.pick}
          </span>
          <span className="mono text-xs px-2 py-0.5 rounded border"
                style={{ color: confColor, borderColor: confColor }}>
            {opp.confidence}
          </span>
          {edgeVal !== null && (
            <div className="flex items-center gap-1 w-24">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                <div className="h-full rounded-full transition-all"
                     style={{ width: `${Math.min(edgeVal * 1000, 100)}%`,
                              backgroundColor: edgeVal > 0 ? 'var(--accent)' : 'var(--danger)' }} />
              </div>
              <span className="mono text-xs w-10 text-right" style={{ color: edgeVal > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                {formatEdge(opp.edge)}
              </span>
            </div>
          )}
          {opp.userStatsUsed && (
            <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(232,106,26,0.1)', color: 'var(--accent-green)' }}>
              personalised
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded intel */}
      {expanded && (
        <div className="border-t px-4 py-4 space-y-4" style={{ borderColor: 'var(--border)' }}>
          {/* Probabilities */}
          {opp.modelProbs && opp.marketProbs && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>MODEL PROBS</p>
                <div className="space-y-1">
                  {['H', 'D', 'A'].map(k => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="mono text-xs w-4" style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full"
                             style={{ width: `${((opp.modelProbs?.[k] ?? 0) * 100)}%`,
                                      backgroundColor: k === opp.pick ? 'var(--accent)' : 'var(--border)' }} />
                      </div>
                      <span className="mono text-xs w-8 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {formatProb(opp.modelProbs?.[k] ?? null)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>MARKET PROBS</p>
                <div className="space-y-1">
                  {['H', 'D', 'A'].map(k => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="mono text-xs w-4" style={{ color: 'var(--text-muted)' }}>{k}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div className="h-full rounded-full"
                             style={{ width: `${((opp.marketProbs?.[k] ?? 0) * 100)}%`,
                                      backgroundColor: 'var(--border)' }} />
                      </div>
                      <span className="mono text-xs w-8 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {formatProb(opp.marketProbs?.[k] ?? null)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Reasoning */}
          <div>
            <p className="mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>REASONING</p>
            <p className="text-sm mono leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {opp.reasoning}
            </p>
          </div>

          {/* Strategy panel */}
          {opp.modelProbs && opp.marketProbs && opp.confidence !== 'PASS' && (() => {
            const mH = opp.modelProbs?.['H'] ?? 0, mD = opp.modelProbs?.['D'] ?? 0, mA = opp.modelProbs?.['A'] ?? 0
            const mkH = opp.marketProbs?.['H'] ?? 0, mkD = opp.marketProbs?.['D'] ?? 0, mkA = opp.marketProbs?.['A'] ?? 0
            // Derive approximate odds from market probs (with ~5% overround)
            const hO = mkH > 0 ? +(1 / (mkH * 1.05)).toFixed(2) : 0
            const dO = mkD > 0 ? +(1 / (mkD * 1.05)).toFixed(2) : 0
            const aO = mkA > 0 ? +(1 / (mkA * 1.05)).toFixed(2) : 0
            const v1x2 = hO && dO && aO ? calcValue1X2(mH, mD, mA, mkH, mkD, mkA, hO, dO, aO) : null
            const sureBet = hO && dO && aO ? calcSureBet(hO, dO, aO) : null
            return (
              <div style={{ marginBottom: 12, padding: '10px 12px', background: '#0d0d0d', borderRadius: 6, border: '1px solid #2a2a2a' }}>
                <p style={{ fontSize: 10, color: '#888', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Strategy Analysis</p>
                {v1x2 && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#e86a1a', fontFamily: 'Roboto Mono, monospace' }}>VALUE 1X2</span>
                    <div style={{ fontSize: 11, color: '#f0f0f0', marginTop: 4 }}>
                      Pick: <strong>{v1x2.pick}</strong> @ {v1x2.odds.toFixed(2)} · Edge +{(v1x2.edge * 100).toFixed(1)}% · Kelly {(v1x2.kellyStake * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                      Stake €100 → Risk €{v1x2.exampleStake100} · Expected: €{v1x2.expectedReturn}
                    </div>
                  </div>
                )}
                {sureBet && (
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', fontFamily: 'Roboto Mono, monospace' }}>SURE BET</span>
                    <div style={{ fontSize: 11, color: '#f0f0f0', marginTop: 4 }}>
                      Arb {sureBet.arbPercentage}% · H€{sureBet.stakes.home} D€{sureBet.stakes.draw} A€{sureBet.stakes.away} · Profit €{sureBet.guaranteedProfit}
                    </div>
                  </div>
                )}
                {!v1x2 && !sureBet && (
                  <div style={{ fontSize: 11, color: '#555' }}>No strategy edge found for this fixture.</div>
                )}
                <p style={{ fontSize: 10, color: '#555', margin: '8px 0 0' }}>⚠ Model prediction only. Not financial advice.</p>
              </div>
            )
          })()}

          {/* PASS reasons */}
          {opp.passReasons && opp.passReasons.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {opp.passReasons.map(r => (
                <span key={r} className="text-xs px-2 py-0.5 rounded border"
                      style={{ borderColor: 'var(--accent-amber)', color: 'var(--accent-amber)' }}>
                  {r}
                </span>
              ))}
            </div>
          )}

          {/* Verdict */}
          {opp.confidence !== 'PASS' && (
            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              {opp.userVerdict ? (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Verdict: <span style={{ color: 'var(--text-secondary)' }}>{opp.userVerdict}</span>
                </p>
              ) : (
                <>
                  <button disabled={submitting} onClick={() => submitVerdict('accepted')}
                          className="px-3 py-1 rounded text-xs font-medium border transition-colors"
                          style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                    ✓ Accept
                  </button>
                  <button disabled={submitting} onClick={() => submitVerdict('rejected')}
                          className="px-3 py-1 rounded text-xs font-medium border transition-colors"
                          style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
                    ✗ Reject
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Advisory only. This is not financial advice.
          </p>
        </div>
      )}
    </div>
  )
}
