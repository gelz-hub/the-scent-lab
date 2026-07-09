// A minimal in-process sliding-window rate limiter — same "interim,
// single-instance, swap-later" pattern already used for the analytics
// cache (src/lib/analytics/cache.ts). See src/lib/security/README.md,
// "Rate limiting" for why this is deliberately not Redis-backed yet and
// how to swap it (e.g. @upstash/ratelimit) without touching call sites.

interface Bucket {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

// Periodic sweep so the Map doesn't grow unbounded across a long-lived
// process — buckets older than 10 minutes are stale by construction (no
// rate limit window in this app is anywhere near that long).
const SWEEP_INTERVAL_MS = 10 * 60 * 1000
let lastSweep = Date.now()
function sweepIfDue() {
  if (Date.now() - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = Date.now()
  for (const [key, bucket] of buckets) {
    if (Date.now() - bucket.windowStart > SWEEP_INTERVAL_MS) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Fixed-window rate limit — `key` should already include whatever scope
 * matters (e.g. `login:${ip}`, `checkout:${userId}`) so different actions
 * never share a bucket. Returns `allowed: false` once `limit` requests have
 * been seen within `windowMs` for that key.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweepIfDue()

  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || now - existing.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.windowStart + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  existing.count += 1
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

/** Best-effort client IP from a Next.js Request — same header-parsing logic already used by requestMetadata() in audit-service.ts, factored out so both can share it. */
export function clientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
