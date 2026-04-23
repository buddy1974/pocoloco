import type { Metadata } from 'next'
import { Roboto, Roboto_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import Footer from '@/components/Footer'
import './globals.css'

const roboto = Roboto({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-roboto',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-roboto-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Poco Loco — Soccer Intelligence Platform',
  description: 'Real data. Sharp analysis. Your edge.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${roboto.variable} ${robotoMono.variable} h-full antialiased`}>
        <body className={`${roboto.className} min-h-full flex flex-col`}
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', fontWeight: 700 }}>
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
