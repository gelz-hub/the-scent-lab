import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'read') {
  const result = await requirePermission('orders', action)
  return result.allowed ? result.session : null
}

/** Real order list for staff — order #, customer, item count, total, order
 * status, and the most recent payment's status. Read-only; status changes
 * happen through the dedicated order/shipment workflows, not here. */
export async function GET(req: Request) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const status = searchParams.get('status')

  const orders = await db.order.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(q && {
        OR: [
          { orderNumber: { contains: q } },
          { user: { name: { contains: q } } },
          { user: { email: { contains: q } } },
        ],
      }),
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      items: { select: { qty: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const shaped = orders.map((o) => ({
    id: o.id,
    number: o.orderNumber,
    customerName: o.user.name ?? o.user.email,
    email: o.user.email,
    date: o.createdAt,
    items: o.items.reduce((sum, i) => sum + i.qty, 0),
    total: o.total,
    status: o.status,
    payment: o.payments[0]?.status ?? null,
  }))

  return NextResponse.json({ orders: shaped })
}
