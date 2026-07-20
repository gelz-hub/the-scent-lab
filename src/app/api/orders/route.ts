import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { createOrderSchema } from '@/lib/checkout/schema'
import { resolveDeliveryMethod, shippingFeeFor, estimatedDeliveryFor } from '@/lib/checkout/delivery'
import { validateCoupon } from '@/lib/checkout/coupon-service'
import { generateOrderNumber } from '@/lib/checkout/order-number'
import { buildCustomerShipmentView } from '@/lib/shipping/customer-view'
import { generateAndStoreInvoice } from '@/lib/invoice/invoice-service'
import { notifyPaymentConfirmed } from '@/lib/notification-center/service'
import { createPayment } from '@/lib/payment/payment-service'
import { rateLimit, clientIp } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logging/logger'

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: true,
      address: true,
      payments: { orderBy: { createdAt: 'desc' } },
      invoice: true,
      // Customer-safe projection only â€” never internalNotes, staff ids, or archivedAt.
      shipment: {
        select: {
          deliveryMethod: true,
          deliveryCompany: true,
          estimatedDelivery: true,
          actualDeliveryAt: true,
          trackingNumber: true,
          trackingUrl: true,
          status: true,
          customerNotes: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // `payment` is the most recent attempt (for display); `payments` is the
  // full retry history, oldest first â€” see src/lib/payment/README.md.
  const ordersWithFriendlyShipment = orders.map((order) => ({
    ...order,
    payment: order.payments[0] ?? null,
    payments: [...order.payments].reverse(),
    shipment: order.shipment ? buildCustomerShipmentView(order.shipment) : null,
  }))

  return NextResponse.json({ orders: ordersWithFriendlyShipment })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  // 20 orders / 10 minutes / account+IP â€” generous enough for legitimate
  // rapid retries after a failed payment, but blocks scripted checkout spam
  // (each order create also triggers a payment-provider call, so this
  // doubles as a throttle on outbound provider traffic).
  const { allowed } = await rateLimit(`order-create:${session.user.id}:${clientIp(req)}`, 20, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json({ error: 'Too many orders placed recently. Please wait a few minutes and try again.' }, { status: 429 })
  }

  const parsed = createOrderSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid order.' }, { status: 400 })
  }

  const { address, paymentMethod, items, couponCode } = parsed.data

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)

  let discount = 0
  let freeShipping = false
  if (couponCode) {
    const result = await validateCoupon(couponCode, subtotal)
    if (!result.valid) {
      return NextResponse.json({ error: result.error || 'Coupon code is no longer valid.' }, { status: 400 })
    }
    discount = result.discount ?? 0
    freeShipping = result.freeShipping ?? false
  }

  const shippingFee = shippingFeeFor(address.province, subtotal - discount, { freeShipping })
  const total = Math.max(0, subtotal - discount + shippingFee)
  const deliveryMethod = resolveDeliveryMethod(address.province)

  const order = await db.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: session.user.id,
      subtotal,
      discount,
      shippingFee,
      total,
      status: paymentMethod === 'COD' ? 'PREPARING' : 'PENDING_PAYMENT',
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          brand: item.brand,
          image: item.image,
          ml: item.ml,
          price: item.price,
          qty: item.qty,
        })),
      },
      address: {
        create: {
          recipientName: address.recipientName,
          phone: address.phone,
          email: address.email || null,
          province: address.province,
          district: address.district,
          commune: address.commune || null,
          village: address.village || null,
          houseNumber: address.houseNumber || null,
          streetAddress: address.streetAddress,
          postalCode: address.postalCode || null,
          deliveryType: address.deliveryType,
          deliveryMethod,
          // Customer's preferred courier for province orders â€” respected through
          // fulfillment unless staff records a valid reason to change it (see Shipment).
          deliveryCompany: deliveryMethod === 'LOGISTICS' ? address.deliveryCompany : null,
          deliveryNote: address.deliveryNote || null,
          preferredDeliveryTime: address.preferredDeliveryTime || null,
          latitude: address.latitude ?? null,
          longitude: address.longitude ?? null,
        },
      },
    },
    include: { items: true, address: true, user: { select: { email: true, name: true } } },
  })

  // Payment creation is a dedicated, provider-abstracted step (see
  // src/lib/payment/payment-service.ts) â€” this route never marks a payment
  // PAID itself; only PaymentService.verifyPayment() does that, after
  // backend verification against the actual provider.
  let paymentResult: Awaited<ReturnType<typeof createPayment>> | null = null
  try {
    paymentResult = await createPayment(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        total: order.total,
        user: order.user,
        address: { recipientName: order.address!.recipientName },
      },
      paymentMethod
    )
  } catch (error) {
    logger.error('api', 'order_payment_creation_failed', { orderId: order.id, error })
    return NextResponse.json(
      { error: 'Order created, but payment could not be initiated. Please contact support.', order },
      { status: 502 }
    )
  }

  // Shipment creation is a separate step from the order itself: if it fails
  // for any reason, the order is still valid and staff can create the
  // shipment later from the admin console (see /api/shipments).
  try {
    await db.shipment.create({
      data: {
        orderId: order.id,
        deliveryMethod,
        deliveryCompany: deliveryMethod === 'LOGISTICS' ? address.deliveryCompany : null,
        shippingFee,
        estimatedDelivery: estimatedDeliveryFor(address.province),
        status: 'PENDING',
      },
    })
  } catch (error) {
    logger.error('shipment', 'shipment_auto_creation_failed', { orderId: order.id, error })
  }

  // Invoice generation is independent of shipping â€” it never waits on, or is
  // blocked by, the shipment step above. Only generated once payment has
  // actually succeeded (never for a still-PENDING/PROCESSING payment, and
  // never for COD until staff confirms cash collection). No email is sent
  // here in this version â€” see src/lib/invoice/README.md for how an
  // EmailService plugs in later without this route changing.
  if (paymentResult.status === 'PAID') {
    try {
      const invoice = await generateAndStoreInvoice({
        ...order,
        payment: { method: paymentMethod, status: paymentResult.status },
      })
      await notifyPaymentConfirmed(order.userId, order.orderNumber, invoice?.invoiceNumber ?? null)
    } catch (error) {
      logger.error('api', 'invoice_notification_flow_failed', { orderId: order.id, error })
    }
  }

  return NextResponse.json({ order, payment: paymentResult }, { status: 201 })
}
