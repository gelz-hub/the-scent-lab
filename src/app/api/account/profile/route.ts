import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { getProfile, updateProfile } from '@/lib/account/customer-service'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const profile = await getProfile(session.user.id)
  return NextResponse.json({ profile })
}

const updateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  dateOfBirth: z.string().trim().optional(), // ISO date string, or "" to clear
  avatarPublicId: z.string().optional(),
  avatarUrl: z.string().optional(),
  preferredLanguage: z.string().trim().max(10).optional(),
  preferredCurrency: z.enum(['USD', 'KHR']).optional(),
})

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid profile update.' }, { status: 400 })

  const { dateOfBirth, ...rest } = parsed.data
  const profile = await updateProfile(session.user.id, {
    ...rest,
    ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
  })
  return NextResponse.json({ profile })
}
