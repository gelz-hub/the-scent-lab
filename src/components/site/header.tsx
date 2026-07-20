'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { useSession } from '@/components/providers/session-provider'
import { useStore } from '@/lib/store'
import { ThemeToggle } from './theme-toggle'
import { NotificationBell } from './notification-bell'
import { cn } from '@/lib/utils'
import { ADMIN_ROLES, type AdminRole } from '@/lib/rbac/permissions'

interface BrandOption {
  slug: string
  name: string
}

interface CollectionOption {
  slug: string
  name: string
}

type DesktopMenuKey = 'shop' | 'brands' | 'collections'

const NAV: { label: string; href: string; key?: DesktopMenuKey; accent?: boolean }[] = [
  { label: 'Shop', href: '/shop', key: 'shop' },
  { label: 'Brands', href: '/brands', key: 'brands' },
  { label: 'Collections', href: '/collections', key: 'collections' },
  { label: 'Sale', href: '/sale', accent: true },
]

const MOBILE_EXTRA: { label: string; href: string; accent?: boolean }[] = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Account', href: '/account' },
]

const panelTransition = { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

function isActive(pathname: string, href: string) {
  if (href === '/shop') return pathname === '/shop'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Header() {
  const setSearchOpen = useStore((s) => s.setSearchOpen)
  const setWishlistOpen = useStore((s) => s.setWishlistOpen)
  const setCartOpen = useStore((s) => s.setCartOpen)
  const mobileNavOpen = useStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useStore((s) => s.setMobileNavOpen)
  const cartCountValue = useStore((s) => s.cart.reduce((n, l) => n + l.qty, 0))
  const wishCount = useStore((s) => s.wishlist.length)
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as AdminRole | undefined
  const isAdmin = !!role && ADMIN_ROLES.includes(role)

  const [brands, setBrands] = React.useState<BrandOption[]>([])
  const [collections, setCollections] = React.useState<CollectionOption[]>([])

  React.useEffect(() => {
    fetch('/api/brands')
      .then((res) => (res.ok ? res.json() : { brands: [] }))
      .then((data: { brands?: BrandOption[] }) => setBrands(data.brands ?? []))
      .catch(() => {})
    fetch('/api/collections')
      .then((res) => (res.ok ? res.json() : { collections: [] }))
      .then((data: { collections?: CollectionOption[] }) => setCollections(data.collections ?? []))
      .catch(() => {})
  }, [])

  // ── Desktop hover/focus mega menu ─────────────────────────────────
  const [openMenu, setOpenMenu] = React.useState<DesktopMenuKey | null>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const openNow = (key: DesktopMenuKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(key)
  }
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120)
  }
  const closeNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(null)
  }

  // ── Mobile drawer accordions ──────────────────────────────────────
  const [openMobileSection, setOpenMobileSection] = React.useState<DesktopMenuKey | null>(null)

  React.useEffect(() => {
    closeNow()
    setOpenMobileSection(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeNow()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const mobileTop = React.useMemo(() => {
    const sale = NAV.find((item) => item.label === 'Sale')!
    const items = [
      NAV.find((item) => item.label === 'Shop')!,
      NAV.find((item) => item.label === 'Brands')!,
      NAV.find((item) => item.label === 'Collections')!,
      sale,
      ...MOBILE_EXTRA,
    ]
    return isAdmin ? [...items, { label: 'Admin', href: '/admin' }] : items
  }, [isAdmin])

  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const shownBrands = brands.slice(0, 18)
  const shownCollections = collections.slice(0, 4)

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-foreground text-background">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-4 text-[11px] tracking-wide">
          <span className="hidden sm:inline">✦</span>
          <span>Free Phnom Penh delivery over US$100 · Province delivery via VET Express &amp; J&amp;T Express · 100% authentic</span>
        </div>
      </div>

      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-colors duration-300',
          scrolled
            ? 'border-border bg-background/85 backdrop-blur-xl'
            : 'border-transparent bg-background'
        )}
        onMouseLeave={closeSoon}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
          {/* Mobile/tablet menu (through lg — see header notes) */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-surface lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>

          {/* Logo */}
          <Link href="/" className="group flex min-w-0 shrink items-center" aria-label="The Scent Lab home">
            <span className="hidden whitespace-nowrap font-display font-medium leading-none tracking-tight lg:inline lg:text-[20px] xl:text-[22px]">
              The Scent Lab
            </span>
            <span className="hidden whitespace-nowrap font-display text-[17px] font-medium leading-none tracking-tight md:inline lg:hidden">
              The Scent Lab
            </span>
            <span className="whitespace-nowrap font-display text-[13px] font-medium leading-none tracking-tight md:hidden">
              The Scent Lab
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.key && openNow(item.key)}
              >
                <Link
                  href={item.href}
                  onFocus={() => item.key && openNow(item.key)}
                  aria-haspopup={item.key ? 'true' : undefined}
                  aria-expanded={item.key ? openMenu === item.key : undefined}
                  className={cn(
                    'flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface',
                    item.accent
                      ? 'text-danger'
                      : isActive(pathname, item.href)
                        ? 'text-foreground'
                        : 'text-foreground/80 hover:text-foreground'
                  )}
                >
                  {item.label}
                  {item.key && (
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform duration-200',
                        openMenu === item.key && 'rotate-180'
                      )}
                      strokeWidth={1.5}
                    />
                  )}
                </Link>

                <AnimatePresence>
                  {item.key === 'shop' && openMenu === 'shop' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={panelTransition}
                      className="absolute left-1/2 top-full z-50 w-[640px] -translate-x-1/2 pt-3"
                      role="menu"
                    >
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                        <div className="grid grid-cols-3 gap-8">
                          <div>
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Browse
                            </p>
                            <ul className="space-y-2.5">
                              {[
                                { label: 'All Products', href: '/shop' },
                                { label: 'Women', href: '/women' },
                                { label: 'Men', href: '/men' },
                                { label: 'Unisex', href: '/unisex' },
                              ].map((l) => (
                                <li key={l.href}>
                                  <Link href={l.href} className="text-sm text-foreground/80 transition-colors hover:text-brand">
                                    {l.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Featured
                            </p>
                            <ul className="space-y-2.5">
                              {[
                                { label: 'New Arrivals', href: '/new-arrivals' },
                                { label: 'Best Sellers', href: '/best-sellers' },
                                { label: 'Sale', href: '/sale' },
                              ].map((l) => (
                                <li key={l.href}>
                                  <Link href={l.href} className="text-sm text-foreground/80 transition-colors hover:text-brand">
                                    {l.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Collections
                            </p>
                            {shownCollections.length > 0 ? (
                              <ul className="space-y-2.5">
                                {shownCollections.map((c) => (
                                  <li key={c.slug}>
                                    <Link
                                      href={`/collections/${c.slug}`}
                                      className="text-sm text-foreground/80 transition-colors hover:text-brand"
                                    >
                                      {c.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No collections yet.</p>
                            )}
                            <Link
                              href="/collections"
                              className="mt-3 inline-block text-xs font-medium text-brand hover:underline"
                            >
                              View all collections
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {item.key === 'brands' && openMenu === 'brands' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={panelTransition}
                      className="absolute left-0 top-full z-50 pt-3"
                      role="menu"
                    >
                      <div
                        className={cn(
                          'rounded-2xl border border-border bg-card p-6 shadow-xl',
                          shownBrands.length > 8 ? 'w-[420px]' : 'w-64'
                        )}
                      >
                        {shownBrands.length > 0 ? (
                          <ul
                            className={cn(
                              'gap-x-6 gap-y-2.5 text-sm',
                              shownBrands.length > 8 ? 'columns-2' : ''
                            )}
                          >
                            {shownBrands.map((b) => (
                              <li key={b.slug} className="break-inside-avoid">
                                <Link
                                  href={`/brands/${b.slug}`}
                                  className="block text-foreground/80 transition-colors hover:text-brand"
                                >
                                  {b.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No brands yet.</p>
                        )}
                        <Link
                          href="/brands"
                          className="mt-4 inline-block text-xs font-medium text-brand hover:underline"
                        >
                          View All Brands
                        </Link>
                      </div>
                    </motion.div>
                  )}

                  {item.key === 'collections' && openMenu === 'collections' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={panelTransition}
                      className="absolute left-0 top-full z-50 w-64 pt-3"
                      role="menu"
                    >
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                        {collections.length > 0 ? (
                          <ul className="space-y-2.5 text-sm">
                            {collections.map((c) => (
                              <li key={c.slug}>
                                <Link
                                  href={`/collections/${c.slug}`}
                                  className="block text-foreground/80 transition-colors hover:text-brand"
                                >
                                  {c.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No collections yet.</p>
                        )}
                        <Link
                          href="/collections"
                          className="mt-4 inline-block text-xs font-medium text-brand hover:underline"
                        >
                          View All Collections
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
            <NotificationBell />
            <Link
              href="/account"
              aria-label="Account"
              className="hidden h-9 w-9 place-items-center rounded-full text-foreground transition-colors hover:bg-surface sm:grid"
            >
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
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

      {/* Mobile/tablet nav */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={panelTransition}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={panelTransition}
              className="absolute left-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-background shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <Link
                  href="/"
                  onClick={() => setMobileNavOpen(false)}
                  className="whitespace-nowrap font-display text-lg"
                >
                  The Scent Lab
                </Link>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface"
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-2 py-4">
                {mobileTop.map((item, i) => {
                  const key = (item as { key?: DesktopMenuKey }).key
                  if (!key) {
                    return (
                      <Link
                        key={item.label + i}
                        href={item.href}
                        onClick={() => setMobileNavOpen(false)}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-surface',
                          item.accent && 'text-danger',
                          isActive(pathname, item.href) && 'text-foreground'
                        )}
                      >
                        {item.label}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      </Link>
                    )
                  }

                  const expanded = openMobileSection === key

                  return (
                    <div key={item.label + i}>
                      <button
                        type="button"
                        onClick={() => setOpenMobileSection(expanded ? null : key)}
                        aria-expanded={expanded}
                        className={cn(
                          'flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-surface',
                          isActive(pathname, item.href) && 'text-foreground'
                        )}
                      >
                        {item.label}
                        <ChevronDown
                          className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')}
                          strokeWidth={1.5}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={panelTransition}
                            className="overflow-hidden pl-3"
                          >
                            {key === 'shop' && (
                              <div className="space-y-4 py-2 pb-4">
                                <div>
                                  <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    Browse
                                  </p>
                                  {[
                                    { label: 'All Products', href: '/shop' },
                                    { label: 'Women', href: '/women' },
                                    { label: 'Men', href: '/men' },
                                    { label: 'Unisex', href: '/unisex' },
                                  ].map((l) => (
                                    <Link
                                      key={l.href}
                                      href={l.href}
                                      onClick={() => setMobileNavOpen(false)}
                                      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
                                    >
                                      {l.label}
                                    </Link>
                                  ))}
                                </div>
                                <div>
                                  <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    Featured
                                  </p>
                                  {[
                                    { label: 'New Arrivals', href: '/new-arrivals' },
                                    { label: 'Best Sellers', href: '/best-sellers' },
                                    { label: 'Sale', href: '/sale' },
                                  ].map((l) => (
                                    <Link
                                      key={l.href}
                                      href={l.href}
                                      onClick={() => setMobileNavOpen(false)}
                                      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
                                    >
                                      {l.label}
                                    </Link>
                                  ))}
                                </div>
                                <div>
                                  <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                    Collections
                                  </p>
                                  {shownCollections.length > 0 ? (
                                    shownCollections.map((c) => (
                                      <Link
                                        key={c.slug}
                                        href={`/collections/${c.slug}`}
                                        onClick={() => setMobileNavOpen(false)}
                                        className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
                                      >
                                        {c.name}
                                      </Link>
                                    ))
                                  ) : (
                                    <p className="px-3 py-2 text-sm text-muted-foreground">No collections yet.</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {key === 'brands' && (
                              <div className="space-y-0.5 py-2 pb-4">
                                {brands.length > 0 ? (
                                  brands.map((b) => (
                                    <Link
                                      key={b.slug}
                                      href={`/brands/${b.slug}`}
                                      onClick={() => setMobileNavOpen(false)}
                                      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
                                    >
                                      {b.name}
                                    </Link>
                                  ))
                                ) : (
                                  <p className="px-3 py-2 text-sm text-muted-foreground">No brands yet.</p>
                                )}
                                <Link
                                  href="/brands"
                                  onClick={() => setMobileNavOpen(false)}
                                  className="block rounded-lg px-3 py-2 text-sm font-medium text-brand"
                                >
                                  View All Brands
                                </Link>
                              </div>
                            )}

                            {key === 'collections' && (
                              <div className="space-y-0.5 py-2 pb-4">
                                {collections.length > 0 ? (
                                  collections.map((c) => (
                                    <Link
                                      key={c.slug}
                                      href={`/collections/${c.slug}`}
                                      onClick={() => setMobileNavOpen(false)}
                                      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
                                    >
                                      {c.name}
                                    </Link>
                                  ))
                                ) : (
                                  <p className="px-3 py-2 text-sm text-muted-foreground">No collections yet.</p>
                                )}
                                <Link
                                  href="/collections"
                                  onClick={() => setMobileNavOpen(false)}
                                  className="block rounded-lg px-3 py-2 text-sm font-medium text-brand"
                                >
                                  View All Collections
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </nav>
              <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
                <p>Curated Fragrances. Authentic Brands.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
