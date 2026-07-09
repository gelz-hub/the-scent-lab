import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { changePassword, InvalidCurrentPasswordError } from '@/lib/account/customer-service'
import { passwordSchema } from '@/lib/security/password'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  // 5 attempts / 15 minutes / account — guards against someone with a
  // stolen session cookie brute-forcing the current-password check.
  const { allowed } = rateLimit(`change-password:${session.user.id}:${clientIp(req)}`, 5, 15 * 60 * 1000)
  if (!allowed) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 })

  try {
    await changePassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof InvalidCurrentPasswordError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[account] change-password failed', error)
    return NextResponse.json({ error: 'Could not change password.' }, { status: 500 })
  }
}
