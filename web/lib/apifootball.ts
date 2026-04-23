import { cache } from 'react'
import { getOrFetch } from '@/lib/api-cache'

const BASE = 'https://v3.football.api-sports.io'
const KEY = process.env.APIFOOTBALL_KEY!

export const LEAGUES = {
  CHAMPIONS_LEAGUE: { id: 2,  name: 'Champions League', flag: '🏆' },
  EUROPA_LEAGUE:    { id: 3,  name: 'Europa League',    flag: '🌟' },
  BUNDESLIGA:       { id: 78, name: 'Bundesliga',        flag: '🇩🇪' },
  BUNDESLIGA_2:     { id: 79, name: '2. Bundesliga',     flag: '🇩🇪' },
  PREMIER_LEAGUE:   { id: 39, name: 'Premier League',    flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
}

// Soccer seasons run August to May
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()
  const season = month >= 8 ? String(year) : String(year - 2)
  console.log(`[apifootball] getCurrentSeason → ${season} (month=${month} year=${year})`)
  return season
}

// Raw HTTP fetch — no Next.js data cache, no react.cache; only used internally
async function apiFetch(endpoint: string, params: Record<string, string>): Promise<any[] | null> {
  const url = new URL(`${BASE}/${endpoint}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  try {
    const res = await fetch(url.toString(), {
      headers: { 'x-apisports-key': KEY },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.response ?? []
  } catch {
    return null
  }
}

// TTLs (seconds) per data type
const TTL = {
  fixtures:       5  * 60,
  odds:           10 * 60,
  injuries:       15 * 60,
  h2h:            60 * 60,
  teamForm:       60 * 60,
  recentFixtures: 60 * 60,
}

// react.cache() provides per-request deduplication on top of the DB cache
export const fetchFixtures = cache(async (date: string, leagueId: number) => {
  const season = getCurrentSeason()
  return getOrFetch(
    `fixtures:${date}:${leagueId}:${season}`,
    () => apiFetch('fixtures', { date, league: String(leagueId), season }),
    TTL.fixtures,
  )
})

export const fetchRecentFixtures = cache(async (leagueId: number) => {
  const season = getCurrentSeason()
  return getOrFetch(
    `recentFixtures:${leagueId}:${season}`,
    () => apiFetch('fixtures', { league: String(leagueId), season, last: '3' }),
    TTL.recentFixtures,
  )
})

// Live fixtures bypass DB cache entirely — short-lived, always fresh
export const fetchLiveFixtures = cache(async () => {
  const res = await fetch(`${BASE}/fixtures?live=all`, {
    headers: { 'x-apisports-key': KEY },
    next: { revalidate: 30 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.response ?? []
})

export const fetchOdds = cache(async (fixtureId: number) => {
  return getOrFetch(
    `odds:${fixtureId}`,
    () => apiFetch('odds', { fixture: String(fixtureId), bookmaker: '8' }),
    TTL.odds,
  )
})

export const fetchInjuries = cache(async (fixtureId: number) => {
  return getOrFetch(
    `injuries:${fixtureId}`,
    () => apiFetch('injuries', { fixture: String(fixtureId) }),
    TTL.injuries,
  )
})

export const fetchH2H = cache(async (team1: number, team2: number) => {
  const season = getCurrentSeason()
  return getOrFetch(
    `h2h:${team1}:${team2}:${season}`,
    () => apiFetch('fixtures/headtohead', { h2h: `${team1}-${team2}`, last: '10', season }),
    TTL.h2h,
  )
})

export const fetchTeamForm = cache(async (teamId: number, leagueId: number) => {
  const season = getCurrentSeason()
  return getOrFetch(
    `teamForm:${teamId}:${leagueId}:${season}`,
    async () => {
      const result = await apiFetch('fixtures', {
        team: String(teamId), league: String(leagueId), season, last: '5',
      })
      if (result && result.length > 0) return result
      const next = String(Number(season) + 1)
      return apiFetch('fixtures', { team: String(teamId), league: String(leagueId), season: next, last: '5' })
    },
    TTL.teamForm,
  )
})

export async function searchFixtures(homeTeam: string, awayTeam: string) {
  const today = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const date = d.toISOString().split('T')[0]
    const results = await Promise.all(
      Object.values(LEAGUES).map(l => fetchFixtures(date, l.id))
    ).then(r => r.flat().filter(Boolean))
    const match = results.find((f: any) => {
      const home = f.teams?.home?.name?.toLowerCase() ?? ''
      const away = f.teams?.away?.name?.toLowerCase() ?? ''
      return home.includes(homeTeam.toLowerCase()) || away.includes(awayTeam.toLowerCase())
    })
    if (match) return match
  }
  return null
}

export function dateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}
