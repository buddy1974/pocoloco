import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { put } from '@vercel/blob'
import { db } from '@/lib/db'
import { userSoccerImports, userColumnMappings } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { parseWorkbook, computeFingerprint } from '@/lib/parsers/soccerStats'

const ALLOWED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
]
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.some((t) => file.type.includes(t.split('/')[1])) && !file.name.match(/\.(xlsx|csv)$/i)) {
    return NextResponse.json({ error: 'Invalid file type. Upload .xlsx or .csv' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Max 10MB' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const { headers, rows } = parseWorkbook(buffer)
  const fingerprint = computeFingerprint(headers)

  const blob = await put(
    `imports/${session.user.id}/${Date.now()}_${file.name}`,
    Buffer.from(buffer),
    { access: 'private' }
  )

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

  const [importRecord] = await db
    .insert(userSoccerImports)
    .values({
      userId: session.user.id,
      filename: `${Date.now()}_${file.name}`,
      originalFilename: file.name,
      blobUrl: blob.url,
      originalHeaders: headers,
      columnMappingId: existingMapping?.id ?? null,
      status: existingMapping ? 'approved' : 'pending',
    })
    .returning()

  return NextResponse.json({
    importId: importRecord.id,
    headers,
    knownMapping: existingMapping?.mapping ?? null,
    blobUrl: blob.url,
    rowCount: rows.length,
    fingerprint,
  })
}
