import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toCsv, csvResponseHeaders } from '@/lib/export/csv'

export async function GET() {
  const { allowed } = await requirePermission('invoices', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const invoices = await db.invoice.findMany({
    include: { order: { select: { orderNumber: true, total: true, user: { select: { email: true } } } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['Invoice Number', 'Order Number', 'Customer Email', 'Status', 'Total', 'Generated At', 'Created At']
  const rows = invoices.map((i) => [
    i.invoiceNumber,
    i.order.orderNumber,
    i.order.user.email,
    i.status,
    i.order.total.toFixed(2),
    i.generatedAt?.toISOString() ?? '',
    i.createdAt.toISOString(),
  ])

  return new NextResponse(toCsv(header, rows), { headers: csvResponseHeaders('invoices') })
}
