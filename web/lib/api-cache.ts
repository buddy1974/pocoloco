import { db } from '@/lib/db'
import { apiCache } from '@/lib/db/schema'
import { eq, and, gt } from 'drizzle-orm'

async function getFromCache<T>(key: string, requireFresh: boolean): Promise<T | null> {
  try {
    const [row] = await db
      .select()
      .from(apiCache)
      .where(
        requireFresh
          ? and(eq(apiCache.key, key), gt(apiCache.expiresAt, new Date()))
          : eq(apiCache.key, key),
      )
      .limit(1)
    return row ? (row.data as T) : null
  } catch {
    return null
  }
}

async function writeCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000)
    await db
      .insert(apiCache)
      .values({ key, data, cachedAt: now, expiresAt })
      .onConflictDoUpdate({
        target: [apiCache.key],
        set: { data, cachedAt: now, expiresAt },
      })
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Try cache first → fetch on miss → fallback to stale cache if fetch fails.
 * Guarantees a result is returned even during API outages (stale data).
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T | null>,
  ttlSeconds: number,
): Promise<T | null> {
  // 1. Fresh cache hit
  const fresh = await getFromCache<T>(key, true)
  if (fresh !== null) return fresh

  // 2. Fetch from API
  let data: T | null = null
  try {
    data = await fetcher()
  } catch {}

  if (data !== null) {
    await writeCache(key, data, ttlSeconds)
    return data
  }

  // 3. API failed — return stale cache as fallback
  const stale = await getFromCache<T>(key, false)
  if (stale !== null) {
    console.warn(`[api-cache] serving stale data for key=${key}`)
    return stale
  }

  return null
}
