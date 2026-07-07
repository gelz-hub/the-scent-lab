'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Search, X, ArrowRight, Sparkles } from 'lucide-react'
import { useStore } from '@/lib/store'
import { products, brands } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import { StarRating } from './star-rating'

const SUGGESTIONS = ['Woody', 'Floral', 'Fresh', 'Unisex', 'Le Labo', 'Under $150', 'Winter']

export function SearchDialog() {
  const open = useStore((s) => s.searchOpen)
  const setOpen = useStore((s) => s.setSearchOpen)
  const router = useRouter()
  const [q, setQ] = React.useState('')

  React.useEffect(() => {
    if (!open) {
      setQ('')
    }
  }, [open])

  const query = q.trim().toLowerCase()

  const productResults = React.useMemo(() => {
    if (!query) return []
    return products
      .filter((p) => {
        const haystack = [
          p.name,
          p.brand,
          p.gender,
          ...p.collection,
          ...p.notes.top,
          ...p.notes.heart,
          ...p.notes.base,
          p.category,
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
      .slice(0, 6)
  }, [query])

  const brandResults = React.useMemo(() => {
    if (!query) return []
    return brands.filter((b) => b.name.toLowerCase().includes(query)).slice(0, 4)
  }, [query])

  const showEmpty =
    query.length > 0 && productResults.length === 0 && brandResults.length === 0

  const goToProduct = (slug: string) => {
    setOpen(false)
    router.push(`/product/${slug}`)
  }

  const goToBrand = (slug: string) => {
    setOpen(false)
    router.push(`/brands/${slug}`)
  }

  const goToSearchPage = () => {
    if (!query) return
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-0 overflow-hidden rounded-xl border-border p-0"
      >
        <DialogTitle className="sr-only">Search fragrances</DialogTitle>
        <DialogDescription className="sr-only">
          Search by brand, perfume, notes, collection or gender.
        </DialogDescription>

        {/* Search input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            goToSearchPage()
          }}
          className="flex items-center gap-3 border-b border-border px-4"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search brands, fragrances, notes…"
            className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Suggestions when empty */}
          {!query && (
            <div className="p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" /> Trending searches
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setQ(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:border-foreground/40 hover:bg-surface"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Brand results */}
          {brandResults.length > 0 && (
            <div className="p-2">
              <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Brands
              </p>
              {brandResults.map((b) => (
                <button
                  key={b.slug}
                  onClick={() => goToBrand(b.slug)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface"
                >
                  <span className="text-sm">
                    <span className="font-medium">{b.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {b.country} · est. {b.founded}
                    </span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}

          {/* Product results */}
          {productResults.length > 0 && (
            <div className="p-2">
              <p className="px-1 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Fragrances
              </p>
              {productResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToProduct(p.slug)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface'
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="48px"
                      className="object-contain p-1"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.brand}
                    </p>
                    <p className="line-clamp-1 text-sm font-medium">{p.name}</p>
                    <StarRating rating={p.rating} size={10} showValue />
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(p.volumes[0].price)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Empty */}
          {showEmpty && (
            <div className="px-4 py-10 text-center">
              <p className="font-display text-lg">No results for "{q}"</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a brand name, a note, or a fragrance family.
              </p>
            </div>
          )}

          {/* View all on search page */}
          {query && (productResults.length > 0 || brandResults.length > 0) && (
            <div className="border-t border-border p-2">
              <button
                onClick={goToSearchPage}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
              >
                Search all results for "{q}"
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
