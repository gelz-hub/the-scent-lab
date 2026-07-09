import { shippingStatusLabel, CUSTOMER_FACING_SHIPPING_STATUSES, type ShippingStatusValue } from './constants'

export interface TimelineEntry {
  status: string
  createdAt: string
}

interface TimelineInput {
  orderCreatedAt: Date
  paymentConfirmedAt: Date | null
  shipmentStatusEvents: { status: string; createdAt: Date }[]
  /** Staff callers see every recorded status; customers see only the customer-facing subset. */
  audience: 'staff' | 'customer'
}

/**
 * Builds the normalized, chronological timeline consumed by the customer
 * order-tracking UI and (fully) by the admin dashboard. Order and Shipment
 * stay separate models internally — this is purely a read-side projection
 * that merges them into one friendly sequence.
 */
export function buildShipmentTimeline(input: TimelineInput): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    { status: 'Order Placed', createdAt: input.orderCreatedAt.toISOString() },
  ]

  if (input.paymentConfirmedAt) {
    entries.push({ status: 'Payment Confirmed', createdAt: input.paymentConfirmedAt.toISOString() })
  }

  for (const event of input.shipmentStatusEvents) {
    if (input.audience === 'customer' && !CUSTOMER_FACING_SHIPPING_STATUSES.includes(event.status as ShippingStatusValue)) {
      continue
    }
    entries.push({ status: shippingStatusLabel(event.status), createdAt: event.createdAt.toISOString() })
  }

  return entries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
