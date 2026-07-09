import { NextResponse } from 'next/server'
import { verifyAndAdvanceOrder } from '@/lib/payment/orchestrate-verification'
import { requirePermission } from '@/lib/rbac/require-permission'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('payments', action)
  return result.allowed ? result.session : null
}

// Staff-triggered manual re-verification (e.g. customer says they paid but
// the UI hasn't updated yet). Same idempotent path as the customer poll and
// the webhook — no separate "trust me" override exists.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const status = await verifyAndAdvanceOrder(id)

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'PAYMENT_VERIFICATION',
    resource: 'Payment',
    resourceId: id,
    after: { status },
    ipAddress,
    userAgent,
  })

  return NextResponse.json({ status })
}
