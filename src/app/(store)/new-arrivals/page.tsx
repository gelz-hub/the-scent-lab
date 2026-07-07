import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { products } from '@/lib/data'

export const metadata: Metadata = {
  title: 'New Arrivals',
  description:
    'The latest additions to our edit â freshly stocked fragrances from the world’s finest houses.',
}

export default function NewArrivalsPage() {
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
      <ProductListing
        basePath="/new-arrivals"
        pageSize={9}
        baseProducts={products.filter((p) => p.tags.includes('New'))}
      />
    </div>
  )
}
