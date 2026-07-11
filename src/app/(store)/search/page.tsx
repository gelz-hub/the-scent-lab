import { Suspense } from 'react'
import type { Metadata } from 'next'
import { SearchClient } from './search-client'
import { getProducts, getBrands } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search authentic fragrances by brand, perfume, notes, collection or gender.',
}

export default async function SearchPage() {
  const [products, brands] = await Promise.all([getProducts(), getBrands()])

  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-muted-foreground">Loading search…</div>}>
      <SearchClient products={products} brands={brands} />
    </Suspense>
  )
}
