import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'
import { toCsv, csvResponseHeaders } from '@/lib/export/csv'

export async function GET() {
  const { allowed } = await requirePermission('customers', 'read')
  if (!allowed) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const customers = await db.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { name: true, email: true, phone: true, createdAt: true, orders: { select: { total: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['Name', 'Email', 'Phone', 'Order Count', 'Total Spent', 'Joined']
  const rows = customers.map((c) => [
    c.name ?? '',
    c.email,
    c.phone ?? '',
    c.orders.length,
    c.orders.reduce((sum, o) => sum + o.total, 0).toFixed(2),
    c.createdAt.toISOString(),
  ])

  return new NextResponse(toCsv(header, rows), { headers: csvResponseHeaders('customers') })
}
