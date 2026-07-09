import { emailShell, detailRow, detailTable } from './layout'
import { courierDisplayName } from '@/lib/shipping/couriers'

export interface ShipmentConfirmationEmailData {
  orderNumber: string
  customerName: string
  deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
  deliveryCompany: string | null
  trackingNumber: string | null
  estimatedDelivery: string
  trackingWebsite: string | null
}

export function shipmentConfirmationSubject() {
  return 'Your Order Has Been Shipped'
}

export function shipmentConfirmationEmail(data: ShipmentConfirmationEmailData) {
  const courierLabel =
    data.deliveryMethod === 'LOCAL_COURIER' ? 'Local Courier' : courierDisplayName(data.deliveryCompany)

  const body = `
    <p style="margin:0 0 16px;">Hi ${data.customerName}, your order is on its way!</p>
    ${detailTable(
      detailRow('Order Number', data.orderNumber) +
        detailRow('Delivery Company', courierLabel) +
        detailRow('Tracking Number', data.trackingNumber || 'Will be added soon') +
        detailRow('Estimated Delivery', data.estimatedDelivery)
    )}
  `

  return emailShell({
    preheader: `Order ${data.orderNumber} has shipped via ${courierLabel}.`,
    heading: 'Your Order Has Been Shipped',
    body,
    ctaLabel: data.trackingWebsite ? 'Track Shipment' : undefined,
    ctaUrl: data.trackingWebsite ?? undefined,
  })
}
