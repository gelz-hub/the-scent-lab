import { emailShell, detailRow, detailTable } from './layout'
import { formatPrice } from '@/lib/format'
import { courierDisplayName } from '@/lib/shipping/couriers'

export interface PaymentConfirmationEmailData {
  orderNumber: string
  orderDate: string
  paymentMethod: string
  paidAmount: number
  shippingAddress: string
  deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
  deliveryCompany: string | null
  items: { name: string; qty: number; price: number }[]
  subtotal: number
  shippingFee: number
  discount: number
  customerName: string
}

export function paymentConfirmationSubject(orderNumber: string) {
  return `Payment Confirmed — The Scent Lab Order ${orderNumber}`
}

export function paymentConfirmationEmail(data: PaymentConfirmationEmailData) {
  const courierLabel =
    data.deliveryMethod === 'LOCAL_COURIER' ? 'Local Courier' : courierDisplayName(data.deliveryCompany)

  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;">${item.name} × ${item.qty}</td>
          <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;text-align:right;">${formatPrice(item.price * item.qty)}</td>
        </tr>`
    )
    .join('')

  const body = `
    <p style="margin:0 0 16px;">Hi ${data.customerName}, thank you for your order — we've received your payment and your fragrances are on their way to being prepared.</p>
    ${detailTable(
      detailRow('Order Number', data.orderNumber) +
        detailRow('Order Date', data.orderDate) +
        detailRow('Payment Method', data.paymentMethod) +
        detailRow('Paid Amount', formatPrice(data.paidAmount)) +
        detailRow('Shipping Address', data.shippingAddress) +
        detailRow('Delivery Company', courierLabel)
    )}
    <p style="margin:20px 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#6B7A73;">Order Summary</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-top:1px solid #E3E0D5;">
      ${detailRow('Subtotal', formatPrice(data.subtotal))}
      ${detailRow('Shipping', data.shippingFee === 0 ? 'Free' : formatPrice(data.shippingFee))}
      ${data.discount > 0 ? detailRow('Discount', `−${formatPrice(data.discount)}`) : ''}
    </table>
    <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;">
      Your invoice is attached to this email as a PDF.
    </p>
  `

  return emailShell({
    preheader: `Your payment for order ${data.orderNumber} was confirmed.`,
    heading: 'Payment Confirmed',
    body,
  })
}
