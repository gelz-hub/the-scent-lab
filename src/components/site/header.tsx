'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '@/lib/store'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const NAV = [
  { label: 'Shop', href: '#shop' },
  { label: 'Women', href: '#women' },
  { label: 'Men', href: '#men' },
  { label: 'Unisex', href: '#unisex' },
  { label: 'Brands', href: '#brands' },
  { label: 'Collections', href: '#collections' },
  { label: 'Journal', href: '#journal' },
  { label: 'Sale', href: '#shop', accent: true },
]

const MOBILE_EXTRA = [
  { label: 'New Arrivals', href: '#new' },
  { label: 'Best Sellers', href: '#bestsellers' },
  { label: 'Gift Sets', href: '#collections' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export function Header() {
  const setSearchOpen = useStore((s) => s.setSearchOpen)
  const setWishlistOpen = useStore((s) => s.setWishlistOpen)
  const setCartOpen = useStore((s) => s.setCartOpen)
  const mobileNavOpen = useStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useStore((s) => s.setMobileNavOpen)
  const cartCountValue = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  const wishCount = useStore((s) => s.wishlist.length)

  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-foreground text-background">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-[11px] tracking-wide">
          <span className="hidden sm:inline">✦</span>
          <span>Complimentary shipping over $100 · 100% authentic fragrances · Free returns</span>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-colors duration-300',
          scrolled
            ? 'border-border bg-background/85 backdrop-blur-xl'
            : 'border-transparent bg-background'
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Logo */}
          <Link href="#top" className="group flex items-center" aria-label="The Scent Lab home">
            <span className="font-display text-[22px] font-medium leading-none tracking-tight">
              The Scent Lab
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface',
                  item.accent ? 'text-danger' : 'text-foreground/80 hover:text-foreground'
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <ThemeToggle />
            <button
              onClick={() => toast('Account', { description: 'Sign in coming soon' })}
              aria-label="Account"
              className="hidden h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface sm:grid"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setWishlistOpen(true)}
              aria-label="Wishlist"
              className="relative grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface"
            >
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {wishCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-semibold text-white">
                  {wishCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              className="relative grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {cartCountValue > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-semibold text-brand-foreground">
                  {cartCountValue}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-display text-xl">The Scent Lab</span>
              <button
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-4">
              {[...NAV, ...MOBILE_EXTRA].map((item, i) => (
                <a
                  key={item.label + i}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-surface',
                    item.accent && 'text-danger'
                  )}
                >
                  {item.label}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                </a>
              ))}
            </nav>
            <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
              <p>Curated Fragrances. Authentic Brands.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
