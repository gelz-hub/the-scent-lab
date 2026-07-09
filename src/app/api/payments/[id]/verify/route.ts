import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyAndAdvanceOrder } from '@/lib/payment/orchestrate-verification'

// This route is the orchestration layer described in the payment spec:
// CheckoutService -> PaymentService -> InvoiceService -> NotificationService
// -> ShipmentService. PaymentService itself never calls the other services;
// this route observes the verified status and calls them only on PAID.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const payment = await db.payment.findUnique({
    where: { id },
    include: { order: { select: { userId: true } } },
  })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
  if (payment.order.userId !== session.user.id && session.user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  const status = await verifyAndAdvanceOrder(id)
  return NextResponse.json({ status })
}
