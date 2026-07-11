import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { getProductsByGender, getBrands, getCategories, getCollections } from '@/lib/catalog'
import type { Gender } from '@/lib/data'

export const metadata: Metadata = {
  title: "Men's Perfumes",
  description:
    "Discover our edit of authentic men's fragrances — woody, aromatic and boldly contemporary scents from the world's finest houses.",
}

export default async function MenPage() {
  const [products, brands, categories, collections] = await Promise.all([
    getProductsByGender('Men'),
    getBrands(),
    getCategories(),
    getCollections(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Men' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          For him
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Men's perfumes
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Woody, aromatic and boldly contemporary — distinguished scents from
          the world's finest perfume houses.
        </p>
      </div>
      {products.length === 0 ? (
        <EmptyState title="No products available in this category yet." />
      ) : (
        <ProductListing
          basePath="/men"
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
