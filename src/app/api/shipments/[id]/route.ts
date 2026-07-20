import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { z } from 'zod'
import { db } from '@/lib/db'
import { notifyOrderUpdate } from '@/lib/notifications'
import { shippingStatusLabel, type ShippingStatusValue } from '@/lib/shipping/constants'
import { isValidShippingTransition } from '@/lib/shipping/transitions'
import { buildCustomerShipmentView } from '@/lib/shipping/customer-view'
import { createNotification } from '@/lib/notification-center/service'
import { commitStockForOrder, releaseStockForOrder } from '@/lib/inventory/order-integration'
import { requirePermission } from '@/lib/rbac/require-permission'
import { hasPermission } from '@/lib/rbac/permissions'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('shipments', action)
  return result.allowed ? result.session : null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      order: { include: { address: true, user: { select: { id: true, name: true, email: true } } } },
      statusEvents: { orderBy: { createdAt: 'desc' }, include: { updatedBy: { select: { name: true } } } },
      courierChanges: { orderBy: { createdAt: 'desc' }, include: { changedBy: { select: { name: true } } } },
    },
  })
  if (!shipment) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 })

  const isStaff = hasPermission(session.user.role, 'shipments', 'read')
  const isOwner = shipment.order.userId === session.user.id
  if (!isStaff && !isOwner) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  // Customers get the operational summary + their own visible notes only —
  // never internal notes, courier-change reasons, or staff identities.
  if (!isStaff) {
    return NextResponse.json({ shipment: buildCustomerShipmentView(shipment) })
  }

  return NextResponse.json({ shipment })
}

const SHIPPING_STATUS_VALUES = [
  'PENDING', 'PREPARING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED', 'CANCELLED',
] as const

