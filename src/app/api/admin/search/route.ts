import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { hasPermission } from '@/lib/rbac/permissions'

/**
 * Global admin search — orders, customers, products (by name/SKU), invoices,
 * payments (by provider reference), shipments (by tracking number). Each
 * section is only queried (and only returned) if the caller's role has read
 * access to that module — a STAFF search never returns payment/customer
 * results even if the query happens to match one, since 'search' alone
 * doesn't grant visibility into modules the role can't otherwise see.
 */
export async function GET(req: Request) {
  const { session, allowed } = await requirePermission('search', 'read')
  if (!allowed || !session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: {} })

  const role = session.user.role
  const results: Record<string, unknown[]> = {}

  if (hasPermission(role, 'orders', 'read')) {
    results.orders = await db.order.findMany({
      where: { orderNumber: { contains: q } },
      select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
      take: 10,
    })
  }

  if (hasPermission(role, 'customers', 'read')) {
    results.customers = await db.user.findMany({
      where: { role: 'CUSTOMER', OR: [{ name: { contains: q } }, { email: { contains: q } }] },
      select: { id: true, name: true, email: true },
      take: 10,
    })
  }

  if (hasPermission(role, 'products', 'read')) {
    results.products = await db.product.findMany({
      where: {
        deletedAt: null,
        OR: [{ name: { contains: q } }, { variants: { some: { sku: { contains: q } } } }],
      },
      select: { id: true, name: true, brand: true, slug: true },
      take: 10,
    })
  }

  if (hasPermission(role, 'invoices', 'read')) {
    results.invoices = await db.invoice.findMany({
      where: { invoiceNumber: { contains: q } },
      select: { id: true, invoiceNumber: true, status: true, orderId: true },
      take: 10,
    })
  }

  if (hasPermission(role, 'payments', 'read')) {
    results.payments = await db.payment.findMany({
      where: { OR: [{ providerReference: { contains: q } }, { providerTransactionId: { contains: q } }] },
      select: { id: true, status: true, totalAmount: true, providerReference: true, orderId: true },
      take: 10,
    })
  }

  if (hasPermission(role, 'shipments', 'read')) {
    results.shipments = await db.shipment.findMany({
      where: { trackingNumber: { contains: q } },
      select: { id: true, status: true, trackingNumber: true, orderId: true },
      take: 10,
    })
  }

  return NextResponse.json({ results })
}
