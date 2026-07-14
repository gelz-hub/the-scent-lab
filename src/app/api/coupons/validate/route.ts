import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validateCoupon } from '@/lib/checkout/coupon-service'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'

const bodySchema = z.object({
  code: z.string().trim().min(1),
  subtotal: z.number().nonnegative(),
})

// Public (guests need coupon feedback in the cart drawer before signing in),
// so it's rate-limited per IP to make brute-forcing codes impractical.
export async function POST(req: Request) {
  const { allowed } = await rateLimit(`coupon-validate:${clientIp(req)}`, 20, 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ valid: false, error: 'Too many attempts. Please wait a moment and try again.' }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: 'Invalid request.' }, { status: 400 })
  }

  const result = await validateCoupon(parsed.data.code, parsed.data.subtotal)
  return NextResponse.json(result)
}