const updateSchema = z.object({
  status: z.enum(SHIPPING_STATUS_VALUES).optional(),
  deliveryCompany: z.enum(['JT_EXPRESS', 'VIREAK_BUNTHAM']).nullable().optional(),
  trackingNumber: z.string().trim().min(1).optional(),
  trackingUrl: z.string().trim().url().optional().or(z.literal('')),
  customerNotes: z.string().trim().max(2000).optional(),
  internalNotes: z.string().trim().max(2000).optional(),
  shippingFee: z.number().nonnegative().optional(),
  note: z.string().trim().max(500).optional(), // note attached to this specific status-change event
  courierChangeReason: z.string().trim().min(1).max(500).optional(), // required if deliveryCompany is being changed
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update.' }, { status: 400 })
  }

  const {
    status, deliveryCompany, trackingNumber, trackingUrl,
    customerNotes, internalNotes, shippingFee, note, courierChangeReason,
  } = parsed.data

  const existing = await db.shipment.findUnique({
    where: { id },
    include: { order: { include: { address: true, user: { select: { email: true, name: true } } } } },
  })
  if (!existing) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 })
  if (existing.archivedAt) {
    return NextResponse.json({ error: 'This shipment has been archived and can no longer be edited.' }, { status: 409 })
  }

  // Rule 2 — enforce the shipment status state machine server-side.
  if (status && !isValidShippingTransition(existing.status as ShippingStatusValue, status)) {
    return NextResponse.json(
      { error: `Cannot move a shipment from "${shippingStatusLabel(existing.status)}" to "${shippingStatusLabel(status)}".` },
      { status: 400 }
    )
  }

  // Rule 3 — a LOGISTICS shipment can't be marked SHIPPED without a courier and tracking number.
  if (status === 'SHIPPED' && existing.deliveryMethod === 'LOGISTICS') {
    const finalCourier = deliveryCompany !== undefined ? deliveryCompany : existing.deliveryCompany
    const finalTracking = trackingNumber !== undefined ? trackingNumber : existing.trackingNumber
    if (!finalCourier || !finalTracking) {
      return NextResponse.json(
        { error: 'Assign a courier and add a tracking number before marking this shipment as shipped.' },
        { status: 400 }
      )
    }
  }

  const isCourierChange = deliveryCompany !== undefined && deliveryCompany !== existing.deliveryCompany
  if (isCourierChange && !courierChangeReason) {
    return NextResponse.json(
      { error: 'Please provide a reason for changing the courier.' },
      { status: 400 }
    )
  }

  const shipment = await db.shipment.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(deliveryCompany !== undefined && { deliveryCompany }),
      ...(trackingNumber && { trackingNumber }),
      ...(trackingUrl !== undefined && { trackingUrl: trackingUrl || null }),
      ...(customerNotes !== undefined && { customerNotes }),
      ...(internalNotes !== undefined && { internalNotes }),
      ...(shippingFee !== undefined && { shippingFee }),
      ...(status === 'DELIVERED' && { actualDeliveryAt: new Date() }),
      updatedById: session.user.id,
    },
  })

  if (status && status !== existing.status) {
    await db.shipmentStatusEvent.create({
      data: { shipmentId: id, status, note: note || null, updatedById: session.user.id },
    })

    const { ipAddress, userAgent } = requestMetadata(req)
    await recordAudit({
      userId: session.user.id,
      action: 'SHIPMENT_CHANGE',
      resource: 'Shipment',
      resourceId: id,
      before: { status: existing.status },
      after: { status },
      ipAddress,
      userAgent,
    })

    notifyOrderUpdate(existing.order.userId, existing.order.orderNumber, shippingStatusLabel(status)).catch((err) =>
      console.error('notifyOrderUpdate failed', err)
    )

    if (status === 'SHIPPED') {
      // No email in this version — see src/lib/email/README (future). In-app
      // notification center + push (above) cover the customer for now.
      createNotification({
        userId: existing.order.userId,
        type: 'SHIPMENT_UPDATE',
        title: 'Your order has been shipped',
        message: `Order ${existing.order.orderNumber} has shipped and is on its way.`,
        link: '/account/orders',
      }).catch((err) => console.error('createNotification (SHIPMENT_UPDATE) failed', err))

      // Part 6 addition — permanently reduce stock now that the order has
      // actually shipped (never before). Independent of the notification
      // above; a failure here never blocks the shipment status update.
      commitStockForOrder(existing.orderId).catch((err) =>
        console.error('[inventory] commitStockForOrder failed', err)
      )
    }

    if (status === 'CANCELLED' || status === 'RETURNED') {
      // Part 6 addition — release any reserved stock for this order. Safe
      // to call even if nothing was ever reserved (order-integration checks
      // first) and safe to call again if a shipment cancel and an order
      // cancel both fire (idempotent).
      releaseStockForOrder(existing.orderId).catch((err) =>
        console.error('[inventory] releaseStockForOrder failed', err)
      )
    }
  }

  if (isCourierChange) {
    await db.shipmentCourierChange.create({
      data: {
        shipmentId: id,
        previousCourier: existing.deliveryCompany,
        newCourier: deliveryCompany!,
        reason: courierChangeReason!,
        changedById: session.user.id,
      },
    })
  }

  return NextResponse.json({ shipment })
}

/** Soft delete only — shipments are never physically removed. Archives + cancels, preserving all history. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const existing = await db.shipment.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 })

  const shipment = await db.shipment.update({
    where: { id },
    data: {
      archivedAt: new Date(),
      status: 'CANCELLED',
      updatedById: session.user.id,
    },
  })

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'ARCHIVE',
    resource: 'Shipment',
    resourceId: id,
    before: { status: existing.status, archivedAt: existing.archivedAt },
    after: { status: 'CANCELLED', archivedAt: shipment.archivedAt },
    ipAddress,
    userAgent,
  })

  if (existing.status !== 'CANCELLED') {
    await db.shipmentStatusEvent.create({
      data: { shipmentId: id, status: 'CANCELLED', note: 'Archived by staff', updatedById: session.user.id },
    })
    // Part 6 addition — releasing reserved stock on archive/cancel, same as the PATCH path.
    releaseStockForOrder(existing.orderId).catch((err) =>
      console.error('[inventory] releaseStockForOrder failed', err)
    )
  }

  return NextResponse.json({ shipment })
}
