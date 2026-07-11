// Server-side catalog data layer — replaces the old static src/lib/data.ts
// catalog exports (products/brands/collections/categories) with real Prisma
// queries. Returned objects are shaped to match the `Product`/`Brand` types
// still exported from src/lib/data.ts (journal-only now) so presentational
// components (ProductCard, ProductListing, BrandCard, …) didn't need to
// change — only the page-level call sites that used to import the static
// arrays.
//
// Performance notes (Phase B):
// - Every query below uses `select` (only the columns toProduct()/toBrand()
//   actually need) instead of fetching full rows.
// - Tag/collection filtering happens in the WHERE clause (MySQL
//   JSON_CONTAINS via Prisma's `array_contains`), not by loading the whole
//   catalog and filtering in JS.
// - Read-only storefront queries are wrapped in `unstable_cache` so a page
//   load never re-hits MySQL more than once per cache window.
//
//   On-demand invalidation via `revalidateTag()` was tried and removed: in
//   this Next.js version, `revalidateTag(tag, profile)` encodes the tag
//   (`encodeCacheTag()`, see node_modules/next/dist/.../revalidate.js)
//   before matching, while `unstable_cache`'s own `tags` option registers
//   the raw, unencoded string (see .../unstable-cache.js, `validateTags`).
//   The two never match, so calling `revalidateTag('products', ...)` after
//   an admin edit is a silent no-op against these caches — confirmed
//   empirically (created a product, immediately re-fetched a tag-filtered
//   page, still got the stale list) and in Next's own source, not assumed.
//   Next 16's supported fix is migrating to the `"use cache"` directive +
//   `cacheTag()`/`updateTag()`, which requires enabling `cacheComponents`
//   in next.config.ts (a larger, separate architectural change — Partial
//   Prerendering — out of scope for this pass). Until that migration, the
//   short revalidate window below is the only consistency mechanism: an
//   admin create/edit/delete becomes visible on the storefront within
//   REVALIDATE_SECONDS, not instantly.
import { unstable_cache as cache } from 'next/cache'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import type { Product, Brand, Gender, CollectionTag, VolumeOption, ProductNotes } from '@/lib/data'

const PUBLIC_WHERE = {
  deletedAt: null,
  status: 'ACTIVE' as const,
  visibility: 'PUBLIC' as const,
}

// Short on purpose — this is the only staleness guard now that on-demand
// tag invalidation is unavailable (see the comment block above).
const REVALIDATE_SECONDS = 20

// Only the columns toProduct() reads — cuts payload size and MySQL work
// versus fetching every column (including SEO/Cloudinary/audit fields the
// storefront never uses).
const PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  brand: true,
  brandSlug: true,
  gender: true,
  category: true,
  collection: true,
  image: true,
  gallery: true,
  volumes: true,
  compareAtPrice: true,
  rating: true,
  reviewCount: true,
  description: true,
  story: true,
  notes: true,
  longevity: true,
  projection: true,
  sillage: true,
  seasons: true,
  occasions: true,
  country: true,
  year: true,
  tags: true,
  stock: true,
} satisfies Prisma.ProductSelect

type SelectedProduct = Prisma.ProductGetPayload<{ select: typeof PRODUCT_SELECT }>

function toProduct(p: SelectedProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    brandSlug: p.brandSlug,
    gender: p.gender as Gender,
    category: p.category as Product['category'],
    collection: (p.collection as unknown as string[]) as CollectionTag[],
    image: p.image,
    gallery: p.gallery as unknown as string[],
    volumes: p.volumes as unknown as VolumeOption[],
    compareAtPrice: p.compareAtPrice ?? undefined,
    rating: p.rating,
    reviewCount: p.reviewCount,
    description: p.description,
    story: p.story,
    notes: p.notes as unknown as ProductNotes,
    longevity: p.longevity,
    projection: p.projection,
    sillage: p.sillage,
    seasons: p.seasons as Product['seasons'],
    occasions: p.occasions as Product['occasions'],
    country: p.country,
    year: p.year,
    tags: p.tags as Product['tags'],
    stock: p.stock,
    reviews: [],
  }
}

