import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { products, type Gender } from '@/lib/data'

export const metadata: Metadata = {
  title: "Men's Perfumes",
  description:
    "Discover our edit of authentic men's fragrances — woody, aromatic and boldly contemporary scents from the world's finest houses.",
}

export default function MenPage() {
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
          Dior, Chanel, Creed, Hermès and more.
        </p>
      </div>
      <ProductListing
        basePath="/men"
        pageSize={9}
        baseProducts={products.filter((p) => p.gender === 'Men' as Gender)}
      />
    </div>
  )
}
