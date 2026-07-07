import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { BrandCard } from '@/components/site/brand-card'
import { brands } from '@/lib/data'

export const metadata: Metadata = {
  title: 'All Brands',
  description:
    'Discover every fragrance house we carry — from heritage maisons like Chanel and Dior to niche ateliers like Le Labo and Byredo.',
}

export default function BrandsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Brands' }]} />
      <div className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brand">
          The houses
        </p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl">
          All brands
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Every house we carry — heritage maisons, modern luxury houses and
          independent niche ateliers, all in one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {brands.map((brand, i) => (
          <BrandCard key={brand.slug} brand={brand} index={i} />
        ))}
      </div>
    </div>
  )
}
