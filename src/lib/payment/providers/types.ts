// The provider interface — implement this once per payment provider
// (ABA KHQR, ABA PayWay, COD, and future Wing/ACLEDA/Stripe/etc). Checkout
// and PaymentService only ever talk to this interface, never a concrete
// provider — adding a new provider never changes checkout or order logic.

export interface CreatePaymentInput {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  customerEmail: string
  customerName: string
  /** Minutes until this payment attempt expires (see payment/config.ts). */
  timeoutMinutes: number
}

export interface CreatePaymentResult {
  /** The provider's own reference for this attempt (may differ from any later transaction id). */
  providerReference: string
  /** Only set if the provider already assigned a transaction id at creation time (rare — most assign it on completion). */
  providerTransactionId?: string
  /** KHQR/EMV-QR payload string, for providers that return a scannable QR. */
  qrPayload?: string
  /** Data-URL PNG of the QR, if the provider (or our wrapper) rendered one. */
  qrImageDataUrl?: string
  /** Hosted checkout page to redirect the customer to, for redirect-based providers (server-side redirect / GET link). */
  redirectUrl?: string
  /**
   * For providers whose hosted checkout must be reached via the customer's
   * OWN browser submitting a signed HTML form (e.g. ABA PayWay's Purchase
   * API) rather than a server-to-server call or a plain GET redirect.
   * `formFields` includes the hash — never re-derive it client-side.
   */
  formAction?: string
  formFields?: Record<string, string>
  expiresAt: Date
  /** Full raw provider response — never sent to the client, staff-only via PaymentEvent.providerResponse. */
  rawResponse?: unknown
}

export type VerifyPaymentStatus = 'PAID' | 'PENDING' | 'PROCESSING' | 'FAILED' | 'EXPIRED'

export interface VerifyPaymentResult {
  status: VerifyPaymentStatus
  providerTransactionId?: string
  paidAt?: Date
  failureReason?: string
  rawResponse?: unknown
}

export interface PaymentProviderPayment {
  id: string
  providerReference: string | null
  providerTransactionId: string | null
  totalAmount: number
  currency: string
  expiresAt: Date | null
}

export interface PaymentProvider {
  readonly name: string
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
  /** Called by PaymentService.verifyPayment — must call the provider's real verification API, never trust client-supplied status. */
  verifyPayment(payment: PaymentProviderPayment): Promise<VerifyPaymentResult>
}
