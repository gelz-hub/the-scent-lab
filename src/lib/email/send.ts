import { getResendClient, isEmailConfigured, FROM_EMAIL } from './resend'
import { paymentConfirmationSubject, paymentConfirmationEmail } from './templates/payment-confirmation'
import { shipmentConfirmationSubject, shipmentConfirmationEmail } from './templates/shipment-confirmation'
import { deliveredSubject, deliveredEmail } from './templates/delivered'
import { getInvoiceForOrder, getInvoiceDownloadUrl } from '@/lib/invoice/invoice-service'
import { buildCustomerShipmentView } from '@/lib/shipping/customer-view'

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ABA_KHQR: 'KHQR',
  ABA_PAYWAY: 'ABA PayWay',
  CREDIT_CARD: 'Credit Card',
  COD: 'Cash on Delivery',
  BANK_TRANSFER: 'Bank Transfer',
}

interface OrderForEmail {
  id: string
  orderNumber: string
  createdAt: Date
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  items: { name: string; qty: number; price: number }[]
  address: {
    recipientName: string
    phone: string
    email: string | null
    houseNumber: string | null
    streetAddress: string
    village: string | null
    commune: string | null
    district: string
    province: string
    deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
    deliveryCompany: string | null
  } | null
  payment: { method: string; status: string } | null
  user: { email: string; name: string | null }
}

/** Payment Confirmation — sent immediately once an order is placed, with the PDF invoice attached. */
export async function sendPaymentConfirmationEmail(order: OrderForEmail) {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not configured — skipping payment confirmation email', { orderId: order.id })
    return
  }
  const resend = getResendClient()
  if (!resend || !order.address) return

  const recipientEmail = order.address.email || order.user.email
  const shippingAddress = [
    order.address.houseNumber,
    order.address.streetAddress,
    order.address.village,
    order.address.commune,
    order.address.district,
    order.address.province,
  ]
    .filter(Boolean)
    .join(', ')

  const html = paymentConfirmationEmail({
    orderNumber: order.orderNumber,
    orderDate: order.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    paymentMethod: order.payment ? PAYMENT_METHOD_LABELS[order.payment.method] ?? order.payment.method : '—',
    paidAmount: order.total,
    shippingAddress,
    deliveryMethod: order.address.deliveryMethod,
    deliveryCompany: order.address.deliveryCompany,
    items: order.items,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    customerName: order.address.recipientName || order.user.name || 'there',
  })

  // Reuse the invoice InvoiceService already generated and stored — never
  // regenerate the PDF here. If it's not ready yet (e.g. InvoiceService is
  // still running, or generation failed), send the email without an
  // attachment rather than producing a second, differently-numbered PDF.
  const invoice = await getInvoiceForOrder(order.id)
  let attachments: { filename: string; content: Buffer }[] = []
  if (invoice && invoice.status === 'GENERATED' && invoice.pdfPublicId) {
    try {
      const pdfResponse = await fetch(getInvoiceDownloadUrl(invoice.pdfPublicId))
      if (pdfResponse.ok) {
        const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer())
        attachments = [{ filename: `${invoice.invoiceNumber}.pdf`, content: pdfBuffer }]
      }
    } catch (error) {
      console.error('[email] failed to fetch stored invoice PDF for attachment', { orderId: order.id, error })
    }
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: paymentConfirmationSubject(order.orderNumber),
      html,
      attachments,
    })
  } catch (error) {
    console.error('[email] failed to send payment confirmation', { orderId: order.id, error })
  }
}

interface ShipmentForEmail {
  deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
  deliveryCompany: string | null
  estimatedDelivery: string
  actualDeliveryAt: Date | null
  trackingNumber: string | null
  trackingUrl: string | null
  status: string
  customerNotes: string | null
}

/** Shipment Confirmation — sent when a shipment's status transitions to SHIPPED. */
export async function sendShipmentConfirmationEmail(
  order: { orderNumber: string; address: { recipientName: string } | null; user: { email: string; name: string | null } },
  shipment: ShipmentForEmail
) {
  if (!isEmailConfigured) {
    console.warn('[email] RESEND_API_KEY not configured — skipping shipment confirmation email', { orderNumber: order.orderNumber })
    return
  }
  const resend = getResendClient()
  if (!resend) return

  const recipientEmail = order.user.email
  const view = buildCustomerShipmentView(shipment)

  const html = shipmentConfirmationEmail({
    orderNumber: order.orderNumber,
    customerName: order.address?.recipientName || order.user.name || 'there',
    deliveryMethod: view.deliveryMethod as 'LOCAL_COURIER' | 'LOGISTICS',
    deliveryCompany: view.deliveryCompany,
    trackingNumber: view.trackingNumber,
    estimatedDelivery: view.estimatedDelivery,
    trackingWebsite: view.trackingWebsite,
  })

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: shipmentConfirmationSubject(),
      html,
    })
  } catch (error) {
    console.error('[email] failed to send shipment confirmation', { orderNumber: order.orderNumber, error })
  }
}

/**
 * Delivered — built per spec but marked "(Future)"; not called from any
 * trigger yet. Kept here, ready to wire into the DELIVERED status
 * transition once a review-product destination exists.
 */
export async function sendDeliveredEmail(
  order: { orderNumber: string; address: { recipientName: string } | null; user: { email: string; name: string | null } },
  deliveredAt: Date
) {
  if (!isEmailConfigured) return
  const resend = getResendClient()
  if (!resend) return

  const html = deliveredEmail({
    orderNumber: order.orderNumber,
    customerName: order.address?.recipientName || order.user.name || 'there',
    deliveredAt: deliveredAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  })

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: order.user.email,
      subject: deliveredSubject(),
      html,
    })
  } catch (error) {
    console.error('[email] failed to send delivered email', { orderNumber: order.orderNumber, error })
  }
}
