// Staff-facing shipment lifecycle — deliberately more granular than the
// customer-facing OrderStatus timeline (src/lib/checkout/constants.ts).

export const SHIPPING_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'READY_FOR_SHIPMENT', label: 'Ready for Shipment' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'FAILED_DELIVERY', label: 'Failed Delivery' },
  { value: 'RETURNED', label: 'Returned' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const

export type ShippingStatusValue = (typeof SHIPPING_STATUSES)[number]['value']

export function shippingStatusLabel(status: string): string {
  return SHIPPING_STATUSES.find((s) => s.value === status)?.label ?? status
}

/** Statuses visible to customers as meaningful progress — the rest are staff/internal-only distinctions. */
export const CUSTOMER_FACING_SHIPPING_STATUSES: ShippingStatusValue[] = [
  'PENDING',
  'PREPARING',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'FAILED_DELIVERY',
  'RETURNED',
]
