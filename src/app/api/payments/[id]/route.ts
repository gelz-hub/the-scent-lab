import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// Customer-safe status poll — used by the checkout page to refresh payment
// status without a full page reload. Never returns rawResponse, provider
// tokens, or internal event history — see src/lib/payment/README.md.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const payment = await db.payment.findUnique({
    where: { id },
    include: { order: { select: { userId: true, orderNumber: true } } },
  })

  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
  if (payment.order.userId !== session.user.id && session.user.role === 'CUSTOMER') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
  }

  const raw = payment.rawResponse as { qrPayload?: string; qrImageDataUrl?: string; redirectUrl?: string } | null

  return NextResponse.json({
    payment: {
      id: payment.id,
      method: payment.method,
      status: payment.status,
      totalAmount: payment.totalAmount,
      currency: payment.currency,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      qrPayload: payment.status === 'PENDING' ? raw?.qrPayload : undefined,
      qrImageDataUrl: payment.status === 'PENDING' ? raw?.qrImageDataUrl : undefined,
      redirectUrl: payment.status === 'PENDING' ? raw?.redirectUrl : undefined,
    },
  })
}
