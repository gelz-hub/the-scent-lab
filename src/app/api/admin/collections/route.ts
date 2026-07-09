import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listCollections, createCollection } from '@/lib/inventory/product-service'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('catalog', action)
  return result.allowed ? result.session : null
}

export async function GET() {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  return NextResponse.json({ collections: await listCollections() })
}

const createSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().trim().max(2000).optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'HIDDEN']).optional(),
})

export async function POST(req: Request) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid collection.' }, { status: 400 })

  const collection = await createCollection(parsed.data).catch((e) => {
    console.error('[admin/collections] create failed', e)
    return null
  })
  if (!collection) return NextResponse.json({ error: 'A collection with that slug already exists.' }, { status: 409 })

  return NextResponse.json({ collection }, { status: 201 })
}
