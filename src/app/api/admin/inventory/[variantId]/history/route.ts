import { NextResponse } from 'next/server'
import { getMovementHistory } from '@/lib/inventory/inventory-service'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('inventory', action)
  return result.allowed ? result.session : null
}

/** Full append-only movement history for a variant — staff-only, never exposed to customers. */
export async function GET(_req: Request, { params }: { params: Promise<{ variantId: string }> }) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { variantId } = await params
  const movements = await getMovementHistory(variantId)
  return NextResponse.json({ movements })
}
