import {
  LOCAL_COURIER_PROVINCES,
  type DeliveryMethodValue,
  type Province,
} from './constants'
import { SHIPPING_FEES, DEFAULT_ESTIMATED_DELIVERY } from '@/lib/shipping/config'

export function resolveDeliveryMethod(province: string): DeliveryMethodValue {
  return LOCAL_COURIER_PROVINCES.includes(province as Province) ? 'LOCAL_COURIER' : 'LOGISTICS'
}

export function isLocalCourier(province: string): boolean {
  return resolveDeliveryMethod(province) === 'LOCAL_COURIER'
}

export function estimatedDeliveryFor(province: string): string {
  return DEFAULT_ESTIMATED_DELIVERY[resolveDeliveryMethod(province)]
}

/** Shipping fee in USD, honoring the local-courier free-shipping threshold. Never hardcode fees outside src/lib/shipping/config.ts. */
export function shippingFeeFor(province: string, subtotal = 0): number {
  const method = resolveDeliveryMethod(province)
  if (method === 'LOCAL_COURIER') {
    const { baseFee, freeShippingThreshold } = SHIPPING_FEES.LOCAL_COURIER
    return subtotal >= freeShippingThreshold ? 0 : baseFee
  }
  return SHIPPING_FEES.LOGISTICS.baseFee
}
