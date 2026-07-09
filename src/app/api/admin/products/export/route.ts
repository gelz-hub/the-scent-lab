import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toCsv, csvResponseHeaders } from '@/lib/export/csv'

export async function GET() {
  const { allowed } = await requirePermission('products', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const products = await db.product.findMany({
    where: { deletedAt: null },
    include: { variants: { select: { sku: true, price: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['Name', 'Brand', 'Category', 'Status', 'Visibility', 'Variant Count', 'SKUs', 'Created At']
  const rows = products.map((p) => [
    p.name,
    p.brand,
    p.category,
    p.status,
    p.visibility,
    p.variants.length,
    p.variants.map((v) => v.sku).join('; '),
    p.createdAt.toISOString(),
  ])

  return new NextResponse(toCsv(header, rows), { headers: csvResponseHeaders('products') })
}
