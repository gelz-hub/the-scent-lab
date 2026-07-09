import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adjustStock, InsufficientStockError } from '@/lib/inventory/inventory-service'
import { MANUAL_ADJUSTMENT_TYPES } from '@/lib/inventory/config'
import { requirePermission } from '@/lib/rbac/require-permission'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('inventory', action)
  return result.allowed ? result.session : null
}

const adjustSchema = z.object({
  type: z.enum(MANUAL_ADJUSTMENT_TYPES),
  // Signed delta — positive for incoming stock (PURCHASE/RETURN), negative
  // for outgoing (DAMAGE/TRANSFER out); ADJUSTMENT can be either direction.
  quantity: z.number().int().refine((n) => n !== 0, 'Quantity cannot be zero.'),
  reason: z.string().trim().min(1).max(1000),
})

export async function POST(req: Request, { params }: { params: Promise<{ variantId: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { variantId } = await params
  const parsed = adjustSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid adjustment.' }, { status: 400 })

  try {
    const inventory = await adjustStock({
      variantId,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
      staffUserId: session.user.id,
    })

    const { ipAddress, userAgent } = requestMetadata(req)
    await recordAudit({
      userId: session.user.id,
      action: 'INVENTORY_ADJUSTMENT',
      resource: 'Inventory',
      resourceId: variantId,
      after: parsed.data,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ inventory })
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error('[admin/inventory] adjust failed', error)
    return NextResponse.json({ error: 'Could not adjust stock.' }, { status: 500 })
  }
}
