import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/rbac/permissions'
import { buildShipmentTimeline } from '@/lib/shipping/timeline'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      order: { include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } } },
      statusEvents: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!shipment) return NextResponse.json({ error: 'Shipment not found.' }, { status: 404 })

  const isStaff = hasPermission(session.user.role, 'shipments', 'read')
  const isOwner = shipment.order.userId === session.user.id
  if (!isStaff && !isOwner) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const timeline = buildShipmentTimeline({
    orderCreatedAt: shipment.order.createdAt,
    paymentConfirmedAt:
      shipment.order.payments[0]?.status === 'PAID' ? shipment.order.payments[0].updatedAt : null,
    shipmentStatusEvents: shipment.statusEvents,
    audience: isStaff ? 'staff' : 'customer',
  })

  return NextResponse.json({ timeline })
}
