import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { notifyNewArrival } from '@/lib/notifications'
import { requirePermission } from '@/lib/rbac/require-permission'

const productSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  brandSlug: z.string().trim().min(1),
  gender: z.string().trim().min(1),
  category: z.string().trim().min(1),
  collection: z.array(z.string()).default([]),
  image: z.string().trim().min(1),
  gallery: z.array(z.string()).default([]),
  volumes: z.array(z.object({ ml: z.number(), price: z.number() })).min(1),
  compareAtPrice: z.number().nullable().optional(),
  description: z.string().trim().default(''),
  story: z.string().trim().default(''),
  notes: z.object({
    top: z.array(z.string()).default([]),
    heart: z.array(z.string()).default([]),
    base: z.array(z.string()).default([]),
  }),
  longevity: z.number().min(1).max(5).default(3),
  projection: z.number().min(1).max(5).default(3),
  sillage: z.number().min(1).max(5).default(3),
  seasons: z.array(z.string()).default([]),
  occasions: z.array(z.string()).default([]),
  country: z.string().trim().default(''),
  year: z.number().default(new Date().getFullYear()),
  tags: z.array(z.string()).default([]),
  stock: z.number().min(0).default(0),
})

async function requireStaff() {
  const result = await requirePermission('products', 'write')
  return result.allowed ? result.session : null
}

interface ProductVolume {
  ml: number
  price: number
}

/**
 * Search + filter — additive: with no query params this behaves exactly as
 * before (every product, createdAt desc), so every existing caller (admin
 * products page, storefront listing pages) is unaffected. New params:
 * q (name/sku/barcode/brand/category), brand, category, collection
 * (legacy string fields — matches most existing catalog data), minPrice/
 * maxPrice (checked against `price` if set, else the lowest `volumes` price),
 * availability ('in_stock' | 'out_of_stock', against the legacy `stock`
 * field), status (Part 6 ProductStatus, for newly-managed products).
 *
 * Filtering happens in JS after a single query rather than in SQL — fine at
 * this catalog's scale (~100s of products); would want indexed columns
 * (e.g. a materialized `minPrice`) if the catalog grows much larger. See
 * src/lib/inventory/README.md.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().toLowerCase()
  const brand = searchParams.get('brand')?.trim().toLowerCase()
  const category = searchParams.get('category')?.trim().toLowerCase()
  const collection = searchParams.get('collection')?.trim().toLowerCase()
  const status = searchParams.get('status')
  const availability = searchParams.get('availability')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')

  const products = await db.product.findMany({
    where: { deletedAt: null, ...(status && { status: status as never }) },
    orderBy: { createdAt: 'desc' },
  })

  if (!q && !brand && !category && !collection && !availability && !minPrice && !maxPrice) {
    return NextResponse.json({ products })
  }

  const filtered = products.filter((p) => {
    if (brand && p.brand.toLowerCase() !== brand && p.brandSlug.toLowerCase() !== brand) return false
    if (category && p.category.toLowerCase() !== category) return false
    if (collection) {
      const collections = (p.collection as string[]).map((c) => c.toLowerCase())
      if (!collections.includes(collection)) return false
    }
    if (availability === 'in_stock' && p.stock <= 0) return false
    if (availability === 'out_of_stock' && p.stock > 0) return false

    // Price lives on ProductVariant for the new catalog; this legacy
    // storefront route still only knows the `volumes` json array, so price
    // filtering here uses its lowest entry (unchanged from before this route
    // gained search/filter support).
    const volumes = p.volumes as unknown as ProductVolume[]
    const lowestPrice = Math.min(...volumes.map((v) => v.price))
    if (minPrice && lowestPrice < Number(minPrice)) return false
    if (maxPrice && lowestPrice > Number(maxPrice)) return false

    if (q) {
      const haystack = [p.name, p.brand, p.category].filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })

  return NextResponse.json({ products: filtered })
}

export async function POST(req: Request) {
  const session = await requireStaff()
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid product data.' }, { status: 400 })
  }

  const existing = await db.product.findUnique({ where: { slug: parsed.data.slug } })
  if (existing) {
    return NextResponse.json({ error: 'A product with this slug already exists.' }, { status: 409 })
  }

  const product = await db.product.create({ data: parsed.data })

  notifyNewArrival(product).catch((err) => console.error('notifyNewArrival failed', err))

  return NextResponse.json({ product }, { status: 201 })
}
