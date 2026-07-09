import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { resolveDeliveryMethod, shippingFeeFor, estimatedDeliveryFor } from '@/lib/checkout/delivery'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('shipments', action)
  return result.allowed ? result.session : null
}

export async function GET() {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const shipments = await db.shipment.findMany({
    where: { archivedAt: null },
    include: {
      order: { include: { address: true, user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ shipments })
}

const createSchema = z.object({ orderId: z.string().min(1) })

/** Retry path — creates a shipment for an order that doesn't have one yet (e.g. auto-creation failed at checkout). */
export async function POST(req: Request) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { address: true, shipment: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  if (order.shipment) return NextResponse.json({ error: 'This order already has a shipment.' }, { status: 409 })
  if (!order.address) return NextResponse.json({ error: 'Order has no address on file.' }, { status: 422 })

  const deliveryMethod = resolveDeliveryMethod(order.address.province)

  const shipment = await db.shipment.create({
    data: {
      orderId: order.id,
      deliveryMethod,
      deliveryCompany: deliveryMethod === 'LOGISTICS' ? order.address.deliveryCompany : null,
      shippingFee: shippingFeeFor(order.address.province, order.subtotal - order.discount),
      estimatedDelivery: estimatedDeliveryFor(order.address.province),
      status: 'PENDING',
      createdById: session.user.id,
    },
  })

  return NextResponse.json({ shipment }, { status: 201 })
}
