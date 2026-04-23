export const dynamic = 'force-dynamic'

import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import MobileHeader from '@/components/MobileHeader'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (!session.user.onboardingComplete) redirect('/onboarding')

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Sidebar — desktop only */}
      <div className="hide-mobile" style={{ flexShrink: 0 }}>
        <Sidebar
          email={session.user.email}
          role={session.user.role}
          isOwner={session.user.role === 'owner'}
        />
      </div>

      {/* Main column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Mobile header — mobile only */}
        <MobileHeader />

        {/* Scrollable content */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div className="dashboard-content">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile only, fixed */}
      <BottomNav />
    </div>
  )
}
