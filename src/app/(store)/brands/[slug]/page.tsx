import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { ProductListing } from '@/components/site/product-listing'
import { EmptyState } from '@/components/site/empty-state'
import { getBrand, getBrands, getProducts, getCategories, getCollections } from '@/lib/catalog'
import type { Gender } from '@/lib/data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const brands = await getBrands()
  return brands.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const brand = await getBrand(slug)
  if (!brand) return { title: 'Brand not found' }
  return {
    title: brand.name,
    description: brand.description,
  }
}

function slugifyTag(tag: string) {
  return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [brand, allProducts, brands, categories, collections] = await Promise.all([
    getBrand(slug),
    getProducts(),
    getBrands(),
    getCategories(),
    getCollections(),
  ])
  if (!brand) notFound()

  const brandProducts = allProducts.filter((p) => p.brandSlug === slug)

  return (
    <div>
      {/* Brand hero */}
      <section className="border-b border-border bg-surface/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {(brand.country || brand.founded > 0) && (
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
              {[brand.country, brand.founded > 0 ? `est. ${brand.founded}` : null]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight sm:text-6xl md:text-7xl">
            {brand.name}
          </h1>
          {brand.tagline && (
            <p className="mt-4 max-w-2xl font-display text-xl font-light italic text-muted-foreground">
              {brand.tagline}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Brands', href: '/brands' },
            { label: brand.name },
          ]}
        />

        {/* History / Description */}
        {brand.description && (
          <div className="mb-12 max-w-2xl">
            <h2 className="font-display text-2xl font-medium">The house</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {brand.description}
            </p>
          </div>
        )}

        {/* Collections */}
        {brandProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-4 font-display text-2xl font-medium">Collections</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(brandProducts.flatMap((p) => p.collection))).map((c) => (
                <a
                  key={c}
                  href={`/collections/${slugifyTag(c)}`}
                  className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/40 hover:bg-surface"
                >
                  {c}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-medium">Popular fragrances</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {brandProducts.length} {brandProducts.length === 1 ? 'fragrance' : 'fragrances'} from {brand.name}
          </p>
        </div>
        {brandProducts.length === 0 ? (
          <EmptyState title="No products available from this brand yet." />
        ) : (
          <ProductListing
            basePath={`/brands/${slug}`}
            pageSize={9}
            baseProducts={brandProducts}
            allBrands={brands}
            genderOptions={categories.map((c) => c.name) as Gender[]}
            collectionOptions={collections.map((c) => c.name)}
          />
        )}
      </div>
    </div>
  )
}
