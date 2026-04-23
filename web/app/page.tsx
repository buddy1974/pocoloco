export const revalidate = 1800

import Link from 'next/link'
import { fetchFixtures, fetchOdds, fetchLiveFixtures, LEAGUES, dateStr } from '@/lib/apifootball'
import { gradeFixture, type FixtureIntel } from '@/lib/intelligence'

// ── Data fetching ────────────────────────────────────────────────────────────

async function getTodayIntel(): Promise<FixtureIntel[]> {
  const today = dateStr(0)
  const allFixtures = await Promise.all(
    Object.values(LEAGUES).map(async (league) => {
      const fixtures = await fetchFixtures(today, league.id)
      return (fixtures ?? []).map((f: any) => ({ ...f, _league: league }))
    })
  ).then(r => r.flat())

  return Promise.all(
    allFixtures.slice(0, 6).map(async (f: any) => {
      const odds = await fetchOdds(f.fixture.id)
      return gradeFixture(f, odds, [], [], [], [], f._league.name, f._league.flag)
    })
  )
}

async function getYesterdayResults(): Promise<any[]> {
  const yesterday = dateStr(-1)
  const raw = await Promise.all(
    Object.values(LEAGUES).map(l => fetchFixtures(yesterday, l.id))
  ).then(r => r.flat().filter(Boolean))
  return raw.slice(0, 6)
}

async function getLive(): Promise<any[]> {
  try { return (await fetchLiveFixtures()) ?? [] }
  catch { return [] }
}

// ── Components ───────────────────────────────────────────────────────────────

const CC: Record<string, string> = { HIGH: '#22c55e', MEDIUM: '#e86a1a', LOW: '#888', PASS: '#444' }

