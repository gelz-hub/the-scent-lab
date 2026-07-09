// ABA KHQR via the KHQRAPI.com third-party service — generates a real,
// standards-compliant KHQR code and polls their hosted status endpoint.
// Docs: https://khqrapi.com/api-docs — auth via X-API-Key header, secret
// key never exposed to the browser (server-only, read from env).
//
// Note: KHQRAPI's default QR expiry is 5 minutes, but we pass
// input.timeoutMinutes so the generated QR's lifetime matches our
// PAYMENT_TIMEOUT_MINUTES config. expiresAt is computed from our own
// timeout — not from the API response — so that both the QR and our
// expiration logic (verifyPayment, expireOverduePayments) agree.

import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifyPaymentResult,
  PaymentProviderPayment,
} from './types'

const BASE_URL = 'https://www.khqrapi.com/api/v1'

interface GenerateResponse {
  success: boolean
  bill_number: string
  qr_string: string
  qr_image_url: string
  md5: string
  amount: number
  currency: string
  expires_at: string
}

interface StatusResponse {
  success: boolean
  status: 'WAITING' | 'PAID' | 'EXPIRED'
  bill_number: string
  md5: string
  amount: number
  currency: string
  paid_at?: string
  expires_at: string
}

function apiKey(): string | null {
  return process.env.KHQRAPI_SECRET_KEY || null
}

export const khqrapiProvider: PaymentProvider = {
  name: 'ABA_KHQR',

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const key = apiKey()
    if (!key) {
      throw new Error('ABA KHQR is not configured — set KHQRAPI_SECRET_KEY.')
    }

    const res = await fetch(`${BASE_URL}/khqr/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': key,
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        note: `Order ${input.orderNumber}`,
        expiry_minutes: input.timeoutMinutes,
      }),
    })

    const rawResponse = await res.json().catch(() => null)

    if (!res.ok || !rawResponse?.success) {
      throw new Error(
        `KHQR generation failed (status ${res.status}): ${rawResponse?.error || rawResponse?.message || 'unknown error'}`
      )
    }

    const data = rawResponse as GenerateResponse

    // Use our configured timeout as the primary expiration. KHQRAPI's
    // response expires_at is only used as a fallback — the QR itself
    // receives expiry_minutes in the request so both sides should agree.
    const expiresAt =
      input.timeoutMinutes > 0
        ? new Date(Date.now() + input.timeoutMinutes * 60_000)
        : data.expires_at
          ? new Date(data.expires_at)
          : new Date(Date.now() + 15 * 60_000)

    return {
      // md5 is the polling key KHQRAPI expects back on /status — store it as
      // providerReference so verifyPayment can pass it straight through.
      providerReference: data.md5,
      providerTransactionId: data.bill_number,
      qrPayload: data.qr_string,
      qrImageDataUrl: data.qr_image_url,
      expiresAt,
      rawResponse: data,
    }
  },

  async verifyPayment(payment: PaymentProviderPayment): Promise<VerifyPaymentResult> {
    const key = apiKey()
    if (!key || !payment.providerReference) return { status: 'PENDING' }

    const res = await fetch(`${BASE_URL}/khqr/status?md5=${encodeURIComponent(payment.providerReference)}`, {
      headers: { 'X-API-Key': key },
    }).catch((error) => {
      console.error('[payment:khqrapi] verification request failed', { paymentId: payment.id, error })
      return null
    })

    if (!res) return { status: 'PENDING' }

    if (res.status === 404) {
      // Transaction not found yet — treat like still-pending rather than a failure.
      return { status: 'PENDING' }
    }

    if (!res.ok) {
      console.error('[payment:khqrapi] verification returned non-OK status', { paymentId: payment.id, status: res.status })
      return { status: 'PENDING' }
    }

    const data: StatusResponse = await res.json()

    if (data.status === 'PAID') {
      return {
        status: 'PAID',
        providerTransactionId: data.bill_number,
        paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
        rawResponse: data,
      }
    }

    if (data.status === 'EXPIRED') {
      return { status: 'EXPIRED', rawResponse: data }
    }

    return { status: 'PENDING', rawResponse: data }
  },
}
