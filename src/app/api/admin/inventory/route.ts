import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LOW_STOCK_THRESHOLD } from '@/lib/inventory/config'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('inventory', action)
  return result.allowed ? result.session : null
}

/** Admin inventory list — every variant with its current stock snapshot, optionally filtered to only low-stock rows. */
export async function GET(req: Request) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const lowStockOnly = searchParams.get('lowStock') === 'true'
  const q = searchParams.get('q')?.trim()

  const variants = await db.productVariant.findMany({
    where: {
      status: { not: 'ARCHIVED' },
      ...(q && {
        OR: [
          { sku: { contains: q } },
          { barcode: { contains: q } },
          { product: { name: { contains: q } } },
        ],
      }),
    },
    include: { inventory: true, product: { select: { id: true, name: true, brand: true, image: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const withSnapshot = variants.map((v) => {
    const inv = v.inventory
    const currentStock = inv?.currentStock ?? 0
    const reservedStock = inv?.reservedStock ?? 0
    const availableStock = currentStock - reservedStock
    const safetyStock = inv?.safetyStock ?? 0
    const reorderLevel = inv?.reorderLevel ?? 0
    const threshold = Math.max(reorderLevel, safetyStock, LOW_STOCK_THRESHOLD)
    return {
      ...v,
      currentStock,
      reservedStock,
      availableStock,
      safetyStock,
      reorderLevel,
      isLowStock: availableStock <= threshold,
    }
  })

  const filtered = lowStockOnly ? withSnapshot.filter((v) => v.isLowStock) : withSnapshot

  return NextResponse.json({ variants: filtered })
}
