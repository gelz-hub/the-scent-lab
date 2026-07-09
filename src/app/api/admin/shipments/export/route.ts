import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toCsv, csvResponseHeaders } from '@/lib/export/csv'

export async function GET() {
  const { allowed } = await requirePermission('shipments', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const shipments = await db.shipment.findMany({
    include: { order: { select: { orderNumber: true, user: { select: { email: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['Order Number', 'Customer Email', 'Status', 'Delivery Method', 'Delivery Company', 'Tracking Number', 'Estimated Delivery', 'Created At']
  const rows = shipments.map((s) => [
    s.order.orderNumber,
    s.order.user.email,
    s.status,
    s.deliveryMethod,
    s.deliveryCompany ?? '',
    s.trackingNumber ?? '',
    s.estimatedDelivery,
    s.createdAt.toISOString(),
  ])

  return new NextResponse(toCsv(header, rows), { headers: csvResponseHeaders('shipments') })
}
