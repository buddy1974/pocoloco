'use client'

import { useState, useRef } from 'react'
import { CANONICAL_STAT_KEYS } from '@/lib/parsers/soccerStats'

type UploadState =
  | { stage: 'idle' }
  | { stage: 'uploading' }
  | { stage: 'mapping'; importId: string; headers: string[]; knownMapping: Record<string, string> | null }
  | { stage: 'done'; rowsParsed: number; rowsSkipped: number; unmappedTeams: { raw: string }[] }
  | { stage: 'error'; message: string }

export default function DropZone() {
  const [state, setState] = useState<UploadState>({ stage: 'idle' })
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setState({ stage: 'uploading' })
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/imports/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (!res.ok) return setState({ stage: 'error', message: data.error })
    if (data.knownMapping) {
      setMapping(data.knownMapping)
      setState({ stage: 'mapping', importId: data.importId, headers: data.headers, knownMapping: data.knownMapping })
    } else {
      const initial: Record<string, string> = {}
      for (const h of data.headers) initial[h] = 'skip'
      setMapping(initial)
      setState({ stage: 'mapping', importId: data.importId, headers: data.headers, knownMapping: null })
    }
  }

  async function submitMapping(importId: string) {
    const res = await fetch('/api/imports/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importId, columnMapping: mapping }),
    })
    const data = await res.json()
    if (!res.ok) return setState({ stage: 'error', message: data.error })
    setState({ stage: 'done', rowsParsed: data.rowsParsed, rowsSkipped: data.rowsSkipped, unmappedTeams: data.unmappedTeams ?? [] })
  }

  return (
    <div className="space-y-4">
      {state.stage === 'idle' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors"
          style={{ borderColor: dragOver ? 'var(--accent-green)' : 'var(--border)' }}>
          <input ref={inputRef} type="file" accept=".xlsx,.csv" className="hidden"
                 onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            Drop your .xlsx or .csv here, or click to browse
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Max 10MB</p>
        </div>
      )}

      {state.stage === 'uploading' && (
        <p className="text-sm mono" style={{ color: 'var(--text-muted)' }}>Uploading…</p>
      )}

      {state.stage === 'mapping' && (
        <div className="space-y-4">
          {state.knownMapping ? (
            <div className="p-3 rounded border text-sm"
                 style={{ borderColor: 'var(--accent-green)', color: 'var(--accent-green)', backgroundColor: 'rgba(0,230,118,0.05)' }}>
              ✓ Auto-mapped {Object.keys(state.knownMapping).length}/{state.headers.length} columns
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Map your columns</p>
          )}
          <div className="overflow-hidden rounded border" style={{ borderColor: 'var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  {['Your header', 'Maps to'].map(h => (
                    <th key={h} className="text-left px-4 py-2 mono text-xs" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.headers.map(header => (
                  <tr key={header} className="border-t" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-4 py-2 mono text-xs" style={{ color: 'var(--text-secondary)' }}>{header}</td>
                    <td className="px-4 py-2">
                      <select
                        value={mapping[header] ?? 'skip'}
                        onChange={e => setMapping(m => ({ ...m, [header]: e.target.value }))}
                        className="w-full text-xs rounded px-2 py-1 border outline-none"
                        style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                        <option value="skip">[skip this column]</option>
                        {CANONICAL_STAT_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => submitMapping(state.importId)}
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: 'var(--accent-green)', color: '#0a0e1a' }}>
            Save mapping &amp; import
          </button>
        </div>
      )}

      {state.stage === 'done' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--accent-green)' }}>✓ {state.rowsParsed} rows imported</p>
          {state.rowsSkipped > 0 && (
            <p className="text-sm" style={{ color: 'var(--accent-amber)' }}>✗ {state.rowsSkipped} rows skipped</p>
          )}
          {state.unmappedTeams.length > 0 && (
            <p className="text-sm" style={{ color: 'var(--accent-amber)' }}>
              ⚠️ {state.unmappedTeams.length} teams not recognised
            </p>
          )}
          <button onClick={() => setState({ stage: 'idle' })}
                  className="text-xs" style={{ color: 'var(--accent-blue)' }}>
            Upload another file
          </button>
        </div>
      )}

      {state.stage === 'error' && (
        <div className="p-3 rounded border text-sm"
             style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
          {state.message}
          <button onClick={() => setState({ stage: 'idle' })} className="ml-3 underline text-xs">
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
