'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, Sparkles, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { products, brands } from '@/lib/data'
import { formatPrice } from '@/lib/format'
import { Breadcrumb } from '@/components/site/breadcrumb'
import { EmptyState } from '@/components/site/empty-state'
import { StarRating } from '@/components/site/star-rating'
import { ProductCard } from '@/components/site/product-card'

const POPULAR = ['Woody', 'Floral', 'Fresh', 'Unisex', 'Le Labo', 'Winter', 'Tom Ford', 'Under $150']

export function SearchClient() {
  const searchParams = useSearchParams()
  const initial = searchParams.get('q') ?? ''
  const [query, setQuery] = React.useState(initial)
  const [recent, setRecent] = React.useState<string[]>([])

  React.useEffect(() => {
    setQuery(initial)
  }, [initial])

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('scentlab-recent-searches')
      if (stored) setRecent(JSON.parse(stored))
    } catch {}
  }, [])

  const q = query.trim().toLowerCase()

  const productResults = React.useMemo(() => {
    if (!q) return []
    return products.filter((p) => {
      const hay = [p.name, p.brand, p.gender, ...p.collection, ...p.notes.top, ...p.notes.heart, ...p.notes.base, p.category]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [q])

  const brandResults = React.useMemo(() => {
    if (!q) return []
    return brands.filter((b) => b.name.toLowerCase().includes(q) || b.country.toLowerCase().includes(q))
  }, [q])

  const hasQuery = q.length > 0
  const hasResults = productResults.length > 0 || brandResults.length > 0

  const saveSearch = (term: string) => {
    if (!term.trim()) return
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5)
    setRecent(next)
    try {
      localStorage.setItem('scentlab-recent-searches', JSON.stringify(next))
    } catch {}
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />
      <h1 className="mb-6 font-display text-4xl font-medium tracking-tight">Search</h1>

      {/* Search bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveSearch(query)
        }}
        className="flex items-center gap-3 rounded-xl border border-border px-4"
      >
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by brand, fragrance, note or family…"
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </form>

      {/* When no query: show recent + popular */}
      {!hasQuery && (
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent searches
            </p>
            {recent.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => setQuery(r)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-foreground/40 hover:bg-surface"
                  >
                    {r}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent searches yet.</p>
            )}
          </div>
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((p) => (
                <button
                  key={p}
                  onClick={() => setQuery(p)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-foreground/40 hover:bg-surface"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {hasQuery && (
        <div className="mt-8">
          {!hasResults ? (
            <EmptyState
              title={`No results for "${query}"`}
              description="Try a brand name, a fragrance note, or a fragrance family to discover more."
              actionLabel="Browse all fragrances"
              actionHref="/shop"
            />
          ) : (
            <>
              <p className="mb-6 text-sm text-muted-foreground">
                {productResults.length + brandResults.length} results for "{query}"
              </p>

              {brandResults.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Brands</h2>
                  <div className="flex flex-wrap gap-3">
                    {brandResults.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/brands/${b.slug}`}
                        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-foreground/25"
                      >
                        <div>
                          <p className="font-display text-lg font-medium">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.country} · est. {b.founded}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {productResults.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Fragrances</h2>
                  <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
                    {productResults.map((p, i) => (
                      <ProductCard key={p.id} product={p} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
