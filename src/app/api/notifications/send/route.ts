import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { notifyPromotion, notifyOrderUpdate } from '@/lib/notifications'
import { requirePermission } from '@/lib/rbac/require-permission'

const promoSchema = z.object({
  kind: z.literal('promotion'),
  title: z.string().trim().min(1),
  body: z.string().trim().min(1),
  url: z.string().trim().optional(),
})

const orderSchema = z.object({
  kind: z.literal('order-update'),
  userEmail: z.string().trim().email(),
  orderNumber: z.string().trim().min(1),
  status: z.string().trim().min(1),
})

const sendSchema = z.discriminatedUnion('kind', [promoSchema, orderSchema])

export async function POST(req: Request) {
  const { allowed } = await requirePermission('notifications', 'write')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = sendSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 })
  }

  if (parsed.data.kind === 'promotion') {
    await notifyPromotion(parsed.data.title, parsed.data.body, parsed.data.url)
    return NextResponse.json({ ok: true })
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.userEmail.toLowerCase() } })
  if (!user) return NextResponse.json({ error: 'No user with that email.' }, { status: 404 })

  await notifyOrderUpdate(user.id, parsed.data.orderNumber, parsed.data.status)
  return NextResponse.json({ ok: true })
}
