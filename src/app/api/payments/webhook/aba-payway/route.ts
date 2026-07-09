import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyAndAdvanceOrder } from '@/lib/payment/orchestrate-verification'
import { logPaymentEvent } from '@/lib/payment/monitoring'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'

const PROVIDER = 'ABA_PAYWAY'
const REDACTED_HEADERS = new Set(['authorization', 'cookie', 'x-api-key'])

function headersToJson(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((value, key) => {
    out[key] = REDACTED_HEADERS.has(key.toLowerCase()) ? '[redacted]' : value
  })
  return out
}

/**
 * ABA PayWay callback receiver. Never trusts the payload's own status field —
 * it only uses the callback as a trigger to re-verify with ABA's Check
 * Transaction API via PaymentService.verifyPayment() (through the shared
 * orchestration helper). Every inbound call is stored as a WebhookEvent
 * BEFORE processing is attempted, so the raw delivery is auditable even if
 * processing throws.
 *
 * Idempotency: ABA's tran_id is the provider event id. If we've already
 * PROCESSED a webhook for that tran_id, this call is recorded as DUPLICATE
 * and ignored safely — verifyAndAdvanceOrder is never invoked twice for the
 * same delivered event. verifyPayment() itself is additionally idempotent
 * (a payment already PAID/terminal short-circuits), so even an unseen
 * tran_id that maps to an already-finalized payment can't double-process.
 *
 * TODO before production: ABA signs callbacks — verify that signature here
 * once the exact callback payload/signing scheme is confirmed against a live
 * sandbox callback (not yet observed).
 */
export async function POST(req: Request) {
  // 120 / minute / IP — generous, since ABA's own infra is the caller and
  // legitimate delivery + retry volume is unpredictable, but still bounds
  // worst-case abuse of an unauthenticated public endpoint.
  const { allowed } = rateLimit(`webhook:aba-payway:${clientIp(req)}`, 120, 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  const rawBody = await req.text().catch(() => '')
  const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex')
  const headers = headersToJson(req.headers)

  let body: { tran_id?: string } | null = null
  try {
    body = rawBody ? JSON.parse(rawBody) : null
  } catch {
    body = null
  }
  const tranId = body?.tran_id

  if (!tranId) {
    await db.webhookEvent.create({
      data: {
        provider: PROVIDER,
        payloadHash,
        requestBody: rawBody,
        headers,
        status: 'FAILED',
        errorMessage: 'Callback body did not include tran_id.',
        processedAt: new Date(),
      },
    })
    logPaymentEvent('webhook_failed', { provider: PROVIDER, reason: 'missing tran_id' })
    return NextResponse.json({ error: 'Missing tran_id.' }, { status: 400 })
  }

  // Idempotency check — a tran_id we've already fully processed is a
  // duplicate delivery (providers retry webhooks that didn't get a fast 200).
  const alreadyProcessed = await db.webhookEvent.findFirst({
    where: { provider: PROVIDER, providerEventId: tranId, status: 'PROCESSED' },
  })

  if (alreadyProcessed) {
    await db.webhookEvent.create({
      data: {
        provider: PROVIDER,
        providerEventId: tranId,
        paymentId: alreadyProcessed.paymentId,
        payloadHash,
        requestBody: rawBody,
        headers,
        status: 'DUPLICATE',
        processedAt: new Date(),
      },
    })
    logPaymentEvent('webhook_duplicate', { provider: PROVIDER, providerEventId: tranId })
    return NextResponse.json({ received: true, duplicate: true })
  }

  const payment = await db.payment.findFirst({ where: { providerReference: tranId } })

  if (!payment) {
    await db.webhookEvent.create({
      data: {
        provider: PROVIDER,
        providerEventId: tranId,
        payloadHash,
        requestBody: rawBody,
        headers,
        status: 'FAILED',
        errorMessage: 'No payment found for this tran_id.',
        processedAt: new Date(),
      },
    })
    logPaymentEvent('webhook_failed', { provider: PROVIDER, providerEventId: tranId, reason: 'unknown transaction' })
    return NextResponse.json({ error: 'Unknown transaction.' }, { status: 404 })
  }

  // Stored before processing is attempted — this row is the permanent record
  // that ABA called us, independent of whether verification below succeeds.
  const webhookEvent = await db.webhookEvent.create({
    data: {
      provider: PROVIDER,
      providerEventId: tranId,
      paymentId: payment.id,
      payloadHash,
      requestBody: rawBody,
      headers,
      status: 'RECEIVED',
    },
  })

  logPaymentEvent('webhook_received', { provider: PROVIDER, providerEventId: tranId, paymentId: payment.id })

  try {
    const status = await verifyAndAdvanceOrder(payment.id)
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    })
    return NextResponse.json({ received: true, status })
  } catch (error) {
    await db.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    })
    logPaymentEvent('webhook_failed', { provider: PROVIDER, providerEventId: tranId, paymentId: payment.id, error })
    // 500 so ABA's own delivery retries this callback — safe to retry since
    // the idempotency check above prevents double-processing on redelivery.
    return NextResponse.json({ error: 'Processing failed.' }, { status: 500 })
  }
}
