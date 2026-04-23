'use client'
import { useState } from 'react'
import type { FixtureIntel } from '@/lib/intelligence'

const CONF_COLOR: Record<string, string> = {
  HIGH: '#22c55e', MEDIUM: '#e86a1a', LOW: '#888', PASS: '#444',
}

const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'BT', 'P']
const DONE_STATUSES = ['FT', 'AET', 'PEN']

interface Props {
  intel: FixtureIntel
  pickResult?: boolean | null // null = pending, true = correct, false = wrong
}

export default function FixtureCard({ intel, pickResult = null }: Props) {
  const [expanded, setExpanded] = useState(false)

  const cc = CONF_COLOR[intel.confidence] ?? '#444'
  const isActive = intel.pick !== 'PASS'
  const isLive = LIVE_STATUSES.includes(intel.status)
  const isDone = DONE_STATUSES.includes(intel.status)
  const opacity = isDone ? 0.65 : 1

  const kickTime = intel.kickoff
    ? new Date(intel.kickoff).toLocaleTimeString('de-DE', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
      })
    : '—'

  // Status display
  function statusBadge() {
    if (isLive) return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#22c55e', fontWeight: 900, fontSize: 11 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        LIVE
      </span>
    )
    if (isDone) return <span style={{ color: '#555', fontSize: 11, fontFamily: 'Roboto Mono, monospace' }}>FT</span>
    return <span style={{ color: '#888', fontSize: 11, fontFamily: 'Roboto Mono, monospace' }}>{kickTime}</span>
  }

  // Score display
  function scoreDisplay() {
    if (!intel.score) return null
    const color = isLive ? '#e86a1a' : '#888'
    return (
      <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, fontSize: 13, color }}>
        {intel.score}
      </span>
    )
  }

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: '#1e1e1e',
        border: `1px solid ${isLive ? '#e86a1a44' : isActive ? '#3a2a1a' : '#2a2a2a'}`,
        borderLeft: `3px solid ${isLive ? '#e86a1a' : isActive ? cc : '#2a2a2a'}`,
        borderRadius: 8, marginBottom: 8, overflow: 'hidden', cursor: 'pointer',
        opacity,
      }}
    >
      <div className="fixture-main-row">

        {/* Teams section */}
        <div className="fixture-teams">
          {/* League + status */}
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{intel.leagueFlag} {intel.league}</span>
            <span>·</span>
            {statusBadge()}
            {scoreDisplay()}
          </div>

          {/* Team names — stacked */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0', lineHeight: 1.2 }}>{intel.homeTeam}</div>
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto Mono, monospace', margin: '2px 0' }}>vs</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0', lineHeight: 1.2 }}>{intel.awayTeam}</div>
          </div>
        </div>

        {/* Right: odds + confidence */}
        <div className="fixture-bottom-row">
          {/* Odds — vertical */}
          {intel.homeOdds > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80 }}>
              {(['HOME', 'DRAW', 'AWAY'] as const).map((side, i) => {
                const odds = [intel.homeOdds, intel.drawOdds, intel.awayOdds][i]
                const label = ['H', 'D', 'A'][i]
                const isPick = intel.pick === side
                return (
                  <div key={side} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 9, color: '#555', width: 10, fontFamily: 'Roboto Mono, monospace' }}>{label}</span>
                    <div style={{
                      padding: '3px 8px', borderRadius: 4,
                      border: `1px solid ${isPick ? '#e86a1a' : '#2a2a2a'}`,
                      background: isPick ? '#e86a1a' : 'transparent',
                      color: isPick ? '#0d0d0d' : '#f0f0f0',
                      fontFamily: 'Roboto Mono, monospace', fontSize: 12, fontWeight: 700,
                      minWidth: 44, textAlign: 'center',
                    }}>
                      {odds.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#555' }}>No odds</div>
          )}

          {/* Confidence + edge + pick result */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block', padding: '4px 10px', borderRadius: 4,
              background: `${cc}22`, border: `1px solid ${cc}44`,
              color: cc, fontSize: 11, fontFamily: 'Roboto Mono, monospace', fontWeight: 700,
            }}>
              {intel.confidence}
            </div>

            {intel.edge > 0 && (
              <>
                <div style={{ fontSize: 12, fontFamily: 'Roboto Mono, monospace', color: '#e86a1a', marginTop: 4, fontWeight: 700 }}>
                  +{(intel.edge * 100).toFixed(1)}%
                </div>
                <div style={{ height: 3, background: '#252525', borderRadius: 2, marginTop: 4, overflow: 'hidden', width: 70, marginLeft: 'auto' }}>
                  <div style={{ height: '100%', background: '#e86a1a', width: `${Math.min(intel.edge * 100 / 10, 100)}%`, borderRadius: 2 }} />
                </div>
              </>
            )}

            {/* Pick accuracy badge for graded matches */}
            {pickResult !== null && isDone && (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 900 }}>
                {pickResult
                  ? <span style={{ color: '#22c55e' }}>✓ WIN</span>
                  : <span style={{ color: '#ef4444' }}>✗ LOSS</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <div style={{
        padding: '8px 16px', fontSize: 11, color: '#555',
        borderTop: expanded ? '1px solid #2a2a2a' : 'none',
        display: 'flex', alignItems: 'center', gap: 4, minHeight: 36,
      }}>
        {expanded ? '▲' : '▼'} Analysis
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid #2a2a2a', padding: '14px 16px', background: '#161616' }}>
          {(intel.homeForm || intel.awayForm) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Form</div>
              {[[intel.homeTeam, intel.homeForm], [intel.awayTeam, intel.awayForm]].map(([team, form], i) => (
                <div key={i} style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: '#888' }}>{String(team).slice(0, 14)}: </span>
                  {String(form).split('').map((c, j) => (
                    <span key={j} style={{ color: c === 'W' ? '#22c55e' : c === 'L' ? '#ef4444' : '#888', fontWeight: 900 }}>{c}</span>
                  ))}
                </div>
              ))}
            </div>
          )}

          {intel.h2hRecord && intel.h2hRecord !== 'No H2H data' && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>H2H</div>
              <div style={{ fontSize: 12, color: '#f0f0f0' }}>{intel.h2hRecord}</div>
            </div>
          )}

          {intel.reasoning.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {intel.reasoning.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: '#f0f0f0', padding: '3px 0 3px 10px', borderLeft: '2px solid #e86a1a', marginBottom: 4 }}>
                  {r}
                </div>
              ))}
            </div>
          )}

          {intel.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 11, color: '#ef4444', padding: '3px 0 3px 10px', borderLeft: '2px solid #ef4444', marginBottom: 3 }}>
              ⚠ {w}
            </div>
          ))}

          {intel.injuredPlayers.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Injuries ({intel.injuredPlayers.length})
              </div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>{intel.injuredPlayers.join(' · ')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
