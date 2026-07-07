import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { products, type Gender } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Unisex Perfumes',
  description:
    'Discover our edit of authentic unisex fragrances — shared scents beyond convention, from Le Labo, Byredo, Tom Ford and beyond.',
}

export default function UnisexPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Unisex' }]} />
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          Beyond convention
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Unisex perfumes
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Shared scents that defy category — singular compositions from Le Labo,
          Byredo, Tom Ford, MFK and more.
        </p>
      </div>
      <ProductListing
        basePath="/unisex"
        pageSize={9}
        baseProducts={products.filter((p) => p.gender === 'Unisex' as Gender)}
      />
    </div>
  )
}
