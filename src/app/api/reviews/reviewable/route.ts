import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listReviewableOrderItems } from '@/lib/account/review-service'

/** Delivered order items the customer hasn't reviewed yet — feeds a "write a review" prompt. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const items = await listReviewableOrderItems(session.user.id)
  return NextResponse.json({ items })
}
