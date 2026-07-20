import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { z } from 'zod'
import { listWishlistProductIds, toggleWishlist } from '@/lib/account/wishlist-service'

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ productIds: [] })

  const productIds = await listWishlistProductIds(session.user.id)
  return NextResponse.json({ productIds })
}

const toggleSchema = z.object({ productId: z.string().min(1) })

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const parsed = toggleSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })

  const wishlisted = await toggleWishlist(session.user.id, parsed.data.productId)
  return NextResponse.json({ wishlisted })
}
