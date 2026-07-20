import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { z } from 'zod'
import { db } from '@/lib/db'

const prefsSchema = z.object({
  orderUpdates: z.boolean().optional(),
  backInStock: z.boolean().optional(),
  priceDrops: z.boolean().optional(),
  promotions: z.boolean().optional(),
  newArrivals: z.boolean().optional(),
})

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const prefs = await db.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: {},
    create: { userId: session.user.id },
  })

  return NextResponse.json({ preferences: prefs })
}

export async function PATCH(req: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const parsed = prefsSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preferences.' }, { status: 400 })
  }

  const prefs = await db.notificationPreference.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json({ preferences: prefs })
}
