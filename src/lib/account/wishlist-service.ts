// WishlistService — the customer's saved-product list. Independent of
// AddressService/ReviewService/CustomerService/NotificationService; only
// ever touches the Wishlist table. See src/lib/account/README.md.

import { db } from '@/lib/db'

export async function listWishlistProductIds(userId: string): Promise<string[]> {
  const items = await db.wishlist.findMany({ where: { userId }, select: { productId: true } })
  return items.map((i) => i.productId)
}

/** Toggle — adds if absent, removes if present. Returns the resulting state. */
export async function toggleWishlist(userId: string, productId: string): Promise<boolean> {
  const existing = await db.wishlist.findUnique({ where: { userId_productId: { userId, productId } } })

  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } })
    return false
  }

  await db.wishlist.create({ data: { userId, productId } })
  return true
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  await db.wishlist.deleteMany({ where: { userId, productId } })
}
