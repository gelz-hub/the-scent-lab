// A minimal in-process TTL cache for analytics queries — see
// src/lib/analytics/README.md, "Caching strategy" for why this is an
// interim implementation (single-instance only) and how to swap it for a
// shared cache (Redis / Vercel KV) without touching any call site.

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 60_000 // 1 minute — analytics data doesn't need to be second-fresh

export async function cached<T>(key: string, fn: () => Promise<T>, ttlMs: number = DEFAULT_TTL_MS): Promise<T> {
  const hit = store.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T
  }

  const value = await fn()
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  return value
}

/** Invalidate one key or (if omitted) the whole cache — not currently called anywhere since nothing writes analytics data, but available for a future "refresh now" admin action. */
export function invalidateCache(key?: string) {
  if (key) store.delete(key)
  else store.clear()
}
