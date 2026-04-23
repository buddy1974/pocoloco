import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { updateOpportunityVerdict } from '@/lib/queries/opportunities'
import { z } from 'zod'

const VerdictSchema = z.object({
  userVerdict: z.enum(['accepted', 'rejected', 'modified']),
  userPick: z.string().optional(),
  userOdds: z.number().optional(),
  userStake: z.number().optional(),
  userNotes: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = VerdictSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  await updateOpportunityVerdict(id, session.user.id, body.data)
  return NextResponse.json({ ok: true })
}
