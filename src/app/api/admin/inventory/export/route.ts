import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toCsv, csvResponseHeaders } from '@/lib/export/csv'

export async function GET() {
  const { allowed } = await requirePermission('inventory', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const variants = await db.productVariant.findMany({
    where: { status: { not: 'ARCHIVED' } },
    include: { inventory: true, product: { select: { name: true, brand: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['Product', 'Brand', 'SKU', 'Price', 'Current Stock', 'Reserved Stock', 'Available Stock', 'Safety Stock', 'Reorder Level']
  const rows = variants.map((v) => {
    const current = v.inventory?.currentStock ?? 0
    const reserved = v.inventory?.reservedStock ?? 0
    return [
      v.product.name,
      v.product.brand,
      v.sku,
      v.price.toFixed(2),
      current,
      reserved,
      current - reserved,
      v.inventory?.safetyStock ?? 0,
      v.inventory?.reorderLevel ?? 0,
    ]
  })

  return new NextResponse(toCsv(header, rows), { headers: csvResponseHeaders('inventory') })
}