function TipCard({ fi, locked }: { fi: FixtureIntel; locked: boolean }) {
  const cc = CC[fi.confidence] ?? '#444'
  const isActive = fi.pick !== 'PASS'
  const kickTime = fi.kickoff
    ? new Date(fi.kickoff).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
    : '—'
  const isLive = ['1H', '2H', 'HT', 'ET', 'P'].includes(fi.status)

  return (
    <div style={{
      background: '#1e1e1e',
      border: `1px solid ${isLive ? '#e86a1a44' : isActive ? '#3a2a1a' : '#2a2a2a'}`,
      borderLeft: `3px solid ${isLive ? '#e86a1a' : isActive ? cc : '#2a2a2a'}`,
      borderRadius: 8, padding: '14px 16px', marginBottom: 8,
      filter: locked ? 'blur(4px)' : 'none',
      userSelect: locked ? 'none' : 'auto',
      pointerEvents: locked ? 'none' : 'auto',
    }}>
      {/* League + time */}
      <div style={{ fontSize: 11, color: '#888', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{fi.leagueFlag} {fi.league}</span>
        <span>·</span>
        {isLive
          ? <span style={{ color: '#22c55e', fontWeight: 700 }}>● LIVE</span>
          : <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{kickTime}</span>}
        {fi.score && <span style={{ color: '#e86a1a', fontFamily: 'Roboto Mono, monospace', fontWeight: 700 }}>{fi.score}</span>}
      </div>

      {/* Teams */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0' }}>{fi.homeTeam}</div>
        <div style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto Mono, monospace', margin: '2px 0' }}>vs</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0' }}>{fi.awayTeam}</div>
      </div>

      {/* Odds row */}
      {fi.homeOdds > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['HOME', 'DRAW', 'AWAY'] as const).map((side, i) => {
            const odds = [fi.homeOdds, fi.drawOdds, fi.awayOdds][i]
            const label = ['H', 'D', 'A'][i]
            const isPick = fi.pick === side
            return (
              <div key={side} style={{
                flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 6,
                border: `1px solid ${isPick ? '#e86a1a' : '#2a2a2a'}`,
                background: isPick ? '#e86a1a' : 'transparent',
              }}>
                <div style={{ fontSize: 9, color: isPick ? '#0d0d0d88' : '#555' }}>{label}</div>
                <div style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 13, fontWeight: 700, color: isPick ? '#0d0d0d' : '#f0f0f0' }}>
                  {odds.toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Badge row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: 'Roboto Mono, monospace',
            background: `${cc}22`, color: cc, border: `1px solid ${cc}44`,
          }}>{fi.confidence}</span>
          {fi.edge > 0 && (
            <span style={{ fontSize: 11, color: '#e86a1a', fontFamily: 'Roboto Mono, monospace', fontWeight: 700 }}>
              +{(fi.edge * 100).toFixed(1)}%
            </span>
          )}
        </div>
        {!locked && (
          <Link href="/login" style={{ fontSize: 11, color: '#555', textDecoration: 'none' }}>
            Full analysis <span style={{ color: '#e86a1a' }}>›</span>
          </Link>
        )}
      </div>
    </div>
  )
}

function ResultRow({ f }: { f: any }) {
  const hg = f.goals?.home ?? '?'
  const ag = f.goals?.away ?? '?'
  return (
    <div style={{
      background: '#161616', border: '1px solid #2a2a2a', borderRadius: 8,
      padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      opacity: 0.7,
    }}>
      <div>
        <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{f.league?.name ?? '—'}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#888' }}>
          {f.teams?.home?.name} vs {f.teams?.away?.name}
        </div>
      </div>
      <div style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 18, fontWeight: 700, color: '#555' }}>
        {hg} – {ag}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const [intel, yesterday, live] = await Promise.all([
    getTodayIntel(),
    getYesterdayResults(),
    getLive(),
  ])

  const today = dateStr(0)
  const picks = intel.filter(i => i.confidence !== 'PASS')
  const highCount = intel.filter(i => i.confidence === 'HIGH').length

  return (
    <main style={{ background: '#0d0d0d', minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>

      {/* ── STICKY NAV ─────────────────────────────────────── */}
      <nav style={{
        background: '#161616', borderBottom: '1px solid #2a2a2a',
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#e86a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Roboto Mono, monospace', fontWeight: 700, fontSize: 10, color: '#0d0d0d' }}>PL</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#f0f0f0' }}>Poco Loco</span>
        </div>
        <Link href="/login" style={{ color: '#f0f0f0', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Sign In
        </Link>
      </nav>

      {/* ── HERO STRIP ─────────────────────────────────────── */}
      <div style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', padding: '20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#e86a1a', fontFamily: 'Roboto Mono, monospace', fontWeight: 700, letterSpacing: 1 }}>
              SOCCER INTELLIGENCE
            </p>
            <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: '#f0f0f0', lineHeight: 1.2 }}>
              Sharp picks. Real edge.
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
              AI-powered analysis across 5 leagues
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #2a2a2a', fontSize: 11, color: '#888' }}>
              ⚡ 5 leagues
            </span>
            <span style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid #2a2a2a', fontSize: 11, color: '#888' }}>
              🎯 AI-powered
            </span>
          </div>
        </div>
      </div>

      {/* ── LIVE TICKER ─────────────────────────────────────── */}
      {live.length > 0 && (
        <div style={{ background: '#161616', borderBottom: '1px solid #2a2a2a', overflow: 'hidden', height: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%', animation: 'tickerScroll 30s linear infinite', whiteSpace: 'nowrap' }}>
            {[...live, ...live].map((f: any, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px', height: '100%', borderRight: '1px solid #2a2a2a', flexShrink: 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#f0f0f0', fontWeight: 700 }}>
                  {f.teams?.home?.name?.slice(0, 10)} {f.goals?.home ?? 0} – {f.goals?.away ?? 0} {f.teams?.away?.name?.slice(0, 10)}
                </span>
                <span style={{ fontSize: 10, color: '#555', fontFamily: 'Roboto Mono, monospace' }}>
                  {f.fixture?.status?.elapsed}&apos;
                </span>
              </div>
            ))}
          </div>
          <style>{`@keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
        </div>
      )}

      {/* ── TODAY'S INTELLIGENCE ─────────────────────────────── */}
      <section style={{ padding: '24px 16px' }} id="fixtures">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0', margin: 0 }}>Today · {today}</h2>
            {picks.length > 0 && (
              <p style={{ fontSize: 11, color: '#888', margin: '3px 0 0' }}>
                {picks.length} picks · {highCount} HIGH confidence
              </p>
            )}
          </div>
          <Link href="/calibration" style={{ fontSize: 11, color: '#e86a1a', textDecoration: 'none' }}>
            Track record →
          </Link>
        </div>

        {intel.length === 0 ? (
          <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: 32, textAlign: 'center', color: '#888' }}>
            No fixtures scheduled today. Check back later.
          </div>
        ) : (
          <>
            {intel.slice(0, 3).map(fi => <TipCard key={fi.fixtureId} fi={fi} locked={false} />)}
            {intel.length > 3 && intel.slice(3).map(fi => <TipCard key={fi.fixtureId} fi={fi} locked />)}

            {/* Lock gate */}
            {intel.length > 3 && (
              <div style={{
                marginTop: -40, background: 'linear-gradient(to bottom, transparent 0%, #0d0d0d 50%)',
                padding: '60px 0 0', textAlign: 'center',
              }}>
                <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 12, padding: '20px 16px', margin: '0 0' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#f0f0f0', marginBottom: 6 }}>
                    🔒 See all {intel.length} picks today — free
                  </div>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>
                    Full analysis · Injuries · H2H · Odds edge
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/login" style={{
                      padding: '12px 24px', borderRadius: 8, background: '#e86a1a',
                      color: '#0d0d0d', fontSize: 14, fontWeight: 900, textDecoration: 'none',
                    }}>
                      Register Free →
                    </Link>
                    <Link href="/login" style={{
                      padding: '12px 24px', borderRadius: 8, border: '1px solid #2a2a2a',
                      color: '#888', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    }}>
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── YESTERDAY'S RESULTS ─────────────────────────────── */}
      {yesterday.length > 0 && (
        <section style={{ padding: '0 16px 24px' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#888', letterSpacing: 1, marginBottom: 12 }}>
            YESTERDAY · RESULTS
          </h2>
          {yesterday.map((f: any) => <ResultRow key={f.fixture?.id} f={f} />)}
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ padding: '0 16px 24px', background: '#161616', borderTop: '1px solid #2a2a2a' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#888', letterSpacing: 1, padding: '24px 0 16px', margin: 0 }}>
          HOW IT WORKS
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            {
              icon: '📊',
              title: '5 Leagues Scanned Daily',
              desc: 'Champions League, Europa League, Bundesliga, BL2, Premier League',
            },
            {
              icon: '🧠',
              title: 'AI Analyses Every Match',
              desc: 'Form, injuries, H2H, odds movement, coach changes, travel distance',
            },
            {
              icon: '⚡',
              title: 'You Get Sharp Picks Only',
              desc: 'HIGH confidence: edge ≥ 5% · MEDIUM: edge ≥ 3% · PASS when data is unclear',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14, color: '#f0f0f0', marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CALIBRATION TEASER ───────────────────────────────── */}
      <section style={{ padding: '0 16px 32px' }}>
        <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: '20px 16px', marginTop: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: '#f0f0f0', margin: '0 0 8px' }}>
            Our track record is public.
          </p>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 14px', lineHeight: 1.6 }}>
            Every pick. Every result. Nothing hidden.
            That is how you know this is real.
          </p>
          <Link href="/calibration" style={{
            display: 'inline-block', padding: '10px 20px', borderRadius: 6,
            border: '1px solid #e86a1a', color: '#e86a1a',
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            View calibration →
          </Link>
        </div>
      </section>

      {/* ── DISCLAIMER ───────────────────────────────────────── */}
      <section style={{ padding: '0 16px 24px' }}>
        <div style={{ border: '1px solid #e86a1a22', borderRadius: 8, padding: '12px 16px', background: '#e86a1a08' }}>
          <p style={{ fontSize: 11, color: '#888', margin: 0, lineHeight: 1.7 }}>
            <strong style={{ color: '#e86a1a' }}>⚠</strong> Poco Loco provides analytical intelligence only.
            Not financial advice. Past performance does not guarantee future results. 18+. Bet responsibly.
          </p>
        </div>
      </section>

    </main>
  )
}
