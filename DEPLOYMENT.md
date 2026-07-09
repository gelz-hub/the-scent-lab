# Deployment, Backup & Production Checklist

Part 11 production-hardening documentation. Covers env vars, migration,
third-party service setup, backup/recovery strategy, and the go-live
checklist. See `src/lib/security/README.md` for the security measures
themselves (headers, rate limiting, logging, etc.).

## Environment variables

| Variable | Purpose | Notes |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | Prisma. Use a connection-pooled URL in production (PlanetScale/RDS Proxy/pgBouncer-equivalent). |
| `NEXTAUTH_SECRET` | JWT/session signing key | Generate with `openssl rand -base64 32`. Rotating it invalidates every active session. |
| `NEXTAUTH_URL` | Canonical app URL for NextAuth callbacks | Must match the production domain exactly (scheme + host). |
| `NEXT_PUBLIC_APP_URL` | Public base URL | Used by `sitemap.ts`, `robots.ts`, OG metadata, and the webhook's return-URL construction. |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Image storage | Product images + avatars. `/api/health` reports presence only. |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase client config | Push notification subscribe flow. |
| `FIREBASE_ADMIN_PROJECT_ID` / `_CLIENT_EMAIL` / `_PRIVATE_KEY` | Firebase Admin (server-side push send) | Private key is stored with literal `\n` sequences in `.env`; `src/lib/firebase/admin.ts` converts them back. Never commit the real key. |
| `PAYMENT_ENVIRONMENT` | `sandbox` or `production` | Selects which `PAYWAY_*` credential set loads. |
| `PAYWAY_SANDBOX_*` / `PAYWAY_PRODUCTION_*` | ABA PayWay merchant credentials | Never share sandbox and production merchant IDs — the provider rejects/mismatches otherwise. |
| `PAYMENT_TIMEOUT_MINUTES`, `PAYMENT_RETRY_LIMIT`, `WEBHOOK_RETRY_WINDOW_MINUTES`, `PAYMENT_POLL_INTERVAL_MS`, `PAYMENT_EXPIRATION_SWEEP_INTERVAL_MINUTES` | Payment orchestration tuning | See `src/lib/payment/README.md`. |
| `CRON_SECRET` | Shared secret for scheduled sweep endpoints | Required header/query param on any cron-triggered route. |
| `KHQRAPI_SECRET_KEY` | Alternate KHQR provider | Only needed if that provider is enabled. |
| `GEOAPIFY_API_KEY` | Address geocoding/autocomplete | Degrades gracefully (logged failure, no geocoding) if unset. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Transactional email | Not yet wired into a send path in this codebase — reserved. |
| `MAINTENANCE_MODE` | `true`/`false` | New in Part 11. See `src/lib/security/README.md`, "Maintenance mode". |
| `NODE_ENV` | `production` in prod | Gates CSP `unsafe-eval`, HSTS header, and secure cookie flag — set by the hosting platform, not manually. |

Never commit `.env` — verify it's git-ignored before every push. Rotate
`NEXTAUTH_SECRET`, all `PAYWAY_*` keys, and `CLOUDINARY_API_SECRET`
immediately if they're ever exposed (logs, a public repo, a shared
screenshot).

## Database migration

```bash
npx prisma migrate deploy   # applies pending migrations, production-safe (no prompts, no shadow DB)
npx prisma generate         # regenerate the client after schema changes
```

`migrate deploy`, not `migrate dev` — `dev` can prompt to reset the database
on drift, which must never run against production data. Take a DB backup
(see below) immediately before any migration that touches an existing
table's columns.

## Third-party service setup checklist

- **Cloudinary**: create the account/cloud, note cloud name + API
  key/secret. No folder pre-creation needed — `the-scent-lab/products` and
  `the-scent-lab/avatars` are created on first upload.
- **Firebase**: create a project, enable Cloud Messaging, generate a Web
  Push certificate (VAPID key) for the client config, and a service account
  key (Admin SDK) for server-side push sends. Register the production
  domain in Firebase Auth's authorized domains if auth is ever extended to
  use it.
- **ABA PayWay**: obtain sandbox credentials first, confirm a real callback
  against `/api/payments/webhook/aba-payway` in sandbox before requesting
  production credentials. Confirm the callback URL is registered with ABA
  and reachable (HTTPS, not behind auth).
- **Geoapify**: create an API key, confirm the request quota covers expected
  checkout address-autocomplete volume.
