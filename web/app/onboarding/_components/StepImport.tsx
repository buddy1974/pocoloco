'use client'

import DropZone from '@/app/dashboard/imports/_components/DropZone'

export default function StepImport({ onNext }: { onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mono text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Upload your stats spreadsheet
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This is what makes your picks personal. We&apos;ll fuse your data with live fixtures,
          lineups, and bookmaker odds.
        </p>
      </div>

      <DropZone />

      <div className="pt-2">
        <button onClick={onNext}
                className="w-full py-3 rounded font-semibold"
                style={{ backgroundColor: 'var(--accent-green)', color: '#0a0e1a' }}>
          Continue →
        </button>
        <button onClick={onNext}
                className="w-full mt-2 text-xs text-center"
                style={{ color: 'var(--text-muted)' }}>
          Skip for now →
        </button>
      </div>
    </div>
  )
}
