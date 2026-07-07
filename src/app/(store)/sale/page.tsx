import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { products } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Sale',
  description:
    'Discover authentic fragrances on sale â limited-time savings on selected scents from the world’s finest houses.',
}

export default function SalePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sale' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
          Limited time
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Sale
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Limited-time savings on selected authentic fragrances. When they're gone,
          they're gone.
        </p>
      </div>
      <ProductListing
        basePath="/sale"
        pageSize={9}
        baseProducts={products.filter((p) => p.tags.includes('Sale'))}
      />
    </div>
  )
}
