// Customer analytics — read-only. Never touches Address/Wishlist/Review
// write paths (Part 7 services); only reads User/Order.

import { db } from '@/lib/db'
import { cached } from './cache'
import type { DateRange } from './date-ranges'

export async function getCustomerAnalytics(range: DateRange) {
  return cached(`customers:${range.start.getTime()}:${range.end.getTime()}`, async () => {
    const [newCustomers, customersWithOrders] = await Promise.all([
      db.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: range.start, lte: range.end } } }),
      db.user.findMany({
        where: { role: 'CUSTOMER', orders: { some: { createdAt: { gte: range.start, lte: range.end } } } },
        select: { id: true, name: true, email: true, orders: { select: { total: true, createdAt: true } } },
      }),
    ])

    const returning = customersWithOrders.filter((c) => c.orders.length > 1).length
    const totalSpendAll = customersWithOrders.reduce((sum, c) => sum + c.orders.reduce((s, o) => s + o.total, 0), 0)
    const averageSpend = customersWithOrders.length > 0 ? totalSpendAll / customersWithOrders.length : 0
    const repeatPurchaseRate = customersWithOrders.length > 0 ? returning / customersWithOrders.length : 0

    const topCustomers = customersWithOrders
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        orderCount: c.orders.length,
        totalSpend: c.orders.reduce((s, o) => s + o.total, 0),
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10)

    return {
      newCustomers,
      activeCustomers: customersWithOrders.length,
      returningCustomers: returning,
      averageSpend,
      repeatPurchaseRate,
      topCustomers,
      // Customer Lifetime Value — explicitly future per spec; would need a
      // churn/retention model this pass doesn't build. Not returned here.
    }
  })
}
