import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { getProductsByTag, getBrands, getCategories, getCollections } from '@/lib/catalog'
import type { Gender } from '@/lib/data'

export const metadata: Metadata = {
  title: 'New Arrivals',
  description:
    'The latest additions to our edit — freshly stocked fragrances from the world’s finest houses.',
}

export default async function NewArrivalsPage() {
  const [products, brands, categories, collections] = await Promise.all([
    getProductsByTag('New'),
    getBrands(),
    getCategories(),
    getCollections(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'New Arrivals' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Just landed
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          New arrivals
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          The latest additions to our edit — freshly stocked and ready to discover.
        </p>
      </div>
      {products.length === 0 ? (
        <EmptyState title="No products available yet." />
      ) : (
        <ProductListing
          basePath="/new-arrivals"
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
