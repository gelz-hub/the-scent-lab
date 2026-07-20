import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getAdminAuth } from '@/lib/firebase/admin-auth'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email/send'

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Firebase mints the link pointed at its own hosted handler; we only want
  // the oobCode out of it so our own branded /reset-password page (not
  // Firebase's default UI) can call confirmPasswordReset client-side.
  const firebaseLink = await getAdminAuth().generatePasswordResetLink(email, {
    url: `${appUrl}/reset-password`,
  })
  const oobCode = new URL(firebaseLink).searchParams.get('oobCode')
  if (!oobCode) return genericResponse

  const resetUrl = `${appUrl}/reset-password?oobCode=${oobCode}`

  await sendPasswordResetEmail({ email: user.email, name: user.name }, resetUrl)

  return genericResponse
}
