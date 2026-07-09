import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { createRetryPayment } from '@/lib/payment/payment-service'

/**
 * Customer-triggered retry after a payment expired or failed. Never creates
 * a new Order — always a new Payment row against the same order (see
 * src/lib/payment/README.md, "Payment Retry"). The expired/failed Payment
 * stays exactly as it is, permanently, as one entry in the order's payment
 * history.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      order: {
        include: { address: true, user: { select: { email: true, name: true } } },
      },
    },
  })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
  if (payment.order.userId !== session.user.id && session.user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const method = typeof body?.method === 'string' ? body.method : payment.method

  try {
    const result = await createRetryPayment(
      {
        id: payment.order.id,
        orderNumber: payment.order.orderNumber,
        subtotal: payment.order.subtotal,
        discount: payment.order.discount,
        shippingFee: payment.order.shippingFee,
        total: payment.order.total,
        user: payment.order.user,
        address: payment.order.address ? { recipientName: payment.order.address.recipientName } : null,
      },
      method
    )
    return NextResponse.json({ payment: result })
  } catch (error) {
    // createRetryPayment can rethrow a raw provider error alongside its own
    // intentional, user-safe "retry limit reached" message — never forward
    // an unknown error's message to the client, only log it server-side.
    console.error('[payment] retry failed', { paymentId: payment.id, error })
    const message =
      error instanceof Error && error.message.includes('maximum number of payment attempts')
        ? error.message
        : 'Unable to start a new payment attempt. Please contact support.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
