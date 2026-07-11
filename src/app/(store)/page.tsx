import { HeroSection } from '@/components/sections/hero'
import { BrandMarquee } from '@/components/sections/brand-marquee'
import { CategorySection } from '@/components/sections/category'
import { ProductGridSection } from '@/components/sections/product-grid'
import { FeatureBanner } from '@/components/sections/feature-banner'
import { CollectionSection } from '@/components/sections/collections'
import { ReviewsSection } from '@/components/sections/reviews'
import { JournalSection } from '@/components/sections/journal'
import { NewsletterSection } from '@/components/sections/newsletter'
import {
  getProductCount,
  getProductsByTag,
  getBrands,
  getCategories,
  getCollections,
  getFeaturedReviews,
} from '@/lib/catalog'

export default async function HomePage() {
  const [productCount, newArrivals, bestSellers, trending, brands, categories, collections, reviews] =
    await Promise.all([
      getProductCount(),
      getProductsByTag('New'),
      getProductsByTag('Bestseller'),
      getProductsByTag('Trending'),
      getBrands(),
      getCategories(),
      getCollections(),
      getFeaturedReviews(),
    ])

  return (
    <>
      {/* ── 1. Hero ────────────────────────────────── */}
      <HeroSection brandCount={brands.length} productCount={productCount} />

      {/* ── 2. Brand trust bar ──────────────────────── */}
      <BrandMarquee brands={brands} />

      {/* ── 3. Category discovery ───────────────────── */}
      <CategorySection categories={categories} />

      {/* ── 4. New arrivals ─────────────────────────── */}
      <ProductGridSection
        eyebrow="Just landed"
        title="New arrivals"
        description="The latest additions to our edit, freshly stocked."
        products={newArrivals}
        limit={4}
        action={{ label: 'Shop all new', href: '/new-arrivals' }}
      />

      {/* ── 5. Best sellers ─────────────────────────── */}
      <ProductGridSection
        eyebrow="Loved by many"
        title="Best sellers"
        description="The fragrances our customers reach for, again and again."
        products={bestSellers}
        limit={4}
        action={{ label: 'View all', href: '/best-sellers' }}
      />

      {/* ── 6. Editorial break ──────────────────────── */}
      <FeatureBanner />

      {/* ── 7. Curated collections ──────────────────── */}
      <CollectionSection collections={collections} />

      {/* ── 8. Trending ─────────────────────────────── */}
      <ProductGridSection
        eyebrow="On the rise"
        title="Trending this week"
        description="The scents everyone is talking about right now."
        products={trending}
        limit={4}
        action={{ label: 'Shop trending', href: '/shop' }}
      />

      {/* ── 9. Social proof ─────────────────────────── */}
      <ReviewsSection reviews={reviews} />

      {/* ── 10. Journal ─────────────────────────────── */}
      <JournalSection />

      {/* ── 11. Newsletter ──────────────────────────── */}
      <NewsletterSection />
    </>
  )
}
