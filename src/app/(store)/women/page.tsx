import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { getProductsByGender, getBrands, getCategories, getCollections } from '@/lib/catalog'
import type { Gender } from '@/lib/data'

export const metadata: Metadata = {
  title: "Women's Perfumes",
  description:
    "Discover our edit of authentic women's fragrances — florals, orientals and modern signatures from the world's finest houses.",
}

export default async function WomenPage() {
  const [products, brands, categories, collections] = await Promise.all([
    getProductsByGender('Women'),
    getBrands(),
    getCategories(),
    getCollections(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Women' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          For her
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Women's perfumes
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Florals, orientals and modern signatures — the most beautiful scents
          from the world's finest perfume houses.
        </p>
      </div>
      {products.length === 0 ? (
        <EmptyState title="No products available in this category yet." />
      ) : (
        <ProductListing
          basePath="/women"
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
