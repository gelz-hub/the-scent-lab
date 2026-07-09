// Inventory analytics — read-only against Inventory/InventoryMovement
// (Part 6). Never calls InventoryService's mutating functions
// (reserveStock/commitReservedStock/adjustStock/etc).

import { db } from '@/lib/db'
import { cached } from './cache'
import { listLowStock } from '@/lib/inventory/inventory-service'
import type { DateRange } from './date-ranges'

export async function getInventoryAnalytics(range: DateRange) {
  return cached(`inventory:${range.start.getTime()}:${range.end.getTime()}`, async () => {
    const variants = await db.productVariant.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: { costPrice: true, price: true, inventory: { select: { currentStock: true, reservedStock: true } } },
    })

    const currentInventoryValue = variants.reduce((sum, v) => sum + (v.costPrice ?? v.price) * (v.inventory?.currentStock ?? 0), 0)
    const reservedInventoryValue = variants.reduce((sum, v) => sum + (v.costPrice ?? v.price) * (v.inventory?.reservedStock ?? 0), 0)
    const totalCurrentStock = variants.reduce((sum, v) => sum + (v.inventory?.currentStock ?? 0), 0)

    const [lowStock, movementsInRange, saleMovements] = await Promise.all([
      listLowStock(),
      db.inventoryMovement.groupBy({ by: ['type'], where: { createdAt: { gte: range.start, lte: range.end } }, _count: true }),
      db.inventoryMovement.findMany({ where: { type: 'SALE', createdAt: { gte: range.start, lte: range.end } }, select: { quantity: true } }),
    ])

    const unitsSold = saleMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)
    // Turnover — units sold in the window divided by current total stock, a
    // simple approximation (not a true average-inventory turnover ratio,
    // which would need a stock snapshot at the start of the window too —
    // see README).
    const inventoryTurnover = totalCurrentStock > 0 ? unitsSold / totalCurrentStock : 0

    return {
      currentInventoryValue,
      reservedInventoryValue,
      lowStockCount: lowStock.length,
      movementsByType: Object.fromEntries(movementsInRange.map((m) => [m.type, m._count])),
      unitsSold,
      inventoryTurnover,
    }
  })
}
