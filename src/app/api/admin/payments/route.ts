import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { requirePermission } from '@/lib/rbac/require-permission'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('payments', action)
  return result.allowed ? result.session : null
}

// Admin/staff payment list — search + filter, full provider-facing detail
// (unlike the customer-safe /api/payments/[id] view).
export async function GET(req: Request) {
  const session = await requireStaff('read')
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const method = searchParams.get('method')
  const q = searchParams.get('q')?.trim()

  const where: Prisma.PaymentWhereInput = {
    ...(status && { status: status as never }),
    ...(method && { method: method as never }),
    ...(q && {
      OR: [
        { providerReference: { contains: q } },
        { providerTransactionId: { contains: q } },
        { order: { orderNumber: { contains: q } } },
        { order: { user: { email: { contains: q } } } },
      ],
    }),
  }

  const payments = await db.payment.findMany({
    where,
    include: {
      order: { select: { orderNumber: true, user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ payments })
}
