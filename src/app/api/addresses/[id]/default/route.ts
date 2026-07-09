import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setDefaultAddress } from '@/lib/account/address-service'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })

  const { id } = await params
  const address = await setDefaultAddress(session.user.id, id)
  if (!address) return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
  return NextResponse.json({ address })
}
