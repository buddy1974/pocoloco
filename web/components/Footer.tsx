export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #2a2a2a',
      padding: '16px',
      textAlign: 'center',
      background: '#161616',
      color: '#888',
      fontSize: '11px',
      fontFamily: 'Roboto, sans-serif',
      fontWeight: 700,
    }}>
      <div style={{ marginBottom: 4 }}>
        Developed by{' '}
        <a
          href="https://maxpromo.digital"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#e86a1a' }}
        >
          maxpromo.digital
        </a>
      </div>
      <div style={{ color: '#555' }}>
        Poco Loco © 2025 · Predictions only · Not financial advice · 18+
      </div>
    </footer>
  )
}
