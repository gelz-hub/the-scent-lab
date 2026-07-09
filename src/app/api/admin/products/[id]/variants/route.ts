import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createVariant } from '@/lib/inventory/product-service'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('products', action)
  return result.allowed ? result.session : null
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const variants = await db.productVariant.findMany({
    where: { productId: id },
    include: { inventory: true },
    orderBy: { volumeMl: 'asc' },
  })
  return NextResponse.json({ variants })
}

const createSchema = z.object({
  sku: z.string().trim().min(1),
  barcode: z.string().trim().optional(),
  name: z.string().trim().optional(),
  volumeMl: z.number().int().positive().optional(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']).optional(),
  imagePublicId: z.string().optional(),
  imageUrl: z.string().optional(),
  initialStock: z.number().int().nonnegative().optional(),
  safetyStock: z.number().int().nonnegative().optional(),
  reorderLevel: z.number().int().nonnegative().optional(),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid variant.' }, { status: 400 })

  const result = await createVariant({ productId: id, ...parsed.data }).catch((e) => {
    console.error('[admin/products/variants] create failed', e)
    return null
  })
  if (!result) return NextResponse.json({ error: 'A variant with that SKU/barcode already exists.' }, { status: 409 })

  return NextResponse.json(result, { status: 201 })
}
