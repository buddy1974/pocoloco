export const dynamic = 'force-dynamic'
export const revalidate = 60

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getMaxFixtures, checkTier, getTier } from '@/lib/subscription'
import {
  fetchFixtures, fetchRecentFixtures, fetchOdds, fetchInjuries, fetchH2H,
  fetchTeamForm, fetchLiveFixtures, LEAGUES, dateStr,
} from '@/lib/apifootball'
import { gradeFixture } from '@/lib/intelligence'
import { db } from '@/lib/db'
import { predictions } from '@/lib/db/schema'
import { and, gte, lte } from 'drizzle-orm'
import FixtureCard from '@/components/FixtureCard'
import StatsBar from '@/components/StatsBar'
import AutoRefresh from '@/components/AutoRefresh'

async function fetchRaw(date: string) {
  return Promise.all(
    Object.values(LEAGUES).map(async (league) => {
      const fixtures = await fetchFixtures(date, league.id)
      return (fixtures ?? []).map((f: any) => ({ ...f, _league: league }))
    })
  ).then(r => r.flat())
}

async function gradeFull(f: any) {
  const [odds, injuries, h2h, homeForm, awayForm] = await Promise.all([
    fetchOdds(f.fixture.id),
    fetchInjuries(f.fixture.id),
    fetchH2H(f.teams.home.id, f.teams.away.id),
    fetchTeamForm(f.teams.home.id, f._league.id),
    fetchTeamForm(f.teams.away.id, f._league.id),
  ])
  return gradeFixture(
    f, odds, injuries ?? [], h2h ?? [],
    homeForm ?? [], awayForm ?? [],
    f._league.name, f._league.flag,
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 24 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#888', letterSpacing: 1, margin: 0 }}>{title.toUpperCase()}</h2>
      <span style={{ fontSize: 11, color: '#555', fontFamily: 'Roboto Mono, monospace' }}>{count} fixtures</span>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const dbUserId = session.user.id
  const tier = getTier(session.user)
  const maxFixtures = getMaxFixtures(session.user)
  const canSeeReasoning = checkTier(session.user, 'showReasoning')

  const today = dateStr(0)
  const yesterday = dateStr(-1)

  // Fetch in parallel
  const [todayRaw, yesterdayRaw, liveRaw] = await Promise.all([
    fetchRaw(today),
    fetchRaw(yesterday),
    fetchLiveFixtures().catch(() => []),
  ])

  // If no fixtures today, fall back to most recent available (Free API plan = seasons 2022-2024 only)
  let sourceFixtures = todayRaw
  let sourceLabel = today
  if (sourceFixtures.length === 0) {
    const recent = await Promise.all(
      Object.values(LEAGUES).map(async (league) => {
        const f = await fetchRecentFixtures(league.id)
        return (f ?? []).map((fx: any) => ({ ...fx, _league: league }))
      })
    ).then(r => r.flat())
    if (recent.length > 0) {
      sourceFixtures = recent
      sourceLabel = 'Recent (API Free plan — upgrade for live data)'
    }
  }

  // Grade fixtures up to tier limit — slice BEFORE gradeFull so hidden data never leaves server
  const lockedCount = Math.max(0, sourceFixtures.length - maxFixtures)
  const todayIntel = await Promise.all(sourceFixtures.slice(0, maxFixtures).map(gradeFull))

  // Strip reasoning for Free tier — ensures reasoning data is not in RSC payload
  const todayDisplay = canSeeReasoning
    ? todayIntel
    : todayIntel.map(i => ({ ...i, reasoning: [], warnings: [] }))

  // Get stored predictions for yesterday to show accuracy
  let predMap = new Map<number, { pick: string; correct: boolean | null }>()
  try {
    const yStart = new Date(yesterday + 'T00:00:00Z')
    const yEnd = new Date(yesterday + 'T23:59:59Z')
    const stored = await db.select({
      fixtureId: predictions.fixtureId,
      pick: predictions.pick,
      correct: predictions.correct,
    }).from(predictions).where(and(gte(predictions.kickoff, yStart), lte(predictions.kickoff, yEnd)))
    predMap = new Map(stored.map(p => [p.fixtureId, p]))
  } catch { /* no predictions yet */ }

  // Save today's non-PASS predictions (fire-and-forget, non-blocking)
  Promise.all(
    todayIntel
      .filter(i => i.confidence !== 'PASS' && i.kickoff)
      .map(i =>
        db.insert(predictions).values({
          userId: dbUserId,
          fixtureId: i.fixtureId,
          homeTeam: i.homeTeam,
          awayTeam: i.awayTeam,
          league: i.league,
          kickoff: new Date(i.kickoff),
          pick: i.pick,
          confidence: i.confidence,
          edge: i.edge,
          homeOdds: i.homeOdds || null,
          drawOdds: i.drawOdds || null,
          awayOdds: i.awayOdds || null,
          reasoning: i.reasoning,
          formScore: i.formScore,
          h2hScore: i.h2hScore,
          injuryImpact: i.injuryImpact,
        }).onConflictDoNothing()
          .catch(e => console.error(`[dashboard] failed to store prediction fixtureId=${i.fixtureId}:`, e))
      )
  ).catch(e => console.error('[dashboard] prediction storage batch failed:', e))

  const liveFixtures: any[] = liveRaw ?? []
  const highPicks = todayIntel.filter(i => i.confidence === 'HIGH')
  const medPicks = todayIntel.filter(i => i.confidence === 'MEDIUM')
  const passCount = todayIntel.filter(i => i.confidence === 'PASS').length
  const avgEdge = todayIntel.filter(i => i.edge > 0).reduce((a, b) => a + b.edge, 0) /
    (todayIntel.filter(i => i.edge > 0).length || 1)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <AutoRefresh />
      </div>

      <StatsBar
        todayPicks={highPicks.length + medPicks.length}
        highCount={highPicks.length}
        medCount={medPicks.length}
        passCount={passCount}
        avgEdge={avgEdge}
        date={sourceLabel}
      />

      {/* Live Now */}
      {liveFixtures.length > 0 && (
        <div>
          <SectionHeader title="🔴 Live Now" count={liveFixtures.length} />
          {liveFixtures.slice(0, 4).map((f: any) => {
            const hg = f.goals?.home ?? 0
            const ag = f.goals?.away ?? 0
            const elapsed = f.fixture?.status?.elapsed ?? '?'
            return (
              <div key={f.fixture?.id} style={{
                background: '#1e1e1e', border: '1px solid #e86a1a44',
                borderLeft: '3px solid #e86a1a', borderRadius: 8, padding: '12px 16px',
                marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                    {f.league?.name ?? 'League'} · <span style={{ color: '#22c55e', fontWeight: 700 }}>● LIVE {elapsed}&apos;</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#f0f0f0' }}>
                    {f.teams?.home?.name} vs {f.teams?.away?.name}
                  </div>
                </div>
                <div style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 22, fontWeight: 700, color: '#e86a1a' }}>
                  {hg} – {ag}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Today */}
      <SectionHeader title={`Today · ${today}`} count={todayDisplay.length} />
      {todayDisplay.length === 0 ? (
        <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8, padding: 32, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>No fixtures found for today.</div>
          <div style={{ fontSize: 11, color: '#555' }}>{today}</div>
        </div>
      ) : (
        todayDisplay.map(fixture => <FixtureCard key={fixture.fixtureId} intel={fixture} />)
      )}
      {lockedCount > 0 && (
        <div style={{ background: '#1a1a1a', border: '1px dashed #333', borderRadius: 8, padding: '12px 16px', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#555' }}>
            {lockedCount} more fixture{lockedCount > 1 ? 's' : ''} available — upgrade to see more
          </span>
          <a href="/pricing" style={{ fontSize: 11, fontWeight: 700, color: '#e86a1a', textDecoration: 'none', fontFamily: 'Roboto Mono, monospace' }}>
            UPGRADE ↗
          </a>
        </div>
      )}

      {/* Yesterday */}
      {yesterdayRaw.length > 0 && (
        <div>
          <SectionHeader title={`Yesterday · ${yesterday}`} count={yesterdayRaw.length} />
          {yesterdayRaw.slice(0, 8).map((f: any) => {
            const hg = f.goals?.home
            const ag = f.goals?.away
            const status = f.fixture?.status?.short ?? ''
            const isDone = ['FT', 'AET', 'PEN'].includes(status)
            const stored = predMap.get(f.fixture?.id)
            return (
              <div key={f.fixture?.id} style={{
                background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 8,
                padding: '12px 16px', marginBottom: 8, opacity: 0.65,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>
                    {f._league?.flag} {f._league?.name} ·{' '}
                    <span style={{ color: '#444', fontFamily: 'Roboto Mono, monospace' }}>
                      {isDone ? 'FT' : status}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#888' }}>
                    {f.teams?.home?.name} vs {f.teams?.away?.name}
                  </div>
                  {stored && (
                    <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>
                      Our pick: <span style={{ color: '#888', fontFamily: 'Roboto Mono, monospace' }}>{stored.pick}</span>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  {hg !== null && ag !== null && (
                    <div style={{ fontFamily: 'Roboto Mono, monospace', fontSize: 20, fontWeight: 700, color: '#555' }}>
                      {hg} – {ag}
                    </div>
                  )}
                  {stored && stored.correct !== null && (
                    <div style={{ fontSize: 14, fontWeight: 900, marginTop: 4 }}>
                      {stored.correct
                        ? <span style={{ color: '#22c55e' }}>✓</span>
                        : <span style={{ color: '#ef4444' }}>✗</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