- **Domain & HTTPS**: DNS pointed at the hosting platform, TLS certificate
  provisioned (most platforms — Vercel, Render, etc. — automate this).
  `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` must both be the final `https://`
  domain before going live — a mismatch breaks OAuth-style callback
  validation and produces wrong canonical/OG URLs.

## Backup & recovery strategy

| Asset | Backup method | Recovery |
|---|---|---|
| MySQL database | Provider-managed automated snapshots (e.g. daily + point-in-time binlog on RDS/PlanetScale) — this app does not run its own backup job | Restore snapshot to a new instance, verify row counts on `Order`/`Payment`/`AuditLog`, repoint `DATABASE_URL`, run `prisma migrate deploy` if the restored snapshot predates a later migration |
| Cloudinary assets | Cloudinary retains all uploaded originals indefinitely by default; no separate export needed unless the account itself is being migrated | Cloudinary's own asset export/migration tooling if changing accounts |
| Environment config (`.env`) | Store the production `.env` in the hosting platform's secret manager, not in git; keep an encrypted copy (e.g. a password manager vault) as the recovery source of truth | Re-populate the platform's env var UI from the vault copy |
| Application code | Git is the backup — every deployed commit is recoverable by SHA | `git checkout <sha>` + redeploy |

**What's explicitly NOT automated by this codebase**: there is no
in-app scheduled DB dump job. Backups are the hosting/DB provider's
responsibility — document which provider and confirm its retention window
(recommend >= 7 days point-in-time, 30-day daily snapshots) before go-live.

## Load testing notes

Manual concurrency testing performed during this hardening pass (ad hoc
scripts against the live dev DB, not committed):
- **Inventory reservation**: fired 20 concurrent `reserveStock`-equivalent
  transactions (same `SELECT ... FOR UPDATE` locking pattern as
  `InventoryService.reserveStock`) against a variant seeded with exactly 10
  units of stock. Result: **exactly 10 succeeded, 10 correctly rejected with
  "insufficient stock," final `reservedStock` == 10** — no oversell, no lost
  update, confirming the Part 6 row-lock still holds under real concurrency.
- **Registration rate limit**: fired 7 concurrent `POST /api/register`
  requests against the 5-per-hour limiter. Result: **exactly 5 succeeded
  (201), 2 correctly rejected (429)** — verified both via HTTP response codes
  and by counting rows actually created in the `User` table.
- **Payment verification idempotency**: not re-tested live in this pass —
  relies on `verifyAndAdvanceOrder`'s already-PAID short-circuit, which is
  existing, unchanged Part 5/6 logic (see `src/lib/payment/README.md`).
- Full multi-step checkout-to-invoice concurrency (real HTTP requests through
  auth + cart + payment + shipment + invoice, not just the inventory layer)
  was not run in this pass — the inventory-layer test above exercises the
  actual bottleneck (the row lock), but a full end-to-end run is recommended
  before a real launch.

Recommend a proper load-testing pass (k6/Artillery) against a staging
environment before the first real traffic spike (e.g. a promotional
campaign) — the manual testing here covers correctness under concurrency,
not throughput/latency at scale.

Recommend a proper load-testing pass (k6/Artillery) against a staging
environment before the first real traffic spike (e.g. a promotional
campaign) — the manual testing here covers correctness under concurrency,
not throughput/latency at scale.

## Production checklist

- [ ] All env vars above set in the hosting platform (not `.env` in the
      deployed bundle)
- [ ] `NODE_ENV=production`
- [ ] `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` match the final domain exactly
- [ ] `PAYMENT_ENVIRONMENT=production` and `PAYWAY_PRODUCTION_*` credentials
      verified against a real (small) transaction before public launch
- [ ] `npx prisma migrate deploy` run against production DB
- [ ] `GET /api/health` returns `200 {"status":"ok"}` post-deploy
- [ ] DB provider's automated backup/retention confirmed and documented
- [ ] HTTPS/TLS certificate active, HTTP redirects to HTTPS
- [ ] `robots.txt` / `sitemap.xml` reachable and reference the production
      domain
- [ ] Smoke test: register, login, browse, add to cart, checkout (COD and a
      real ABA sandbox/production payment), verify order + invoice +
      shipment created, verify admin dashboard loads and RBAC blocks a
      non-admin role
- [ ] `MAINTENANCE_MODE` unset (or `false`) before opening to traffic
