import type { Metadata } from 'next'
import { ProductListing } from '@/components/site/product-listing'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { products, type Gender } from '@/lib/data'

export const metadata: Metadata = {
  title: "Women's Perfumes",
  description:
    "Discover our edit of authentic women's fragrances — florals, orientals and modern signatures from the world's finest houses.",
}

export default function WomenPage() {
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
          from Chanel, Dior, YSL, Prada and beyond.
        </p>
      </div>
      <ProductListing
        basePath="/women"
        pageSize={9}
        baseProducts={products.filter((p) => p.gender === 'Women' as Gender)}
      />
    </div>
  )
}
