// ReviewService — product reviews. Independent of AddressService/
// WishlistService/CustomerService/NotificationService; only ever touches
// the Review table. Gating on delivery reads Order/OrderItem/Shipment but
// never writes to them. See src/lib/account/README.md.

import { db } from '@/lib/db'

export class ReviewNotEligibleError extends Error {
  constructor(message = 'You can only review a product after it has been delivered.') {
    super(message)
    this.name = 'ReviewNotEligibleError'
  }
}

export class ReviewAlreadyExistsError extends Error {
  constructor() {
    super('You have already reviewed this item.')
    this.name = 'ReviewAlreadyExistsError'
  }
}

/** An order item is reviewable once its order's shipment is DELIVERED, and only by the customer who placed that order. */
async function assertReviewEligible(userId: string, orderItemId: string) {
  const item = await db.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { include: { shipment: { select: { status: true } } } } },
  })

  if (!item) throw new ReviewNotEligibleError('Order item not found.')
  if (item.order.userId !== userId) throw new ReviewNotEligibleError('This order does not belong to you.')
  if (item.order.shipment?.status !== 'DELIVERED') {
    throw new ReviewNotEligibleError()
  }

  return item
}

export interface CreateReviewInput {
  orderItemId: string
  rating: number
  title?: string
  comment?: string
}

export async function createReview(userId: string, input: CreateReviewInput) {
  if (input.rating < 1 || input.rating > 5) throw new Error('Rating must be between 1 and 5.')

  const item = await assertReviewEligible(userId, input.orderItemId)

  const existing = await db.review.findUnique({ where: { orderItemId: input.orderItemId } })
  if (existing) throw new ReviewAlreadyExistsError()

  return db.review.create({
    data: {
      orderItemId: input.orderItemId,
      productId: item.productId,
      userId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
    },
  })
}

export async function updateReview(userId: string, reviewId: string, input: Partial<Pick<CreateReviewInput, 'rating' | 'title' | 'comment'>>) {
  const existing = await db.review.findFirst({ where: { id: reviewId, userId } })
  if (!existing) return null
  if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) throw new Error('Rating must be between 1 and 5.')
  return db.review.update({ where: { id: reviewId }, data: input })
}

export async function deleteReview(userId: string, reviewId: string) {
  const existing = await db.review.findFirst({ where: { id: reviewId, userId } })
  if (!existing) return false
  await db.review.delete({ where: { id: reviewId } })
  return true
}

export async function listReviewsForProduct(productId: string) {
  return db.review.findMany({
    where: { productId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  })
}

export async function listReviewsForUser(userId: string) {
  return db.review.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
}

/** Every delivered order item the customer hasn't reviewed yet — what a "write a review" prompt list should show. */
export async function listReviewableOrderItems(userId: string) {
  const deliveredItems = await db.orderItem.findMany({
    where: { order: { userId, shipment: { status: 'DELIVERED' } } },
    include: { order: { select: { orderNumber: true } } },
  })

  const reviewedIds = new Set(
    (await db.review.findMany({ where: { userId }, select: { orderItemId: true } })).map((r) => r.orderItemId)
  )

  return deliveredItems.filter((item) => !reviewedIds.has(item.id))
}
