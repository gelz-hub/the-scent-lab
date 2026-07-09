import { emailShell, detailRow, detailTable } from './layout'

// Built ahead of schedule per spec (marked "(Future)") — not wired to any
// trigger yet. Ready to call from the DELIVERED shipment-status transition
// once "Review product" has somewhere to link to.

export interface DeliveredEmailData {
  orderNumber: string
  customerName: string
  deliveredAt: string
}

export function deliveredSubject() {
  return 'Your Order Has Been Delivered'
}

export function deliveredEmail(data: DeliveredEmailData) {
  const body = `
    <p style="margin:0 0 16px;">Hi ${data.customerName}, your order has arrived — we hope you love it.</p>
    ${detailTable(detailRow('Order Number', data.orderNumber) + detailRow('Delivered', data.deliveredAt))}
    <p style="margin:20px 0 0;">Thank you for shopping with The Scent Lab.</p>
  `

  return emailShell({
    preheader: `Order ${data.orderNumber} has been delivered.`,
    heading: 'Your Order Has Been Delivered',
    body,
    // ctaLabel: 'Leave a Review', ctaUrl: — wire once product review pages exist.
  })
}
