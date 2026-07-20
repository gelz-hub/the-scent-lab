import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/session'
import { z } from 'zod'
import { listAddresses, createAddress } from '@/lib/account/address-service'

const addressSchema = z.object({
  label: z.string().trim().min(1).max(50),
  recipientName: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal('')),
  province: z.string().trim().min(1),
  district: z.string().trim().min(1),
  commune: z.string().trim().optional(),
  village: z.string().trim().optional(),
  houseNumber: z.string().trim().optional(),
  streetAddress: z.string().trim().min(1),
  postalCode: z.string().trim().optional(),
  deliveryType: z.enum(['HOME', 'OTHER_LOCATION']).optional(),
  deliveryCompany: z.enum(['JT_EXPRESS', 'VIREAK_BUNTHAM']).nullable().optional(),
  deliveryNote: z.string().trim().optional(),
  preferredDeliveryTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANYTIME']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  makeDefault: z.boolean().optional(),
})

export async function GET() {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const addresses = await listAddresses(session.user.id)
  return NextResponse.json({ addresses })
}

export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const parsed = addressSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid address.' }, { status: 400 })

  const { makeDefault, email, ...rest } = parsed.data
  const address = await createAddress(session.user.id, { ...rest, email: email || undefined }, makeDefault)
  return NextResponse.json({ address }, { status: 201 })
}
