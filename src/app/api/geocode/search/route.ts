import { NextResponse } from 'next/server'
import { searchAddress } from '@/lib/checkout/geoapify'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''

  const suggestions = await searchAddress(query)
  return NextResponse.json({ suggestions })
}
