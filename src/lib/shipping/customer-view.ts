import { courierDisplayName, getCourier } from '@/lib/shipping/couriers'
import { shippingStatusLabel } from './constants'

interface ShipmentLike {
  deliveryMethod: string
  deliveryCompany: string | null
  estimatedDelivery: string
  actualDeliveryAt: Date | null
  trackingNumber: string | null
  trackingUrl: string | null
  status: string
  customerNotes: string | null
}

/**
 * The one place that decides what a customer is allowed to see about their
 * shipment: selected courier (friendly name), tracking number, a working
 * link to the courier's tracking site, status, estimate, and their notes.
 * Never internal notes, courier-change reasons, branch info, or staff
 * identities — see src/lib/shipping/README.md.
 */
export function buildCustomerShipmentView(shipment: ShipmentLike) {
  // Prefer a shipment-specific tracking URL (staff can paste the exact
  // tracking page); fall back to the courier's generic tracking site.
  const trackingWebsite = shipment.trackingUrl || getCourier(shipment.deliveryCompany)?.trackingWebsite || null

  return {
    deliveryMethod: shipment.deliveryMethod,
    deliveryCompany: shipment.deliveryCompany,
    deliveryCompanyName:
      shipment.deliveryMethod === 'LOCAL_COURIER' ? 'Local Courier' : courierDisplayName(shipment.deliveryCompany),
    estimatedDelivery: shipment.estimatedDelivery,
    actualDeliveryAt: shipment.actualDeliveryAt,
    trackingNumber: shipment.trackingNumber,
    trackingWebsite,
    status: shipment.status,
    statusLabel: shippingStatusLabel(shipment.status),
    customerNotes: shipment.customerNotes,
  }
}
