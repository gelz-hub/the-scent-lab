import type { ShippingStatusValue } from './constants'

// Forward-progressing lifecycle with a few realistic branches: a failed
// delivery can be retried or returned, and most non-terminal states can be
// cancelled. Terminal states (DELIVERED, RETURNED, CANCELLED) never transition
// out — the history stays permanent (see ShipmentStatusEvent).
export const ALLOWED_SHIPPING_TRANSITIONS: Record<ShippingStatusValue, ShippingStatusValue[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_SHIPMENT', 'CANCELLED'],
  READY_FOR_SHIPMENT: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['IN_TRANSIT', 'FAILED_DELIVERY', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'FAILED_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED_DELIVERY'],
  DELIVERED: [],
  FAILED_DELIVERY: ['OUT_FOR_DELIVERY', 'RETURNED', 'CANCELLED'],
  RETURNED: [],
  CANCELLED: [],
}

export function isValidShippingTransition(from: ShippingStatusValue, to: ShippingStatusValue): boolean {
  if (from === to) return true // idempotent no-op save
  return ALLOWED_SHIPPING_TRANSITIONS[from]?.includes(to) ?? false
}
