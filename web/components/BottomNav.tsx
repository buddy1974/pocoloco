'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Picks',    icon: '◆', href: '/dashboard' },
  { label: 'Analyse',  icon: '⚡', href: '/dashboard/analyse' },
  { label: 'Results',  icon: '📊', href: '/dashboard/results' },
  { label: 'Settings', icon: '⚙',  href: '/dashboard/settings' },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav
      className="show-mobile"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 64, background: '#161616',
        borderTop: '1px solid #2a2a2a',
        alignItems: 'stretch', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {NAV.map(item => {
        const active = path === item.href ||
          (item.href !== '/dashboard' && path.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              color: active ? '#e86a1a' : '#666',
              textDecoration: 'none', fontSize: 10, fontWeight: 700,
              fontFamily: 'Roboto, sans-serif',
              background: active ? 'rgba(232,106,26,0.08)' : 'transparent',
              borderTop: active ? '2px solid #e86a1a' : '2px solid transparent',
              minHeight: 44,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
