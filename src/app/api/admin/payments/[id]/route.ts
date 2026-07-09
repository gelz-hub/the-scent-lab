import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('payments', action)
  return result.allowed ? result.session : null
}

// Full detail view for staff, including the append-only event timeline and
// raw provider responses — never exposed to the customer-facing endpoint.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      order: { select: { orderNumber: true, user: { select: { name: true, email: true } } } },
      events: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } },
      refunds: true,
    },
  })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  return NextResponse.json({ payment })
}
