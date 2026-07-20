import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email/send'

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

export async function POST(req: Request) {
  const { allowed } = await rateLimit(`forgot-password:${clientIp(req)}`, 5, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = forgotPasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const { email } = parsed.data

  // Always respond with the same generic message whether or not the
  // account exists — otherwise this endpoint becomes an email-enumeration
  // oracle. The email itself only goes out for real accounts.
  const genericResponse = NextResponse.json({
    message: 'If an account exists for that email, a reset link has been sent.',
  })

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return genericResponse

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  await db.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`

  await sendPasswordResetEmail({ email: user.email, name: user.name }, resetUrl)

  return genericResponse
}
