// Single source of truth for discount math, shared by every surface that
// shows a price (cart drawer, checkout, order-summary, order placement).
// Never recompute a discount inline elsewhere — import from here.

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING'

export interface AppliedCoupon {
  code: string
  type: CouponType
  /** Percent (10 = 10%) for PERCENTAGE, flat USD for FIXED_AMOUNT, unused for FREE_SHIPPING. */
  value: number | null
}

/** Dollar discount off the subtotal. FREE_SHIPPING coupons never discount the subtotal itself — see shippingFeeFor's `freeShipping` option for that. */
export function computeDiscount(subtotal: number, coupon: AppliedCoupon | null): number {
  if (!coupon || subtotal <= 0) return 0
  if (coupon.type === 'PERCENTAGE') {
    return subtotal * Math.min(100, Math.max(0, coupon.value ?? 0)) / 100
  }
  if (coupon.type === 'FIXED_AMOUNT') {
    return Math.min(subtotal, Math.max(0, coupon.value ?? 0))
  }
  return 0
}