export const getProducts = cache(
  async (): Promise<Product[]> => {
    const rows = await db.product.findMany({
      where: PUBLIC_WHERE,
      select: PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toProduct)
  },
  ['catalog:products:all'],
  { revalidate: REVALIDATE_SECONDS, tags: ['products'] }
)

export const getProductCount = cache(
  async (): Promise<number> => db.product.count({ where: PUBLIC_WHERE }),
  ['catalog:products:count'],
  { revalidate: REVALIDATE_SECONDS, tags: ['products'] }
)

// Not cached — a single product lookup by slug is already cheap (indexed,
// one row), and product detail pages also need fresh review data, so
// caching wouldn't save much while adding a staleness window on the one
// page shoppers most need accurate stock/price on.
//
// `includeUnpublished` drops the ACTIVE/PUBLIC filter — used ONLY by the
// admin "Preview" link (src/app/(store)/product/[slug]/page.tsx), which
// verifies a staff session server-side before ever passing this flag. The
// default (false) is what every public/storefront call site gets.
export async function getProduct(slug: string, includeUnpublished = false): Promise<Product | undefined> {
  const row = await db.product.findFirst({
    where: includeUnpublished ? { deletedAt: null, slug } : { ...PUBLIC_WHERE, slug },
    select: PRODUCT_SELECT,
  })
  if (!row) return undefined
  const product = toProduct(row as unknown as SelectedProduct)

  const reviews = await db.review.findMany({
    where: { productId: (row as { id: string }).id, status: 'PUBLISHED' },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  product.reviews = reviews.map((r) => ({
    id: r.id,
    author: r.user?.name || 'Verified buyer',
    rating: r.rating,
    date: r.createdAt.toISOString().slice(0, 10),
    title: r.title ?? '',
    body: r.comment ?? '',
  }))

  return product
}

export const getProductsByGender = cache(
  async (gender: Gender): Promise<Product[]> => {
    const rows = await db.product.findMany({
      where: { ...PUBLIC_WHERE, gender },
      select: PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toProduct)
  },
  ['catalog:products:by-gender'],
  { revalidate: REVALIDATE_SECONDS, tags: ['products'] }
)

// Filters in the WHERE clause (MySQL JSON_CONTAINS via Prisma's
// `array_contains`) instead of loading every product and filtering in JS —
// the query only ever returns rows that actually carry the tag.
export const getProductsByTag = cache(
  async (tag: Product['tags'][number]): Promise<Product[]> => {
    const rows = await db.product.findMany({
      where: { ...PUBLIC_WHERE, tags: { array_contains: tag } },
      select: PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toProduct)
  },
  ['catalog:products:by-tag'],
  { revalidate: REVALIDATE_SECONDS, tags: ['products'] }
)

export const getProductsByCollectionTag = cache(
  async (tag: string): Promise<Product[]> => {
    const rows = await db.product.findMany({
      where: { ...PUBLIC_WHERE, collection: { array_contains: tag } },
      select: PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toProduct)
  },
  ['catalog:products:by-collection-tag'],
  { revalidate: REVALIDATE_SECONDS, tags: ['products'] }
)

// Related products: a bounded candidate query (brand OR gender OR shares a
// collection tag), not the full catalog — `notes.base` overlap (a soft
// tie-breaker, not indexable/filterable in SQL) is only computed over that
// small candidate set afterwards, never over every product.
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const collectionOr: Prisma.ProductWhereInput[] = product.collection.map((c) => ({
    collection: { array_contains: c },
  }))

  const rows = await db.product.findMany({
    where: {
      ...PUBLIC_WHERE,
      id: { not: product.id },
      OR: [{ brandSlug: product.brandSlug }, { gender: product.gender }, ...collectionOr],
    },
    select: PRODUCT_SELECT,
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  const candidates = rows.map(toProduct)
  const withBaseNoteOverlap = candidates.filter((p) =>
    p.notes.base.some((n) => product.notes.base.includes(n))
  )
  const rest = candidates.filter((p) => !withBaseNoteOverlap.includes(p))

  return [...withBaseNoteOverlap, ...rest].slice(0, limit)
}

// ---- Brands ----

function toBrand(b: {
  name: string
  slug: string
  country: string | null
  foundedYear: number | null
  tagline: string | null
  description: string | null
  logoUrl: string | null
}, productCount: number): Brand {
  return {
    slug: b.slug,
    name: b.name,
    country: b.country ?? '',
    founded: b.foundedYear ?? 0,
    tagline: b.tagline ?? '',
    description: b.description ?? '',
    productCount,
  }
}

const BRAND_SELECT = {
  name: true,
  slug: true,
  country: true,
  foundedYear: true,
  tagline: true,
  description: true,
  logoUrl: true,
} satisfies Prisma.BrandSelect

export const getBrands = cache(
  async (): Promise<Brand[]> => {
    const rows = await db.brand.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { name: 'asc' },
      select: { ...BRAND_SELECT, _count: { select: { products: { where: PUBLIC_WHERE } } } },
    })
    return rows.map((b) => toBrand(b, b._count.products))
  },
  ['catalog:brands:all'],
  { revalidate: REVALIDATE_SECONDS, tags: ['brands'] }
)

export async function getBrand(slug: string): Promise<Brand | undefined> {
  const row = await db.brand.findFirst({
    where: { slug, visibility: 'PUBLIC' },
    select: { ...BRAND_SELECT, _count: { select: { products: { where: PUBLIC_WHERE } } } },
  })
  if (!row) return undefined
  return toBrand(row, row._count.products)
}

// ---- Categories (Women / Men / Unisex / …) ----

export interface CatalogCategory {
  slug: string
  name: string
  description: string
  image: string | null
}

export const getCategories = cache(
  async (): Promise<CatalogCategory[]> => {
    const rows = await db.category.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true, description: true, imageUrl: true },
    })
    return rows.map((c) => ({
      slug: c.slug,
      name: c.name,
      description: c.description ?? '',
      image: c.imageUrl,
    }))
  },
  ['catalog:categories:all'],
  { revalidate: REVALIDATE_SECONDS, tags: ['categories'] }
)

export async function getCategory(slug: string): Promise<CatalogCategory | undefined> {
  const row = await db.category.findFirst({
    where: { slug, visibility: 'PUBLIC' },
    select: { slug: true, name: true, description: true, imageUrl: true },
  })
  if (!row) return undefined
  return { slug: row.slug, name: row.name, description: row.description ?? '', image: row.imageUrl }
}

// ---- Collections ----

export interface CatalogCollection {
  slug: string
  name: string
  tagline: string
  description: string
  image: string | null
}

export const getCollections = cache(
  async (): Promise<CatalogCollection[]> => {
    const rows = await db.collection.findMany({
      where: { visibility: 'PUBLIC' },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true, tagline: true, description: true, imageUrl: true },
    })
    return rows.map((c) => ({
      slug: c.slug,
      name: c.name,
      tagline: c.tagline ?? '',
      description: c.description ?? '',
      image: c.imageUrl,
    }))
  },
  ['catalog:collections:all'],
  { revalidate: REVALIDATE_SECONDS, tags: ['collections'] }
)

export async function getCollection(slug: string): Promise<CatalogCollection | undefined> {
  const row = await db.collection.findFirst({
    where: { slug, visibility: 'PUBLIC' },
    select: { slug: true, name: true, tagline: true, description: true, imageUrl: true },
  })
  if (!row) return undefined
  return { slug: row.slug, name: row.name, tagline: row.tagline ?? '', description: row.description ?? '', image: row.imageUrl }
}

export async function getProductsForCollection(collection: CatalogCollection): Promise<Product[]> {
  return getProductsByCollectionTag(collection.name)
}

// ---- Reviews (homepage "What our customers say") ----

export interface FeaturedReview {
  author: string
  rating: number
  title: string
  body: string
}

export const getFeaturedReviews = cache(
  async (limit = 7): Promise<FeaturedReview[]> => {
    const rows = await db.review.findMany({
      where: { status: 'PUBLISHED', rating: { gte: 4 }, comment: { not: null } },
      select: { rating: true, title: true, comment: true, user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return rows.map((r) => ({
      author: r.user?.name || 'Verified buyer',
      rating: r.rating,
      title: r.title ?? '',
      body: r.comment ?? '',
    }))
  },
  ['catalog:reviews:featured'],
  { revalidate: REVALIDATE_SECONDS, tags: ['reviews'] }
)
