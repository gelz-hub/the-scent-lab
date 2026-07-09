import { db } from '@/lib/db'
import { verifyPayment } from './payment-service'
import { generateAndStoreInvoice } from '@/lib/invoice/invoice-service'
import { notifyPaymentConfirmed } from '@/lib/notification-center/service'
import { reserveStockForOrder } from '@/lib/inventory/order-integration'
import type { PaymentStatus } from '@prisma/client'

/**
 * Shared orchestration used by both the customer-facing verify endpoint and
 * the ABA PayWay webhook receiver: verify with the provider, and only on a
 * fresh transition into PAID, move the order forward and call
 * InvoiceService/NotificationService. This function is NOT part of
 * PaymentService — it composes services together, which PaymentService is
 * never allowed to do itself.
 */
export async function verifyAndAdvanceOrder(paymentId: string): Promise<PaymentStatus> {
  const before = await db.payment.findUnique({ where: { id: paymentId }, select: { status: true, orderId: true } })
  if (!before) throw new Error('Payment not found.')

  const wasAlreadyPaid = before.status === 'PAID'
  const status = await verifyPayment(paymentId)

  if (status === 'PAID' && !wasAlreadyPaid) {
    try {
      const order = await db.order.findUnique({
        where: { id: before.orderId },
        include: {
          items: true,
          address: true,
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          user: { select: { email: true, name: true } },
        },
      })
      if (order) {
        await db.order.update({ where: { id: order.id }, data: { status: 'PREPARING' } })
        const invoice = await generateAndStoreInvoice({ ...order, payment: order.payments[0] ?? null })
        await notifyPaymentConfirmed(order.userId, order.orderNumber, invoice?.invoiceNumber ?? null)
      }
    } catch (error) {
      console.error('[payment] post-verification invoice/notification flow failed', { paymentId, error })
    }

    // Part 6 addition — reserving stock is independent of invoice/
    // notification generation (its own try/catch, own service), so a stock
    // shortfall or InventoryService error can never affect payment/invoice/
    // notification, exactly like the independence InvoiceService and
    // NotificationService already have from each other and from PaymentService.
    try {
      await reserveStockForOrder(before.orderId)
    } catch (error) {
      console.error('[inventory] post-verification stock reservation failed', { paymentId, error })
    }
  }

  return status
}
