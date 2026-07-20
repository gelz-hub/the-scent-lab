import { NextResponse, type NextRequest } from 'next/server'
import { getAdminAuth, createSessionCookie, SESSION_COOKIE_MAX_AGE_MS } from '@/lib/firebase/admin-auth'
import { SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit/audit-service'
import { rateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logging/logger'

function clientIp(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0].trim() ?? 'unknown'
}

// Exchanges a Firebase ID token (from client-side sign-in/sign-up/Google
// popup) for an httpOnly session cookie. Also upserts the Prisma User row
// on first Google sign-in, since that path never goes through /api/register.
export async function POST(req: NextRequest) {
  const { idToken } = await req.json().catch(() => ({ idToken: null }))
  if (!idToken || typeof idToken !== 'string') {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
  }

  const ip = clientIp(req)
  const { allowed } = await rateLimit(`session:${ip}`, 20, 5 * 60 * 1000)
  if (!allowed) {
    logger.warn('auth', 'session_rate_limited', { ip })
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  let decoded
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  let user = await db.user.findUnique({
    where: { id: decoded.uid },
    select: { id: true, email: true, name: true, role: true },
  })

  // First-time Google sign-in: no Prisma row yet for this Firebase uid.
  if (!user) {
    const email = decoded.email?.toLowerCase()
    if (!email) {
      return NextResponse.json({ error: 'Account has no email' }, { status: 400 })
    }
    user = await db.user.create({
      data: {
        id: decoded.uid,
        email,
        name: decoded.name ?? null,
        role: 'CUSTOMER',
      },
      select: { id: true, email: true, name: true, role: true },
    })
    await getAdminAuth().setCustomUserClaims(decoded.uid, { role: user.role })
  }

  const sessionCookie = await createSessionCookie(idToken)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  })

  await recordAudit({ userId: user.id, action: 'LOGIN', resource: 'Session', ipAddress: ip })

  return res
}

export async function DELETE(req: NextRequest) {
  const cookieStore = req.cookies
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE_NAME)

  if (sessionCookie) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(sessionCookie)
      await getAdminAuth().revokeRefreshTokens(decoded.uid)
      await recordAudit({ userId: decoded.uid, action: 'LOGOUT', resource: 'Session' })
    } catch {
      // Cookie already invalid/expired — nothing to revoke or log.
    }
  }

  return res
}
