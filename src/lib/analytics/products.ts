// Product analytics — read-only. Reuses the same (productId, volumeMl) ->
// ProductVariant resolution pattern already used by order-integration.ts
// (Part 6) and the Buy Again endpoint (Part 7), rather than inventing a new
// one. "Most viewed" is intentionally not implemented — see README, no
// server-side view-tracking model exists (Part 7's "recently viewed" is
// client-only/per-device), and this pass doesn't add one.

import { db } from '@/lib/db'
import { cached } from './cache'
import { listLowStock } from '@/lib/inventory/inventory-service'
import type { DateRange } from './date-ranges'

export async function getProductAnalytics(range: DateRange) {
  return cached(`products:${range.start.getTime()}:${range.end.getTime()}`, async () => {
    const paidItems = await db.orderItem.findMany({
      where: { order: { payments: { some: { status: 'PAID', paidAt: { gte: range.start, lte: range.end } } } } },
      select: { productId: true, name: true, ml: true, price: true, qty: true },
    })

    const byProduct = new Map<string, { name: string; qty: number; revenue: number }>()
    const byVariant = new Map<string, { name: string; ml: number; qty: number; revenue: number }>()

    for (const item of paidItems) {
      const p = byProduct.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 }
      p.qty += item.qty
      p.revenue += item.price * item.qty
      byProduct.set(item.productId, p)

      const variantKey = `${item.productId}:${item.ml}`
      const v = byVariant.get(variantKey) ?? { name: item.name, ml: item.ml, qty: 0, revenue: 0 }
      v.qty += item.qty
      v.revenue += item.price * item.qty
      byVariant.set(variantKey, v)
    }

    const bestSelling = [...byProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)

    const bestSellingVariants = [...byVariant.entries()]
      .map(([key, v]) => ({ variantKey: key, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)

    const highestRevenue = [...byProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const [mostWishlisted, lowStock, allActiveVariants] = await Promise.all([
      db.wishlist.groupBy({ by: ['productId'], _count: true, orderBy: { _count: { productId: 'desc' } }, take: 10 }),
      listLowStock(),
      db.productVariant.findMany({
        where: { status: { not: 'ARCHIVED' } },
        include: { inventory: true, product: { select: { name: true } } },
      }),
    ])

    const outOfStock = allActiveVariants.filter((v) => (v.inventory?.currentStock ?? 0) - (v.inventory?.reservedStock ?? 0) <= 0)

    // Slow moving — active variants with zero sales in the selected range.
    const soldProductIds = new Set(byProduct.keys())
    const slowMoving = allActiveVariants
      .filter((v) => !soldProductIds.has(v.productId))
      .slice(0, 20)
      .map((v) => ({ productId: v.productId, name: v.product.name, sku: v.sku }))

    return {
      bestSelling,
      bestSellingVariants,
      highestRevenue,
      mostWishlisted: mostWishlisted.map((w) => ({ productId: w.productId, count: w._count })),
      lowStockCount: lowStock.length,
      lowStock: lowStock.slice(0, 10),
      outOfStockCount: outOfStock.length,
      slowMoving,
    }
  })
}
