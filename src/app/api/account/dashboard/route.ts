import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getProfile } from '@/lib/account/customer-service'
import { listAddresses } from '@/lib/account/address-service'
import { listNotifications, unreadCount } from '@/lib/notification-center/service'

const ACTIVE_SHIPMENT_STATUSES = ['PENDING', 'PREPARING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']

/** One aggregation read for the account dashboard — profile, recent orders, active shipments, saved addresses, wishlist count, recent notifications. Never writes anything. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const userId = session.user.id

  const [profile, recentOrders, addresses, wishlistCount, notifications, unread] = await Promise.all([
    getProfile(userId),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        shipment: { select: { status: true, deliveryCompany: true, trackingNumber: true, trackingUrl: true } },
        invoice: { select: { invoiceNumber: true, status: true } },
      },
    }),
    listAddresses(userId),
    db.wishlist.count({ where: { userId } }),
    listNotifications(userId, 5),
    unreadCount(userId),
  ])

  const activeShipments = recentOrders
    .filter((o) => o.shipment && ACTIVE_SHIPMENT_STATUSES.includes(o.shipment.status))
    .map((o) => ({ orderId: o.id, orderNumber: o.orderNumber, shipment: o.shipment }))

  return NextResponse.json({
    profile,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: o.total,
      itemCount: o.items.length,
      createdAt: o.createdAt,
      paymentStatus: o.payments[0]?.status ?? null,
      shipmentStatus: o.shipment?.status ?? null,
      deliveryCompany: o.shipment?.deliveryCompany ?? null,
      invoiceNumber: o.invoice?.status === 'GENERATED' ? o.invoice.invoiceNumber : null,
    })),
    activeShipments,
    addresses,
    wishlistCount,
    notifications,
    unreadNotificationCount: unread,
  })
}
