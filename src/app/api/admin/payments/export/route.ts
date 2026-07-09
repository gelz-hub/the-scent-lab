import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('payments', action)
  return result.allowed ? result.session : null
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export async function GET(req: Request) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const payments = await db.payment.findMany({
    where: status ? { status: status as never } : undefined,
    include: { order: { select: { orderNumber: true, user: { select: { email: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = [
    'Order Number', 'Customer Email', 'Method', 'Provider', 'Status',
    'Amount', 'Currency', 'Provider Reference', 'Provider Transaction ID',
    'Paid At', 'Created At',
  ]

  const rows = payments.map((p) => [
    p.order.orderNumber,
    p.order.user.email,
    p.method,
    p.provider,
    p.status,
    p.totalAmount.toFixed(2),
    p.currency,
    p.providerReference ?? '',
    p.providerTransactionId ?? '',
    p.paidAt?.toISOString() ?? '',
    p.createdAt.toISOString(),
  ])

  const csv = [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
