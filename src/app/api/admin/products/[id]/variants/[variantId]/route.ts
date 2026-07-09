import { NextResponse } from 'next/server'
import { z } from 'zod'
import { updateVariant, archiveVariant } from '@/lib/inventory/product-service'
import { requirePermission } from '@/lib/rbac/require-permission'
import { logger } from '@/lib/logging/logger'

// archiveVariant's only intentional, user-safe thrown message — anything
// else (an unexpected DB error) is logged server-side and replaced with a
// generic message before it reaches the client.
function archiveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.includes('only remaining variant')) return error.message
  logger.error('api', 'variant_archive_failed', { error })
  return 'Could not archive variant.'
}

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('products', action)
  return result.allowed ? result.session : null
}

const updateSchema = z.object({
  sku: z.string().trim().min(1).optional(),
  barcode: z.string().trim().optional(),
  name: z.string().trim().optional(),
  volumeMl: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  costPrice: z.number().nonnegative().optional(),
  weight: z.number().nonnegative().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED']).optional(),
  imagePublicId: z.string().optional(),
  imageUrl: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { variantId } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update.' }, { status: 400 })

  // Setting status to ARCHIVED must go through the guarded archiveVariant()
  // path (refuses to archive a product's last remaining variant) — never
  // apply it as a plain field update, which would bypass that check.
  if (parsed.data.status === 'ARCHIVED') {
    try {
      const variant = await archiveVariant(variantId)
      return NextResponse.json({ variant })
    } catch (error) {
      return NextResponse.json({ error: archiveErrorMessage(error) }, { status: 409 })
    }
  }

  const variant = await updateVariant(variantId, parsed.data).catch(() => null)
  if (!variant) return NextResponse.json({ error: 'Variant not found.' }, { status: 404 })
  return NextResponse.json({ variant })
}

/** Variants are never physically deleted (see product-service.ts) — this archives instead. Refuses to archive a product's last remaining variant (every product must have at least one). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { variantId } = await params
  try {
    const variant = await archiveVariant(variantId)
    return NextResponse.json({ variant })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not archive variant.' }, { status: 409 })
  }
}
