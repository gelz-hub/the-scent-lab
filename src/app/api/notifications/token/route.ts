import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { z } from 'zod'
import { db } from '@/lib/db'

const bodySchema = z.object({
  token: z.string().min(1),
  action: z.enum(['register', 'unregister']).default('register'),
})

/** Status check only â€” used by the login onboarding banner to decide whether to show at all. Registration itself still only happens via POST below. */
export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const count = await db.pushToken.count({ where: { userId: session.user.id } })
  return NextResponse.json({ hasToken: count > 0 })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const { token, action } = parsed.data
  const userId = session.user.id

  if (action === 'unregister') {
    await db.pushToken.deleteMany({ where: { token } })
    return NextResponse.json({ ok: true })
  }

  await db.pushToken.upsert({
    where: { token },
    update: { userId },
    create: { token, userId },
  })

  await db.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
  })

  return NextResponse.json({ ok: true })
}
