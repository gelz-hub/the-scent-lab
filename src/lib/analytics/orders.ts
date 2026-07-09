// Order analytics — read-only. Processing/delivery times are derived from
// the existing ShipmentStatusEvent audit trail (Part 3), never a new
// tracking mechanism.

import { db } from '@/lib/db'
import { cached } from './cache'
import type { DateRange } from './date-ranges'

const ORDER_STATUSES = ['PENDING_PAYMENT', 'PAYMENT_CONFIRMED', 'PREPARING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export async function getOrderAnalytics(range: DateRange) {
  return cached(`orders:${range.start.getTime()}:${range.end.getTime()}`, async () => {
    const statusCounts = await db.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: range.start, lte: range.end } },
      _count: true,
    })
    const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<string, number>
    for (const row of statusCounts) byStatus[row.status] = row._count

    // Average processing time: order creation -> first SHIPPED status event.
    // Average delivery time: SHIPPED -> DELIVERED status event.
    const shipmentsWithEvents = await db.shipment.findMany({
      where: { order: { createdAt: { gte: range.start, lte: range.end } } },
      select: {
        order: { select: { createdAt: true } },
        statusEvents: { where: { status: { in: ['SHIPPED', 'DELIVERED'] } }, orderBy: { createdAt: 'asc' }, select: { status: true, createdAt: true } },
      },
    })

    const processingTimesMs: number[] = []
    const deliveryTimesMs: number[] = []
    for (const s of shipmentsWithEvents) {
      const shippedEvent = s.statusEvents.find((e) => e.status === 'SHIPPED')
      const deliveredEvent = s.statusEvents.find((e) => e.status === 'DELIVERED')
      if (shippedEvent) processingTimesMs.push(shippedEvent.createdAt.getTime() - s.order.createdAt.getTime())
      if (shippedEvent && deliveredEvent) deliveryTimesMs.push(deliveredEvent.createdAt.getTime() - shippedEvent.createdAt.getTime())
    }

    const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
    const msToHours = (ms: number) => ms / (1000 * 60 * 60)

    return {
      byStatus,
      averageProcessingTimeHours: msToHours(avg(processingTimesMs)),
      averageDeliveryTimeHours: msToHours(avg(deliveryTimesMs)),
    }
  })
}
