import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify, importX509, decodeProtectedHeader } from 'jose'
import { isAdminRole } from '@/lib/rbac/permissions'

const SESSION_COOKIE_NAME = 'session'

// Google does NOT publish a JWKS for Firebase session cookies — only a
// { kid: pemCertificate } map of X.509 certs (a different signing key than
// ID tokens, which do have a JWKS). So verification here means: fetch that
// cert map, pick the cert matching the cookie's `kid` header, and import it
// as a public key for jose to verify against. Cached for 1 hour (Google's
// own Cache-Control on this endpoint) so most requests don't refetch.
const SESSION_COOKIE_CERTS_URL = 'https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys'

let certsCache: { certs: Record<string, string>; fetchedAt: number } | null = null
const CERTS_TTL_MS = 60 * 60 * 1000

async function getCerts(): Promise<Record<string, string>> {
  if (certsCache && Date.now() - certsCache.fetchedAt < CERTS_TTL_MS) return certsCache.certs
  const res = await fetch(SESSION_COOKIE_CERTS_URL)
  const certs = (await res.json()) as Record<string, string>
  certsCache = { certs, fetchedAt: Date.now() }
  return certs
}

async function readRole(req: NextRequest): Promise<{ authenticated: boolean; role?: string }> {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!sessionCookie) return { authenticated: false }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  try {
    const { kid } = decodeProtectedHeader(sessionCookie)
    const certs = await getCerts()
    const pem = kid ? certs[kid] : undefined
    if (!pem) return { authenticated: false }

    const publicKey = await importX509(pem, 'RS256')
    const { payload } = await jwtVerify(sessionCookie, publicKey, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    })
    return { authenticated: true, role: payload.role as string | undefined }
  } catch {
    return { authenticated: false }
  }
}

// Manual token check because this middleware now covers two independent
// concerns with different scopes: maintenance mode applies site-wide,
// while the "must be signed in" gate only applies to /admin and /account.
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const { authenticated, role } = await readRole(req)

  // Maintenance mode: site-wide read-only banner page for everyone except
  // admin-role staff (who need to keep working) and the health check (so
  // uptime monitors don't report a false outage during planned maintenance).
  // Toggled by env var only — no DB/admin-UI dependency, so it still works
  // if the database itself is what's down.
  const maintenanceOn = process.env.MAINTENANCE_MODE === 'true'
  // API routes are left alone even in maintenance mode — rewriting them to
  // an HTML page would break any in-flight client fetch/webhook delivery
  // (e.g. the payment provider's callback) rather than gracefully degrading.
  if (maintenanceOn && pathname !== '/maintenance' && !pathname.startsWith('/api') && !isAdminRole(role ?? '')) {
    return NextResponse.rewrite(new URL('/maintenance', req.url))
  }

  // This only gates entry to the /admin and /account areas at all — which
  // module a role can actually use inside /admin is enforced per-page/per-API
  // by requirePermission() (see src/lib/rbac/require-permission.ts). Never
  // rely on this redirect alone for anything sensitive.
  if (pathname.startsWith('/admin') && !isAdminRole(role ?? '')) {
    return NextResponse.redirect(new URL('/login?callbackUrl=' + pathname, req.url))
  }
  if (pathname.startsWith('/account') && !authenticated) {
    return NextResponse.redirect(new URL('/login?callbackUrl=' + pathname, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
