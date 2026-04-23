import { db } from '@/lib/db'
import { soccerTeams } from '@/lib/db/schema'

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[a.length][b.length]
}

let teamCache: Array<{ id: number; canonical: string; aliases: string[] }> | null = null

async function loadTeams() {
  if (teamCache) return teamCache
  teamCache = await db
    .select({ id: soccerTeams.id, canonical: soccerTeams.canonical, aliases: soccerTeams.aliases })
    .from(soccerTeams)
  return teamCache
}

export async function resolveTeam(raw: string): Promise<string | null> {
  const teams = await loadTeams()
  const normalised = raw.trim().toLowerCase()

  for (const team of teams) {
    if (team.canonical.toLowerCase() === normalised) return team.canonical
    if (team.aliases.some((a) => a.toLowerCase() === normalised)) return team.canonical
  }

  let best: { canonical: string; dist: number } | null = null
  for (const team of teams) {
    const candidates = [team.canonical, ...team.aliases]
    for (const candidate of candidates) {
      const dist = levenshtein(normalised, candidate.toLowerCase())
      if (dist < 3 && (!best || dist < best.dist)) {
        best = { canonical: team.canonical, dist }
      }
    }
  }

  return best?.canonical ?? null
}

export function clearTeamCache() {
  teamCache = null
}
