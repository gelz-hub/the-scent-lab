// ABA PayWay provider — hosted checkout (KHQR, Visa, Mastercard, and any
// future method ABA exposes through the same "Purchase" API). One shared
// implementation parameterized by environment config, so switching sandbox
// -> production is an env var change, never a code change (per spec).
//
// Integration pattern, confirmed against a live ABA PayWay Sandbox
// transaction (see src/lib/payment/README.md, "ABA PayWay smoke test"): the
// Purchase API IS called server-to-server, as `multipart/form-data`
// (required — `application/x-www-form-urlencoded` and a wrong hash field
// order both get rejected). For this merchant's configuration it responds
// with 200 JSON containing a ready-to-use KHQR (`qrString`/`qrImage`) rather
// than redirecting to a hosted card-entry page — so createPayment renders
// that QR directly, the same shape the ABA KHQR / KHQRAPI providers already
// use. `tran_id` must be <= 20 characters and must not contain "#" (our
// order numbers are prefixed with it) — ABA rejects both with a 400.

import crypto from 'crypto'
import { getPaymentEnvironment } from '../config'
import type {
  PaymentProvider,
  CreatePaymentInput,
  CreatePaymentResult,
  VerifyPaymentResult,
  PaymentProviderPayment,
} from './types'

interface PayWayEnvConfig {
  merchantId: string
  apiKey: string
  purchaseUrl: string
  checkTransactionUrl: string
}

function loadConfig(): PayWayEnvConfig | null {
  const env = getPaymentEnvironment()
  const prefix = env === 'production' ? 'PAYWAY_PRODUCTION' : 'PAYWAY_SANDBOX'

  const merchantId = process.env[`${prefix}_MERCHANT_ID`]
  const apiKey = process.env[`${prefix}_API_KEY`]
  const purchaseUrl = process.env[`${prefix}_API_URL`]

  if (!merchantId || !apiKey || !purchaseUrl) return null
  return {
    merchantId,
    apiKey,
    purchaseUrl,
    // Documented sibling endpoint of the Purchase URL — same host/base path.
    checkTransactionUrl: purchaseUrl.replace('/purchase', '/check-transaction-2'),
  }
}

function reqTime(): string {
  // YYYYMMDDHHmmss in UTC, per ABA's documented format.
  return new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
}

function sign(fields: string, apiKey: string): string {
  return crypto.createHmac('sha512', apiKey).update(fields).digest('base64')
}

