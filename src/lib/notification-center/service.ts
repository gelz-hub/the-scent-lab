// NotificationService — creates and reads in-app account notifications.
// Deliberately separate from Firebase push (src/lib/notifications.ts) and
// from email (src/lib/email) — this is the "notification center" a customer
// sees inside their account, independent of both.

import { db } from '@/lib/db'

type NotificationType = 'PAYMENT_CONFIRMED' | 'INVOICE_GENERATED' | 'ORDER_PREPARING' | 'SHIPMENT_UPDATE' | 'GENERIC'

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

export async function createNotification(input: CreateNotificationInput) {
  return db.accountNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
    },
  })
}

/** Fires the standard set of notifications for a just-confirmed payment. Best-effort — never throws into the caller's hot path. */
export async function notifyPaymentConfirmed(
  userId: string,
  orderNumber: string,
  invoiceNumber: string | null
) {
  try {
    await createNotification({
      userId,
      type: 'PAYMENT_CONFIRMED',
      title: 'Payment confirmed',
      message: `Your payment for order ${orderNumber} has been confirmed.`,
      link: '/account/orders',
    })

    if (invoiceNumber) {
      await createNotification({
        userId,
        type: 'INVOICE_GENERATED',
        title: 'Invoice generated',
        message: `Invoice ${invoiceNumber} has been generated and is ready to download.`,
        link: '/account/orders',
      })
    }

    await createNotification({
      userId,
      type: 'ORDER_PREPARING',
      title: 'Order is being prepared',
      message: `Order ${orderNumber} is now being prepared for shipment.`,
      link: '/account/orders',
    })
  } catch (error) {
    console.error('[notification-center] notifyPaymentConfirmed failed', { userId, orderNumber, error })
  }
}

export async function listNotifications(userId: string, limit = 30) {
  return db.accountNotification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

export async function unreadCount(userId: string) {
  return db.accountNotification.count({ where: { userId, read: false } })
}

export async function markRead(userId: string, id: string) {
  return db.accountNotification.updateMany({ where: { id, userId }, data: { read: true } })
}

export async function markAllRead(userId: string) {
  return db.accountNotification.updateMany({ where: { userId, read: false }, data: { read: true } })
}
