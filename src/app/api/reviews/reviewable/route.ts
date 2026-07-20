import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { listReviewableOrderItems } from '@/lib/account/review-service'

/** Delivered order items the customer hasn't reviewed yet â€” feeds a "write a review" prompt. */
export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const items = await listReviewableOrderItems(session.user.id)
  return NextResponse.json({ items })
}
