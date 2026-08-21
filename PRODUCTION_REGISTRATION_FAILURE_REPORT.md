# Production Registration Failure — Technical Report

**Stack:** Next.js (App Router, Turbopack, `output: "standalone"`) · Vercel · Prisma · Supabase PostgreSQL (migrated from Railway MySQL) · Firebase Authentication · `firebase-admin@14.1.0`

**Status:** Root cause identified with direct evidence (real, untruncated Vercel log). Fix committed and pushed. One unverified step remains: Vercel dashboard Node.js Version setting.

---

## 1. Architecture Overview

- **Client auth**: `src/lib/firebase/client.ts` — browser `firebase/auth` SDK, `signInWithEmailAndPassword`, then `POST /api/auth/session` to exchange the ID token for an httpOnly session cookie.
- **Server auth**: `src/lib/firebase/admin-auth.ts` (Auth) and `src/lib/firebase/admin.ts` (Messaging) — wrap the `firebase-admin` SDK. `src/lib/auth/session.ts`'s `getAuthSession()` uses `admin-auth.ts` to verify session cookies for API routes/Server Components.
- **Edge gate**: `src/middleware.ts` — independent `jose`-based JWT check, used only for `/admin` and `/account` page redirects and site-wide maintenance mode. Confirmed (traced, not inferred) that it cannot intercept or block `/api/register`.
- **Database**: Prisma Client → Supabase PostgreSQL via connection pooler.
- **Registration** (`src/app/api/register/route.ts`): rate limit → validate → check existing Prisma `User` → create Prisma `User` row → `getAdminAuth()` → `auth.createUser()` → `auth.setCustomUserClaims()` → success, or roll back the Prisma row and return a generic `400` on any failure.

---

## 2. Current Deployment Status

- `/api/register` returns `400 { "error": "Could not create account." }` in production.
- Root cause (an `ERR_REQUIRE_ESM` module-load crash, not a logic bug) was fixed in code and pushed as commit `87a6466`.
- **Unconfirmed**: whether Vercel's Project Settings → General → Node.js Version is actually set to `22.x`. This is required in addition to the code fix and has not yet been verified or changed (no Vercel dashboard/CLI access available to verify this directly).
- Likely affects other flows sharing the same `getAdminAuth()` path — login/session exchange, forgot-password, change-password, staff account creation — none of these have been individually re-tested yet.

---

## 3. Database Migration Details (Railway → Supabase)

- `prisma/schema.prisma` datasource `provider` changed `mysql` → `postgresql`; added `directUrl`.
- Connection strings (Supabase pooler, `aws-0-ap-northeast-1.pooler.supabase.com`):
  - `DATABASE_URL` — port `6543`, transaction-mode pgbouncer, `?pgbouncer=true` (used by the app at runtime)
  - `DIRECT_URL` — port `5432`, session-mode pooler (used only for `prisma db push`/migrations)
- Migration approach: fresh schema push to an empty Supabase database (no data migrated from the old Railway MySQL instance — a deliberate choice, not a data-loss incident). Reseeded base users/coupons via the existing seed script.
- Verified independently and separately from the current bug: `/api/health`'s `$queryRaw SELECT 1` succeeds in production, and a local reproduction completed multiple full registration flows (Prisma insert + Firebase user creation) successfully against the same live Supabase database. **The database is not implicated in the current failure.**

---

## 4. Firebase Admin Configuration

`src/lib/firebase/admin-auth.ts`:
```ts
export const isFirebaseAdminConfigured = Boolean(
  process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
)

async function getFirebaseAdminApp(): Promise<App | null> {
  if (!isFirebaseAdminConfigured) return null
  if (app) return app

  const { initializeApp, getApps, cert } = await import('firebase-admin/app')
  if (getApps().length) { app = getApps()[0]; return app }

  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
  return app
}

export async function getAdminAuth() {
  const adminApp = await getFirebaseAdminApp()
  if (!adminApp) throw new Error('Firebase Admin is not configured')
  const { getAuth } = await import('firebase-admin/auth')   // ← fails here in production
  return getAuth(adminApp)
}
```
- Every `firebase-admin/*` import is dynamic (`await import(...)`), not static — this was fix attempt #2 (see §6).
- Local diagnostic confirmed: `FIREBASE_ADMIN_PROJECT_ID`, `CLIENT_EMAIL`, and `PRIVATE_KEY` are all present, `privateKeyLength: 1704` locally. Production key format not yet independently re-verified (moot until the ESM crash below is resolved, since code never reaches key usage).

---

## 5. Exact Production Errors

**Wrapped form (as logged by the app):**
```
[REGISTER_ERROR] {
  name: 'Error',
  code: undefined,
  message: 'Failed to load external module firebase-admin-.../auth'
}
```

**Root, unwrapped error (obtained via chunked diagnostic logging to defeat Vercel log truncation):**
```
Error [ERR_REQUIRE_ESM]:
require() of ES Module
node_modules/jose/dist/webapi/index.js
from node_modules/jwks-rsa/src/utils.js
```

