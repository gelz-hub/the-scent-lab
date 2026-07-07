import { HeroSection } from '@/components/sections/hero'
import { BrandMarquee } from '@/components/sections/brand-marquee'
import { CategorySection } from '@/components/sections/category'
import { ProductGridSection } from '@/components/sections/product-grid'
import { CollectionSection } from '@/components/sections/collections'
import { ReviewsSection } from '@/components/sections/reviews'
import { JournalSection } from '@/components/sections/journal'
import { NewsletterSection } from '@/components/sections/newsletter'
import { InstagramSection } from '@/components/sections/instagram'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BrandMarquee />
      <CategorySection />

      <ProductGridSection
        eyebrow="Just landed"
        title="New arrivals"
        description="The latest additions to our edit, freshly stocked."
        tag="New"
        limit={4}
        action={{ label: 'Shop all new', href: '/new-arrivals' }}
      />

      <ProductGridSection
        eyebrow="Loved by many"
        title="Best sellers"
        description="The fragrances our customers reach for, again and again."
        tag="Bestseller"
        limit={4}
        action={{ label: 'View all', href: '/best-sellers' }}
      />

      <CollectionSection />

      <ProductGridSection
        eyebrow="On the rise"
        title="Trending this week"
        description="The scents everyone is talking about right now."
        tag="Trending"
        limit={4}
        action={{ label: 'Shop trending', href: '/shop' }}
      />

      <ReviewsSection />
      <JournalSection />
      <InstagramSection />
      <NewsletterSection />
    </>
  )
}
