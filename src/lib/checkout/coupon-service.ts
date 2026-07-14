import { db } from '@/lib/db'
import { computeDiscount, type AppliedCoupon } from './pricing'

export interface CouponValidationResult {
  valid: boolean
  error?: string
  coupon?: AppliedCoupon
  discount?: number
  freeShipping?: boolean
}

/**
 * The one place a coupon code is ever checked against the database.
 * /api/coupons/validate (cart/checkout UI) and /api/orders (order creation)
 * both call this — a code can never be accepted client-side and silently
 * trusted server-side, and a code that expires between "Apply" and
 * "Place order" is caught here too.
 */
export async function validateCoupon(rawCode: string, subtotal: number): Promise<CouponValidationResult> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { valid: false, error: 'Please enter a coupon code.' }

  const row = await db.coupon.findUnique({ where: { code } })
  if (!row) return { valid: false, error: 'Invalid coupon code.' }
  if (!row.active) return { valid: false, error: 'This coupon is no longer active.' }

  const now = new Date()
  if (now < row.startsAt) return { valid: false, error: 'This coupon is not active yet.' }
  if (now > row.expiresAt) return { valid: false, error: 'This coupon has expired.' }

  const coupon: AppliedCoupon = { code: row.code, type: row.type, value: row.value }
  return {
    valid: true,
    coupon,
    discount: computeDiscount(subtotal, coupon),
    freeShipping: row.type === 'FREE_SHIPPING',
  }
}
