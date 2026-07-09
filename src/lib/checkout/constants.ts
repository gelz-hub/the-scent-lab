// Single source of truth for Cambodia-only checkout config.
// Nothing checkout-related should hardcode these strings elsewhere.
//
// Administrative divisions (provinces/districts) live as data, not code —
// see src/data/cambodia/*.json and src/lib/maps/constants/provinces.ts.

export { CAMBODIA_PROVINCES, districtsFor, type Province } from '@/lib/maps/constants/provinces'

/** Provinces served by local courier (same-day). Everything else falls back to LOGISTICS. */
export const LOCAL_COURIER_PROVINCES: Province[] = ['Phnom Penh']

export const DELIVERY_METHODS = {
  LOCAL_COURIER: { value: 'LOCAL_COURIER', label: 'Local Courier' },
  LOGISTICS: { value: 'LOGISTICS', label: 'Logistics Delivery' },
} as const

export type DeliveryMethodValue = keyof typeof DELIVERY_METHODS

// Customer-facing for province orders (Region B) — the customer's choice is
// respected through fulfillment unless staff has a valid operational reason
// to change it (see ShipmentCourierChange, an append-only audit record).
// Derived from src/lib/shipping/couriers.ts — the single source of courier
// metadata (name, description, logo, tracking URL). Never hardcode a courier
// display string outside that file.
export { ENABLED_COURIERS as LOGISTICS_COMPANIES, getCourier, courierDisplayName } from '@/lib/shipping/couriers'
export type LogisticsCompanyValue = 'JT_EXPRESS' | 'VIREAK_BUNTHAM'

export const DELIVERY_TYPES = [
  { value: 'HOME', label: 'Deliver to My Address' },
  { value: 'OTHER_LOCATION', label: 'Deliver to Another Location' },
] as const

export type DeliveryTypeValue = (typeof DELIVERY_TYPES)[number]['value']

export const PREFERRED_DELIVERY_TIMES = [
  { value: 'MORNING', label: 'Morning' },
  { value: 'AFTERNOON', label: 'Afternoon' },
  { value: 'EVENING', label: 'Evening' },
  { value: 'ANYTIME', label: 'Anytime' },
] as const

export type PreferredDeliveryTimeValue = (typeof PREFERRED_DELIVERY_TIMES)[number]['value']

export const PAYMENT_METHODS = [
  { value: 'ABA_KHQR', label: 'ABA KHQR', description: 'Scan with any banking app', enabled: true },
  { value: 'ABA_PAYWAY', label: 'ABA PayWay', description: 'Pay by card via PayWay', enabled: true },
  { value: 'CREDIT_CARD', label: 'Credit Card', description: 'Visa, Mastercard', enabled: true },
  { value: 'COD', label: 'Cash on Delivery', description: 'Pay when your order arrives', enabled: true },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', description: 'Coming soon', enabled: false },
] as const

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number]['value']

export const ORDER_STATUS_STEPS = [
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment Confirmed' },
  { value: 'PREPARING', label: 'Preparing Order' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
] as const

export type OrderStatusValue = (typeof ORDER_STATUS_STEPS)[number]['value'] | 'CANCELLED'
