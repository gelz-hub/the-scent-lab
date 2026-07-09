import type { PaymentProvider } from './types'
import { codProvider } from './cod-provider'
import { khqrapiProvider } from './khqrapi-provider'
import { abaPayWayProvider } from './aba-payway-provider'

export type { PaymentProvider } from './types'

/**
 * Single switch point mapping a checkout PaymentMethod to its concrete
 * provider. Adding Wing/ACLEDA/Stripe/etc. later means implementing
 * PaymentProvider in a sibling file and adding one line here — checkout,
 * PaymentService, and every API route stay unchanged.
 */
export function getPaymentProvider(method: string): PaymentProvider {
  switch (method) {
    case 'ABA_KHQR':
      return khqrapiProvider
    case 'ABA_PAYWAY':
    case 'CREDIT_CARD':
      return abaPayWayProvider
    case 'COD':
      return codProvider
    default:
      throw new Error(`No payment provider registered for method "${method}".`)
  }
}
