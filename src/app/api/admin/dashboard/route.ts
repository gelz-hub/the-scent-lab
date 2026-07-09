import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { hasPermission } from '@/lib/rbac/permissions'
import { listLowStock } from '@/lib/inventory/inventory-service'
import { unreadCount } from '@/lib/notification-center/service'

/**
 * Real-time summary cards for the admin dashboard home. Only ADMIN_ROLES may
 * call this at all (checked via requirePermission('orders','read') as the
 * baseline — every staff-facing role has at least one module); the response
 * itself is then trimmed to only the sections the caller's role can see, so
 * e.g. STAFF (Orders + Shipments only) never receives revenue/payment
 * figures through the dashboard even though this is a single aggregation
 * endpoint. See src/lib/rbac/README.md, "Dashboard architecture".
 */
export async function GET() {
  const session = await requirePermission('orders', 'read')
  const fallback = await requirePermission('shipments', 'read')
  if (!session.allowed && !fallback.allowed) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }
  const role = (session.session ?? fallback.session)!.user.role

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1)

  const payload: Record<string, unknown> = {}

  if (hasPermission(role, 'orders', 'read')) {
    const [todaysOrders, pendingPayments, preparingOrders] = await Promise.all([
      db.order.count({ where: { createdAt: { gte: startOfToday } } }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'PREPARING' } }),
    ])
    payload.todaysOrders = todaysOrders
    payload.pendingPayments = pendingPayments
    payload.preparingOrders = preparingOrders
  }

  if (hasPermission(role, 'shipments', 'read')) {
    const [readyToShip, outForDelivery, deliveredToday] = await Promise.all([
      db.shipment.count({ where: { status: 'READY_FOR_SHIPMENT' } }),
      db.shipment.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
      db.shipment.count({ where: { status: 'DELIVERED', actualDeliveryAt: { gte: startOfToday } } }),
    ])
    payload.readyToShip = readyToShip
    payload.outForDelivery = outForDelivery
    payload.deliveredToday = deliveredToday
  }

  if (hasPermission(role, 'payments', 'read')) {
    const [revenueToday, revenueMonth] = await Promise.all([
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfToday } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
    ])
    payload.revenueToday = revenueToday._sum.totalAmount ?? 0
    payload.revenueThisMonth = revenueMonth._sum.totalAmount ?? 0
  }

  if (hasPermission(role, 'inventory', 'read')) {
    const lowStock = await listLowStock()
    payload.lowStockCount = lowStock.length
  }

  if (hasPermission(role, 'notifications', 'read') && session.session) {
    payload.unreadNotifications = await unreadCount(session.session.user.id)
  }

  if (hasPermission(role, 'customers', 'read')) {
    const recentCustomers = await db.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    })
    payload.recentCustomerActivity = recentCustomers
  }

  return NextResponse.json(payload)
}
