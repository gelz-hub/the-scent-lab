import type { Metadata } from 'next'
import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import { CartSheet } from '@/components/site/cart-sheet'
import { WishlistSheet } from '@/components/site/wishlist-sheet'
import { SearchDialog } from '@/components/site/search-dialog'

export const metadata: Metadata = {
  title: {
    default: 'The Scent Lab — Curated Fragrances. Authentic Brands.',
    template: '%s · The Scent Lab',
  },
  description:
    'A curated marketplace of authentic perfumes from the world’s finest perfume houses.',
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />

      {/* Global overlays */}
      <CartSheet />
      <WishlistSheet />
      <SearchDialog />
    </div>
  )
}
