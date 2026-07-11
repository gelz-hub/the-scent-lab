import { NextResponse } from 'next/server'
import { getBrands } from '@/lib/catalog'

// Public, read-only brand list for storefront client components (search,
// etc). Unlike /api/admin/brands, this requires no auth and only returns
// publicly visible brands.
export async function GET() {
  const brands = await getBrands()
  return NextResponse.json({ brands })
}
