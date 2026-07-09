import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/rbac/require-permission'
import { listBrands, createBrand } from '@/lib/inventory/product-service'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('catalog', action)
  return result.allowed ? result.session : null
}

export async function GET() {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  return NextResponse.json({ brands: await listBrands() })
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().max(2000).optional(),
  logoPublicId: z.string().optional(),
  logoUrl: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'HIDDEN']).optional(),
})

export async function POST(req: Request) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid brand.' }, { status: 400 })

  const brand = await createBrand(parsed.data).catch((e) => {
    console.error('[admin/brands] create failed', e)
    return null
  })
  if (!brand) return NextResponse.json({ error: 'A brand with that slug already exists.' }, { status: 409 })

  return NextResponse.json({ brand }, { status: 201 })
}