export const abaPayWayProvider: PaymentProvider = {
  name: 'ABA_PAYWAY',

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const config = loadConfig()
    if (!config) {
      const env = getPaymentEnvironment()
      throw new Error(
        `ABA PayWay (${env}) is not configured — set PAYWAY_${env.toUpperCase()}_MERCHANT_ID, _API_KEY, and _API_URL.`
      )
    }

    const expiresAt = new Date(Date.now() + input.timeoutMinutes * 60_000)
    const time = reqTime()
    // ABA caps tran_id at 20 characters and rejects "#" (our own order
    // numbers are prefixed with it) — a short, opaque, sufficiently-unique
    // id instead. providerReference (this value) is what verifyPayment and
    // the webhook use to look the payment back up, so it only needs to be
    // unique, not human-readable — the order number is already on the
    // Payment row for that purpose.
    const tranId = `T${Date.now().toString(36)}${crypto.randomBytes(3).toString('hex')}`.slice(0, 20)
    const amount = input.amount.toFixed(2)
    const [firstName, ...rest] = input.customerName.split(' ')
    const lastName = rest.join(' ') || firstName

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = Buffer.from(`${appBaseUrl}/api/payments/webhook/aba-payway`).toString('base64')
    const continueSuccessUrl = `${appBaseUrl}/checkout/payment-complete?order=${input.orderId}`

    // Hash fields are concatenated in ABA's fixed canonical order:
    // req_time, merchant_id, tran_id, amount, items, shipping, firstname,
    // lastname, email, phone, type, payment_option, return_url, cancel_url,
    // continue_success_url, return_deeplink, currency, custom_fields,
    // return_params, payout, lifetime, additional_params, google_pay_token,
    // skip_success_page — fields we don't send are omitted entirely (not
    // replaced with an empty placeholder), per ABA's docs: "developers may
    // choose to skip optional parameters that are not relevant."
    const signaturePayload =
      time +
      config.merchantId +
      tranId +
      amount +
      firstName +
      lastName +
      input.customerEmail +
      'purchase' +
      returnUrl +
      continueSuccessUrl +
      input.currency

    const hash = sign(signaturePayload, config.apiKey)

    const formData = new FormData()
    formData.set('req_time', time)
    formData.set('merchant_id', config.merchantId)
    formData.set('tran_id', tranId)
    formData.set('amount', amount)
    formData.set('firstname', firstName)
    formData.set('lastname', lastName)
    formData.set('email', input.customerEmail)
    formData.set('currency', input.currency)
    formData.set('type', 'purchase')
    formData.set('return_url', returnUrl)
    formData.set('continue_success_url', continueSuccessUrl)
    formData.set('hash', hash)

    let response: Response
    try {
      response = await fetch(config.purchaseUrl, { method: 'POST', body: formData })
    } catch (error) {
      throw new Error(`ABA PayWay request failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    const rawResponse = await response.json().catch(() => null)

    if (!response.ok || !rawResponse || rawResponse.status?.code !== '00') {
      throw new Error(
        `ABA PayWay rejected the payment request (status ${response.status}): ${rawResponse?.status?.message || rawResponse?.description || 'unknown error'}`
      )
    }

    return {
      providerReference: tranId,
      // This merchant configuration returns a KHQR directly; a future
      // payment_option (e.g. card-only) that instead returns a redirect page
      // would populate `redirectUrl`/`formAction` here without any change to
      // PaymentService or checkout — see CreatePaymentResult in ./types.ts.
      qrPayload: rawResponse.qrString,
      qrImageDataUrl: rawResponse.qrImage,
      expiresAt,
      rawResponse,
    }
  },

  /**
   * Real-time verification against ABA's Check Transaction API
   * (application/json, hash = HMAC(req_time + merchant_id + tran_id)). Also
   * the shape a webhook handler reuses (see /api/payments/webhook/aba-payway
   * — same signature-checking principle applies there).
   */
  async verifyPayment(payment: PaymentProviderPayment): Promise<VerifyPaymentResult> {
    const config = loadConfig()
    if (!config || !payment.providerReference) return { status: 'PENDING' }

    const time = reqTime()
    const signaturePayload = time + config.merchantId + payment.providerReference
    const hash = sign(signaturePayload, config.apiKey)

    const res = await fetch(config.checkTransactionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        req_time: time,
        merchant_id: config.merchantId,
        tran_id: payment.providerReference,
        hash,
      }),
    }).catch((error) => {
      console.error('[payment:aba-payway] verification request failed', { paymentId: payment.id, error })
      return null
    })

    if (!res) return { status: 'PENDING' }

    const data = await res.json().catch(() => null)
    if (!data) return { status: 'PENDING' }

    // status.code "00" (string) = the check-transaction call itself
    // succeeded — it says nothing about the payment outcome. "6" = the
    // transaction doesn't exist on ABA's side yet (customer hasn't
    // completed/submitted the hosted checkout form) — treat as PENDING, not
    // a failure. Any other non-"00" code (5 invalid hash, 8 invalid
    // merchant, 11 internal error, 429 rate limit) is also non-fatal here —
    // surfaced as PENDING so the next poll/webhook retries rather than
    // permanently failing the payment on a transient API error.
    if (data.status?.code !== '00') {
      if (data.status?.code !== 6) {
        console.error('[payment:aba-payway] check-transaction returned an error', {
          paymentId: payment.id,
          code: data.status?.code,
          message: data.status?.message,
        })
      }
      if (payment.expiresAt && payment.expiresAt.getTime() < Date.now()) return { status: 'EXPIRED' }
      return { status: 'PENDING', rawResponse: data }
    }

    const paymentStatus: string | undefined = data.data?.payment_status

    if (paymentStatus === 'APPROVED' || paymentStatus === 'PRE-AUTH') {
      return {
        status: 'PAID',
        providerTransactionId: data.status?.tran_id || payment.providerReference,
        paidAt: data.data?.transaction_date ? new Date(data.data.transaction_date) : new Date(),
        rawResponse: data,
      }
    }

    if (paymentStatus === 'DECLINED') {
      return { status: 'FAILED', failureReason: 'Payment was declined.', rawResponse: data }
    }

    if (paymentStatus === 'CANCELLED') {
      return { status: 'FAILED', failureReason: 'Payment was cancelled.', rawResponse: data }
    }

    // PENDING (awaiting customer completion) or an unrecognized future status.
    if (payment.expiresAt && payment.expiresAt.getTime() < Date.now()) return { status: 'EXPIRED' }
    return { status: 'PENDING', rawResponse: data }
  },
}
