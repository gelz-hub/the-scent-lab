import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { markCodCollected } from '@/lib/payment/payment-service'
import { generateAndStoreInvoice } from '@/lib/invoice/invoice-service'
import { notifyPaymentConfirmed } from '@/lib/notification-center/service'
import { reserveStockForOrder } from '@/lib/inventory/order-integration'
import { requirePermission } from '@/lib/rbac/require-permission'
import { recordAudit, requestMetadata } from '@/lib/audit/audit-service'

async function requireStaff(action: 'read' | 'write' = 'write') {
  const result = await requirePermission('payments', action)
  return result.allowed ? result.session : null
}

// Staff confirms cash was collected on delivery. This is the only path a COD
// payment can ever reach PAID through — never automatic.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const { id } = await params
  const payment = await db.payment.findUnique({ where: { id } })
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })

  const wasAlreadyPaid = payment.status === 'PAID'
  const status = await markCodCollected(id, session.user.id)

  const { ipAddress, userAgent } = requestMetadata(req)
  await recordAudit({
    userId: session.user.id,
    action: 'PAYMENT_VERIFICATION',
    resource: 'Payment',
    resourceId: id,
    before: { status: payment.status },
    after: { status },
    ipAddress,
    userAgent,
  })

  if (status === 'PAID' && !wasAlreadyPaid) {
    try {
      const order = await db.order.findUnique({
        where: { id: payment.orderId },
        include: {
          items: true,
          address: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          user: { select: { email: true, name: true } },
        },
      })
      if (order) {
        const invoice = await generateAndStoreInvoice({ ...order, payment: order.payments[0] ?? null })
        await notifyPaymentConfirmed(order.userId, order.orderNumber, invoice?.invoiceNumber ?? null)
      }
    } catch (error) {
      console.error('[payment] post-COD-collection invoice/notification flow failed', { paymentId: id, error })
    }

    // Part 6 addition — same as the orchestrate-verification.ts path: COD
    // confirmation is the other way a payment can newly become PAID, and
    // must reserve stock too. Independent try/catch, never blocks this route.
    try {
      await reserveStockForOrder(payment.orderId)
    } catch (error) {
      console.error('[inventory] post-COD-collection stock reservation failed', { paymentId: id, error })
    }
  }

  return NextResponse.json({ status })
}
