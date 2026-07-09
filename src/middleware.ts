import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { isAdminRole } from '@/lib/rbac/permissions'

// Manual token check (not withAuth's wrapper) because this middleware now
// covers two independent concerns with different scopes: maintenance mode
// applies site-wide, while the "must be signed in" gate only applies to
// /admin and /account. withAuth's `authorized` callback is all-or-nothing
// per matched path, so it can't express "some matched paths are public."
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = await getToken({ req })
  const role = token?.role as string | undefined

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
  if (pathname.startsWith('/account') && !token) {
    return NextResponse.redirect(new URL('/login?callbackUrl=' + pathname, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
