import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: '#0d0d0d' }}>PL</span>
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>Poco Loco</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>Soccer Intelligence Platform</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full',
              card: 'shadow-none',
              cardBox: 'bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg',
              headerTitle: 'text-white font-bold',
              headerSubtitle: 'text-[#888888]',
              formFieldLabel: 'text-[#888888] font-bold',
              formFieldInput: 'bg-[#0d0d0d] border-[#2a2a2a] text-white',
              formButtonPrimary: 'bg-[#e86a1a] hover:bg-[#c45a12] text-[#0d0d0d] font-bold',
              footerActionLink: 'text-[#e86a1a]',
              identityPreviewText: 'text-white',
              socialButtonsBlockButton: 'border-[#2a2a2a] text-white hover:bg-[#2a2a2a]',
              dividerLine: 'bg-[#2a2a2a]',
              dividerText: 'text-[#888888]',
            },
          }}
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
