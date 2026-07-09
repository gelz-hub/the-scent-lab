// Shipment analytics — read-only against Shipment/ShipmentStatusEvent
// (Part 3). Never calls the shipment status-transition write path.

import { db } from '@/lib/db'
import { cached } from './cache'
import type { DateRange } from './date-ranges'

const SHIPPING_STATUSES = [
  'PENDING', 'PREPARING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'RETURNED', 'CANCELLED',
] as const

export async function getShipmentAnalytics(range: DateRange) {
  return cached(`shipments:${range.start.getTime()}:${range.end.getTime()}`, async () => {
    const [statusCounts, courierCounts, shipments] = await Promise.all([
      db.shipment.groupBy({ by: ['status'], where: { createdAt: { gte: range.start, lte: range.end } }, _count: true }),
      db.shipment.groupBy({ by: ['deliveryCompany'], where: { createdAt: { gte: range.start, lte: range.end } }, _count: true }),
      db.shipment.findMany({
        where: { createdAt: { gte: range.start, lte: range.end } },
        select: {
          status: true,
          statusEvents: { where: { status: { in: ['SHIPPED', 'DELIVERED'] } }, orderBy: { createdAt: 'asc' }, select: { status: true, createdAt: true } },
        },
      }),
    ])

    const byStatus = Object.fromEntries(SHIPPING_STATUSES.map((s) => [s, 0])) as Record<string, number>
    for (const row of statusCounts) byStatus[row.status] = row._count

    const byCourier = Object.fromEntries(courierCounts.map((r) => [r.deliveryCompany ?? 'LOCAL_COURIER', r._count]))

    const deliveryTimesMs: number[] = []
    for (const s of shipments) {
      const shipped = s.statusEvents.find((e) => e.status === 'SHIPPED')
      const delivered = s.statusEvents.find((e) => e.status === 'DELIVERED')
      if (shipped && delivered) deliveryTimesMs.push(delivered.createdAt.getTime() - shipped.createdAt.getTime())
    }
    const averageDeliveryTimeHours =
      deliveryTimesMs.length > 0 ? deliveryTimesMs.reduce((a, b) => a + b, 0) / deliveryTimesMs.length / (1000 * 60 * 60) : 0

    return {
      byStatus,
      byCourier,
      failedDeliveries: byStatus.FAILED_DELIVERY ?? 0,
      returnedOrders: byStatus.RETURNED ?? 0,
      averageDeliveryTimeHours,
    }
  })
}
