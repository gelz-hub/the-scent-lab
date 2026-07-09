import { HeroSection } from '@/components/sections/hero'
import { BrandMarquee } from '@/components/sections/brand-marquee'
import { CategorySection } from '@/components/sections/category'
import { ProductGridSection } from '@/components/sections/product-grid'
import { FeatureBanner } from '@/components/sections/feature-banner'
import { CollectionSection } from '@/components/sections/collections'
import { ReviewsSection } from '@/components/sections/reviews'
import { JournalSection } from '@/components/sections/journal'
import { InstagramSection } from '@/components/sections/instagram'
import { NewsletterSection } from '@/components/sections/newsletter'

export default function HomePage() {
  return (
    <>
      {/* ── 1. Hero ────────────────────────────────── */}
      <HeroSection />

      {/* ── 2. Brand trust bar ──────────────────────── */}
      <BrandMarquee />

      {/* ── 3. Category discovery ───────────────────── */}
      <CategorySection />

      {/* ── 4. New arrivals ─────────────────────────── */}
      <ProductGridSection
        eyebrow="Just landed"
        title="New arrivals"
        description="The latest additions to our edit, freshly stocked."
        tag="New"
        limit={4}
        action={{ label: 'Shop all new', href: '/new-arrivals' }}
      />

      {/* ── 5. Best sellers ─────────────────────────── */}
      <ProductGridSection
        eyebrow="Loved by many"
        title="Best sellers"
        description="The fragrances our customers reach for, again and again."
        tag="Bestseller"
        limit={4}
        action={{ label: 'View all', href: '/best-sellers' }}
      />

      {/* ── 6. Editorial break ──────────────────────── */}
      <FeatureBanner />

      {/* ── 7. Curated collections ──────────────────── */}
      <CollectionSection />

      {/* ── 8. Trending ─────────────────────────────── */}
      <ProductGridSection
        eyebrow="On the rise"
        title="Trending this week"
        description="The scents everyone is talking about right now."
        tag="Trending"
        limit={4}
        action={{ label: 'Shop trending', href: '/shop' }}
      />

      {/* ── 9. Social proof ─────────────────────────── */}
      <ReviewsSection />

      {/* ── 10. Journal ─────────────────────────────── */}
      <JournalSection />

      {/* ── 11. Instagram gallery ───────────────────── */}
      <InstagramSection />

      {/* ── 12. Newsletter ──────────────────────────── */}
      <NewsletterSection />
    </>
  )
}
