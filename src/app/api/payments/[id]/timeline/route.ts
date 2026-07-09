import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { buildPaymentTimeline } from '@/lib/payment/timeline'

// Customer-safe payment timeline — a handful of human milestones, never
// provider responses or internal event messages. See src/lib/payment/README.md.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      order: { select: { userId: true, invoice: { select: { generatedAt: true } }, status: true } },
      events: { orderBy: { createdAt: 'asc' }, select: { status: true, createdAt: true } },
    },
  })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
  if (payment.order.userId !== session.user.id && session.user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  const timeline = buildPaymentTimeline({
    paymentStatus: payment.status,
    events: payment.events,
    invoiceGeneratedAt: payment.order.invoice?.generatedAt ?? null,
    orderIsPreparing: payment.order.status !== 'PENDING_PAYMENT',
  })

  return NextResponse.json({ timeline })
}
