'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoRefresh() {
  const router = useRouter()
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    const interval = setInterval(() => {
      router.refresh()
      setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 60000)
    return () => clearInterval(interval)
  }, [router])

  if (!lastUpdated) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
      <span style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto Mono, monospace' }}>
        Updated {lastUpdated}
      </span>
      <button
        onClick={() => { router.refresh(); setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })) }}
        style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: 4, padding: '2px 8px', color: '#555', fontSize: 10, cursor: 'pointer', fontFamily: 'Roboto Mono, monospace' }}
      >
        ↻
      </button>
    </div>
  )
}
