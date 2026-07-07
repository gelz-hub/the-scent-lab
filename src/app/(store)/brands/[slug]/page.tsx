import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { ProductListing } from '@/components/site/product-listing'
import { brandBySlug, brands, products } from '@/lib/data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const brand = brandBySlug(slug)
  if (!brand) return { title: 'Brand not found' }
  return {
    title: brand.name,
    description: brand.description,
  }
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { slug } = await params
  const brand = brandBySlug(slug)
  if (!brand) notFound()

  const brandProducts = products.filter((p) => p.brandSlug === slug)

  return (
    <div>
      {/* Brand hero */}
      <section className="border-b border-border bg-surface/40 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
            {brand.country} · est. {brand.founded}
          </p>
          <h1 className="mt-2 font-display text-5xl font-medium tracking-tight sm:text-6xl md:text-7xl">
            {brand.name}
          </h1>
          <p className="mt-4 max-w-2xl font-display text-xl font-light italic text-muted-foreground">
            {brand.tagline}
          </p>
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
        <div className="mb-12 max-w-2xl">
          <h2 className="font-display text-2xl font-medium">The house</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {brand.description}
          </p>
        </div>

        {/* Collections */}
        <div className="mb-12">
          <h2 className="mb-4 font-display text-2xl font-medium">Collections</h2>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(brandProducts.flatMap((p) => p.collection))).map((c) => (
              <a
                key={c}
                href={`/collections/${c === 'Luxury' ? 'luxury' : c === 'Niche' ? 'niche' : 'gift'}`}
                className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:border-foreground/40 hover:bg-surface"
              >
                {c}
              </a>
            ))}
          </div>
        </div>

        {/* Products */}
        <div className="mb-8">
          <h2 className="font-display text-2xl font-medium">Popular fragrances</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {brandProducts.length} {brandProducts.length === 1 ? 'fragrance' : 'fragrances'} from {brand.name}
          </p>
        </div>
        <ProductListing basePath={`/brands/${slug}`} pageSize={9} baseProducts={brandProducts} />
      </div>
    </div>
  )
}
