import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const ALLOWED_ROLES = ['owner', 'design_partner']
const ALLOWED_ROUTINES = [
  'ingest-fixtures',
  'build-intel',
  'publish-value-1x2',
  'grade-results',
  'weekly-calibration',
]

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ routine: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { routine } = await params
  if (!ALLOWED_ROUTINES.includes(routine)) {
    return NextResponse.json({ error: 'Unknown routine' }, { status: 400 })
  }

  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_DISPATCH_TOKEN
  if (!repo || !token) {
    return NextResponse.json({ error: 'GitHub dispatch not configured' }, { status: 503 })
  }

  const workflowFile = `${routine}.yml`
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'GitHub dispatch failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, routine })
}
