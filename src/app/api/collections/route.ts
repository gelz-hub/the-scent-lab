import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/catalog'

// Public, read-only collection list for storefront client components (nav
// mega menu, etc). Unlike /api/admin/collections, this requires no auth and
// only returns publicly visible collections.
export async function GET() {
  const collections = await getCollections()
  return NextResponse.json({ collections })
}
