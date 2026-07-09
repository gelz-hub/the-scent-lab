# Security & Production Hardening (Part 11)

Scope: harden the existing platform, not add features. Nothing in Parts
1–9's business logic changed — this module and the edits it references are
additive.

## Security headers & CSP

`next.config.ts`'s `headers()` sends a Content-Security-Policy plus
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, and (production-only) `Strict-Transport-Security` on
every route. The CSP is environment-conditional: dev allows `'unsafe-eval'`
for Turbopack HMR, production does not.

**Known trade-off, not silently glossed over:** `script-src` still allows
`'unsafe-inline'` in both environments. There's no nonce-per-request
infrastructure in this app (no middleware injecting a CSP nonce into
rendered `<script>` tags), so removing `'unsafe-inline'` would break
Next.js's own inline hydration scripts and Google Analytics. Tightening
this to nonce-based CSP is the natural next step, not attempted here since
it touches request-scoped rendering wiring, not just config.

## Session & cookies

`src/lib/auth.ts`: JWT session, 7-day `maxAge`, 24h `updateAge`. Session
cookie is `httpOnly`, `sameSite: 'lax'`, and `secure` (with the
`__Secure-` name prefix) in production only — a plain-HTTP local dev server
can't set a `Secure` cookie.

**JWT role-caching gotcha** (discovered in Part 8, still applies): a role
change in the DB doesn't take effect until the user's token refreshes
(re-login or `updateAge` rollover). This is standard JWT-strategy behavior,
not a bug.

## Rate limiting

`rate-limit.ts` is an in-process, single-instance sliding-window limiter
(`Map<key, {count, windowStart}>`), the same "documented interim
implementation, swap later" pattern as `src/lib/analytics/cache.ts`. It is
**not safe across multiple server instances** — each instance has its own
counters. Swapping to Redis/Upstash means reimplementing `rateLimit()`'s
body only; every call site (`rateLimit(key, limit, windowMs)`) stays the
same.

Applied to:
| Endpoint | Limit | Key |
|---|---|---|
| Login (`auth.ts` `authorize()`) | 10 / 5 min | IP + email |
| Register (`/api/register`) | 5 / hour | IP |
| Change password (`/api/account/change-password`) | 5 / 15 min | account + IP |
| Order creation (`/api/orders` POST) | 20 / 10 min | account + IP |
| ABA PayWay webhook (`/api/payments/webhook/aba-payway`) | 120 / min | IP |

## Password validation

`password.ts`'s `passwordSchema` (8–100 chars, at least one letter and one
digit) is the single source of truth, used by both `/api/register` and
`/api/account/change-password` so the rule can never drift between the two.

## File upload validation

Both upload routes (`/api/upload` — staff product images;
`/api/account/avatar` — customer avatars) already enforced an 8MB max and an
allow-list on the client-supplied `File.type`. Part 11 adds
`image-sniff.ts`'s `sniffImageType()`, which reads the actual magic bytes
(JPEG/PNG/WebP/AVIF signatures) before the buffer is handed to Cloudinary —
`File.type` and filename extensions are just labels the uploader chose and
are trivial to spoof.

## Logging

`src/lib/logging/logger.ts` is the general-purpose structured logger for
everything that isn't payment- or inventory-specific (those keep their own
domain loggers: `src/lib/payment/monitoring.ts`,
`src/lib/inventory/monitoring.ts` — same pattern, kept separate because
they're already established and heavily called). All three are the
designated place a real backend (Sentry/Datadog/CloudWatch) plugs in later.

**Hard rule, enforced by convention (not by a runtime filter — every call
site must honor it manually):** never log passwords, tokens,
session/JWT contents, card numbers, or other payment secrets. Log
identifiers (`userId`, `orderId`, `email`) and error messages, not raw
request bodies or credentials.

## Health monitoring

`GET /api/health` — public, read-only, never returns secret values (only
`ok` / `error` / `not_configured` per dependency). Checks: MySQL
(`SELECT 1`, hard dependency — drives overall 200/503), Cloudinary env
presence, Firebase Admin env presence, Geoapify env presence, ABA PayWay
env presence for whichever environment `getPaymentEnvironment()` resolves
to. Point an uptime monitor / load balancer health check at this.

## Error pages & maintenance mode

- `src/app/not-found.tsx` — 404 (pre-existing).
- `src/app/error.tsx` — segment-level 500 boundary; shows a generic message
  only, never the thrown error's own message/stack.
- `src/app/global-error.tsx` — catches a crash in the root layout itself
  (which `error.tsx` cannot, since it renders inside the layout); must
  define its own `<html>/<body>` and stays dependency-free so it can't
  itself fail to render.
- **Maintenance mode**: set `MAINTENANCE_MODE=true` in the environment.
  `src/middleware.ts` rewrites every page request (except `/maintenance`
  itself, admin-role staff, and `/api/*`) to `src/app/maintenance/page.tsx`.
  API routes are deliberately excluded from the rewrite — turning them into
  an HTML page mid-response would break in-flight client fetches and the
  ABA PayWay webhook rather than degrading gracefully. Toggled by env var
  only, with no DB dependency, so it still works if the database itself is
  what's down.

  Note: widening `middleware.ts`'s matcher to cover the whole site (needed
  so maintenance mode can intercept any page) meant moving off `withAuth`'s
  wrapper, which requires a session token for every matched path with no way
  to mark some as public. The rewritten middleware calls `getToken()`
  manually and only redirects to `/login` for `/admin` and `/account` —
  behavior for those two paths is unchanged from before.

## SEO

`src/app/robots.ts` and `src/app/sitemap.ts` (replacing a static
`public/robots.txt` that allowed everything, including `/admin` and
`/account`). Sitemap includes static storefront routes plus every
`ACTIVE`/`PUBLIC` product by slug. Root layout metadata gained
`metadataBase`, a canonical URL, and OG/Twitter image references
(`/icon-512.png` — no dedicated OG-card asset exists yet, so the app icon is
reused rather than inventing a placeholder).

## Not covered in this pass

- CSP nonce-based script hardening (see trade-off above).
- Redis/Upstash-backed rate limiting and caching (documented single-instance
  interim implementation only — required before running more than one
  server instance).
- Scheduled report delivery, PDF export (already flagged as future work in
  Part 9).
- ABA PayWay webhook signature verification — ABA signs callbacks, but the
  exact payload/signing scheme hasn't been confirmed against a live sandbox
  callback yet (see the `TODO` in
  `src/app/api/payments/webhook/aba-payway/route.ts`).
