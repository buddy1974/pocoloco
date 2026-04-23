export function isQuietHours(
  quietStart: string | null,
  quietEnd: string | null,
  timezone: string,
): boolean {
  if (!quietStart || !quietEnd) return false
  try {
    const localStr = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
    })
    const [h, m] = localStr.replace(/\s/g, '').split(':').map(Number)
    const current = h * 60 + m
    const [sh, sm] = quietStart.split(':').map(Number)
    const [eh, em] = quietEnd.split(':').map(Number)
    const start = sh * 60 + sm
    const end = eh * 60 + em
    // Handle overnight ranges (e.g., 22:00 → 08:00)
    return start > end ? (current >= start || current < end) : (current >= start && current < end)
  } catch {
    return false
  }
}

export async function sendTip(
  chatId: string,
  intel: {
    homeTeam: string
    awayTeam: string
    league: string
    pick: string
    odds: number
    confidence: string
    edge: number
    reasoning: string[]
    kickoff: string
  },
) {
  const time = new Date(intel.kickoff).toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin',
  })

  const emoji = { HIGH: '🟢', MEDIUM: '🟡', LOW: '🟠', PASS: '⛔' }[intel.confidence] ?? '⚽'

  const message = `
${emoji} *POCO LOCO TIP*
━━━━━━━━━━━━━━
🏆 ${intel.league}
⚽ ${intel.homeTeam} vs ${intel.awayTeam}
🕐 ${time}

📌 *Pick: ${intel.pick}*
💰 Odds: ${intel.odds}
📊 Edge: +${(intel.edge * 100).toFixed(1)}%
🎯 Confidence: ${intel.confidence}

💡 *Analysis:*
${intel.reasoning.slice(0, 3).map(r => `• ${r}`).join('\n')}

⚠️ _Predictions only. Not financial advice. 18+_
_poco loco · pocoloco-ten.vercel.app_
`.trim()

  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
    },
  )
  return res.ok
}

export async function sendMessage(chatId: string, text: string) {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    },
  )
  return res.ok
}
