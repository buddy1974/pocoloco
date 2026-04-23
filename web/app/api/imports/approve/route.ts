import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import {
  userSoccerImports,
  userSoccerStats,
  userColumnMappings,
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { head } from '@vercel/blob'
import { parseWorkbook, applyMapping, computeFingerprint } from '@/lib/parsers/soccerStats'
import { resolveTeam } from '@/lib/parsers/teamResolver'
import type { ColumnMapping } from '@/lib/parsers/soccerStats'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { importId, columnMapping } = (await req.json()) as {
    importId: string
    columnMapping: ColumnMapping
  }

  const [importRecord] = await db
    .select()
    .from(userSoccerImports)
    .where(
      and(
        eq(userSoccerImports.id, importId),
        eq(userSoccerImports.userId, session.user.id)
      )
    )
    .limit(1)

  if (!importRecord) return NextResponse.json({ error: 'Import not found' }, { status: 404 })

  const blobRes = await fetch(importRecord.blobUrl)
  const buffer = await blobRes.arrayBuffer()
  const { headers, rows } = parseWorkbook(buffer)
  const { parsed, skipped } = applyMapping(rows, columnMapping)

  const unmappedTeams: { raw: string; suggestions: string[] }[] = []
  const statsToInsert = []

  for (const row of parsed) {
    const canon = await resolveTeam(row.teamRaw)
    if (!canon) {
      if (!unmappedTeams.find((u) => u.raw === row.teamRaw)) {
        unmappedTeams.push({ raw: row.teamRaw, suggestions: [] })
      }
      continue
    }

    statsToInsert.push({
      userId: session.user.id,
      importId: importRecord.id,
      league: row.league ?? null,
      season: row.season ?? null,
      teamCanon: canon,
      teamRaw: row.teamRaw,
      matchDate: row.matchDate,
      opponent: row.opponent ?? null,
      venue: row.venue ?? null,
      statKey: row.statKey,
      statValue: row.statValue?.toString() ?? null,
      statText: row.statText ?? null,
      sourceRow: row.sourceRow,
    })
  }

  const BATCH = 500
  for (let i = 0; i < statsToInsert.length; i += BATCH) {
    await db.insert(userSoccerStats).values(statsToInsert.slice(i, i + BATCH))
  }

  const fingerprint = computeFingerprint(headers)
  const [existingMapping] = await db
    .select()
    .from(userColumnMappings)
    .where(
      and(
        eq(userColumnMappings.userId, session.user.id),
        eq(userColumnMappings.headerFingerprint, fingerprint)
      )
    )
    .limit(1)

  if (!existingMapping) {
    await db.insert(userColumnMappings).values({
      userId: session.user.id,
      headerFingerprint: fingerprint,
      mapping: columnMapping,
      sampleRow: rows[0] ?? null,
    })
  }

  await db
    .update(userSoccerImports)
    .set({
      status: 'approved',
      rowsParsed: statsToInsert.length,
      rowsSkipped: skipped,
      unmappedTeams: unmappedTeams.length > 0 ? unmappedTeams : null,
    })
    .where(eq(userSoccerImports.id, importId))

  return NextResponse.json({
    rowsParsed: statsToInsert.length,
    rowsSkipped: skipped,
    unmappedTeams,
  })
}
