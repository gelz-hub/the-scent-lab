import type { PaymentProvider, CreatePaymentInput, CreatePaymentResult, VerifyPaymentResult, PaymentProviderPayment } from './types'

/**
 * Cash on Delivery — no external provider, no QR, no redirect. Stays PENDING
 * until a staff member confirms cash was collected (see the COD workflow in
 * src/lib/payment/README.md: Awaiting Payment → Preparing → Delivered → Paid).
 * verifyPayment never auto-completes it; only an explicit staff action does.
 */
export const codProvider: PaymentProvider = {
  name: 'COD',

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    return {
      providerReference: `COD-${input.orderId}`,
      // COD has no real expiry in the "payment link expires" sense — the
      // order itself is cancellable by staff if never fulfilled instead.
      // A far-future placeholder keeps the field non-null without implying
      // a real countdown.
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60_000),
    }
  },

  async verifyPayment(_payment: PaymentProviderPayment): Promise<VerifyPaymentResult> {
    // Never auto-verifies — staff must explicitly mark it paid via the admin
    // action (PaymentService.markCodCollected), which does not go through
    // this provider method at all.
    return { status: 'PENDING' }
  },
}
