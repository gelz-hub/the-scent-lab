// Distributed rate limiter backed by Upstash Redis — works correctly across
// multiple serverless instances/regions (the previous in-process Map bucket
// reset per-instance and per-deploy, so it was effectively non-functional
// on a multi-instance production deployment). See
// src/lib/security/README.md, "Rate limiting".
//
// Falls back to an in-process bucket only when Upstash isn't configured
// (e.g. local dev without the env vars set) so the app still runs without
// requiring cloud credentials for every contributor — production must set
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (provisioned via the
// Vercel Marketplace "Upstash" integration, or directly at upstash.com).
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// One Ratelimit instance per distinct (limit, windowMs) pair, cached — every
// call site here uses a fixed limit/window per action, so this never grows
// unbounded, and Upstash's own SDK recommends reusing instances rather than
// constructing one per request.
const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`
  let limiter = limiters.get(cacheKey)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: 'ratelimit',
    })
    limiters.set(cacheKey, limiter)
  }
  return limiter
}

// ---- In-process fallback (dev-only, no Upstash configured) ----

interface Bucket {
  count: number
  windowStart: number
}

const buckets = new Map<string, Bucket>()

const SWEEP_INTERVAL_MS = 10 * 60 * 1000
let lastSweep = Date.now()
function sweepIfDue() {
  if (Date.now() - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = Date.now()
  for (const [key, bucket] of buckets) {
    if (Date.now() - bucket.windowStart > SWEEP_INTERVAL_MS) buckets.delete(key)
  }
}

function rateLimitInProcess(key: string, limit: number, windowMs: number): RateLimitResult {
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

/**
 * Sliding-window rate limit — `key` should already include whatever scope
 * matters (e.g. `login:${ip}`, `checkout:${userId}`) so different actions
 * never share a bucket. Returns `allowed: false` once `limit` requests have
 * been seen within `windowMs` for that key. Backed by Upstash Redis in any
 * environment where it's configured (shared correctly across instances);
 * falls back to a single-instance in-process bucket otherwise.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (!redis) {
    return rateLimitInProcess(key, limit, windowMs)
  }

  const { success, remaining, reset } = await getLimiter(limit, windowMs).limit(key)
  return {
    allowed: success,
    remaining,
    retryAfterSeconds: success ? 0 : Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
  }
}

/** Best-effort client IP from a Next.js Request — same header-parsing logic already used by requestMetadata() in audit-service.ts, factored out so both can share it. */
export function clientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
