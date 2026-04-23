import Link from 'next/link'

export default function MobileHeader() {
  return (
    <header
      className="show-mobile"
      style={{
        height: 56, background: '#161616',
        borderBottom: '1px solid #2a2a2a',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', position: 'sticky', top: 0, zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* Logo — tapping takes user to public landing page */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <div style={{
          width: 28, height: 28, background: '#e86a1a', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, fontSize: 10, color: '#0d0d0d' }}>PL</span>
        </div>
        <span style={{ fontWeight: 900, fontSize: 16, color: '#f0f0f0' }}>Poco Loco</span>
      </Link>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{ fontSize: 10, color: '#555', fontFamily: 'Roboto Mono, monospace' }}>LIVE</span>
      </div>
    </header>
  )
}
