import { NextResponse } from 'next/server'
import { expireOverduePayments } from '@/lib/payment/payment-service'
import { logPaymentEvent } from '@/lib/payment/monitoring'

/**
 * Background-friendly payment expiration sweep. Intended to be invoked on a
 * schedule (Vercel Cron, a hosted cron service, or any scheduled worker) —
 * see vercel.json for the default 5-minute schedule. Never depends on a
 * customer's browser being open or polling; a payment expires on its own
 * whether or not anyone is looking at it.
 *
 * Protected with CRON_SECRET so this can't be triggered by an arbitrary
 * request — set it in the environment and configure the scheduler to send
 * it as a bearer token.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
    }
  }

  try {
    const result = await expireOverduePayments()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    logPaymentEvent('verification_failed', { reason: 'expiration sweep threw', error })
    return NextResponse.json({ ok: false, error: 'Expiration sweep failed.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return GET(req)
}
