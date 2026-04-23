'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MAIN_NAV = [
  { href: '/dashboard',              label: "Today's Picks",  icon: '◈' },
  { href: '/dashboard/analyse',      label: 'Quick Analyse',  icon: '⊕' },
  { href: '/dashboard/opportunities', label: 'Opportunities', icon: '◉' },
  { href: '/dashboard/results',      label: 'Results',        icon: '▣' },
]

const DATA_NAV = [
  { href: '/dashboard/imports',    label: 'Import Stats', icon: '↑' },
  { href: '/dashboard/strategies', label: 'Strategies',   icon: '⊞' },
]

const ACCOUNT_NAV = [
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙' },
]

interface Props {
  email: string
  role: string
  isOwner: boolean
}

function NavSection({ title, items }: { title: string; items: typeof MAIN_NAV }) {
  const pathname = usePathname()
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'var(--muted)', padding: '12px 16px 6px', textTransform: 'uppercase' }}>
        {title}
      </p>
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link key={href} href={href} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 16px',
            color: active ? 'var(--accent)' : 'var(--muted)',
            borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
            background: active ? 'rgba(232,106,26,0.06)' : 'transparent',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, width: 14, textAlign: 'center' }}>{icon}</span>
            {label}
          </Link>
        )
      })}
    </div>
  )
}

export default function Sidebar({ email, role, isOwner }: Props) {
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Home link */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px 6px', fontSize: 11, color: 'var(--muted)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}>
        ← Home
      </Link>
      {/* Logo */}
      <div style={{ padding: '14px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, color: '#0d0d0d', letterSpacing: -0.5 }}>PL</span>
        </div>
        <span style={{ fontWeight: 900, fontSize: 15, color: 'var(--text)', letterSpacing: -0.3 }}>Poco Loco</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
        <NavSection title="Intelligence" items={MAIN_NAV} />
        <div style={{ margin: '8px 16px', borderTop: '1px solid var(--border)' }} />
        <NavSection title="Data" items={DATA_NAV} />
        <div style={{ margin: '8px 16px', borderTop: '1px solid var(--border)' }} />
        <NavSection title="Account" items={[
          ...ACCOUNT_NAV,
          ...(isOwner ? [{ href: '/dashboard/admin', label: 'Admin', icon: '⬡' }] : []),
        ]} />
      </nav>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0d0d0d' }}>{initials}</span>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontSize: 11, color: 'var(--text)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{email}</p>
          <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0, fontFamily: 'var(--font-mono)' }}>{role}</p>
        </div>
      </div>
    </aside>
  )
}
