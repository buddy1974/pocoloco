interface Props {
  todayPicks: number
  highCount: number
  medCount: number
  passCount: number
  avgEdge: number
  date: string
}

export default function StatsBar({ todayPicks, highCount, medCount, passCount, avgEdge, date }: Props) {
  const dateLabel = new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const stats = [
    { label: "TODAY'S PICKS", value: String(todayPicks), color: '#e86a1a' },
    { label: 'HIGH CONF',     value: String(highCount),  color: '#22c55e' },
    { label: 'MEDIUM',        value: String(medCount),   color: '#e86a1a' },
    { label: 'AVG EDGE',      value: todayPicks > 0 ? `+${(avgEdge * 100).toFixed(1)}%` : '—', color: '#e86a1a' },
  ]

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#e86a1a' }}>
            Today&apos;s Intelligence
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>{dateLabel}</p>
        </div>
        <span style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto Mono, monospace' }}>
          {passCount} PASS
        </span>
      </div>

      <div className="stats-grid">
        {stats.map(({ label, value, color }) => (
          <div key={label} style={{
            background: '#1e1e1e', border: '1px solid #2a2a2a',
            borderRadius: 8, padding: '12px 14px',
          }}>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: 0.8, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'Roboto Mono, monospace' }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
