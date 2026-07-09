import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument, type InvoiceData } from './InvoiceDocument'
import { formatPrice } from '@/lib/format'
import { courierDisplayName } from '@/lib/shipping/couriers'

interface OrderForInvoice {
  id: string
  orderNumber: string
  createdAt: Date
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  items: { name: string; qty: number; price: number }[]
  address: {
    recipientName: string
    phone: string
    email: string | null
    houseNumber: string | null
    streetAddress: string
    village: string | null
    commune: string | null
    district: string
    province: string
    deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
    deliveryCompany: string | null
  } | null
  payment: { method: string; status: string } | null
  user: { email: string }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ABA_KHQR: 'ABA KHQR',
  ABA_PAYWAY: 'ABA PayWay',
  CREDIT_CARD: 'Credit Card',
  COD: 'Cash on Delivery',
  BANK_TRANSFER: 'Bank Transfer',
}

export function buildInvoiceData(order: OrderForInvoice, invoiceNumber: string): InvoiceData {
  const address = order.address
  const shippingAddress = address
    ? [address.houseNumber, address.streetAddress, address.village, address.commune, address.district, address.province]
        .filter(Boolean)
        .join(', ')
    : '—'

  return {
    invoiceNumber,
    orderNumber: order.orderNumber,
    date: order.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    customerName: address?.recipientName ?? order.user.email,
    phone: address?.phone ?? '—',
    email: address?.email || order.user.email,
    shippingAddress,
    paymentMethod: order.payment ? PAYMENT_METHOD_LABELS[order.payment.method] ?? order.payment.method : '—',
    items: order.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    discount: order.discount,
    total: order.total,
    paymentStatus: order.payment?.status ?? 'PENDING',
    deliveryMethod: address?.deliveryMethod ?? 'LOCAL_COURIER',
    deliveryCompany: address?.deliveryCompany ?? null,
  }
}

export async function generateInvoicePdf(order: OrderForInvoice, invoiceNumber: string): Promise<Buffer> {
  const data = buildInvoiceData(order, invoiceNumber)
  return renderToBuffer(InvoiceDocument({ data }))
}

// Re-exported for anywhere that needs the same courier/price formatting
// without pulling in the full PDF renderer.
export { formatPrice, courierDisplayName }
