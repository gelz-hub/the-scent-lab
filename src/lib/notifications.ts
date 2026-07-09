import { db } from '@/lib/db'
import { getAdminMessaging, isFirebaseAdminConfigured } from '@/lib/firebase/admin'

interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

/** Sends a push to a specific set of device tokens; prunes tokens the OS reports as dead. */
async function sendToTokens(tokens: string[], payload: PushPayload) {
  if (!isFirebaseAdminConfigured || tokens.length === 0) return

  const messaging = getAdminMessaging()
  if (!messaging) return

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: payload.title, body: payload.body },
    webpush: {
      notification: { icon: payload.icon || '/icon-192.png' },
      fcmOptions: payload.url ? { link: payload.url } : undefined,
    },
    data: payload.url ? { url: payload.url } : undefined,
  })

  const deadTokens = res.responses
    .map((r, i) => (!r.success ? tokens[i] : null))
    .filter((t): t is string => !!t)

  if (deadTokens.length) {
    await db.pushToken.deleteMany({ where: { token: { in: deadTokens } } })
  }
}

async function sendToUser(userId: string, payload: PushPayload) {
  const tokens = await db.pushToken.findMany({ where: { userId }, select: { token: true } })
  await sendToTokens(tokens.map((t) => t.token), payload)
}

async function sendToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return
  const tokens = await db.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  })
  await sendToTokens(tokens.map((t) => t.token), payload)
}

/** Broadcasts to every user who has push enabled and hasn't opted out of the given category. */
async function sendToAllSubscribed(
  category: 'newArrivals' | 'promotions',
  payload: PushPayload
) {
  const users = await db.user.findMany({
    where: {
      pushTokens: { some: {} },
      OR: [{ notificationPrefs: null }, { notificationPrefs: { [category]: true } }],
    },
    select: { id: true },
  })
  await sendToUsers(users.map((u) => u.id), payload)
}

export async function notifyOrderUpdate(userId: string, orderNumber: string, status: string) {
  const prefs = await db.notificationPreference.findUnique({ where: { userId } })
  if (prefs && !prefs.orderUpdates) return

  await sendToUser(userId, {
    title: `Order ${orderNumber} update`,
    body: `Your order is now ${status.toLowerCase()}.`,
    url: '/account/orders',
  })
}

export async function notifyBackInStock(product: { id: string; slug: string; name: string; brand: string }) {
  const wishlisters = await db.wishlist.findMany({
    where: {
      productId: product.id,
      user: {
        pushTokens: { some: {} },
        OR: [{ notificationPrefs: null }, { notificationPrefs: { backInStock: true } }],
      },
    },
    select: { userId: true },
  })
  if (wishlisters.length === 0) return

  await sendToUsers(wishlisters.map((w) => w.userId), {
    title: 'Back in stock',
    body: `${product.brand} ${product.name} is available again.`,
    url: `/product/${product.slug}`,
  })
}

export async function notifyPriceDrop(
  product: { id: string; slug: string; name: string; brand: string },
  oldPrice: number,
  newPrice: number
) {
  const wishlisters = await db.wishlist.findMany({
    where: {
      productId: product.id,
      user: {
        pushTokens: { some: {} },
        OR: [{ notificationPrefs: null }, { notificationPrefs: { priceDrops: true } }],
      },
    },
    select: { userId: true },
  })
  if (wishlisters.length === 0) return

  await sendToUsers(wishlisters.map((w) => w.userId), {
    title: 'Price drop',
    body: `${product.brand} ${product.name} dropped from $${oldPrice} to $${newPrice}.`,
    url: `/product/${product.slug}`,
  })
}

export async function notifyNewArrival(product: { slug: string; name: string; brand: string }) {
  await sendToAllSubscribed('newArrivals', {
    title: 'New arrival',
    body: `${product.brand} ${product.name} just landed.`,
    url: `/product/${product.slug}`,
  })
}

export async function notifyPromotion(title: string, body: string, url?: string) {
  await sendToAllSubscribed('promotions', { title, body, url })
}
