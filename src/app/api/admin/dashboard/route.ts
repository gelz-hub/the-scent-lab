import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { hasPermission } from '@/lib/rbac/permissions'
import { listLowStock } from '@/lib/inventory/inventory-service'
import { unreadCount } from '@/lib/notification-center/service'
import { getProductAnalytics } from '@/lib/analytics/products'
import { resolveDateRange } from '@/lib/analytics/date-ranges'

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
    const [todaysOrders, pendingPayments, preparingOrders, totalOrders, recentOrders] = await Promise.all([
      db.order.count({ where: { createdAt: { gte: startOfToday } } }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'PREPARING' } }),
      db.order.count(),
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ])
    payload.todaysOrders = todaysOrders
    payload.pendingPayments = pendingPayments
    payload.preparingOrders = preparingOrders
    payload.totalOrders = totalOrders
    payload.recentOrders = recentOrders.map((o) => ({
      id: o.id,
      number: o.orderNumber,
      customerName: o.user.name ?? o.user.email,
      email: o.user.email,
      date: o.createdAt,
      status: o.status,
      total: o.total,
    }))
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
    const startOfLastMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 1, 1)
    const sixMonthsAgo = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - 5, 1)

    const [revenueToday, revenueMonth, revenueLastMonth, revenueAllTime, paymentsForSeries] = await Promise.all([
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfToday } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfLastMonth, lt: startOfMonth } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
      db.payment.findMany({
        where: { status: 'PAID', paidAt: { gte: sixMonthsAgo } },
        select: { totalAmount: true, paidAt: true },
      }),
    ])
    payload.revenueToday = revenueToday._sum.totalAmount ?? 0
    payload.revenueThisMonth = revenueMonth._sum.totalAmount ?? 0
    payload.totalRevenue = revenueAllTime._sum.totalAmount ?? 0

    const lastMonthTotal = revenueLastMonth._sum.totalAmount ?? 0
    const thisMonthTotal = revenueMonth._sum.totalAmount ?? 0
    payload.revenueTrend =
      lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null

    // Bucket paid amounts into the last 6 calendar months for the chart.
    const months: { key: string; label: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(startOfToday.getFullYear(), startOfToday.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('en-US', { month: 'short' }),
        revenue: 0,
      })
    }
    const byKey = new Map(months.map((m) => [m.key, m]))
    for (const p of paymentsForSeries) {
      if (!p.paidAt) continue
      const key = `${p.paidAt.getFullYear()}-${p.paidAt.getMonth()}`
      const bucket = byKey.get(key)
      if (bucket) bucket.revenue += p.totalAmount
    }
    payload.revenueByMonth = months.map((m) => ({ month: m.label, revenue: m.revenue }))
  }

  if (hasPermission(role, 'inventory', 'read')) {
    const [lowStock, outOfStockCount] = await Promise.all([
      listLowStock(),
      db.inventory.count({ where: { currentStock: { lte: 0 } } }),
    ])
    payload.lowStockCount = lowStock.length
    payload.outOfStockCount = outOfStockCount
  }

  if (hasPermission(role, 'notifications', 'read') && session.session) {
    payload.unreadNotifications = await unreadCount(session.session.user.id)
  }

  if (hasPermission(role, 'customers', 'read')) {
    const [totalCustomers, recentCustomers] = await Promise.all([
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.user.findMany({
        where: { role: 'CUSTOMER' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ])
    payload.totalCustomers = totalCustomers
    payload.recentCustomerActivity = recentCustomers
  }

  if (hasPermission(role, 'products', 'read')) {
    const [totalProducts, recentProducts] = await Promise.all([
      db.product.count({ where: { deletedAt: null } }),
      db.product.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, brand: true, slug: true, image: true, createdAt: true },
      }),
    ])
    payload.totalProducts = totalProducts
    payload.recentProducts = recentProducts
  }

  if (hasPermission(role, 'catalog', 'read')) {
    const [totalBrands, totalCategories, totalCollections] = await Promise.all([
      db.brand.count(),
      db.category.count(),
      db.collection.count(),
    ])
    payload.totalBrands = totalBrands
    payload.totalCategories = totalCategories
    payload.totalCollections = totalCollections
  }

  if (hasPermission(role, 'analytics', 'read')) {
    const range = resolveDateRange('30d')
    const { bestSelling } = await getProductAnalytics(range)
    payload.topProducts = bestSelling.slice(0, 5)
  }

  return NextResponse.json(payload)
}
