'use client'
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    period: 'forever',
    color: '#888',
    highlight: false,
    features: [
      '3 picks per day',
      'Confidence grade only',
      'No reasoning',
      'No strategies',
    ],
    cta: 'Start Free',
    ctaHref: '/login',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '€9.99',
    period: 'per month',
    color: '#e86a1a',
    highlight: false,
    features: [
      '10 picks per day',
      'Full AI reasoning',
      'Form + H2H data',
      'Value 1X2 picks',
      'Email tips daily',
    ],
    cta: 'Start Basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€24.99',
    period: 'per month',
    color: '#e86a1a',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Unlimited picks',
      'All strategies',
      'Dutching calculator',
      'Accumulator builder',
      'Telegram HIGH alerts',
      'Calibration dashboard',
      'Sure bet scanner',
    ],
    cta: 'Go Pro',
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '€49.99',
    period: 'per month',
    color: '#e86a1a',
    highlight: false,
    features: [
      'Everything in Pro',
      'Custom leagues',
      'API access',
      'Priority support',
      'Early features',
    ],
    cta: 'Go Elite',
  },
]

function PlanCard({ plan }: { plan: typeof PLANS[0] }) {
  const { isSignedIn } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCTA() {
    if (plan.id === 'free') return
    if (!isSignedIn) {
      window.location.href = `/login?returnTo=/pricing`
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Checkout failed')
      }
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: plan.highlight ? '#1e1e1e' : '#161616',
      border: `1px solid ${plan.highlight ? '#e86a1a' : '#2a2a2a'}`,
      borderRadius: 12, padding: 20, position: 'relative',
    }}>
      {plan.badge && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          background: '#e86a1a', color: '#0d0d0d', fontSize: 10, fontWeight: 900,
          padding: '3px 12px', borderRadius: 20, letterSpacing: 0.5, whiteSpace: 'nowrap',
        }}>
          {plan.badge}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: plan.highlight ? '#e86a1a' : '#f0f0f0' }}>
          {plan.name}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f0f0f0', fontFamily: 'Roboto Mono, monospace' }}>
            {plan.price}
          </div>
          <div style={{ fontSize: 10, color: '#888' }}>{plan.period}</div>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        {plan.features.map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <span style={{ fontSize: 13, color: '#22c55e', flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 12, color: '#f0f0f0' }}>{f}</span>
          </div>
        ))}
      </div>

      {error && <p style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{error}</p>}

      {plan.ctaHref ? (
        <Link href={plan.ctaHref} style={{
          display: 'block', textAlign: 'center', padding: '12px',
          borderRadius: 8, border: '1px solid #2a2a2a', color: '#888',
          fontSize: 14, fontWeight: 700, textDecoration: 'none',
        }}>
          {plan.cta}
        </Link>
      ) : (
        <button
          onClick={handleCTA}
          disabled={loading}
          style={{
            width: '100%', padding: '13px', borderRadius: 8, border: 'none',
            background: plan.highlight ? '#e86a1a' : '#2a2a2a',
            color: plan.highlight ? '#0d0d0d' : '#f0f0f0',
            fontSize: 14, fontWeight: 900, cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1, fontFamily: 'Roboto, sans-serif',
          }}
        >
          {loading ? 'Redirecting…' : plan.cta}
        </button>
      )}
    </div>
  )
}

export default function PricingPage() {
  return (
    <main style={{ background: '#0d0d0d', minHeight: '100vh', padding: '0 0 48px' }}>
      {/* Nav */}
      <nav style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, background: '#e86a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, fontSize: 10, color: '#0d0d0d' }}>PL</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#f0f0f0' }}>Poco Loco</span>
        </Link>
        <Link href="/login" style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e86a1a', color: '#e86a1a', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Sign in
        </Link>
      </nav>

      <div style={{ textAlign: 'center', padding: '48px 16px 32px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f0f0f0', margin: '0 0 8px' }}>Simple pricing</h1>
        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>Start free. Upgrade when you see the edge.</p>
      </div>

      {/* Cards — stacked on mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px', maxWidth: 480, margin: '0 auto' }}>
        {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
      </div>

      <div style={{ padding: '28px 16px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ border: '1px solid #e86a1a33', borderRadius: 8, padding: '12px 16px', background: '#e86a1a08' }}>
          <p style={{ fontSize: 11, color: '#888', margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: '#e86a1a' }}>⚠</strong> Poco Loco provides analytical intelligence only.
            Not financial advice. Past performance does not guarantee future results. 18+.
          </p>
        </div>
      </div>
    </main>
  )
}
