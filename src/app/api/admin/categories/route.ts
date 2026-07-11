import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listCategories, createCategory } from '@/lib/inventory/product-service'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('catalog', action)
  return result.allowed ? result.session : null
}

export async function GET() {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  return NextResponse.json({ categories: await listCategories() })
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'HIDDEN']).optional(),
})

export async function POST(req: Request) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid category.' }, { status: 400 })

  const category = await createCategory(parsed.data).catch((e) => {
    console.error('[admin/categories] create failed', e)
    return null
  })
  if (!category) return NextResponse.json({ error: 'A category with that slug already exists.' }, { status: 409 })

  return NextResponse.json({ category }, { status: 201 })
}
