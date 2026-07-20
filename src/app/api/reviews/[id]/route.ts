import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { z } from 'zod'
import { updateReview, deleteReview } from '@/lib/account/review-service'

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().trim().max(150).optional(),
  comment: z.string().trim().max(2000).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update.' }, { status: 400 })

  const review = await updateReview(session.user.id, id, parsed.data).catch((e) => {
    console.error('[reviews] update failed', e)
    return null
  })
  if (!review) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
  return NextResponse.json({ review })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const deleted = await deleteReview(session.user.id, id)
  if (!deleted) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
