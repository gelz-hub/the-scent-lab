// Sales analytics — entirely read-only aggregate queries against Order/
// Payment. Never writes anything, never calls PaymentService/OrderService
// mutation functions. See src/lib/analytics/README.md, "Metrics &
// Calculations" for exact definitions of gross/net sales.

import { db } from '@/lib/db'
import { cached } from './cache'
import { daysBetween, dateKey, type DateRange } from './date-ranges'

/**
 * "Revenue" is always Payment-based (sum of PAID payments' totalAmount in
 * the window, keyed by paidAt) — never Order.total, since an order can
 * exist without ever being paid. Gross/Net are Order-based (only for
 * orders whose current payment is PAID) since subtotal/discount/shipping
 * only live on Order, not Payment.
 */
export async function getSalesAnalytics(range: DateRange) {
  return cached(`sales:${range.start.getTime()}:${range.end.getTime()}`, async () => {
    const [currentRevenue, previousRevenue, paidOrders, orderCount] = await Promise.all([
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: range.start, lte: range.end } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: range.previousStart, lte: range.previousEnd } }, _sum: { totalAmount: true } }),
      db.order.findMany({
        where: { payments: { some: { status: 'PAID', paidAt: { gte: range.start, lte: range.end } } } },
        select: { subtotal: true, discount: true, shippingFee: true, total: true, createdAt: true },
      }),
      db.order.count({ where: { createdAt: { gte: range.start, lte: range.end } } }),
    ])

    const grossSales = paidOrders.reduce((sum, o) => sum + o.subtotal, 0)
    // Net sales = actually collected (post-discount, incl. shipping); no
    // refunds exist yet (future work — see README) so nothing is deducted here.
    const netSales = paidOrders.reduce((sum, o) => sum + o.total, 0)
    const averageOrderValue = paidOrders.length > 0 ? netSales / paidOrders.length : 0

    const days = daysBetween(range.start, range.end)
    const revenueByDay = new Map(days.map((d) => [dateKey(d), 0]))
    const ordersByDay = new Map(days.map((d) => [dateKey(d), 0]))

    const dailyPayments = await db.payment.findMany({
      where: { status: 'PAID', paidAt: { gte: range.start, lte: range.end } },
      select: { totalAmount: true, paidAt: true },
    })
    for (const p of dailyPayments) {
      const key = dateKey(p.paidAt!)
      if (revenueByDay.has(key)) revenueByDay.set(key, revenueByDay.get(key)! + p.totalAmount)
    }
    const dailyOrders = await db.order.findMany({ where: { createdAt: { gte: range.start, lte: range.end } }, select: { createdAt: true } })
    for (const o of dailyOrders) {
      const key = dateKey(o.createdAt)
      if (ordersByDay.has(key)) ordersByDay.set(key, ordersByDay.get(key)! + 1)
    }

    return {
      revenue: currentRevenue._sum.totalAmount ?? 0,
      previousRevenue: previousRevenue._sum.totalAmount ?? 0,
      grossSales,
      netSales,
      averageOrderValue,
      orderCount,
      paidOrderCount: paidOrders.length,
      revenuePerDay: days.map((d) => ({ date: dateKey(d), revenue: revenueByDay.get(dateKey(d)) ?? 0 })),
      ordersPerDay: days.map((d) => ({ date: dateKey(d), orders: ordersByDay.get(dateKey(d)) ?? 0 })),
    }
  })
}

/** Fixed calendar-period revenue figures (today/yesterday/month/year) — independent of whatever range filter the dashboard is showing, since these are always "as of now." */
export async function getRevenueSnapshot() {
  return cached('sales:snapshot', async () => {
    const now = new Date()
    const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0)
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [today, yesterday, month, year] = await Promise.all([
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfToday } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfYesterday, lt: startOfToday } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      db.payment.aggregate({ where: { status: 'PAID', paidAt: { gte: startOfYear } }, _sum: { totalAmount: true } }),
    ])

    return {
      today: today._sum.totalAmount ?? 0,
      yesterday: yesterday._sum.totalAmount ?? 0,
      monthly: month._sum.totalAmount ?? 0,
      yearly: year._sum.totalAmount ?? 0,
    }
  }, 300_000) // 5 minutes — these are shown on every dashboard tab, worth caching longer
}
