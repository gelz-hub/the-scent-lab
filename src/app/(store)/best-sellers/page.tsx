import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { getProductsByTag, getBrands, getCategories, getCollections } from '@/lib/catalog'
import type { Gender } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Best Sellers',
  description:
    'The fragrances our customers reach for, again and again — the most loved scents at The Scent Lab.',
}

export default async function BestSellersPage() {
  const [products, brands, categories, collections] = await Promise.all([
    getProductsByTag('Bestseller'),
    getBrands(),
    getCategories(),
    getCollections(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Best Sellers' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Loved by many
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Best sellers
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The fragrances our customers reach for, again and again — the most
          loved scents in our edit.
        </p>
      </div>
      {products.length === 0 ? (
        <EmptyState title="No products available yet." />
      ) : (
        <ProductListing
          basePath="/best-sellers"
          pageSize={9}
          baseProducts={products}
          allBrands={brands}
          genderOptions={categories.map((c) => c.name) as Gender[]}
          collectionOptions={collections.map((c) => c.name)}
        />
      )}
    </div>
  )
}
