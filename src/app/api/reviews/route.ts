import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import {
  createReview,
  listReviewsForProduct,
  listReviewsForUser,
  ReviewNotEligibleError,
  ReviewAlreadyExistsError,
} from '@/lib/account/review-service'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const mine = searchParams.get('mine')

  if (productId) {
    const reviews = await listReviewsForProduct(productId)
    return NextResponse.json({ reviews })
  }

  if (mine) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
    const reviews = await listReviewsForUser(session.user.id)
    return NextResponse.json({ reviews })
  }

  return NextResponse.json({ error: 'productId or mine is required.' }, { status: 400 })
}

const createSchema = z.object({
  orderItemId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(150).optional(),
  comment: z.string().trim().max(2000).optional(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid review.' }, { status: 400 })

  try {
    const review = await createReview(session.user.id, parsed.data)
    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    if (error instanceof ReviewNotEligibleError || error instanceof ReviewAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[reviews] create failed', error)
    return NextResponse.json({ error: 'Could not submit review.' }, { status: 500 })
  }
}
