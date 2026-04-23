import type { FixtureIntel } from '@/lib/intelligence'
import Link from 'next/link'

const CONF_COLOR: Record<string, string> = {
  HIGH: '#22c55e', MEDIUM: '#e86a1a', LOW: '#888', PASS: '#444',
}

interface Props {
  intel: FixtureIntel
  locked?: boolean
}

export default function PublicFixtureCard({ intel, locked = false }: Props) {
  const cc = CONF_COLOR[intel.confidence] ?? '#444'
  const isActive = intel.pick !== 'PASS'

  const kickTime = intel.kickoff
    ? new Date(intel.kickoff).toLocaleTimeString('de-DE', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
      })
    : '—'

  return (
    <div style={{
      background: '#1e1e1e',
      border: `1px solid ${isActive ? '#3a2a1a' : '#2a2a2a'}`,
      borderLeft: `3px solid ${isActive ? cc : '#2a2a2a'}`,
      borderRadius: 8, marginBottom: 8, overflow: 'hidden',
      position: 'relative',
      filter: locked ? 'blur(3px)' : 'none',
      userSelect: locked ? 'none' : 'auto',
      pointerEvents: locked ? 'none' : 'auto',
    }}>
      <div style={{ padding: '12px 16px' }}>
        {/* League + time */}
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>
          {intel.leagueFlag} {intel.league} · <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{kickTime}</span>
          {intel.score && <span style={{ color: '#e86a1a', marginLeft: 8, fontFamily: 'Roboto Mono, monospace', fontWeight: 700 }}>{intel.score}</span>}
        </div>

        {/* Teams */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0' }}>{intel.homeTeam}</div>
          <div style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto Mono, monospace', margin: '2px 0' }}>vs</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0' }}>{intel.awayTeam}</div>
        </div>

        {/* Confidence + pick + odds */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '3px 10px', borderRadius: 4,
              background: `${cc}22`, border: `1px solid ${cc}44`,
              color: cc, fontSize: 11, fontFamily: 'Roboto Mono, monospace', fontWeight: 700,
            }}>{intel.confidence}</span>
            {isActive && intel.pick !== 'PASS' && (
              <span style={{ fontSize: 13, fontWeight: 900, color: '#e86a1a', fontFamily: 'Roboto Mono, monospace' }}>
                {intel.pick}
                {intel.homeOdds > 0 && (
                  <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                    @ {intel.pick === 'HOME' ? intel.homeOdds : intel.pick === 'DRAW' ? intel.drawOdds : intel.awayOdds}
                  </span>
                )}
              </span>
            )}
          </div>
          {intel.edge > 0 && (
            <span style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 12, color: '#e86a1a', fontWeight: 700 }}>
              +{(intel.edge * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {/* Locked CTA hint */}
        {!locked && intel.reasoning.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#555' }}>
            <Link href="/login" style={{ color: '#e86a1a', textDecoration: 'none', fontWeight: 700 }}>
              Register free
            </Link>
            {' '}to see full analysis
          </div>
        )}
      </div>
    </div>
  )
}
