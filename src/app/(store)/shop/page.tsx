import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'

export const metadata: Metadata = {
  title: 'Shop All Fragrances',
  description:
    'Browse our complete edit of authentic perfumes from the world’s finest houses. Filter by brand, collection, gender and price.',
}

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          The edit
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Shop all fragrances
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every fragrance in our collection, in one place. Filter by house,
          family, gender or price to find your next signature.
        </p>
      </div>
      <ProductListing basePath="/shop" pageSize={9} />
    </div>
  )
}
