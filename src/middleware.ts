import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { isAdminRole } from '@/lib/rbac/permissions'

export const runtime = 'nodejs'

const SESSION_COOKIE_NAME = 'session'

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

async function readRole(req: NextRequest): Promise<{ authenticated: boolean; role?: string }> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!token) return { authenticated: false }

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, user: { select: { role: true } } },
  })
  if (!session || session.expiresAt < new Date()) return { authenticated: false }

  return { authenticated: true, role: session.user.role }
}

// Manual token check because this middleware now covers two independent
// concerns with different scopes: maintenance mode applies site-wide,
// while the "must be signed in" gate only applies to /admin and /account.
// The session lookup only runs when one of those gates could actually
// apply — most requests (product pages, cart, checkout, API routes) skip
// it entirely rather than paying a DB round trip on every request.
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const maintenanceOn = process.env.MAINTENANCE_MODE === 'true'
  const needsAdminCheck = pathname.startsWith('/admin') || (maintenanceOn && pathname !== '/maintenance' && !pathname.startsWith('/api'))
  const needsAuthCheck = pathname.startsWith('/account')

  if (!needsAdminCheck && !needsAuthCheck) {
    return NextResponse.next()
  }

  const { authenticated, role } = await readRole(req)

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
