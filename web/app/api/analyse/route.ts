import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { checkTier } from '@/lib/subscription'
import { fetchFixtures, fetchOdds, fetchInjuries, fetchH2H, fetchTeamForm, LEAGUES } from '@/lib/apifootball'
import { gradeFixture, getAIReasoning } from '@/lib/intelligence'
import { openai } from '@/lib/openai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!checkTier(session.user, 'showReasoning')) {
    return NextResponse.json(
      { error: 'AI analysis requires Basic plan or higher' },
      { status: 403 },
    )
  }

  const { query, image } = await req.json() as { query?: string; image?: string }
  const today = new Date().toISOString().split('T')[0]

  // Try to find a matching fixture and run full graded analysis
  if (query && !image) {
    try {
      const allFixtures = await Promise.all(
        Object.values(LEAGUES).map(l => fetchFixtures(today, l.id))
      ).then(r => r.flat().filter(Boolean))

      const terms = query.toLowerCase().split(/\s+/)
      const matchedFixture: any = allFixtures.find((f: any) => {
        const home = f.teams?.home?.name?.toLowerCase() ?? ''
        const away = f.teams?.away?.name?.toLowerCase() ?? ''
        return terms.some((t: string) => t.length > 2 && (home.includes(t) || away.includes(t)))
      })

      if (matchedFixture) {
        const league = Object.values(LEAGUES).find(l =>
          String(l.id) === String(matchedFixture.league?.id)
        )
        const [odds, injuries, h2h, homeForm, awayForm] = await Promise.all([
          fetchOdds(matchedFixture.fixture.id),
          fetchInjuries(matchedFixture.fixture.id),
          fetchH2H(matchedFixture.teams.home.id, matchedFixture.teams.away.id),
          fetchTeamForm(matchedFixture.teams.home.id, matchedFixture.league?.id ?? 39),
          fetchTeamForm(matchedFixture.teams.away.id, matchedFixture.league?.id ?? 39),
        ])

        const intel = gradeFixture(
          matchedFixture, odds, injuries ?? [], h2h ?? [],
          homeForm ?? [], awayForm ?? [],
          league?.name ?? matchedFixture.league?.name ?? 'Unknown',
          league?.flag ?? '⚽',
        )

        // Enhance reasoning with AI bullets (all Basic+ users)
        const aiReasons = await getAIReasoning(
          intel.homeTeam, intel.awayTeam,
          intel.homeForm, intel.awayForm,
          intel.h2hRecord, intel.injuredPlayers,
          intel.pick, intel.edge,
          intel.homeOdds, intel.drawOdds, intel.awayOdds,
        )

        return NextResponse.json({
          match: `${intel.homeTeam} vs ${intel.awayTeam}`,
          pick: intel.pick,
          odds: intel.pick === 'HOME' ? intel.homeOdds
              : intel.pick === 'AWAY' ? intel.awayOdds
              : intel.drawOdds,
          confidence: intel.confidence,
          reasoning: aiReasons.length > 0 ? aiReasons : intel.reasoning,
          warnings: intel.warnings,
          edge: intel.edge,
          homeForm: intel.homeForm,
          awayForm: intel.awayForm,
          h2hRecord: intel.h2hRecord,
        })
      }
    } catch (e: any) {
      console.error('[analyse] fixture lookup failed:', e.message)
    }
  }

  // Fallback: direct GPT call (no fixture match, or image analysis)
  const systemPrompt = 'You are a sharp soccer betting analyst. Analyse matches with data-driven reasoning. Return JSON only.'
  const userPrompt = `Analyse this match for betting intelligence.
User query: ${query || 'Analyse this match'}
Today: ${today}

Return JSON only:
{
  "match": "Team A vs Team B",
  "pick": "HOME",
  "odds": null,
  "confidence": "MEDIUM",
  "reasoning": ["reason 1", "reason 2", "reason 3"],
  "warnings": []
}`

  try {
    let result: any

    if (image) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 600,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: image, detail: 'low' } },
              { type: 'text', text: `Analyse this betting screenshot. ${userPrompt}` },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      })
      result = JSON.parse(response.choices[0]?.message?.content ?? '{}')
    } else {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      })
      result = JSON.parse(response.choices[0]?.message?.content ?? '{}')
    }

    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[analyse]', e.message)
    return NextResponse.json({
      match: query ?? 'Unknown',
      pick: 'PASS',
      confidence: 'PASS',
      reasoning: ['Could not analyse — try a more specific match name'],
      warnings: [],
    })
  }
}
