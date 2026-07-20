import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAdminAuth } from '@/lib/firebase/admin-auth'
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

  // Prisma row is created first so its auto-generated cuid can be reused as
  // the Firebase uid — see src/lib/auth/session.ts. Roll back on Firebase
  // failure so we never end up with an account that can't sign in.
  const user = await db.user.create({
    data: { name, email, role: 'CUSTOMER' },
    select: { id: true, email: true, name: true },
  })

  try {
    await getAdminAuth().createUser({ uid: user.id, email: user.email, password, displayName: name })
    await getAdminAuth().setCustomUserClaims(user.id, { role: 'CUSTOMER' })
  } catch (err) {
    await db.user.delete({ where: { id: user.id } })
    const message = err instanceof Error && 'code' in err && (err as { code?: string }).code === 'auth/email-already-exists'
      ? 'An account with this email already exists.'
      : 'Could not create account.'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ user }, { status: 201 })
}
