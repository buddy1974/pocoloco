'use client'
import { useState } from 'react'
import type { FixtureIntel } from '@/lib/intelligence'

const C = {
  surface: '#1a1a1a',
  border: '#2a2a2a',
  orange: '#e86a1a',
  amber: '#facc15',
  muted: '#888888',
  text: '#f0f0f0',
  sub: '#999',
  mono: 'Roboto Mono, monospace',
}

const CONF_COLOR: Record<string, string> = {
  HIGH: C.orange, MEDIUM: C.orange, LOW: C.amber, PASS: C.muted,
}

function OddsButton({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 14px', borderRadius: 6, cursor: 'default',
      background: active ? C.orange : '#252525',
      border: `1px solid ${active ? C.orange : C.border}`,
      minWidth: 64,
    }}>
      <span style={{ fontSize: 10, color: active ? '#0d0d0d' : C.muted, fontWeight: 700, letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 16, fontFamily: C.mono, fontWeight: 700, color: active ? '#0d0d0d' : C.text, marginTop: 2 }}>
        {value > 0 ? value.toFixed(2) : '—'}
      </span>
    </div>
  )
}

function EdgeBar({ edge }: { edge: number }) {
  const pct = Math.min(edge * 100, 15)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <div style={{ flex: 1, height: 4, background: '#252525', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${(pct / 15) * 100}%`, height: '100%', background: C.orange, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: C.mono, fontSize: 11, color: C.orange, fontWeight: 700, minWidth: 44, textAlign: 'right' }}>
        +{pct.toFixed(1)}%
      </span>
    </div>
  )
}

function Card({ fi }: { fi: FixtureIntel }) {
  const [expanded, setExpanded] = useState(false)
  const isActive = fi.pick !== 'PASS'
  const kick = fi.kickoff ? new Date(fi.kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${isActive ? '#3a2a1a' : C.border}`,
      borderLeft: isActive ? `3px solid ${CONF_COLOR[fi.confidence]}` : `3px solid ${C.border}`,
      borderRadius: 8, padding: '16px 20px', opacity: isActive ? 1 : 0.55,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>
          {fi.leagueFlag} {fi.league.toUpperCase()} · {kick}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
          background: `${CONF_COLOR[fi.confidence]}22`,
          color: CONF_COLOR[fi.confidence],
          border: `1px solid ${CONF_COLOR[fi.confidence]}44`,
        }}>
          {fi.confidence}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 900, color: C.text, textAlign: 'right' }}>{fi.homeTeam}</span>
        <span style={{ fontSize: 12, color: C.muted, fontFamily: C.mono, minWidth: 24, textAlign: 'center' }}>
          {fi.score ?? 'vs'}
        </span>
        <span style={{ flex: 1, fontSize: 16, fontWeight: 900, color: C.text }}>{fi.awayTeam}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        <OddsButton label="HOME" value={fi.homeOdds} active={fi.pick === 'HOME'} />
        <OddsButton label="DRAW" value={fi.drawOdds} active={fi.pick === 'DRAW'} />
        <OddsButton label="AWAY" value={fi.awayOdds} active={fi.pick === 'AWAY'} />
      </div>

      {isActive && <EdgeBar edge={fi.edge} />}

      <button onClick={() => setExpanded(e => !e)} style={{
        marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
        color: C.muted, fontSize: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {expanded ? '▲' : '▼'} Analysis
      </button>

      {expanded && (
        <ul style={{ margin: '10px 0 0', paddingLeft: 0, listStyle: 'none' }}>
          {fi.reasoning.map((r, i) => (
            <li key={i} style={{ fontSize: 12, color: C.sub, marginBottom: 4, display: 'flex', gap: 6 }}>
              <span style={{ color: C.orange }}>·</span> {r}
            </li>
          ))}
          {fi.injuredPlayers.length > 0 && fi.injuredPlayers.map((inj, i) => (
            <li key={`inj-${i}`} style={{ fontSize: 12, color: '#ef4444', marginBottom: 4, display: 'flex', gap: 6 }}>
              <span>⚑</span> {inj}
            </li>
          ))}
          {fi.h2hRecord !== 'No H2H data' && (
            <li style={{ fontSize: 12, color: C.sub, marginBottom: 4, display: 'flex', gap: 6 }}>
              <span style={{ color: C.orange }}>·</span> H2H: {fi.h2hRecord}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

export default function DashboardUI({ intel, date }: { intel: FixtureIntel[]; date: string }) {
  const picks = intel.filter(f => f.pick !== 'PASS')
  const avgEdge = picks.length > 0 ? picks.reduce((s, f) => s + f.edge, 0) / picks.length : 0

  return (
    <div style={{ color: C.text, fontFamily: 'Roboto, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.orange }}>Today&apos;s Intelligence</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.muted }}>
            {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'PICKS', value: String(picks.length) },
            { label: 'HIGH CONF', value: String(intel.filter(f => f.confidence === 'HIGH').length) },
            { label: 'AVG EDGE', value: picks.length ? `+${(avgEdge * 100).toFixed(1)}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: C.orange }}>{value}</div>
              <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {picks.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>ACTIVE PICKS — {picks.length}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {picks.map(fi => <Card key={fi.fixtureId} fi={fi} />)}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: C.muted, letterSpacing: 1, marginBottom: 12 }}>ALL FIXTURES — {intel.length}</h2>
        {intel.length === 0 ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '32px', textAlign: 'center', color: C.muted }}>
            No fixtures today.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {intel.filter(f => f.pick === 'PASS').map(fi => <Card key={fi.fixtureId} fi={fi} />)}
          </div>
        )}
      </div>
    </div>
  )
}
