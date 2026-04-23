import * as XLSX from 'xlsx'
import { z } from 'zod'

export const CANONICAL_STAT_KEYS = [
  'team', 'league', 'season', 'match_date', 'opponent', 'venue',
  'xg_for', 'xg_against', 'ppda', 'shots_on_target', 'shots_off_target',
  'possession', 'goals_scored', 'goals_conceded', 'clean_sheets',
  'corners_for', 'corners_against', 'cards_yellow', 'cards_red',
  'form_score', 'user_rating',
] as const

export type CanonicalStatKey = typeof CANONICAL_STAT_KEYS[number] | `user_${string}`

export type ColumnMapping = Record<string, CanonicalStatKey | 'skip'>

export interface ParsedRow {
  teamRaw: string
  league?: string
  season?: string
  matchDate: string
  opponent?: string
  venue?: string
  statKey: string
  statValue?: number
  statText?: string
  sourceRow: Record<string, unknown>
}

export function parseWorkbook(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, unknown>[] } {
  const wb = XLSX.read(buffer)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
  const headers = raw.length > 0 ? Object.keys(raw[0]) : []
  return { headers, rows: raw }
}

export function applyMapping(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping
): { parsed: ParsedRow[]; skipped: number } {
  const parsed: ParsedRow[] = []
  let skipped = 0

  for (const row of rows) {
    const mapped: Record<string, unknown> = {}
    for (const [header, canonical] of Object.entries(mapping)) {
      if (canonical !== 'skip') mapped[canonical] = row[header]
    }

    const teamRaw = String(mapped.team ?? '').trim()
    const matchDate = String(mapped.match_date ?? '').trim()

    if (!teamRaw || !matchDate) {
      skipped++
      continue
    }

    const statKeys = Object.keys(mapped).filter(
      (k) => !['team', 'league', 'season', 'match_date', 'opponent', 'venue'].includes(k)
    )

    for (const statKey of statKeys) {
      const raw = mapped[statKey]
      const statValue = raw !== null && raw !== '' ? Number(raw) : undefined
      parsed.push({
        teamRaw,
        league: String(mapped.league ?? ''),
        season: String(mapped.season ?? ''),
        matchDate,
        opponent: String(mapped.opponent ?? ''),
        venue: String(mapped.venue ?? ''),
        statKey,
        statValue: isNaN(statValue as number) ? undefined : statValue,
        statText: raw !== null ? String(raw) : undefined,
        sourceRow: row,
      })
    }
  }

  return { parsed, skipped }
}

export function computeFingerprint(headers: string[]): string {
  const sorted = [...headers].sort().join('|')
  let hash = 0
  for (let i = 0; i < sorted.length; i++) {
    hash = (Math.imul(31, hash) + sorted.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}
