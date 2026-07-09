import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifyOrderUpdate } from '@/lib/notifications'
import { releaseStockForOrder } from '@/lib/inventory/order-integration'
import { requirePermission } from '@/lib/rbac/require-permission'
import { hasPermission } from '@/lib/rbac/permissions'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, address: true, payments: { orderBy: { createdAt: 'desc' } } },
  })

  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const isOwner = order.userId === session.user.id
  const isStaff = hasPermission(session.user.role, 'orders', 'read')
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  // Shipment/tracking detail lives at GET /api/shipments/[id] (its own
  // customer-vs-staff projection) — kept out of this response to avoid
  // duplicating that visibility logic in two places.
  // `payment` is the most recent attempt (for display); `payments` is the
  // full retry history, oldest first — see src/lib/payment/README.md.
  return NextResponse.json({
    order: { ...order, payment: order.payments[0] ?? null, payments: [...order.payments].reverse() },
  })
}

const updateSchema = z.object({
  status: z
    .enum(['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PREPARING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
    .optional(),
})

/** Order-level status only (payment/fulfillment lifecycle). Tracking/courier updates go through /api/shipments/[id]. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, allowed } = await requirePermission('orders', 'write')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update.' }, { status: 400 })
  }

  const { status } = parsed.data

  const before = await db.order.findUnique({ where: { id }, select: { status: true } })

  const order = await db.order
    .update({
      where: { id },
      data: { ...(status && { status }) },
      include: { items: true, address: true, payments: { orderBy: { createdAt: 'desc' } } },
    })
    .catch(() => null)

  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  if (status) {
    const { ipAddress, userAgent } = requestMetadata(req)
    await recordAudit({
      userId: session.user.id,
      action: 'STATUS_CHANGE',
      resource: 'Order',
      resourceId: id,
      before: { status: before?.status },
      after: { status },
      ipAddress,
      userAgent,
    })
  }

  if (status) {
    const statusLabel = status.replace(/_/g, ' ').toLowerCase()
    notifyOrderUpdate(order.userId, order.orderNumber, statusLabel).catch((err) =>
      console.error('notifyOrderUpdate failed', err)
    )

    // Part 6 addition — order-level cancellation is the other place (besides
    // shipment cancel/return) an order can be cancelled before shipment;
    // release is idempotent so it's safe regardless of which path fires first.
    if (status === 'CANCELLED') {
      releaseStockForOrder(order.id).catch((err) => console.error('[inventory] releaseStockForOrder failed', err))
    }
  }

  return NextResponse.json({ order: { ...order, payment: order.payments[0] ?? null, payments: [...order.payments].reverse() } })
}
