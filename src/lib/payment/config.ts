// Centralized payment configuration. No payment business rule (timeout,
// currency, environment selection) is ever hardcoded outside this file.

export type PaymentEnvironment = 'sandbox' | 'production'

/**
 * Sandbox vs. production is an explicit, dedicated switch — never inferred
 * from NODE_ENV (a staging deploy might run NODE_ENV=production against the
 * ABA sandbox on purpose). Defaults to sandbox so a missing env var never
 * accidentally routes real customer payments through untested code.
 */
export function getPaymentEnvironment(): PaymentEnvironment {
  return process.env.PAYMENT_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
}

export const PAYMENT_TIMEOUT_MINUTES = Number(process.env.PAYMENT_TIMEOUT_MINUTES) || 15

/** How many payment attempts (original + retries) are allowed per order. */
export const PAYMENT_RETRY_LIMIT = Number(process.env.PAYMENT_RETRY_LIMIT) || 5

/**
 * How long a webhook callback is still accepted/trusted after the payment it
 * references was created — a callback arriving well outside this window is
 * logged and ignored rather than processed, since it can't be for a payment
 * that's still awaitable. Minutes.
 */
export const WEBHOOK_RETRY_WINDOW_MINUTES = Number(process.env.WEBHOOK_RETRY_WINDOW_MINUTES) || 60

/** How often the customer-facing checkout UI polls /api/payments/[id]/verify. Milliseconds. */
export const PAYMENT_POLL_INTERVAL_MS = Number(process.env.PAYMENT_POLL_INTERVAL_MS) || 4000

/** How often the expiration sweep should run when self-scheduled (see /api/cron/expire-payments). Minutes. */
export const PAYMENT_EXPIRATION_SWEEP_INTERVAL_MINUTES = Number(process.env.PAYMENT_EXPIRATION_SWEEP_INTERVAL_MINUTES) || 5

export const SUPPORTED_CURRENCIES = ['USD', 'KHR'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]
export const DEFAULT_CURRENCY: SupportedCurrency = 'USD'

export const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING',
  'PAID',
  'FAILED',
  'EXPIRED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'CANCELLED',
] as const
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number]

export function paymentStatusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(' ')
}

/** Fully terminal statuses — never transition again (PAID can still move to REFUNDED/PARTIALLY_REFUNDED, so it's not listed here). */
export const TERMINAL_PAYMENT_STATUSES: PaymentStatusValue[] = [
  'FAILED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
]
