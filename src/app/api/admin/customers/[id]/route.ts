import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('customers', action)
  return result.allowed ? result.session : null
}

/**
 * Staff-facing customer profile + order history — READ ONLY. Staff can view
 * a customer's wishlist/addresses/reviews here for support purposes, but
 * this route (and every other Part 7 admin route) never writes to them —
 * per spec, those stay customer-owned unless a dedicated administrative
 * tool is built for that purpose, which this is not.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params

  const customer = await db.user.findUnique({
    where: { id, role: 'CUSTOMER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      avatarUrl: true,
      createdAt: true,
    },
  })
  if (!customer) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

  const [orders, addresses, wishlistCount, reviewCount] = await Promise.all([
    db.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        shipment: { select: { status: true, deliveryCompany: true, trackingNumber: true } },
        invoice: { select: { invoiceNumber: true, status: true } },
      },
    }),
    db.address.findMany({ where: { userId: id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }),
    db.wishlist.count({ where: { userId: id } }),
    db.review.count({ where: { userId: id } }),
  ])

  return NextResponse.json({
    customer,
    orders,
    addresses,
    wishlistCount,
    reviewCount,
  })
}
