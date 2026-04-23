export default function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="mono text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Welcome to Pocoloco
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Here&apos;s what we&apos;ll set up in the next 3 minutes:
        </p>
      </div>
      <ul className="space-y-3">
        {[
          'Your betting strategies (what angles you play)',
          'Your leagues',
          'Your stats spreadsheet (the important one)',
          'Telegram for instant opportunity alerts',
        ].map(item => (
          <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--accent-green)' }}>→</span>
            {item}
          </li>
        ))}
      </ul>
      <button onClick={onNext}
              className="w-full py-3 rounded font-semibold"
              style={{ backgroundColor: 'var(--accent-green)', color: '#0a0e1a' }}>
        Let&apos;s go →
      </button>
    </div>
  )
}
