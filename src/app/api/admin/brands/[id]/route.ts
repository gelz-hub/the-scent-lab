import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateBrand, deleteBrand } from '@/lib/inventory/product-service'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('catalog', action)
  return result.allowed ? result.session : null
}

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  description: z.string().trim().max(2000).optional(),
  logoPublicId: z.string().optional(),
  logoUrl: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'HIDDEN']).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update.' }, { status: 400 })

  const brand = await updateBrand(id, parsed.data).catch(() => null)
  if (!brand) return NextResponse.json({ error: 'Brand not found.' }, { status: 404 })
  return NextResponse.json({ brand })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const deleted = await deleteBrand(id).catch(() => null)
  if (!deleted) {
    return NextResponse.json(
      { error: 'Could not delete brand — it may still be referenced by products.' },
      { status: 409 }
    )
  }
  return NextResponse.json({ success: true })
}
