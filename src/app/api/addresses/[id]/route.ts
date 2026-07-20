import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { z } from 'zod'
import { updateAddress, deleteAddress } from '@/lib/account/address-service'

const updateSchema = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  recipientName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  province: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).optional(),
  commune: z.string().trim().optional(),
  village: z.string().trim().optional(),
  houseNumber: z.string().trim().optional(),
  streetAddress: z.string().trim().min(1).optional(),
  postalCode: z.string().trim().optional(),
  deliveryType: z.enum(['HOME', 'OTHER_LOCATION']).optional(),
  deliveryCompany: z.enum(['JT_EXPRESS', 'VIREAK_BUNTHAM']).nullable().optional(),
  deliveryNote: z.string().trim().optional(),
  preferredDeliveryTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const parsed = updateSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid update.' }, { status: 400 })

  const { email, ...rest } = parsed.data
  const address = await updateAddress(session.user.id, id, { ...rest, ...(email !== undefined && { email: email || undefined }) })
  if (!address) return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
  return NextResponse.json({ address })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const deleted = await deleteAddress(session.user.id, id)
  if (!deleted) return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
