import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import { QuickViewDialog } from '@/components/site/quick-view-dialog'
import { CartSheet } from '@/components/site/cart-sheet'
import { WishlistSheet } from '@/components/site/wishlist-sheet'
import { SearchDialog } from '@/components/site/search-dialog'
import { HeroSection } from '@/components/sections/hero'
import { BrandMarquee } from '@/components/sections/brand-marquee'
import { CategorySection } from '@/components/sections/category'
import { ProductGridSection } from '@/components/sections/product-grid'
import { CollectionSection } from '@/components/sections/collections'
import { ShopSection } from '@/components/sections/shop'
import { AboutSection } from '@/components/sections/about'
import { ReviewsSection } from '@/components/sections/reviews'
import { JournalSection } from '@/components/sections/journal'
import { NewsletterSection } from '@/components/sections/newsletter'
import { InstagramSection } from '@/components/sections/instagram'
import { RecentlyViewed } from '@/components/sections/recently-viewed'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <HeroSection />
        <BrandMarquee />
        <CategorySection />

        <ProductGridSection
          id="new"
          eyebrow="Just landed"
          title="New arrivals"
          description="The latest additions to our edit, freshly stocked."
          tag="New"
          limit={4}
          action={{ label: 'Shop all new', href: '#shop' }}
        />

        <ProductGridSection
          id="bestsellers"
          eyebrow="Loved by many"
          title="Best sellers"
          description="The fragrances our customers reach for, again and again."
          tag="Bestseller"
          limit={4}
          action={{ label: 'View all', href: '#shop' }}
        />

        <CollectionSection />

        <ProductGridSection
          id="trending"
          eyebrow="On the rise"
          title="Trending this week"
          description="The scents everyone is talking about right now."
          tag="Trending"
          limit={4}
          action={{ label: 'Shop trending', href: '#shop' }}
        />

        <ShopSection />

        <AboutSection />
        <RecentlyViewed />
        <ReviewsSection />
        <JournalSection />
        <InstagramSection />
        <NewsletterSection />
      </main>

      <Footer />

      {/* Global overlays */}
      <QuickViewDialog />
      <CartSheet />
      <WishlistSheet />
      <SearchDialog />
    </div>
  )
}
