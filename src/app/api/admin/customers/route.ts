import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('customers', action)
  return result.allowed ? result.session : null
}

/** Real customer list for staff — id/email/name/phone/order count/total spent. Read-only. */
export async function GET(req: Request) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  const customers = await db.user.findMany({
    where: {
      role: 'CUSTOMER',
      ...(q && { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      orders: { select: { total: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const withStats = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    avatarUrl: c.avatarUrl,
    createdAt: c.createdAt,
    orderCount: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
  }))

  return NextResponse.json({ customers: withStats })
}
