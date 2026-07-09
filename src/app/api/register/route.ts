import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
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
  const { allowed } = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000)
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

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: { name, email, passwordHash, role: 'CUSTOMER' },
    select: { id: true, email: true, name: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
