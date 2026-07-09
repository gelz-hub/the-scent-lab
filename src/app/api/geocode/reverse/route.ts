import { NextResponse } from 'next/server'
import { reverseGeocode } from '@/lib/checkout/geoapify'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 })
  }

  const address = await reverseGeocode(lat, lon)
  if (!address) {
    return NextResponse.json({ error: 'Could not resolve an address for this location.' }, { status: 502 })
  }

  return NextResponse.json({ address })
}
