import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toCsv, csvResponseHeaders } from '@/lib/export/csv'

export async function GET() {
  const { allowed } = await requirePermission('orders', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const orders = await db.order.findMany({
    include: {
      user: { select: { email: true } },
      items: true,
      payments: { orderBy: { createdAt: 'desc' }, take: 1 },
      shipment: { select: { status: true, trackingNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['Order Number', 'Customer Email', 'Status', 'Payment Status', 'Shipment Status', 'Tracking Number', 'Items', 'Total', 'Created At']
  const rows = orders.map((o) => [
    o.orderNumber,
    o.user.email,
    o.status,
    o.payments[0]?.status ?? '',
    o.shipment?.status ?? '',
    o.shipment?.trackingNumber ?? '',
    o.items.length,
    o.total.toFixed(2),
    o.createdAt.toISOString(),
  ])

  return new NextResponse(toCsv(header, rows), { headers: csvResponseHeaders('orders') })
}
