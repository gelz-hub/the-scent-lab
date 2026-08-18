import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { createSession, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from '@/lib/auth/session'
import { passwordSchema } from '@/lib/security/password'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
})

export async function POST(req: Request) {
  // 5 accounts / hour / IP — registration abuse (bulk fake accounts) is the
  // threat here, not brute force, so the window is longer and the limit
  // lower than login's.
  const { allowed } = await rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Please check your details and try again.' }, { status: 400 })
  }

  const { name, email, password } = parsed.data

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)
  const user = await db.user.create({
    data: { name, email, passwordHash, role: 'CUSTOMER' },
    select: { id: true, email: true, name: true },
  })

  const token = await createSession(user.id)

  const res = NextResponse.json({ user }, { status: 201 })
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_MS / 1000,
  })
  return res
}
