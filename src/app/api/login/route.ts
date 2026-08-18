import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from '@/lib/auth/session'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'
import { recordAudit } from '@/lib/audit/audit-service'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  // 10 attempts / 15 min / IP — brute force is the threat here, so a
  // tighter window/limit than registration's.
  const { allowed } = await rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a valid email and password.' }, { status: 400 })
  }

  const { email, password } = parsed.data

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true },
  })

  // passwordHash is null for legacy pre-migration rows — treat identically
  // to a wrong password rather than leaking which case it is.
  const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false
  if (!user || !valid) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
  }

  const token = await createSession(user.id)
  await recordAudit({ userId: user.id, action: 'LOGIN', resource: 'Session', ipAddress: clientIp(req) })

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  })
  return res
}
