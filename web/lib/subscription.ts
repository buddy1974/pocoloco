import { getSession } from '@/lib/session'
import type { DbUser } from '@/lib/session'

export const TIER_FEATURES = {
  free: {
    maxFixtures: 3,
    showReasoning: false,
    showStrategies: false,
    telegramAlerts: false,
    customLeagues: false,
  },
  basic: {
    maxFixtures: 10,
    showReasoning: true,
    showStrategies: false,
    telegramAlerts: false,
    customLeagues: false,
  },
  pro: {
    maxFixtures: 999,
    showReasoning: true,
    showStrategies: true,
    telegramAlerts: true,
    customLeagues: false,
  },
  elite: {
    maxFixtures: 999,
    showReasoning: true,
    showStrategies: true,
    telegramAlerts: true,
    customLeagues: true,
  },
} as const

export type Tier = keyof typeof TIER_FEATURES

// ── Sync helpers (take DbUser, no async, no DB call) ────────────────────────

export function getTier(user: DbUser | null | undefined): Tier {
  if (!user) return 'free'
  const t = user.subscriptionTier
  return (t in TIER_FEATURES ? t : 'free') as Tier
}

export function checkTier(
  user: DbUser | null | undefined,
  feature: keyof typeof TIER_FEATURES.free,
): boolean {
  return !!TIER_FEATURES[getTier(user)][feature]
}

export function getMaxFixtures(user: DbUser | null | undefined): number {
  return TIER_FEATURES[getTier(user)].maxFixtures
}

// ── Async helpers (call getSession internally) ───────────────────────────────

export async function getUserTier(): Promise<Tier> {
  const session = await getSession()
  return getTier(session?.user)
}

// ── Display helpers ──────────────────────────────────────────────────────────

export function canAccess(
  tier: Tier,
  feature: keyof typeof TIER_FEATURES.free,
): boolean {
  return !!TIER_FEATURES[tier][feature]
}

export function tierLabel(tier: Tier): string {
  return { free: 'Free', basic: 'Basic', pro: 'Pro', elite: 'Elite' }[tier]
}
