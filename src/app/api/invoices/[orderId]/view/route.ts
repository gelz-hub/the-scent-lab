import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/rbac/permissions'
import { getInvoiceForOrder, getInvoiceDownloadUrl } from '@/lib/invoice/invoice-service'

/** Same as /download but opens inline (no forced attachment) — used by "View Invoice". */
export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { orderId } = await params
  const order = await db.order.findUnique({ where: { id: orderId }, select: { userId: true } })
  if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  const isStaff = hasPermission(session.user.role, 'invoices', 'read')
  const isOwner = order.userId === session.user.id
  if (!isStaff && !isOwner) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const invoice = await getInvoiceForOrder(orderId)
  if (!invoice || invoice.status !== 'GENERATED' || !invoice.pdfPublicId) {
    return NextResponse.json({ error: 'Invoice is not available yet.' }, { status: 404 })
  }

  return NextResponse.redirect(getInvoiceDownloadUrl(invoice.pdfPublicId))
}