**Full module chain (source-verified):**
```
src/app/api/register/route.ts
  → getAdminAuth()                          [admin-auth.ts:45-50]
    → await import('firebase-admin/auth')    [admin-auth.ts:48]
      → Turbopack externalImport("firebase-admin-<hash>/auth")
        → firebase-admin/lib/auth/index.js → token-verifier.js:26 → require("../utils/jwt")
          → utils/jwt.js:24 → require("jwks-rsa")
            → jwks-rsa/src/utils.js:1 → require("jose")
              → jose@6.2.3 (pure ESM, no CJS export condition) → ERR_REQUIRE_ESM
```

---

## 6. Changes Already Attempted

| # | Change | Result |
|---|---|---|
| 1 | Added `serverExternalPackages: ["firebase-admin"]` to `next.config.ts` | Verified working locally; **still failed in production**, same error |
| 2 | Converted every `firebase-admin/*` import from static to dynamic `await import(...)` in `admin-auth.ts`/`admin.ts`; updated 9 call sites for the new async signature | **Fixed the original ERR_REQUIRE_ESM on `firebase-admin/auth` itself** — confirmed by user. Uncovered the current, different-shaped failure |
| 3 | Added step-by-step diagnostic logging + structured error logging in `register/route.ts` | Pinpointed the failure to `getAdminAuth()` specifically (not `auth.createUser()`) |
| 4 | Traced `src/middleware.ts` fully | Ruled out — cannot intercept `/api/register` under any code path |
| 5 | Read Turbopack's actual build output (`[externals]_firebase-admin_auth_*.js`, `[turbopack]_runtime.js`) | Found the exact line constructing `"Failed to load external module..."`; confirmed no `error.cause` is ever set |
| 6 | Tested removing `serverExternalPackages` entirely | No effect — Turbopack externalizes `firebase-admin` by its own default policy regardless |
| 7 | Added chunked/indexed error logging (`logFullError()`) to defeat suspected log-line truncation | Successfully extracted the real, previously-hidden `ERR_REQUIRE_ESM: require() of ES Module .../jose ... from .../jwks-rsa` error |
| 8 | Added `"engines": { "node": ">=22.12.0" }` to `package.json` | Committed (`87a6466`), pushed. **Not yet confirmed effective** — depends on Vercel dashboard Node.js Version setting, unverified |

---

## 7. Relevant Code Snippets

**`jwks-rsa/src/utils.js:1`** (installed dependency, not app code — this is the actual failing `require()`):
```js
const jose = require('jose');
```

**`jose@6.2.3` `package.json`** — confirms no CJS support:
```json
{
  "type": "module",
  "exports": {
    ".": { "types": "./dist/types/index.d.ts", "default": "./dist/webapi/index.js" }
  }
}
```
(No `"require"` condition. Compare `jose@5.9.6`, which has `"main": "./dist/node/cjs/index.js"`.)

**`firebase-admin@14.1.0` `package.json`** (relevant fields):
```json
{ "dependencies": { "jwks-rsa": "^4.0.1" }, "engines": { "node": ">=22" } }
```

**`jwks-rsa@4.1.0` `package.json`** (relevant fields):
```json
{ "dependencies": { "jose": "^6.1.3" }, "engines": { "node": "^20.19.0 || ^22.12.0 || >=23.0.0" } }
```

**Turbopack's error-wrapping code** (`.next/server/chunks/[turbopack]_runtime.js:598-607`):
```js
async function externalImport(id) {
    let raw;
    try {
        raw = await import(id);
    } catch (err) {
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    ...
}
```

**Reproduction with zero bundler involved** (proves this is a Node.js version issue, not a Turbopack/Vercel-specific bug):
```
$ node -v
v24.19.0
$ node -e "require('jwks-rsa')"
(succeeds silently — Node 24 natively supports require() of a synchronous ESM graph)
```

**Fix applied** (`package.json`):
```json
{
  "engines": { "node": ">=22.12.0" }
}
```

---

## 8. Current Hypotheses

**Primary (high confidence, directly evidenced):** Vercel's deployed serverless function runs a Node.js version outside the range `^20.19.0 || ^22.12.0 || >=23.0.0` that `jwks-rsa@4.1.0` requires to natively `require()` the pure-ESM `jose@6.2.3` — a transitive dependency loaded unconditionally the moment `firebase-admin/auth` is imported (via `token-verifier.js`, regardless of which Auth method is actually called). The project had no `engines` field prior to this fix, giving Vercel no signal to pick a compatible runtime. Local Node v24.19.0 is within the supported range, which is why every local reproduction succeeded while production consistently failed with the exact matching `ERR_REQUIRE_ESM` error.

**Secondary / contingent:** Adding `engines.node` to `package.json` may not be sufficient on its own — Vercel's Project Settings → General → Node.js Version dashboard dropdown is generally the authoritative setting and needs to independently be set to `22.x`, then the project redeployed. This has not yet been done or verified.

**Not yet tested, likely true:** every other server-side flow that calls `getAdminAuth()` (login/session exchange via `/api/auth/session`, `/api/forgot-password`, `/api/account/change-password`, staff account creation in `src/lib/rbac/staff-service.ts`) shares this exact failure mode and is very likely broken in production the same way — only `/api/register` has been actively debugged and confirmed.

**Ruled out during investigation** (kept here for completeness, not currently live hypotheses): Prisma/Supabase PgBouncer prepared-statement conflicts; stale/incorrect Vercel deployment; `auth.createUser()` itself throwing (proven by absence of the dedicated `[FIREBASE_CREATE_USER_ERROR]` log); `src/middleware.ts` gating the route.
